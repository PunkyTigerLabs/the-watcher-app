// ============================================
// THE WATCHER — Paywall Gate
// ============================================
// Blurs PRO content for free users

import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
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

  const onUpgrade = () => {
    Alert.alert(
      'The Watcher PRO',
      'In-app subscriptions are coming soon. For early access, email contacto@walzustore.com.',
      [{ text: 'Got it', style: 'default' }],
    );
  };

  return (
    <Pressable onPress={onUpgrade} style={styles.card}>
      <View style={styles.iconRow}>
        <Text style={styles.iconGlyph}>⟐</Text>
        <Text style={styles.proTag}>PRO</Text>
      </View>
      <Text style={styles.title}>Unlock {feature}</Text>
      <Text style={styles.subtitle}>
        Advanced pattern detection, whale tracking and AI analyst — available with The Watcher PRO.
      </Text>
      <View style={styles.cta}>
        <Text style={styles.ctaText}>REQUEST EARLY ACCESS</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.green + '30',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  iconGlyph: {
    fontSize: 18,
    color: colors.green,
  },
  proTag: {
    color: colors.green,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    backgroundColor: colors.green + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textSub,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.green + '10',
    borderWidth: 1,
    borderColor: colors.green + '50',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  ctaText: {
    color: colors.green,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
