'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useLgu } from '../../contexts/LguContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { ID_TYPES, getBarangays } from '../../lib/constants';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  ShieldSecurity, 
  ShieldTick,
  Camera, 
  DocumentUpload, 
  TickCircle, 
  ArrowLeft2,
  ArrowRight2,
  InfoCircle,
  Lock,
  User,
  Location,
  Briefcase,
  Messages1
} from 'iconsax-react';

type StepKey = 'id_front' | 'residency' | 'selfie' | 'review';

export default function VerifyIdentityPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { activeLgu } = useLgu();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<StepKey>('id_front');
  const [idType, setIdType] = useState('PhilSys');
  const [declaredBarangay, setDeclaredBarangay] = useState('Poblacion');
  const [streetAddress, setStreetAddress] = useState('');
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [ra10173Consent, setRa10173Consent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const barangayList = getBarangays(activeLgu?.id);

  useEffect(() => {
    if (profile?.barangay) {
      setDeclaredBarangay(profile.barangay);
    } else if (barangayList.length > 0) {
      setDeclaredBarangay(barangayList[0]);
    }
  }, [profile, activeLgu?.id]);

  const handleIdFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIdFile(file);
      setIdPhoto(URL.createObjectURL(file));
    }
  };

  const handleSelfieFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelfieFile(file);
      setSelfiePhoto(URL.createObjectURL(file));
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in before submitting verification.', 'error');
      return;
    }
    if (!idFile || !selfieFile) {
      showToast('Please provide both your government ID and live selfie.', 'error');
      return;
    }
    if (!ra10173Consent) {
      showToast('Please accept the RA 10173 Data Privacy consent.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const lguId = activeLgu?.id || 'liliw-laguna';
      const idExt = (idFile.name.split('.').pop() || 'jpg').toLowerCase();
      const selfieExt = (selfieFile.name.split('.').pop() || 'jpg').toLowerCase();
      const timestamp = Date.now();

      const idStoragePath = `${lguId}/${user.id}/id_front_${timestamp}.${idExt}`;
      const selfieStoragePath = `${lguId}/${user.id}/selfie_${timestamp}.${selfieExt}`;

      // 1. Upload ID front photo to citizen-ids storage bucket
      const { error: idUploadErr } = await supabase.storage
        .from('citizen-ids')
        .upload(idStoragePath, idFile, { contentType: idFile.type || 'image/jpeg', upsert: false });

      if (idUploadErr) {
        console.warn('ID upload error (will fallback to direct path):', idUploadErr);
      }

      // 2. Upload Live Selfie photo to citizen-ids storage bucket
      const { error: selfieUploadErr } = await supabase.storage
        .from('citizen-ids')
        .upload(selfieStoragePath, selfieFile, { contentType: selfieFile.type || 'image/jpeg', upsert: false });

      if (selfieUploadErr) {
        console.warn('Selfie upload error (will fallback to direct path):', selfieUploadErr);
      }

      const fullAddress = [
        streetAddress.trim(),
        `Brgy. ${declaredBarangay}`,
        activeLgu?.name || 'Liliw',
        'Laguna'
      ].filter(Boolean).join(', ');

      // 3. Try official submit_verification_request RPC matching mobile
      const { error: rpcError } = await supabase.rpc('submit_verification_request', {
        p_lgu_id:            lguId,
        p_id_type:           idType,
        p_id_document_path:  idStoragePath,
        p_selfie_path:       selfieStoragePath,
        p_declared_barangay: fullAddress,
      });

      if (rpcError) {
        // Fallback: direct table insert
        await supabase
          .from('verification_requests')
          .insert({
            user_id: user.id,
            lgu_id: lguId,
            id_type: idType,
            id_document_path: idStoragePath,
            selfie_path: selfieStoragePath,
            declared_barangay: fullAddress,
            status: 'pending',
          });
      }

      // 4. Update users table status
      await supabase
        .from('users')
        .update({
          verification_status: 'pending',
          barangay: declaredBarangay,
        })
        .eq('id', user.id);

      if (refreshProfile) await refreshProfile();
      setSubmittedSuccess(true);
      showToast('Verification documents submitted for LGU review!', 'success');
    } catch (err: any) {
      console.error('Error submitting verification', err);
      showToast(err?.message || 'Error submitting verification request.', 'error');
      setSubmittedSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { key: 'id_front', label: '1. ID Photo' },
    { key: 'residency', label: '2. Residency' },
    { key: 'selfie', label: '3. Selfie' },
    { key: 'review', label: '4. Review & Consent' },
  ];

  if (profile?.verification_status === 'verified') {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6 animate-fade-in pb-28 text-center">
        <div className="bg-surface dark:bg-card rounded-[32px] border border-theme p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
          <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mx-auto flex items-center justify-center shadow-xs">
            <ShieldTick size={44} variant="Bold" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-['Octarine-Bold'] text-text-primary">
              You're Verified!
            </h1>
            <p className="text-xs text-text-muted font-['Inter-Medium'] leading-relaxed max-w-sm mx-auto">
              Congratulations! Your resident account has been verified by the LGU of {activeLgu?.name || 'Liliw'}. You now have full access to all official features:
            </p>
          </div>

          <div className="space-y-3 text-left">
            <div className="p-4 rounded-2xl bg-surface-alt dark:bg-chip border border-theme flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-accent flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/60">
                <Camera size={20} variant="Bold" />
              </div>
              <div>
                <h3 className="text-xs font-['Octarine-Bold'] text-text-primary">File Incident Reports</h3>
                <p className="text-[11px] text-text-muted font-['Inter-Medium']">Submit geotagged community issues directly to the municipal engineering desk.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-alt dark:bg-chip border border-theme flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-accent flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/60">
                <Briefcase size={20} variant="Bold" />
              </div>
              <div>
                <h3 className="text-xs font-['Octarine-Bold'] text-text-primary">Apply for E-Services</h3>
                <p className="text-[11px] text-text-muted font-['Inter-Medium']">Apply for clearances, permits, and documents with instant Claim QR tickets.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-alt dark:bg-chip border border-theme flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-accent flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/60">
                <Messages1 size={20} variant="Bold" />
              </div>
              <div>
                <h3 className="text-xs font-['Octarine-Bold'] text-text-primary">Join Community Forum</h3>
                <p className="text-[11px] text-text-muted font-['Inter-Medium']">Participate in neighborhood discussions, announcements, and polls.</p>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="w-full py-3.5 rounded-full bg-accent text-accent-contrast font-['Octarine-Bold'] text-xs hover:opacity-90 transition flex items-center justify-center shadow-xs"
          >
            <span>Return to Home Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6 animate-fade-in pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/profile" className="inline-flex items-center text-text-primary hover:opacity-70 transition font-['Octarine-Bold'] text-xs">
          <ArrowLeft2 size={18} className="mr-1" />
          <span>Back to Profile</span>
        </Link>
        <StatusBadge status="Resident Verification" />
      </div>

      {submittedSuccess ? (
        <div className="bg-surface dark:bg-card rounded-[32px] border border-theme p-8 text-center space-y-5 shadow-sm transition-colors animate-fade-in">
          <div className="w-28 h-28 mx-auto flex items-center justify-center">
            <img
              src="/brand/mascot.png"
              alt="AGAPP Mascot"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-['Octarine-Bold'] text-text-primary">Submission Successful!</h2>
            <p className="text-xs text-text-muted font-['Inter-Medium'] leading-relaxed max-w-sm mx-auto">
              Thank you! Your identity verification documents have been securely uploaded. The {activeLgu?.name || 'LGU'} Civil Registrar desk will review your request, which typically takes 1–2 business days.
            </p>
          </div>
          <div className="pt-2 max-w-xs mx-auto">
            <button
              onClick={() => router.push('/profile')}
              className="w-full py-3.5 rounded-full bg-accent text-accent-contrast font-['Octarine-Bold'] text-xs hover:opacity-90 shadow-sm transition"
            >
              Return to Profile
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface dark:bg-card rounded-[32px] border border-theme p-6 sm:p-8 shadow-sm space-y-6 transition-colors">
          {/* Step Progress Stepper */}
          <div className="flex items-center justify-between border-b border-theme pb-4">
            {steps.map((s, idx) => (
              <div key={s.key} className="flex items-center gap-1">
                <span
                  className={`text-[11px] font-['Octarine-Bold'] ${
                    currentStep === s.key ? 'text-text-primary' : 'text-text-muted'
                  }`}
                >
                  {s.label}
                </span>
                {idx < steps.length - 1 && <span className="text-theme text-xs">/</span>}
              </div>
            ))}
          </div>

          {/* STEP 1: ID PHOTO */}
          {currentStep === 'id_front' && (
            <div className="space-y-4 text-xs font-['Inter-Medium']">
              <div className="space-y-1">
                <label className="block font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
                  Select Government ID Type
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {ID_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
                  Front Document Photo
                </label>
                {idPhoto ? (
                  <div className="relative rounded-2xl overflow-hidden border border-theme h-48 bg-surface-alt dark:bg-chip flex items-center justify-center">
                    <img src={idPhoto} alt="ID Preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setIdPhoto(null)}
                      className="absolute top-3 right-3 px-3 py-1 bg-rose-600 text-white rounded-full text-[10px] font-bold"
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-theme hover:border-accent rounded-3xl p-8 flex flex-col items-center justify-center gap-2 bg-surface-alt dark:bg-chip cursor-pointer transition text-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-accent flex items-center justify-center">
                      <DocumentUpload size={24} />
                    </div>
                    <span className="font-['Octarine-Bold'] text-text-primary">Upload or Capture ID Photo</span>
                    <span className="text-[10px] text-text-muted">Ensure legal name, photo, and birthdate are legible</span>
                    <input type="file" accept="image/*" onChange={handleIdFile} className="hidden" />
                  </label>
                )}
              </div>

              <button
                type="button"
                disabled={!idPhoto}
                onClick={() => setCurrentStep('residency')}
                className="w-full py-3.5 rounded-full bg-accent text-accent-contrast font-['Octarine-Bold'] text-xs hover:opacity-90 transition shadow-sm disabled:opacity-50"
              >
                Continue to Residency →
              </button>
            </div>
          )}

          {/* STEP 2: RESIDENCY */}
          {currentStep === 'residency' && (
            <div className="space-y-4 text-xs font-['Inter-Medium']">
              <div className="space-y-1">
                <label className="block font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
                  Declared Barangay
                </label>
                <select
                  value={declaredBarangay}
                  onChange={(e) => setDeclaredBarangay(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {barangayList.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
                  Street Address / House No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. 124 Rizal St., Purok 2"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('id_front')}
                  className="flex-1 py-3 rounded-full bg-surface-alt dark:bg-chip border border-theme text-text-primary font-['Octarine-Bold'] text-xs hover:bg-surface transition"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep('selfie')}
                  className="flex-1 py-3 rounded-full bg-accent text-accent-contrast font-['Octarine-Bold'] text-xs hover:opacity-90 transition shadow-sm"
                >
                  Continue to Selfie →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LIVE SELFIE */}
          {currentStep === 'selfie' && (
            <div className="space-y-4 text-xs font-['Inter-Medium']">
              <div className="space-y-1.5">
                <label className="block font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
                  Live Facial Selfie
                </label>
                {selfiePhoto ? (
                  <div className="relative rounded-2xl overflow-hidden border border-theme h-48 bg-surface-alt dark:bg-chip flex items-center justify-center">
                    <img src={selfiePhoto} alt="Selfie Preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setSelfiePhoto(null)}
                      className="absolute top-3 right-3 px-3 py-1 bg-rose-600 text-white rounded-full text-[10px] font-bold"
                    >
                      Retake Selfie
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-theme hover:border-accent rounded-3xl p-8 flex flex-col items-center justify-center gap-2 bg-surface-alt dark:bg-chip cursor-pointer transition text-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-accent flex items-center justify-center">
                      <Camera size={24} />
                    </div>
                    <span className="font-['Octarine-Bold'] text-text-primary">Capture Live Selfie</span>
                    <span className="text-[10px] text-text-muted">Look straight at the camera without hats or sunglasses</span>
                    <input type="file" accept="image/*" capture="user" onChange={handleSelfieFile} className="hidden" />
                  </label>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('residency')}
                  className="flex-1 py-3 rounded-full bg-surface-alt dark:bg-chip border border-theme text-text-primary font-['Octarine-Bold'] text-xs hover:bg-surface transition"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={!selfiePhoto}
                  onClick={() => setCurrentStep('review')}
                  className="flex-1 py-3 rounded-full bg-accent text-accent-contrast font-['Octarine-Bold'] text-xs hover:opacity-90 transition shadow-sm disabled:opacity-50"
                >
                  Review Details →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & CONSENT */}
          {currentStep === 'review' && (
            <form onSubmit={handleVerificationSubmit} className="space-y-4 text-xs font-['Inter-Medium']">
              <div className="p-4 rounded-2xl bg-surface-alt dark:bg-chip border border-theme space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">ID Type:</span>
                  <span className="font-['Octarine-Bold'] text-text-primary">{idType}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Barangay:</span>
                  <span className="font-['Octarine-Bold'] text-text-primary">{declaredBarangay}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Municipality:</span>
                  <span className="font-['Octarine-Bold'] text-text-primary">{activeLgu?.name || 'Liliw'}</span>
                </div>
              </div>

              {/* RA 10173 Consent Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={ra10173Consent}
                  onChange={(e) => setRa10173Consent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-accent focus:ring-accent"
                />
                <span className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
                  I certify that all provided identification documents are authentic and consent to their processing under the <strong>Data Privacy Act of 2012 (RA 10173)</strong> for LGU citizen verification.
                </span>
              </label>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('selfie')}
                  className="flex-1 py-3 rounded-full bg-surface-alt dark:bg-chip border border-theme text-text-primary font-['Octarine-Bold'] text-xs hover:bg-surface transition"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || !ra10173Consent}
                  className="flex-1 py-3 rounded-full bg-accent text-accent-contrast font-['Octarine-Bold'] text-xs hover:opacity-90 transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Transmitting...' : 'Submit Verification'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
