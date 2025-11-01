# Deploy Now - Exact Steps

## Prerequisites

- SSH access to `72.61.84.181` as `root`
- GitHub repository access: `https://github.com/Mohammad-Abaalkhail/Maydan.git`
- Docker installed on staging server (or will be installed)
- MySQL database accessible

---

## Step 1: Set Environment Variables

```bash
export HOST=72.61.84.181
export SSH_USER=root
export REPO_URL=https://github.com/Mohammad-Abaalkhail/Maydan.git
export PROJECT_DIR=/opt/almaydan-ya-7maidan
export STAGING_URL=http://72.61.84.181
export JWT_SECRET=<GENERATE_STRONG_RANDOM_64_CHARS>
export ACCESS_TOKEN_TTL=15m
export REFRESH_TOKEN_TTL=7d
export DATABASE_URL=mysql://user:password@mysql:3306/dbname
export CORS_ORIGINS=$STAGING_URL
export WS_ORIGINS=$STAGING_URL
export SENTRY_DSN=
export RATE_LIMIT_WINDOW_MS=60000
export RATE_LIMIT_MAX=100
```

**Generate JWT_SECRET:**
```bash
openssl rand -hex 32
```

---

## Step 2: Execute Deployment Script

```bash
ssh "$SSH_USER@$HOST" <<'EOF'
set -euo pipefail

command -v docker >/dev/null || INSTALL_DOCKER=1
command -v git >/dev/null || apt update -y && apt install -y git

if [ "${INSTALL_DOCKER:-0}" = "1" ]; then
  apt update -y && apt install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release; echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
  apt update -y
  apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

mkdir -p /opt
if [ ! -d "$PROJECT_DIR/.git" ]; then
  git clone "$REPO_URL" "$PROJECT_DIR"
fi
cd "$PROJECT_DIR"
git fetch --all --tags
git checkout main
git pull --ff-only

export JWT_SECRET=''"$JWT_SECRET"'' \
       ACCESS_TOKEN_TTL=''"$ACCESS_TOKEN_TTL"'' \
       REFRESH_TOKEN_TTL=''"$REFRESH_TOKEN_TTL"'' \
       DATABASE_URL=''"$DATABASE_URL"'' \
       CORS_ORIGINS=''"$CORS_ORIGINS"'' \
       WS_ORIGINS=''"$WS_ORIGINS"'' \
       SENTRY_DSN=''"$SENTRY_DSN"'' \
       RATE_LIMIT_WINDOW_MS=''"$RATE_LIMIT_WINDOW_MS"'' \
       RATE_LIMIT_MAX=''"$RATE_LIMIT_MAX"''

chmod +x EXECUTE_DEPLOYMENT.sh || true
./EXECUTE_DEPLOYMENT.sh | tee /tmp/deploy.log

BASIC_USER=$(grep -Eo 'Basic Auth: [^/ ]+' /tmp/deploy.log | tail -n1 | awk '{print $3}' || true)
BASIC_PASS=$(grep -Eo 'Basic Auth: [^ ]+ / [^ ]+' /tmp/deploy.log | awk '{print $5}' | tail -n1 || true)
[ -z "$BASIC_USER" ] && [ -f nginx/auth/.htpasswd ] && BASIC_USER=$(cut -d: -f1 nginx/auth/.htpasswd) || true

set +e
HTTP_401=$(curl -sI "$STAGING_URL" | head -n1)
HEALTH=$(curl -su "$BASIC_USER:$BASIC_PASS" "$STAGING_URL/api/health")
METRICS=$(curl -su "$BASIC_USER:$BASIC_PASS" "$STAGING_URL/api/metrics")
set -e

COMMIT_HASH=$(git rev-parse HEAD || echo "unknown")
TAG=$(git describe --tags --always 2>/dev/null || echo "no-tag")

echo "===DELIVERABLES==="
echo "Staging URL: $STAGING_URL"
echo "Basic Auth: $BASIC_USER / $BASIC_PASS"
echo "Commit: $COMMIT_HASH"
echo "Tag: $TAG"
echo "HTTP: $HTTP_401"
echo "Health: $HEALTH"
echo "Metrics: $METRICS"
echo "Playwright: artifacts/playwright-report/index.html"
echo "Load logs: artifacts/load-test.log"
echo "===END==="
EOF
```

---

## Step 3: Verify Deployment

```bash
# Check health endpoint
curl -u <BASIC_USER>:<BASIC_PASS> http://72.61.84.181/api/health

# Check metrics
curl -u <BASIC_USER>:<BASIC_PASS> http://72.61.84.181/api/metrics

# Verify 401 without auth
curl -I http://72.61.84.181/api/health
# Should return: HTTP/1.1 401 Unauthorized
```

---

## Step 4: Run Tests

```bash
# E2E Tests
cd /opt/almaydan-ya-7maidan/tests/e2e
npm install
PLAYWRIGHT_BASE_URL=http://72.61.84.181 \
STAGING_AUTH_USER=<BASIC_USER> \
STAGING_AUTH_PASS=<BASIC_PASS> \
npx playwright test --reporter=html

# Load Test
cd /opt/almaydan-ya-7maidan/tests/load
SERVER_URL=http://72.61.84.181 node load-test.js
```

---

## Troubleshooting

**Docker not found:**
- Script will auto-install Docker
- May take 5-10 minutes

**Git clone fails:**
- Check SSH key or HTTPS credentials
- Verify repository URL is correct

**Database connection fails:**
- Verify DATABASE_URL format
- Check MySQL container is running: `docker ps`
- Check network connectivity: `docker exec backend ping mysql`

**Deployment script fails:**
- Check logs: `cat /tmp/deploy.log`
- Verify environment variables: `env | grep JWT_SECRET`
- Check Docker Compose: `docker compose -f docker-compose.staging.yml ps`

---

**No assumptions made. Follow steps exactly as written.**
