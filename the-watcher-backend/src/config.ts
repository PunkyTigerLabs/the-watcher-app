// ============================================
// THE WATCHER — Configuration Constants
// ============================================

import dotenv from 'dotenv';
dotenv.config();

// Supported assets and chains — nothing implicit
export const SUPPORTED_ASSETS = {
  USDC: ['ETH', 'BASE', 'solana'] as const,
  USDT: ['ETH', 'TRON'] as const,
} as const;

// Contract addresses
export const CONTRACTS = {
  USDC: {
    ETH: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    BASE: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    SOLANA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  },
  USDT: {
    ETH: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    TRON: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  },
} as const;

// Treasury addresses
export const TREASURIES = {
  USDC_CIRCLE: '0x55FE002aefF02F77364de339a1292923A15844B8',
  USDT_ETHEREUM: '0x5754284f345afc66a98fbB0a0Afe71e0F007B949',
  USDT_TRON: 'TKHuVq1oKVruCGLvDBhBmjtxtECe15RGSW',
} as const;

export const DECIMALS = { USDC: 6, USDT: 6 } as const;

// Zero address for mint/burn detection
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const TRON_ZERO_ADDRESS = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb'; // Tron's 0x0

// Relevance and threshold constants
export const THRESHOLDS = {
  CRITICAL_AMOUNT: 100_000_000,    // $100M — push notification
  HIGH_AMOUNT: 10_000_000,         // $10M — show in feed
  MEDIUM_AMOUNT: 1_000_000,        // $1M — PRO feed
  TRON_HIGH: 5_000_000,            // $5M on Tron = notable
  PUSH_THRESHOLD: 50_000_000,      // $50M — push alert
  EXCHANGE_SPIKE: 200_000_000,     // $200M in 2h to one exchange
  SUPPLY_SHOCK: 1_000_000_000,     // $1B combined net mint
  SUPPLY_CONTRACTION: 500_000_000, // $500M combined net burn
  TRON_DOMINANCE: 0.65,            // 65% = elevated
  QUIET_THRESHOLD: 0.30,           // 30% of 7d avg = unusually quiet
  WHALE_CLUSTER_COUNT: 3,          // 3+ institutional moves
  WHALE_CLUSTER_AMOUNT: 50_000_000,// $50M per move
  RAPID_RELAY_TOLERANCE: 0.05,     // ±5% amount match
} as const;

// Signal Engine weights
export const SIGNAL_WEIGHTS = {
  USDC_FLOW: 0.30,
  USDT_FLOW: 0.30,
  WHALE_ACTIVITY: 0.20,
  DIVERGENCE: 0.10,
  SENTIMENT: 0.10,
} as const;

// Cron schedules
export const CRON_INTERVALS = {
  EVENTS: '*/5 * * * *',          // Every 5 minutes
  SIGNAL: '*/5 * * * *',          // Every 5 minutes
  NEWS: '*/10 * * * *',           // Every 10 minutes
  SUPPLY: '*/15 * * * *',         // Every 15 minutes
  FEAR_GREED: '0 * * * *',        // Every hour
  SNAPSHOT: '*/5 * * * *',        // Every 5 min — save state for fallback
  SOLANA: '*/5 * * * *',          // Every 5 minutes
  COINGECKO: '*/15 * * * *',      // Every 15 minutes
  DEFILLAMA: '*/30 * * * *',      // Every 30 minutes
  BINANCE: '*/5 * * * *',         // Every 5 minutes
} as const;

// API configuration
export const API_CONFIG = {
  ETHERSCAN: {
    BASE_URL: 'https://api.etherscan.io/api',
    API_KEY: process.env.ETHERSCAN_API_KEY || '',
    RATE_LIMIT: 5, // calls per second
  },
  BASESCAN: {
    BASE_URL: 'https://api.basescan.org/api',
    API_KEY: process.env.BASESCAN_API_KEY || '',
    RATE_LIMIT: 5,
  },
  TRONGRID: {
    BASE_URL: 'https://api.trongrid.io',
    API_KEY: process.env.TRONGRID_API_KEY || '',
    RATE_LIMIT: 15,
  },
  SOLSCAN: {
    BASE_URL: 'https://public-api.solscan.io',
    RATE_LIMIT: 10,
  },
  CRYPTOCOMPARE: {
    BASE_URL: 'https://min-api.cryptocompare.com/data/v2',
    // Free tier — no API key required for news endpoint
  },
  FEAR_GREED: {
    BASE_URL: 'https://api.alternative.me/fng',
  },
  COINGECKO: {
    BASE_URL: 'https://api.coingecko.com/api/v3',
  },
  DEFILLAMA: {
    BASE_URL: 'https://stablecoins.llama.fi',
  },
  BINANCE: {
    BASE_URL: 'https://api.binance.com/api/v3',
    RATE_LIMIT: 1200, // per minute
  },
} as const;

// Server config
export const SERVER = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  WATCHER_API_KEY: process.env.WATCHER_API_KEY || 'dev-key',
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  ENABLE_ANALYST: process.env.ENABLE_ANALYST === 'true',
} as const;

// Free vs PRO display limits
export const DISPLAY_LIMITS = {
  FREE: {
    EVENTS: 5,
    TOP_FLOWS: 3,
    MIN_RELEVANCE: 'high' as const,
  },
  PRO: {
    EVENTS: 50,
    TOP_FLOWS: 10,
    MIN_RELEVANCE: 'medium' as const,
  },
} as const;
