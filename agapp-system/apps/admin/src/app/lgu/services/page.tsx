'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, ServiceStatusBadge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { 
  FileText,
  User,
  Calendar,
  Check,
  X,
  Clock,
  QrCode,
  ArrowRight,
  MagnifyingGlass,
  Download
} from '@phosphor-icons/react';

type ServiceStatus =
  | 'pending'
  | 'under_review'
  | 'awaiting_payment'
  | 'processing'
  | 'ready_for_pickup'
  | 'completed'
  | 'rejected';

interface ServiceRequestItem {
  id: string;       // display id (reference_number)
  dbId: string;     // uuid PK
  serviceType: string;
  category: string;
  status: ServiceStatus;
  submittedBy: string;
  submittedAt: string;
  amount: number;
  paymentStatus: 'paid' | 'pending' | 'refunded' | string;
  assignedTo: string | null;
}

const mapDbStatusToUi = (status: string | null): ServiceStatus => {
  switch (status) {
    case 'Submitted':
      return 'pending';
    case 'Under Review':
      return 'under_review';
    case 'In Progress':
      return 'processing';
    case 'Released':
      return 'completed';
    case 'Rejected':
      return 'rejected';
    default:
      return 'pending';
  }
};

const mapUiStatusToDb = (status: ServiceStatus): string => {
  switch (status) {
    case 'pending':
      return 'Submitted';
    case 'under_review':
      return 'Under Review';
    case 'awaiting_payment':
      return 'Under Review';
    case 'processing':
      return 'In Progress';
    case 'ready_for_pickup':
      return 'Released';
    case 'completed':
      return 'Released';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Submitted';
  }
};

const mapServiceRowToItem = (row: any): ServiceRequestItem => {
  return {
    id: row.reference_number || row.id,
    dbId: row.id,
    serviceType: row.service_type,
    category: row.office_name,
    status: mapDbStatusToUi(row.status),
    submittedBy: row.citizen_name,
    submittedAt: row.created_at ? new Date(row.created_at).toLocaleString() : '',
    amount: (row.form_details && typeof row.form_details.amount === 'number') ? row.form_details.amount : 0,
    paymentStatus: (row.form_details && row.form_details.payment_status) || 'pending',
    assignedTo: row.assigned_personnel || null,
  };
};

export default function ServicesPage() {
  const [requestsList, setRequestsList] = useState<ServiceRequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { showToast, ToastContainer } = useToast();
  const pageSize = 25;
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Print / Download Document ─────────────────────────────────────────────
  const handlePrintDocument = (req: ServiceRequestItem) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      showToast('Pop-up blocked. Please allow pop-ups and try again.', 'error');
      return;
    }
    const statusLabel = req.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const paymentLabel = req.paymentStatus.charAt(0).toUpperCase() + req.paymentStatus.slice(1);
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
          .payment-box { background: #f5f5f5; border-radius: 6px; padding: 12px 16px; margin-top: 12px; }
          .payment-box .row { border-bottom: none; padding: 4px 0; }
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
          <div class="row"><span class="label">Status</span><span class="value"><span class="badge">${statusLabel}</span></span></div>
          <div class="row"><span class="label">Reference No.</span><span class="value">${req.id}</span></div>
        </div>

        <div class="section">
          <h2>Applicant Information</h2>
          <div class="row"><span class="label">Submitted By</span><span class="value">${req.submittedBy}</span></div>
          <div class="row"><span class="label">Date Submitted</span><span class="value">${req.submittedAt}</span></div>
          <div class="row"><span class="label">Assigned To</span><span class="value">${req.assignedTo || 'Unassigned'}</span></div>
        </div>

        <div class="section">
          <h2>Payment</h2>
          <div class="payment-box">
            <div class="row"><span class="label">Amount Due</span><span class="value">₱${req.amount.toFixed(2)}</span></div>
            <div class="row"><span class="label">Payment Status</span><span class="value">${paymentLabel}</span></div>
          </div>
        </div>

        <div class="footer">
          <span>AGAPP — Automated Government Assistance and Processing Portal</span>
          <span>This document is system-generated and does not require a signature.</span>
        </div>

        <script>window.onload = function() { window.print(); }<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const params = useSearchParams();
  const lguNameParam = params?.get('lguName') || 'Liliw, Laguna';
  const lguId = lguNameParam.toLowerCase().replace(/,/g, '').replace(/\s+/g, '-');

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
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
      setSelectedRequest(mapped[0] || null);
      setLoading(false);
    };

    fetchRequests();
  }, [lguId, showToast]);

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
    const cols = ['id','serviceType','category','status','submittedBy','submittedAt','amount','paymentStatus','assignedTo'];
    const rows = filteredRequests.map(r => [r.id, r.serviceType, r.category, r.status, r.submittedBy, r.submittedAt, r.amount, r.paymentStatus, r.assignedTo || ''].map(v => typeof v === 'string' ? '"'+v.replace(/"/g,'""')+'"' : String(v)).join(','));
    const csv = [cols.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'service-requests.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApprovePayment = async () => {
    if (!selectedRequest) return;

    const prevList = requestsList;
    const prevSelected = selectedRequest;
    const newStatus: ServiceStatus = 'processing';

    const updatedList = requestsList.map(r => 
      r.id === selectedRequest.id 
        ? { ...r, paymentStatus: 'paid', status: newStatus } 
        : r
    );
    setRequestsList(updatedList);
    setSelectedRequest({ ...selectedRequest, paymentStatus: 'paid', status: newStatus });

    // Merge payment_status into existing form_details JSON instead of overwriting
    const dbRow = (await supabase
      .from('service_requests')
      .select('form_details')
      .eq('id', selectedRequest.dbId)
      .single()).data as { form_details: any } | null;

    const existingDetails = (dbRow && dbRow.form_details) ? dbRow.form_details : {};
    const mergedDetails = {
      ...existingDetails,
      payment_status: 'paid',
      amount: prevSelected.amount,
    };

    const { error } = await supabase
      .from('service_requests')
      .update({
        status: mapUiStatusToDb(newStatus),
        form_details: mergedDetails,
      })
      .eq('id', selectedRequest.dbId);

    if (error) {
      console.error('Failed to approve payment', error);
      setRequestsList(prevList);
      setSelectedRequest(prevSelected);
      showToast('Failed to confirm payment. Please try again.', 'error');
      return;
    }

    showToast(`Payment confirmed for ${selectedRequest.id}! Now processing.`, 'success');
  };

  const handleProcess = async () => {
    if (!selectedRequest) return;

    const prevList = requestsList;
    const prevSelected = selectedRequest;
    const newStatus: ServiceStatus = 'processing';

    const updated = requestsList.map(r => 
      r.id === selectedRequest.id ? { ...r, status: newStatus } : r
    );
    setRequestsList(updated);
    setSelectedRequest({ ...selectedRequest, status: newStatus });

    const { error } = await supabase
      .from('service_requests')
      .update({ status: mapUiStatusToDb(newStatus) })
      .eq('id', selectedRequest.dbId);

    if (error) {
      console.error('Failed to start processing', error);
      setRequestsList(prevList);
      setSelectedRequest(prevSelected);
      showToast('Failed to start processing. Please try again.', 'error');
      return;
    }

    showToast(`Started processing ${selectedRequest.id}!`, 'success');
  };

  const handleComplete = async () => {
    if (!selectedRequest) return;

    const prevList = requestsList;
    const prevSelected = selectedRequest;
    const newStatus: ServiceStatus = selectedRequest.status === 'processing' ? 'ready_for_pickup' : 'completed';

    const updated = requestsList.map(r => 
      r.id === selectedRequest.id ? { ...r, status: newStatus } : r
    );
    setRequestsList(updated);
    setSelectedRequest({ ...selectedRequest, status: newStatus });

    const { error } = await supabase
      .from('service_requests')
      .update({ status: mapUiStatusToDb(newStatus) })
      .eq('id', selectedRequest.dbId);

    if (error) {
      console.error('Failed to update request status', error);
      setRequestsList(prevList);
      setSelectedRequest(prevSelected);
      showToast('Failed to update request status. Please try again.', 'error');
      return;
    }

    showToast(`Request ${selectedRequest.id} is now ${newStatus.replace('_', ' ')}!`, 'success');
  };

  return (
    <DashboardLayout 
      role="lgu-admin" 
      title="Service Requests"
    >
      <ToastContainer />
      <div className="flex gap-6 h-[calc(100vh-140px)]">
        {/* Left Panel - Request List */}
        <div className="w-1/2 flex flex-col gap-4">
          {/* Search & Filter */}
          <Card padding="sm">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:border-[#2563eb]"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-white border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:border-[#2563eb]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="awaiting_payment">Awaiting Payment</option>
                <option value="processing">Processing</option>
                <option value="ready_for_pickup">Ready for Pickup</option>
                <option value="completed">Completed</option>
              </select>
              <Button variant="secondary" onClick={handleExportCsv}>
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </Card>

          {/* Request List */}
          <Card className="flex-1 overflow-hidden" padding="none">
            <div className="overflow-y-auto h-full">
              {loading && (
                <div className="p-4 text-sm text-[#737373]">Loading service requests…</div>
              )}
              {loadError && !loading && (
                <div className="p-4 text-sm text-[#dc2626]">Error loading requests: {loadError}</div>
              )}
              {!loading && !loadError && paginated.length === 0 && (
                <div className="p-4 text-sm text-[#737373]">No service requests found for this LGU.</div>
              )}
              {!loading && !loadError && paginated.map((request) => (
                <button
                  key={request.dbId}
                  onClick={() => setSelectedRequest(request)}
                  className={`w-full text-left p-4 border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-colors ${
                    selectedRequest && selectedRequest.id === request.id ? 'bg-[#f5f5f5]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-[#737373]" />
                      <span className="font-medium text-[#1a1a1a]">{request.id}</span>
                    </div>
                    <ServiceStatusBadge status={request.status} />
                  </div>
                  <p className="text-[#1a1a1a] mb-1">{request.serviceType}</p>
                  <div className="flex items-center gap-1 text-sm text-[#737373]">
                    <User className="w-3 h-3" />
                    {request.submittedBy}
                    <span className="mx-1">•</span>
                    {request.submittedAt}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-t border-[#e5e5e5]">
              <span className="text-xs text-[#737373]">{startNum}-{endNum} of {filteredRequests.length}</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" disabled={safePage<=1} onClick={() => setPage(Math.max(1, safePage-1))}>Prev</Button>
                <span className="text-xs text-[#737373]">Page {safePage} / {pageCount}</span>
                <Button variant="ghost" size="sm" disabled={safePage>=pageCount} onClick={() => setPage(Math.min(pageCount, safePage+1))}>Next</Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Panel - Request Details */}
        <div className="w-1/2">
          <Card className="h-full">
            {selectedRequest ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-[#e5e5e5] pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <QrCode className="w-5 h-5 text-[#737373]" />
                      <h2 className="text-lg font-semibold text-[#1a1a1a]">{selectedRequest.id}</h2>
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
                    <p className="text-xs uppercase tracking-wide text-[#737373] mb-1">Service Type</p>
                    <p className="text-lg font-medium text-[#1a1a1a]">{selectedRequest.serviceType}</p>
                    <p className="text-sm text-[#737373]">{selectedRequest.category}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#737373] mb-1">Submitted By</p>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#737373]" />
                        <span className="text-[#1a1a1a]">{selectedRequest.submittedBy}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#737373] mb-1">Submitted</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#737373]" />
                        <span className="text-[#1a1a1a]">{selectedRequest.submittedAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="p-4 bg-[#f5f5f5] rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#737373]">Amount</span>
                      <span className="font-semibold text-[#1a1a1a]">₱{selectedRequest.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#737373]">Payment Status</span>
                      <Badge 
                        variant={
                          selectedRequest.paymentStatus === 'paid' ? 'success' :
                          selectedRequest.paymentStatus === 'pending' ? 'warning' :
                          selectedRequest.paymentStatus === 'refunded' ? 'error' :
                          'default'
                        }
                      >
                        {selectedRequest.paymentStatus}
                      </Badge>
                    </div>
                  </div>

                  {/* Assigned To */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#737373] mb-1">Assigned To</p>
                    <p className="text-[#1a1a1a]">{selectedRequest.assignedTo || 'Not assigned'}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-[#e5e5e5]">
                  {selectedRequest.status === 'awaiting_payment' && (
                    <Button onClick={handleApprovePayment}>
                      <Check className="w-4 h-4 mr-1" />
                      Confirm Payment
                    </Button>
                  )}
                  
                  {(selectedRequest.status === 'pending' || selectedRequest.status === 'under_review') && (
                    <Button onClick={handleProcess}>
                      <Clock className="w-4 h-4 mr-1" />
                      Start Processing
                    </Button>
                  )}
                  
                  {selectedRequest.status === 'processing' && (
                    <Button onClick={handleComplete}>
                      <Check className="w-4 h-4 mr-1" />
                      Mark Ready for Pickup
                    </Button>
                  )}
                  
                  {selectedRequest.status === 'ready_for_pickup' && (
                    <Button onClick={handleComplete}>
                      <Check className="w-4 h-4 mr-1" />
                      Mark Completed
                    </Button>
                  )}
                  
                  <Button variant="secondary" onClick={() => handlePrintDocument(selectedRequest)}>
                    <Download className="w-4 h-4 mr-1" />
                    Download / Print Document
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-[#737373]">
                Select a request to view details
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
