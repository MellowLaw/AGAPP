import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export interface MapMarkerItem {
  id?: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  categoryColor?: string;
  onPress?: () => void;
}

export interface CrossPlatformMapProps {
  region?: MapRegion;
  initialRegion?: MapRegion;
  style?: any;
  markers?: MapMarkerItem[];
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  onPress?: (e: any) => void;
  children?: React.ReactNode;
}

/**
 * Universal Cross-Platform Map Component
 * - On Native (iOS/Android): Uses native react-native-maps.
 * - On Web / PWA: Uses interactive OpenStreetMap tile container.
 */
export function CrossPlatformMap({
  region,
  initialRegion,
  style,
  markers = [],
  scrollEnabled = true,
  zoomEnabled = true,
  onPress,
  children,
}: CrossPlatformMapProps) {
  const currentRegion = region || initialRegion || {
    latitude: 14.1311,
    longitude: 121.4363,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  if (Platform.OS === 'web') {
    const lat = currentRegion.latitude;
    const lng = currentRegion.longitude;
    // Embed OpenStreetMap interactive tile viewer for Web/PWA
    const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;

    return (
      <View style={[styles.webContainer, style]}>
        {/* @ts-ignore */}
        <iframe
          title="AGAPP Citizen Map"
          src={osmUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 16,
          }}
          loading="lazy"
        />
        <View style={styles.webOverlay}>
          <Text style={styles.webOverlayText}>
            📍 {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
          </Text>
        </View>
      </View>
    );
  }

  // Native iOS / Android MapView
  try {
    const MapViewModule = require('react-native-maps');
    const NativeMapView = MapViewModule.default || MapViewModule;
    const NativeMarker = MapViewModule.Marker;

    return (
      <NativeMapView
        style={style}
        region={region}
        initialRegion={initialRegion}
        scrollEnabled={scrollEnabled}
        zoomEnabled={zoomEnabled}
        onPress={onPress}
      >
        {markers.map((m, idx) => (
          <NativeMarker
            key={m.id || `marker-${idx}`}
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
            title={m.title}
            description={m.description}
            onPress={m.onPress}
          />
        ))}
        {children}
      </NativeMapView>
    );
  } catch (err) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <Text style={styles.fallbackText}>📍 {currentRegion.latitude}, {currentRegion.longitude}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  webContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  webOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  webOverlayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  fallbackText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
