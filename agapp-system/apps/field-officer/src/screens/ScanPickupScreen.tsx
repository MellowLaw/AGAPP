import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../contexts/ThemeContext';
import { globalStyles, ACCENT, PASTELS } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabaseClient';

type LookupResult = {
  request_id: string;
  reference_number: string;
  citizen_name: string;
  service_type: string;
  office_name: string;
  status: string;
  released_at: string | null;
};

// QR payload format is `agap:claim:<code>` (see mobile TrackingDetailScreen);
// strip the prefix if present so scanning and manual entry both normalize the same way.
function extractCode(raw: string): string {
  const trimmed = raw.trim();
  const prefix = 'agap:claim:';
  return trimmed.toLowerCase().startsWith(prefix) ? trimmed.slice(prefix.length) : trimmed;
}

export function ScanPickupScreen() {
  const { T } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const lastScanned = useRef<string | null>(null);

  const lookup = async (rawCode: string) => {
    const code = extractCode(rawCode);
    if (!code) return;
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    try {
      const { data, error } = await supabase.rpc('lookup_claim_code', { p_code: code });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error('Code not found.');
      setResult(row);
      setScannedCode(code); // release_service_request matches on claim_code, not reference_number
      setScanning(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Code not found.');
      setScanning(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!scanning || loading) return;
    if (lastScanned.current === data) return;
    lastScanned.current = data;
    lookup(data);
  };

  const reset = () => {
    lastScanned.current = null;
    setResult(null);
    setScannedCode(null);
    setErrorMsg(null);
    setManualCode('');
    setScanning(true);
  };

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: T.bg }} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Ionicons name="camera-outline" size={48} color={T.textMuted} style={{ marginBottom: 16 }} />
        <Text style={{ color: T.text, fontSize: 16, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>Camera access needed</Text>
        <Text style={{ color: T.textMuted, fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
          Allow camera access to scan citizen pickup QR codes.
        </Text>
        <TouchableOpacity style={[globalStyles.primaryButton, { backgroundColor: ACCENT, paddingHorizontal: 24 }]} onPress={requestPermission}>
          <Text style={[globalStyles.primaryButtonText, { color: '#1A1A1A' }]}>Grant permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ padding: 24, paddingBottom: 12 }}>
        <Text style={[globalStyles.h2, { color: T.text }]}>Scan Pickup QR</Text>
        <Text style={{ color: T.textMuted, fontSize: 14, marginTop: 4 }}>Verify a citizen's claim code to release their document.</Text>
      </View>

      {scanning && !result && !errorMsg && (
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          <View style={styles.cameraWrap}>
            <CameraView
              style={{ flex: 1 }}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
            <View style={styles.frameOverlay} pointerEvents="none" />
          </View>
          {loading && (
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <ActivityIndicator color={T.text} />
            </View>
          )}

          <Text style={{ color: T.textMuted, fontSize: 13, textAlign: 'center', marginTop: 20, marginBottom: 10 }}>
            Or enter the code manually
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              style={[globalStyles.input, { flex: 1, marginBottom: 0, color: T.text, backgroundColor: T.cardAlt, borderColor: T.border, textTransform: 'uppercase' }]}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="ABC-1234"
              placeholderTextColor={T.textMuted}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.manualBtn, { backgroundColor: ACCENT }]}
              onPress={() => lookup(manualCode)}
              disabled={!manualCode || loading}
            >
              <Text style={{ color: '#1A1A1A', fontWeight: '700' }}>Look up</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {errorMsg && (
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' }}>
          <View style={[globalStyles.card, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', alignItems: 'center', width: '100%' }]}>
            <Ionicons name="close-circle-outline" size={40} color="#B91C1C" style={{ marginBottom: 10 }} />
            <Text style={{ color: '#991B1B', fontSize: 15, fontWeight: '700', textAlign: 'center' }}>{errorMsg}</Text>
          </View>
          <TouchableOpacity style={[globalStyles.secondaryButton, { borderColor: T.border, marginTop: 16, paddingHorizontal: 30 }]} onPress={reset}>
            <Text style={[globalStyles.secondaryButtonText, { color: T.text }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {result && (
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
          <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border }]}>
            {result.status === 'Released' ? (
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="alert-circle-outline" size={36} color="#D97706" />
                <Text style={{ color: '#92400E', fontWeight: '700', marginTop: 8, textAlign: 'center' }}>
                  Already released{result.released_at ? ` at ${new Date(result.released_at).toLocaleString()}` : ''}
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={[styles.avatarCircle, { backgroundColor: PASTELS.sage }]}>
                  <Ionicons name="person" size={28} color="#1A1A1A" />
                </View>
              </View>
            )}

            <Text style={[styles.metaLabel, { color: T.textMuted }]}>CITIZEN</Text>
            <Text style={{ color: T.text, fontSize: 18, fontWeight: '700', marginBottom: 14 }}>{result.citizen_name}</Text>

            <Text style={[styles.metaLabel, { color: T.textMuted }]}>DOCUMENT</Text>
            <Text style={{ color: T.text, fontSize: 15, marginBottom: 14 }}>{result.service_type} · {result.office_name}</Text>

            <Text style={[styles.metaLabel, { color: T.textMuted }]}>REFERENCE</Text>
            <Text style={{ color: T.text, fontSize: 15, marginBottom: 14 }}>{result.reference_number}</Text>

            {result.status !== 'Released' && scannedCode && (
              <ReleaseButton claimCode={scannedCode} onDone={reset} />
            )}
          </View>

          <TouchableOpacity style={[globalStyles.secondaryButton, { borderColor: T.border, marginTop: 16 }]} onPress={reset}>
            <Text style={[globalStyles.secondaryButtonText, { color: T.text }]}>{result.status === 'Released' ? 'Scan next' : 'Cancel'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// Separate so it can hold its own local `releasing` state without cluttering the parent.
function ReleaseButton({ claimCode, onDone }: { claimCode: string; onDone: () => void }) {
  const [releasing, setReleasing] = useState(false);

  const handleRelease = async () => {
    setReleasing(true);
    try {
      const { error } = await supabase.rpc('release_service_request', { p_code: claimCode });
      if (error) throw error;
      Alert.alert('Released', 'The document has been marked as released.');
      onDone();
    } catch (err: any) {
      Alert.alert('Could not release', err.message || 'Please try again.');
    } finally {
      setReleasing(false);
    }
  };

  return (
    <TouchableOpacity
      style={[globalStyles.primaryButton, { backgroundColor: ACCENT, marginTop: 6 }]}
      onPress={handleRelease}
      disabled={releasing}
    >
      {releasing ? <ActivityIndicator color="#1A1A1A" /> : (
        <Text style={[globalStyles.primaryButtonText, { color: '#1A1A1A' }]}>Confirm Release</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cameraWrap: { height: 320, borderRadius: 20, overflow: 'hidden', backgroundColor: '#000' },
  frameOverlay: { position: 'absolute', top: 40, left: 40, right: 40, bottom: 40, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 16 },
  manualBtn: { paddingHorizontal: 18, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  metaLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
});
