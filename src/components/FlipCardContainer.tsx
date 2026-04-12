// ============================================
// THE WATCHER — Flip Card Container
// ============================================
// 3D card flip — front = USDC, back = USDT. Tap the flip button to rotate.

import { useCallback } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { superman, bizarro } from '../theme';

interface Props {
  front: React.ReactNode;
  back: React.ReactNode;
}

export default function FlipCardContainer({ front, back }: Props) {
  const progress = useSharedValue(0); // 0 = front, 1 = back

  const onFlip = useCallback(() => {
    const target = progress.value < 0.5 ? 1 : 0;
    progress.value = withTiming(target, {
      duration: 800,
      easing: Easing.inOut(Easing.cubic),
    });
  }, []);

  const frontStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, [0, 1], [0, 180]);
    return {
      transform: [
        { perspective: 1400 },
        { rotateY: `${rotate}deg` },
      ],
      opacity: progress.value < 0.5 ? 1 : 0,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, [0, 1], [180, 360]);
    return {
      transform: [
        { perspective: 1400 },
        { rotateY: `${rotate}deg` },
      ],
      opacity: progress.value < 0.5 ? 0 : 1,
    };
  });

  const buttonLabelStyle = useAnimatedStyle(() => ({
    opacity: progress.value < 0.5 ? 1 : 0,
  }));
  const buttonLabelBackStyle = useAnimatedStyle(() => ({
    opacity: progress.value < 0.5 ? 0 : 1,
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.face, frontStyle]} pointerEvents="box-none">
        {front}
      </Animated.View>
      <Animated.View style={[styles.face, backStyle]} pointerEvents="box-none">
        {back}
      </Animated.View>

      {/* Flip button */}
      <Pressable style={styles.flipButton} onPress={onFlip} hitSlop={16}>
        <View style={styles.flipInner}>
          <Animated.Text style={[styles.flipLabel, { color: superman.primary }, buttonLabelStyle]}>
            FLIP → USDT
          </Animated.Text>
          <Animated.Text
            style={[
              styles.flipLabel,
              { color: bizarro.primary, position: 'absolute' },
              buttonLabelBackStyle,
            ]}
          >
            FLIP → USDC
          </Animated.Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  face: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
  },
  flipButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(10,16,36,0.85)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  flipInner: {
    minWidth: 120,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
