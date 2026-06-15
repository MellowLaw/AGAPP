'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { 
  User,
  Bell,
  Shield,
  Envelope,
  Phone,
  Building
} from '@phosphor-icons/react';

export default function PersonnelSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications'>('profile');
  const { showToast, ToastContainer } = useToast();

  return (
    <DashboardLayout 
      role="lgu-personnel" 
      lguName="Liliw, Laguna"
      title="Settings"
    >
      <ToastContainer />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <Card padding="none">
            <nav className="p-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left ${
                  activeTab === 'profile' 
                    ? 'bg-[#f5f5f5] text-[#1a1a1a] font-medium' 
                    : 'text-[#737373] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]'
                }`}
              >
                <User className="w-4 h-4" />
                My Profile
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
          {activeTab === 'profile' && (
            <Card>
              <h2 className="text-lg font-semibold text-[#1a1a1a] mb-6">My Profile</h2>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-[#f5f5f5] rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-[#737373]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1a1a1a]">Staff Member</p>
                    <p className="text-sm text-[#737373]">LGU Personnel - Civil Registry Office</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    defaultValue="Ana Reyes"
                  />
                  <Input
                    label="Email Address"
                    defaultValue="ana.reyes@liliw.gov.ph"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    defaultValue="(049) 123-4567"
                  />
                  <div>
                    <label className="block text-sm text-[#737373] mb-1.5">Office Assignment</label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#f5f5f5] border border-[#e5e5e5] rounded-md text-sm text-[#1a1a1a]">
                      <Building className="w-4 h-4 text-[#737373]" />
                      Civil Registry Office
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#e5e5e5]">
                  <h3 className="font-medium text-[#1a1a1a] mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                      placeholder="••••••••"
                    />
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="••••••••"
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#e5e5e5]">
                  <Button onClick={() => showToast('Profile saved successfully!', 'success')}>Save Changes</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <h2 className="text-lg font-semibold text-[#1a1a1a] mb-6">Notification Preferences</h2>
              
              <div className="space-y-4">
                {[
                  { label: 'New service requests assigned to me', checked: true },
                  { label: 'Status updates on my queue', checked: true },
                  { label: 'System maintenance alerts', checked: true },
                  { label: 'Weekly summary reports', checked: false },
                ].map((item, i) => (
                  <label key={i} className="flex items-center justify-between py-3 border-b border-[#e5e5e5] last:border-0 cursor-pointer">
                    <span className="text-[#1a1a1a]">{item.label}</span>
                    <input 
                      type="checkbox" 
                      defaultChecked={item.checked}
                      className="w-4 h-4 accent-[#1a1a1a]"
                    />
                  </label>
                ))}
              </div>

              <div className="pt-4 border-t border-[#e5e5e5] mt-6">
                <Button onClick={() => showToast('Preferences saved successfully!', 'success')}>Save Preferences</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
