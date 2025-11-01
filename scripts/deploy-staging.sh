#!/bin/bash

# Staging Deployment Script
# Usage: ./scripts/deploy-staging.sh

set -e

echo "🚀 Starting staging deployment..."

# Generate random basic auth credentials
STAGING_USER=$(openssl rand -hex 8)
STAGING_PASS=$(openssl rand -hex 16)

echo "📝 Generated staging credentials:"
echo "   Username: $STAGING_USER"
echo "   Password: $STAGING_PASS"
echo ""
echo "⚠️  Save these credentials securely!"

# Create staging auth file
mkdir -p nginx/auth
htpasswd -bc nginx/auth/.htpasswd "$STAGING_USER" "$STAGING_PASS" 2>/dev/null || \
  echo "$STAGING_USER:$(openssl passwd -apr1 $STAGING_PASS)" > nginx/auth/.htpasswd

echo "✅ Created staging auth file"

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker compose -f docker-compose.staging.yml pull

# Start services
echo "🚀 Starting services..."
docker compose -f docker-compose.staging.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Run migrations
echo "🗄️  Running database migrations..."
docker compose -f docker-compose.staging.yml exec -T backend npx prisma migrate deploy

# Health check
echo "🏥 Running health check..."
docker compose -f docker-compose.staging.yml exec -T backend node scripts/healthcheck.js

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Staging Information:"
echo "   URL: http://staging-url/"
echo "   Username: $STAGING_USER"
echo "   Password: $STAGING_PASS"
echo ""
echo "🔍 Verify deployment:"
echo "   curl -u $STAGING_USER:$STAGING_PASS http://staging-url/api/health"

