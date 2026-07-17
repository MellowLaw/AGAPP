import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Image, Modal, FlatList, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { globalStyles } from '../theme';
import { supabase } from '../../supabaseClient';
import { useToast } from '../components/Toast';
import { GuidedCapture } from '../components/GuidedCapture';
import {
  ID_TYPES, getVerificationStatus, statusLabel,
} from '../utils/verification';
import {
  ArrowLeft2,
  ArrowDown2,
  Camera,
  TickCircle,
  Warning2,
  Lock,
  CloseSquare,
  Check,
  InfoCircle,
} from 'iconsax-react-native';

// ---- guarded API helpers (mirrors utils/mlAnalysis.ts's fetch/timeout/error
// pattern exactly) — both are best-effort and must never block the flow. ----

async function extractIdText(photoUrl: string, accessToken?: string | null): Promise<string | null> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    const response = await fetch(`${apiUrl}/verification/extract-id-text`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ photoUrl }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data?.text === 'string' ? data.text : null;
  } catch {
    return null;
  }
}

type StepKey = 'id_front' | 'residency' | 'selfie' | 'review';
type ActiveCapture = 'id_front' | 'selfie' | null;

const STEP_LABEL: Record<StepKey, string> = {
  id_front: 'ID photo',
  residency: 'Residency',
  selfie: 'Selfie',
  review: 'Review',
};

export function VerifyIdentityScreen({ navigation }: any) {
  const { T, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const { profile, selectedLgu, session, refreshProfile } = useAuth();

  const [idType, setIdType] = useState<typeof ID_TYPES[number]['value']>('PhilSys');

  // Order: ID front -> Residency (OCR-prefilled) -> Selfie -> Review. See
  // Docs/Planning/Plan-ID-Verification-Redesign.md for the reasoning.
  const stepKeys: StepKey[] = ['id_front', 'residency', 'selfie', 'review'];

  const [step, setStep] = useState(0);
  const currentKey = stepKeys[step] ?? 'id_front';

  // Which guided-capture flow is currently open full-screen, if any.
  const [activeCapture, setActiveCapture] = useState<ActiveCapture>(null);

  // ID front
  const [idFrontUri, setIdFrontUri] = useState<string | null>(null);
  const [idFrontPath, setIdFrontPath] = useState<string | null>(null);
  const [processingIdFront, setProcessingIdFront] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [ocrNoteDismissed, setOcrNoteDismissed] = useState(false);

  // Selfie
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [selfiePath, setSelfiePath] = useState<string | null>(null);
  const [processingSelfie, setProcessingSelfie] = useState(false);

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

  // ----- storage helpers -----
  const uploadPrivate = async (
    uri: string,
    kind: 'id_front' | 'selfie',
  ): Promise<string> => {
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
      throw new Error('Photo is larger than 10MB.');
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

  const getSignedUrl = async (path: string): Promise<string | null> => {
    try {
      const { data } = await supabase.storage.from('citizen-ids').createSignedUrl(path, 300);
      return data?.signedUrl || null;
    } catch {
      return null;
    }
  };

  // ----- OCR autofill (best-effort — never blocks) -----
  const prefillFromOcr = (text: string) => {
    const zipMatch = text.match(/\b\d{4}\b/);
    if (zipMatch && !zipCode.trim()) setZipCode(zipMatch[0]);
    if (!streetAddress.trim()) setStreetAddress(text.trim());
  };

  // ----- guided-capture completion handlers -----
  const handleIdFrontCapture = async (uri: string) => {
    setActiveCapture(null);
    setProcessingIdFront(true);
    try {
      const path = await uploadPrivate(uri, 'id_front');
      setIdFrontUri(uri);
      setIdFrontPath(path);

      const signedUrl = await getSignedUrl(path);
      if (signedUrl) {
        const text = await extractIdText(signedUrl, session?.access_token);
        if (text) {
          setOcrText(text);
          setOcrNoteDismissed(false);
          prefillFromOcr(text);
        }
      }
    } catch (err: any) {
      showToast(`Could not upload your ID photo: ${err?.message || 'please try again.'}`, 'error');
    } finally {
      setProcessingIdFront(false);
    }
  };

  const handleSelfieCapture = async (uri: string) => {
    setActiveCapture(null);
    setSelfieUri(uri);
    setProcessingSelfie(true);
    try {
      const path = await uploadPrivate(uri, 'selfie');
      setSelfiePath(path);
    } catch (err: any) {
      showToast(`Could not upload your selfie: ${err?.message || 'please try again.'}`, 'error');
    } finally {
      setProcessingSelfie(false);
    }
  };

  const resetSelfieAndRestart = () => {
    setSelfieUri(null);
    setSelfiePath(null);
    setActiveCapture('selfie');
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
    if (!idFrontPath || !selfiePath) {
      showToast('Please complete your ID and selfie photos.', 'error');
      return;
    }

    const activeBarangay = getActiveBarangay();
    const activeCity = getActiveCity();
    const activeProvince = getActiveProvince();
    const activeRegion = getActiveRegion();

    if (!activeBarangay || !activeCity || !activeRegion || !streetAddress.trim() || !zipCode.trim()) {
      showToast('Please complete all address fields.', 'error');
      setStep(stepKeys.indexOf('residency'));
      return;
    }

    setSubmitting(true);
    try {
      const fullAddress = `${streetAddress.trim()}, Brgy. ${activeBarangay}, ${activeCity}, ${activeProvince ? activeProvince + ', ' : ''}${activeRegion}, ${zipCode.trim()}`;

      // ID photo and selfie are uploaded progressively during their own steps
      // (not batched here) — this call is a single atomic RPC that just
      // records the already-known paths.
      const { error: reqError } = await supabase.rpc('submit_verification_request', {
        p_lgu_id: lguId,
        p_id_type: idType,
        p_id_document_path: idFrontPath,
        p_selfie_path: selfiePath,
        p_declared_barangay: fullAddress,
      });
      if (reqError) throw reqError;

      await refreshProfile();

      showToast(
        'Submitted for review. Your ID and selfie have been securely uploaded. Your LGU will review your verification, usually within 1–2 business days.',
        'success',
      );
      navigation.goBack();
    } catch (err: any) {
      showToast(
        `Submission failed: ${err?.message || 'Please try again.'}`,
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canNextForStep = (key: StepKey): boolean => {
    switch (key) {
      case 'id_front': return !!idFrontPath && !processingIdFront;
      case 'residency':
        return !!streetAddress.trim() &&
          !!zipCode.trim() &&
          !!getActiveBarangay() &&
          !!getActiveCity() &&
          !!getActiveRegion();
      case 'selfie': return !!selfiePath && !processingSelfie;
      case 'review': return true;
      default: return false;
    }
  };

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
          {stepKeys.map((key, i) => (
            <View key={key} style={styles.stepItem}>
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
              <Text style={{ fontSize: 11, fontFamily: 'Inter-Medium', color: i <= step ? T.text : T.textMuted, marginTop: 4 }}>{STEP_LABEL[key]}</Text>
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

          {/* STEP — ID front */}
          {currentKey === 'id_front' && (
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 4, fontSize: 24 }}>Photograph your ID</Text>
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginBottom: 8, fontSize: 13, lineHeight: 18 }}>
                  Use a government-issued ID. Camera only — align it within the frame for a clean, auto-cropped capture.
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
                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 8 }}>ID PHOTO — FRONT</Text>
                {idFrontUri ? (
                  <View>
                    <Image source={{ uri: idFrontUri }} style={[styles.preview, { borderColor: T.border }]} resizeMode="contain" />
                    {processingIdFront && <ActivityIndicator style={{ marginTop: 8 }} color={T.text} />}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <SecondaryButton T={T} icon={Camera} label="Retake" onPress={() => setActiveCapture('id_front')} />
                    </View>
                  </View>
                ) : processingIdFront ? (
                  <View style={[styles.preview, { borderColor: T.border, alignItems: 'center', justifyContent: 'center' }]}>
                    <ActivityIndicator color={T.text} />
                    <Text style={{ color: T.textMuted, marginTop: 8, fontFamily: 'Inter-Medium', fontSize: 13 }}>Uploading…</Text>
                  </View>
                ) : (
                  <CaptureEntryButton T={T} label="Open camera" onPress={() => setActiveCapture('id_front')} />
                )}
              </View>
            </View>
          )}

          {/* STEP — Residency */}
          {currentKey === 'residency' && (
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 4, fontSize: 24 }}>Confirm residency</Text>
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginBottom: 8, fontSize: 13, lineHeight: 18 }}>
                  Enter your address printed on your ID. Your LGU admin will visually confirm it matches.
                </Text>
              </View>

              {/* OCR autofill note — only when we actually scanned something */}
              {!!ocrText && !ocrNoteDismissed && (
                <View style={[styles.notice, { backgroundColor: T.cardAlt, borderColor: T.border }]}>
                  <InfoCircle size={20} color={T.textMuted} variant="Bold" />
                  <Text style={[styles.noticeText, { color: T.textMuted, fontFamily: 'Inter-Medium' }]}>
                    We scanned your ID — please review and edit the address below.
                  </Text>
                  <TouchableOpacity onPress={() => setOcrNoteDismissed(true)}>
                    <CloseSquare size={18} color={T.textMuted} variant="Bold" />
                  </TouchableOpacity>
                </View>
              )}

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

          {/* STEP — Selfie */}
          {currentKey === 'selfie' && (
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 4, fontSize: 24 }}>Capture a selfie</Text>
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginBottom: 8, fontSize: 13, lineHeight: 18 }}>
                  Look straight at the camera and align your face within the frame.
                </Text>
              </View>

              <View>
                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 8 }}>YOUR PORTRAIT PHOTO</Text>
                {selfieUri ? (
                  <View>
                    <Image source={{ uri: selfieUri }} style={[styles.previewSquare, { borderColor: T.border }]} resizeMode="contain" />
                    {processingSelfie && <ActivityIndicator style={{ marginTop: 8 }} color={T.text} />}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <SecondaryButton T={T} icon={Camera} label="Retake" onPress={resetSelfieAndRestart} />
                    </View>
                  </View>
                ) : processingSelfie ? (
                  <View style={[styles.previewSquare, { borderColor: T.border, alignItems: 'center', justifyContent: 'center' }]}>
                    <ActivityIndicator color={T.text} />
                    <Text style={{ color: T.textMuted, marginTop: 8, fontFamily: 'Inter-Medium', fontSize: 13 }}>Uploading…</Text>
                  </View>
                ) : (
                  <CaptureEntryButton T={T} label="Start selfie capture" onPress={() => setActiveCapture('selfie')} />
                )}
              </View>
            </View>
          )}

          {/* STEP — Review */}
          {currentKey === 'review' && (
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
              onPress={() => setStep(step - 1)}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text style={{ color: T.text, fontFamily: 'Octarine-Bold', fontSize: 15 }}>Back</Text>
            </TouchableOpacity>
          )}
          {currentKey !== 'review' ? (
            <TouchableOpacity
              style={{
                height: 52,
                borderRadius: 999, // Pill layout
                backgroundColor: canNextForStep(currentKey) ? T.text : T.chip,
                flex: 2,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => canNextForStep(currentKey) && setStep(step + 1)}
              disabled={!canNextForStep(currentKey)}
              activeOpacity={0.8}
            >
              <Text style={{ color: canNextForStep(currentKey) ? T.bg : T.textMuted, fontFamily: 'Octarine-Bold', fontSize: 15 }}>Continue</Text>
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

        {/* Full-screen guided camera capture (ID front, selfie) */}
        {activeCapture && (
          <GuidedCapture
            key={activeCapture}
            guideShape={activeCapture === 'selfie' ? 'oval' : 'card'}
            cameraFacing={activeCapture === 'selfie' ? 'front' : 'back'}
            instructionText={
              activeCapture === 'id_front' ? 'Align your ID within the frame' :
              'Look at the camera and align your face within the frame'
            }
            onCapture={activeCapture === 'id_front' ? handleIdFrontCapture : handleSelfieCapture}
            onCancel={() => setActiveCapture(null)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ---- small presentational helpers ----

function CaptureEntryButton({ T, label, onPress }: { T: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={{
        backgroundColor: T.cardAlt,
        borderWidth: 1,
        borderColor: T.border,
        borderRadius: 20,
        alignItems: 'center',
        paddingVertical: 28,
      }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Camera size={28} color={T.text} variant="Bold" />
      <Text style={{ color: T.text, fontSize: 14, fontFamily: 'Octarine-Bold', marginTop: 8 }}>{label}</Text>
    </TouchableOpacity>
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
