// ============================================
// THE WATCHER — News Service (CryptoPanic)
// ============================================

import fetch from 'node-fetch';
import { API_CONFIG } from '../config';
import { NewsItem, Sentiment, Token } from '../types';
import { newsLimiter } from './rateLimiter';

const { BASE_URL, API_KEY } = API_CONFIG.CRYPTOPANIC;

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
  if (!API_KEY) {
    console.warn('[News] No CryptoPanic API key — skipping');
    return [];
  }

  return await newsLimiter.execute('news', async () => {
    const url = `${BASE_URL}/posts/?auth_token=${API_KEY}` +
      `&currencies=USDC,USDT&kind=news&filter=important&public=true`;

    const response = await fetch(url);
    const data = (await response.json()) as any;

    if (!data.results || !Array.isArray(data.results)) {
      console.warn('[News] Unexpected response format');
      return [];
    }

    const items: NewsItem[] = data.results
      .filter((item: any) => isRelevant(item.title))
      .slice(0, 20) // Quality over quantity
      .map((item: any) => {
        const sentimentScore = calculateWeightedSentiment(item.title);
        return {
          id: `news:${item.id || item.slug}`,
          timestamp: item.published_at || new Date().toISOString(),
          source: item.source?.title || 'Unknown',
          title: item.title,
          url: item.url,
          sentiment: sentimentScoreToCategory(sentimentScore),
          relevantTokens: detectTokens(item.title),
          score: sentimentScore,
        };
      });

    console.log(`[News] Got ${items.length} relevant news items`);
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

  // Strong negatives (-2 each)
  for (const kw of STRONG_NEGATIVE) {
    if (lower.includes(kw)) score -= 2;
  }

  // Mild negatives (-1 each)
  for (const kw of MILD_NEGATIVE) {
    if (lower.includes(kw)) score -= 1;
  }

  // Mild positives (+1 each)
  for (const kw of MILD_POSITIVE) {
    if (lower.includes(kw)) score += 1;
  }

  // Strong positives (+2 each)
  for (const kw of STRONG_POSITIVE) {
    if (lower.includes(kw)) score += 2;
  }

  // Normalize to -100 to +100
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

function mapSentiment(votes: any): Sentiment {
  if (!votes) return 'neutral';
  const positive = (votes.positive || 0) + (votes.important || 0);
  const negative = (votes.negative || 0) + (votes.toxic || 0);
  if (positive > negative * 1.5) return 'bullish';
  if (negative > positive * 1.5) return 'bearish';
  return 'neutral';
}
