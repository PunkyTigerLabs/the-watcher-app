// ============================================
// THE WATCHER — Basescan API Client
// ============================================
// Fetches USDC token transfers from Base chain

import fetch from 'node-fetch';
import { API_CONFIG, CONTRACTS } from '../config';
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
export async function fetchUSDCTransfersBASE(): Promise<CanonicalEvent[]> {
  console.log('[Blockscout-Base] Fetching USDC transfers on BASE...');

  return await basescanLimiter.execute('basescan', async () => {
    const url = `${BASE_URL}?module=account&action=tokentx` +
      `&contractaddress=${CONTRACTS.USDC.BASE}` +
      `&page=1&offset=100&sort=desc`;

    const response = await fetch(url);
    const data = (await response.json()) as BasescanResponse;

    if (data.status !== '1' || !Array.isArray(data.result)) {
      console.warn(`[Blockscout-Base] API returned: ${data.message} — ${typeof data.result === 'string' ? data.result : ''}`);
      return [];
    }

    const events = normalizeEtherscanBatch(data.result, 'USDC', 'BASE', 'basescan');
    console.log(`[Blockscout-Base] Got ${events.length} USDC events from BASE`);
    return events;
  });
}
