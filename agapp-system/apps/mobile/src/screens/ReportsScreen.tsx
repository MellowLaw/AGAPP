import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, Linking, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { isVerified } from '../utils/verification';
import { analyzeReportPhoto } from '../utils/mlAnalysis';
import { reportCategoryLabel } from '@agapp/shared';
import { useToast } from '../components/Toast';
import { ScreenBackground } from '../components/ScreenBackground';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';
import {
  Car,
  Drop,
  Pet,
  Flash,
  Camera,
  Location as LocationIcon,
  InfoCircle,
  Trash,
  ShieldTick,
  ArrowLeft2,
  Danger,
} from 'iconsax-react-native';

const REPORT_CATEGORIES = [
  { id: 'pothole',          label: 'Pothole', icon: Car },
  { id: 'clogged_drainage', label: 'Drainage', icon: Drop },
  { id: 'stray_animal',     label: 'Stray Pets', icon: Pet },
  { id: 'damaged_pole',     label: 'Damaged Pole', icon: Flash },
];

export function ReportsScreen({ navigation }: any) {
  const { T, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const { selectedLgu, profile, session } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [category, setCategory] = useState('pothole');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<any>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingPhoto, setCheckingPhoto] = useState(false);
  const [rawCaptureUri, setRawCaptureUri] = useState<string | null>(null);
  const [captureTimestamp, setCaptureTimestamp] = useState('');
  const [stamping, setStamping] = useState(false);
  const previewRef = useRef<View>(null);
  const verified = isVerified(profile);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'my_reports'>('reports');

  useEffect(() => {
    if (!profile) return;
    fetchReports();
  }, [profile]);

  const withdrawReport = (reportId: string) => {
    Alert.alert(
      'Withdraw report?',
      'This will cancel your submitted report. This cannot be undone.',
      [
        { text: 'Keep report', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.rpc('cancel_report', { p_report_id: reportId });
            if (error) {
              showToast(error.message, 'error');
            } else {
              showToast('Report withdrawn.', 'success');
              fetchReports();
            }
          },
        },
      ],
    );
  };

  const fetchReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('citizen_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) setReports(data);
  };

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c;
  };

  const takePhoto = async () => {
    if (!location) {
      showToast("We're still getting your location. Please wait a moment and try again.", 'info');
      if (!loadingLoc) getLocation();
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showToast('We need access to your camera to take a photo of the incident.', 'error');
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

  const confirmStampedPhoto = async () => {
    if (!previewRef.current) return;
    setStamping(true);
    try {
      const uri = await captureRef(previewRef, { format: 'jpg', quality: 0.85 });
      setImageUri(uri);
      setRawCaptureUri(null);
    } catch (err) {
      console.warn('Photo stamping failed, falling back to the unstamped photo', err);
      showToast('Could not add the location stamp, but your photo is still attached.', 'error');
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
      console.warn('Location fetch failed', err);
    } finally {
      setLoadingLoc(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getLocation();
    }, [selectedLgu?.id])
  );

  const submitReport = async () => {
    try {
      const lastReportTimeStr = await AsyncStorage.getItem('last_report_time');
      if (lastReportTimeStr) {
        const lastReportTime = parseInt(lastReportTimeStr, 10);
        const diff = Date.now() - lastReportTime;
        if (diff < 120000) {
          const secsLeft = Math.ceil((120000 - diff) / 1000);
          showToast(`Please wait ${secsLeft} seconds before submitting another report.`, 'info');
          return;
        }
      }
    } catch (e) {
      console.warn('AsyncStorage read error', e);
    }

    const cleanDesc = description.trim().replace(/<[^>]*>/g, '');
    if (cleanDesc.length < 15) {
      showToast('Please write a descriptive explanation of the issue (minimum 15 characters).', 'error');
      return;
    }

    if (!imageUri) {
      showToast('Please attach a photo as evidence of the issue.', 'error');
      return;
    }

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
        showToast("We're still getting your GPS location. Please wait a moment and try again.", 'info');
        if (!loadingLoc) getLocation();
      }
      return;
    }

    if (selectedLgu?.latitude && selectedLgu?.longitude) {
      const dist = getDistanceFromLatLonInKm(location.lat, location.lng, selectedLgu.latitude, selectedLgu.longitude);
      if (dist > 15) {
        showToast(
          `Outside Municipal Boundary: your coordinates (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}) are ${dist.toFixed(1)}km away from ${selectedLgu.name || 'the selected municipality'}. Reports can only be submitted within municipal boundaries.`,
          'error'
        );
        return;
      }
    }
    setSubmitting(true);
    let publicUrl = null;

    try {
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();

      if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
        showToast('Selected image must be less than 5MB.', 'error');
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
      showToast(`Failed to upload photo: ${err.message}. Your report is still filled in — tap Submit Report to try again.`, 'error');
      setSubmitting(false);
      return;
    }

    try {
      setCheckingPhoto(true);
      const ml = await analyzeReportPhoto(category, publicUrl, session?.access_token);
      setCheckingPhoto(false);

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

      showToast(`Report submitted. Reference: ${inserted?.reference_number || 'N/A'}`, 'success');
      setDescription('');
      setImageUri(null);
      setRawCaptureUri(null);
      setShowForm(false);
      setActiveTab('my_reports');
      fetchReports();
      getLocation();
    } catch (err: any) {
      showToast(`Submission error: ${err.message}. Your report is still filled in — tap Submit Report to try again.`, 'error');
    } finally {
      setSubmitting(false);
      setCheckingPhoto(false);
    }
  };

  const getStatusBadge = (status: string) => {
    let bgColor = '#E5E7EB';
    let textColor = '#374151';

    switch (status?.toLowerCase()) {
      case 'submitted':
        bgColor = '#E0F2FE';
        textColor = '#0369A1';
        break;
      case 'in progress':
      case 'processing':
        bgColor = '#FEF3C7';
        textColor = '#D97706';
        break;
      case 'resolved':
      case 'completed':
      case 'approved':
        bgColor = '#D1FAE5';
        textColor = '#059669';
        break;
      case 'rejected':
      case 'cancelled':
        bgColor = '#FEE2E2';
        textColor = '#DC2626';
        break;
    }

    return (
      <View style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: bgColor,
      }}>
        <Text style={{
          fontSize: 9,
          fontFamily: 'Octarine-Bold',
          color: textColor,
          textTransform: 'uppercase',
        }}>{status}</Text>
      </View>
    );
  };


  if (showForm) {
    return (
      <ScreenBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <TouchableOpacity
              style={{ marginBottom: 16 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => setShowForm(false)}
            >
              <ArrowLeft2 size={30} color={T.text} variant="Outline" />
            </TouchableOpacity>

            <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 28, lineHeight: 32 }}>
              {REPORT_CATEGORIES.find(c => c.id === category)?.label || 'Report incident'}
            </Text>
            <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginTop: 4, marginBottom: 24, fontSize: 13 }}>
              Filing form · automatic timestamp & location stamp
            </Text>

            {!verified && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderRadius: 16,
                backgroundColor: '#FEF3C7',
                borderWidth: 1,
                borderColor: '#F59E0B',
                marginBottom: 16,
                gap: 10,
              }}>
                <ShieldTick size={24} color="#B45309" variant="Bold" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#92400E', fontFamily: 'Octarine-Bold', fontSize: 14 }}>Verification Required</Text>
                  <Text style={{ color: '#A16207', fontFamily: 'Inter-Medium', fontSize: 12, marginTop: 2 }}>Verify your identity to submit community reports.</Text>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#B45309',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 10,
                  }}
                  onPress={() => navigation.navigate('VerifyIdentity')}
                >
                  <Text style={{ color: '#fff', fontFamily: 'Octarine-Bold', fontSize: 12 }}>Verify</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{
              backgroundColor: T.card,
              borderWidth: 1,
              borderColor: T.border,
              borderRadius: 24,
              padding: 20,
            }}>
              <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>DESCRIPTION</Text>
              <TextInput
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: T.border,
                  backgroundColor: T.cardAlt,
                  color: T.text,
                  fontFamily: 'Inter-Medium',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 14,
                  height: 96,
                  textAlignVertical: 'top',
                  marginBottom: 16,
                }}
                value={description}
                onChangeText={setDescription}
                placeholder="Provide details (e.g. Deep pothole near the school gate, leaning electric pole...)"
                placeholderTextColor={T.textMuted}
                multiline
              />

              <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>PHOTO EVIDENCE (MANDATORY — LIVE CAMERA ONLY)</Text>
              {rawCaptureUri ? (
                <View style={{
                  padding: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: T.border,
                  backgroundColor: T.cardAlt,
                  marginBottom: 16,
                }}>
                  <View ref={previewRef} collapsable={false} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
                    <Image source={{ uri: rawCaptureUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10 }}>
                      <Text style={{ color: '#FFFFFF', fontFamily: 'Octarine-Bold', fontSize: 12 }} numberOfLines={1}>
                        {location?.address || 'Location unavailable'}
                      </Text>
                      <Text style={{ color: '#E5E7EB', fontFamily: 'Inter-Medium', fontSize: 10, marginTop: 2 }}>
                        {location ? `Lat ${location.lat.toFixed(6)}  Long ${location.lng.toFixed(6)}` : ''}
                      </Text>
                      <Text style={{ color: '#E5E7EB', fontFamily: 'Inter-Medium', fontSize: 10 }}>{captureTimestamp}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        height: 44,
                        borderRadius: 999,
                        backgroundColor: T.card,
                        borderColor: T.border,
                        borderWidth: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                      onPress={retakePhoto}
                      disabled={stamping}
                    >
                      <Text style={{ color: T.text, fontFamily: 'Octarine-Bold', fontSize: 13 }}>Retake</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        height: 44,
                        borderRadius: 999,
                        backgroundColor: T.accentSoft,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                      onPress={confirmStampedPhoto}
                      disabled={stamping}
                    >
                      {stamping ? <ActivityIndicator size="small" color="#292929" /> : <Text style={{ color: '#292929', fontFamily: 'Octarine-Bold', fontSize: 13 }}>Use Photo</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={{
                    padding: 12,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: T.border,
                    backgroundColor: T.cardAlt,
                    marginBottom: 16,
                  }}
                  onPress={takePhoto}
                >
                  {imageUri ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image source={{ uri: imageUri }} style={{ width: 48, height: 48, borderRadius: 10 }} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ color: T.text, fontFamily: 'Octarine-Bold', fontSize: 14 }}>Photo attached</Text>
                        <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 12, marginTop: 2 }}>Tap to retake photo</Text>
                      </View>
                      <TouchableOpacity
                        style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: T.card, justifyContent: 'center', alignItems: 'center' }}
                        onPress={() => setImageUri(null)}
                      >
                        <Trash size={16} color="#DC2626" variant="Bold" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
                      <Camera size={24} color={T.textMuted} variant="Bold" style={{ marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: T.text, fontFamily: 'Octarine-Bold', fontSize: 14 }}>Take incident photo</Text>
                        <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 12, marginTop: 2 }}>Live camera required (no uploads) to prevent fraud.</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>LOCATION (AUTOMATIC)</Text>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: locationDenied ? '#DC2626' : T.border,
                  backgroundColor: T.cardAlt,
                  marginBottom: 12,
                }}
                onPress={getLocation}
                disabled={loadingLoc}
              >
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: location ? T.accentSoft : locationDenied ? '#FEE2E2' : T.card,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  {loadingLoc ? (
                    <ActivityIndicator size="small" color={T.text} />
                  ) : (
                    <LocationIcon size={18} color={locationDenied ? '#DC2626' : location ? '#292929' : T.text} variant="Bold" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: locationDenied ? '#DC2626' : T.text, fontFamily: 'Octarine-Bold', fontSize: 14 }}>
                    {loadingLoc ? 'Getting coordinates…' : location ? 'GPS coordinates locked' : locationDenied ? 'GPS is disabled' : 'Waiting for GPS…'}
                  </Text>
                  <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                    {location ? location.address : locationDenied ? 'Enable location services, then tap to retry' : 'Locating automatically…'}
                  </Text>
                </View>
                {locationDenied && (
                  <TouchableOpacity
                    style={{ backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginLeft: 8 }}
                    onPress={() => Linking.openSettings()}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Octarine-Bold' }}>Settings</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {location && (
                <View style={{ height: 140, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: T.border, marginBottom: 16 }}>
                  <MapView
                    style={StyleSheet.absoluteFillObject}
                    initialRegion={{
                      latitude: location.lat,
                      longitude: location.lng,
                      latitudeDelta: 0.003,
                      longitudeDelta: 0.003,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                  >
                    <Marker coordinate={{ latitude: location.lat, longitude: location.lng }} />
                  </MapView>
                </View>
              )}

              <TouchableOpacity
                style={{
                  height: 52,
                  borderRadius: 999,
                  backgroundColor: !verified ? '#D1D5DB' : '#292929',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={verified ? submitReport : () => navigation.navigate('VerifyIdentity')}
                disabled={submitting || !verified}
              >
                <Text style={{
                  color: !verified ? '#9CA3AF' : '#FFFCF5',
                  fontFamily: 'Octarine-Bold',
                  fontSize: 15,
                }}>
                  {!verified ? 'Verify to Submit' : checkingPhoto ? 'Verifying photo…' : submitting ? 'Submitting...' : 'Submit Report'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

  // ── Catalog list view ───────────────────────────────────────────────────────
  return (
    <ScreenBackground>
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={{ flex: 1 }}>
        <View style={{ padding: 20, paddingBottom: 10 }}>
          <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 32 }}>Report.</Text>
          <Text style={{ fontFamily: 'Inter-Medium', color: T.text, marginTop: 4, fontSize: 14, lineHeight: 18 }}>
            Help us improve our city. File a report for local issues directly to the municipal departments.
          </Text>
        </View>

        {/* Tab navigation under title */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          marginTop: 8,
          marginBottom: 12,
          gap: 36,
        }}>
          <TouchableOpacity
            onPress={() => setActiveTab('reports')}
            activeOpacity={0.8}
            style={{ paddingBottom: 6 }}
          >
            <Text style={{
              color: activeTab === 'reports' ? T.text : T.textMuted,
              fontFamily: 'Octarine-Bold',
              fontSize: 18,
            }}>
              Reports
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('my_reports')}
            activeOpacity={0.8}
            style={{ paddingBottom: 6 }}
          >
            <Text style={{
              color: activeTab === 'my_reports' ? T.text : T.textMuted,
              fontFamily: 'Octarine-Bold',
              fontSize: 18,
            }}>
              My Reports
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {activeTab === 'reports' ? (
            /* Flat category selection card grid */
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {REPORT_CATEGORIES.map(cat => {
                const IconComp = cat.icon;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={{
                      width: '48%',
                      backgroundColor: T.card,
                      borderWidth: 1,
                      borderColor: T.border,
                      borderRadius: 20,
                      padding: 16,
                      marginBottom: 12,
                    }}
                    onPress={() => {
                      setCategory(cat.id);
                      setShowForm(true);
                    }}
                  >
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: T.accent,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}>
                      <IconComp size={18} color="#292929" variant="Bold" />
                    </View>
                    <Text style={{ fontSize: 15, fontFamily: 'Octarine-Bold', color: T.text, lineHeight: 18 }}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            /* Reports list directly inline */
            reports.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Danger size={48} color={T.textMuted} variant="Linear" style={{ marginBottom: 12 }} />
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, textAlign: 'center' }}>
                  You haven't submitted any incident reports yet.
                </Text>
              </View>
            ) : (
              reports.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={{
                    flexDirection: 'row',
                    padding: 16,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: T.border,
                    backgroundColor: T.card,
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                  onPress={() => {
                    navigation.navigate('TrackingDetail', { id: r.id, type: 'report' });
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ color: T.textMuted, fontSize: 11, fontFamily: 'Inter-Medium' }}>{r.reference_number}</Text>
                    <Text style={{ color: T.text, fontSize: 15, fontFamily: 'Octarine-Bold', marginTop: 2 }} numberOfLines={1}>{reportCategoryLabel(r.category)}</Text>
                  </View>
                  {r.status === 'Submitted' && (
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: T.border,
                        marginRight: 8,
                        backgroundColor: T.cardAlt,
                      }}
                      onPress={(e) => { e.stopPropagation(); withdrawReport(r.id); }}
                    >
                      <Text style={{ color: '#DC2626', fontSize: 11, fontFamily: 'Octarine-Bold' }}>Withdraw</Text>
                    </TouchableOpacity>
                  )}
                  {getStatusBadge(r.status)}
                </TouchableOpacity>
              ))
            )
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
    </ScreenBackground>
  );
}
