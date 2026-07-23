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
  Personalcard, User, Clock, TickSquare, CloseCircle, Eye,
  SearchNormal1, Danger, Sms, Location, DocumentText, Camera,
  InfoCircle, ShieldTick, Warning2, FilterSearch, Sort,
} from 'iconsax-react';

// ── Types ─────────────────────────────────────────────────────────────────

type TabKey = 'pending' | 'approved' | 'rejected' | 'all';
type SortOption = 'newest' | 'lowest_ai' | 'highest_ai';
type FlagFilter = 'all' | 'high_trust' | 'low_trust' | 'flagged';

interface AiResult {
  id: string;
  request_id?: string;
  face_score: number | null;
  confidence_score: number | null;
  flags: string[];
  processing_ms: number | null;
}

interface VerificationRequest {
  id: string;
  user_id: string;
  lgu_id: string;
  id_type: string;
  id_document_path: string;
  selfie_path: string;
  declared_barangay: string;
  status: string;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  citizen_name?: string;
  citizen_email?: string;
  ai_result?: AiResult | null;
}

// ── Preset rejection reasons ───────────────────────────────────────────────

const REJECT_PRESETS = [
  'ID photo is blurry or unreadable',
  'Face in selfie does not match ID photo',
  'Declared barangay is outside this municipality',
  'ID type not accepted for this service',
  'Suspected duplicate or reused photo',
  'Other (specify below)',
];

// ── Score helpers ─────────────────────────────────────────────────────────

function scoreColor(score: number | null): string {
  if (score === null) return 'text-gray-400';
  if (score >= 0.80)  return 'text-green-600 dark:text-green-400';
  if (score >= 0.60)  return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 0.40)  return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function scoreBarColor(score: number | null): string {
  if (score === null) return 'bg-gray-300 dark:bg-gray-600';
  if (score >= 0.80)  return 'bg-green-500';
  if (score >= 0.60)  return 'bg-yellow-500';
  if (score >= 0.40)  return 'bg-orange-500';
  return 'bg-red-500';
}

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  const pct = score !== null ? Math.round(score * 100) : null;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-muted">{label}</span>
        <span className={`text-xs font-bold tabular-nums ${scoreColor(score)}`}>
          {pct !== null ? `${pct}%` : 'N/A'}
        </span>
      </div>
      <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${scoreBarColor(score)}`}
          style={{ width: `${(score ?? 0) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function VerificationsPage() {
  const [requests, setRequests]           = useState<VerificationRequest[]>([]);
  const [activeTab, setActiveTab]         = useState<TabKey>('pending');
  const [searchQuery, setSearchQuery]     = useState('');
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [flagFilter, setFlagFilter]       = useState<FlagFilter>('all');
  const [sortBy, setSortBy]               = useState<SortOption>('newest');

  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason]   = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customReason, setCustomReason]   = useState('');

  const [idImageUrl, setIdImageUrl]       = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl]         = useState<string | null>(null);
  const [imageLoading, setImageLoading]   = useState(false);
  const [aiResult, setAiResult]           = useState<AiResult | null>(null);
  const [aiLoading, setAiLoading]         = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading]             = useState(true);
  const [loadError, setLoadError]         = useState<string | null>(null);

  const { showToast, ToastContainer } = useToast();
  const params = useSearchParams();

  const lguNameParam = params?.get('lguName') || 'Liliw, Laguna';
  const lguId = useMemo(() => lguIdFromName(lguNameParam), [lguNameParam]);

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchRequests = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('lgu_id', lguId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = data || [];
      const userIds = Array.from(new Set(rows.map(r => r.user_id)));
      const requestIds = rows.map(r => r.id);

      const [usersRes, aiRes] = await Promise.all([
        userIds.length > 0 ? supabase.from('users').select('id, name, email').in('id', userIds) : Promise.resolve({ data: [] }),
        requestIds.length > 0 ? supabase.from('verification_ai_results').select('*').in('request_id', requestIds) : Promise.resolve({ data: [] }),
      ]);

      const usersById = new Map<string, { name: string | null; email: string | null }>();
      for (const u of usersRes.data || []) usersById.set(u.id, { name: u.name, email: u.email });

      const aiByRequestId = new Map<string, AiResult>();
      for (const ai of aiRes.data || []) aiByRequestId.set((ai as any).request_id, ai as AiResult);

      const enriched: VerificationRequest[] = rows.map(req => {
        const u = usersById.get(req.user_id);
        const ai = aiByRequestId.get(req.id);
        return {
          ...req,
          citizen_name: u?.name || 'Unknown Citizen',
          citizen_email: u?.email || '',
          ai_result: ai || null,
        };
      });
      setRequests(enriched);
    } catch (err: any) {
      console.error('Failed to load verification requests:', err);
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lguId]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const loadSignedImages = async (req: VerificationRequest) => {
    setImageLoading(true);
    try {
      const [idRes, selfieRes] = await Promise.all([
        supabase.storage.from('citizen-ids').createSignedUrl(req.id_document_path, 300),
        supabase.storage.from('citizen-ids').createSignedUrl(req.selfie_path, 300),
      ]);
      setIdImageUrl(idRes.data?.signedUrl || null);
      setSelfieUrl(selfieRes.data?.signedUrl || null);
    } catch { /* silent */ }
    finally { setImageLoading(false); }
  };

  const loadAiResult = async (req: VerificationRequest) => {
    if (req.ai_result) {
      setAiResult(req.ai_result);
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    try {
      const { data } = await supabase
        .from('verification_ai_results')
        .select('*')
        .eq('request_id', req.id)
        .maybeSingle();
      setAiResult(data || null);
    } catch { /* silent */ }
    finally { setAiLoading(false); }
  };

  const handleViewDetails = (req: VerificationRequest) => {
    setSelectedRequest(req);
    setIdImageUrl(null);
    setSelfieUrl(null);
    setAiResult(req.ai_result || null);
    loadSignedImages(req);
    loadAiResult(req);
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setIdImageUrl(null);
    setSelfieUrl(null);
    setAiResult(null);
    setShowRejectModal(false);
    setRejectReason('');
    setSelectedPreset(null);
    setCustomReason('');
  };

  const purgeVerificationPhotos = async (req: VerificationRequest) => {
    const paths = [req.id_document_path, req.selfie_path].filter(Boolean);
    if (paths.length === 0) return;
    try { await supabase.storage.from('citizen-ids').remove(paths); } catch { /* silent */ }
  };

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('verify_citizen', {
        p_request_id: selectedRequest.id,
        p_action: 'approve',
        p_reason: '',
      });
      if (error) throw error;
      await purgeVerificationPhotos(selectedRequest);
      showToast(`Citizen "${selectedRequest.citizen_name}" verified successfully!`, 'success');
      handleCloseModal();
      fetchRequests();
    } catch (err: any) {
      showToast(`Failed to approve: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    const finalReason = (selectedPreset === 'Other (specify below)' ? customReason.trim() : selectedPreset) || customReason.trim();
    if (!finalReason) {
      showToast('Please select or enter a rejection reason.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('verify_citizen', {
        p_request_id: selectedRequest.id,
        p_action: 'reject',
        p_reason: finalReason,
      });
      if (error) throw error;
      await purgeVerificationPhotos(selectedRequest);
      showToast(`Verification rejected for "${selectedRequest.citizen_name}".`, 'info');
      handleCloseModal();
      fetchRequests();
    } catch (err: any) {
      showToast(`Failed to reject: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Filtering & Sorting ────────────────────────────────────────────────────

  const filteredRequests = useMemo(() => {
    let list = requests.filter(req => {
      // Tab filter
      const matchesTab = activeTab === 'all' || req.status === activeTab;
      if (!matchesTab) return false;

      // Text search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (req.citizen_name    || '').toLowerCase().includes(q) ||
        (req.citizen_email   || '').toLowerCase().includes(q) ||
        (req.declared_barangay || '').toLowerCase().includes(q) ||
        (req.id_type         || '').toLowerCase().includes(q)
      );
      if (!matchesSearch) return false;

      // Minimum AI Confidence slider filter
      const confidence = req.ai_result?.confidence_score !== null && req.ai_result?.confidence_score !== undefined
        ? req.ai_result.confidence_score * 100
        : null;

      if (minConfidence > 0) {
        if (confidence === null || confidence < minConfidence) return false;
      }

      // Risk Preset Filter
      if (flagFilter === 'high_trust') {
        if (confidence === null || confidence < 80) return false;
      } else if (flagFilter === 'low_trust') {
        if (confidence === null || confidence >= 60) return false;
      } else if (flagFilter === 'flagged') {
        if ((req.ai_result?.flags?.length ?? 0) === 0) return false;
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'lowest_ai') {
        const scoreA = a.ai_result?.confidence_score ?? 1.1; // nulls go last
        const scoreB = b.ai_result?.confidence_score ?? 1.1;
        return scoreA - scoreB;
      }
      if (sortBy === 'highest_ai') {
        const scoreA = a.ai_result?.confidence_score ?? -1;
        const scoreB = b.ai_result?.confidence_score ?? -1;
        return scoreB - scoreA;
      }
      // Newest first default
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [requests, activeTab, searchQuery, minConfidence, flagFilter, sortBy]);

  const tabCounts = useMemo(() => ({
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    all:      requests.length,
  }), [requests]);

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: 'warning' | 'success' | 'error' | 'default'; label: string }> = {
      pending:  { variant: 'warning', label: 'Pending Review' },
      approved: { variant: 'success', label: 'Approved' },
      rejected: { variant: 'error',   label: 'Rejected' },
    };
    const { variant, label } = map[status] || { variant: 'default' as const, label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const confidenceLabel = (score: number | null) => {
    if (score === null) return null;
    if (score >= 0.80) return { text: 'High confidence', color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-500/10' };
    if (score >= 0.60) return { text: 'Medium — review carefully', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' };
    if (score >= 0.40) return { text: 'Low — scrutinize closely',  color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' };
    return { text: 'Very low — likely mismatch', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' };
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout role="lgu-admin" title="Citizen Verifications">
      <ToastContainer />

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as TabKey[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-text-primary text-bg'
                : 'bg-surface border border-theme text-text-muted hover:bg-surface-alt hover:text-text-primary'
            }`}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)} ({tabCounts[tab]})
          </button>
        ))}
      </div>

      {/* ── AI CONFIDENCE METER & FILTER TOOLBAR ── */}
      <Card noBorder padding="sm" className="mb-6 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Text Search */}
          <div className="relative flex-1 min-w-[220px]">
            <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name, email, barangay, or ID type..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
            />
          </div>

          {/* Interactive AI Match Confidence Slider */}
          <div className="flex items-center gap-3 bg-surface border border-theme px-3 py-1.5 rounded-md min-w-[240px]">
            <ShieldTick variant="Bold" className="w-4 h-4 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center text-xs font-medium mb-0.5">
                <span className="text-text-muted text-[11px]">Min AI Match:</span>
                <span className="text-accent font-mono font-bold text-xs">{minConfidence}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minConfidence}
                onChange={e => setMinConfidence(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-accent"
                style={{
                  background: `linear-gradient(to right, var(--accent) ${minConfidence}%, rgba(255, 255, 255, 0.15) ${minConfidence}%)`,
                }}
              />
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <Sort className="w-4 h-4 text-text-muted shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 bg-surface border border-theme rounded-md text-xs font-semibold text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="lowest_ai">Sort: Lowest AI Match First</option>
              <option value="highest_ai">Sort: Highest AI Match First</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Preset Chips */}
        <div className="pt-2 border-t border-theme flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted font-medium mr-1 flex items-center gap-1">
              <FilterSearch className="w-3.5 h-3.5" /> Filter:
            </span>
            
            <button
              onClick={() => { setFlagFilter('all'); setMinConfidence(0); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                flagFilter === 'all' && minConfidence === 0
                  ? 'bg-text-primary text-bg font-semibold'
                  : 'bg-surface border border-theme text-text-muted hover:text-text-primary'
              }`}
            >
              All Submissions
            </button>

            <button
              onClick={() => { setFlagFilter('high_trust'); setMinConfidence(80); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                flagFilter === 'high_trust'
                  ? 'bg-green-600 text-white font-semibold'
                  : 'bg-surface border border-theme text-text-muted hover:text-text-primary'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              High Match (≥80%)
            </button>

            <button
              onClick={() => { setFlagFilter('low_trust'); setMinConfidence(0); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                flagFilter === 'low_trust'
                  ? 'bg-orange-500 text-white font-semibold'
                  : 'bg-surface border border-theme text-text-muted hover:text-text-primary'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
              Low Match (&lt;60%)
            </button>

            <button
              onClick={() => { setFlagFilter('flagged'); setMinConfidence(0); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                flagFilter === 'flagged'
                  ? 'bg-red-600 text-white font-semibold'
                  : 'bg-surface border border-theme text-text-muted hover:text-text-primary'
              }`}
            >
              <Danger className="w-3.5 h-3.5 shrink-0" />
              AI Risk Flagged
            </button>
          </div>

          {minConfidence > 0 || flagFilter !== 'all' || searchQuery ? (
            <button
              onClick={() => { setMinConfidence(0); setFlagFilter('all'); setSearchQuery(''); }}
              className="text-xs text-accent hover:underline font-medium"
            >
              Reset Filters
            </button>
          ) : null}
        </div>
      </Card>

      {/* Request cards */}
      {loading ? (
        <Card noBorder><div className="text-center py-8 text-text-muted text-sm">Loading requests…</div></Card>
      ) : loadError ? (
        <Card noBorder><div className="text-center py-8 text-red-500 text-sm">{loadError}</div></Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(req => {
            const aiScore = req.ai_result?.confidence_score !== null && req.ai_result?.confidence_score !== undefined
              ? Math.round(req.ai_result.confidence_score * 100)
              : null;
            const flags = req.ai_result?.flags || [];

            return (
              <Card noBorder key={req.id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-alt rounded-full flex items-center justify-center">
                      <User variant="Bold" className="w-5 h-5 text-text-muted" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{req.citizen_name || 'Unknown Citizen'}</p>
                      <div className="flex items-center gap-2 text-sm text-text-muted">
                        <Sms className="w-3 h-3" />
                        {req.citizen_email || 'No email'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Live AI Match Score Pill on Card */}
                    {aiScore !== null && (
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 border ${
                        aiScore >= 80 ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                        aiScore >= 60 ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                        'bg-red-500/10 text-red-600 border-red-500/20'
                      }`}>
                        <ShieldTick variant="Bold" className="w-3.5 h-3.5" />
                        AI Match: {aiScore}%
                      </div>
                    )}
                    {statusBadge(req.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-text-muted">
                    <DocumentText className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <p className="text-text-faint text-xs">ID Type</p>
                      <p className="text-text-primary font-medium">{req.id_type || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-text-muted">
                    <Location className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <p className="text-text-faint text-xs">Address</p>
                      <p className="text-text-primary font-medium text-xs leading-tight line-clamp-2">{req.declared_barangay || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-text-muted">
                    <Clock variant="Bold" className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <p className="text-text-faint text-xs">Submitted</p>
                      <p className="text-text-primary font-medium">{formatDate(req.created_at)}</p>
                    </div>
                  </div>
                  {flags.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Danger className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <div>
                        <p className="text-text-faint text-xs">AI Risk Flags</p>
                        <p className="text-red-600 dark:text-red-400 font-medium text-xs truncate max-w-[140px]" title={flags.join(', ')}>
                          {flags.join(', ').replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-3 border-t border-theme">
                  {req.status === 'pending' ? (
                    <>
                      <Button variant="primary" onClick={() => handleViewDetails(req)}>
                        <Eye variant="Bold" className="w-4 h-4 mr-1" />
                        Review &amp; Decide
                      </Button>
                      <Button variant="danger" onClick={() => { setSelectedRequest(req); setShowRejectModal(true); }}>
                        <CloseCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" onClick={() => handleViewDetails(req)}>
                      <Eye variant="Bold" className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}

          {filteredRequests.length === 0 && (
            <Card noBorder>
              <div className="text-center py-8 text-text-muted">
                <Personalcard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-semibold text-text-primary">No matching verification requests found</p>
                <p className="text-xs text-text-muted mt-1">Try adjusting your Minimum AI Confidence slider or filters.</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Review / Detail Modal ── */}
      {selectedRequest && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="p-6">

              {/* Modal header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <ShieldTick variant="Bold" className="w-5 h-5 text-accent" />
                  Review Verification
                </h2>
                <button onClick={handleCloseModal} className="text-text-muted hover:text-text-primary transition-colors text-xl leading-none">✕</button>
              </div>

              {/* RA 10173 banner */}
              <div className="flex items-start gap-3 p-3 mb-5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Warning2 variant="Bold" className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  You are viewing sensitive personal data (government-issued ID and biometric selfie) collected under RA 10173 (Data Privacy Act). Handle with strict confidentiality. Photos are deleted from storage immediately upon your decision.
                </p>
              </div>

              {/* Citizen info */}
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-surface-alt rounded-full flex items-center justify-center">
                    <User variant="Bold" className="w-6 h-6 text-text-muted" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{selectedRequest.citizen_name}</p>
                    <p className="text-sm text-text-muted">{selectedRequest.citizen_email}</p>
                  </div>
                  <div className="ml-auto">{statusBadge(selectedRequest.status)}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-text-faint text-xs mb-0.5">ID Type</p>
                    <p className="font-medium text-text-primary">{selectedRequest.id_type}</p>
                  </div>
                  <div>
                    <p className="text-text-faint text-xs mb-0.5">Submitted</p>
                    <p className="font-medium text-text-primary">{formatDate(selectedRequest.created_at)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-text-faint text-xs mb-0.5">Declared Address</p>
                    <p className="font-medium text-text-primary text-sm leading-relaxed">{selectedRequest.declared_barangay}</p>
                  </div>
                  {selectedRequest.reviewed_at && (
                    <div>
                      <p className="text-text-faint text-xs mb-0.5">Reviewed At</p>
                      <p className="font-medium text-text-primary">{formatDate(selectedRequest.reviewed_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Side-by-side photos ── */}
              <div className="mb-5">
                <p className="text-sm font-semibold text-text-primary mb-3">Documents</p>
                <div className="grid grid-cols-2 gap-4">
                  {/* ID photo */}
                  <div>
                    <p className="text-xs text-text-faint mb-2 flex items-center gap-1">
                      <DocumentText className="w-3 h-3" />
                      Government ID
                    </p>
                    {imageLoading ? (
                      <div className="h-44 bg-surface-alt rounded-lg flex items-center justify-center">
                        <p className="text-xs text-text-muted">Loading…</p>
                      </div>
                    ) : idImageUrl ? (
                      <img
                        src={idImageUrl}
                        alt="Government ID"
                        className="w-full h-44 object-contain rounded-lg border border-theme bg-surface-alt cursor-zoom-in"
                        onClick={() => window.open(idImageUrl, '_blank')}
                        title="Click to open full size"
                      />
                    ) : selectedRequest.status !== 'pending' ? (
                      <div className="h-44 bg-surface-alt rounded-lg flex items-center justify-center">
                        <p className="text-xs text-text-muted text-center px-4">Deleted after verification</p>
                      </div>
                    ) : (
                      <div className="h-44 bg-red-500/10 rounded-lg flex items-center justify-center">
                        <p className="text-xs text-red-500">Failed to load</p>
                      </div>
                    )}
                  </div>

                  {/* Selfie */}
                  <div>
                    <p className="text-xs text-text-faint mb-2 flex items-center gap-1">
                      <Camera variant="Bold" className="w-3 h-3" />
                      Selfie
                    </p>
                    {imageLoading ? (
                      <div className="h-44 bg-surface-alt rounded-lg flex items-center justify-center">
                        <p className="text-xs text-text-muted">Loading…</p>
                      </div>
                    ) : selfieUrl ? (
                      <img
                        src={selfieUrl}
                        alt="Selfie"
                        className="w-full h-44 object-contain rounded-lg border border-theme bg-surface-alt cursor-zoom-in"
                        onClick={() => window.open(selfieUrl, '_blank')}
                        title="Click to open full size"
                      />
                    ) : selectedRequest.status !== 'pending' ? (
                      <div className="h-44 bg-surface-alt rounded-lg flex items-center justify-center">
                        <p className="text-xs text-text-muted text-center px-4">Deleted after verification</p>
                      </div>
                    ) : (
                      <div className="h-44 bg-red-500/10 rounded-lg flex items-center justify-center">
                        <p className="text-xs text-red-500">Failed to load</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── AI Confidence Score widget ── */}
              <div className="mb-5 p-4 rounded-xl border border-theme bg-surface-alt">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldTick variant="Bold" className="w-4 h-4 text-text-muted" />
                  <p className="text-sm font-semibold text-text-primary">Automated Identity Check</p>
                  {aiLoading && <span className="text-xs text-text-muted ml-auto">Analyzing…</span>}
                </div>

                {aiLoading ? (
                  <div className="h-12 flex items-center justify-center">
                    <p className="text-xs text-text-muted">Loading AI results…</p>
                  </div>
                ) : aiResult ? (
                  <div className="space-y-3">
                    <ScoreBar label="Face match"        score={aiResult.face_score} />
                    <ScoreBar label="Overall confidence" score={aiResult.confidence_score} />

                    {(() => {
                      const label = confidenceLabel(aiResult.confidence_score);
                      return label ? (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${label.bg}`}>
                          <span className={`text-xs font-medium ${label.color}`}>{label.text}</span>
                        </div>
                      ) : null;
                    })()}

                    {(aiResult.flags?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs text-text-faint mb-1.5">Flags</p>
                        <div className="flex flex-wrap gap-2">
                          {aiResult.flags.map(f => (
                            <span key={f} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400">
                              <Danger className="w-3 h-3" />
                              {f.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiResult.processing_ms && (
                      <p className="text-xs text-text-faint">Processed in {aiResult.processing_ms.toLocaleString()} ms</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-text-muted">
                    <InfoCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p className="text-xs">No AI analysis available for this submission.</p>
                  </div>
                )}

                <p className="text-xs text-text-faint mt-3 pt-3 border-t border-theme leading-relaxed">
                  ⚠️ AI scores are decision-support tools only. <strong>Your judgment as the LGU administrator governs the final decision.</strong>
                </p>
              </div>

              {/* Rejection reason display */}
              {selectedRequest.rejection_reason && (
                <div className="p-3 bg-red-500/10 rounded-lg mb-4">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Rejection Reason:</p>
                  <p className="text-sm text-red-600 dark:text-red-400">{selectedRequest.rejection_reason}</p>
                </div>
              )}

              {/* Action buttons */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-theme">
                  <Button variant="primary" onClick={handleApprove} isLoading={actionLoading}>
                    <TickSquare className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button variant="danger" onClick={() => setShowRejectModal(true)} disabled={actionLoading}>
                    <CloseCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {selectedRequest && showRejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-text-primary mb-1">Reject Verification</h3>
              <p className="text-sm text-text-muted mb-5">
                Rejecting for <strong>{selectedRequest.citizen_name}</strong>. The reason will be shown to the citizen so they know what to fix.
              </p>

              {/* Preset chips */}
              <p className="text-xs font-semibold text-text-faint uppercase tracking-wide mb-3">Select a reason</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {REJECT_PRESETS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => { setSelectedPreset(preset); if (preset !== 'Other (specify below)') setCustomReason(''); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selectedPreset === preset
                        ? 'bg-text-primary text-bg border-transparent'
                        : 'bg-surface border-theme text-text-muted hover:border-text-muted'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Custom text area (shown when "Other" is selected or always as extra context) */}
              {(selectedPreset === 'Other (specify below)' || !selectedPreset) && (
                <div className="mb-4">
                  <p className="text-xs text-text-faint mb-1.5">
                    {selectedPreset === 'Other (specify below)' ? 'Specify reason:' : 'Or type a custom reason:'}
                  </p>
                  <textarea
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    placeholder="e.g. The ID photo is cut off at the edges..."
                    rows={3}
                    className="w-full px-3 py-2 bg-surface border border-theme rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent resize-none"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="danger"
                  onClick={handleReject}
                  isLoading={actionLoading}
                  disabled={!selectedPreset && !customReason.trim()}
                >
                  <CloseCircle className="w-4 h-4 mr-1" />
                  Confirm Rejection
                </Button>
                <Button variant="secondary" onClick={() => { setShowRejectModal(false); setSelectedPreset(null); setCustomReason(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
