# Acceptance Gate - Staging Deployment

## 🎯 Acceptance Criteria

### 1. Performance Gate ✅
- **Target:** P95 WebSocket event latency ≤150ms @ 200 concurrent sockets
- **Message Loss:** Zero drops
- **Test:** `tests/load/load-test.js`
- **Command:** `cd tests/load && SERVER_URL=http://staging-url node load-test.js`

**Pass Criteria:**
- ✅ P95 latency ≤150ms
- ✅ Zero message loss
- ✅ Connection success rate >95%

---

### 2. Authentication & Security ✅
- **Auth Rotation:** Token rotation verified
- **WS Re-auth:** WebSocket re-authentication on reconnect verified
- **Security Headers:** Helmet.js headers active
- **Rate Limits:** API + WebSocket rate limiting active

**Verification:**
```bash
# Check security headers
curl -I http://staging-url/api/health

# Test rate limiting (should fail after limit)
for i in {1..110}; do curl http://staging-url/api/health; done

# Test WS re-auth (disconnect/reconnect with expired token)
# Should fail gracefully and require re-login
```

**Pass Criteria:**
- ✅ Security headers present (X-Frame-Options, X-Content-Type-Options, etc.)
- ✅ Rate limiting active (429 after limit)
- ✅ WS re-auth works correctly

---

### 3. E2E Flow ✅
**Test Flow:** Login → Create Room → Start → Answer → Vote → End

**Test:** `tests/e2e/tests/smoke.spec.js`

**Command:**
```bash
cd tests/e2e
PLAYWRIGHT_BASE_URL=http://staging-url \
STAGING_AUTH_USER=<username> \
STAGING_AUTH_PASS=<password> \
npx playwright test --reporter=html
```

**Pass Criteria:**
- ✅ All E2E tests pass
- ✅ HTML report generated
- ✅ No critical errors

---

### 4. Metrics & Observability ✅
- **Metrics Endpoint:** `/api/metrics` returns WebSocket latency data
- **Health Check:** `/api/health` returns 200
- **Sentry:** Error tracking active
- **Logs:** Structured logging working

**Verification:**
```bash
# Metrics
curl http://staging-url/api/metrics

# Health
curl http://staging-url/api/health

# Check Sentry dashboard for errors
```

**Pass Criteria:**
- ✅ Metrics endpoint returns latency percentiles
- ✅ Health check returns 200
- ✅ Sentry receiving errors (if any)

---

## 📋 Pre-Deployment Checklist

- [ ] GitHub Secrets configured
- [ ] Staging host accessible
- [ ] Docker Compose file updated
- [ ] Environment variables set
- [ ] Basic auth credentials rotated
- [ ] Database backup created (if upgrading)

---

## 🚀 Deployment Steps

### 1. Configure Secrets

**GitHub Secrets:**
- `JWT_SECRET` - JWT secret key
- `ACCESS_TOKEN_TTL` - Access token expiry (default: 15m)
- `REFRESH_TOKEN_TTL` - Refresh token expiry (default: 7d)
- `DATABASE_URL` - MySQL connection string
- `CORS_ORIGINS` - Comma-separated CORS origins
- `SENTRY_DSN_BACKEND` - Backend Sentry DSN
- `SENTRY_DSN_FRONTEND` - Frontend Sentry DSN
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 900000)
- `RATE_LIMIT_MAX` - Rate limit max requests (default: 100)
- `WS_ORIGINS` - WebSocket CORS origins
- `STAGING_URL` - Staging server URL
- `STAGING_HOST` - Staging server hostname/IP
- `STAGING_SSH_KEY` - SSH private key for staging

**Staging Host Environment:**
```bash
# Set in .env.staging or docker-compose.staging.yml
JWT_SECRET=<secret>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
DATABASE_URL=mysql://user:pass@mysql:3306/db
CORS_ORIGINS=https://staging.mabaalkhail.com
SENTRY_DSN_BACKEND=<dsn>
SENTRY_DSN_FRONTEND=<dsn>
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
WS_ORIGINS=https://staging.mabaalkhail.com
```

### 2. Deploy

```bash
# On staging host
cd /path/to/almaydan-ya-7maidan

# Pull latest
git pull origin main

# Generate new basic auth (rotated)
./scripts/create-staging-auth.sh <new-user> <new-pass>

# Deploy
docker compose -f docker-compose.staging.yml pull
docker compose -f docker-compose.staging.yml up -d

# Migrate database
docker compose -f docker-compose.staging.yml exec -T backend npx prisma migrate deploy

# Health check
docker compose -f docker-compose.staging.yml exec -T backend node scripts/healthcheck.js
```

### 3. Run Tests

**E2E Tests:**
```bash
cd tests/e2e
npm install
PLAYWRIGHT_BASE_URL=http://staging-url \
STAGING_AUTH_USER=<user> \
STAGING_AUTH_PASS=<pass> \
npx playwright test --reporter=html
```

**Load Test:**
```bash
cd tests/load
SERVER_URL=http://staging-url node load-test.js
```

### 4. Verify Metrics

```bash
# Get metrics snapshot
curl http://staging-url/api/metrics | jq

# Expected output:
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

## ✅ Acceptance Gate Results

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
- [ ] Login flow: ✅ / ❌
- [ ] Create room: ✅ / ❌
- [ ] Start game: ✅ / ❌
- [ ] Answer submission: ✅ / ❌
- [ ] Voting: ✅ / ❌
- [ ] Game end: ✅ / ❌

### Observability Gate
- [ ] Metrics endpoint: ✅ / ❌
- [ ] Health check: ✅ / ❌
- [ ] Sentry active: ✅ / ❌
- [ ] Logging: ✅ / ❌

---

## 📊 Deliverables

After acceptance gate passes:

1. **Staging URL:** `http://staging-url/`
2. **Basic Auth:** `<username>` / `<password>` (rotated)
3. **Commit Hash:** `git rev-parse HEAD`
4. **Tag:** `git describe --tags`
5. **CI Artifacts:**
   - Playwright HTML report: GitHub Actions artifacts
   - Load test logs: GitHub Actions artifacts
6. **Metrics Snapshot:** From `/api/metrics` endpoint

---

## 🎉 After Acceptance

Once all gates pass:
- ✅ Proceed to UX polish phase
- ✅ Start Arabic localization QA
- ✅ Gather user feedback
- ✅ Plan production deployment

---

**Status:** Ready for staging deployment  
**Next:** Configure secrets and deploy

