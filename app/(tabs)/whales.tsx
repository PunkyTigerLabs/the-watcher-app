import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme';
import { whaleWallets } from '../../src/data/mockData';

const fmt = (n: number) => n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : `$${(n/1e6).toFixed(0)}M`;

const TYPE_COLORS: Record<string, string> = {
  CEX: colors.green,
  Institutional: colors.gold,
  DeFi: '#A78BFA',
  Unknown: colors.muted,
};

export default function Whales() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Whale Tracker</Text>
          <Text style={styles.sub}>847 wallets monitored · Real-time</Text>
        </View>

        <View style={styles.card}>
          {whaleWallets.map((w, i) => (
            <View key={w.name} style={[styles.row, i === whaleWallets.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.typeLine, { backgroundColor: TYPE_COLORS[w.type] }]} />
              <View style={styles.rowContent}>
                <View style={styles.rowTop}>
                  <Text style={styles.whaleName}>{w.name}</Text>
                  <Text style={[styles.change, { color: w.change >= 0 ? colors.green : colors.red }]}>
                    {w.change >= 0 ? '+' : ''}{w.change}%
                  </Text>
                </View>
                <Text style={styles.address}>{w.address}</Text>
                <View style={styles.rowBottom}>
                  <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[w.type] + '15', borderColor: TYPE_COLORS[w.type] + '40' }]}>
                    <Text style={[styles.typeText, { color: TYPE_COLORS[w.type] }]}>{w.type}</Text>
                  </View>
                  <Text style={styles.action} numberOfLines={1}>{w.action}</Text>
                  <Text style={styles.volume}>{fmt(w.volume)}</Text>
                </View>
              </View>
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
  card: { marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  typeLine: { width: 3 },
  rowContent: { flex: 1, padding: 14 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  whaleName: { color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  change: { fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  address: { color: colors.muted, fontSize: 11, fontFamily: 'monospace', marginBottom: 6 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  typeText: { fontSize: 9, fontWeight: '700' },
  action: { color: colors.textSub, fontSize: 11, flex: 1 },
  volume: { color: colors.text, fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
});
