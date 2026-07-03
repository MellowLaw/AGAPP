import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
import { VerifyIdentityScreen } from '../screens/VerifyIdentityScreen';
import { GuestLguDetectScreen } from '../screens/GuestLguDetectScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * AuthGate — shown on submit-style tabs when the user is browsing without
 * an account. Lets guests explore Home/News/Map while nudging them to sign
 * in for any action that requires identity.
 */
function AuthGate({ label, navigation }: { label: string; navigation: any }) {
  const { T } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: T.cardAlt, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
        <Ionicons name="lock-closed-outline" size={28} color={T.textMuted} />
      </View>
      <Text style={{ color: T.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 6 }}>
        Sign in to {label}
      </Text>
      <Text style={{ color: T.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
        You can browse Home, News, and the Map without an account. Sign in to submit reports, apply for services, or post in the forum.
      </Text>
      <TouchableOpacity
        style={{ height: 52, borderRadius: 16, backgroundColor: T.text, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center' }}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={{ color: T.bg, fontWeight: '700' }}>Sign in / Create account</Text>
      </TouchableOpacity>
    </View>
  );
}

function MainTabNavigator() {
  const { T } = useTheme();
  const { session } = useAuth();

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
        // Deliberately NOT tabBarHideOnKeyboard: true — a hiding/reappearing tab
        // bar fights with screens that manage their own KeyboardAvoidingView
        // (Chatbot, Reports). When the keyboard dismisses after the chat content
        // grows (Quick Suggestions row appears after the first message), the
        // bar's reappear animation and the screen's reflow fall out of sync and
        // the input sinks behind the bar. Keeping the bar's height constant
        // removes that race entirely; each screen already handles the keyboard
        // itself.
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
      <Tab.Screen name="ServicesTab" options={{ title: 'Services' }}>
        {({ navigation }) => session
          ? <ServicesScreen navigation={navigation} />
          : <AuthGate label="apply for government services" navigation={navigation} />}
      </Tab.Screen>
      <Tab.Screen name="MapTab" component={MapExplorerScreen} options={{ title: 'Explore' }} />
      <Tab.Screen name="ReportsTab" options={{ title: 'Report' }}>
        {({ navigation }) => session
          ? <ReportsScreen navigation={navigation} />
          : <AuthGate label="submit reports" navigation={navigation} />}
      </Tab.Screen>
      <Tab.Screen name="ChatbotTab" options={{ title: 'Assistant' }}>
        {({ navigation }) => session
          ? <ChatbotScreen />
          : <AuthGate label="use the assistant" navigation={navigation} />}
      </Tab.Screen>
      <Tab.Screen name="Forum" options={{ title: 'Forum' }}>
        {({ navigation }) => session
          ? <ForumScreen navigation={navigation} />
          : <AuthGate label="join the community forum" navigation={navigation} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={{ title: 'Profile' }}>
        {({ navigation }) => session
          ? <ProfileScreen navigation={navigation} />
          : <AuthGate label="manage a profile" navigation={navigation} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { session, selectedLgu, guestLgu, hasCompletedGuestLguChoice, isLoading } = useAuth();
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
          <>
            {/* Guest browsing — main tabs are reachable; gated tabs show AuthGate */}
            {!hasCompletedGuestLguChoice ? (
              <Stack.Screen name="GuestLguDetect" component={GuestLguDetectScreen} />
            ) : null}
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="LguSelect" component={LguSelectScreen} />
            <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
          </>
        ) : !selectedLgu ? (
          <Stack.Screen name="LguSelect" component={LguSelectScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="VerifyIdentity" component={VerifyIdentityScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="TrackingDetail" component={TrackingDetailScreen} />
            <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
