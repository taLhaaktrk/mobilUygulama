import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      {/* ZAMANLAYICI EKRANI */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Zamanlayıcı',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="timer" color={color} />
          ),
        }}
      />

      {/* RAPORLAR EKRANI */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Raporlar',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.pie.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
