#!/bin/bash

# Get Deployment Information Script
# Outputs all required deployment info

STAGING_URL=${1:-"https://staging.mabaalkhail.com"}

echo "📊 Staging Deployment Information"
echo "=================================="
echo ""

# Get commit hash
COMMIT_HASH=$(git rev-parse HEAD)
echo "Commit Hash: $COMMIT_HASH"

# Get tag
TAG=$(git describe --tags --always 2>/dev/null || echo "no-tag")
echo "Tag: $TAG"

# Get staging URL
echo "Staging URL: $STAGING_URL"

# Get basic auth (if credentials file exists)
if [ -f ".staging-credentials.txt" ]; then
    CREDS=$(cat .staging-credentials.txt)
    USERNAME=$(echo $CREDS | cut -d: -f1)
    PASSWORD=$(echo $CREDS | cut -d: -f2)
    echo "Basic Auth Username: $USERNAME"
    echo "Basic Auth Password: $PASSWORD"
else
    echo "Basic Auth: Not set (run deployment script first)"
fi

echo ""
echo "🔗 CI Artifacts:"
echo "   Playwright Report: https://github.com/<repo>/actions/runs/<run-id>"
echo "   Load Test Logs: https://github.com/<repo>/actions/runs/<run-id>"
echo ""
echo "📊 Metrics Endpoint:"
echo "   curl -u <username>:<password> $STAGING_URL/api/metrics"
echo ""

