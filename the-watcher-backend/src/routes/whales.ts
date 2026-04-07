// ============================================
// THE WATCHER — Whales Routes
// ============================================

import { Router } from 'express';
import { getDb } from '../db';

const router = Router();

/**
 * GET /whales (PRO)
 * Top 20 whale wallets by 24h activity.
 */
router.get('/', (_req, res) => {
  try {
    const db = getDb();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Get top entities by volume (combining from and to activity)
    const whales = db.prepare(`
      SELECT
        entity,
        entityType,
        SUM(volume) as totalVolume,
        COUNT(*) as moveCount,
        MAX(lastAction) as lastAction,
        MAX(lastTimestamp) as lastSeen
      FROM (
        SELECT
          from_entity as entity,
          from_entity_type as entityType,
          SUM(amount) as volume,
          COUNT(*) as cnt,
          'sent' as lastAction,
          MAX(timestamp) as lastTimestamp
        FROM events
        WHERE timestamp >= ?
          AND from_entity != 'Unknown'
          AND from_entity_type IN ('Institutional', 'CEX', 'DeFi')
          AND amount >= 1000000
        GROUP BY from_entity

        UNION ALL

        SELECT
          to_entity as entity,
          to_entity_type as entityType,
          SUM(amount) as volume,
          COUNT(*) as cnt,
          'received' as lastAction,
          MAX(timestamp) as lastTimestamp
        FROM events
        WHERE timestamp >= ?
          AND to_entity != 'Unknown'
          AND to_entity_type IN ('Institutional', 'CEX', 'DeFi')
          AND amount >= 1000000
        GROUP BY to_entity
      )
      GROUP BY entity
      ORDER BY totalVolume DESC
      LIMIT 20
    `).all(since, since);

    res.json({
      whales: whales.map((w: any) => ({
        entity: w.entity,
        entityType: w.entityType,
        totalVolume: w.totalVolume,
        moveCount: w.moveCount,
        lastAction: w.lastAction,
        lastSeen: w.lastSeen,
      })),
      totalTracked: whales.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Whales] Error:', error);
    res.status(500).json({ error: 'Failed to fetch whales' });
  }
});

export default router;
