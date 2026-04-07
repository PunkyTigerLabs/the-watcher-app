// ============================================
// THE WATCHER — DefiLlama API Client
// ============================================
// Fetches stablecoin supply by chain (FREE API)

import fetch from 'node-fetch';
import { API_CONFIG } from '../config';
import { defillamaLimiter } from './rateLimiter';

const { BASE_URL } = API_CONFIG.DEFILLAMA;

export interface StablecoinChainSupply {
  name: string;
  tvl: number;
  circulating: number;
  minted: number;
}

export interface StablecoinSupplyBreakdown {
  name: string;
  symbol: string;
  address: string;
  supply: number;
  chainBreakdown: Record<string, StablecoinChainSupply>;
}

export interface DefillamaSupplyData {
  usdcData: StablecoinSupplyBreakdown | null;
  usdtData: StablecoinSupplyBreakdown | null;
}

/**
 * Fetch stablecoin supply breakdown by chain.
 */
export async function fetchStablecoinSupplyByChain(): Promise<DefillamaSupplyData> {
  console.log('[DefiLlama] Fetching stablecoin supply by chain...');

  return await defillamaLimiter.execute('defillama', async () => {
    const result: DefillamaSupplyData = {
      usdcData: null,
      usdtData: null,
    };

    try {
      // Fetch stablecoins list
      const url = `${BASE_URL}/stablecoins`;

      const response = await fetch(url);
      const data = (await response.json()) as any;

      if (data && Array.isArray(data.stablecoins)) {
        for (const stablecoin of data.stablecoins) {
          if (stablecoin.symbol === 'USDC') {
            result.usdcData = parseStablecoinData(stablecoin);
          } else if (stablecoin.symbol === 'USDT') {
            result.usdtData = parseStablecoinData(stablecoin);
          }
        }
      }
    } catch (error) {
      console.error('[DefiLlama] Fetch error:', error);
    }

    return result;
  });
}

/**
 * Fetch stablecoin TVL by chain.
 */
export async function fetchStablecoinTVLByChain(): Promise<Record<string, number>> {
  console.log('[DefiLlama] Fetching stablecoin TVL by chain...');

  return await defillamaLimiter.execute('defillama', async () => {
    const result: Record<string, number> = {};

    try {
      const url = `${BASE_URL}/stablecoinchains`;

      const response = await fetch(url);
      const data = (await response.json()) as any;

      if (data && Array.isArray(data.chains)) {
        for (const chain of data.chains) {
          result[chain.name] = chain.tvl || 0;
        }
      }
    } catch (error) {
      console.error('[DefiLlama] TVL fetch error:', error);
    }

    return result;
  });
}

/**
 * Parse stablecoin data from DefiLlama response.
 */
function parseStablecoinData(stablecoin: any): StablecoinSupplyBreakdown {
  const chainBreakdown: Record<string, StablecoinChainSupply> = {};

  if (stablecoin.chainBreakdowns) {
    const entries = Object.entries(stablecoin.chainBreakdowns) as [string, any][];
    for (const [chain, data] of entries) {
      chainBreakdown[chain] = {
        name: chain,
        tvl: data.tvl || 0,
        circulating: data.circulating || 0,
        minted: data.minted || 0,
      };
    }
  }

  return {
    name: stablecoin.name,
    symbol: stablecoin.symbol,
    address: stablecoin.address || '',
    supply: stablecoin.totalSupply || 0,
    chainBreakdown,
  };
}
