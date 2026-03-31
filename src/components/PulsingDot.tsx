import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Props {
  color?: string;
  size?: number;
}

export default function PulsingDot({ color = colors.green, size = 8 }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.8, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glow, { toValue: 0, duration: 1200, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={{ width: size * 3, height: size * 3, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size * 2.5,
          height: size * 2.5,
          borderRadius: size * 1.25,
          backgroundColor: color,
          opacity: glow,
          transform: [{ scale: pulse }],
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
