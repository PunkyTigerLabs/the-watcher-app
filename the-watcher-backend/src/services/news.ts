// ============================================
// THE WATCHER — News Service (CryptoCompare)
// ============================================
// Free API — no key required
// https://min-api.cryptocompare.com/documentation

import fetch from 'node-fetch';
import { API_CONFIG } from '../config';
import { NewsItem, Sentiment, Token } from '../types';
import { newsLimiter } from './rateLimiter';

const { BASE_URL } = API_CONFIG.CRYPTOCOMPARE;

// Keywords that indicate stablecoin/flow relevance
const RELEVANT_KEYWORDS = [
  'usdc', 'usdt', 'tether', 'circle', 'stablecoin',
  'mint', 'burn', 'treasury', 'reserve', 'peg',
  'regulation', 'sec', 'etf', 'custody', 'blackrock',
  'institutional', 'whale', 'capital', 'flow', 'liquidity',
  'coinbase', 'binance', 'defi', 'bridge',
];

/**
 * Fetch and filter news for stablecoin relevance.
 * INTEL must NOT be generic crypto news — filter aggressively.
 * Uses improved sentiment scoring with weighted keywords.
 */
export async function fetchFilteredNews(): Promise<NewsItem[]> {
  return await newsLimiter.execute('news', async () => {
    // CryptoCompare news endpoint — filter by USDC/USDT categories
    const url = `${BASE_URL}/news/?categories=USDC,USDT,Stablecoin,Regulation&sortOrder=latest`;

    const response = await fetch(url);
    const data = (await response.json()) as any;

    if (!data.Data || !Array.isArray(data.Data)) {
      console.warn('[News] Unexpected CryptoCompare response format');
      return [];
    }

    const items: NewsItem[] = data.Data
      .filter((item: any) => isRelevant(item.title || ''))
      .slice(0, 20) // Quality over quantity
      .map((item: any) => {
        const sentimentScore = calculateWeightedSentiment(item.title || '');
        return {
          id: `news:cc-${item.id}`,
          timestamp: new Date((item.published_on || 0) * 1000).toISOString(),
          source: item.source_info?.name || item.source || 'Unknown',
          title: item.title || '',
          url: item.url || item.guid || '',
          sentiment: sentimentScoreToCategory(sentimentScore),
          relevantTokens: detectTokens(item.title || ''),
          score: sentimentScore,
        };
      });

    console.log(`[News] Got ${items.length} relevant news items from CryptoCompare`);
    return items;
  });
}

function isRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return RELEVANT_KEYWORDS.some(kw => lower.includes(kw));
}

function detectTokens(title: string): Token[] {
  const lower = title.toLowerCase();
  const tokens: Token[] = [];
  if (lower.includes('usdc') || lower.includes('circle')) tokens.push('USDC');
  if (lower.includes('usdt') || lower.includes('tether')) tokens.push('USDT');
  if (tokens.length === 0) tokens.push('USDC', 'USDT'); // General stablecoin news
  return tokens;
}

// Weighted sentiment keywords
const STRONG_NEGATIVE = ['crash', 'dump', 'hack', 'exploit', 'collapse', 'bankruptcy'];
const MILD_NEGATIVE = ['dip', 'concern', 'risk', 'weakness', 'downside', 'trouble'];
const STRONG_POSITIVE = ['surge', 'rally', 'bullish', 'moon', 'pump', 'soar'];
const MILD_POSITIVE = ['growth', 'adoption', 'partnership', 'upgrade', 'strength'];

/**
 * Calculate weighted sentiment score based on keyword analysis.
 * Strong negative: -2
 * Mild negative: -1
 * Mild positive: +1
 * Strong positive: +2
 * Returns score from -100 to +100
 */
function calculateWeightedSentiment(title: string): number {
  const lower = title.toLowerCase();
  let score = 0;

  for (const kw of STRONG_NEGATIVE) {
    if (lower.includes(kw)) score -= 2;
  }
  for (const kw of MILD_NEGATIVE) {
    if (lower.includes(kw)) score -= 1;
  }
  for (const kw of MILD_POSITIVE) {
    if (lower.includes(kw)) score += 1;
  }
  for (const kw of STRONG_POSITIVE) {
    if (lower.includes(kw)) score += 2;
  }

  return Math.round(Math.max(-100, Math.min(100, score * 10)));
}

/**
 * Map weighted sentiment score to category.
 */
function sentimentScoreToCategory(score: number): Sentiment {
  if (score > 20) return 'bullish';
  if (score < -20) return 'bearish';
  return 'neutral';
}
