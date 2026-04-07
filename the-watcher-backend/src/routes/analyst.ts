// ============================================
// THE WATCHER — AI Analyst Route (DeepSeek)
// ============================================
// Uses DeepSeek API (OpenAI-compatible) for AI intelligence briefings.
// Much cheaper than Claude/GPT — same quality for structured analysis.

import { Router } from 'express';
import fetch from 'node-fetch';
import { getDb, getEventStats, getSnapshot, saveSnapshot } from '../db';
import { SERVER } from '../config';

const router = Router();

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * GET /analyst (PRO)
 * AI-generated narrative via DeepSeek API.
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
    if (!SERVER.ENABLE_ANALYST || !SERVER.DEEPSEEK_API_KEY) {
      return res.json({
        narrative: 'AI Flow Analyst is not enabled. Configure DEEPSEEK_API_KEY and set ENABLE_ANALYST=true.',
        generatedAt: new Date().toISOString(),
        cached: false,
      });
    }

    const summary = buildSummary();
    const narrative = await callDeepSeek(summary);

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

async function callDeepSeek(summary: any): Promise<string> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVER.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 500,
      temperature: 0.3, // Low temperature for analytical precision
      messages: [
        {
          role: 'system',
          content: 'You are The Watcher\'s Flow Analyst — a senior institutional stablecoin intelligence analyst. Write like a Bloomberg terminal briefing. Be direct, precise, and actionable. No disclaimers, no hedging. Focus on what matters for capital allocation decisions.',
        },
        {
          role: 'user',
          content: `Analyze these stablecoin capital flows from the last 24 hours and provide a 2-3 paragraph intelligence briefing:\n\n${JSON.stringify(summary, null, 2)}`,
        },
      ],
    }),
  });

  const data = (await response.json()) as any;

  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content;
  }

  console.warn('[Analyst] DeepSeek response:', JSON.stringify(data));
  return 'Unable to generate analyst narrative at this time.';
}

export default router;
