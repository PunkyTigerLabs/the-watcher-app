// ============================================
// THE WATCHER — Market Data Routes
// ============================================
// Free endpoints for supply and exchange data

import express from 'express';
import { getSnapshot, saveSnapshot, getDb } from '../db';
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

/**
 * GET /market/distribution
 * Cross-chain distribution per token — where the liquidity lives right now
 * and where it moved over 7d. This is the "liquidity migration" signal:
 * when USDC share on Base grows while ETH share shrinks, institutional
 * capital is rotating chains.
 */
router.get('/distribution', (_req, res) => {
  try {
    const db = getDb();
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const getShares = (token: string, since: string) => {
      const rows = db.prepare(`
        SELECT chain, COALESCE(SUM(amount), 0) as vol, COUNT(*) as evs
        FROM events
        WHERE token = ? AND timestamp >= ?
        GROUP BY chain
      `).all(token, since) as Array<{ chain: string; vol: number; evs: number }>;
      const total = rows.reduce((s, r) => s + r.vol, 0);
      return rows.map((r) => ({
        chain: r.chain,
        volume: r.vol,
        events: r.evs,
        share: total > 0 ? r.vol / total : 0,
      }));
    };

    const usdc24h = getShares('USDC', since24h);
    const usdc7d = getShares('USDC', since7d);
    const usdt24h = getShares('USDT', since24h);
    const usdt7d = getShares('USDT', since7d);

    // Compute share deltas (24h vs 7d avg) — positive delta = chain is gaining
    const delta = (
      shares24: typeof usdc24h,
      shares7d: typeof usdc24h
    ): Record<string, number> => {
      const out: Record<string, number> = {};
      const all = new Set([...shares24, ...shares7d].map((r) => r.chain));
      for (const chain of all) {
        const a = shares24.find((r) => r.chain === chain)?.share ?? 0;
        const b = shares7d.find((r) => r.chain === chain)?.share ?? 0;
        out[chain] = a - b;
      }
      return out;
    };

    res.json({
      usdc: {
        current: usdc24h,
        history7d: usdc7d,
        shareDelta: delta(usdc24h, usdc7d),
      },
      usdt: {
        current: usdt24h,
        history7d: usdt7d,
        shareDelta: delta(usdt24h, usdt7d),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Market] Distribution error:', error);
    res.status(500).json({ error: 'Failed to compute distribution' });
  }
});

export default router;
