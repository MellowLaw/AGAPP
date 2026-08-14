'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useLgu } from '../../contexts/LguContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AuthGate } from '../../components/auth/AuthGate';
import { 
  User, 
  ShieldTick, 
  ShieldSecurity, 
  DocumentText, 
  Lock, 
  LogoutCurve, 
  Trash, 
  Location, 
  Notification, 
  CloseCircle, 
  TickCircle, 
  Danger, 
  Clock, 
  ArrowRight2, 
  InfoCircle, 
  Eye, 
  EyeSlash,
  Camera,
  Sms,
  SearchNormal1,
  Call,
  Global,
  Share,
  MessageQuestion,
  Code,
  VideoPlay,
  Send2,
  Buildings,
  CallCalling,
  Moon
} from 'iconsax-react';

type VerificationStatus = 'verified' | 'pending' | 'rejected' | 'unverified';

const BADGE_STYLE: Record<VerificationStatus, { bg: string; icon: any; iconColor: string; textColor: string; label: string }> = {
  verified:   { bg: 'bg-[#10B981] text-white', icon: ShieldTick, iconColor: 'text-white', textColor: 'text-white', label: 'Verified Resident' },
  pending:    { bg: 'bg-[#D97706] text-white', icon: Clock, iconColor: 'text-white', textColor: 'text-white', label: 'Pending Review' },
  rejected:   { bg: 'bg-[#EF4444] text-white', icon: Danger, iconColor: 'text-white', textColor: 'text-white', label: 'Verification Rejected' },
  unverified: { bg: 'bg-[#4B5563] text-white', icon: ShieldSecurity, iconColor: 'text-white', textColor: 'text-white', label: 'Unverified Citizen' },
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { activeLgu } = useLgu();
  const { isDarkMode, setIsDarkMode, toggleDarkMode } = useTheme();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Modals
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [helpCenterOpen, setHelpCenterOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [developerInfoOpen, setDeveloperInfoOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<null | 'terms' | 'privacy'>(null);

  // Push notifications toggle
  const [pushEnabled, setPushEnabled] = useState(true);

  // If user is a guest, render the standard mobile AuthGate
  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 pb-28">
        <AuthGate
          title="Get the Full Experience!"
          subtitle="Sign in to view your verified resident credentials, transaction history, and account settings."
        />
      </div>
    );
  }

  const vStatus: VerificationStatus = (profile?.verification_status as VerificationStatus) || 'unverified';
  const badge = BADGE_STYLE[vStatus] || BADGE_STYLE.unverified;
  const BadgeIcon = badge.icon;

  const ctaLabel = vStatus === 'verified' ? null
    : vStatus === 'pending' ? null
    : vStatus === 'rejected' ? 'Re-submit verification'
    : 'Verify your identity';

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be smaller than 5MB', 'error');
      return;
    }

    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      showToast('Profile picture updated successfully!', 'success');
    } catch (err: any) {
      console.error('Avatar upload failed', err);
      showToast(`Upload failed: ${err.message || 'Please try again.'}`, 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordSuccess('Password updated successfully!');
      setTimeout(() => {
        setChangePasswordOpen(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setEmailSaving(true);
    setEmailError(null);
    setEmailSuccess(null);
    try {
      const { error } = await supabase.auth.updateUser({ email: cleanEmail });
      if (error) throw error;
      setEmailSuccess('Confirmation link sent! Check your new email inbox.');
      setTimeout(() => {
        setChangeEmailOpen(false);
        setEmailSuccess(null);
      }, 2000);
    } catch (err: any) {
      setEmailError(err?.message || 'Failed to update email.');
    } finally {
      setEmailSaving(false);
    }
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const [{ data: reports }, { data: requests }] = await Promise.all([
        supabase.from('reports').select('id, reference_number, category, status, created_at').eq('citizen_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('service_requests').select('id, reference_number, service_type, status, created_at').eq('citizen_id', user.id).order('created_at', { ascending: false }).limit(20),
      ]);
      const combined = [
        ...(reports || []).map((r: any) => ({ id: r.id, ref: r.reference_number, label: r.category, status: r.status, created_at: r.created_at, type: 'report' as const })),
        ...(requests || []).map((r: any) => ({ id: r.id, ref: r.reference_number, label: r.service_type, status: r.status, created_at: r.created_at, type: 'service' as const })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setHistoryItems(combined);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Grouped Settings Items matching mobile
  const ALL_SETTINGS_ITEMS = [
    { category: 'Account Settings', label: 'Change Profile Picture', icon: Camera, action: () => document.getElementById('avatar-file-input')?.click(), keywords: ['avatar', 'picture', 'photo', 'image', 'profile picture', 'camera', 'account'] },
    { category: 'Account Settings', label: 'Change Password', icon: Lock, action: () => setChangePasswordOpen(true), keywords: ['password', 'change password', 'security', 'credential'] },
    { category: 'Account Settings', label: 'Change Email', icon: Sms, action: () => { setNewEmail(user?.email || ''); setChangeEmailOpen(true); }, keywords: ['email', 'change email', 'address', 'mail', 'account'] },
    { category: 'Account Settings', label: 'Account Verification', icon: ShieldTick, cta: badge.label, action: () => router.push('/verify'), keywords: ['verify', 'verification', 'identity', 'id', 'status', 'account'] },
    { category: 'Account Settings', label: 'Transaction History', icon: Clock, action: openHistory, keywords: ['history', 'logs', 'past', 'requests', 'reports', 'activities', 'account'] },

    { category: 'Appearance', label: 'Dark Mode', icon: Moon, isToggle: true, toggleValue: isDarkMode, action: toggleDarkMode, keywords: ['dark', 'mode', 'darkmode', 'theme', 'appearance', 'light', 'night', 'color'] },

    { category: 'System Preferences', label: 'Push Notifications', icon: Notification, isToggle: true, toggleValue: pushEnabled, action: () => setPushEnabled(!pushEnabled), keywords: ['push', 'notifications', 'alerts', 'preferences'] },

    { category: 'Help & Support', label: 'Help Center & Directory', icon: InfoCircle, action: () => setHelpCenterOpen(true), keywords: ['help', 'support', 'contact', 'lgu', 'phone', 'municipal'] },
    { category: 'Help & Support', label: 'Frequently Asked Questions (FAQ)', icon: DocumentText, action: () => setFaqOpen(true), keywords: ['faq', 'questions', 'frequently asked questions', 'help', 'support'] },

    { category: 'About', label: 'Terms & Conditions', icon: DocumentText, action: () => setInfoModal('terms'), keywords: ['terms', 'conditions', 'legal', 'agreement', 'rules'] },
    { category: 'About', label: 'Data Privacy Policy (RA 10173)', icon: ShieldSecurity, action: () => setInfoModal('privacy'), keywords: ['privacy', 'policy', 'data', 'legal', 'gdpr', 'safety'] },
    { category: 'About', label: 'System & Developer Info', icon: Code, action: () => setDeveloperInfoOpen(true), keywords: ['system', 'developer', 'version', 'info', 'monorepo'] },
  ];

  const filteredSettings = useMemo(() => {
    if (!searchQuery.trim()) return ALL_SETTINGS_ITEMS;
    const query = searchQuery.toLowerCase();
    return ALL_SETTINGS_ITEMS.filter((item) =>
      item.label.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.keywords.some((k) => k.includes(query))
    );
  }, [searchQuery, isDarkMode, pushEnabled]);

  const groupedSettings = useMemo(() => {
    const groups: Record<string, typeof ALL_SETTINGS_ITEMS> = {};
    filteredSettings.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredSettings]);

  const socialLinks = {
    facebook: activeLgu?.id === 'liliw-laguna' ? 'https://www.facebook.com/LiliwLocalGov' : 'https://www.facebook.com',
    youtube: activeLgu?.id === 'liliw-laguna' ? 'https://www.youtube.com/results?search_query=liliw+laguna' : 'https://www.youtube.com',
    twitter: 'https://x.com',
    website: activeLgu?.id === 'liliw-laguna' ? 'http://www.liliwlaguna.gov.ph' : 'https://www.google.com',
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-28">
      {/* Hidden file input for avatar */}
      <input
        id="avatar-file-input"
        type="file"
        accept="image/*"
        onChange={handleAvatarSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-3xl font-heading text-text-primary">Profile.</h1>
        <p className="text-xs text-text-muted font-['Inter-Medium']">
          Account · settings · appearance · privacy
        </p>
      </div>

      {/* Restricted Account Warning Banner */}
      {(profile as any)?.moderation_status === 'restricted' && (
        <Link
          href="/restricted"
          className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center justify-between gap-3 text-xs block"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Danger size={20} className="text-red-600 dark:text-red-400 shrink-0" variant="Bold" />
            <div>
              <span className="font-heading text-red-700 dark:text-red-300 block">Your Account is Restricted</span>
              <span className="text-[10px] text-red-800 dark:text-red-200">Tap to view restriction notice & submit an appeal</span>
            </div>
          </div>
          <span className="font-heading text-red-700 dark:text-red-300 text-xs shrink-0">View →</span>
        </Link>
      )}

      {/* Settings Search Bar */}
      <div className="relative">
        <SearchNormal1 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search settings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-8 py-3 rounded-full bg-surface dark:bg-card border border-theme text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent font-['Inter-Medium'] shadow-xs transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <CloseCircle size={16} />
          </button>
        )}
      </div>

      {/* Profile Info Summary Card */}
      <div className="p-6 rounded-[32px] bg-surface dark:bg-card border border-theme shadow-sm text-center space-y-3 transition-colors">
        <div className="relative inline-block mx-auto">
          <div
            onClick={() => document.getElementById('avatar-file-input')?.click()}
            className="w-20 h-20 rounded-full bg-text-primary text-bg font-heading text-2xl flex items-center justify-center shadow-md overflow-hidden cursor-pointer hover:opacity-90 transition mx-auto border-2 border-surface dark:border-card"
          >
            {(profile as any)?.avatar_url ? (
              <img
                src={(profile as any).avatar_url}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <button
            onClick={() => document.getElementById('avatar-file-input')?.click()}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-accent border-2 border-surface dark:border-card text-accent-contrast flex items-center justify-center shadow-xs"
          >
            <Camera size={14} variant="Bold" />
          </button>
        </div>

        <div>
          <h2 className="text-xl font-heading text-text-primary">
            {profile?.full_name || 'Citizen'}
          </h2>
          <p className="text-xs text-text-muted font-['Inter-Medium'] mt-0.5">{user.email}</p>
        </div>

        {/* Verification Pill Badge */}
        <div className="flex justify-center">
          <StatusBadge status={badge.label} />
        </div>

        {vStatus === 'rejected' && (profile as any)?.rejection_reason && (
          <p className="text-xs text-red-700 dark:text-red-400 font-['Inter-Medium'] pt-1">
            {(profile as any).rejection_reason}
          </p>
        )}
      </div>

      {/* Verification CTA Button (if unverified or rejected) */}
      {ctaLabel && (
        <button
          onClick={() => router.push('/verify')}
          className="w-full py-4 rounded-full bg-accent text-accent-contrast font-heading text-xs hover:opacity-90 transition flex items-center justify-center gap-2 shadow-xs"
        >
          <ShieldTick size={18} variant="Bold" />
          <span>{ctaLabel}</span>
        </button>
      )}

      {/* Settings Groups */}
      <div className="space-y-4">
        {Object.entries(groupedSettings).map(([groupTitle, items]) => (
          <div key={groupTitle} className="space-y-1.5">
            <span className="text-[11px] font-heading uppercase tracking-wider text-text-muted px-2 block">
              {groupTitle}
            </span>
            <div className="p-2 rounded-3xl bg-surface dark:bg-card border border-theme shadow-xs divide-y divide-theme transition-colors">
              {items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    onClick={item.action}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-surface-alt dark:hover:bg-chip transition rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} className="text-accent shrink-0" variant="Bold" />
                      <span className="text-xs font-heading text-text-primary">{item.label}</span>
                    </div>

                    {item.isToggle ? (
                      <div
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                          item.toggleValue ? 'bg-accent justify-end' : 'bg-theme justify-start'
                        }`}
                      >
                        <div className="bg-surface dark:bg-card w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out" />
                      </div>
                    ) : item.cta ? (
                      <span className="text-xs font-heading text-accent">{item.cta}</span>
                    ) : (
                      <ArrowRight2 size={16} className="text-text-muted" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Official Municipal Social Links */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-heading uppercase tracking-wider text-text-muted px-2 block">
          Official {activeLgu?.name || 'Municipal'} Channels
        </span>
        <div className="p-4 rounded-3xl bg-surface dark:bg-card border border-theme shadow-xs flex items-center justify-around text-xs font-heading transition-colors">
          <a href={socialLinks.facebook} target="_blank" rel="noreferrer" className="p-2 rounded-xl hover:bg-surface-alt dark:hover:bg-chip transition text-center space-y-1.5 flex flex-col items-center">
            <Share size={20} className="text-blue-500" variant="Bold" />
            <span className="text-[10px] text-text-muted block">Facebook</span>
          </a>
          <a href={socialLinks.youtube} target="_blank" rel="noreferrer" className="p-2 rounded-xl hover:bg-surface-alt dark:hover:bg-chip transition text-center space-y-1.5 flex flex-col items-center">
            <VideoPlay size={20} className="text-red-500" variant="Bold" />
            <span className="text-[10px] text-text-muted block">YouTube</span>
          </a>
          <a href={socialLinks.twitter} target="_blank" rel="noreferrer" className="p-2 rounded-xl hover:bg-surface-alt dark:hover:bg-chip transition text-center space-y-1.5 flex flex-col items-center">
            <Send2 size={20} className="text-sky-400" variant="Bold" />
            <span className="text-[10px] text-text-muted block">X / Twitter</span>
          </a>
          <a href={socialLinks.website} target="_blank" rel="noreferrer" className="p-2 rounded-xl hover:bg-surface-alt dark:hover:bg-chip transition text-center space-y-1.5 flex flex-col items-center">
            <Global size={20} className="text-emerald-500" variant="Bold" />
            <span className="text-[10px] text-text-muted block">Website</span>
          </a>
        </div>
      </div>

      {/* Destructive Actions */}
      <div className="space-y-3 pt-2">
        <Link
          href="/profile/delete-account"
          className="w-full py-3.5 px-5 rounded-full bg-surface dark:bg-card border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 font-heading text-xs hover:bg-red-50 dark:hover:bg-red-950/30 transition flex items-center justify-between shadow-xs block"
        >
          <div className="flex items-center gap-2.5">
            <Trash size={18} />
            <span>Delete Account (Right to Erasure)</span>
          </div>
          <ArrowRight2 size={16} className="text-red-400" />
        </Link>

        <button
          onClick={signOut}
          className="w-full py-3.5 rounded-full bg-surface-alt dark:bg-chip border border-theme text-text-primary font-heading text-xs hover:opacity-80 transition flex items-center justify-center gap-2 shadow-xs"
        >
          <LogoutCurve size={16} />
          <span>Sign Out Current Account</span>
        </button>
      </div>

      {/* Change Password Modal */}
      {changePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface dark:bg-card rounded-[32px] border border-theme p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="text-base font-heading text-text-primary">Change Password</h3>
              <button onClick={() => setChangePasswordOpen(false)} className="text-text-muted hover:text-text-primary">
                <CloseCircle size={20} />
              </button>
            </div>

            {passwordSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 text-xs rounded-xl flex items-center gap-2">
                <TickCircle size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                <Danger size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs font-['Inter-Medium']">
              <div className="space-y-1">
                <label className="block font-heading text-text-primary">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="At least 6 characters..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted"
                  >
                    {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-heading text-text-primary">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat new password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-surface-alt dark:bg-chip text-text-muted font-heading hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-5 py-2.5 rounded-full bg-accent text-accent-contrast font-heading hover:opacity-90 transition disabled:opacity-50 shadow-xs"
                >
                  {passwordSaving ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Email Modal */}
      {changeEmailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface dark:bg-card rounded-[32px] border border-theme p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="text-base font-heading text-text-primary">Change Email Address</h3>
              <button onClick={() => setChangeEmailOpen(false)} className="text-text-muted hover:text-text-primary">
                <CloseCircle size={20} />
              </button>
            </div>

            {emailSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 text-xs rounded-xl flex items-center gap-2">
                <TickCircle size={16} />
                <span>{emailSuccess}</span>
              </div>
            )}
            {emailError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                <Danger size={16} />
                <span>{emailError}</span>
              </div>
            )}

            <form onSubmit={handleChangeEmail} className="space-y-3 text-xs font-['Inter-Medium']">
              <div className="space-y-1">
                <label className="block font-heading text-text-primary">New Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setChangeEmailOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-surface-alt dark:bg-chip text-text-muted font-heading hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emailSaving}
                  className="px-5 py-2.5 rounded-full bg-accent text-accent-contrast font-heading hover:opacity-90 transition disabled:opacity-50 shadow-xs"
                >
                  {emailSaving ? 'Sending Link...' : 'Update Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface dark:bg-card rounded-[32px] border border-theme p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="text-base font-heading text-text-primary">Activity History</h3>
              <button onClick={() => setHistoryOpen(false)} className="text-text-muted hover:text-text-primary">
                <CloseCircle size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {historyLoading ? (
                <p className="text-xs text-text-muted text-center py-8">Loading history...</p>
              ) : historyItems.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-8">No past transactions found.</p>
              ) : (
                historyItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/tracking/${item.type}/${item.id || item.ref}`}
                    onClick={() => setHistoryOpen(false)}
                    className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme flex items-center justify-between text-xs hover:border-accent block transition-colors"
                  >
                    <div>
                      <span className="text-[9px] font-heading uppercase text-accent block">
                        {item.type === 'service' ? 'E-Service' : 'Issue Report'}
                      </span>
                      <h4 className="font-heading text-text-primary">{item.label}</h4>
                      <span className="text-[10px] text-text-muted">Ref: #{item.ref}</span>
                    </div>
                    <StatusBadge status={item.status} />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Center Modal */}
      {helpCenterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface dark:bg-card rounded-[32px] border border-theme p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="text-base font-heading text-text-primary">Municipal Help Desk</h3>
              <button onClick={() => setHelpCenterOpen(false)} className="text-text-muted hover:text-text-primary">
                <CloseCircle size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-text-muted font-['Inter-Medium']">
              <div className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme space-y-1">
                <div className="flex items-center gap-1.5 font-heading text-text-primary">
                  <Buildings size={16} className="text-accent" variant="Bold" />
                  <span>Municipal Hall Address</span>
                </div>
                <p className="text-text-primary">Gat Tayaw Street, Poblacion, Liliw, Laguna</p>
                <p className="text-text-muted">Office Hours: Mon–Fri 8:00 AM – 5:00 PM</p>
              </div>

              <div className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme space-y-1">
                <div className="flex items-center gap-1.5 font-heading text-text-primary">
                  <CallCalling size={16} className="text-green-500" variant="Bold" />
                  <span>Hotline Support</span>
                </div>
                <p className="text-text-primary">Civil Registrar: (049) 563-1234</p>
                <p className="text-text-primary">MDRRMO 24/7 Rescue: 0998-598-5643</p>
              </div>
            </div>

            <button
              onClick={() => setHelpCenterOpen(false)}
              className="w-full py-3 rounded-full bg-accent text-accent-contrast font-heading text-xs hover:opacity-90 transition shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {faqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface dark:bg-card rounded-[32px] border border-theme p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="text-base font-heading text-text-primary">Frequently Asked Questions</h3>
              <button onClick={() => setFaqOpen(false)} className="text-text-muted hover:text-text-primary">
                <CloseCircle size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs text-text-muted font-['Inter-Medium']">
              <div className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme space-y-1">
                <span className="font-heading text-text-primary block">How do I verify my account?</span>
                <p>Go to your Profile and tap &quot;Verify your identity&quot;. Provide your government ID (PhilSys, Voter, etc.) and a live selfie.</p>
              </div>
              <div className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme space-y-1">
                <span className="font-heading text-text-primary block">How do Claim QR codes work?</span>
                <p>After filing an E-Service application, present your generated Claim QR ticket at the Municipal Treasury / Cashier window for instant processing.</p>
              </div>
              <div className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme space-y-1">
                <span className="font-heading text-text-primary block">Why can&apos;t I report on PC?</span>
                <p>To prevent fake reports, incident triage requires mobile GPS coordinates and live camera photo evidence.</p>
              </div>
            </div>

            <button
              onClick={() => setFaqOpen(false)}
              className="w-full py-3 rounded-full bg-accent text-accent-contrast font-heading text-xs hover:opacity-90 transition shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Developer / System Info Modal */}
      {developerInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface dark:bg-card rounded-[32px] border border-theme p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="text-base font-heading text-text-primary">System & Architecture Info</h3>
              <button onClick={() => setDeveloperInfoOpen(false)} className="text-text-muted hover:text-text-primary">
                <CloseCircle size={20} />
              </button>
            </div>

            <div className="space-y-2 text-xs text-text-muted font-['Inter-Medium']">
              <div className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme space-y-1 font-mono text-[11px]">
                <p><strong className="text-text-primary">Platform:</strong> AGAPP Citizen Portal v1.0</p>
                <p><strong className="text-text-primary">Workspace:</strong> @agapp/citizen-web</p>
                <p><strong className="text-text-primary">Framework:</strong> Next.js 14 + PWA</p>
                <p><strong className="text-text-primary">Engine:</strong> Supabase PostgreSQL + NestJS</p>
                <p><strong className="text-text-primary">Compliance:</strong> RA 10173 & RA 11032</p>
              </div>
            </div>

            <button
              onClick={() => setDeveloperInfoOpen(false)}
              className="w-full py-3 rounded-full bg-accent text-accent-contrast font-heading text-xs hover:opacity-90 transition shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Legal Modals (Terms & Privacy) */}
      {infoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface dark:bg-card rounded-[32px] border border-theme p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="text-base font-heading text-text-primary">
                {infoModal === 'terms' ? 'Terms & Conditions' : 'Republic Act No. 10173 (Data Privacy)'}
              </h3>
              <button onClick={() => setInfoModal(null)} className="text-text-muted hover:text-text-primary">
                <CloseCircle size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto text-xs text-text-muted font-['Inter-Medium'] leading-relaxed space-y-3 pr-1">
              {infoModal === 'terms' ? (
                <>
                  <p>1. <strong className="text-text-primary">Platform Scope:</strong> The AGAPP Citizen Portal provides automated municipal document services, community reports, and official public news bulletins in accordance with Republic Act No. 11032 (Ease of Doing Business and Efficient Government Service Delivery Act of 2018).</p>
                  <p>2. <strong className="text-text-primary">Citizen Accountability:</strong> Submitting fraudulent government identification, false reports, or inappropriate forum language may result in administrative restriction or suspension.</p>
                </>
              ) : (
                <>
                  <p>1. <strong className="text-text-primary">Statutory Compliance:</strong> All personal information, government IDs, and live selfie documents collected through AGAPP are processed strictly pursuant to Republic Act No. 10173 (Data Privacy Act of 2012).</p>
                  <p>2. <strong className="text-text-primary">Right to Erasure:</strong> Citizens retain the unalienable right to request permanent account deletion and data wiping via the account settings menu.</p>
                </>
              )}
            </div>

            <button
              onClick={() => setInfoModal(null)}
              className="w-full py-2.5 rounded-full bg-accent text-accent-contrast font-heading text-xs hover:opacity-90 transition shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
