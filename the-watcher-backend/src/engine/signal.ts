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
  const usdcSubscore = computeFlowSubscore('USDC', usdcStats.mints, usdcStats.burns);

  // 2. USDT Flow subscore (30%)
  const usdtSubscore = computeFlowSubscore('USDT', usdtStats.mints, usdtStats.burns);

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
 * Flow subscore: improved with transaction count, volume, and large move direction.
 * Factors:
 * - Net mint/burn ratio (40%)
 * - Transaction count significance (30%)
 * - Large moves (>$10M) direction (30%)
 */
function computeFlowSubscore(token: 'USDC' | 'USDT', mints: number, burns: number): number {
  const db = getDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Get detailed event stats — scoped to the token, otherwise both subscores
  // end up identical because the count/large-move stats leak across tokens.
  const stats = db.prepare(`
    SELECT
      COUNT(*) as eventCount,
      COALESCE(SUM(CASE WHEN type = 'MINT' THEN 1 ELSE 0 END), 0) as mintCount,
      COALESCE(SUM(CASE WHEN type = 'BURN' THEN 1 ELSE 0 END), 0) as burnCount,
      COALESCE(SUM(amount), 0) as totalVolume,
      COALESCE(SUM(CASE WHEN type = 'MINT' AND amount >= 10000000 THEN amount ELSE 0 END), 0) as largeMints,
      COALESCE(SUM(CASE WHEN type = 'BURN' AND amount >= 10000000 THEN amount ELSE 0 END), 0) as largeBurns
    FROM events WHERE timestamp >= ? AND token = ?
  `).get(since, token) as any;

  // 1. Net mint/burn ratio (40%)
  const net = mints - burns;
  const total = mints + burns;
  let ratioScore = 0;
  if (total > 0) {
    const ratio = net / Math.max(total, 1);
    ratioScore = Math.tanh(ratio * 2) * 100;
  }

  // 2. Transaction count significance (30%)
  let countScore = 0;
  const eventCount = stats.eventCount || 0;
  const avgCountPerDay = 50; // Baseline
  if (eventCount > 0) {
    // More transactions = stronger signal
    const countRatio = Math.min(eventCount / Math.max(avgCountPerDay, 1), 2);
    countScore = Math.tanh((countRatio - 1) * 1.5) * 100;
  }

  // 3. Large moves (>$10M) direction (30%)
  let largeScore = 0;
  const largeMintSum = stats.largeMints || 0;
  const largeBurnSum = stats.largeBurns || 0;
  const largeNet = largeMintSum - largeBurnSum;
  const largeTotal = largeMintSum + largeBurnSum;
  if (largeTotal > 0) {
    const largeRatio = largeNet / Math.max(largeTotal, 1);
    largeScore = Math.tanh(largeRatio * 2) * 100;
  }

  // Weighted combination
  const score = (ratioScore * 0.40) + (countScore * 0.30) + (largeScore * 0.30);
  return Math.round(Math.max(-100, Math.min(100, score)));
}

/**
 * Whale subscore: improved with CEX inflows/outflows + institutional tracking.
 * - CEX inflows = bearish (selling pressure)
 * - CEX outflows = bullish (accumulation)
 * - Institutional moves tracked and weighted separately
 */
function computeWhaleSubscore(): number {
  const db = getDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // CEX flows: inflows (negative) and outflows (positive)
  const cexFlows = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN to_entity_type = 'CEX' THEN -amount ELSE 0 END), 0) as inflows,
      COALESCE(SUM(CASE WHEN from_entity_type = 'CEX' THEN amount ELSE 0 END), 0) as outflows,
      COUNT(*) as cexCount
    FROM events
    WHERE timestamp >= ? AND amount >= 10000000
  `).get(since) as any;

  // Institutional flows
  const instFlows = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN to_entity_type = 'Institutional' THEN amount ELSE 0 END), 0) as inflows,
      COALESCE(SUM(CASE WHEN from_entity_type = 'Institutional' THEN -amount ELSE 0 END), 0) as outflows,
      COUNT(*) as instCount
    FROM events
    WHERE timestamp >= ? AND amount >= 10000000
  `).get(since) as any;

  const netCex = (cexFlows.outflows || 0) + (cexFlows.inflows || 0);
  const netInst = (instFlows.inflows || 0) + (instFlows.outflows || 0);

  // Weight: CEX is more predictive of short-term (70%), institutions longer-term (30%)
  const cexScore = Math.tanh(netCex / 300_000_000) * 100;
  const instScore = Math.tanh(netInst / 400_000_000) * 100;

  const score = (cexScore * 0.70) + (instScore * 0.30);
  return Math.round(Math.max(-100, Math.min(100, score)));
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
