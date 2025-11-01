#!/bin/bash

# Run Load Test
# Usage: ./scripts/run-load-test.sh [server-url]

SERVER_URL=${1:-http://localhost:3000}

echo "📊 Running load test..."
echo "   Target: 200 concurrent sockets"
echo "   SLO: P95 ≤150ms, zero message loss"
echo "   Server: $SERVER_URL"

cd tests/load

SERVER_URL=$SERVER_URL node load-test.js

echo ""
echo "✅ Load test complete!"

