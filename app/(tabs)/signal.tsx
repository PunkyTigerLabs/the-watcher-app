import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import SignalArc from '../../src/components/SignalArc';
import PulsingDot from '../../src/components/PulsingDot';
import GlowCard from '../../src/components/GlowCard';
import { colors, gradients } from '../../src/theme';
import { currentSignal, signalHistory } from '../../src/data/mockData';

const CHART_H = 80;
const max = Math.max(...signalHistory);

const alerts = [
  { time: '2h ago', text: 'Crossed +60 threshold', score: '+67', up: true },
  { time: '8h ago', text: 'Dropped below +40', score: '+38', up: false },
  { time: '1d ago', text: 'Entered accumulation zone', score: '+55', up: true },
  { time: '3d ago', text: 'Distribution signal detected', score: '-8', up: false },
];

const ZONES = [
  { range: '+60 → +100', label: 'STRONG ACCUMULATION', color: colors.green, desc: 'Heavy institutional buying' },
  { range: '+20 → +60', label: 'ACCUMULATION', color: '#7EC88A', desc: 'Net positive flows' },
  { range: '-20 → +20', label: 'NEUTRAL', color: colors.gold, desc: 'Mixed signals' },
  { range: '-60 → -20', label: 'DISTRIBUTION', color: '#E8806A', desc: 'Capital outflows' },
  { range: '-100 → -60', label: 'STRONG DISTRIBUTION', color: colors.red, desc: 'Panic selling' },
];

export default function Signal() {
  const { score, label, subscores, updatedAgo } = currentSignal;
  const scoreColor = score > 30 ? colors.green : score < -30 ? colors.red : colors.gold;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={styles.titleRow}>
            <PulsingDot color={scoreColor} size={6} />
            <Text style={styles.title}>The Signal</Text>
          </View>
          <Text style={styles.sub}>Composite flow score · -100 to +100 · Updated every 15 min</Text>
        </View>

        {/* Score hero */}
        <LinearGradient colors={[...gradients.hero]} style={styles.heroCard}>
          <SignalArc score={score} label={label} />
          <View style={styles.updatedRow}>
            <View style={[styles.updateDot, { backgroundColor: scoreColor }]} />
            <Text style={styles.updatedText}>Updated {updatedAgo}</Text>
          </View>
        </LinearGradient>

        {/* Subscores */}
        <GlowCard glowColor={scoreColor}>
          <Text style={styles.sectionTitle}>SCORE BREAKDOWN</Text>
          {[
            { label: 'Stablecoin Flow', val: subscores.stablecoin, weight: '40%', icon: '◇' },
            { label: 'Exchange Net Flow', val: subscores.exchange, weight: '25%', icon: '⬡' },
            { label: 'Whale Activity', val: subscores.whale, weight: '20%', icon: '◎' },
            { label: 'Cross-Chain', val: subscores.crosschain, weight: '15%', icon: '⟡' },
          ].map(s => (
            <View key={s.label} style={styles.subscore}>
              <View style={styles.subscoreTop}>
                <Text style={styles.subscoreLabel}>{s.icon} {s.label}</Text>
                <View style={styles.subscoreRight}>
                  <Text style={styles.subscoreWeight}>{s.weight}</Text>
                  <Text style={[styles.subscoreValue, { color: colors.green }]}>+{s.val}</Text>
                </View>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${s.val}%`, backgroundColor: colors.green }]} />
              </View>
            </View>
          ))}
        </GlowCard>

        {/* 30-day history */}
        <GlowCard>
          <Text style={styles.sectionTitle}>30-DAY HISTORY</Text>
          <View style={styles.miniChart}>
            {signalHistory.map((v, i) => {
              const barColor = v > 50 ? colors.green : v > 20 ? '#7EC88A' : v > 0 ? colors.gold : colors.red;
              const isLast = i === signalHistory.length - 1;
              return (
                <View
                  key={i}
                  style={[styles.miniBar, {
                    height: Math.max(3, (v / max) * CHART_H),
                    backgroundColor: barColor,
                    opacity: isLast ? 1 : 0.7,
                  }]}
                />
              );
            })}
          </View>
        </GlowCard>

        {/* Zones */}
        <GlowCard glowColor={colors.gold}>
          <Text style={styles.sectionTitle}>ZONES</Text>
          {ZONES.map(z => (
            <View key={z.label} style={[styles.zoneRow, { borderLeftColor: z.color }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.zoneLabel, { color: z.color }]}>{z.label}</Text>
                <Text style={styles.zoneDesc}>{z.desc}</Text>
              </View>
              <Text style={styles.zoneRange}>{z.range}</Text>
            </View>
          ))}
        </GlowCard>

        {/* Alerts */}
        <GlowCard glowColor={colors.red} noPadding>
          <View style={styles.alertsHeader}>
            <PulsingDot color={colors.red} size={4} />
            <Text style={[styles.sectionTitle, { marginBottom: 0, color: colors.red }]}>THRESHOLD ALERTS</Text>
          </View>
          {alerts.map((a, i) => (
            <View key={i} style={styles.alertRow}>
              <View style={[styles.alertDot, { backgroundColor: a.up ? colors.green : colors.red }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertText}>{a.text}</Text>
                <Text style={styles.alertTime}>{a.time}</Text>
              </View>
              <Text style={[styles.alertScore, { color: a.up ? colors.green : colors.red }]}>{a.score}</Text>
            </View>
          ))}
        </GlowCard>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
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

  sectionTitle: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 14 },

  subscore: { marginBottom: 16 },
  subscoreTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subscoreLabel: { color: colors.textSub, fontSize: 13 },
  subscoreRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subscoreWeight: { color: colors.muted, fontSize: 10 },
  subscoreValue: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  barTrack: { height: 3, backgroundColor: colors.border, borderRadius: 2 },
  barFill: { height: 3, borderRadius: 2 },

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

  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  alertDot: { width: 6, height: 6, borderRadius: 3 },
  alertText: { color: colors.text, fontSize: 13 },
  alertTime: { color: colors.muted, fontSize: 10, marginTop: 2 },
  alertScore: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
