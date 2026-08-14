'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLgu } from '../../contexts/LguContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { getBarangays } from '../../lib/constants';
import { QRCodeSVG } from 'qrcode.react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { downloadQrCodeAsPng } from '../../lib/qrExport';
import { 
  DocumentText, 
  SearchNormal1, 
  TickCircle, 
  Clock, 
  CloseCircle, 
  ShieldSecurity,
  ShieldTick,
  Barcode,
  ArrowRight,
  InfoCircle,
  LoginCurve,
  Briefcase,
  Card,
  Heart,
  Scroll,
  ClipboardText,
  Location,
  Trash,
  Call,
  DocumentDownload
} from 'iconsax-react';

const PURPOSE_PRESETS: Record<string, string[]> = {
  'New Business Permit': [
    'Start a new retail business',
    'Open a food service shop',
    'Register local service agency',
    'Commercial branch expansion',
  ],
  'Business Permit Renewal': [
    'Annual license renewal',
    'Update business operations',
  ],
  'Community Tax Certificate (Cedula)': [
    'Employment requirement',
    'Business permit application',
    'Real estate transaction',
    'Government ID application',
    'Notarization requirement',
  ],
  'Birth Certificate (Certified Copy)': [
    'Passport/Travel application',
    'School enrollment',
    'Employment requirement',
    'Marriage license requirement',
    'Government ID application',
  ],
  'Certificate of Indigency': [
    'Medical assistance / Medicine aid',
    'Financial assistance',
    'Educational scholarship',
    'Legal aid / PAO support',
    'Burial assistance',
  ],
  'Barangay Clearance Endorsement': [
    'Local employment',
    'Bank account opening',
    'Police clearance requirement',
    'Postal ID requirement',
  ],
};

const DEFAULT_PRESETS = [
  'Employment requirement',
  'Government ID application',
  'School requirement',
  'Travel / Visa application',
  'Business requirement',
  'Medical assistance',
];

export default function ServicesPage() {
  const router = useRouter();
  const { activeLgu } = useLgu();
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'services' | 'my_requests'>('services');
  const [services, setServices] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('all');
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [claimModalData, setClaimModalData] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  // Form State
  const [purpose, setPurpose] = useState('');
  const [copies, setCopies] = useState('1');
  const [applicantName, setApplicantName] = useState('');
  const [barangay, setBarangay] = useState('Poblacion');

  const barangayList = getBarangays(activeLgu?.id);
  const isVerified = profile?.verification_status === 'verified';

  useEffect(() => {
    if (profile?.full_name) setApplicantName(profile.full_name);
    if (profile?.barangay) setBarangay(profile.barangay);
    else if (barangayList.length > 0) setBarangay(barangayList[0]);
  }, [profile, activeLgu?.id]);

  // Load LGU Services
  useEffect(() => {
    async function loadServices() {
      if (!activeLgu?.id) return;
      try {
        const { data, error } = await supabase
          .from('lgu_services')
          .select('*')
          .eq('lgu_id', activeLgu.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (data && data.length > 0) {
          setServices(data);
        } else {
          // Fallback default catalog
          setServices([
            {
              id: 'srv-1',
              name: 'Barangay Clearance Endorsement',
              office_name: 'Barangay Affairs',
              fee_note: '₱50.00 at Cashier',
              processing_time: '24 Hours',
              description: 'Official clearance issued for employment, travel, or residency verification.',
              requirements: ['Valid Government ID', 'Proof of Residency (Utility Bill / 2x2 Photo)'],
            },
            {
              id: 'srv-2',
              name: 'Certificate of Indigency',
              office_name: 'Social Welfare & Development (MSWDO)',
              fee_note: 'FREE',
              processing_time: '24 Hours',
              description: 'Issued to eligible low-income residents for medical, burial, or educational assistance.',
              requirements: ['Barangay Endorsement', 'Valid Government ID'],
            },
            {
              id: 'srv-3',
              name: 'Birth Certificate (Certified Copy)',
              office_name: 'Civil Registrar',
              fee_note: '₱100.00 per copy',
              processing_time: '48 Hours',
              description: 'Certified true copy of Birth, Marriage, or Death Certificate.',
              requirements: ['PSA or Local Registry Document copy', 'Authorization letter if representative'],
            },
            {
              id: 'srv-4',
              name: 'Community Tax Certificate (Cedula)',
              office_name: "Treasurer's Office",
              fee_note: '₱55.00 Basic + Income Assessment',
              processing_time: 'Same Day',
              description: 'Tax certificate issued to individuals or corporations residing or operating in the municipality.',
              requirements: ['Valid ID', 'Proof of Gross Income (for assessment)'],
            },
            {
              id: 'srv-5',
              name: 'New Business Permit Assessment',
              office_name: 'BPLO',
              fee_note: 'Calculated upon assessment',
              processing_time: '3 Working Days',
              description: 'Initial document assessment and fee calculation for business licensing.',
              requirements: ['DTI / SEC Registration', 'Barangay Business Clearance', 'Fire Safety Certificate'],
            },
          ]);
        }
      } catch (err) {
        console.error('Error fetching lgu_services', err);
      }
    }
    loadServices();
  }, [activeLgu?.id]);

  // Load User's Own Submitted Service Requests
  const fetchMyRequests = async () => {
    if (!user?.id) return;
    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('citizen_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMyRequests(data);
      }
    } catch (e) {
      console.warn('Error fetching service requests:', e);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchMyRequests();
    }
  }, [user?.id, activeLgu?.id]);

  const offices = [
    { id: 'all', label: 'All Offices' },
    { id: 'Civil Registrar', label: 'Civil Registrar' },
    { id: 'Barangay Affairs', label: 'Barangay Clearances' },
    { id: 'MSWDO', label: 'Social Welfare (MSWDO)' },
    { id: 'Treasurer', label: "Treasurer's Office" },
    { id: 'BPLO', label: 'Business Permits (BPLO)' },
  ];

  const filtered = services.filter((s) => {
    const matchOffice = selectedOffice === 'all' || s.office_name?.toLowerCase().includes(selectedOffice.toLowerCase());
    const matchSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchOffice && matchSearch;
  });

  const handleOpenApply = (service: any) => {
    setSelectedService(service);
    setPurpose('');
    setCopies('1');
    if (!user) {
      setGuestModalOpen(true);
      return;
    }
    setApplyModalOpen(true);
  };

  const handleWithdrawRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) return;
    setWithdrawingId(requestId);
    try {
      const { error } = await supabase.rpc('cancel_request', { p_request_id: requestId });
      if (error) {
        // Direct fallback update
        const { error: updateErr } = await supabase
          .from('service_requests')
          .update({ status: 'Cancelled' })
          .eq('id', requestId)
          .eq('citizen_id', user?.id);

        if (updateErr) {
          showToast(error.message || 'Failed to withdraw application.', 'error');
          return;
        }
      }
      showToast('Application withdrawn successfully.', 'success');
      fetchMyRequests();
    } catch (err: any) {
      showToast(err.message || 'Error withdrawing application.', 'error');
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setGuestModalOpen(true);
      return;
    }
    if (!isVerified) {
      showToast('Verification Required: Please verify your identity first.', 'info');
      router.push('/verify');
      return;
    }
    if (!purpose.trim()) {
      showToast('Please specify the purpose of your request.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const refCode = `REQ-${Date.now().toString().slice(-6)}`;
      const claimCode = `CLM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const payload = {
        lgu_id: activeLgu?.id || 'liliw-laguna',
        citizen_id: user.id,
        citizen_name: applicantName || profile?.full_name || 'Citizen',
        service_type: selectedService?.name || 'Document Service',
        office_name: selectedService?.office_name || 'Civil Registrar',
        lgu_service_id: selectedService?.id?.length === 36 ? selectedService.id : null,
        reference_number: refCode,
        claim_code: claimCode,
        status: 'Submitted',
        form_details: {
          applicant_name: applicantName,
          barangay: barangay,
          purpose: purpose,
          copies: parseInt(copies, 10) || 1,
          requirements: selectedService?.requirements || [],
          fee_note: selectedService?.fee_note,
        },
      };

      const { data, error } = await supabase
        .from('service_requests')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      showToast(`Application submitted! Reference: ${refCode}`, 'success');
      setClaimModalData(data || payload);
      setApplyModalOpen(false);
      fetchMyRequests();
    } catch (err: any) {
      console.error('Error applying for service', err);
      showToast(`Application failed: ${err.message || 'Please try again.'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const activePresets = selectedService?.name && PURPOSE_PRESETS[selectedService.name]
    ? PURPOSE_PRESETS[selectedService.name]
    : DEFAULT_PRESETS;

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-5 animate-fade-in pb-28">
      {/* Title Header */}
      <div className="space-y-1 pt-1">
        <h1 className="text-3xl font-heading text-text-primary tracking-tight">
          E-Services.
        </h1>
        <p className="text-xs text-text-muted font-['Inter-Medium'] leading-relaxed">
          Request official barangay clearances, civil registry certificates, and municipal permits online.
        </p>
      </div>

      {/* 2-Tab Bar (Matching Mobile Architecture) */}
      <div className="flex items-center border-b border-theme gap-6 text-sm">
        <button
          onClick={() => setActiveTab('services')}
          className={`pb-3 font-heading transition relative ${
            activeTab === 'services'
              ? 'text-text-primary'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <span>Available Services</span>
          {activeTab === 'services' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('my_requests')}
          className={`pb-3 font-heading transition relative flex items-center gap-1.5 ${
            activeTab === 'my_requests'
              ? 'text-text-primary'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <span>My Requests</span>
          <span className={`px-2 py-0.2 rounded-full text-[10px] ${
            activeTab === 'my_requests' ? 'bg-accent text-accent-contrast' : 'bg-surface-alt dark:bg-chip text-text-muted'
          }`}>
            {myRequests.length}
          </span>
          {activeTab === 'my_requests' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
          )}
        </button>
      </div>

      {/* ── TAB 1: AVAILABLE SERVICES CATALOG ── */}
      {activeTab === 'services' && (
        <div className="space-y-5">
          {/* Guest / Unverified Notice */}
          {!user ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-['Inter-Medium']">
                <InfoCircle size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />
                <span>You are browsing as a <strong>Guest</strong>. Sign in to submit service applications.</span>
              </div>
              <Link href="/auth/login" className="px-3.5 py-1.5 rounded-full bg-accent text-accent-contrast font-heading text-xs hover:opacity-90 transition shrink-0 shadow-xs">
                Sign In
              </Link>
            </div>
          ) : !isVerified ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-['Inter-Medium']">
                <ShieldSecurity size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="font-heading block text-amber-900 dark:text-amber-200">Identity Verification Required</span>
                  <span className="text-[10px] text-amber-800 dark:text-amber-300">Verify your residency to unlock fast-track document processing.</span>
                </div>
              </div>
              <Link href="/verify" className="px-3.5 py-1.5 rounded-full bg-accent text-accent-contrast font-heading text-xs hover:opacity-90 transition shrink-0 shadow-xs">
                Verify
              </Link>
            </div>
          ) : null}

          {/* Search Bar & Department Filter Chips */}
          <div className="space-y-3">
            <div className="relative">
              <SearchNormal1 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search clearances, permits, indigency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-full bg-surface dark:bg-card border border-theme text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent font-['Inter-Medium'] shadow-xs transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {offices.map((off) => (
                <button
                  key={off.id}
                  onClick={() => setSelectedOffice(off.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-heading whitespace-nowrap transition shadow-xs ${
                    selectedOffice === off.id
                      ? 'bg-accent text-accent-contrast'
                      : 'bg-surface dark:bg-card text-text-muted hover:bg-surface-alt dark:hover:bg-chip border border-theme'
                  }`}
                >
                  {off.label}
                </button>
              ))}
            </div>
          </div>

          {/* Services List */}
          <div className="space-y-3.5">
            {filtered.length === 0 ? (
              <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-10 text-center space-y-2">
                <DocumentText size={32} className="text-text-muted mx-auto" />
                <p className="text-xs font-heading text-text-primary">No services found</p>
                <p className="text-[11px] text-text-muted font-['Inter-Medium']">Try adjusting your search or department filter.</p>
              </div>
            ) : (
              filtered.map((srv) => (
                <div
                  key={srv.id}
                  className="p-5 rounded-[24px] bg-surface dark:bg-card border border-theme shadow-xs hover:border-accent transition duration-200 space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-heading uppercase text-accent block tracking-wider">
                        {srv.office_name || 'Municipal Office'}
                      </span>
                      <h3 className="text-base font-heading text-text-primary mt-0.5">
                        {srv.name}
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-alt dark:bg-chip border border-theme text-[10px] font-heading text-text-muted shrink-0">
                      {srv.processing_time || '24-48 Hrs'}
                    </span>
                  </div>

                  <p className="text-xs text-text-muted font-['Inter-Medium'] leading-relaxed">
                    {srv.description}
                  </p>

                  {srv.requirements && srv.requirements.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-surface-alt dark:bg-chip border border-theme space-y-1.5">
                      <span className="text-[10px] font-heading uppercase text-text-muted block">Document Checklist:</span>
                      <ul className="text-[11px] text-text-muted font-['Inter-Medium'] list-disc pl-4 space-y-1">
                        {srv.requirements.map((req: string, idx: number) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2 border-t border-theme flex items-center justify-between">
                    <span className="text-xs font-heading text-accent">
                      Fee: {srv.fee_note || 'Standard Fee'}
                    </span>
                    <button
                      onClick={() => handleOpenApply(srv)}
                      className="px-4 py-2 rounded-full bg-accent text-accent-contrast font-heading text-xs hover:opacity-90 transition flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Apply Online</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: MY REQUESTS & TRACKING ── */}
      {activeTab === 'my_requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-heading text-text-muted uppercase tracking-wider">
              Your Service Applications ({myRequests.length})
            </h2>
            {user && (
              <button
                onClick={fetchMyRequests}
                className="text-[11px] font-heading text-accent hover:underline"
              >
                Refresh
              </button>
            )}
          </div>

          {!user ? (
            /* Guest Empty State matching mobile */
            <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-10 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-surface-alt dark:bg-chip border border-theme text-text-muted flex items-center justify-center mx-auto">
                <ClipboardText size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-heading text-text-primary">Track Your Applications</h3>
                <p className="text-xs text-text-muted font-['Inter-Medium'] max-w-sm mx-auto leading-relaxed">
                  Sign in to view status updates, claim passes, and releases for your submitted municipal applications.
                </p>
              </div>
              <Link
                href="/auth/login"
                className="inline-block px-6 py-2.5 rounded-full bg-accent text-accent-contrast font-heading text-xs hover:opacity-90 transition shadow-xs"
              >
                Sign In to View Requests
              </Link>
            </div>
          ) : loadingRequests ? (
            <div className="p-12 text-center text-xs text-text-muted bg-surface dark:bg-card rounded-[28px] border border-theme space-y-2 shadow-xs">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading your applications...</p>
            </div>
          ) : myRequests.length === 0 ? (
            <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-10 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-surface-alt dark:bg-chip text-text-muted flex items-center justify-center mx-auto">
                <DocumentText size={28} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-heading text-text-primary">No Applications Submitted Yet</h4>
                <p className="text-xs text-text-muted font-['Inter-Medium'] max-w-xs mx-auto">
                  When you apply for barangay clearances or municipal permits, your tracking and claim tickets will appear here.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('services')}
                className="px-5 py-2 rounded-full bg-accent text-accent-contrast font-heading text-xs hover:opacity-90 transition shadow-xs"
              >
                Browse Available Services
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-surface dark:bg-card rounded-[24px] border border-theme p-4 shadow-xs space-y-3 hover:border-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-accent font-bold">
                        {req.reference_number || 'REQ-PENDING'}
                      </span>
                      <h3 className="text-sm font-heading text-text-primary">
                        {req.service_type || 'Document Service'}
                      </h3>
                      <p className="text-[11px] text-text-muted font-['Inter-Medium']">
                        {req.office_name || 'Municipal Hall'} · {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {req.status === 'Submitted' && (
                        <button
                          onClick={() => handleWithdrawRequest(req.id)}
                          disabled={withdrawingId === req.id}
                          className="px-2.5 py-1 rounded-full text-[10px] font-heading text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition disabled:opacity-50"
                        >
                          {withdrawingId === req.id ? 'Withdrawing...' : 'Withdraw'}
                        </button>
                      )}
                      <StatusBadge status={req.status} />
                    </div>
                  </div>

                  {req.form_details?.purpose && (
                    <p className="text-xs text-text-muted font-['Inter-Medium'] line-clamp-2 leading-relaxed bg-surface-alt dark:bg-chip p-2.5 rounded-xl border border-theme">
                      <strong className="text-text-primary">Purpose:</strong> {req.form_details.purpose}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-theme">
                    <button
                      onClick={() => setClaimModalData(req)}
                      className="inline-flex items-center gap-1.5 text-xs font-heading text-text-primary hover:underline"
                    >
                      <Barcode size={14} className="text-accent" />
                      <span>View Claim Pass</span>
                    </button>

                    <Link
                      href={`/tracking/service/${req.id}`}
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

      {/* Guest Sign-In Prompt Modal */}
      {guestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface dark:bg-card rounded-[32px] border border-theme p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 mx-auto flex items-center justify-center">
              <LoginCurve size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-heading text-text-primary">Sign In to Apply</h3>
              <p className="text-xs text-text-muted font-['Inter-Medium'] leading-relaxed">
                To submit official document requests and receive digital claim tickets, please sign in with your verified resident account.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setGuestModalOpen(false)}
                className="flex-1 py-2.5 rounded-full bg-surface-alt dark:bg-chip border border-theme text-text-muted font-heading text-xs"
              >
                Cancel
              </button>
              <Link
                href="/auth/login"
                className="flex-1 py-2.5 rounded-full bg-accent text-accent-contrast font-heading text-xs hover:opacity-90 transition shadow-xs"
              >
                Sign In →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Application Form Modal with Purpose Presets */}
      {applyModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface dark:bg-card rounded-[32px] border border-theme p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <div>
                <span className="text-[9px] font-heading uppercase text-accent block tracking-wider">E-Service Application</span>
                <h3 className="text-base font-heading text-text-primary">{selectedService.name}</h3>
              </div>
              <button onClick={() => setApplyModalOpen(false)} className="text-text-muted hover:text-text-primary p-1">
                <CloseCircle size={22} />
              </button>
            </div>

            {!isVerified ? (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-3 font-['Inter-Medium']">
                <div className="flex items-center gap-2">
                  <ShieldSecurity size={20} className="text-amber-700 dark:text-amber-400 shrink-0" />
                  <span className="font-heading">Identity Verification Required</span>
                </div>
                <p>
                  In compliance with municipal ordinances, you must verify your resident status by uploading your government ID before submitting official applications.
                </p>
                <Link
                  href="/verify"
                  className="block w-full py-2.5 rounded-full bg-accent text-accent-contrast text-center font-heading text-xs hover:opacity-90 transition shadow-xs"
                >
                  Verify Resident Identity Now →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4 text-xs font-['Inter-Medium']">
                {/* Applicant Name */}
                <div className="space-y-1.5">
                  <label className="block font-heading text-text-primary uppercase tracking-wider text-[10px]">
                    Applicant Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent shadow-2xs"
                  />
                </div>

                {/* Barangay */}
                <div className="space-y-1.5">
                  <label className="block font-heading text-text-primary uppercase tracking-wider text-[10px]">
                    Barangay of Residence *
                  </label>
                  <select
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent shadow-2xs font-heading"
                  >
                    {barangayList.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                {/* Copies */}
                <div className="space-y-1.5">
                  <label className="block font-heading text-text-primary uppercase tracking-wider text-[10px]">
                    Number of Copies
                  </label>
                  <select
                    value={copies}
                    onChange={(e) => setCopies(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent shadow-2xs"
                  >
                    <option value="1">1 Copy</option>
                    <option value="2">2 Copies</option>
                    <option value="3">3 Copies</option>
                    <option value="5">5 Copies</option>
                  </select>
                </div>

                {/* Purpose of Request with Presets */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-heading text-text-primary uppercase tracking-wider text-[10px]">
                      Purpose of Request *
                    </label>
                    <span className="text-[10px] text-text-muted">Select preset or type below</span>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {activePresets.map((pr) => (
                      <button
                        type="button"
                        key={pr}
                        onClick={() => setPurpose(pr)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-heading border transition ${
                          purpose === pr
                            ? 'bg-accent text-accent-contrast border-accent'
                            : 'bg-surface-alt dark:bg-chip border-theme text-text-muted hover:border-accent'
                        }`}
                      >
                        {pr}
                      </button>
                    ))}
                  </div>

                  <textarea
                    required
                    rows={2}
                    placeholder="Specify details or purpose of your request..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent shadow-2xs resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setApplyModalOpen(false)}
                    className="px-4 py-2.5 rounded-full bg-surface-alt dark:bg-chip text-text-muted font-heading hover:text-text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-full bg-accent text-accent-contrast font-heading hover:opacity-90 transition disabled:opacity-50 shadow-xs"
                  >
                    {submitting ? 'Transmitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Claim Pass & QR Code Modal */}
      {claimModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface dark:bg-card rounded-[32px] border border-theme p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <TickCircle size={28} variant="Bold" />
            </div>

            <div>
              <span className="text-[10px] font-heading uppercase text-emerald-700 dark:text-emerald-400 block tracking-wider">Application Queued!</span>
              <h3 className="text-lg font-heading text-text-primary">{claimModalData.service_type}</h3>
              <span className="text-xs font-mono font-bold text-accent block mt-0.5">
                Ref: {claimModalData.reference_number}
              </span>
            </div>

            <div id="service-success-qr-container" className="p-4 bg-white rounded-2xl border border-theme inline-block mx-auto shadow-inner">
              <QRCodeSVG
                value={`AGAPP-CLAIM:${claimModalData.reference_number}:${claimModalData.service_type}`}
                size={140}
                level="H"
              />
            </div>

            <p className="text-xs text-text-muted font-['Inter-Medium'] leading-relaxed">
              Present this digital Claim Pass and reference code at the {claimModalData.office_name || 'Municipal Desk'} counter for pickup and official release.
            </p>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => downloadQrCodeAsPng('service-success-qr-container', `AGAPP-Claim-QR-${claimModalData.reference_number}.png`)}
                className="w-full py-2.5 rounded-full bg-surface-alt dark:bg-chip border border-theme text-text-primary font-heading text-xs hover:bg-surface transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <DocumentDownload size={15} className="text-accent" />
                <span>Save QR as PNG</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setClaimModalData(null)}
                className="flex-1 py-2.5 rounded-full border border-theme text-text-muted font-heading text-xs hover:text-text-primary transition"
              >
                Close
              </button>
              <Link
                href={`/tracking/service/${claimModalData.id || claimModalData.reference_number}`}
                className="flex-1 py-2.5 rounded-full bg-accent text-accent-contrast font-heading text-xs hover:opacity-90 transition shadow-xs flex items-center justify-center"
              >
                Track Status →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
