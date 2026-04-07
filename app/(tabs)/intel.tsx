// ============================================
// THE WATCHER — INTEL Tab
// ============================================
// Layer 2 + 4: Pattern Flags, News, Fear & Greed, AI Analyst

import { useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, Animated, RefreshControl, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PulsingDot from '../../src/components/PulsingDot';
import GlowCard from '../../src/components/GlowCard';
import StatusBadge from '../../src/components/StatusBadge';
import PaywallGate from '../../src/components/PaywallGate';
import { LoadingState, ErrorState } from '../../src/components/LoadingState';
import { colors } from '../../src/theme';
import WatcherAPI, { NewsItem, FearGreedData, AnalystNarrative, SignalData } from '../../src/api/watcher';
import { useWatcher, useAutoRefresh } from '../../src/api/hooks';
import { isPro } from '../../src/api/watcher';

const SENTIMENT_COLORS: Record<string, string> = {
  positive: colors.green,
  negative: colors.red,
  neutral: colors.gold,
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: colors.red,
  high: '#FF6B35',
  medium: colors.gold,
  low: colors.muted,
};

export default function IntelTab() {
  const { data: newsData, loading: newsLoading, error: newsError, refresh: refreshNews } = useAutoRefresh(
    () => WatcherAPI.news(15),
    120000, // 2 min
  );
  const { data: fearGreed, refresh: refreshFG } = useWatcher(
    () => WatcherAPI.fearGreed(),
    [],
  );
  const { data: analyst, loading: analystLoading, refresh: refreshAnalyst } = useWatcher(
    () => WatcherAPI.analyst(),
    [],
  );
  const { data: signal } = useWatcher(
    () => WatcherAPI.signal(isPro()),
    [],
  );

  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const onRefresh = useCallback(() => {
    refreshNews();
    refreshFG();
    refreshAnalyst();
  }, [refreshNews, refreshFG, refreshAnalyst]);

  const news = newsData?.news ?? [];
  const loading = newsLoading && !newsData;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingState message="Gathering intelligence..." />
      </SafeAreaView>
    );
  }

  const fgValue = fearGreed?.value ?? null;
  const fgClass = fearGreed?.classification ?? '';
  const fgColor = fgValue !== null
    ? fgValue > 60 ? colors.green : fgValue > 40 ? colors.gold : colors.red
    : colors.muted;

  // Determine narrative alignment
  const signalScore = signal?.score ?? 0;
  const isAligned = fgValue !== null && signalScore !== 0
    ? (fgValue > 50 && signalScore > 0) || (fgValue <= 50 && signalScore < 0)
    : null;
  const alignmentColor = isAligned === true ? colors.green : isAligned === false ? colors.red : colors.muted;
  const alignmentLabel = isAligned === true ? 'ALIGNED' : isAligned === false ? 'DIVERGED — money talks, news walks' : 'CALCULATING';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Animated.View style={{ flex: 1, opacity: headerOpacity }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={newsLoading} onRefresh={onRefresh} tintColor={colors.cyan} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <PulsingDot color={colors.cyan} size={6} />
              <Text style={styles.title}>Intel</Text>
              <StatusBadge status={newsData ? 'LIVE' : 'DEMO'} />
            </View>
            <Text style={styles.sub}>News · Patterns · Fear & Greed · AI Analyst</Text>
          </View>

          {/* Fear & Greed Gauge */}
          <PaywallGate feature="market sentiment">
            <GlowCard glowColor={fgColor}>
              <View style={styles.fgHeader}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>FEAR & GREED INDEX</Text>
                <Text style={[styles.fgValue, { color: fgColor }]}>
                  {fgValue ?? '—'}
                </Text>
              </View>
              <View style={styles.fgBarTrack}>
                <View style={[styles.fgBarFill, { width: `${fgValue ?? 50}%`, backgroundColor: fgColor }]} />
              </View>
              <View style={styles.fgLabels}>
                <Text style={[styles.fgLabel, { color: colors.red }]}>EXTREME FEAR</Text>
                <Text style={[styles.fgLabel, { color: fgColor }]}>{fgClass.toUpperCase()}</Text>
                <Text style={[styles.fgLabel, { color: colors.green }]}>EXTREME GREED</Text>
              </View>
            </GlowCard>
          </PaywallGate>

          {/* Narrative Alignment */}
          <PaywallGate feature="sentiment alignment">
            <GlowCard glowColor={alignmentColor}>
              <View style={styles.alignmentHeader}>
                <PulsingDot color={alignmentColor} size={4} />
                <Text style={[styles.sectionTitle, { color: alignmentColor, marginBottom: 0 }]}>
                  NARRATIVE ALIGNMENT
                </Text>
              </View>
              <View style={styles.alignmentStatus}>
                <View style={[styles.alignmentDot, { backgroundColor: alignmentColor }]} />
                <Text style={[styles.alignmentText, { color: alignmentColor }]}>
                  {alignmentLabel}
                </Text>
              </View>
              <Text style={styles.alignmentDesc}>
                {isAligned === true
                  ? 'News sentiment and on-chain flows are moving in the same direction. Market consensus is strong.'
                  : isAligned === false
                  ? 'News and on-chain flows are diverging. On-chain activity suggests actual capital movement. Follow the money.'
                  : 'Awaiting sufficient data to compare sentiment and signal.'}
              </Text>
            </GlowCard>
          </PaywallGate>

          {/* AI Analyst Narrative */}
          <PaywallGate feature="AI flow analysis">
            <GlowCard glowColor={colors.cyan}>
              <View style={styles.analystHeader}>
                <PulsingDot color={colors.cyan} size={4} />
                <Text style={[styles.sectionTitle, { color: colors.cyan, marginBottom: 0 }]}>
                  FLOW ANALYST
                </Text>
                {analyst?.cached && (
                  <Text style={styles.cachedBadge}>CACHED</Text>
                )}
              </View>
              {analystLoading ? (
                <Text style={styles.loadingText}>Generating analysis...</Text>
              ) : analyst?.narrative ? (
                <Text style={styles.narrativeText}>{analyst.narrative}</Text>
              ) : (
                <Text style={styles.narrativeText}>
                  AI Flow Analyst generates intelligence briefings when the backend is connected with an Anthropic API key.
                </Text>
              )}
            </GlowCard>
          </PaywallGate>

          {/* News Feed */}
          <PaywallGate feature="filtered news feed">
            <GlowCard noPadding>
              <View style={styles.newsHeader}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>FILTERED NEWS</Text>
                <Text style={styles.newsCount}>{news.length} items</Text>
              </View>
              {news.length === 0 && (
                <View style={styles.emptyNews}>
                  <Text style={styles.emptyText}>No relevant news at this time.</Text>
                </View>
              )}
              {news.map((item, i) => (
                <TouchableOpacity
                  key={item.id || i}
                  style={styles.newsRow}
                  onPress={() => item.url && Linking.openURL(item.url)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sentimentDot, { backgroundColor: SENTIMENT_COLORS[item.sentiment] || colors.muted }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.newsMeta}>
                      <Text style={styles.newsSource}>{item.source}</Text>
                      <Text style={styles.newsTime}>{getTimeAgo(item.publishedAt)}</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.sentimentBadge,
                    { backgroundColor: (SENTIMENT_COLORS[item.sentiment] || colors.muted) + '15' },
                  ]}>
                    <Text style={[
                      styles.sentimentText,
                      { color: SENTIMENT_COLORS[item.sentiment] || colors.muted },
                    ]}>
                      {item.sentiment?.toUpperCase() || 'NEUTRAL'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </GlowCard>
          </PaywallGate>

          <View style={{ height: 30 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function getTimeAgo(timestamp: string): string {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  sub: { color: colors.muted, fontSize: 11, marginLeft: 22 },

  sectionTitle: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 14,
  },

  // Fear & Greed
  fgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fgValue: {
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  fgBarTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginBottom: 8,
  },
  fgBarFill: {
    height: 6,
    borderRadius: 3,
  },
  fgLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fgLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // Analyst
  analystHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  cachedBadge: {
    marginLeft: 'auto',
    color: colors.muted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  narrativeText: {
    color: colors.textSub,
    fontSize: 13,
    lineHeight: 21,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 12,
    fontStyle: 'italic',
  },

  // News
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  newsCount: {
    color: colors.muted,
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  newsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  sentimentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  newsTitle: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  newsMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  newsSource: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  newsTime: {
    color: colors.muted,
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  sentimentBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sentimentText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyNews: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },

  // Narrative Alignment
  alignmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  alignmentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alignmentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alignmentText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  alignmentDesc: {
    color: colors.textSub,
    fontSize: 12,
    lineHeight: 18,
  },
});
