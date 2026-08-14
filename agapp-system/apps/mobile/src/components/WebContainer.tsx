import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

export function WebContainer({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={styles.webOuter}>
      <View style={styles.webFrame}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A', // Sleek dark slate backdrop for desktop browsers
    alignItems: 'center',
    justifyContent: 'center',
  },
  webFrame: {
    width: '100%',
    maxWidth: 520, // Clean, optimal width for mobile & citizen web portal layout
    height: '100%',
    backgroundColor: '#FFFCF5',
    overflow: 'hidden',
  },
});
