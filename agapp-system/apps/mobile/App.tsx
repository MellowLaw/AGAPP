import { useCallback, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { ToastProvider } from './src/components/Toast';
import { AppNavigator, queueOrApplyNavigation, tryApplyPendingNavigation } from './src/navigation/AppNavigator';
import { supabase } from './supabaseClient';
import { getNotificationsModule, resolveNotificationTarget } from './src/utils/push';

const Notifications = getNotificationsModule();

/**
 * Routes a tapped push notification to the right in-app screen, via the
 * same resolveNotificationTarget() mapping NotificationsScreen.tsx's in-app
 * tap handler uses, so a push and an in-app list item behave identically.
 * Handles both "tapped while the app was already running" (the live listener)
 * and "tapped while the app was fully closed" (getLastNotificationResponseAsync,
 * which the live listener alone does not catch).
 */
function PushNotificationRouter() {
  const { session, selectedLgu } = useAuth();
  const authReadyRef = useRef(false);

  useEffect(() => {
    authReadyRef.current = !!(session && selectedLgu);
    // TrackingDetail/VerifyIdentity/Notifications only exist in the navigator
    // once signed in with an LGU selected (same gate as the Home bell fix).
    // NavigationContainer's own onReady (AppNavigator.tsx) makes the same
    // call when the navigator itself becomes ready — whichever of the two
    // (auth, navigator) finishes loading last is what actually applies a
    // queued navigation, so neither ordering silently drops it.
    tryApplyPendingNavigation(authReadyRef.current);
  }, [session, selectedLgu]);

  useEffect(() => {
    if (!Notifications) return; // web / Expo Go — push isn't available there anyway

    const handleResponse = async (response: any) => {
      const notificationId = response?.notification?.request?.content?.data?.notificationId;
      if (!notificationId) return;

      // One round trip: mark read and fetch type/payload together.
      const { data: n } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select('type, payload')
        .single();
      if (!n) return;

      const target = resolveNotificationTarget(n.type, n.payload);
      queueOrApplyNavigation(target, authReadyRef.current);
    };

    // Covers the app being launched by tapping a push while fully closed —
    // the live listener below only fires for responses received while the
    // JS runtime is already running. getLastNotificationResponseAsync()
    // otherwise keeps returning the SAME response on every future call until
    // cleared, which would re-navigate on every later unrelated app launch.
    Notifications.getLastNotificationResponseAsync().then((response: any) => {
      if (response) {
        handleResponse(response);
        Notifications.clearLastNotificationResponseAsync();
      }
    });

    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, []);

  return null;
}

SplashScreen.preventAutoHideAsync();

const DEFAULT_ACCENT = '#F2E863';

// Bridges the active LGU (from AuthContext) into the theme's dynamic accent
// (in ThemeContext). Lives here rather than inside either context to avoid
// a circular import between the mobile app and packages/shared.
function AccentSync() {
  const { session, selectedLgu, guestLgu } = useAuth();
  const { setAccent, setIconAccent, setDarkBg, isDarkMode } = useTheme();

  useEffect(() => {
    if (!session) {
      // Stripped monochrome shell for guest users
      setAccent(isDarkMode ? '#FFFCF5' : '#292929');
      setIconAccent(null);
      setDarkBg(null);
      return;
    }
    const lgu = selectedLgu;
    if (!lgu?.id) {
      setAccent(DEFAULT_ACCENT);
      setIconAccent(null);
      setDarkBg(null);
      return;
    }
    // Always re-fetch from DB to pick up any admin color changes without needing a re-login.
    supabase
      .from('lgus')
      .select('primary_color, icon_color, dark_bg_color')
      .eq('id', lgu.id)
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          setAccent(data.primary_color || lgu?.primary_color || lgu?.color || DEFAULT_ACCENT);
          setIconAccent(data.icon_color || null);
          setDarkBg(data.dark_bg_color || null);
        } else {
          // Fallback to cached value if network is unavailable
          setAccent(lgu?.primary_color || lgu?.color || DEFAULT_ACCENT);
          setIconAccent(null);
          setDarkBg(null);
        }
      });
  }, [selectedLgu, guestLgu, session, isDarkMode, setAccent, setIconAccent, setDarkBg]);

  return null;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Octarine-Bold': require('./assets/fonts/Octarine-Bold.otf'),
    'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AccentSync />
          <PushNotificationRouter />
          <ToastProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
