import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Shadows } from '../theme';
import type { RootTabParamList } from '../types';

import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import WritingScreen from '../screens/WritingScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import GradesScreen from '../screens/GradesScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: {
  name: keyof RootTabParamList;
  icon: IoniconsName;
  activeIcon: IoniconsName;
  label: string;
}[] = [
  { name: 'Home',     icon: 'home-outline',         activeIcon: 'home',           label: 'Home'     },
  { name: 'Chat',     icon: 'chatbubble-outline',   activeIcon: 'chatbubble',     label: 'Chat'     },
  { name: 'Schedule', icon: 'calendar-outline',     activeIcon: 'calendar',       label: 'Schedule' },
  { name: 'Grades',   icon: 'stats-chart-outline',  activeIcon: 'stats-chart',    label: 'Grades'   },
  { name: 'Write',    icon: 'create-outline',       activeIcon: 'create',         label: 'Write'    },
];

const SCREEN_COMPONENTS = {
  Home:     HomeScreen,
  Chat:     ChatScreen,
  Schedule: ScheduleScreen,
  Grades:   GradesScreen,
  Write:    WritingScreen,
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const config = TAB_CONFIG.find((t) => t.name === route.name)!;
        return {
          headerShown: false,
          tabBarActiveTintColor: Colors.tabActive,
          tabBarInactiveTintColor: Colors.tabInactive,
          tabBarStyle: {
            backgroundColor: Colors.tabBackground,
            borderTopColor: 'rgba(0,0,0,0.06)',
            borderTopWidth: 1,
            paddingTop: Platform.OS === 'ios' ? 6 : 4,
            paddingBottom: Platform.OS === 'ios' ? 0 : 6,
            height: Platform.OS === 'ios' ? 82 : 62,
            ...Shadows.tab,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600' as const,
            letterSpacing: 0.2,
            marginTop: 2,
          },
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? config.activeIcon : config.icon}
              size={size}
              color={color}
            />
          ),
          tabBarLabel: config.label,
        };
      }}
    >
      {TAB_CONFIG.map(({ name }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={SCREEN_COMPONENTS[name]}
        />
      ))}
    </Tab.Navigator>
  );
}
