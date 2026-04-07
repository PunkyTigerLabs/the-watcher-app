// ============================================
// THE WATCHER — Signal Routes
// ============================================

import { Router } from 'express';
import { getSignalHistory, getSnapshot, saveSnapshot } from '../db';

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
 * GET /signal/history?days=30
 */
router.get('/history', (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const history = getSignalHistory(days);

    res.json({
      history: history.map((h: any) => ({
        date: h.timestamp,
        score: h.score,
        label: h.label,
      })),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch signal history' });
  }
});

export default router;
