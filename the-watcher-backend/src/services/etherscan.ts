// ============================================
// THE WATCHER — Etherscan API Client
// ============================================
// Fetches USDC and USDT token transfers from Ethereum

import fetch from 'node-fetch';
import { API_CONFIG, CONTRACTS, ZERO_ADDRESS } from '../config';
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
  offset: number = 1000, // Etherscan v2 supports up to 10k per call, 1k is plenty and faster
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
export async function fetchUSDCTransfersETH(page: number = 1): Promise<CanonicalEvent[]> {
  console.log(`[Etherscan] Fetching USDC transfers on ETH (page ${page})...`);
  const transfers = await fetchTokenTransfers(CONTRACTS.USDC.ETH, API_CONFIG.ETHERSCAN.CHAIN_ID_ETH, page);
  const events = normalizeEtherscanBatch(transfers, 'USDC', 'ETH', 'etherscan');
  console.log(`[Etherscan] Got ${events.length} USDC events from ETH (page ${page})`);
  return events;
}

/**
 * Fetch recent USDT transfers on Ethereum.
 */
export async function fetchUSDTTransfersETH(page: number = 1): Promise<CanonicalEvent[]> {
  console.log(`[Etherscan] Fetching USDT transfers on ETH (page ${page})...`);
  const transfers = await fetchTokenTransfers(CONTRACTS.USDT.ETH, API_CONFIG.ETHERSCAN.CHAIN_ID_ETH, page);
  const events = normalizeEtherscanBatch(transfers, 'USDT', 'ETH', 'etherscan');
  console.log(`[Etherscan] Got ${events.length} USDT events from ETH (page ${page})`);
  return events;
}

/**
 * Fetch token transfers involving the ZERO address — these are mints (from=0x0)
 * and burns (to=0x0). Calling tokentx with address=ZERO_ADDRESS + contractaddress
 * returns both mints and burns in a single page, so mint/burn events never get
 * lost in the noise of regular high-volume tokentx pages.
 */
export async function fetchMintBurnETH(token: 'USDC' | 'USDT', page: number = 1): Promise<CanonicalEvent[]> {
  if (!API_KEY) return [];
  const contract = token === 'USDC' ? CONTRACTS.USDC.ETH : CONTRACTS.USDT.ETH;
  console.log(`[Etherscan] Fetching ${token} mint/burn on ETH (page ${page})...`);

  return await etherscanLimiter.execute('etherscan', async () => {
    const url = `${BASE_URL}?chainid=${API_CONFIG.ETHERSCAN.CHAIN_ID_ETH}&module=account&action=tokentx` +
      `&address=${ZERO_ADDRESS}` +
      `&contractaddress=${contract}` +
      `&page=${page}&offset=1000&sort=desc` +
      `&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = (await response.json()) as EtherscanResponse;
    if (data.status !== '1' || !Array.isArray(data.result)) {
      console.warn(`[Etherscan] ${token} mint/burn fetch failed: ${data.message}`);
      return [];
    }
    const events = normalizeEtherscanBatch(data.result, token, 'ETH', 'etherscan');
    console.log(`[Etherscan] Got ${events.length} ${token} mint/burn events from ETH (page ${page})`);
    return events;
  });
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
