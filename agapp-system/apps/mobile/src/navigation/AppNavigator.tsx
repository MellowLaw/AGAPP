import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image, Dimensions, Platform } from 'react-native';
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
import { EmergencyScreen } from '../screens/EmergencyScreen';
import { LogoutConfirmScreen } from '../screens/LogoutConfirmScreen';
import LottieView from 'lottie-react-native';
import { GuestLguDetectScreen } from '../screens/GuestLguDetectScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SplashGreetingScreen } from '../screens/SplashGreetingScreen';
import { EmailOtpScreen } from '../screens/EmailOtpScreen';
import { CitizenGuideScreen } from '../screens/CitizenGuideScreen';
import { NewsScreen } from '../screens/NewsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * AuthGate — shown on submit-style tabs when the user is browsing without
 * an account. Lets guests explore Home/News/Map while nudging them to sign
 * in for any action that requires identity.
 */
const ShapeCell = ({ col, row, S }: { col: number; row: number; S: number }) => {
  return (
    <View style={{ width: S, height: S, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={require('../../assets/brand/main-shapes.png')}
        style={{
          width: S * 3,
          height: S * 3,
          position: 'absolute',
          left: -col * S,
          top: -row * S,
        }}
        resizeMode="stretch"
      />
    </View>
  );
};

const EaselCell = ({ S }: { S: number }) => {
  const easelSize = S * 1.5;
  const offsetX = (S - easelSize) / 2;
  const offsetY = (S - easelSize) / 2 - 10;

  return (
    <View style={{ width: S, height: S, position: 'relative', zIndex: 10 }}>
      <View style={{
        position: 'absolute',
        width: easelSize,
        height: easelSize,
        left: offsetX,
        top: offsetY,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Image
          source={require('../../assets/brand/stickers/16.png')}
          style={{ width: easelSize, height: easelSize }}
          resizeMode="contain"
        />
        <View style={{
          position: 'absolute',
          width: easelSize * 0.57,
          height: easelSize * 0.55,
          left: easelSize * 0.230,
          top: easelSize * 0.15,
          padding: 3,
        }}>
          <View style={{
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderRadius: 6,
            overflow: 'hidden',
          }}>
            <Image
              source={require('../../assets/brand/logo.png')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        </View>
      </View>
    </View>
  );
};

function AuthGate({ label, navigation }: { label: string; navigation: any }) {
  const { T } = useTheme();
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const S = (SCREEN_WIDTH - 48) / 3;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
      <LottieView
        source={require('../../assets/brand/sign-up-animation.json')}
        autoPlay
        loop
        renderMode="HARDWARE"
        style={{
          width: SCREEN_WIDTH * 0.95,
          height: SCREEN_WIDTH * 0.95,
          marginBottom: 16,
        }}
      />

      <View style={{ width: '100%', paddingHorizontal: 24, alignItems: 'center' }}>
        <Text style={{
          color: T.text,
          fontSize: 26,
          fontFamily: 'Octarine-Bold',
          textAlign: 'center',
          marginBottom: 8,
        }}>
          Get the Full Experience!
        </Text>
        
        <Text style={{
          color: T.textMuted,
          fontSize: 14,
          fontFamily: 'Inter-Medium',
          textAlign: 'center',
          paddingHorizontal: 12,
          marginBottom: 36,
          lineHeight: 20,
        }}>
          Sign in to access full features and services.
        </Text>

        <TouchableOpacity
          style={{
            width: '100%',
            height: 52,
            borderRadius: 26,
            backgroundColor: '#292929',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}
          onPress={() => navigation.navigate('Login', { initialMode: 'login' })}
          activeOpacity={0.85}
        >
          <Text style={{ color: '#FFFFFF', fontFamily: 'Inter-Bold', fontSize: 16 }}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login', { initialMode: 'register' })}
          activeOpacity={0.7}
          style={{ paddingVertical: 8 }}
        >
          <Text style={{
            color: T.text,
            fontFamily: 'Octarine-Bold',
            fontSize: 16,
            textAlign: 'center',
          }}>
            Sign up
          </Text>
        </TouchableOpacity>
      </View>
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

  const currentRoute = state.routes[state.index];
  const isSubScreenActive = 
    (currentRoute.state && currentRoute.state.index !== undefined && currentRoute.state.index > 0) ||
    currentRoute.params?.isSubScreen === true;
  const showFloater = (state.index === 0 || state.index === 1 || state.index === 2) && !isSubScreenActive;

  const [innerWidth, setInnerWidth] = React.useState(0);
  const slotWidth = innerWidth / routeCount;
  const translateX = React.useRef(new Animated.Value(state.index * slotWidth)).current;

  React.useEffect(() => {
    if (!innerWidth) return; // no layout yet — avoid animating from 0
    if (Platform.OS === 'android') {
      Animated.timing(translateX, {
        toValue: state.index * slotWidth,
        duration: 120,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(translateX, {
        toValue: state.index * slotWidth,
        useNativeDriver: true,
        friction: 10,
        tension: 90,
      }).start();
    }
  }, [state.index, innerWidth, slotWidth, translateX]);

  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: Platform.OS === 'ios' ? Math.max(insets.bottom - 10, 10) : insets.bottom + 10,
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
      {showFloater && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Assistant')}
          activeOpacity={0.85}
          style={{
            position: 'absolute',
            left: -8,
            top: -72,
            width: 90,
            height: 90,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <LottieView
            source={require('../../assets/brand/ai-floating.json')}
            style={{ width: 90, height: 90 }}
            autoPlay
            loop
          />
        </TouchableOpacity>
      )}

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
            {/* Active state sits on the T.accentSoft pill — its color must
                react to how light/dark that specific pill is (an LGU can
                pick a dark accent), not assume ink always works. */}
            <IconComponent size={26} color={isFocused ? T.onAccentSoft : T.textMuted} variant="Bold" />
            <Text style={{
              fontFamily: 'Inter-Medium',
              fontSize: 10,
              color: isFocused ? T.onAccentSoft : T.textMuted,
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
        {({ navigation, route }: any) => <ServicesScreen navigation={navigation} route={route} />}
      </Tab.Screen>
      <Tab.Screen name="ReportsTab" options={{ title: 'Report' }}>
        {({ navigation, route }: any) => <ReportsScreen navigation={navigation} route={route} />}
      </Tab.Screen>
      <Tab.Screen name="Forum" options={{ title: 'Forum' }}>
        {({ navigation }) => <ForumScreen navigation={navigation} />}
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
          // SplashGreetingScreen will control its own fade-out and trigger onFinish
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
    return <SplashGreetingScreen onFinish={() => setShowSplash(false)} />;
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
            <Stack.Screen name="EmailOtp" component={EmailOtpScreen} />
            <Stack.Screen name="LguSelect" component={LguSelectScreen} />
            <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
            <Stack.Screen name="News" component={NewsScreen} />
            <Stack.Screen name="Explore" component={MapExplorerScreen} />
            <Stack.Screen name="Emergency" component={EmergencyScreen} />
            <Stack.Screen name="CitizenGuide" component={CitizenGuideScreen} />
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
            <Stack.Screen name="News" component={NewsScreen} />
            <Stack.Screen name="Explore" component={MapExplorerScreen} />
            <Stack.Screen name="Emergency" component={EmergencyScreen} />
            <Stack.Screen name="CitizenGuide" component={CitizenGuideScreen} />
            <Stack.Screen name="Assistant" component={ChatbotScreen} />
            <Stack.Screen name="LogoutConfirm" component={LogoutConfirmScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
