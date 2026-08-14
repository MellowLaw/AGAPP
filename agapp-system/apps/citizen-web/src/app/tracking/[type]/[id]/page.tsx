'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { useLgu } from '../../../../contexts/LguContext';
import { supabase } from '../../../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { downloadQrCodeAsPng } from '../../../../lib/qrExport';
import { OfficialTransactionReceipt } from '../../../../components/receipt/OfficialTransactionReceipt';
import { 
  ArrowLeft2, 
  Clock, 
  TickCircle, 
  Danger, 
  DocumentText, 
  Star1, 
  Location,
  Barcode,
  Printer,
  DocumentDownload,
  CloseCircle,
  Share
} from 'iconsax-react';

const SERVICE_STEPS = ['Submitted', 'Under Review', 'In Progress', 'Ready for Pickup', 'Released'];
const REPORT_STEPS = ['Submitted', 'Under Review', 'Investigating', 'In Progress', 'Resolved'];

export default function TrackingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawType = (params?.type as string) || 'service';
  const id = params?.id as string;
  const isReport = rawType === 'report';

  const { user, profile } = useAuth();
  const { activeLgu } = useLgu();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<number | null>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);

  useEffect(() => {
    if (!id) return;
    const table = isReport ? 'reports' : 'service_requests';

    async function fetchDetail() {
      setLoading(true);
      try {
        const { data: item } = await supabase.from(table).select('*').eq('id', id).single();
        if (item) {
          setData(item);
        } else {
          // Fallback mock
          setData(
            isReport
              ? {
                  id,
                  reference_number: 'REP-981245',
                  category: 'Road Damage / Pothole',
                  description: 'Deep road depression fronting the barangay health center along Rizal Street.',
                  barangay: 'Poblacion',
                  latitude: 14.1311,
                  longitude: 121.4363,
                  photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
                  status: 'In Progress',
                  created_at: new Date().toISOString(),
                }
              : {
                  id,
                  reference_number: 'REQ-109234',
                  service_type: 'Barangay Clearance Endorsement',
                  office_name: 'Barangay Affairs Desk',
                  claim_code: 'CLM-LIL-8842',
                  status: 'Ready for Pickup',
                  created_at: new Date().toISOString(),
                  form_details: {
                    applicant_name: 'Lawrence Citizen',
                    barangay: 'Poblacion',
                    purpose: 'Local Employment Application',
                  },
                }
          );
        }
      } catch (err) {
        console.error('Error loading tracking detail:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();

    // Realtime Postgres update channel
    const channel = supabase
      .channel(`realtime-tracking-${rawType}-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table, filter: `id=eq.${id}` },
        (payload) => {
          setData(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, isReport, rawType]);

  const steps = isReport ? REPORT_STEPS : SERVICE_STEPS;
  const currentStepIdx = data ? steps.indexOf(data.status) : 0;

  const handleRatingSubmit = async (stars: number) => {
    setRating(stars);
    setRatingSubmitted(true);
    try {
      const table = isReport ? 'reports' : 'service_requests';
      await supabase.from(table).update({ citizen_rating: stars }).eq('id', id);
    } catch (e) {
      console.warn('Rating update error', e);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadQrPng = () => {
    if (!data) return;
    downloadQrCodeAsPng(
      'claim-qr-pass-container',
      `AGAPP-Claim-QR-${data.reference_number || 'code'}.png`
    );
  };

  const receiptTransaction = data
    ? {
        referenceNumber: data.reference_number || 'REQ-00000',
        type: isReport ? ('report' as const) : ('service' as const),
        title: isReport ? data.category : data.service_type || 'Document Request',
        applicantName: data.form_details?.applicant_name || profile?.full_name || 'Citizen User',
        barangay: data.barangay || data.form_details?.barangay || 'Poblacion',
        dateFiled: data.created_at || new Date().toISOString(),
        status: data.status || 'Submitted',
        officeName: data.office_name,
        targetRelease: isReport ? 'Target Response: 24–48 Hours' : '2–3 Working Days (R.A. 11032 SLA)',
        amount: data.form_details?.fee || data.fee,
        description: data.description,
        claimCode: data.claim_code,
      }
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link href="/tracking" className="inline-flex items-center text-text-primary hover:opacity-70 transition font-heading text-xs">
          <ArrowLeft2 size={18} className="mr-1" />
          <span>Back to Tracker</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReceiptPreview(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface dark:bg-card border border-theme text-xs font-heading text-text-primary hover:bg-surface-alt dark:hover:bg-chip shadow-xs transition"
          >
            <DocumentText size={15} className="text-accent" />
            <span>Official Stub</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent text-accent-contrast text-xs font-heading hover:opacity-90 shadow-xs transition"
          >
            <Printer size={15} />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="p-12 text-center text-xs text-text-muted bg-surface dark:bg-card rounded-[32px] border border-theme">
          Loading tracking record...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Card */}
          <div className="bg-surface dark:bg-card rounded-[32px] border border-theme p-6 sm:p-8 shadow-sm space-y-6 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-heading uppercase text-accent block tracking-wider">
                  {isReport ? 'Geotagged Issue Report' : data.office_name || 'E-Service Application'}
                </span>
                <h1 className="text-xl font-heading text-text-primary">
                  {isReport ? data.category : data.service_type}
                </h1>
                <span className="text-xs font-mono font-bold text-text-muted mt-0.5 block">
                  Tracking Code: #{data.reference_number}
                </span>
              </div>

              <StatusBadge status={data.status || 'Submitted'} />
            </div>

            {/* Visual Stepper Timeline */}
            <div className="space-y-3">
              <span className="text-xs font-heading uppercase tracking-wider text-text-primary block">
                Processing Progress Timeline (RA 11032 SLA)
              </span>

              <div className="space-y-3 pl-2">
                {steps.map((st, i) => {
                  const done = i <= (currentStepIdx === -1 ? 0 : currentStepIdx);
                  const isCurrent = i === currentStepIdx;
                  return (
                    <div key={st} className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          done ? 'bg-emerald-500 text-white shadow-xs' : 'bg-surface-alt dark:bg-chip text-text-muted border border-theme'
                        }`}
                      >
                        {done ? <TickCircle size={14} variant="Bold" /> : i + 1}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span
                          className={`text-xs ${
                            isCurrent
                              ? 'font-heading text-text-primary'
                              : done
                              ? 'text-text-primary'
                              : 'text-text-muted'
                          }`}
                        >
                          {st}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] text-accent font-heading uppercase">Active Stage</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Service Request: Claim QR Code Pass with PNG Download */}
            {!isReport && (
              <div className="p-6 rounded-3xl bg-surface-alt dark:bg-chip border border-theme text-center space-y-4">
                <span className="text-[10px] font-heading text-accent uppercase tracking-wider block">
                  Municipal Counter Claim Pass
                </span>

                <div id="claim-qr-pass-container" className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm inline-block mx-auto">
                  <QRCodeSVG
                    value={`AGAPP-CLAIM:${data.reference_number}:${data.service_type}`}
                    size={160}
                    level="H"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-text-muted block font-['Inter-Medium']">
                    Present this Claim QR pass and reference code at the Municipal Treasury / Cashier counter.
                  </span>
                  <span className="text-sm font-mono font-heading text-text-primary block">
                    Claim ID: {data.claim_code || data.reference_number}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={handleDownloadQrPng}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface dark:bg-card border border-theme text-xs font-heading text-text-primary hover:bg-surface-alt dark:hover:bg-chip shadow-xs transition"
                  >
                    <DocumentDownload size={15} className="text-accent" />
                    <span>Save QR as PNG</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent text-accent-contrast text-xs font-heading hover:opacity-90 shadow-xs transition"
                  >
                    <Printer size={15} />
                    <span>Print Receipt Stub</span>
                  </button>
                </div>
              </div>
            )}

            {/* Issue Report: Photo & Location Details */}
            {isReport && data.photo_url && (
              <div className="space-y-3">
                <span className="text-xs font-heading uppercase tracking-wider text-text-primary block">
                  Attached Photographic Proof
                </span>
                <div className="w-full rounded-2xl overflow-hidden border border-theme bg-surface-alt dark:bg-chip">
                  <img src={data.photo_url} alt="Report proof" className="w-full max-h-80 object-cover" />
                </div>
                {data.description && (
                  <p className="text-xs text-text-muted leading-relaxed bg-surface-alt dark:bg-chip p-4 rounded-2xl border border-theme">
                    <strong className="text-text-primary">Citizen Statement:</strong> {data.description}
                  </p>
                )}
              </div>
            )}

            {/* Citizen Satisfaction Feedback (when completed) */}
            {(data.status === 'Released' || data.status === 'Resolved') && (
              <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-center space-y-3">
                <span className="text-xs font-heading text-amber-900 dark:text-amber-200 block">
                  Rate Your Experience with {activeLgu?.name || 'the LGU'}
                </span>
                {ratingSubmitted ? (
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Thank you! Your feedback helps elevate local governance quality.
                  </p>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingSubmit(star)}
                        className="p-1 text-amber-500 hover:scale-125 transition"
                      >
                        <Star1 size={24} variant={rating && rating >= star ? 'Bold' : 'Outline'} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official Transaction Receipt Stub (Print Document & Preview) */}
      {receiptTransaction && (
        <>
          {/* Printable Element in DOM for @media print */}
          <div className="hidden print:block">
            <OfficialTransactionReceipt
              lgu={activeLgu}
              transaction={receiptTransaction}
            />
          </div>

          {/* Modal Preview for Citizen */}
          {showReceiptPreview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
              <div className="bg-surface dark:bg-card border border-theme rounded-[32px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-theme pb-3">
                  <div className="flex items-center gap-2">
                    <DocumentText size={20} className="text-accent" />
                    <h3 className="text-base font-heading text-text-primary">
                      Official Transaction Stub
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowReceiptPreview(false)}
                    className="p-1 rounded-full text-text-muted hover:text-text-primary"
                  >
                    <CloseCircle size={22} />
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-stone-200 shadow-inner">
                  <OfficialTransactionReceipt
                    lgu={activeLgu}
                    transaction={receiptTransaction}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowReceiptPreview(false)}
                    className="px-4 py-2 rounded-full border border-theme text-xs font-heading text-text-muted hover:text-text-primary"
                  >
                    Close
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-5 py-2 rounded-full bg-accent text-accent-contrast text-xs font-heading hover:opacity-90 shadow-xs flex items-center gap-1.5"
                  >
                    <Printer size={16} />
                    <span>Print Document</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
