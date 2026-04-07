// ============================================
// THE WATCHER — USDC Routes
// ============================================

import { Router } from 'express';
import { getEvents, getEventStats, getTopFlows, getSnapshot, saveSnapshot } from '../db';
import { generateHeadline } from '../engine/headlines';
import { DISPLAY_LIMITS } from '../config';
import { fetchTokenSupply } from '../services/etherscan';
import { CONTRACTS } from '../config';

const router = Router();

/**
 * GET /usdc/overview (FREE)
 * Summary for free USDC tab.
 */
router.get('/overview', async (_req, res) => {
  try {
    const stats = getEventStats('USDC', 24);
    const events = getEvents('USDC', {
      limit: DISPLAY_LIMITS.FREE.EVENTS,
      minRelevance: DISPLAY_LIMITS.FREE.MIN_RELEVANCE,
    });
    const topInflows = getTopFlows('USDC', 'in', DISPLAY_LIMITS.FREE.TOP_FLOWS);
    const topOutflows = getTopFlows('USDC', 'out', DISPLAY_LIMITS.FREE.TOP_FLOWS);

    // Find biggest event for headline context
    const biggestEvent = events[0];
    const headline = generateHeadline({
      token: 'USDC',
      mints24h: stats.mints,
      burns24h: stats.burns,
      net24h: stats.mints - stats.burns,
      totalVolume: stats.totalVolume,
      eventCount: stats.eventCount,
      biggestEntity: biggestEvent?.to_entity || biggestEvent?.from_entity,
      biggestAmount: biggestEvent?.amount,
      biggestType: biggestEvent?.type,
      biggestEntityType: biggestEvent?.to_entity_type || biggestEvent?.from_entity_type,
    });

    const response = {
      token: 'USDC',
      status: events.length > 0 ? 'live' : 'demo',
      updatedAt: new Date().toISOString(),
      headline,
      stats: {
        printed24h: stats.mints,
        burned24h: stats.burns,
        net24h: stats.mints - stats.burns,
        totalSupply: 0, // Will be populated by supply cron
      },
      events: events.map(mapEvent),
      topInflows: topInflows.map((f: any) => ({
        entity: f.entity,
        entityType: f.entityType,
        totalAmount: f.totalAmount,
        eventCount: f.eventCount,
        direction: 'in',
        lastSeen: f.lastSeen,
      })),
      topOutflows: topOutflows.map((f: any) => ({
        entity: f.entity,
        entityType: f.entityType,
        totalAmount: f.totalAmount,
        eventCount: f.eventCount,
        direction: 'out',
        lastSeen: f.lastSeen,
      })),
    };

    // Save snapshot for fallback
    saveSnapshot('usdc_overview', response);

    res.json(response);
  } catch (error) {
    console.error('[USDC] Overview error:', error);
    // Try fallback
    const snapshot = getSnapshot('usdc_overview');
    if (snapshot) {
      return res.json({ ...snapshot.data, status: 'snapshot', updatedAt: snapshot.updatedAt });
    }
    res.status(500).json({ error: 'Failed to fetch USDC overview' });
  }
});

/**
 * GET /usdc/events (PRO)
 * Full event stream with chart data.
 */
router.get('/events', (req, res) => {
  try {
    const events = getEvents('USDC', {
      limit: DISPLAY_LIMITS.PRO.EVENTS,
      minRelevance: DISPLAY_LIMITS.PRO.MIN_RELEVANCE,
    });

    // 7-day chart data
    const chartData = get7DayChart('USDC');

    res.json({
      events: events.map(mapEvent),
      chartData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[USDC] Events error:', error);
    res.status(500).json({ error: 'Failed to fetch USDC events' });
  }
});

/**
 * GET /usdc/stats
 */
router.get('/stats', (_req, res) => {
  try {
    const stats24h = getEventStats('USDC', 24);
    const stats7d = getEventStats('USDC', 168);
    res.json({ stats24h, stats7d, updatedAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch USDC stats' });
  }
});

// Helper: map DB row to API response format
function mapEvent(row: any) {
  return {
    id: row.id,
    timestamp: row.timestamp,
    token: row.token,
    chain: row.chain,
    type: row.type,
    from: row.from_address,
    to: row.to_address,
    amount: row.amount,
    amountUsd: row.amount_usd,
    fromEntity: row.from_entity,
    toEntity: row.to_entity,
    fromEntityType: row.from_entity_type,
    toEntityType: row.to_entity_type,
    source: row.source,
    txHash: row.tx_hash,
    relevance: row.relevance,
  };
}

// Helper: 7-day mint/burn chart
function get7DayChart(token: string) {
  const { getDb } = require('../db');
  const db = getDb();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  return db.prepare(`
    SELECT
      DATE(timestamp) as date,
      COALESCE(SUM(CASE WHEN type = 'MINT' THEN amount ELSE 0 END), 0) as mints,
      COALESCE(SUM(CASE WHEN type = 'BURN' THEN amount ELSE 0 END), 0) as burns
    FROM events
    WHERE token = ? AND timestamp >= ?
    GROUP BY DATE(timestamp)
    ORDER BY date ASC
  `).all(token, since);
}

export default router;
