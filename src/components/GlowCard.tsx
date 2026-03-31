import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

interface Props {
  children: React.ReactNode;
  glowColor?: string;
  style?: ViewStyle;
  noPadding?: boolean;
}

export default function GlowCard({ children, glowColor = colors.green, style, noPadding }: Props) {
  return (
    <View style={[styles.outer, style]}>
      <LinearGradient
        colors={[glowColor + '08', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.glowTop}
      />
      <View style={[styles.inner, noPadding && { padding: 0 }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSolid,
    overflow: 'hidden',
    marginBottom: 10,
  },
  glowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  inner: {
    padding: 16,
  },
});
