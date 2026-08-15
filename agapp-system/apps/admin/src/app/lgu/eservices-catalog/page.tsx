'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { lguIdFromName } from '@/lib/lgu';
import { Add, Trash, CloseCircle } from 'iconsax-react';

interface CatalogService {
  id: string;
  office_name: string;
  name: string;
  description: string | null;
  requirements: string[];
  fee_note: string;
  processing_time: string | null;
  is_active: boolean;
  sort_order: number;
}

const PRESETS = [
  // BPLO / BOSS
  {
    office_name: 'BPLO',
    name: 'New Business Permit (Mayor\'s Permit)',
    description: 'Application for a new Mayor\'s/Business Permit to legally operate a commercial establishment.',
    requirements: ['DTI / SEC / CDA Registration Certificate', 'Barangay Business Clearance with Official Receipt', 'Contract of Lease or Land Title / Tax Dec', 'Locational / Zoning Clearance (MPDO)', 'Fire Safety Evaluation Clearance (BFP)', 'Sanitary Permit to Operate (Health Office)', 'Sketch / Vicinity Map of Location'],
    fee_note: 'Assessed by BPLO — pay at Municipal Treasurer',
    processing_time: '3-5 working days',
  },
  {
    office_name: 'BPLO',
    name: 'Business Permit Renewal',
    description: 'Annual renewal of existing business permit to operate (filed every January 1-20).',
    requirements: ['Previous Year Mayor\'s Permit & Official Receipt', 'Current Year Barangay Business Clearance', 'Audited Financial Statement (AFS) or BIR Form 1701/1702 / Gross Sales Sworn Statement', 'Current Year Fire Safety Inspection Certificate', 'Current Year Sanitary Permit & Health Cards'],
    fee_note: 'Assessed based on gross sales — pay at Municipal Treasurer',
    processing_time: '1-3 working days',
  },
  {
    office_name: 'BPLO',
    name: 'Occupational / Work Permit',
    description: 'Official Mayor\'s permit for individuals practicing a trade or employed within the municipality.',
    requirements: ['One (1) Valid Government ID', 'Food Handler / Worker Health Card (Health Office)', 'Police Clearance or NBI Clearance', 'Community Tax Certificate (Cedula)'],
    fee_note: '₱100.00 – ₱200.00 — pay at Municipal Treasurer',
    processing_time: '1-2 working days',
  },

  // Civil Registrar
  {
    office_name: 'Civil Registrar',
    name: 'Certificate of Live Birth (Timely Registration)',
    description: 'Registration of newborn birth within 30 days of delivery.',
    requirements: ['Duly accomplished COLB Form 102 signed by attending physician/midwife', 'Valid IDs of parents', 'Marriage Certificate of parents (if married)', '6 copies Notarized AUSF & AAP (if parents unmarried)'],
    fee_note: 'Free / No charge for basic timely registration',
    processing_time: '1-2 working days',
  },
  {
    office_name: 'Civil Registrar',
    name: 'Late Birth Registration (>30 Days)',
    description: 'Registration of birth beyond 30 days of occurrence pursuant to Act 3753.',
    requirements: ['PSA Negative Certificate of Live Birth', 'Accomplished Delayed Registration Form & Notarized Affidavit of Delayed Registration', 'Valid IDs of parents and applicant', 'At least TWO (2) supporting documentary proofs (Baptismal, Form 137, Immunization card, Voter\'s cert, SSS)'],
    fee_note: '₱200.00 (Late filing + posting fee) — pay at Municipal Treasurer',
    processing_time: '10-12 working days (10-day posting period)',
  },
  {
    office_name: 'Civil Registrar',
    name: 'Certified True Copy of Civil Registry Document',
    description: 'Official certified true copy or extract of Birth, Marriage, or Death certificate on file in the local registry.',
    requirements: ['One (1) Valid Government ID of requester', 'Accomplished Request Slip (Book/Page/Registry No.)', 'Notarized Authorization Letter / SPA (if representative)'],
    fee_note: '₱100.00 per copy — pay at Civil Registrar / Treasurer',
    processing_time: '1-2 working days',
  },
  {
    office_name: 'Civil Registrar',
    name: 'Marriage License Application',
    description: 'Application for marriage license required prior to solemnization of marriage.',
    requirements: ['PSA Birth Certificates of both parties', 'PSA CENOMAR valid within 6 months', 'Certificate of Pre-Marriage Counseling (PMOC) from CSWDO & Health Office', 'Community Tax Certificate (Cedula) of both parties', 'Valid IDs of both parties', 'Parental Consent (18-20) / Advice (21-24) if applicable'],
    fee_note: '₱200.00 – ₱300.00 — pay at Municipal Treasurer',
    processing_time: '10-12 working days (10-day posting period)',
  },
  {
    office_name: 'Civil Registrar',
    name: 'Certificate of Death (Timely Registration)',
    description: 'Registration of death within 30 days of occurrence.',
    requirements: ['Triplicate Certificate of Death (Form 103) signed by attending physician / MHO', 'Valid ID of informant / nearest surviving kin', 'Barangay Death Certificate or Hospital Medical Record'],
    fee_note: 'Free for timely registration',
    processing_time: 'Same day / 1 working day',
  },
  {
    office_name: 'Civil Registrar',
    name: 'Legitimation of Child (R.A. 9858)',
    description: 'Legal process legitimizing children born out of wedlock upon subsequent marriage of biological parents.',
    requirements: ['Child\'s Certified Certificate of Live Birth (Local & PSA)', 'Parents\' Certified Marriage Contract (Local & PSA)', 'Joint Notarized Affidavit of Legitimation', 'PSA CENOMAR of both parents', 'Valid IDs of both parents'],
    fee_note: '₱250.00 — pay at Municipal Treasurer',
    processing_time: '3-5 working days',
  },
  {
    office_name: 'Civil Registrar',
    name: 'Correction of Clerical Error (R.A. 9048 / R.A. 10172)',
    description: 'Administrative petition to correct typographical or clerical errors in birth, marriage, or death records.',
    requirements: ['Verified Petition Form under oath', 'PSA Security Paper (SECPA) copy of erroneous document', 'Earliest school record (Form 137 / Diploma)', 'Baptismal Certificate / Early church records', 'NBI or Police Clearance', 'Two (2) supporting public/private IDs/records with correct info'],
    fee_note: '₱1,000.00 (RA 9048) / ₱3,000.00 (RA 10172) — pay at Municipal Treasurer',
    processing_time: '15-20 working days',
  },

  // Barangay Affairs
  {
    office_name: 'Barangay Affairs',
    name: 'Barangay Clearance (Employment / General)',
    description: 'Barangay certification verifying that the resident has no derogatory record in the community.',
    requirements: ['One (1) Valid Photo ID', 'Community Tax Certificate (Cedula) for current year', 'Proof of residency (Utility bill / attestation)'],
    fee_note: '₱50.00 – ₱100.00 (Free for First-Time Jobseekers under RA 11261)',
    processing_time: 'Same day / 1 working day',
  },
  {
    office_name: 'Barangay Affairs',
    name: 'Barangay Certificate of Residency',
    description: 'Certification of bona fide residency within the territorial jurisdiction of the barangay.',
    requirements: ['One (1) Valid ID with current address', 'Proof of residency (Utility bill, lease contract, or homeowner certification)'],
    fee_note: '₱50.00 — pay at Barangay Hall',
    processing_time: 'Same day',
  },
  {
    office_name: 'Barangay Affairs',
    name: 'Barangay Certificate of Indigency',
    description: 'Certification of indigent status for medical, financial, educational, or legal assistance.',
    requirements: ['One (1) Valid ID of applicant', 'Proof of assistance need (Hospital bill, prescription, enrollment form, or PAO referral)'],
    fee_note: 'Free / No charge',
    processing_time: 'Same day',
  },
  {
    office_name: 'Barangay Affairs',
    name: 'Barangay Business Clearance',
    description: 'Barangay-level commercial clearance required prior to Mayor\'s Permit application.',
    requirements: ['DTI / SEC / CDA Registration Certificate', 'Contract of Lease or Land Title / Tax Dec', 'Community Tax Certificate (Cedula) of owner', 'Valid ID of business owner'],
    fee_note: '₱200.00 – ₱500.00 (per barangay ordinance)',
    processing_time: '1-2 working days',
  },

  // Municipal Treasurer
  {
    office_name: 'Treasurer\'s Office',
    name: 'Community Tax Certificate (Cedula)',
    description: 'Annual community tax certificate issued to residents and corporations upon assessment of gross income.',
    requirements: ['One (1) Valid Government ID', 'Proof of income / BIR 2316 / Payslip (for employed)'],
    fee_note: '₱5.00 basic + ₱1.00 per ₱1,000 gross earnings — pay at Treasurer',
    processing_time: '15-30 minutes / Same day',
  },
  {
    office_name: 'Treasurer\'s Office',
    name: 'Real Property Tax (RPT / Land Tax) Payment',
    description: 'Annual payment of ad valorem real property taxes on land, buildings, and improvements.',
    requirements: ['Previous Year Real Property Tax Official Receipt (OR)', 'Copy of Tax Declaration (TDN) from Assessor\'s Office', 'Valid ID of owner or representative'],
    fee_note: '1% Basic RPT + 1% SEF of assessed property value',
    processing_time: 'Same day / 1 working day',
  },
  {
    office_name: 'Treasurer\'s Office',
    name: 'Real Property Tax Clearance',
    description: 'Certification showing all real property tax obligations on a declared property have been fully settled.',
    requirements: ['Official Receipts of full RPT payment for current year', 'Copy of Tax Declaration', 'Valid ID of applicant'],
    fee_note: '₱50.00 – ₱100.00 clearance fee — pay at Treasurer',
    processing_time: '1 working day / Same day',
  },
  {
    office_name: 'Treasurer\'s Office',
    name: 'Transfer Tax Payment & Certification',
    description: 'Tax on the sale, donation, or transfer of real property ownership.',
    requirements: ['Notarized Deed of Absolute Sale, Donation, or Extrajudicial Settlement', 'BIR Certificate Authorizing Registration (CAR) & Tax Receipts', 'Certified True Copy of Land Title (TCT / CCT)', 'Updated Tax Declaration and RPT Tax Clearance'],
    fee_note: '0.5% – 0.75% of selling price or fair market value',
    processing_time: '1-2 working days',
  },

  // Assessor's Office
  {
    office_name: 'Assessor\'s Office',
    name: 'Transfer / Issuance of Tax Declaration',
    description: 'Updating the official assessment record and issuing a new Tax Declaration under the buyer/transferee name.',
    requirements: ['Registered Deed of Conveyance stamped by Registry of Deeds', 'New Transfer Certificate of Title (TCT) under buyer\'s name', 'BIR Certificate Authorizing Registration (CAR)', 'Transfer Tax Official Receipt (Treasurer)', 'Updated Real Property Tax Clearance (Treasurer)'],
    fee_note: '₱100.00 – ₱200.00 transfer & inspection fee — pay at Treasurer',
    processing_time: '3-5 working days',
  },
  {
    office_name: 'Assessor\'s Office',
    name: 'Certified True Copy of Tax Declaration',
    description: 'Official certified copy of a property\'s current Tax Declaration record.',
    requirements: ['One (1) Valid Government ID of owner / requester', 'Tax Declaration Number or Property Identification Number (PIN)', 'Authorization Letter / SPA (if representative)'],
    fee_note: '₱50.00 – ₱100.00 per copy — pay at Treasurer',
    processing_time: 'Same day / 1 working day',
  },

  // MPDO
  {
    office_name: 'Municipal Planning and Development Office',
    name: 'Locational / Zoning Clearance',
    description: 'Certification of compliance with municipal zoning ordinances and Comprehensive Land Use Plan (CLUP).',
    requirements: ['Duly accomplished Locational Clearance Application Form', 'Certified True Copy of Land Title (TCT) or Contract of Lease', 'Vicinity Map and Site Development Plan signed & sealed by licensed Architect/Civil Engineer', 'Barangay Clearance for Construction / Business', 'Current Year Real Property Tax Official Receipt'],
    fee_note: 'Assessed per square meter / project cost schedule',
    processing_time: '3-5 working days',
  },

  // OBO / Engineering
  {
    office_name: 'Office of the Building Official (OBO)',
    name: 'Building Permit (New Construction / Renovation)',
    description: 'Official statutory permit to erect, alter, repair, or demolish structures under P.D. 1096.',
    requirements: ['Accomplished Unified Building Permit Application Forms', '5 sets of complete Architectural, Structural, Electrical, Sanitary, and Mechanical Plans (signed & sealed by PRC licensed professionals with valid PTR)', 'Certified True Copy of Land Title (TCT) & Tax Declaration', 'Structural Design Computations (for buildings >2 storeys)', 'Bill of Materials and Cost Estimates / Specifications', 'Locational / Zoning Clearance (MPDO)', 'Fire Safety Evaluation Clearance (FSEC from BFP)', 'Barangay Construction Clearance'],
    fee_note: 'Assessed per NBCP Schedule of Fees — pay at Treasurer',
    processing_time: '7-15 working days',
  },
  {
    office_name: 'Office of the Building Official (OBO)',
    name: 'Certificate of Occupancy',
    description: 'Authorization that a completed building structure complies with all safety codes and is fit for occupancy.',
    requirements: ['Accomplished Certificate of Completion Forms signed & sealed by supervising engineer', 'Approved Building Permit & Official Receipts', 'As-Built Plans (if deviations occurred)', 'Fire Safety Inspection Certificate for Occupancy (BFP)', 'Construction Logbook signed by engineer in-charge'],
    fee_note: 'Assessed based on floor area & occupancy category',
    processing_time: '5-7 working days',
  },

  // Health Office
  {
    office_name: 'Health Office',
    name: 'Sanitary Permit to Operate (Establishments)',
    description: 'Health and sanitation clearance required for commercial, food, and industrial establishments under P.D. 856.',
    requirements: ['Business Permit Application / Registration details', 'Microbiological & Physico-Chemical Water Analysis Test Results (from DOH-accredited lab)', 'Employee Health Certificates (Health Cards) of all staff', 'Pest Control Management Certification'],
    fee_note: 'Assessed by Health Office — pay at Municipal Treasurer',
    processing_time: '2-3 working days',
  },
  {
    office_name: 'Health Office',
    name: 'Food Handler\'s Health Certificate (Health Card)',
    description: 'Individual medical certificate certifying that food service and personal care workers are free from communicable diseases.',
    requirements: ['Chest X-Ray result (Normal / Clear) within last 6 months', 'Routine Stool Examination / Fecalysis result (Negative)', 'Routine Urinalysis examination result', 'One (1) 1x1 or 2x2 ID picture'],
    fee_note: '₱50.00 – ₱100.00 — pay at Health Office / Treasurer',
    processing_time: '1 working day (after lab submissions)',
  },

  // MSWDO
  {
    office_name: 'MSWDO',
    name: 'Crisis Assistance (AICS / Financial & Medical Aid)',
    description: 'Emergency financial, hospitalization, medication, burial, or transportation assistance for indigent residents in crisis.',
    requirements: ['Barangay Certificate of Indigency for Financial/Medical Assistance', 'Valid Government ID of beneficiary and claimant', 'Medical Abstract / Itemized Hospital Bill / Official Prescriptions (for medical aid)', 'Certified Death Certificate & Funeral Contract / Statement of Account (for burial aid)'],
    fee_note: 'Free / No charge',
    processing_time: '1-2 working days',
  },
  {
    office_name: 'MSWDO',
    name: 'Senior Citizen ID Registration & Booklet',
    description: 'Issuance of Senior Citizen National ID and purchase booklet for residents 60 years old and above under R.A. 9994.',
    requirements: ['PSA / Local Birth Certificate proving age 60+ (or valid Passport / Voter\'s ID)', 'Barangay Certificate of Residency', 'Two (2) copies 1x1 recent ID photos'],
    fee_note: 'Free / No charge',
    processing_time: 'Same day / 1-2 working days',
  },
  {
    office_name: 'MSWDO',
    name: 'Person with Disability (PWD) ID Application',
    description: 'Official identification card and purchase booklet for persons with permanent disabilities under R.A. 10754.',
    requirements: ['Medical Certificate / Disability Assessment Form signed by licensed physician', 'Barangay Certificate of Residency', 'Two (2) copies 1x1 recent ID photos', 'One (1) Valid ID of applicant or parent/guardian'],
    fee_note: 'Free / No charge',
    processing_time: '1-3 working days',
  }
];

export default function EservicesCatalogPage() {
  const params = useSearchParams();
  const lguNameParam = params?.get('lguName') || 'Liliw, Laguna';
  const lguId = lguIdFromName(lguNameParam);
  const { showToast, ToastContainer } = useToast();

  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CatalogService | null>(null);

  // Form state — selectedId null means "creating a new service".
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [officeName, setOfficeName] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState('');
  const [feeNote, setFeeNote] = useState('Pay at the Municipal Hall');
  const [processingTime, setProcessingTime] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const requirementInputRef = useRef<HTMLInputElement>(null);

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setSelectedId(null);
    setOfficeName(preset.office_name);
    setName(preset.name);
    setDescription(preset.description);
    setRequirements(preset.requirements);
    setNewRequirement('');
    setFeeNote(preset.fee_note);
    setProcessingTime(preset.processing_time);
    setIsActive(true);
    setSortOrder(services.length);
    showToast(`Pre-filled: ${preset.name}`, 'info');
  };

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lgu_services')
      .select('id, office_name, name, description, requirements, fee_note, processing_time, is_active, sort_order')
      .eq('lgu_id', lguId)
      .order('sort_order', { ascending: true });

    if (error) {
      showToast(error.message || 'Failed to load catalog', 'error');
    } else {
      setServices((data || []).map((r: any) => ({ ...r, requirements: Array.isArray(r.requirements) ? r.requirements : [] })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
    // showToast is deliberately excluded — useToast() returns a new function
    // reference on every render, so including it here would refetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lguId]);

  const resetForm = () => {
    setSelectedId(null);
    setOfficeName('');
    setName('');
    setDescription('');
    setRequirements([]);
    setNewRequirement('');
    setFeeNote('Pay at the Municipal Hall');
    setProcessingTime('');
    setIsActive(true);
    setSortOrder(services.length);
  };

  const handleSelect = (id: string) => {
    const s = services.find(x => x.id === id);
    if (!s) return;
    setSelectedId(s.id);
    setOfficeName(s.office_name);
    setName(s.name);
    setDescription(s.description || '');
    setRequirements(s.requirements);
    setNewRequirement('');
    setFeeNote(s.fee_note);
    setProcessingTime(s.processing_time || '');
    setIsActive(s.is_active);
    setSortOrder(s.sort_order);
  };

  const addRequirement = () => {
    const val = newRequirement.trim();
    if (!val) return;
    setRequirements(prev => [...prev, val]);
    setNewRequirement('');
    requirementInputRef.current?.focus();
  };

  const removeRequirement = (idx: number) => {
    setRequirements(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!officeName.trim()) return showToast('Please enter the office name.', 'info');
    if (!name.trim()) return showToast('Please enter the document/service name.', 'info');

    setSaving(true);
    try {
      const row = {
        lgu_id: lguId,
        office_name: officeName.trim(),
        name: name.trim(),
        description: description.trim() || null,
        requirements,
        fee_note: feeNote.trim() || 'Pay at the Municipal Hall',
        processing_time: processingTime.trim() || null,
        is_active: isActive,
        sort_order: sortOrder,
      };

      if (selectedId) {
        const { error } = await supabase.from('lgu_services').update(row).eq('id', selectedId);
        if (error) throw error;
        showToast('Service updated.', 'success');
      } else {
        const { error } = await supabase.from('lgu_services').insert(row);
        if (error) throw error;
        showToast('Service added to the citizen catalog.', 'success');
      }
      resetForm();
      fetchServices();
    } catch (err: any) {
      showToast(err.message || 'Failed to save service', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    const { error } = await supabase.from('lgu_services').delete().eq('id', target.id);
    if (error) {
      showToast(error.message || 'Failed to delete service', 'error');
      return;
    }
    if (selectedId === target.id) resetForm();
    showToast('Service removed from the citizen catalog.', 'success');
    fetchServices();
  };

  const toggleActive = async (s: CatalogService) => {
    const { error } = await supabase.from('lgu_services').update({ is_active: !s.is_active }).eq('id', s.id);
    if (error) {
      showToast(error.message || 'Failed to update service', 'error');
      return;
    }
    fetchServices();
  };

  return (
    <DashboardLayout role="lgu-admin" title="eServices Catalog">
      <ToastContainer />
      {loading && (
        <div className="mb-3 px-4 py-2 text-sm text-text-muted bg-surface-alt rounded-md animate-pulse">
          Loading catalog…
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Preset Templates + Form */}
        <div className="lg:col-span-1 space-y-4">
          {/* Preset Templates */}
          <Card noBorder className="shadow-sm">
            <CardHeader title="Quick Templates" subtitle="Select a preset to pre-fill the form" />
            <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className="w-full text-left px-3 py-2 text-xs font-semibold bg-surface-alt hover:bg-indigo-500/10 hover:text-indigo-600 border border-theme rounded-md transition-all flex flex-col gap-0.5 focus:outline-none"
                >
                  <span className="text-text-primary font-bold">{preset.name}</span>
                  <span className="text-text-faint">{preset.office_name} · Req: {preset.requirements.length}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Form */}
          <Card noBorder className="shadow-sm">
            <CardHeader title={selectedId ? 'Edit Service' : 'Add Service'} subtitle="Shown to citizens in the mobile app" />
            <div className="space-y-4">
              <Input label="Office" placeholder="BPLO" value={officeName} onChange={(e: any) => setOfficeName(e.target.value)} />
              <Input label="Document / Service Name" placeholder="New Business Permit" value={name} onChange={(e: any) => setName(e.target.value)} />

              <div>
                <label className="block text-sm text-text-muted mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description shown on the citizen detail card…"
                  className="w-full px-3 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-1.5">Requirements Checklist</label>
                <div className="flex gap-2 mb-2">
                  <input
                    ref={requirementInputRef}
                    type="text"
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRequirement(); } }}
                    placeholder="e.g. Valid ID"
                    className="flex-1 px-3 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
                  />
                  <Button variant="secondary" size="sm" onClick={addRequirement}>
                    <Add className="w-4 h-4" />
                  </Button>
                </div>
                <ul className="space-y-1">
                  {requirements.map((req, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 text-sm bg-surface-alt rounded-md px-3 py-1.5">
                      <span className="text-text-primary">{req}</span>
                      <button onClick={() => removeRequirement(i)} className="text-text-faint hover:text-red-600 dark:text-red-400">
                        <CloseCircle className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                  {requirements.length === 0 && (
                    <li className="text-xs text-text-faint italic">No requirements added yet.</li>
                  )}
                </ul>
              </div>

              <Input label="Fee Note" placeholder="Pay at the Municipal Hall" value={feeNote} onChange={(e: any) => setFeeNote(e.target.value)} />
              <Input label="Processing Time" placeholder="3-5 working days" value={processingTime} onChange={(e: any) => setProcessingTime(e.target.value)} />
              <Input label="Sort Order" type="number" value={String(sortOrder)} onChange={(e: any) => setSortOrder(parseInt(e.target.value, 10) || 0)} />

              <label className="flex items-center gap-2 text-sm text-text-primary">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Active (visible to citizens)
              </label>

              <div className="pt-4 border-t border-theme flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? 'Saving…' : selectedId ? 'Save Changes' : 'Add Service'}
                </Button>
                {selectedId && (
                  <>
                    <Button variant="secondary" disabled={saving} onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      disabled={saving}
                      onClick={() => {
                        const s = services.find(x => x.id === selectedId);
                        if (s) setDeleteTarget(s);
                      }}
                    >
                      <Trash variant="Bold" className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* List */}
        <Card noBorder className="lg:col-span-2 shadow-sm" padding="sm">
          <p className="text-xs font-bold text-text-faint uppercase tracking-wider px-2 pt-1 pb-2">
            Catalog ({services.length})
          </p>
          <div className="divide-y divide-theme">
            {services.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-between gap-3 px-3 py-3 cursor-pointer ${selectedId === s.id ? 'bg-surface-alt' : 'hover:bg-surface-alt'}`}
                onClick={() => handleSelect(s.id)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{s.name}</p>
                  <p className="text-xs text-text-muted">{s.office_name} · {s.fee_note}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={s.is_active ? 'success' : 'default'}>{s.is_active ? 'Active' : 'Hidden'}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e: any) => { e.stopPropagation(); toggleActive(s); }}
                  >
                    {s.is_active ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </div>
            ))}
            {services.length === 0 && !loading && (
              <p className="px-3 py-6 text-sm text-text-muted">No services yet — add the first one from the form.</p>
            )}
          </div>
        </Card>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete service"
        message={`Remove "${deleteTarget?.name}" from the catalog? Citizens will no longer be able to request it.`}
        confirmText="Delete"
        variant="danger"
      />
    </DashboardLayout>
  );
}
