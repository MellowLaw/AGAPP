'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { lguIdFromName } from '@/lib/lgu';
import { Add, Trash, Edit, Location, Clock, Global, Call } from 'iconsax-react';

interface CitizenGuide {
  id: string;
  section: string;
  title: string;
  address: string | null;
  schedule: string | null;
  website: string | null;
  phone: string | null;
}

const PREDEFINED_SECTIONS = [
  'ID Registration and Licenses',
  'Benefits & Contributions',
  'Specialized Assistance',
  'Other Local Government Offices'
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Parse database string: "Weekdays, 8:00 AM - 5:00 PM"
const parseScheduleString = (str: string | null) => {
  if (!str) {
    return {
      type: 'none',
      days: [] as string[],
      sH: '8', sM: '00', sP: 'AM' as 'AM' | 'PM',
      eH: '5', eM: '00', eP: 'PM' as 'AM' | 'PM'
    };
  }
  
  const parts = str.split(',');
  if (parts.length < 2) {
    return {
      type: 'custom',
      days: [parts[0].trim()],
      sH: '8', sM: '00', sP: 'AM' as 'AM' | 'PM',
      eH: '5', eM: '00', eP: 'PM' as 'AM' | 'PM'
    };
  }
  
  const daysPart = parts[0].trim();
  const timePart = parts.slice(1).join(',').trim();
  
  let type = 'custom';
  let days: string[] = [];
  if (daysPart === 'Weekdays') {
    type = 'weekdays';
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  } else if (daysPart === 'Everyday') {
    type = 'everyday';
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  } else {
    days = daysPart.split(',').map(d => d.trim()).filter(Boolean);
  }
  
  const timeSubParts = timePart.split('-');
  let sH = '8', sM = '00';
  let sP: 'AM' | 'PM' = 'AM';
  let eH = '5', eM = '00';
  let eP: 'AM' | 'PM' = 'PM';
  
  if (timeSubParts.length === 2) {
    const startStr = timeSubParts[0].trim();
    const endStr = timeSubParts[1].trim();
    
    const startMatch = startStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (startMatch) {
      sH = startMatch[1];
      sM = startMatch[2];
      sP = startMatch[3].toUpperCase() as 'AM' | 'PM';
    }
    
    const endMatch = endStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (endMatch) {
      eH = endMatch[1];
      eM = endMatch[2];
      eP = endMatch[3].toUpperCase() as 'AM' | 'PM';
    }
  }
  
  return { type, days, sH, sM, sP, eH, eM, eP };
};

// Build database string: "Weekdays, 8:00 AM - 5:00 PM"
const computeScheduleString = (
  type: string,
  days: string[],
  sH: string,
  sM: string,
  sP: string,
  eH: string,
  eM: string,
  eP: string
) => {
  if (type === 'none') return null;
  let daysStr = '';
  if (type === 'weekdays') {
    daysStr = 'Weekdays';
  } else if (type === 'everyday') {
    daysStr = 'Everyday';
  } else {
    if (days.length === 0) daysStr = 'No Days Selected';
    else if (days.length === 7) daysStr = 'Everyday';
    else if (days.length === 5 && !days.includes('Sat') && !days.includes('Sun') && days.includes('Mon') && days.includes('Tue') && days.includes('Wed') && days.includes('Thu') && days.includes('Fri')) daysStr = 'Weekdays';
    else daysStr = days.join(', ');
  }
  return `${daysStr}, ${sH}:${sM} ${sP} - ${eH}:${eM} ${eP}`;
};

export default function CitizenGuidePage() {
  const params = useSearchParams();
  const lguNameParam = params?.get('lguName') || 'Liliw, Laguna';
  const lguId = lguIdFromName(lguNameParam);
  const { showToast, ToastContainer } = useToast();

  const [guides, setGuides] = useState<CitizenGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CitizenGuide | null>(null);

  // Form state - selectedId null means "creating a new guide card"
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [section, setSection] = useState('');
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');

  // Scheduling system helper states
  const [scheduleType, setScheduleType] = useState('weekdays');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [startHour, setStartHour] = useState('8');
  const [startMinute, setStartMinute] = useState('00');
  const [startPeriod, setStartPeriod] = useState<'AM' | 'PM'>('AM');
  const [endHour, setEndHour] = useState('5');
  const [endMinute, setEndMinute] = useState('00');
  const [endPeriod, setEndPeriod] = useState<'AM' | 'PM'>('PM');
  const [showTimeModal, setShowTimeModal] = useState(false);

  const fetchGuides = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('citizen_guides')
        .select('*')
        .eq('lgu_id', lguId)
        .order('created_at', { ascending: true });

      if (error) {
        showToast(error.message || 'Failed to load directories', 'error');
      } else {
        setGuides(data || []);
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lguId]);

  const resetForm = () => {
    setSelectedId(null);
    setSection('');
    setTitle('');
    setAddress('');
    setWebsite('');
    setPhone('');
    setScheduleType('weekdays');
    setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    setStartHour('8');
    setStartMinute('00');
    setStartPeriod('AM');
    setEndHour('5');
    setEndMinute('00');
    setEndPeriod('PM');
  };

  const handleSelect = (g: CitizenGuide) => {
    setSelectedId(g.id);
    setSection(g.section);
    setTitle(g.title);
    setAddress(g.address || '');
    setWebsite(g.website || '');
    setPhone(g.phone || '');
    
    const parsed = parseScheduleString(g.schedule);
    setScheduleType(parsed.type);
    setSelectedDays(parsed.days);
    setStartHour(parsed.sH);
    setStartMinute(parsed.sM);
    setStartPeriod(parsed.sP);
    setEndHour(parsed.eH);
    setEndMinute(parsed.eM);
    setEndPeriod(parsed.eP);
  };

  const handleSave = async () => {
    if (!section.trim()) return showToast('Please specify a section/category.', 'info');
    if (!title.trim()) return showToast('Please enter the guide/agency title.', 'info');

    setSaving(true);
    try {
      const computedSchedule = scheduleType === 'none' ? null : computeScheduleString(
        scheduleType,
        selectedDays,
        startHour,
        startMinute,
        startPeriod,
        endHour,
        endMinute,
        endPeriod
      );

      const row = {
        lgu_id: lguId,
        section: section.trim(),
        title: title.trim(),
        address: address.trim() || null,
        schedule: computedSchedule,
        website: website.trim() || null,
        phone: phone.trim() || null,
      };

      if (selectedId) {
        const { error } = await supabase.from('citizen_guides').update(row).eq('id', selectedId);
        if (error) throw error;
        showToast('Citizen directory card updated.', 'success');
      } else {
        const { error } = await supabase.from('citizen_guides').insert(row);
        if (error) throw error;
        showToast('Directory card added successfully.', 'success');
      }
      resetForm();
      fetchGuides();
    } catch (err: any) {
      showToast(err.message || 'Failed to save directory card', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    try {
      const { error } = await supabase.from('citizen_guides').delete().eq('id', target.id);
      if (error) throw error;
      
      if (selectedId === target.id) resetForm();
      showToast('Directory card deleted.', 'success');
      fetchGuides();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete directory card', 'error');
    }
  };

  // Group by section
  const sectionsMap = guides.reduce((acc, guide) => {
    if (!acc[guide.section]) {
      acc[guide.section] = [];
    }
    acc[guide.section].push(guide);
    return acc;
  }, {} as Record<string, CitizenGuide[]>);

  const sortedSections = Object.keys(sectionsMap).sort((a, b) => {
    const idxA = PREDEFINED_SECTIONS.indexOf(a);
    const idxB = PREDEFINED_SECTIONS.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <DashboardLayout role="lgu-admin" title="Citizen Guide Directory">
      <ToastContainer />
      {loading && (
        <div className="mb-4 px-4 py-2 text-sm text-text-muted bg-surface-alt rounded-md animate-pulse">
          Loading directories…
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form column */}
        <Card noBorder className="lg:col-span-1 shadow-sm">
          <CardHeader 
            title={selectedId ? 'Edit Directory Card' : 'Add Directory Card'} 
            subtitle="Administer directories shown to citizens on the mobile guide page" 
          />
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Section / Category</label>
              <Input 
                placeholder="e.g., ID Registration and Licenses" 
                value={section} 
                onChange={(e: any) => setSection(e.target.value)} 
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PREDEFINED_SECTIONS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSection(sec)}
                    className="px-2 py-1 text-xs rounded border border-theme hover:border-accent hover:text-accent font-medium text-text-muted transition-colors"
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            <Input 
              label="Agency / Title Name" 
              placeholder="e.g., NBI - National Bureau of Investigation" 
              value={title} 
              onChange={(e: any) => setTitle(e.target.value)} 
            />

            <Input 
              label="Office Location / Address" 
              placeholder="e.g., Maria Cristina St, Naga City" 
              value={address} 
              onChange={(e: any) => setAddress(e.target.value)} 
            />

            {/* Operating Days Selector */}
            <div className="space-y-1.5">
              <label className="block text-sm text-text-muted">Office Schedule Days</label>
              <select
                value={scheduleType}
                onChange={(e) => {
                  const val = e.target.value;
                  setScheduleType(val);
                  if (val === 'weekdays') {
                    setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
                  } else if (val === 'everyday') {
                    setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
                  }
                }}
                className="w-full px-3 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent transition-colors"
              >
                <option value="weekdays">Weekdays (Mon - Fri)</option>
                <option value="everyday">Everyday (Mon - Sun)</option>
                <option value="custom">Custom Days...</option>
                <option value="none">No Operating Hours / N/A</option>
              </select>
            </div>

            {/* Custom Day Multi-select Pills */}
            {scheduleType === 'custom' && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="block text-xs text-text-muted">Select Active Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const active = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          setSelectedDays((prev) =>
                            prev.includes(day)
                              ? prev.filter((d) => d !== day)
                              : [...prev, day]
                          );
                        }}
                        className={`px-2.5 py-1 text-xs font-semibold rounded border transition-all ${
                          active
                            ? 'bg-accent text-white border-accent'
                            : 'bg-surface border-theme text-text-muted hover:border-accent/40'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Operating Time Picker Launcher */}
            {scheduleType !== 'none' && (
              <div className="space-y-1.5">
                <label className="block text-sm text-text-muted">Operating Hours</label>
                <div className="flex items-center justify-between p-3 bg-surface-alt border border-theme rounded-md text-sm">
                  <span className="font-semibold text-text-primary">
                    {startHour}:{startMinute} {startPeriod} - {endHour}:{endMinute} {endPeriod}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTimeModal(true)}
                    className="text-xs text-accent hover:underline font-semibold"
                  >
                    Change Hours
                  </button>
                </div>
              </div>
            )}

            <Input 
              label="Official Website URL" 
              placeholder="e.g., https://clearance.nbi.gov.ph/" 
              value={website} 
              onChange={(e: any) => setWebsite(e.target.value)} 
            />

            <Input 
              label="Contact Phone Number" 
              placeholder="e.g., (054) 473 3346" 
              value={phone} 
              onChange={(e: any) => setPhone(e.target.value)} 
            />

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {selectedId ? 'Update Card' : 'Add Card'}
              </Button>
              {selectedId && (
                <Button variant="secondary" onClick={resetForm} disabled={saving}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Directory List column */}
        <div className="lg:col-span-2 space-y-6">
          <Card noBorder className="shadow-sm">
            <CardHeader 
              title="Active Directory Catalog" 
              subtitle={`Showing all directory guides for this LGU (${guides.length})`} 
            />

            {sortedSections.length === 0 ? (
              <p className="px-3 py-6 text-sm text-text-muted text-center bg-surface-alt rounded-md">
                No directories added yet. Fill out the form to add the first one.
              </p>
            ) : (
              <div className="space-y-6">
                {sortedSections.map((sec) => (
                  <div key={sec} className="border-b border-theme pb-4 last:border-b-0 last:pb-0">
                    <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-3">
                      {sec}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sectionsMap[sec].map((g) => (
                        <div 
                          key={g.id} 
                          className="p-4 bg-surface-alt border border-theme rounded-xl flex flex-col justify-between hover:border-accent/40 transition-all"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-semibold text-sm text-text-primary leading-snug">
                                {g.title}
                              </h4>
                              <div className="flex gap-1 shrink-0">
                                <button 
                                  onClick={() => handleSelect(g)}
                                  className="p-1 hover:text-accent text-text-muted transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  onClick={() => setDeleteTarget(g)}
                                  className="p-1 hover:text-danger text-text-muted transition-colors"
                                  title="Delete"
                                >
                                  <Trash size={16} />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs text-text-muted font-medium">
                              {g.address && (
                                <div className="flex items-center gap-2">
                                  <Location size={14} className="text-accent-icon shrink-0" />
                                  <span className="truncate">{g.address}</span>
                                </div>
                              )}
                              {g.schedule && (
                                <div className="flex items-center gap-2">
                                  <Clock size={14} className="shrink-0" />
                                  <span className="truncate">{g.schedule}</span>
                                </div>
                              )}
                              {g.website && (
                                <div className="flex items-center gap-2">
                                  <Global size={14} className="text-accent-icon shrink-0" />
                                  <a href={g.website} target="_blank" rel="noreferrer" className="text-accent hover:underline truncate">
                                    {g.website}
                                  </a>
                                </div>
                              )}
                              {g.phone && (
                                <div className="flex items-center gap-2">
                                  <Call size={14} className="text-accent-icon shrink-0" />
                                  <span>{g.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Directory Card?"
        message={`Are you sure you want to remove "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Time Picker Modal */}
      <Modal
        isOpen={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        title="Set Operating Hours"
        size="sm"
        footer={
          <Button onClick={() => setShowTimeModal(false)}>
            Save & Close
          </Button>
        }
      >
        <div className="space-y-6 py-2">
          {/* Start Time Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-text-primary border-b border-theme pb-1">Start Time</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-text-muted uppercase">Hour</label>
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="w-full px-2 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-text-muted uppercase">Minute</label>
                <select
                  value={startMinute}
                  onChange={(e) => setStartMinute(e.target.value)}
                  className="w-full px-2 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
                >
                  {['00', '15', '30', '45'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-text-muted uppercase">AM/PM</label>
                <select
                  value={startPeriod}
                  onChange={(e) => setStartPeriod(e.target.value as any)}
                  className="w-full px-2 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* End Time Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-text-primary border-b border-theme pb-1">End Time</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-text-muted uppercase">Hour</label>
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="w-full px-2 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-text-muted uppercase">Minute</label>
                <select
                  value={endMinute}
                  onChange={(e) => setEndMinute(e.target.value)}
                  className="w-full px-2 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
                >
                  {['00', '15', '30', '45'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-text-muted uppercase">AM/PM</label>
                <select
                  value={endPeriod}
                  onChange={(e) => setEndPeriod(e.target.value as any)}
                  className="w-full px-2 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
