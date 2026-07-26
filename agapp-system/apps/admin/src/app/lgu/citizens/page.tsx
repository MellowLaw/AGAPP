'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { lguIdFromName } from '@/lib/lgu';
import {
  User, SearchNormal1, Clock, TickSquare, CloseCircle, Eye,
  Danger, Sms, Location, InfoCircle, ShieldTick, Warning2,
  Forbidden2, ShieldCross, MessageQuestion, Refresh, People,
} from 'iconsax-react';

// ── Types ─────────────────────────────────────────────────────────────────

type TabKey = 'all' | 'verified' | 'unverified' | 'restricted' | 'banned' | 'appeals';

interface CitizenUser {
  id: string;
  email: string;
  name: string;
  role: string;
  lgu_id: string;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  verified_barangay: string | null;
  barangay: string | null;
  created_at: string;
  moderation_status: 'active' | 'restricted' | 'banned';
  moderation_reason: string | null;
  moderated_at: string | null;
}

interface CitizenAppeal {
  id: string;
  user_id: string;
  lgu_id: string;
  message: string;
  status: 'pending' | 'approved' | 'denied';
  admin_response: string | null;
  reviewed_at: string | null;
  created_at: string;
  citizen_name?: string;
  citizen_email?: string;
  citizen_moderation_status?: string;
  citizen_moderation_reason?: string;
}

// ── Predefined moderation reasons ──────────────────────────────────────────

const RESTRICT_PRESETS = [
  'Posting inappropriate or offensive content in public forum',
  'Multiple user reports for disruptive community behavior',
  'Spamming service requests or community board',
  'Falsified resident verification details',
  'Misuse of municipal eServices',
  'Other (specify below)',
];

const BAN_PRESETS = [
  'Severe violation of municipal community standards',
  'Harassment or abusive language towards LGU staff or citizens',
  'Fraudulent activity or identity theft attempt',
  'Repeated violations after previous restriction',
  'Unauthorized or malicious platform activity',
  'Other (specify below)',
];

export default function CitizensPage() {
  const searchParams = useSearchParams();
  const { showToast, ToastContainer } = useToast();

  // Load LGU Name & ID (Derive cleanly from URL params matching Verifications page)
  const lguNameParam = searchParams.get('lguName') || searchParams.get('lgu') || 'Liliw, Laguna';
  const lguId = useMemo(() => lguIdFromName(lguNameParam), [lguNameParam]);

  const [citizens, setCitizens] = useState<CitizenUser[]>([]);
  const [appeals, setAppeals] = useState<CitizenAppeal[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenUser | null>(null);
  const [modalAction, setModalAction] = useState<'ban' | 'restrict' | 'reactivate' | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');

  const [selectedAppeal, setSelectedAppeal] = useState<CitizenAppeal | null>(null);
  const [appealAction, setAppealAction] = useState<'approve' | 'deny' | null>(null);
  const [appealResponseInput, setAppealResponseInput] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Tab param in URL
  useEffect(() => {
    const t = searchParams.get('tab') as TabKey | null;
    if (t && ['all', 'verified', 'unverified', 'restricted', 'banned', 'appeals'].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  // Fetch Data
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      // 1. Citizens in this LGU
      const { data: usersData, error: usersErr } = await supabase
        .from('users')
        .select('*')
        .eq('lgu_id', lguId)
        .eq('role', 'CITIZEN')
        .order('created_at', { ascending: false });

      if (usersErr) throw usersErr;
      const citizenList = (usersData || []) as CitizenUser[];
      setCitizens(citizenList);

      const userMap = new Map<string, CitizenUser>();
      citizenList.forEach(u => userMap.set(u.id, u));

      // 2. Appeals in this LGU
      const { data: appealsData, error: appealsErr } = await supabase
        .from('citizen_appeals')
        .select('*')
        .eq('lgu_id', lguId)
        .order('created_at', { ascending: false });

      if (appealsErr) throw appealsErr;

      const formattedAppeals: CitizenAppeal[] = (appealsData || []).map((ap: any) => {
        const u = userMap.get(ap.user_id);
        return {
          ...ap,
          citizen_name: u?.name || 'Citizen User',
          citizen_email: u?.email || '',
          citizen_moderation_status: u?.moderation_status || 'active',
          citizen_moderation_reason: u?.moderation_reason || '',
        };
      });

      setAppeals(formattedAppeals);
    } catch (err: any) {
      console.error('[CitizensPage] Fetch error:', err);
      showToast(err.message || 'Failed to load citizen records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [lguId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Moderation action submit
  const handleModerateSubmit = async () => {
    if (!selectedCitizen || !modalAction) return;

    let finalReason = '';
    if (modalAction !== 'reactivate') {
      finalReason = (selectedPreset === 'Other (specify below)' ? customReason.trim() : selectedPreset) || customReason.trim();
      if (!finalReason) {
        showToast('Please select or enter a reason for this moderation action.', 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('moderate_citizen', {
        p_user_id: selectedCitizen.id,
        p_action: modalAction,
        p_reason: modalAction === 'reactivate' ? null : finalReason,
      });

      if (error) throw error;

      const displayStatus = modalAction === 'ban' ? 'BANNED' : modalAction === 'restrict' ? 'RESTRICTED' : 'ACTIVE';
      showToast(`Citizen ${selectedCitizen.name} is now ${displayStatus}.`, 'success');
      setSelectedCitizen(null);
      setModalAction(null);
      setSelectedPreset(null);
      setCustomReason('');
      fetchData();
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Appeal review submit via resolve_citizen_appeal RPC
  const handleAppealReviewSubmit = async () => {
    if (!selectedAppeal || !appealAction) return;

    if (appealAction === 'deny' && !appealResponseInput.trim()) {
      showToast('Please provide an admin response note when denying an appeal.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const isApprove = appealAction === 'approve';
      const { error } = await supabase.rpc('resolve_citizen_appeal', {
        p_appeal_id: selectedAppeal.id,
        p_action: appealAction,
        p_response: appealResponseInput.trim() || null,
      });

      if (error) throw error;

      showToast(`Appeal ${isApprove ? 'APPROVED (user reactivated)' : 'DENIED'}.`, 'success');
      setSelectedAppeal(null);
      setAppealAction(null);
      setAppealResponseInput('');
      fetchData();
    } catch (err: any) {
      showToast(`Failed to process appeal: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Counts
  const pendingAppealsCount = useMemo(() => appeals.filter(a => a.status === 'pending').length, [appeals]);
  const restrictedCount = useMemo(() => citizens.filter(c => c.moderation_status === 'restricted' || c.moderation_status === 'banned').length, [citizens]);
  const verifiedCount = useMemo(() => citizens.filter(c => c.verification_status === 'verified').length, [citizens]);

  // Filtered list
  const filteredCitizens = useMemo(() => {
    return citizens.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.verified_barangay || c.barangay || '').toLowerCase().includes(q)
      );

      if (!matchesSearch) return false;
      if (activeTab === 'verified') return c.verification_status === 'verified';
      if (activeTab === 'unverified') return c.verification_status !== 'verified';
      if (activeTab === 'restricted') return c.moderation_status === 'restricted';
      if (activeTab === 'banned') return c.moderation_status === 'banned';
      return true;
    });
  }, [citizens, searchQuery, activeTab]);

  return (
    <DashboardLayout role="lgu-admin" title="Citizens & Moderation" lguName={lguNameParam}>
      <ToastContainer />
      <div className="space-y-6">
        
        {/* Header bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Citizens &amp; Moderation</h1>
            <p className="text-sm text-text-muted mt-1">
              Manage registered municipal citizens, issue account restrictions, and review moderation appeals.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchData} className="self-start md:self-auto">
            <Refresh className="w-4 h-4 mr-2" />
            Refresh Roster
          </Button>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <User className="w-7 h-7 shrink-0 text-blue-500" variant="Bold" />
            <div>
              <p className="text-2xl font-bold text-text-primary">{citizens.length}</p>
              <p className="text-xs text-text-muted">Total Registered Citizens</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <ShieldTick className="w-7 h-7 shrink-0 text-green-500" variant="Bold" />
            <div>
              <p className="text-2xl font-bold text-text-primary">{verifiedCount}</p>
              <p className="text-xs text-text-muted">Verified Residents</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <Forbidden2 className="w-7 h-7 shrink-0 text-red-500" variant="Bold" />
            <div>
              <p className="text-2xl font-bold text-text-primary">{restrictedCount}</p>
              <p className="text-xs text-text-muted">Restricted / Banned</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <MessageQuestion className="w-7 h-7 shrink-0 text-purple-500" variant="Bold" />
            <div>
              <p className="text-2xl font-bold text-text-primary">{pendingAppealsCount}</p>
              <p className="text-xs text-text-muted">Pending Appeals</p>
            </div>
          </Card>
        </div>

        {/* Filter / Search + Tabs Header */}
        <Card className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'all'
                    ? 'bg-accent text-white shadow-md'
                    : 'text-text-muted hover:bg-surface-alt hover:text-text-primary'
                }`}
              >
                <User className="w-4 h-4" />
                All Citizens ({citizens.length})
              </button>

              <button
                onClick={() => setActiveTab('verified')}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'verified'
                    ? 'bg-accent text-white shadow-md'
                    : 'text-text-muted hover:bg-surface-alt hover:text-text-primary'
                }`}
              >
                <ShieldTick className="w-4 h-4" />
                Verified ({verifiedCount})
              </button>

              <button
                onClick={() => setActiveTab('restricted')}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'restricted'
                    ? 'bg-accent text-white shadow-md'
                    : 'text-text-muted hover:bg-surface-alt hover:text-text-primary'
                }`}
              >
                <Forbidden2 className="w-4 h-4" />
                Restricted &amp; Banned ({restrictedCount})
              </button>

              <button
                onClick={() => setActiveTab('appeals')}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'appeals'
                    ? 'bg-accent text-white shadow-md'
                    : 'text-text-muted hover:bg-surface-alt hover:text-text-primary'
                }`}
              >
                <MessageQuestion className="w-4 h-4" />
                Appeals Queue
                {pendingAppealsCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                    {pendingAppealsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <SearchNormal1 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search citizen, email, barangay..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* TAB 1, 2, 3: CITIZEN ROSTER */}
          {activeTab !== 'appeals' && (
            <div className="space-y-4 pt-2">
              {loading ? (
                <div className="p-8 text-center text-text-muted font-medium">Loading citizen roster...</div>
              ) : filteredCitizens.length === 0 ? (
                <div className="p-12 text-center text-text-muted">
                  <User className="w-12 h-12 mx-auto mb-3 text-text-faint" />
                  <p className="font-semibold text-text-primary text-base">No citizens found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs font-semibold uppercase text-text-muted">
                        <th className="py-3 px-4">Citizen Name &amp; Email</th>
                        <th className="py-3 px-4">Verified Barangay</th>
                        <th className="py-3 px-4">ID Verification</th>
                        <th className="py-3 px-4">Moderation Status</th>
                        <th className="py-3 px-4">Registered Date</th>
                        <th className="py-3 px-4 text-right">Moderate Account</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredCitizens.map((c) => (
                        <tr key={c.id} className="hover:bg-surface-alt/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-text-primary">
                            <div>{c.name}</div>
                            <div className="text-xs text-text-muted font-normal">{c.email}</div>
                          </td>
                          <td className="py-3 px-4 text-text-muted text-xs">
                            {c.verified_barangay || c.barangay || '—'}
                          </td>
                          <td className="py-3 px-4">
                            {c.verification_status === 'verified' && <Badge variant="success">VERIFIED</Badge>}
                            {c.verification_status === 'pending' && <Badge variant="warning">PENDING</Badge>}
                            {c.verification_status === 'rejected' && <Badge variant="error">REJECTED</Badge>}
                            {c.verification_status === 'unverified' && <Badge variant="info">UNVERIFIED</Badge>}
                          </td>
                          <td className="py-3 px-4">
                            {c.moderation_status === 'active' && <Badge variant="success">ACTIVE</Badge>}
                            {c.moderation_status === 'restricted' && <Badge variant="warning">RESTRICTED</Badge>}
                            {c.moderation_status === 'banned' && <Badge variant="error">BANNED</Badge>}
                          </td>
                          <td className="py-3 px-4 text-xs text-text-muted">
                            {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {c.moderation_status === 'active' ? (
                                <>
                                  <Button size="sm" variant="secondary" onClick={() => { setSelectedCitizen(c); setModalAction('restrict'); setSelectedPreset(null); setCustomReason(''); }}>
                                    Restrict
                                  </Button>
                                  <Button size="sm" variant="danger" onClick={() => { setSelectedCitizen(c); setModalAction('ban'); setSelectedPreset(null); setCustomReason(''); }}>
                                    Ban
                                  </Button>
                                </>
                              ) : (
                                <Button size="sm" variant="secondary" onClick={() => { setSelectedCitizen(c); setModalAction('reactivate'); setSelectedPreset(null); setCustomReason(''); }}>
                                  Reactivate
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: APPEALS QUEUE */}
          {activeTab === 'appeals' && (
            <div className="space-y-4 pt-2">
              {loading ? (
                <div className="p-8 text-center text-text-muted font-medium">Loading appeals queue...</div>
              ) : appeals.length === 0 ? (
                <div className="p-12 text-center text-text-muted">
                  <MessageQuestion className="w-12 h-12 mx-auto mb-3 text-text-faint" />
                  <p className="font-semibold text-text-primary text-base">No citizen appeals submitted</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {appeals.map(ap => (
                    <div key={ap.id} className="py-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-text-primary text-base">{ap.citizen_name}</p>
                          <p className="text-xs text-text-muted">{ap.citizen_email} • Status: <span className="font-semibold uppercase">{ap.citizen_moderation_status}</span></p>
                        </div>
                        <div>
                          {ap.status === 'pending' && <Badge variant="warning">PENDING APPEAL</Badge>}
                          {ap.status === 'approved' && <Badge variant="success">APPROVED</Badge>}
                          {ap.status === 'denied' && <Badge variant="error">DENIED</Badge>}
                        </div>
                      </div>

                      <div className="p-3 bg-surface-alt rounded-xl border border-border text-sm text-text-primary">
                        <p className="text-xs font-semibold text-text-muted uppercase mb-1">CITIZEN APPEAL MESSAGE:</p>
                        &quot;{ap.message}&quot;
                      </div>

                      {ap.admin_response && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-text-primary">
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">ADMIN DECISION NOTE:</p>
                          {ap.admin_response}
                        </div>
                      )}

                      {ap.status === 'pending' && (
                        <div className="flex items-center gap-3 pt-1">
                          <Button size="sm" onClick={() => { setSelectedAppeal(ap); setAppealAction('approve'); setAppealResponseInput(''); }}>
                            Approve &amp; Lift Restriction
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => { setSelectedAppeal(ap); setAppealAction('deny'); setAppealResponseInput(''); }}>
                            Deny Appeal
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </Card>

      </div>

      {/* MODERATION ACTION MODAL */}
      {selectedCitizen && modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md p-6 space-y-4 bg-surface border border-border rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-text-primary">
              {modalAction === 'ban' && 'Ban Citizen Account'}
              {modalAction === 'restrict' && 'Restrict Citizen Account'}
              {modalAction === 'reactivate' && 'Reactivate Citizen Account'}
            </h3>
            <p className="text-sm text-text-muted">
              Target Citizen: <span className="font-semibold text-text-primary">{selectedCitizen.name}</span> ({selectedCitizen.email})
            </p>

            {(modalAction === 'ban' || modalAction === 'restrict') && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-600 dark:text-red-400 leading-relaxed font-medium">
                ⚠️ <span className="font-bold">Are you sure you want to perform this action?</span> Banned accounts are completely blocked from logging in or using the AGAPP mobile client. Restricted accounts have restricted community features.
              </div>
            )}

            {modalAction === 'reactivate' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-xs text-green-600 dark:text-green-400 leading-relaxed font-medium">
                ℹ️ <span className="font-bold">Are you sure you want to reactivate this account?</span> This will restore their status to active and grant full access to their mobile citizen account.
              </div>
            )}

            {(modalAction === 'ban' || modalAction === 'restrict') && (
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase text-text-muted">Select Reason for Action:</label>

                {/* Predefined Reasons Dropdown */}
                <select
                  value={selectedPreset || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedPreset(val || null);
                    if (val !== 'Other (specify below)') {
                      setCustomReason('');
                    }
                  }}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent font-medium cursor-pointer"
                >
                  <option value="" disabled>-- Select a predefined reason --</option>
                  {(modalAction === 'ban' ? BAN_PRESETS : RESTRICT_PRESETS).map(preset => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>

                {/* Specific custom reason input */}
                {(selectedPreset === 'Other (specify below)' || !selectedPreset) && (
                  <div>
                    <p className="text-xs text-text-muted mb-1 font-medium">
                      {selectedPreset === 'Other (specify below)' ? 'Specify specific reason:' : 'Or enter custom reason:'}
                    </p>
                    <textarea
                      placeholder="e.g. Repeated violation of community post guidelines..."
                      value={customReason}
                      onChange={e => setCustomReason(e.target.value)}
                      className="w-full p-3 text-sm rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => { setSelectedCitizen(null); setModalAction(null); setSelectedPreset(null); setCustomReason(''); }}>
                Cancel
              </Button>
              <Button variant={modalAction === 'ban' ? 'danger' : 'primary'} size="sm" onClick={handleModerateSubmit} disabled={submitting}>
                {modalAction === 'reactivate' ? 'Confirm Reactivation' : 'Confirm Action'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* APPEAL REVIEW MODAL */}
      {selectedAppeal && appealAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md p-6 space-y-4 bg-surface border border-border rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-text-primary">
              {appealAction === 'approve' ? 'Approve Appeal & Lift Restriction' : 'Deny Citizen Appeal'}
            </h3>
            <p className="text-sm text-text-muted">
              Citizen: <span className="font-semibold text-text-primary">{selectedAppeal.citizen_name}</span> ({selectedAppeal.citizen_email})
            </p>

            <div className="p-3 bg-surface-alt rounded-xl border border-border text-sm text-text-primary">
              <p className="text-xs font-semibold text-text-muted uppercase mb-1">CITIZEN APPEAL MESSAGE:</p>
              &quot;{selectedAppeal.message}&quot;
            </div>

            {appealAction === 'approve' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-xs text-green-600 dark:text-green-400 leading-relaxed font-medium">
                ℹ️ <span className="font-bold">Approving this appeal</span> will immediately reactivate the citizen&apos;s account and lift all moderation restrictions.
              </div>
            )}

            {appealAction === 'deny' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-600 dark:text-red-400 leading-relaxed font-medium">
                ⚠️ <span className="font-bold">Denying this appeal</span> will keep the account restricted or banned. Please provide a brief decision note.
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-text-muted">
                Admin Response Note {appealAction === 'deny' ? '(Required)' : '(Optional)'}:
              </label>
              <textarea
                placeholder={appealAction === 'deny' ? 'Enter reason for denial...' : 'Optional note to citizen...'}
                value={appealResponseInput}
                onChange={e => setAppealResponseInput(e.target.value)}
                className="w-full p-3 text-sm rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => { setSelectedAppeal(null); setAppealAction(null); setAppealResponseInput(''); }}>
                Cancel
              </Button>
              <Button
                variant={appealAction === 'deny' ? 'danger' : 'primary'}
                size="sm"
                onClick={handleAppealReviewSubmit}
                disabled={submitting || (appealAction === 'deny' && !appealResponseInput.trim())}
              >
                {appealAction === 'approve' ? 'Confirm & Lift Restriction' : 'Confirm Denial'}
              </Button>
            </div>
          </Card>
        </div>
      )}

    </DashboardLayout>
  );
}
