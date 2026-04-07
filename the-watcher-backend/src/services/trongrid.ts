// ============================================
// THE WATCHER — TronGrid API Client
// ============================================
// Fetches USDT token transfers from TRON — THE UNDERGROUND LAYER

import fetch from 'node-fetch';
import { API_CONFIG, CONTRACTS } from '../config';
import { TronGridTransfer, CanonicalEvent } from '../types';
import { normalizeTronBatch } from '../normalize/trongrid';

const { BASE_URL, API_KEY } = API_CONFIG.TRONGRID;

interface TronGridResponse {
  data: TronGridTransfer[];
  success: boolean;
  meta: {
    at: number;
    fingerprint?: string;
    page_size: number;
  };
}

/**
 * Fetch recent USDT TRC-20 transfers on TRON.
 * TronGrid uses a different API format than Etherscan.
 */
export async function fetchUSDTTransfersTRON(): Promise<CanonicalEvent[]> {
  console.log('[TronGrid] Fetching USDT transfers on TRON...');

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (API_KEY) {
    headers['TRON-PRO-API-KEY'] = API_KEY;
  }

  try {
    // Fetch TRC-20 transfers for the USDT contract
    // We query the contract's transfer events
    const url = `${BASE_URL}/v1/contracts/${CONTRACTS.USDT.TRON}/events` +
      `?event_name=Transfer&order_by=block_timestamp,desc&limit=100`;

    const response = await fetch(url, { headers });
    const data = (await response.json()) as any;

    if (!data.data || !Array.isArray(data.data)) {
      console.warn('[TronGrid] Unexpected response format');

      // Fallback: try the account-based TRC20 transfer endpoint
      return await fetchUSDTViaAccountEndpoint(headers);
    }

    // TronGrid event format needs special handling
    const transfers: TronGridTransfer[] = data.data.map((event: any) => ({
      transaction_id: event.transaction_id,
      block_timestamp: event.block_timestamp,
      from: event.result?.from || event.result?._from || '',
      to: event.result?.to || event.result?._to || '',
      value: event.result?.value || event.result?._value || '0',
      type: 'Transfer',
      token_info: {
        symbol: 'USDT',
        address: CONTRACTS.USDT.TRON,
        decimals: 6,
        name: 'Tether USD',
      },
    }));

    const events = normalizeTronBatch(transfers);
    console.log(`[TronGrid] Got ${events.length} USDT events from TRON`);
    return events;
  } catch (error) {
    console.error('[TronGrid] Fetch error:', error);
    return [];
  }
}

/**
 * Fallback: Fetch USDT transfers via the Tether Treasury account endpoint.
 */
async function fetchUSDTViaAccountEndpoint(
  headers: Record<string, string>
): Promise<CanonicalEvent[]> {
  try {
    const treasuryAddress = 'TKHuVq1oKVruCGLvDBhBmjtxtECe15RGSW';
    const url = `${BASE_URL}/v1/accounts/${treasuryAddress}/transactions/trc20` +
      `?limit=100&order_by=block_timestamp,desc` +
      `&contract_address=${CONTRACTS.USDT.TRON}`;

    const response = await fetch(url, { headers });
    const data = (await response.json()) as any;

    if (!data.data || !Array.isArray(data.data)) {
      console.warn('[TronGrid] Fallback also returned unexpected format');
      return [];
    }

    const transfers: TronGridTransfer[] = data.data.map((tx: any) => ({
      transaction_id: tx.transaction_id,
      block_timestamp: tx.block_timestamp,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      type: tx.type || 'Transfer',
      token_info: tx.token_info || {
        symbol: 'USDT',
        address: CONTRACTS.USDT.TRON,
        decimals: 6,
        name: 'Tether USD',
      },
    }));

    const events = normalizeTronBatch(transfers);
    console.log(`[TronGrid] Fallback got ${events.length} USDT events from TRON`);
    return events;
  } catch (error) {
    console.error('[TronGrid] Fallback fetch error:', error);
    return [];
  }
}

/**
 * Fetch USDT total supply on TRON.
 */
export async function fetchUSDTSupplyTRON(): Promise<number> {
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (API_KEY) headers['TRON-PRO-API-KEY'] = API_KEY;

  try {
    const url = `${BASE_URL}/v1/assets/USDT/list?limit=1`;
    const response = await fetch(url, { headers });
    const data = (await response.json()) as any;

    // This is approximate — exact supply comes from contract calls
    // For MVP, we'll use Etherscan supply + TronGrid as estimate
    return 0; // Will be populated from combined sources
  } catch (error) {
    console.error('[TronGrid] Supply fetch error:', error);
    return 0;
  }
}
