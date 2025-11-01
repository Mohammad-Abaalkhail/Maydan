# Staging Deployment Guide

## Quick Start

### 1. Configure Environment

```bash
cp .env.production.example .env.staging
# Edit .env.staging with staging values
```

### 2. Create Staging Auth

```bash
./scripts/create-staging-auth.sh staging staging123
```

### 3. Deploy

```bash
docker-compose -f docker-compose.staging.yml up -d --build
```

### 4. Initialize Database

```bash
docker-compose -f docker-compose.staging.yml exec backend npm run prisma:migrate deploy
# Note: Seeding is disabled in production/staging
```

### 5. Verify

```bash
# Health check
curl http://staging-url/api/health

# With basic auth
curl -u staging:staging123 http://staging-url/api/health
```

## Staging URL

**URL:** `http://staging-url/` (configure in DNS/hosts)

**Basic Auth:**
- Username: `staging`
- Password: `staging123` (change in production)

## Access Points

- **Frontend:** http://staging-url/
- **API:** http://staging-url/api/
- **Health:** http://staging-url/api/health
- **Metrics:** http://staging-url/api/metrics

## Testing

### E2E Tests

```bash
cd tests/e2e
npm install
PLAYWRIGHT_BASE_URL=http://staging-url npm run test
```

### Load Tests

```bash
cd tests/load
SERVER_URL=http://staging-url node load-test.js
```

## Monitoring

- **Sentry:** Check for errors
- **Logs:** `docker-compose -f docker-compose.staging.yml logs -f`
- **Metrics:** http://staging-url/api/metrics
- **Health:** http://staging-url/api/health

## Backup & Restore

```bash
# Backup
./scripts/backup-db.sh staging-backup-$(date +%Y%m%d)

# Restore
./scripts/restore-db.sh backups/staging-backup-YYYYMMDD.sql.gz
```

## Troubleshooting

See `RELEASE_PLAN.md` for rollback procedures.

