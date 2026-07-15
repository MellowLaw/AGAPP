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
  Image,
  Keyboard,
  KeyboardEvent,
  PanResponder,
} from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_DEFAULT } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { PASTELS } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useToast } from '../components/Toast';
import {
  ArrowLeft2,
  ArrowRight2,
  SearchNormal1,
  CloseSquare,
  CloseCircle,
  Call,
  Export,
  Buildings,
  Shield,
  Flash,
  Health,
  Location as LocationIcon,
  Category2,
  Discover,
} from 'iconsax-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const PIN_CIRCLE = 32;
const PIN_TAIL_H = 7;
const PIN_HEIGHT = PIN_CIRCLE + PIN_TAIL_H;

function FacilityMarker({
  poi, isSelected, categoryColor, categoryIcon, onPress,
}: {
  poi: any;
  isSelected: boolean;
  categoryColor: string;
  categoryIcon: any;
  onPress: () => void;
}) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 300);
    return () => clearTimeout(timer);
  }, [isSelected]);

  const IconComp = categoryIcon;

  return (
    <Marker
      coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1.0 }}
      tracksViewChanges={tracksViewChanges}
    >
      <View style={styles.pinContainer} collapsable={false}>
        <View style={[
          styles.pinCircle,
          {
            backgroundColor: categoryColor,
            borderColor: isSelected ? '#292929' : '#FFFFFF',
            borderWidth: isSelected ? 3 : 2,
          },
        ]}>
          <IconComp size={16} color="#FFFFFF" variant="Bold" />
        </View>
        <View style={[styles.pinTail, { borderTopColor: categoryColor }]} />
      </View>
    </Marker>
  );
}

const CATEGORIES = [
  { id: 'all',       label: 'All',       icon: Category2,         color: '#6B7280' },
  { id: 'municipal', label: 'Municipal', icon: Buildings,         color: '#D9A05B' },
  { id: 'police',    label: 'Police',    icon: Shield,            color: '#4A90E2' },
  { id: 'fire',      label: 'Fire Dept', icon: Flash,             color: '#D0021B' },
  { id: 'hospital',  label: 'Hospital',  icon: Health,            color: '#2ECC71' },
  { id: 'other',     label: 'Others',    icon: LocationIcon,      color: '#9B59B6' },
];

const SHEET_COLLAPSED = 35;
const SHEET_EXPANDED  = 300;

export function MapExplorerScreen() {
  const { T, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const { session, selectedLgu, guestLgu, profile } = useAuth();
  const navigation = useNavigation<any>();

  const activeLgu = selectedLgu || guestLgu || { id: 'liliw-laguna', name: 'Liliw, Laguna', latitude: 14.1350, longitude: 121.4363 };
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();

  if (!session) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: insets.top }}>
        {/* Header bar with back button */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 16,
        }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <ArrowLeft2 size={30} color={T.text} variant="Outline" />
          </TouchableOpacity>
          <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 20, marginLeft: 16 }}>
            Map Explorer
          </Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 80 }}>
          {/* Centered Map Icon */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: T.cardAlt,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
            borderWidth: 1,
            borderColor: T.border,
          }}>
            <LocationIcon size={40} color={T.text} variant="Outline" />
          </View>
          
          <Text style={{
            fontFamily: 'Octarine-Bold',
            color: T.text,
            fontSize: 24,
            textAlign: 'center',
            marginBottom: 12,
          }}>
            Sign in to see your local map
          </Text>
          
          <Text style={{
            fontFamily: 'Inter-Medium',
            color: T.textMuted,
            textAlign: 'center',
            fontSize: 14,
            lineHeight: 22,
            marginBottom: 36,
            paddingHorizontal: 16,
          }}>
            Create an account to explore local landmarks, locate municipal offices, and access community facilities on the interactive map.
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
            onPress={() => navigation.navigate('Login', { initialMode: 'register' })}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: 'Inter-Bold', fontSize: 16 }}>Sign up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login', { initialMode: 'login' })}
            activeOpacity={0.7}
            style={{ paddingVertical: 8 }}
          >
            <Text style={{
              color: T.text,
              fontFamily: 'Octarine-Bold',
              fontSize: 16,
              textAlign: 'center',
            }}>
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPoi, setSelectedPoi] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [fetchingUserLoc, setFetchingUserLoc] = useState(false);

  const [panelOpen, setPanelOpen] = useState(false);

  const panelHeightRef = useRef(SHEET_COLLAPSED);
  const panelAnim      = useRef(new Animated.Value(SHEET_COLLAPSED)).current;
  const detailAnim     = useRef(new Animated.Value(0)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;

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

  useFocusEffect(
    useCallback(() => {
      const lat = activeLgu?.latitude  || 14.1350;
      const lng = activeLgu?.longitude || 121.4363;

      setSelectedPoi(null);
      closePanel();

      const townRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.022,
        longitudeDelta: 0.022,
      };

      const timer = setTimeout(() => {
        mapRef.current?.animateToRegion(townRegion, 800);
      }, 100);

      return () => clearTimeout(timer);
    }, [activeLgu])
  );

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

  const actionsRef = useRef({ openPanel, closePanel });
  actionsRef.current = { openPanel, closePanel };

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
          if (panelHeightRef.current > SHEET_COLLAPSED) actionsRef.current.openPanel();
          else actionsRef.current.closePanel();
        }
      }
    })
  ).current;

  useEffect(() => {
    Animated.spring(detailAnim, {
      toValue: selectedPoi ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();
    if (selectedPoi) {
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

  const filteredFacilities = useMemo(() => {
    return facilities.filter(fac => {
      const matchesCat  = selectedCategory === 'all' || fac.category === selectedCategory;
      const matchesSrch =
        fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fac.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSrch;
    });
  }, [facilities, selectedCategory, searchQuery]);

  const getUserLocation = async () => {
    setFetchingUserLoc(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Location access is required.', 'error');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(coord);
      mapRef.current?.animateToRegion({ ...coord, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 1000);
    } catch {
      showToast('Unable to fetch your current location.', 'error');
    } finally {
      setFetchingUserLoc(false);
    }
  };

  const handleSelectPoi = (poi: any) => {
    setSelectedPoi(poi);
    mapRef.current?.animateToRegion({
      latitude:      poi.latitude - 0.001,
      longitude:     poi.longitude,
      latitudeDelta:  0.005,
      longitudeDelta: 0.005,
    }, 800);
  };

  const triggerCall = (phone: string) => { if (phone) Linking.openURL(`tel:${phone}`); };
  const triggerDirections = (poi: any) => {
    const label = encodeURIComponent(poi.name);
    const url = Platform.select({
      ios:     `maps:0,0?q=${poi.latitude},${poi.longitude}(${label})`,
      android: `geo:0,0?q=${poi.latitude},${poi.longitude}(${label})`,
    });
    Linking.openURL(url || `https://www.google.com/maps/search/?api=1&query=${poi.latitude},${poi.longitude}`);
  };

  const getCategoryColor = (cat: string) => CATEGORIES.find(c => c.id === cat)?.color || '#6B7280';
  const getCategoryIcon  = (cat: string) => CATEGORIES.find(c => c.id === cat)?.icon  || LocationIcon;
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

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        <Polygon
          coordinates={boundaryCoords}
          strokeColor={T.accent + '99'}
          fillColor={T.accent + '12'}
          strokeWidth={2}
        />

        {userLocation && (
          <Marker coordinate={userLocation} title="You are here">
            <View style={styles.userDotContainer}>
              <View style={styles.userDotPulse} />
              <View style={[styles.userDotCircle, { backgroundColor: '#3b82f6' }]}>
                <Discover size={11} color="#FFF" variant="Bold" />
              </View>
            </View>
          </Marker>
        )}

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

      {/* Top Header Card */}
      <View style={[styles.headerOverlay, { top: insets.top + 10 }]}>
        <View style={[styles.headerCard, { backgroundColor: T.card, borderColor: T.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 12 }}>
            <ArrowLeft2 size={30} color={T.text} variant="Outline" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerSubtitle, { color: T.textMuted }]}>AGAPP EXPLORER</Text>
            <Text style={[styles.headerTitle, { color: T.text }]}>
              {activeLgu?.name?.replace('Municipality of ', '') || 'Liliw'} Map
            </Text>
          </View>
        </View>
      </View>

      {/* Floating Action Buttons */}
      <View style={[styles.floatingButtonsContainer, { top: insets.top + 90 }]}>
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: T.card, borderColor: T.border }]}
          onPress={getUserLocation}
          disabled={fetchingUserLoc}
        >
          {fetchingUserLoc
            ? <ActivityIndicator size="small" color={T.text} />
            : <Discover size={20} color={T.text} variant="Bold" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.floatingButton,
            { backgroundColor: panelOpen ? T.text : T.card, borderColor: T.border },
          ]}
          onPress={panelOpen ? closePanel : openPanel}
        >
          {panelOpen ? (
            <CloseSquare size={20} color={T.bg} variant="Bold" />
          ) : (
            <SearchNormal1 size={20} color={T.text} variant="Outline" />
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom slide-up panel */}
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
          <View {...panResponder.panHandlers} style={styles.dragArea}>
            <View style={styles.sheetHandle} />
          </View>

          {selectedPoi ? (
            /* POI Detail View */
            <View style={styles.detailContainer}>
              <View style={styles.detailImageContainer}>
                <Image
                  source={{ uri: selectedPoi.image_url || getCategoryFallbackImage(selectedPoi.category) }}
                  style={styles.detailImage}
                  resizeMode="cover"
                />
                <TouchableOpacity style={styles.closeDetailBtnOverlay} onPress={() => setSelectedPoi(null)}>
                  <CloseSquare size={18} color="#FFFFFF" variant="Bold" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.detailCategoryRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(selectedPoi.category) + '20' }]}>
                      {React.createElement(getCategoryIcon(selectedPoi.category), {
                        size: 12,
                        color: getCategoryColor(selectedPoi.category),
                        variant: 'Bold',
                      })}
                      <Text style={[styles.categoryBadgeText, { color: getCategoryColor(selectedPoi.category) }]}>
                        {selectedPoi.category.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.detailTitle, { color: T.text }]} numberOfLines={1}>{selectedPoi.name}</Text>
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
                  style={[styles.actionBtn, { backgroundColor: selectedPoi.phone ? T.accentSoft : T.chip }]}
                  onPress={() => triggerCall(selectedPoi.phone)}
                  disabled={!selectedPoi.phone}
                >
                  <Call size={20} color={selectedPoi.phone ? '#292929' : T.textMuted} variant="Bold" />
                  <Text style={[styles.actionBtnText, { color: selectedPoi.phone ? '#292929' : T.textMuted }]}>
                    {selectedPoi.phone ? 'Call' : 'No Phone'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: T.text }]}
                  onPress={() => triggerDirections(selectedPoi)}
                >
                  <Export size={20} color={T.bg} variant="Bold" />
                  <Text style={[styles.actionBtnText, { color: T.bg }]}>Directions</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Search & Facilities List */
            <View style={{ flex: 1 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                height: 48,
                borderRadius: 999, // Pill layout
                borderWidth: 1,
                borderColor: T.border,
                backgroundColor: T.cardAlt,
                marginBottom: 14,
              }}>
                <SearchNormal1 size={18} color={T.textMuted} variant="Outline" style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: T.text, fontFamily: 'Inter-Medium' }]}
                  placeholder={`Hi ${firstName}, search for places…`}
                  placeholderTextColor={T.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <CloseCircle size={18} color={T.textMuted} variant="Bold" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Category filter pills */}
              <View style={{ height: 45, marginBottom: 10 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScrollContent}>
                  {CATEGORIES.map(cat => {
                    const isActive = selectedCategory === cat.id;
                    const CatIcon = cat.icon;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.catPill, { backgroundColor: isActive ? T.text : T.cardAlt, borderColor: T.border }]}
                        onPress={() => setSelectedCategory(cat.id)}
                      >
                        <CatIcon size={14} color={isActive ? T.bg : T.textMuted} variant={isActive ? 'Bold' : 'Linear'} />
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
                  <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium' }}>No facilities found.</Text>
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
                          {React.createElement(getCategoryIcon(fac.category), {
                            size: 16,
                            color: '#FFF',
                            variant: 'Bold',
                          })}
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
    left: 20,
    right: 20,
    zIndex: 10,
  },
  headerCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24, // card radii 24
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerTitle:    { fontSize: 18, fontFamily: 'Octarine-Bold', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 9,  fontFamily: 'Octarine-Bold', letterSpacing: 1, marginBottom: 2 },
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
  searchIcon:  { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  categoriesScrollContent: { paddingRight: 20, gap: 8, height: 36 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 999, // Pill layout
    borderWidth: 1,
    height: 32,
    gap: 6,
  },
  catPillText: { fontSize: 12, fontFamily: 'Inter-Medium' },
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
  facCardTitle:     { fontSize: 13, fontFamily: 'Octarine-Bold' },
  facCardAddress:   { fontSize: 10, fontFamily: 'Inter-Medium', marginTop: 2 },
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
  categoryBadgeText: { fontSize: 9, fontFamily: 'Octarine-Bold', letterSpacing: 0.5 },
  detailTitle:   { fontSize: 19, fontFamily: 'Octarine-Bold', lineHeight: 24, marginBottom: 4 },
  detailAddress: { fontSize: 13, fontFamily: 'Inter-Medium', lineHeight: 18 },
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
    borderRadius: 999, // Pill layout
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionBtnText: { fontSize: 14, fontFamily: 'Octarine-Bold' },
});
