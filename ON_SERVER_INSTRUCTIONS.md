# 🔧 Instructions for Running on Server

## After SSH Connection

Once you're connected via SSH (`ssh root@72.61.84.181`), run these commands:

### Option 1: Copy the script and execute

```bash
# Copy the deployment script to the server
cat > /tmp/deploy.sh <<'DEPLOY_SCRIPT'
[paste contents of commands-on-server.sh here]
DEPLOY_SCRIPT

# Make executable and run
chmod +x /tmp/deploy.sh
bash /tmp/deploy.sh
```

### Option 2: Execute directly from repository

If the repository is already cloned:

```bash
cd /opt/almaydan-ya-7maidan
export REPO_URL="https://github.com/Mohammad-Abaalkhail/Maydan.git"
bash DEPLOY_NOW_COMPLETE.sh
```

### Option 3: Run commands manually

Copy and paste the commands from `commands-on-server.sh` directly into your SSH session.

---

## Quick Command (Copy-Paste Ready)

```bash
REPO_URL="https://github.com/Mohammad-Abaalkhail/Maydan.git" PROJECT_DIR=/opt/almaydan-ya-7maidan STAGING_URL=https://staging.mabaalkhail.com JWT_SECRET="XdvyNs1K0ChtQukcUZpF8RrfoJ6YgIHEWba4i5Ol2qm9TDLSVxnPMGz7wje3BA" ACCESS_TOKEN_TTL=15m REFRESH_TOKEN_TTL=7d DATABASE_URL="mysql://almaydan_user:rndmbKxvUqYe4tpVWaf5OGP7s2yzgB6LMC9HhDc0SZk8X3wuEIJFlTo1AQjNiR@mysql:3306/almaydan_db" CORS_ORIGINS=$STAGING_URL WS_ORIGINS=$STAGING_URL SENTRY_DSN="" RATE_LIMIT_WINDOW_MS=60000 RATE_LIMIT_MAX=100 bash -c 'mkdir -p /opt; if [ ! -d "$PROJECT_DIR/.git" ]; then git clone "$REPO_URL" "$PROJECT_DIR"; fi; cd "$PROJECT_DIR"; git fetch --all --tags; git checkout main || git checkout master || true; git pull --ff-only || true; export JWT_SECRET="$JWT_SECRET"; export DATABASE_URL="$DATABASE_URL"; export CORS_ORIGINS="$CORS_ORIGINS"; export WS_ORIGINS="$WS_ORIGINS"; chmod +x EXECUTE_DEPLOYMENT.sh || true; ./EXECUTE_DEPLOYMENT.sh | tee /tmp/deploy.log; BASIC_USER=$(grep -Eo "Basic Auth: [^/ ]+" /tmp/deploy.log | tail -n1 | awk "{print \$3}" || true); BASIC_PASS=$(grep -Eo "Basic Auth: [^ ]+ / [^ ]+" /tmp/deploy.log | awk "{print \$5}" | tail -n1 || true); COMMIT_HASH=$(git rev-parse HEAD 2>/dev/null || echo "unknown"); TAG=$(git describe --tags --always 2>/dev/null || echo "no-tag"); echo "===DEPLOY_SUMMARY_START==="; echo "Staging URL: $STAGING_URL"; echo "Basic Auth: $BASIC_USER / $BASIC_PASS"; echo "Commit: $COMMIT_HASH"; echo "Tag: $TAG"; echo "===DEPLOY_SUMMARY_END==="'
```

---

**After execution, save the output from `===DEPLOY_SUMMARY_START===` to `===DEPLOY_SUMMARY_END===`**

