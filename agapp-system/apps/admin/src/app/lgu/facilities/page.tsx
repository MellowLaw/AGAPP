'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { FacilityPickerMap } from '@/components/map';
import { MapPin, Trash, Plus } from '@phosphor-icons/react';

interface Facility {
  id: string;
  name: string;
  category: string;
  address: string;
  description: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  image_url: string | null;
}

const CATEGORIES = [
  { value: 'municipal', label: 'Municipal' },
  { value: 'police', label: 'Police' },
  { value: 'fire', label: 'Fire Department' },
  { value: 'hospital', label: 'Hospital / Health' },
  { value: 'other', label: 'Other' },
];

// True Liliw poblacion (PhilAtlas) — only used until the LGU row loads.
const LILIW_FALLBACK: [number, number] = [14.131, 121.4365];

export default function FacilitiesPage() {
  const params = useSearchParams();
  const lguNameParam = params?.get('lguName') || 'Liliw, Laguna';
  const lguId = useMemo(() => lguIdFromName(lguNameParam), [lguNameParam]);
  const { showToast, ToastContainer } = useToast();

  const [center, setCenter] = useState<[number, number]>(LILIW_FALLBACK);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state — selectedId null means "creating a new facility".
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftPosition, setDraftPosition] = useState<[number, number] | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('municipal');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Facility | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: lgu }, { data: rows, error }] = await Promise.all([
        supabase.from('lgus').select('latitude, longitude').eq('id', lguId).single(),
        supabase
          .from('lgu_facilities')
          .select('id, name, category, address, description, latitude, longitude, phone, image_url')
          .eq('lgu_id', lguId)
          .order('name'),
      ]);

      if (lgu?.latitude && lgu?.longitude) setCenter([lgu.latitude, lgu.longitude]);
      if (error) {
        showToast(error.message || 'Failed to load facilities', 'error');
      } else {
        setFacilities(rows || []);
      }
      setLoading(false);
    };
    load();
    // showToast is deliberately excluded — useToast() returns a new function
    // reference on every render, so including it here would refetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lguId]);

  const resetForm = () => {
    setSelectedId(null);
    setDraftPosition(null);
    setName('');
    setCategory('municipal');
    setAddress('');
    setDescription('');
    setPhone('');
    setExistingImageUrl(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectFacility = (id: string) => {
    const f = facilities.find((x) => x.id === id);
    if (!f) return;
    setSelectedId(f.id);
    setDraftPosition([f.latitude, f.longitude]);
    setName(f.name);
    setCategory(f.category);
    setAddress(f.address);
    setDescription(f.description || '');
    setPhone(f.phone || '');
    setExistingImageUrl(f.image_url);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${lguId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('facility-images')
      .upload(path, file, { contentType: file.type });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    const { data } = supabase.storage.from('facility-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    // Frontend validation only — RLS is the real boundary (own-LGU admins only).
    if (!name.trim()) return showToast('Please enter a facility name.', 'info');
    if (!address.trim()) return showToast('Please enter the address.', 'info');
    if (!draftPosition) return showToast('Click the map to place the pin first.', 'info');
    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      return showToast('Image must be under 5MB.', 'info');
    }

    setSaving(true);
    try {
      let imageUrl = existingImageUrl;
      if (imageFile) imageUrl = await uploadImage(imageFile);

      const row = {
        lgu_id: lguId,
        name: name.trim(),
        category,
        address: address.trim(),
        description: description.trim() || null,
        latitude: draftPosition[0],
        longitude: draftPosition[1],
        phone: phone.trim() || null,
        image_url: imageUrl,
      };

      if (selectedId) {
        const { error } = await supabase.from('lgu_facilities').update(row).eq('id', selectedId);
        if (error) throw error;
        setFacilities((prev) => prev.map((f) => (f.id === selectedId ? { ...f, ...row } : f)));
        showToast('Facility updated. The citizen app map reflects this immediately.', 'success');
      } else {
        const { data, error } = await supabase
          .from('lgu_facilities')
          .insert(row)
          .select('id, name, category, address, description, latitude, longitude, phone, image_url')
          .single();
        if (error) throw error;
        setFacilities((prev) => [...prev, data]);
        showToast('Facility added. The citizen app map reflects this immediately.', 'success');
      }
      resetForm();
    } catch (err: any) {
      showToast(err.message || 'Failed to save facility', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    const { error } = await supabase.from('lgu_facilities').delete().eq('id', target.id);
    if (error) {
      showToast(error.message || 'Failed to delete facility', 'error');
      return;
    }
    // Best-effort image cleanup — a stale file in the bucket is harmless.
    if (target.image_url?.includes('/facility-images/')) {
      const path = target.image_url.split('/facility-images/')[1];
      if (path) await supabase.storage.from('facility-images').remove([path]);
    }
    setFacilities((prev) => prev.filter((f) => f.id !== target.id));
    if (selectedId === target.id) resetForm();
    showToast('Facility deleted.', 'success');
  };

  return (
    <DashboardLayout role="lgu-admin" title="Facilities Map">
      <ToastContainer />
      {loading && (
        <div className="mb-3 px-4 py-2 text-sm text-text-muted bg-surface-alt rounded-md animate-pulse">
          Loading facilities…
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <Card noBorder className="lg:col-span-2 shadow-sm" padding="sm">
          <div className="px-2 pt-1 pb-3 flex items-center justify-between">
            <p className="text-sm text-text-muted">
              <MapPin className="inline w-4 h-4 mr-1 -mt-0.5" />
              Click the map to place a pin, or click an existing pin to edit it. Drag the dark pin to fine-tune.
            </p>
            {(selectedId || draftPosition) && (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-1" />
                New pin
              </Button>
            )}
          </div>
          <FacilityPickerMap
            className="h-[32rem]"
            center={center}
            facilities={facilities.map((f) => ({
              id: f.id,
              name: f.name,
              category: f.category,
              lat: f.latitude,
              lng: f.longitude,
            }))}
            selectedId={selectedId}
            draftPosition={draftPosition}
            onPick={(lat, lng) => setDraftPosition([lat, lng])}
            onSelectFacility={handleSelectFacility}
          />
        </Card>

        {/* Form + list */}
        <div className="space-y-6">
          <Card noBorder className="shadow-sm">
            <CardHeader
              title={selectedId ? 'Edit Facility' : 'Add Facility'}
              subtitle={
                draftPosition
                  ? `Pin: ${draftPosition[0].toFixed(6)}, ${draftPosition[1].toFixed(6)}`
                  : 'No pin placed yet — click the map'
              }
            />
            <div className="space-y-4">
              <Input label="Name" placeholder="Liliw Municipal Hall" value={name} onChange={(e: any) => setName(e.target.value)} />

              <div>
                <label className="block text-sm text-text-muted mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <Input label="Address" placeholder="Brgy. Poblacion, Liliw, Laguna" value={address} onChange={(e: any) => setAddress(e.target.value)} />

              <div>
                <label className="block text-sm text-text-muted mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Office hours, services offered, notes for citizens…"
                  className="w-full px-3 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <Input label="Phone" placeholder="+63 49 563 1234" value={phone} onChange={(e: any) => setPhone(e.target.value)} />

              <div>
                <label className="block text-sm text-text-muted mb-1.5">Photo</label>
                {existingImageUrl && !imageFile && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={existingImageUrl} alt="Facility" className="mb-2 rounded-md max-h-32 w-full object-cover border border-theme" />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-text-muted file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border file:border-theme file:bg-surface file:text-sm file:text-text-primary hover:file:bg-surface-alt"
                />
                <p className="text-[11px] text-text-faint mt-1">JPEG/PNG/WebP, max 5MB. Shown to citizens in the mobile map.</p>
              </div>

              <div className="pt-4 border-t border-theme flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? 'Saving…' : selectedId ? 'Save Changes' : 'Add Facility'}
                </Button>
                {selectedId && (
                  <Button
                    variant="danger"
                    disabled={saving}
                    onClick={() => {
                      const f = facilities.find((x) => x.id === selectedId);
                      if (f) setDeleteTarget(f);
                    }}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card noBorder className="shadow-sm" padding="sm">
            <p className="text-xs font-bold text-text-faint uppercase tracking-wider px-2 pt-1 pb-2">
              Existing facilities ({facilities.length})
            </p>
            <div className="max-h-64 overflow-y-auto">
              {facilities.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleSelectFacility(f.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between gap-2 transition-colors ${
                    selectedId === f.id ? 'bg-text-primary text-bg' : 'hover:bg-surface-alt text-text-primary'
                  }`}
                >
                  <span className="truncate">{f.name}</span>
                  <Badge variant={selectedId === f.id ? 'default' : 'info'}>{f.category}</Badge>
                </button>
              ))}
              {facilities.length === 0 && !loading && (
                <p className="px-3 py-4 text-sm text-text-muted">No facilities yet — click the map to add the first one.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete facility"
        message={`Remove "${deleteTarget?.name}" from the map? Citizens will no longer see it in the mobile app.`}
        confirmText="Delete"
        variant="danger"
      />
    </DashboardLayout>
  );
}
