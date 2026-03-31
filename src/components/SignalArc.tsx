import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

interface Props { score: number; label: string; }

const SIZE = 240, CX = SIZE / 2, CY = SIZE / 2 + 10, R = 85;
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
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const pct = (score + 100) / 200;
  const filledDeg = TOTAL * pct;
  const needle = polar(START + filledDeg);
  const scoreColor = score > 30 ? colors.green : score < -30 ? colors.red : colors.gold;
  const glowColor = score > 30 ? colors.greenBright : score < -30 ? colors.red : colors.gold;

  return (
    <View style={styles.wrap}>
      {/* Background glow */}
      <Animated.View style={[styles.bgGlow, { backgroundColor: scoreColor, opacity: pulseAnim }]} />

      <Svg width={SIZE} height={SIZE - 40}>
        <Defs>
          <RadialGradient id="needleGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={glowColor} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={glowColor} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Track background with subtle glow */}
        <Path d={arc(START, END)} fill="none" stroke={colors.border} strokeWidth={6} strokeLinecap="round" />

        {/* Filled arc */}
        <Path d={arc(START, START + filledDeg)} fill="none" stroke={scoreColor} strokeWidth={6} strokeLinecap="round" />

        {/* Needle glow */}
        <Circle cx={needle.x} cy={needle.y} r={20} fill="url(#needleGlow)" />

        {/* Needle dot */}
        <Circle cx={needle.x} cy={needle.y} r={5} fill={glowColor} />
        <Circle cx={needle.x} cy={needle.y} r={8} fill="none" stroke={glowColor} strokeWidth={1} strokeOpacity={0.4} />
      </Svg>

      <View style={styles.overlay}>
        <Text style={[styles.score, { color: scoreColor }]}>{score > 0 ? '+' : ''}{score}</Text>
        <View style={[styles.labelBadge, { backgroundColor: scoreColor + '15', borderColor: scoreColor + '30' }]}>
          <Text style={[styles.label, { color: scoreColor }]}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  bgGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: 30,
  },
  overlay: { alignItems: 'center', marginTop: -55 },
  score: { fontSize: 56, fontWeight: '800', letterSpacing: -3 },
  labelBadge: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
});
