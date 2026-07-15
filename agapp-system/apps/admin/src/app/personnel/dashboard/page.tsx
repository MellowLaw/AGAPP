'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge, ServiceStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { DocumentText, TickSquare, Clock, User, Calendar, SearchNormal1, Barcode, Danger } from 'iconsax-react';

// Literal DB `service_requests.status` values (see supabase/schema.sql CHECK constraint).
type ServiceStatus = 'Submitted' | 'Under Review' | 'In Progress' | 'Ready for Pickup' | 'Released' | 'Rejected';

interface QueueItem {
  id: string;
  dbId: string;
  serviceType: string;
  citizen: string;
  submittedAt: string;
  status: ServiceStatus;
  claimCode: string | null;
  documents: string[];
}

interface RecentReportItem {
  id: string;
  category: string;
  location: string;
  status: 'pending' | 'acknowledged' | 'in_progress' | 'resolved' | 'rejected';
  time: string;
}

type DbReportStatus = 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved' | 'Rejected';

const mapReportStatusToDashboard = (status: string): RecentReportItem['status'] => {
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

export default function PersonnelDashboard() {
  const [queueList, setQueueList] = useState<QueueItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<QueueItem | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [readyCode, setReadyCode] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [lguId, setLguId] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();

  const fetchData = async (forLguId?: string) => {
    setLoading(true);
    setLoadError(null);

    let activeLguId = forLguId ?? lguId;

    if (!activeLguId) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        console.error('Error fetching auth user', authError);
        setLoadError('Not authenticated');
        setLoading(false);
        return;
      }

      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('id, name, lgu_id')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userRow) {
        console.error('Error loading personnel profile', userError);
        setLoadError(userError?.message || 'Failed to load profile');
        setLoading(false);
        return;
      }

      setCurrentUserName(userRow.name ?? null);
      activeLguId = userRow.lgu_id;
      setLguId(userRow.lgu_id);
    }

    const [svcRes, repRes] = await Promise.all([
      supabase
        .from('service_requests')
        .select('id, reference_number, citizen_name, service_type, status, assigned_personnel, created_at, claim_code, form_details, lgu_id')
        .eq('lgu_id', activeLguId),
      supabase
        .from('reports')
        .select('id, reference_number, category, status, barangay, created_at')
        .eq('lgu_id', activeLguId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    if (svcRes.error || repRes.error) {
      console.error('Error loading personnel dashboard data', svcRes.error || repRes.error);
      setLoadError((svcRes.error || repRes.error)?.message || 'Failed to load data');
      setLoading(false);
      return;
    }

    const queue: QueueItem[] = (svcRes.data || []).map((row: any) => ({
      id: row.reference_number || row.id,
      dbId: row.id,
      serviceType: row.service_type,
      citizen: row.citizen_name,
      submittedAt: row.created_at ? new Date(row.created_at).toLocaleString() : '',
      status: (row.status as ServiceStatus) || 'Submitted',
      claimCode: row.claim_code || null,
      documents: Array.isArray(row.form_details?.documents) ? row.form_details.documents : [],
    }));

    const reports: RecentReportItem[] = (repRes.data || []).map((row: any) => ({
      id: row.reference_number || row.id,
      category: mapDbCategoryToLabel(row.category || ''),
      location: row.barangay,
      status: mapReportStatusToDashboard(row.status || 'Submitted'),
      time: row.created_at ? new Date(row.created_at).toLocaleString() : '',
    }));

    setQueueList(queue);
    setSelectedRequest(prev => queue.find(q => q.dbId === prev?.dbId) || queue[0] || null);
    setRecentReports(reports);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (newStatus: ServiceStatus) => {
    if (!selectedRequest) return;
    setActionBusy(true);
    const { error } = await supabase
      .from('service_requests')
      .update({ status: newStatus })
      .eq('id', selectedRequest.dbId);
    setActionBusy(false);

    if (error) {
      console.error('Failed to update status', error);
      showToast('Failed to update status. Please try again.', 'error');
      return;
    }
    showToast(`${selectedRequest.id} is now ${newStatus}.`, 'success');
    fetchData();
  };

  const handleMarkReady = async () => {
    if (!selectedRequest) return;
    setActionBusy(true);
    const { data, error } = await supabase.rpc('mark_service_ready', { p_request_id: selectedRequest.dbId });
    setActionBusy(false);

    if (error) {
      console.error('Failed to mark ready', error);
      showToast(error.message || 'Failed to mark ready for pickup.', 'error');
      return;
    }
    setReadyCode(data as string);
    fetchData();
  };

  const handleManualRelease = async () => {
    if (!selectedRequest?.claimCode) return;
    setActionBusy(true);
    const { error } = await supabase.rpc('release_service_request', { p_code: selectedRequest.claimCode });
    setActionBusy(false);

    if (error) {
      console.error('Failed to release', error);
      showToast(error.message || 'Failed to release.', 'error');
      return;
    }
    showToast(`${selectedRequest.id} marked as released.`, 'success');
    fetchData();
  };

  const filteredQueue = useMemo(() => {
    if (!searchQuery.trim()) return queueList;
    const q = searchQuery.toLowerCase();
    return queueList.filter(item => 
      item.id.toLowerCase().includes(q) ||
      item.serviceType.toLowerCase().includes(q) ||
      item.citizen.toLowerCase().includes(q)
    );
  }, [queueList, searchQuery]);

  return (
    <DashboardLayout 
      role="lgu-personnel" 
      lguName="Liliw, Laguna"
      title="My Queue"
    >
      <ToastContainer />

      <Modal isOpen={!!readyCode} onClose={() => setReadyCode(null)} title="Ready for Pickup" size="sm">
        <p className="text-sm text-text-muted mb-4">
          The citizen has been notified. Give them this claim code (or they can show the QR from their app) at the counter:
        </p>
        <div className="text-center py-4 bg-surface-alt rounded-xl">
          <span className="text-2xl font-mono font-bold tracking-widest text-text-primary">{readyCode}</span>
        </div>
      </Modal>

      {loading && (
        <div className="mb-3 px-4 py-2 text-sm text-text-muted bg-surface-alt rounded-xl animate-pulse">
          Loading your queue…
        </div>
      )}
      {loadError && !loading && (
        <div className="mb-3 px-4 py-2 text-sm text-accent bg-accent-soft rounded-xl">
          Failed to load queue: {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - My Queue */}
        <div className="lg:col-span-2 space-y-5">
          {/* Search */}
          <Card padding="sm">
            <div className="relative">
              <SearchNormal1 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
              <input
                type="text"
                placeholder="Search queue by reference, type, or citizen name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-alt border border-theme rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </Card>

          {/* Queue Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQueue.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-surface border border-theme rounded-2xl">
                <DocumentText className="w-12 h-12 text-text-faint mx-auto mb-3.5" />
                <p className="text-sm font-bold text-text-primary">No requests in queue</p>
                <p className="text-xs text-text-muted mt-1.5 px-6">There are no pending document applications in your active work queue.</p>
              </div>
            ) : (
              filteredQueue.map((request) => (
                <Card
                  key={request.id}
                  className={`cursor-pointer transition-colors ${
                    selectedRequest && selectedRequest.id === request.id ? 'bg-accent-soft' : ''
                  }`}
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Barcode className="w-4 h-4 text-text-faint" />
                      <span className="font-semibold text-text-primary text-xs font-mono">{request.id}</span>
                    </div>
                    <ServiceStatusBadge status={request.status} />
                  </div>
                  <p className="text-text-primary text-sm font-semibold mb-2.5 line-clamp-1">{request.serviceType}</p>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
                    <User variant="Bold" className="w-3.5 h-3.5" />
                    {request.citizen}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Recent Reports (Read-only for personnel) */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Danger className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-sm text-text-primary">Recent Town Issue Reports</h3>
            </div>
            <div className="space-y-1">
              {recentReports.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-muted font-medium">
                  No issues logged for Liliw.
                </div>
              ) : (
                recentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between py-3 hover:bg-surface-alt transition-colors px-2 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{report.category}</p>
                      <p className="text-xs text-text-muted font-medium mt-0.5">{report.location} • {report.time}</p>
                    </div>
                    <Badge
                      variant={
                        report.status === 'resolved' ? 'success' :
                        report.status === 'in_progress' ? 'info' :
                        'warning'
                      }
                    >
                      {report.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Panel - Request Details */}
        <div>
          <Card className="sticky top-20">
            {selectedRequest ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b border-theme pb-4.5">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Barcode className="w-5 h-5 text-text-faint" />
                    <h2 className="text-base font-bold text-text-primary font-mono">{selectedRequest.id}</h2>
                  </div>
                  <ServiceStatusBadge status={selectedRequest.status} />
                </div>

                {/* Service Info */}
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-text-faint mb-1">Service Type</p>
                  <p className="text-base font-bold text-text-primary">{selectedRequest.serviceType}</p>
                </div>

                {/* Citizen Info */}
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-text-faint mb-1">Citizen</p>
                  <div className="flex items-center gap-2">
                    <User variant="Bold" className="w-4 h-4 text-text-faint" />
                    <span className="text-sm font-semibold text-text-primary">{selectedRequest.citizen}</span>
                  </div>
                </div>

                {/* Submitted */}
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-text-faint mb-1">Submitted</p>
                  <div className="flex items-center gap-2">
                    <Calendar variant="Bold" className="w-4 h-4 text-text-faint" />
                    <span className="text-sm font-mono text-text-primary">{selectedRequest.submittedAt}</span>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-text-faint mb-2">Submitted Documents</p>
                  {selectedRequest.documents.length === 0 ? (
                    <p className="text-xs text-text-faint italic">No document attachments uploaded.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {selectedRequest.documents.map((doc: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-xs font-semibold text-text-muted bg-surface-alt p-2 rounded-lg">
                          <DocumentText className="w-4 h-4 text-text-faint" />
                          {doc}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {selectedRequest.status === 'Ready for Pickup' && selectedRequest.claimCode && (
                  <div className="p-3 bg-accent-soft rounded-xl text-center">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-accent mb-1">Claim Code</p>
                    <span className="text-lg font-mono font-bold tracking-widest text-text-primary">{selectedRequest.claimCode}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2.5 pt-4.5 border-t border-theme">
                  {selectedRequest.status === 'Under Review' && (
                    <Button onClick={() => updateStatus('In Progress')} disabled={actionBusy} className="w-full flex items-center justify-center gap-2">
                      <Clock variant="Bold" className="w-4 h-4" />
                      Start Processing
                    </Button>
                  )}
                  {selectedRequest.status === 'In Progress' && (
                    <Button onClick={handleMarkReady} disabled={actionBusy} className="w-full flex items-center justify-center gap-2">
                      <TickSquare className="w-4 h-4" />
                      Mark Ready for Pickup
                    </Button>
                  )}
                  {selectedRequest.status === 'Ready for Pickup' && (
                    <Button onClick={handleManualRelease} disabled={actionBusy} className="w-full flex items-center justify-center gap-2">
                      <TickSquare className="w-4 h-4" />
                      Mark Released (manual override)
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-text-muted">
                <Barcode className="w-10 h-10 text-text-faint mx-auto mb-3.5" />
                <p className="font-semibold text-text-primary">Select a request</p>
                <p className="text-xs text-text-muted mt-1">Select a request from the queue to view details</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
