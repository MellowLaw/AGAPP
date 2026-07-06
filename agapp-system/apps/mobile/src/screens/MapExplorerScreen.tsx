import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  Linking,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardEvent,
  PanResponder,
} from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { globalStyles, ACCENT, PASTELS } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Fixed pixel size for every pin, always — this is the whole fix. The old
// marker resized itself (selection state, a fading label) and react-native-
// maps snapshots the marker view into a bitmap on every change; a snapshot
// taken mid-resize is what produced the clipped/invisible pins. With a
// constant-size view there is nothing to mis-snapshot. Tapping a pin already
// opens the bottom sheet with the facility's name/address (see
// handleSelectPoi below), so there's no separate on-map label to manage.
const PIN_CIRCLE = 32;
const PIN_TAIL_H = 7;
const PIN_HEIGHT = PIN_CIRCLE + PIN_TAIL_H;

// Circle + CSS-triangle tail (border trick — deterministic box size, no
// rotation-overflow math) to match the admin Facilities map's pin silhouette
// (apps/admin/src/components/map/markers.ts `makePinIcon`): same category
// colors, same rounded-top/pointed-bottom shape.
function FacilityMarker({
  poi, isSelected, categoryColor, categoryIcon, onPress,
}: {
  poi: any;
  isSelected: boolean;
  categoryColor: string;
  categoryIcon: string;
  onPress: () => void;
}) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  // Nothing about this marker ever changes size — only the border color/width
  // on selection — so a brief re-track after mount (and after selection
  // toggles, so the highlight actually renders) is all that's needed.
  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 300);
    return () => clearTimeout(timer);
  }, [isSelected]);

  return (
    <Marker
      coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1.0 }} // tip of the tail sits on the coordinate
      tracksViewChanges={tracksViewChanges}
    >
      <View style={styles.pinContainer} collapsable={false}>
        <View style={[
          styles.pinCircle,
          {
            backgroundColor: categoryColor,
            borderColor: isSelected ? '#1A1A1A' : '#FFFFFF',
            borderWidth: isSelected ? 3 : 2,
          },
        ]}>
          <Ionicons name={categoryIcon as any} size={16} color="#FFFFFF" />
        </View>
        <View style={[styles.pinTail, { borderTopColor: categoryColor }]} />
      </View>
    </Marker>
  );
}

const CATEGORIES = [
  { id: 'all',       label: 'All',       icon: 'grid-outline',      color: '#6B7280' },
  { id: 'municipal', label: 'Municipal', icon: 'business-outline',  color: '#D9A05B' },
  { id: 'police',    label: 'Police',    icon: 'shield-outline',    color: '#4A90E2' },
  { id: 'fire',      label: 'Fire Dept', icon: 'flame-outline',     color: '#D0021B' },
  { id: 'hospital',  label: 'Hospital',  icon: 'medkit-outline',    color: '#2ECC71' },
  { id: 'other',     label: 'Others',    icon: 'location-outline',  color: '#9B59B6' },
];

// Collapsed bottom sheet height (peeks so the handle is visible) vs expanded height
const SHEET_COLLAPSED = 35;
const SHEET_EXPANDED  = 300;

export function MapExplorerScreen() {
  const { T, isDarkMode } = useTheme();
  const { selectedLgu, guestLgu, profile } = useAuth();
  // Map is intentionally guest-accessible (see AppNavigator's AuthGate copy:
  // "browse Home, News, and the Map without an account") — but selectedLgu is
  // only ever set after login+profile. Without this fallback, guests get an
  // empty map: no facilities fetch, no boundary, wrong region. Same pattern
  // already used in HomeScreen.tsx's activeLgu.
  const activeLgu = selectedLgu || guestLgu || { id: 'liliw-laguna', name: 'Liliw, Laguna', latitude: 14.1350, longitude: 121.4363 };
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();

  // State
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPoi, setSelectedPoi] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [fetchingUserLoc, setFetchingUserLoc] = useState(false);

  // Panel open/closed state
  const [panelOpen, setPanelOpen] = useState(false);

  // Animation values
  const panelHeightRef = useRef(SHEET_COLLAPSED);
  const panelAnim      = useRef(new Animated.Value(SHEET_COLLAPSED)).current;
  const detailAnim     = useRef(new Animated.Value(0)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  // ── Keyboard listener — slides panel up when keyboard opens ─────────────
  useEffect(() => {
    const onShow = (e: KeyboardEvent) => {
      Animated.spring(keyboardOffset, {
        toValue: e.endCoordinates.height,
        useNativeDriver: false,
        friction: 8,
        tension: 60,
      }).start();
    };
    const onHide = () => {
      Animated.spring(keyboardOffset, {
        toValue: 0,
        useNativeDriver: false,
        friction: 8,
        tension: 60,
      }).start();
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // ── Load facilities ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeLgu) return;
    const fetchFacilities = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lgu_facilities')
          .select('*')
          .eq('lgu_id', activeLgu.id);
        if (!error && data) setFacilities(data);
      } catch (err) {
        console.error('Error fetching facilities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFacilities();
  }, [activeLgu]);

  // ── Entrance zoom animation: runs every time this tab is focused ─────────
  useFocusEffect(
    useCallback(() => {
      const lat = activeLgu?.latitude  || 14.1350;
      const lng = activeLgu?.longitude || 121.4363;

      // Reset UI state when returning to tab
      setSelectedPoi(null);
      closePanel();

      const townRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.022,
        longitudeDelta: 0.022,
      };

      // Just animate directly to the town region quickly (800ms) on focus
      const timer = setTimeout(() => {
        mapRef.current?.animateToRegion(townRegion, 800);
      }, 100);

      return () => clearTimeout(timer);
    }, [activeLgu])
  );

  // ── Panel toggle animation ───────────────────────────────────────────────
  const openPanel = () => {
    setPanelOpen(true);
    panelHeightRef.current = selectedPoi ? 380 : SHEET_EXPANDED;
    Animated.spring(panelAnim, {
      toValue: panelHeightRef.current,
      useNativeDriver: false,
      friction: 9,
      tension: 60,
    }).start();
  };

  const closePanel = () => {
    setSearchQuery('');
    setSelectedPoi(null);
    panelHeightRef.current = SHEET_COLLAPSED;
    Animated.spring(panelAnim, {
      toValue: SHEET_COLLAPSED,
      useNativeDriver: false,
      friction: 9,
      tension: 60,
    }).start(() => setPanelOpen(false));
  };

  // Keep latest actions in a ref to avoid stale closures in PanResponder
  const actionsRef = useRef({ openPanel, closePanel });
  actionsRef.current = { openPanel, closePanel };

  // ── Pan Responder for Draggable Sheet ────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderMove: (_, gesture) => {
        let newHeight = panelHeightRef.current - gesture.dy;
        if (newHeight < SHEET_COLLAPSED) newHeight = SHEET_COLLAPSED;
        panelAnim.setValue(newHeight);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.vy < -0.5 || gesture.dy < -50) {
          actionsRef.current.openPanel();
        } else if (gesture.vy > 0.5 || gesture.dy > 50) {
          actionsRef.current.closePanel();
        } else {
          // snap back to whatever it was
          if (panelHeightRef.current > SHEET_COLLAPSED) actionsRef.current.openPanel();
          else actionsRef.current.closePanel();
        }
      }
    })
  ).current;



  // ── Detail panel ─────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.spring(detailAnim, {
      toValue: selectedPoi ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();
    if (selectedPoi) {
      // Ensure panel is open when a POI is selected
      openPanel();
    } else if (!selectedPoi && panelOpen) {
      Animated.spring(panelAnim, {
        toValue: SHEET_EXPANDED,
        useNativeDriver: false,
        friction: 9,
        tension: 60,
      }).start(() => {
        panelHeightRef.current = SHEET_EXPANDED;
      });
    }
  }, [selectedPoi]);

  // ── Region / boundary ────────────────────────────────────────────────────
  const initialRegion = useMemo(() => {
    const lat = activeLgu?.latitude  || 14.1350;
    const lng = activeLgu?.longitude || 121.4363;
    return { latitude: lat, longitude: lng, latitudeDelta: 0.022, longitudeDelta: 0.022 };
  }, [activeLgu]);

  const boundaryCoords = useMemo(() => {
    if (activeLgu?.boundary_geojson?.coordinates?.[0]) {
      try {
        return activeLgu.boundary_geojson.coordinates[0].map((c: any) => ({
          longitude: c[0], latitude: c[1],
        }));
      } catch {}
    }
    const lat = activeLgu?.latitude  || 14.1350;
    const lng = activeLgu?.longitude || 121.4363;
    const off = 0.018;
    return [
      { latitude: lat + off, longitude: lng - off },
      { latitude: lat + off, longitude: lng + off },
      { latitude: lat - off, longitude: lng + off },
      { latitude: lat - off, longitude: lng - off },
      { latitude: lat + off, longitude: lng - off },
    ];
  }, [activeLgu]);

  // ── Filtering ────────────────────────────────────────────────────────────
  const filteredFacilities = useMemo(() => {
    return facilities.filter(fac => {
      const matchesCat  = selectedCategory === 'all' || fac.category === selectedCategory;
      const matchesSrch =
        fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fac.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSrch;
    });
  }, [facilities, selectedCategory, searchQuery]);

  // ── Location ─────────────────────────────────────────────────────────────
  const getUserLocation = async () => {
    setFetchingUserLoc(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is required.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(coord);
      mapRef.current?.animateToRegion({ ...coord, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 1000);
    } catch {
      Alert.alert('Error', 'Unable to fetch your current location.');
    } finally {
      setFetchingUserLoc(false);
    }
  };

  // ── POI select ───────────────────────────────────────────────────────────
  const handleSelectPoi = (poi: any) => {
    setSelectedPoi(poi);
    mapRef.current?.animateToRegion({
      latitude:      poi.latitude - 0.001,
      longitude:     poi.longitude,
      latitudeDelta:  0.005,
      longitudeDelta: 0.005,
    }, 800);
  };

  // ── External actions ─────────────────────────────────────────────────────
  const triggerCall = (phone: string) => { if (phone) Linking.openURL(`tel:${phone}`); };
  const triggerDirections = (poi: any) => {
    const label = encodeURIComponent(poi.name);
    const url = Platform.select({
      ios:     `maps:0,0?q=${poi.latitude},${poi.longitude}(${label})`,
      android: `geo:0,0?q=${poi.latitude},${poi.longitude}(${label})`,
    });
    Linking.openURL(url || `https://www.google.com/maps/search/?api=1&query=${poi.latitude},${poi.longitude}`);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getCategoryColor = (cat: string) => CATEGORIES.find(c => c.id === cat)?.color || '#6B7280';
  const getCategoryIcon  = (cat: string) => CATEGORIES.find(c => c.id === cat)?.icon  || 'location-outline';
  const getCategoryFallbackImage = (cat: string) => {
    switch (cat) {
      case 'municipal': return 'https://images.unsplash.com/photo-1577086664693-894d8405334a?auto=format&fit=crop&w=600&q=80';
      case 'police':    return 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=600&q=80';
      case 'fire':      return 'https://images.unsplash.com/photo-1616239121966-fd90cfdcf2d1?auto=format&fit=crop&w=600&q=80';
      case 'hospital':  return 'https://images.unsplash.com/photo-1586773860418-d37222d8fce2?auto=format&fit=crop&w=600&q=80';
      default:          return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80';
    }
  };

  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Citizen';

  return (
    <View style={styles.container}>

      {/* ── 1. Full-screen map ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Town boundary polygon */}
        <Polygon
          coordinates={boundaryCoords}
          strokeColor={ACCENT + '99'}
          fillColor={ACCENT + '12'}
          strokeWidth={2}
        />

        {/* User location */}
        {userLocation && (
          <Marker coordinate={userLocation} title="You are here">
            <View style={styles.userDotContainer}>
              <View style={styles.userDotPulse} />
              <View style={[styles.userDotCircle, { backgroundColor: '#3b82f6' }]}>
                <Ionicons name="navigate" size={11} color="#FFF" />
              </View>
            </View>
          </Marker>
        )}

        {/* POI Markers — always visible */}
        {filteredFacilities.map(poi => (
          <FacilityMarker
            key={poi.id}
            poi={poi}
            isSelected={selectedPoi?.id === poi.id}
            categoryColor={getCategoryColor(poi.category)}
            categoryIcon={getCategoryIcon(poi.category)}
            onPress={() => handleSelectPoi(poi)}
          />
        ))}
      </MapView>

      {/* ── 2. Top header card ── */}
      <View style={[styles.headerOverlay, { top: insets.top + 10 }]}>
        <View style={[styles.headerCard, { backgroundColor: T.card, borderColor: T.border }]}>
          <View>
            <Text style={[styles.headerSubtitle, { color: T.textMuted }]}>AGAPP EXPLORER</Text>
            <Text style={[styles.headerTitle, { color: T.text }]}>
              {activeLgu?.name?.replace('Municipality of ', '') || 'Liliw'} Map
            </Text>
          </View>
        </View>
      </View>

      {/* ── 3. Floating action buttons (right side, below header) ── */}
      <View style={[styles.floatingButtonsContainer, { top: insets.top + 90 }]}>
        {/* Location arrow */}
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: T.card, borderColor: T.border }]}
          onPress={getUserLocation}
          disabled={fetchingUserLoc}
        >
          {fetchingUserLoc
            ? <ActivityIndicator size="small" color={T.text} />
            : <Ionicons name="navigate-outline" size={20} color={T.text} />}
        </TouchableOpacity>

        {/* Search toggle button — below the location arrow */}
        <TouchableOpacity
          style={[
            styles.floatingButton,
            { backgroundColor: panelOpen ? T.text : T.card, borderColor: T.border },
          ]}
          onPress={panelOpen ? closePanel : openPanel}
        >
          <Ionicons
            name={panelOpen ? 'close-outline' : 'search-outline'}
            size={20}
            color={panelOpen ? T.bg : T.text}
          />
        </TouchableOpacity>
      </View>

      {/* ── 4. Bottom slide-up explore panel (lifts with keyboard) ── */}
      <Animated.View
        style={[
          styles.kavWrapper,
          { bottom: keyboardOffset },
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.bottomSheet,
            { height: panelAnim, backgroundColor: T.card, borderTopColor: T.border },
          ]}
          pointerEvents="auto"
        >
          {/* Drag handle wrapper */}
          <View {...panResponder.panHandlers} style={styles.dragArea}>
            <View style={styles.sheetHandle} />
          </View>

          {selectedPoi ? (
            /* ── POI Detail View ── */
            <View style={styles.detailContainer}>
              <View style={styles.detailImageContainer}>
                <Image
                  source={{ uri: selectedPoi.image_url || getCategoryFallbackImage(selectedPoi.category) }}
                  style={styles.detailImage}
                  resizeMode="cover"
                />
                <TouchableOpacity style={styles.closeDetailBtnOverlay} onPress={() => setSelectedPoi(null)}>
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.detailCategoryRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(selectedPoi.category) + '20' }]}>
                      <Ionicons name={getCategoryIcon(selectedPoi.category) as any} size={12} color={getCategoryColor(selectedPoi.category)} />
                      <Text style={[styles.categoryBadgeText, { color: getCategoryColor(selectedPoi.category) }]}>
                        {selectedPoi.category.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.detailTitle,   { color: T.text }]}      numberOfLines={1}>{selectedPoi.name}</Text>
                  <Text style={[styles.detailAddress, { color: T.textMuted }]} numberOfLines={1}>{selectedPoi.address}</Text>
                  {!!selectedPoi.description && (
                    <Text style={[styles.detailAddress, { color: T.textMuted, marginTop: 6 }]} numberOfLines={3}>
                      {selectedPoi.description}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.detailActionGrid}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: selectedPoi.phone ? ACCENT : T.chip }]}
                  onPress={() => triggerCall(selectedPoi.phone)}
                  disabled={!selectedPoi.phone}
                >
                  <Ionicons name="call-outline" size={20} color={selectedPoi.phone ? '#1A1A1A' : T.textMuted} />
                  <Text style={[styles.actionBtnText, { color: selectedPoi.phone ? '#1A1A1A' : T.textMuted }]}>
                    {selectedPoi.phone ? 'Call' : 'No Phone'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: T.text }]}
                  onPress={() => triggerDirections(selectedPoi)}
                >
                  <Ionicons name="arrow-redo-outline" size={20} color={T.bg} />
                  <Text style={[styles.actionBtnText, { color: T.bg }]}>Directions</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ── Search & Facilities List ── */
            <View style={{ flex: 1 }}>
              {/* Search Input */}
              <View style={[styles.searchContainer, { backgroundColor: T.cardAlt, borderColor: T.border }]}>
                <Ionicons name="search-outline" size={18} color={T.textMuted} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: T.text }]}
                  placeholder={`Hi ${firstName}, search for places…`}
                  placeholderTextColor={T.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={T.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Category filter pills */}
              <View style={{ height: 45, marginBottom: 10 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScrollContent}>
                  {CATEGORIES.map(cat => {
                    const isActive = selectedCategory === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.catPill, { backgroundColor: isActive ? T.text : T.cardAlt, borderColor: T.border }]}
                        onPress={() => setSelectedCategory(cat.id)}
                      >
                        <Ionicons name={cat.icon as any} size={14} color={isActive ? T.bg : T.textMuted} />
                        <Text style={[styles.catPillText, { color: isActive ? T.bg : T.text }]}>{cat.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Horizontal facility cards */}
              {loading ? (
                <ActivityIndicator style={{ marginTop: 12 }} color={T.text} />
              ) : filteredFacilities.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={{ color: T.textMuted }}>No facilities found.</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.facilitiesScrollContent}>
                  {filteredFacilities.map(fac => (
                    <TouchableOpacity
                      key={fac.id}
                      style={[styles.facilityCard, { backgroundColor: T.cardAlt, borderColor: T.border }]}
                      onPress={() => handleSelectPoi(fac)}
                    >
                      <View style={styles.facCardHeader}>
                        <View style={[styles.facCardIconBadge, { backgroundColor: getCategoryColor(fac.category) }]}>
                          <Ionicons name={getCategoryIcon(fac.category) as any} size={16} color="#FFF" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={[styles.facCardTitle,   { color: T.text }]}     numberOfLines={1}>{fac.name}</Text>
                          <Text style={[styles.facCardAddress, { color: T.textMuted }]} numberOfLines={1}>{fac.address}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map:       { ...StyleSheet.absoluteFillObject },
  kavWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  headerCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerTitle:    { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 9,  fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  floatingButtonsContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 20,
    gap: 12,
  },
  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  pinContainer: {
    // Fixed bounds, always — never changes with selection state. See the
    // PIN_CIRCLE/PIN_TAIL_H comment at the top of the file for why that matters.
    width: PIN_CIRCLE,
    height: PIN_HEIGHT,
    alignItems: 'center',
  },
  pinCircle: {
    width: PIN_CIRCLE,
    height: PIN_CIRCLE,
    borderRadius: PIN_CIRCLE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  pinTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: PIN_TAIL_H,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  userDotContainer: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  userDotPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    opacity: 0.2,
  },
  userDotCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 2,
  },
  bottomSheet: {
    borderTopWidth: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
  },
  dragArea: {
    paddingTop: 8,
    paddingBottom: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 14,
  },
  searchIcon:  { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  categoriesScrollContent: { paddingRight: 20, gap: 8, height: 36 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    height: 32,
    gap: 6,
  },
  catPillText: { fontSize: 12, fontWeight: '600' },
  facilitiesScrollContent: { paddingRight: 20, paddingTop: 4, gap: 12, height: 80 },
  facilityCard: {
    width: 220,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    justifyContent: 'center',
  },
  facCardHeader:    { flexDirection: 'row', alignItems: 'center' },
  facCardIconBadge: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  facCardTitle:     { fontSize: 13, fontWeight: '600' },
  facCardAddress:   { fontSize: 10, marginTop: 2 },
  emptyContainer:   { height: 60, justifyContent: 'center', alignItems: 'center' },
  detailContainer:  { flex: 1, justifyContent: 'space-between' },
  detailHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  detailCategoryRow: { flexDirection: 'row', marginBottom: 8 },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  categoryBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  detailTitle:   { fontSize: 19, fontWeight: '700', lineHeight: 24, marginBottom: 4 },
  detailAddress: { fontSize: 13, lineHeight: 18 },
  detailImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  detailImage: { width: '100%', height: '100%' },
  closeDetailBtnOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  detailActionGrid: { flexDirection: 'row', gap: 12, marginTop: 10 },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
});
