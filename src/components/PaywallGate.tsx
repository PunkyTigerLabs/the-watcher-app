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
      <View style={styles.previewSection}>
        {children}
      </View>

      <View style={styles.fadeOverlay}>
        <LinearGradient
          colors={['transparent', 'rgba(6,9,15,0.6)', 'rgba(6,9,15,1)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradientOverlay}
        />
      </View>

      <LinearGradient
        colors={['rgba(6,9,15,0)', 'rgba(6,9,15,0.4)', 'rgba(6,9,15,0.95)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.sideGradient}
      />

      <View style={styles.lockContainer}>
        <View style={styles.lockIcon}>
          <Text style={styles.lockEmoji}>⟐</Text>
        </View>
        <Text style={styles.title}>PRO INTELLIGENCE</Text>
        <Text style={styles.subtitle}>Unlock {feature} with The Watcher PRO</Text>
        <TouchableOpacity style={styles.button} activeOpacity={0.8}>
          <Text style={styles.buttonText}>UPGRADE — $30/mo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  previewSection: {
    opacity: 0.2,
    maxHeight: '20%',
    overflow: 'hidden',
  },
  fadeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sideGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  lockContainer: {
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.green + '08',
    borderWidth: 1,
    borderColor: colors.green + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockEmoji: {
    fontSize: 28,
    color: colors.green,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSub,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.green + '15',
    borderWidth: 1.5,
    borderColor: colors.green + '60',
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  buttonText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
