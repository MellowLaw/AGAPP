import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Image, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { globalStyles } from '../theme';
import { supabase } from '../../supabaseClient';
import { useToast } from '../components/Toast';
import {
  ID_TYPES, getBarangays, getVerificationStatus, statusLabel,
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
  const [barangay, setBarangay] = useState<string>(profile?.barangay || '');
  const [submitting, setSubmitting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState<null | 'idType' | 'barangay'>(null);

  const status = getVerificationStatus(profile);
  const barangays = getBarangays(selectedLgu?.id);
  const lguId = selectedLgu?.id;

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
    const uploadedPaths: string[] = [];
    try {
      const idPath = await uploadPrivate(idUri, 'id');
      uploadedPaths.push(idPath);
      const selfiePath = await uploadPrivate(selfieUri, 'selfie');
      uploadedPaths.push(selfiePath);

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
    !!barangay.trim(),  // step 0
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
            <View>
              <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 8, fontSize: 24 }}>Confirm residency</Text>
              <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginBottom: 20 }}>
                Select the barangay printed on your ID. Your LGU will confirm it matches during review.
              </Text>

              <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 8 }}>LGU</Text>
              <View style={{
                backgroundColor: T.cardAlt,
                borderWidth: 1,
                borderColor: T.border,
                borderRadius: 20,
                padding: 16,
                marginBottom: 16,
              }}>
                <Text style={{ color: T.text, fontSize: 16, fontFamily: 'Inter-Medium' }}>{selectedLgu?.name || 'No LGU selected'}</Text>
              </View>

              <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 8 }}>BARANGAY (AS ON YOUR ID)</Text>
              <TouchableOpacity
                style={{
                  height: 48,
                  borderColor: T.border,
                  backgroundColor: T.cardAlt,
                  borderRadius: 999, // Pill layout
                  borderWidth: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                }}
                onPress={() => setPickerOpen('barangay')}
                activeOpacity={0.8}
              >
                <Text style={{ color: barangay ? T.text : T.textMuted, fontSize: 15, fontFamily: 'Inter-Medium' }}>
                  {barangay || 'Select your barangay'}
                </Text>
                <ArrowDown2 size={18} color={T.textMuted} variant="Bold" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 1 — ID document */}
          {step === 1 && (
            <View>
              <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 8, fontSize: 24 }}>Photograph your ID</Text>
              <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginBottom: 20 }}>
                Use a government-issued ID. Make sure all text is sharp and readable.
              </Text>

              <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 8 }}>ID TYPE</Text>
              <TouchableOpacity
                style={{
                  height: 48,
                  borderColor: T.border,
                  backgroundColor: T.cardAlt,
                  borderRadius: 999, // Pill layout
                  borderWidth: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                }}
                onPress={() => setPickerOpen('idType')}
                activeOpacity={0.8}
              >
                <Text style={{ color: T.text, fontSize: 15, fontFamily: 'Inter-Medium' }}>
                  {ID_TYPES.find(t => t.value === idType)?.label}
                </Text>
                <ArrowDown2 size={18} color={T.textMuted} variant="Bold" />
              </TouchableOpacity>

              <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginTop: 16, marginBottom: 8 }}>ID PHOTO</Text>
              {idUri ? (
                <View>
                  <Image source={{ uri: idUri }} style={[styles.preview, { borderColor: T.border }]} resizeMode="cover" />
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
          )}

          {/* STEP 2 — Selfie */}
          {step === 2 && (
            <View>
              <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 8, fontSize: 24 }}>Selfie with your ID</Text>
              <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginBottom: 20 }}>
                Hold your ID next to your face so we can verify the ID owner.
              </Text>

              {selfieUri ? (
                <View>
                  <Image source={{ uri: selfieUri }} style={[styles.previewSquare, { borderColor: T.border }]} resizeMode="cover" />
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
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <View>
              <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 8, fontSize: 24 }}>Review &amp; submit</Text>
              <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginBottom: 20 }}>
                Double-check details before submitting. Stored securely per RA 10173.
              </Text>

              <View style={{
                backgroundColor: T.card,
                borderColor: T.border,
                borderWidth: 1,
                borderRadius: 24,
                padding: 16,
              }}>
                <ReviewRow T={T} label="LGU" value={selectedLgu?.name || '-'} />
                <ReviewRow T={T} label="Barangay" value={barangay} />
                <ReviewRow T={T} label="ID type" value={ID_TYPES.find(t => t.value === idType)?.label || idType} />
              </View>

              <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginTop: 16, marginBottom: 8 }}>ID DOCUMENT</Text>
              {idUri && <Image source={{ uri: idUri }} style={[styles.preview, { borderColor: T.border }]} resizeMode="cover" />}

              <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginTop: 16, marginBottom: 8 }}>SELFIE WITH ID</Text>
              {selfieUri && <Image source={{ uri: selfieUri }} style={[styles.previewSquare, { borderColor: T.border }]} resizeMode="cover" />}

              <View style={[styles.notice, { backgroundColor: T.cardAlt, borderColor: T.border, marginTop: 16 }]}>
                <Lock size={18} color={T.textMuted} variant="Bold" />
                <Text style={[styles.noticeText, { color: T.textMuted, fontFamily: 'Inter-Medium' }]}>
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

        {/* Picker modal (idType + barangay) */}
        <Modal visible={pickerOpen !== null} transparent animationType="slide" onRequestClose={() => setPickerOpen(null)}>
          <View style={styles.pickerOverlay}>
            <View style={[styles.pickerSheet, { backgroundColor: T.card, borderWidth: 1, borderColor: T.border }]}>
              <View style={[styles.pickerHeader, { borderBottomColor: T.border }]}>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 18 }}>
                  {pickerOpen === 'idType' ? 'Select ID type' : 'Select barangay'}
                </Text>
                <TouchableOpacity onPress={() => setPickerOpen(null)}>
                  <CloseSquare size={22} color={T.textMuted} variant="Bold" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={pickerOpen === 'idType' ? ID_TYPES.map(t => ({ key: t.value, label: t.label })) : barangays.map(b => ({ key: b, label: b }))}
                keyExtractor={(item) => item.key}
                contentContainerStyle={{ paddingBottom: 40 }}
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
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: T.text, fontSize: 16, fontFamily: 'Inter-Medium', flex: 1 }}>{item.label}</Text>
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
      <Text style={{ color: T.text, fontFamily: 'Inter-Medium', fontSize: 15 }}>{value}</Text>
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
