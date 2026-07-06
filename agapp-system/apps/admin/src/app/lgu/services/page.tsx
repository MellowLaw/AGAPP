'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ServiceStatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { lguIdFromName } from '@/lib/lgu';
import {
  User,
  Calendar,
  Check,
  X,
  Clock,
  QrCode,
  MagnifyingGlass,
  Download
} from '@phosphor-icons/react';

type ServiceStatus = 'Submitted' | 'Under Review' | 'In Progress' | 'Ready for Pickup' | 'Released' | 'Rejected';

interface ServiceRequestItem {
  id: string;       // display id (reference_number)
  dbId: string;     // uuid PK
  serviceType: string;
  category: string;
  status: ServiceStatus;
  submittedBy: string;
  submittedAt: string;
  purpose: string;
  assignedTo: string | null;
  claimCode: string | null;
  releasedAt: string | null;
  rejectReason: string | null;
  requirements: string[];
  feeNote: string | null;
  processingTime: string | null;
}

const mapServiceRowToItem = (row: any): ServiceRequestItem => {
  const catalog = row.lgu_services;
  return {
    id: row.reference_number || row.id,
    dbId: row.id,
    serviceType: row.service_type,
    category: row.office_name,
    status: (row.status as ServiceStatus) || 'Submitted',
    submittedBy: row.citizen_name,
    submittedAt: row.created_at 
      ? new Date(row.created_at).toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' }) + ' · ' + new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
    purpose: row.form_details?.purpose || '',
    assignedTo: row.assigned_personnel || null,
    claimCode: row.claim_code || null,
    releasedAt: row.released_at || null,
    rejectReason: row.reject_reason || null,
    requirements: Array.isArray(catalog?.requirements) ? catalog.requirements : [],
    feeNote: catalog?.fee_note || null,
    processingTime: catalog?.processing_time || null,
  };
};

export default function ServicesPage() {
  const [requestsList, setRequestsList] = useState<ServiceRequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { showToast, ToastContainer } = useToast();
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [readyModal, setReadyModal] = useState<{ code: string } | null>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const params = useSearchParams();
  const lguNameParam = params?.get('lguName') || 'Liliw, Laguna';
  const lguId = lguIdFromName(lguNameParam);

  const fetchRequests = async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from('service_requests')
      .select('*, lgu_services(requirements, fee_note, processing_time)')
      .eq('lgu_id', lguId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading service requests', error);
      setLoadError(error.message);
      showToast('Failed to load service requests. Please try again.', 'error');
      setLoading(false);
      return;
    }

    const mapped = (data || []).map(mapServiceRowToItem);
    setRequestsList(mapped);
    setSelectedRequest(prev => mapped.find(r => r.dbId === prev?.dbId) || mapped[0] || null);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    // showToast is deliberately excluded — useToast() returns a new function
    // reference on every render, so including it here would refetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lguId]);

  // ── Print / Download Document ─────────────────────────────────────────────
  const handlePrintDocument = (req: ServiceRequestItem) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      showToast('Pop-up blocked. Please allow pop-ups and try again.', 'error');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Service Request — ${req.id}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; color: #1a1a1a; padding: 40px; }
          .header { border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
          .header h1 { font-size: 20px; font-weight: 700; }
          .header .meta { text-align: right; font-size: 12px; color: #555; }
          .lgu-name { font-size: 13px; color: #555; margin-top: 4px; }
          .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; background: #e0f2fe; color: #0369a1; }
          .section { margin-bottom: 20px; }
          .section h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #737373; margin-bottom: 8px; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
          .row .label { color: #737373; }
          .row .value { font-weight: 500; text-align: right; max-width: 60%; }
          .footer { margin-top: 40px; border-top: 1px solid #e5e5e5; padding-top: 16px; font-size: 11px; color: #999; display: flex; justify-content: space-between; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Service Request</h1>
            <p class="lgu-name">LGU E-Services Portal</p>
          </div>
          <div class="meta">
            <strong>${req.id}</strong><br/>
            Printed: ${new Date().toLocaleString()}
          </div>
        </div>

        <div class="section">
          <h2>Request Details</h2>
          <div class="row"><span class="label">Service Type</span><span class="value">${req.serviceType}</span></div>
          <div class="row"><span class="label">Office / Category</span><span class="value">${req.category || '—'}</span></div>
          <div class="row"><span class="label">Status</span><span class="value"><span class="badge">${req.status}</span></span></div>
          <div class="row"><span class="label">Reference No.</span><span class="value">${req.id}</span></div>
        </div>

        <div class="section">
          <h2>Applicant Information</h2>
          <div class="row"><span class="label">Submitted By</span><span class="value">${req.submittedBy}</span></div>
          <div class="row"><span class="label">Date Submitted</span><span class="value">${req.submittedAt}</span></div>
          <div class="row"><span class="label">Assigned To</span><span class="value">${req.assignedTo || 'Unassigned'}</span></div>
        </div>

        <div class="section">
          <h2>Fee</h2>
          <div class="row"><span class="label">Payment</span><span class="value">${req.feeNote || 'Pay at the Municipal Hall'}</span></div>
        </div>

        <div class="footer">
          <span>AGAPP — Automated Governance and Public Service Platform</span>
          <span>This document is system-generated and does not require a signature.</span>
        </div>

        <script>window.onload = function() { window.print(); }<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredRequests = requestsList.filter(r => {
    const matchesSearch = r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.submittedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesFilter;
  });
  const pageCount = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paginated = useMemo(() => filteredRequests.slice((safePage - 1) * pageSize, safePage * pageSize), [filteredRequests, safePage]);
  const startNum = filteredRequests.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endNum = Math.min(filteredRequests.length, safePage * pageSize);

  const handleExportCsv = () => {
    const cols = ['id','serviceType','category','status','submittedBy','submittedAt','assignedTo'];
    const rows = filteredRequests.map(r => [r.id, r.serviceType, r.category, r.status, r.submittedBy, r.submittedAt, r.assignedTo || ''].map(v => typeof v === 'string' ? '"'+v.replace(/"/g,'""')+'"' : String(v)).join(','));
    const csv = [cols.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'service-requests.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

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
    fetchRequests();
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
    setReadyModal({ code: data as string });
    fetchRequests();
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
    fetchRequests();
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) return;
    setActionBusy(true);
    const { error } = await supabase
      .from('service_requests')
      .update({ status: 'Rejected', reject_reason: rejectReason.trim() })
      .eq('id', selectedRequest.dbId);
    setActionBusy(false);

    if (error) {
      console.error('Failed to reject request', error);
      showToast('Failed to reject request. Please try again.', 'error');
      return;
    }
    showToast(`${selectedRequest.id} was rejected.`, 'success');
    setRejectModal(false);
    setRejectReason('');
    fetchRequests();
  };

  return (
    <DashboardLayout
      role="lgu-admin"
      title="Service Requests"
    >
      <ToastContainer />

      <Modal isOpen={!!readyModal} onClose={() => setReadyModal(null)} title="Ready for Pickup" size="sm">
        <p className="text-sm text-text-muted mb-4">
          The citizen has been notified. Give them this claim code (or they can show the QR from their app) at the counter:
        </p>
        <div className="text-center py-4 bg-surface-alt rounded-lg">
          <span className="text-2xl font-bold tracking-widest text-text-primary">{readyModal?.code}</span>
        </div>
      </Modal>

      <Modal
        isOpen={rejectModal}
        onClose={() => { setRejectModal(false); setRejectReason(''); }}
        title="Reject Request"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setRejectModal(false); setRejectReason(''); }}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} disabled={!rejectReason.trim() || actionBusy}>Reject</Button>
          </>
        }
      >
        <label className="block text-xs uppercase tracking-wide text-text-muted mb-2">Reason</label>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
          placeholder="e.g. Missing DTI registration"
        />
      </Modal>

      <div className="flex gap-6 items-stretch">
        {/* Left Panel - Request List */}
        <div className="w-1/2 flex flex-col gap-4 h-full min-h-[600px]">
          {/* Search & Filter */}
          <Card padding="sm" noBorder>
            <div className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface-alt text-text-primary rounded-md text-sm border-0 focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-text-primary/50 h-10"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-surface-alt text-text-primary rounded-md text-sm border-0 focus:outline-none focus:ring-1 focus:ring-accent h-10"
              >
                <option value="all">All Status</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="In Progress">In Progress</option>
                <option value="Ready for Pickup">Ready for Pickup</option>
                <option value="Released">Released</option>
                <option value="Rejected">Rejected</option>
              </select>
              <Button variant="secondary" className="h-10 !bg-accent !text-white !border-0 hover:opacity-90" onClick={handleExportCsv}>
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </Card>

          {/* Request List */}
          <Card className="flex-1 flex flex-col overflow-hidden" padding="none" noBorder>
            <div className="flex items-center justify-between px-4 py-3 border-b border-theme">
              <span className="text-xs text-text-primary/70">{startNum}-{endNum} of {filteredRequests.length}</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="hover:!text-accent" disabled={safePage<=1} onClick={() => setPage(Math.max(1, safePage-1))}>Prev</Button>
                <span className="text-xs text-text-primary/70">Page {safePage} / {pageCount}</span>
                <Button variant="ghost" size="sm" className="hover:!text-accent" disabled={safePage>=pageCount} onClick={() => setPage(Math.min(pageCount, safePage+1))}>Next</Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
              {loading && (
                <div className="p-4 text-sm text-text-primary">Loading service requests…</div>
              )}
              {loadError && !loading && (
                <div className="p-4 text-sm text-red-600 dark:text-red-400">Error loading requests: {loadError}</div>
              )}
              {!loading && !loadError && paginated.length === 0 && (
                <div className="p-4 text-sm text-text-primary">No service requests found for this LGU.</div>
              )}
              {!loading && !loadError && paginated.map((request) => (
                <motion.button
                  key={request.dbId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => setSelectedRequest(request)}
                  className={`w-full text-left p-5 rounded-xl border transition-all ${
                    selectedRequest && selectedRequest.id === request.id 
                      ? 'bg-accent-soft border-accent ring-1 ring-accent' 
                      : 'bg-surface border-theme hover:bg-surface-alt/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-accent shrink-0" />
                      <span className="font-medium text-text-primary">{request.id}</span>
                    </div>
                    <ServiceStatusBadge status={request.status} />
                  </div>
                  <p className="text-text-primary mb-3">{request.serviceType}</p>
                  <div className="space-y-1 text-xs text-text-primary/70">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="truncate">{request.submittedBy}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>{request.submittedAt}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Panel - Request Details */}
        <div className="w-1/2">
          <Card noBorder className="rounded-[20px]">
            {selectedRequest ? (
              <motion.div
                key={selectedRequest.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <QrCode className="w-5 h-5 text-accent" />
                      <h2 className="text-lg font-semibold text-text-primary">{selectedRequest.id}</h2>
                    </div>
                    <ServiceStatusBadge status={selectedRequest.status} />
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => handlePrintDocument(selectedRequest)}>
                    <Download className="w-4 h-4 mr-1" />
                    Print
                  </Button>
                </div>

                {/* Service Details */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-text-primary/60 font-medium mb-1">Service Type</p>
                    <p className="text-lg font-semibold text-text-primary">{selectedRequest.serviceType}</p>
                    <p className="text-sm text-text-primary/70">{selectedRequest.category}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-text-primary/60 font-medium mb-1">Submitted By</p>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-accent" />
                        <span className="text-text-primary">{selectedRequest.submittedBy}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-text-primary/60 font-medium mb-1">Submitted</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent" />
                        <span className="text-text-primary">{selectedRequest.submittedAt}</span>
                      </div>
                    </div>
                  </div>

                  {selectedRequest.purpose && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-text-primary/60 font-medium mb-1">Purpose</p>
                      <p className="text-text-primary">{selectedRequest.purpose}</p>
                    </div>
                  )}

                  {selectedRequest.requirements.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-text-primary/60 font-medium mb-2">Requirements Checklist</p>
                      <ul className="space-y-1">
                        {selectedRequest.requirements.map((req, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-text-primary">
                            <Check className="w-3.5 h-3.5 text-accent" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Fee Info */}
                  <div className="p-4 bg-surface-alt rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-primary/70">Fee</span>
                      <span className="font-semibold text-text-primary">{selectedRequest.feeNote || 'Pay at the Municipal Hall'}</span>
                    </div>
                    {selectedRequest.processingTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-primary/70">Processing Time</span>
                        <span className="text-text-primary">{selectedRequest.processingTime}</span>
                      </div>
                    )}
                  </div>

                  {selectedRequest.status === 'Ready for Pickup' && selectedRequest.claimCode && (
                    <div className="p-4 bg-accent-soft rounded-md text-center">
                      <p className="text-xs uppercase tracking-wide text-accent mb-1">Claim Code</p>
                      <span className="text-xl font-bold tracking-widest text-text-primary">{selectedRequest.claimCode}</span>
                    </div>
                  )}

                  {selectedRequest.status === 'Released' && selectedRequest.releasedAt && (
                    <div className="p-4 bg-green-600 text-white rounded-md text-center text-sm font-semibold">
                      Released {new Date(selectedRequest.releasedAt).toLocaleString()}
                    </div>
                  )}

                  {selectedRequest.status === 'Rejected' && selectedRequest.rejectReason && (
                    <div className="p-4 bg-red-600 text-white rounded-md text-sm">
                      <span className="font-semibold">Reason: </span>{selectedRequest.rejectReason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4">
                  {selectedRequest.status === 'Submitted' && (
                    <Button onClick={() => updateStatus('Under Review')} disabled={actionBusy}>
                      <Clock className="w-4 h-4 mr-1" />
                      Start Review
                    </Button>
                  )}

                  {selectedRequest.status === 'Under Review' && (
                    <Button onClick={() => updateStatus('In Progress')} disabled={actionBusy}>
                      <Clock className="w-4 h-4 mr-1" />
                      Start Processing
                    </Button>
                  )}

                  {selectedRequest.status === 'In Progress' && (
                    <Button onClick={handleMarkReady} disabled={actionBusy}>
                      <Check className="w-4 h-4 mr-1" />
                      Mark Ready
                    </Button>
                  )}

                  {selectedRequest.status === 'Ready for Pickup' && (
                    <Button onClick={handleManualRelease} disabled={actionBusy}>
                      <Check className="w-4 h-4 mr-1" />
                      Mark Released (manual override)
                    </Button>
                  )}

                  {(selectedRequest.status === 'Submitted' || selectedRequest.status === 'Under Review' || selectedRequest.status === 'In Progress') && (
                    <Button variant="danger" onClick={() => setRejectModal(true)} disabled={actionBusy}>
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  )}

                  <Button variant="secondary" onClick={() => handlePrintDocument(selectedRequest)}>
                    <Download className="w-4 h-4 mr-1" />
                    Download / Print Document
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="py-20 flex items-center justify-center text-text-primary">
                Select a request to view details
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
