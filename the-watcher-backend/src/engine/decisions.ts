// ============================================
// THE WATCHER — Decision Context (Layer 3)
// ============================================
// Generates the bullet-point decision context for Signal tab

import { SignalSubscores } from '../types';

export function generateDecisionContext(
  subscores: SignalSubscores,
  fearGreedValue: number | null,
  compositeScore: number
): string[] {
  const points: string[] = [];

  // Institutional direction
  if (subscores.usdc > 30) points.push('Institutions are BUYING');
  else if (subscores.usdc < -30) points.push('Institutions are SELLING');
  else points.push('Institutions are NEUTRAL');

  // Underground direction
  if (subscores.usdt > 30) points.push('Underground is BUYING');
  else if (subscores.usdt < -30) points.push('Underground is SELLING');
  else points.push('Underground is NEUTRAL');

  // Whale activity
  if (subscores.whales > 40) points.push('Whale activity is ELEVATED');
  else if (subscores.whales < -40) points.push('Whale activity is RETREATING');
  else points.push('Whale activity is NORMAL');

  // News vs chain divergence — THIS IS THE MONEY INSIGHT
  if (fearGreedValue !== null) {
    const sentimentBearish = subscores.sentiment < -20;
    const sentimentBullish = subscores.sentiment > 20;

    if (sentimentBearish && compositeScore > 40) {
      points.push('News sentiment is FEARFUL');
      points.push('\u2192 Classic "buy the fear" setup');
    } else if (sentimentBullish && compositeScore < -40) {
      points.push('News sentiment is EUPHORIC');
      points.push('\u2192 Classic "sell the greed" setup');
    } else if (sentimentBullish && compositeScore > 40) {
      points.push('News and flows ALIGNED bullish');
    } else if (sentimentBearish && compositeScore < -40) {
      points.push('News and flows ALIGNED bearish');
    } else {
      points.push(`Sentiment: ${fearGreedValue > 50 ? 'Leaning greedy' : 'Leaning fearful'} (${fearGreedValue}/100)`);
    }
  } else {
    points.push('Sentiment data unavailable');
  }

  // Divergence insight
  if (Math.abs(subscores.usdc - subscores.usdt) > 50) {
    points.push('⚠ USDC/USDT divergence elevated — watch for resolution');
  }

  return points;
}
