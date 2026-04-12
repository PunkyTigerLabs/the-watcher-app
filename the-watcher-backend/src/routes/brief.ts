// ============================================
// THE WATCHER — Executive Brief
// ============================================
// GET /brief — CEO-grade one-pager. Designed to answer "what happened in
// the stablecoin capital flow layer in the last 24h, and what should I
// watch for the next 24h" in 30 seconds of reading.

import { Router } from 'express';
import {
  getDb,
  getEventStats,
  getSignalHistory,
  getSnapshot,
  getActivePatterns,
} from '../db';

const router = Router();

const fmtUsd = (n: number): string => {
  if (!isFinite(n) || n === 0) return '$0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
};

const pct = (x: number): string => `${(x * 100).toFixed(1)}%`;

router.get('/', (_req, res) => {
  try {
    const db = getDb();
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const usdcStats = getEventStats('USDC', 24);
    const usdtStats = getEventStats('USDT', 24);

    // Signal state
    const signalHistory = getSignalHistory(1);
    const signal = signalHistory[0];

    // Supply
    const marketSupply = getSnapshot('market_supply')?.data;
    const usdcSupply =
      getSnapshot('supply_usdc')?.data?.totalSupply || marketSupply?.usdc || 0;
    const usdtSupply =
      getSnapshot('supply_usdt')?.data?.totalSupply || marketSupply?.usdt || 0;

    // Chain distribution
    const chainStats = db.prepare(`
      SELECT token, chain, COALESCE(SUM(amount), 0) as vol
      FROM events
      WHERE timestamp >= ?
      GROUP BY token, chain
      ORDER BY vol DESC
    `).all(since24h) as Array<{ token: string; chain: string; vol: number }>;

    // CEX pressure
    const cexFlows = db.prepare(`
      SELECT
        token,
        COALESCE(SUM(CASE WHEN to_entity_type = 'CEX' THEN amount ELSE 0 END), 0) as inflows,
        COALESCE(SUM(CASE WHEN from_entity_type = 'CEX' THEN amount ELSE 0 END), 0) as outflows
      FROM events
      WHERE timestamp >= ?
      GROUP BY token
    `).all(since24h) as Array<{ token: string; inflows: number; outflows: number }>;

    const usdcFlow = cexFlows.find((r) => r.token === 'USDC');
    const usdtFlow = cexFlows.find((r) => r.token === 'USDT');

    // Biggest single transfer
    const biggest = db.prepare(`
      SELECT token, amount, from_entity, to_entity, chain, timestamp
      FROM events
      WHERE timestamp >= ?
      ORDER BY amount DESC
      LIMIT 1
    `).get(since24h) as any;

    // Active patterns
    const patterns = getActivePatterns();
    const criticalPatterns = patterns.filter(
      (p: any) => p.severity === 'critical' || p.severity === 'high'
    );

    // ---- Build the headline ----
    let headline: string;
    const usdcNet = usdcStats.mints - usdcStats.burns;
    const usdtNet = usdtStats.mints - usdtStats.burns;
    const combinedNet = usdcNet + usdtNet;

    if (Math.abs(combinedNet) > 1_000_000_000) {
      headline = `Stablecoin supply ${combinedNet > 0 ? 'expanded' : 'contracted'} by ${fmtUsd(Math.abs(combinedNet))} in 24h — ${combinedNet > 0 ? 'risk-on positioning' : 'defensive positioning'}.`;
    } else if (signal && Math.abs(signal.score) > 40) {
      const dir = signal.score > 0 ? 'ACCUMULATION' : 'DISTRIBUTION';
      headline = `${dir} regime — signal at ${signal.score}/100. ${signal.headline || ''}`.trim();
    } else if (criticalPatterns.length > 0) {
      headline = `${criticalPatterns.length} active ${criticalPatterns.length === 1 ? 'pattern' : 'patterns'} flagged — ${criticalPatterns[0].message}`;
    } else {
      headline = 'Capital flows balanced across USDC and USDT. No regime change detected.';
    }

    // ---- Build the 3 hard facts ----
    const facts: string[] = [];

    // Fact 1: supply
    facts.push(
      `Supply: USDC ${fmtUsd(usdcSupply)} · USDT ${fmtUsd(usdtSupply)} · combined ${fmtUsd(usdcSupply + usdtSupply)}.`
    );

    // Fact 2: CEX posture
    if (usdcFlow || usdtFlow) {
      const uIn = usdcFlow?.inflows || 0;
      const uOut = usdcFlow?.outflows || 0;
      const tIn = usdtFlow?.inflows || 0;
      const tOut = usdtFlow?.outflows || 0;
      const usdcBias = uIn + uOut > 0 ? (uOut - uIn) / (uIn + uOut) : 0;
      const usdtBias = tIn + tOut > 0 ? (tOut - tIn) / (tIn + tOut) : 0;
      const usdcWord = usdcBias > 0.15 ? 'leaving CEXs' : usdcBias < -0.15 ? 'entering CEXs' : 'flat';
      const usdtWord = usdtBias > 0.15 ? 'leaving CEXs' : usdtBias < -0.15 ? 'entering CEXs' : 'flat';
      facts.push(`CEX posture: USDC ${usdcWord} (${pct(usdcBias)} bias) · USDT ${usdtWord} (${pct(usdtBias)} bias).`);
    } else {
      facts.push('CEX posture: insufficient labeled volume in 24h.');
    }

    // Fact 3: dominant chain + biggest move
    const topChain = chainStats[0];
    if (topChain) {
      facts.push(
        `Dominant venue: ${topChain.token} on ${topChain.chain} (${fmtUsd(topChain.vol)} in 24h).` +
        (biggest
          ? ` Biggest single transfer: ${fmtUsd(biggest.amount)} ${biggest.token} on ${biggest.chain} (${biggest.from_entity || 'Unknown'} → ${biggest.to_entity || 'Unknown'}).`
          : '')
      );
    }

    // ---- Watch list ----
    const watchItems: string[] = [];
    if (criticalPatterns.length > 0) {
      for (const p of criticalPatterns.slice(0, 3)) {
        watchItems.push(p.message);
      }
    }
    if (signal && Math.abs(signal.divergence_subscore) > 30) {
      watchItems.push(
        `Divergence subscore at ${signal.divergence_subscore} — USDC and USDT desks disagreeing.`
      );
    }
    if (watchItems.length === 0) {
      watchItems.push('No high-severity signals. Baseline monitoring.');
    }

    res.json({
      generatedAt: new Date().toISOString(),
      period: '24h',
      headline,
      signal: signal
        ? { score: signal.score, label: signal.label }
        : { score: 0, label: 'NEUTRAL' },
      facts,
      watch: watchItems,
      meta: {
        usdcEventCount: usdcStats.eventCount,
        usdtEventCount: usdtStats.eventCount,
        usdcNet,
        usdtNet,
        combinedNet,
      },
    });
  } catch (error) {
    console.error('[Brief] Error:', error);
    res.status(500).json({ error: 'Failed to generate executive brief' });
  }
});

export default router;
