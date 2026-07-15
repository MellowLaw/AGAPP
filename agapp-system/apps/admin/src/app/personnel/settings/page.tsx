'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { User, Notification } from 'iconsax-react';

const NOTIF_ITEMS: { key: 'push' | 'sms' | 'email'; label: string }[] = [
  { key: 'push', label: 'Push notifications for new assignments' },
  { key: 'sms', label: 'SMS alerts for urgent status changes' },
  { key: 'email', label: 'Email weekly summary reports' },
];

export default function PersonnelSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications'>('profile');
  const { showToast, ToastContainer } = useToast();

  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);

  const [notifPush, setNotifPush] = useState(true);
  const [notifSms, setNotifSms] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('id, name, email, role, notification_preferences')
        .eq('id', authUser.id)
        .single();

      if (error || !profile) {
        showToast(error?.message || 'Failed to load profile', 'error');
        setLoading(false);
        return;
      }

      setUserId(profile.id);
      setName(profile.name || '');
      setEmail(profile.email || '');
      setRole(profile.role || '');
      if (profile.notification_preferences) {
        const prefs = profile.notification_preferences as any;
        setNotifPush(prefs.push !== false);
        setNotifSms(prefs.sms !== false);
        setNotifEmail(prefs.email !== false);
      }
      setLoading(false);
    };

    loadProfile();
    // Deliberately run once on mount only — showToast is a new function
    // reference on every render (useToast doesn't memoize it), so including
    // it here would refetch in a loop and keep resetting typed input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfile = async () => {
    if (!userId) return;
    const { error } = await supabase
      .from('users')
      .update({ name, email })
      .eq('id', userId);

    if (error) {
      showToast(error.message || 'Failed to save profile', 'error');
      return;
    }
    showToast('Profile saved successfully!', 'success');
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      showToast('New password must be at least 8 characters.', 'info');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match.', 'info');
      return;
    }

    setSavingPassword(true);
    // Re-authenticate with the current password before changing it.
    const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (reauthError) {
      showToast('Current password is incorrect.', 'error');
      setSavingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      showToast(error.message || 'Failed to change password', 'error');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password changed successfully!', 'success');
  };

  const handleSaveNotifications = async () => {
    if (!userId) {
      showToast('You must be logged in to update preferences.', 'error');
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({
        notification_preferences: { push: notifPush, sms: notifSms, email: notifEmail },
      })
      .eq('id', userId);

    if (error) {
      showToast(error.message || 'Failed to save preferences', 'error');
      return;
    }
    showToast('Preferences saved successfully!', 'success');
  };

  return (
    <DashboardLayout
      role="lgu-personnel"
      lguName="Liliw, Laguna"
      title="Settings"
    >
      <ToastContainer />
      {loading && (
        <div className="mb-4 px-4 py-2 text-sm text-text-muted bg-surface-alt rounded-md animate-pulse">
          Loading your profile…
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <Card padding="none">
            <nav className="p-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left ${
                  activeTab === 'profile'
                    ? 'bg-surface-alt text-text-primary font-medium'
                    : 'text-text-muted hover:bg-surface-alt hover:text-text-primary'
                }`}
              >
                <User variant="Bold" className="w-4 h-4" />
                My Profile
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left ${
                  activeTab === 'notifications'
                    ? 'bg-surface-alt text-text-primary font-medium'
                    : 'text-text-muted hover:bg-surface-alt hover:text-text-primary'
                }`}
              >
                <Notification className="w-4 h-4" />
                Notifications
              </button>
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-6">My Profile</h2>

              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center">
                    <User variant="Bold" className="w-8 h-8 text-text-muted" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{name || 'Loading...'}</p>
                    <p className="text-sm text-text-muted">{role.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e: any) => setName(e.target.value)}
                  />
                  <Input
                    label="Email Address"
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                  />
                </div>

                <div className="pt-4 border-t border-theme">
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                </div>

                <div className="pt-4 border-t border-theme">
                  <h3 className="font-medium text-text-primary mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e: any) => setCurrentPassword(e.target.value)}
                    />
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e: any) => setNewPassword(e.target.value)}
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e: any) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <div className="pt-4">
                    <Button onClick={handleChangePassword} disabled={savingPassword}>
                      {savingPassword ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-6">Notification Preferences</h2>

              <div className="space-y-4">
                {NOTIF_ITEMS.map((item) => {
                  const checked = item.key === 'push' ? notifPush : item.key === 'sms' ? notifSms : notifEmail;
                  const setChecked = item.key === 'push' ? setNotifPush : item.key === 'sms' ? setNotifSms : setNotifEmail;
                  return (
                    <label key={item.key} className="flex items-center justify-between py-3 border-b border-theme last:border-0 cursor-pointer">
                      <span className="text-text-primary">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setChecked(e.target.checked)}
                        className="w-4 h-4 accent-accent"
                      />
                    </label>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-theme mt-6">
                <Button onClick={handleSaveNotifications}>Save Preferences</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
