import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { globalStyles, PASTELS, ACCENT } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';
import { getVerificationStatus, statusLabel, VerificationStatus } from '../utils/verification';

// Per-status badge styling on the profile card
const BADGE_STYLE: Record<VerificationStatus, { bg: string; icon: any; iconColor: string; textColor: string }> = {
  verified:   { bg: 'rgba(34,197,94,0.25)',  icon: 'shield-checkmark',  iconColor: '#166534', textColor: '#166534' },
  pending:    { bg: 'rgba(234,179,8,0.25)',   icon: 'hourglass',          iconColor: '#854D0E', textColor: '#854D0E' },
  rejected:   { bg: 'rgba(239,68,68,0.25)',   icon: 'alert-circle',       iconColor: '#991B1B', textColor: '#991B1B' },
  unverified: { bg: 'rgba(26,26,26,0.08)',    icon: 'shield-half-outline', iconColor: '#1A1A1A', textColor: '#1A1A1A' },
};

export function ProfileScreen({ navigation }: any) {
  const { T, isDarkMode, setIsDarkMode } = useTheme();
  const { profile, selectedLgu, signOut } = useAuth();
  const [infoModal, setInfoModal] = useState<null | 'privacy' | 'help'>(null);

  // Parse first name/initials
  const name = profile?.name || 'Citizen';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const status = getVerificationStatus(profile);
  const badge = BADGE_STYLE[status];
  const ctaLabel = status === 'verified' ? null
    : status === 'pending' ? null
    : status === 'rejected' ? 'Re-submit verification'
    : 'Verify your identity';

  const goToVerify = () => navigation?.navigate('VerifyIdentity');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Text style={[globalStyles.serif, { color: T.text, fontSize: 28 }]}>Profile.</Text>
        <Text style={[globalStyles.muted, { color: T.textMuted, marginTop: 6, marginBottom: 22 }]}>
          Account · settings · privacy
        </Text>

        <View style={[styles.profileCard, { backgroundColor: selectedLgu?.color || PASTELS.sage }]}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileMeta}>{profile?.email}</Text>
          <View style={[styles.profileBadge, { backgroundColor: badge.bg }]}>
            <Ionicons name={badge.icon as any} size={12} color={badge.iconColor} />
            <Text style={[styles.profileBadgeText, { color: badge.textColor }]}>{statusLabel(status)}</Text>
          </View>
          {status === 'rejected' && profile?.rejection_reason && (
            <Text style={[styles.rejectionNote, { color: badge.textColor }]}>
              {profile.rejection_reason}
            </Text>
          )}
        </View>

        {ctaLabel && (
          <TouchableOpacity
            style={[globalStyles.primaryButton, { backgroundColor: ACCENT, marginBottom: 16 }]}
            onPress={goToVerify}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={[globalStyles.primaryButtonText, { color: '#FFF' }]}>{ctaLabel}</Text>
          </TouchableOpacity>
        )}

        <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border, padding: 4 }]}>
          <TouchableOpacity style={styles.menuRow} onPress={() => setIsDarkMode(!isDarkMode)}>
            <View style={[styles.menuIcon, { backgroundColor: T.cardAlt }]}><Ionicons name="moon-outline" size={18} color={T.text} /></View>
            <Text style={[styles.menuLabel, { color: T.text }]}>Dark mode</Text>
            <View style={[styles.toggleTrack, { backgroundColor: isDarkMode ? '#F497A2' : T.chip }]}>
              <View style={[styles.toggleThumb, { transform: [{ translateX: isDarkMode ? 18 : 2 }] }]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border, padding: 4 }]}>
          <TouchableOpacity style={styles.menuRow} onPress={goToVerify}>
            <View style={[styles.menuIcon, { backgroundColor: T.cardAlt }]}><Ionicons name="card-outline" size={18} color={T.text} /></View>
            <Text style={[styles.menuLabel, { color: T.text }]}>Identity verification</Text>
            <Text style={{ color: badge.textColor, fontSize: 12, fontWeight: '700', marginRight: 8 }}>{statusLabel(status)}</Text>
            <Ionicons name="chevron-forward" size={18} color={T.textMuted} />
          </TouchableOpacity>

          <View style={{ height: 1, marginLeft: 68, backgroundColor: T.border }} />

          {[
            { icon: 'document-text-outline', label: 'Privacy notice (RA 10173)', onPress: () => setInfoModal('privacy') },
            { icon: 'help-circle-outline', label: 'Help & support', onPress: () => setInfoModal('help') },
            { icon: 'log-out-outline',     label: 'Sign out', onPress: signOut },
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

        <Text style={[globalStyles.muted, { color: T.textMuted, textAlign: 'center', marginTop: 16, fontSize: 11 }]}>
          AGAPP · v1.0.0 · Compliant with RA 10173
        </Text>
      </ScrollView>

      <Modal visible={infoModal !== null} transparent animationType="slide" onRequestClose={() => setInfoModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: T.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: T.border }]}>
              <Text style={[globalStyles.serif, { color: T.text, fontSize: 18 }]}>
                {infoModal === 'privacy' ? 'Privacy notice (RA 10173)' : 'Help & support'}
              </Text>
              <TouchableOpacity onPress={() => setInfoModal(null)}>
                <Ionicons name="close" size={24} color={T.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              {infoModal === 'privacy' ? (
                <Text style={{ color: T.text, fontSize: 14, lineHeight: 22 }}>
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
              ) : (
                <Text style={{ color: T.text, fontSize: 14, lineHeight: 22 }}>
                  Need help with your account, a report, or a service application?{'\n\n'}
                  Visit your Municipal Hall, Monday to Friday, 8:00 AM – 5:00 PM, and speak
                  with the office relevant to your concern (e.g. the Treasurer's Office,
                  Civil Registrar, or MSWDO).{'\n\n'}
                  You can also reach out through your LGU's official contact channels
                  (posted at the Municipal Hall or on their official social media page) for
                  questions about this app or your submitted reports and requests.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileCard: { padding: 32, borderRadius: 24, alignItems: 'center', marginBottom: 16 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  profileInitials: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  profileName: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  profileMeta: { fontSize: 14, fontWeight: '500', color: 'rgba(26,26,26,0.6)', marginBottom: 12 },
  profileBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  profileBadgeText: { fontSize: 12, fontWeight: '700', marginLeft: 4 },
  rejectionNote: { fontSize: 12, marginTop: 8, textAlign: 'center', paddingHorizontal: 16, lineHeight: 16 },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  divider: { height: 1, marginLeft: 68 },
  toggleTrack: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1,
  },
});
