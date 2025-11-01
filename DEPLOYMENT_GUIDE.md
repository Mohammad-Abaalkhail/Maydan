# Staging Deployment Guide

## Prerequisites

- Docker and Docker Compose installed on staging host
- GitHub repository access
- Staging server SSH access
- MySQL database ready

---

## Step 1: Configure GitHub Secrets

Go to repository → Settings → Secrets and variables → Actions

Add these secrets:

```
JWT_SECRET=<generate with: openssl rand -base64 32>
JWT_REFRESH_SECRET=<generate with: openssl rand -base64 32>
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

---

## Step 2: Configure Staging Host

### On Staging Server

```bash
# Clone repository
git clone <repository-url>
cd almaydan-ya-7maidan

# Create environment file
cp .env.staging.example .env.staging
# Edit .env.staging with your values

# Generate rotated basic auth (DO NOT use staging/staging123)
./scripts/create-staging-auth.sh $(openssl rand -hex 8) $(openssl rand -hex 16)
# Save the credentials securely!
```

---

## Step 3: Deploy

```bash
# Pull latest code
git pull origin main

# Pull Docker images
docker compose -f docker-compose.staging.yml pull

# Start services
docker compose -f docker-compose.staging.yml up -d

# Run migrations
docker compose -f docker-compose.staging.yml exec -T backend npx prisma migrate deploy

# Health check
docker compose -f docker-compose.staging.yml exec -T backend node scripts/healthcheck.js
```

---

## Step 4: Run Tests

### E2E Tests

```bash
cd tests/e2e
npm install
PLAYWRIGHT_BASE_URL=https://staging.mabaalkhail.com \
STAGING_AUTH_USER=<username> \
STAGING_AUTH_PASS=<password> \
npx playwright test --reporter=html
```

**Report Location:** `tests/e2e/playwright-report/index.html`

### Load Test

```bash
cd tests/load
SERVER_URL=https://staging.mabaalkhail.com node load-test.js
```

**Expected Output:**
```
📊 Load Test Results:
==================================================
Duration: 60.00s
Connections: 200/200 (100.0%)
Disconnections: 0
P95 Latency: 89.5ms
Message Loss Rate: 0.00%
Errors: 0

✅ Pass Criteria:
  P95 Latency ≤150ms: ✅ PASS (89.5ms)
  Zero Message Loss: ✅ PASS (0.00%)
```

---

## Step 5: Verify Deployment

### Health Check
```bash
curl https://staging.mabaalkhail.com/api/health
# Expected: {"status":"ok","timestamp":"...","uptime":123.45}
```

### Metrics
```bash
curl https://staging.mabaalkhail.com/api/metrics
# Expected: JSON with event latency metrics
```

### Security Headers
```bash
curl -I https://staging.mabaalkhail.com/api/health
# Should include: X-Frame-Options, X-Content-Type-Options, etc.
```

### Rate Limiting
```bash
# Should return 429 after 100 requests
for i in {1..110}; do curl https://staging.mabaalkhail.com/api/health; done
```

---

## Step 6: Trigger CI

Push to main branch or create tag to trigger CI:

```bash
git push origin main
# Or
git tag v1.0-staging
git push origin v1.0-staging
```

CI will:
1. Run lint and tests
2. Build frontend
3. Run socket simulation tests
4. Upload artifacts

**Artifacts:** Available in GitHub Actions → Workflow runs → Artifacts

---

## Acceptance Gate Checklist

### Performance ✅
- [ ] P95 latency ≤150ms
- [ ] Zero message loss
- [ ] Connection success >95%

### Security ✅
- [ ] Auth rotation works
- [ ] WS re-auth verified
- [ ] Security headers present
- [ ] Rate limits active

### E2E ✅
- [ ] Login → Create Room → Start → Answer → Vote → End passes

### Observability ✅
- [ ] Metrics endpoint returns data
- [ ] Health check returns 200
- [ ] Sentry active

---

## Deliverables

After successful deployment:

1. **Staging URL:** `https://staging.mabaalkhail.com/`
2. **Basic Auth:** `<rotated-username>` / `<rotated-password>`
3. **Commit Hash:** `git rev-parse HEAD`
4. **Tag:** `git describe --tags`
5. **CI Artifacts:**
   - Playwright HTML report: [GitHub Actions link]
   - Load test logs: [GitHub Actions link]
6. **Metrics Snapshot:** [From `/api/metrics`]

---

## Troubleshooting

### Health Check Fails
```bash
# Check logs
docker compose -f docker-compose.staging.yml logs backend

# Check database connection
docker compose -f docker-compose.staging.yml exec backend node -e "console.log(process.env.DATABASE_URL)"
```

### Services Not Starting
```bash
# Check status
docker compose -f docker-compose.staging.yml ps

# View logs
docker compose -f docker-compose.staging.yml logs
```

### Database Migration Fails
```bash
# Check database connection
docker compose -f docker-compose.staging.yml exec mysql mysql -u root -p -e "SHOW DATABASES;"

# Run migration manually
docker compose -f docker-compose.staging.yml exec backend npx prisma migrate deploy
```

---

**Status:** Ready for deployment  
**Next:** Configure secrets and deploy

