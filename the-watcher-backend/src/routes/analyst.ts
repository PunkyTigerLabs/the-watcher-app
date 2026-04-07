// ============================================
// THE WATCHER — AI Analyst Route
// ============================================

import { Router } from 'express';
import fetch from 'node-fetch';
import { getDb, getEventStats, getSnapshot, saveSnapshot } from '../db';
import { SERVER } from '../config';

const router = Router();

/**
 * GET /analyst (PRO)
 * AI-generated narrative via Claude API.
 * Cached for 1 hour.
 */
router.get('/', async (_req, res) => {
  try {
    // Check cache first
    const db = getDb();
    const cached = db.prepare(`
      SELECT narrative, timestamp FROM analyst_cache
      WHERE expires_at > datetime('now')
      ORDER BY timestamp DESC LIMIT 1
    `).get() as any;

    if (cached) {
      return res.json({
        narrative: cached.narrative,
        generatedAt: cached.timestamp,
        cached: true,
      });
    }

    // Generate new narrative
    if (!SERVER.ENABLE_ANALYST || !SERVER.ANTHROPIC_API_KEY) {
      return res.json({
        narrative: 'AI Flow Analyst is not enabled. Configure ANTHROPIC_API_KEY and set ENABLE_ANALYST=true.',
        generatedAt: new Date().toISOString(),
        cached: false,
      });
    }

    const summary = buildSummary();
    const narrative = await callClaude(summary);

    // Cache for 1 hour
    db.prepare(`
      INSERT INTO analyst_cache (timestamp, narrative, expires_at)
      VALUES (datetime('now'), ?, datetime('now', '+1 hour'))
    `).run(narrative);

    res.json({
      narrative,
      generatedAt: new Date().toISOString(),
      cached: false,
    });
  } catch (error) {
    console.error('[Analyst] Error:', error);
    res.status(500).json({ error: 'Failed to generate analyst narrative' });
  }
});

function buildSummary() {
  const usdcStats = getEventStats('USDC', 24);
  const usdtStats = getEventStats('USDT', 24);
  const fearGreed = getSnapshot('fear_greed');

  return {
    usdc: {
      minted24h: usdcStats.mints,
      burned24h: usdcStats.burns,
      net24h: usdcStats.mints - usdcStats.burns,
      eventCount: usdcStats.eventCount,
    },
    usdt: {
      minted24h: usdtStats.mints,
      burned24h: usdtStats.burns,
      net24h: usdtStats.mints - usdtStats.burns,
      eventCount: usdtStats.eventCount,
    },
    fearGreed: fearGreed?.data || null,
    timestamp: new Date().toISOString(),
  };
}

async function callClaude(summary: any): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': SERVER.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are The Watcher's Flow Analyst. Analyze these stablecoin flows from the last 24 hours and provide a 2-3 paragraph intelligence briefing. Be direct. No disclaimers. Write like a Bloomberg terminal analyst. Focus on what matters for capital allocation decisions.\n\nData: ${JSON.stringify(summary)}`,
      }],
    }),
  });

  const data = (await response.json()) as any;

  if (data.content && data.content[0]) {
    return data.content[0].text;
  }

  return 'Unable to generate analyst narrative at this time.';
}

export default router;
