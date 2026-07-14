import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Image, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { globalStyles, ACCENT } from '../theme';
import { supabase } from '../../supabaseClient';
import { useToast } from '../components/Toast';
import {
  ID_TYPES, getBarangays, getVerificationStatus, statusLabel,
} from '../utils/verification';

type Step = 0 | 1 | 2 | 3;

export function VerifyIdentityScreen({ navigation }: any) {
  const { T } = useTheme();
  const { showToast } = useToast();
  const { profile, selectedLgu, refreshProfile } = useAuth();

  const [step, setStep] = useState<Step>(0);
  const [idType, setIdType] = useState<typeof ID_TYPES[number]['value']>('PhilSys');
  const [idUri, setIdUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [barangay, setBarangay] = useState<string>(profile?.barangay || '');
  const [submitting, setSubmitting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState<null | 'idType' | 'barangay'>(null);

  const status = getVerificationStatus(profile);
  const barangays = getBarangays(selectedLgu?.id);
  const lguId = selectedLgu?.id;

  // ----- image capture (mirrors ReportsScreen pattern) -----
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
      allowsEditing: true,
      aspect,
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
      allowsEditing: true,
      aspect,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setter(result.assets[0].uri);
    }
  };

  const uploadPrivate = async (uri: string, kind: 'id' | 'selfie'): Promise<string> => {
    // ArrayBuffer, NOT blob: React Native's Blob doesn't serialize through
    // supabase-js's fetch — uploads die with "Network request failed".
    // ArrayBuffer is the officially supported RN/Expo upload path.
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

  const handleSubmit = async () => {
    if (!profile || !lguId) {
      showToast('Missing account or LGU. Please re-select your municipality.', 'error');
      return;
    }
    if (!idUri || !selfieUri) {
      showToast('Please capture both your ID and a selfie.', 'error');
      return;
    }
    if (!barangay.trim()) {
      showToast('Please select the barangay printed on your ID.', 'error');
      setStep(0);
      return;
    }

    setSubmitting(true);
    // Track what we've uploaded so we can clean up if a later step fails,
    // otherwise a failed insert leaves orphaned PII files in the bucket.
    const uploadedPaths: string[] = [];
    try {
      // 1. Upload both images to the private bucket
      const idPath = await uploadPrivate(idUri, 'id');
      uploadedPaths.push(idPath);
      const selfiePath = await uploadPrivate(selfieUri, 'selfie');
      uploadedPaths.push(selfiePath);

      // 2. Insert the verification request. A database trigger on this
      //    table automatically flips the user's verification_status to
      //    'pending' — we never write verification columns from the client.
      const { error: reqError } = await supabase.from('verification_requests').insert({
        user_id: profile.id,
        lgu_id: lguId,
        id_type: idType,
        id_document_path: idPath,
        selfie_path: selfiePath,
        declared_barangay: barangay.trim(),
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
      // Best-effort cleanup of anything we already uploaded.
      if (uploadedPaths.length > 0) {
        await supabase.storage.from('citizen-ids').remove(uploadedPaths).catch(() => {});
      }

      // The INSERT policy requires the row's lgu_id to match the user's own
      // users.lgu_id. A guest who picked a different municipality than their
      // account will trip row-level security here — explain it in plain terms.
      const raw = err?.message || '';
      const isRls = err?.code === '42501' || /row-level security|policy/i.test(raw);
      // Keep the captured ID/selfie photos and barangay/ID type in state so
      // the citizen can just tap Submit again — no need to redo the capture.
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

  // ----- step validation -----
  const canNext = [
    !!barangay.trim(),  // step 0
    !!idUri,            // step 1
    !!selfieUri,        // step 2
    true,               // step 3
  ];

  const stepLabels = ['Residency', 'ID document', 'Selfie', 'Review'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: T.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={T.text} />
        </TouchableOpacity>
        <Text style={[globalStyles.serif, { color: T.text, fontSize: 18 }]}>Verify Identity</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stepper */}
      <View style={[styles.stepper, { borderBottomColor: T.border }]}>
        {stepLabels.map((label, i) => (
          <View key={label} style={styles.stepItem}>
            <View style={[
              styles.stepDot,
              {
                backgroundColor: i <= step ? ACCENT : T.chip,
                borderColor: i <= step ? ACCENT : T.border,
              },
            ]}>
              {i < step ? (
                <Ionicons name="checkmark" size={14} color="#FFF" />
              ) : (
                <Text style={{ color: i <= step ? '#FFF' : T.textMuted, fontWeight: '700', fontSize: 12 }}>{i + 1}</Text>
              )}
            </View>
            <Text style={{ fontSize: 11, color: i <= step ? T.text : T.textMuted, marginTop: 4 }}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Re-submit notice */}
        {status === 'rejected' && step === 0 && (
          <View style={[styles.notice, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={[styles.noticeText, { color: '#991B1B' }]}>
              Your last submission was rejected
              {profile?.rejection_reason ? `: ${profile.rejection_reason}` : '.'} Please re-submit.
            </Text>
          </View>
        )}

        {/* STEP 0 — Residency */}
        {step === 0 && (
          <View>
            <Text style={[globalStyles.serif, { color: T.text, marginBottom: 8, fontSize: 22 }]}>Confirm your residency</Text>
            <Text style={[globalStyles.muted, { color: T.textMuted, marginBottom: 20 }]}>
              Select the barangay printed on your ID. Your LGU will confirm it matches during review.
            </Text>

            <Text style={[globalStyles.label, { color: T.textMuted }]}>LGU</Text>
            <View style={[globalStyles.card, { backgroundColor: T.cardAlt, borderColor: T.border, marginBottom: 16 }]}>
              <Text style={{ color: T.text, fontSize: 16 }}>{selectedLgu?.name || 'No LGU selected'}</Text>
            </View>

            <Text style={[globalStyles.label, { color: T.textMuted }]}>BARANGAY (AS ON YOUR ID)</Text>
            <TouchableOpacity
              style={[globalStyles.input, { borderColor: T.border, backgroundColor: T.cardAlt, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => setPickerOpen('barangay')}
            >
              <Text style={{ color: barangay ? T.text : T.textMuted, fontSize: 16 }}>
                {barangay || 'Select your barangay'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={T.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 1 — ID document */}
        {step === 1 && (
          <View>
            <Text style={[globalStyles.serif, { color: T.text, marginBottom: 8, fontSize: 22 }]}>Photograph your ID</Text>
            <Text style={[globalStyles.muted, { color: T.textMuted, marginBottom: 20 }]}>
              Use a government-issued ID. Make sure all text is sharp and readable.
            </Text>

            <Text style={[globalStyles.label, { color: T.textMuted }]}>ID TYPE</Text>
            <TouchableOpacity
              style={[globalStyles.input, { borderColor: T.border, backgroundColor: T.cardAlt, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => setPickerOpen('idType')}
            >
              <Text style={{ color: T.text, fontSize: 16 }}>
                {ID_TYPES.find(t => t.value === idType)?.label}
              </Text>
              <Ionicons name="chevron-down" size={18} color={T.textMuted} />
            </TouchableOpacity>

            <Text style={[globalStyles.label, { color: T.textMuted, marginTop: 8 }]}>ID PHOTO</Text>
            {idUri ? (
              <View>
                <Image source={{ uri: idUri }} style={[styles.preview, { borderColor: T.border }]} resizeMode="cover" />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <SecondaryButton T={T} icon="camera-outline" label="Retake" onPress={() => captureImage(setIdUri)} />
                  <SecondaryButton T={T} icon="images-outline" label="Choose" onPress={() => pickFromLibrary(setIdUri)} />
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
        )}

        {/* STEP 2 — Selfie */}
        {step === 2 && (
          <View>
            <Text style={[globalStyles.serif, { color: T.text, marginBottom: 8, fontSize: 22 }]}>Selfie with your ID</Text>
            <Text style={[globalStyles.muted, { color: T.textMuted, marginBottom: 20 }]}>
              Hold your ID next to your face. This helps your LGU confirm you are the real owner of the ID.
            </Text>

            {selfieUri ? (
              <View>
                <Image source={{ uri: selfieUri }} style={[styles.previewSquare, { borderColor: T.border }]} resizeMode="cover" />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <SecondaryButton T={T} icon="camera-outline" label="Retake" onPress={() => captureImage(setSelfieUri, [3, 4], 'front')} />
                  <SecondaryButton T={T} icon="images-outline" label="Choose" onPress={() => pickFromLibrary(setSelfieUri, [3, 4])} />
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
        )}

        {/* STEP 3 — Review */}
        {step === 3 && (
          <View>
            <Text style={[globalStyles.serif, { color: T.text, marginBottom: 8, fontSize: 22 }]}>Review &amp; submit</Text>
            <Text style={[globalStyles.muted, { color: T.textMuted, marginBottom: 20 }]}>
              Double-check everything below. Your documents are stored privately under RA 10173.
            </Text>

            <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border }]}>
              <ReviewRow T={T} label="LGU" value={selectedLgu?.name || '-'} />
              <ReviewRow T={T} label="Barangay" value={barangay} />
              <ReviewRow T={T} label="ID type" value={ID_TYPES.find(t => t.value === idType)?.label || idType} />
            </View>

            <Text style={[globalStyles.label, { color: T.textMuted, marginTop: 16 }]}>ID DOCUMENT</Text>
            {idUri && <Image source={{ uri: idUri }} style={[styles.preview, { borderColor: T.border }]} resizeMode="cover" />}

            <Text style={[globalStyles.label, { color: T.textMuted, marginTop: 16 }]}>SELFIE WITH ID</Text>
            {selfieUri && <Image source={{ uri: selfieUri }} style={[styles.previewSquare, { borderColor: T.border }]} resizeMode="cover" />}

            <View style={[styles.notice, { backgroundColor: T.cardAlt, borderColor: T.border, marginTop: 16 }]}>
              <Ionicons name="lock-closed" size={18} color={T.textMuted} />
              <Text style={[styles.noticeText, { color: T.textMuted }]}>
                Your ID is private. Only LGU staff in {selectedLgu?.name?.replace('Municipality of ', '') || 'your municipality'} can view it for verification.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer nav */}
      <View style={[styles.footer, { backgroundColor: T.card, borderTopColor: T.border }]}>
        {step > 0 && (
          <TouchableOpacity
            style={[globalStyles.primaryButton, { backgroundColor: T.chip, flex: 1, marginRight: 8 }]}
            onPress={() => setStep((step - 1) as Step)}
            disabled={submitting}
          >
            <Text style={[globalStyles.primaryButtonText, { color: T.text }]}>Back</Text>
          </TouchableOpacity>
        )}
        {step < 3 ? (
          <TouchableOpacity
            style={[globalStyles.primaryButton, { backgroundColor: canNext[step] ? T.text : T.chip, flex: 2 }]}
            onPress={() => canNext[step] && setStep((step + 1) as Step)}
            disabled={!canNext[step]}
          >
            <Text style={[globalStyles.primaryButtonText, { color: canNext[step] ? T.bg : T.textMuted }]}>Continue</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[globalStyles.primaryButton, { backgroundColor: ACCENT, flex: 2 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#FFF" />
              : <Text style={[globalStyles.primaryButtonText, { color: '#FFF' }]}>Submit for review</Text>}
          </TouchableOpacity>
        )}
      </View>

      {/* Picker modal (reused for idType + barangay) */}
      <Modal visible={pickerOpen !== null} transparent animationType="slide" onRequestClose={() => setPickerOpen(null)}>
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerSheet, { backgroundColor: T.card }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: T.border }]}>
              <Text style={[globalStyles.serif, { color: T.text, fontSize: 18 }]}>
                {pickerOpen === 'idType' ? 'Select ID type' : 'Select barangay'}
              </Text>
              <TouchableOpacity onPress={() => setPickerOpen(null)}>
                <Ionicons name="close" size={24} color={T.textMuted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={pickerOpen === 'idType' ? ID_TYPES.map(t => ({ key: t.value, label: t.label })) : barangays.map(b => ({ key: b, label: b }))}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => {
                const selected = pickerOpen === 'idType' ? idType === item.key : barangay === item.key;
                return (
                  <TouchableOpacity
                    style={[styles.pickerRow, { borderBottomColor: T.border }]}
                    onPress={() => {
                      if (pickerOpen === 'idType') setIdType(item.key as any);
                      else setBarangay(item.key);
                      setPickerOpen(null);
                    }}
                  >
                    <Text style={{ color: T.text, fontSize: 16, flex: 1 }}>{item.label}</Text>
                    {selected && <Ionicons name="checkmark" size={20} color={ACCENT} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---- small presentational helpers (kept inline to match repo style) ----

function CapturePicker({ T, onCamera, onLibrary }: { T: any; onCamera: () => void; onLibrary: () => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <TouchableOpacity
        style={[globalStyles.card, { backgroundColor: T.cardAlt, borderColor: T.border, flex: 1, alignItems: 'center', paddingVertical: 24 }]}
        onPress={onCamera}
      >
        <Ionicons name="camera-outline" size={28} color={T.text} />
        <Text style={{ color: T.text, fontSize: 14, fontWeight: '600', marginTop: 8 }}>Take photo</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[globalStyles.card, { backgroundColor: T.cardAlt, borderColor: T.border, flex: 1, alignItems: 'center', paddingVertical: 24 }]}
        onPress={onLibrary}
      >
        <Ionicons name="images-outline" size={28} color={T.text} />
        <Text style={{ color: T.text, fontSize: 14, fontWeight: '600', marginTop: 8 }}>Choose</Text>
      </TouchableOpacity>
    </View>
  );
}

function SecondaryButton({ T, icon, label, onPress }: { T: any; icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[globalStyles.card, { backgroundColor: T.cardAlt, borderColor: T.border, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={T.text} style={{ marginRight: 6 }} />
      <Text style={{ color: T.text, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function ReviewRow({ T, label, value }: { T: any; label: string; value: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[globalStyles.label, { color: T.textMuted }]}>{label.toUpperCase()}</Text>
      <Text style={{ color: T.text, fontSize: 16 }}>{value}</Text>
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
  pickerRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
});
