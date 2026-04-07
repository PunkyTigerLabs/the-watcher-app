// ============================================
// THE WATCHER — Status Badge (LIVE / DELAYED / DEMO)
// ============================================

import { View, Text, StyleSheet } from 'react-native';
import PulsingDot from './PulsingDot';
import { colors } from '../theme';

type Status = 'LIVE' | 'DELAYED' | 'DEMO';

interface Props {
  status: Status;
}

const STATUS_CONFIG: Record<Status, { color: string; label: string }> = {
  LIVE: { color: colors.green, label: 'LIVE' },
  DELAYED: { color: colors.gold, label: 'DELAYED' },
  DEMO: { color: colors.muted, label: 'DEMO' },
};

export default function StatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.color + '18', borderColor: config.color + '40' }]}>
      {status === 'LIVE' && <PulsingDot color={config.color} size={4} />}
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 0.5,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
