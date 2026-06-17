import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { OfflineSyncManager } from './src/utils/OfflineSyncManager';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['@supabase/gotrue-js:']); // Ignore Supabase auth warnings

export default function App() {
  useEffect(() => {
    // Attempt offline sync automatically on boot
    OfflineSyncManager.syncAll().catch(console.error);

    // Setup an interval to retry syncing every 30 seconds
    const interval = setInterval(() => {
      OfflineSyncManager.syncAll().catch(console.error);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
