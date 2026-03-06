import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#001D4A',
        tabBarInactiveTintColor: '#AAB',
        headerShown: false,
        tabBarStyle: { height: 60, paddingBottom: 10, paddingTop: 10 }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="action_plans"
        options={{
          title: 'خطط العمل',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="stats-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ideas"
        options={{
          title: 'الأفكار',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="bulb" color={color} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'الأخبار',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="newspaper" color={color} />,
        }}
      />
    </Tabs>
  );
}
