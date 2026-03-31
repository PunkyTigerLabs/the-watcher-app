import { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface TickerItem {
  label: string;
  value: string;
  change?: number;
}

interface Props {
  items: TickerItem[];
  speed?: number;
}

export default function TickerRibbon({ items, speed = 40000 }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: -1000,
        duration: speed,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const doubled = [...items, ...items];

  return (
    <View style={styles.container}>
      <View style={styles.fadeLeft} />
      <Animated.View style={[styles.ribbon, { transform: [{ translateX }] }]}>
        {doubled.map((item, i) => (
          <View key={i} style={styles.item}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
            {item.change !== undefined && (
              <Text style={[styles.change, { color: item.change >= 0 ? colors.green : colors.red }]}>
                {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(1)}%
              </Text>
            )}
            <Text style={styles.separator}>│</Text>
          </View>
        ))}
      </Animated.View>
      <View style={styles.fadeRight} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,200,150,0.03)',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(0,200,150,0.12)',
  },
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  value: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  change: {
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  separator: {
    color: colors.muted,
    opacity: 0.3,
    fontSize: 10,
  },
  fadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 30,
    zIndex: 2,
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 30,
    zIndex: 2,
  },
});
