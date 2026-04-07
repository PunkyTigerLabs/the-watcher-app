// ============================================
// THE WATCHER — Multi-Source Intelligence Aggregator
// ============================================
// Production-grade news intelligence from 3 independent sources:
//   1. CryptoCompare News API (free, no key)
//   2. CoinGecko News (free, no key)
//   3. Tier-1 RSS Feeds (CoinDesk, Decrypt, The Block, Cointelegraph)
//
// Features:
//   - Parallel fetching with independent failover
//   - Cross-source deduplication by title similarity
//   - Source credibility weighting
//   - Weighted keyword sentiment scoring
//   - Stablecoin relevance filtering

import fetch from 'node-fetch';
import RssParser from 'rss-parser';
import { API_CONFIG } from '../config';
import { NewsItem, Sentiment, Token } from '../types';
import { newsLimiter } from './rateLimiter';

const rssParser = new RssParser({ timeout: 8000 });

// ---- Source Configuration ----

const CRYPTOCOMPARE_URL = `${API_CONFIG.CRYPTOCOMPARE.BASE_URL}/news/?categories=USDC,USDT,Stablecoin,Regulation&sortOrder=latest`;
const COINGECKO_NEWS_URL = 'https://api.coingecko.com/api/v3/news';

// Tier-1 institutional-grade sources only
const RSS_FEEDS: { url: string; source: string; credibility: number }[] = [
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk', credibility: 95 },
  { url: 'https://decrypt.co/feed', source: 'Decrypt', credibility: 90 },
  { url: 'https://www.theblock.co/rss.xml', source: 'The Block', credibility: 95 },
  { url: 'https://cointelegraph.com/rss', source: 'Cointelegraph', credibility: 85 },
];

// Source credibility scores (0-100) — higher = more trusted
const SOURCE_CREDIBILITY: Record<string, number> = {
  'CoinDesk': 95,
  'The Block': 95,
  'Bloomberg': 100,
  'Reuters': 100,
  'Decrypt': 90,
  'Cointelegraph': 85,
  'CryptoCompare': 75,
  'CoinGecko': 80,
};
const DEFAULT_CREDIBILITY = 60;

// Keywords that indicate stablecoin/flow relevance
const RELEVANT_KEYWORDS = [
  'usdc', 'usdt', 'tether', 'circle', 'stablecoin',
  'mint', 'burn', 'treasury', 'reserve', 'peg',
  'depeg', 'redemption', 'attestation', 'audit',
  'regulation', 'sec', 'cftc', 'etf', 'custody', 'blackrock',
  'institutional', 'whale', 'capital', 'flow', 'liquidity',
  'coinbase', 'binance', 'defi', 'bridge',
  'federal reserve', 'fed', 'interest rate', 'monetary policy',
  'cbdc', 'digital dollar', 'digital currency',
  'bank run', 'silicon valley bank', 'banking crisis',
];

// ---- Main Aggregator ----

/**
 * Fetch news from ALL sources in parallel, deduplicate, score, and return
 * the top items ranked by relevance × credibility × recency.
 */
export async function fetchFilteredNews(): Promise<NewsItem[]> {
  return await newsLimiter.execute('news', async () => {
    // Fetch all sources in parallel — each can fail independently
    const [ccItems, cgItems, rssItems] = await Promise.all([
      fetchCryptoCompare().catch(err => {
        console.warn('[News:CryptoCompare] Failed:', err.message);
        return [] as NewsItem[];
      }),
      fetchCoinGeckoNews().catch(err => {
        console.warn('[News:CoinGecko] Failed:', err.message);
        return [] as NewsItem[];
      }),
      fetchAllRssFeeds().catch(err => {
        console.warn('[News:RSS] Failed:', err.message);
        return [] as NewsItem[];
      }),
    ]);

    const sourceCounts = {
      cryptocompare: ccItems.length,
      coingecko: cgItems.length,
      rss: rssItems.length,
    };

    // Merge all items
    const allItems = [...ccItems, ...cgItems, ...rssItems];

    // Deduplicate by title similarity
    const unique = deduplicateByTitle(allItems);

    // Rank by composite score: sentiment weight + credibility + recency
    const ranked = unique
      .map(item => ({
        ...item,
        _rank: computeRank(item),
      }))
      .sort((a, b) => b._rank - a._rank)
      .slice(0, 25) // Top 25 for production quality
      .map(({ _rank, ...item }) => item);

    console.log(
      `[News] Aggregated: CC=${sourceCounts.cryptocompare} CG=${sourceCounts.coingecko} RSS=${sourceCounts.rss} → ${allItems.length} total → ${unique.length} unique → ${ranked.length} ranked`
    );

    return ranked;
  });
}

// ---- Source 1: CryptoCompare ----

async function fetchCryptoCompare(): Promise<NewsItem[]> {
  const response = await fetch(CRYPTOCOMPARE_URL, { timeout: 10000 });
  const data = (await response.json()) as any;

  if (!data.Data || !Array.isArray(data.Data)) return [];

  return data.Data
    .filter((item: any) => isRelevant(item.title || ''))
    .slice(0, 30)
    .map((item: any) => toNewsItem({
      id: `cc-${item.id}`,
      timestamp: new Date((item.published_on || 0) * 1000).toISOString(),
      source: item.source_info?.name || item.source || 'CryptoCompare',
      title: item.title || '',
      url: item.url || item.guid || '',
    }));
}

// ---- Source 2: CoinGecko News ----

async function fetchCoinGeckoNews(): Promise<NewsItem[]> {
  const response = await fetch(COINGECKO_NEWS_URL, { timeout: 10000 });
  const data = (await response.json()) as any;

  if (!data.data || !Array.isArray(data.data)) return [];

  return data.data
    .filter((item: any) => isRelevant(item.title || item.description || ''))
    .slice(0, 30)
    .map((item: any) => toNewsItem({
      id: `cg-${item.id || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: item.updated_at
        ? new Date(item.updated_at * 1000).toISOString()
        : new Date().toISOString(),
      source: item.author || item.news_site || 'CoinGecko',
      title: item.title || '',
      url: item.url || '',
    }));
}

// ---- Source 3: RSS Feeds ----

async function fetchAllRssFeeds(): Promise<NewsItem[]> {
  const results = await Promise.all(
    RSS_FEEDS.map(feed => fetchSingleRssFeed(feed).catch(err => {
      console.warn(`[News:RSS:${feed.source}] Failed:`, err.message);
      return [] as NewsItem[];
    }))
  );
  return results.flat();
}

async function fetchSingleRssFeed(feed: { url: string; source: string }): Promise<NewsItem[]> {
  const parsed = await rssParser.parseURL(feed.url);

  if (!parsed.items) return [];

  return parsed.items
    .filter(item => isRelevant(item.title || item.contentSnippet || ''))
    .slice(0, 15) // Max per feed
    .map(item => toNewsItem({
      id: `rss-${feed.source.toLowerCase().replace(/\s/g, '')}-${item.guid || item.link || Date.now()}`,
      timestamp: item.isoDate || item.pubDate || new Date().toISOString(),
      source: feed.source,
      title: item.title || '',
      url: item.link || '',
    }));
}

// ---- Deduplication ----

/**
 * Remove duplicate stories across sources using normalized title comparison.
 * Keeps the version from the highest-credibility source.
 */
function deduplicateByTitle(items: NewsItem[]): NewsItem[] {
  const seen = new Map<string, NewsItem>();

  // Sort by credibility descending so we keep the best source
  const sorted = [...items].sort((a, b) => {
    const credA = SOURCE_CREDIBILITY[a.source] || DEFAULT_CREDIBILITY;
    const credB = SOURCE_CREDIBILITY[b.source] || DEFAULT_CREDIBILITY;
    return credB - credA;
  });

  for (const item of sorted) {
    const key = normalizeTitle(item.title);
    if (key.length < 10) continue; // Skip garbage titles

    // Check for similar existing titles
    let isDuplicate = false;
    for (const [existingKey] of seen) {
      if (titleSimilarity(key, existingKey) > 0.65) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.set(key, item);
    }
  }

  return Array.from(seen.values());
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Simple word-overlap similarity (Jaccard-like).
 * Fast enough for 100 items, no heavy NLP needed.
 */
function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(' ').filter(w => w.length > 2));
  const wordsB = new Set(b.split(' ').filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }
  return intersection / Math.max(wordsA.size, wordsB.size);
}

// ---- Ranking ----

/**
 * Composite ranking score combining:
 *   - Sentiment strength (absolute value matters for relevance)
 *   - Source credibility
 *   - Recency (exponential decay, half-life = 6 hours)
 */
function computeRank(item: NewsItem): number {
  const credibility = (SOURCE_CREDIBILITY[item.source] || DEFAULT_CREDIBILITY) / 100;
  const sentimentStrength = Math.abs(item.score) / 100; // 0-1
  const ageMs = Date.now() - new Date(item.timestamp).getTime();
  const ageHours = Math.max(0, ageMs / (1000 * 60 * 60));
  const recency = Math.exp(-ageHours / 6); // Half-life ≈ 6h

  // Weighted composite
  return (credibility * 0.35) + (sentimentStrength * 0.25) + (recency * 0.40);
}

// ---- Shared Utilities ----

function toNewsItem(raw: {
  id: string;
  timestamp: string;
  source: string;
  title: string;
  url: string;
}): NewsItem {
  const sentimentScore = calculateWeightedSentiment(raw.title);
  return {
    id: `news:${raw.id}`,
    timestamp: raw.timestamp,
    source: raw.source,
    title: raw.title,
    url: raw.url,
    sentiment: sentimentScoreToCategory(sentimentScore),
    relevantTokens: detectTokens(raw.title),
    score: sentimentScore,
  };
}

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase();
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

// ---- Sentiment Analysis ----

const STRONG_NEGATIVE = [
  'crash', 'dump', 'hack', 'exploit', 'collapse', 'bankruptcy',
  'depeg', 'insolvency', 'fraud', 'seizure', 'bank run', 'contagion',
];
const MILD_NEGATIVE = [
  'dip', 'concern', 'risk', 'weakness', 'downside', 'trouble',
  'decline', 'outflow', 'redemption', 'lawsuit', 'probe', 'investigation',
];
const STRONG_POSITIVE = [
  'surge', 'rally', 'bullish', 'moon', 'pump', 'soar',
  'record', 'milestone', 'breakthrough', 'approval', 'institutional adoption',
];
const MILD_POSITIVE = [
  'growth', 'adoption', 'partnership', 'upgrade', 'strength',
  'inflow', 'accumulation', 'expansion', 'integration', 'compliant',
];

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

function sentimentScoreToCategory(score: number): Sentiment {
  if (score > 20) return 'bullish';
  if (score < -20) return 'bearish';
  return 'neutral';
}
