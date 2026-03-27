import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import SignalArc from '../../src/components/SignalArc';
import { colors } from '../../src/theme';
import { currentSignal, signalHistory } from '../../src/data/mockData';

const CHART_H = 80;
const max = Math.max(...signalHistory);

const alerts = [
  { time: '2h ago', text: 'Crossed +60 threshold', score: '+67', up: true },
  { time: '8h ago', text: 'Dropped below +40', score: '+38', up: false },
  { time: '1d ago', text: 'Entered accumulation', score: '+55', up: true },
  { time: '3d ago', text: 'Distribution detected', score: '-8', up: false },
];

const ZONES = [
  { range: '+60 → +100', label: 'STRONG ACCUM.', color: colors.green },
  { range: '+20 → +60', label: 'ACCUMULATION', color: '#7EC88A' },
  { range: '-20 → +20', label: 'NEUTRAL', color: colors.gold },
  { range: '-60 → -20', label: 'DISTRIBUTION', color: '#E8806A' },
  { range: '-100 → -60', label: 'STRONG DIST.', color: colors.red },
];

export default function Signal() {
  const { score, label, subscores, updatedAgo } = currentSignal;
  const scoreColor = score > 30 ? colors.green : score < -30 ? colors.red : colors.gold;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>The Signal</Text>
          <Text style={styles.sub}>Composite flow score · -100 to +100 · Every 15 min</Text>
        </View>

        {/* Score hero */}
        <LinearGradient colors={['#0D1117', colors.bg]} style={styles.heroCard}>
          <SignalArc score={score} label={label} />
          <Text style={styles.updatedText}>Updated {updatedAgo}</Text>
        </LinearGradient>

        {/* Subscores */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>SCORE BREAKDOWN</Text>
          {[
            { label: 'Stablecoin Flow', score: subscores.stablecoin, weight: '40%' },
            { label: 'Exchange Net Flow', score: subscores.exchange, weight: '25%' },
            { label: 'Whale Activity', score: subscores.whale, weight: '20%' },
            { label: 'Cross-Chain Bridges', score: subscores.crosschain, weight: '15%' },
          ].map(s => (
            <View key={s.label} style={styles.subscore}>
              <View style={styles.subscoreTop}>
                <Text style={styles.subscoreLabel}>{s.label}</Text>
                <View style={styles.subscoreRight}>
                  <Text style={styles.subscoreWeight}>{s.weight}</Text>
                  <Text style={[styles.subscoreValue, { color: colors.green }]}>+{s.score}</Text>
                </View>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${s.score}%`, backgroundColor: colors.green }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Mini chart */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>30-DAY HISTORY</Text>
          <View style={styles.miniChart}>
            {signalHistory.map((v, i) => (
              <View
                key={i}
                style={[styles.miniBar, {
                  height: Math.max(2, (v / max) * CHART_H),
                  backgroundColor: v > 50 ? colors.green : v > 20 ? '#7EC88A' : v > 0 ? colors.gold : colors.red,
                  opacity: 0.8,
                }]}
              />
            ))}
          </View>
        </View>

        {/* Zones */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ZONE GUIDE</Text>
          {ZONES.map(z => (
            <View key={z.label} style={[styles.zoneRow, { borderLeftColor: z.color }]}>
              <View style={[styles.zoneDot, { backgroundColor: z.color }]} />
              <Text style={[styles.zoneLabel, { color: z.color }]}>{z.label}</Text>
              <Text style={styles.zoneRange}>{z.range}</Text>
            </View>
          ))}
        </View>

        {/* Alerts */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>THRESHOLD ALERTS</Text>
          {alerts.map((a, i) => (
            <View key={i} style={[styles.alertRow, i === alerts.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={{ color: a.up ? colors.green : colors.red, fontSize: 11 }}>{a.up ? '▲' : '▼'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertText}>{a.text}</Text>
                <Text style={styles.alertTime}>{a.time}</Text>
              </View>
              <Text style={[styles.alertScore, { color: a.up ? colors.green : colors.red }]}>{a.score}</Text>
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
  heroCard: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20, alignItems: 'center', marginBottom: 12 },
  updatedText: { color: colors.muted, fontSize: 11, marginTop: 4 },
  card: { marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 },
  sectionTitle: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 14 },
  subscore: { marginBottom: 14 },
  subscoreTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subscoreLabel: { color: colors.text, fontSize: 13 },
  subscoreRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subscoreWeight: { color: colors.muted, fontSize: 11 },
  subscoreValue: { fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  barTrack: { height: 4, backgroundColor: colors.border, borderRadius: 2 },
  barFill: { height: 4, borderRadius: 2 },
  miniChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: CHART_H + 4 },
  miniBar: { flex: 1, borderRadius: 2 },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderLeftWidth: 2, paddingLeft: 10, marginBottom: 2 },
  zoneDot: { width: 6, height: 6, borderRadius: 3 },
  zoneLabel: { fontSize: 11, fontWeight: '700', flex: 1 },
  zoneRange: { color: colors.muted, fontSize: 11, fontFamily: 'monospace' },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  alertText: { color: colors.text, fontSize: 13 },
  alertTime: { color: colors.muted, fontSize: 11, marginTop: 2 },
  alertScore: { fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
});
