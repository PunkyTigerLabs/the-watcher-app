// ============================================
// THE WATCHER — Tab Navigation
// ============================================
// 4 Tabs: USDC | USDT | SIGNAL | INTEL

import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 78,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          letterSpacing: 1,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'FLOWS',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="◈" activeColor={colors.cyan} />
          ),
          tabBarActiveTintColor: colors.cyan,
        }}
      />
      <Tabs.Screen
        name="signal"
        options={{
          title: 'SIGNAL',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="◉" activeColor={colors.green} />
          ),
        }}
      />
      <Tabs.Screen
        name="intel"
        options={{
          title: 'INTEL',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="⟐" activeColor={colors.cyan} />
          ),
          tabBarActiveTintColor: colors.cyan,
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  focused,
  icon,
  activeColor = colors.green,
}: {
  focused: boolean;
  icon: string;
  activeColor?: string;
}) {
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: activeColor + '15' }]}>
      <Text style={[styles.iconText, focused && { color: activeColor }]}>{icon}</Text>
      {focused && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  iconText: {
    fontSize: 18,
    color: colors.muted,
  },
  activeDot: {
    position: 'absolute',
    bottom: -2,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.green,
  },
});
