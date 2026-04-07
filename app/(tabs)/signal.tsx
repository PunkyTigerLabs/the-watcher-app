// ============================================
// THE WATCHER — SIGNAL Tab
// ============================================
// Layer 3: Decision Dashboard
// Composite score -100 to +100 with 5 weighted subscores

import { useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, Animated, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignalArc from '../../src/components/SignalArc';
import PulsingDot from '../../src/components/PulsingDot';
import GlowCard from '../../src/components/GlowCard';
import StatusBadge from '../../src/components/StatusBadge';
import PaywallGate from '../../src/components/PaywallGate';
import { LoadingState, ErrorState } from '../../src/components/LoadingState';
import { colors, gradients } from '../../src/theme';
import WatcherAPI, { SignalData, SignalHistoryPoint } from '../../src/api/watcher';
import { useAutoRefresh, useWatcher } from '../../src/api/hooks';
import { isPro } from '../../src/api/watcher';

const CHART_H = 80;

const ZONES = [
  { range: '+60 → +100', label: 'STRONG ACCUMULATION', color: colors.green, desc: 'Heavy institutional buying' },
  { range: '+20 → +60', label: 'ACCUMULATION', color: '#7EC88A', desc: 'Net positive flows' },
  { range: '-20 → +20', label: 'NEUTRAL', color: colors.gold, desc: 'Mixed signals' },
  { range: '-60 → -20', label: 'DISTRIBUTION', color: '#E8806A', desc: 'Capital outflows' },
  { range: '-100 → -60', label: 'STRONG DISTRIBUTION', color: colors.red, desc: 'Panic selling' },
];

const SUBSCORES = [
  { key: 'usdc' as const, label: 'USDC Flow', weight: '30%', icon: '◇', color: '#2775CA' },
  { key: 'usdt' as const, label: 'USDT Flow', weight: '30%', icon: '⬡', color: '#26A17B' },
  { key: 'whales' as const, label: 'Whale Activity', weight: '20%', icon: '◎', color: colors.cyan },
  { key: 'divergence' as const, label: 'Divergence', weight: '10%', icon: '⟡', color: colors.gold },
  { key: 'sentiment' as const, label: 'Sentiment', weight: '10%', icon: '◈', color: '#A78BFA' },
];

export default function SignalTab() {
  const { data: signal, loading, error, refresh } = useAutoRefresh<SignalData>(
    () => WatcherAPI.signal(isPro()),
    60000,
  );
  const { data: historyData } = useWatcher(
    () => WatcherAPI.signalHistory(30),
    [],
  );

  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  if (loading && !signal) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingState message="Computing signal..." />
      </SafeAreaView>
    );
  }

  if (error && !signal) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ErrorState message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  const score = signal?.score ?? 0;
  const label = signal?.label ?? 'NEUTRAL';
  const subscores = signal?.subscores;
  const decisionContext = signal?.decisionContext;
  const signalHeadline = signal?.headline;
  const updatedAt = signal?.updatedAt;
  const history = historyData?.history ?? [];

  const scoreColor = score > 30 ? colors.green : score < -30 ? colors.red : colors.gold;
  const max = Math.max(...history.map((h) => Math.abs(h.score)), 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Animated.View style={{ flex: 1, opacity: headerOpacity }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.green} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <PulsingDot color={scoreColor} size={6} />
              <Text style={styles.title}>The Signal</Text>
              <StatusBadge status={signal ? 'LIVE' : 'DEMO'} />
            </View>
            <Text style={styles.sub}>
              Composite flow score · -100 to +100 · 5 weighted inputs
            </Text>
          </View>

          {/* Score Hero */}
          <LinearGradient colors={[...gradients.hero]} style={styles.heroCard}>
            <SignalArc score={score} label={label} />
            {updatedAt && (
              <View style={styles.updatedRow}>
                <View style={[styles.updateDot, { backgroundColor: scoreColor }]} />
                <Text style={styles.updatedText}>Updated {getTimeAgo(updatedAt)}</Text>
              </View>
            )}
          </LinearGradient>

          {/* Signal Headline */}
          {signalHeadline && (
            <GlowCard glowColor={scoreColor}>
              <Text style={styles.headlineText}>{signalHeadline}</Text>
            </GlowCard>
          )}

          {/* Subscores (PRO shows full, FREE shows limited) */}
          <PaywallGate feature="full signal breakdown">
            <GlowCard glowColor={scoreColor}>
              <Text style={styles.sectionTitle}>SCORE BREAKDOWN</Text>
              {SUBSCORES.map((s) => {
                const val = subscores?.[s.key] ?? 0;
                const normalized = ((val + 100) / 200) * 100; // -100..+100 → 0..100%
                return (
                  <View key={s.key} style={styles.subscore}>
                    <View style={styles.subscoreTop}>
                      <Text style={styles.subscoreLabel}>{s.icon} {s.label}</Text>
                      <View style={styles.subscoreRight}>
                        <Text style={styles.subscoreWeight}>{s.weight}</Text>
                        <Text style={[styles.subscoreValue, { color: val > 0 ? colors.green : val < 0 ? colors.red : colors.gold }]}>
                          {val > 0 ? '+' : ''}{val.toFixed(0)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${Math.max(2, normalized)}%`, backgroundColor: s.color },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </GlowCard>
          </PaywallGate>

          {/* Decision Context (PRO) */}
          {decisionContext && decisionContext.length > 0 && (
            <PaywallGate feature="decision context">
              <GlowCard glowColor={colors.cyan}>
                <View style={styles.decisionHeader}>
                  <PulsingDot color={colors.cyan} size={4} />
                  <Text style={[styles.sectionTitle, { color: colors.cyan, marginBottom: 0 }]}>
                    DECISION CONTEXT
                  </Text>
                </View>
                {decisionContext.map((line, i) => (
                  <View key={i} style={styles.decisionRow}>
                    <Text style={styles.decisionBullet}>▸</Text>
                    <Text style={styles.decisionText}>{line}</Text>
                  </View>
                ))}
              </GlowCard>
            </PaywallGate>
          )}

          {/* 30-day History */}
          {history.length > 0 && (
            <GlowCard>
              <Text style={styles.sectionTitle}>30-DAY HISTORY</Text>
              <View style={styles.miniChart}>
                {history.map((h, i) => {
                  const barColor =
                    h.score > 50 ? colors.green : h.score > 20 ? '#7EC88A' : h.score > 0 ? colors.gold : h.score > -50 ? '#E8806A' : colors.red;
                  const isLast = i === history.length - 1;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.miniBar,
                        {
                          height: Math.max(3, (Math.abs(h.score) / max) * CHART_H),
                          backgroundColor: barColor,
                          opacity: isLast ? 1 : 0.7,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </GlowCard>
          )}

          {/* Zones */}
          <GlowCard glowColor={colors.gold}>
            <Text style={styles.sectionTitle}>ZONES</Text>
            {ZONES.map((z) => (
              <View key={z.label} style={[styles.zoneRow, { borderLeftColor: z.color }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.zoneLabel, { color: z.color }]}>{z.label}</Text>
                  <Text style={styles.zoneDesc}>{z.desc}</Text>
                </View>
                <Text style={styles.zoneRange}>{z.range}</Text>
              </View>
            ))}
          </GlowCard>

          <View style={{ height: 30 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  sub: { color: colors.muted, fontSize: 11, marginLeft: 22 },

  heroCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  updatedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  updateDot: { width: 4, height: 4, borderRadius: 2 },
  updatedText: { color: colors.muted, fontSize: 10 },

  headlineText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  sectionTitle: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 14,
  },

  subscore: { marginBottom: 16 },
  subscoreTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subscoreLabel: { color: colors.textSub, fontSize: 13 },
  subscoreRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subscoreWeight: { color: colors.muted, fontSize: 10 },
  subscoreValue: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  barTrack: { height: 3, backgroundColor: colors.border, borderRadius: 2 },
  barFill: { height: 3, borderRadius: 2 },

  decisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  decisionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  decisionBullet: {
    color: colors.cyan,
    fontSize: 12,
    marginTop: 1,
  },
  decisionText: {
    color: colors.textSub,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },

  miniChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: CHART_H + 4 },
  miniBar: { flex: 1, borderRadius: 2 },

  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderLeftWidth: 2,
    paddingLeft: 12,
    marginBottom: 4,
  },
  zoneLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  zoneDesc: { color: colors.muted, fontSize: 10, marginTop: 1 },
  zoneRange: { color: colors.muted, fontSize: 10, fontVariant: ['tabular-nums'] },
});
