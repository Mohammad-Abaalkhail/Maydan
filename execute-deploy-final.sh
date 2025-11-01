#!/bin/bash
# Final deployment execution script

HOST=72.61.84.181
SSH_USER=root
REPO_URL=https://github.com/Mohammad-Abaalkhail/Maydan.git
PROJECT_DIR=/opt/almaydan-ya-7maidan
STAGING_URL=http://72.61.84.181
JWT_SECRET=yob6VFZJWSA5d4sqP2YUMQgn3pGcKxOztmkCNrjhuaE8X7eLlTI1ifBw90HDvR
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
DATABASE_URL=mysql://almaydan_user:rndmbKxvUqYe4tpVWaf5OGP7s2yzgB6LMC9HhDc0SZk8X3wuEIJFlTo1AQjNiR@mysql:3306/almaydan_db
CORS_ORIGINS=$STAGING_URL
WS_ORIGINS=$STAGING_URL
SENTRY_DSN=
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

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

