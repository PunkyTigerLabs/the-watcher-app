// ============================================
// THE WATCHER — Etherscan API Client
// ============================================
// Fetches USDC and USDT token transfers from Ethereum

import fetch from 'node-fetch';
import { API_CONFIG, CONTRACTS } from '../config';
import { EtherscanTransfer, Token, CanonicalEvent } from '../types';
import { normalizeEtherscanBatch } from '../normalize/etherscan';
import { etherscanLimiter } from './rateLimiter';

const { BASE_URL, API_KEY } = API_CONFIG.ETHERSCAN;

interface EtherscanResponse {
  status: string;
  message: string;
  result: EtherscanTransfer[] | string;
}

/**
 * Fetch recent token transfers for a given contract.
 * Uses Etherscan's tokentx endpoint with rate limiting.
 */
async function fetchTokenTransfers(
  contractAddress: string,
  chainId: number = API_CONFIG.ETHERSCAN.CHAIN_ID_ETH,
  page: number = 1,
  offset: number = 100, // Max 100 results per call for free tier
  sort: 'asc' | 'desc' = 'desc'
): Promise<EtherscanTransfer[]> {
  if (!API_KEY) {
    console.warn('[Etherscan] No API key configured — skipping');
    return [];
  }

  return await etherscanLimiter.execute('etherscan', async () => {
    const url = `${BASE_URL}?chainid=${chainId}&module=account&action=tokentx` +
      `&contractaddress=${contractAddress}` +
      `&page=${page}&offset=${offset}&sort=${sort}` +
      `&apikey=${API_KEY}`;

    const response = await fetch(url);
    const data = (await response.json()) as EtherscanResponse;

    if (data.status !== '1' || !Array.isArray(data.result)) {
      console.warn(`[Etherscan v2 chain=${chainId}] API returned: ${data.message} — ${typeof data.result === 'string' ? data.result : ''}`);
      return [];
    }

    return data.result;
  });
}

/**
 * Fetch recent USDC transfers on Ethereum.
 */
export async function fetchUSDCTransfersETH(): Promise<CanonicalEvent[]> {
  console.log('[Etherscan] Fetching USDC transfers on ETH...');
  const transfers = await fetchTokenTransfers(CONTRACTS.USDC.ETH);
  const events = normalizeEtherscanBatch(transfers, 'USDC', 'ETH', 'etherscan');
  console.log(`[Etherscan] Got ${events.length} USDC events from ETH`);
  return events;
}

/**
 * Fetch recent USDT transfers on Ethereum.
 */
export async function fetchUSDTTransfersETH(): Promise<CanonicalEvent[]> {
  console.log('[Etherscan] Fetching USDT transfers on ETH...');
  const transfers = await fetchTokenTransfers(CONTRACTS.USDT.ETH);
  const events = normalizeEtherscanBatch(transfers, 'USDT', 'ETH', 'etherscan');
  console.log(`[Etherscan] Got ${events.length} USDT events from ETH`);
  return events;
}

/**
 * Fetch total supply of a token contract.
 */
export async function fetchTokenSupply(
  contractAddress: string,
  chainId: number = API_CONFIG.ETHERSCAN.CHAIN_ID_ETH
): Promise<number> {
  if (!API_KEY) return 0;

  return await etherscanLimiter.execute('etherscan', async () => {
    const url = `${BASE_URL}?chainid=${chainId}&module=stats&action=tokensupply` +
      `&contractaddress=${contractAddress}` +
      `&apikey=${API_KEY}`;

    const response = await fetch(url);
    const data = (await response.json()) as { status: string; message?: string; result: string };

    if (data.status !== '1') {
      console.warn(`[Etherscan v2 chain=${chainId}] tokensupply: ${data.message} — ${data.result}`);
      return 0;
    }
    return parseFloat(data.result) / 1e6; // USDC/USDT have 6 decimals
  });
}
