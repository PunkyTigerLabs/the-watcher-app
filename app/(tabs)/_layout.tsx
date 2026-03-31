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
      <Tabs.Screen name="index" options={{ title: 'OVERVIEW', tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="⬡" /> }} />
      <Tabs.Screen name="mints" options={{ title: 'MINTS', tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="◇" /> }} />
      <Tabs.Screen name="whales" options={{ title: 'WHALES', tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="◎" /> }} />
      <Tabs.Screen name="rwa" options={{ title: 'RWA', tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="▣" /> }} />
      <Tabs.Screen name="signal" options={{ title: 'SIGNAL', tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="◉" /> }} />
    </Tabs>
  );
}

function TabIcon({ focused, icon }: { focused: boolean; icon: string }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconActive]}>
      <Text style={[styles.iconText, focused && styles.iconTextActive]}>{icon}</Text>
      {focused && <View style={styles.activeDot} />}
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
  iconActive: {
    backgroundColor: colors.greenDim,
  },
  iconText: {
    fontSize: 18,
    color: colors.muted,
  },
  iconTextActive: {
    color: colors.green,
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
