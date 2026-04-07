// ============================================
// THE WATCHER — Paywall Gate
// ============================================
// Blurs PRO content for free users

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';
import { isPro } from '../api/watcher';

interface Props {
  children: React.ReactNode;
  feature?: string;
}

export default function PaywallGate({ children, feature = 'this feature' }: Props) {
  if (isPro()) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.blurredContent}>
        {children}
      </View>
      <LinearGradient
        colors={['rgba(6,9,15,0.5)', 'rgba(6,9,15,0.95)', 'rgba(6,9,15,1)']}
        style={styles.overlay}
      >
        <View style={styles.lockIcon}>
          <Text style={styles.lockEmoji}>⟐</Text>
        </View>
        <Text style={styles.title}>PRO INTELLIGENCE</Text>
        <Text style={styles.subtitle}>Unlock {feature} with The Watcher PRO</Text>
        <TouchableOpacity style={styles.button} activeOpacity={0.8}>
          <Text style={styles.buttonText}>UPGRADE — $30/mo</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  blurredContent: {
    opacity: 0.15,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  lockIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.green + '15',
    borderWidth: 0.5,
    borderColor: colors.green + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockEmoji: {
    fontSize: 22,
    color: colors.green,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textSub,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.green + '20',
    borderWidth: 1,
    borderColor: colors.green + '50',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  buttonText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
