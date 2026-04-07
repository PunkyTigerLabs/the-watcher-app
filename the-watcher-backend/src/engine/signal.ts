// ============================================
// THE WATCHER — Signal Engine
// ============================================
// Computes the composite signal score from 5 subscores

import { SignalResult, SignalSubscores, SignalLabel } from '../types';
import { SIGNAL_WEIGHTS } from '../config';
import { getDb, getEventStats, getActivePatterns, insertSignal } from '../db';
import { generateSignalHeadline } from './headlines';
import { generateDecisionContext } from './decisions';
import { computeDivergence } from './divergence';

/**
 * Compute the master signal score.
 * Range: -100 to +100
 * Positive = accumulation (money flowing in)
 * Negative = distribution (money flowing out)
 */
export function computeSignal(
  fearGreedValue: number | null
): SignalResult {
  // Get stats for each token
  const usdcStats = getEventStats('USDC', 24);
  const usdtStats = getEventStats('USDT', 24);

  // 1. USDC Flow subscore (30%)
  const usdcSubscore = computeFlowSubscore(usdcStats.mints, usdcStats.burns);

  // 2. USDT Flow subscore (30%)
  const usdtSubscore = computeFlowSubscore(usdtStats.mints, usdtStats.burns);

  // 3. Whale Activity subscore (20%)
  const whaleSubscore = computeWhaleSubscore();

  // 4. Divergence subscore (10%)
  const { score: divergenceSubscore, note: divergenceNote } =
    computeDivergence(usdcSubscore, usdtSubscore);

  // 5. Sentiment subscore (10%)
  const sentimentSubscore = computeSentimentSubscore(fearGreedValue);

  const subscores: SignalSubscores = {
    usdc: usdcSubscore,
    usdt: usdtSubscore,
    whales: whaleSubscore,
    divergence: divergenceSubscore,
    sentiment: sentimentSubscore,
  };

  // Weighted composite
  const rawScore =
    usdcSubscore * SIGNAL_WEIGHTS.USDC_FLOW +
    usdtSubscore * SIGNAL_WEIGHTS.USDT_FLOW +
    whaleSubscore * SIGNAL_WEIGHTS.WHALE_ACTIVITY +
    divergenceSubscore * SIGNAL_WEIGHTS.DIVERGENCE +
    sentimentSubscore * SIGNAL_WEIGHTS.SENTIMENT;

  const score = Math.round(Math.max(-100, Math.min(100, rawScore)));
  const label = scoreToLabel(score);
  const headline = generateSignalHeadline(score, label, usdcSubscore, usdtSubscore);
  const decisionContext = generateDecisionContext(subscores, fearGreedValue, score);
  const activePatterns = getActivePatterns();

  const result: SignalResult = {
    score,
    label,
    headline,
    subscores,
    divergenceNote,
    decisionContext,
    activePatterns,
    updatedAt: new Date().toISOString(),
  };

  // Store in history
  insertSignal({
    score,
    label,
    subscores,
    divergenceNote,
    headline,
    decisionContext,
  });

  return result;
}

/**
 * Flow subscore: based on net mint/burn ratio.
 * Minting > burning = positive (accumulation)
 * Burning > minting = negative (distribution)
 */
function computeFlowSubscore(mints: number, burns: number): number {
  const net = mints - burns;
  const total = mints + burns;

  if (total === 0) return 0;

  // Normalize to -100 to +100 range
  // Using a sigmoid-like curve to avoid extreme values from single events
  const ratio = net / Math.max(total, 1);
  const score = Math.tanh(ratio * 2) * 100;

  return Math.round(score);
}

/**
 * Whale subscore: based on large institutional transfers.
 */
function computeWhaleSubscore(): number {
  const db = getDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Count large transfers from/to institutional/CEX wallets
  const result = db.prepare(`
    SELECT
      COALESCE(SUM(CASE
        WHEN to_entity_type IN ('CEX') THEN -amount
        WHEN from_entity_type IN ('CEX') THEN amount
        WHEN to_entity_type IN ('Institutional') THEN amount
        WHEN from_entity_type IN ('Institutional') THEN -amount
        ELSE 0
      END), 0) as netDirection,
      COUNT(*) as count
    FROM events
    WHERE timestamp >= ?
      AND amount >= 10000000
      AND (from_entity_type IN ('Institutional', 'CEX')
        OR to_entity_type IN ('Institutional', 'CEX'))
  `).get(since) as any;

  if (result.count === 0) return 0;

  // Normalize: money TO exchanges = distribution, FROM exchanges = accumulation
  const score = Math.tanh(result.netDirection / 500_000_000) * 100;
  return Math.round(score);
}

/**
 * Sentiment subscore: from Fear & Greed index.
 * F&G 0-25 (Extreme Fear) → negative sentiment
 * F&G 75-100 (Extreme Greed) → positive sentiment
 * Mapped to -100 to +100
 */
function computeSentimentSubscore(fearGreedValue: number | null): number {
  if (fearGreedValue === null) return 0;
  // Map 0-100 → -100 to +100
  return Math.round((fearGreedValue - 50) * 2);
}

function scoreToLabel(score: number): SignalLabel {
  if (score >= 60) return 'STRONG ACCUMULATION';
  if (score >= 20) return 'ACCUMULATION';
  if (score <= -60) return 'STRONG DISTRIBUTION';
  if (score <= -20) return 'DISTRIBUTION';
  return 'NEUTRAL';
}
