// ============================================
// THE WATCHER — Basescan API Client
// ============================================
// Fetches USDC token transfers from Base chain

import fetch from 'node-fetch';
import { API_CONFIG, CONTRACTS } from '../config';
import { EtherscanTransfer, CanonicalEvent } from '../types';
import { normalizeEtherscanBatch } from '../normalize/etherscan';

const { BASE_URL, API_KEY } = API_CONFIG.BASESCAN;

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
  if (!API_KEY) {
    console.warn('[Basescan] No API key configured — skipping');
    return [];
  }

  console.log('[Basescan] Fetching USDC transfers on BASE...');

  const url = `${BASE_URL}?module=account&action=tokentx` +
    `&contractaddress=${CONTRACTS.USDC.BASE}` +
    `&page=1&offset=100&sort=desc` +
    `&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = (await response.json()) as BasescanResponse;

    if (data.status !== '1' || !Array.isArray(data.result)) {
      console.warn(`[Basescan] API returned: ${data.message}`);
      return [];
    }

    const events = normalizeEtherscanBatch(data.result, 'USDC', 'BASE', 'basescan');
    console.log(`[Basescan] Got ${events.length} USDC events from BASE`);
    return events;
  } catch (error) {
    console.error('[Basescan] Fetch error:', error);
    return [];
  }
}
