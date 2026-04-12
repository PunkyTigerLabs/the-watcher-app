// ============================================
// THE WATCHER — Basescan API Client
// ============================================
// Fetches USDC token transfers from Base chain

import fetch from 'node-fetch';
import { API_CONFIG, CONTRACTS, ZERO_ADDRESS } from '../config';
import { EtherscanTransfer, CanonicalEvent } from '../types';
import { normalizeEtherscanBatch } from '../normalize/etherscan';
import { basescanLimiter } from './rateLimiter';

const { BASE_URL } = API_CONFIG.BASESCAN;

interface BasescanResponse {
  status: string;
  message: string;
  result: EtherscanTransfer[] | string;
}

/**
 * Fetch recent USDC transfers on Base.
 * Basescan uses the same API format as Etherscan.
 */
export async function fetchUSDCTransfersBASE(page: number = 1): Promise<CanonicalEvent[]> {
  console.log(`[Blockscout-Base] Fetching USDC transfers on BASE (page ${page})...`);

  return await basescanLimiter.execute('basescan', async () => {
    const url = `${BASE_URL}?module=account&action=tokentx` +
      `&contractaddress=${CONTRACTS.USDC.BASE}` +
      `&page=${page}&offset=1000&sort=desc`;

    const response = await fetch(url);
    const data = (await response.json()) as BasescanResponse;

    if (data.status !== '1' || !Array.isArray(data.result)) {
      console.warn(`[Blockscout-Base] API returned: ${data.message} — ${typeof data.result === 'string' ? data.result : ''}`);
      return [];
    }

    const events = normalizeEtherscanBatch(data.result, 'USDC', 'BASE', 'basescan');
    console.log(`[Blockscout-Base] Got ${events.length} USDC events from BASE (page ${page})`);
    return events;
  });
}

/**
 * USDC mint/burn on Base via zero-address filter.
 */
export async function fetchMintBurnBASE(page: number = 1): Promise<CanonicalEvent[]> {
  console.log(`[Blockscout-Base] Fetching USDC mint/burn on BASE (page ${page})...`);
  return await basescanLimiter.execute('basescan', async () => {
    const url = `${BASE_URL}?module=account&action=tokentx` +
      `&address=${ZERO_ADDRESS}` +
      `&contractaddress=${CONTRACTS.USDC.BASE}` +
      `&page=${page}&offset=1000&sort=desc`;
    const response = await fetch(url);
    const data = (await response.json()) as BasescanResponse;
    if (data.status !== '1' || !Array.isArray(data.result)) {
      console.warn(`[Blockscout-Base] mint/burn fetch failed: ${data.message}`);
      return [];
    }
    const events = normalizeEtherscanBatch(data.result, 'USDC', 'BASE', 'basescan');
    console.log(`[Blockscout-Base] Got ${events.length} USDC mint/burn events from BASE`);
    return events;
  });
}
