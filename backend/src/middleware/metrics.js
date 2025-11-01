// WebSocket event latency metrics
const wsEventMetrics = {
  events: new Map(), // Map<eventName, latency[]>
  startTimes: new Map(), // Map<socketId_eventName, timestamp>
};

export function startEventTimer(socketId, eventName) {
  const key = `${socketId}_${eventName}`;
  wsEventMetrics.startTimes.set(key, Date.now());
}

export function endEventTimer(socketId, eventName) {
  const key = `${socketId}_${eventName}`;
  const startTime = wsEventMetrics.startTimes.get(key);
  
  if (!startTime) return null;
  
  const latency = Date.now() - startTime;
  wsEventMetrics.startTimes.delete(key);
  
  if (!wsEventMetrics.events.has(eventName)) {
    wsEventMetrics.events.set(eventName, []);
  }
  
  const latencies = wsEventMetrics.events.get(eventName);
  latencies.push(latency);
  
  // Keep only last 1000 measurements
  if (latencies.length > 1000) {
    latencies.shift();
  }
  
  return latency;
}

export function getEventMetrics() {
  const metrics = {};
  
  for (const [eventName, latencies] of wsEventMetrics.events.entries()) {
    if (latencies.length === 0) continue;
    
    const sorted = [...latencies].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    
    metrics[eventName] = {
      count: latencies.length,
      avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      min: Math.min(...latencies),
      max: Math.max(...latencies),
      p50,
      p95,
      p99,
    };
  }
  
  return metrics;
}

export function getOverallMetrics() {
  const allLatencies = [];
  for (const latencies of wsEventMetrics.events.values()) {
    allLatencies.push(...latencies);
  }
  
  if (allLatencies.length === 0) {
    return { count: 0, avg: 0, p95: 0 };
  }
  
  const sorted = [...allLatencies].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  
  return {
    count: allLatencies.length,
    avg: allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length,
    p95,
  };
}

