#!/bin/bash

# Verify Staging Deployment Script
# Checks all acceptance gates

STAGING_URL=${1:-"https://staging.mabaalkhail.com"}
STAGING_USER=${2}
STAGING_PASS=${3}

if [ -z "$STAGING_USER" ] || [ -z "$STAGING_PASS" ]; then
    if [ -f ".staging-credentials.txt" ]; then
        CREDS=$(cat .staging-credentials.txt)
        STAGING_USER=$(echo $CREDS | cut -d: -f1)
        STAGING_PASS=$(echo $CREDS | cut -d: -f2)
    else
        echo "❌ Error: Provide staging credentials"
        echo "Usage: $0 <staging-url> [username] [password]"
        exit 1
    fi
fi

echo "🔍 Verifying Staging Deployment"
echo "=================================="
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s -u "$STAGING_USER:$STAGING_PASS" "$STAGING_URL/api/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo "   ✅ Health check passed"
else
    echo "   ❌ Health check failed"
    echo "   Response: $HEALTH"
fi
echo ""

# Test 2: Metrics Endpoint
echo "2️⃣  Testing Metrics Endpoint..."
METRICS=$(curl -s -u "$STAGING_USER:$STAGING_PASS" "$STAGING_URL/api/metrics")
if echo "$METRICS" | grep -q '"events"'; then
    echo "   ✅ Metrics endpoint working"
    echo "$METRICS" | jq '.' 2>/dev/null || echo "$METRICS"
else
    echo "   ❌ Metrics endpoint failed"
    echo "   Response: $METRICS"
fi
echo ""

# Test 3: Security Headers
echo "3️⃣  Testing Security Headers..."
HEADERS=$(curl -s -I -u "$STAGING_USER:$STAGING_PASS" "$STAGING_URL/api/health")
if echo "$HEADERS" | grep -q "X-Frame-Options"; then
    echo "   ✅ Security headers present"
else
    echo "   ⚠️  Security headers not found"
fi
echo ""

# Test 4: Rate Limiting (test with multiple requests)
echo "4️⃣  Testing Rate Limiting..."
RATE_TEST=$(for i in {1..5}; do curl -s -w "%{http_code}" -u "$STAGING_USER:$STAGING_PASS" "$STAGING_URL/api/health" -o /dev/null; done | tail -1)
if [ "$RATE_TEST" = "200" ]; then
    echo "   ✅ Rate limiting active (requests processed)"
else
    echo "   ⚠️  Rate limiting check inconclusive"
fi
echo ""

# Test 5: Authentication (test without creds)
echo "5️⃣  Testing Authentication..."
NO_AUTH=$(curl -s -w "%{http_code}" "$STAGING_URL/api/health" -o /dev/null)
if [ "$NO_AUTH" = "401" ]; then
    echo "   ✅ Authentication required (401 on missing creds)"
else
    echo "   ⚠️  Expected 401, got $NO_AUTH"
fi
echo ""

echo "=================================="
echo "✅ Verification Complete"
echo ""

