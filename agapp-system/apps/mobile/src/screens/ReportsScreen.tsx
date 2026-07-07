import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { globalStyles, ACCENT, PASTELS } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';
import { isVerified } from '../utils/verification';
import { analyzeReportPhoto } from '../utils/mlAnalysis';
import { reportCategoryLabel } from '@agapp/shared';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';

// ids must match the reports.category CHECK constraint (supabase/schema.sql)
const REPORT_CATEGORIES = [
  { id: 'pothole',          label: 'Pothole / Road Damage', icon: 'car-outline' },
  { id: 'clogged_drainage', label: 'Drainage / Canal',      icon: 'water-outline' },
  { id: 'stray_animal',     label: 'Stray Pets',            icon: 'paw-outline' },
  { id: 'damaged_pole',     label: 'Damaged Pole',          icon: 'flash-outline' },
];

export function ReportsScreen({ navigation }: any) {
  const { T } = useTheme();
  const { selectedLgu, profile, session } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [category, setCategory] = useState('pothole');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<any>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Camera-only capture flow: a freshly taken photo sits here as "pending
  // review" — the user sees the stamped composite live on-screen and either
  // retakes or confirms, at which point captureRef() bakes it into imageUri.
  const [rawCaptureUri, setRawCaptureUri] = useState<string | null>(null);
  const [captureTimestamp, setCaptureTimestamp] = useState('');
  const [stamping, setStamping] = useState(false);
  const previewRef = useRef<View>(null);
  const verified = isVerified(profile);

  useEffect(() => {
    if (!profile) return;
    fetchReports();
  }, [profile]);

  const fetchReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('citizen_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) setReports(data);
  };

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c;
  };

  // Camera only — no gallery picker. Letting a citizen attach an existing
  // (old/downloaded/unrelated) image is exploitable for fake reports; a live
  // capture ties the photo to this moment. Also requires a locked GPS fix
  // first, since the stamp overlay needs real coordinates to draw.
  const takePhoto = async () => {
    if (!location) {
      Alert.alert('Waiting for GPS', "We're still getting your location. Please wait a moment and try again.");
      if (!loadingLoc) getLocation();
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your camera to take a photo of the incident.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setCaptureTimestamp(new Date().toLocaleString());
      setRawCaptureUri(result.assets[0].uri);
    }
  };

  const retakePhoto = () => {
    setRawCaptureUri(null);
    takePhoto();
  };

  // Bakes the location/time caption into the photo by capturing the
  // already-on-screen preview composite (see the render section) — an
  // on-screen capture is used deliberately instead of an off-screen/hidden
  // view, since a view that's never actually laid out on screen is a common
  // source of blank-image bugs with react-native-view-shot.
  const confirmStampedPhoto = async () => {
    if (!previewRef.current) return;
    setStamping(true);
    try {
      const uri = await captureRef(previewRef, { format: 'jpg', quality: 0.85 });
      setImageUri(uri);
      setRawCaptureUri(null);
    } catch (err) {
      console.warn('Photo stamping failed, falling back to the unstamped photo', err);
      // Never leave the user stuck on a report they can't submit — fall back
      // to the raw photo (no location caption baked in) rather than block.
      Alert.alert('Stamp Failed', 'Could not add the location stamp, but your photo is still attached.');
      setImageUri(rawCaptureUri);
      setRawCaptureUri(null);
    } finally {
      setStamping(false);
    }
  };

  const getLocation = async () => {
    setLoadingLoc(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        setLocation(null);
        return;
      }
      setLocationDenied(false);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      // Reverse geocode for a human-readable place name in the stamp caption.
      // Best-effort only — falls back to the selected LGU's name so the
      // caption always has something sensible, never a raw geocoder error.
      let address = '';
      try {
        const geo = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        const g = geo?.[0];
        if (g) {
          address = [g.street || g.name, g.subregion || g.city, g.region].filter(Boolean).join(', ');
        }
      } catch (geoErr) {
        console.warn('Reverse geocode failed', geoErr);
      }
      if (!address.trim()) {
        address = selectedLgu?.name || 'Current location';
      }

      setLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        address,
      });
    } catch (err) {
      // Deliberately no Alert here — this now runs automatically on every
      // focus, and an Alert would fire repeatedly and become spam. The
      // status card + submit-time validation already explain a missing fix.
      console.warn('Location fetch failed', err);
    } finally {
      setLoadingLoc(false);
    }
  };

  // Automatic GPS: fetch on first mount and every time this tab regains
  // focus, instead of waiting for a manual tap. Re-keyed off the LGU id so a
  // guest who changes their selected town also gets a fresh fix.
  useFocusEffect(
    useCallback(() => {
      getLocation();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLgu?.id])
  );

  const submitReport = async () => {
    // 1. Spam Cooldown check
    try {
      const lastReportTimeStr = await AsyncStorage.getItem('last_report_time');
      if (lastReportTimeStr) {
        const lastReportTime = parseInt(lastReportTimeStr, 10);
        const diff = Date.now() - lastReportTime;
        if (diff < 120000) { // 2 minutes cooldown
          const secsLeft = Math.ceil((120000 - diff) / 1000);
          Alert.alert('Spam Protection', `Please wait ${secsLeft} seconds before submitting another report.`);
          return;
        }
      }
    } catch (e) {
      console.warn('AsyncStorage read error', e);
    }

    // 2. Validate input and trim HTML
    const cleanDesc = description.trim().replace(/<[^>]*>/g, '');
    if (cleanDesc.length < 15) {
      Alert.alert('Validation Error', 'Please write a descriptive explanation of the issue (minimum 15 characters).');
      return;
    }

    // 3. Validate mandatory photo
    if (!imageUri) {
      Alert.alert('Validation Error', 'Please attach a photo as evidence of the issue.');
      return;
    }

    // 4. Validate location
    if (!location) {
      if (locationDenied) {
        Alert.alert(
          'Location Required',
          'Please enable location access in your device settings to submit a report.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      } else {
        Alert.alert('Location Required', "We're still getting your GPS location. Please wait a moment and try again.");
        if (!loadingLoc) getLocation();
      }
      return;
    }

    // 5. GPS Boundary Check (Distance <= 15km from selected LGU center)
    if (selectedLgu?.latitude && selectedLgu?.longitude) {
      const dist = getDistanceFromLatLonInKm(location.lat, location.lng, selectedLgu.latitude, selectedLgu.longitude);
      if (dist > 15) {
        Alert.alert(
          'Outside Municipal Boundary',
          `Your coordinates (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}) are ${dist.toFixed(1)}km away from ${selectedLgu.name || 'the selected municipality'}. Reports can only be submitted within municipal boundaries.`
        );
        return;
      }
    }
    setSubmitting(true);
    let publicUrl = null;

    // 6. Upload Photo to storage
    try {
      // ArrayBuffer, NOT blob: React Native's Blob doesn't serialize through
      // supabase-js's fetch — uploads die with "Network request failed".
      // ArrayBuffer is the officially supported RN/Expo upload path.
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();

      if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Selected image must be less than 5MB.');
        setSubmitting(false);
        return;
      }

      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${profile.id}/${Date.now()}.${fileExt.toLowerCase()}`;

      const { error: uploadError } = await supabase.storage
        .from('report-photos')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('report-photos')
        .getPublicUrl(fileName);
      
      publicUrl = urlData?.publicUrl;
    } catch (err: any) {
      Alert.alert('Upload Error', `Failed to upload image: ${err.message}`);
      setSubmitting(false);
      return;
    }

    // 7. Insert report record (reference_number is set by DB trigger,
    //    status defaults to 'Submitted')
    try {
      // ML boundary: needs the UPLOADED public URL (not the local file URI) — the
      // server-side model fetches the image over HTTP, it can't reach the phone's
      // local filesystem. Returns nulls ("not analyzed") for any category without
      // a deployed model, or if the check fails for any reason.
      const ml = await analyzeReportPhoto(category, publicUrl, session?.access_token);

      const { data: inserted, error } = await supabase.from('reports').insert({
        lgu_id: selectedLgu.id,
        citizen_id: profile.id,
        citizen_name: profile.name,
        category,
        description: cleanDesc,
        latitude: location.lat,
        longitude: location.lng,
        barangay: profile.barangay || 'Poblacion',
        photo_url: publicUrl,
        ml_confidence: ml.confidence,
        ml_verified: ml.verified,
        is_low_credibility: false
      }).select('reference_number').single();
      if (error) throw error;

      try {
        await AsyncStorage.setItem('last_report_time', String(Date.now()));
      } catch (e) {
        console.warn('AsyncStorage write error', e);
      }

      Alert.alert('Success', `Report submitted. Reference: ${inserted?.reference_number || 'N/A'}`);
      setDescription('');
      setImageUri(null);
      setRawCaptureUri(null);
      fetchReports();
      // Re-fetch a fresh fix for a possible next report instead of leaving
      // the field blank until the citizen navigates away and back.
      getLocation();
    } catch (err: any) {
      Alert.alert('Submission Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <View style={[globalStyles.screen, { backgroundColor: T.bg }]}>
        <View style={{ padding: 20, paddingBottom: 10 }}>
          <Text style={[globalStyles.serif, { color: T.text, fontSize: 28 }]}>Report.</Text>
          <Text style={[globalStyles.muted, { color: T.textMuted, marginTop: 6, marginBottom: 16 }]}>
            Help your barangay · live photo + automatic GPS
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          {!verified && (
            <View style={[styles.verificationBanner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#B45309" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#92400E', fontWeight: '700', fontSize: 14 }}>Verification Required</Text>
                  <Text style={{ color: '#A16207', fontSize: 12, marginTop: 2 }}>Verify your identity to submit community reports.</Text>
                </View>
                <TouchableOpacity
                  style={[styles.verifyBtn, { backgroundColor: '#B45309' }]}
                  onPress={() => navigation.navigate('VerifyIdentity')}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border }]}>
            <Text style={[globalStyles.label, { color: T.textMuted }]}>CATEGORY</Text>
            <View style={styles.catGrid}>
              {REPORT_CATEGORIES.map(cat => {
                const active = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catItem, { backgroundColor: active ? T.text : T.cardAlt, borderColor: T.border }]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Ionicons name={cat.icon as any} size={18} color={active ? T.bg : T.text} style={{ marginRight: 8 }} />
                    <Text style={{ color: active ? T.bg : T.text, fontSize: 13, fontWeight: '600' }}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[globalStyles.label, { color: T.textMuted, marginTop: 14 }]}>DESCRIPTION</Text>
            <TextInput
              style={[globalStyles.input, { color: T.text, backgroundColor: T.cardAlt, borderColor: T.border, height: 80, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Provide detail (e.g. Deep pothole near the school gate, leaning electric pole...)"
              placeholderTextColor={T.textMuted}
              multiline
            />

            <Text style={[globalStyles.label, { color: T.textMuted, marginTop: 14 }]}>PHOTO EVIDENCE (MANDATORY — LIVE CAMERA ONLY)</Text>
            {rawCaptureUri ? (
              /* Review step: the stamp composite is rendered ON-SCREEN (not
                 hidden/off-screen) so the capture below is reliable — this
                 view is what captureRef() bakes into the final photo. */
              <View style={[styles.stampPreviewCard, { backgroundColor: T.cardAlt, borderColor: T.border }]}>
                <View ref={previewRef} collapsable={false} style={styles.stampComposite}>
                  <Image source={{ uri: rawCaptureUri }} style={styles.stampImage} resizeMode="cover" />
                  <View style={styles.stampCaptionBar}>
                    <Text style={styles.stampCaptionTitle} numberOfLines={1}>
                      {location?.address || 'Location unavailable'}
                    </Text>
                    <Text style={styles.stampCaptionSub}>
                      {location ? `Lat ${location.lat.toFixed(6)}  Long ${location.lng.toFixed(6)}` : ''}
                    </Text>
                    <Text style={styles.stampCaptionSub}>{captureTimestamp}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.stampActionBtn, { backgroundColor: T.card, borderColor: T.border, borderWidth: 1 }]}
                    onPress={retakePhoto}
                    disabled={stamping}
                  >
                    <Text style={{ color: T.text, fontWeight: '600' }}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stampActionBtn, { backgroundColor: ACCENT }]}
                    onPress={confirmStampedPhoto}
                    disabled={stamping}
                  >
                    {stamping ? <ActivityIndicator size="small" color="#1A1A1A" /> : <Text style={{ color: '#1A1A1A', fontWeight: '700' }}>Use This Photo</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.photoCard, { backgroundColor: T.cardAlt, borderColor: T.border }]}
                onPress={takePhoto}
              >
                {imageUri ? (
                  <View style={styles.imageAttachedContainer}>
                    <Image source={{ uri: imageUri }} style={styles.attachedImage} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: T.text, fontWeight: '600', fontSize: 14 }}>Photo attached</Text>
                      <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Tap to retake photo</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.removeImageBtn, { backgroundColor: T.border, marginRight: 4 }]}
                      onPress={() => setImageUri(null)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#E11D48" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholderContainer}>
                    <Ionicons name="camera-outline" size={24} color={T.textMuted} style={{ marginRight: 12 }} />
                    <View>
                      <Text style={{ color: T.text, fontWeight: '600', fontSize: 14 }}>Take incident photo</Text>
                      <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Live camera only — required to prevent false/troll reports</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            )}

            <Text style={[globalStyles.label, { color: T.textMuted, marginTop: 4 }]}>LOCATION (AUTOMATIC)</Text>
            <TouchableOpacity
              style={[styles.locationCard, { backgroundColor: T.cardAlt, borderColor: locationDenied ? '#F87171' : T.border }]}
              onPress={getLocation}
              disabled={loadingLoc}
            >
              <View style={[styles.locationIcon, { backgroundColor: location ? PASTELS.sage : locationDenied ? '#FEE2E2' : T.card }]}>
                {loadingLoc ? (
                  <ActivityIndicator size="small" color={T.text} />
                ) : (
                  <Ionicons name={locationDenied ? 'warning-outline' : 'location-outline'} size={20} color={locationDenied ? '#DC2626' : T.text} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: locationDenied ? '#DC2626' : T.text, fontWeight: '600', fontSize: 14 }}>
                  {loadingLoc ? 'Getting your location…' : location ? 'GPS location locked' : locationDenied ? 'Location is off' : 'Waiting for location…'}
                </Text>
                <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                  {location
                    ? location.address
                    : locationDenied
                    ? 'Enable location access, then tap to retry'
                    : 'Fetching GPS automatically…'}
                </Text>
              </View>
              {locationDenied && (
                <TouchableOpacity
                  style={[styles.settingsBtn, { backgroundColor: '#DC2626' }]}
                  onPress={() => Linking.openSettings()}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Settings</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {location && (
              <View style={[styles.mapContainer, { borderColor: T.border }]}>
                <MapView
                  style={StyleSheet.absoluteFillObject}
                  initialRegion={{
                    latitude: location.lat,
                    longitude: location.lng,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker coordinate={{ latitude: location.lat, longitude: location.lng }} />
                </MapView>
              </View>
            )}

            <TouchableOpacity
              style={[globalStyles.primaryButton, { backgroundColor: !verified ? '#D1D5DB' : ACCENT, marginTop: 14 }]}
              onPress={verified ? submitReport : () => navigation.navigate('VerifyIdentity')}
              disabled={submitting || !verified}
            >
              <Text style={[globalStyles.primaryButtonText, { color: !verified ? '#9CA3AF' : '#1A1A1A' }]}>
                {!verified ? 'Verify to Submit' : submitting ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </View>

          {reports.length > 0 && (
            <>
              <View style={globalStyles.sectionHeader}>
                <Text style={[globalStyles.sectionTitle, { color: T.text }]}>My reports</Text>
              </View>
              {reports.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.requestCard, { backgroundColor: T.card, borderColor: T.border }]}
                  onPress={() => navigation.navigate('TrackingDetail', { id: r.id, type: 'report' })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: T.textMuted, fontSize: 12, fontWeight: '600' }}>{r.reference_number}</Text>
                    <Text style={{ color: T.text, fontSize: 16, fontWeight: '600', marginTop: 2 }}>{reportCategoryLabel(r.category)}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: PASTELS.blue }]}>
                    <Text style={styles.statusPillText}>{r.status}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  verificationBanner: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 14 },
  verifyBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catItem: { flex: 1, minWidth: '45%', padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  catLabel: { fontSize: 14, fontWeight: '600', marginLeft: 8 },
  locationCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  locationIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  requestCard: { flexDirection: 'row', padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', marginBottom: 12 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  statusPillText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
  mapContainer: { height: 150, borderRadius: 12, overflow: 'hidden', marginTop: 12, borderWidth: 1 },
  photoCard: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  imageAttachedContainer: { flexDirection: 'row', alignItems: 'center' },
  attachedImage: { width: 50, height: 50, borderRadius: 8 },
  removeImageBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  settingsBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginLeft: 8 },
  stampPreviewCard: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  stampComposite: { width: '100%', aspectRatio: 4 / 3, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' },
  stampImage: { width: '100%', height: '100%' },
  stampCaptionBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 8 },
  stampCaptionTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  stampCaptionSub: { color: '#E5E7EB', fontSize: 11, marginTop: 2 },
  stampActionBtn: { flex: 1, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
