import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, TOKEN_COLORS, CHAIN_COLORS } from '../../src/theme';
import { mintEvents, mintChartData } from '../../src/data/mockData';

const fmt = (n: number) => `$${(n/1e6).toFixed(0)}M`;

const BAR_MAX = 1200;
const BAR_WIDTH = 28;

export default function Mints() {
  const minted = mintEvents.filter(e => e.type === 'MINT').reduce((s, e) => s + e.amount, 0);
  const burned = mintEvents.filter(e => e.type === 'BURN').reduce((s, e) => s + e.amount, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Mint & Burn</Text>
          <Text style={styles.sub}>USDC · USDT · DAI · PYUSD</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderTopColor: colors.green }]}>
            <Text style={styles.statLabel}>MINTED</Text>
            <Text style={[styles.statValue, { color: colors.green }]}>{fmt(minted)}</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: colors.red }]}>
            <Text style={styles.statLabel}>BURNED</Text>
            <Text style={[styles.statValue, { color: colors.red }]}>{fmt(burned)}</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: colors.gold }]}>
            <Text style={styles.statLabel}>NET</Text>
            <Text style={[styles.statValue, { color: colors.gold }]}>+{fmt(minted - burned)}</Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>7-DAY HISTORY ($M)</Text>
          <View style={styles.chart}>
            {mintChartData.map((d, i) => (
              <View key={i} style={styles.barGroup}>
                <View style={styles.bars}>
                  <View style={[styles.bar, { height: (d.mint / BAR_MAX) * 100, backgroundColor: colors.green + 'CC' }]} />
                  <View style={[styles.bar, { height: (d.burn / BAR_MAX) * 100, backgroundColor: colors.red + 'CC' }]} />
                </View>
                <Text style={styles.barLabel}>{d.day}</Text>
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.green }]} /><Text style={styles.legendText}>Mint</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.red }]} /><Text style={styles.legendText}>Burn</Text></View>
          </View>
        </View>

        {/* Events */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>RECENT EVENTS</Text>
          {mintEvents.map((e, i) => (
            <View key={i} style={styles.eventRow}>
              <Text style={styles.eventTime}>{e.time}</Text>
              <View style={[styles.typeBadge, {
                backgroundColor: e.type === 'MINT' ? colors.greenDim : colors.redDim,
                borderColor: e.type === 'MINT' ? colors.green + '50' : colors.red + '50',
              }]}>
                <Text style={[styles.typeBadgeText, { color: e.type === 'MINT' ? colors.green : colors.red }]}>{e.type}</Text>
              </View>
              <View style={[styles.tokenBadge, { backgroundColor: TOKEN_COLORS[e.token] + '20', borderColor: TOKEN_COLORS[e.token] + '50' }]}>
                <Text style={[styles.tokenText, { color: TOKEN_COLORS[e.token] }]}>{e.token}</Text>
              </View>
              <Text style={styles.entityText} numberOfLines={1}>{e.entity}</Text>
              <Text style={[styles.eventAmount, { color: e.type === 'MINT' ? colors.green : colors.red, marginLeft: 'auto' }]}>{fmt(e.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: 2 },
  sub: { color: colors.muted, fontSize: 12 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, borderTopWidth: 2, padding: 12 },
  statLabel: { color: colors.muted, fontSize: 9, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  statValue: { color: colors.text, fontSize: 15, fontWeight: '700' },
  card: { marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 },
  sectionTitle: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 14 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 110, marginBottom: 8 },
  barGroup: { flex: 1, alignItems: 'center', gap: 2 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 10, borderRadius: 2, minHeight: 2 },
  barLabel: { color: colors.muted, fontSize: 9, marginTop: 4 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { color: colors.muted, fontSize: 11 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  eventTime: { color: colors.muted, fontSize: 10, fontFamily: 'monospace', minWidth: 40 },
  typeBadge: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  typeBadgeText: { fontSize: 9, fontWeight: '700' },
  tokenBadge: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  tokenText: { fontSize: 9, fontWeight: '700' },
  entityText: { color: colors.textSub, fontSize: 11, flex: 1 },
  eventAmount: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
});
