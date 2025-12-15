import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

const COLORS = {
  active: "#212b49",      
  inactive: "#9ca3af",    
  barBg: "#ffffff",
  shadow: "#5960a0",
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        
        
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,          
          left: 20,
          right: 20,
          elevation: 5,
          backgroundColor: COLORS.barBg,
          borderRadius: 20,
          height: 70,           
          borderTopWidth: 0,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.15,
          shadowRadius: 5,
          
          paddingBottom: Platform.OS === 'ios' ? 20 : 12, 
          paddingTop: 5,
        },
        
        tabBarButton: HapticTab,
        tabBarShowLabel: true, 
        
        // Yazı Stili
        tabBarLabelStyle: {
          fontSize: 18,
          fontWeight: '700',
          marginTop: -5,     
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Zamanlayıcı',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
                size={28} 
                name={focused ? "timer" : "timer"} 
                color={color} 
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Raporlar',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
                size={28} 
                name={focused ? "chart.pie.fill" : "chart.pie"} 
                color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}