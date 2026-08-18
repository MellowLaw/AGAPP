'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLgu } from '../../contexts/LguContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { getBarangays } from '../../lib/constants';
import { LocationPickerMap } from '../../components/map/LocationPickerMap';
import { AuthGate } from '../../components/auth/AuthGate';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  Camera, 
  Location, 
  Danger, 
  Drop, 
  Pet, 
  Flash, 
  TickCircle, 
  CloseCircle,
  Trash,
  ShieldSecurity,
  ShieldTick,
  InfoCircle,
  ArrowRight,
  ArrowLeft2,
  Gps,
  Call,
  DocumentText,
  Clock,
  Car
} from 'iconsax-react';

const REPORT_CATEGORIES = [
  { 
    id: 'pothole', 
    label: 'Road Damage / Pothole', 
    shortLabel: 'Pothole',
    icon: Car, 
    desc: 'Potholes, asphalt cracks, damaged curbs, or dangerous road depressions.',
    color: 'bg-amber-500 text-white shadow-xs' 
  },
  { 
    id: 'clogged_drainage', 
    label: 'Clogged Drainage / Canal', 
    shortLabel: 'Drainage',
    icon: Drop, 
    desc: 'Blockages in roadside storm canals, culverts, or street flooding.',
    color: 'bg-blue-600 text-white shadow-xs' 
  },
  { 
    id: 'stray_animal', 
    label: 'Stray Pets & Animals', 
    shortLabel: 'Stray Pets',
    icon: Pet, 
    desc: 'Aggressive stray dogs, unvaccinated animals, or public safety pet concerns.',
    color: 'bg-emerald-600 text-white shadow-xs' 
  },
  { 
    id: 'damaged_pole', 
    label: 'Damaged Utility Pole', 
    shortLabel: 'Damaged Pole',
    icon: Flash, 
    desc: 'Leaning power poles, dangling electrical wires, or broken streetlights.',
    color: 'bg-rose-600 text-white shadow-xs' 
  },
];

function IssueReportingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get('category');
  const { activeLgu } = useLgu();
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [showForm, setShowForm] = useState(!!initialCategory);
  const [activeTab, setActiveTab] = useState<'categories' | 'my_reports'>('categories');
  const [myReports, setMyReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState(initialCategory || 'pothole');
  const [description, setDescription] = useState('');
  const [barangay, setBarangay] = useState('Poblacion');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [latitude, setLatitude] = useState(activeLgu?.latitude || 14.1311);
  const [longitude, setLongitude] = useState(activeLgu?.longitude || 121.4363);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const barangayList = getBarangays(activeLgu?.id);
  const isVerified = profile?.verification_status === 'verified';

  useEffect(() => {
    if (barangayList.length > 0) {
      setBarangay(barangayList[0]);
    }
    if (activeLgu?.latitude && activeLgu?.longitude) {
      setLatitude(activeLgu.latitude);
      setLongitude(activeLgu.longitude);
    }
  }, [activeLgu?.id, activeLgu?.latitude, activeLgu?.longitude]);

  // Load User's Own Submitted Reports ONLY (Private between Citizen & LGU)
  const fetchMyReports = async () => {
    if (!user?.id) return;
    setLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('citizen_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMyReports(data);
      }
    } catch (e) {
      console.warn('Error fetching citizen reports:', e);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchMyReports();
    }
  }, [user?.id, activeLgu?.id]);

  // If Guest, show mobile AuthGate
  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 pb-28">
        <AuthGate
          title="Get the Full Experience!"
          subtitle="Sign in to submit geotagged incident reports, access municipal dispatch, and track repair resolutions."
        />
      </div>
    );
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showToast('Photo size must be less than 10MB.', 'error');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleGetLiveGps = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setLocating(false);
          showToast('GPS coordinates locked successfully.', 'success');
        },
        (err) => {
          console.warn('Geolocation fallback', err);
          setLocating(false);
          showToast('GPS signal unavailable. You can drag the pin on the map to pinpoint location.', 'info');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const handleWithdrawReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to withdraw this report? This action cannot be undone.')) return;
    setWithdrawingId(reportId);
    try {
      const { error } = await supabase.rpc('cancel_report', { p_report_id: reportId });
      if (error) {
        // Fallback to direct update if allowed
        const { error: updateErr } = await supabase
          .from('reports')
          .update({ status: 'Cancelled' })
          .eq('id', reportId)
          .eq('citizen_id', user.id);
        
        if (updateErr) {
          showToast(error.message || 'Could not withdraw report.', 'error');
          return;
        }
      }
      showToast('Report withdrawn successfully.', 'success');
      fetchMyReports();
    } catch (err: any) {
      showToast(err.message || 'Error withdrawing report.', 'error');
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      showToast('Verification Required: You must verify your identity before filing reports.', 'info');
      router.push('/verify');
      return;
    }
    if (!description.trim()) {
      showToast('Please provide a brief description of the incident.', 'error');
      return;
    }
    if (!photoFile) {
      showToast('Photo evidence is mandatory. Please capture or attach a photo.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl = '';
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('report-photos')
        .upload(fileName, photoFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.warn('Storage upload error, using placeholder', uploadError);
        photoUrl = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80';
      } else if (uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('report-photos')
          .getPublicUrl(fileName);
        photoUrl = publicUrlData.publicUrl;
      }

      const refCode = `REP-${Date.now().toString().slice(-6)}`;
      const payload = {
        lgu_id: activeLgu?.id || 'liliw-laguna',
        citizen_id: user.id,
        citizen_name: profile?.full_name || 'Citizen',
        category,
        description,
        barangay,
        latitude,
        longitude,
        photo_url: photoUrl,
        reference_number: refCode,
        status: 'Submitted',
      };

      const { data, error } = await supabase
        .from('reports')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      showToast(`Report submitted successfully! Reference: ${refCode}`, 'success');
      setDescription('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setShowForm(false);
      setActiveTab('my_reports');
      fetchMyReports();
    } catch (err: any) {
      console.error('Submission failed', err);
      showToast(`Failed to submit report: ${err.message || 'Please try again.'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── FILING FORM VIEW ────────────────────────────────────────────────────────
  if (showForm) {
    const activeCategoryObj = REPORT_CATEGORIES.find((c) => c.id === category) || REPORT_CATEGORIES[0];

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 space-y-6 pb-28 animate-fade-in">
        {/* Top Header */}
        <div className="flex items-center gap-3 border-b border-theme/60 pb-4">
          <button
            onClick={() => setShowForm(false)}
            className="w-10 h-10 rounded-full bg-surface-alt dark:bg-chip border border-theme flex items-center justify-center text-text-primary hover:bg-surface transition shadow-2xs"
          >
            <ArrowLeft2 size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-text-primary leading-tight">
              {activeCategoryObj.label}
            </h1>
            <p className="text-xs text-text-muted font-['Inter-Medium']">
              Filing form · automatic timestamp & GPS coordinate stamp
            </p>
          </div>
        </div>

        {/* Desktop Split Form Layout */}
        <form onSubmit={handleSubmit} className="bg-surface dark:bg-card rounded-[28px] border border-theme p-6 sm:p-8 shadow-xs transition-colors">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Column: Form Details (Col 1-6) */}
            <div className="lg:col-span-6 space-y-5">
              {/* Category Switcher Pill List */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-heading text-text-muted uppercase tracking-wider">
                  Selected Incident Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {REPORT_CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    const IconComp = cat.icon;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition ${
                          isSelected
                            ? 'bg-surface-alt dark:bg-chip border-accent ring-1 ring-accent text-text-primary'
                            : 'bg-surface dark:bg-card border-theme text-text-muted hover:border-accent'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${cat.color}`}>
                          <IconComp size={16} variant="Bold" />
                        </div>
                        <span className="text-xs font-heading truncate">{cat.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-heading text-text-muted uppercase tracking-wider">
                  Incident Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the issue (e.g. Deep road depression near the barangay health center, overflowing storm drain...)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs font-['Inter-Medium'] text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent resize-none shadow-2xs"
                />
              </div>

              {/* Barangay Location */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-heading text-text-muted uppercase tracking-wider">
                  Barangay *
                </label>
                <select
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs font-heading text-text-primary outline-none focus:ring-1 focus:ring-accent shadow-2xs"
                >
                  {barangayList.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Mandatory Photo Evidence Capture */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-heading text-text-muted uppercase tracking-wider">
                    Photo Evidence (Mandatory) *
                  </label>
                  <span className="text-[10px] text-accent font-['Inter-Medium']">Live Camera / Clear Photo</span>
                </div>

                {photoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-theme bg-stone-900">
                    <img src={photoPreview} alt="Evidence preview" className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-3 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-heading">{barangay}, {activeLgu?.name || 'Liliw'}</p>
                          <p className="text-[10px] text-stone-300 font-mono">Lat {latitude.toFixed(5)}, Long {longitude.toFixed(5)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                          className="p-1.5 rounded-full bg-rose-600/90 text-white hover:bg-rose-700 transition"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-theme hover:border-accent rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-surface-alt dark:bg-chip transition">
                    <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                      <Camera size={22} variant="Bold" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-heading text-text-primary">Take Photo or Upload Image</p>
                      <p className="text-[10px] text-text-muted font-['Inter-Medium']">Take on-site clear photo for rapid dispatch</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Right Column: Location Map & Submit Action (Col 7-12) */}
            <div className="lg:col-span-6 space-y-5 flex flex-col justify-between">
              {/* Location Pinpoint Map */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-heading text-text-muted uppercase tracking-wider">
                    Geotagged Location (GPS Pin)
                  </label>
                  <button
                    type="button"
                    onClick={handleGetLiveGps}
                    disabled={locating}
                    className="inline-flex items-center gap-1 text-[11px] font-heading text-accent hover:underline"
                  >
                    <Gps size={13} className={locating ? 'animate-spin' : ''} />
                    <span>{locating ? 'Locating...' : 'Get Live GPS'}</span>
                  </button>
                </div>

                <div className="rounded-2xl overflow-hidden border border-theme h-64 lg:h-72">
                  <LocationPickerMap
                    lat={latitude}
                    lng={longitude}
                    onLocationChange={(lat: number, lng: number) => { setLatitude(lat); setLongitude(lng); }}
                  />
                </div>
                <p className="text-[10px] text-text-muted font-['Inter-Medium'] flex items-center gap-1">
                  <Location size={12} className="text-accent shrink-0" />
                  <span>Drag the marker pin directly on the map to indicate the exact spot.</span>
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-theme/60">
                {!isVerified ? (
                  <Link
                    href="/verify"
                    className="w-full py-3.5 rounded-full bg-rose-600 text-white font-heading text-xs hover:bg-rose-700 transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <ShieldSecurity size={16} />
                    <span>Verification Required to Submit</span>
                  </Link>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-full bg-accent text-accent-contrast font-heading text-xs hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-accent-contrast/20 border-t-accent-contrast rounded-full animate-spin" />
                        <span>Transmitting Report...</span>
                      </>
                    ) : (
                      <>
                        <TickCircle size={16} variant="Bold" />
                        <span>Submit Official Report</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ── MAIN SCREEN: CATEGORY GRID + TUTORIAL & MY SUBMISSIONS ──────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 space-y-6 pb-28 animate-fade-in">
      {/* Title & Subtitle */}
      <div className="space-y-1 pt-1">
        <h1 className="text-3xl font-heading text-text-primary tracking-tight">
          Report.
        </h1>
        <p className="text-xs text-text-muted font-['Inter-Medium'] leading-relaxed">
          Help us improve our town. File a municipal report for public hazards directly to local engineering and public safety departments.
        </p>
      </div>

      {/* Restricted Status Notice */}
      {profile?.moderation_status === 'restricted' && (
        <Link
          href="/restricted"
          className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200 font-heading"
        >
          <div className="flex items-center gap-2">
            <Danger size={18} className="text-rose-600 shrink-0" variant="Bold" />
            <span>Your account has temporary reporting restrictions.</span>
          </div>
          <span>View Notice &rarr;</span>
        </Link>
      )}

      {/* Clean 2-Tab Bar (Matches Mobile Architecture) */}
      <div className="flex items-center border-b border-theme gap-6 text-sm">
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 font-heading transition relative ${
            activeTab === 'categories'
              ? 'text-text-primary'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <span>File a Report</span>
          {activeTab === 'categories' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('my_reports')}
          className={`pb-3 font-heading transition relative flex items-center gap-1.5 ${
            activeTab === 'my_reports'
              ? 'text-text-primary'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <span>My Submissions</span>
          <span className={`px-2 py-0.2 rounded-full text-[10px] ${
            activeTab === 'my_reports' ? 'bg-accent text-accent-contrast' : 'bg-surface-alt dark:bg-chip text-text-muted'
          }`}>
            {myReports.length}
          </span>
          {activeTab === 'my_reports' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
          )}
        </button>
      </div>

      {/* ── TAB 1: FILE A REPORT (CATEGORY GRID + TUTORIAL & RULES) ── */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* 1. Category Selection 2x2 Grid */}
          <div className="space-y-3">
            <h2 className="text-xs font-heading text-text-muted uppercase tracking-wider">
              Select Incident Category
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {REPORT_CATEGORIES.map((cat) => {
                const IconComp = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (!user) {
                        showToast('Sign in required to file incident reports.', 'info');
                        router.push('/auth/login');
                        return;
                      }
                      if (!isVerified) {
                        showToast('Identity verification required to file official community reports.', 'info');
                        router.push('/verify');
                        return;
                      }
                      setCategory(cat.id);
                      setShowForm(true);
                    }}
                    className="p-5 rounded-[24px] bg-surface dark:bg-card border border-theme text-left hover:border-accent hover:shadow-md transition duration-200 group flex flex-col justify-between h-36 cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${cat.color}`}>
                      <IconComp size={22} variant="Bold" />
                    </div>
                    <div>
                      <h3 className="text-sm font-heading text-text-primary group-hover:text-accent transition leading-snug">
                        {cat.label}
                      </h3>
                      <p className="text-[11px] text-text-muted font-['Inter-Medium'] line-clamp-1 pt-0.5">
                        Click to file incident report &rarr;
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Comprehensive Reporting Tutorial & Guidelines Card */}
          <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-5 shadow-xs space-y-5 transition-colors">
            {/* Tutorial Header */}
            <div className="border-b border-theme pb-3 space-y-1">
              <div className="flex items-center gap-2">
                <InfoCircle size={18} className="text-accent" variant="Bold" />
                <h3 className="text-sm font-heading text-text-primary">
                  Citizen Reporting Guide & Rules
                </h3>
              </div>
              <p className="text-[11px] text-text-muted font-['Inter-Medium'] leading-relaxed">
                Follow these municipal guidelines to ensure fast evaluation and field dispatch by local authorities.
              </p>
            </div>

            {/* How It Works: 4 Quick Steps */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-heading text-text-muted uppercase tracking-wider">
                How Reporting Works (4 Steps)
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-heading text-text-primary">
                    <span className="w-5 h-5 rounded-full bg-accent text-accent-contrast flex items-center justify-center text-[10px]">1</span>
                    <span>Pick Category</span>
                  </div>
                  <p className="text-[10px] text-text-muted font-['Inter-Medium'] leading-normal pl-6">
                    Select the matching public hazard type.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-heading text-text-primary">
                    <span className="w-5 h-5 rounded-full bg-accent text-accent-contrast flex items-center justify-center text-[10px]">2</span>
                    <span>Live Photo</span>
                  </div>
                  <p className="text-[10px] text-text-muted font-['Inter-Medium'] leading-normal pl-6">
                    Capture clear photo evidence on-site.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-heading text-text-primary">
                    <span className="w-5 h-5 rounded-full bg-accent text-accent-contrast flex items-center justify-center text-[10px]">3</span>
                    <span>GPS Pinpoint</span>
                  </div>
                  <p className="text-[10px] text-text-muted font-['Inter-Medium'] leading-normal pl-6">
                    Coordinates lock automatically on the map.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-heading text-text-primary">
                    <span className="w-5 h-5 rounded-full bg-accent text-accent-contrast flex items-center justify-center text-[10px]">4</span>
                    <span>Dispatch</span>
                  </div>
                  <p className="text-[10px] text-text-muted font-['Inter-Medium'] leading-normal pl-6">
                    Track engineer verification in real-time.
                  </p>
                </div>
              </div>
            </div>

            {/* DO's: What CAN be reported */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-heading text-xs">
                <TickCircle size={16} variant="Bold" className="text-emerald-600 dark:text-emerald-400" />
                <span>What CAN be reported via AGAPP:</span>
              </div>
              <ul className="space-y-1.5 pl-6 text-[11px] text-text-muted font-['Inter-Medium'] list-disc">
                <li><strong className="font-heading text-text-primary">Road Hazards:</strong> Potholes, asphalt collapses, open manholes on public streets.</li>
                <li><strong className="font-heading text-text-primary">Drainage & Flood:</strong> Clogged public canals, overflowing road gutters after storms.</li>
                <li><strong className="font-heading text-text-primary">Utility Infrastructure:</strong> Leaning electric posts, dangerous low-hanging wires.</li>
                <li><strong className="font-heading text-text-primary">Public Safety:</strong> Aggressive stray dogs or unvaccinated animals in public parks.</li>
              </ul>
            </div>

            {/* DON'Ts: What CANNOT be reported */}
            <div className="space-y-2 pt-1 border-t border-theme">
              <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-heading text-xs pt-3">
                <CloseCircle size={16} variant="Bold" className="text-rose-600 dark:text-rose-400" />
                <span>What CANNOT be reported here:</span>
              </div>
              <ul className="space-y-1.5 pl-6 text-[11px] text-text-muted font-['Inter-Medium'] list-disc">
                <li><strong className="font-heading text-text-primary">Private Property Disputes:</strong> Boundary conflicts, tenant issues, or home interior repairs.</li>
                <li><strong className="font-heading text-text-primary">Immediate Emergencies:</strong> Active fires, armed crimes, or severe medical distress &mdash; <Link href="/emergency" className="text-rose-800 dark:text-rose-300 font-heading underline">Call 911 / Hotlines directly</Link>.</li>
                <li><strong className="font-heading text-text-primary">False / Prank Reports:</strong> Uploading stock or misleading photos will trigger automated fraud detection and account suspension.</li>
              </ul>
            </div>

            {/* Emergency Hotline Banner */}
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <Call size={16} variant="Bold" />
                </div>
                <div>
                  <h5 className="text-xs font-heading text-rose-900 dark:text-rose-200">Immediate Life Danger?</h5>
                  <p className="text-[10px] text-rose-700 dark:text-rose-300 font-['Inter-Medium']">Dial 911 or tap for municipal hotlines</p>
                </div>
              </div>
              <Link
                href="/emergency"
                className="px-3 py-1.5 rounded-full bg-rose-600 text-white font-heading text-[11px] hover:bg-rose-700 transition"
              >
                Hotlines &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MY SUBMISSIONS (ONLY LOGGED-IN CITIZEN REPORTS) ── */}
      {activeTab === 'my_reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-heading text-text-muted uppercase tracking-wider">
              Your Incident Submissions ({myReports.length})
            </h2>
            {user && (
              <button
                onClick={fetchMyReports}
                className="text-[11px] font-heading text-accent hover:underline"
              >
                Refresh
              </button>
            )}
          </div>

          {!user ? (
            <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-4 shadow-xs">
              <AuthGate
                title="Track Your Submitted Reports"
                subtitle="Sign in with your verified resident account to view live resolution updates, engineer dispatches, and repair photos for your submitted reports."
              />
            </div>
          ) : loadingReports ? (
            <div className="p-12 text-center text-xs text-text-muted bg-surface dark:bg-card rounded-[28px] border border-theme space-y-2">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading your submissions...</p>
            </div>
          ) : myReports.length === 0 ? (
            <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface-alt dark:bg-chip text-text-muted flex items-center justify-center mx-auto">
                <DocumentText size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-heading text-text-primary">No Reports Submitted Yet</h4>
                <p className="text-xs text-text-muted font-['Inter-Medium'] max-w-xs mx-auto">
                  When you submit community issue reports, your tracking status and repair dispatches will appear here.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('categories')}
                className="px-5 py-2 rounded-full bg-accent text-accent-contrast font-heading text-xs hover:opacity-90 transition shadow-xs"
              >
                File Your First Report
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myReports.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface dark:bg-card rounded-[24px] border border-theme p-4 shadow-xs space-y-3 hover:border-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-accent font-bold">
                        {item.reference_number || 'REP-PENDING'}
                      </span>
                      <h3 className="text-sm font-heading text-text-primary">
                        {REPORT_CATEGORIES.find((c) => c.id === item.category)?.label || item.category || 'Incident Report'}
                      </h3>
                      <p className="text-[11px] text-text-muted font-['Inter-Medium']">
                        Barangay {item.barangay || 'Poblacion'} · {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'Submitted' && (
                        <button
                          onClick={() => handleWithdrawReport(item.id)}
                          disabled={withdrawingId === item.id}
                          className="px-2.5 py-1 rounded-full text-[10px] font-heading text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition disabled:opacity-50"
                        >
                          {withdrawingId === item.id ? 'Withdrawing...' : 'Withdraw'}
                        </button>
                      )}
                      <StatusBadge status={item.status} />
                    </div>
                  </div>

                  <p className="text-xs text-text-muted font-['Inter-Medium'] line-clamp-2 leading-relaxed bg-surface-alt dark:bg-chip p-2.5 rounded-xl border border-theme">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-theme">
                    <div className="flex items-center gap-1 text-[10px] text-text-muted font-mono">
                      <Location size={12} className="text-accent" />
                      <span>Lat {Number(item.latitude || 14.13).toFixed(4)}, Long {Number(item.longitude || 121.43).toFixed(4)}</span>
                    </div>

                    <Link
                      href={`/tracking/report/${item.id}`}
                      className="inline-flex items-center gap-1 text-xs font-heading text-accent hover:underline"
                    >
                      <span>Track Status</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function IssueReportingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-text-muted">Loading reports...</div>}>
      <IssueReportingContent />
    </Suspense>
  );
}
