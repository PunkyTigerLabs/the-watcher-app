import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignalArc from '../../src/components/SignalArc';
import FlowCard from '../../src/components/FlowCard';
import PulsingDot from '../../src/components/PulsingDot';
import TickerRibbon from '../../src/components/TickerRibbon';
import GlowCard from '../../src/components/GlowCard';
import { colors, gradients } from '../../src/theme';
import { currentSignal, aiNarrative, topInflows, topOutflows, stats } from '../../src/data/mockData';

const fmt = (n: number) => n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : `$${(n/1e6).toFixed(0)}M`;

const tickerItems = [
  { label: 'USDC SUPPLY', value: '$52.1B', change: 2.4 },
  { label: 'USDT SUPPLY', value: '$140.2B', change: 0.8 },
  { label: 'BTC', value: '$87,420', change: 3.2 },
  { label: 'ETH', value: '$3,280', change: -1.4 },
  { label: 'BUIDL TVL', value: '$2.7B', change: 5.8 },
  { label: 'SIGNAL', value: '+67', change: 4.1 },
];

export default function Dashboard() {
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(contentSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View style={styles.logoRow}>
          <PulsingDot color={colors.green} size={6} />
          <Text style={styles.logo}>THE WATCHER</Text>
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <Text style={styles.subhead}>Capital Flow Intelligence</Text>
      </Animated.View>

      {/* Ticker ribbon */}
      <TickerRibbon items={tickerItems} />

      <Animated.ScrollView
        style={[styles.scroll, { opacity: headerOpacity, transform: [{ translateY: contentSlide }] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Signal Arc Hero */}
        <LinearGradient colors={[...gradients.hero]} style={styles.heroCard}>
          <View style={styles.heroGlowRing} />
          <SignalArc score={currentSignal.score} label={currentSignal.label} />
          <View style={styles.updatedRow}>
            <View style={styles.updateDot} />
            <Text style={styles.updatedText}>Updated {currentSignal.updatedAgo}</Text>
          </View>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: '24H VOLUME', value: fmt(stats.totalVolume), color: colors.text },
            { label: 'USDC NET', value: `+${fmt(stats.usdcNet)}`, color: colors.green },
            { label: 'LARGEST', value: fmt(stats.largestFlow), color: colors.cyan },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* AI Narrative */}
        <GlowCard glowColor={colors.cyan}>
          <View style={styles.narrativeHeader}>
            <PulsingDot color={colors.cyan} size={5} />
            <Text style={[styles.sectionTitle, { color: colors.cyan }]}>FLOW ANALYST</Text>
            <Text style={styles.updatedSmall}>{currentSignal.updatedAgo}</Text>
          </View>
          <Text style={styles.narrativeText}>{aiNarrative}</Text>
        </GlowCard>

        {/* Inflows */}
        <GlowCard glowColor={colors.green} noPadding>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionArrow, { color: colors.green }]}>▲</Text>
            <Text style={[styles.sectionTitle, { color: colors.green }]}>INFLOWS</Text>
            <View style={styles.sectionLine} />
            <Text style={[styles.sectionTotal, { color: colors.green }]}>
              +{fmt(topInflows.reduce((s, f) => s + f.amount, 0))}
            </Text>
          </View>
          {topInflows.map((f, i) => (
            <FlowCard key={f.name} {...f} direction="in" isNew={i === 0} />
          ))}
        </GlowCard>

        {/* Outflows */}
        <GlowCard glowColor={colors.red} noPadding>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionArrow, { color: colors.red }]}>▼</Text>
            <Text style={[styles.sectionTitle, { color: colors.red }]}>OUTFLOWS</Text>
            <View style={styles.sectionLine} />
            <Text style={[styles.sectionTotal, { color: colors.red }]}>
              -{fmt(topOutflows.reduce((s, f) => s + f.amount, 0))}
            </Text>
          </View>
          {topOutflows.map((f, i) => (
            <FlowCard key={f.name} {...f} direction="out" />
          ))}
        </GlowCard>

        <View style={{ height: 30 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
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
    gap: 4,
    marginBottom: 2,
  },
  logo: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
  },
  liveBadge: {
    marginLeft: 8,
    backgroundColor: colors.green + '18',
    borderWidth: 0.5,
    borderColor: colors.green + '40',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  liveText: {
    color: colors.green,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  subhead: { color: colors.muted, fontSize: 11, letterSpacing: 0.5, marginLeft: 22 },

  heroCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
    marginTop: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  heroGlowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.green + '08',
    top: 20,
  },
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  updateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.green,
  },
  updatedText: { color: colors.muted, fontSize: 10, letterSpacing: 0.5 },

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
  statLabel: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: '700', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },

  narrativeHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  narrativeText: {
    color: colors.textSub,
    fontSize: 13,
    lineHeight: 21,
  },
  updatedSmall: { color: colors.muted, fontSize: 10, marginLeft: 'auto' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  sectionArrow: { fontSize: 11, fontWeight: '700' },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  sectionLine: { flex: 1, height: 0.5, backgroundColor: colors.border },
  sectionTotal: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
