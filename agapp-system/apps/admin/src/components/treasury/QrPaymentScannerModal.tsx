'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  ScanBarcode, 
  CloseCircle, 
  Camera, 
  TickCircle, 
  Receipt21, 
  User, 
  DocumentText, 
  Money, 
  Flash, 
  Refresh2,
  SearchNormal1
} from 'iconsax-react';

interface QrPaymentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lguId: string;
  onPaymentConfirmed?: (referenceNumber: string) => void;
}

interface ScannedRecord {
  id: string;
  reference_number: string;
  service_type: string;
  citizen_name: string;
  citizen_id?: string;
  office_name: string;
  status: string;
  payment_status?: string;
  or_number?: string;
  feeNote?: string;
  created_at: string;
  form_details?: any;
}

export function QrPaymentScannerModal({
  isOpen,
  onClose,
  lguId,
  onPaymentConfirmed,
}: QrPaymentScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [scannedRecord, setScannedRecord] = useState<ScannedRecord | null>(null);

  // Cashier OR processing
  const [orNumber, setOrNumber] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setActiveTab('manual');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access not permitted or unavailable on this device. You can use the Manual / Barcode Gun tab instead.');
      setHasCamera(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();

      // Setup continuous scanning loop using BarcodeDetector if supported
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39'] });
        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && !scannedRecord) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const rawVal = barcodes[0].rawValue;
                handleCodeDetected(rawVal);
              }
            } catch {}
          }
        }, 400);
      }
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen, activeTab, facingMode, scannedRecord]);

  // Parse Raw QR Code or Manual String
  const handleCodeDetected = (rawCode: string) => {
    if (!rawCode || searching) return;
    let targetRef = rawCode.trim();

    // Check if JSON payload from AGAPP QR Pass
    try {
      if (targetRef.startsWith('{') && targetRef.endsWith('}')) {
        const parsed = JSON.parse(targetRef);
        targetRef = parsed.ref_no || parsed.reference_number || parsed.req_id || targetRef;
      }
    } catch {}

    lookupRecord(targetRef);
  };

  // Query Database for Service Request
  const lookupRecord = async (refOrId: string) => {
    setSearching(true);
    setLookupError(null);
    try {
      const cleanQuery = refOrId.trim();
      const { data, error } = await supabase
        .from('service_requests')
        .select('id, reference_number, service_type, citizen_name, citizen_id, office_name, status, form_details, created_at, lgu_services(fee_note)')
        .eq('lgu_id', lguId)
        .or(`reference_number.ilike.%${cleanQuery}%,id.eq.${cleanQuery}`)
        .maybeSingle();

      if (error || !data) {
        setLookupError(`No matching service request found for "${cleanQuery}". Please check the reference code.`);
        setScannedRecord(null);
      } else {
        const fee = (data.lgu_services as any)?.fee_note || data.form_details?.fee_note || 'Standard Municipal Clearance Fee';
        setScannedRecord({
          id: data.id,
          reference_number: data.reference_number || data.id,
          service_type: data.service_type,
          citizen_name: data.citizen_name || 'Resident',
          citizen_id: data.citizen_id,
          office_name: data.office_name,
          status: data.status,
          feeNote: fee,
          created_at: data.created_at,
          form_details: data.form_details,
        });
        setOrNumber(`OR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
      }
    } catch (err: any) {
      setLookupError('Database lookup failed: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  // Confirm In-Person Cash Payment
  const handleConfirmPayment = async () => {
    if (!scannedRecord || !orNumber.trim()) return;
    setProcessingPayment(true);
    try {
      const updatedDetails = {
        ...(scannedRecord.form_details || {}),
        payment_status: 'PAID',
        or_number: orNumber.trim(),
        paid_at: new Date().toISOString(),
        payment_method: 'CASH_OVER_THE_COUNTER',
      };

      const { error } = await supabase
        .from('service_requests')
        .update({
          status: 'In Progress',
          form_details: updatedDetails,
        })
        .eq('id', scannedRecord.id);

      if (error) throw error;

      setPaymentSuccess(true);
      if (onPaymentConfirmed) {
        onPaymentConfirmed(scannedRecord.reference_number);
      }
    } catch (err: any) {
      setLookupError('Failed to record payment: ' + err.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleReset = () => {
    setScannedRecord(null);
    setPaymentSuccess(false);
    setLookupError(null);
    setManualInput('');
    setOrNumber('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-[28px] bg-surface dark:bg-[#23201E] border border-theme shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[90vh] z-10 transition-all">
        {/* Header */}
        <div className="p-5 border-b border-theme flex items-center justify-between bg-surface-alt/40 dark:bg-chip/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center border border-accent/30">
              <ScanBarcode size={22} variant="Bold" />
            </div>
            <div>
              <h3 className="text-base font-['Octarine-Bold'] text-text-primary">
                Treasury QR Payment Scanner
              </h3>
              <p className="text-xs text-text-muted font-['Inter-Medium']">
                Fast-lane face-to-face cash payment & receipt issuance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-alt transition cursor-pointer"
          >
            <CloseCircle size={22} />
          </button>
        </div>

        {/* Tab Selector */}
        {!scannedRecord && (
          <div className="px-5 pt-4 flex items-center gap-2 border-b border-theme pb-3 shrink-0">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-['Octarine-Bold'] transition ${
                activeTab === 'camera'
                  ? 'bg-accent text-accent-contrast shadow-xs'
                  : 'bg-surface-alt dark:bg-chip text-text-muted hover:text-text-primary'
              }`}
            >
              <Camera size={16} />
              <span>Live Camera Scanner</span>
            </button>

            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-['Octarine-Bold'] transition ${
                activeTab === 'manual'
                  ? 'bg-accent text-accent-contrast shadow-xs'
                  : 'bg-surface-alt dark:bg-chip text-text-muted hover:text-text-primary'
              }`}
            >
              <SearchNormal1 size={16} />
              <span>Barcode Gun / Reference Search</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {paymentSuccess ? (
            <div className="text-center py-8 space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                <TickCircle size={36} variant="Bold" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-['Octarine-Bold'] text-text-primary">
                  Official Receipt Verified!
                </h4>
                <p className="text-xs text-text-muted max-w-md mx-auto">
                  Payment for request <strong className="text-text-primary">{scannedRecord?.reference_number}</strong> has been confirmed under Official Receipt <strong className="text-accent">{orNumber}</strong>.
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-['Inter-Medium'] pt-1">
                  ✓ Realtime status updated to Processing · Dispatched to {scannedRecord?.office_name}
                </p>
              </div>
              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-full bg-accent text-accent-contrast font-['Octarine-Bold'] text-xs hover:opacity-90 transition cursor-pointer"
                >
                  Scan Next Citizen Pass
                </button>
              </div>
            </div>
          ) : scannedRecord ? (
            /* Scanned Transaction Verification Box */
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-surface-alt dark:bg-chip border border-theme space-y-3">
                <div className="flex items-center justify-between border-b border-theme pb-2">
                  <span className="text-[11px] font-['Octarine-Bold'] text-accent uppercase tracking-wider">
                    Application Details
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                    Pending Cash Payment
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-text-muted block">Reference Number:</span>
                    <span className="font-['Octarine-Bold'] text-text-primary">{scannedRecord.reference_number}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Applicant Name:</span>
                    <span className="font-['Octarine-Bold'] text-text-primary">{scannedRecord.citizen_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Service Requested:</span>
                    <span className="font-['Octarine-Bold'] text-text-primary">{scannedRecord.service_type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Assigned Department:</span>
                    <span className="font-['Octarine-Bold'] text-text-primary">{scannedRecord.office_name}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Money size={18} className="text-accent" />
                    <span className="text-xs font-['Octarine-Bold'] text-text-primary">Fee Schedule:</span>
                  </div>
                  <span className="text-xs font-['Octarine-Bold'] text-accent">{scannedRecord.feeNote}</span>
                </div>
              </div>

              {/* Official Receipt (OR) Input */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-['Octarine-Bold'] text-text-primary">
                  Official Receipt (OR) Number:
                </label>
                <div className="relative">
                  <Receipt21 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. OR-2026-98124"
                    value={orNumber}
                    onChange={(e) => setOrNumber(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface dark:bg-card border border-theme text-sm text-text-primary font-mono focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs font-['Octarine-Bold'] text-text-muted hover:text-text-primary transition"
                >
                  Cancel / Re-scan
                </button>

                <button
                  type="button"
                  disabled={processingPayment || !orNumber.trim()}
                  onClick={handleConfirmPayment}
                  className="flex-1 py-3 rounded-2xl bg-accent text-accent-contrast text-xs font-['Octarine-Bold'] shadow-md hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{processingPayment ? 'Confirming Payment...' : 'Confirm Cash Payment & Issue OR'}</span>
                  <TickCircle size={16} />
                </button>
              </div>
            </div>
          ) : activeTab === 'camera' ? (
            /* Mode A: Camera Scanner View */
            <div className="space-y-4">
              <div className="relative w-full aspect-video sm:aspect-[4/3] rounded-2xl bg-black overflow-hidden flex items-center justify-center border border-theme">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Animated Scanner Viewport Reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 border-2 border-accent/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-x-2 top-0 h-0.5 bg-accent shadow-[0_0_8px_#E63946] animate-pulse" />
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-accent" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-accent" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-accent" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-accent" />
                  </div>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 text-center text-xs text-rose-300">
                    {cameraError}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-text-muted font-['Inter-Medium'] px-1">
                <span>Align the citizen&apos;s QR Payment Pass in the frame.</span>
                <button
                  type="button"
                  onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                  className="flex items-center gap-1.5 text-accent font-bold hover:underline cursor-pointer"
                >
                  <Refresh2 size={14} />
                  <span>Switch Camera</span>
                </button>
              </div>
            </div>
          ) : (
            /* Mode B: Manual Reference Number or Barcode Gun View */
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="block text-xs font-['Octarine-Bold'] text-text-primary">
                  Scan Barcode Gun or Type Reference Number:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. REQ-2026-0816 or Paste QR code string..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCodeDetected(manualInput);
                      }
                    }}
                    className="flex-1 px-4 py-3 rounded-2xl bg-surface dark:bg-card border border-theme text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent"
                  />
                  <button
                    type="button"
                    disabled={searching || !manualInput.trim()}
                    onClick={() => handleCodeDetected(manualInput)}
                    className="px-5 py-3 rounded-2xl bg-accent text-accent-contrast font-['Octarine-Bold'] text-xs hover:opacity-90 disabled:opacity-50 transition cursor-pointer"
                  >
                    {searching ? 'Looking up...' : 'Search'}
                  </button>
                </div>
              </div>

              {lookupError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl">
                  {lookupError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
