import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity,
  Image, Switch, ActivityIndicator, Alert, SafeAreaView, Platform, StatusBar,
  Animated, Easing, Dimensions, Pressable,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

// ============================================================================
// DESIGN TOKENS  ────────────────────────────────────────────────────────────
// ============================================================================
const ACCENT = '#F497A2';

const TOKENS = {
  light: {
    bg:        '#E8E7E5',
    bgAlt:     '#DEDCD8',
    card:      '#FFFFFF',
    cardAlt:   '#F4F2EE',
    text:      '#1A1A1A',
    textMuted: '#6B7280',
    border:    'rgba(26,26,26,0.08)',
    chip:      '#F4F2EE',
  },
  dark: {
    bg:        '#1A1A1A',
    bgAlt:     '#0F0F0F',
    card:      '#242322',
    cardAlt:   '#2E2D2C',
    text:      '#E8E7E5',
    textMuted: '#9CA3AF',
    border:    'rgba(232,231,229,0.08)',
    chip:      '#2E2D2C',
  },
};

// Pastel palettes for hero/feature cards
const PASTELS = {
  sage:    '#C7D5C1', // sage green
  blue:    '#C4D0D7', // dusty blue
  pink:    '#F2C4CB', // pastel pink
  cream:   '#E8DEC9', // soft cream
  lilac:   '#D4CCE0', // muted lilac
  butter:  '#EFE6BD', // butter
};

const RADIUS = { sm: 12, md: 18, lg: 24, xl: 28, pill: 999 };

// ============================================================================
// MOCK DATA  ────────────────────────────────────────────────────────────────
// ============================================================================
const LOCAL_LGUS = [
  {
    id: 'liliw-laguna',
    name: 'Municipality of Liliw',
    region: 'Laguna · Region IV-A',
    color: PASTELS.sage,
    accent: '#A2B59F',
    latitude: 13.9297,
    longitude: 121.4644,
    featureFlags: { chatbot: true, potholeDetection: true, forum: true },
  },
  {
    id: 'nagcarlan-laguna',
    name: 'Municipality of Nagcarlan',
    region: 'Laguna · Region IV-A',
    color: PASTELS.blue,
    accent: '#9FADB5',
    latitude: 13.9214,
    longitude: 121.4157,
    featureFlags: { chatbot: false, potholeDetection: true, forum: false },
  },
];

const NEWS_FEED = [
  { id: 1, title: 'Liliw Tsinelas Festival 2026', tag: 'Event', color: PASTELS.pink },
  { id: 2, title: 'Free Rabies Vaccination Drive', tag: 'Health', color: PASTELS.cream },
  { id: 3, title: 'Road Closure: Plaza Rizal', tag: 'Advisory', color: PASTELS.butter },
];

const SERVICES = [
  { id: 'birth',     icon: 'document-outline',          label: 'Birth Certificate',    desc: 'LCR · 3 working days',     color: PASTELS.sage },
  { id: 'business',  icon: 'briefcase-outline',         label: 'Business Permit',      desc: 'BPLO · 3 working days',    color: PASTELS.blue },
  { id: 'cedula',    icon: 'card-outline',              label: 'Cedula / CTC',         desc: 'Treasurer · same day',     color: PASTELS.cream },
  { id: 'barangay',  icon: 'shield-checkmark-outline',  label: 'Barangay Clearance',   desc: 'Barangay · same day',      color: PASTELS.pink },
  { id: 'marriage',  icon: 'heart-outline',             label: 'Marriage Certificate', desc: 'LCR · 5 working days',     color: PASTELS.lilac },
  { id: 'building',  icon: 'business-outline',          label: 'Building Permit',      desc: 'Engineering · 7 days',     color: PASTELS.butter },
];

const REPORT_CATEGORIES = [
  { id: 'pothole',          label: 'Pothole',          icon: 'warning-outline' },
  { id: 'clogged_drainage', label: 'Drainage',         icon: 'water-outline' },
  { id: 'stray_animal',     label: 'Stray Animal',     icon: 'paw-outline' },
  { id: 'streetlight',      label: 'Street Light',     icon: 'bulb-outline' },
];

// ============================================================================
// HELPERS  ──────────────────────────────────────────────────────────────────
// ============================================================================
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================================================
// AGAPP LOGO  ────────────────────────────────────────────────────────────────
// ============================================================================
function AgappLogo({ size = 48, color = '#1A1A1A', accent = ACCENT }: { size?: number; color?: string; accent?: string }) {
  return (
    <Text style={{ fontSize: size, fontWeight: '900', letterSpacing: -size * 0.04, lineHeight: size * 1.1 }}>
      <Text style={{ color }}>A</Text>
      <Text style={{ color: accent }}>g</Text>
      <Text style={{ color }}>app</Text>
      <Text style={{ color: accent }}>.</Text>
    </Text>
  );
}

// ============================================================================
// REUSABLE COMPONENTS  ──────────────────────────────────────────────────────
// ============================================================================
function Chip({ label, active, onPress, T }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? T.text : T.chip, borderColor: T.border },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? T.bg : T.text }]}>{label}</Text>
    </Pressable>
  );
}

function SectionHeader({ title, action, onAction, T }: any) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: T.text }]}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={[styles.sectionAction, { color: T.textMuted }]}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StatCard({ value, label, color, T }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ============================================================================
// MAIN APP  ─────────────────────────────────────────────────────────────────
// ============================================================================
export default function App() {
  const [fontsLoaded] = Font.useFonts(Ionicons.font);

  // Navigation state
  const [appLoading, setAppLoading] = useState(true);
  const [screen, setScreen] = useState<'login' | 'lgu-select' | 'main'>('login');
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'reports' | 'chatbot' | 'profile'>('home');

  // Theme
  const [isDarkMode, setIsDarkMode] = useState(false);
  const T = isDarkMode ? TOKENS.dark : TOKENS.light;

  // User state
  const [selectedLgu, setSelectedLgu] = useState<any>(LOCAL_LGUS[0]);
  const [citizen] = useState({
    name: 'Lawrence Alcantara',
    email: 'lawrence@email.com',
    barangay: 'Poblacion',
    role: 'Citizen',
  });

  // Login form
  const [email, setEmail] = useState('lawrence@email.com');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(true);

  // Permissions
  const [consentLocation, setConsentLocation] = useState(true);
  const [consentPush, setConsentPush] = useState(true);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

  // Reports
  const [reportCategory, setReportCategory] = useState('pothole');
  const [reportDesc, setReportDesc] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [snappedPhoto, setSnappedPhoto] = useState<string | null>(null);
  const [mlConfidence, setMlConfidence] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [reportLocation, setReportLocation] = useState<{ lat: number; lng: number; accuracy: number | null; address: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Map
  const [mapOpen, setMapOpen] = useState(false);

  // Service application form
  const [activeService, setActiveService] = useState<any>(null);
  const [svcFullName, setSvcFullName] = useState(citizen.name);
  const [svcPurpose, setSvcPurpose] = useState('');
  const [svcCopies, setSvcCopies] = useState('1');
  const [svcContact, setSvcContact] = useState('');

  // Chat
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'bot', text: 'Hi! I\'m your AGAPP assistant. Ask me about document applications, permits, or community concerns.' },
  ]);

  // Initial loading splash
  useEffect(() => {
    const t = setTimeout(() => setAppLoading(false), 2200);
    return () => clearTimeout(t);
  }, []);

  if (!fontsLoaded) return null;

  // ── Handlers ────────────────────────────────────────────────────────────
  const requestPermissions = async () => {
    const { status: cs } = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(cs === 'granted');
    const { status: ls } = await Location.requestForegroundPermissionsAsync();
    setHasLocationPermission(ls === 'granted');
  };

  const handleRequestOtp = () => {
    if (!privacyAccepted) {
      Alert.alert('Privacy Notice', 'Please accept the Privacy Notice (RA 10173) to continue.');
      return;
    }
    setOtpSent(true);
    Alert.alert('Code Sent', 'Demo OTP: 123456 (or leave blank to bypass).');
  };

  const handleVerifyOtp = async () => {
    if (otpCode === '123456' || otpCode === '') {
      await requestPermissions();
      try { await SecureStore.setItemAsync('agapp_session', 'mock-jwt'); } catch {}
      setScreen('lgu-select');
    } else {
      Alert.alert('Invalid Code', 'Please enter "123456" or leave blank.');
    }
  };

  const handleSelectLgu = (lgu: any) => {
    setSelectedLgu(lgu);
    setAppLoading(true);
    setTimeout(() => { setAppLoading(false); setScreen('main'); }, 1200);
  };

  const openCamera = async () => {
    let granted = hasCameraPermission;
    if (!granted) {
      const { status } = await Camera.requestCameraPermissionsAsync();
      granted = status === 'granted';
      setHasCameraPermission(granted);
    }
    if (!granted) {
      Alert.alert('Camera permission needed', 'Please enable camera access in your phone settings to capture report photos.');
      return;
    }
    setCameraActive(true);
  };

  const fetchReportLocation = async () => {
    try {
      setLocationLoading(true);
      let granted = hasLocationPermission;
      if (!granted) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        granted = status === 'granted';
        setHasLocationPermission(granted);
      }
      if (!granted) {
        Alert.alert('Location permission needed', 'Reports need GPS coordinates for verification under RA 10173.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let address = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
      try {
        const places = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        if (places.length > 0) {
          const p = places[0];
          address = [p.name, p.street, p.district, p.city || p.subregion, p.region]
            .filter(Boolean).join(', ');
        }
      } catch {}
      setReportLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        address,
      });
    } catch (err: any) {
      Alert.alert('Location unavailable', err?.message ?? 'Could not fetch GPS coordinates.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleCameraSnap = async () => {
    if (!cameraRef.current || capturing) return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
      setCameraActive(false);
      setSnappedPhoto(photo?.uri ?? null);
      // Simulated YOLOv11 inference (placeholder until real model is wired)
      const isPothole = reportCategory === 'pothole';
      const confidence = isPothole ? 0.92 : 0.18;
      setMlConfidence(confidence);
      // Auto-fetch GPS so the report is geofence-verified
      fetchReportLocation();
      Alert.alert(
        'YOLOv11 Detection',
        isPothole
          ? `Pothole detected · ${(confidence * 100).toFixed(0)}% confidence`
          : `Low credibility · ${(confidence * 100).toFixed(0)}% confidence`
      );
    } catch (err: any) {
      Alert.alert('Capture failed', err?.message ?? 'Could not take photo. Try again.');
    } finally {
      setCapturing(false);
    }
  };

  const submitReport = () => {
    if (!snappedPhoto) {
      Alert.alert('Missing Photo', 'Please capture a photo first.');
      return;
    }
    if (!reportLocation) {
      Alert.alert('Missing Location', 'GPS coordinates are required. Tap "Use my location" to fetch them.');
      return;
    }
    // Simple geofence check vs selected LGU centroid (~10 km radius)
    const distKm = haversineKm(reportLocation.lat, reportLocation.lng, selectedLgu.latitude, selectedLgu.longitude);
    const insideGeofence = distKm <= 15;
    const ref = `REP-2026-${String(reports.length + 1).padStart(4, '0')}`;
    setReports([{
      id: `r-${Date.now()}`, referenceNumber: ref, category: reportCategory,
      description: reportDesc, photoUrl: snappedPhoto, status: 'Submitted',
      mlConfidence: mlConfidence || 1, location: reportLocation,
      insideGeofence, createdAt: new Date().toISOString(),
    }, ...reports]);
    setReportDesc(''); setSnappedPhoto(null); setMlConfidence(null); setReportLocation(null);
    Alert.alert(
      'Submitted',
      `Reference: ${ref}\nFiled with ${selectedLgu.name}.\n${
        insideGeofence ? '✓ Inside LGU geofence' : '⚠ Outside LGU geofence — flagged for review'
      }`
    );
  };

  const openServiceForm = (svc: any) => {
    setActiveService(svc);
    setSvcFullName(citizen.name);
    setSvcPurpose('');
    setSvcCopies('1');
    setSvcContact('');
  };

  const submitServiceForm = () => {
    if (!activeService) return;
    if (!svcFullName.trim()) { Alert.alert('Missing field', 'Please enter your full name.'); return; }
    if (!svcPurpose.trim()) { Alert.alert('Missing field', 'Please state the purpose of your request.'); return; }
    const copies = parseInt(svcCopies, 10) || 1;
    const ref = `REQ-2026-${String(serviceRequests.length + 1).padStart(4, '0')}`;
    setServiceRequests([{
      id: `s-${Date.now()}`, referenceNumber: ref, serviceType: activeService.label,
      fullName: svcFullName, purpose: svcPurpose, copies, contact: svcContact,
      status: 'Submitted', createdAt: new Date().toISOString(),
    }, ...serviceRequests]);
    setActiveService(null);
    Alert.alert('Application Submitted', `Reference: ${ref}\nPay & claim at ${selectedLgu.name} Treasurer's counter.`);
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = { sender: 'user', text: chatInput };
    const q = chatInput.toLowerCase();
    let reply = 'I couldn\'t find that in the FAQ. Want me to file a ticket with the LGU?';
    if (q.includes('permit') || q.includes('bplo')) reply = 'Business Permit: present barangay clearance + pay assessment at Treasurer. SLA 3 days.';
    else if (q.includes('birth') || q.includes('civil')) reply = 'Birth Certificate: bring valid ID. Show your QR code at Civil Registrar. SLA 3 days.';
    else if (q.includes('cedula')) reply = 'Cedula/CTC: walk-in at Treasurer\'s office. Same-day release.';
    else if (q.includes('pothole') || q.includes('road')) reply = 'Submit a Pothole Report from the Reports tab — include a photo for YOLOv11 verification.';
    setChatMessages(prev => [...prev, userMsg, { sender: 'bot', text: reply }]);
    setChatInput('');
  };

  // ── Splash / Loading ───────────────────────────────────────────────────
  if (appLoading) {
    return (
      <View style={[styles.splash, { backgroundColor: TOKENS.dark.bg }]}>
        <StatusBar barStyle="light-content" />
        <AgappLogo size={56} color={TOKENS.dark.text} accent={selectedLgu?.accent || ACCENT} />
        <Text style={styles.splashTag}>
          {selectedLgu ? selectedLgu.name.toUpperCase() : 'AUTOMATED GOVERNANCE'}
        </Text>
        <ActivityIndicator size="small" color={selectedLgu?.accent || ACCENT} style={{ marginTop: 28 }} />
      </View>
    );
  }

  // ── LOGIN SCREEN ────────────────────────────────────────────────────────
  if (screen === 'login') {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: T.bg }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <ScrollView contentContainerStyle={styles.loginScroll} showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', marginTop: 32, marginBottom: 28 }}>
            <View style={[styles.logoPill, { backgroundColor: TOKENS.dark.bg }]}>
              <AgappLogo size={32} color={TOKENS.dark.text} accent={ACCENT} />
            </View>
            <Text style={[styles.serif, { color: T.text, fontSize: 26, marginTop: 22 }]}>
              Welcome back.
            </Text>
            <Text style={[styles.muted, { color: T.textMuted, marginTop: 6 }]}>
              National platform for Filipino citizens
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
            <Text style={[styles.label, { color: T.textMuted }]}>EMAIL ADDRESS</Text>
            <TextInput
              style={[styles.input, { color: T.text, backgroundColor: T.cardAlt, borderColor: T.border }]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={T.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {otpSent && (
              <>
                <Text style={[styles.label, { color: T.textMuted, marginTop: 4 }]}>VERIFICATION CODE</Text>
                <TextInput
                  style={[styles.input, styles.inputCenter, { color: T.text, backgroundColor: T.cardAlt, borderColor: T.border }]}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  placeholder="• • • • • •"
                  placeholderTextColor={T.textMuted}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </>
            )}

            <Pressable
              onPress={() => setPrivacyAccepted(!privacyAccepted)}
              style={styles.consentRow}
            >
              <View style={[styles.checkbox, { borderColor: T.border, backgroundColor: privacyAccepted ? ACCENT : 'transparent' }]}>
                {privacyAccepted && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <Text style={[styles.consentText, { color: T.textMuted }]}>
                I accept the <Text style={{ color: ACCENT, fontWeight: '700' }}>Privacy Notice</Text> and consent to GPS sharing under RA 10173.
              </Text>
            </Pressable>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.primaryButton, { backgroundColor: privacyAccepted ? T.text : T.chip }]}
              onPress={otpSent ? handleVerifyOtp : handleRequestOtp}
              disabled={!privacyAccepted}
            >
              <Text style={[styles.primaryButtonText, { color: privacyAccepted ? T.bg : T.textMuted }]}>
                {otpSent ? 'Verify & Sign In' : 'Send Verification Code'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.demoHint, { color: T.textMuted }]}>Demo OTP: 123456</Text>
          </View>

          <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
            <Text style={[styles.cardTitle, { color: T.text }]}>Permissions</Text>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: T.text, fontWeight: '600' }}>GPS Geofence</Text>
                <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>For verified barangay reports</Text>
              </View>
              <Switch value={consentLocation} onValueChange={setConsentLocation} trackColor={{ true: ACCENT, false: T.chip }} thumbColor="#FFF" />
            </View>
            <View style={[styles.divider, { backgroundColor: T.border }]} />
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: T.text, fontWeight: '600' }}>Push Notifications</Text>
                <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Emergency advisories</Text>
              </View>
              <Switch value={consentPush} onValueChange={setConsentPush} trackColor={{ true: ACCENT, false: T.chip }} thumbColor="#FFF" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── LGU SELECTOR ────────────────────────────────────────────────────────
  if (screen === 'lgu-select') {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: T.bg }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Text style={[styles.serif, { color: T.text, fontSize: 32, marginTop: 16 }]}>
            Choose your{'\n'}municipality.
          </Text>
          <Text style={[styles.muted, { color: T.textMuted, marginTop: 10, marginBottom: 28 }]}>
            Select the LGU you reside in. You can switch anytime.
          </Text>

          {LOCAL_LGUS.map(lgu => (
            <TouchableOpacity
              key={lgu.id}
              activeOpacity={0.85}
              style={[styles.lguCard, { backgroundColor: lgu.color }]}
              onPress={() => handleSelectLgu(lgu)}
            >
              <View style={styles.lguIconCircle}>
                <Ionicons name="business-outline" size={26} color="#1A1A1A" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.lguName}>{lgu.name}</Text>
                <Text style={styles.lguRegion}>{lgu.region}</Text>
              </View>
              <View style={styles.lguArrow}>
                <Ionicons name="arrow-forward" size={18} color="#1A1A1A" />
              </View>
            </TouchableOpacity>
          ))}

          <View style={[styles.infoCard, { backgroundColor: T.card, borderColor: T.border }]}>
            <Ionicons name="information-circle-outline" size={22} color={T.textMuted} />
            <Text style={[styles.infoText, { color: T.textMuted }]}>
              More municipalities will be added as AGAPP rolls out nationally.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── MAIN APP (TAB BAR) ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Camera Overlay */}
      {cameraActive && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 100, backgroundColor: '#000' }]}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back">
            <SafeAreaView style={styles.cameraOverlay}>
              <TouchableOpacity style={styles.cameraClose} onPress={() => setCameraActive(false)}>
                <Ionicons name="close" size={26} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.cameraBottom}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleCameraSnap}
                  disabled={capturing}
                  activeOpacity={0.7}
                >
                  {capturing
                    ? <ActivityIndicator color="#1A1A1A" />
                    : <View style={styles.captureInner} />}
                </TouchableOpacity>
                <Text style={styles.cameraHint}>
                  {capturing ? 'Capturing…' : 'Tap to capture · YOLOv11 will verify'}
                </Text>
              </View>
            </SafeAreaView>
          </CameraView>
        </View>
      )}

      {/* Fullscreen Map Modal */}
      {mapOpen && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 98, backgroundColor: '#000' }]}>
          <MapView
            style={styles.fullMap}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: selectedLgu.latitude,
              longitude: selectedLgu.longitude,
              latitudeDelta: 0.06,
              longitudeDelta: 0.06,
            }}
            showsUserLocation={hasLocationPermission === true}
            showsMyLocationButton
          >
            {/* LGU centroid pin */}
            <Marker
              coordinate={{ latitude: selectedLgu.latitude, longitude: selectedLgu.longitude }}
              title={selectedLgu.name}
              description={selectedLgu.region}
              pinColor="#1A1A1A"
            />
            {/* All other LGUs as ghost pins for context */}
            {LOCAL_LGUS.filter(l => l.id !== selectedLgu.id).map(l => (
              <Marker
                key={l.id}
                coordinate={{ latitude: l.latitude, longitude: l.longitude }}
                title={l.name}
                description={l.region}
                pinColor={l.accent}
                opacity={0.6}
              />
            ))}
            {/* Submitted reports pins */}
            {reports.filter(r => r.location).map(r => (
              <Marker
                key={r.id}
                coordinate={{ latitude: r.location.lat, longitude: r.location.lng }}
                title={r.referenceNumber}
                description={`${r.category.replace('_', ' ')} · ${r.status}`}
                pinColor={ACCENT}
              />
            ))}
          </MapView>

          <TouchableOpacity style={styles.fullMapClose} onPress={() => setMapOpen(false)}>
            <Ionicons name="close" size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={styles.fullMapTitle}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fullMapTitleText}>{selectedLgu.name}</Text>
              <Text style={styles.fullMapTitleSub}>{reports.filter(r => r.location).length} reports · {LOCAL_LGUS.length} LGUs</Text>
            </View>
            <Ionicons name="layers-outline" size={20} color="#1A1A1A" />
          </View>

          <View style={styles.fullMapLegend}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#1A1A1A' }]} />
              <Text style={styles.legendText}>Selected LGU centroid</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: ACCENT }]} />
              <Text style={styles.legendText}>Your reports ({reports.filter(r => r.location).length})</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: PASTELS.sage, opacity: 0.6 }]} />
              <Text style={styles.legendText}>Other municipalities</Text>
            </View>
          </View>
        </View>
      )}

      {/* Service Application Form Modal */}
      {activeService && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 99, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setActiveService(null)} />
          <View style={[styles.modalSheet, { backgroundColor: T.bg }]}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.modalIconCircle, { backgroundColor: activeService.color }]}>
                <Ionicons name={activeService.icon} size={26} color="#1A1A1A" />
              </View>
              <Text style={[styles.serif, { color: T.text, fontSize: 24, marginTop: 14 }]}>
                {activeService.label}.
              </Text>
              <Text style={[styles.muted, { color: T.textMuted, marginTop: 4, marginBottom: 20 }]}>
                {activeService.desc}
              </Text>

              <Text style={[styles.label, { color: T.textMuted }]}>FULL NAME</Text>
              <TextInput
                style={[styles.input, { color: T.text, backgroundColor: T.card, borderColor: T.border }]}
                value={svcFullName}
                onChangeText={setSvcFullName}
                placeholder="Juan Dela Cruz"
                placeholderTextColor={T.textMuted}
              />

              <Text style={[styles.label, { color: T.textMuted }]}>PURPOSE</Text>
              <TextInput
                style={[styles.textarea, { color: T.text, backgroundColor: T.card, borderColor: T.border, minHeight: 70 }]}
                value={svcPurpose}
                onChangeText={setSvcPurpose}
                placeholder="e.g. for school enrollment, employment requirement"
                placeholderTextColor={T.textMuted}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: T.textMuted }]}>COPIES</Text>
                  <TextInput
                    style={[styles.input, { color: T.text, backgroundColor: T.card, borderColor: T.border }]}
                    value={svcCopies}
                    onChangeText={setSvcCopies}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={[styles.label, { color: T.textMuted }]}>CONTACT (OPTIONAL)</Text>
                  <TextInput
                    style={[styles.input, { color: T.text, backgroundColor: T.card, borderColor: T.border }]}
                    value={svcContact}
                    onChangeText={setSvcContact}
                    placeholder="09171234567"
                    placeholderTextColor={T.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={[styles.modalNotice, { backgroundColor: T.card, borderColor: T.border }]}>
                <Ionicons name="information-circle-outline" size={18} color={T.textMuted} />
                <Text style={[styles.muted, { color: T.textMuted, fontSize: 12, flex: 1, marginLeft: 8 }]}>
                  Pay & pick up at {selectedLgu.name} Treasurer's counter. Bring a valid government ID.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: T.text, marginTop: 18 }]}
                onPress={submitServiceForm}
              >
                <Text style={[styles.primaryButtonText, { color: T.bg }]}>Submit application</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: 'transparent', marginTop: 6, marginBottom: 8 }]}
                onPress={() => setActiveService(null)}
              >
                <Text style={[styles.primaryButtonText, { color: T.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

        {/* ───── HOME TAB ───── */}
        {activeTab === 'home' && (
          <View style={{ padding: 20 }}>
            {/* Header */}
            <View style={styles.topBar}>
              <View>
                <Text style={[styles.muted, { color: T.textMuted }]}>Magandang araw,</Text>
                <Text style={[styles.serif, { color: T.text, fontSize: 24, marginTop: 2 }]}>
                  {citizen.name.split(' ')[0]}.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: T.card, borderColor: T.border }]}
                onPress={() => setActiveTab('profile')}
              >
                <Ionicons name="person-outline" size={20} color={T.text} />
              </TouchableOpacity>
            </View>

            {/* Hero LGU Card */}
            <View style={[styles.heroCard, { backgroundColor: selectedLgu.color }]}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroLabel}>YOUR MUNICIPALITY</Text>
                  <Text style={styles.heroLgu}>{selectedLgu.name.replace('Municipality of ', '')}</Text>
                  <Text style={styles.heroBarangay}>Barangay {citizen.barangay}</Text>
                </View>
                <TouchableOpacity onPress={() => setScreen('lgu-select')} style={styles.heroSwitch}>
                  <Ionicons name="swap-horizontal" size={16} color="#1A1A1A" />
                </TouchableOpacity>
              </View>
              <View style={styles.heroStatsRow}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{serviceRequests.length}</Text>
                  <Text style={styles.heroStatLabel}>Applications</Text>
                </View>
                <View style={[styles.heroStatDivider]} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{reports.length}</Text>
                  <Text style={styles.heroStatLabel}>Reports</Text>
                </View>
                <View style={[styles.heroStatDivider]} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>3</Text>
                  <Text style={styles.heroStatLabel}>Notices</Text>
                </View>
              </View>
            </View>

            {/* Quick actions */}
            <SectionHeader title="Quick actions" T={T} />
            <View style={styles.quickGrid}>
              {[
                { icon: 'document-text-outline', label: 'Apply',      onPress: () => setActiveTab('services'), color: PASTELS.sage },
                { icon: 'camera-outline',        label: 'Report',     onPress: () => setActiveTab('reports'),  color: PASTELS.pink },
                { icon: 'chatbubble-outline',    label: 'Assistant',  onPress: () => setActiveTab('chatbot'),  color: PASTELS.cream },
                { icon: 'map-outline',           label: 'Map',        onPress: () => setMapOpen(true),         color: PASTELS.lilac },
              ].map(a => (
                <TouchableOpacity key={a.label} style={[styles.quickItem, { backgroundColor: a.color }]} onPress={a.onPress} activeOpacity={0.85}>
                  <Ionicons name={a.icon as any} size={26} color="#1A1A1A" />
                  <Text style={styles.quickLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* News carousel */}
            <SectionHeader title="What's happening" action="See all" T={T} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
              {NEWS_FEED.map(n => (
                <View key={n.id} style={[styles.newsCard, { backgroundColor: n.color }]}>
                  <View style={styles.newsTag}><Text style={styles.newsTagText}>{n.tag}</Text></View>
                  <Text style={styles.newsTitle}>{n.title}</Text>
                  <Text style={styles.newsDate}>Dec 14, 2026</Text>
                </View>
              ))}
            </ScrollView>

            {/* Emergency */}
            <SectionHeader title="Emergency hotlines" T={T} />
            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border, padding: 4 }]}>
              {[
                { name: 'Police (PNP)',     number: '117',  icon: 'shield-outline' },
                { name: 'Fire Bureau (BFP)', number: '160', icon: 'flame-outline' },
                { name: 'Medical / Rescue', number: '911',  icon: 'medkit-outline' },
              ].map((h, i) => (
                <TouchableOpacity
                  key={h.name}
                  style={[styles.emergencyRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: T.border }]}
                  onPress={() => Alert.alert('Calling…', `Dial ${h.number}?`)}
                >
                  <View style={[styles.emergencyIcon, { backgroundColor: T.cardAlt }]}>
                    <Ionicons name={h.icon as any} size={18} color={T.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: T.text, fontWeight: '600' }}>{h.name}</Text>
                    <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Tap to dial · {h.number}</Text>
                  </View>
                  <Ionicons name="call-outline" size={18} color={ACCENT} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ───── SERVICES TAB ───── */}
        {activeTab === 'services' && (
          <View style={{ padding: 20 }}>
            <Text style={[styles.serif, { color: T.text, fontSize: 28 }]}>Services.</Text>
            <Text style={[styles.muted, { color: T.textMuted, marginTop: 6, marginBottom: 22 }]}>
              Apply online · pay & claim at the counter
            </Text>

            <View style={styles.serviceGrid}>
              {SERVICES.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.serviceCard, { backgroundColor: s.color }]}
                  onPress={() => openServiceForm(s)}
                  activeOpacity={0.85}
                >
                  <View style={styles.serviceIconWrap}>
                    <Ionicons name={s.icon as any} size={22} color="#1A1A1A" />
                  </View>
                  <Text style={styles.serviceLabel}>{s.label}</Text>
                  <Text style={styles.serviceDesc}>{s.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {serviceRequests.length > 0 && (
              <>
                <SectionHeader title="My applications" T={T} />
                {serviceRequests.map(r => (
                  <View key={r.id} style={[styles.requestCard, { backgroundColor: T.card, borderColor: T.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.requestRef, { color: T.textMuted }]}>{r.referenceNumber}</Text>
                      <Text style={[styles.requestType, { color: T.text }]}>{r.serviceType}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: PASTELS.sage }]}>
                      <Text style={styles.statusPillText}>{r.status}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* ───── REPORTS TAB ───── */}
        {activeTab === 'reports' && (
          <View style={{ padding: 20 }}>
            <Text style={[styles.serif, { color: T.text, fontSize: 28 }]}>Report.</Text>
            <Text style={[styles.muted, { color: T.textMuted, marginTop: 6, marginBottom: 22 }]}>
              Help your barangay · captured by YOLOv11
            </Text>

            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
              <Text style={[styles.label, { color: T.textMuted }]}>CATEGORY</Text>
              <View style={styles.catGrid}>
                {REPORT_CATEGORIES.map(c => {
                  const active = reportCategory === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setReportCategory(c.id)}
                      style={[
                        styles.catItem,
                        { backgroundColor: active ? T.text : T.cardAlt, borderColor: T.border },
                      ]}
                    >
                      <Ionicons name={c.icon as any} size={20} color={active ? T.bg : T.text} />
                      <Text style={[styles.catLabel, { color: active ? T.bg : T.text }]}>{c.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: T.textMuted, marginTop: 14 }]}>DESCRIPTION</Text>
              <TextInput
                style={[styles.textarea, { color: T.text, backgroundColor: T.cardAlt, borderColor: T.border }]}
                value={reportDesc}
                onChangeText={setReportDesc}
                placeholder="Describe location and details…"
                placeholderTextColor={T.textMuted}
                multiline
              />

              <TouchableOpacity
                style={[styles.cameraButton, { backgroundColor: T.text }]}
                onPress={openCamera}
              >
                <Ionicons name="camera-outline" size={20} color={T.bg} />
                <Text style={[styles.cameraButtonText, { color: T.bg }]}>
                  {snappedPhoto ? 'Retake photo' : 'Capture photo'}
                </Text>
              </TouchableOpacity>

              {snappedPhoto && (
                <View style={[styles.photoPreview, { borderColor: T.border }]}>
                  <Image source={{ uri: snappedPhoto }} style={styles.photoImage} />
                  <View style={[styles.confidencePill, { backgroundColor: (mlConfidence || 0) > 0.7 ? PASTELS.sage : PASTELS.butter }]}>
                    <Text style={styles.confidenceText}>
                      {((mlConfidence || 0) * 100).toFixed(0)}% confidence
                    </Text>
                  </View>
                </View>
              )}

              {/* Mini map preview when location captured */}
              {reportLocation && (
                <View style={[styles.miniMapWrap, { borderColor: T.border }]}>
                  <MapView
                    style={styles.miniMap}
                    provider={PROVIDER_DEFAULT}
                    region={{
                      latitude: reportLocation.lat,
                      longitude: reportLocation.lng,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                    pointerEvents="none"
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                  >
                    <Marker
                      coordinate={{ latitude: reportLocation.lat, longitude: reportLocation.lng }}
                      pinColor={ACCENT}
                    />
                  </MapView>
                </View>
              )}

              {/* Location capture */}
              <TouchableOpacity
                onPress={fetchReportLocation}
                activeOpacity={0.85}
                style={[styles.locationCard, { backgroundColor: T.cardAlt, borderColor: T.border }]}
              >
                <View style={[styles.locationIcon, { backgroundColor: reportLocation ? PASTELS.sage : T.card }]}>
                  {locationLoading
                    ? <ActivityIndicator size="small" color={T.text} />
                    : <Ionicons name={reportLocation ? 'location' : 'location-outline'} size={20} color="#1A1A1A" />}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  {reportLocation ? (
                    <>
                      <Text style={[styles.locationLabel, { color: T.textMuted }]}>GPS LOCATION · ±{Math.round(reportLocation.accuracy || 0)}m</Text>
                      <Text style={[styles.locationAddress, { color: T.text }]} numberOfLines={2}>
                        {reportLocation.address}
                      </Text>
                      <Text style={[styles.locationCoords, { color: T.textMuted }]}>
                        {reportLocation.lat.toFixed(5)}, {reportLocation.lng.toFixed(5)}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.locationLabel, { color: T.textMuted }]}>LOCATION REQUIRED</Text>
                      <Text style={[styles.locationAddress, { color: T.text }]}>
                        {locationLoading ? 'Fetching GPS…' : 'Tap to use my location'}
                      </Text>
                    </>
                  )}
                </View>
                {reportLocation && (
                  <Ionicons name="refresh" size={18} color={T.textMuted} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: ACCENT, marginTop: 14 }]}
                onPress={submitReport}
              >
                <Text style={[styles.primaryButtonText, { color: '#1A1A1A' }]}>Submit report</Text>
              </TouchableOpacity>
            </View>

            {reports.length > 0 && (
              <>
                <SectionHeader title="My reports" T={T} />
                {reports.map(r => (
                  <View key={r.id} style={[styles.requestCard, { backgroundColor: T.card, borderColor: T.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.requestRef, { color: T.textMuted }]}>{r.referenceNumber}</Text>
                      <Text style={[styles.requestType, { color: T.text }]} numberOfLines={1}>
                        {r.description || r.category.replace('_', ' ')}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: PASTELS.blue }]}>
                      <Text style={styles.statusPillText}>{r.status}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* ───── CHATBOT TAB ───── */}
        {activeTab === 'chatbot' && (
          <View style={{ padding: 20 }}>
            <Text style={[styles.serif, { color: T.text, fontSize: 28 }]}>Assistant.</Text>
            <Text style={[styles.muted, { color: T.textMuted, marginTop: 6, marginBottom: 22 }]}>
              Ask about permits, certificates, and reports
            </Text>

            <View style={[styles.chatArea, { backgroundColor: T.card, borderColor: T.border }]}>
              {chatMessages.map((m, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.chatBubble,
                    m.sender === 'user'
                      ? [styles.userBubble, { backgroundColor: T.text }]
                      : [styles.botBubble, { backgroundColor: T.cardAlt }],
                  ]}
                >
                  <Text style={{ color: m.sender === 'user' ? T.bg : T.text, fontSize: 14, lineHeight: 20 }}>
                    {m.text}
                  </Text>
                </View>
              ))}
            </View>

            <View style={[styles.chatInputBar, { backgroundColor: T.card, borderColor: T.border }]}>
              <TextInput
                style={[styles.chatInput, { color: T.text }]}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask anything…"
                placeholderTextColor={T.textMuted}
                onSubmitEditing={sendChatMessage}
              />
              <TouchableOpacity
                style={[styles.chatSend, { backgroundColor: ACCENT }]}
                onPress={sendChatMessage}
              >
                <Ionicons name="arrow-up" size={20} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.muted, { color: T.textMuted, fontSize: 11, textAlign: 'center', marginTop: 12 }]}>
              Try: "How do I apply for a business permit?"
            </Text>
          </View>
        )}

        {/* ───── PROFILE TAB ───── */}
        {activeTab === 'profile' && (
          <View style={{ padding: 20 }}>
            <Text style={[styles.serif, { color: T.text, fontSize: 28 }]}>Profile.</Text>
            <Text style={[styles.muted, { color: T.textMuted, marginTop: 6, marginBottom: 22 }]}>
              Account · settings · privacy
            </Text>

            <View style={[styles.profileCard, { backgroundColor: selectedLgu.color }]}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileInitials}>
                  {citizen.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </Text>
              </View>
              <Text style={styles.profileName}>{citizen.name}</Text>
              <Text style={styles.profileMeta}>{citizen.email}</Text>
              <View style={styles.profileBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#1A1A1A" />
                <Text style={styles.profileBadgeText}>{citizen.role} · Verified</Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border, padding: 4 }]}>
              <View style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: T.cardAlt }]}><Ionicons name="moon-outline" size={18} color={T.text} /></View>
                <Text style={[styles.menuLabel, { color: T.text }]}>Dark mode</Text>
                <Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{ true: ACCENT, false: T.chip }} thumbColor="#FFF" />
              </View>
              <View style={[styles.divider, { backgroundColor: T.border }]} />
              <View style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: T.cardAlt }]}><Ionicons name="location-outline" size={18} color={T.text} /></View>
                <Text style={[styles.menuLabel, { color: T.text }]}>GPS geofence</Text>
                <Switch value={consentLocation} onValueChange={setConsentLocation} trackColor={{ true: ACCENT, false: T.chip }} thumbColor="#FFF" />
              </View>
              <View style={[styles.divider, { backgroundColor: T.border }]} />
              <View style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: T.cardAlt }]}><Ionicons name="notifications-outline" size={18} color={T.text} /></View>
                <Text style={[styles.menuLabel, { color: T.text }]}>Push notifications</Text>
                <Switch value={consentPush} onValueChange={setConsentPush} trackColor={{ true: ACCENT, false: T.chip }} thumbColor="#FFF" />
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border, padding: 4 }]}>
              {[
                { icon: 'business-outline',    label: 'Switch municipality', onPress: () => setScreen('lgu-select') },
                { icon: 'document-text-outline', label: 'Privacy notice (RA 10173)' },
                { icon: 'help-circle-outline', label: 'Help & support' },
                { icon: 'log-out-outline',     label: 'Sign out',            onPress: () => { setScreen('login'); setOtpSent(false); setOtpCode(''); } },
              ].map((m, i, arr) => (
                <TouchableOpacity
                  key={m.label}
                  style={[styles.menuRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.border }]}
                  onPress={m.onPress}
                >
                  <View style={[styles.menuIcon, { backgroundColor: T.cardAlt }]}><Ionicons name={m.icon as any} size={18} color={T.text} /></View>
                  <Text style={[styles.menuLabel, { color: T.text }]}>{m.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={T.textMuted} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.muted, { color: T.textMuted, textAlign: 'center', marginTop: 16, fontSize: 11 }]}>
              AGAPP · v1.0.0 · Compliant with RA 10173
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ───── BOTTOM TAB BAR ───── */}
      <View style={[styles.tabBar, { backgroundColor: T.card, borderColor: T.border }]}>
        {[
          { id: 'home',     icon: 'home-outline',         iconActive: 'home' },
          { id: 'services', icon: 'grid-outline',         iconActive: 'grid' },
          { id: 'reports',  icon: 'megaphone-outline',    iconActive: 'megaphone' },
          { id: 'chatbot',  icon: 'chatbubble-outline',   iconActive: 'chatbubble' },
          { id: 'profile',  icon: 'person-outline',       iconActive: 'person' },
        ].map(t => {
          const isActive = activeTab === t.id;
          return (
            <Pressable
              key={t.id}
              style={styles.tabItem}
              onPress={() => setActiveTab(t.id as any)}
            >
              <View style={[styles.tabIconWrap, isActive && { backgroundColor: T.text }]}>
                <Ionicons
                  name={(isActive ? t.iconActive : t.icon) as any}
                  size={20}
                  color={isActive ? T.bg : T.textMuted}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES  ───────────────────────────────────────────────────────────────────
// ============================================================================
const { width: SCREEN_W } = Dimensions.get('window');

const styles = StyleSheet.create({
  screen: { flex: 1 },
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  splashTag: { color: '#9CA3AF', fontSize: 10, letterSpacing: 3, marginTop: 16, fontWeight: '600' },

  serif: { fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), fontStyle: 'italic', fontWeight: '400', letterSpacing: -0.5 },
  muted: { fontSize: 13 },

  loginScroll: { padding: 20, paddingBottom: 40 },
  logoPill: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: RADIUS.pill },

  card: {
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },

  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 8 },

  input: {
    height: 50,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    fontSize: 15,
    borderWidth: 1,
    marginBottom: 14,
  },
  inputCenter: { textAlign: 'center', letterSpacing: 6, fontSize: 18, fontWeight: '700' },

  consentRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 4, paddingVertical: 6 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 2 },
  consentText: { flex: 1, fontSize: 12, lineHeight: 18 },

  primaryButton: {
    height: 52,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryButtonText: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  demoHint: { fontSize: 11, textAlign: 'center', marginTop: 12 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  divider: { height: 1, marginVertical: 4 },

  // LGU select
  lguCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: RADIUS.lg,
    marginBottom: 14,
  },
  lguIconCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  lguName: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.3 },
  lguRegion: { fontSize: 12, color: '#1A1A1A', opacity: 0.65, marginTop: 4 },
  lguArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
  },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: RADIUS.md, borderWidth: 1, marginTop: 8,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 17, marginLeft: 10 },

  // Top bar
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  // Hero
  heroCard: {
    borderRadius: RADIUS.xl,
    padding: 22,
    marginBottom: 24,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6, color: '#1A1A1A', opacity: 0.55 },
  heroLgu: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', marginTop: 4, letterSpacing: -0.6 },
  heroBarangay: { fontSize: 13, color: '#1A1A1A', opacity: 0.7, marginTop: 4 },
  heroSwitch: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroStatsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: RADIUS.lg, padding: 14, marginTop: 18,
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
  heroStatLabel: { fontSize: 10, color: '#1A1A1A', opacity: 0.6, marginTop: 2, fontWeight: '600', letterSpacing: 0.5 },
  heroStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(26,26,26,0.12)' },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  sectionAction: { fontSize: 12, fontWeight: '600' },

  // Quick actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  quickItem: {
    width: (SCREEN_W - 40 - 30) / 4,
    aspectRatio: 0.95,
    borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14,
  },
  quickLabel: { fontSize: 11, fontWeight: '700', color: '#1A1A1A', marginTop: 8, letterSpacing: -0.2 },

  // News
  newsCard: {
    width: 220, padding: 16, marginRight: 12, borderRadius: RADIUS.lg,
  },
  newsTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.55)',
    marginBottom: 60,
  },
  newsTagText: { fontSize: 10, fontWeight: '700', color: '#1A1A1A', letterSpacing: 0.5 },
  newsTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.3, lineHeight: 20 },
  newsDate: { fontSize: 11, color: '#1A1A1A', opacity: 0.6, marginTop: 6 },

  // Emergency
  emergencyRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  emergencyIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 12 },

  // Services
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  serviceCard: {
    width: (SCREEN_W - 40 - 12) / 2,
    padding: 16, borderRadius: RADIUS.lg, minHeight: 130,
  },
  serviceIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  serviceLabel: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.2 },
  serviceDesc: { fontSize: 11, color: '#1A1A1A', opacity: 0.65, marginTop: 4 },

  requestCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: 10,
  },
  requestRef: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  requestType: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  statusPill: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill,
  },
  statusPillText: { fontSize: 10, fontWeight: '800', color: '#1A1A1A', letterSpacing: 0.4 },

  // Reports - categories
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: RADIUS.pill, borderWidth: 1,
  },
  catLabel: { fontSize: 12, fontWeight: '700', marginLeft: 6 },

  textarea: {
    minHeight: 90, padding: 12, fontSize: 14,
    borderRadius: RADIUS.md, borderWidth: 1, marginBottom: 14,
    textAlignVertical: 'top',
  },
  cameraButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 50, borderRadius: RADIUS.pill,
  },
  cameraButtonText: { fontSize: 14, fontWeight: '700', marginLeft: 8 },
  photoPreview: {
    marginTop: 14, borderRadius: RADIUS.md, borderWidth: 1, overflow: 'hidden', position: 'relative',
  },
  photoImage: { width: '100%', aspectRatio: 4 / 3 },
  confidencePill: {
    position: 'absolute', top: 10, right: 10,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill,
  },
  confidenceText: { fontSize: 10, fontWeight: '800', color: '#1A1A1A', letterSpacing: 0.3 },

  // Chat
  chatArea: {
    minHeight: 380, padding: 14, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: 14,
  },
  chatBubble: { padding: 12, borderRadius: RADIUS.md, marginVertical: 4, maxWidth: '85%' },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 6 },
  botBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 6 },
  chatInputBar: {
    flexDirection: 'row', alignItems: 'center',
    padding: 6, borderRadius: RADIUS.pill, borderWidth: 1,
  },
  chatInput: { flex: 1, fontSize: 14, paddingHorizontal: 14, height: 42 },
  chatSend: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },

  // Camera
  cameraOverlay: { flex: 1, padding: 20, justifyContent: 'space-between' },
  cameraClose: {
    alignSelf: 'flex-end',
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  cameraBottom: { alignItems: 'center', paddingBottom: 30 },
  captureButton: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: '#FFF',
  },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF' },
  cameraHint: { color: '#FFF', fontSize: 12, marginTop: 14, opacity: 0.85 },

  // Profile
  profileCard: {
    padding: 24, borderRadius: RADIUS.xl, alignItems: 'center', marginBottom: 14,
  },
  profileAvatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  profileInitials: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
  profileName: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginTop: 14, letterSpacing: -0.3 },
  profileMeta: { fontSize: 13, color: '#1A1A1A', opacity: 0.65, marginTop: 4 },
  profileBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.55)', marginTop: 14,
  },
  profileBadgeText: { fontSize: 11, fontWeight: '700', color: '#1A1A1A', marginLeft: 4 },

  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  menuIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600' },

  // Tab bar
  tabBar: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    height: 64, borderRadius: RADIUS.pill, borderWidth: 1,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },

  // Reusable chip
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: RADIUS.pill, borderWidth: 1, marginRight: 8,
  },
  chipText: { fontSize: 12, fontWeight: '700', letterSpacing: -0.1 },

  statCard: { padding: 16, borderRadius: RADIUS.lg, flex: 1 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: '#1A1A1A', opacity: 0.6, marginTop: 4, fontWeight: '600' },

  // Mini map
  miniMapWrap: {
    marginTop: 14,
    height: 160,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  miniMap: { flex: 1 },

  // Fullscreen map modal
  fullMap: { flex: 1 },
  fullMapClose: {
    position: 'absolute', top: 50, left: 16,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fullMapTitle: {
    position: 'absolute', top: 50, left: 70, right: 16, height: 42,
    backgroundColor: '#FFF',
    borderRadius: 21, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fullMapTitleText: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', flex: 1, letterSpacing: -0.2 },
  fullMapTitleSub: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  fullMapLegend: {
    position: 'absolute', bottom: 30, left: 16, right: 16,
    backgroundColor: '#FFF',
    borderRadius: RADIUS.lg,
    padding: 14,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  legendText: { fontSize: 12, color: '#1A1A1A', fontWeight: '600' },

  // Location card
  locationCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: RADIUS.md, borderWidth: 1, marginTop: 14,
  },
  locationIcon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  locationLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  locationAddress: { fontSize: 13, fontWeight: '600', marginTop: 4, lineHeight: 18 },
  locationCoords: { fontSize: 11, marginTop: 2 },

  // Service application modal
  modalSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: 20,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.4)',
    alignSelf: 'center', marginBottom: 18,
  },
  modalIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  modalNotice: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 12, borderRadius: RADIUS.md, borderWidth: 1, marginTop: 6,
  },
});
