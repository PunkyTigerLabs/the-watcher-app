// ============================================
// THE WATCHER — Canonical Types
// ============================================
// EVERY service, endpoint, and UI component speaks this language.

export type Token = 'USDC' | 'USDT';
export type Chain = 'ETH' | 'BASE' | 'TRON';
export type EventType = 'MINT' | 'BURN' | 'TRANSFER';
export type EntityType = 'Treasury' | 'CEX' | 'Institutional' | 'DeFi' | 'Bridge' | 'Unknown';
export type Relevance = 'critical' | 'high' | 'medium' | 'low';
export type DataSource = 'etherscan' | 'basescan' | 'trongrid';
export type PatternSeverity = 'alert' | 'watch' | 'info';
export type Sentiment = 'bullish' | 'bearish' | 'neutral';
export type SignalLabel =
  | 'STRONG ACCUMULATION'
  | 'ACCUMULATION'
  | 'NEUTRAL'
  | 'DISTRIBUTION'
  | 'STRONG DISTRIBUTION';

// THE universal event type. Everything normalizes to this.
export interface CanonicalEvent {
  id: string;                // Unique: `${token}:${chain}:${txHash}:${logIndex}`
  timestamp: string;         // ISO 8601
  token: Token;
  chain: Chain;
  type: EventType;
  from: string;              // Full address
  to: string;                // Full address
  amount: number;            // Human-readable (already divided by decimals)
  amountUsd: number;         // USD value (for stablecoins, same as amount)
  fromEntity: string;        // Resolved name or "Unknown"
  toEntity: string;          // Resolved name or "Unknown"
  fromEntityType: EntityType;
  toEntityType: EntityType;
  source: DataSource;
  txHash: string;
  relevance: Relevance;
}

export interface PatternFlag {
  id: string;
  pattern: string;
  severity: PatternSeverity;
  message: string;
  timestamp: string;
  active: boolean;
}

export interface SignalSubscores {
  usdc: number;
  usdt: number;
  whales: number;
  divergence: number;
  sentiment: number;
}

export interface SignalResult {
  score: number;             // -100 to +100
  label: SignalLabel;
  headline: string;
  subscores: SignalSubscores;
  divergenceNote: string;
  decisionContext: string[];
  activePatterns: PatternFlag[];
  updatedAt: string;
}

export interface OverviewResponse {
  token: Token;
  status: 'live' | 'snapshot' | 'demo';
  updatedAt: string;
  headline: string;
  stats: {
    printed24h: number;
    burned24h: number;
    net24h: number;
    totalSupply: number;
  };
  events: CanonicalEvent[];
  topInflows: FlowSummary[];
  topOutflows: FlowSummary[];
  tronShare?: number;        // USDT only
}

export interface FlowSummary {
  entity: string;
  entityType: EntityType;
  totalAmount: number;
  eventCount: number;
  direction: 'in' | 'out';
  lastSeen: string;
}

export interface NewsItem {
  id: string;
  timestamp: string;
  source: string;
  title: string;
  url: string;
  sentiment: Sentiment;
  relevantTokens: Token[];
  score: number;
}

export interface WalletLabel {
  address: string;
  name: string;
  type: EntityType;
  chains: Chain[];
}

// Raw API response types (before normalization)
export interface EtherscanTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  logIndex?: string;
  contractAddress: string;
}

export interface TronGridTransfer {
  transaction_id: string;
  block_timestamp: number;
  from: string;
  to: string;
  value: string;
  type: string;
  token_info: {
    symbol: string;
    address: string;
    decimals: number;
    name: string;
  };
}
