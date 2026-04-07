// ============================================
// THE WATCHER — Etherscan/Basescan Normalizer
// ============================================
// Converts raw Etherscan API responses → CanonicalEvent

import { CanonicalEvent, EtherscanTransfer, Token, Chain, DataSource } from '../types';
import { ZERO_ADDRESS, DECIMALS } from '../config';
import { resolveWallet } from './walletResolver';
import { classifyRelevance } from '../engine/relevance';

export function normalizeEtherscanTransfer(
  raw: EtherscanTransfer,
  token: Token,
  chain: Chain,
  source: DataSource
): CanonicalEvent {
  const from = raw.from.toLowerCase();
  const to = raw.to.toLowerCase();
  const decimals = DECIMALS[token];
  const amount = parseFloat(raw.value) / Math.pow(10, decimals);

  // Determine event type
  let type: 'MINT' | 'BURN' | 'TRANSFER' = 'TRANSFER';
  if (from === ZERO_ADDRESS.toLowerCase()) {
    type = 'MINT';
  } else if (to === ZERO_ADDRESS.toLowerCase()) {
    type = 'BURN';
  }

  // Resolve entity names
  const fromResolved = resolveWallet(raw.from, chain);
  const toResolved = resolveWallet(raw.to, chain);

  const logIndex = raw.logIndex || '0';
  const id = `${token}:${chain}:${raw.hash}:${logIndex}`;

  const event: CanonicalEvent = {
    id,
    timestamp: new Date(parseInt(raw.timeStamp) * 1000).toISOString(),
    token,
    chain,
    type,
    from: raw.from,
    to: raw.to,
    amount,
    amountUsd: amount, // Stablecoins: 1:1
    fromEntity: fromResolved.name,
    toEntity: toResolved.name,
    fromEntityType: fromResolved.type,
    toEntityType: toResolved.type,
    source,
    txHash: raw.hash,
    relevance: 'low', // Will be classified below
  };

  // Classify relevance
  event.relevance = classifyRelevance(event);

  return event;
}

export function normalizeEtherscanBatch(
  transfers: EtherscanTransfer[],
  token: Token,
  chain: Chain,
  source: DataSource
): CanonicalEvent[] {
  return transfers
    .map(t => normalizeEtherscanTransfer(t, token, chain, source))
    .filter(e => e.amount > 0); // Skip zero-value transfers
}
