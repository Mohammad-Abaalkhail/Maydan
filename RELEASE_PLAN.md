# Release Plan - الميدان يا حميدان

## Version: v1.0-milestone → Staging

### Pre-Release Checklist

- [x] Code frozen and tagged
- [x] CI pipeline passing
- [x] Integration tests planned
- [x] Security checklist complete
- [x] Deployment configs ready
- [ ] E2E tests passing
- [ ] Load tests passing
- [ ] Staging deployment verified

---

## Deployment Steps

### 1. Pre-Deployment

```bash
# 1.1 Verify code status
git status
git tag -l v1.0-milestone

# 1.2 Run local tests
cd backend && npm run test:socket
cd ../frontend && npm run build

# 1.3 Verify environment variables
cat .env.production | grep -v PASSWORD

# 1.4 Create database backup (if upgrading)
./scripts/backup-db.sh pre-deployment-backup
```

### 2. Staging Deployment

```bash
# 2.1 Pull latest code
git pull origin main
git checkout v1.0-milestone

# 2.2 Configure staging environment
cp .env.production.example .env.staging
# Edit .env.staging with staging values

# 2.3 Build and start services
docker-compose -f docker-compose.staging.yml up -d --build

# 2.4 Run database migrations
docker-compose -f docker-compose.staging.yml exec backend npm run prisma:migrate deploy

# 2.5 Verify services
docker-compose -f docker-compose.staging.yml ps
docker-compose -f docker-compose.staging.yml logs backend | tail -20
```

### 3. Post-Deployment Verification

```bash
# 3.1 Health check
curl http://staging-url/api/health

# 3.2 Run E2E tests
cd tests/e2e
npm run test

# 3.3 Run load tests
cd tests/load
node load-test.js

# 3.4 Check metrics
curl http://staging-url/api/metrics
```

### 4. Monitoring

- [ ] Check Sentry for errors
- [ ] Monitor application logs
- [ ] Verify WebSocket connections
- [ ] Check database connections
- [ ] Review metrics dashboard

---

## Rollback Plan

### Rollback Triggers

Rollback immediately if:
- Health check fails
- Critical errors in Sentry
- Database connection issues
- >5% error rate
- P95 latency >200ms

### Rollback Steps

#### Option 1: Quick Rollback (Previous Version)

```bash
# 1. Stop current deployment
docker-compose -f docker-compose.staging.yml down

# 2. Checkout previous version
git checkout <previous-tag>
# Or: git checkout main (if stable)

# 3. Restart with previous version
docker-compose -f docker-compose.staging.yml up -d --build

# 4. Verify rollback
curl http://staging-url/api/health
```

#### Option 2: Database Rollback (If Migration Issue)

```bash
# 1. Stop backend service
docker-compose -f docker-compose.staging.yml stop backend

# 2. Restore database backup
./scripts/restore-db.sh backups/pre-deployment-backup.sql.gz

# 3. Rollback Prisma migration (if needed)
docker-compose -f docker-compose.staging.yml exec backend \
  npx prisma migrate resolve --rolled-back <migration-name>

# 4. Restart backend
docker-compose -f docker-compose.staging.yml start backend
```

#### Option 3: Partial Rollback (Backend Only)

```bash
# 1. Rollback backend to previous image
docker-compose -f docker-compose.staging.yml up -d --no-deps backend

# 2. Keep frontend running
# 3. Verify backend rollback
curl http://staging-url/api/health
```

### Rollback Verification

After rollback:
- [ ] Health check passes
- [ ] No critical errors
- [ ] Database queries work
- [ ] WebSocket connections stable
- [ ] User flows functional

---

## Staging Credentials

### Basic Auth (Staging)
- **Username:** `staging`
- **Password:** `staging123` (change in production)

### Database Access
- **Host:** `mysql` (container) or staging host
- **User:** From `MYSQL_USER` env var
- **Password:** From `MYSQL_PASSWORD` env var

### Application URLs
- **Frontend:** `http://staging-url/` (with basic auth)
- **Backend API:** `http://staging-url/api/`
- **Health Check:** `http://staging-url/api/health`
- **Metrics:** `http://staging-url/api/metrics`

---

## Performance Targets

### SLOs (Service Level Objectives)

- **Availability:** 99.5% uptime
- **P95 Latency:** ≤150ms for WebSocket events
- **Error Rate:** <1% of requests
- **Connection Success:** >95% of socket connections
- **Message Loss:** 0% message loss

### Monitoring

- **Uptime Probe:** `/api/health` endpoint
- **Metrics Endpoint:** `/api/metrics`
- **Sentry:** Error tracking and alerts
- **Logs:** Structured logging to files/console

---

## Release Notes

### v1.0-milestone → Staging

**Features:**
- Core game functionality
- Socket.IO real-time communication
- Power cards (Skip, DoubleVote)
- Arabic UI
- Authentication and authorization

**Security:**
- JWT token expiry and rotation
- Rate limiting (API + WebSocket)
- CORS configuration
- Security headers (Helmet)
- WebSocket re-authentication

**Infrastructure:**
- Docker Compose deployment
- Nginx reverse proxy
- Database backups/restore
- Health checks
- Metrics collection

**Testing:**
- 11 socket simulation tests
- 28 integration test scenarios
- E2E Playwright tests
- Load testing (200 concurrent sockets)

---

## Communication Plan

### Stakeholders

- Development team
- QA team
- DevOps team
- Product team

### Notification Channels

- Slack/Discord: Deployment status
- Email: Critical issues
- Sentry: Error alerts
- Metrics Dashboard: Performance monitoring

---

## Post-Release

### Immediate (First 24 Hours)

- [ ] Monitor error rates
- [ ] Review performance metrics
- [ ] Check user feedback
- [ ] Verify all features working

### Week 1

- [ ] Performance analysis
- [ ] Error pattern analysis
- [ ] User behavior analysis
- [ ] Optimization opportunities

### Before Production

- [ ] Security audit
- [ ] Performance tuning
- [ ] UX polish
- [ ] Arabic localization QA
- [ ] Load testing at scale

---

## Support

### Issues

- Check logs: `docker-compose logs`
- Check Sentry: Error tracking
- Check metrics: `/api/metrics`
- Check health: `/api/health`

### Escalation

1. Check logs and metrics
2. Review Sentry errors
3. Check database status
4. Review recent deployments
5. Escalate to team lead if critical

---

**Last Updated:** 2025-01-11  
**Status:** Ready for staging deployment

