// ============================================
// THE WATCHER — FlowScreen
// ============================================
// Shared screen for USDC / USDT flow view. The flip card renders two of
// these, one per token, parameterized by theme + API fetcher.

import { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FlowCard from './FlowCard';
import GlowCard from './GlowCard';
import MintBurnChart, { DayData } from './MintBurnChart';
import { LoadingState, ErrorState } from './LoadingState';
import { colors, TokenTheme } from '../theme';
import { OverviewData } from '../api/watcher';
import { useAutoRefresh } from '../api/hooks';

const fmt = (n: number) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : `$${(n / 1e3).toFixed(0)}K`;

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
  const entityType = flow.from_entity_type || flow.to_entity_type;
  if (entityType) return entityType;
  const label = (flow.fromLabel || flow.toLabel || '').toLowerCase();
  if (label.includes('binance') || label.includes('coinbase') || label.includes('okx')) return 'CEX';
  if (label.includes('circle') || label.includes('tether') || label.includes('jump')) return 'Institutional';
  if (label.includes('aave') || label.includes('justlend')) return 'DeFi';
  return 'Unknown';
}

export interface FlowScreenProps {
  token: 'USDC' | 'USDT';
  theme: TokenTheme;
  gradient: readonly [string, string, string];
  apiFn: () => Promise<OverviewData>;
  subheadChains: string; // e.g. "Ethereum · Base" or "Ethereum · TRON"
  showTronCard?: boolean;
  icon: string;
}

export default function FlowScreen({
  token,
  theme,
  gradient,
  apiFn,
  subheadChains,
  showTronCard = false,
  icon,
}: FlowScreenProps) {
  const { data, loading, error, refresh } = useAutoRefresh<OverviewData>(apiFn, 60000);

  const contentSlide = useRef(new Animated.Value(20)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(contentSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const onRefresh = useCallback(() => refresh(), [refresh]);

  if (loading && !data) {
    return <LoadingState message={`Scanning ${token} flows...`} />;
  }
  if (error && !data) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  const overview = data;
  const minted = overview?.minted24h ?? 0;
  const burned = overview?.burned24h ?? 0;
  const net = overview?.net24h ?? 0;
  const topFlows = overview?.topFlows ?? [];
  const tronShare = overview?.tronShare ?? 0;
  const totalSupply = overview?.stats?.totalSupply ?? 0;

  const headline = overview?.headline ?? (
    net >= 0
      ? `Net ${fmt(Math.abs(net))} printed in 24h`
      : `Net ${fmt(Math.abs(net))} burned in 24h`
  );
  const subHeadline = overview?.subHeadline ?? `${subheadChains} · refreshed every 5 min`;

  const chartData: DayData[] = overview?.chartData ?? [];

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      {/* Local token header — sits inside the flip face */}
      <View style={styles.header}>
        <Text style={[styles.logo, { color: theme.primary }]}>{token}</Text>
        <Text style={[styles.subhead, { color: theme.primary + '70' }]}>
          {subheadChains}
        </Text>
      </View>

      <Animated.ScrollView
        style={[styles.scroll, { opacity: contentOpacity, transform: [{ translateY: contentSlide }] }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Headline */}
        <LinearGradient colors={gradient} style={[styles.headlineCard, { borderColor: theme.primary + '25' }]}>
          <Text style={styles.headlineText}>{headline}</Text>
          <Text style={styles.headlineSub}>{subHeadline}</Text>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox label="MINTED 24H" value={`+${fmt(minted)}`} color={theme.primary} theme={theme} />
          <StatBox label="BURNED 24H" value={`-${fmt(burned)}`} color={colors.red} theme={theme} />
          <StatBox
            label="NET FLOW"
            value={`${net >= 0 ? '+' : '-'}${fmt(Math.abs(net))}`}
            color={net >= 0 ? colors.green : colors.red}
            theme={theme}
          />
        </View>

        {totalSupply > 0 && (
          <View style={styles.statsRow}>
            <StatBox
              label="TOTAL SUPPLY"
              value={`$${(totalSupply / 1e9).toFixed(1)}B`}
              color={theme.primary}
              theme={theme}
              full
            />
          </View>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <GlowCard glowColor={theme.primary}>
            <Text style={[styles.sectionTitle, { color: theme.primary, marginBottom: 12 }]}>7-DAY VOLUME</Text>
            <MintBurnChart data={chartData} primaryColor={theme.primary} />
          </GlowCard>
        )}

        {/* TRON card (USDT only) */}
        {showTronCard && 'tron' in theme && (
          <GlowCard glowColor={(theme as any).tron.color}>
            <View style={styles.tronHeader}>
              <View style={[styles.tronDot, { backgroundColor: (theme as any).tron.color }]} />
              <Text style={[styles.sectionTitle, { color: (theme as any).tron.color }]}>TRON</Text>
              <View style={[styles.sectionLine, { backgroundColor: theme.borderColor }]} />
              <Text style={[styles.tronShare, { color: colors.textSub }]}>
                {tronShare.toFixed(0)}% of volume
              </Text>
            </View>
            <Text style={[styles.tronDesc, { color: colors.textSub }]}>
              TRON carries {tronShare.toFixed(0)}% of USDT volume. Large TRC-20 movements often precede
              exchange volatility.
            </Text>
          </GlowCard>
        )}

        {/* Top flows */}
        {topFlows.length > 0 ? (
          <GlowCard glowColor={theme.primary} noPadding>
            <View style={[styles.sectionHeader, { borderBottomColor: theme.borderColor }]}>
              <Text style={[styles.sectionArrow, { color: theme.primary }]}>{icon}</Text>
              <Text style={[styles.sectionTitle, { color: theme.primary }]}>RECENT FLOWS</Text>
              <View style={[styles.sectionLine, { backgroundColor: theme.borderColor }]} />
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
        ) : (
          <GlowCard glowColor={theme.primary}>
            <Text style={styles.emptyText}>
              No {token} flows detected yet. Data refreshes every 5 minutes.
            </Text>
          </GlowCard>
        )}

        <View style={{ height: 60 }} />
      </Animated.ScrollView>
    </View>
  );
}

function StatBox({
  label,
  value,
  color,
  theme,
  full,
}: {
  label: string;
  value: string;
  color: string;
  theme: TokenTheme;
  full?: boolean;
}) {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: theme.surface, borderColor: theme.borderColor },
        full && { flex: 1 },
      ]}
    >
      <Text style={[styles.statLabel, { color: theme.primary + '80' }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  logo: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
  },
  subhead: { fontSize: 11, letterSpacing: 0.5, marginTop: 2 },
  headlineCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    marginTop: 4,
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
    borderRadius: 10,
    borderWidth: 0.5,
    padding: 12,
  },
  statLabel: {
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
  },
  sectionArrow: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  sectionLine: { flex: 1, height: 0.5 },
  sectionCount: { fontSize: 10, fontVariant: ['tabular-nums'] },
  tronHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  tronDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tronShare: {
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  tronDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
