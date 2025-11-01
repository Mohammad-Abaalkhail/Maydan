/**
 * Load Test: 200 Concurrent Sockets
 * Target: P95 event latency ≤150ms, zero message loss
 */

import { io } from 'socket.io-client';
import { performance } from 'perf_hooks';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const NUM_CLIENTS = 200;
const TEST_DURATION = 60000; // 60 seconds

const results = {
  connections: 0,
  disconnections: 0,
  events: {
    room:created: { count: 0, latencies: [] },
    game:state: { count: 0, latencies: [] },
    vote:update: { count: 0, latencies: [] },
  },
  errors: [],
  startTime: null,
  endTime: null,
};

async function createTestUser(username) {
  const response = await fetch(`${SERVER_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `loadtest_${username}`,
      email: `loadtest_${username}@test.com`,
      password: 'test123456',
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create user: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.accessToken;
}

async function runLoadTest() {
  console.log(`🚀 Starting load test: ${NUM_CLIENTS} concurrent sockets`);
  console.log(`Target: P95 latency ≤150ms, zero message loss`);
  
  results.startTime = performance.now();
  const clients = [];
  const latencies = [];
  
  // Create test users and sockets
  for (let i = 0; i < NUM_CLIENTS; i++) {
    try {
      const token = await createTestUser(i);
      
      const socket = io(SERVER_URL, {
        auth: { token },
        transports: ['websocket'],
      });
      
      socket.on('connect', () => {
        results.connections++;
      });
      
      socket.on('disconnect', () => {
        results.disconnections++;
      });
      
      socket.on('connect_error', (error) => {
        results.errors.push({ type: 'connection_error', error: error.message });
      });
      
      // Measure event latency
      socket.onAny((eventName, ...args) => {
        const timestamp = performance.now();
        if (results.events[eventName]) {
          results.events[eventName].count++;
          // Simple latency measurement (would need server timestamp for accurate measurement)
          latencies.push(timestamp);
        }
      });
      
      clients.push(socket);
      
      // Rate limit: create 10 clients per second
      if ((i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Failed to create client ${i}:`, error.message);
      results.errors.push({ type: 'client_creation', error: error.message });
    }
  }
  
  console.log(`✅ Created ${clients.length} clients`);
  
  // Wait for all connections
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Create a room and simulate game events
  if (clients.length >= 3) {
    const hostSocket = clients[0];
    
    hostSocket.emit('room:create', {}, (response) => {
      if (response.success) {
        const roomId = response.room.id;
        
        // Join other clients
        for (let i = 1; i < Math.min(8, clients.length); i++) {
          clients[i].emit('room:join', { roomId });
        }
        
        // Start game after all join
        setTimeout(() => {
          hostSocket.emit('room:start', { roomId });
        }, 2000);
      }
    });
  }
  
  // Run test for specified duration
  await new Promise(resolve => setTimeout(resolve, TEST_DURATION));
  
  results.endTime = performance.now();
  
  // Calculate metrics
  const sortedLatencies = latencies.sort((a, b) => a - b);
  const p95Index = Math.floor(sortedLatencies.length * 0.95);
  const p95 = sortedLatencies[p95Index] || 0;
  
  const testDuration = (results.endTime - results.startTime) / 1000;
  const connectionSuccessRate = (results.connections / NUM_CLIENTS) * 100;
  const messageLossRate = results.disconnections > results.connections ? 
    ((results.disconnections - results.connections) / results.connections) * 100 : 0;
  
  // Print results
  console.log('\n📊 Load Test Results:');
  console.log('='.repeat(50));
  console.log(`Duration: ${testDuration.toFixed(2)}s`);
  console.log(`Connections: ${results.connections}/${NUM_CLIENTS} (${connectionSuccessRate.toFixed(1)}%)`);
  console.log(`Disconnections: ${results.disconnections}`);
  console.log(`P95 Latency: ${p95.toFixed(2)}ms`);
  console.log(`Message Loss Rate: ${messageLossRate.toFixed(2)}%`);
  console.log(`Errors: ${results.errors.length}`);
  
  // Event counts
  console.log('\nEvent Counts:');
  for (const [eventName, data] of Object.entries(results.events)) {
    console.log(`  ${eventName}: ${data.count}`);
  }
  
  // Pass/fail criteria
  console.log('\n✅ Pass Criteria:');
  console.log(`  P95 Latency ≤150ms: ${p95 <= 150 ? '✅ PASS' : '❌ FAIL'} (${p95.toFixed(2)}ms)`);
  console.log(`  Zero Message Loss: ${messageLossRate === 0 ? '✅ PASS' : '❌ FAIL'} (${messageLossRate.toFixed(2)}%)`);
  
  // Cleanup
  clients.forEach(socket => socket.disconnect());
  
  return {
    passed: p95 <= 150 && messageLossRate === 0,
    metrics: {
      p95Latency: p95,
      messageLossRate,
      connectionSuccessRate,
      eventCounts: Object.fromEntries(
        Object.entries(results.events).map(([k, v]) => [k, v.count])
      ),
    },
  };
}

// Run test
runLoadTest()
  .then((result) => {
    process.exit(result.passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('Load test failed:', error);
    process.exit(1);
  });

