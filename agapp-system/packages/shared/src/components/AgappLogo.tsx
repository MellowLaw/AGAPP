import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AgappLogoProps {
  size?: number;
  textColor?: string;
  bgColor?: string;
  showText?: boolean;
}

export function AgappLogo({
  size = 32,
  textColor = '#FFFFFF',
  bgColor = '#1A1A1A',
  showText = true,
}: AgappLogoProps) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.logoBox,
          {
            width: size,
            height: size,
            backgroundColor: bgColor,
            borderRadius: size * 0.2,
          },
        ]}
      >
        <Text style={[styles.logoLetter, { color: textColor, fontSize: size * 0.45 }]}>A</Text>
      </View>
      {showText && (
        <Text style={[styles.logoText, { fontSize: size * 0.55, color: bgColor === '#FFFFFF' ? '#FFFFFF' : '#1A1A1A' }]}>
          AGAPP
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLetter: {
    fontWeight: '700',
  },
  logoText: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
