import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../theme';

interface Props { score: number; label: string; }

const SIZE = 220, CX = SIZE / 2, CY = SIZE / 2 + 10, R = 80;
const START = -210, END = 30, TOTAL = END - START;

function polar(deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
}
function arc(a: number, b: number) {
  const s = polar(a), e = polar(b), lg = Math.abs(b - a) > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${R} ${R} 0 ${lg} 1 ${e.x} ${e.y}`;
}

export default function SignalArc({ score, label }: Props) {
  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animated, { toValue: score, duration: 1200, useNativeDriver: false }).start();
  }, [score]);

  const pct = (score + 100) / 200;
  const filledDeg = TOTAL * pct;
  const needle = polar(START + filledDeg);
  const scoreColor = score > 30 ? colors.green : score < -30 ? colors.red : colors.gold;

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE - 40}>
        <Path d={arc(START, END)} fill="none" stroke={colors.border} strokeWidth={8} strokeLinecap="round" />
        <Path d={arc(START, START + filledDeg)} fill="none" stroke={scoreColor} strokeWidth={8} strokeLinecap="round" />
        <Circle cx={needle.x} cy={needle.y} r={6} fill={scoreColor} />
      </Svg>
      <View style={styles.overlay}>
        <Text style={[styles.score, { color: scoreColor }]}>{score > 0 ? '+' : ''}{score}</Text>
        <Text style={[styles.label, { color: scoreColor }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  overlay: { alignItems: 'center', marginTop: -50 },
  score: { fontSize: 54, fontWeight: '800', letterSpacing: -2 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 2 },
});
