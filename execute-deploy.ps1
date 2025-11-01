# PowerShell deployment execution script
# Execute staging deployment

$HOST = "72.61.84.181"
$SSH_USER = "root"
$REPO_URL = $env:REPO_URL
$PROJECT_DIR = "/opt/almaydan-ya-7maidan"
$STAGING_URL = "https://staging.mabaalkhail.com"

if (-not $REPO_URL) {
    Write-Host "❌ Error: REPO_URL environment variable must be set"
    Write-Host "Set it with: `$env:REPO_URL = 'https://github.com/user/repo.git'"
    exit 1
}

# Secrets
$JWT_SECRET = $env:JWT_SECRET
if (-not $JWT_SECRET) {
    $JWT_SECRET = "XdvyNs1K0ChtQukcUZpF8RrfoJ6YgIHEWba4i5Ol2qm9TDLSVxnPMGz7wje3BA"
}

$DATABASE_URL = $env:DATABASE_URL
if (-not $DATABASE_URL) {
    $DATABASE_URL = "mysql://almaydan_user:rndmbKxvUqYe4tpVWaf5OGP7s2yzgB6LMC9HhDc0SZk8X3wuEIJFlTo1AQjNiR@mysql:3306/almaydan_db"
}

$ACCESS_TOKEN_TTL = "15m"
$REFRESH_TOKEN_TTL = "7d"
$CORS_ORIGINS = $STAGING_URL
$WS_ORIGINS = $STAGING_URL
$SENTRY_DSN = $env:SENTRY_DSN
if (-not $SENTRY_DSN) { $SENTRY_DSN = "" }
$RATE_LIMIT_WINDOW_MS = "60000"
$RATE_LIMIT_MAX = "100"

Write-Host "🚀 Executing staging deployment..."
Write-Host "Host: $HOST"
Write-Host "Repository: $REPO_URL"
Write-Host ""

# Create SSH command script
$sshScript = @"
set -euo pipefail

REPO_URL="$REPO_URL"
PROJECT_DIR=$PROJECT_DIR
STAGING_URL=$STAGING_URL
JWT_SECRET="$JWT_SECRET"
ACCESS_TOKEN_TTL="$ACCESS_TOKEN_TTL"
REFRESH_TOKEN_TTL="$REFRESH_TOKEN_TTL"
DATABASE_URL="$DATABASE_URL"
CORS_ORIGINS="$CORS_ORIGINS"
WS_ORIGINS="$WS_ORIGINS"
SENTRY_DSN="$SENTRY_DSN"
RATE_LIMIT_WINDOW_MS="$RATE_LIMIT_WINDOW_MS"
RATE_LIMIT_MAX="$RATE_LIMIT_MAX"

echo "[Preflight] `$(hostname) - `$(. /etc/os-release; echo `$PRETTY_NAME)"
command -v docker >/dev/null || INSTALL_DOCKER=1
command -v git >/dev/null || apt update -y && apt install -y git

if [ "`${INSTALL_DOCKER:-0}" = "1" ]; then
  echo "Installing Docker..."
  apt update -y && apt install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=`$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \\
  https://download.docker.com/linux/ubuntu `$(. /etc/os-release; echo `$VERSION_CODENAME) stable" \\
  > /etc/apt/sources.list.d/docker.list
  apt update -y
  apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

mkdir -p /opt
if [ ! -d "`$PROJECT_DIR/.git" ]; then
  echo "Cloning repository..."
  git clone "`$REPO_URL" "`$PROJECT_DIR"
fi
cd "`$PROJECT_DIR"
echo "Updating repository..."
git fetch --all --tags
git checkout main || git checkout master || true
git pull --ff-only || true

export JWT_SECRET="`$JWT_SECRET"
export ACCESS_TOKEN_TTL="`$ACCESS_TOKEN_TTL"
export REFRESH_TOKEN_TTL="`$REFRESH_TOKEN_TTL"
export DATABASE_URL="`$DATABASE_URL"
export CORS_ORIGINS="`$CORS_ORIGINS"
export WS_ORIGINS="`$WS_ORIGINS"
export SENTRY_DSN="`$SENTRY_DSN"
export RATE_LIMIT_WINDOW_MS="`$RATE_LIMIT_WINDOW_MS"
export RATE_LIMIT_MAX="`$RATE_LIMIT_MAX"

echo "Running deployment script..."
chmod +x EXECUTE_DEPLOYMENT.sh || true
./EXECUTE_DEPLOYMENT.sh | tee /tmp/deploy.log

BASIC_USER=`$(grep -Eo 'Basic Auth: [^/ ]+' /tmp/deploy.log | tail -n1 | awk '{print `$3}' || true)
BASIC_PASS=`$(grep -Eo 'Basic Auth: [^ ]+ / [^ ]+' /tmp/deploy.log | awk '{print `$5}' | tail -n1 || true)
if [ -z "`$BASIC_USER" ] || [ -z "`$BASIC_PASS" ]; then
  [ -f nginx/auth/.htpasswd ] && BASIC_USER=`$(cut -d: -f1 nginx/auth/.htpasswd) || true
fi

set +e
echo "Verifying deployment..."
HTTP_401=`$(curl -sI "`$STAGING_URL" 2>/dev/null | head -n1 || echo "HTTP/1.1 000")
HEALTH=`$(curl -su "`$BASIC_USER:`$BASIC_PASS" "`$STAGING_URL/api/health" 2>/dev/null || echo "{}")
METRICS=`$(curl -su "`$BASIC_USER:`$BASIC_PASS" "`$STAGING_URL/api/metrics" 2>/dev/null || echo "{}")
set -e

COMMIT_HASH=`$(git rev-parse HEAD 2>/dev/null || echo "unknown")
TAG=`$(git describe --tags --always 2>/dev/null || echo "no-tag")

if [ -d tests/e2e ]; then
  echo "Running E2E tests..."
  cd tests/e2e && npm install --silent 2>/dev/null || true
  PLAYWRIGHT_BASE_URL="`$STAGING_URL" STAGING_AUTH_USER="`$BASIC_USER" STAGING_AUTH_PASS="`$BASIC_PASS" \\
  npx playwright test --reporter=html 2>&1 | head -100 || true
  mkdir -p "`$PROJECT_DIR/artifacts"; cp -r playwright-report "`$PROJECT_DIR/artifacts/playwright-report" 2>/dev/null || true
  cd "`$PROJECT_DIR"
fi

if [ -d tests/load ]; then
  echo "Running load test..."
  cd tests/load
  SERVER_URL="`$STAGING_URL" node load-test.js 2>&1 | tee "`$PROJECT_DIR/artifacts/load-test.log" | head -50 || true
  cd "`$PROJECT_DIR"
fi

echo ""
echo "===DEPLOY_SUMMARY_START==="
echo "Staging URL: `$STAGING_URL"
echo "Basic Auth: `$BASIC_USER / `$BASIC_PASS"
echo "Commit: `$COMMIT_HASH"
echo "Tag: `$TAG"
echo "HTTP first line: `$HTTP_401"
echo "Health: `$HEALTH"
echo "Metrics: `$METRICS"
echo "Playwright report: artifacts/playwright-report/index.html"
echo "Load test logs: artifacts/load-test.log"
echo "===DEPLOY_SUMMARY_END==="
"@

# Execute via SSH
Write-Host "Connecting to $SSH_USER@$HOST..."
ssh "$SSH_USER@$HOST" $sshScript

