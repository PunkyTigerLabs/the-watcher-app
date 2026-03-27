import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignalArc from '../../src/components/SignalArc';
import FlowCard from '../../src/components/FlowCard';
import { colors } from '../../src/theme';
import { currentSignal, aiNarrative, topInflows, topOutflows, stats } from '../../src/data/mockData';

const fmt = (n: number) => n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : `$${(n/1e6).toFixed(0)}M`;

export default function Dashboard() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.liveDot} />
            <Text style={styles.logo}>WATCHER</Text>
          </View>
          <Text style={styles.subhead}>Capital Flow Intelligence</Text>
        </View>

        {/* Signal Arc Hero */}
        <LinearGradient
          colors={['#0D1117', '#080B12']}
          style={styles.heroCard}
        >
          <SignalArc score={currentSignal.score} label={currentSignal.label} />
          <Text style={styles.updatedText}>Updated {currentSignal.updatedAgo}</Text>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'VOLUME 24H', value: fmt(stats.totalVolume) },
            { label: 'USDC NET', value: `+${fmt(stats.usdcNet)}`, green: true },
            { label: 'TOP FLOW', value: fmt(stats.largestFlow) },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={[styles.statValue, s.green && { color: colors.green }]}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* AI Narrative */}
        <View style={styles.narrativeCard}>
          <View style={styles.narrativeHeader}>
            <View style={styles.liveDot} />
            <Text style={styles.sectionTitle}>AI FLOW ANALYST</Text>
            <Text style={styles.updatedSmall}>{currentSignal.updatedAgo}</Text>
          </View>
          <Text style={styles.narrativeText}>{aiNarrative}</Text>
        </View>

        {/* Inflows */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.arrow, { color: colors.green }]}>▲</Text>
            <Text style={styles.sectionTitle}>TOP INFLOWS</Text>
          </View>
          {topInflows.map(f => (
            <FlowCard key={f.name} {...f} direction="in" />
          ))}
        </View>

        {/* Outflows */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.arrow, { color: colors.red }]}>▼</Text>
            <Text style={styles.sectionTitle}>TOP OUTFLOWS</Text>
          </View>
          {topOutflows.map(f => (
            <FlowCard key={f.name} {...f} direction="out" />
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  logo: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: 3 },
  subhead: { color: colors.muted, fontSize: 12, letterSpacing: 0.5 },

  heroCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  updatedText: { color: colors.muted, fontSize: 11, marginTop: 4, letterSpacing: 0.5 },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  statLabel: { color: colors.muted, fontSize: 9, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  statValue: { color: colors.text, fontSize: 14, fontWeight: '700', letterSpacing: -0.5 },

  narrativeCard: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  narrativeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  narrativeText: {
    color: colors.textSub,
    fontSize: 13,
    lineHeight: 21,
    fontFamily: 'monospace',
  },
  updatedSmall: { color: colors.muted, fontSize: 11, marginLeft: 'auto' },

  section: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12 },
  sectionTitle: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  arrow: { fontSize: 11, fontWeight: '700' },
});
