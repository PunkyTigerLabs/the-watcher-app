// ============================================
// THE WATCHER — Market Data Routes
// ============================================
// Free endpoints for supply and exchange data

import express from 'express';
import { getSnapshot, saveSnapshot } from '../db';
import { fetchSupplyData, fetchBtcEthPrices as fetchBtcEthFromCoinGecko } from '../services/coingecko';
import { fetchStablecoinSupplyByChain, fetchStablecoinTVLByChain } from '../services/defillama';
import { getExchangeFlowSignal, fetchBtcEthPrices as fetchBtcEthFromBinance } from '../services/binance';

const router = express.Router();

/**
 * GET /market/supply
 * Returns stablecoin supply data from CoinGecko and DefiLlama.
 * Cached for 15 minutes.
 */
router.get('/supply', async (_req, res) => {
  try {
    // Check cache
    const cached = getSnapshot('market_supply');
    const now = Date.now();
    if (cached && new Date(cached.updatedAt).getTime() + 15 * 60 * 1000 > now) {
      return res.json(cached.data);
    }

    // Fetch fresh data
    const [coinGecko, defiLlama, chainTVL] = await Promise.all([
      fetchSupplyData(),
      fetchStablecoinSupplyByChain(),
      fetchStablecoinTVLByChain(),
    ]);

    // Extract USDC and USDT supply numbers
    const usdc = coinGecko?.usdc?.supply || defiLlama?.usdcData?.supply || 0;
    const usdt = coinGecko?.usdt?.supply || defiLlama?.usdtData?.supply || 0;

    const response = {
      usdc,
      usdt,
      timestamp: new Date().toISOString(),
    };

    // Cache it
    saveSnapshot('market_supply', response);
    res.json(response);
  } catch (error) {
    console.error('[Market] Supply error:', error);
    res.status(500).json({ error: 'Failed to fetch supply data' });
  }
});

/**
 * GET /market/exchange
 * Returns exchange data from Binance.
 * Includes ticker, order book, and buy/sell pressure.
 * Cached for 5 minutes.
 */
router.get('/exchange', async (_req, res) => {
  try {
    // Check cache
    const cached = getSnapshot('market_exchange');
    const now = Date.now();
    if (cached && new Date(cached.updatedAt).getTime() + 5 * 60 * 1000 > now) {
      return res.json(cached.data);
    }

    // CoinGecko is the primary price source (Binance blocks Railway/AWS IPs).
    // We still try Binance for the order-book pressure signal.
    const [cgPrices, pressure] = await Promise.all([
      fetchBtcEthFromCoinGecko(),
      getExchangeFlowSignal(),
    ]);

    let { btc, eth } = cgPrices;
    if (!btc || !eth) {
      const bn = await fetchBtcEthFromBinance();
      btc = btc || bn.btc;
      eth = eth || bn.eth;
    }

    const response = {
      btc,
      eth,
      timestamp: new Date().toISOString(),
      pressure,
      interpretation:
        pressure > 50 ? 'Strong buying pressure' :
        pressure > 20 ? 'Moderate buying pressure' :
        pressure > -20 ? 'Neutral' :
        pressure > -50 ? 'Moderate selling pressure' :
        'Strong selling pressure',
    };

    // Cache it
    saveSnapshot('market_exchange', response);
    res.json(response);
  } catch (error) {
    console.error('[Market] Exchange error:', error);
    res.status(500).json({ error: 'Failed to fetch exchange data' });
  }
});

export default router;
