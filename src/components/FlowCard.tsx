import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, CHAIN_COLORS } from '../theme';

const fmt = (n: number) => n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : `$${(n/1e6).toFixed(0)}M`;

const TYPE_COLORS: Record<string, string> = {
  CEX: colors.cyan,
  Institutional: colors.gold,
  DeFi: '#A78BFA',
  Unknown: colors.muted,
};

interface Props {
  name: string;
  type: string;
  chain: string;
  amount: number;
  timeAgo: string;
  direction: 'in' | 'out';
  isNew?: boolean;
}

export default function FlowCard({ name, type, chain, amount, timeAgo, direction, isNew }: Props) {
  const flash = useRef(new Animated.Value(isNew ? 0.15 : 0)).current;

  useEffect(() => {
    if (isNew) {
      Animated.sequence([
        Animated.timing(flash, { toValue: 0.15, duration: 0, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ]).start();
    }
  }, [isNew]);

  const dirColor = direction === 'in' ? colors.green : colors.red;

  return (
    <View style={styles.row}>
      <Animated.View
        style={[
          styles.flashOverlay,
          { backgroundColor: dirColor, opacity: flash },
        ]}
      />

      {/* Direction indicator line */}
      <View style={[styles.dirLine, { backgroundColor: dirColor }]} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: TYPE_COLORS[type] + '12', borderColor: TYPE_COLORS[type] + '30' }]}>
                <Text style={[styles.badgeText, { color: TYPE_COLORS[type] }]}>{type}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: CHAIN_COLORS[chain] + '12', borderColor: CHAIN_COLORS[chain] + '30' }]}>
                <Text style={[styles.badgeText, { color: CHAIN_COLORS[chain] }]}>{chain}</Text>
              </View>
            </View>
          </View>
          <View style={styles.amountCol}>
            <Text style={[styles.amount, { color: dirColor }]}>
              {direction === 'in' ? '+' : '-'}{fmt(amount)}
            </Text>
            <Text style={styles.time}>{timeAgo}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  dirLine: {
    width: 2.5,
    borderRadius: 1,
    marginVertical: 10,
  },
  content: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameRow: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  badges: { flexDirection: 'row', gap: 5 },
  badge: {
    borderWidth: 0.5,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  amountCol: { alignItems: 'flex-end' },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  time: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
});
