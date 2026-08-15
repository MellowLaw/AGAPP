'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { lguIdFromName } from '@/lib/lgu';
import { ADMIN_MODULES, MODULE_LABELS } from '@/lib/modules';
import { Setting2, User, Notification, Shield, Building, Location, Sms, Call, Add, Trash, Edit, CloseCircle, People, Key, Eye, EyeSlash, Copy } from 'iconsax-react';
import { ColorPaletteSelector } from '@/components/ui/ColorPaletteSelector';
import { Skeleton, SkeletonStaffGrid } from '@/components/ui/Skeleton';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'LGU_ADMIN' | 'LGU_PERSONNEL' | string;
  assigned_office?: string | null;
  is_active: boolean;
  /** Granted admin-panel sections. Personnel only — admins hold all. */
  module_permissions?: string[];
}

const DEFAULT_OFFICES = [
  'Civil Registrar',
  'BPLO',
  'Treasury',
  "Assessor's Office",
  'Engineering Office',
  'MDRRMO',
  'Health Office',
  'MENRO / Sanitation',
  'Agriculture',
  "Mayor's Office",
  'MSWDO',
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'customization' | 'staff' | 'notifications'>('general');
  const { showToast, ToastContainer } = useToast();
  const params = useSearchParams();

  // Retrieve LGU Identifier
  const lguNameParam = params?.get('lguName') || 'Liliw, Laguna';
  const lguId = useMemo(() => lguIdFromName(lguNameParam), [lguNameParam]);

  // General LGU Details States
  const [lguName, setLguName] = useState('');
  const [lguProvince, setLguProvince] = useState('Laguna');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [primaryColor, setPrimaryColor] = useState('#d62a53');
  const [logoUrl, setLogoUrl] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [iconColor, setIconColor] = useState('#d62a53');
  const [darkBgColor, setDarkBgColor] = useState('#292929');
  const [overrideMode, setOverrideMode] = useState<'light' | 'dark'>('light');

  // Compute contrast-adjusted dark mode colors based on light mode colors
  const autoDarkPrimary = useMemo(() => {
    const clean = (primaryColor || '#d62a53').replace('#', '');
    if (clean.length !== 6) return primaryColor;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (lum >= 0.72) return primaryColor;
    const mix = Math.min(1, (0.80 - lum) / (1 - lum + 0.001));
    const lift = (c: number) => Math.round(c + (255 - c) * mix);
    return `#${[lift(r), lift(g), lift(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
  }, [primaryColor]);

  const autoDarkIcon = useMemo(() => {
    const baseIcon = iconColor || primaryColor || '#d62a53';
    const clean = baseIcon.replace('#', '');
    if (clean.length !== 6) return baseIcon;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (lum >= 0.72) return baseIcon;
    const mix = Math.min(1, (0.80 - lum) / (1 - lum + 0.001));
    const lift = (c: number) => Math.round(c + (255 - c) * mix);
    return `#${[lift(r), lift(g), lift(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
  }, [iconColor, primaryColor]);

  const [facebookUrl, setFacebookUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [featureFlags, setFeatureFlags] = useState<any>({ chatbot: true, potholeDetection: true, forum: true });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo image must be under 2MB.', 'error');
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('lguId', lguId);

      const res = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to upload logo');

      setLogoUrl(result.publicUrl);
      showToast('Logo uploaded successfully. Click Save Changes at the top to apply.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to upload logo', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Staff States
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'LGU_ADMIN' | 'LGU_PERSONNEL'>('LGU_PERSONNEL');
  const [staffOffice, setStaffOffice] = useState<string>('');
  const [officeFilter, setOfficeFilter] = useState<string>('all');
  const [availableOffices, setAvailableOffices] = useState<string[]>(DEFAULT_OFFICES);
  const [staffModules, setStaffModules] = useState<string[]>([]);

  // Staff Password Reset States (Pattern 1)
  const [resetPasswordStaff, setResetPasswordStaff] = useState<StaffMember | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const generateRandomPassword = (length = 12): string => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < length; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  // Notification Preference States
  const [notifPush, setNotifPush] = useState(true);
  const [notifSms, setNotifSms] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  // Confirmation Modal States
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const triggerConfirm = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  // Fetch LGU General Config, Staff, and current user notification preferences
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        // 1. Load LGU info
        const { data: lgu, error: lguErr } = await supabase
          .from('lgus')
          .select('*')
          .eq('id', lguId)
          .single();
        
        if (lguErr) throw lguErr;
        
        if (lgu) {
          // Split LGU Name into Name and Province if possible
          const parts = lgu.name.split(', ');
          setLguName(parts[0]);
          if (parts[1]) setLguProvince(parts[1]);
          setContactEmail(lgu.contact_email || '');
          setContactPhone(lgu.contact_phone || '');
          setOfficeAddress(lgu.office_address || '');
          setLatitude(lgu.latitude || 0);
          setLongitude(lgu.longitude || 0);
          setPrimaryColor(lgu.primary_color || '#d62a53');
          setLogoUrl(lgu.logo || '');
          setSecondaryColor(lgu.secondary_color || '#ffffff');
          const flags = lgu.feature_flags || {};
          setFeatureFlags(flags);
           setIconColor(lgu.icon_color || lgu.primary_color || '#d62a53');
          setDarkBgColor(lgu.dark_bg_color || '#292929');
          setFacebookUrl(lgu.facebook_url || '');
          setYoutubeUrl(lgu.youtube_url || '');
          setTwitterUrl(lgu.twitter_url || '');
          setWebsiteUrl(lgu.website_url || '');
        }

        // 2. Load dynamic offices from services catalog
        const { data: serviceRows } = await supabase
          .from('lgu_services')
          .select('office_name')
          .eq('lgu_id', lguId);

        const dynamicOffices = Array.from(
          new Set([
            ...DEFAULT_OFFICES,
            ...(serviceRows || []).map((s: any) => s.office_name).filter(Boolean)
          ])
        );
        setAvailableOffices(dynamicOffices);

        // 3. Load Staff Members with assigned_office
        const { data: users, error: usersErr } = await supabase
          .from('users')
          .select('*')
          .eq('lgu_id', lguId)
          .in('role', ['LGU_ADMIN', 'LGU_PERSONNEL'])
          .order('name', { ascending: true });

        if (usersErr) throw usersErr;
        if (users) {
          setStaffList(users);
        }

        // 3. Load Current User Preferences
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser?.user) {
          setCurrentUserId(authUser.user.id);
          const { data: profile } = await supabase
            .from('users')
            .select('notification_preferences')
            .eq('id', authUser.user.id)
            .single();

          if (profile?.notification_preferences) {
            const prefs = profile.notification_preferences as any;
            setNotifPush(prefs.push !== false);
            setNotifSms(prefs.sms !== false);
            setNotifEmail(prefs.email !== false);
          }
        }
      } catch (err: any) {
        console.error('Failed to load settings data:', err);
        showToast(err.message || 'Failed to load settings from Supabase', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
    // showToast is deliberately excluded — useToast() returns a new function
    // reference on every render, so including it here would refetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lguId]);

  // Save General Info
  const handleSaveGeneral = async () => {
    try {
      const fullName = lguProvince ? `${lguName}, ${lguProvince}` : lguName;
      const { error } = await supabase
        .from('lgus')
        .update({
          name: fullName,
          logo: logoUrl,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          office_address: officeAddress,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          icon_color: iconColor,
          dark_bg_color: darkBgColor,
          facebook_url: facebookUrl,
          youtube_url: youtubeUrl,
          twitter_url: twitterUrl,
          website_url: websiteUrl,
          // Explicit allowlist (not a spread) so any stale iconColor/darkBgColor
          // keys left over from before these became top-level columns get
          // dropped on save instead of persisting forever.
          feature_flags: {
            chatbot: featureFlags.chatbot ?? true,
            potholeDetection: featureFlags.potholeDetection ?? true,
            forum: featureFlags.forum ?? true,
          },
        })
        .eq('id', lguId);

      if (error) throw error;
      showToast('Municipality information updated successfully!', 'success');
    } catch (err: any) {
      console.error('Failed to update LGU details:', err);
      showToast(err.message || 'Failed to update municipality details', 'error');
    }
  };

  // Save Staff Member
  const handleSaveStaff = async () => {
    if (!staffName.trim() || !staffEmail.trim()) {
      showToast('Please enter both name and email.', 'info');
      return;
    }

    try {
      // Admins implicitly hold every module; only personnel carry a list.
      const modulesToSave = staffRole === 'LGU_PERSONNEL' ? staffModules : [];
      const officeToSave = staffRole === 'LGU_PERSONNEL' ? (staffOffice.trim() || null) : null;

      if (editingStaff) {
        // Update profile only (password changes are out of scope here)
        const { error } = await supabase
          .from('users')
          .update({
            name: staffName,
            email: staffEmail,
            role: staffRole,
            assigned_office: officeToSave,
          })
          .eq('id', editingStaff.id);

        if (error) throw error;

        // module_permissions is protected by the users_guard_staff_columns
        // trigger — a direct .update() is rejected, set_staff_modules() is the
        // only sanctioned writer (it re-checks that we admin this staffer's LGU).
        if (staffRole === 'LGU_PERSONNEL') {
          const { error: modErr } = await supabase.rpc('set_staff_modules', {
            p_user_id: editingStaff.id,
            p_modules: modulesToSave,
          });
          if (modErr) throw modErr;
        }

        setStaffList(prev => prev.map(s =>
          s.id === editingStaff.id
            ? { ...s, name: staffName, email: staffEmail, role: staffRole, assigned_office: officeToSave, module_permissions: modulesToSave }
            : s
        ));
        showToast('Staff member updated successfully!', 'success');
      } else {
        // Create — calls server API which uses service role key to create Auth user + profile
        if (!staffPassword.trim() || staffPassword.length < 8) {
          showToast('Password must be at least 8 characters.', 'info');
          return;
        }

        const res = await fetch('/api/create-staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: staffEmail, password: staffPassword, name: staffName,
            role: staffRole, lguId, modulePermissions: modulesToSave,
            assignedOffice: officeToSave,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to create staff account.');

        setStaffList(prev => [...prev, {
          id: json.id, name: staffName, email: staffEmail, role: staffRole,
          assigned_office: officeToSave,
          is_active: true, module_permissions: modulesToSave,
        }]);
        showToast(`Staff account created! Share these credentials securely: ${staffEmail} / ${staffPassword}`, 'success');
      }

      // Close modal and reset fields
      setShowStaffModal(false);
      setEditingStaff(null);
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      setStaffRole('LGU_PERSONNEL');
      setStaffOffice('');
      setStaffModules([]);
    } catch (err: any) {
      console.error('Failed to save staff member:', err);
      showToast(err.message || 'Failed to save staff member details', 'error');
    }
  };

  // Delete Staff Member
  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your staff?`)) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStaffList(prev => prev.filter(s => s.id !== id));
      showToast('Staff member removed.', 'success');
    } catch (err: any) {
      console.error('Failed to delete staff member:', err);
      showToast(err.message || 'Failed to remove staff member', 'error');
    }
  };

  // Direct Staff Password Reset (Pattern 1)
  const handleResetStaffPassword = async () => {
    if (!resetPasswordStaff) return;
    if (!newPasswordVal || newPasswordVal.length < 8) {
      showToast('Password must be at least 8 characters.', 'info');
      return;
    }

    setResettingPassword(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: resetPasswordStaff.id,
          newPassword: newPasswordVal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      showToast(`Password for ${resetPasswordStaff.name} updated successfully!`, 'success');
      setResetPasswordStaff(null);
      setNewPasswordVal('');
      setShowNewPassword(false);
    } catch (err: any) {
      console.error('Failed to reset staff password:', err);
      showToast(err.message || 'Failed to update staff password.', 'error');
    } finally {
      setResettingPassword(false);
    }
  };

  // Save Notifications
  const handleSaveNotifications = async () => {
    if (!currentUserId) {
      showToast('You must be logged in to update preferences.', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          notification_preferences: { push: notifPush, sms: notifSms, email: notifEmail }
        })
        .eq('id', currentUserId);

      if (error) throw error;
      showToast('Notification preferences saved successfully!', 'success');
    } catch (err: any) {
      console.error('Failed to update notification preferences:', err);
      showToast(err.message || 'Failed to save preferences', 'error');
    }
  };

  return (
    <DashboardLayout 
      role="lgu-admin" 
      title="Settings"
    >
      <ToastContainer />
      
      {loading && (
        <div className="mb-4 px-4 py-2 text-sm text-text-muted bg-surface-alt rounded-md animate-pulse">
          Loading settings and configuration…
        </div>
      )}

      {/* Horizontal Tabs selector */}
      <div className="flex border-b border-theme mb-6">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 border-b-2 font-semibold text-sm transition-all -mb-px flex items-center gap-2 ${
            activeTab === 'general'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Building className="w-4.5 h-4.5" />
          General Info
        </button>
        <button
          onClick={() => setActiveTab('customization')}
          className={`px-4 py-2 border-b-2 font-semibold text-sm transition-all -mb-px flex items-center gap-2 ${
            activeTab === 'customization'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Setting2 className="w-4.5 h-4.5" />
          Customization
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 border-b-2 font-semibold text-sm transition-all -mb-px flex items-center gap-2 ${
            activeTab === 'staff'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <User className="w-4.5 h-4.5" />
          Staff Management
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 border-b-2 font-semibold text-sm transition-all -mb-px flex items-center gap-2 ${
            activeTab === 'notifications'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Notification className="w-4.5 h-4.5" />
          Notifications
        </button>
      </div>

      {/* Content panel */}
      <div>
        {activeTab === 'general' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-theme pb-4 mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Municipality Information</h2>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => window.location.reload()}>Cancel</Button>
                <Button onClick={() => triggerConfirm('Confirm Settings Update', 'Are you sure you want to save these municipality settings?', handleSaveGeneral)}>Save Changes</Button>
              </div>
            </div>

            <Card>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Column 1: Profile & Feature Flags */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-text-primary mb-2 border-b border-theme pb-1">Profile Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Municipality Name"
                      value={lguName}
                      onChange={(e: any) => setLguName(e.target.value)}
                    />
                    <Input
                      label="Province"
                      value={lguProvince}
                      onChange={(e: any) => setLguProvince(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Contact Email"
                      value={contactEmail}
                      onChange={(e: any) => setContactEmail(e.target.value)}
                    />
                    <Input
                      label="Contact Call"
                      value={contactPhone}
                      onChange={(e: any) => setContactPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Office Address</label>
                    <textarea
                      rows={1}
                      value={officeAddress}
                      onChange={(e) => setOfficeAddress(e.target.value)}
                      className="w-full px-3 py-1.5 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Latitude</label>
                      <input
                        type="text"
                        value={latitude}
                        className="w-full px-3 py-1.5 bg-surface-alt border border-theme rounded-md text-sm cursor-not-allowed"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Longitude</label>
                      <input
                        type="text"
                        value={longitude}
                        className="w-full px-3 py-1.5 bg-surface-alt border border-theme rounded-md text-sm cursor-not-allowed"
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Feature Flags */}
                  <div className="pt-2 border-t border-theme">
                    <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Feature Flags</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <label className="flex items-center gap-2 p-2 border border-theme rounded-md bg-surface cursor-pointer">
                        <input
                          type="checkbox"
                          checked={featureFlags.chatbot}
                          onChange={(e) => setFeatureFlags((prev: any) => ({ ...prev, chatbot: e.target.checked }))}
                          className="w-4 h-4 accent-accent rounded"
                        />
                        <span className="text-xs text-text-primary font-semibold">Chatbot</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 border border-theme rounded-md bg-surface cursor-pointer">
                        <input
                          type="checkbox"
                          checked={featureFlags.potholeDetection}
                          onChange={(e) => setFeatureFlags((prev: any) => ({ ...prev, potholeDetection: e.target.checked }))}
                          className="w-4 h-4 accent-accent rounded"
                        />
                        <span className="text-xs text-text-primary font-semibold">Potholes</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 border border-theme rounded-md bg-surface cursor-pointer">
                        <input
                          type="checkbox"
                          checked={featureFlags.forum}
                          onChange={(e) => setFeatureFlags((prev: any) => ({ ...prev, forum: e.target.checked }))}
                          className="w-4 h-4 accent-accent rounded"
                        />
                        <span className="text-xs text-text-primary font-semibold">Forum</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Column 2: Social Links */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-text-primary mb-2 border-b border-theme pb-1">Official Channels &amp; Social Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Facebook URL"
                      value={facebookUrl}
                      onChange={(e: any) => setFacebookUrl(e.target.value)}
                      placeholder="https://facebook.com/your-lgu"
                    />
                    <Input
                      label="YouTube URL"
                      value={youtubeUrl}
                      onChange={(e: any) => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtube.com/@your-lgu"
                    />
                    <Input
                      label="X (Twitter) URL"
                      value={twitterUrl}
                      onChange={(e: any) => setTwitterUrl(e.target.value)}
                      placeholder="https://x.com/your-lgu"
                    />
                    <Input
                      label="Website URL"
                      value={websiteUrl}
                      onChange={(e: any) => setWebsiteUrl(e.target.value)}
                      placeholder="https://your-lgu.gov.ph"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'customization' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-theme pb-4 mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Customization &amp; Branding</h2>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => window.location.reload()}>Cancel</Button>
                <Button onClick={() => triggerConfirm('Confirm Settings Update', 'Are you sure you want to save these customization settings?', handleSaveGeneral)}>Save Changes</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: Theme Override Colors (xl:col-span-4) */}
              <div className="xl:col-span-4 flex">
                <Card className="w-full">
                  <CardHeader title="Theme Override Colors" subtitle="Set custom palette override hex colors for your LGU" />
                  <div className="p-5 space-y-6">
                    <div>
                      <p className="text-xs font-bold text-text-faint uppercase tracking-wider mb-2.5">Theme Mode View</p>
                    
                    {/* Mode selector tab */}
                    <div className="flex bg-surface-alt p-1 rounded-lg border border-theme mb-3">
                      <button
                        type="button"
                        onClick={() => setOverrideMode('light')}
                        className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${
                          overrideMode === 'light' ? 'bg-surface text-text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'
                        }`}
                      >
                        Light Mode
                      </button>
                      <button
                        type="button"
                        onClick={() => setOverrideMode('dark')}
                        className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${
                          overrideMode === 'dark' ? 'bg-surface text-text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'
                        }`}
                      >
                        Dark Mode
                      </button>
                    </div>

                    {overrideMode === 'light' ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Primary Color</label>
                            <div className="flex gap-1.5">
                              <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-8 h-8 border border-theme rounded p-0.5 cursor-pointer bg-transparent"
                              />
                              <input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-full px-2 py-1 bg-surface border border-theme rounded text-xs font-mono text-text-primary focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Secondary Color</label>
                            <div className="flex gap-1.5">
                              <input
                                type="color"
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="w-8 h-8 border border-theme rounded p-0.5 cursor-pointer bg-transparent"
                              />
                              <input
                                type="text"
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="w-full px-2 py-1 bg-surface border border-theme rounded text-xs font-mono text-text-primary focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Quick Action Icons Color</label>
                            <div className="flex gap-1.5">
                              <input
                                type="color"
                                value={iconColor}
                                onChange={(e) => setIconColor(e.target.value)}
                                className="w-8 h-8 border border-theme rounded p-0.5 cursor-pointer bg-transparent"
                              />
                              <input
                                type="text"
                                value={iconColor}
                                onChange={(e) => setIconColor(e.target.value)}
                                className="w-full px-2 py-1 bg-surface border border-theme rounded text-xs font-mono text-text-primary focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Nav Active Pill (Indicator)</label>
                            <div className="flex gap-1.5">
                              <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-8 h-8 border border-theme rounded p-0.5 cursor-pointer bg-transparent"
                              />
                              <input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-full px-2 py-1 bg-surface border border-theme rounded text-xs font-mono text-text-primary focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Nav Active Icon & Label Color</label>
                          <div className="flex gap-1.5">
                            <input
                              type="color"
                              value={secondaryColor}
                              onChange={(e) => setSecondaryColor(e.target.value)}
                              className="w-8 h-8 border border-theme rounded p-0.5 cursor-pointer bg-transparent"
                            />
                            <input
                              type="text"
                              value={secondaryColor}
                              onChange={(e) => setSecondaryColor(e.target.value)}
                              className="w-full px-2 py-1 bg-surface border border-theme rounded text-xs font-mono text-text-primary focus:outline-none"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] text-text-muted mb-3 italic">
                          Accent & icon colors automatically adjust based on contrast rules to ensure readability on dark backgrounds.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Auto Primary (Dark)</label>
                            <div className="flex gap-1.5 items-center">
                              <div className="w-8 h-8 border border-theme rounded p-0.5" style={{ backgroundColor: autoDarkPrimary }} />
                              <input
                                type="text"
                                readOnly
                                value={autoDarkPrimary}
                                className="w-full px-2 py-1 bg-surface-alt border border-theme rounded text-xs font-mono text-text-muted cursor-not-allowed"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Auto Icon (Dark)</label>
                            <div className="flex gap-1.5 items-center">
                              <div className="w-8 h-8 border border-theme rounded p-0.5" style={{ backgroundColor: autoDarkIcon }} />
                              <input
                                type="text"
                                readOnly
                                value={autoDarkIcon}
                                className="w-full px-2 py-1 bg-surface-alt border border-theme rounded text-xs font-mono text-text-muted cursor-not-allowed"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Dark BG Override</label>
                          <div className="flex gap-1.5">
                            <input
                              type="color"
                              value={darkBgColor}
                              onChange={(e) => setDarkBgColor(e.target.value)}
                              className="w-8 h-8 border border-theme rounded p-0.5 cursor-pointer bg-transparent"
                            />
                            <input
                              type="text"
                              value={darkBgColor}
                              onChange={(e) => setDarkBgColor(e.target.value)}
                              className="w-full px-2 py-1 bg-surface border border-theme rounded text-xs font-mono text-text-primary focus:outline-none"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                    {/* Logo Upload Section */}
                    <div className="pt-5 border-t border-theme">
                      <label className="block text-xs font-bold text-text-faint uppercase tracking-wider mb-2">Municipality Logo / Seal</label>
                      <div className="flex items-center gap-4">
                        {logoUrl ? (
                          <img src={logoUrl} alt="LGU Logo" className="w-16 h-16 rounded-full border border-theme bg-surface-alt object-contain p-1" />
                        ) : (
                          <div className="w-16 h-16 rounded-full border border-theme bg-surface-alt flex items-center justify-center text-text-faint text-[10px] font-semibold">No Logo</div>
                        )}
                        <div className="flex-1 space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            disabled={uploadingLogo}
                            className="hidden"
                            id="logo-file-input"
                          />
                          <label
                            htmlFor="logo-file-input"
                            className="inline-flex items-center justify-center px-4 py-1.5 border border-theme rounded-full text-xs font-semibold text-text-primary bg-surface hover:bg-surface-alt cursor-pointer transition-colors"
                          >
                            {uploadingLogo ? 'Uploading...' : 'Browse Image'}
                          </label>
                          <p className="text-[10px] text-text-muted">Accepts JPEG, PNG, SVG under 2MB</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </Card>
              </div>

              {/* Right Column: Predefined Palettes & Preview (xl:col-span-8) */}
              <Card className="xl:col-span-8 flex flex-col justify-between">
                <ColorPaletteSelector
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  iconColor={iconColor}
                  darkBgColor={darkBgColor}
                  activeMode={overrideMode}
                  onModeChange={setOverrideMode}
                  onChange={({ primaryColor: p, secondaryColor: s, iconColor: i, darkBgColor: d }) => {
                    setPrimaryColor(p);
                    setSecondaryColor(s);
                    setIconColor(i);
                    setDarkBgColor(d);
                  }}
                  lguName={lguNameParam}
                  sideBySide={true}
                />
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Staff &amp; Department Personnel</h2>
                  <p className="text-xs text-text-muted">Create and assign personnel accounts to specific municipal offices</p>
                </div>
                <Button onClick={() => {
                  setEditingStaff(null);
                  setStaffName('');
                  setStaffEmail('');
                  setStaffPassword('');
                  setStaffRole('LGU_PERSONNEL');
                  setStaffOffice('');
                  setStaffModules([]);
                  setShowStaffModal(true);
                }}>
                  <Add className="w-4 h-4 mr-1" />
                  Add Staff Member
                </Button>
              </div>

              {/* Department Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setOfficeFilter('all')}
                  className={`px-3 py-1.5 rounded-full font-medium transition whitespace-nowrap ${
                    officeFilter === 'all'
                      ? 'bg-accent text-white shadow-xs'
                      : 'bg-surface-alt text-text-muted hover:text-text-primary border border-theme'
                  }`}
                >
                  All Staff ({staffList.length})
                </button>
                {staffList.some(s => !s.assigned_office && s.role === 'LGU_PERSONNEL') && (
                  <button
                    type="button"
                    onClick={() => setOfficeFilter('unassigned')}
                    className={`px-3 py-1.5 rounded-full font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
                      officeFilter === 'unassigned'
                        ? 'bg-accent text-white shadow-xs'
                        : 'bg-surface-alt text-text-muted hover:text-text-primary border border-theme'
                    }`}
                  >
                    <span>All Offices (General)</span>
                    <span className="text-[10px] opacity-80 font-mono">
                      ({staffList.filter(s => !s.assigned_office && s.role === 'LGU_PERSONNEL').length})
                    </span>
                  </button>
                )}
                {Array.from(new Set(staffList.map(s => s.assigned_office).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b)).map((off) => {
                  const count = staffList.filter(s => s.assigned_office === off).length;
                  return (
                    <button
                      key={off}
                      type="button"
                      onClick={() => setOfficeFilter(off)}
                      className={`px-3 py-1.5 rounded-full font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
                        officeFilter === off
                          ? 'bg-accent text-white shadow-xs'
                          : 'bg-surface-alt text-text-muted hover:text-text-primary border border-theme'
                      }`}
                    >
                      <span>{off}</span>
                      <span className="text-[10px] opacity-80 font-mono">({count})</span>
                    </button>
                  );
                })}
              </div>

              {loading ? (
                <SkeletonStaffGrid count={6} />
              ) : (
                <>
                  {staffList
                    .filter(member => {
                      if (officeFilter === 'all') return true;
                      if (officeFilter === 'unassigned') return !member.assigned_office && member.role === 'LGU_PERSONNEL';
                      return member.assigned_office === officeFilter;
                    })
                    .sort((a, b) => {
                      // Priority order:
                      // 1. LGU Administrator always at the very top
                      // 2. All Offices / General Personnel
                      // 3. Department desks ordered alphabetically by office, then by name
                      const getRank = (m: StaffMember) => {
                        if (m.role === 'LGU_ADMIN') return 1;
                        if (!m.assigned_office) return 2;
                        return 3;
                      };
                      const rankA = getRank(a);
                      const rankB = getRank(b);
                      if (rankA !== rankB) return rankA - rankB;
                      if (a.assigned_office && b.assigned_office && a.assigned_office !== b.assigned_office) {
                        return a.assigned_office.localeCompare(b.assigned_office);
                      }
                      return a.name.localeCompare(b.name);
                    })
                    .map((member) => (
                    <Card noBorder key={member.id}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-surface-alt rounded-full flex items-center justify-center">
                            <User variant="Bold" className="w-5 h-5 text-text-muted" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-text-primary">{member.name}</p>
                              {member.assigned_office ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-accent text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs">
                                  <Building variant="Bold" className="w-3 h-3 text-white shrink-0" />
                                  <span>{member.assigned_office}</span>
                                </span>
                              ) : member.role === 'LGU_PERSONNEL' ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-surface-alt text-text-primary text-[11px] font-medium border border-theme flex items-center gap-1">
                                  <People variant="Bold" className="w-3 h-3 text-text-muted shrink-0" />
                                  <span>All Offices</span>
                                </span>
                              ) : null}
                            </div>
                            <p className="text-sm text-text-muted">{member.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={member.role === 'LGU_ADMIN' ? 'info' : 'default'}>
                                {member.role.replace('_', ' ')}
                              </Badge>
                              {member.role === 'LGU_ADMIN' ? (
                                <span className="text-xs text-text-faint">Full access across all departments</span>
                              ) : (
                                <span className="text-xs text-text-faint">
                                  {member.module_permissions?.length
                                    ? `${member.module_permissions.length} of ${ADMIN_MODULES.length} sections`
                                    : 'No sections granted yet'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {member.role === 'LGU_PERSONNEL' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Change Password"
                              onClick={() => {
                                setResetPasswordStaff(member);
                                setNewPasswordVal('');
                                setShowNewPassword(false);
                              }}
                            >
                              <Key className="w-4 h-4 text-accent" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditingStaff(member);
                            setStaffName(member.name);
                            setStaffEmail(member.email);
                            setStaffRole(member.role as any);
                            setStaffOffice(member.assigned_office || '');
                            setStaffModules(member.module_permissions ?? []);
                            setShowStaffModal(true);
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteStaff(member.id, member.name)}>
                            <Trash variant="Bold" className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {staffList.length === 0 && (
                    <Card noBorder>
                      <p className="text-center py-6 text-text-muted text-sm">No LGU staff members found.</p>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <Card noBorder>
              <h2 className="text-lg font-semibold text-text-primary mb-6">Notification Preferences</h2>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between py-3 border-b border-theme cursor-pointer">
                  <span className="text-text-primary">Push Notifications (Mobile Alerts)</span>
                  <input 
                    type="checkbox" 
                    checked={notifPush}
                    onChange={(e) => setNotifPush(e.target.checked)}
                    className="w-4 h-4 accent-accent"
                  />
                </label>

                <label className="flex items-center justify-between py-3 border-b border-theme cursor-pointer">
                  <span className="text-text-primary">SMS Alerts (Emergency Broadcasts)</span>
                  <input 
                    type="checkbox" 
                    checked={notifSms}
                    onChange={(e) => setNotifSms(e.target.checked)}
                    className="w-4 h-4 accent-accent"
                  />
                </label>

                <label className="flex items-center justify-between py-3 border-b border-theme cursor-pointer">
                  <span className="text-text-primary">Email Digests (Weekly Reports)</span>
                  <input 
                    type="checkbox" 
                    checked={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.checked)}
                    className="w-4 h-4 accent-accent"
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-theme mt-6">
                <Button onClick={() => triggerConfirm('Confirm Preferences Update', 'Are you sure you want to save these notification preferences?', handleSaveNotifications)}>Save Preferences</Button>
              </div>
            </Card>
          )}
      </div>

      {/* Add/Edit Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface rounded-lg border border-theme p-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-theme pb-3 mb-4">
              <h3 className="text-base font-semibold text-text-primary">
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </h3>
              <button onClick={() => setShowStaffModal(false)} className="text-text-faint hover:text-text-primary">
                <CloseCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Juan dela Cruz"
                value={staffName}
                onChange={(e: any) => setStaffName(e.target.value)}
              />

              <Input
                label="Email Address"
                placeholder="juan@liliw.gov.ph"
                type="email"
                value={staffEmail}
                onChange={(e: any) => setStaffEmail(e.target.value)}
              />

              {!editingStaff && (
                <Input
                  label="Temporary Password (min. 8 characters)"
                  placeholder="Give a secure initial password"
                  type="password"
                  value={staffPassword}
                  onChange={(e: any) => setStaffPassword(e.target.value)}
                />
              )}

              <div>
                <label className="block text-sm text-text-muted mb-1.5">Role</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="LGU_PERSONNEL">LGU Personnel (Field / Desk Staff)</option>
                  <option value="LGU_ADMIN">LGU Administrator</option>
                </select>
              </div>

              {/* Department / Office Selection for Personnel */}
              {staffRole === 'LGU_PERSONNEL' && (
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">
                    Assigned Department / Municipal Office
                  </label>
                  <select
                    value={staffOffice}
                    onChange={(e) => setStaffOffice(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">All Offices / General Staff</option>
                    {availableOffices.map((off) => (
                      <option key={off} value={off}>{off}</option>
                    ))}
                  </select>
                  <p className="text-xs text-text-faint mt-1">
                    Staff assigned to an office will only see and process service requests and issue reports belonging to that department.
                  </p>
                </div>
              )}

              {/* Module access — personnel only. An LGU Administrator always
                  has every section, so there is nothing to choose. */}
              {staffRole === 'LGU_PERSONNEL' ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm text-text-muted">
                      Sections this staff member can use
                    </label>
                    <button
                      type="button"
                      onClick={() => setStaffModules(
                        staffModules.length === ADMIN_MODULES.length ? [] : [...ADMIN_MODULES]
                      )}
                      className="text-xs text-accent hover:underline"
                    >
                      {staffModules.length === ADMIN_MODULES.length ? 'Clear all' : 'Select all'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {ADMIN_MODULES.map((m) => (
                      <label
                        key={m}
                        className="flex items-center gap-2 p-2 border border-theme rounded-md bg-surface cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={staffModules.includes(m)}
                          onChange={(e) => setStaffModules(prev =>
                            e.target.checked ? [...prev, m] : prev.filter(x => x !== m)
                          )}
                          className="w-4 h-4 accent-accent rounded"
                        />
                        <span className="text-xs text-text-primary font-semibold">
                          {MODULE_LABELS[m]}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-text-faint mt-2">
                    They&apos;ll only see these in their sidebar, and the database blocks
                    everything else even by direct request. Leave all unticked and they can
                    only reach their own profile.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-text-faint">
                  LGU Administrators have access to every section, including branding
                  and staff management.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6 border-t border-theme pt-4">
              <Button variant="ghost" onClick={() => setShowStaffModal(false)}>Cancel</Button>
              <Button onClick={handleSaveStaff}>Save Staff Member</Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-surface rounded-lg border border-theme p-6 shadow-xl">
            <h3 className="text-base font-semibold text-text-primary mb-2">{confirmTitle}</h3>
            <p className="text-sm text-text-muted mb-6">{confirmMessage}</p>
            <div className="flex justify-end gap-2 border-t border-theme pt-4">
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button onClick={() => { confirmAction?.(); setConfirmOpen(false); }}>Yes, Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Staff Password Modal (Pattern 1) */}
      {resetPasswordStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-theme p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-theme">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Key variant="Bold" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Change Staff Password</h3>
                  <p className="text-xs text-text-muted">Set a new password directly for this account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetPasswordStaff(null)}
                className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <CloseCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Staff Details Summary */}
            <div className="p-3.5 rounded-xl bg-surface-alt border border-theme mb-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-text-primary">{resetPasswordStaff.name}</span>
                {resetPasswordStaff.assigned_office ? (
                  <span className="px-2 py-0.5 rounded-full bg-accent text-white text-[10.5px] font-semibold flex items-center gap-1">
                    <Building variant="Bold" className="w-2.5 h-2.5" />
                    <span>{resetPasswordStaff.assigned_office}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-surface text-text-primary text-[10.5px] font-medium border border-theme flex items-center gap-1">
                    <People variant="Bold" className="w-2.5 h-2.5 text-text-muted" />
                    <span>All Offices</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted font-mono">{resetPasswordStaff.email}</p>
            </div>

            {/* Password Input */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPasswordVal(generateRandomPassword(12))}
                    className="text-xs text-accent hover:underline font-semibold flex items-center gap-1"
                  >
                    Generate Secure Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full h-11 pl-3.5 pr-10 bg-surface border border-theme rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                  >
                    {showNewPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-text-faint mt-1.5">
                  Must be at least 8 characters. The staff member can use this password to sign in immediately.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-theme">
              <Button variant="ghost" onClick={() => setResetPasswordStaff(null)} disabled={resettingPassword}>
                Cancel
              </Button>
              <Button onClick={handleResetStaffPassword} disabled={resettingPassword || !newPasswordVal || newPasswordVal.length < 8}>
                {resettingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

