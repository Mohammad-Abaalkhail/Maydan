# Staging Deployment Execution

## ⚠️ Prerequisites

**Required before execution:**
- `REPO_URL` - Your GitHub repository URL (e.g., `https://github.com/username/almaydan-ya-7maidan.git`)
- SSH access to `72.61.84.181` as `root`
- Proper SSH key configured for passwordless access

## 🚀 Execution Command

```bash
REPO_URL="<YOUR_GITHUB_REPO_URL>" \
JWT_SECRET="XdvyNs1K0ChtQukcUZpF8RrfoJ6YgIHEWba4i5Ol2qm9TDLSVxnPMGz7wje3BA" \
DATABASE_URL="mysql://almaydan_user:rndmbKxvUqYe4tpVWaf5OGP7s2yzgB6LMC9HhDc0SZk8X3wuEIJFlTo1AQjNiR@mysql:3306/almaydan_db" \
bash execute-deployment.sh
```

## 📋 Expected Output Format

After execution, you should see:

```
===DEPLOY_SUMMARY_START===
Staging URL: https://staging.mabaalkhail.com
Basic Auth: <username> / <password>
Commit: <40-char-hash>
Tag: <tag-or-hash>
HTTP first line: HTTP/1.1 401 Unauthorized
Health: {"status":"ok","timestamp":"...","uptime":...}
Metrics: {"events":{...},"overall":{...}}
Playwright report: artifacts/playwright-report/index.html
Load test logs: artifacts/load-test.log
===DEPLOY_SUMMARY_END===
```

## 🔍 Verification Steps

After deployment:

1. **Check 401 without auth:**
   ```bash
   curl -I https://staging.mabaalkhail.com/api/health
   # Should return: HTTP/1.1 401 Unauthorized
   ```

2. **Check health with auth:**
   ```bash
   curl -u <username>:<password> https://staging.mabaalkhail.com/api/health
   # Should return: {"status":"ok",...}
   ```

3. **Get metrics:**
   ```bash
   curl -u <username>:<password> https://staging.mabaalkhail.com/api/metrics | jq
   ```

4. **Check Playwright report:**
   - Located at: `artifacts/playwright-report/index.html` on staging server
   - Or download via SCP: `scp root@72.61.84.181:/opt/almaydan-ya-7maidan/artifacts/playwright-report .`

5. **Check load test logs:**
   - Located at: `artifacts/load-test.log` on staging server

---

**Status:** Script ready, awaiting REPO_URL to execute

