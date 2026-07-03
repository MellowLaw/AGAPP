'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge, ReportStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { ReportsMap } from '@/components/map';
import {
  Warning,
  MapPin,
  User,
  Calendar,
  Check,
  X,
  ArrowsClockwise,
  MagnifyingGlass,
  Funnel,
  Download
} from '@phosphor-icons/react';

type ReportStatus = 'submitted' | 'under_review' | 'in_progress' | 'resolved' | 'rejected';

interface ReportItem {
  id: string;            // display id (reference number)
  dbId: string;          // underlying reports.id UUID
  category: string;
  subType: string | null;
  location: string;
  lat: number;
  lng: number;
  status: ReportStatus;
  submittedBy: string;
  citizenId: string | null; // reports.citizen_id (null if account deleted)
  submittedAt: string;   // human readable timestamp
  photoUrl: string | null;
  assignedOffice: string | null;
  aiDetected?: boolean;
  aiConfidence?: number | null;
}

const mapDbStatusToUi = (status: string): ReportStatus => {
  switch (status) {
    case 'Submitted':
      return 'submitted';
    case 'Under Review':
      return 'under_review';
    case 'In Progress':
      return 'in_progress';
    case 'Resolved':
      return 'resolved';
    case 'Rejected':
      return 'rejected';
    default:
      return 'submitted';
  }
};

const mapUiStatusToDb = (status: ReportStatus): string => {
  switch (status) {
    case 'submitted':
      return 'Submitted';
    case 'under_review':
      return 'Under Review';
    case 'in_progress':
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Submitted';
  }
};

const mapDbCategoryToUi = (category: string): { category: string; subType: string | null } => {
  switch (category) {
    case 'pothole':
      return { category: 'Pothole / Road Damage', subType: null };
    case 'clogged_drainage':
      return { category: 'Drainage / Canal', subType: null };
    case 'stray_animal':
      return { category: 'Stray Pets', subType: null };
    case 'damaged_pole':
      return { category: 'Damaged Pole', subType: null };
    default:
      return { category, subType: null };
  }
};

const mapReportRowToItem = (row: any): ReportItem => {
  const { category, subType } = mapDbCategoryToUi(row.category || '');
  return {
    id: row.reference_number || row.id,
    dbId: row.id,
    category,
    subType,
    location: row.barangay || 'Unknown location',
    lat: row.latitude,
    lng: row.longitude,
    status: mapDbStatusToUi(row.status || 'Submitted'),
    submittedBy: row.citizen_name || 'Citizen',
    citizenId: row.citizen_id || null,
    submittedAt: row.created_at ? new Date(row.created_at).toLocaleString() : '',
    photoUrl: row.photo_url || null,
    assignedOffice: row.assigned_office || null,
    aiDetected: !!row.ml_verified,
    aiConfidence: row.ml_confidence ?? null,
  };
};

export default function ReportsPage() {
  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();
  const params = useSearchParams();
  const offices = ['Engineering Office', 'Health Office', 'MDRRMO', 'Agriculture'];
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignOffice, setAssignOffice] = useState(offices[0]);
  const pageSize = 25;
  const [page, setPage] = useState(1);
  const [assignHistory, setAssignHistory] = useState<Record<string, { office: string; at: string }[]>>({});

  const lguNameParam = params?.get('lguName') || 'Liliw, Laguna';
  const lguId = React.useMemo(
    () => lguNameParam.toLowerCase().replace(/,/g, '').replace(/\s+/g, '-'),
    [lguNameParam]
  );

  // Citizen legitimacy info for the selected report. RLS: an LGU admin can
  // read users in their own LGU, so this lookup works here; a null citizen_id
  // (account deleted) is handled by skipping the query entirely.
  const [citizenInfo, setCitizenInfo] = useState<{ verification_status: string | null; barangay: string | null } | null>(null);
  const selectedCitizenId = selectedReport?.citizenId ?? null;
  useEffect(() => {
    setCitizenInfo(null);
    if (!selectedCitizenId) return;
    let cancelled = false;
    supabase
      .from('users')
      .select('verification_status, barangay')
      .eq('id', selectedCitizenId)
      .single()
      .then(({ data }) => {
        if (!cancelled && data) setCitizenInfo(data);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCitizenId]);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setLoadError(null);
      // Explicit column list — only what the list + detail panel actually
      // render (avoids hauling unused blobs like status_history over the wire).
      const { data, error } = await supabase
        .from('reports')
        .select('id, reference_number, category, status, barangay, latitude, longitude, citizen_id, citizen_name, created_at, photo_url, assigned_office, ml_verified, ml_confidence')
        .eq('lgu_id', lguId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading reports', error);
        setLoadError(error.message);
        showToast('Failed to load reports. Please try again.', 'error');
        setLoading(false);
        return;
      }

      const mapped = (data || []).map(mapReportRowToItem);
      setReportsList(mapped);

      const reportParam = params?.get('reportId') || '';
      if (reportParam) {
        const found = mapped.find(r => r.id === reportParam || r.dbId === reportParam);
        setSelectedReport(found || mapped[0] || null);
      } else {
        setSelectedReport(mapped[0] || null);
      }
      setLoading(false);
    };

    fetchReports();
    // showToast is deliberately excluded — useToast() returns a new function
    // reference on every render, so including it here would refetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lguId, params]);

  const filteredReports = reportsList.filter(r => {
    const matchesSearch = r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesFilter;
  });
  const pageCount = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paginated = useMemo(() => filteredReports.slice((safePage - 1) * pageSize, safePage * pageSize), [filteredReports, safePage]);
  const startNum = filteredReports.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endNum = Math.min(filteredReports.length, safePage * pageSize);

  const handleExportCsv = () => {
    const cols = ['id','category','subType','location','status','submittedBy','submittedAt','assignedOffice'];
    const rows = filteredReports.map(r => [r.id, r.category, r.subType, r.location, r.status, r.submittedBy, r.submittedAt, r.assignedOffice || ''].map(v => typeof v === 'string' ? '"'+v.replace(/"/g,'""')+'"' : String(v)).join(','));
    const csv = [cols.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reports.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAcknowledge = async () => {
    if (!selectedReport) return;

    const prevList = reportsList;
    const prevSelected = selectedReport;
    const newStatus: ReportStatus = 'under_review';

    const updated = reportsList.map(r => 
      r.id === selectedReport.id ? { ...r, status: newStatus } : r
    );
    setReportsList(updated);
    setSelectedReport({ ...selectedReport, status: newStatus });

    const { error } = await supabase
      .from('reports')
      .update({ status: mapUiStatusToDb(newStatus) })
      .eq('id', selectedReport.dbId);

    if (error) {
      console.error('Failed to acknowledge report', error);
      setReportsList(prevList);
      setSelectedReport(prevSelected);
      showToast('Failed to acknowledge report. Please try again.', 'error');
      return;
    }

    showToast(`Report ${selectedReport.id} acknowledged!`, 'success');
  };

  const handleReassign = () => {
    if (!selectedReport) return;
    setAssignOpen(true);
  };
  const confirmAssign = async () => {
    if (!selectedReport) return;

    const prevList = reportsList;
    const prevSelected = selectedReport;
    const prevHistory = assignHistory;
    const officeLabel = assignOffice;

    const updated = reportsList.map(r => 
      r.id === selectedReport.id ? { ...r, assignedOffice: officeLabel } : r
    );
    const newSelected = { ...selectedReport, assignedOffice: officeLabel };
    const at = new Date().toLocaleString();
    const newHistory = {
      ...assignHistory,
      [selectedReport.id]: [...(assignHistory[selectedReport.id] || []), { office: officeLabel, at }]
    };

    setReportsList(updated);
    setSelectedReport(newSelected);
    setAssignHistory(newHistory);
    setAssignOpen(false);

    const { error } = await supabase
      .from('reports')
      .update({ assigned_office: officeLabel })
      .eq('id', selectedReport.dbId);

    if (error) {
      console.error('Failed to assign office', error);
      setReportsList(prevList);
      setSelectedReport(prevSelected);
      setAssignHistory(prevHistory);
      setAssignOpen(true);
      showToast('Failed to assign office. Please try again.', 'error');
      return;
    }

    showToast(`Report ${selectedReport.id} reassigned to ${officeLabel}!`, 'success');
  };

  const handleReject = async () => {
    if (!selectedReport) return;

    const prevList = reportsList;
    const prevSelected = selectedReport;
    const newStatus: ReportStatus = 'rejected';

    const updated = reportsList.map(r => 
      r.id === selectedReport.id ? { ...r, status: newStatus } : r
    );
    setReportsList(updated);
    setSelectedReport({ ...selectedReport, status: newStatus });

    const { error } = await supabase
      .from('reports')
      .update({ status: mapUiStatusToDb(newStatus) })
      .eq('id', selectedReport.dbId);

    if (error) {
      console.error('Failed to reject report', error);
      setReportsList(prevList);
      setSelectedReport(prevSelected);
      showToast('Failed to reject report. Please try again.', 'error');
      return;
    }

    showToast(`Report ${selectedReport.id} rejected!`, 'info');
  };

  const handleResolve = async () => {
    if (!selectedReport) return;

    const prevList = reportsList;
    const prevSelected = selectedReport;
    const newStatus: ReportStatus = 'resolved';

    const updated = reportsList.map(r => 
      r.id === selectedReport.id ? { ...r, status: newStatus } : r
    );
    setReportsList(updated);
    setSelectedReport({ ...selectedReport, status: newStatus });

    const { error } = await supabase
      .from('reports')
      .update({ status: mapUiStatusToDb(newStatus) })
      .eq('id', selectedReport.dbId);

    if (error) {
      console.error('Failed to resolve report', error);
      setReportsList(prevList);
      setSelectedReport(prevSelected);
      showToast('Failed to mark report as resolved. Please try again.', 'error');
      return;
    }

    showToast(`Report ${selectedReport.id} marked as resolved!`, 'success');
  };

  return (
    <DashboardLayout 
      role="lgu-admin" 
      title="Issue Reports"
    >
      <ToastContainer />
      <div className="flex gap-6 h-[calc(100vh-140px)]">
        {/* Left Panel - Report List */}
        <div className="w-1/2 flex flex-col gap-4">
          {/* Search & Filter */}
          <Card padding="sm">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
                <input
                  type="text"
                  placeholder="Search reports..."
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
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <Button variant="secondary" onClick={handleExportCsv}>
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </Card>

          {/* Report List */}
          <Card className="flex-1 overflow-hidden" padding="none">
            <div className="overflow-y-auto h-full">
              {loading && (
                <div className="p-4 text-sm text-[#737373]">Loading reports…</div>
              )}
              {loadError && !loading && (
                <div className="p-4 text-sm text-[#dc2626]">Error loading reports: {loadError}</div>
              )}
              {!loading && !loadError && paginated.length === 0 && (
                <div className="p-4 text-sm text-[#737373]">No reports found for this LGU.</div>
              )}
              {!loading && !loadError && paginated.map((report) => (
                <button
                  key={report.dbId}
                  onClick={() => setSelectedReport(report)}
                  className={`w-full text-left p-4 border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-colors ${
                    selectedReport && selectedReport.id === report.id ? 'bg-[#f5f5f5]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-[#1a1a1a]">{report.id}</span>
                    <ReportStatusBadge status={report.status} />
                  </div>
                  <p className="text-[#1a1a1a] mb-1">{report.category}{report.subType ? ` - ${report.subType}` : ''}</p>
                  <div className="flex items-center gap-1 text-sm text-[#737373]">
                    <MapPin className="w-4 h-4" />
                    {report.location}
                    <span className="mx-1">•</span>
                    {report.submittedAt}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-t border-[#e5e5e5]">
              <span className="text-xs text-[#737373]">{startNum}-{endNum} of {filteredReports.length}</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" disabled={safePage<=1} onClick={() => setPage(Math.max(1, safePage-1))}>Prev</Button>
                <span className="text-xs text-[#737373]">Page {safePage} / {pageCount}</span>
                <Button variant="ghost" size="sm" disabled={safePage>=pageCount} onClick={() => setPage(Math.min(pageCount, safePage+1))}>Next</Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Panel - Report Details */}
        <div className="w-1/2">
          <Card className="h-full">
            {selectedReport ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-[#e5e5e5] pb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1a1a1a]">{selectedReport.id}</h2>
                    <ReportStatusBadge status={selectedReport.status} />
                  </div>
                </div>

                {/* Photo */}
                <div className="aspect-video bg-[#f5f5f5] rounded-lg overflow-hidden flex items-center justify-center border border-[#e5e5e5]">
                  {selectedReport.photoUrl ? (
                    <img 
                      src={selectedReport.photoUrl} 
                      alt="Report evidence" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <Warning className="w-12 h-12 text-[#737373] mx-auto mb-2" />
                      <p className="text-[#737373]">No photo proof attached</p>
                    </div>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#737373] mb-1">Category</p>
                    <p className="text-[#1a1a1a]">{selectedReport.category}</p>
                    <p className="text-sm text-[#737373]">{selectedReport.subType}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#737373] mb-1">Submitted By</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="w-4 h-4 text-[#737373]" />
                      <span className="text-[#1a1a1a]">{selectedReport.submittedBy}</span>
                      {!selectedReport.citizenId ? (
                        <Badge variant="default">Account deleted</Badge>
                      ) : citizenInfo ? (
                        <Badge
                          variant={
                            citizenInfo.verification_status === 'verified' ? 'success' :
                            citizenInfo.verification_status === 'pending' ? 'warning' :
                            'default'
                          }
                        >
                          {citizenInfo.verification_status === 'verified' ? 'Verified citizen' :
                           citizenInfo.verification_status === 'pending' ? 'Verification pending' :
                           'Unverified'}
                        </Badge>
                      ) : null}
                    </div>
                    {citizenInfo?.barangay && (
                      <p className="text-xs text-[#737373] mt-1">Registered barangay: {citizenInfo.barangay}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#737373] mb-1">Location</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#737373] mt-0.5" />
                      <div>
                        <p className="text-[#1a1a1a]">{selectedReport.location}</p>
                        <p className="text-xs text-[#737373]">{selectedReport.lat}° N, {selectedReport.lng}° E</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#737373] mb-1">Submitted</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#737373]" />
                      <span className="text-[#1a1a1a]">{selectedReport.submittedAt}</span>
                    </div>
                  </div>
                </div>

                {/* Location Map — the exact GPS point the citizen's phone
                    captured when the report was submitted. */}
                {typeof selectedReport.lat === 'number' && typeof selectedReport.lng === 'number' && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#737373] mb-1">Location Map</p>
                    <ReportsMap
                      key={selectedReport.dbId}
                      className="h-48"
                      showLegend={false}
                      center={[selectedReport.lat, selectedReport.lng]}
                      reports={[{
                        id: selectedReport.dbId,
                        refNumber: selectedReport.id,
                        lat: selectedReport.lat,
                        lng: selectedReport.lng,
                        status: mapUiStatusToDb(selectedReport.status),
                        category: selectedReport.category,
                        barangay: selectedReport.location,
                        date: selectedReport.submittedAt,
                        photoUrl: null,
                      }]}
                    />
                  </div>
                )}

                {/* AI Detection Badge */}
                {selectedReport.aiDetected && (
                  <div className="flex items-center gap-2 p-3 bg-[#dcfce7] rounded-md">
                    <Check className="w-4 h-4 text-[#16a34a]" />
                    <span className="text-sm text-[#16a34a]">
                      AI Verified ({Math.round(selectedReport.aiConfidence! * 100)}% confidence)
                    </span>
                  </div>
                )}

                {/* Assigned Office */}
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#737373] mb-1">Assigned Office</p>
                  <p className="text-[#1a1a1a]">{selectedReport.assignedOffice || 'Not assigned'}</p>
                </div>
                {assignHistory[selectedReport.id]?.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#737373] mb-1">Assignment History</p>
                    <div className="space-y-1">
                      {assignHistory[selectedReport.id].slice().reverse().map((h, i) => (
                        <div key={i} className="text-sm text-[#1a1a1a]">{h.office} • {h.at}</div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-[#e5e5e5]">
                  {selectedReport.status === 'submitted' || selectedReport.status === 'under_review' ? (
                    <>
                      <Button variant="primary" onClick={handleAcknowledge}>
                        <Check className="w-4 h-4 mr-1" />
                        Acknowledge
                      </Button>
                      <Button variant="secondary" onClick={handleReassign}>
                        <ArrowsClockwise className="w-4 h-4 mr-1" />
                        Reassign
                      </Button>
                      <Button variant="danger" onClick={handleReject}>
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  ) : selectedReport.status === 'in_progress' ? (
                    <Button variant="primary" onClick={handleResolve}>
                      <Check className="w-4 h-4 mr-1" />
                      Mark Resolved
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled>
                      Resolved
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-[#737373]">
                Select a report to view details
              </div>
            )}
          </Card>
        </div>
      </div>
      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white rounded-lg border border-[#e5e5e5] p-5">
            <h3 className="text-base font-semibold mb-3">Assign Office</h3>
            <select value={assignOffice} onChange={(e) => setAssignOffice(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded-md text-sm mb-4">
              {offices.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button onClick={confirmAssign}>Confirm</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
