import { View, Text, StyleSheet } from 'react-native';
import { colors, CHAIN_COLORS } from '../theme';

const fmt = (n: number) => n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : `$${(n/1e6).toFixed(0)}M`;

const TYPE_COLORS: Record<string, string> = {
  CEX: colors.green,
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
}

export default function FlowCard({ name, type, chain, amount, timeAgo, direction }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { borderColor: TYPE_COLORS[type] + '50', backgroundColor: TYPE_COLORS[type] + '15' }]}>
            <Text style={[styles.badgeText, { color: TYPE_COLORS[type] }]}>{type}</Text>
          </View>
          <View style={[styles.badge, { borderColor: CHAIN_COLORS[chain] + '50', backgroundColor: CHAIN_COLORS[chain] + '15' }]}>
            <Text style={[styles.badgeText, { color: CHAIN_COLORS[chain] }]}>{chain}</Text>
          </View>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
      </View>
      <Text style={[styles.amount, { color: direction === 'in' ? colors.green : colors.red }]}>
        {direction === 'in' ? '+' : '-'}{fmt(amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: { flex: 1, marginRight: 12 },
  name: { color: colors.text, fontSize: 14, fontWeight: '500', marginBottom: 4 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  badge: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  time: { color: colors.muted, fontSize: 11 },
  amount: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
