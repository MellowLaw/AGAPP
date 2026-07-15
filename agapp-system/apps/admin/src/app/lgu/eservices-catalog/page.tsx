'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { lguIdFromName } from '@/lib/lgu';
import { Add, Trash, CloseCircle } from 'iconsax-react';

interface CatalogService {
  id: string;
  office_name: string;
  name: string;
  description: string | null;
  requirements: string[];
  fee_note: string;
  processing_time: string | null;
  is_active: boolean;
  sort_order: number;
}

export default function EservicesCatalogPage() {
  const params = useSearchParams();
  const lguNameParam = params?.get('lguName') || 'Liliw, Laguna';
  const lguId = lguIdFromName(lguNameParam);
  const { showToast, ToastContainer } = useToast();

  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CatalogService | null>(null);

  // Form state — selectedId null means "creating a new service".
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [officeName, setOfficeName] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState('');
  const [feeNote, setFeeNote] = useState('Pay at the Municipal Hall');
  const [processingTime, setProcessingTime] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const requirementInputRef = useRef<HTMLInputElement>(null);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lgu_services')
      .select('id, office_name, name, description, requirements, fee_note, processing_time, is_active, sort_order')
      .eq('lgu_id', lguId)
      .order('sort_order', { ascending: true });

    if (error) {
      showToast(error.message || 'Failed to load catalog', 'error');
    } else {
      setServices((data || []).map((r: any) => ({ ...r, requirements: Array.isArray(r.requirements) ? r.requirements : [] })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
    // showToast is deliberately excluded — useToast() returns a new function
    // reference on every render, so including it here would refetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lguId]);

  const resetForm = () => {
    setSelectedId(null);
    setOfficeName('');
    setName('');
    setDescription('');
    setRequirements([]);
    setNewRequirement('');
    setFeeNote('Pay at the Municipal Hall');
    setProcessingTime('');
    setIsActive(true);
    setSortOrder(services.length);
  };

  const handleSelect = (id: string) => {
    const s = services.find(x => x.id === id);
    if (!s) return;
    setSelectedId(s.id);
    setOfficeName(s.office_name);
    setName(s.name);
    setDescription(s.description || '');
    setRequirements(s.requirements);
    setNewRequirement('');
    setFeeNote(s.fee_note);
    setProcessingTime(s.processing_time || '');
    setIsActive(s.is_active);
    setSortOrder(s.sort_order);
  };

  const addRequirement = () => {
    const val = newRequirement.trim();
    if (!val) return;
    setRequirements(prev => [...prev, val]);
    setNewRequirement('');
    requirementInputRef.current?.focus();
  };

  const removeRequirement = (idx: number) => {
    setRequirements(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!officeName.trim()) return showToast('Please enter the office name.', 'info');
    if (!name.trim()) return showToast('Please enter the document/service name.', 'info');

    setSaving(true);
    try {
      const row = {
        lgu_id: lguId,
        office_name: officeName.trim(),
        name: name.trim(),
        description: description.trim() || null,
        requirements,
        fee_note: feeNote.trim() || 'Pay at the Municipal Hall',
        processing_time: processingTime.trim() || null,
        is_active: isActive,
        sort_order: sortOrder,
      };

      if (selectedId) {
        const { error } = await supabase.from('lgu_services').update(row).eq('id', selectedId);
        if (error) throw error;
        showToast('Service updated.', 'success');
      } else {
        const { error } = await supabase.from('lgu_services').insert(row);
        if (error) throw error;
        showToast('Service added to the citizen catalog.', 'success');
      }
      resetForm();
      fetchServices();
    } catch (err: any) {
      showToast(err.message || 'Failed to save service', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    const { error } = await supabase.from('lgu_services').delete().eq('id', target.id);
    if (error) {
      showToast(error.message || 'Failed to delete service', 'error');
      return;
    }
    if (selectedId === target.id) resetForm();
    showToast('Service removed from the citizen catalog.', 'success');
    fetchServices();
  };

  const toggleActive = async (s: CatalogService) => {
    const { error } = await supabase.from('lgu_services').update({ is_active: !s.is_active }).eq('id', s.id);
    if (error) {
      showToast(error.message || 'Failed to update service', 'error');
      return;
    }
    fetchServices();
  };

  return (
    <DashboardLayout role="lgu-admin" title="eServices Catalog">
      <ToastContainer />
      {loading && (
        <div className="mb-3 px-4 py-2 text-sm text-text-muted bg-surface-alt rounded-md animate-pulse">
          Loading catalog…
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card noBorder className="lg:col-span-1 shadow-sm">
          <CardHeader title={selectedId ? 'Edit Service' : 'Add Service'} subtitle="Shown to citizens in the mobile app" />
          <div className="space-y-4">
            <Input label="Office" placeholder="BPLO" value={officeName} onChange={(e: any) => setOfficeName(e.target.value)} />
            <Input label="Document / Service Name" placeholder="New Business Permit" value={name} onChange={(e: any) => setName(e.target.value)} />

            <div>
              <label className="block text-sm text-text-muted mb-1.5">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description shown on the citizen detail card…"
                className="w-full px-3 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-sm text-text-muted mb-1.5">Requirements Checklist</label>
              <div className="flex gap-2 mb-2">
                <input
                  ref={requirementInputRef}
                  type="text"
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRequirement(); } }}
                  placeholder="e.g. Valid ID"
                  className="flex-1 px-3 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
                />
                <Button variant="secondary" size="sm" onClick={addRequirement}>
                  <Add className="w-4 h-4" />
                </Button>
              </div>
              <ul className="space-y-1">
                {requirements.map((req, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-sm bg-surface-alt rounded-md px-3 py-1.5">
                    <span className="text-text-primary">{req}</span>
                    <button onClick={() => removeRequirement(i)} className="text-text-faint hover:text-red-600 dark:text-red-400">
                      <CloseCircle className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
                {requirements.length === 0 && (
                  <li className="text-xs text-text-faint italic">No requirements added yet.</li>
                )}
              </ul>
            </div>

            <Input label="Fee Note" placeholder="Pay at the Municipal Hall" value={feeNote} onChange={(e: any) => setFeeNote(e.target.value)} />
            <Input label="Processing Time" placeholder="3-5 working days" value={processingTime} onChange={(e: any) => setProcessingTime(e.target.value)} />
            <Input label="Sort Order" type="number" value={String(sortOrder)} onChange={(e: any) => setSortOrder(parseInt(e.target.value, 10) || 0)} />

            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active (visible to citizens)
            </label>

            <div className="pt-4 border-t border-theme flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? 'Saving…' : selectedId ? 'Save Changes' : 'Add Service'}
              </Button>
              {selectedId && (
                <>
                  <Button variant="secondary" disabled={saving} onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    disabled={saving}
                    onClick={() => {
                      const s = services.find(x => x.id === selectedId);
                      if (s) setDeleteTarget(s);
                    }}
                  >
                    <Trash variant="Bold" className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* List */}
        <Card noBorder className="lg:col-span-2 shadow-sm" padding="sm">
          <p className="text-xs font-bold text-text-faint uppercase tracking-wider px-2 pt-1 pb-2">
            Catalog ({services.length})
          </p>
          <div className="divide-y divide-theme">
            {services.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-between gap-3 px-3 py-3 cursor-pointer ${selectedId === s.id ? 'bg-surface-alt' : 'hover:bg-surface-alt'}`}
                onClick={() => handleSelect(s.id)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{s.name}</p>
                  <p className="text-xs text-text-muted">{s.office_name} · {s.fee_note}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={s.is_active ? 'success' : 'default'}>{s.is_active ? 'Active' : 'Hidden'}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e: any) => { e.stopPropagation(); toggleActive(s); }}
                  >
                    {s.is_active ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </div>
            ))}
            {services.length === 0 && !loading && (
              <p className="px-3 py-6 text-sm text-text-muted">No services yet — add the first one from the form.</p>
            )}
          </div>
        </Card>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete service"
        message={`Remove "${deleteTarget?.name}" from the catalog? Citizens will no longer be able to request it.`}
        confirmText="Delete"
        variant="danger"
      />
    </DashboardLayout>
  );
}
