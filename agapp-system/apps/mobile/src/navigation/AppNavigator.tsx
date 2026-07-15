import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Home, Briefcase, TrendUp, Messages, User } from 'iconsax-react-native';

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
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SplashGreetingScreen } from '../screens/SplashGreetingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

/**
 * FloatingTabBar — detached pill-shaped bar with a sliding accent indicator.
 * The indicator is one Animated.View behind the tab items; its translateX
 * springs to the focused tab's slot on every state change. Slot math needs
 * the bar's measured inner width (onLayout), so the pill can't be laid out
 * until after first paint — the Animated.Value starts pre-set to the
 * initial index's slot (computed from route count) to avoid a mount jump.
 */
function FloatingTabBar({ state, descriptors, navigation }: any) {
  const { T } = useTheme();
  const insets = useSafeAreaInsets();
  const routeCount = state.routes.length;

  const [innerWidth, setInnerWidth] = React.useState(0);
  const slotWidth = innerWidth / routeCount;
  const translateX = React.useRef(new Animated.Value(state.index * slotWidth)).current;

  React.useEffect(() => {
    if (!innerWidth) return; // no layout yet — avoid animating from 0
    Animated.spring(translateX, {
      toValue: state.index * slotWidth,
      useNativeDriver: true,
      friction: 10,
      tension: 90,
    }).start();
  }, [state.index, innerWidth, slotWidth, translateX]);

  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: insets.bottom + 10,
        height: 68,
        borderRadius: 999,
        backgroundColor: T.card,
        borderWidth: 1,
        borderColor: T.border,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: 'rgba(41,41,41,0.10)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 8,
      }}
      onLayout={(e) => setInnerWidth(e.nativeEvent.layout.width)}
    >
      {innerWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 4,
            width: slotWidth - 8,
            height: 52,
            borderRadius: 999,
            backgroundColor: T.accentSoft,
            transform: [{ translateX }],
          }}
        />
      )}

      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Resolve icon
        let IconComponent = Home;
        if (route.name === 'Home') IconComponent = Home;
        else if (route.name === 'ServicesTab') IconComponent = Briefcase;
        else if (route.name === 'ReportsTab') IconComponent = TrendUp;
        else if (route.name === 'Forum') IconComponent = Messages;
        else if (route.name === 'Profile') IconComponent = User;

        const ROUTE_LABELS: Record<string, string> = {
          Home:        'Home',
          ServicesTab: 'Services',
          ReportsTab:  'Reports',
          Forum:       'Forum',
          Profile:     'Profile',
        };
        const displayLabel = ROUTE_LABELS[route.name] ?? route.name;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <IconComponent size={26} color={isFocused ? '#292929' : T.textMuted} variant="Bold" />
            <Text style={{
              fontFamily: 'Inter-Medium',
              fontSize: 10,
              color: isFocused ? '#292929' : T.textMuted,
              lineHeight: 12,
            }}>
              {displayLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabNavigator() {
  const { session } = useAuth();

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="ServicesTab" options={{ title: 'Services' }}>
        {({ navigation }) => session
          ? <ServicesScreen navigation={navigation} />
          : <AuthGate label="apply for government services" navigation={navigation} />}
      </Tab.Screen>
      <Tab.Screen name="ReportsTab" options={{ title: 'Report' }}>
        {({ navigation }) => session
          ? <ReportsScreen navigation={navigation} />
          : <AuthGate label="submit reports" navigation={navigation} />}
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

  const [onboardingLoaded, setOnboardingLoaded] = React.useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = React.useState(false);
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const val = await AsyncStorage.getItem('hasSeenOnboarding');
        if (val === 'true') {
          setHasSeenOnboarding(true);
          // Show splash briefly for returning users
          setTimeout(() => {
            setShowSplash(false);
          }, 1200);
        } else {
          setHasSeenOnboarding(false);
          setShowSplash(false);
        }
      } catch {
        setHasSeenOnboarding(true);
        setShowSplash(false);
      } finally {
        setOnboardingLoaded(true);
      }
    };
    checkOnboarding();
  }, []);

  if (isLoading || !onboardingLoaded || (showSplash && hasSeenOnboarding)) {
    return <SplashGreetingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            {!hasSeenOnboarding ? (
              <Stack.Screen name="Onboarding">
                {(props) => <OnboardingScreen {...props} onComplete={() => setHasSeenOnboarding(true)} />}
              </Stack.Screen>
            ) : null}
            {/* Guest browsing — main tabs are reachable; gated tabs show AuthGate */}
            {!hasCompletedGuestLguChoice ? (
              <Stack.Screen name="GuestLguDetect" component={GuestLguDetectScreen} />
            ) : null}
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="LguSelect" component={LguSelectScreen} />
            <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
            <Stack.Screen name="Explore" component={MapExplorerScreen} />
            <Stack.Screen name="Assistant">
              {({ navigation }) => <AuthGate label="use the assistant" navigation={navigation} />}
            </Stack.Screen>
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
            <Stack.Screen name="Explore" component={MapExplorerScreen} />
            <Stack.Screen name="Assistant" component={ChatbotScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
