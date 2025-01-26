import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#fff' : '#000';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: iconColor,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="spam-call"
        options={{
          title: 'Call',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="phone-disabled" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vkyc"
        options={{
          title: 'VKYC',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="videocam" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="spam-report"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="assessment" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sha256"
        options={{
          title: 'Verify',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="enhanced-encryption" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
