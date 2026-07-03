'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { Plus, Trash } from '@phosphor-icons/react';

export default function SuperSettingsPage() {
  const { showToast, ToastContainer } = useToast();

  // State for all config values
  const [maintenance, setMaintenance] = useState(false);
  const [banner, setBanner] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [slaDays, setSlaDays] = useState(5);

  // Add-item input states
  const [newCategory, setNewCategory] = useState('');
  const [newServiceType, setNewServiceType] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // ── Load all config from Supabase ─────────────────────────────────────────
  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('key, value');

      if (error) throw error;

      if (data) {
        const map: Record<string, any> = {};
        data.forEach((row) => { map[row.key] = row.value; });

        setMaintenance(map['maintenance_mode'] === true || map['maintenance_mode'] === 'true');
        setBanner(typeof map['site_banner'] === 'string' ? map['site_banner'] : '');
        setCategories(Array.isArray(map['report_categories']) ? map['report_categories'] : []);
        setServiceTypes(Array.isArray(map['service_types']) ? map['service_types'] : []);
        setSlaDays(typeof map['sla_days'] === 'number' ? map['sla_days'] : 5);
      }
    } catch (err: any) {
      console.error('Failed to load system config:', err);
      showToast('Failed to load system settings.', 'error');
    } finally {
      setLoading(false);
    }
    // showToast (from useToast()) is a new function reference on every render,
    // so it's deliberately excluded here — including it would make loadConfig
    // itself unstable and cause the effect below to refetch in an infinite loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  // ── Helper: upsert a single config key ────────────────────────────────────
  const upsertConfig = async (key: string, value: any) => {
    const { error } = await supabase
      .from('system_config')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw error;
  };

  // ── Save: Global Config ───────────────────────────────────────────────────
  const handleSaveGlobal = async () => {
    setSaving('global');
    try {
      await Promise.all([
        upsertConfig('maintenance_mode', maintenance),
        upsertConfig('site_banner', banner),
      ]);
      showToast('Global settings saved!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to save settings.', 'error');
    } finally {
      setSaving(null);
    }
  };

  // ── Save: Report Categories ───────────────────────────────────────────────
  const handleSaveCategories = async (updated: string[]) => {
    setSaving('categories');
    try {
      await upsertConfig('report_categories', updated);
      setCategories(updated);
      showToast('Report categories saved!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to save categories.', 'error');
    } finally {
      setSaving(null);
    }
  };

  const addCategory = async () => {
    const v = newCategory.trim();
    if (!v || categories.includes(v)) { setNewCategory(''); return; }
    const updated = [...categories, v];
    setNewCategory('');
    await handleSaveCategories(updated);
  };

  const removeCategory = async (i: number) => {
    const updated = categories.filter((_, idx) => idx !== i);
    await handleSaveCategories(updated);
  };

  // ── Save: Service Types ───────────────────────────────────────────────────
  const handleSaveServiceTypes = async (updated: string[]) => {
    setSaving('serviceTypes');
    try {
      await upsertConfig('service_types', updated);
      setServiceTypes(updated);
      showToast('Service types saved!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to save service types.', 'error');
    } finally {
      setSaving(null);
    }
  };

  const addServiceType = async () => {
    const v = newServiceType.trim();
    if (!v || serviceTypes.includes(v)) { setNewServiceType(''); return; }
    const updated = [...serviceTypes, v];
    setNewServiceType('');
    await handleSaveServiceTypes(updated);
  };

  const removeServiceType = async (i: number) => {
    const updated = serviceTypes.filter((_, idx) => idx !== i);
    await handleSaveServiceTypes(updated);
  };

  // ── Save: SLA ─────────────────────────────────────────────────────────────
  const handleSaveSla = async () => {
    setSaving('sla');
    try {
      await upsertConfig('sla_days', slaDays);
      showToast('SLA target saved!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to save SLA.', 'error');
    } finally {
      setSaving(null);
    }
  };

  return (
    <DashboardLayout role="super-admin" title="System Settings">
      <ToastContainer />

      {loading && (
        <div className="mb-4 px-4 py-2 text-sm text-text-muted bg-surface-alt rounded-md animate-pulse">
          Loading system configuration…
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Global Configuration ── */}
        <Card>
          <CardHeader title="Global Configuration" />
          <div className="space-y-4">
            <label className="flex items-center justify-between py-2 border-b border-theme cursor-pointer">
              <div>
                <span className="text-sm font-medium text-text-primary">Maintenance Mode</span>
                <p className="text-xs text-text-muted mt-0.5">Displays a maintenance notice to all users</p>
              </div>
              <input
                type="checkbox"
                checked={maintenance}
                onChange={(e) => setMaintenance(e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
            </label>

            <div>
              <label className="block text-sm text-text-muted mb-1.5">Site-wide Banner (optional)</label>
              <TextArea
                value={banner}
                onChange={(e: any) => setBanner(e.target.value)}
                placeholder="e.g. System will be under maintenance on Sunday 12–2 AM"
                rows={3}
              />
            </div>

            <div className="pt-2 border-t border-theme">
              <Button onClick={handleSaveGlobal} disabled={saving === 'global'}>
                {saving === 'global' ? 'Saving…' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </Card>

        {/* ── SLA / Response Target ── */}
        <Card>
          <CardHeader title="SLA / Response Target" />
          <div className="space-y-4">
            <p className="text-xs text-text-muted">
              The maximum number of days staff have to resolve a submitted issue report before it's considered overdue.
            </p>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Target resolution (days)</label>
              <Input
                type="number"
                value={slaDays}
                onChange={(e: any) => setSlaDays(parseInt(e.target.value || '1', 10))}
                min={1}
                max={60}
              />
            </div>
            <div className="pt-2 border-t border-theme">
              <Button onClick={handleSaveSla} disabled={saving === 'sla'}>
                {saving === 'sla' ? 'Saving…' : 'Save SLA'}
              </Button>
            </div>
          </div>
        </Card>

        {/* ── Report Categories ── */}
        <Card>
          <CardHeader title="Report Categories" subtitle="Labels visible to LGU admins when filtering reports" />
          <div className="space-y-2 mb-4">
            {categories.map((c, i) => (
              <div key={`${c}-${i}`} className="flex items-center justify-between px-3 py-2 border border-theme rounded-md">
                <span className="text-sm text-text-primary">{c}</span>
                <button
                  onClick={() => removeCategory(i)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 transition-colors p-1 rounded"
                  title="Remove category"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-text-muted px-1">No categories defined.</p>
            )}
          </div>
          <div className="flex gap-2 pt-3 border-t border-theme">
            <input
              type="text"
              placeholder="New category name…"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              className="flex-1 px-3 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
            />
            <Button onClick={addCategory} disabled={saving === 'categories'}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* ── Service Types ── */}
        <Card>
          <CardHeader title="Service Types" subtitle="Document/service types available for citizen e-service requests" />
          <div className="space-y-2 mb-4">
            {serviceTypes.map((c, i) => (
              <div key={`${c}-${i}`} className="flex items-center justify-between px-3 py-2 border border-theme rounded-md">
                <span className="text-sm text-text-primary">{c}</span>
                <button
                  onClick={() => removeServiceType(i)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 transition-colors p-1 rounded"
                  title="Remove service type"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}
            {serviceTypes.length === 0 && (
              <p className="text-sm text-text-muted px-1">No service types defined.</p>
            )}
          </div>
          <div className="flex gap-2 pt-3 border-t border-theme">
            <input
              type="text"
              placeholder="New service type…"
              value={newServiceType}
              onChange={(e) => setNewServiceType(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addServiceType()}
              className="flex-1 px-3 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
            />
            <Button onClick={addServiceType} disabled={saving === 'serviceTypes'}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

      </div>
    </DashboardLayout>
  );
}
