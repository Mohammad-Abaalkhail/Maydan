import express from 'express';
import { getEventMetrics, getOverallMetrics } from '../middleware/metrics.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/metrics
 * Get WebSocket event latency metrics
 */
router.get('/', (req, res) => {
  try {
    const eventMetrics = getEventMetrics();
    const overallMetrics = getOverallMetrics();
    
    res.json({
      events: eventMetrics,
      overall: overallMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching metrics', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

export default router;

