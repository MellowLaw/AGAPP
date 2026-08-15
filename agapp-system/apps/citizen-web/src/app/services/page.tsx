'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  DocumentDownload,
  DocumentUpload,
  Warning2,
  FolderOpen,
  Eye,
  Add,
  GalleryAdd
} from 'iconsax-react';
import { compressImageFile } from '../../lib/imageCompression';

const PURPOSE_PRESETS: Record<string, string[]> = {
  // Business Permits & Licensing (BPLO)
  'New Business Permit (Mayor\'s Permit)': [
    'Start retail / commercial establishment',
    'Open food service / restaurant',
    'Register local service agency',
    'Commercial branch expansion',
  ],
  'Business Permit Renewal': [
    'Annual license renewal',
    'Update business operations & capital',
    'Commercial permit continuation',
  ],
  'Occupational / Work Permit': [
    'Local employment requirement',
    'Food service worker accreditation',
    'Commercial driver / operator permit',
    'Professional trade practice',
  ],

  // Civil Registrar
  'Certificate of Live Birth (Timely Registration)': [
    'Newborn official registration',
    'PSA endorsement copy',
  ],
  'Late Birth Registration (>30 Days)': [
    'Delayed school enrollment requirement',
    'Passport / DFA application requirement',
    'Late registration for adult records',
    'Legal identity registration',
  ],
  'Certified True Copy of Civil Registry Document': [
    'Passport / Visa application',
    'School enrollment / Transcripts',
    'Employment requirement',
    'Marriage license application',
    'Government ID application',
    'Social security / SSS claim',
  ],
  'Marriage License Application': [
    'Upcoming civil / church wedding',
    'Legal solemnization requirement',
  ],
  'Certificate of Death (Timely Registration)': [
    'Burial / Funeral permit issuance',
    'Estate settlement & insurance claim',
  ],
  'Legitimation of Child (R.A. 9858)': [
    'Update child birth certificate after parents marriage',
    'Legal change of child surname',
  ],
  'Correction of Clerical Error (R.A. 9048 / R.A. 10172)': [
    'Correct misspelled name / parents name',
    'Correct day / month of birth',
    'Correct erroneous sex entry',
  ],

  // Barangay Affairs
  'Barangay Clearance (Employment / General)': [
    'Local employment requirement',
    'Bank account opening',
    'Police / NBI clearance requirement',
    'Postal ID requirement',
    'Driver license application',
  ],
  'Barangay Certificate of Residency': [
    'Proof of address / Utility setup',
    'Passport application requirement',
    'Bank loan / Financing requirement',
    'Government subsidy / 4Ps verification',
  ],
  'Barangay Certificate of Indigency': [
    'Hospitalization / Medical assistance (AICS)',
    'Medicine assistance / Prescription aid',
    'Educational scholarship / Tuition support',
    'Free Legal Aid / PAO representation',
    'Burial assistance',
  ],
  'Barangay Business Clearance': [
    'New Mayor\'s Permit application',
    'Annual business permit renewal',
    'DTI / SEC local endorsement',
  ],

  // Municipal Treasurer
  'Community Tax Certificate (Cedula)': [
    'Employment requirement',
    'Business permit application / renewal',
    'Real estate sale / Deed notarization',
    'Government ID application',
    'Legal affidavit notarization',
  ],
  'Real Property Tax (RPT / Land Tax) Payment': [
    'Annual land tax settlement',
    'Real property tax discount payment',
    'Bank loan collateral verification',
  ],
  'Real Property Tax Clearance': [
    'Property sale / title transfer requirement',
    'Building permit application requirement',
    'Bank loan / mortgage requirement',
  ],
  'Transfer Tax Payment & Certification': [
    'Deed of Absolute Sale registration',
    'Inheritance / Extrajudicial settlement',
    'Donation title conveyance',
  ],

  // Assessor's Office
  'Transfer / Issuance of Tax Declaration': [
    'Update tax declaration after property purchase',
    'Subdivision of lot assessment',
    'Consolidation of land titles',
  ],
  'Certified True Copy of Tax Declaration': [
    'Bank mortgage / loan collateral',
    'Court / legal proceeding evidence',
    'Boundary verification & survey',
  ],

  // MPDO / Zoning
  'Locational / Zoning Clearance': [
    'Commercial establishment building permit',
    'Residential house construction',
    'Subdivision / warehouse development',
  ],

  // OBO / Engineering
  'Building Permit (New Construction / Renovation)': [
    'New residential house construction',
    'Commercial building erection',
    'Building renovation & extension',
    'Perimeter fence / structural repair',
  ],
  'Certificate of Occupancy': [
    'Finished residential building occupancy',
    'Commercial store / facility opening',
    'Permanent electric / water utility hookup',
  ],

  // Health Office
  'Sanitary Permit to Operate (Establishments)': [
    'Food service & dining establishment permit',
    'Water refilling station sanitation compliance',
    'Commercial salon / personal care permit',
  ],
  'Food Handler\'s Health Certificate (Health Card)': [
    'Food service / kitchen staff employment',
    'Waiter / waitress restaurant accreditation',
    'Hotel & resort staff clearance',
  ],

  // MSWDO & OSCA
  'Crisis Assistance (AICS / Financial & Medical Aid)': [
    'Urgent hospital bill settlement',
    'Chemotherapy / Dialysis medicine aid',
    'Emergency burial assistance',
    'Transportation aid for stranded resident',
  ],
  'Senior Citizen ID Registration & Booklet': [
    'New Senior Citizen ID (60+ years old)',
    'Medicine & grocery discount booklet',
  ],
  'Person with Disability (PWD) ID Application': [
    'New PWD Identification Card',
    'Medicine & transport discount privileges',
  ]
};

const DEFAULT_PRESETS = [
  'Employment requirement',
  'Government ID application',
  'School requirement',
  'Travel / Visa application',
  'Business requirement',
  'Medical assistance',
];

interface UploadedDoc {
  requirement_name?: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

interface RequirementSlot {
  requirementName: string;
  file: File | null;
  previewUrl?: string;
  isCompressing?: boolean;
}

interface AdditionalDoc {
  id: string;
  name: string;
  file: File;
  previewUrl?: string;
}

export default function ServicesPage() {
  const router = useRouter();
  const { activeLgu } = useLgu();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const additionalFileInputRef = useRef<HTMLInputElement>(null);

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
  const [reqSlots, setReqSlots] = useState<RequirementSlot[]>([]);
  const [additionalFiles, setAdditionalFiles] = useState<AdditionalDoc[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);

  const barangayList = getBarangays(activeLgu?.id);
  const isVerified = profile?.verification_status === 'verified';

  useEffect(() => {
    if (profile?.full_name) setApplicantName(profile.full_name);
    if (profile?.barangay) setBarangay(profile.barangay);
    else if (barangayList.length > 0) setBarangay(barangayList[0]);
  }, [profile, activeLgu?.id]);

  // Lock background body scroll whenever a modal is open to prevent background scrolling
  useEffect(() => {
    if (applyModalOpen || guestModalOpen || Boolean(claimModalData)) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || 'unset';
      };
    }
  }, [applyModalOpen, guestModalOpen, claimModalData]);

  // Load LGU Services dynamically from database with live realtime sync
  const loadServices = async () => {
    if (!activeLgu?.id) return;
    try {
      const { data, error } = await supabase
        .from('lgu_services')
        .select('*')
        .eq('lgu_id', activeLgu.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setServices(data);
      }
    } catch (err) {
      console.error('Error fetching lgu_services', err);
    }
  };

  useEffect(() => {
    loadServices();

    if (!activeLgu?.id) return;
    const channel = supabase
      .channel(`citizen_lgu_services_realtime_${activeLgu.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lgu_services',
          filter: `lgu_id=eq.${activeLgu.id}`,
        },
        () => {
          loadServices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeLgu?.id]);

  // Load User's Own Submitted Service Requests with live realtime sync
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
    if (!user?.id) return;
    fetchMyRequests();

    const channel = supabase
      .channel(`citizen_service_requests_realtime_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `citizen_id=eq.${user.id}`,
        },
        () => {
          fetchMyRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activeLgu?.id]);

  // Dynamically compute unique office categories from the database services
  const offices = useMemo(() => {
    const distinctOffices = Array.from(
      new Set(services.map((s) => s.office_name?.trim()).filter(Boolean))
    );
    return [
      { id: 'all', label: 'All Offices' },
      ...distinctOffices.map((off) => ({ id: off, label: off })),
    ];
  }, [services]);

  // Dynamically filter services by selected office and search query
  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchOffice = selectedOffice === 'all' || s.office_name === selectedOffice;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        s.name?.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.office_name && s.office_name.toLowerCase().includes(q));

      return matchOffice && matchSearch;
    });
  }, [services, selectedOffice, searchQuery]);

  const handleOpenApply = (service: any) => {
    setSelectedService(service);
    setPurpose('');
    setCopies('1');
    const reqs: string[] = Array.isArray(service.requirements) ? service.requirements : [];
    setReqSlots(reqs.map(r => ({
      requirementName: r,
      file: null,
      previewUrl: undefined,
      isCompressing: false,
    })));
    setAdditionalFiles([]);
    if (!user) {
      setGuestModalOpen(true);
      return;
    }
    setApplyModalOpen(true);
  };

  const handleSlotFileSelected = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast(`"${file.name}" exceeds 15MB limit.`, 'info');
      return;
    }

    setReqSlots(prev => prev.map((s, i) => i === index ? { ...s, isCompressing: true } : s));

    try {
      const optimized = await compressImageFile(file);
      const previewUrl = optimized.type.startsWith('image/') ? URL.createObjectURL(optimized) : undefined;
      setReqSlots(prev => prev.map((s, i) => i === index ? {
        ...s,
        file: optimized,
        previewUrl,
        isCompressing: false,
      } : s));
      showToast(`Attached: ${file.name}`, 'info');
    } catch {
      setReqSlots(prev => prev.map((s, i) => i === index ? { ...s, file, isCompressing: false } : s));
    }
  };

  const handleRemoveSlotFile = (index: number) => {
    setReqSlots(prev => prev.map((s, i) => i === index ? { ...s, file: null, previewUrl: undefined } : s));
  };

  const handleAddAdditionalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast(`"${file.name}" exceeds 15MB limit.`, 'info');
      return;
    }

    try {
      const optimized = await compressImageFile(file);
      const previewUrl = optimized.type.startsWith('image/') ? URL.createObjectURL(optimized) : undefined;
      setAdditionalFiles(prev => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          file: optimized,
          previewUrl
        }
      ]);
      showToast(`Attached supporting document: ${file.name}`, 'info');
    } catch {
      setAdditionalFiles(prev => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          file,
        }
      ]);
    }
  };

  const handleRemoveAdditionalFile = (id: string) => {
    setAdditionalFiles(prev => prev.filter(a => a.id !== id));
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
    setUploadProgress(true);

    try {
      const refCode = `REQ-${Date.now().toString().slice(-6)}`;
      const claimCode = `CLM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Collect all requirement files 1-by-1
      const queue: Array<{ requirementName: string; file: File }> = [];

      reqSlots.forEach((slot, i) => {
        if (slot.file) {
          queue.push({
            requirementName: slot.requirementName || `Requirement #${i + 1}`,
            file: slot.file,
          });
        }
      });

      additionalFiles.forEach((add) => {
        queue.push({
          requirementName: add.name || 'Additional Supporting Document',
          file: add.file,
        });
      });

      const uploadedDocs: UploadedDoc[] = [];
      let primaryAttachmentUrl = '';

      if (queue.length > 0) {
        for (let i = 0; i < queue.length; i++) {
          const item = queue[i];
          const cleanName = item.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const storagePath = `${user.id}/${refCode}-${Date.now()}-${i}-${cleanName}`;

          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('service-attachments')
            .upload(storagePath, item.file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (!uploadErr && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from('service-attachments')
              .getPublicUrl(storagePath);

            const url = publicUrlData.publicUrl;
            if (!primaryAttachmentUrl) primaryAttachmentUrl = url;
            uploadedDocs.push({
              requirement_name: item.requirementName,
              name: item.file.name,
              url,
              size: item.file.size,
              type: item.file.type,
            });
          } else if (uploadErr) {
            console.warn(`File upload issue for ${item.file.name}:`, uploadErr);
          }
        }
      }

      const payload = {
        lgu_id: activeLgu?.id || 'liliw-laguna',
        citizen_id: user.id,
        citizen_name: applicantName || profile?.full_name || 'Citizen',
        service_type: selectedService?.name || 'Document Service',
        office_name: selectedService?.office_name || 'Civil Registrar',
        lgu_service_id: selectedService?.id?.length === 36 ? selectedService.id : null,
        reference_number: refCode,
        claim_code: claimCode,
        attachment_url: primaryAttachmentUrl || null,
        status: 'Submitted',
        form_details: {
          applicant_name: applicantName,
          barangay: barangay,
          purpose: purpose,
          copies: parseInt(copies, 10) || 1,
          requirements: selectedService?.requirements || [],
          fee_note: selectedService?.fee_note,
          processing_time: selectedService?.processing_time,
          attachments: uploadedDocs,
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
      setReqSlots([]);
      setAdditionalFiles([]);
      fetchMyRequests();
    } catch (err: any) {
      console.error('Error applying for service', err);
      showToast(`Application failed: ${err.message || 'Please try again.'}`, 'error');
    } finally {
      setSubmitting(false);
      setUploadProgress(false);
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
          Request official barangay clearances, civil registry certificates, business permits, and social assistance online.
        </p>
      </div>

      {/* 2-Tab Bar */}
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
                placeholder="Search civil registry, business permits, taxes, barangay clearances..."
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
                      <span className="text-[10px] font-heading uppercase text-text-muted block">Required Documents & Pre-Requisites:</span>
                      <ul className="text-[11px] text-text-muted font-['Inter-Medium'] list-disc pl-4 space-y-1">
                        {srv.requirements.map((req: string, idx: number) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Prominent Physical Requirement Reminder */}
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10.5px] text-amber-800 dark:text-amber-300 font-['Inter-Medium'] flex items-center gap-2">
                    <Warning2 size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Bring original copies upon claiming at the Municipal Hall.</span>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs font-heading text-accent">
                      Fee: {srv.fee_note || 'Standard Fee'}
                    </span>
                    <button
                      onClick={() => handleOpenApply(srv)}
                      className="px-4 py-2 rounded-full bg-accent text-accent-contrast font-heading text-xs hover:opacity-90 transition flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Apply & Upload Docs</span>
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

                  {req.form_details?.attachments && req.form_details.attachments.length > 0 && (
                    <div className="flex items-center gap-2 text-[11px] text-text-muted font-['Inter-Medium']">
                      <FolderOpen size={14} className="text-accent" />
                      <span>{req.form_details.attachments.length} document attachment(s) uploaded</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
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
          <div className="relative bg-surface dark:bg-card rounded-[32px] border border-theme p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <button
              onClick={() => setGuestModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-alt dark:hover:bg-chip transition"
              aria-label="Close modal"
            >
              <CloseCircle size={22} />
            </button>
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

      {/* Application Form Modal with Requirement Upload & Physical Notice */}
      {applyModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface dark:bg-card rounded-[32px] border border-theme p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-theme pb-3 relative">
              <div className="pr-8">
                <span className="text-[9px] font-heading uppercase text-accent block tracking-wider">
                  {selectedService.office_name || 'E-Service Application'}
                </span>
                <h3 className="text-base font-heading text-text-primary">{selectedService.name}</h3>
              </div>
              <button
                onClick={() => setApplyModalOpen(false)}
                className="absolute top-0 right-0 p-1 text-text-muted hover:text-text-primary hover:bg-surface-alt dark:hover:bg-chip rounded-full transition"
                aria-label="Close modal"
              >
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
                {/* MANDATORY PHYSICAL PICKUP BANNER */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-1 font-['Inter-Medium']">
                  <div className="flex items-center gap-1.5 font-heading text-amber-800 dark:text-amber-300 text-[11px]">
                    <Warning2 size={16} className="shrink-0" />
                    <span>Paunawa: Dalhin ang Orihinal na Dokumento</span>
                  </div>
                  <p className="text-[10.5px] leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                    Ang pag-upload online ay para sa paunang pagsusuri (pre-assessment). <strong>MANDATORY</strong> po na dalhin ang orihinal o opisyal na kopya ng inyong mga requirements sa oras ng pagkuha (claiming) sa Municipal Hall.
                  </p>
                </div>

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

                {/* 1-BY-1 REQUIREMENT ATTACHMENT UPLOADER */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-heading text-text-primary uppercase tracking-wider text-[10px]">
                        Upload Document Requirements (1-by-1)
                      </label>
                      <span className="text-[10px] text-text-muted">
                        Attach digital scans or photos for online pre-assessment
                      </span>
                    </div>
                    {reqSlots.length > 0 && (
                      <span className="text-[10px] font-mono text-accent font-heading px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                        {reqSlots.filter(s => s.file).length} of {reqSlots.length} Attached
                      </span>
                    )}
                  </div>

                  {/* Requirement Slots List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {reqSlots.map((slot, idx) => {
                      const isAttached = !!slot.file;
                      const isImg = slot.file?.type.startsWith('image/');
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-2xl border transition ${
                            isAttached
                              ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30'
                              : 'bg-surface-alt dark:bg-chip border-theme'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-accent text-accent-contrast text-[9px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-heading text-text-primary leading-tight">
                                {slot.requirementName}
                              </span>
                            </div>
                            {isAttached && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-heading text-emerald-600 dark:text-emerald-400 shrink-0">
                                <TickCircle size={13} variant="Bold" />
                                <span>Attached</span>
                              </span>
                            )}
                          </div>

                          {isAttached ? (
                            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-surface dark:bg-card border border-theme text-xs gap-3">
                              <div className="flex items-center gap-3 overflow-hidden flex-1">
                                {isImg && slot.previewUrl ? (
                                  <img
                                    src={slot.previewUrl}
                                    alt="preview"
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-theme shadow-xs shrink-0"
                                  />
                                ) : (
                                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-accent/10 flex flex-col items-center justify-center text-accent shrink-0 border border-accent/20">
                                    <DocumentText size={24} />
                                    <span className="text-[9px] font-heading font-mono mt-0.5">DOC</span>
                                  </div>
                                )}
                                <div className="overflow-hidden space-y-0.5">
                                  <p className="font-heading text-xs text-text-primary truncate">{slot.file?.name}</p>
                                  <p className="text-[10px] text-text-muted font-mono">
                                    {((slot.file?.size || 0) / 1024).toFixed(0)} KB · Auto-Optimized
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <label className="px-3 py-1.5 rounded-xl bg-surface-alt dark:bg-chip border border-theme text-xs font-heading text-text-muted hover:text-text-primary cursor-pointer transition">
                                  <span>Replace</span>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => handleSlotFileSelected(idx, e)}
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlotFile(idx)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded-xl transition"
                                  title="Remove file"
                                >
                                  <Trash size={16} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="flex items-center justify-center gap-1.5 w-full p-2.5 rounded-xl border border-dashed border-theme hover:border-accent bg-surface dark:bg-card cursor-pointer transition text-center">
                                {slot.isCompressing ? (
                                  <span className="text-[11px] text-accent font-heading animate-pulse">Optimizing image...</span>
                                ) : (
                                  <>
                                    <DocumentUpload size={15} className="text-accent shrink-0" />
                                    <span className="text-[11px] font-heading text-text-primary">
                                      Attach Document or Take Photo
                                    </span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  onChange={(e) => handleSlotFileSelected(idx, e)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {reqSlots.length === 0 && (
                      <div className="p-3 bg-surface-alt dark:bg-chip rounded-xl text-center text-xs text-text-muted">
                        No specific document requirements recorded for this service.
                      </div>
                    )}
                  </div>

                  {/* Extra Supporting Documents */}
                  <div className="pt-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-heading text-text-muted uppercase tracking-wider">
                        Additional Supporting Documents (Optional)
                      </span>
                      <label className="inline-flex items-center gap-1 text-[10px] font-heading text-accent hover:underline cursor-pointer">
                        <Add size={12} />
                        <span>Add Extra File</span>
                        <input
                          type="file"
                          ref={additionalFileInputRef}
                          accept="image/*,application/pdf"
                          onChange={handleAddAdditionalFile}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {additionalFiles.length > 0 && (
                      <div className="space-y-1.5">
                        {additionalFiles.map((add) => (
                          <div
                            key={add.id}
                            className="flex items-center justify-between p-2.5 rounded-2xl bg-surface dark:bg-card border border-theme text-xs gap-3"
                          >
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                              {add.previewUrl ? (
                                <img
                                  src={add.previewUrl}
                                  alt="preview"
                                  className="w-12 h-12 rounded-xl object-cover border border-theme shadow-xs shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0 border border-accent/20">
                                  <DocumentText size={20} />
                                </div>
                              )}
                              <div className="overflow-hidden space-y-0.5">
                                <span className="font-heading text-xs text-text-primary truncate block">{add.name}</span>
                                <span className="text-[10px] text-text-muted font-mono block">
                                  {((add.file.size || 0) / 1024).toFixed(0)} KB
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAdditionalFile(add.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded-xl transition shrink-0"
                            >
                              <Trash size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
          <div className="relative bg-surface dark:bg-card rounded-[32px] border border-theme p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <button
              onClick={() => setClaimModalData(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-alt dark:hover:bg-chip transition"
              aria-label="Close modal"
            >
              <CloseCircle size={22} />
            </button>
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

            {/* In-Person Physical Pickup Guideline */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[10.5px] text-amber-800 dark:text-amber-300 text-left space-y-1">
              <strong className="block font-heading text-amber-900 dark:text-amber-200">⚠️ Pickup Requirement Check:</strong>
              <p>
                Present this QR code and bring the <strong>physical original/photocopies</strong> of your requirements at the <strong>{claimModalData.office_name || 'Municipal Desk'}</strong> counter.
              </p>
            </div>

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
