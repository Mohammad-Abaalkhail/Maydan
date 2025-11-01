# Staging Deployment - Ready to Execute

## ✅ Pre-Deployment Checklist

- [x] Code complete and tested
- [x] Environment variables documented
- [x] Deployment scripts created
- [x] Health check script ready
- [x] E2E tests configured
- [x] Load test script ready
- [x] CI workflows configured

---

## 🔐 Step 1: Configure Secrets

### GitHub Secrets (Repository Settings)

Configure these in GitHub → Settings → Secrets and variables → Actions:

**Required Secrets:**
```
JWT_SECRET=<openssl rand -base64 32>
JWT_REFRESH_SECRET=<openssl rand -base64 32>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
DATABASE_URL=mysql://user:pass@host:3306/dbname
CORS_ORIGINS=https://staging.mabaalkhail.com
WS_ORIGINS=https://staging.mabaalkhail.com
SENTRY_DSN_BACKEND=https://xxx@sentry.io/xxx
SENTRY_DSN_FRONTEND=https://xxx@sentry.io/xxx
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
STAGING_URL=https://staging.mabaalkhail.com
STAGING_HOST=staging.mabaalkhail.com
STAGING_SSH_KEY=<SSH private key>
```

### Staging Host Environment

Create `.env.staging` on staging host:

```bash
cp .env.staging.example .env.staging
# Edit with actual values
```

---

## 🚀 Step 2: Deploy to Staging

### On Staging Host

```bash
# Navigate to project directory
cd /path/to/almaydan-ya-7maidan

# Pull latest code
git pull origin main

# Generate rotated basic auth (IMPORTANT: Don't use staging/staging123)
STAGING_USER=$(openssl rand -hex 8)
STAGING_PASS=$(openssl rand -hex 16)
echo "Username: $STAGING_USER"
echo "Password: $STAGING_PASS"
./scripts/create-staging-auth.sh $STAGING_USER $STAGING_PASS

# Deploy
docker compose -f docker-compose.staging.yml pull
docker compose -f docker-compose.staging.yml up -d

# Run migrations
docker compose -f docker-compose.staging.yml exec -T backend npx prisma migrate deploy

# Health check
docker compose -f docker-compose.staging.yml exec -T backend node scripts/healthcheck.js
```

**Save the generated credentials securely!**

---

## 🧪 Step 3: Run Tests

### E2E Tests

```bash
cd tests/e2e
npm install
PLAYWRIGHT_BASE_URL=https://staging.mabaalkhail.com \
STAGING_AUTH_USER=<username> \
STAGING_AUTH_PASS=<password> \
npx playwright test --reporter=html
```

**Report:** `tests/e2e/playwright-report/index.html`

### Load Test

```bash
cd tests/load
SERVER_URL=https://staging.mabaalkhail.com node load-test.js
```

**Expected:** P95 ≤150ms, zero message loss

---

## 📊 Step 4: Verify Metrics

```bash
# Get metrics snapshot
curl https://staging.mabaalkhail.com/api/metrics | jq

# Expected structure:
# {
#   "events": {
#     "power:use": {
#       "count": 123,
#       "avg": 45.2,
#       "p95": 89.5,
#       "p99": 120.3
#     }
#   },
#   "overall": {
#     "count": 500,
#     "avg": 52.1,
#     "p95": 98.3
#   }
# }
```

---

## 🔄 Step 5: Trigger CI

```bash
# Push to main (triggers CI)
git push origin main

# Or create tag
git tag v1.0-staging
git push origin v1.0-staging
```

**CI Artifacts:** Available in GitHub Actions → Workflow runs → Artifacts

---

## ✅ Acceptance Gate

### Performance Gate
- [ ] P95 latency: _____ ms (target: ≤150ms)
- [ ] Message loss: _____ % (target: 0%)
- [ ] Connection success: _____ % (target: >95%)

### Security Gate
- [ ] Auth rotation: ✅ / ❌
- [ ] WS re-auth: ✅ / ❌
- [ ] Security headers: ✅ / ❌
- [ ] Rate limits: ✅ / ❌

### E2E Gate
- [ ] Full flow passes: ✅ / ❌
- [ ] HTML report generated: ✅ / ❌

### Observability Gate
- [ ] Metrics endpoint: ✅ / ❌
- [ ] Health check: ✅ / ❌
- [ ] Sentry active: ✅ / ❌

---

## 📋 Deliverables (After Deployment)

Once acceptance gates pass, provide:

1. **Staging URL:** `https://staging.mabaalkhail.com/`
2. **Basic Auth:** `<username>` / `<password>` (rotated)
3. **Commit Hash:** `git rev-parse HEAD`
4. **Tag:** `git describe --tags` (if tagged)
5. **CI Artifacts Links:**
   - Playwright HTML report: [GitHub Actions artifacts]
   - Load test logs: [GitHub Actions artifacts]
6. **Metrics Snapshot:** [JSON from `/api/metrics`]

---

## 🎯 After Acceptance

Once all gates pass:
- ✅ Proceed to UX polish phase
- ✅ Start Arabic localization QA
- ✅ Gather user feedback
- ✅ Plan production deployment

---

**Status:** Ready for staging deployment  
**Action Required:** Configure secrets and deploy

