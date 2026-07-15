import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Image, Linking, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { ScreenBackground } from '../components/ScreenBackground';
import { globalStyles, PASTELS } from '../theme';
import { supabase } from '../../supabaseClient';
import { getVerificationStatus, statusLabel, VerificationStatus } from '../utils/verification';
import {
  Moon,
  ShieldTick,
  ShieldSecurity,
  DocumentText,
  Clock,
  Logout,
  ArrowRight2,
  CloseSquare,
  Timer,
  Warning2,
  ShieldCross,
  Location as LocationIcon,
  Camera,
  Sms,
} from 'iconsax-react-native';

const ICON_SIZE = 26; // no more icon-circle backdrop, so icons need to read on their own
const ARROW_SIZE = 24;

const BADGE_STYLE: Record<VerificationStatus, { bg: string; icon: any; iconColor: string; textColor: string }> = {
  verified:   { bg: 'rgba(34,197,94,0.25)',  icon: ShieldTick,  iconColor: '#166534', textColor: '#166534' },
  pending:    { bg: 'rgba(234,179,8,0.25)',   icon: Timer,    iconColor: '#854D0E', textColor: '#854D0E' },
  rejected:   { bg: 'rgba(239,68,68,0.25)',   icon: Warning2, iconColor: '#991B1B', textColor: '#991B1B' },
  unverified: { bg: 'rgba(26,26,26,0.08)',    icon: ShieldCross, iconColor: '#292929', textColor: '#292929' },
};

export function ProfileScreen({ navigation }: any) {
  const { T, isDarkMode, setIsDarkMode } = useTheme();
  const { profile, selectedLgu, signOut, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [infoModal, setInfoModal] = useState<null | 'terms' | 'security' | 'history'>(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => setGpsEnabled(status === 'granted'));
  }, []);

  const handleToggleGps = async () => {
    if (gpsEnabled) {
      // Apps can't programmatically revoke a granted OS permission — send the
      // user to device Settings, same pattern already used in ReportsScreen.
      Linking.openSettings();
      return;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    setGpsEnabled(status === 'granted');
  };

  const openHistory = async () => {
    setInfoModal('history');
    setHistoryLoading(true);
    const [{ data: reports }, { data: requests }] = await Promise.all([
      supabase.from('reports').select('id, reference_number, category, status, created_at').eq('citizen_id', profile?.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('service_requests').select('id, reference_number, service_type, status, created_at').eq('citizen_id', profile?.id).order('created_at', { ascending: false }).limit(20),
    ]);
    const combined = [
      ...(reports || []).map((r: any) => ({ id: r.id, ref: r.reference_number, label: r.category, status: r.status, created_at: r.created_at, type: 'report' as const })),
      ...(requests || []).map((r: any) => ({ id: r.id, ref: r.reference_number, label: r.service_type, status: r.status, created_at: r.created_at, type: 'service' as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setHistoryItems(combined);
    setHistoryLoading(false);
  };

  // Fixed path per user ("{uid}/avatar.jpg") + upsert so re-uploads cleanly
  // overwrite the same storage object instead of accumulating orphaned files.
  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('We need access to your photos to set a profile picture.', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setAvatarUploading(true);
    try {
      const response = await fetch(result.assets[0].uri);
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
        showToast('Selected image must be less than 5MB.', 'error');
        return;
      }

      const fileName = `${profile.id}/avatar.jpg`;
      // Delete-then-insert instead of upsert:true. Supabase Storage's upsert
      // runs an INSERT ... ON CONFLICT DO UPDATE under the hood, which hit
      // "new row violates row-level security policy" in testing even though
      // the ownership predicate itself checks out — report-photos/service-
      // attachments never hit this because every upload there gets a unique
      // timestamped filename and never conflicts. Plain delete + insert only
      // exercises the DELETE/INSERT policies, which are the same simple,
      // proven-working shape already used for report-photos.
      await supabase.storage.from('profile-photos').remove([fileName]);
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(fileName);
      // Cache-bust so the new photo shows immediately instead of the CDN's
      // previously-cached response for the same fixed path.
      const bustedUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: dbError } = await supabase.from('users').update({ avatar_url: bustedUrl }).eq('id', profile.id);
      if (dbError) throw dbError;

      await refreshProfile();
      showToast('Profile picture updated.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update profile picture.', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  const openEmailModal = () => {
    setNewEmail(profile?.email || '');
    setEmailModalOpen(true);
  };

  const handleChangeEmail = async () => {
    const cleanEmail = newEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setEmailSaving(true);
    try {
      // Supabase's default double-opt-in flow sends a confirmation link to
      // the new address — auth.users.email (and this profile's email) only
      // actually changes once the user clicks it, so we deliberately don't
      // touch public.users.email here to avoid it going out of sync.
      const { error } = await supabase.auth.updateUser({ email: cleanEmail });
      if (error) throw error;
      showToast('Check your new email address for a confirmation link.', 'success');
      setEmailModalOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update email.', 'error');
    } finally {
      setEmailSaving(false);
    }
  };

  const name = profile?.name || 'Citizen';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const status = getVerificationStatus(profile);
  
  // Theme-aware badge styles for high contrast in both themes
  const badge = {
    ...BADGE_STYLE[status],
    bg: status === 'verified'
      ? (isDarkMode ? 'rgba(74,222,128,0.15)' : 'rgba(34,197,94,0.25)')
      : status === 'pending'
      ? (isDarkMode ? 'rgba(251,191,36,0.15)' : 'rgba(234,179,8,0.25)')
      : status === 'rejected'
      ? (isDarkMode ? 'rgba(248,113,113,0.15)' : 'rgba(239,68,68,0.25)')
      : (isDarkMode ? 'rgba(255,252,245,0.08)' : 'rgba(26,26,26,0.08)'),
    iconColor: status === 'verified'
      ? (isDarkMode ? '#4ADE80' : '#166534')
      : status === 'pending'
      ? (isDarkMode ? '#FBBF24' : '#854D0E')
      : status === 'rejected'
      ? (isDarkMode ? '#F87171' : '#991B1B')
      : (isDarkMode ? '#FFFCF5' : '#292929'),
    textColor: status === 'verified'
      ? (isDarkMode ? '#4ADE80' : '#166534')
      : status === 'pending'
      ? (isDarkMode ? '#FBBF24' : '#854D0E')
      : status === 'rejected'
      ? (isDarkMode ? '#F87171' : '#991B1B')
      : (isDarkMode ? '#FFFCF5' : '#292929'),
  };

  const rowStatusColor = status === 'unverified' ? T.text : badge.textColor;
  const ctaLabel = status === 'verified' ? null
    : status === 'pending' ? null
    : status === 'rejected' ? 'Re-submit verification'
    : 'Verify your identity';

  const goToVerify = () => navigation?.navigate('VerifyIdentity');
  
  const StatusIcon = badge.icon;

  return (
    <ScreenBackground>
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 32 }}>Profile.</Text>
        <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginTop: 4, marginBottom: 22 }}>
          Account · settings · privacy
        </Text>

        {/* Profile Info Summary Card */}
        <View style={{
          padding: 24,
          borderRadius: 24, // radii card 24
          alignItems: 'center',
          marginBottom: 16,
          backgroundColor: T.card,
          borderWidth: 1,
          borderColor: T.border,
        }}>
          <TouchableOpacity onPress={handleChangeAvatar} activeOpacity={0.85} disabled={avatarUploading}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#292929', // fixed ink-black avatar backdrop, same in both themes
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
              overflow: 'hidden',
            }}>
              {avatarUploading ? (
                <ActivityIndicator color="#FFFCF5" />
              ) : profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={{ width: 80, height: 80 }} />
              ) : (
                <Text style={{ fontSize: 26, fontFamily: 'Octarine-Bold', color: '#FFFCF5' }}>{initials}</Text>
              )}
            </View>
            <View style={{
              position: 'absolute',
              right: -2,
              bottom: 12,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: T.accentSoft,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: T.card,
            }}>
              <Camera size={14} color="#292929" variant="Bold" />
            </View>
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 4 }}>{name}</Text>
          <Text style={{ fontSize: 14, fontFamily: 'Inter-Medium', color: T.textMuted, marginBottom: 12 }}>{profile?.email}</Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999, // Pill layout
            backgroundColor: badge.bg,
          }}>
            <StatusIcon size={12} color={badge.iconColor} variant="Bold" />
            <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: badge.textColor, marginLeft: 6 }}>{statusLabel(status)}</Text>
          </View>
          {status === 'rejected' && profile?.rejection_reason && (
            <Text style={{ fontSize: 12, fontFamily: 'Inter-Medium', marginTop: 8, textAlign: 'center', paddingHorizontal: 16, lineHeight: 16, color: badge.textColor }}>
              {profile.rejection_reason}
            </Text>
          )}
        </View>

        {ctaLabel && (
          <TouchableOpacity
            style={{
              height: 52,
              borderRadius: 999,
              backgroundColor: '#292929',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
              gap: 8,
            }}
            onPress={goToVerify}
            activeOpacity={0.9}
          >
            <ShieldTick size={20} color="#FFFCF5" variant="Bold" />
            <Text style={{ color: '#FFFCF5', fontFamily: 'Octarine-Bold', fontSize: 15 }}>{ctaLabel}</Text>
          </TouchableOpacity>
        )}

        {/* Settings blocks */}
        <View style={{
          backgroundColor: T.card,
          borderWidth: 1,
          borderColor: T.border,
          borderRadius: 24,
          padding: 6,
          marginBottom: 12,
        }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
            onPress={() => setIsDarkMode(!isDarkMode)}
            activeOpacity={0.8}
          >
            <Moon size={ICON_SIZE} color={T.text} variant="Bold" style={{ marginRight: 14 }} />
            <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Octarine-Bold', color: T.text }}>Dark mode</Text>

            {/* Toggle Track */}
            <View style={{
              width: 44,
              height: 26,
              borderRadius: 13,
              justifyContent: 'center',
              backgroundColor: isDarkMode ? T.accentSoft : T.border,
            }}>
              <View style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: '#FFF',
                transform: [{ translateX: isDarkMode ? 18 : 2 }],
              }} />
            </View>
          </TouchableOpacity>

          <View style={{ height: 1, marginLeft: 16, backgroundColor: T.border, opacity: 0.3 }} />

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
            onPress={handleToggleGps}
            activeOpacity={0.8}
          >
            <LocationIcon size={ICON_SIZE} color={T.text} variant="Bold" style={{ marginRight: 14 }} />
            <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Octarine-Bold', color: T.text }}>GPS Access</Text>

            <View style={{
              width: 44,
              height: 26,
              borderRadius: 13,
              justifyContent: 'center',
              backgroundColor: gpsEnabled ? T.accentSoft : T.border,
            }}>
              <View style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: '#FFF',
                transform: [{ translateX: gpsEnabled ? 18 : 2 }],
              }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Profile Settings — email + profile picture (name stays fixed, must match the verified ID) */}
        <View style={{
          backgroundColor: T.card,
          borderWidth: 1,
          borderColor: T.border,
          borderRadius: 24,
          padding: 6,
          marginBottom: 12,
        }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
            onPress={openEmailModal}
            activeOpacity={0.8}
          >
            <Sms size={ICON_SIZE} color={T.text} variant="Bold" style={{ marginRight: 14 }} />
            <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Octarine-Bold', color: T.text }}>Change email</Text>
            <ArrowRight2 size={ARROW_SIZE} color={T.textMuted} variant="Bold" />
          </TouchableOpacity>

          <View style={{ height: 1, marginLeft: 16, backgroundColor: T.border, opacity: 0.3 }} />

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
            onPress={handleChangeAvatar}
            activeOpacity={0.8}
            disabled={avatarUploading}
          >
            <Camera size={ICON_SIZE} color={T.text} variant="Bold" style={{ marginRight: 14 }} />
            <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Octarine-Bold', color: T.text }}>Change profile picture</Text>
            <ArrowRight2 size={ARROW_SIZE} color={T.textMuted} variant="Bold" />
          </TouchableOpacity>
        </View>

        <View style={{
          backgroundColor: T.card,
          borderWidth: 1,
          borderColor: T.border,
          borderRadius: 24,
          padding: 6,
        }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
            onPress={goToVerify}
            activeOpacity={0.8}
          >
            <ShieldTick size={ICON_SIZE} color={T.text} variant="Bold" style={{ marginRight: 14 }} />
            <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Octarine-Bold', color: T.text }}>Account Verification</Text>
            <Text style={{ color: rowStatusColor, fontSize: 12, fontFamily: 'Octarine-Bold', marginRight: 8 }}>{statusLabel(status)}</Text>
            <ArrowRight2 size={ARROW_SIZE} color={T.textMuted} variant="Bold" />
          </TouchableOpacity>

          <View style={{ height: 1, marginLeft: 16, backgroundColor: T.border, opacity: 0.3 }} />

          {[
            { icon: ShieldSecurity, label: 'Security', onPress: () => setInfoModal('security'), color: T.text },
            { icon: Clock, label: 'History', onPress: openHistory, color: T.text },
            { icon: DocumentText, label: 'Terms & Conditions', onPress: () => setInfoModal('terms'), color: T.text },
            { icon: Logout, label: 'Logout', onPress: signOut, color: '#DC2626' },
          ].map((m, i, arr) => {
            const MenuIcon = m.icon;
            return (
              <React.Fragment key={m.label}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
                  onPress={m.onPress}
                  activeOpacity={0.8}
                >
                  <MenuIcon size={ICON_SIZE} color={m.color} variant="Bold" style={{ marginRight: 14 }} />
                  <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Octarine-Bold', color: m.color }}>{m.label}</Text>
                  <ArrowRight2 size={ARROW_SIZE} color={T.textMuted} variant="Bold" />
                </TouchableOpacity>
                {i < arr.length - 1 && (
                  <View style={{ height: 1, marginLeft: 16, backgroundColor: T.border, opacity: 0.3 }} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={{
          color: T.textMuted,
          textAlign: 'center',
          marginTop: 24,
          fontSize: 11,
          fontFamily: 'Inter-Medium',
        }}>
          AGAPP · v1.0.0 · Compliant with RA 10173
        </Text>
      </ScrollView>

      {/* Change Email Modal */}
      <Modal visible={emailModalOpen} transparent animationType="slide" onRequestClose={() => setEmailModalOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: T.card, borderWidth: 1, borderColor: T.border, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 18 }}>Change email</Text>
              <TouchableOpacity onPress={() => setEmailModalOpen(false)}>
                <CloseSquare size={22} color={T.textMuted} variant="Bold" />
              </TouchableOpacity>
            </View>
            <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 13, marginBottom: 16, lineHeight: 18 }}>
              We'll send a confirmation link to your new address — your email only changes once you click it.
            </Text>
            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="you@email.com"
              placeholderTextColor={T.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                height: 48,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: T.border,
                backgroundColor: T.bg,
                color: T.text,
                fontFamily: 'Inter-Medium',
                paddingHorizontal: 20,
                fontSize: 14,
                marginBottom: 16,
              }}
            />
            <TouchableOpacity
              onPress={handleChangeEmail}
              disabled={emailSaving}
              activeOpacity={0.9}
              style={{
                height: 52,
                borderRadius: 999,
                backgroundColor: T.accentSoft,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: emailSaving ? 0.6 : 1,
              }}
            >
              {emailSaving ? (
                <ActivityIndicator color="#292929" />
              ) : (
                <Text style={{ color: '#292929', fontFamily: 'Octarine-Bold', fontSize: 15 }}>Send confirmation link</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Info Modal Sheet */}
      <Modal visible={infoModal !== null} transparent animationType="slide" onRequestClose={() => setInfoModal(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%', backgroundColor: T.card, borderWidth: 1, borderColor: T.border }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: T.border,
            }}>
              <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 18 }}>
                {infoModal === 'terms' ? 'Terms & Conditions' : infoModal === 'security' ? 'Security' : 'History'}
              </Text>
              <TouchableOpacity onPress={() => setInfoModal(null)}>
                <CloseSquare size={22} color={T.textMuted} variant="Bold" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              {infoModal === 'terms' ? (
                <Text style={{ color: T.text, fontFamily: 'Inter-Medium', fontSize: 14, lineHeight: 22 }}>
                  By using AGAPP you agree to submit accurate information when filing reports
                  or applying for services, and to use the app only for its intended purpose
                  of accessing your local government's services and reporting community
                  concerns. The LGU is not liable for delays caused by incomplete or
                  inaccurate submissions.{'\n\n'}
                  <Text style={{ fontFamily: 'Octarine-Bold' }}>Privacy notice (RA 10173){'\n'}</Text>
                  In compliance with the Data Privacy Act of 2012 (RA 10173), AGAPP collects
                  and processes only the personal data needed to deliver LGU services to you:{'\n\n'}
                  • Your name, email address, and barangay, for your citizen account and profile.{'\n'}
                  • A government-issued ID photo and a selfie, used solely to verify your
                  identity before you can submit reports or apply for services.{'\n'}
                  • GPS coordinates and photos attached to a report, used to locate and
                  document the issue you're reporting.{'\n\n'}
                  This data is used only to deliver, verify, and process the services you
                  request, and is shared only with the LGU staff responsible for handling
                  your request. It is stored securely and is not sold or shared with third
                  parties. You may contact your LGU's office to request access, correction,
                  or deletion of your data, subject to what the law and recordkeeping
                  requirements allow.
                </Text>
              ) : infoModal === 'security' ? (
                <Text style={{ color: T.text, fontFamily: 'Inter-Medium', fontSize: 14, lineHeight: 22 }}>
                  Your account is protected by a password only you know — AGAPP never stores
                  it in plain text. If you're using a shared or public device, always tap
                  Logout when you're done to keep your account and verification documents
                  safe.{'\n\n'}
                  If you notice unfamiliar activity on your account, or need help with a
                  report or service application, visit your Municipal Hall, Monday to Friday,
                  8:00 AM – 5:00 PM, and speak with the office relevant to your concern
                  (e.g. the Treasurer's Office, Civil Registrar, or MSWDO). You can also
                  reach out through your LGU's official contact channels (posted at the
                  Municipal Hall or on their official social media page).
                </Text>
              ) : historyLoading ? (
                <ActivityIndicator color={T.text} style={{ marginTop: 20 }} />
              ) : historyItems.length === 0 ? (
                <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 14, textAlign: 'center', marginTop: 20 }}>
                  No reports or service requests yet.
                </Text>
              ) : (
                historyItems.map((h) => (
                  <TouchableOpacity
                    key={`${h.type}-${h.id}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: T.border,
                    }}
                    onPress={() => {
                      setInfoModal(null);
                      navigation.navigate('TrackingDetail', { id: h.id, type: h.type });
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: T.text, fontFamily: 'Octarine-Bold', fontSize: 14 }}>{h.label || h.ref}</Text>
                      <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 12, marginTop: 2 }}>
                        {h.ref} · {new Date(h.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={{ color: T.accent, fontFamily: 'Octarine-Bold', fontSize: 12, marginRight: 8 }}>{h.status}</Text>
                    <ArrowRight2 size={16} color={T.textMuted} variant="Bold" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </ScreenBackground>
  );
}
