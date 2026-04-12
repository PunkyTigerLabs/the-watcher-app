// ============================================
// THE WATCHER — Signal Routes
// ============================================

import { Router } from 'express';
import { getSignalHistory, getSnapshot, saveSnapshot, getActivePatterns, getDb } from '../db';

const router = Router();

/**
 * GET /signal
 * FREE: returns score + label only
 * PRO (?full=true): returns full SignalResult
 */
router.get('/', (_req, res) => {
  try {
    const history = getSignalHistory(1);
    const latest = history[0];

    if (!latest) {
      return res.json({
        score: 0,
        label: 'NEUTRAL',
        updatedAt: new Date().toISOString(),
        message: 'Signal not yet computed. Waiting for data.',
      });
    }

    const isFull = _req.query.full === 'true';

    if (isFull) {
      // PRO response
      res.json({
        score: latest.score,
        label: latest.label,
        headline: latest.headline,
        subscores: {
          usdc: latest.usdc_subscore,
          usdt: latest.usdt_subscore,
          whales: latest.whale_subscore,
          divergence: latest.divergence_subscore,
          sentiment: latest.sentiment_subscore,
        },
        divergenceNote: latest.divergence_note,
        decisionContext: JSON.parse(latest.decision_context || '[]'),
        updatedAt: latest.timestamp,
      });
    } else {
      // FREE response
      res.json({
        score: latest.score,
        label: latest.label,
        updatedAt: latest.timestamp,
      });
    }
  } catch (error) {
    console.error('[Signal] Error:', error);
    res.status(500).json({ error: 'Failed to fetch signal' });
  }
});

/**
 * GET /signal/history?limit=30
 */
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 30;
    const history = getSignalHistory(limit);

    res.json({
      history: history.map((h: any) => ({
        timestamp: h.timestamp,
        score: h.score,
        label: h.label,
      })),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch signal history' });
  }
});

/**
 * GET /signal/patterns (PRO)
 * Returns active patterns detected in market.
 */
router.get('/patterns', (_req, res) => {
  try {
    const patterns = getActivePatterns();
    res.json({
      patterns: patterns.map((p: any) => ({
        id: p.id,
        pattern: p.pattern,
        severity: p.severity,
        message: p.message,
        timestamp: p.timestamp,
        active: p.active === 1,
      })),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Signal] Patterns error:', error);
    res.status(500).json({ error: 'Failed to fetch patterns' });
  }
});

/**
 * GET /signal/exchange-flows
 * Inflows/outflows per token split by exchange tier. This is the "smart money"
 * signal — when CEX inflows dominate, capital is positioning to sell; when
 * outflows dominate, it's positioning to hold. Divergence between USDC and
 * USDT patterns here tells you whether onshore vs offshore desks disagree.
 */
router.get('/exchange-flows', (_req, res) => {
  try {
    const db = getDb();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const compute = (token: string) => {
      const rows = db.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN to_entity_type = 'CEX' THEN amount ELSE 0 END), 0) as inflows,
          COALESCE(SUM(CASE WHEN from_entity_type = 'CEX' THEN amount ELSE 0 END), 0) as outflows,
          COALESCE(SUM(CASE WHEN to_entity_type = 'CEX' THEN 1 ELSE 0 END), 0) as inflowCount,
          COALESCE(SUM(CASE WHEN from_entity_type = 'CEX' THEN 1 ELSE 0 END), 0) as outflowCount
        FROM events WHERE token = ? AND timestamp >= ?
      `).get(token, since) as any;

      const inflows = Number(rows?.inflows || 0);
      const outflows = Number(rows?.outflows || 0);
      const net = outflows - inflows; // positive = outflows dominant = accumulation
      const total = inflows + outflows;
      const bias = total > 0 ? net / total : 0;

      // Break down by exchange name for the institutional feel
      const byExchangeIn = db.prepare(`
        SELECT to_entity as ex, COALESCE(SUM(amount), 0) as vol
        FROM events
        WHERE token = ? AND timestamp >= ? AND to_entity_type = 'CEX'
        GROUP BY to_entity
        ORDER BY vol DESC
        LIMIT 5
      `).all(token, since);

      const byExchangeOut = db.prepare(`
        SELECT from_entity as ex, COALESCE(SUM(amount), 0) as vol
        FROM events
        WHERE token = ? AND timestamp >= ? AND from_entity_type = 'CEX'
        GROUP BY from_entity
        ORDER BY vol DESC
        LIMIT 5
      `).all(token, since);

      return {
        inflows,
        outflows,
        net,
        bias, // -1 (all inflows) .. +1 (all outflows)
        inflowCount: Number(rows?.inflowCount || 0),
        outflowCount: Number(rows?.outflowCount || 0),
        topInflows: byExchangeIn,
        topOutflows: byExchangeOut,
      };
    };

    const usdc = compute('USDC');
    const usdt = compute('USDT');

    // Divergence headline: are onshore (USDC → Coinbase/Kraken) and offshore
    // (USDT → Binance/OKX) desks positioning the same way?
    const biasDiff = usdc.bias - usdt.bias;
    let divergence = 'ALIGNED';
    if (Math.abs(biasDiff) > 0.4) divergence = 'STRONG_DIVERGENCE';
    else if (Math.abs(biasDiff) > 0.15) divergence = 'MILD_DIVERGENCE';

    res.json({
      usdc,
      usdt,
      divergence,
      biasDiff,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Signal] Exchange flows error:', error);
    res.status(500).json({ error: 'Failed to compute exchange flows' });
  }
});

export default router;
