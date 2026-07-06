'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Search } from '@/components/ui/Search';
import { ArrowsClockwise, Check, Warning, X } from '@phosphor-icons/react';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';

interface Report {
  id: string;
  dbId: string;
  category: string;
  dbCategory: string;
  location: string;
  status: 'pending' | 'acknowledged' | 'in_progress' | 'resolved' | 'rejected';
  time: string;
  photoUrl: string | null;
  /** null = model never ran for this category; true/false = it ran and did/didn't confirm the subject. */
  aiVerified: boolean | null;
  aiConfidence: number | null;
}

// Wording for the ML validity badge, per Docs/Planning/Plan-StrayPets-Reporting.md
// (dog/cat detector is an anti-troll validity check, not identity/breed matching).
const ML_SUBJECT_LABEL: Record<string, string> = {
  pothole: 'pothole',
  stray_animal: 'animal',
};

type DbReportStatus = 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved' | 'Rejected';

const mapDbStatusToUi = (status: string): Report['status'] => {
  switch (status as DbReportStatus) {
    case 'Submitted':
      return 'pending';
    case 'Under Review':
      return 'acknowledged';
    case 'In Progress':
      return 'in_progress';
    case 'Resolved':
      return 'resolved';
    case 'Rejected':
      return 'rejected';
    default:
      return 'pending';
  }
};

const mapDbCategoryToLabel = (category: string): string => {
  switch (category) {
    case 'pothole':
      return 'Pothole / Road Damage';
    case 'clogged_drainage':
      return 'Drainage / Canal';
    case 'stray_animal':
      return 'Stray Pets';
    case 'damaged_pole':
      return 'Damaged Pole';
    default:
      return category || 'Other';
  }
};

type StatusTab = 'all' | 'open' | 'in_progress' | 'done';

const TAB_STATUSES: Record<StatusTab, Report['status'][] | null> = {
  all: null,
  open: ['pending', 'acknowledged'],
  in_progress: ['in_progress'],
  done: ['resolved', 'rejected'],
};

export default function PersonnelReportsPage() {
  const [items, setItems] = useState<Report[]>([]);
  const [active, setActive] = useState<Report | null>(null);
  // Status tabs, not "Assigned to me / My office" — reports have no per-personnel
  // assignment in the schema (users aren't linked to offices), so those tabs could
  // never filter anything. Status is the real triage axis for a work queue.
  const [tab, setTab] = useState<StatusTab>('all');
  const [q, setQ] = useState('');
  const { showToast, ToastContainer } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setLoadError(null);

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        console.error('Error fetching auth user', authError);
        setLoadError('Not authenticated');
        setLoading(false);
        return;
      }

      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('id, lgu_id')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userRow) {
        console.error('Error loading personnel profile', userError);
        setLoadError(userError?.message || 'Failed to load profile');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('reports')
        .select('id, reference_number, category, status, barangay, created_at, photo_url, ml_verified, ml_confidence')
        .eq('lgu_id', userRow.lgu_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading reports', error);
        setLoadError(error.message);
        setLoading(false);
        return;
      }

      const mapped: Report[] = (data || []).map((row: any) => ({
        id: row.reference_number || row.id,
        dbId: row.id,
        category: mapDbCategoryToLabel(row.category || ''),
        dbCategory: row.category || '',
        location: row.barangay,
        status: mapDbStatusToUi(row.status || 'Submitted'),
        time: row.created_at ? new Date(row.created_at).toLocaleString() : '',
        photoUrl: row.photo_url || null,
        aiVerified: row.ml_verified ?? null,
        aiConfidence: row.ml_confidence ?? null,
      }));

      setItems(mapped);
      setActive(mapped[0] || null);
      setLoading(false);
    };

    fetchReports();
  }, []);

  const filtered = useMemo(() => {
    const statuses = TAB_STATUSES[tab];
    return items.filter(i =>
      (!statuses || statuses.includes(i.status)) &&
      (i.id + i.category + i.location).toLowerCase().includes(q.toLowerCase())
    );
  }, [items, q, tab]);

  const update = async (status: Report['status']) => {
    if (!active) return;
    
    const prevItems = items;
    const prevActive = active;

    setItems(prev => prev.map(r => r.id === active.id ? { ...r, status } : r));
    setActive({ ...active, status });

    const dbStatusMap: Record<Report['status'], string> = {
      pending: 'Submitted',
      acknowledged: 'Under Review',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      rejected: 'Rejected'
    };

    const { error } = await supabase
      .from('reports')
      .update({ status: dbStatusMap[status] })
      .eq('id', active.dbId);

    if (error) {
      console.error('Failed to update report status in database', error);
      setItems(prevItems);
      setActive(prevActive);
      showToast('Failed to update report status. Please try again.', 'error');
      return;
    }

    showToast(`${active.id} set to ${status}`, 'success');
  };

  return (
    <DashboardLayout role="lgu-personnel" title="Issue Reports">
      <ToastContainer />
      {loading && (
        <div className="mb-3 px-4 py-2 text-sm text-text-muted bg-surface-alt rounded-md">
          Loading reports…
        </div>
      )}
      {loadError && !loading && (
        <div className="mb-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-red-500/10 rounded-md">
          Failed to load reports: {loadError}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Reports" action={<Search value={q} onChange={setQ} className="w-64" />} />
            <div className="flex items-center gap-2 px-2 mb-3">
              <button onClick={() => setTab('all')} className={`px-3 py-1.5 rounded-full text-sm ${tab==='all'?'bg-text-primary text-bg':'bg-surface border border-theme text-text-primary'}`}>All</button>
              <button onClick={() => setTab('open')} className={`px-3 py-1.5 rounded-full text-sm ${tab==='open'?'bg-text-primary text-bg':'bg-surface border border-theme text-text-primary'}`}>Open</button>
              <button onClick={() => setTab('in_progress')} className={`px-3 py-1.5 rounded-full text-sm ${tab==='in_progress'?'bg-text-primary text-bg':'bg-surface border border-theme text-text-primary'}`}>In Progress</button>
              <button onClick={() => setTab('done')} className={`px-3 py-1.5 rounded-full text-sm ${tab==='done'?'bg-text-primary text-bg':'bg-surface border border-theme text-text-primary'}`}>Done</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
              {filtered.map(r => (
                <button key={r.id} onClick={() => setActive(r)} className={`text-left p-3 rounded-md border ${active?.id===r.id?'border-accent':'border-theme'} hover:bg-surface-alt`}>
                  <p className="text-sm font-medium text-text-primary">{r.id}</p>
                  <p className="text-xs text-text-muted">{r.category} • {r.location}</p>
                  <div className="mt-2">
                    <Badge variant={r.status==='resolved'?'success':r.status==='in_progress'?'default':r.status==='acknowledged'?'info':'warning'}>
                      {r.status.replace('_',' ')}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader title={active ? active.id : 'Select a report'} />
            {active && (
              <div className="space-y-3">
                {active.photoUrl ? (
                  <div className="aspect-video bg-surface-alt rounded-lg overflow-hidden">
                    <img src={active.photoUrl} alt="Report evidence" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video bg-surface-alt rounded-lg flex items-center justify-center text-sm text-text-muted">
                    No photo proof attached
                  </div>
                )}
                <div className="text-sm text-text-primary">
                  <p><span className="text-text-muted">Category:</span> {active.category}</p>
                  <p><span className="text-text-muted">Location:</span> {active.location}</p>
                  <p><span className="text-text-muted">Status:</span> {active.status.replace('_',' ')}</p>
                </div>
                {/* AI Detection Badge — null means no model ran (older data, or a
                    category with no deployed model); true/false means the model
                    ran and did/didn't confirm the subject. */}
                {active.aiVerified !== null && (
                  active.aiVerified ? (
                    <div className="flex items-center gap-2 p-3 bg-green-600 text-white rounded-md font-semibold">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">
                        AI Verified — {ML_SUBJECT_LABEL[active.dbCategory] || 'subject'} detected in photo ({Math.round((active.aiConfidence || 0) * 100)}%)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-amber-500 text-white rounded-md font-semibold">
                      <Warning className="w-4 h-4" />
                      <span className="text-sm">
                        No {ML_SUBJECT_LABEL[active.dbCategory] || 'match'} detected — review photo
                      </span>
                    </div>
                  )
                )}
                <div className="flex gap-2 pt-3 border-t border-theme">
                  {(active.status==='pending' || active.status==='acknowledged') && (
                    <>
                      <Button variant="primary" onClick={() => update('acknowledged')}>
                        <Check className="w-4 h-4 mr-1" /> Acknowledge
                      </Button>
                      <Button variant="secondary" onClick={() => update('in_progress')}>
                        <ArrowsClockwise className="w-4 h-4 mr-1" /> Start
                      </Button>
                      <Button variant="danger" onClick={() => update('rejected')}>
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  {active.status==='in_progress' && (
                    <Button variant="primary" onClick={() => update('resolved')}>
                      <Check className="w-4 h-4 mr-1" /> Mark Resolved
                    </Button>
                  )}
                  {active.status==='resolved' && (
                    <Button variant="secondary" disabled>Resolved</Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
