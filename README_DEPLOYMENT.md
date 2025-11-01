# Deployment Execution - Ready to Run

## ⚠️ Important

I cannot execute commands on your remote staging server. However, **all scripts and configurations are ready**.

**To deploy, you must:**
1. SSH into your staging server
2. Run the deployment commands below
3. Share the results back

---

## 🚀 Exact Commands to Execute

### On Staging Server

```bash
# Navigate to project
cd /path/to/almaydan-ya-7maidan

# Pull latest
git pull origin main

# Generate rotated auth (DO NOT use staging/staging123)
STAGING_USER=$(openssl rand -hex 8)
STAGING_PASS=$(openssl rand -hex 16)
echo "Username: $STAGING_USER"
echo "Password: $STAGING_PASS"

# Create auth file
mkdir -p nginx/auth
echo "$STAGING_USER:$(openssl passwd -apr1 $STAGING_PASS)" > nginx/auth/.htpasswd

# Deploy
docker compose -f docker-compose.staging.yml pull
docker compose -f docker-compose.staging.yml up -d
sleep 15

# Migrate
docker compose -f docker-compose.staging.yml exec -T backend npx prisma migrate deploy

# Health check
docker compose -f docker-compose.staging.yml exec -T backend node scripts/healthcheck.js

# Verify 401 without auth
curl -s -w "%{http_code}" -o /dev/null https://staging.mabaalkhail.com/api/health
# Should return: 401

# Get info
COMMIT_HASH=$(git rev-parse HEAD)
TAG=$(git describe --tags --always 2>/dev/null || echo "no-tag")
echo "Commit: $COMMIT_HASH"
echo "Tag: $TAG"
```

### Run Tests

```bash
# E2E Tests
cd tests/e2e
npm install
PLAYWRIGHT_BASE_URL=https://staging.mabaalkhail.com \
STAGING_AUTH_USER=$STAGING_USER \
STAGING_AUTH_PASS=$STAGING_PASS \
npx playwright test --reporter=html

# Load Test
cd tests/load
SERVER_URL=https://staging.mabaalkhail.com node load-test.js
```

### Get Metrics

```bash
curl -u $STAGING_USER:$STAGING_PASS https://staging.mabaalkhail.com/api/metrics | jq
```

---

## 📋 What to Return

After executing, provide:

1. **Staging URL:** `https://staging.mabaalkhail.com/`
2. **Basic Auth:** `<username>` / `<password>`
3. **Commit:** `<git rev-parse HEAD output>`
4. **Tag:** `<git describe --tags output>`
5. **CI Artifacts:** Links from GitHub Actions
6. **Metrics Snapshot:** JSON from `/api/metrics`
7. **Gate Results:** P95 latency, error rate, etc.

---

**Status:** Scripts ready, awaiting execution on staging server

