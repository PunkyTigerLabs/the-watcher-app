// ============================================
// THE WATCHER — Wallet Resolver
// ============================================
// Resolves wallet addresses to human-readable entity names

import { EntityType, Chain, WalletLabel } from '../types';
import walletsData from '../data/wallets.json';

interface WalletMap {
  [address: string]: { name: string; type: EntityType };
}

// Build lookup maps (lowercase addresses for case-insensitive matching)
const ethWalletMap: WalletMap = {};
const tronWalletMap: WalletMap = {};

for (const wallet of walletsData.ethereum) {
  ethWalletMap[wallet.address.toLowerCase()] = {
    name: wallet.name,
    type: wallet.type as EntityType,
  };
}

for (const wallet of walletsData.tron) {
  tronWalletMap[wallet.address] = { // Tron addresses are case-sensitive
    name: wallet.name,
    type: wallet.type as EntityType,
  };
}

export function resolveWallet(
  address: string,
  chain: Chain
): { name: string; type: EntityType } {
  if (!address) return { name: 'Unknown', type: 'Unknown' };

  if (chain === 'TRON') {
    const match = tronWalletMap[address];
    if (match) return match;
  } else {
    const match = ethWalletMap[address.toLowerCase()];
    if (match) return match;
  }

  return {
    name: truncateAddress(address, chain),
    type: 'Unknown',
  };
}

export function truncateAddress(address: string, chain: Chain): string {
  if (!address) return 'Unknown';
  if (chain === 'TRON') {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isKnownWallet(address: string, chain: Chain): boolean {
  if (chain === 'TRON') {
    return address in tronWalletMap;
  }
  return address.toLowerCase() in ethWalletMap;
}

// Get total count of labeled wallets
export function getWalletCount(): number {
  return walletsData.ethereum.length + walletsData.tron.length;
}
