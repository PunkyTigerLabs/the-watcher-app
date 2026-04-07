// ============================================
// THE WATCHER — Deduplication Logic
// ============================================

import { CanonicalEvent } from '../types';

/**
 * Generate a unique deduplication key for an event.
 * Format: `${token}:${chain}:${txHash}:${id}`
 */
export function eventKey(event: CanonicalEvent): string {
  return event.id; // Already in format `${token}:${chain}:${txHash}:${logIndex}`
}

/**
 * Deduplicate an array of events by their ID.
 * Keeps the first occurrence (which should be the most recent fetch).
 */
export function deduplicateEvents(events: CanonicalEvent[]): CanonicalEvent[] {
  const seen = new Set<string>();
  const unique: CanonicalEvent[] = [];

  for (const event of events) {
    const key = eventKey(event);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(event);
    }
  }

  return unique;
}

/**
 * Merge two arrays of events, deduplicating and sorting by timestamp desc.
 */
export function mergeEvents(
  existing: CanonicalEvent[],
  incoming: CanonicalEvent[]
): CanonicalEvent[] {
  const all = [...existing, ...incoming];
  const deduped = deduplicateEvents(all);
  return deduped.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
