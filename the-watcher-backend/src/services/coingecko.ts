// ============================================
// THE WATCHER — CoinGecko API Client
// ============================================
// Fetches stablecoin market caps and supply data (FREE API)

import fetch from 'node-fetch';
import { API_CONFIG } from '../config';
import { coingeckoLimiter } from './rateLimiter';

const { BASE_URL } = API_CONFIG.COINGECKO;

export interface StablecoinMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_24h: number;
  market_cap_change_24h: number;
}

export interface GlobalMarketData {
  total_market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  btc_dominance: number;
  ethereum_dominance: number;
}

export interface CoinGeckoResponse {
  usdcData: StablecoinMarketData | null;
  usdtData: StablecoinMarketData | null;
  globalData: GlobalMarketData | null;
}

/**
 * Fetch stablecoin market caps from CoinGecko.
 */
export async function fetchStablecoinData(): Promise<CoinGeckoResponse> {
  console.log('[CoinGecko] Fetching stablecoin market data...');

  return await coingeckoLimiter.execute('coingecko', async () => {
    const result: CoinGeckoResponse = {
      usdcData: null,
      usdtData: null,
      globalData: null,
    };

    try {
      // Fetch USDC and USDT market data
      const marketUrl = `${BASE_URL}/coins/markets` +
        `?ids=usd-coin,tether` +
        `&vs_currency=usd` +
        `&order=market_cap_desc` +
        `&per_page=2` +
        `&sparkline=false`;

      const marketResponse = await fetch(marketUrl);
      const marketData = (await marketResponse.json()) as StablecoinMarketData[];

      if (Array.isArray(marketData)) {
        for (const coin of marketData) {
          if (coin.id === 'usd-coin') {
            result.usdcData = coin;
          } else if (coin.id === 'tether') {
            result.usdtData = coin;
          }
        }
      }
    } catch (error) {
      console.error('[CoinGecko] Market data fetch error:', error);
    }

    try {
      // Fetch global market data
      const globalUrl = `${BASE_URL}/global`;

      const globalResponse = await fetch(globalUrl);
      const globalData = (await globalResponse.json()) as any;

      if (globalData.data) {
        result.globalData = {
          total_market_cap: globalData.data.total_market_cap || {},
          total_volume: globalData.data.total_volume || {},
          btc_dominance: globalData.data.btc_market_cap_percentage || 0,
          ethereum_dominance: globalData.data.eth_market_cap_percentage || 0,
        };
      }
    } catch (error) {
      console.error('[CoinGecko] Global data fetch error:', error);
    }

    return result;
  });
}

/**
 * Fetch BTC and ETH spot prices from CoinGecko.
 * Use this as the primary source — Binance public API blocks Railway/AWS egress.
 */
export async function fetchBtcEthPrices(): Promise<{ btc: number; eth: number }> {
  return await coingeckoLimiter.execute('coingecko', async () => {
    try {
      const url = `${BASE_URL}/simple/price?ids=bitcoin,ethereum&vs_currencies=usd`;
      const res = await fetch(url);
      const data = (await res.json()) as { bitcoin?: { usd: number }; ethereum?: { usd: number } };
      return {
        btc: data.bitcoin?.usd ?? 0,
        eth: data.ethereum?.usd ?? 0,
      };
    } catch (error) {
      console.error('[CoinGecko] Price fetch error:', error);
      return { btc: 0, eth: 0 };
    }
  });
}

/**
 * Get supply data for USDC and USDT.
 */
export async function fetchSupplyData(): Promise<{
  usdc: { supply: number; marketCap: number } | null;
  usdt: { supply: number; marketCap: number } | null;
}> {
  const data = await fetchStablecoinData();

  return {
    usdc: data.usdcData ? {
      supply: data.usdcData.market_cap || 0, // Market cap ≈ supply for stablecoins
      marketCap: data.usdcData.market_cap || 0,
    } : null,
    usdt: data.usdtData ? {
      supply: data.usdtData.market_cap || 0,
      marketCap: data.usdtData.market_cap || 0,
    } : null,
  };
}
