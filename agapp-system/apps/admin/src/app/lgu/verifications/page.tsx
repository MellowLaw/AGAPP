'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { lguIdFromName } from '@/lib/lgu';
import {
  IdentificationBadge,
  User,
  Clock,
  Check,
  X,
  Eye,
  MagnifyingGlass,
  Warning,
  Envelope,
  MapPin,
  FileText,
  Camera,
} from '@phosphor-icons/react';

type TabKey = 'pending' | 'approved' | 'rejected' | 'all';

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
  // joined from users table
  citizen_name?: string;
  citizen_email?: string;
}

export default function VerificationsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [idImageUrl, setIdImageUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();
  const params = useSearchParams();

  const lguNameParam = params?.get('lguName') || 'Liliw, Laguna';
  const lguId = useMemo(() => lguIdFromName(lguNameParam), [lguNameParam]);

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

      // Fetch all citizen names in a single query (avoids an N+1 round-trip
      // per request), then map them back onto the requests.
      const rows = data || [];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const usersById = new Map<string, { name: string | null; email: string | null }>();
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds);
        for (const u of users || []) {
          usersById.set(u.id, { name: u.name, email: u.email });
        }
      }

      const enriched: VerificationRequest[] = rows.map((req) => {
        const u = usersById.get(req.user_id);
        return {
          ...req,
          citizen_name: u?.name || 'Unknown Citizen',
          citizen_email: u?.email || '',
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

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const loadSignedImages = async (req: VerificationRequest) => {
    setImageLoading(true);
    try {
      const [idRes, selfieRes] = await Promise.all([
        supabase.storage.from('citizen-ids').createSignedUrl(req.id_document_path, 300),
        supabase.storage.from('citizen-ids').createSignedUrl(req.selfie_path, 300),
      ]);
      setIdImageUrl(idRes.data?.signedUrl || null);
      setSelfieUrl(selfieRes.data?.signedUrl || null);
    } catch (err) {
      console.error('Failed to load images:', err);
    } finally {
      setImageLoading(false);
    }
  };

  const handleViewDetails = (req: VerificationRequest) => {
    setSelectedRequest(req);
    setIdImageUrl(null);
    setSelfieUrl(null);
    loadSignedImages(req);
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setIdImageUrl(null);
    setSelfieUrl(null);
    setShowRejectModal(false);
    setRejectReason('');
  };

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
    if (!rejectReason.trim()) {
      showToast('Please provide a rejection reason.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('verify_citizen', {
        p_request_id: selectedRequest.id,
        p_action: 'reject',
        p_reason: rejectReason.trim(),
      });
      if (error) throw error;
      showToast(`Verification rejected for "${selectedRequest.citizen_name}".`, 'info');
      handleCloseModal();
      fetchRequests();
    } catch (err: any) {
      showToast(`Failed to reject: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesTab = activeTab === 'all' || req.status === activeTab;
    const matchesSearch =
      (req.citizen_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.citizen_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.declared_barangay || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.id_type || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabCounts = useMemo(() => ({
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    all: requests.length,
  }), [requests]);

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: 'warning' | 'success' | 'error' | 'default'; label: string }> = {
      pending: { variant: 'warning', label: 'Pending Review' },
      approved: { variant: 'success', label: 'Approved' },
      rejected: { variant: 'error', label: 'Rejected' },
    };
    const { variant, label } = map[status] || { variant: 'default' as const, label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <DashboardLayout role="lgu-admin" title="Citizen Verifications">
      <ToastContainer />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
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

      {/* Search */}
      <Card padding="sm" className="mb-6">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, email, barangay, or ID type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((req) => (
          <Card key={req.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-alt rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-text-muted" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{req.citizen_name || 'Unknown Citizen'}</p>
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Envelope className="w-3 h-3" />
                    {req.citizen_email || 'No email'}
                  </div>
                </div>
              </div>
              {statusBadge(req.status)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
              <div className="flex items-center gap-2 text-text-muted">
                <FileText className="w-4 h-4 flex-shrink-0" />
                <div>
                  <p className="text-text-faint text-xs">ID Type</p>
                  <p className="text-text-primary font-medium">{req.id_type || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-text-muted">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <div>
                  <p className="text-text-faint text-xs">Barangay</p>
                  <p className="text-text-primary font-medium">{req.declared_barangay || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-text-muted">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <div>
                  <p className="text-text-faint text-xs">Submitted</p>
                  <p className="text-text-primary font-medium">{formatDate(req.created_at)}</p>
                </div>
              </div>
              {req.rejection_reason && (
                <div className="flex items-center gap-2">
                  <Warning className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-text-faint text-xs">Rejection Reason</p>
                    <p className="text-red-600 dark:text-red-400 font-medium text-xs">{req.rejection_reason}</p>
                  </div>
                </div>
              )}
            </div>

            {req.status === 'pending' && (
              <div className="flex gap-3 pt-3 border-t border-theme">
                <Button variant="primary" onClick={() => handleViewDetails(req)}>
                  <Eye className="w-4 h-4 mr-1" />
                  Review &amp; Approve
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setSelectedRequest(req);
                    setShowRejectModal(true);
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}

            {(req.status === 'approved' || req.status === 'rejected') && (
              <div className="flex gap-3 pt-3 border-t border-theme">
                <Button variant="ghost" onClick={() => handleViewDetails(req)}>
                  <Eye className="w-4 h-4 mr-1" />
                  View Documents
                </Button>
              </div>
            )}
          </Card>
        ))}

        {filteredRequests.length === 0 && (
          <Card>
            <div className="text-center py-8 text-text-muted">
              <IdentificationBadge className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No verification requests found</p>
              {activeTab === 'pending' && (
                <p className="text-sm mt-1">All caught up! No pending requests.</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* ── Review / Detail Modal ── */}
      {selectedRequest && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary">
                  Review Verification
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Citizen Info */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-surface-alt rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-text-muted" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{selectedRequest.citizen_name}</p>
                    <p className="text-sm text-text-muted">{selectedRequest.citizen_email}</p>
                  </div>
                  <div className="ml-auto">{statusBadge(selectedRequest.status)}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-text-faint">ID Type</p>
                    <p className="font-medium text-text-primary">{selectedRequest.id_type}</p>
                  </div>
                  <div>
                    <p className="text-text-faint">Declared Barangay</p>
                    <p className="font-medium text-text-primary">{selectedRequest.declared_barangay}</p>
                  </div>
                  <div>
                    <p className="text-text-faint">Submitted</p>
                    <p className="font-medium text-text-primary">{formatDate(selectedRequest.created_at)}</p>
                  </div>
                  {selectedRequest.reviewed_at && (
                    <div>
                      <p className="text-text-faint">Reviewed</p>
                      <p className="font-medium text-text-primary">{formatDate(selectedRequest.reviewed_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ID Document Image */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Government ID
                </p>
                {imageLoading ? (
                  <div className="h-48 bg-surface-alt rounded-lg flex items-center justify-center">
                    <p className="text-sm text-text-muted">Loading secure image...</p>
                  </div>
                ) : idImageUrl ? (
                  <img
                    src={idImageUrl}
                    alt="Government ID"
                    className="w-full max-h-72 object-contain rounded-lg border border-theme bg-surface-alt"
                  />
                ) : (
                  <div className="h-48 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <p className="text-sm text-red-600 dark:text-red-400">Failed to load image</p>
                  </div>
                )}
              </div>

              {/* Selfie with ID */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Selfie with ID
                </p>
                {imageLoading ? (
                  <div className="h-48 bg-surface-alt rounded-lg flex items-center justify-center">
                    <p className="text-sm text-text-muted">Loading secure image...</p>
                  </div>
                ) : selfieUrl ? (
                  <img
                    src={selfieUrl}
                    alt="Selfie with ID"
                    className="w-full max-h-72 object-contain rounded-lg border border-theme bg-surface-alt"
                  />
                ) : (
                  <div className="h-48 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <p className="text-sm text-red-600 dark:text-red-400">Failed to load image</p>
                  </div>
                )}
              </div>

              {selectedRequest.rejection_reason && (
                <div className="p-3 bg-red-500/10 rounded-lg mb-4">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Rejection Reason:</p>
                  <p className="text-sm text-red-600 dark:text-red-400">{selectedRequest.rejection_reason}</p>
                </div>
              )}

              {/* Actions */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-theme">
                  <Button
                    variant="primary"
                    onClick={handleApprove}
                    isLoading={actionLoading}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve Verification
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Reason Modal ── */}
      {selectedRequest && showRejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-text-primary mb-2">Reject Verification</h3>
            <p className="text-sm text-text-muted mb-4">
              Rejecting verification for <strong>{selectedRequest.citizen_name}</strong>.
              Please provide a reason so the citizen can understand what to correct.
            </p>
            <TextArea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. The ID photo is blurry, or the barangay does not match the ID address..."
              rows={4}
              className="mb-4"
            />
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleReject}
                isLoading={actionLoading}
                disabled={!rejectReason.trim()}
              >
                <X className="w-4 h-4 mr-1" />
                Confirm Rejection
              </Button>
              <Button variant="secondary" onClick={() => { setShowRejectModal(false); setRejectReason(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
