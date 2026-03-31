import { useEffect, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import PulsingDot from '../../src/components/PulsingDot';
import GlowCard from '../../src/components/GlowCard';
import { colors } from '../../src/theme';
import { rwaProtocols } from '../../src/data/mockData';

const fmt = (n: number) => {
  const a = Math.abs(n);
  const s = a >= 1e9 ? `$${(a/1e9).toFixed(2)}B` : `$${(a/1e6).toFixed(0)}M`;
  return n < 0 ? `-${s}` : `+${s}`;
};

const totalTVL = rwaProtocols.reduce((s, p) => s + p.tvl, 0);
const totalFlow = rwaProtocols.reduce((s, p) => s + p.flow7d, 0);
const maxTVL = Math.max(...rwaProtocols.map(p => p.tvl));

function ProtocolCard({ p, index }: { p: typeof rwaProtocols[0]; index: number }) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideIn = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }),
      Animated.timing(slideIn, { toValue: 0, duration: 400, delay: index * 100, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.protocolCard, { opacity: fadeIn, transform: [{ translateY: slideIn }] }]}>
      <View style={[styles.cardAccent, { backgroundColor: p.color }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.protocolName}>{p.name}</Text>
            <Text style={styles.protocolTicker}>{p.ticker}</Text>
          </View>
          <View style={[styles.apyBadge, { backgroundColor: p.color + '15', borderColor: p.color + '30' }]}>
            <Text style={[styles.apyText, { color: p.color }]}>{p.apy}%</Text>
            <Text style={[styles.apyLabel, { color: p.color }]}>APY</Text>
          </View>
        </View>

        <View style={styles.tvlRow}>
          <Text style={styles.metricLabel}>TVL</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${(p.tvl / maxTVL) * 100}%`, backgroundColor: p.color }]} />
          </View>
          <Text style={styles.metricValue}>${(p.tvl / 1e6).toFixed(0)}M</Text>
        </View>

        <View style={styles.flowRow}>
          <Text style={styles.metricLabel}>7D FLOW</Text>
          <Text style={[styles.flowValue, { color: p.flow7d >= 0 ? colors.green : colors.red }]}>
            {fmt(p.flow7d)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function RWA() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <LinearGradient colors={['#1A1200', '#0F0D08', colors.bg]} style={styles.heroHeader}>
          <View style={styles.tagRow}>
            <View style={styles.megaTag}>
              <Text style={styles.megaTagText}>INSTITUTIONAL TREND</Text>
            </View>
          </View>
          <Text style={styles.title}>Real World Assets</Text>
          <Text style={styles.sub}>Tokenized US Treasuries & institutional on-chain capital</Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>${(totalTVL / 1e9).toFixed(2)}B</Text>
              <Text style={styles.heroStatLabel}>TOTAL TVL</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: totalFlow >= 0 ? colors.green : colors.red }]}>
                {fmt(totalFlow)}
              </Text>
              <Text style={styles.heroStatLabel}>7D NET FLOW</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.list}>
          {rwaProtocols.map((p, i) => (
            <ProtocolCard key={p.name} p={p} index={i} />
          ))}
        </View>

        {/* Context */}
        <GlowCard glowColor={colors.gold}>
          <Text style={[styles.contextTitle]}>WHY THIS MATTERS</Text>
          <Text style={styles.contextText}>
            When BlackRock's BUIDL fund sees inflows, it signals institutional confidence in on-chain infrastructure. RWA growth from $1B to $15B+ shows tokenized Treasuries are now a real alternative to T-Bills — every dollar flowing in means capital leaving traditional finance.
          </Text>
        </GlowCard>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  heroHeader: { padding: 20, paddingTop: 20, paddingBottom: 24 },
  tagRow: { marginBottom: 10 },
  megaTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.goldDim,
    borderWidth: 0.5,
    borderColor: colors.gold + '40',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  megaTagText: { color: colors.gold, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4 },
  sub: { color: colors.muted, fontSize: 12, lineHeight: 18 },

  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: colors.surfaceSolid,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 16,
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  heroStatLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  heroStatDivider: { width: 0.5, height: 36, backgroundColor: colors.border },

  list: { paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  protocolCard: {
    backgroundColor: colors.surfaceSolid,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardAccent: { width: 3 },
  cardContent: { flex: 1, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  protocolName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  protocolTicker: { color: colors.muted, fontSize: 10, marginTop: 2, fontVariant: ['tabular-nums'] },
  apyBadge: { borderWidth: 0.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center' },
  apyText: { fontSize: 14, fontWeight: '700' },
  apyLabel: { fontSize: 8, fontWeight: '600', letterSpacing: 0.5, marginTop: 1 },

  tvlRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  metricLabel: { color: colors.muted, fontSize: 9, fontWeight: '600', letterSpacing: 0.5, width: 48 },
  barTrack: { flex: 1, height: 3, backgroundColor: colors.border, borderRadius: 2 },
  barFill: { height: 3, borderRadius: 2 },
  metricValue: { color: colors.text, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'], width: 56, textAlign: 'right' },
  flowRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flowValue: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },

  contextTitle: { color: colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  contextText: { color: colors.textSub, fontSize: 13, lineHeight: 20 },
});
