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
  ID_TYPES, BARANGAYS, DEFAULT_BARANGAYS, getVerificationStatus, statusLabel,
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
  Shield,
} from 'iconsax-react-native';

// ── Module-level PSGC cache ─────────────────────────────────────────────────
// Persists across remounts so the API is only called once per session.
// Provinces and cities are keyed by their parent code.
const _psgcCache: {
  regions?: any[];
  provinces: Record<string, any[]>;
  cities:    Record<string, any[]>;
} = { provinces: {}, cities: {} };

// ── AI analysis helper ──────────────────────────────────────────────────────
// Best-effort — never throws, always returns null on any failure.
async function runAiAnalysis(
  idPhotoPath: string,
  selfiePath: string,
  accessToken: string | null,
  supabaseClient: typeof supabase,
  apiUrl: string | undefined,
): Promise<{
  faceScore: number | null;
  confidenceScore: number | null;
  phash: string | null;
  flags: string[];
  processingMs: number | null;
} | null> {
  if (!apiUrl) return null;
  try {
    const [idRes, selfieRes] = await Promise.all([
      supabaseClient.storage.from('citizen-ids').createSignedUrl(idPhotoPath, 300),
      supabaseClient.storage.from('citizen-ids').createSignedUrl(selfiePath, 300),
    ]);
    const idUrl = idRes.data?.signedUrl;
    const selfieUrl = selfieRes.data?.signedUrl;
    if (!idUrl || !selfieUrl) return null;

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 35000);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    const res = await fetch(`${apiUrl}/verification/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ idPhotoSignedUrl: idUrl, selfieSignedUrl: selfieUrl }),
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[runAiAnalysis] Server returned HTTP ${res.status}: ${errText}`);
      return null;
    }
    return await res.json();
  } catch (err: any) {
    console.error('[runAiAnalysis] Fetch failed:', err?.message || err);
    return null;
  }
}

// ── OCR prefill helper ──────────────────────────────────────────────────────
// Tries to extract a clean street address from raw OCR text.
// Returns the best candidate or the trimmed first 200 chars as fallback.
function parseOcrStreetAddress(text: string): string {
  // Look for "Brgy." or "Barangay" as a delimiter — take what's before it
  const brgyIdx = text.search(/\b(brgy\.?|barangay)\b/i);
  if (brgyIdx > 5) {
    const before = text.substring(0, brgyIdx).replace(/\n/g, ' ').trim();
    if (before.length >= 4 && before.length <= 120) return before;
  }
  // Look for a house/lot number pattern at the start
  const houseMatch = text.match(/^(\d+[\w\s,.-]{4,100})/m);
  if (houseMatch) {
    const candidate = houseMatch[0].replace(/\n/g, ' ').trim();
    if (candidate.length <= 120) return candidate;
  }
  // Fallback: first 200 chars cleaned up
  return text.replace(/\n+/g, ', ').trim().substring(0, 200);
}

// ── OCR signed-URL extract ──────────────────────────────────────────────────
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
  id_front:  'ID photo',
  residency: 'Residency',
  selfie:    'Selfie',
  review:    'Review',
};

export function VerifyIdentityScreen({ navigation }: any) {
  const { T, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const { profile, selectedLgu, session, refreshProfile } = useAuth();

  const [idType, setIdType] = useState<typeof ID_TYPES[number]['value']>('PhilSys');

  const stepKeys: StepKey[] = ['id_front', 'residency', 'selfie', 'review'];
  const [step, setStep] = useState(0);
  const currentKey = stepKeys[step] ?? 'id_front';

  // Consent (shown before the main form)
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  // Which guided-capture flow is open
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

  // AI analysis
  const [aiResult, setAiResult] = useState<{
    faceScore: number | null;
    confidenceScore: number | null;
    phash: string | null;
    flags: string[];
    processingMs: number | null;
  } | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Address hierarchy states
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [regions, setRegions]       = useState<any[]>([]);
  const [provinces, setProvinces]   = useState<any[]>([]);
  const [cities, setCities]         = useState<any[]>([]);
  const [barangaysList, setBarangaysList] = useState<{ name: string }[]>([]);

  const [regionCode, setRegionCode]     = useState('');
  const [regionName, setRegionName]     = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [provinceName, setProvinceName] = useState('');
  const [cityCode, setCityCode]         = useState('');
  const [cityName, setCityName]         = useState('');
  const [barangay, setBarangay]         = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [zipCode, setZipCode]           = useState('');

  // Manual fallback
  const [manualRegion, setManualRegion]     = useState('');
  const [manualProvince, setManualProvince] = useState('');
  const [manualCity, setManualCity]         = useState('');
  const [manualBarangay, setManualBarangay] = useState('');

  // Loading states
  const [loadingRegions, setLoadingRegions]     = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities]       = useState(false);

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
  const lguId  = resolvedLgu?.id || selectedLgu?.id || profile?.lgu_id;
  const lguName = (resolvedLgu?.name || selectedLgu?.name || 'your municipality').replace('Municipality of ', '');

  // Load regions on mount (with session-level caching to avoid repeated API calls)
  useEffect(() => {
    const loadRegions = async () => {
      if (_psgcCache.regions) { setRegions(_psgcCache.regions); return; }
      setLoadingRegions(true);
      try {
        const res = await fetch('https://psgc.gitlab.io/api/regions/');
        if (!res.ok) throw new Error('Failed to fetch regions');
        const data = await res.json();
        data.sort((a: any, b: any) => a.name.localeCompare(b.name));
        _psgcCache.regions = data;
        setRegions(data);
      } catch {
        showToast('Address lookup unavailable. Please type your address manually.', 'info');
        setUseManualAddress(true);
      } finally {
        setLoadingRegions(false);
      }
    };
    loadRegions();
  }, []);

  const handleSelectRegion = async (code: string, name: string) => {
    setRegionCode(code); setRegionName(name);
    setProvinceCode(''); setProvinceName(''); setProvinces([]);
    setCityCode(''); setCityName(''); setCities([]);
    setBarangay(''); setBarangaysList([]);

    setLoadingProvinces(true);
    try {
      if (_psgcCache.provinces[code]) {
        setProvinces(_psgcCache.provinces[code]);
        setLoadingProvinces(false);
        return;
      }
      const res = await fetch(`https://psgc.gitlab.io/api/regions/${code}/provinces/`);
      if (res.ok) {
        const data = await res.json();
        data.sort((a: any, b: any) => a.name.localeCompare(b.name));
        _psgcCache.provinces[code] = data;
        setProvinces(data);
        if (data.length > 0) { setLoadingProvinces(false); return; }
      }
    } catch { /* fall through to direct cities */ }
    setLoadingProvinces(false);

    // Regions with no provinces (e.g. NCR) → load cities directly
    setLoadingCities(true);
    try {
      const key = `region_${code}`;
      if (_psgcCache.cities[key]) { setCities(_psgcCache.cities[key]); setLoadingCities(false); return; }
      const cityRes = await fetch(`https://psgc.gitlab.io/api/regions/${code}/cities-municipalities/`);
      if (cityRes.ok) {
        const data = await cityRes.json();
        data.sort((a: any, b: any) => a.name.localeCompare(b.name));
        _psgcCache.cities[key] = data;
        setCities(data);
      }
    } catch { /* silent */ }
    setLoadingCities(false);
  };

  const handleSelectProvince = async (code: string, name: string) => {
    setProvinceCode(code); setProvinceName(name);
    setCityCode(''); setCityName(''); setCities([]);
    setBarangay(''); setBarangaysList([]);

    setLoadingCities(true);
    try {
      if (_psgcCache.cities[code]) { setCities(_psgcCache.cities[code]); setLoadingCities(false); return; }
      const res = await fetch(`https://psgc.gitlab.io/api/provinces/${code}/cities-municipalities/`);
      if (res.ok) {
        const data = await res.json();
        data.sort((a: any, b: any) => a.name.localeCompare(b.name));
        _psgcCache.cities[code] = data;
        setCities(data);
      }
    } catch { /* silent */ }
    setLoadingCities(false);
  };

  // When a city is selected, load the LGU's local barangay roster instead of
  // fetching from PSGC — this ensures only barangays within the citizen's
  // registered municipality are selectable, and removes PSGC dependency
  // for the barangay step entirely.
  const handleSelectCity = (code: string, name: string) => {
    setCityCode(code); setCityName(name);
    setBarangay('');
    const localList = lguId && BARANGAYS[lguId] ? BARANGAYS[lguId] : DEFAULT_BARANGAYS;
    setBarangaysList(localList.map(b => ({ name: b })));
  };

  // ── Storage helpers ─────────────────────────────────────────────────────
  const uploadPrivate = async (uri: string, kind: 'id_front' | 'selfie'): Promise<string> => {
    const response  = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) throw new Error('Photo is larger than 10 MB.');
    const ext = (uri.split('.').pop() || 'jpg').toLowerCase();
    const path = `${lguId}/${profile.id}/${kind}_${Date.now()}.${ext === 'png' ? 'png' : 'jpg'}`;
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('citizen-ids').upload(path, arrayBuffer, { contentType, upsert: false });
    if (error) throw error;
    return path;
  };

  const getSignedUrl = async (path: string): Promise<string | null> => {
    try {
      const { data } = await supabase.storage.from('citizen-ids').createSignedUrl(path, 300);
      return data?.signedUrl || null;
    } catch { return null; }
  };

  // ── OCR prefill ─────────────────────────────────────────────────────────
  const prefillFromOcr = (text: string) => {
    // 1. Extract a 4-digit zip code
    const zipMatch = text.match(/\b\d{4}\b/);
    if (zipMatch && !zipCode.trim()) setZipCode(zipMatch[0]);

    // 2. Extract a clean street address
    if (!streetAddress.trim()) setStreetAddress(parseOcrStreetAddress(text));
  };

  // ── Guided-capture completion handlers ─────────────────────────────────
  const handleIdFrontCapture = async (uri: string) => {
    setActiveCapture(null);
    setProcessingIdFront(true);

    // Delete previous upload on retake to prevent orphaned files
    if (idFrontPath) {
      supabase.storage.from('citizen-ids').remove([idFrontPath]).catch(() => {});
    }

    try {
      const path = await uploadPrivate(uri, 'id_front');
      setIdFrontUri(uri);
      setIdFrontPath(path);

      const signedUrl = await getSignedUrl(path);
      if (signedUrl) {
        const text = await extractIdText(signedUrl, session?.access_token);
        if (text) { setOcrText(text); setOcrNoteDismissed(false); prefillFromOcr(text); }
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

    // Delete previous upload on retake to prevent orphaned files
    if (selfiePath) {
      supabase.storage.from('citizen-ids').remove([selfiePath]).catch(() => {});
    }

    try {
      const path = await uploadPrivate(uri, 'selfie');
      setSelfiePath(path);

      // Kick off AI analysis in background (best-effort, never blocks the flow)
      if (idFrontPath) {
        setAiAnalyzing(true);
        setAiResult(null);
        runAiAnalysis(
          idFrontPath, path,
          session?.access_token ?? null,
          supabase,
          process.env.EXPO_PUBLIC_API_URL,
        )
          .then(result => { setAiResult(result); setAiAnalyzing(false); })
          .catch(()   => { setAiAnalyzing(false); });
      }
    } catch (err: any) {
      showToast(`Could not upload your selfie: ${err?.message || 'please try again.'}`, 'error');
      setSelfieUri(null);
    } finally {
      setProcessingSelfie(false);
    }
  };

  const resetSelfieAndRestart = () => {
    setSelfieUri(null);
    setSelfiePath(null);
    setAiResult(null);
    setAiAnalyzing(false);
    setActiveCapture('selfie');
  };

  const getActiveBarangay = () => useManualAddress ? manualBarangay.trim() : barangay.trim();
  const getActiveCity     = () => useManualAddress ? manualCity.trim()     : cityName.trim();
  const getActiveProvince = () => useManualAddress ? manualProvince.trim() : provinceName.trim();
  const getActiveRegion   = () => useManualAddress ? manualRegion.trim()   : regionName.trim();

  // ── Submission ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!profile || !lguId) { showToast('Missing account or LGU. Please re-select your municipality.', 'error'); return; }
    if (!idFrontPath || !selfiePath) { showToast('Please complete your ID and selfie photos.', 'error'); return; }

    const activeBarangay = getActiveBarangay();
    const activeCity     = getActiveCity();
    const activeRegion   = getActiveRegion();

    if (!activeBarangay || !activeCity || !activeRegion || !streetAddress.trim() || !zipCode.trim()) {
      showToast('Please complete all address fields.', 'error');
      setStep(stepKeys.indexOf('residency'));
      return;
    }

    setSubmitting(true);
    try {
      const fullAddress = [
        streetAddress.trim(),
        `Brgy. ${activeBarangay}`,
        activeCity,
        getActiveProvince() || null,
        activeRegion,
        zipCode.trim(),
      ].filter(Boolean).join(', ');

      const { data: requestId, error: reqError } = await supabase.rpc('submit_verification_request', {
        p_lgu_id:            lguId,
        p_id_type:           idType,
        p_id_document_path:  idFrontPath,
        p_selfie_path:       selfiePath,
        p_declared_barangay: fullAddress,
      });
      if (reqError) throw reqError;

      // Store AI result if available (best-effort, never blocks)
      if (requestId && aiResult) {
        supabase.from('verification_ai_results').insert({
          request_id:       requestId,
          face_score:       aiResult.faceScore,
          confidence_score: aiResult.confidenceScore,
          phash:            aiResult.phash,
          flags:            aiResult.flags ?? [],
          processing_ms:    aiResult.processingMs,
          raw_json:         aiResult,
        }).catch(() => {});
      }

      await refreshProfile();
      showToast(
        'Submitted for review. Your ID and selfie have been securely uploaded. Your LGU will review your verification, usually within 1–2 business days.',
        'success',
      );
      navigation.goBack();
    } catch (err: any) {
      showToast(`Submission failed: ${err?.message || 'Please try again.'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const canNextForStep = (key: StepKey): boolean => {
    switch (key) {
      case 'id_front':  return !!idFrontPath && !processingIdFront;
      case 'residency': return (
        !!streetAddress.trim() && !!zipCode.trim() &&
        !!getActiveBarangay() && !!getActiveCity() && !!getActiveRegion()
      );
      case 'selfie': return !!selfiePath && !processingSelfie;
      case 'review': return true;
      default:       return false;
    }
  };

  // ── Already verified / pending guard ───────────────────────────────────
  if (status === 'verified' || status === 'pending') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
        <MapBg T={T} isDarkMode={isDarkMode} />
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: status === 'verified' ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)',
            justifyContent: 'center', alignItems: 'center', marginBottom: 24,
          }}>
            {status === 'verified'
              ? <TickCircle size={44} color={isDarkMode ? '#4ADE80' : '#166534'} variant="Bold" />
              : <Warning2   size={44} color={isDarkMode ? '#FBBF24' : '#854D0E'} variant="Bold" />}
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
            style={{ height: 52, borderRadius: 999, backgroundColor: '#292929', justifyContent: 'center', alignItems: 'center', width: '100%' }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: '#FFFCF5', fontFamily: 'Octarine-Bold', fontSize: 15 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── RA 10173 Consent Screen ─────────────────────────────────────────────
  if (!consentAccepted) {
    const bulletItems = [
      {
        Icon: Camera,
        title: 'What we collect',
        body: 'A photo of your government-issued ID and a live selfie.',
      },
      {
        Icon: Lock,
        title: 'Who can see it',
        body: `Only an authorized administrator of the Municipality of ${lguName}. No other party has access.`,
      },
      {
        Icon: Shield,
        title: 'Why we collect it',
        body: 'To verify your identity for local government digital services (reports, service requests, and the community forum).',
      },
      {
        Icon: InfoCircle,
        title: 'Data retention',
        body: 'Your ID photo and selfie are deleted from storage immediately after the administrator makes a decision. Your declared address is retained for LGU records.',
      },
    ];

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
        <MapBg T={T} isDarkMode={isDarkMode} />
        <View style={[styles.header, { borderBottomColor: T.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft2 size={30} color={T.text} variant="Outline" />
          </TouchableOpacity>
          <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 18 }}>Verify Identity</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 200 }} showsVerticalScrollIndicator={false}>
          {/* Icon */}
          <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 28 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: T.accentSoft, justifyContent: 'center', alignItems: 'center' }}>
              <Lock size={36} color={T.accent} variant="Bold" />
            </View>
          </View>

          <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 26, marginBottom: 6 }}>Privacy Notice</Text>
          <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 28 }}>
            Before we can verify your identity, please review how your personal data will be handled.
          </Text>

          {bulletItems.map(({ Icon, title, body }, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 14, marginBottom: 22 }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: T.accentSoft, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                <Icon size={19} color={T.accent} variant="Bold" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 14, marginBottom: 3 }}>{title}</Text>
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 13, lineHeight: 18 }}>{body}</Text>
              </View>
            </View>
          ))}

          <View style={{ borderTopWidth: 1, borderTopColor: T.border, paddingTop: 18, marginTop: 4 }}>
            <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 12, lineHeight: 17 }}>
              This data collection is carried out under the authority of RA 10173 (Data Privacy Act of 2012) for legitimate LGU identity verification purposes. You may withdraw consent by deleting your account at any time.
            </Text>
          </View>
        </ScrollView>

        {/* Consent footer */}
        <View style={[styles.consentFooter, { backgroundColor: T.bg, borderTopColor: T.border }]}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}
            onPress={() => setConsentChecked(c => !c)}
            activeOpacity={0.8}
          >
            <View style={{
              width: 22, height: 22, borderRadius: 6, borderWidth: 2,
              borderColor: consentChecked ? T.accent : T.border,
              backgroundColor: consentChecked ? T.accentSoft : 'transparent',
              justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1,
            }}>
              {consentChecked && <Check size={13} color={T.accent} variant="Bold" />}
            </View>
            <Text style={{ fontFamily: 'Inter-Medium', color: T.text, fontSize: 13, lineHeight: 18, flex: 1 }}>
              I have read and understood the privacy notice. I consent to the collection and processing of my government-issued ID and selfie for identity verification by the Municipality of {lguName}.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              height: 52, borderRadius: 999,
              backgroundColor: consentChecked ? T.text : T.chip,
              justifyContent: 'center', alignItems: 'center',
            }}
            onPress={() => consentChecked && setConsentAccepted(true)}
            disabled={!consentChecked}
            activeOpacity={0.8}
          >
            <Text style={{ color: consentChecked ? T.bg : T.textMuted, fontFamily: 'Octarine-Bold', fontSize: 15 }}>
              Continue to Verification
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Picker data ─────────────────────────────────────────────────────────
  let pickerData: { key: string; label: string }[] = [];
  if (pickerOpen === 'idType')   pickerData = ID_TYPES.map(t  => ({ key: t.value, label: t.label }));
  else if (pickerOpen === 'region')   pickerData = regions.map(r    => ({ key: r.code, label: r.regionName ? `${r.regionName} (${r.name})` : r.name }));
  else if (pickerOpen === 'province') pickerData = provinces.map(p  => ({ key: p.code, label: p.name }));
  else if (pickerOpen === 'city')     pickerData = cities.map(c     => ({ key: c.code, label: c.name }));
  else if (pickerOpen === 'barangay') pickerData = barangaysList.map(b => ({ key: b.name, label: b.name }));

  const filteredPickerData = pickerData.filter(item =>
    item.label.toLowerCase().includes(searchText.toLowerCase())
  );

  // ── Main verification form ──────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <MapBg T={T} isDarkMode={isDarkMode} />
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
              <View style={[styles.stepDot, { backgroundColor: i <= step ? T.accentSoft : T.chip, borderColor: i <= step ? T.accent : T.border }]}>
                {i < step
                  ? <Check size={14} color="#292929" variant="Bold" />
                  : <Text style={{ color: i <= step ? '#292929' : T.textMuted, fontFamily: 'Octarine-Bold', fontSize: 12 }}>{i + 1}</Text>}
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
                Your last submission was rejected{profile?.rejection_reason ? `: ${profile.rejection_reason}` : '.'} Please re-submit.
              </Text>
            </View>
          )}

          {/* ── STEP: ID front ── */}
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

          {/* ── STEP: Residency ── */}
          {currentKey === 'residency' && (
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 4, fontSize: 24 }}>Confirm residency</Text>
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginBottom: 8, fontSize: 13, lineHeight: 18 }}>
                  Enter the address printed on your ID. Your LGU admin will visually confirm it matches.
                </Text>
              </View>

              {!!ocrText && !ocrNoteDismissed && (
                <View style={[styles.notice, { backgroundColor: T.cardAlt, borderColor: T.border }]}>
                  <InfoCircle size={20} color={T.textMuted} variant="Bold" />
                  <Text style={[styles.noticeText, { color: T.textMuted, fontFamily: 'Inter-Medium' }]}>
                    We scanned your ID — please review and correct the address below.
                  </Text>
                  <TouchableOpacity onPress={() => setOcrNoteDismissed(true)}>
                    <CloseSquare size={18} color={T.textMuted} variant="Bold" />
                  </TouchableOpacity>
                </View>
              )}

              {/* LGU prefill card */}
              <View>
                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>VERIFYING MUNICIPALITY</Text>
                <View style={{ backgroundColor: T.cardAlt, borderWidth: 1, borderColor: T.border, borderRadius: 14, padding: 14 }}>
                  <Text style={{ color: T.text, fontSize: 15, fontFamily: 'Inter-SemiBold' }}>
                    {resolvedLgu?.name || selectedLgu?.name || 'Loading LGU details...'}
                  </Text>
                </View>
              </View>

              {/* Manual toggle */}
              <TouchableOpacity
                onPress={() => setUseManualAddress(!useManualAddress)}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: T.card, borderColor: T.border, borderWidth: 1, borderRadius: 14 }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ color: T.text, fontFamily: 'Inter-SemiBold', fontSize: 13 }}>Offline / Address loading issue?</Text>
                  <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 11, marginTop: 2 }}>
                    Toggle this to type your address manually.
                  </Text>
                </View>
                <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: useManualAddress ? T.accent : T.border, padding: 2, justifyContent: 'center', alignItems: useManualAddress ? 'flex-end' : 'flex-start' }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' }} />
                </View>
              </TouchableOpacity>

              {!useManualAddress ? (
                <>
                  {/* Region */}
                  <View>
                    <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>REGION</Text>
                    <TouchableOpacity
                      style={[styles.dropdownBtn, { borderColor: T.border, backgroundColor: T.cardAlt }]}
                      onPress={() => { setSearchText(''); setPickerOpen('region'); }}
                      activeOpacity={0.8}
                    >
                      {loadingRegions ? <ActivityIndicator size="small" color={T.text} /> :
                        <Text style={{ color: regionName ? T.text : T.textMuted, fontSize: 14, fontFamily: 'Inter-Medium', flex: 1 }}>
                          {regionName || 'Select Region'}
                        </Text>}
                      <ArrowDown2 size={16} color={T.textMuted} variant="Bold" />
                    </TouchableOpacity>
                  </View>

                  {/* Province */}
                  {(provinces.length > 0 || loadingProvinces) && (
                    <View>
                      <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>PROVINCE</Text>
                      <TouchableOpacity
                        style={[styles.dropdownBtn, { borderColor: T.border, backgroundColor: T.cardAlt, opacity: !regionName ? 0.5 : 1 }]}
                        disabled={!regionName}
                        onPress={() => { setSearchText(''); setPickerOpen('province'); }}
                        activeOpacity={0.8}
                      >
                        {loadingProvinces ? <ActivityIndicator size="small" color={T.text} /> :
                          <Text style={{ color: provinceName ? T.text : T.textMuted, fontSize: 14, fontFamily: 'Inter-Medium', flex: 1 }}>
                            {provinceName || 'Select Province'}
                          </Text>}
                        <ArrowDown2 size={16} color={T.textMuted} variant="Bold" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* City */}
                  <View>
                    <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>CITY / MUNICIPALITY</Text>
                    <TouchableOpacity
                      style={[styles.dropdownBtn, { borderColor: T.border, backgroundColor: T.cardAlt, opacity: ((provinces.length > 0 && !provinceName) || !regionName) ? 0.5 : 1 }]}
                      disabled={(provinces.length > 0 && !provinceName) || !regionName}
                      onPress={() => { setSearchText(''); setPickerOpen('city'); }}
                      activeOpacity={0.8}
                    >
                      {loadingCities ? <ActivityIndicator size="small" color={T.text} /> :
                        <Text style={{ color: cityName ? T.text : T.textMuted, fontSize: 14, fontFamily: 'Inter-Medium', flex: 1 }}>
                          {cityName || 'Select City/Municipality'}
                        </Text>}
                      <ArrowDown2 size={16} color={T.textMuted} variant="Bold" />
                    </TouchableOpacity>
                  </View>

                  {/* Barangay (local LGU roster) */}
                  <View>
                    <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>YOUR BARANGAY IN {lguName.toUpperCase()}</Text>
                    <TouchableOpacity
                      style={[styles.dropdownBtn, { borderColor: T.border, backgroundColor: T.cardAlt, opacity: (!cityName && barangaysList.length === 0) ? 0.5 : 1 }]}
                      disabled={!cityName && barangaysList.length === 0}
                      onPress={() => { setSearchText(''); setPickerOpen('barangay'); }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: barangay ? T.text : T.textMuted, fontSize: 14, fontFamily: 'Inter-Medium', flex: 1 }}>
                        {barangay || `Select barangay in ${lguName}`}
                      </Text>
                      <ArrowDown2 size={16} color={T.textMuted} variant="Bold" />
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={{ gap: 12 }}>
                  {[
                    { label: 'REGION (MANUAL)', value: manualRegion, onChange: setManualRegion, placeholder: 'e.g. Region IV-A' },
                    { label: 'PROVINCE (MANUAL)', value: manualProvince, onChange: setManualProvince, placeholder: 'e.g. Laguna' },
                    { label: 'CITY / MUNICIPALITY (MANUAL)', value: manualCity, onChange: setManualCity, placeholder: 'e.g. Liliw' },
                    { label: `YOUR BARANGAY IN ${lguName.toUpperCase()} (MANUAL)`, value: manualBarangay, onChange: setManualBarangay, placeholder: 'e.g. Poblacion I' },
                  ].map(({ label, value, onChange, placeholder }) => (
                    <View key={label}>
                      <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>{label}</Text>
                      <TextInput
                        style={[styles.textInput, { borderColor: T.border, backgroundColor: T.cardAlt, color: T.text, fontFamily: 'Inter-Medium' }]}
                        value={value}
                        onChangeText={onChange}
                        placeholder={placeholder}
                        placeholderTextColor={T.textMuted}
                      />
                    </View>
                  ))}
                </View>
              )}

              {/* Shared address fields */}
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

          {/* ── STEP: Selfie ── */}
          {currentKey === 'selfie' && (
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 4, fontSize: 24 }}>Capture a selfie</Text>
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginBottom: 8, fontSize: 13, lineHeight: 18 }}>
                  Look straight at the camera and align your face within the frame. Make sure your face is well-lit and clearly visible.
                </Text>
              </View>

              <View>
                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 8 }}>YOUR PORTRAIT PHOTO</Text>
                {selfieUri ? (
                  <View>
                    <Image source={{ uri: selfieUri }} style={[styles.previewSquare, { borderColor: T.border }]} resizeMode="contain" />
                    {processingSelfie && <ActivityIndicator style={{ marginTop: 8 }} color={T.text} />}
                    {!processingSelfie && aiAnalyzing && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingHorizontal: 4 }}>
                        <ActivityIndicator size="small" color={T.textMuted} />
                        <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 12 }}>Running identity check…</Text>
                      </View>
                    )}
                    {!processingSelfie && aiResult && !aiAnalyzing && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingHorizontal: 4 }}>
                        <TickCircle size={16} color="#16A34A" variant="Bold" />
                        <Text style={{ fontFamily: 'Inter-Medium', color: '#16A34A', fontSize: 12 }}>Identity check complete</Text>
                      </View>
                    )}
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

          {/* ── STEP: Review ── */}
          {currentKey === 'review' && (
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 4, fontSize: 24 }}>Review submission</Text>
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginBottom: 8, fontSize: 13, lineHeight: 18 }}>
                  Confirm all details are correct. You cannot modify them once submitted.
                </Text>
              </View>

              {/* AI confidence card */}
              {(aiAnalyzing || aiResult) && (
                <View style={{ backgroundColor: T.cardAlt, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 16, gap: 12 }}>
                  <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 14 }}>Automated Identity Check</Text>
                  {aiAnalyzing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color={T.textMuted} />
                      <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 13 }}>Comparing your ID and selfie…</Text>
                    </View>
                  ) : aiResult ? (
                    <>
                      <ScoreBar T={T} label="Face match" score={aiResult.faceScore} />
                      <ScoreBar T={T} label="Overall confidence" score={aiResult.confidenceScore} />
                      {(aiResult.flags?.length ?? 0) > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                          {aiResult.flags.map((f: string) => (
                            <View key={f} style={{ backgroundColor: '#FEF2F2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                              <Text style={{ color: '#DC2626', fontFamily: 'Inter-Medium', fontSize: 11 }}>{f.replace(/_/g, ' ')}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 11, lineHeight: 15 }}>
                        This is an automated pre-check. Your LGU administrator reviews all submissions.
                      </Text>
                    </>
                  ) : null}
                </View>
              )}

              {/* Summary card */}
              <View style={[globalStyles.card, { borderColor: T.border, backgroundColor: T.card, padding: 18, gap: 12 }]}>
                <ReviewRow T={T} label="ID Type" value={ID_TYPES.find(t => t.value === idType)?.label || idType} />
                <ReviewRow
                  T={T}
                  label="Declared Address"
                  value={[streetAddress.trim(), `Brgy. ${getActiveBarangay()}`, getActiveCity(), getActiveProvince() || null, getActiveRegion(), zipCode.trim()].filter(Boolean).join(', ')}
                />
                <View style={{ borderTopWidth: 1, borderTopColor: T.border, paddingTop: 12, gap: 4, flexDirection: 'row', alignItems: 'center' }}>
                  <Lock size={16} color={T.textMuted} variant="Bold" style={{ marginRight: 6 }} />
                  <Text style={{ color: T.textMuted, fontSize: 11, fontFamily: 'Inter-Medium', flex: 1, lineHeight: 15 }}>
                    Your ID is private. Only LGU staff in {lguName} can view it for verification. Photos are deleted after a decision.
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
              style={{ height: 52, borderRadius: 999, backgroundColor: T.chip, flex: 1, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}
              onPress={() => setStep(step - 1)}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text style={{ color: T.text, fontFamily: 'Octarine-Bold', fontSize: 15 }}>Back</Text>
            </TouchableOpacity>
          )}
          {currentKey !== 'review' ? (
            <TouchableOpacity
              style={{ height: 52, borderRadius: 999, backgroundColor: canNextForStep(currentKey) ? T.text : T.chip, flex: 2, justifyContent: 'center', alignItems: 'center' }}
              onPress={() => canNextForStep(currentKey) && setStep(step + 1)}
              disabled={!canNextForStep(currentKey)}
              activeOpacity={0.8}
            >
              <Text style={{ color: canNextForStep(currentKey) ? T.bg : T.textMuted, fontFamily: 'Octarine-Bold', fontSize: 15 }}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={{ height: 52, borderRadius: 999, backgroundColor: T.accentSoft, flex: 2, justifyContent: 'center', alignItems: 'center' }}
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

        {/* Picker Modal */}
        <Modal visible={pickerOpen !== null} transparent animationType="slide" onRequestClose={() => setPickerOpen(null)}>
          <View style={styles.pickerOverlay}>
            <View style={[styles.pickerSheet, { backgroundColor: T.card, borderWidth: 1, borderColor: T.border }]}>
              <View style={[styles.pickerHeader, { borderBottomColor: T.border }]}>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 18 }}>
                  {pickerOpen === 'idType'   && 'Select ID type'}
                  {pickerOpen === 'region'   && 'Select Region'}
                  {pickerOpen === 'province' && 'Select Province'}
                  {pickerOpen === 'city'     && 'Select City/Municipality'}
                  {pickerOpen === 'barangay' && `Select barangay in ${lguName}`}
                </Text>
                <TouchableOpacity onPress={() => setPickerOpen(null)}>
                  <CloseSquare size={22} color={T.textMuted} variant="Bold" />
                </TouchableOpacity>
              </View>
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
                keyExtractor={item => item.key}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => {
                  let selected = false;
                  if (pickerOpen === 'idType')   selected = idType === item.key;
                  else if (pickerOpen === 'region')   selected = regionCode === item.key;
                  else if (pickerOpen === 'province') selected = provinceCode === item.key;
                  else if (pickerOpen === 'city')     selected = cityCode === item.key;
                  else if (pickerOpen === 'barangay') selected = barangay === item.key;
                  return (
                    <TouchableOpacity
                      style={[styles.pickerRow, { borderBottomColor: T.border }]}
                      onPress={() => {
                        if (pickerOpen === 'idType')        setIdType(item.key as any);
                        else if (pickerOpen === 'region')   handleSelectRegion(item.key, item.label);
                        else if (pickerOpen === 'province') handleSelectProvince(item.key, item.label);
                        else if (pickerOpen === 'city')     handleSelectCity(item.key, item.label);
                        else if (pickerOpen === 'barangay') setBarangay(item.key);
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

        {/* Guided camera */}
        {activeCapture && (
          <GuidedCapture
            key={activeCapture}
            guideShape={activeCapture === 'selfie' ? 'oval' : 'card'}
            cameraFacing={activeCapture === 'selfie' ? 'front' : 'back'}
            instructionText={
              activeCapture === 'id_front'
                ? 'Align your ID within the frame'
                : 'Look at the camera — face should be clearly visible'
            }
            onCapture={activeCapture === 'id_front' ? handleIdFrontCapture : handleSelfieCapture}
            onCancel={() => setActiveCapture(null)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Shared map background ───────────────────────────────────────────────────
function MapBg({ T, isDarkMode }: { T: any; isDarkMode: boolean }) {
  return (
    <Image
      source={isDarkMode ? require('../../assets/brand/bg-map-2.png') : require('../../assets/brand/bg-map-1.png')}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: isDarkMode ? 0.04 : 0.07, tintColor: T.accent }}
      resizeMode="cover"
    />
  );
}

// ── ScoreBar ────────────────────────────────────────────────────────────────
function ScoreBar({ T, label, score }: { T: any; label: string; score: number | null }) {
  const pct   = score !== null ? Math.round(score * 100) : null;
  const color = score === null ? '#9CA3AF'
    : score >= 0.80 ? '#16A34A'
    : score >= 0.60 ? '#CA8A04'
    : score >= 0.40 ? '#EA580C'
    : '#DC2626';
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 12 }}>{label}</Text>
        <Text style={{ fontFamily: 'Octarine-Bold', color, fontSize: 12 }}>{pct !== null ? `${pct}%` : 'N/A'}</Text>
      </View>
      <View style={{ height: 6, backgroundColor: T.border, borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: color, width: `${(score ?? 0) * 100}%` }} />
      </View>
    </View>
  );
}

// ── Small helpers ───────────────────────────────────────────────────────────
function CaptureEntryButton({ T, label, onPress }: { T: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={{ backgroundColor: T.cardAlt, borderWidth: 1, borderColor: T.border, borderRadius: 20, alignItems: 'center', paddingVertical: 28 }} onPress={onPress} activeOpacity={0.8}>
      <Camera size={28} color={T.text} variant="Bold" />
      <Text style={{ color: T.text, fontSize: 14, fontFamily: 'Octarine-Bold', marginTop: 8 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryButton({ T, icon, label, onPress }: { T: any; icon: any; label: string; onPress: () => void }) {
  const IconComp = icon;
  return (
    <TouchableOpacity
      style={{ backgroundColor: T.cardAlt, borderWidth: 1, borderColor: T.border, borderRadius: 999, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}
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
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn:  { padding: 8 },
  stepper:  { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot:  { width: 28, height: 28, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  preview:       { width: '100%', height: 200, borderRadius: 16, borderWidth: 1 },
  previewSquare: { width: '100%', aspectRatio: 3 / 4, maxHeight: 320, borderRadius: 16, borderWidth: 1 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 16, borderTopWidth: 1, paddingBottom: 32 },
  notice: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16, gap: 10 },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18 },
  consentFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 36, borderTopWidth: 1 },
  pickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet:   { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  pickerHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  pickerRow:     { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  dropdownBtn:   { height: 48, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  textInput:     { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 14 },
});
