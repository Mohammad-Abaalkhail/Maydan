/**
 * Health Check Script
 * Used to verify backend is healthy after deployment
 */

import http from 'http';

const HEALTH_URL = process.env.HEALTH_URL || 'http://localhost:3000/api/health';
const MAX_RETRIES = 10;
const RETRY_DELAY = 2000; // 2 seconds

async function checkHealth() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await new Promise((resolve, reject) => {
        const req = http.get(HEALTH_URL, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            resolve({ statusCode: res.statusCode, data });
          });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });

      if (response.statusCode === 200) {
        const health = JSON.parse(response.data);
        console.log('✅ Health check passed');
        console.log(`Status: ${health.status}`);
        console.log(`Uptime: ${health.uptime}s`);
        process.exit(0);
      } else {
        throw new Error(`Health check failed: ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`⏳ Attempt ${i + 1}/${MAX_RETRIES}: ${error.message}`);
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        console.error('❌ Health check failed after all retries');
        process.exit(1);
      }
    }
  }
}

checkHealth();

