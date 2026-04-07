// ============================================
// THE WATCHER — News Service (CryptoPanic)
// ============================================

import fetch from 'node-fetch';
import { API_CONFIG } from '../config';
import { NewsItem, Sentiment, Token } from '../types';

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
 */
export async function fetchFilteredNews(): Promise<NewsItem[]> {
  if (!API_KEY) {
    console.warn('[News] No CryptoPanic API key — skipping');
    return [];
  }

  try {
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
      .map((item: any) => ({
        id: `news:${item.id || item.slug}`,
        timestamp: item.published_at || new Date().toISOString(),
        source: item.source?.title || 'Unknown',
        title: item.title,
        url: item.url,
        sentiment: mapSentiment(item.votes),
        relevantTokens: detectTokens(item.title),
        score: calculateSentimentScore(item.votes),
      }));

    console.log(`[News] Got ${items.length} relevant news items`);
    return items;
  } catch (error) {
    console.error('[News] Fetch error:', error);
    return [];
  }
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

function mapSentiment(votes: any): Sentiment {
  if (!votes) return 'neutral';
  const positive = (votes.positive || 0) + (votes.important || 0);
  const negative = (votes.negative || 0) + (votes.toxic || 0);
  if (positive > negative * 1.5) return 'bullish';
  if (negative > positive * 1.5) return 'bearish';
  return 'neutral';
}

function calculateSentimentScore(votes: any): number {
  if (!votes) return 0;
  const positive = (votes.positive || 0) + (votes.important || 0);
  const negative = (votes.negative || 0) + (votes.toxic || 0);
  const total = positive + negative;
  if (total === 0) return 0;
  return Math.round(((positive - negative) / total) * 100);
}
