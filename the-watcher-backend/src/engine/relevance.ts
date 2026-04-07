// ============================================
// THE WATCHER — Relevance Engine
// ============================================
// Not every transfer deserves UI. The app must feel curated, not noisy.

import { CanonicalEvent, Relevance } from '../types';
import { THRESHOLDS } from '../config';

export function classifyRelevance(event: CanonicalEvent): Relevance {
  // CRITICAL — always show, push notification worthy
  if (event.type === 'MINT' && event.amount >= THRESHOLDS.CRITICAL_AMOUNT) return 'critical';
  if (event.type === 'BURN' && event.amount >= THRESHOLDS.CRITICAL_AMOUNT) return 'critical';
  if (event.fromEntityType === 'Treasury' || event.toEntityType === 'Treasury') return 'critical';

  // HIGH — show in LIVE EVENTS
  if (event.amount >= THRESHOLDS.HIGH_AMOUNT) return 'high';
  if (event.fromEntityType === 'Institutional') return 'high';
  if (event.toEntityType === 'Institutional') return 'high';
  if (event.chain === 'TRON' && event.amount >= THRESHOLDS.TRON_HIGH) return 'high';

  // MEDIUM — show in full feed (PRO)
  if (event.amount >= THRESHOLDS.MEDIUM_AMOUNT) return 'medium';

  // LOW — store but don't display
  return 'low';
}

/**
 * Filter events by minimum relevance level.
 */
export function filterByRelevance(
  events: CanonicalEvent[],
  minRelevance: Relevance
): CanonicalEvent[] {
  const order: Relevance[] = ['critical', 'high', 'medium', 'low'];
  const minIdx = order.indexOf(minRelevance);

  return events.filter(e => {
    const eventIdx = order.indexOf(e.relevance);
    return eventIdx <= minIdx;
  });
}
