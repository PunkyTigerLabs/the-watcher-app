// ============================================
// THE WATCHER — TronGrid Normalizer
// ============================================
// Converts raw TronGrid API responses → CanonicalEvent

import { CanonicalEvent, TronGridTransfer } from '../types';
import { TRON_ZERO_ADDRESS, DECIMALS } from '../config';
import { resolveWallet } from './walletResolver';
import { classifyRelevance } from '../engine/relevance';

export function normalizeTronTransfer(raw: TronGridTransfer): CanonicalEvent {
  const decimals = raw.token_info?.decimals || DECIMALS.USDT;
  const amount = parseFloat(raw.value) / Math.pow(10, decimals);

  // Determine event type
  let type: 'MINT' | 'BURN' | 'TRANSFER' = 'TRANSFER';
  if (raw.from === TRON_ZERO_ADDRESS || raw.from === '') {
    type = 'MINT';
  } else if (raw.to === TRON_ZERO_ADDRESS || raw.to === '') {
    type = 'BURN';
  }

  // Resolve entity names
  const fromResolved = resolveWallet(raw.from, 'TRON');
  const toResolved = resolveWallet(raw.to, 'TRON');

  const id = `USDT:TRON:${raw.transaction_id}:0`;

  const event: CanonicalEvent = {
    id,
    timestamp: new Date(raw.block_timestamp).toISOString(),
    token: 'USDT',
    chain: 'TRON',
    type,
    from: raw.from,
    to: raw.to,
    amount,
    amountUsd: amount, // Stablecoin 1:1
    fromEntity: fromResolved.name,
    toEntity: toResolved.name,
    fromEntityType: fromResolved.type,
    toEntityType: toResolved.type,
    source: 'trongrid',
    txHash: raw.transaction_id,
    relevance: 'low', // Will be classified below
  };

  event.relevance = classifyRelevance(event);

  return event;
}

export function normalizeTronBatch(transfers: TronGridTransfer[]): CanonicalEvent[] {
  return transfers
    .map(t => normalizeTronTransfer(t))
    .filter(e => e.amount > 0);
}
