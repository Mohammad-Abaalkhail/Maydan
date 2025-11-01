#!/bin/bash

# Run E2E Tests on Staging
# Usage: ./scripts/run-e2e-staging.sh [staging-url] [username] [password]

STAGING_URL=${1:-http://staging-url}
STAGING_USER=${2:-staging}
STAGING_PASS=${3:-staging123}

echo "🧪 Running E2E tests on staging..."
echo "   URL: $STAGING_URL"
echo "   User: $STAGING_USER"

cd tests/e2e

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  npm install
fi

# Run Playwright tests
PLAYWRIGHT_BASE_URL=$STAGING_URL \
STAGING_AUTH_USER=$STAGING_USER \
STAGING_AUTH_PASS=$STAGING_PASS \
npx playwright test --reporter=html

echo ""
echo "✅ E2E tests complete!"
echo "📊 View report: tests/e2e/playwright-report/index.html"

