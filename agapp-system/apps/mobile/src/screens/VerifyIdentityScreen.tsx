import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Image, Modal, FlatList, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { globalStyles } from '../theme';
import { supabase } from '../../supabaseClient';
import { useToast } from '../components/Toast';
import {
  ID_TYPES, getVerificationStatus, statusLabel,
} from '../utils/verification';
import {
  ArrowLeft2,
  ArrowDown2,
  Camera,
  Image as ImageIcon,
  TickCircle,
  Warning2,
  Lock,
  CloseSquare,
  Check,
} from 'iconsax-react-native';

type Step = 0 | 1 | 2 | 3;

export function VerifyIdentityScreen({ navigation }: any) {
  const { T, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const { profile, selectedLgu, refreshProfile } = useAuth();

  const [step, setStep] = useState<Step>(0);
  const [idType, setIdType] = useState<typeof ID_TYPES[number]['value']>('PhilSys');
  const [idUri, setIdUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Address hierarchy states
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [barangaysList, setBarangaysList] = useState<any[]>([]);

  // Selected codes/names
  const [regionCode, setRegionCode] = useState('');
  const [regionName, setRegionName] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [provinceName, setProvinceName] = useState('');
  const [cityCode, setCityCode] = useState('');
  const [cityName, setCityName] = useState('');
  const [barangay, setBarangay] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Manual input fallbacks
  const [manualRegion, setManualRegion] = useState('');
  const [manualProvince, setManualProvince] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualBarangay, setManualBarangay] = useState('');

  // Loading states for dropdown data
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  const [pickerOpen, setPickerOpen] = useState<null | 'idType' | 'region' | 'province' | 'city' | 'barangay'>(null);
  const [searchText, setSearchText] = useState('');

  const [resolvedLgu, setResolvedLgu] = useState<any>(null);

  useEffect(() => {
    if (selectedLgu) {
      setResolvedLgu(selectedLgu);
    } else if (profile?.lgu_id) {
      supabase.from('lgus').select('*').eq('id', profile.lgu_id).single().then(({ data }) => {
        if (data) setResolvedLgu(data);
      });
    }
  }, [selectedLgu, profile]);

  const status = getVerificationStatus(profile);
  const lguId = resolvedLgu?.id || selectedLgu?.id || profile?.lgu_id;

  // Load regions on mount
  useEffect(() => {
    const loadRegions = async () => {
      setLoadingRegions(true);
      try {
        const res = await fetch('https://psgc.gitlab.io/api/regions/');
        if (!res.ok) throw new Error('Failed to fetch regions');
        const data = await res.json();
        data.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setRegions(data);
      } catch (err) {
        console.warn('Failed to load regions from API, toggling manual address fallback:', err);
        setUseManualAddress(true);
      } finally {
        setLoadingRegions(false);
      }
    };
    loadRegions();
  }, []);

  const handleSelectRegion = async (code: string, name: string) => {
    setRegionCode(code);
    setRegionName(name);
    
    // Reset lower levels
    setProvinceCode('');
    setProvinceName('');
    setProvinces([]);
    setCityCode('');
    setCityName('');
    setCities([]);
    setBarangay('');
    setBarangaysList([]);

    setLoadingProvinces(true);
    try {
      // 1. Fetch provinces under this region
      const res = await fetch(`https://psgc.gitlab.io/api/regions/${code}/provinces/`);
      if (res.ok) {
        const data = await res.json();
        data.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setProvinces(data);
        if (data.length > 0) {
          setLoadingProvinces(false);
          return; // Wait for province selection
        }
      }
    } catch (e) {
      console.warn('Region has no provinces, fetching cities directly:', e);
    } finally {
      setLoadingProvinces(false);
    }

    // 2. Fetch cities directly under region (like NCR)
    setLoadingCities(true);
    try {
      const cityRes = await fetch(`https://psgc.gitlab.io/api/regions/${code}/cities-municipalities/`);
      if (cityRes.ok) {
        const data = await cityRes.json();
        data.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setCities(data);
      }
    } catch (e) {
      console.error('Failed to load direct cities:', e);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleSelectProvince = async (code: string, name: string) => {
    setProvinceCode(code);
    setProvinceName(name);
    
    // Reset lower levels
    setCityCode('');
    setCityName('');
    setCities([]);
    setBarangay('');
    setBarangaysList([]);

    setLoadingCities(true);
    try {
      const res = await fetch(`https://psgc.gitlab.io/api/provinces/${code}/cities-municipalities/`);
      if (res.ok) {
        const data = await res.json();
        data.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setCities(data);
      }
    } catch (e) {
      console.error('Failed to load cities under province:', e);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleSelectCity = async (code: string, name: string) => {
    setCityCode(code);
    setCityName(name);
    
    // Reset barangay
    setBarangay('');
    setBarangaysList([]);

    setLoadingBarangays(true);
    try {
      const res = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${code}/barangays/`);
      if (res.ok) {
        const data = await res.json();
        data.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setBarangaysList(data);
      }
    } catch (e) {
      console.error('Failed to load barangays:', e);
    } finally {
      setLoadingBarangays(false);
    }
  };

  // ----- image capture -----
  const captureImage = async (
    setter: (u: string) => void,
    aspect: [number, number] = [4, 3],
    cameraFacing: 'back' | 'front' = 'back',
  ) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showToast('We need camera access to capture your ID.', 'error');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      cameraType: cameraFacing,
    } as any);
    if (!result.canceled && result.assets?.[0]?.uri) {
      setter(result.assets[0].uri);
    }
  };

  const pickFromLibrary = async (setter: (u: string) => void, aspect: [number, number] = [4, 3]) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('We need photo library access to pick your ID.', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setter(result.assets[0].uri);
    }
  };

  const uploadPrivate = async (uri: string, kind: 'id' | 'selfie'): Promise<string> => {
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
      throw new Error(`${kind === 'id' ? 'ID' : 'Selfie'} image is larger than 10MB.`);
    }
    const ext = (uri.split('.').pop() || 'jpg').toLowerCase();
    const path = `${lguId}/${profile.id}/${kind}_${Date.now()}.${ext === 'png' ? 'png' : 'jpg'}`;
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage
      .from('citizen-ids')
      .upload(path, arrayBuffer, { contentType, upsert: false });
    if (error) throw error;
    return path;
  };

  const getActiveBarangay = () => useManualAddress ? manualBarangay.trim() : barangay.trim();
  const getActiveCity = () => useManualAddress ? manualCity.trim() : cityName.trim();
  const getActiveProvince = () => useManualAddress ? manualProvince.trim() : provinceName.trim();
  const getActiveRegion = () => useManualAddress ? manualRegion.trim() : regionName.trim();

  const handleSubmit = async () => {
    if (!profile || !lguId) {
      showToast('Missing account or LGU. Please re-select your municipality.', 'error');
      return;
    }
    if (!idUri || !selfieUri) {
      showToast('Please capture both your ID and a selfie.', 'error');
      return;
    }

    const activeBarangay = getActiveBarangay();
    const activeCity = getActiveCity();
    const activeProvince = getActiveProvince();
    const activeRegion = getActiveRegion();

    if (!activeBarangay || !activeCity || !activeRegion || !streetAddress.trim() || !zipCode.trim()) {
      showToast('Please complete all address fields.', 'error');
      setStep(0);
      return;
    }

    setSubmitting(true);
    const uploadedPaths: string[] = [];
    try {
      // Synchronize the citizen's LGU ID to their users profile row
      // to satisfy the postgres RLS constraint on verification_requests.
      const { error: syncError } = await supabase
        .from('users')
        .update({ lgu_id: lguId })
        .eq('id', profile.id);
      if (syncError) throw syncError;

      const idPath = await uploadPrivate(idUri, 'id');
      uploadedPaths.push(idPath);
      const selfiePath = await uploadPrivate(selfieUri, 'selfie');
      uploadedPaths.push(selfiePath);

      const fullAddress = `${streetAddress.trim()}, Brgy. ${activeBarangay}, ${activeCity}, ${activeProvince ? activeProvince + ', ' : ''}${activeRegion}, ${zipCode.trim()}`;

      const { error: reqError } = await supabase.from('verification_requests').insert({
        user_id: profile.id,
        lgu_id: lguId,
        id_type: idType,
        id_document_path: idPath,
        selfie_path: selfiePath,
        declared_barangay: fullAddress,
        status: 'pending',
      });
      if (reqError) throw reqError;

      await refreshProfile();

      showToast(
        'Submitted for review. Your ID and selfie have been securely uploaded. Your LGU will review your verification, usually within 1–2 business days.',
        'success',
      );
      navigation.goBack();
    } catch (err: any) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from('citizen-ids').remove(uploadedPaths).catch(() => {});
      }

      const raw = err?.message || '';
      const isRls = err?.code === '42501' || /row-level security|policy/i.test(raw);
      showToast(
        isRls
          ? 'Submission failed: the municipality you selected doesn’t match your account. Please re-select your LGU and try again.'
          : `Submission failed: ${raw || 'Please try again.'} Your ID and selfie are still attached — tap Submit for review to try again.`,
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = [
    // Step 0 check
    !!streetAddress.trim() &&
      !!zipCode.trim() &&
      !!getActiveBarangay() &&
      !!getActiveCity() &&
      !!getActiveRegion(), 
    !!idUri,            // step 1
    !!selfieUri,        // step 2
    true,               // step 3
  ];

  const stepLabels = ['Residency', 'ID document', 'Selfie', 'Review'];

  if (status === 'verified' || status === 'pending') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
        <Image
          source={isDarkMode ? require('../../assets/brand/bg-map-2.png') : require('../../assets/brand/bg-map-1.png')}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100%', height: '100%',
            opacity: isDarkMode ? 0.04 : 0.07,
            tintColor: T.accent,
          }}
          resizeMode="cover"
        />
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: status === 'verified' ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
          }}>
            {status === 'verified' ? (
              <TickCircle size={44} color={isDarkMode ? '#4ADE80' : '#166534'} variant="Bold" />
            ) : (
              <Warning2 size={44} color={isDarkMode ? '#FBBF24' : '#854D0E'} variant="Bold" />
            )}
          </View>

          <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 24, textAlign: 'center', marginBottom: 12 }}>
            {status === 'verified' ? 'Already Verified' : 'Verification Pending'}
          </Text>
          <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20, marginBottom: 32 }}>
            {status === 'verified'
              ? 'Your identity has been verified. You can now use all city services and report community issues.'
              : 'Your verification request is currently under review by your LGU admin. This usually takes 1–2 business days.'}
          </Text>

          <TouchableOpacity
            style={{
              height: 52,
              borderRadius: 999,
              backgroundColor: '#292929',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
            }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: '#FFFCF5', fontFamily: 'Octarine-Bold', fontSize: 15 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Set up values for Picker Modal
  let pickerData: { key: string; label: string }[] = [];
  if (pickerOpen === 'idType') {
    pickerData = ID_TYPES.map(t => ({ key: t.value, label: t.label }));
  } else if (pickerOpen === 'region') {
    pickerData = regions.map(r => ({ key: r.code, label: r.regionName ? `${r.regionName} (${r.name})` : r.name }));
  } else if (pickerOpen === 'province') {
    pickerData = provinces.map(p => ({ key: p.code, label: p.name }));
  } else if (pickerOpen === 'city') {
    pickerData = cities.map(c => ({ key: c.code, label: c.name }));
  } else if (pickerOpen === 'barangay') {
    pickerData = barangaysList.map(b => ({ key: b.name, label: b.name }));
  }

  const filteredPickerData = pickerData.filter(item =>
    item.label.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      {/* Tinted Map Background */}
      <Image
        source={isDarkMode ? require('../../assets/brand/bg-map-2.png') : require('../../assets/brand/bg-map-1.png')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          opacity: isDarkMode ? 0.04 : 0.07,
          tintColor: T.accent,
        }}
        resizeMode="cover"
      />

      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: T.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft2 size={30} color={T.text} variant="Outline" />
          </TouchableOpacity>
          <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 18 }}>Verify Identity</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Stepper */}
        <View style={[styles.stepper, { borderBottomColor: T.border }]}>
          {stepLabels.map((label, i) => (
            <View key={label} style={styles.stepItem}>
              <View style={[
                styles.stepDot,
                {
                  backgroundColor: i <= step ? T.accentSoft : T.chip,
                  borderColor: i <= step ? T.accent : T.border,
                },
              ]}>
                {i < step ? (
                  <Check size={14} color="#292929" variant="Bold" />
                ) : (
                  <Text style={{ color: i <= step ? '#292929' : T.textMuted, fontFamily: 'Octarine-Bold', fontSize: 12 }}>{i + 1}</Text>
                )}
              </View>
              <Text style={{ fontSize: 11, fontFamily: 'Inter-Medium', color: i <= step ? T.text : T.textMuted, marginTop: 4 }}>{label}</Text>
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
          {/* Re-submit notice */}
          {status === 'rejected' && step === 0 && (
            <View style={[styles.notice, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Warning2 size={20} color="#DC2626" variant="Bold" />
              <Text style={[styles.noticeText, { color: '#991B1B', fontFamily: 'Inter-Medium' }]}>
                Your last submission was rejected
                {profile?.rejection_reason ? `: ${profile.rejection_reason}` : '.'} Please re-submit.
              </Text>
            </View>
          )}

          {/* STEP 0 — Residency */}
          {step === 0 && (
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 4, fontSize: 24 }}>Confirm residency</Text>
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginBottom: 8, fontSize: 13, lineHeight: 18 }}>
                  Enter your address printed on your ID. Your LGU admin will visually confirm it matches.
                </Text>
              </View>

              {/* LGU Prefill Card */}
              <View>
                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>VERIFYING MUNICIPALITY</Text>
                <View style={{
                  backgroundColor: T.cardAlt,
                  borderWidth: 1,
                  borderColor: T.border,
                  borderRadius: 14,
                  padding: 14,
                }}>
                  <Text style={{ color: T.text, fontSize: 15, fontFamily: 'Inter-SemiBold' }}>{resolvedLgu?.name || selectedLgu?.name || 'Loading LGU details...'}</Text>
                </View>
              </View>

              {/* Toggle switch for manual address */}
              <TouchableOpacity
                onPress={() => setUseManualAddress(!useManualAddress)}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 14,
                  backgroundColor: T.card,
                  borderColor: T.border,
                  borderWidth: 1,
                  borderRadius: 14,
                }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ color: T.text, fontFamily: 'Inter-SemiBold', fontSize: 13 }}>Offline / Address loading issue?</Text>
                  <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 11, marginTop: 2 }}>
                    Toggle this to type in your address manually instead of selecting.
                  </Text>
                </View>
                <View style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: useManualAddress ? T.accent : T.border,
                  padding: 2,
                  justifyContent: 'center',
                  alignItems: useManualAddress ? 'flex-end' : 'flex-start',
                }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' }} />
                </View>
              </TouchableOpacity>

              {/* Automatic cascade dropdowns */}
              {!useManualAddress ? (
                <>
                  {/* Region Selection */}
                  <View>
                    <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>REGION</Text>
                    <TouchableOpacity
                      style={[styles.dropdownBtn, { borderColor: T.border, backgroundColor: T.cardAlt }]}
                      onPress={() => {
                        setSearchText('');
                        setPickerOpen('region');
                      }}
                      activeOpacity={0.8}
                    >
                      {loadingRegions ? (
                        <ActivityIndicator size="small" color={T.text} />
                      ) : (
                        <Text style={{ color: regionName ? T.text : T.textMuted, fontSize: 14, fontFamily: 'Inter-Medium', flex: 1 }}>
                          {regionName || 'Select Region'}
                        </Text>
                      )}
                      <ArrowDown2 size={16} color={T.textMuted} variant="Bold" />
                    </TouchableOpacity>
                  </View>

                  {/* Province Selection (conditional) */}
                  {(provinces.length > 0 || loadingProvinces) && (
                    <View>
                      <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>PROVINCE</Text>
                      <TouchableOpacity
                        style={[styles.dropdownBtn, { borderColor: T.border, backgroundColor: T.cardAlt, opacity: !regionName ? 0.5 : 1 }]}
                        disabled={!regionName}
                        onPress={() => {
                          setSearchText('');
                          setPickerOpen('province');
                        }}
                        activeOpacity={0.8}
                      >
                        {loadingProvinces ? (
                          <ActivityIndicator size="small" color={T.text} />
                        ) : (
                          <Text style={{ color: provinceName ? T.text : T.textMuted, fontSize: 14, fontFamily: 'Inter-Medium', flex: 1 }}>
                            {provinceName || 'Select Province'}
                          </Text>
                        )}
                        <ArrowDown2 size={16} color={T.textMuted} variant="Bold" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* City/Municipality Selection */}
                  <View>
                    <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>CITY / MUNICIPALITY</Text>
                    <TouchableOpacity
                      style={[
                        styles.dropdownBtn, 
                        { 
                          borderColor: T.border, 
                          backgroundColor: T.cardAlt, 
                          opacity: (provinces.length > 0 && !provinceName) || !regionName ? 0.5 : 1 
                        }
                      ]}
                      disabled={(provinces.length > 0 && !provinceName) || !regionName}
                      onPress={() => {
                        setSearchText('');
                        setPickerOpen('city');
                      }}
                      activeOpacity={0.8}
                    >
                      {loadingCities ? (
                        <ActivityIndicator size="small" color={T.text} />
                      ) : (
                        <Text style={{ color: cityName ? T.text : T.textMuted, fontSize: 14, fontFamily: 'Inter-Medium', flex: 1 }}>
                          {cityName || 'Select City/Municipality'}
                        </Text>
                      )}
                      <ArrowDown2 size={16} color={T.textMuted} variant="Bold" />
                    </TouchableOpacity>
                  </View>

                  {/* Barangay Selection */}
                  <View>
                    <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>BARANGAY</Text>
                    <TouchableOpacity
                      style={[styles.dropdownBtn, { borderColor: T.border, backgroundColor: T.cardAlt, opacity: !cityName ? 0.5 : 1 }]}
                      disabled={!cityName}
                      onPress={() => {
                        setSearchText('');
                        setPickerOpen('barangay');
                      }}
                      activeOpacity={0.8}
                    >
                      {loadingBarangays ? (
                        <ActivityIndicator size="small" color={T.text} />
                      ) : (
                        <Text style={{ color: barangay ? T.text : T.textMuted, fontSize: 14, fontFamily: 'Inter-Medium', flex: 1 }}>
                          {barangay || 'Select Barangay'}
                        </Text>
                      )}
                      <ArrowDown2 size={16} color={T.textMuted} variant="Bold" />
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {/* Manual input form */}
                  <View style={{ gap: 12 }}>
                    <View>
                      <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>REGION (MANUAL)</Text>
                      <TextInput
                        style={[styles.textInput, { borderColor: T.border, backgroundColor: T.cardAlt, color: T.text, fontFamily: 'Inter-Medium' }]}
                        value={manualRegion}
                        onChangeText={setManualRegion}
                        placeholder="e.g. Region IV-A"
                        placeholderTextColor={T.textMuted}
                      />
                    </View>

                    <View>
                      <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>PROVINCE (MANUAL)</Text>
                      <TextInput
                        style={[styles.textInput, { borderColor: T.border, backgroundColor: T.cardAlt, color: T.text, fontFamily: 'Inter-Medium' }]}
                        value={manualProvince}
                        onChangeText={setManualProvince}
                        placeholder="e.g. Laguna"
                        placeholderTextColor={T.textMuted}
                      />
                    </View>

                    <View>
                      <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>CITY / MUNICIPALITY (MANUAL)</Text>
                      <TextInput
                        style={[styles.textInput, { borderColor: T.border, backgroundColor: T.cardAlt, color: T.text, fontFamily: 'Inter-Medium' }]}
                        value={manualCity}
                        onChangeText={setManualCity}
                        placeholder="e.g. Liliw"
                        placeholderTextColor={T.textMuted}
                      />
                    </View>

                    <View>
                      <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>BARANGAY (MANUAL)</Text>
                      <TextInput
                        style={[styles.textInput, { borderColor: T.border, backgroundColor: T.cardAlt, color: T.text, fontFamily: 'Inter-Medium' }]}
                        value={manualBarangay}
                        onChangeText={setManualBarangay}
                        placeholder="e.g. Poblacion I"
                        placeholderTextColor={T.textMuted}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Shared Address Fields */}
              <View>
                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>STREET ADDRESS / HOUSE NO.</Text>
                <TextInput
                  style={[styles.textInput, { borderColor: T.border, backgroundColor: T.cardAlt, color: T.text, fontFamily: 'Inter-Medium' }]}
                  value={streetAddress}
                  onChangeText={setStreetAddress}
                  placeholder="e.g. 123 Rizal St"
                  placeholderTextColor={T.textMuted}
                />
              </View>

              <View>
                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>ZIP CODE</Text>
                <TextInput
                  style={[styles.textInput, { borderColor: T.border, backgroundColor: T.cardAlt, color: T.text, fontFamily: 'Inter-Medium' }]}
                  value={zipCode}
                  onChangeText={setZipCode}
                  placeholder="e.g. 4004"
                  placeholderTextColor={T.textMuted}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          )}

          {/* STEP 1 — ID document */}
          {step === 1 && (
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 4, fontSize: 24 }}>Photograph your ID</Text>
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginBottom: 8, fontSize: 13, lineHeight: 18 }}>
                  Use a government-issued ID. Make sure all text is sharp and readable.
                </Text>
              </View>

              <View>
                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>ID TYPE</Text>
                <TouchableOpacity
                  style={[styles.dropdownBtn, { borderColor: T.border, backgroundColor: T.cardAlt }]}
                  onPress={() => setPickerOpen('idType')}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: T.text, fontSize: 15, fontFamily: 'Inter-Medium' }}>
                    {ID_TYPES.find(t => t.value === idType)?.label}
                  </Text>
                  <ArrowDown2 size={18} color={T.textMuted} variant="Bold" />
                </TouchableOpacity>
              </View>

              <View>
                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 8 }}>ID PHOTO</Text>
                {idUri ? (
                  <View>
                    <Image source={{ uri: idUri }} style={[styles.preview, { borderColor: T.border }]} resizeMode="contain" />
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <SecondaryButton T={T} icon={Camera} label="Retake" onPress={() => captureImage(setIdUri)} />
                      <SecondaryButton T={T} icon={ImageIcon} label="Choose" onPress={() => pickFromLibrary(setIdUri)} />
                    </View>
                  </View>
                ) : (
                  <CapturePicker
                    T={T}
                    onCamera={() => captureImage(setIdUri)}
                    onLibrary={() => pickFromLibrary(setIdUri)}
                  />
                )}
              </View>
            </View>
          )}

          {/* STEP 2 — Selfie */}
          {step === 2 && (
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 4, fontSize: 24 }}>Capture a selfie</Text>
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginBottom: 8, fontSize: 13, lineHeight: 18 }}>
                  We visually compare your face with your ID document to prevent identity fraud.
                </Text>
              </View>

              <View>
                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 8 }}>YOUR PORTRAIT PHOTO</Text>
                {selfieUri ? (
                  <View>
                    <Image source={{ uri: selfieUri }} style={[styles.previewSquare, { borderColor: T.border }]} resizeMode="contain" />
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <SecondaryButton T={T} icon={Camera} label="Retake" onPress={() => captureImage(setSelfieUri, [3, 4], 'front')} />
                      <SecondaryButton T={T} icon={ImageIcon} label="Choose" onPress={() => pickFromLibrary(setSelfieUri, [3, 4])} />
                    </View>
                  </View>
                ) : (
                  <CapturePicker
                    T={T}
                    onCamera={() => captureImage(setSelfieUri, [3, 4], 'front')}
                    onLibrary={() => pickFromLibrary(setSelfieUri, [3, 4])}
                  />
                )}
              </View>
            </View>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 4, fontSize: 24 }}>Review submission</Text>
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginBottom: 8, fontSize: 13, lineHeight: 18 }}>
                  Confirm all details are correct. You cannot modify them once submitted.
                </Text>
              </View>

              <View style={[globalStyles.card, { borderColor: T.border, backgroundColor: T.card, padding: 18, gap: 12 }]}>
                <ReviewRow T={T} label="ID Type" value={ID_TYPES.find(t => t.value === idType)?.label || idType} />
                <ReviewRow 
                  T={T} 
                  label="Declared Address" 
                  value={`${streetAddress.trim()}, Brgy. ${getActiveBarangay()}, ${getActiveCity()}, ${getActiveProvince() ? getActiveProvince() + ', ' : ''}${getActiveRegion()}, ${zipCode.trim()}`} 
                />
                
                <View style={{ borderTopWidth: 1, borderTopColor: T.border, paddingTop: 12, gap: 4, flexDirection: 'row', alignItems: 'center' }}>
                  <Lock size={16} color={T.textMuted} variant="Bold" style={{ marginRight: 6 }} />
                  <Text style={{ color: T.textMuted, fontSize: 11, fontFamily: 'Inter-Medium', flex: 1, lineHeight: 15 }}>
                    Your ID is private. Only LGU staff in {(resolvedLgu?.name || selectedLgu?.name || 'your municipality').replace('Municipality of ', '')} can view it for verification.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer nav */}
        <View style={[styles.footer, { backgroundColor: T.card, borderTopColor: T.border }]}>
          {step > 0 && (
            <TouchableOpacity
              style={{
                height: 52,
                borderRadius: 999, // Pill layout
                backgroundColor: T.chip,
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 8,
              }}
              onPress={() => setStep((step - 1) as Step)}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text style={{ color: T.text, fontFamily: 'Octarine-Bold', fontSize: 15 }}>Back</Text>
            </TouchableOpacity>
          )}
          {step < 3 ? (
            <TouchableOpacity
              style={{
                height: 52,
                borderRadius: 999, // Pill layout
                backgroundColor: canNext[step] ? T.text : T.chip,
                flex: 2,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => canNext[step] && setStep((step + 1) as Step)}
              disabled={!canNext[step]}
              activeOpacity={0.8}
            >
              <Text style={{ color: canNext[step] ? T.bg : T.textMuted, fontFamily: 'Octarine-Bold', fontSize: 15 }}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={{
                height: 52,
                borderRadius: 999, // Pill layout
                backgroundColor: T.accentSoft,
                flex: 2,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting
                ? <ActivityIndicator color="#292929" />
                : <Text style={{ color: '#292929', fontFamily: 'Octarine-Bold', fontSize: 15 }}>Submit for review</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* Dynamic Searchable Picker Modal */}
        <Modal visible={pickerOpen !== null} transparent animationType="slide" onRequestClose={() => setPickerOpen(null)}>
          <View style={styles.pickerOverlay}>
            <View style={[styles.pickerSheet, { backgroundColor: T.card, borderWidth: 1, borderColor: T.border }]}>
              <View style={[styles.pickerHeader, { borderBottomColor: T.border }]}>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 18 }}>
                  {pickerOpen === 'idType' && 'Select ID type'}
                  {pickerOpen === 'region' && 'Select Region'}
                  {pickerOpen === 'province' && 'Select Province'}
                  {pickerOpen === 'city' && 'Select City/Municipality'}
                  {pickerOpen === 'barangay' && 'Select Barangay'}
                </Text>
                <TouchableOpacity onPress={() => setPickerOpen(null)}>
                  <CloseSquare size={22} color={T.textMuted} variant="Bold" />
                </TouchableOpacity>
              </View>

              {/* Search filter for picker sheet */}
              {pickerOpen !== 'idType' && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                  <TextInput
                    style={[styles.textInput, { borderColor: T.border, backgroundColor: T.cardAlt, color: T.text, fontFamily: 'Inter-Medium', height: 44 }]}
                    placeholder="Search..."
                    placeholderTextColor={T.textMuted}
                    value={searchText}
                    onChangeText={setSearchText}
                  />
                </View>
              )}

              <FlatList
                data={filteredPickerData}
                keyExtractor={(item) => item.key}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => {
                  let selected = false;
                  if (pickerOpen === 'idType') selected = idType === item.key;
                  else if (pickerOpen === 'region') selected = regionCode === item.key;
                  else if (pickerOpen === 'province') selected = provinceCode === item.key;
                  else if (pickerOpen === 'city') selected = cityCode === item.key;
                  else if (pickerOpen === 'barangay') selected = barangay === item.key;

                  return (
                    <TouchableOpacity
                      style={[styles.pickerRow, { borderBottomColor: T.border }]}
                      onPress={() => {
                        if (pickerOpen === 'idType') {
                          setIdType(item.key as any);
                        } else if (pickerOpen === 'region') {
                          handleSelectRegion(item.key, item.label);
                        } else if (pickerOpen === 'province') {
                          handleSelectProvince(item.key, item.label);
                        } else if (pickerOpen === 'city') {
                          handleSelectCity(item.key, item.label);
                        } else if (pickerOpen === 'barangay') {
                          setBarangay(item.key);
                        }
                        setPickerOpen(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: T.text, fontSize: 15, fontFamily: 'Inter-Medium', flex: 1 }}>{item.label}</Text>
                      {selected && <TickCircle size={20} color={T.accent} variant="Bold" />}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// ---- small presentational helpers ----

function CapturePicker({ T, onCamera, onLibrary }: { T: any; onCamera: () => void; onLibrary: () => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <TouchableOpacity
        style={{
          backgroundColor: T.cardAlt,
          borderWidth: 1,
          borderColor: T.border,
          borderRadius: 20,
          flex: 1,
          alignItems: 'center',
          paddingVertical: 24,
        }}
        onPress={onCamera}
        activeOpacity={0.8}
      >
        <Camera size={28} color={T.text} variant="Bold" />
        <Text style={{ color: T.text, fontSize: 14, fontFamily: 'Octarine-Bold', marginTop: 8 }}>Take photo</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          backgroundColor: T.cardAlt,
          borderWidth: 1,
          borderColor: T.border,
          borderRadius: 20,
          flex: 1,
          alignItems: 'center',
          paddingVertical: 24,
        }}
        onPress={onLibrary}
        activeOpacity={0.8}
      >
        <ImageIcon size={28} color={T.text} variant="Bold" />
        <Text style={{ color: T.text, fontSize: 14, fontFamily: 'Octarine-Bold', marginTop: 8 }}>Choose</Text>
      </TouchableOpacity>
    </View>
  );
}

function SecondaryButton({ T, icon, label, onPress }: { T: any; icon: any; label: string; onPress: () => void }) {
  const IconComp = icon;
  return (
    <TouchableOpacity
      style={{
        backgroundColor: T.cardAlt,
        borderWidth: 1,
        borderColor: T.border,
        borderRadius: 999, // Pill layout
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
      }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <IconComp size={18} color={T.text} variant="Bold" style={{ marginRight: 6 }} />
      <Text style={{ color: T.text, fontFamily: 'Octarine-Bold', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function ReviewRow({ T, label, value }: { T: any; label: string; value: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 2 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: T.text, fontFamily: 'Inter-Medium', fontSize: 15, lineHeight: 20 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  stepper: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20,
    paddingVertical: 16, borderBottomWidth: 1,
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  preview: { width: '100%', height: 200, borderRadius: 16, borderWidth: 1 },
  previewSquare: { width: '100%', aspectRatio: 3 / 4, maxHeight: 320, borderRadius: 16, borderWidth: 1 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: 16, borderTopWidth: 1, paddingBottom: 32,
  },
  notice: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
    borderWidth: 1, marginBottom: 16, gap: 10,
  },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18 },
  pickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1,
  },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1,
  },
  dropdownBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  textInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
  },
});
