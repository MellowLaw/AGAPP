'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { 
  Gear,
  User,
  Bell,
  Shield,
  Building,
  MapPin,
  Envelope,
  Phone,
  Plus,
  Trash,
  Pencil,
  X
} from '@phosphor-icons/react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'LGU_ADMIN' | 'LGU_PERSONNEL' | string;
  is_active: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'staff' | 'notifications'>('general');
  const { showToast, ToastContainer } = useToast();
  const params = useSearchParams();

  // Retrieve LGU Identifier
  const lguNameParam = params?.get('lguName') || 'Liliw, Laguna';
  const lguId = useMemo(
    () => lguNameParam.toLowerCase().replace(/,/g, '').replace(/\s+/g, '-'),
    [lguNameParam]
  );

  // General LGU Details States
  const [lguName, setLguName] = useState('');
  const [lguProvince, setLguProvince] = useState('Laguna');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);

  // Staff States
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<'LGU_ADMIN' | 'LGU_PERSONNEL'>('LGU_PERSONNEL');

  // Notification Preference States
  const [notifPush, setNotifPush] = useState(true);
  const [notifSms, setNotifSms] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

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
        }

        // 2. Load Staff Members
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
  }, [lguId, showToast]);

  // Save General Info
  const handleSaveGeneral = async () => {
    try {
      const fullName = lguProvince ? `${lguName}, ${lguProvince}` : lguName;
      const { error } = await supabase
        .from('lgus')
        .update({
          name: fullName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          office_address: officeAddress,
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
      if (editingStaff) {
        // Update
        const { error } = await supabase
          .from('users')
          .update({
            name: staffName,
            email: staffEmail,
            role: staffRole,
          })
          .eq('id', editingStaff.id);

        if (error) throw error;

        setStaffList(prev => prev.map(s => s.id === editingStaff.id ? { ...s, name: staffName, email: staffEmail, role: staffRole } : s));
        showToast('Staff member updated successfully!', 'success');
      } else {
        // Create (Insert directly into users profile table)
        const newUid = self.crypto.randomUUID();
        const { error } = await supabase
          .from('users')
          .insert({
            id: newUid,
            name: staffName,
            email: staffEmail,
            role: staffRole,
            lgu_id: lguId,
            is_active: true,
            notification_preferences: { push: true, sms: true, email: true }
          });

        if (error) throw error;

        setStaffList(prev => [...prev, { id: newUid, name: staffName, email: staffEmail, role: staffRole, is_active: true }]);
        showToast('Staff member added successfully!', 'success');
      }

      // Close modal and reset fields
      setShowStaffModal(false);
      setEditingStaff(null);
      setStaffName('');
      setStaffEmail('');
      setStaffRole('LGU_PERSONNEL');
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
        <div className="mb-4 px-4 py-2 text-sm text-[#737373] bg-[#f5f5f5] rounded-md animate-pulse">
          Loading settings and configuration…
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <Card padding="none">
            <nav className="p-2">
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left ${
                  activeTab === 'general' 
                    ? 'bg-[#f5f5f5] text-[#1a1a1a] font-medium' 
                    : 'text-[#737373] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]'
                }`}
              >
                <Building className="w-4 h-4" />
                General
              </button>
              <button
                onClick={() => setActiveTab('staff')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left ${
                  activeTab === 'staff' 
                    ? 'bg-[#f5f5f5] text-[#1a1a1a] font-medium' 
                    : 'text-[#737373] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]'
                }`}
              >
                <User className="w-4 h-4" />
                Staff Management
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left ${
                  activeTab === 'notifications' 
                    ? 'bg-[#f5f5f5] text-[#1a1a1a] font-medium' 
                    : 'text-[#737373] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]'
                }`}
              >
                <Bell className="w-4 h-4" />
                Notifications
              </button>
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'general' && (
            <Card>
              <h2 className="text-lg font-semibold text-[#1a1a1a] mb-6">Municipality Information</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Contact Email"
                    value={contactEmail}
                    onChange={(e: any) => setContactEmail(e.target.value)}
                  />
                  <Input
                    label="Contact Phone"
                    value={contactPhone}
                    onChange={(e: any) => setContactPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#737373] mb-1.5">Office Address</label>
                  <textarea
                    rows={3}
                    value={officeAddress}
                    onChange={(e) => setOfficeAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#737373] mb-1.5">Latitude</label>
                    <input
                      type="text"
                      value={latitude}
                      className="w-full px-3 py-2 bg-[#f5f5f5] border border-[#e5e5e5] rounded-md text-sm cursor-not-allowed"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#737373] mb-1.5">Longitude</label>
                    <input
                      type="text"
                      value={longitude}
                      className="w-full px-3 py-2 bg-[#f5f5f5] border border-[#e5e5e5] rounded-md text-sm cursor-not-allowed"
                      readOnly
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#e5e5e5]">
                  <Button onClick={handleSaveGeneral}>Save Changes</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#1a1a1a]">Staff Members</h2>
                <Button onClick={() => {
                  setEditingStaff(null);
                  setStaffName('');
                  setStaffEmail('');
                  setStaffRole('LGU_PERSONNEL');
                  setShowStaffModal(true);
                }}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Staff
                </Button>
              </div>

              {staffList.map((member) => (
                <Card key={member.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#f5f5f5] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-[#737373]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1a1a1a]">{member.name}</p>
                        <p className="text-sm text-[#737373]">{member.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={member.role === 'LGU_ADMIN' ? 'primary' : 'default'}>
                            {member.role.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingStaff(member);
                        setStaffName(member.name);
                        setStaffEmail(member.email);
                        setStaffRole(member.role as any);
                        setShowStaffModal(true);
                      }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteStaff(member.id, member.name)}>
                        <Trash className="w-4 h-4 text-[#dc2626]" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {staffList.length === 0 && (
                <Card>
                  <p className="text-center py-6 text-[#737373] text-sm">No LGU staff members found.</p>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <h2 className="text-lg font-semibold text-[#1a1a1a] mb-6">Notification Preferences</h2>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between py-3 border-b border-[#e5e5e5] cursor-pointer">
                  <span className="text-[#1a1a1a]">Push Notifications (Mobile Alerts)</span>
                  <input 
                    type="checkbox" 
                    checked={notifPush}
                    onChange={(e) => setNotifPush(e.target.checked)}
                    className="w-4 h-4 accent-[#1a1a1a]"
                  />
                </label>

                <label className="flex items-center justify-between py-3 border-b border-[#e5e5e5] cursor-pointer">
                  <span className="text-[#1a1a1a]">SMS Alerts (Emergency Broadcasts)</span>
                  <input 
                    type="checkbox" 
                    checked={notifSms}
                    onChange={(e) => setNotifSms(e.target.checked)}
                    className="w-4 h-4 accent-[#1a1a1a]"
                  />
                </label>

                <label className="flex items-center justify-between py-3 border-b border-[#e5e5e5] cursor-pointer">
                  <span className="text-[#1a1a1a]">Email Digests (Weekly Reports)</span>
                  <input 
                    type="checkbox" 
                    checked={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.checked)}
                    className="w-4 h-4 accent-[#1a1a1a]"
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-[#e5e5e5] mt-6">
                <Button onClick={handleSaveNotifications}>Save Preferences</Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Add/Edit Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-lg border border-[#e5e5e5] p-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#e5e5e5] pb-3 mb-4">
              <h3 className="text-base font-semibold text-[#1a1a1a]">
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </h3>
              <button onClick={() => setShowStaffModal(false)} className="text-[#a3a3a3] hover:text-[#1a1a1a]">
                <X className="w-5 h-5" />
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

              <div>
                <label className="block text-sm text-[#737373] mb-1.5">Role</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                >
                  <option value="LGU_PERSONNEL">LGU Personnel (Field / Desk Staff)</option>
                  <option value="LGU_ADMIN">LGU Administrator</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 border-t border-[#e5e5e5] pt-4">
              <Button variant="ghost" onClick={() => setShowStaffModal(false)}>Cancel</Button>
              <Button onClick={handleSaveStaff}>Save Staff Member</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

