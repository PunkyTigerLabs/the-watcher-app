// ============================================
// THE WATCHER — Intel Routes
// ============================================

import { Router } from 'express';
import { getRecentNews, getSnapshot, saveSnapshot } from '../db';

const router = Router();

/**
 * GET /intel/news (PRO)
 * Filtered stablecoin-relevant news only.
 */
router.get('/news', (_req, res) => {
  try {
    const news = getRecentNews(20);
    const mapped = news.map((item: any) => ({
      id: item.id,
      timestamp: item.timestamp,
      source: item.source,
      title: item.title,
      url: item.url,
      sentiment: item.sentiment,
      relevantTokens: JSON.parse(item.relevant_tokens || '[]'),
      score: item.score,
    }));

    res.json({
      news: mapped,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Intel] News error:', error);
    const snapshot = getSnapshot('intel_news');
    if (snapshot) {
      return res.json({ ...snapshot.data, status: 'snapshot' });
    }
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

/**
 * GET /intel/feargreed (PRO)
 */
router.get('/feargreed', (_req, res) => {
  try {
    const snapshot = getSnapshot('fear_greed');
    if (snapshot) {
      return res.json(snapshot.data);
    }
    res.json({ value: null, classification: 'Unknown', message: 'Fear & Greed not yet fetched' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Fear & Greed' });
  }
});

export default router;
