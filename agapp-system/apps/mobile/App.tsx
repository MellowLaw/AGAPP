import { useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { ToastProvider } from './src/components/Toast';
import { AppNavigator } from './src/navigation/AppNavigator';
import { supabase } from './supabaseClient';

SplashScreen.preventAutoHideAsync();

const DEFAULT_ACCENT = '#F2E863';

// Bridges the active LGU (from AuthContext) into the theme's dynamic accent
// (in ThemeContext). Lives here rather than inside either context to avoid
// a circular import between the mobile app and packages/shared.
function AccentSync() {
  const { selectedLgu, guestLgu } = useAuth();
  const { setAccent } = useTheme();

  useEffect(() => {
    const lgu = selectedLgu || guestLgu;
    if (!lgu?.id) {
      setAccent(DEFAULT_ACCENT);
      return;
    }
    // Always re-fetch from DB to pick up any admin color changes without needing a re-login.
    supabase
      .from('lgus')
      .select('primary_color')
      .eq('id', lgu.id)
      .single()
      .then(({ data, error }) => {
        if (data?.primary_color && !error) {
          setAccent(data.primary_color);
        } else {
          // Fallback to cached value if network is unavailable
          setAccent(lgu?.primary_color || lgu?.color || DEFAULT_ACCENT);
        }
      });
  }, [selectedLgu, guestLgu, setAccent]);

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
          <ToastProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
