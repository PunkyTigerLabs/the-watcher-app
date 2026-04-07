// ============================================
// THE WATCHER — Loading & Error States
// ============================================

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors } from '../theme';

// ---- Loading Skeleton ----
export function LoadingState({ message = 'Scanning flows...' }: { message?: string }) {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={styles.center}>
      <Animated.View style={[styles.loadingRing, { opacity: pulse }]} />
      <Text style={styles.loadingIcon}>◇</Text>
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

// ---- Error State ----
export function ErrorState({
  message = 'Something went wrong',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorIcon}>⚠</Text>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.7}>
          <Text style={styles.retryText}>TAP TO RETRY</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ---- Empty State ----
export function EmptyState({ message = 'No data yet' }: { message?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyIcon}>◎</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  loadingRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: colors.green + '40',
    marginBottom: 16,
  },
  loadingIcon: {
    position: 'absolute',
    top: 76,
    fontSize: 18,
    color: colors.green,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '600',
    marginTop: 8,
  },
  errorIcon: {
    fontSize: 28,
    color: colors.red,
    marginBottom: 12,
  },
  errorText: {
    color: colors.textSub,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: colors.green + '40',
    backgroundColor: colors.green + '10',
  },
  retryText: {
    color: colors.green,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  emptyIcon: {
    fontSize: 28,
    color: colors.muted,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
