'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLgu } from '../../contexts/LguContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Location, 
  DocumentText, 
  Danger, 
  TickCircle, 
  Clock, 
  CloseCircle, 
  Barcode,
  ArrowLeft2
} from 'iconsax-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { downloadQrCodeAsPng } from '../../lib/qrExport';
import { OfficialTransactionReceipt } from '../../components/receipt/OfficialTransactionReceipt';
import { DocumentDownload, Printer } from 'iconsax-react';
import { SkeletonList } from '../../components/common/Skeleton';

export default function TrackingPage() {
  const { activeLgu } = useLgu();
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<'requests' | 'reports'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [activeQrModal, setActiveQrModal] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadQrPng = (req: any) => {
    if (!req) return;
    downloadQrCodeAsPng(
      'main-claim-qr-container',
      `AGAPP-Claim-QR-${req.reference_number || 'code'}.png`
    );
  };

  useEffect(() => {
    async function loadTrackingData() {
      if (!user?.id) return;
      try {
        const { data: reqData } = await supabase
          .from('service_requests')
          .select('*')
          .eq('citizen_id', user.id)
          .order('created_at', { ascending: false });
        if (reqData) setRequests(reqData);

        const { data: repData } = await supabase
          .from('reports')
          .select('*')
          .eq('citizen_id', user.id)
          .order('created_at', { ascending: false });
        if (repData) setReports(repData);
      } catch (err) {
        console.error('Error fetching tracking data', err);
      } finally {
        setLoading(false);
      }
    }
    loadTrackingData();
  }, [user]);

  const stages = ['Submitted', 'Under Review', 'In Progress', 'Ready for Pickup', 'Released'];

  const getStageIndex = (status: string) => {
    const idx = stages.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-5 pb-28 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="w-9 h-9 rounded-full bg-surface-alt dark:bg-chip border border-theme flex items-center justify-center text-text-primary hover:bg-surface transition shrink-0"
        >
          <ArrowLeft2 size={18} />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-['Octarine-Bold'] text-text-primary leading-tight">
            Tracking & Claims
          </h1>
          <p className="text-xs text-text-muted font-['Inter-Medium']">
            Real-time status of applications & incident reports
          </p>
        </div>
      </div>

      {/* Segmented Filter Pills */}
      <div className="p-1 rounded-full bg-surface-alt dark:bg-chip border border-theme flex items-center gap-1 shadow-2xs">
        <button
          onClick={() => setTab('requests')}
          className={`flex-1 py-2 rounded-full text-xs font-['Octarine-Bold'] transition-all flex items-center justify-center gap-1.5 ${
            tab === 'requests'
              ? 'bg-surface dark:bg-card text-text-primary shadow-xs'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <DocumentText size={16} />
          <span>E-Services ({requests.length})</span>
        </button>
        <button
          onClick={() => setTab('reports')}
          className={`flex-1 py-2 rounded-full text-xs font-['Octarine-Bold'] transition-all flex items-center justify-center gap-1.5 ${
            tab === 'reports'
              ? 'bg-surface dark:bg-card text-text-primary shadow-xs'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Danger size={16} />
          <span>Reports ({reports.length})</span>
        </button>
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {loading ? (
          <SkeletonList count={3} />
        ) : tab === 'requests' ? (
          requests.length === 0 ? (
            <div className="bg-surface dark:bg-card border border-theme rounded-[28px] p-10 text-center text-xs text-text-muted space-y-2">
              <DocumentText size={32} className="mx-auto text-text-muted/40" />
              <p className="font-['Inter-Medium']">No document requests found. Apply for clearances in E-Services.</p>
            </div>
          ) : (
            requests.map((req) => {
              const currentIdx = getStageIndex(req.status);
              return (
                <div
                  key={req.id}
                  className="bg-surface dark:bg-card border border-theme rounded-[28px] p-5 shadow-xs space-y-4 transition-colors hover:border-accent/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-['Octarine-Bold'] text-accent uppercase tracking-wider block">
                        REF #{req.reference_number}
                      </span>
                      <h3 className="text-sm sm:text-base font-['Octarine-Bold'] text-text-primary truncate mt-0.5">
                        {req.service_name || 'Document Request'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={req.status || 'Submitted'} />
                      <button
                        onClick={() => setActiveQrModal(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-contrast text-xs font-['Octarine-Bold'] hover:opacity-90 transition shadow-2xs"
                      >
                        <Barcode size={15} />
                        <span>Claim QR</span>
                      </button>
                    </div>
                  </div>

                  {/* Refined Stepped Progress Milestone */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-5 gap-1.5">
                      {stages.map((stage, i) => {
                        const isDone = i <= currentIdx;
                        return (
                          <div key={stage} className="space-y-1 text-center">
                            <div
                              className={`h-1.5 rounded-full transition-colors ${
                                isDone
                                  ? 'bg-emerald-500 shadow-2xs'
                                  : 'bg-surface-alt dark:bg-chip border border-theme'
                              }`}
                            />
                            <span
                              className={`text-[9.5px] block truncate font-['Inter-Medium'] ${
                                isDone ? 'text-text-primary font-bold' : 'text-text-muted'
                              }`}
                            >
                              {stage}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-text-muted font-['Inter-Medium'] pt-0.5">
                    <span>Est. Release: ~2-3 Working Days</span>
                    <span className="font-mono">{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )
        ) : (
          reports.length === 0 ? (
            <div className="bg-surface dark:bg-card border border-theme rounded-[28px] p-10 text-center text-xs text-text-muted space-y-2">
              <Danger size={32} className="mx-auto text-text-muted/40" />
              <p className="font-['Inter-Medium']">No community incident reports logged yet.</p>
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-surface dark:bg-card border border-theme rounded-[28px] p-5 shadow-xs space-y-3.5 transition-colors hover:border-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-['Octarine-Bold'] text-accent uppercase tracking-wider block">
                      REPORT #{rep.reference_number}
                    </span>
                    <h3 className="text-sm sm:text-base font-['Octarine-Bold'] text-text-primary truncate mt-0.5">
                      {rep.category}
                    </h3>
                  </div>
                  <StatusBadge status={rep.status || 'Under Review'} />
                </div>

                <p className="text-xs text-text-muted leading-relaxed font-['Inter-Medium']">
                  {rep.description}
                </p>

                {rep.photo_url && (
                  <div className="w-full rounded-2xl overflow-hidden bg-surface-alt dark:bg-chip border border-theme">
                    <img
                      src={rep.photo_url}
                      alt="Report Evidence"
                      className="w-full max-h-72 object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-text-muted font-['Inter-Medium'] pt-0.5">
                  <span className="flex items-center gap-1 truncate">
                    <Location size={13} className="text-accent shrink-0" />
                    <span className="truncate">{rep.barangay || 'Poblacion'}</span>
                  </span>
                  <span>{new Date(rep.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Claim QR Modal */}
      {activeQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface dark:bg-card border border-theme rounded-[32px] max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <h3 className="text-base font-['Octarine-Bold'] text-text-primary">
              Municipal Claim Pass
            </h3>
            <p className="text-xs text-text-muted font-['Inter-Medium']">
              Present this QR to the Municipal Cashier / Releasing Officer
            </p>

            <div id="main-claim-qr-container" className="p-4 bg-white rounded-2xl border border-stone-200 shadow-inner inline-block mx-auto">
              <QRCodeSVG
                value={`AGAPP-CLAIM:${activeQrModal.reference_number}:${activeQrModal.service_name || 'Document'}`}
                size={160}
                level="H"
              />
            </div>

            <div className="bg-surface-alt dark:bg-chip p-3 rounded-2xl border border-theme">
              <span className="text-[10px] text-text-muted uppercase font-['Octarine-Bold'] block">Reference Number</span>
              <span className="text-sm font-mono font-bold text-accent">{activeQrModal.reference_number}</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleDownloadQrPng(activeQrModal)}
                className="flex-1 py-2.5 rounded-full bg-surface-alt dark:bg-chip border border-theme text-text-primary font-['Octarine-Bold'] text-xs hover:bg-surface transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <DocumentDownload size={15} className="text-accent" />
                <span>Save PNG</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 rounded-full bg-accent text-accent-contrast font-['Octarine-Bold'] text-xs hover:opacity-90 transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <Printer size={15} />
                <span>Print Stub</span>
              </button>
            </div>

            <button
              onClick={() => setActiveQrModal(null)}
              className="w-full py-2.5 rounded-full border border-theme text-text-muted font-['Octarine-Bold'] text-xs hover:text-text-primary transition"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* Hidden Printable Official Receipt in DOM */}
      {activeQrModal && (
        <div className="hidden print:block">
          <OfficialTransactionReceipt
            lgu={activeLgu}
            transaction={{
              referenceNumber: activeQrModal.reference_number || 'REQ-00000',
              type: 'service',
              title: activeQrModal.service_name || 'Municipal Clearance & Permit',
              applicantName: activeQrModal.applicant_name || profile?.full_name || 'Registered Citizen',
              barangay: activeQrModal.barangay || 'Poblacion',
              dateFiled: activeQrModal.created_at || new Date().toISOString(),
              status: activeQrModal.status || 'Submitted',
              officeName: activeQrModal.office_name || 'Office of the Municipal Mayor',
              targetRelease: '2–3 Working Days (R.A. 11032 SLA)',
              claimCode: activeQrModal.claim_code,
            }}
          />
        </div>
      )}
    </div>
  );
}
