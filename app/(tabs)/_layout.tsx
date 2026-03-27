import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../src/theme';

function TabIcon({ focused, color, children }: { focused: boolean; color: string; children: React.ReactNode }) {
  return (
    <View style={[styles.icon, focused && styles.iconActive]}>
      {children}
    </View>
  );
}

// Simple text icons since we don't have vector icons set up
function Icon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <View style={[styles.dot, focused && styles.dotActive]} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.5,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'DASHBOARD', tabBarIcon: ({ focused }) => <TabDot focused={focused} char="◈" /> }} />
      <Tabs.Screen name="mints" options={{ title: 'MINTS', tabBarIcon: ({ focused }) => <TabDot focused={focused} char="⚡" /> }} />
      <Tabs.Screen name="whales" options={{ title: 'WHALES', tabBarIcon: ({ focused }) => <TabDot focused={focused} char="◎" /> }} />
      <Tabs.Screen name="rwa" options={{ title: 'RWA', tabBarIcon: ({ focused }) => <TabDot focused={focused} char="▣" /> }} />
      <Tabs.Screen name="signal" options={{ title: 'SIGNAL', tabBarIcon: ({ focused }) => <TabDot focused={focused} char="◉" /> }} />
    </Tabs>
  );
}

function TabDot({ focused, char }: { focused: boolean; char: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 16, color: focused ? colors.green : colors.muted }}>{char}</Text>;
}

const styles = StyleSheet.create({
  iconWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  iconWrapActive: { backgroundColor: colors.greenDim },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.muted },
  dotActive: { backgroundColor: colors.green },
  icon: { padding: 4, borderRadius: 8 },
  iconActive: { backgroundColor: colors.greenDim },
});
