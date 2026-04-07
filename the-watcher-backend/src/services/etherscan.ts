// ============================================
// THE WATCHER — Etherscan API Client
// ============================================
// Fetches USDC and USDT token transfers from Ethereum

import fetch from 'node-fetch';
import { API_CONFIG, CONTRACTS } from '../config';
import { EtherscanTransfer, Token, CanonicalEvent } from '../types';
import { normalizeEtherscanBatch } from '../normalize/etherscan';

const { BASE_URL, API_KEY } = API_CONFIG.ETHERSCAN;

interface EtherscanResponse {
  status: string;
  message: string;
  result: EtherscanTransfer[] | string;
}

/**
 * Fetch recent token transfers for a given contract.
 * Uses Etherscan's tokentx endpoint.
 */
async function fetchTokenTransfers(
  contractAddress: string,
  page: number = 1,
  offset: number = 100, // Max 100 results per call for free tier
  sort: 'asc' | 'desc' = 'desc'
): Promise<EtherscanTransfer[]> {
  if (!API_KEY) {
    console.warn('[Etherscan] No API key configured — skipping');
    return [];
  }

  const url = `${BASE_URL}?module=account&action=tokentx` +
    `&contractaddress=${contractAddress}` +
    `&page=${page}&offset=${offset}&sort=${sort}` +
    `&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = (await response.json()) as EtherscanResponse;

    if (data.status !== '1' || !Array.isArray(data.result)) {
      console.warn(`[Etherscan] API returned: ${data.message}`);
      return [];
    }

    return data.result;
  } catch (error) {
    console.error('[Etherscan] Fetch error:', error);
    return [];
  }
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
export async function fetchTokenSupply(contractAddress: string): Promise<number> {
  if (!API_KEY) return 0;

  const url = `${BASE_URL}?module=stats&action=tokensupply` +
    `&contractaddress=${contractAddress}` +
    `&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = (await response.json()) as { status: string; result: string };

    if (data.status !== '1') return 0;
    return parseFloat(data.result) / 1e6; // USDC/USDT have 6 decimals
  } catch (error) {
    console.error('[Etherscan] Supply fetch error:', error);
    return 0;
  }
}
