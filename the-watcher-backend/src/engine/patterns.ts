// ============================================
// THE WATCHER — Pattern Detection (Layer 2)
// ============================================
// 10 automated patterns that surface what matters

import { PatternFlag } from '../types';
import { getDb, upsertPattern, deactivateOldPatterns } from '../db';
import { THRESHOLDS } from '../config';

/**
 * Run all pattern detectors and store active flags.
 */
export function detectPatterns(): PatternFlag[] {
  const db = getDb();
  const now = new Date().toISOString();
  const detectedPatterns: PatternFlag[] = [];

  // Clean up old patterns first
  deactivateOldPatterns(6);

  // 1. TREASURY ACTIVATION
  const treasuryActivity = checkTreasuryActivation(db);
  if (treasuryActivity) detectedPatterns.push(treasuryActivity);

  // 2. EXCHANGE CONCENTRATION
  const exchangeConc = checkExchangeConcentration(db);
  if (exchangeConc) detectedPatterns.push(exchangeConc);

  // 3. EXCHANGE EXODUS
  const exchangeExodus = checkExchangeExodus(db);
  if (exchangeExodus) detectedPatterns.push(exchangeExodus);

  // 4. TRON SURGE
  const tronSurge = checkTronSurge(db);
  if (tronSurge) detectedPatterns.push(tronSurge);

  // 5. DIVERGENCE FLIP
  const divergenceFlip = checkDivergenceFlip(db);
  if (divergenceFlip) detectedPatterns.push(divergenceFlip);

  // 6. SUPPLY SHOCK
  const supplyShock = checkSupplyShock(db);
  if (supplyShock) detectedPatterns.push(supplyShock);

  // 7. SUPPLY CONTRACTION
  const supplyContraction = checkSupplyContraction(db);
  if (supplyContraction) detectedPatterns.push(supplyContraction);

  // 8. WHALE CLUSTER
  const whaleCluster = checkWhaleCluster(db);
  if (whaleCluster) detectedPatterns.push(whaleCluster);

  // 9. QUIET BEFORE STORM
  const quiet = checkQuietPeriod(db);
  if (quiet) detectedPatterns.push(quiet);

  // 10. RAPID RELAY
  const rapidRelay = checkRapidRelay(db);
  if (rapidRelay) detectedPatterns.push(rapidRelay);

  // Store all detected patterns
  for (const p of detectedPatterns) {
    upsertPattern(p);
  }

  return detectedPatterns;
}

function checkTreasuryActivation(db: any): PatternFlag | null {
  const since = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const result = db.prepare(`
    SELECT SUM(amount) as total FROM events
    WHERE timestamp >= ?
      AND (from_entity_type = 'Treasury' OR to_entity_type = 'Treasury')
  `).get(since) as any;

  if (result.total >= THRESHOLDS.CRITICAL_AMOUNT) {
    return {
      id: `treasury-activation-${Date.now()}`,
      pattern: 'TREASURY_ACTIVATION',
      severity: 'alert',
      message: `TREASURY ACTIVE \u2014 $${formatM(result.total)} in treasury activity in last 4 hours`,
      timestamp: new Date().toISOString(),
      active: true,
    };
  }
  return null;
}

function checkExchangeConcentration(db: any): PatternFlag | null {
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const result = db.prepare(`
    SELECT to_entity, SUM(amount) as total FROM events
    WHERE timestamp >= ? AND to_entity_type = 'CEX'
    GROUP BY to_entity
    ORDER BY total DESC LIMIT 1
  `).get(since) as any;

  if (result && result.total >= THRESHOLDS.EXCHANGE_SPIKE) {
    return {
      id: `exchange-concentration-${Date.now()}`,
      pattern: 'EXCHANGE_CONCENTRATION',
      severity: 'alert',
      message: `INFLOW SPIKE \u2014 $${formatM(result.total)} entering ${result.to_entity}. Potential selling pressure.`,
      timestamp: new Date().toISOString(),
      active: true,
    };
  }
  return null;
}

function checkExchangeExodus(db: any): PatternFlag | null {
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const result = db.prepare(`
    SELECT SUM(amount) as total FROM events
    WHERE timestamp >= ? AND from_entity_type = 'CEX'
  `).get(since) as any;

  if (result.total >= THRESHOLDS.EXCHANGE_SPIKE) {
    return {
      id: `exchange-exodus-${Date.now()}`,
      pattern: 'EXCHANGE_EXODUS',
      severity: 'watch',
      message: `OUTFLOW SURGE \u2014 $${formatM(result.total)} leaving exchanges. Accumulation signal.`,
      timestamp: new Date().toISOString(),
      active: true,
    };
  }
  return null;
}

function checkTronSurge(db: any): PatternFlag | null {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const result = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN chain = 'TRON' THEN amount ELSE 0 END), 0) as tronVol,
      COALESCE(SUM(amount), 0) as totalVol
    FROM events
    WHERE token = 'USDT' AND timestamp >= ?
  `).get(since) as any;

  if (result.totalVol > 0) {
    const tronShare = result.tronVol / result.totalVol;
    if (tronShare >= THRESHOLDS.TRON_DOMINANCE) {
      return {
        id: `tron-surge-${Date.now()}`,
        pattern: 'TRON_SURGE',
        severity: 'watch',
        message: `TRON DOMINANCE \u2014 ${Math.round(tronShare * 100)}% of USDT volume. Underground activity elevated.`,
        timestamp: new Date().toISOString(),
        active: true,
      };
    }
  }
  return null;
}

function checkSupplyShock(db: any): PatternFlag | null {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const result = db.prepare(`
    SELECT COALESCE(SUM(CASE WHEN type = 'MINT' THEN amount ELSE 0 END), 0) -
           COALESCE(SUM(CASE WHEN type = 'BURN' THEN amount ELSE 0 END), 0) as netMint
    FROM events WHERE timestamp >= ?
  `).get(since) as any;

  if (result.netMint >= THRESHOLDS.SUPPLY_SHOCK) {
    return {
      id: `supply-shock-${Date.now()}`,
      pattern: 'SUPPLY_SHOCK',
      severity: 'alert',
      message: `SUPPLY EXPANSION \u2014 $${formatM(result.netMint)} new stablecoins entered the system.`,
      timestamp: new Date().toISOString(),
      active: true,
    };
  }
  return null;
}

function checkSupplyContraction(db: any): PatternFlag | null {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const result = db.prepare(`
    SELECT COALESCE(SUM(CASE WHEN type = 'BURN' THEN amount ELSE 0 END), 0) -
           COALESCE(SUM(CASE WHEN type = 'MINT' THEN amount ELSE 0 END), 0) as netBurn
    FROM events WHERE timestamp >= ?
  `).get(since) as any;

  if (result.netBurn >= THRESHOLDS.SUPPLY_CONTRACTION) {
    return {
      id: `supply-contraction-${Date.now()}`,
      pattern: 'SUPPLY_CONTRACTION',
      severity: 'alert',
      message: `SUPPLY CONTRACTION \u2014 $${formatM(result.netBurn)} stablecoins destroyed. Liquidity draining.`,
      timestamp: new Date().toISOString(),
      active: true,
    };
  }
  return null;
}

function checkWhaleCluster(db: any): PatternFlag | null {
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  // Count distinct wallet addresses (from_address or to_address) that have moved >= $50M
  const result = db.prepare(`
    SELECT COUNT(DISTINCT whale_address) as uniqueWhales
    FROM (
      SELECT from_address as whale_address, SUM(amount) as total FROM events
      WHERE timestamp >= ? AND (from_entity_type = 'Institutional' OR to_entity_type = 'Institutional')
      GROUP BY from_address
      HAVING SUM(amount) >= ?

      UNION ALL

      SELECT to_address as whale_address, SUM(amount) as total FROM events
      WHERE timestamp >= ? AND (from_entity_type = 'Institutional' OR to_entity_type = 'Institutional')
      GROUP BY to_address
      HAVING SUM(amount) >= ?
    )
  `).get(since, THRESHOLDS.WHALE_CLUSTER_AMOUNT, since, THRESHOLDS.WHALE_CLUSTER_AMOUNT) as any;

  if (result.uniqueWhales >= THRESHOLDS.WHALE_CLUSTER_COUNT) {
    return {
      id: `whale-cluster-${Date.now()}`,
      pattern: 'WHALE_CLUSTER',
      severity: 'watch',
      message: `INSTITUTIONAL CLUSTER \u2014 ${result.uniqueWhales} whales active simultaneously.`,
      timestamp: new Date().toISOString(),
      active: true,
    };
  }
  return null;
}

function checkQuietPeriod(db: any): PatternFlag | null {
  // Compare last 24h volume vs 7-day average
  const stats24h = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as vol
    FROM events WHERE timestamp >= ?
  `).get(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) as any;

  const stats7d = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) / 7 as avgDaily
    FROM events WHERE timestamp >= ?
  `).get(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) as any;

  if (stats7d.avgDaily > 0 && stats24h.vol < stats7d.avgDaily * THRESHOLDS.QUIET_THRESHOLD) {
    return {
      id: `quiet-period-${Date.now()}`,
      pattern: 'QUIET_BEFORE_STORM',
      severity: 'info',
      message: `LOW ACTIVITY \u2014 Unusual quiet. Volume at ${Math.round((stats24h.vol / stats7d.avgDaily) * 100)}% of average. Watch for breakout.`,
      timestamp: new Date().toISOString(),
      active: true,
    };
  }
  return null;
}

function checkRapidRelay(db: any): PatternFlag | null {
  // Simplified: check if same-ish amounts appear 3+ times in 1 hour
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const result = db.prepare(`
    SELECT ROUND(amount, -5) as roundedAmount, COUNT(*) as cnt
    FROM events
    WHERE timestamp >= ? AND type = 'TRANSFER' AND amount >= 1000000
    GROUP BY roundedAmount
    HAVING cnt >= 3
    ORDER BY roundedAmount DESC LIMIT 1
  `).get(since) as any;

  if (result) {
    return {
      id: `rapid-relay-${Date.now()}`,
      pattern: 'RAPID_RELAY',
      severity: 'watch',
      message: `RAPID RELAY \u2014 ~$${formatM(result.roundedAmount)} routed through ${result.cnt} addresses quickly.`,
      timestamp: new Date().toISOString(),
      active: true,
    };
  }
  return null;
}

function checkDivergenceFlip(db: any): PatternFlag | null {
  // Get the last saved signal to compare divergence
  const lastSignal = db.prepare(`
    SELECT usdc_subscore, usdt_subscore FROM signal_history
    ORDER BY timestamp DESC LIMIT 1
  `).get() as any;

  if (!lastSignal) {
    // No prior signal to compare against
    return null;
  }

  // Get current 24h stats for USDC and USDT
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const usdcStats = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'MINT' THEN amount ELSE 0 END), 0) as mints,
      COALESCE(SUM(CASE WHEN type = 'BURN' THEN amount ELSE 0 END), 0) as burns
    FROM events WHERE token = 'USDC' AND timestamp >= ?
  `).get(since) as any;

  const usdtStats = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'MINT' THEN amount ELSE 0 END), 0) as mints,
      COALESCE(SUM(CASE WHEN type = 'BURN' THEN amount ELSE 0 END), 0) as burns
    FROM events WHERE token = 'USDT' AND timestamp >= ?
  `).get(since) as any;

  // Calculate current subscores
  const computeFlowScore = (mints: number, burns: number): number => {
    const net = mints - burns;
    const total = mints + burns;
    if (total === 0) return 0;
    const ratio = net / Math.max(total, 1);
    return Math.round(Math.tanh(ratio * 2) * 100);
  };

  const currentUsdcScore = computeFlowScore(usdcStats.mints, usdcStats.burns);
  const currentUsdtScore = computeFlowScore(usdtStats.mints, usdtStats.burns);

  // Determine if sign flipped
  const lastUsdcDir = lastSignal.usdc_subscore > 0 ? 'positive' : lastSignal.usdc_subscore < 0 ? 'negative' : 'neutral';
  const lastUsdtDir = lastSignal.usdt_subscore > 0 ? 'positive' : lastSignal.usdt_subscore < 0 ? 'negative' : 'neutral';
  const currentUsdcDir = currentUsdcScore > 0 ? 'positive' : currentUsdcScore < 0 ? 'negative' : 'neutral';
  const currentUsdtDir = currentUsdtScore > 0 ? 'positive' : currentUsdtScore < 0 ? 'negative' : 'neutral';

  // Check if either token's direction changed
  const usdcFlipped = (lastUsdcDir !== 'neutral' && currentUsdcDir !== 'neutral' && lastUsdcDir !== currentUsdcDir) ||
                      (lastUsdcDir === 'neutral' && currentUsdcDir !== 'neutral');
  const usdtFlipped = (lastUsdtDir !== 'neutral' && currentUsdtDir !== 'neutral' && lastUsdtDir !== currentUsdtDir) ||
                      (lastUsdtDir === 'neutral' && currentUsdtDir !== 'neutral');

  // Check if they went from agreement to disagreement or vice versa
  const lastAgreed = (lastUsdcDir === lastUsdtDir && lastUsdcDir !== 'neutral');
  const currentAgreed = (currentUsdcDir === currentUsdtDir && currentUsdcDir !== 'neutral');

  const divergenceFlipped = (lastAgreed && !currentAgreed) || (!lastAgreed && currentAgreed);

  if (usdcFlipped || usdtFlipped || divergenceFlipped) {
    const detail = divergenceFlipped
      ? `USDC and USDT ${lastAgreed ? 'diverged' : 'converged'}`
      : `${usdcFlipped ? 'USDC' : 'USDT'} flipped from ${usdcFlipped ? lastUsdcDir : lastUsdtDir} to ${usdcFlipped ? currentUsdcDir : currentUsdtDir}`;

    return {
      id: `divergence-flip-${Date.now()}`,
      pattern: 'DIVERGENCE_FLIP',
      severity: 'high',
      message: `DIVERGENCE FLIP \u2014 ${detail}. Superman and Bizarro changing moves.`,
      timestamp: new Date().toISOString(),
      active: true,
    };
  }

  return null;
}

function formatM(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(amount) >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}M`;
  if (Math.abs(amount) >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toFixed(0);
}
