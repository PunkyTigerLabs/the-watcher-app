// ============================================
// THE WATCHER — USDC Tab (Superman)
// ============================================
// Layer 1: Headlines + Flow Overview
// Superman theme: cool blue/teal

import { useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, Animated, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import FlowCard from '../../src/components/FlowCard';
import PulsingDot from '../../src/components/PulsingDot';
import GlowCard from '../../src/components/GlowCard';
import StatusBadge from '../../src/components/StatusBadge';
import MintBurnChart, { DayData } from '../../src/components/MintBurnChart';
import TickerRibbon from '../../src/components/TickerRibbon';
import { LoadingState, ErrorState } from '../../src/components/LoadingState';
import { colors, superman, gradients } from '../../src/theme';
import WatcherAPI, { OverviewData, MarketSupplyData, MarketExchangeData, FearGreedData } from '../../src/api/watcher';
import { useAutoRefresh, useWatcher } from '../../src/api/hooks';

const fmt = (n: number) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : `$${(n / 1e3).toFixed(0)}K`;

export default function USDCTab() {
  const { data, loading, error, refresh } = useAutoRefresh<OverviewData>(
    () => WatcherAPI.usdcOverview(),
    60000,
  );
  const { data: marketSupply } = useWatcher(() => WatcherAPI.marketSupply(), []);
  const { data: marketExchange } = useWatcher(() => WatcherAPI.marketExchange(), []);
  const { data: fearGreed } = useWatcher(() => WatcherAPI.fearGreed(), []);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(contentSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingState message="Scanning USDC flows..." />
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ErrorState message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  const overview = data;
  const minted = overview?.minted24h ?? 0;
  const burned = overview?.burned24h ?? 0;
  const net = overview?.net24h ?? 0;

  const headline = overview?.headline ?? (
    net >= 0
      ? `Net ${fmt(Math.abs(net))} printed in 24h`
      : `Net ${fmt(Math.abs(net))} burned in 24h`
  );
  const subHeadline = overview?.subHeadline ?? 'Tracking real-time stablecoin flows';
  const topFlows = overview?.topFlows ?? [];
  const totalSupply = overview?.stats?.totalSupply ?? 0;

  const inflows = topFlows.filter((f) => f.type === 'MINT' || f.relevance === 'critical' || f.relevance === 'high');
  const outflows = topFlows.filter((f) => f.type === 'BURN');

  // Build ticker ribbon data
  const tickerItems = [
    { label: 'USDC SUPPLY', value: marketSupply?.usdc ? fmt(marketSupply.usdc) : '—' },
    { label: 'USDT SUPPLY', value: marketSupply?.usdt ? fmt(marketSupply.usdt) : '—' },
    { label: 'BTC', value: marketExchange?.btc ? `$${marketExchange.btc.toFixed(0)}` : '—' },
    { label: 'ETH', value: marketExchange?.eth ? `$${marketExchange.eth.toFixed(0)}` : '—' },
    { label: 'FEAR & GREED', value: fearGreed?.value ? `${fearGreed.value.toFixed(0)}` : '—' },
  ];

  // Create 7-day chart data: use backend chartData if available, otherwise fallback to generated data
  const chartData: DayData[] = overview?.chartData ?? [
    { day: 'M', mint: minted > 0 ? minted * 0.14 : 0, burn: burned > 0 ? burned * 0.14 : 0 },
    { day: 'T', mint: minted > 0 ? minted * 0.15 : 0, burn: burned > 0 ? burned * 0.15 : 0 },
    { day: 'W', mint: minted > 0 ? minted * 0.16 : 0, burn: burned > 0 ? burned * 0.16 : 0 },
    { day: 'T', mint: minted > 0 ? minted * 0.17 : 0, burn: burned > 0 ? burned * 0.17 : 0 },
    { day: 'F', mint: minted > 0 ? minted * 0.18 : 0, burn: burned > 0 ? burned * 0.18 : 0 },
    { day: 'S', mint: minted > 0 ? minted * 0.19 : 0, burn: burned > 0 ? burned * 0.19 : 0 },
    { day: 'S', mint: minted, burn: burned },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View style={styles.logoRow}>
          <PulsingDot color={superman.primary} size={6} />
          <Text style={styles.logo}>USDC</Text>
          <StatusBadge lastUpdated={overview?.lastUpdated} />
          <View style={styles.supermanBadge}>
            <Text style={styles.supermanText}>SUPERMAN</Text>
          </View>
        </View>
        <Text style={styles.subhead}>Circle Treasury · Ethereum · Base</Text>
      </Animated.View>

      {/* Ticker Ribbon */}
      <TickerRibbon items={tickerItems} speed={50000} />

      <Animated.ScrollView
        style={[styles.scroll, { opacity: headerOpacity, transform: [{ translateY: contentSlide }] }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={superman.primary} />}
      >
        {/* Headline Card */}
        <LinearGradient colors={[...gradients.superman]} style={styles.headlineCard}>
          <Text style={styles.headlineText}>{headline}</Text>
          <Text style={styles.headlineSub}>{subHeadline}</Text>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>MINTED 24H</Text>
            <Text style={[styles.statValue, { color: superman.primary }]}>+{fmt(minted)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>BURNED 24H</Text>
            <Text style={[styles.statValue, { color: colors.red }]}>-{fmt(burned)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>NET FLOW</Text>
            <Text style={[styles.statValue, { color: net >= 0 ? colors.green : colors.red }]}>
              {net >= 0 ? '+' : ''}{fmt(Math.abs(net))}
            </Text>
          </View>
        </View>

        {/* Total Supply Display */}
        {totalSupply > 0 && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Text style={styles.statLabel}>TOTAL SUPPLY</Text>
              <Text style={[styles.statValue, { color: superman.primary }]}>
                ${(totalSupply / 1e9).toFixed(1)}B
              </Text>
            </View>
          </View>
        )}

        {/* 7-Day Mint/Burn Chart */}
        <GlowCard glowColor={superman.primary}>
          <Text style={[styles.sectionTitle, { color: superman.primary, marginBottom: 12 }]}>
            7-DAY VOLUME
          </Text>
          <MintBurnChart data={chartData} primaryColor={superman.primary} />
        </GlowCard>

        {/* Top Flows */}
        {topFlows.length > 0 && (
          <GlowCard glowColor={superman.primary} noPadding>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionArrow, { color: superman.primary }]}>◇</Text>
              <Text style={[styles.sectionTitle, { color: superman.primary }]}>RECENT FLOWS</Text>
              <View style={styles.sectionLine} />
              <Text style={[styles.sectionCount, { color: colors.muted }]}>
                {overview?.eventCount ?? 0} events
              </Text>
            </View>
            {topFlows.slice(0, 10).map((f, i) => (
              <FlowCard
                key={f.txHash || i}
                name={f.fromLabel || f.toLabel || f.from.slice(0, 10)}
                type={getEntityType(f)}
                chain={f.chain.toUpperCase()}
                amount={f.amount}
                timeAgo={getTimeAgo(f.timestamp)}
                direction={f.type === 'BURN' ? 'out' : 'in'}
                isNew={i === 0}
              />
            ))}
          </GlowCard>
        )}

        {/* Empty state */}
        {topFlows.length === 0 && (
          <GlowCard glowColor={superman.primary}>
            <Text style={styles.emptyText}>No USDC flows detected yet. Data refreshes every 5 minutes.</Text>
          </GlowCard>
        )}

        <View style={{ height: 30 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function getEntityType(flow: any): string {
  // Prefer entity_type fields from API if available
  const entityType = flow.from_entity_type || flow.to_entity_type;
  if (entityType) return entityType;

  // Fallback to string matching for compatibility
  const label = (flow.fromLabel || flow.toLabel || '').toLowerCase();
  if (label.includes('binance') || label.includes('coinbase')) return 'CEX';
  if (label.includes('circle') || label.includes('blackrock')) return 'Institutional';
  if (label.includes('aave') || label.includes('compound')) return 'DeFi';
  return 'Unknown';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  logo: {
    color: superman.primary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 3,
  },
  supermanBadge: {
    marginLeft: 'auto',
    backgroundColor: superman.primaryDim,
    borderWidth: 0.5,
    borderColor: superman.primary + '30',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  supermanText: {
    color: superman.primary,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  subhead: { color: colors.muted, fontSize: 11, letterSpacing: 0.5, marginLeft: 22 },

  headlineCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 20,
    borderWidth: 0.5,
    borderColor: superman.primary + '20',
    marginTop: 8,
    marginBottom: 12,
  },
  headlineText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 6,
  },
  headlineSub: {
    color: colors.textSub,
    fontSize: 12,
    lineHeight: 18,
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceSolid,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 12,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  sectionArrow: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  sectionLine: { flex: 1, height: 0.5, backgroundColor: colors.border },
  sectionCount: { fontSize: 10, fontVariant: ['tabular-nums'] },

  emptyText: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
