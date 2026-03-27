import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme';
import { rwaProtocols } from '../../src/data/mockData';

const fmt = (n: number) => {
  const a = Math.abs(n);
  const s = a >= 1e9 ? `$${(a/1e9).toFixed(2)}B` : `$${(a/1e6).toFixed(0)}M`;
  return n < 0 ? `-${s}` : `+${s}`;
};

const totalTVL = rwaProtocols.reduce((s, p) => s + p.tvl, 0);
const totalFlow = rwaProtocols.reduce((s, p) => s + p.flow7d, 0);

export default function RWA() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={['#1A1400', colors.bg]} style={styles.heroHeader}>
          <View style={styles.tagRow}>
            <View style={styles.megaTag}><Text style={styles.megaTagText}>MEGA-TREND 2026</Text></View>
          </View>
          <Text style={styles.title}>Real World Assets</Text>
          <Text style={styles.sub}>Tokenized US Treasuries & institutional on-chain capital</Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>${(totalTVL/1e9).toFixed(2)}B</Text>
              <Text style={styles.heroStatLabel}>TOTAL TVL</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: colors.green }]}>{fmt(totalFlow)}</Text>
              <Text style={styles.heroStatLabel}>7D NET FLOW</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Protocol cards */}
        <View style={styles.list}>
          {rwaProtocols.map((p, i) => (
            <View key={p.name} style={[styles.protocolCard, { borderTopColor: p.color }]}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.protocolName}>{p.name}</Text>
                  <Text style={styles.protocolTicker}>{p.ticker}</Text>
                </View>
                <View style={[styles.apyBadge, { backgroundColor: p.color + '20', borderColor: p.color + '40' }]}>
                  <Text style={[styles.apyText, { color: p.color }]}>{p.apy}% APY</Text>
                </View>
              </View>

              {/* TVL bar */}
              <View style={styles.tvlRow}>
                <Text style={styles.tvlLabel}>TVL</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(p.tvl / rwaProtocols[0].tvl) * 100}%`, backgroundColor: p.color }]} />
                </View>
                <Text style={[styles.tvlValue]}>${(p.tvl/1e6).toFixed(0)}M</Text>
              </View>

              <View style={styles.flowRow}>
                <Text style={styles.tvlLabel}>7D FLOW</Text>
                <Text style={[styles.flowValue, { color: p.flow7d >= 0 ? colors.green : colors.red }]}>{fmt(p.flow7d)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Context */}
        <View style={[styles.contextCard, { borderLeftColor: colors.gold }]}>
          <Text style={styles.contextTitle}>WHY RWA MATTERS</Text>
          <Text style={styles.contextText}>
            When BlackRock's BUIDL fund sees inflows, it signals institutional confidence in on-chain infra. RWA growth from $1B to $15B+ in 2024 shows tokenized Treasuries are now a real alternative to T-Bills — every dollar in means fiat leaving TradFi.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  heroHeader: { padding: 20, paddingTop: 24, paddingBottom: 28 },
  tagRow: { marginBottom: 10 },
  megaTag: { alignSelf: 'flex-start', backgroundColor: colors.goldDim, borderWidth: 1, borderColor: colors.gold + '50', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  megaTagText: { color: colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700', marginBottom: 4 },
  sub: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  heroStats: { flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 16 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { color: colors.text, fontSize: 20, fontWeight: '700' },
  heroStatLabel: { color: colors.muted, fontSize: 10, fontWeight: '600', letterSpacing: 1, marginTop: 2 },
  heroStatDivider: { width: 1, height: 36, backgroundColor: colors.border },
  list: { paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  protocolCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, borderTopWidth: 2, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  protocolName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  protocolTicker: { color: colors.muted, fontSize: 11, marginTop: 2, fontFamily: 'monospace' },
  apyBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  apyText: { fontSize: 11, fontWeight: '700' },
  tvlRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  tvlLabel: { color: colors.muted, fontSize: 10, fontWeight: '600', letterSpacing: 0.5, width: 48 },
  barTrack: { flex: 1, height: 4, backgroundColor: colors.border, borderRadius: 2 },
  barFill: { height: 4, borderRadius: 2 },
  tvlValue: { color: colors.text, fontSize: 12, fontWeight: '700', fontFamily: 'monospace', width: 56, textAlign: 'right' },
  flowRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flowValue: { fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  contextCard: { marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3, padding: 16, marginBottom: 12 },
  contextTitle: { color: colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  contextText: { color: colors.muted, fontSize: 13, lineHeight: 20 },
});
