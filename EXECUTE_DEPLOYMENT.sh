#!/bin/bash

# Complete Staging Deployment Execution
# Run this script on your staging server

set -e

echo "🚀 الميدان يا حميدان - Staging Deployment"
echo "=========================================="
echo ""

# Configuration
STAGING_URL="https://staging.mabaalkhail.com"
PROJECT_DIR="${PROJECT_DIR:-/opt/almaydan-ya-7maidan}"

# Step 1: Generate rotated basic auth
echo "📝 Step 1: Generating rotated basic auth..."
STAGING_USER=$(openssl rand -hex 8)
STAGING_PASS=$(openssl rand -hex 16)
echo "✅ Generated:"
echo "   Username: $STAGING_USER"
echo "   Password: $STAGING_PASS"
echo ""

# Create auth file
mkdir -p nginx/auth
if command -v htpasswd &> /dev/null; then
    htpasswd -bc nginx/auth/.htpasswd "$STAGING_USER" "$STAGING_PASS" 2>/dev/null
else
    echo "$STAGING_USER:$(openssl passwd -apr1 $STAGING_PASS)" > nginx/auth/.htpasswd
fi

# Step 2: Get git info
cd "$PROJECT_DIR" || exit 1
COMMIT_HASH=$(git rev-parse HEAD)
TAG=$(git describe --tags --always 2>/dev/null || echo "no-tag")

echo "📋 Git Information:"
echo "   Commit: $COMMIT_HASH"
echo "   Tag: $TAG"
echo ""

# Step 3: Deploy
echo "🚀 Step 2: Deploying..."
docker compose -f docker-compose.staging.yml pull
docker compose -f docker-compose.staging.yml up -d
sleep 15

# Step 4: Migrate
echo "🗄️  Step 3: Migrating database..."
docker compose -f docker-compose.staging.yml exec -T backend npx prisma migrate deploy

# Step 5: Health check
echo "🏥 Step 4: Health check..."
docker compose -f docker-compose.staging.yml exec -T backend node scripts/healthcheck.js

# Step 6: Verify auth (401 without creds)
echo "🔐 Step 5: Verifying authentication..."
NO_AUTH_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$STAGING_URL/api/health")
if [ "$NO_AUTH_RESPONSE" = "401" ]; then
    echo "   ✅ 401 on missing credentials (correct)"
else
    echo "   ⚠️  Expected 401, got $NO_AUTH_RESPONSE"
fi

# Step 7: Get metrics snapshot
echo "📊 Step 6: Getting metrics snapshot..."
METRICS=$(curl -s -u "$STAGING_USER:$STAGING_PASS" "$STAGING_URL/api/metrics")
echo "$METRICS" | jq '.' 2>/dev/null || echo "$METRICS"

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "📋 DELIVERABLES:"
echo "   Staging URL: $STAGING_URL"
echo "   Basic Auth: $STAGING_USER / $STAGING_PASS"
echo "   Commit: $COMMIT_HASH"
echo "   Tag: $TAG"
echo ""
echo "🧪 Next: Run tests and collect CI artifacts"

# Save credentials for summary
echo "$STAGING_USER:$STAGING_PASS" > .staging-credentials.txt 2>/dev/null || true

