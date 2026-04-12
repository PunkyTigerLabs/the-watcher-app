// ============================================
// THE WATCHER — Divergence Engine
// ============================================
// Compares USDC (institutional) vs USDT (underground) signals

export function computeDivergence(
  usdcScore: number,
  usdtScore: number
): { score: number; note: string } {
  const diff = Math.abs(usdcScore - usdtScore);

  // Both agree (same direction, close values)
  if (diff < 30) {
    const direction = usdcScore > 0 ? 'accumulating' : usdcScore < 0 ? 'distributing' : 'neutral';
    return {
      score: Math.round((usdcScore + usdtScore) / 2), // Reinforcing signal
      note: `USDC and USDT aligned. Both ${direction}.`,
    };
  }

  // Mild divergence
  if (diff < 60) {
    const leader = usdcScore > usdtScore ? 'Institutions (USDC)' : 'Underground (USDT)';
    const lagging = usdcScore > usdtScore ? 'Underground (USDT)' : 'Institutions (USDC)';
    return {
      score: 0, // Divergence = uncertainty = neutral
      note: `Mild divergence. ${leader} leading, ${lagging} lagging.`,
    };
  }

  // Strong divergence — this is the money insight
  const usdcDir = usdcScore > 0 ? 'IN' : 'OUT';
  const usdtDir = usdtScore > 0 ? 'IN' : 'OUT';

  // When institutions and underground disagree, historically
  // the institutional signal tends to be more predictive
  const score = Math.round(usdcScore * 0.6 + usdtScore * 0.4);

  return {
    score: Math.max(-100, Math.min(100, score)),
    note: `DIVERGENCE: Institutions ${usdcDir}, Underground ${usdtDir}. Watch closely.`,
  };
}
