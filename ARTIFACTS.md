# Test Artifacts & CI Reports

## Location of Generated Artifacts

This document describes where test reports and artifacts will appear after execution.

---

## CI/CD Artifacts (GitHub Actions)

### Workflow: `.github/workflows/ci.yml`

**Artifacts Location:** GitHub Actions → Workflows → Latest Run → Artifacts

**Artifacts Generated:**
- `backend-test-results` - Socket simulation test logs
- `frontend-build` - Frontend build output
- `test-coverage` - Coverage reports (if configured)

**Access:**
1. Go to repository on GitHub
2. Click "Actions" tab
3. Select latest workflow run
4. Scroll to "Artifacts" section
5. Download desired artifact

---

## E2E Test Reports

### Playwright HTML Report

**Location:** `tests/e2e/playwright-report/index.html`

**On Staging Server:**
```bash
/opt/almaydan-ya-7maidan/artifacts/playwright-report/index.html
```

**In CI:**
- Artifact name: `playwright-report-staging`
- Uploaded after E2E workflow completes
- Access via GitHub Actions artifacts

**View Locally:**
```bash
cd tests/e2e
npx playwright show-report playwright-report
```

---

## Load Test Logs

### Load Test Output

**Location:** `tests/load/load-test.log`

**On Staging Server:**
```bash
/opt/almaydan-ya-7maidan/artifacts/load-test.log
```

**In CI:**
- Artifact name: `load-test-results`
- Contains JSON results and summary
- Uploaded after load test completes

**Format:**
```json
{
  "duration": 60.0,
  "connections": 200,
  "successful": 200,
  "failed": 0,
  "p95Latency": 89.5,
  "messageLoss": 0.0,
  "errors": []
}
```

---

## Socket Simulation Test Results

### Test Logs

**Location:** `backend/tests/TEST_RESULTS.md`

**On Staging Server:**
```bash
/opt/almaydan-ya-7maidan/backend/tests/TEST_RESULTS.md
```

**In CI:**
- Console output captured in workflow logs
- Artifact: `backend-test-results` (if configured)

**Format:**
- Test case name
- Status (PASS/FAIL)
- Error codes (if any)
- Execution time

---

## Metrics Snapshots

### Metrics Endpoint Output

**Location:** `docs/METRICS_SAMPLE.json` (example)

**Live Endpoint:**
```bash
curl -u user:pass http://72.61.84.181/api/metrics
```

**Saved Snapshots:**
- After deployment: Saved to `artifacts/metrics-snapshot-YYYY-MM-DD.json`
- In CI: Artifact name: `metrics-snapshot`

---

## Deployment Logs

### Deployment Execution Log

**Location:** `/tmp/deploy.log` (on staging server)

**Contains:**
- Deployment script output
- Error messages (if any)
- Basic auth credentials (in output)
- Health check results

**Retrieve:**
```bash
ssh root@72.61.84.181 "cat /tmp/deploy.log"
```

---

## Acceptance Gate Results

### Acceptance Gate Report

**Location:** `docs/ACCEPTANCE_GATE_SAMPLE.md` (example)

**Generated After:**
- Deployment completes
- All tests pass
- Metrics collected

**Contains:**
- Performance gate results (P95 latency, message loss)
- Security gate results (auth, headers, rate limits)
- E2E gate results (test pass/fail)
- Observability gate results (metrics, health, Sentry)

---

## Build Artifacts

### Frontend Build

**Location:** `frontend/dist/`

**In CI:**
- Artifact name: `frontend-build`
- Contains production-ready static files
- Uploaded after build completes

### Docker Images

**Location:** Docker Hub / Container Registry (if configured)

**Tags:**
- `almaydan-backend:latest`
- `almaydan-frontend:latest`
- `almaydan-backend:v1.0-milestone`
- `almaydan-frontend:v1.0-milestone`

---

## Database Backups

### Backup Files

**Location:** `backups/` directory on staging server

**Format:**
- `backup-YYYY-MM-DD-HHMMSS.sql.gz`
- Compressed SQL dump

**Generated:**
- Before deployments (manual or automated)
- Scheduled backups (if configured)

---

## Documentation Artifacts

### Generated Documentation

**API Documentation:**
- `docs/EVENTS.md` - Socket.IO events
- `docs/game-rules-v3.2.md` - Game rules

**Deployment Documentation:**
- `DEPLOY_NOW.md` - Deployment steps
- `STAGING_CHECKLIST.md` - Pre/post deployment checklist
- `RELEASE_PLAN.md` - Release and rollback plan

**Security Documentation:**
- `SECURITY_CHECKLIST.md` - Security measures
- `.github/SECRETS.md` - Secrets configuration

---

## Artifact Retention

### GitHub Actions

- **Artifacts:** Retained for 90 days (default)
- **Logs:** Retained for 90 days
- **Builds:** Retained per repository settings

### Staging Server

- **Logs:** `/tmp/deploy.log` - Manual cleanup
- **Artifacts:** `/opt/almaydan-ya-7maidan/artifacts/` - Manual cleanup
- **Backups:** `backups/` - Manual cleanup (or automated retention)

---

## Accessing Artifacts

### From CI/CD

1. Navigate to GitHub repository
2. Click "Actions" tab
3. Select workflow run
4. Scroll to "Artifacts" section
5. Click artifact name to download

### From Staging Server

```bash
# SSH into server
ssh root@72.61.84.181

# Navigate to artifacts
cd /opt/almaydan-ya-7maidan/artifacts

# List available artifacts
ls -la

# View Playwright report (requires web server)
# Or download via SCP:
scp root@72.61.84.181:/opt/almaydan-ya-7maidan/artifacts/playwright-report ./
```

---

## Artifact Naming Convention

### Format

- **E2E Reports:** `playwright-report-YYYY-MM-DD`
- **Load Test:** `load-test-YYYY-MM-DD-HHMMSS.log`
- **Metrics:** `metrics-snapshot-YYYY-MM-DD.json`
- **Deployment Log:** `deploy-YYYY-MM-DD-HHMMSS.log`
- **Backups:** `backup-YYYY-MM-DD-HHMMSS.sql.gz`

---

**Last Updated:** 2025-01-11  
**Status:** Artifact locations documented, awaiting test execution

