import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Image, Linking, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { ScreenBackground } from '../components/ScreenBackground';
import { globalStyles, PASTELS } from '../theme';
import { Ionicons, Feather } from '@expo/vector-icons';
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
  Notification,
  User,
  Lock,
  InfoCircle,
  Danger,
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
  const { profile, selectedLgu, guestLgu, signOut, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [infoModal, setInfoModal] = useState<null | 'terms' | 'privacy' | 'security' | 'history'>(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New settings states
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editBarangay, setEditBarangay] = useState(profile?.barangay || '');
  const [editSaving, setEditSaving] = useState(false);

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [cameraEnabled, setCameraEnabled] = useState(false);

  const [helpCenterOpen, setHelpCenterOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [developerInfoOpen, setDeveloperInfoOpen] = useState(false);

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => setGpsEnabled(status === 'granted'));
    ImagePicker.getCameraPermissionsAsync().then(({ status }) => setCameraEnabled(status === 'granted'));
  }, []);

  // Update input defaults when profile changes
  useEffect(() => {
    if (profile) {
      setEditName(profile.name || '');
      setEditBarangay(profile.barangay || '');
    }
  }, [profile]);

  const handleToggleCamera = async () => {
    if (cameraEnabled) {
      Linking.openSettings();
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraEnabled(status === 'granted');
  };

  const handleEditProfile = async () => {
    if (!editName.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }
    setEditSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ name: editName.trim(), barangay: editBarangay.trim() })
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
      showToast('Profile updated successfully.', 'success');
      setEditProfileOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update profile.', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showToast('Password changed successfully.', 'success');
      setChangePasswordOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err?.message || 'Failed to change password.', 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

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

  const pushEnabled = profile?.notification_preferences?.push ?? true;
  const handleTogglePush = async () => {
    if (!profile?.id) return;
    const next = !pushEnabled;
    try {
      const { error } = await supabase
        .from('users')
        .update({
          notification_preferences: {
            ...(profile?.notification_preferences || {}),
            push: next,
          },
        })
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update push notification setting.', 'error');
    }
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

  const getSocialLinks = () => {
    const activeLgu = selectedLgu || guestLgu;
    const lguId = activeLgu?.id || 'liliw-laguna';
    const lguName = activeLgu?.name || 'Liliw';
    const cleanName = lguName.replace(/^Municipality of\s*/i, '');

    const facebook = activeLgu?.facebook_url || '';
    const youtube = activeLgu?.youtube_url || '';
    const twitter = activeLgu?.twitter_url || '';
    const website = activeLgu?.website_url || '';

    const resolvedFacebook = facebook.trim() ? facebook : (
      lguId === 'liliw-laguna' ? 'https://www.facebook.com/LiliwLocalGov' :
      lguId.includes('naga') ? 'https://www.facebook.com/NagaCityGovernment' :
      lguId === 'nagcarlan-laguna' ? 'https://www.facebook.com/nagcarlanlocalgov' :
      'https://www.facebook.com'
    );

    const resolvedYoutube = youtube.trim() ? youtube : (
      lguId === 'liliw-laguna' ? 'https://www.youtube.com/results?search_query=liliw+laguna' :
      lguId.includes('naga') ? 'https://www.youtube.com/@NagaCityGovernment' :
      lguId === 'nagcarlan-laguna' ? 'https://www.youtube.com/results?search_query=nagcarlan+laguna' :
      'https://www.youtube.com'
    );

    const resolvedTwitter = twitter.trim() ? twitter : 'https://x.com';

    const resolvedWebsite = website.trim() ? website : (
      lguId === 'liliw-laguna' ? 'http://www.liliwlaguna.gov.ph' :
      lguId.includes('naga') ? 'https://naga.gov.ph' :
      lguId === 'nagcarlan-laguna' ? 'https://nagcarlan.gov.ph' :
      'https://www.google.com'
    );

    return {
      facebook: resolvedFacebook,
      youtube: resolvedYoutube,
      twitter: resolvedTwitter,
      website: resolvedWebsite,
      websiteLabel: `${cleanName} Website`,
    };
  };

  const goToVerify = () => navigation?.navigate('VerifyIdentity');

  const handleLogout = () => {
    navigation?.navigate('LogoutConfirm');
  };
  
  const StatusIcon = badge.icon;

  return (
    <ScreenBackground>
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 32 }}>Profile.</Text>
        <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginTop: 4, marginBottom: 16 }}>
          Account · settings · privacy
        </Text>

        {/* Restricted Status Banner */}
        {profile?.moderation_status === 'restricted' && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Restricted')}
            style={{
              marginBottom: 16,
              padding: 14,
              borderRadius: 16,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <Danger size={20} color="#DC2626" variant="Bold" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Octarine-Bold', color: '#DC2626', fontSize: 13 }}>
                  Your Account is Restricted
                </Text>
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 12, marginTop: 1 }}>
                  Tap to view restriction notice & submit an appeal
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 13 }}>View →</Text>
          </TouchableOpacity>
        )}

        {/* Settings Search Bar */}
        <View style={{
          flexDirection: 'row',
          height: 46,
          borderRadius: 23,
          borderWidth: 1,
          borderColor: T.border,
          backgroundColor: T.card,
          alignItems: 'center',
          paddingHorizontal: 14,
          marginBottom: 20,
        }}>
          <Ionicons name="search-outline" size={18} color={T.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={{
              flex: 1,
              height: '100%',
              fontSize: 14,
              fontFamily: 'Inter-Medium',
              color: T.text,
            }}
            placeholder="Search settings..."
            placeholderTextColor={T.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={T.textMuted} />
            </TouchableOpacity>
          )}
        </View>

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
              ) : (
                <Image
                  source={{ uri: profile?.avatar_url || 'https://jrureblhypfdljwflout.supabase.co/storage/v1/object/public/report-photos/default-avatar.png' }}
                  style={{ width: 80, height: 80 }}
                />
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

        {(() => {
          const ALL_SETTINGS_ITEMS = [
            { category: 'Account Settings', label: 'Edit Profile', icon: User, iconType: 'iconsax' as const, onPress: () => setEditProfileOpen(true), keywords: ['edit', 'profile', 'name', 'barangay', 'update'] },
            { category: 'Account Settings', label: 'Change Profile Picture', icon: Camera, iconType: 'iconsax' as const, onPress: handleChangeAvatar, disabled: avatarUploading, keywords: ['avatar', 'picture', 'photo', 'image', 'profile picture', 'camera', 'account'] },
            { category: 'Account Settings', label: 'Change Password', icon: Lock, iconType: 'iconsax' as const, onPress: () => setChangePasswordOpen(true), keywords: ['password', 'change password', 'security', 'credential'] },
            { category: 'Account Settings', label: 'Change Email', icon: Sms, iconType: 'iconsax' as const, onPress: openEmailModal, keywords: ['email', 'change email', 'address', 'mail', 'account'] },
            { category: 'Account Settings', label: 'Account Verification', icon: ShieldTick, iconType: 'iconsax' as const, cta: statusLabel(status), textStyle: { color: rowStatusColor }, onPress: goToVerify, keywords: ['verify', 'verification', 'identity', 'id', 'status', 'account'] },
            { category: 'Account Settings', label: 'History', icon: Clock, iconType: 'iconsax' as const, onPress: openHistory, keywords: ['history', 'logs', 'past', 'requests', 'reports', 'activities', 'account'] },

            { category: 'Appearance', label: 'Dark Mode', icon: Moon, iconType: 'iconsax' as const, isToggle: true, toggleValue: isDarkMode, onPress: () => setIsDarkMode(!isDarkMode), keywords: ['dark', 'mode', 'darkmode', 'theme', 'appearance', 'light', 'night', 'color'] },

            { category: 'System Permissions', label: 'Push Notifications', icon: Notification, iconType: 'iconsax' as const, isToggle: true, toggleValue: pushEnabled, onPress: handleTogglePush, keywords: ['push', 'notifications', 'alerts', 'preferences'] },
            { category: 'System Permissions', label: 'Location Permissions', icon: LocationIcon, iconType: 'iconsax' as const, isToggle: true, toggleValue: gpsEnabled, onPress: handleToggleGps, keywords: ['gps', 'location', 'map', 'permission', 'tracking', 'access', 'preferences'] },
            { category: 'System Permissions', label: 'Camera Permissions', icon: Camera, iconType: 'iconsax' as const, isToggle: true, toggleValue: cameraEnabled, onPress: handleToggleCamera, keywords: ['camera', 'photo', 'permission', 'access', 'preferences'] },

            { category: 'Help & Support', label: 'Help Center', icon: InfoCircle, iconType: 'iconsax' as const, onPress: () => setHelpCenterOpen(true), keywords: ['help', 'support', 'contact', 'lgu', 'phone', 'municipal'] },
            { category: 'Help & Support', label: 'Frequently Asked Questions', icon: DocumentText, iconType: 'iconsax' as const, onPress: () => setFaqOpen(true), keywords: ['faq', 'questions', 'frequently asked questions', 'help', 'support'] },

            { category: 'About', label: 'Terms & Conditions', icon: DocumentText, iconType: 'iconsax' as const, onPress: () => setInfoModal('terms'), keywords: ['terms', 'conditions', 'legal', 'agreement', 'rules'] },
            { category: 'About', label: 'Privacy Policy', icon: DocumentText, iconType: 'iconsax' as const, onPress: () => setInfoModal('privacy'), keywords: ['privacy', 'policy', 'data', 'legal', 'gdpr', 'safety'] },
            { category: 'About', label: 'Developer Information', icon: InfoCircle, iconType: 'iconsax' as const, onPress: () => setDeveloperInfoOpen(true), keywords: ['developer', 'info', 'build', 'team', 'version', 'about'] },

            { category: 'Danger Zone', label: 'Delete Account', icon: Warning2, iconType: 'iconsax' as const, textStyle: { color: '#DC2626' }, onPress: () => navigation.navigate('DeleteAccount'), keywords: ['delete', 'account', 'remove', 'danger', 'erase'] },
            { category: 'Danger Zone', label: 'Logout', icon: Logout, iconType: 'iconsax' as const, isLogout: true, onPress: handleLogout, keywords: ['logout', 'sign out', 'exit', 'leave'] }
          ];

          const filtered = searchQuery.trim() === '' ? ALL_SETTINGS_ITEMS : ALL_SETTINGS_ITEMS.filter(item =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()))
          );

          if (filtered.length === 0) {
            return (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 14 }}>
                  No settings matching "{searchQuery}" found.
                </Text>
              </View>
            );
          }

          const renderItemIcon = (item: typeof ALL_SETTINGS_ITEMS[0]) => {
            if (item.iconType === 'iconsax') {
              const IconComponent = item.icon as any;
              return <IconComponent size={ICON_SIZE} color={item.isLogout ? '#DC2626' : T.text} variant="Bold" style={{ marginRight: 14 }} />;
            } else if (item.iconType === 'ionicons') {
              return <Ionicons name={item.icon as any} size={ICON_SIZE} color={T.text} style={{ marginRight: 14 }} />;
            } else if (item.iconType === 'feather') {
              return <Feather name={item.icon as any} size={ICON_SIZE} color={T.text} style={{ marginRight: 14 }} />;
            } else if (item.iconType === 'custom_x') {
              return (
                <View style={{ width: ICON_SIZE, marginRight: 14, alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontFamily: 'Octarine-Bold', color: T.text }}>1X</Text>
                </View>
              );
            }
            return null;
          };

          // If searching, render a single card list containing all matching items
          if (searchQuery.trim() !== '') {
            return (
              <View style={{
                backgroundColor: T.card,
                borderWidth: 1,
                borderColor: T.border,
                borderRadius: 24,
                padding: 6,
                marginTop: 8,
              }}>
                {filtered.map((item, index) => (
                  <React.Fragment key={item.label}>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
                      onPress={item.onPress}
                      activeOpacity={0.8}
                      disabled={item.disabled}
                    >
                      {renderItemIcon(item)}
                      <Text style={[{ flex: 1, fontSize: 15, fontFamily: 'Octarine-Bold', color: item.isLogout ? '#DC2626' : T.text }, item.textStyle]}>
                        {item.label}
                      </Text>
                      {item.isToggle ? (
                        <View style={{
                          width: 44,
                          height: 26,
                          borderRadius: 13,
                          justifyContent: 'center',
                          backgroundColor: item.toggleValue ? T.accentSoft : T.border,
                        }}>
                          <View style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: '#FFF',
                            transform: [{ translateX: item.toggleValue ? 18 : 2 }],
                          }} />
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {item.cta && (
                            <Text style={{ color: rowStatusColor, fontSize: 12, fontFamily: 'Octarine-Bold', marginRight: 8 }}>
                              {item.cta}
                            </Text>
                          )}
                          <ArrowRight2 size={ARROW_SIZE} color={T.textMuted} variant="Bold" />
                        </View>
                      )}
                    </TouchableOpacity>
                    {index < filtered.length - 1 && (
                      <View style={{ height: 1, marginLeft: 16, backgroundColor: T.border, opacity: 0.3 }} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            );
          }

          // Otherwise, render grouped by categories
          const categories = ['Account Settings', 'Appearance', 'System Permissions', 'Help & Support', 'About', 'Danger Zone'];

          return categories.map(cat => {
            const catItems = filtered.filter(item => item.category === cat);
            if (catItems.length === 0) return null;

            return (
              <React.Fragment key={cat}>
                <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 16, color: T.text, marginTop: 16, marginBottom: 10, paddingLeft: 4 }}>
                  {cat}
                </Text>
                <View style={{
                  backgroundColor: T.card,
                  borderWidth: 1,
                  borderColor: T.border,
                  borderRadius: 24,
                  padding: 6,
                  marginBottom: 12,
                }}>
                  {catItems.map((item, index) => (
                    <React.Fragment key={item.label}>
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
                        onPress={item.onPress}
                        activeOpacity={0.8}
                        disabled={item.disabled}
                      >
                        {renderItemIcon(item)}
                        <Text style={[{ flex: 1, fontSize: 15, fontFamily: 'Octarine-Bold', color: item.isLogout ? '#DC2626' : T.text }, item.textStyle]}>
                          {item.label}
                        </Text>
                        {item.isToggle ? (
                          <View style={{
                            width: 44,
                            height: 26,
                            borderRadius: 13,
                            justifyContent: 'center',
                            backgroundColor: item.toggleValue ? T.accentSoft : T.border,
                          }}>
                            <View style={{
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              backgroundColor: '#FFF',
                              transform: [{ translateX: item.toggleValue ? 18 : 2 }],
                            }} />
                          </View>
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {item.cta && (
                              <Text style={{ color: rowStatusColor, fontSize: 12, fontFamily: 'Octarine-Bold', marginRight: 8 }}>
                                {item.cta}
                              </Text>
                            )}
                            <ArrowRight2 size={ARROW_SIZE} color={T.textMuted} variant="Bold" />
                          </View>
                        )}
                      </TouchableOpacity>
                      {index < catItems.length - 1 && (
                        <View style={{ height: 1, marginLeft: 16, backgroundColor: T.border, opacity: 0.3 }} />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              </React.Fragment>
            );
          });
        })()}

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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
              <TouchableWithoutFeedback>
                <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: T.card, borderWidth: 1, borderColor: T.border, padding: 20 }}>
                  <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
                {infoModal === 'terms' ? 'Terms & Conditions' : infoModal === 'privacy' ? 'Privacy Policy' : infoModal === 'security' ? 'About Us & Security' : 'History'}
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
              ) : infoModal === 'privacy' ? (
                <Text style={{ color: T.text, fontFamily: 'Inter-Medium', fontSize: 14, lineHeight: 22 }}>
                  <Text style={{ fontFamily: 'Octarine-Bold' }}>Privacy Policy (RA 10173 Compliance){'\n'}</Text>
                  AGAPP is committed to protecting your privacy in compliance with the Data Privacy Act of 2012 (RA 10173).{'\n\n'}
                  • We collect government-issued IDs and selfies solely to verify citizen identities.{'\n'}
                  • These verification documents are processed only by LGU administrators and are deleted immediately after a decision is made.{'\n'}
                  • Your declared address, email, and name are retained only for official municipal registry records and to facilitate local government digital services.{'\n'}
                  • We employ industry-standard encryption to protect your data, and we never share or sell your personal details to third parties.{'\n\n'}
                  By using this application, you consent to the collection and processing of your personal information as detailed in this policy.
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

      {/* Edit Profile Modal */}
      <Modal visible={editProfileOpen} transparent animationType="slide" onRequestClose={() => setEditProfileOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
              <TouchableWithoutFeedback>
                <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, backgroundColor: T.card, borderWidth: 1, borderColor: T.border, maxHeight: '85%' }}>
                  <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 18 }}>Edit Profile</Text>
                      <TouchableOpacity onPress={() => setEditProfileOpen(false)}>
                        <CloseSquare size={22} color={T.textMuted} variant="Bold" />
                      </TouchableOpacity>
                    </View>

                    <Text style={{ color: T.textMuted, fontFamily: 'Octarine-Bold', fontSize: 11, marginBottom: 6 }}>NAME</Text>
                    <TextInput
                      value={editName}
                      onChangeText={setEditName}
                      style={{
                        height: 48,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: T.border,
                        backgroundColor: T.bg,
                        color: T.text,
                        fontFamily: 'Inter-Medium',
                        paddingHorizontal: 16,
                        fontSize: 14,
                        marginBottom: 16,
                      }}
                    />

                    <Text style={{ color: T.textMuted, fontFamily: 'Octarine-Bold', fontSize: 11, marginBottom: 6 }}>BARANGAY</Text>
                    <TextInput
                      value={editBarangay}
                      onChangeText={setEditBarangay}
                      style={{
                        height: 48,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: T.border,
                        backgroundColor: T.bg,
                        color: T.text,
                        fontFamily: 'Inter-Medium',
                        paddingHorizontal: 16,
                        fontSize: 14,
                        marginBottom: 24,
                      }}
                    />

                    <TouchableOpacity
                      onPress={handleEditProfile}
                      disabled={editSaving}
                      activeOpacity={0.9}
                      style={{
                        height: 52,
                        borderRadius: 999,
                        backgroundColor: '#292929',
                        justifyContent: 'center',
                        alignItems: 'center',
                        opacity: editSaving ? 0.6 : 1,
                      }}
                    >
                      {editSaving ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={{ color: '#FFFCF5', fontFamily: 'Octarine-Bold', fontSize: 15 }}>Save Changes</Text>
                      )}
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={changePasswordOpen} transparent animationType="slide" onRequestClose={() => setChangePasswordOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
              <TouchableWithoutFeedback>
                <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, backgroundColor: T.card, borderWidth: 1, borderColor: T.border, maxHeight: '85%' }}>
                  <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 18 }}>Change Password</Text>
                      <TouchableOpacity onPress={() => setChangePasswordOpen(false)}>
                        <CloseSquare size={22} color={T.textMuted} variant="Bold" />
                      </TouchableOpacity>
                    </View>

                    <Text style={{ color: T.textMuted, fontFamily: 'Octarine-Bold', fontSize: 11, marginBottom: 6 }}>NEW PASSWORD</Text>
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      style={{
                        height: 48,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: T.border,
                        backgroundColor: T.bg,
                        color: T.text,
                        fontFamily: 'Inter-Medium',
                        paddingHorizontal: 16,
                        fontSize: 14,
                        marginBottom: 16,
                      }}
                    />

                    <Text style={{ color: T.textMuted, fontFamily: 'Octarine-Bold', fontSize: 11, marginBottom: 6 }}>CONFIRM NEW PASSWORD</Text>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      style={{
                        height: 48,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: T.border,
                        backgroundColor: T.bg,
                        color: T.text,
                        fontFamily: 'Inter-Medium',
                        paddingHorizontal: 16,
                        fontSize: 14,
                        marginBottom: 24,
                      }}
                    />

                    <TouchableOpacity
                      onPress={handleChangePassword}
                      disabled={passwordSaving}
                      activeOpacity={0.9}
                      style={{
                        height: 52,
                        borderRadius: 999,
                        backgroundColor: '#292929',
                        justifyContent: 'center',
                        alignItems: 'center',
                        opacity: passwordSaving ? 0.6 : 1,
                      }}
                    >
                      {passwordSaving ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={{ color: '#FFFCF5', fontFamily: 'Octarine-Bold', fontSize: 15 }}>Update Password</Text>
                      )}
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Help Center Modal */}
      <Modal visible={helpCenterOpen} transparent animationType="slide" onRequestClose={() => setHelpCenterOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '75%', backgroundColor: T.card, borderWidth: 1, borderColor: T.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 18 }}>Help Center</Text>
              <TouchableOpacity onPress={() => setHelpCenterOpen(false)}>
                <CloseSquare size={22} color={T.textMuted} variant="Bold" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: T.text, fontFamily: 'Inter-Medium', fontSize: 14, lineHeight: 22 }}>
                Need help or facing issues with the AGAPP app? Reach out to us through our municipal hall office channels:{'\n\n'}
                <Text style={{ fontFamily: 'Octarine-Bold' }}>Office Hours:{'\n'}</Text>
                Monday to Friday, 8:00 AM – 5:00 PM{'\n\n'}
                <Text style={{ fontFamily: 'Octarine-Bold' }}>Municipal Hall Offices:{'\n'}</Text>
                • Mayor's Office: General concerns & program feedback.{'\n'}
                • Treasurer's Office: eServices payments & business permits.{'\n'}
                • DRRMO: Safety reports & emergency concerns.{'\n'}
                • MSWDO: Social welfare applications and verification assistance.{'\n\n'}
                You can also visit our official LGU website or Facebook page linked under settings for online queries.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* FAQ Modal */}
      <Modal visible={faqOpen} transparent animationType="slide" onRequestClose={() => setFaqOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%', backgroundColor: T.card, borderWidth: 1, borderColor: T.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 18 }}>Frequently Asked Questions</Text>
              <TouchableOpacity onPress={() => setFaqOpen(false)}>
                <CloseSquare size={22} color={T.textMuted} variant="Bold" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 18 }}>
                <View>
                  <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 14, marginBottom: 4 }}>Q: How long does account verification take?</Text>
                  <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 13, lineHeight: 18 }}>A: Verification requests are usually reviewed by your LGU admin within 1 to 2 business days.</Text>
                </View>
                <View style={{ height: 1, backgroundColor: T.border, opacity: 0.3 }} />
                <View>
                  <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 14, marginBottom: 4 }}>Q: Who can view my submitted government ID?</Text>
                  <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 13, lineHeight: 18 }}>A: Your government ID is highly private. Only authorized LGU staff can view it for identity verification. It is deleted immediately after a decision is made.</Text>
                </View>
                <View style={{ height: 1, backgroundColor: T.border, opacity: 0.3 }} />
                <View>
                  <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 14, marginBottom: 4 }}>Q: Why was my verification rejected?</Text>
                  <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 13, lineHeight: 18 }}>A: Rejections usually happen if the uploaded ID photo is blurry, your selfie does not match the ID, or your declared address is invalid. Check the rejection reason in your profile and re-submit.</Text>
                </View>
                <View style={{ height: 1, backgroundColor: T.border, opacity: 0.3 }} />
                <View>
                  <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 14, marginBottom: 4 }}>Q: Can I edit reports after submitting?</Text>
                  <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 13, lineHeight: 18 }}>A: No. Once reports are filed to your local government unit, they are final to ensure transaction integrity. You can track their resolution status in the app.</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Developer Information Modal */}
      <Modal visible={developerInfoOpen} transparent animationType="slide" onRequestClose={() => setDeveloperInfoOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, backgroundColor: T.card, borderWidth: 1, borderColor: T.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 18 }}>Developer Information</Text>
              <TouchableOpacity onPress={() => setDeveloperInfoOpen(false)}>
                <CloseSquare size={22} color={T.textMuted} variant="Bold" />
              </TouchableOpacity>
            </View>
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 16, marginBottom: 4 }}>AGAPP Mobile Client</Text>
              <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 13, marginBottom: 16 }}>Version 1.0.0 (Production Build)</Text>
              <Text style={{ fontFamily: 'Inter-Medium', color: T.text, textAlign: 'center', lineHeight: 20, paddingHorizontal: 12 }}>
                Designed and built by the Local Government Digital Innovation Group. Supporting citizen transparency, eServices governance, and community coordination.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </ScreenBackground>
  );
}
