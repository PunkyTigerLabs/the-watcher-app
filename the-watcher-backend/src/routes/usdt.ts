// ============================================
// THE WATCHER — USDT Routes
// ============================================

import { Router } from 'express';
import { getDb, getEvents, getEventStats, getTopFlows, getSnapshot, saveSnapshot, getDailyMintBurn } from '../db';
import { generateHeadline } from '../engine/headlines';
import { DISPLAY_LIMITS } from '../config';

const router = Router();

/**
 * GET /usdt/overview (FREE)
 * Includes BOTH Ethereum and Tron events, merged by timestamp.
 */
router.get('/overview', async (_req, res) => {
  try {
    const stats = getEventStats('USDT', 24);
    const events = getEvents('USDT', {
      limit: DISPLAY_LIMITS.FREE.EVENTS,
      minRelevance: DISPLAY_LIMITS.FREE.MIN_RELEVANCE,
    });
    const topInflows = getTopFlows('USDT', 'in', DISPLAY_LIMITS.FREE.TOP_FLOWS);
    const topOutflows = getTopFlows('USDT', 'out', DISPLAY_LIMITS.FREE.TOP_FLOWS);

    // Calculate Tron share
    const { tronVolume, ethVolume } = getTronShare();

    const biggestEvent = events[0];
    const headline = generateHeadline({
      token: 'USDT',
      mints24h: stats.mints,
      burns24h: stats.burns,
      net24h: stats.mints - stats.burns,
      totalVolume: stats.totalVolume,
      eventCount: stats.eventCount,
      tronVolume,
      ethVolume,
      biggestEntity: biggestEvent?.to_entity || biggestEvent?.from_entity,
      biggestAmount: biggestEvent?.amount,
      biggestType: biggestEvent?.type,
      biggestEntityType: biggestEvent?.to_entity_type || biggestEvent?.from_entity_type,
    });

    const totalVol = tronVolume + ethVolume;
    const tronShare = totalVol > 0 ? tronVolume / totalVol : 0;

    // Get supply: token-contract snapshot first, then CoinGecko market_supply.
    const supplySnapshot = getSnapshot('supply_usdt');
    const marketSupplySnapshot = getSnapshot('market_supply');
    const totalSupply =
      supplySnapshot?.data?.totalSupply ||
      marketSupplySnapshot?.data?.usdt ||
      0;

    const chartData = getDailyMintBurn('USDT');

    // Merge topInflows and topOutflows into single topFlows array
    const topFlows = [
      ...topInflows.map((f: any) => ({
        txHash: f.txHash || '',
        token: 'USDT',
        type: 'TRANSFER',
        amount: f.totalAmount,
        from: f.entity,
        fromLabel: f.entity,
        from_entity_type: f.entityType,
        to: '',
        toLabel: null,
        chain: 'ETH',
        timestamp: f.lastSeen,
        relevance: 'high',
      })),
      ...topOutflows.map((f: any) => ({
        txHash: f.txHash || '',
        token: 'USDT',
        type: 'TRANSFER',
        amount: f.totalAmount,
        from: '',
        fromLabel: null,
        to: f.entity,
        toLabel: f.entity,
        to_entity_type: f.entityType,
        chain: 'ETH',
        timestamp: f.lastSeen,
        relevance: 'high',
      })),
    ];

    const response = {
      headline,
      minted24h: stats.mints,
      burned24h: stats.burns,
      net24h: stats.mints - stats.burns,
      eventCount: stats.eventCount,
      topFlows,
      tronShare: Math.round(tronShare * 100),
      chartData: chartData.map((d: any) => ({ day: d.day, mint: d.mint, burn: d.burn })),
      stats: {
        totalSupply,
      },
      lastUpdated: new Date().toISOString(),
      status: stats.eventCount > 0 || topFlows.length > 0 ? 'live' : 'demo',
    };

    saveSnapshot('usdt_overview', response);
    res.json(response);
  } catch (error) {
    console.error('[USDT] Overview error:', error);
    const snapshot = getSnapshot('usdt_overview');
    if (snapshot) {
      return res.json({ ...snapshot.data, status: 'snapshot', updatedAt: snapshot.updatedAt });
    }
    res.status(500).json({ error: 'Failed to fetch USDT overview' });
  }
});

/**
 * GET /usdt/events (PRO)
 */
router.get('/events', (_req, res) => {
  try {
    const events = getEvents('USDT', {
      limit: DISPLAY_LIMITS.PRO.EVENTS,
      minRelevance: DISPLAY_LIMITS.PRO.MIN_RELEVANCE,
    });

    const chartData = get7DayChart('USDT');
    const { tronVolume, ethVolume } = getTronShare();
    const totalVol = tronVolume + ethVolume;

    res.json({
      events: events.map(mapEvent),
      chartData,
      tronShare: totalVol > 0 ? Math.round((tronVolume / totalVol) * 100) : 0,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch USDT events' });
  }
});

router.get('/stats', (_req, res) => {
  try {
    const stats24h = getEventStats('USDT', 24);
    const stats7d = getEventStats('USDT', 168);
    const { tronVolume, ethVolume } = getTronShare();
    res.json({ stats24h, stats7d, tronVolume, ethVolume, updatedAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch USDT stats' });
  }
});

function getTronShare(): { tronVolume: number; ethVolume: number } {
  const db = getDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const result = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN chain = 'TRON' THEN amount ELSE 0 END), 0) as tronVolume,
      COALESCE(SUM(CASE WHEN chain = 'ETH' THEN amount ELSE 0 END), 0) as ethVolume
    FROM events
    WHERE token = 'USDT' AND timestamp >= ?
  `).get(since) as any;
  return { tronVolume: result.tronVolume, ethVolume: result.ethVolume };
}

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

function get7DayChart(token: string) {
  const db = getDb();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return db.prepare(`
    SELECT
      DATE(timestamp) as date,
      COALESCE(SUM(CASE WHEN type = 'MINT' THEN amount ELSE 0 END), 0) as mints,
      COALESCE(SUM(CASE WHEN type = 'BURN' THEN amount ELSE 0 END), 0) as burns
    FROM events WHERE token = ? AND timestamp >= ?
    GROUP BY DATE(timestamp) ORDER BY date ASC
  `).all(token, since);
}

export default router;
