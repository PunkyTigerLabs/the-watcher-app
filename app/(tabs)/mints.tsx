import { useEffect, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PulsingDot from '../../src/components/PulsingDot';
import GlowCard from '../../src/components/GlowCard';
import { colors, TOKEN_COLORS } from '../../src/theme';
import { mintEvents, mintChartData } from '../../src/data/mockData';

const fmt = (n: number) => `$${(n/1e6).toFixed(0)}M`;
const BAR_MAX = 1200;

export default function Mints() {
  const minted = mintEvents.filter(e => e.type === 'MINT').reduce((s, e) => s + e.amount, 0);
  const burned = mintEvents.filter(e => e.type === 'BURN').reduce((s, e) => s + e.amount, 0);
  const net = minted - burned;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <PulsingDot color={colors.green} size={6} />
            <Text style={styles.title}>Mint & Burn</Text>
          </View>
          <Text style={styles.sub}>USDC · USDT · DAI · PYUSD supply changes</Text>
        </View>

        {/* Hero stats */}
        <View style={styles.heroRow}>
          <View style={styles.heroCard}>
            <View style={[styles.heroAccent, { backgroundColor: colors.green }]} />
            <Text style={styles.heroLabel}>PRINTED</Text>
            <Text style={[styles.heroValue, { color: colors.green }]}>{fmt(minted)}</Text>
            <Text style={styles.heroSub}>new supply</Text>
          </View>
          <View style={styles.heroCard}>
            <View style={[styles.heroAccent, { backgroundColor: colors.red }]} />
            <Text style={styles.heroLabel}>BURNED</Text>
            <Text style={[styles.heroValue, { color: colors.red }]}>{fmt(burned)}</Text>
            <Text style={styles.heroSub}>removed</Text>
          </View>
          <View style={styles.heroCard}>
            <View style={[styles.heroAccent, { backgroundColor: net >= 0 ? colors.green : colors.red }]} />
            <Text style={styles.heroLabel}>NET</Text>
            <Text style={[styles.heroValue, { color: net >= 0 ? colors.green : colors.red }]}>
              {net >= 0 ? '+' : ''}{fmt(net)}
            </Text>
            <Text style={styles.heroSub}>expansion</Text>
          </View>
        </View>

        {/* 7-day chart */}
        <GlowCard>
          <Text style={styles.sectionTitle}>7-DAY SUPPLY CHANGES ($M)</Text>
          <View style={styles.chart}>
            {mintChartData.map((d, i) => {
              const mintH = (d.mint / BAR_MAX) * 90;
              const burnH = (d.burn / BAR_MAX) * 90;
              return (
                <View key={i} style={styles.barGroup}>
                  <View style={styles.bars}>
                    <View style={[styles.bar, styles.mintBar, { height: mintH }]} />
                    <View style={[styles.bar, styles.burnBar, { height: burnH }]} />
                  </View>
                  <Text style={styles.barLabel}>{d.day}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.green }]} />
              <Text style={styles.legendText}>Mint</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.red }]} />
              <Text style={styles.legendText}>Burn</Text>
            </View>
          </View>
        </GlowCard>

        {/* Live events */}
        <GlowCard glowColor={colors.cyan} noPadding>
          <View style={styles.eventsHeader}>
            <PulsingDot color={colors.cyan} size={4} />
            <Text style={[styles.sectionTitle, { marginBottom: 0, color: colors.cyan }]}>LIVE EVENTS</Text>
          </View>
          {mintEvents.map((e, i) => (
            <EventRow key={i} event={e} index={i} />
          ))}
        </GlowCard>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function EventRow({ event: e, index }: { event: typeof mintEvents[0]; index: number }) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }).start();
  }, []);

  const isMint = e.type === 'MINT';
  const dirColor = isMint ? colors.green : colors.red;

  return (
    <Animated.View style={[styles.eventRow, { opacity: fadeIn }]}>
      <View style={[styles.eventDirLine, { backgroundColor: dirColor }]} />
      <Text style={styles.eventTime}>{e.time}</Text>
      <View style={[styles.typeBadge, { backgroundColor: dirColor + '12', borderColor: dirColor + '30' }]}>
        <Text style={[styles.typeBadgeText, { color: dirColor }]}>{e.type}</Text>
      </View>
      <View style={[styles.tokenBadge, { backgroundColor: TOKEN_COLORS[e.token] + '15', borderColor: TOKEN_COLORS[e.token] + '30' }]}>
        <Text style={[styles.tokenText, { color: TOKEN_COLORS[e.token] }]}>{e.token}</Text>
      </View>
      <Text style={styles.entityText} numberOfLines={1}>{e.entity}</Text>
      <Text style={[styles.eventAmount, { color: dirColor }]}>{fmt(e.amount)}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  sub: { color: colors.muted, fontSize: 11, marginLeft: 22 },

  heroRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  heroCard: {
    flex: 1,
    backgroundColor: colors.surfaceSolid,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 14,
    overflow: 'hidden',
  },
  heroAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  heroLabel: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  heroValue: { fontSize: 18, fontWeight: '700', letterSpacing: -0.5 },
  heroSub: { color: colors.muted, fontSize: 9, marginTop: 2 },

  sectionTitle: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 14 },

  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 100, marginBottom: 10 },
  barGroup: { flex: 1, alignItems: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 12, borderRadius: 3, minHeight: 2 },
  mintBar: { backgroundColor: colors.green + 'CC' },
  burnBar: { backgroundColor: colors.red + 'CC' },
  barLabel: { color: colors.muted, fontSize: 9, marginTop: 6, fontWeight: '600' },
  legend: { flexDirection: 'row', gap: 16, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 4, borderRadius: 2 },
  legendText: { color: colors.muted, fontSize: 10 },

  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  eventDirLine: { width: 2, height: '80%', borderRadius: 1 },
  eventTime: { color: colors.muted, fontSize: 10, fontVariant: ['tabular-nums'], width: 38 },
  typeBadge: { borderWidth: 0.5, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  typeBadgeText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  tokenBadge: { borderWidth: 0.5, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  tokenText: { fontSize: 8, fontWeight: '700' },
  entityText: { color: colors.textSub, fontSize: 11, flex: 1 },
  eventAmount: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
