// ============================================
// THE WATCHER — Headline Generation (Layer 1)
// ============================================
// Every tab shows ONE dominant sentence that summarizes the situation.

import { Token } from '../types';

interface HeadlineData {
  token: Token;
  mints24h: number;
  burns24h: number;
  net24h: number;
  totalVolume: number;
  eventCount: number;
  tronVolume?: number;
  ethVolume?: number;
  biggestEntity?: string;
  biggestAmount?: number;
  biggestType?: string;
  biggestEntityType?: string;
}

export function generateHeadline(data: HeadlineData): string {
  const netFlow = data.mints24h - data.burns24h;

  if (data.token === 'USDC') {
    return generateUSDCHeadline(data, netFlow);
  }

  if (data.token === 'USDT') {
    return generateUSDTHeadline(data, netFlow);
  }

  return `Net flow: ${netFlow > 0 ? '+' : ''}$${formatM(netFlow)}. Monitoring.`;
}

function generateUSDCHeadline(data: HeadlineData, netFlow: number): string {
  // Massive expansion
  if (netFlow > 500_000_000 && data.mints24h > 500_000_000) {
    return `Circle printed $${formatB(data.mints24h)} in 24h. Institutional appetite is HIGH.`;
  }

  // Significant contraction
  if (netFlow < -200_000_000) {
    return `USDC supply contracted $${formatM(Math.abs(netFlow))}. Institutions reducing exposure.`;
  }

  // Institutional custody movement
  if (data.biggestEntityType === 'Institutional' && data.biggestAmount && data.biggestAmount > 50_000_000) {
    return `${data.biggestEntity} received $${formatM(data.biggestAmount)}. Custody accumulation pattern.`;
  }

  // Significant minting
  if (data.mints24h > 200_000_000) {
    return `Circle printed $${formatM(data.mints24h)} USDC. Fresh institutional capital entering.`;
  }

  // Significant burning
  if (data.burns24h > 200_000_000) {
    return `$${formatM(data.burns24h)} USDC burned. Redemption cycle active.`;
  }

  // Exchange activity
  if (data.biggestEntityType === 'CEX' && data.biggestAmount && data.biggestAmount > 100_000_000) {
    return `$${formatM(data.biggestAmount)} moved to ${data.biggestEntity}. Exchange positioning.`;
  }

  // Quiet period
  if (data.eventCount < 5) {
    return `Quiet day. No significant USDC treasury activity detected.`;
  }

  // Default
  if (netFlow > 0) {
    return `USDC net inflow: +$${formatM(netFlow)}. Capital entering the system.`;
  } else if (netFlow < 0) {
    return `USDC net outflow: -$${formatM(Math.abs(netFlow))}. Capital leaving the system.`;
  }

  return `USDC flows balanced. Net: $${formatM(Math.abs(netFlow))}. Monitoring.`;
}

function generateUSDTHeadline(data: HeadlineData, netFlow: number): string {
  const tronShare = data.tronVolume && data.ethVolume
    ? (data.tronVolume / (data.ethVolume + data.tronVolume)) * 100
    : 0;
  const tronSurge = tronShare > 60;

  // Massive Tron activity
  if (data.mints24h > 300_000_000 && tronSurge) {
    return `Tether minted $${formatM(data.mints24h)} on TRON. Underground liquidity surge.`;
  }

  // Tron dominance
  if (tronSurge) {
    return `TRON dominance at ${Math.round(tronShare)}%. Underground rails running hot.`;
  }

  // Significant contraction
  if (netFlow < -200_000_000) {
    return `$${formatM(Math.abs(netFlow))} USDT burned. Redemption cycle active.`;
  }

  // Large exchange inflow
  if (data.biggestEntityType === 'CEX' && data.biggestAmount && data.biggestAmount > 200_000_000) {
    return `${data.biggestEntity} received $${formatM(data.biggestAmount)} USDT. Selling pressure incoming?`;
  }

  // Significant minting
  if (data.mints24h > 200_000_000) {
    return `Tether minted $${formatM(data.mints24h)} USDT. New liquidity entering the system.`;
  }

  // Quiet
  if (data.eventCount < 5) {
    return `Quiet period for USDT. No major treasury or underground activity.`;
  }

  // Default
  if (netFlow > 0) {
    return `USDT net expansion: +$${formatM(netFlow)}. Liquidity growing.`;
  }

  return `USDT flows: net $${formatM(Math.abs(netFlow))}. Monitoring underground and surface.`;
}

// Signal tab headline
export function generateSignalHeadline(
  score: number,
  label: string,
  usdcScore: number,
  usdtScore: number
): string {
  const bothPositive = usdcScore > 20 && usdtScore > 20;
  const bothNegative = usdcScore < -20 && usdtScore < -20;
  const diverging = (usdcScore > 20 && usdtScore < -20) || (usdcScore < -20 && usdtScore > 20);

  if (score > 60 && bothPositive) {
    return 'STRONG ACCUMULATION — USDC and USDT aligned. Both printing.';
  }
  if (score < -60 && bothNegative) {
    return 'DISTRIBUTION \u2014 Capital leaving both systems. Defensive positioning.';
  }
  if (diverging) {
    const usdcDir = usdcScore > 0 ? 'IN (USDC\u2191)' : 'OUT (USDC\u2193)';
    const usdtDir = usdtScore > 0 ? 'IN (USDT\u2191)' : 'OUT (USDT\u2193)';
    return `DIVERGENCE ALERT \u2014 Institutions ${usdcDir}, Underground ${usdtDir}.`;
  }
  if (score > 30) {
    return `${label} \u2014 Net capital inflow detected. Smart money positioning.`;
  }
  if (score < -30) {
    return `${label} \u2014 Net capital outflow. Proceed with caution.`;
  }

  return `${label} \u2014 Markets balanced. Watching for directional signal.`;
}

// Formatting helpers
function formatB(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  return formatM(amount);
}

function formatM(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(amount) >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}M`;
  if (Math.abs(amount) >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toFixed(0);
}
