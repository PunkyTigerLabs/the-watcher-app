// ============================================
// THE WATCHER — Cron Jobs
// ============================================
// Scheduled tasks that poll APIs and update data

import cron from 'node-cron';
import { CRON_INTERVALS } from './config';
import { insertEvents, saveSnapshot, insertNews } from './db';
import { fetchUSDCTransfersETH, fetchUSDTTransfersETH, fetchTokenSupply } from './services/etherscan';
import { fetchUSDCTransfersBASE } from './services/basescan';
import { fetchUSDTTransfersTRON } from './services/trongrid';
import { fetchFilteredNews } from './services/news';
import { fetchFearGreed } from './services/feargreed';
import { computeSignal } from './engine/signal';
import { detectPatterns } from './engine/patterns';
import { CONTRACTS } from './config';

let fearGreedValue: number | null = null;

export function startCronJobs() {
  console.log('[Cron] Starting scheduled jobs...');

  // ---- EVENTS: Every 5 minutes ----
  cron.schedule(CRON_INTERVALS.EVENTS, async () => {
    console.log('[Cron] Fetching events...');
    try {
      // Fetch all sources in parallel
      const [usdcEth, usdcBase, usdtEth, usdtTron] = await Promise.allSettled([
        fetchUSDCTransfersETH(),
        fetchUSDCTransfersBASE(),
        fetchUSDTTransfersETH(),
        fetchUSDTTransfersTRON(),
      ]);

      let totalInserted = 0;

      if (usdcEth.status === 'fulfilled') {
        totalInserted += insertEvents(usdcEth.value);
      } else {
        console.error('[Cron] USDC ETH failed:', usdcEth.reason);
      }

      if (usdcBase.status === 'fulfilled') {
        totalInserted += insertEvents(usdcBase.value);
      } else {
        console.error('[Cron] USDC BASE failed:', usdcBase.reason);
      }

      if (usdtEth.status === 'fulfilled') {
        totalInserted += insertEvents(usdtEth.value);
      } else {
        console.error('[Cron] USDT ETH failed:', usdtEth.reason);
      }

      if (usdtTron.status === 'fulfilled') {
        totalInserted += insertEvents(usdtTron.value);
      } else {
        console.error('[Cron] USDT TRON failed:', usdtTron.reason);
      }

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
    try {
      const [usdcSupplyEth, usdtSupplyEth] = await Promise.allSettled([
        fetchTokenSupply(CONTRACTS.USDC.ETH),
        fetchTokenSupply(CONTRACTS.USDT.ETH),
      ]);

      const supplies: Record<string, number> = {};
      if (usdcSupplyEth.status === 'fulfilled') supplies.usdc_eth = usdcSupplyEth.value;
      if (usdtSupplyEth.status === 'fulfilled') supplies.usdt_eth = usdtSupplyEth.value;

      saveSnapshot('supply', {
        ...supplies,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Cron] Supply error:', error);
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

    // Then events
    try {
      const [usdcEth, usdcBase, usdtEth, usdtTron] = await Promise.allSettled([
        fetchUSDCTransfersETH(),
        fetchUSDCTransfersBASE(),
        fetchUSDTTransfersETH(),
        fetchUSDTTransfersTRON(),
      ]);

      let total = 0;
      if (usdcEth.status === 'fulfilled') total += insertEvents(usdcEth.value);
      if (usdcBase.status === 'fulfilled') total += insertEvents(usdcBase.value);
      if (usdtEth.status === 'fulfilled') total += insertEvents(usdtEth.value);
      if (usdtTron.status === 'fulfilled') total += insertEvents(usdtTron.value);
      console.log(`[Cron] Initial fetch complete. ${total} events inserted.`);
    } catch (e) {
      console.error('[Cron] Initial event fetch error:', e);
    }

    // Then signal
    try {
      const signal = computeSignal(fearGreedValue);
      saveSnapshot('signal_latest', signal);
      console.log(`[Cron] Initial signal: ${signal.score} (${signal.label})`);
    } catch (e) {
      console.error('[Cron] Initial signal error:', e);
    }

    // News
    try {
      const news = await fetchFilteredNews();
      for (const item of news) insertNews(item);
    } catch (e) {
      console.error('[Cron] Initial news error:', e);
    }

    console.log('[Cron] Initial data fetch complete!');
  }, 5000);

  console.log('[Cron] All jobs scheduled.');
}
