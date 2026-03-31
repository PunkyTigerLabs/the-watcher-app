import { useEffect, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import PulsingDot from '../../src/components/PulsingDot';
import GlowCard from '../../src/components/GlowCard';
import { colors, gradients } from '../../src/theme';
import { whaleWallets } from '../../src/data/mockData';

const fmt = (n: number) => n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : `$${(n/1e6).toFixed(0)}M`;

const TYPE_COLORS: Record<string, string> = {
  CEX: colors.cyan,
  Institutional: colors.gold,
  DeFi: '#A78BFA',
  Unknown: colors.muted,
};

function WhaleRow({ w, index }: { w: typeof whaleWallets[0]; index: number }) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideIn = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slideIn, { toValue: 0, duration: 400, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const isUp = w.change >= 0;

  return (
    <Animated.View style={[styles.row, { opacity: fadeIn, transform: [{ translateY: slideIn }] }]}>
      <View style={[styles.typeLine, { backgroundColor: TYPE_COLORS[w.type] }]} />
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.whaleName}>{w.name}</Text>
            <Text style={styles.address}>{w.address}</Text>
          </View>
          <View style={[styles.changeBadge, { backgroundColor: (isUp ? colors.green : colors.red) + '12' }]}>
            <Text style={[styles.changeText, { color: isUp ? colors.green : colors.red }]}>
              {isUp ? '▲' : '▼'} {Math.abs(w.change)}%
            </Text>
          </View>
        </View>

        <View style={styles.rowBottom}>
          <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[w.type] + '10', borderColor: TYPE_COLORS[w.type] + '30' }]}>
            <Text style={[styles.typeText, { color: TYPE_COLORS[w.type] }]}>{w.type}</Text>
          </View>
          <Text style={styles.action} numberOfLines={1}>{w.action}</Text>
          <Text style={styles.volume}>{fmt(w.volume)}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function Whales() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <PulsingDot color={colors.gold} size={6} />
            <Text style={styles.title}>Whale Tracker</Text>
          </View>
          <Text style={styles.sub}>847 wallets monitored</Text>
        </View>

        {/* Summary stat */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL TRACKED</Text>
            <Text style={styles.summaryValue}>$8.4B</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>24H MOVES</Text>
            <Text style={[styles.summaryValue, { color: colors.green }]}>147</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>ALERT LEVEL</Text>
            <Text style={[styles.summaryValue, { color: colors.gold }]}>HIGH</Text>
          </View>
        </View>

        <View style={styles.list}>
          {whaleWallets.map((w, i) => (
            <WhaleRow key={w.name} w={w} index={i} />
          ))}
        </View>

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

  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surfaceSolid,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 12,
    alignItems: 'center',
  },
  summaryLabel: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  summaryValue: { color: colors.text, fontSize: 16, fontWeight: '700' },

  list: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSolid,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  typeLine: { width: 3 },
  rowContent: { flex: 1, padding: 14 },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  whaleName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  address: { color: colors.muted, fontSize: 10, fontVariant: ['tabular-nums'], marginTop: 2 },
  changeBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changeText: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: { borderWidth: 0.5, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  typeText: { fontSize: 9, fontWeight: '700' },
  action: { color: colors.textSub, fontSize: 11, flex: 1 },
  volume: { color: colors.text, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
