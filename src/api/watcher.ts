// ============================================
// THE WATCHER — API Client
// ============================================
// Connects frontend to backend. Replaces all mockData.

const BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://the-watcher-backend-production.up.railway.app';

// Store the API key in memory (PRO users)
let apiKey: string | null = null;

export function setApiKey(key: string) {
  apiKey = key;
}

export function getApiKey(): string | null {
  return apiKey;
}

export function isPro(): boolean {
  return apiKey !== null;
}

async function fetchApi<T>(path: string, options?: { timeout?: number }): Promise<T> {
  const timeout = options?.timeout ?? 10000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['x-watcher-key'] = apiKey;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new WatcherError('PRO_REQUIRED', 'This feature requires a PRO subscription');
      }
      throw new WatcherError('API_ERROR', `API error: ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof WatcherError) throw error;
    if ((error as Error).name === 'AbortError') {
      throw new WatcherError('TIMEOUT', 'Request timed out');
    }
    throw new WatcherError('NETWORK', 'Network error — check connection');
  } finally {
    clearTimeout(timer);
  }
}

export class WatcherError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// ---- Types ----

export interface OverviewData {
  headline: string;
  subHeadline: string;
  minted24h: number;
  burned24h: number;
  net24h: number;
  eventCount: number;
  topFlows: FlowItem[];
  tronShare?: number;
}

export interface FlowItem {
  txHash: string;
  token: string;
  type: 'MINT' | 'BURN' | 'TRANSFER';
  amount: number;
  from: string;
  fromLabel: string | null;
  to: string;
  toLabel: string | null;
  chain: string;
  timestamp: string;
  relevance: string;
}

export interface SignalData {
  score: number;
  label: string;
  subscores?: {
    usdc: number;
    usdt: number;
    whales: number;
    divergence: number;
    sentiment: number;
  };
  weights?: {
    usdc: number;
    usdt: number;
    whales: number;
    divergence: number;
    sentiment: number;
  };
  decisionContext?: string[];
  headline?: string;
  updatedAt: string;
}

export interface SignalHistoryPoint {
  score: number;
  label: string;
  timestamp: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  sentiment: string;
  publishedAt: string;
}

export interface FearGreedData {
  value: number;
  classification: string;
  timestamp: string;
}

export interface PatternFlag {
  id: string;
  name: string;
  severity: string;
  description: string;
  detectedAt: string;
  active: boolean;
}

export interface AnalystNarrative {
  narrative: string;
  generatedAt: string;
  cached: boolean;
}

export interface HealthData {
  status: string;
  uptime: number;
  lastUpdate: string | null;
  eventCount: number;
  walletLabels: number;
  version: string;
}

export interface WhaleWallet {
  address: string;
  label: string;
  type: string;
  chain: string;
  totalVolume: number;
  eventCount: number;
  lastSeen: string;
}

// ---- API Methods ----

export const WatcherAPI = {
  // Health check
  health: () => fetchApi<HealthData>('/health'),

  // USDC (FREE)
  usdcOverview: () => fetchApi<OverviewData>('/usdc/overview'),

  // USDC events (PRO)
  usdcEvents: (limit = 50) => fetchApi<{ events: FlowItem[]; total: number }>(`/usdc/events?limit=${limit}`),

  // USDC stats
  usdcStats: (hours = 24) => fetchApi<{ mints: number; burns: number; eventCount: number }>(`/usdc/stats?hours=${hours}`),

  // USDT (FREE)
  usdtOverview: () => fetchApi<OverviewData>('/usdt/overview'),

  // USDT events (PRO)
  usdtEvents: (limit = 50) => fetchApi<{ events: FlowItem[]; total: number }>(`/usdt/events?limit=${limit}`),

  // USDT stats
  usdtStats: (hours = 24) => fetchApi<{ mints: number; burns: number; eventCount: number }>(`/usdt/stats?hours=${hours}`),

  // Signal (FREE = score only, PRO = full)
  signal: (full = false) => fetchApi<SignalData>(`/signal${full ? '?full=true' : ''}`),

  // Signal history
  signalHistory: (limit = 30) => fetchApi<{ history: SignalHistoryPoint[] }>(`/signal/history?limit=${limit}`),

  // News (PRO)
  news: (limit = 20) => fetchApi<{ news: NewsItem[] }>(`/intel/news?limit=${limit}`),

  // Fear & Greed (PRO)
  fearGreed: () => fetchApi<FearGreedData>('/intel/feargreed'),

  // Whales (PRO)
  whales: () => fetchApi<{ whales: WhaleWallet[] }>('/whales'),

  // Analyst narrative (PRO)
  analyst: () => fetchApi<AnalystNarrative>('/analyst'),
};

export default WatcherAPI;
