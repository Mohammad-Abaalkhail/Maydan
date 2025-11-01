#!/bin/bash

# Staging Deployment Execution Script
# This script executes the full staging deployment process

set -e

echo "🚀 Starting Staging Deployment Execution"
echo "=========================================="
echo ""

# Step 1: Generate rotated basic auth
echo "📝 Step 1: Generating rotated basic auth credentials..."
STAGING_USER=$(openssl rand -hex 8)
STAGING_PASS=$(openssl rand -hex 16)
echo "✅ Generated credentials:"
echo "   Username: $STAGING_USER"
echo "   Password: $STAGING_PASS"
echo ""

# Save credentials to file
echo "$STAGING_USER:$STAGING_PASS" > .staging-credentials.txt
echo "💾 Credentials saved to .staging-credentials.txt"

# Create auth file
mkdir -p nginx/auth
if command -v htpasswd &> /dev/null; then
    htpasswd -bc nginx/auth/.htpasswd "$STAGING_USER" "$STAGING_PASS" 2>/dev/null || \
      echo "$STAGING_USER:$(openssl passwd -apr1 $STAGING_PASS)" > nginx/auth/.htpasswd
else
    echo "$STAGING_USER:$(openssl passwd -apr1 $STAGING_PASS)" > nginx/auth/.htpasswd
fi
echo "✅ Created nginx/auth/.htpasswd"
echo ""

# Step 2: Verify environment file exists
if [ ! -f ".env.staging" ]; then
    echo "⚠️  Warning: .env.staging not found"
    echo "   Creating from .env.staging.example..."
    cp .env.staging.example .env.staging
    echo "   Please edit .env.staging with your values"
    exit 1
fi

# Step 3: Pull Docker images
echo "📥 Step 2: Pulling Docker images..."
docker compose -f docker-compose.staging.yml pull
echo "✅ Images pulled"
echo ""

# Step 4: Start services
echo "🚀 Step 3: Starting services..."
docker compose -f docker-compose.staging.yml up -d
echo "✅ Services started"
echo ""

# Step 5: Wait for services
echo "⏳ Step 4: Waiting for services to be ready..."
sleep 15
echo "✅ Wait complete"
echo ""

# Step 6: Run migrations
echo "🗄️  Step 5: Running database migrations..."
docker compose -f docker-compose.staging.yml exec -T backend npx prisma migrate deploy
echo "✅ Migrations complete"
echo ""

# Step 7: Health check
echo "🏥 Step 6: Running health check..."
docker compose -f docker-compose.staging.yml exec -T backend node scripts/healthcheck.js
echo "✅ Health check passed"
echo ""

# Step 8: Get deployment info
echo "📊 Step 7: Gathering deployment information..."
COMMIT_HASH=$(git rev-parse HEAD)
TAG=$(git describe --tags --always 2>/dev/null || echo "no-tag")
STAGING_URL=${STAGING_URL:-"https://staging.mabaalkhail.com"}

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "📋 Deployment Information:"
echo "   Staging URL: $STAGING_URL"
echo "   Username: $STAGING_USER"
echo "   Password: $STAGING_PASS"
echo "   Commit: $COMMIT_HASH"
echo "   Tag: $TAG"
echo ""
echo "🔍 Next Steps:"
echo "   1. Run E2E tests: ./scripts/run-e2e-staging.sh $STAGING_URL $STAGING_USER $STAGING_PASS"
echo "   2. Run load test: ./scripts/run-load-test.sh $STAGING_URL"
echo "   3. Check metrics: curl -u $STAGING_USER:$STAGING_PASS $STAGING_URL/api/metrics"
echo ""

