// ============================================
// THE WATCHER — Cron Jobs
// ============================================
// Scheduled tasks that poll APIs and update data

import cron from 'node-cron';
import { insertEvents, saveSnapshot, insertNews } from './db';
import {
  fetchUSDCTransfersETH,
  fetchUSDTTransfersETH,
  fetchTokenSupply,
  fetchMintBurnETH,
} from './services/etherscan';
import { fetchUSDCTransfersBASE, fetchMintBurnBASE } from './services/basescan';
import { fetchUSDTTransfersTRON } from './services/trongrid';
import { fetchUSDCTransfersSOLANA } from './services/solana';
import { fetchFilteredNews } from './services/news';
import { fetchFearGreed } from './services/feargreed';
import { fetchSupplyData } from './services/coingecko';
import { fetchStablecoinSupplyByChain, fetchStablecoinTVLByChain } from './services/defillama';
import { fetchExchangeData } from './services/binance';
import { computeSignal } from './engine/signal';
import { detectPatterns } from './engine/patterns';
import { CONTRACTS, CRON_INTERVALS } from './config';

let fearGreedValue: number | null = null;

/**
 * Pull pages 2..BACKFILL_PAGES for each source so the DB has historical depth
 * immediately after startup. Railway uses ephemeral storage, so without this
 * a redeploy would leave the app showing thin 5-minute data for hours.
 */
async function backfillHistoricalData(): Promise<void> {
  const BACKFILL_PAGES = 5;
  console.log(`[Cron] Backfill starting — ${BACKFILL_PAGES - 1} pages per source`);
  let total = 0;
  for (let page = 2; page <= BACKFILL_PAGES; page++) {
    const results = await Promise.allSettled([
      fetchUSDCTransfersETH(page),
      fetchUSDCTransfersBASE(page),
      fetchUSDTTransfersETH(page),
      fetchMintBurnETH('USDC', page),
      fetchMintBurnETH('USDT', page),
      fetchMintBurnBASE(page),
    ]);
    for (const r of results) {
      if (r.status === 'fulfilled') total += insertEvents(r.value);
    }
    console.log(`[Cron] Backfill page ${page} done. Running total: ${total} events.`);
  }
  console.log(`[Cron] Backfill complete — ${total} events inserted total.`);
}

export function startCronJobs() {
  console.log('[Cron] Starting scheduled jobs...');

  // ---- EVENTS: Every 5 minutes ----
  cron.schedule(CRON_INTERVALS.EVENTS, async () => {
    console.log('[Cron] Fetching events...');
    try {
      // Fetch all sources in parallel — regular tokentx + targeted mint/burn
      const results = await Promise.allSettled([
        fetchUSDCTransfersETH(),
        fetchUSDCTransfersBASE(),
        fetchUSDCTransfersSOLANA(),
        fetchUSDTTransfersETH(),
        fetchUSDTTransfersTRON(),
        fetchMintBurnETH('USDC'),
        fetchMintBurnETH('USDT'),
        fetchMintBurnBASE(),
      ]);

      const names = ['USDC_ETH', 'USDC_BASE', 'USDC_SOL', 'USDT_ETH', 'USDT_TRON', 'USDC_MB_ETH', 'USDT_MB_ETH', 'USDC_MB_BASE'];
      let totalInserted = 0;
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          totalInserted += insertEvents(r.value);
        } else {
          console.error(`[Cron] ${names[i]} failed:`, r.reason);
        }
      });

      console.log(`[Cron] Events cycle complete. Inserted ${totalInserted} new events.`);
    } catch (error) {
      console.error('[Cron] Events cycle error:', error);
    }
  });

  // ---- SIGNAL: Every 5 minutes ----
  cron.schedule(CRON_INTERVALS.SIGNAL, () => {
    console.log('[Cron] Computing signal...');
    try {
      const signal = computeSignal(fearGreedValue);
      saveSnapshot('signal_latest', signal);
      console.log(`[Cron] Signal: ${signal.score} (${signal.label})`);
    } catch (error) {
      console.error('[Cron] Signal error:', error);
    }
  });

  // ---- PATTERNS: Every 5 minutes (runs with signal) ----
  cron.schedule(CRON_INTERVALS.SIGNAL, () => {
    try {
      const patterns = detectPatterns();
      if (patterns.length > 0) {
        console.log(`[Cron] ${patterns.length} active patterns detected`);
      }
    } catch (error) {
      console.error('[Cron] Patterns error:', error);
    }
  });

  // ---- NEWS: Every 10 minutes ----
  cron.schedule(CRON_INTERVALS.NEWS, async () => {
    console.log('[Cron] Fetching news...');
    try {
      const news = await fetchFilteredNews();
      let inserted = 0;
      for (const item of news) {
        if (insertNews(item)) inserted++;
      }
      if (inserted > 0) {
        console.log(`[Cron] Inserted ${inserted} new news items`);
      }
    } catch (error) {
      console.error('[Cron] News error:', error);
    }
  });

  // ---- FEAR & GREED: Every hour ----
  cron.schedule(CRON_INTERVALS.FEAR_GREED, async () => {
    console.log('[Cron] Fetching Fear & Greed...');
    try {
      const fg = await fetchFearGreed();
      if (fg) {
        fearGreedValue = fg.value;
        saveSnapshot('fear_greed', fg);
        console.log(`[Cron] Fear & Greed: ${fg.value} (${fg.classification})`);
      }
    } catch (error) {
      console.error('[Cron] Fear & Greed error:', error);
    }
  });

  // ---- SUPPLY: Every 15 minutes ----
  cron.schedule(CRON_INTERVALS.SUPPLY, async () => {
    console.log('[Cron] Fetching supply data...');
    try {
      const [usdcSupplyEth, usdtSupplyEth] = await Promise.allSettled([
        fetchTokenSupply(CONTRACTS.USDC.ETH),
        fetchTokenSupply(CONTRACTS.USDT.ETH),
      ]);

      const supplies: Record<string, number> = {};
      if (usdcSupplyEth.status === 'fulfilled') {
        supplies.usdc_eth = usdcSupplyEth.value;
        // Save USDC supply snapshot for routes to fetch
        saveSnapshot('supply_usdc', { totalSupply: usdcSupplyEth.value, updatedAt: new Date().toISOString() });
      }
      if (usdtSupplyEth.status === 'fulfilled') {
        supplies.usdt_eth = usdtSupplyEth.value;
        // Save USDT supply snapshot for routes to fetch
        saveSnapshot('supply_usdt', { totalSupply: usdtSupplyEth.value, updatedAt: new Date().toISOString() });
      }

      saveSnapshot('supply', {
        ...supplies,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Cron] Supply error:', error);
    }
  });

  // ---- COINGECKO: Every 15 minutes ----
  cron.schedule(CRON_INTERVALS.COINGECKO, async () => {
    console.log('[Cron] Fetching CoinGecko data...');
    try {
      const data = await fetchSupplyData();
      saveSnapshot('coingecko_supply', {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Cron] CoinGecko error:', error);
    }
  });

  // ---- DEFILLAMA: Every 30 minutes ----
  cron.schedule(CRON_INTERVALS.DEFILLAMA, async () => {
    console.log('[Cron] Fetching DefiLlama data...');
    try {
      const [supply, chainTVL] = await Promise.allSettled([
        fetchStablecoinSupplyByChain(),
        fetchStablecoinTVLByChain(),
      ]);

      let data: any = { updatedAt: new Date().toISOString() };
      if (supply.status === 'fulfilled') data.supply = supply.value;
      if (chainTVL.status === 'fulfilled') data.chainTVL = chainTVL.value;

      saveSnapshot('defillama_supply', data);
    } catch (error) {
      console.error('[Cron] DefiLlama error:', error);
    }
  });

  // ---- BINANCE: Every 5 minutes ----
  cron.schedule(CRON_INTERVALS.BINANCE, async () => {
    console.log('[Cron] Fetching Binance data...');
    try {
      const data = await fetchExchangeData();
      saveSnapshot('binance_exchange', {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Cron] Binance error:', error);
    }
  });

  // Run initial fetch immediately (after 5 second delay for server startup)
  setTimeout(async () => {
    console.log('[Cron] Running initial data fetch...');

    // Fear & Greed first (needed for signal)
    try {
      const fg = await fetchFearGreed();
      if (fg) {
        fearGreedValue = fg.value;
        saveSnapshot('fear_greed', fg);
        console.log(`[Cron] Initial Fear & Greed: ${fg.value}`);
      }
    } catch (e) {
      console.error('[Cron] Initial F&G error:', e);
    }

    // Initial live fetch + targeted mint/burn
    try {
      const results = await Promise.allSettled([
        fetchUSDCTransfersETH(),
        fetchUSDCTransfersBASE(),
        fetchUSDCTransfersSOLANA(),
        fetchUSDTTransfersETH(),
        fetchUSDTTransfersTRON(),
        fetchMintBurnETH('USDC'),
        fetchMintBurnETH('USDT'),
        fetchMintBurnBASE(),
      ]);
      let total = 0;
      for (const r of results) if (r.status === 'fulfilled') total += insertEvents(r.value);
      console.log(`[Cron] Initial live fetch complete. ${total} events inserted.`);
    } catch (e) {
      console.error('[Cron] Initial event fetch error:', e);
    }

    // Supply snapshots so routes don't show 0 on first page view
    try {
      const [usdcS, usdtS] = await Promise.allSettled([
        fetchTokenSupply(CONTRACTS.USDC.ETH),
        fetchTokenSupply(CONTRACTS.USDT.ETH),
      ]);
      if (usdcS.status === 'fulfilled') {
        saveSnapshot('supply_usdc', { totalSupply: usdcS.value, updatedAt: new Date().toISOString() });
      }
      if (usdtS.status === 'fulfilled') {
        saveSnapshot('supply_usdt', { totalSupply: usdtS.value, updatedAt: new Date().toISOString() });
      }
    } catch (e) {
      console.error('[Cron] Initial supply error:', e);
    }

    // Signal + news
    try {
      const signal = computeSignal(fearGreedValue);
      saveSnapshot('signal_latest', signal);
      console.log(`[Cron] Initial signal: ${signal.score} (${signal.label})`);
    } catch (e) {
      console.error('[Cron] Initial signal error:', e);
    }
    try {
      const news = await fetchFilteredNews();
      for (const item of news) insertNews(item);
    } catch (e) {
      console.error('[Cron] Initial news error:', e);
    }

    console.log('[Cron] Initial live fetch complete. Kicking off backfill...');

    // Backfill: pull pages 2..5 of the main sources to build up historical depth
    // so redeploys (Railway has ephemeral storage) don't leave the app empty.
    // Runs in background so the live app is responsive immediately.
    backfillHistoricalData().catch((e) => console.error('[Cron] Backfill error:', e));
  }, 5000);

  console.log('[Cron] All jobs scheduled.');
}
