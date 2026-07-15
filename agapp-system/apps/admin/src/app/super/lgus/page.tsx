'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Search } from '@/components/ui/Search';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { formatAvgTurnaround } from '@/lib/turnaround';
import { lguIdFromName } from '@/lib/lgu';
import { listRegions, provincesOfRegion, citiesOfProvince } from '@/data/ph-locations';
import { Add, Eye, CloseCircle, DocumentDownload, ArrowLeft, ArrowRight, TickCircle, Location, Colorfilter, UserAdd, ClipboardText } from 'iconsax-react';
import { ColorPaletteSelector } from '@/components/ui/ColorPaletteSelector';

interface Lgu {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  users: number;
  reports: number;
  requests: number;
  responseTime: string;
  logo: string;
  banner_url: string | null;
  primary_color: string;
  secondary_color: string;
  latitude: number;
  longitude: number;
  region: string | null;
  province: string | null;
  onboarding_fee_paid: boolean;
  feature_flags: {
    chatbot: boolean;
    potholeDetection: boolean;
    forum: boolean;
    iconColor?: string;
    darkBgColor?: string;
  };
}

const DEFAULT_PRIMARY = '#A2B59F';
const DEFAULT_SECONDARY = '#9FADB5';
const DEFAULT_FLAGS = { chatbot: true, potholeDetection: true, forum: true };

type WizardFlags = { chatbot: boolean; potholeDetection: boolean; forum: boolean; iconColor?: string; darkBgColor?: string; };

interface WizardState {
  step: number;
  // Step 1 — location
  region: string;
  province: string;
  city: string;
  // Step 2 — branding
  primaryColor: string;
  secondaryColor: string;
  onboardingFeePaid: boolean;
  flags: WizardFlags;
  // Step 3 — first admin (optional)
  adminEmail: string;
  adminName: string;
  adminPassword: string;
}

const EMPTY_WIZARD: WizardState = {
  step: 1,
  region: '',
  province: '',
  city: '',
  primaryColor: DEFAULT_PRIMARY,
  secondaryColor: DEFAULT_SECONDARY,
  onboardingFeePaid: false,
  flags: { ...DEFAULT_FLAGS },
  adminEmail: '',
  adminName: '',
  adminPassword: '',
};

const WIZARD_STEPS = [
  { n: 1, label: 'Location', icon: Location },
  { n: 2, label: 'Branding', icon: Colorfilter },
  { n: 3, label: 'First Admin', icon: UserAdd },
  { n: 4, label: 'Review', icon: ClipboardText },
];

function ReviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs font-semibold text-text-muted uppercase">{label}</span>
      <span className={`text-sm text-text-primary text-right ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}

export default function SuperLgusPage() {
  const [lgus, setLgus] = useState<Lgu[]>([]);
  const [search, setSearch] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizard, setWizard] = useState<WizardState>(EMPTY_WIZARD);
  const [creating, setCreating] = useState(false);
  const [selectedLguForEdit, setSelectedLguForEdit] = useState<Lgu | null>(null);
  const { showToast, ToastContainer } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLgus = async () => {
      setLoading(true);
      setLoadError(null);
      
      try {
        const [{ data: lguData, error: lguError }, { data: dbUsers }, { data: dbReports }, { data: dbRequests }] = await Promise.all([
          supabase.from('lgus').select('*'),
          supabase.from('users').select('id, lgu_id'),
          supabase.from('reports').select('id, lgu_id, status, created_at, updated_at'),
          supabase.from('service_requests').select('id, lgu_id, status, created_at, updated_at'),
        ]);

        if (lguError) {
          console.error('Error loading LGUs', lguError);
          setLoadError(lguError.message);
          setLoading(false);
          return;
        }

        if (lguData) {
          const mapped: Lgu[] = lguData.map((row: any) => {
            const lguUsers = (dbUsers || []).filter(u => u.lgu_id === row.id).length;
            const lguOwnReports = (dbReports || []).filter(r => r.lgu_id === row.id);
            const lguOwnRequests = (dbRequests || []).filter(s => s.lgu_id === row.id);
            return {
              id: row.id,
              name: row.name,
              status: row.is_active === false ? 'inactive' : 'active',
              users: lguUsers || 0,
              reports: lguOwnReports.length,
              requests: lguOwnRequests.length,
              responseTime: formatAvgTurnaround(lguOwnReports, lguOwnRequests),
              logo: row.logo || '',
              banner_url: row.banner_url || null,
              primary_color: row.primary_color || '#A2B59F',
              secondary_color: row.secondary_color || '#9FADB5',
              latitude: row.latitude || 0,
              longitude: row.longitude || 0,
              region: row.region || null,
              province: row.province || null,
              onboarding_fee_paid: !!row.onboarding_fee_paid,
              feature_flags: row.feature_flags || { chatbot: true, potholeDetection: true, forum: true },
            };
          });
          setLgus(mapped);
        }
      } catch (err: any) {
        console.error('Failed to load LGU profiles', err);
        setLoadError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchLgus();
  }, []);

  const existingIds = useMemo(() => new Set(lgus.map(l => l.id)), [lgus]);

  const filtered = lgus.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  // ---- Add-LGU wizard helpers -------------------------------------------
  const regions = useMemo(() => listRegions(), []);
  const provinces = useMemo(
    () => (wizard.region ? provincesOfRegion(wizard.region) : []),
    [wizard.region]
  );
  const cities = useMemo(
    () => (wizard.region && wizard.province ? citiesOfProvince(wizard.region, wizard.province) : []),
    [wizard.region, wizard.province]
  );

  // Derived LGU name + id from the location selections.
  const wizardName = wizard.city && wizard.province ? `${wizard.city}, ${wizard.province}` : '';
  const wizardId = wizardName ? lguIdFromName(wizardName) : '';
  const duplicateId = !!wizardId && existingIds.has(wizardId);
  const locationComplete = !!wizard.region && !!wizard.province && !!wizard.city;
  const canProceedLocation = locationComplete && !duplicateId;

  const openWizard = () => {
    setWizard(EMPTY_WIZARD);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    if (creating) return;
    setWizardOpen(false);
  };

  const patchWizard = (patch: Partial<WizardState>) => setWizard(prev => ({ ...prev, ...patch }));

  const goNext = () => setWizard(prev => ({ ...prev, step: Math.min(prev.step + 1, 4) }));
  const goBack = () => setWizard(prev => ({ ...prev, step: Math.max(prev.step - 1, 1) }));

  const handleCreateLgu = async () => {
    if (!canProceedLocation) return;

    const id = wizardId;
    const name = wizardName;
    const wantsAdmin = !!wizard.adminEmail.trim();

    setCreating(true);

    const newLgu: Lgu = {
      id,
      name,
      status: 'active',
      users: 0,
      reports: 0,
      requests: 0,
      responseTime: 'N/A',
      logo: '',
      banner_url: null,
      primary_color: wizard.primaryColor,
      secondary_color: wizard.secondaryColor,
      latitude: 0,
      longitude: 0,
      region: wizard.region,
      province: wizard.province,
      onboarding_fee_paid: wizard.onboardingFeePaid,
      feature_flags: { ...wizard.flags },
    };

    // Optimistically add to list
    setLgus(prev => [...prev, newLgu]);

    const { error } = await supabase
      .from('lgus')
      .insert({
        id,
        name,
        logo: '',
        banner_url: null,
        primary_color: wizard.primaryColor,
        secondary_color: wizard.secondaryColor,
        latitude: 0,
        longitude: 0,
        region: wizard.region,
        province: wizard.province,
        is_active: true,
        onboarding_fee_paid: wizard.onboardingFeePaid,
        feature_flags: { ...wizard.flags },
      });

    if (error) {
      console.error('Failed to add LGU', error);
      setLgus(prev => prev.filter(l => l.id !== id));
      setCreating(false);
      showToast('Failed to add LGU. Please try again.', 'error');
      return;
    }

    // Optional: create the first LGU admin. A failure here must NOT roll back
    // the LGU — it's created either way; we just surface the admin error.
    if (wantsAdmin) {
      try {
        const res = await fetch('/api/create-staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: wizard.adminEmail.trim(),
            password: wizard.adminPassword,
            name: wizard.adminName.trim(),
            role: 'LGU_ADMIN',
            lguId: id,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Failed to create admin account.');

        setCreating(false);
        setWizardOpen(false);
        showToast(`Created ${name} and its LGU admin (${wizard.adminEmail.trim()}).`, 'success');
        return;
      } catch (err: any) {
        console.error('LGU created but admin creation failed', err);
        setCreating(false);
        setWizardOpen(false);
        showToast(`LGU created, but admin account couldn't be created: ${err.message || err}`, 'error');
        return;
      }
    }

    setCreating(false);
    setWizardOpen(false);
    showToast(`Added ${name}.`, 'success');
  };

  const toggleActive = async (id: string) => {
    const target = lgus.find(l => l.id === id);
    if (!target) return;

    const newStatus: 'active' | 'inactive' = target.status === 'active' ? 'inactive' : 'active';
    setLgus(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));

    const { error } = await supabase
      .from('lgus')
      .update({ is_active: newStatus === 'active' })
      .eq('id', id);

    if (error) {
      console.error('Failed to update LGU status', error);
      // rollback
      setLgus(prev => prev.map(l => l.id === id ? { ...l, status: target.status } : l));
      showToast('Failed to update LGU status. Please try again.', 'error');
      return;
    }

    showToast(`LGU ${target.name} is now ${newStatus === 'active' ? 'Active' : 'Inactive'}.`, 'success');
  };

  const handleSaveLgu = async () => {
    if (!selectedLguForEdit) return;

    const { error } = await supabase
      .from('lgus')
      .update({
        latitude: selectedLguForEdit.latitude,
        longitude: selectedLguForEdit.longitude,
        primary_color: selectedLguForEdit.primary_color,
        secondary_color: selectedLguForEdit.secondary_color,
        onboarding_fee_paid: selectedLguForEdit.onboarding_fee_paid,
        feature_flags: selectedLguForEdit.feature_flags,
      })
      .eq('id', selectedLguForEdit.id);

    if (error) {
      console.error('Failed to update LGU profile', error);
      showToast('Failed to update LGU profile. Please try again.', 'error');
      return;
    }

    setLgus(prev => prev.map(l => l.id === selectedLguForEdit.id ? selectedLguForEdit : l));
    const name = selectedLguForEdit.name;
    setSelectedLguForEdit(null);
    showToast(`Updated profile configurations for ${name}.`, 'success');
  };



  return (
    <DashboardLayout role="super-admin" title="LGU Directory">
      <ToastContainer />
      {loading && (
        <div className="mb-3 px-4 py-2 text-sm text-text-muted bg-surface-alt rounded-xl">
          Loading LGUs…
        </div>
      )}
      {loadError && !loading && (
        <div className="mb-3 px-4 py-2 text-sm text-accent bg-accent-soft rounded-xl">
          Failed to load LGUs: {loadError}
        </div>
      )}
      <Card>
        <CardHeader
          title="Municipalities"
          action={
            <Button onClick={openWizard}>
              <Add className="w-4 h-4 mr-1" />
              Add LGU
            </Button>
          }
        />

        <div className="flex items-center justify-between mb-4">
          <Search value={search} onChange={setSearch} className="max-w-md" placeholder="Search municipality..." />
          <Button
            variant="secondary"
            onClick={handleExportCsv}
          >
            <DocumentDownload className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '0 6px' }}>
            <thead>
              <tr>
                <th className="text-left pb-2 px-4 text-xs font-semibold text-text-faint uppercase tracking-wider">LGU</th>
                <th className="text-left pb-2 px-4 text-xs font-semibold text-text-faint uppercase tracking-wider">Users</th>
                <th className="text-left pb-2 px-4 text-xs font-semibold text-text-faint uppercase tracking-wider">Reports</th>
                <th className="text-left pb-2 px-4 text-xs font-semibold text-text-faint uppercase tracking-wider">Requests</th>
                <th className="text-left pb-2 px-4 text-xs font-semibold text-text-faint uppercase tracking-wider">Avg Response</th>
                <th className="text-left pb-2 px-4 text-xs font-semibold text-text-faint uppercase tracking-wider">Status</th>
                <th className="text-right pb-2 px-4 text-xs font-semibold text-text-faint uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lgu) => (
                <tr key={lgu.id} className="bg-surface-alt hover:bg-surface transition-colors">
                  <td className="py-3 px-4 rounded-l-md font-medium text-text-primary">{lgu.name}</td>
                  <td className="py-3 px-4 text-sm font-mono text-text-muted">{lgu.users.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm font-mono text-text-muted">{lgu.reports}</td>
                  <td className="py-3 px-4 text-sm font-mono text-text-muted">{lgu.requests}</td>
                  <td className="py-3 px-4 text-sm text-text-muted">{lgu.responseTime}</td>
                  <td className="py-3 px-4">
                    <Badge variant={lgu.status === 'active' ? 'success' : 'default'}>
                      {lgu.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 rounded-r-md">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLguForEdit({ ...lgu })}>
                        <Eye variant="Bold" className="w-4 h-4 mr-1" /> Configure
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => toggleActive(lgu.id)}>
                        <CloseCircle className="w-4 h-4 mr-1" /> {lgu.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* LGU Settings Modal */}
      {selectedLguForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-surface rounded-2xl border border-theme p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start border-b border-theme pb-3 mb-4">
              <h3 className="text-lg font-bold text-text-primary">Configure LGU: {selectedLguForEdit.name}</h3>
              <button onClick={() => setSelectedLguForEdit(null)} className="text-text-faint hover:text-accent font-bold">✕</button>
            </div>

            <div className="space-y-5">
              {/* Latitude and Longitude */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={selectedLguForEdit.latitude || 0}
                    onChange={(e) => setSelectedLguForEdit({ ...selectedLguForEdit, latitude: parseFloat(e.target.value || '0') })}
                    className="w-full px-3 py-2 bg-surface-alt border border-theme rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={selectedLguForEdit.longitude || 0}
                    onChange={(e) => setSelectedLguForEdit({ ...selectedLguForEdit, longitude: parseFloat(e.target.value || '0') })}
                    className="w-full px-3 py-2 bg-surface-alt border border-theme rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedLguForEdit.primary_color || '#ffffff'}
                      onChange={(e) => setSelectedLguForEdit({ ...selectedLguForEdit, primary_color: e.target.value })}
                      className="w-10 h-10 border border-theme rounded-lg p-1 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedLguForEdit.primary_color || ''}
                      onChange={(e) => setSelectedLguForEdit({ ...selectedLguForEdit, primary_color: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-alt border border-theme rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Secondary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedLguForEdit.secondary_color || '#ffffff'}
                      onChange={(e) => setSelectedLguForEdit({ ...selectedLguForEdit, secondary_color: e.target.value })}
                      className="w-10 h-10 border border-theme rounded-lg p-1 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedLguForEdit.secondary_color || ''}
                      onChange={(e) => setSelectedLguForEdit({ ...selectedLguForEdit, secondary_color: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-alt border border-theme rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Icon Color and Dark BG Color overrides */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Icon Override Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedLguForEdit.feature_flags?.iconColor || selectedLguForEdit.primary_color || '#ffffff'}
                      onChange={(e) => setSelectedLguForEdit({
                        ...selectedLguForEdit,
                        feature_flags: { ...selectedLguForEdit.feature_flags, iconColor: e.target.value }
                      })}
                      className="w-10 h-10 border border-theme rounded-lg p-1 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={selectedLguForEdit.feature_flags?.iconColor || ''}
                      placeholder={selectedLguForEdit.primary_color}
                      onChange={(e) => setSelectedLguForEdit({
                        ...selectedLguForEdit,
                        feature_flags: { ...selectedLguForEdit.feature_flags, iconColor: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-surface-alt border border-theme rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Dark BG Override</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedLguForEdit.feature_flags?.darkBgColor || '#292929'}
                      onChange={(e) => setSelectedLguForEdit({
                        ...selectedLguForEdit,
                        feature_flags: { ...selectedLguForEdit.feature_flags, darkBgColor: e.target.value }
                      })}
                      className="w-10 h-10 border border-theme rounded-lg p-1 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={selectedLguForEdit.feature_flags?.darkBgColor || ''}
                      placeholder="#292929"
                      onChange={(e) => setSelectedLguForEdit({
                        ...selectedLguForEdit,
                        feature_flags: { ...selectedLguForEdit.feature_flags, darkBgColor: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-surface-alt border border-theme rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              <ColorPaletteSelector
                primaryColor={selectedLguForEdit.primary_color || '#ffffff'}
                secondaryColor={selectedLguForEdit.secondary_color || '#ffffff'}
                iconColor={selectedLguForEdit.feature_flags?.iconColor || selectedLguForEdit.primary_color || '#ffffff'}
                darkBgColor={selectedLguForEdit.feature_flags?.darkBgColor || '#292929'}
                onChange={({ primaryColor, secondaryColor, iconColor, darkBgColor }) =>
                  setSelectedLguForEdit({
                    ...selectedLguForEdit,
                    primary_color: primaryColor,
                    secondary_color: secondaryColor,
                    feature_flags: {
                      ...selectedLguForEdit.feature_flags,
                      iconColor,
                      darkBgColor,
                    }
                  })
                }
                lguName={selectedLguForEdit.name}
              />

              {/* Onboarding payment status */}
              <label className="flex items-center gap-2.5 py-2 border-b border-theme cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLguForEdit.onboarding_fee_paid || false}
                  onChange={(e) => setSelectedLguForEdit({ ...selectedLguForEdit, onboarding_fee_paid: e.target.checked })}
                  className="rounded text-accent focus:ring-accent w-4 h-4"
                />
                <span className="text-sm font-semibold text-text-primary">Onboarding Fee Paid (Active License)</span>
              </label>

              {/* Feature Flags */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-text-faint uppercase tracking-wider">Feature Flags</p>
                <div className="grid grid-cols-3 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedLguForEdit.feature_flags?.chatbot || false}
                      onChange={(e) => setSelectedLguForEdit({
                        ...selectedLguForEdit,
                        feature_flags: { ...selectedLguForEdit.feature_flags!, chatbot: e.target.checked }
                      })}
                      className="rounded text-accent focus:ring-accent w-4 h-4"
                    />
                    <span className="text-sm font-semibold text-text-primary">Chatbot</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedLguForEdit.feature_flags?.potholeDetection || false}
                      onChange={(e) => setSelectedLguForEdit({
                        ...selectedLguForEdit,
                        feature_flags: { ...selectedLguForEdit.feature_flags!, potholeDetection: e.target.checked }
                      })}
                      className="rounded text-accent focus:ring-accent w-4 h-4"
                    />
                    <span className="text-sm font-semibold text-text-primary">AI Pothole</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedLguForEdit.feature_flags?.forum || false}
                      onChange={(e) => setSelectedLguForEdit({
                        ...selectedLguForEdit,
                        feature_flags: { ...selectedLguForEdit.feature_flags!, forum: e.target.checked }
                      })}
                      className="rounded text-accent focus:ring-accent w-4 h-4"
                    />
                    <span className="text-sm font-semibold text-text-primary">Forum</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 border-t border-theme pt-4 justify-end">
              <Button variant="secondary" onClick={() => setSelectedLguForEdit(null)}>Cancel</Button>
              <Button onClick={handleSaveLgu}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add-LGU Onboarding Wizard */}
      <AnimatePresence>
        {wizardOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeWizard}
          >
            <motion.div
              className="w-full max-w-2xl bg-surface rounded-2xl border border-theme p-6 overflow-y-auto max-h-[92vh]"
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-theme pb-3 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Add a new LGU</h3>
                  <p className="text-sm text-text-muted mt-0.5">
                    Step {wizard.step} of 4 — {WIZARD_STEPS[wizard.step - 1].label}
                  </p>
                </div>
                <button
                  onClick={closeWizard}
                  disabled={creating}
                  className="text-text-faint hover:text-accent font-bold disabled:opacity-40"
                >
                  ✕
                </button>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center justify-between mb-6">
                {WIZARD_STEPS.map((s, i) => {
                  const StepIcon = s.icon;
                  const done = wizard.step > s.n;
                  const active = wizard.step === s.n;
                  return (
                    <React.Fragment key={s.n}>
                      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                            done
                              ? 'bg-accent border-accent text-white'
                              : active
                              ? 'border-accent text-accent bg-accent-soft'
                              : 'border-theme text-text-faint bg-surface-alt'
                          }`}
                        >
                          {done ? <TickCircle className="w-5 h-5" /> : <StepIcon className="w-4 h-4" />}
                        </div>
                        <span className={`text-[11px] font-semibold ${active || done ? 'text-text-primary' : 'text-text-faint'}`}>
                          {s.label}
                        </span>
                      </div>
                      {i < WIZARD_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 mb-4 rounded ${wizard.step > s.n ? 'bg-accent' : 'bg-theme'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Step body */}
              <div className="min-h-[240px]">
                {/* STEP 1 — Location */}
                {wizard.step === 1 && (
                  <div className="space-y-5">
                    <p className="text-sm text-text-muted">
                      Choose where this LGU is located. We use the official Philippine
                      region → province → city/municipality hierarchy.
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Region</label>
                      <select
                        value={wizard.region}
                        onChange={(e) => patchWizard({ region: e.target.value, province: '', city: '' })}
                        className="w-full px-3 py-2 bg-surface-alt border border-theme rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                      >
                        <option value="">Select a region…</option>
                        {regions.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Province</label>
                      <select
                        value={wizard.province}
                        disabled={!wizard.region}
                        onChange={(e) => patchWizard({ province: e.target.value, city: '' })}
                        className="w-full px-3 py-2 bg-surface-alt border border-theme rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
                      >
                        <option value="">{wizard.region ? 'Select a province…' : 'Select a region first'}</option>
                        {provinces.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">City / Municipality</label>
                      <select
                        value={wizard.city}
                        disabled={!wizard.province}
                        onChange={(e) => patchWizard({ city: e.target.value })}
                        className="w-full px-3 py-2 bg-surface-alt border border-theme rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
                      >
                        <option value="">{wizard.province ? 'Select a city/municipality…' : 'Select a province first'}</option>
                        {cities.map((c) => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {locationComplete && (
                      <div className={`rounded-lg px-3 py-2.5 text-sm ${duplicateId ? 'bg-accent-soft text-accent' : 'bg-surface-alt text-text-muted'}`}>
                        {duplicateId ? (
                          <>An LGU with the id <span className="font-mono font-semibold">{wizardId}</span> already exists. Pick a different location.</>
                        ) : (
                          <>
                            This LGU will be named <span className="font-semibold text-text-primary">{wizardName}</span>
                            {' '}(id <span className="font-mono">{wizardId}</span>).
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2 — Branding */}
                {wizard.step === 2 && (
                  <div className="space-y-5">
                    <p className="text-sm text-text-muted">
                      Set the LGU&apos;s brand colors and which features are enabled. You can change
                      all of this later from the Configure panel.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Primary Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={wizard.primaryColor}
                            onChange={(e) => patchWizard({ primaryColor: e.target.value })}
                            className="w-10 h-10 border border-theme rounded-lg p-1 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={wizard.primaryColor}
                            onChange={(e) => patchWizard({ primaryColor: e.target.value })}
                            className="w-full px-3 py-2 bg-surface-alt border border-theme rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Secondary Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={wizard.secondaryColor}
                            onChange={(e) => patchWizard({ secondaryColor: e.target.value })}
                            className="w-10 h-10 border border-theme rounded-lg p-1 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={wizard.secondaryColor}
                            onChange={(e) => patchWizard({ secondaryColor: e.target.value })}
                            className="w-full px-3 py-2 bg-surface-alt border border-theme rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Custom Icon Color and Dark BG Color overrides for Wizard */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Icon Override Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={wizard.flags.iconColor || wizard.primaryColor}
                            onChange={(e) => patchWizard({ flags: { ...wizard.flags, iconColor: e.target.value } })}
                            className="w-10 h-10 border border-theme rounded-lg p-1 cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={wizard.flags.iconColor || ''}
                            placeholder={wizard.primaryColor}
                            onChange={(e) => patchWizard({ flags: { ...wizard.flags, iconColor: e.target.value } })}
                            className="w-full px-3 py-2 bg-surface-alt border border-theme rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Dark BG Override</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={wizard.flags.darkBgColor || '#292929'}
                            onChange={(e) => patchWizard({ flags: { ...wizard.flags, darkBgColor: e.target.value } })}
                            className="w-10 h-10 border border-theme rounded-lg p-1 cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={wizard.flags.darkBgColor || ''}
                            placeholder="#292929"
                            onChange={(e) => patchWizard({ flags: { ...wizard.flags, darkBgColor: e.target.value } })}
                            className="w-full px-3 py-2 bg-surface-alt border border-theme rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                          />
                        </div>
                      </div>
                    </div>

                    <ColorPaletteSelector
                      primaryColor={wizard.primaryColor}
                      secondaryColor={wizard.secondaryColor}
                      iconColor={wizard.flags.iconColor || wizard.primaryColor}
                      darkBgColor={wizard.flags.darkBgColor || '#292929'}
                      onChange={({ primaryColor, secondaryColor, iconColor, darkBgColor }) =>
                        patchWizard({
                          primaryColor,
                          secondaryColor,
                          flags: {
                            ...wizard.flags,
                            iconColor,
                            darkBgColor,
                          }
                        })
                      }
                      lguName={wizard.city || 'Municipality'}
                    />

                    <label className="flex items-center gap-2.5 py-2 border-b border-theme cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wizard.onboardingFeePaid}
                        onChange={(e) => patchWizard({ onboardingFeePaid: e.target.checked })}
                        className="rounded text-accent focus:ring-accent w-4 h-4"
                      />
                      <span className="text-sm font-semibold text-text-primary">Onboarding Fee Paid (Active License)</span>
                    </label>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-text-faint uppercase tracking-wider">Feature Flags</p>
                      <div className="grid grid-cols-3 gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={wizard.flags.chatbot}
                            onChange={(e) => patchWizard({ flags: { ...wizard.flags, chatbot: e.target.checked } })}
                            className="rounded text-accent focus:ring-accent w-4 h-4"
                          />
                          <span className="text-sm font-semibold text-text-primary">Chatbot</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={wizard.flags.potholeDetection}
                            onChange={(e) => patchWizard({ flags: { ...wizard.flags, potholeDetection: e.target.checked } })}
                            className="rounded text-accent focus:ring-accent w-4 h-4"
                          />
                          <span className="text-sm font-semibold text-text-primary">AI Pothole</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={wizard.flags.forum}
                            onChange={(e) => patchWizard({ flags: { ...wizard.flags, forum: e.target.checked } })}
                            className="rounded text-accent focus:ring-accent w-4 h-4"
                          />
                          <span className="text-sm font-semibold text-text-primary">Forum</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3 — First admin (optional) */}
                {wizard.step === 3 && (
                  <div className="space-y-5">
                    <p className="text-sm text-text-muted">
                      Optionally create the first LGU administrator account. You can skip this and
                      add staff later from the LGU&apos;s Settings page.
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={wizard.adminName}
                        onChange={(e) => patchWizard({ adminName: e.target.value })}
                        placeholder="e.g. Juan Dela Cruz"
                        className="w-full px-3 py-2 bg-surface-alt border border-theme rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Email</label>
                      <input
                        type="email"
                        value={wizard.adminEmail}
                        onChange={(e) => patchWizard({ adminEmail: e.target.value })}
                        placeholder="admin@lgu.gov.ph"
                        className="w-full px-3 py-2 bg-surface-alt border border-theme rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Temporary Password</label>
                      <input
                        type="text"
                        value={wizard.adminPassword}
                        onChange={(e) => patchWizard({ adminPassword: e.target.value })}
                        placeholder="At least 8 characters"
                        className="w-full px-3 py-2 bg-surface-alt border border-theme rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                      />
                      <p className="text-xs text-text-faint mt-1.5">
                        Share these credentials securely with the administrator. They can change the password after signing in.
                      </p>
                    </div>
                    {wizard.adminEmail.trim() && wizard.adminPassword.length > 0 && wizard.adminPassword.length < 8 && (
                      <p className="text-xs text-accent">Password must be at least 8 characters.</p>
                    )}
                  </div>
                )}

                {/* STEP 4 — Review & Create */}
                {wizard.step === 4 && (
                  <div className="space-y-4">
                    <p className="text-sm text-text-muted">Review the details below, then create the LGU.</p>
                    <div className="rounded-xl border border-theme divide-y divide-theme overflow-hidden">
                      <ReviewRow label="Region" value={wizard.region} />
                      <ReviewRow label="Province" value={wizard.province} />
                      <ReviewRow label="City / Municipality" value={wizard.city} />
                      <ReviewRow label="LGU Name" value={wizardName} />
                      <ReviewRow label="LGU ID" value={wizardId} mono />
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-xs font-semibold text-text-muted uppercase">Branding</span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5 text-sm text-text-primary">
                            <span className="inline-block w-4 h-4 rounded border border-theme" style={{ backgroundColor: wizard.primaryColor }} />
                            <span className="font-mono text-xs">{wizard.primaryColor}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-text-primary">
                            <span className="inline-block w-4 h-4 rounded border border-theme" style={{ backgroundColor: wizard.secondaryColor }} />
                            <span className="font-mono text-xs">{wizard.secondaryColor}</span>
                          </span>
                        </div>
                      </div>
                      <ReviewRow
                        label="Features"
                        value={
                          [
                            wizard.flags.chatbot && 'Chatbot',
                            wizard.flags.potholeDetection && 'AI Pothole',
                            wizard.flags.forum && 'Forum',
                          ].filter(Boolean).join(', ') || 'None'
                        }
                      />
                      <ReviewRow label="Onboarding Fee" value={wizard.onboardingFeePaid ? 'Paid' : 'Unpaid'} />
                      <ReviewRow
                        label="First Admin"
                        value={wizard.adminEmail.trim() ? `${wizard.adminName.trim() || '(no name)'} — ${wizard.adminEmail.trim()}` : 'None (skipped)'}
                      />
                    </div>
                    {duplicateId && (
                      <div className="rounded-lg px-3 py-2.5 text-sm bg-accent-soft text-accent">
                        An LGU with this id already exists. Go back to Step 1 and pick a different location.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer nav */}
              <div className="flex items-center justify-between mt-6 border-t border-theme pt-4">
                <Button variant="secondary" onClick={wizard.step === 1 ? closeWizard : goBack} disabled={creating}>
                  {wizard.step === 1 ? 'Cancel' : (<><ArrowLeft variant="Linear" className="w-4 h-4 mr-1" /> Back</>)}
                </Button>

                <div className="flex items-center gap-2">
                  {wizard.step === 3 && (
                    <Button variant="ghost" onClick={goNext} disabled={creating}>
                      Skip
                    </Button>
                  )}
                  {wizard.step < 4 ? (
                    <Button
                      onClick={goNext}
                      disabled={wizard.step === 1 && !canProceedLocation}
                    >
                      Next <ArrowRight variant="Linear" className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button onClick={handleCreateLgu} disabled={creating || !canProceedLocation}>
                      {creating ? 'Creating…' : (<><TickCircle className="w-4 h-4 mr-1" /> Create LGU</>)}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );

  function handleExportCsv() {
    const rows = filtered.map(l => [l.name, l.users, l.reports, l.requests, l.responseTime, l.status].map(v => typeof v === 'string' ? '"'+v.replace(/"/g,'""')+'"' : String(v)).join(','));
    const csv = ['LGU,Users,Reports,Requests,Avg Response,Status', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lgu-directory.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
