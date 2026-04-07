// ============================================
// THE WATCHER — Fear & Greed Index
// ============================================

import fetch from 'node-fetch';
import { API_CONFIG } from '../config';
import { feargreedLimiter } from './rateLimiter';

export interface FearGreedData {
  value: number;
  classification: string;
  timestamp: string;
}

/**
 * Fetch current Fear & Greed index from Alternative.me.
 * Free, no API key needed. Uses rate limiting and retry logic.
 */
export async function fetchFearGreed(): Promise<FearGreedData | null> {
  return await feargreedLimiter.execute('feargreed', async () => {
    const url = `${API_CONFIG.FEAR_GREED.BASE_URL}/?limit=1&format=json`;
    const response = await fetch(url);
    const data = (await response.json()) as any;

    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.warn('[FearGreed] Unexpected response');
      return null;
    }

    const entry = data.data[0];
    return {
      value: parseInt(entry.value),
      classification: entry.value_classification,
      timestamp: new Date(parseInt(entry.timestamp) * 1000).toISOString(),
    };
  });
}
