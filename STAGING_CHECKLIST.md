# Staging Deployment Checklist

## Pre-Deployment

### Secrets Configuration
- [ ] `JWT_SECRET` - Generate with `openssl rand -hex 32` (64 characters)
- [ ] `JWT_REFRESH_SECRET` - Generate with `openssl rand -hex 32` (64 characters)
- [ ] `DATABASE_URL` - Format: `mysql://user:password@host:3306/database`
- [ ] `CORS_ORIGINS` - Set to staging URL: `http://72.61.84.181`
- [ ] `WS_ORIGINS` - Set to staging URL: `http://72.61.84.181`
- [ ] `SENTRY_DSN_BACKEND` - Optional, if using Sentry
- [ ] `SENTRY_DSN_FRONTEND` - Optional, if using Sentry
- [ ] `RATE_LIMIT_WINDOW_MS` - Default: `60000` (1 minute)
- [ ] `RATE_LIMIT_MAX` - Default: `100` requests per window

### Infrastructure
- [ ] SSH access to `72.61.84.181` verified
- [ ] Docker installed (or will be auto-installed)
- [ ] Git installed (or will be auto-installed)
- [ ] MySQL database accessible
- [ ] Port 3000 available for backend
- [ ] Port 80/443 available for Nginx
- [ ] Port 3306 available for MySQL

### DNS & SSL
- [ ] DNS A record points to `72.61.84.181` (if using domain)
- [ ] SSL certificate configured (if using HTTPS)
- [ ] Nginx SSL configuration updated
- [ ] Firewall rules allow required ports

### Repository
- [ ] Repository URL: `https://github.com/Mohammad-Abaalkhail/Maydan.git`
- [ ] Repository is accessible from staging server
- [ ] Main branch contains latest code
- [ ] All required files present (`EXECUTE_DEPLOYMENT.sh`, `docker-compose.staging.yml`)

---

## During Deployment

### Execution Steps
- [ ] Environment variables set
- [ ] SSH connection established
- [ ] Docker installation (if needed) completed
- [ ] Repository cloned/updated
- [ ] Environment variables exported
- [ ] `EXECUTE_DEPLOYMENT.sh` executed successfully
- [ ] Basic auth credentials generated and saved
- [ ] Health check passed
- [ ] Metrics endpoint accessible

### Verification
- [ ] `curl -I http://72.61.84.181/api/health` returns `401 Unauthorized` (without auth)
- [ ] `curl -u user:pass http://72.61.84.181/api/health` returns `200 OK` (with auth)
- [ ] `curl -u user:pass http://72.61.84.181/api/metrics` returns JSON
- [ ] Docker containers running: `docker ps`
- [ ] Database migrations applied: Check logs
- [ ] Nginx serving content: Check access logs

---

## Post-Deployment

### Health Checks
- [ ] Backend health endpoint: `/api/health`
- [ ] Frontend accessible: `http://72.61.84.181/`
- [ ] Socket.IO connection works: Test WebSocket connection
- [ ] Database connectivity: Verify queries work
- [ ] Redis/Memory cache: If applicable

### Security
- [ ] Basic auth required for all endpoints
- [ ] Rate limiting active (test with rapid requests)
- [ ] CORS headers correct
- [ ] Security headers present (X-Frame-Options, etc.)
- [ ] JWT tokens expire correctly
- [ ] Refresh token rotation works

### Performance
- [ ] Response times acceptable (<500ms for API)
- [ ] WebSocket latency acceptable (<150ms P95)
- [ ] Database queries optimized
- [ ] No memory leaks (check over time)

### Monitoring
- [ ] Metrics endpoint returning data
- [ ] Logs accessible and readable
- [ ] Error tracking configured (Sentry)
- [ ] Uptime monitoring set up

---

## Rollback Plan

### Quick Rollback (Last Known Good)
```bash
cd /opt/almaydan-ya-7maidan
git checkout <last-known-good-commit>
git pull
docker compose -f docker-compose.staging.yml down
docker compose -f docker-compose.staging.yml up -d
docker compose -f docker-compose.staging.yml exec -T backend npx prisma migrate deploy
```

### Database Rollback
```bash
# Restore from backup
docker exec mysql mysql -u root -p < /backups/backup-YYYY-MM-DD.sql
```

### Full Reset
```bash
cd /opt/almaydan-ya-7maidan
docker compose -f docker-compose.staging.yml down -v
# Re-run deployment script
```

---

## Emergency Contacts

- **Server Access:** SSH `root@72.61.84.181`
- **Repository:** `https://github.com/Mohammad-Abaalkhail/Maydan.git`
- **Documentation:** See `RELEASE_PLAN.md` for detailed rollback steps

---

**Check each item before proceeding to next phase.**

