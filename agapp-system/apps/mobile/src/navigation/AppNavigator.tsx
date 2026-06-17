import React from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ACCENT } from '../theme';
import { LoginScreen } from '../screens/LoginScreen';
import { LguSelectScreen } from '../screens/LguSelectScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ServicesScreen } from '../screens/ServicesScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { ChatbotScreen } from '../screens/ChatbotScreen';
import { ForumScreen } from '../screens/ForumScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { TrackingDetailScreen } from '../screens/TrackingDetailScreen';
import { NewsDetailScreen } from '../screens/NewsDetailScreen';
import { MapExplorerScreen } from '../screens/MapExplorerScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  const { T } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: T.textMuted,
        tabBarStyle: {
          backgroundColor: T.card,
          borderTopColor: T.border,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'ServicesTab') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'MapTab') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'ReportsTab') iconName = focused ? 'camera' : 'camera-outline';
          else if (route.name === 'ChatbotTab') iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          else if (route.name === 'Forum') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="ServicesTab" component={ServicesScreen} options={{ title: 'Services' }} />
      <Tab.Screen name="MapTab" component={MapExplorerScreen} options={{ title: 'Explore' }} />
      <Tab.Screen name="ReportsTab" component={ReportsScreen} options={{ title: 'Report' }} />
      <Tab.Screen name="ChatbotTab" component={ChatbotScreen} options={{ title: 'Assistant' }} />
      <Tab.Screen name="Forum" component={ForumScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { session, selectedLgu, isLoading } = useAuth();
  const { T } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: T.textMuted }}>Loading AGAPP...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !selectedLgu ? (
          <Stack.Screen name="LguSelect" component={LguSelectScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="TrackingDetail" component={TrackingDetailScreen} />
            <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
