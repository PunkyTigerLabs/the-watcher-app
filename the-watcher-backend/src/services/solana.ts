// ============================================
// THE WATCHER — Solscan API Client
// ============================================
// Fetches USDC SPL transfers from Solana (FREE API)

import fetch from 'node-fetch';
import { API_CONFIG, CONTRACTS } from '../config';
import { CanonicalEvent } from '../types';
import { solscanLimiter } from './rateLimiter';

const { BASE_URL } = API_CONFIG.SOLSCAN;

interface SolscanTransfer {
  txHash: string;
  blockTime: number;
  source: string;
  destination: string;
  tokenAmount: {
    amount: string;
    decimals: number;
    uiAmount: number;
  };
  mint: string;
}

interface SolscanResponse {
  success: boolean;
  data: {
    total: number;
    items: SolscanTransfer[];
  };
}

/**
 * Fetch USDC SPL transfers on Solana.
 * Uses Solscan free API - no key needed.
 */
export async function fetchUSDCTransfersSOLANA(): Promise<CanonicalEvent[]> {
  console.log('[Solscan] Fetching USDC transfers on Solana...');

  return await solscanLimiter.execute('solana', async () => {
    const url = `${BASE_URL}/api/v2/spl/token/transfers` +
      `?token=${CONTRACTS.USDC.SOLANA}` +
      `&limit=100`;

    const response = await fetch(url);
    const data = (await response.json()) as SolscanResponse;

    if (!data.success || !data.data || !Array.isArray(data.data.items)) {
      console.warn('[Solscan] Unexpected response format');
      return [];
    }

    const events: CanonicalEvent[] = data.data.items.map((transfer) => {
      const timestamp = new Date(transfer.blockTime * 1000).toISOString();
      const amount = transfer.tokenAmount.uiAmount;
      const amountUsd = amount; // USDC is 1:1 with USD

      return {
        id: `USDC:solana:${transfer.txHash}:0`,
        timestamp,
        token: 'USDC',
        chain: 'solana',
        type: 'TRANSFER',
        from: transfer.source,
        to: transfer.destination,
        amount,
        amountUsd,
        fromEntity: 'Unknown', // Would be resolved by wallet resolver
        toEntity: 'Unknown',
        fromEntityType: 'Unknown',
        toEntityType: 'Unknown',
        source: 'solscan',
        txHash: transfer.txHash,
        relevance: amountUsd >= 1_000_000 ? 'high' : amountUsd >= 100_000 ? 'medium' : 'low',
      };
    });

    console.log(`[Solscan] Got ${events.length} USDC events from Solana`);
    return events;
  });
}
