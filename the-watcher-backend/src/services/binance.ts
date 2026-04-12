// ============================================
// THE WATCHER — Binance API Client
// ============================================
// Fetches exchange data for USDC/USDT pairs (FREE API)

import fetch from 'node-fetch';
import { API_CONFIG } from '../config';
import { binanceLimiter } from './rateLimiter';

const { BASE_URL } = API_CONFIG.BINANCE;

export interface TickerData {
  symbol: string;
  priceChange: number;
  priceChangePercent: number;
  weighted_avg_price: number;
  lastPrice: number;
  lastQty: number;
  bid_price: number;
  bid_qty: number;
  ask_price: number;
  ask_qty: number;
  open_price: number;
  high_price: number;
  low_price: number;
  volume: number;
  quoteAssetVolume: number;
  trades: number;
  taker_buy_base_asset_volume: number;
  taker_buy_quote_asset_volume: number;
}

export interface OrderBookDepth {
  bids: [string, string][]; // [price, quantity]
  asks: [string, string][];
}

export interface BinanceExchangeData {
  ticker: TickerData | null;
  orderBook: OrderBookDepth | null;
}

/**
 * Fetch spot prices for BTC and ETH (quoted in USDT).
 * Uses Binance's /ticker/price — simpler payload than /ticker/24hr.
 */
export async function fetchBtcEthPrices(): Promise<{ btc: number; eth: number }> {
  return await binanceLimiter.execute('binance', async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/ticker/price?symbols=${encodeURIComponent('["BTCUSDT","ETHUSDT"]')}`
      );
      const data = (await res.json()) as Array<{ symbol: string; price: string }>;
      if (!Array.isArray(data)) {
        console.warn('[Binance] Unexpected price response:', data);
        return { btc: 0, eth: 0 };
      }
      const btc = parseFloat(data.find((d) => d.symbol === 'BTCUSDT')?.price || '0');
      const eth = parseFloat(data.find((d) => d.symbol === 'ETHUSDT')?.price || '0');
      return { btc, eth };
    } catch (error) {
      console.error('[Binance] BTC/ETH price fetch error:', error);
      return { btc: 0, eth: 0 };
    }
  });
}

/**
 * Fetch 24h ticker data for USDC/USDT pair.
 */
export async function fetchTickerData(): Promise<TickerData | null> {
  console.log('[Binance] Fetching ticker data...');

  return await binanceLimiter.execute('binance', async () => {
    try {
      const url = `${BASE_URL}/ticker/24hr?symbol=USDCUSDT`;

      const response = await fetch(url);
      const data = (await response.json()) as TickerData;

      if (data && data.symbol) {
        return data;
      }

      console.warn('[Binance] Unexpected ticker response');
      return null;
    } catch (error) {
      console.error('[Binance] Ticker fetch error:', error);
      return null;
    }
  });
}

/**
 * Fetch order book depth for USDC/USDT.
 * Shows buy/sell pressure at different price levels.
 */
export async function fetchOrderBookDepth(limit: number = 20): Promise<OrderBookDepth | null> {
  console.log('[Binance] Fetching order book depth...');

  return await binanceLimiter.execute('binance', async () => {
    try {
      const url = `${BASE_URL}/depth?symbol=USDCUSDT&limit=${limit}`;

      const response = await fetch(url);
      const data = (await response.json()) as any;

      if (data && Array.isArray(data.bids) && Array.isArray(data.asks)) {
        return {
          bids: data.bids,
          asks: data.asks,
        };
      }

      console.warn('[Binance] Unexpected depth response');
      return null;
    } catch (error) {
      console.error('[Binance] Depth fetch error:', error);
      return null;
    }
  });
}

/**
 * Get combined exchange data.
 */
export async function fetchExchangeData(): Promise<BinanceExchangeData> {
  const [ticker, orderBook] = await Promise.all([
    fetchTickerData(),
    fetchOrderBookDepth(),
  ]);

  return {
    ticker,
    orderBook,
  };
}

/**
 * Calculate buy/sell pressure from order book.
 * Positive = more buyers, Negative = more sellers.
 */
export function calculateBuySellPressure(orderBook: OrderBookDepth): number {
  if (!orderBook || !orderBook.bids || !orderBook.asks) return 0;

  let buyVolume = 0;
  let sellVolume = 0;

  for (const [, qty] of orderBook.bids) {
    buyVolume += parseFloat(qty);
  }

  for (const [, qty] of orderBook.asks) {
    sellVolume += parseFloat(qty);
  }

  if (buyVolume + sellVolume === 0) return 0;
  return ((buyVolume - sellVolume) / (buyVolume + sellVolume)) * 100;
}

/**
 * Get exchange flow signal.
 * -100 = strong selling, 0 = neutral, +100 = strong buying
 */
export async function getExchangeFlowSignal(): Promise<number> {
  const data = await fetchExchangeData();

  if (!data.orderBook) return 0;

  const pressure = calculateBuySellPressure(data.orderBook);

  // Scale to -100 to +100
  return Math.round(Math.max(-100, Math.min(100, pressure)));
}
