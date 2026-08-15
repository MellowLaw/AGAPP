# Philippine Local Government Citizen Services — Master E-Services Specification
**Project**: AGAPP (Automated Governance and Assistance Platform for the Philippines)  
**Legal Bases**: R.A. 11032 (Ease of Doing Business Act), R.A. 7160 (Local Government Code of 1991), R.A. 8792 (E-Commerce Act of 2000), R.A. 10173 (Data Privacy Act of 2012)  
**Primary Reference Documents**: `lgu-deep-research-report.md`, `PH_LGU_Citizen_Services_Research.md`  
**Date**: August 15, 2026

---

## 1. Executive Architecture & Digital-Physical Model

The AGAPP E-Services module digitizes the end-to-end citizen transaction lifecycle while maintaining strict compliance with Philippine administrative law and statutory counter-verification requirements:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CITIZEN PORTAL (Web & Mobile)                   │
│  1. Select Service & Review Official Requirements                           │
│  2. Fill Digital Application Form (Purpose, Copies, Barangay)               │
│  3. Upload Scanned Document Requirements / Photos (PDF, PNG, JPG)           │
│  4. Receive Real-Time Tracking Code & Digital Claim Pass QR Code            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Realtime Cloud Storage
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MUNICIPAL ADMIN & BACKROOM (BOSS)                 │
│  1. In-Office Queue: Staff verifies completeness of uploaded digital proofs │
│  2. Multi-Office Assessment (BPLO, MPDO, Health, Engineering, Treasurer)    │
│  3. Approval & Document Encoding / Printing                                 │
│  4. Generate Pickup Claim Code → Notify Citizen "Ready for Pickup"          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         IN-PERSON RELEASING & VERIFICATION                  │
│  • Citizen presents Digital Claim Pass QR Code at Municipal Releasing Counter│
│  • ⚠️ MANDATORY PHYSICAL CHECK: Citizen presents original/photocopy         │
│    requirements and settles assessed fees (if not paid online)              │
│  • Officer scans Claim QR Code → Hands over Official Document Stub          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Master Catalog of Standard Philippine LGU Citizen Services

Below is the definitive catalog of 24 standardized Philippine Municipal/City Hall E-Services, categorized by responsible municipal office.

---

### A. Local Civil Registrar (LCR / MCRO / CCRO)

#### 1. Timely Birth Registration (Certificate of Live Birth)
- **Legal Basis**: Act No. 3753, P.D. 651
- **Eligibility**: Parents, guardians, or hospital/midwife informants within 30 days of birth.
- **Statutory SLA**: Simple (1-3 working days).
- **Fees**: Free of charge for basic registration.
- **Requirements Checklist**:
  1. Duly accomplished Certificate of Live Birth (COLB Form 102) signed by attending physician/midwife
  2. Valid IDs of both parents
  3. Marriage Certificate of parents (if married)
  4. 6 copies of Notarized Affidavit to Use the Surname of the Father (AUSF) & Affidavit of Admission of Paternity (AAP) (if unmarried)

#### 2. Delayed / Late Birth Registration (> 30 days)
- **Legal Basis**: Act No. 3753, Circular No. 91-6
- **Eligibility**: Registrant, parents, or authorized representative for births exceeding 30 days.
- **Statutory SLA**: Complex (10-12 working days, inclusive of mandatory 10-day public posting period).
- **Fees**: ~₱200 (Late registration fee + posting fee).
- **Requirements Checklist**:
  1. PSA Negative Certificate of Live Birth (Proof of No Record)
  2. Duly accomplished Delayed Registration Application Form & Notarized Affidavit of Delayed Registration
  3. Valid IDs of parents and applicant
  4. At least TWO (2) supporting documentary proofs: Baptismal Certificate, School Form 137 / Transcript, Immunization / Baby Card, Voter's Certification, SSS / PhilHealth record

#### 3. Certified True Copy of Civil Registry Documents (Birth / Marriage / Death)
- **Legal Basis**: Act No. 3753
- **Eligibility**: Document owner, spouse, parent, direct descendant, or authorized representative with SPA.
- **Statutory SLA**: Simple (Same day to 1-2 working days).
- **Fees**: ~₱50 – ₱100 per certified copy.
- **Requirements Checklist**:
  1. One (1) Valid Government-issued ID of requester
  2. Formal Application Slip specifying registry number, book number, and page number (if known)
  3. Notarized Authorization Letter / Special Power of Attorney (if filed by a representative)

#### 4. Marriage License Application
- **Legal Basis**: Family Code of the Philippines (E.O. 209)
- **Eligibility**: Intending couple (both Filipino citizens or with foreign partner, age 18 and above; both must appear in person).
- **Statutory SLA**: Complex (10-12 working days, inclusive of mandatory 10-day public posting period).
- **Fees**: ~₱200 – ₱300 application and licensing fee.
- **Requirements Checklist**:
  1. PSA / Local Certified Birth Certificates of both parties
  2. PSA Certificate of No Marriage Record (CENOMAR) valid within 6 months
  3. Certificate of Pre-Marriage Orientation & Counseling (PMOC) from CSWDO & Municipal Health Office
  4. Community Tax Certificate (Cedula) of both parties
  5. Valid Government IDs of both parties
  6. Notarized Parental Consent (for ages 18-20) OR Parental Advice (for ages 21-24)
  7. Certificate of Legal Capacity to Contract Marriage & Passport (if foreign national)

#### 5. Registration of Certificate of Death (Timely)
- **Legal Basis**: Act No. 3753, P.D. 856
- **Eligibility**: Nearest surviving relative, hospital informant, or funeral director within 30 days of death.
- **Statutory SLA**: Simple (1-2 working days / Same day).
- **Fees**: Free for timely registration; minimal burial/transfer fee if applicable.
- **Requirements Checklist**:
  1. Duly accomplished Certificate of Death (Form 103) signed by attending physician or Municipal Health Officer
  2. Valid ID of informant / nearest surviving kin
  3. Barangay Death Certificate or Hospital Medical Records (if died at home or lying-in)

#### 6. Legitimation of Children Born Out of Wedlock (R.A. 9858)
- **Legal Basis**: Republic Act No. 9858 (Legitimation of Children Born to Parents Without Legal Impediment)
- **Eligibility**: Biological parents who subsequently married after the child's birth.
- **Statutory SLA**: Complex (3-5 working days plus PSA endorsement).
- **Fees**: ~₱250 total (Legitimation fee + registry endorsement).
- **Requirements Checklist**:
  1. Child's Certified Certificate of Live Birth (Local & PSA copy)
  2. Certified Marriage Contract of parents (Local & PSA copy)
  3. Joint Notarized Affidavit of Legitimation executed by both parents
  4. PSA CENOMAR of both parents showing no legal impediment at time of child's conception
  5. Valid IDs of both parents

#### 7. Correction of Clerical / Typographical Errors (R.A. 9048 / R.A. 10172)
- **Legal Basis**: Republic Act 9048 (Clerical errors) & Republic Act 10172 (Day/month of birth and gender)
- **Eligibility**: Document owner or nearest relative with direct interest.
- **Statutory SLA**: Highly Technical (15-20 working days plus PSA national annotation).
- **Fees**: ₱1,000 (R.A. 9048 clerical error) or ₱3,000 (R.A. 10172 day/month/gender correction).
- **Requirements Checklist**:
  1. Verified Petition Form under oath specifying the erroneous entry and proposed correction
  2. PSA Security Paper copy of the erroneous civil registry document
  3. Earliest school records (Form 137 / Elementary Diploma)
  4. Baptismal Certificate / Early church records
  5. NBI / Police Clearance of petitioner
  6. Two (2) public/private records showing correct spelling/date (e.g. Voter's record, SSS, Passport)

---

### B. Barangay Affairs & Barangay Hall Services

#### 8. Barangay Clearance (Employment / General Purpose)
- **Legal Basis**: Local Government Code of 1991, Sec. 152
- **Eligibility**: Bonafide resident of the barangay.
- **Statutory SLA**: Simple (Same day / 1 working day).
- **Fees**: ~₱50.00 – ₱100.00 (or free for indigent first-time jobseekers under RA 11261).
- **Requirements Checklist**:
  1. One (1) Valid Government-issued photo ID
  2. Community Tax Certificate (Cedula) for the current year
  3. Proof of residency (Utility bill or Barangay Kagawad attestation)

#### 9. Barangay Certificate of Residency
- **Legal Basis**: R.A. 7160
- **Eligibility**: Resident currently living within the barangay jurisdiction.
- **Statutory SLA**: Simple (Same day / 1 working day).
- **Fees**: ~₱50.00 (or free for indigent).
- **Requirements Checklist**:
  1. One (1) Valid ID with current residential address
  2. Proof of residency (Lease contract, Meralco/Water utility bill, or homeowner cert)

#### 10. Barangay Certificate of Indigency
- **Legal Basis**: R.A. 7160, DSWD Guidelines
- **Eligibility**: Low-income or marginalized resident seeking medical, educational, or legal assistance.
- **Statutory SLA**: Simple (Same day).
- **Fees**: FREE / No Charge.
- **Requirements Checklist**:
  1. One (1) Valid ID of applicant
  2. Purpose document (Hospital bill, medical prescription, school assessment form, or PAO referral)

#### 11. Barangay Business Clearance (Barangay Business Permit)
- **Legal Basis**: R.A. 7160 Sec. 152(c)
- **Eligibility**: Business owner operating within the territorial jurisdiction of the barangay.
- **Statutory SLA**: Simple (1-2 working days).
- **Fees**: Based on barangay revenue ordinance (₱200 – ₱500).
- **Requirements Checklist**:
  1. DTI Business Name Certificate (Sole Proprietorship) OR SEC Registration (Corporation/Partnership)
  2. Contract of Lease OR Land Title / Tax Declaration of business location
  3. Community Tax Certificate (Cedula) of proprietor
  4. Valid Government ID of business owner

---

### C. Business Permits & Licensing Office (BPLO / BOSS)

#### 12. New Business Permit (Mayor's Permit — New Application)
- **Legal Basis**: R.A. 7160, R.A. 11032 Ease of Doing Business Act
- **Eligibility**: Registered business entity establishing operations within the municipality.
- **Statutory SLA**: Complex (3-5 working days through Business One-Stop Shop).
- **Fees**: Assessed based on capitalization, line of business, regulatory fees (paid at Municipal Treasurer).
- **Requirements Checklist**:
  1. DTI Business Name Registration (Sole Prop) or SEC Articles & By-Laws (Corporation) or CDA Registration (Cooperative)
  2. Barangay Business Clearance with Official Receipt from the barangay of location
  3. Contract of Lease (if renting) OR Transfer Certificate of Title / Tax Declaration (if owned)
  4. Locational / Zoning Clearance (from MPDO)
  5. Fire Safety Inspection Certificate (from BFP)
  6. Sanitary Permit to Operate (from Municipal Health Office)
  7. Sketch / Vicinity Map of business location

#### 13. Business Permit Renewal
- **Legal Basis**: Local Government Code of 1991, Local Revenue Code
- **Eligibility**: Existing business operating with prior year Mayor's Permit (filed every January 1-20).
- **Statutory SLA**: Simple to Complex (1-3 working days).
- **Fees**: Assessed based on previous year gross sales / receipts.
- **Requirements Checklist**:
  1. Previous Year Mayor's Permit & Official Receipt
  2. Current Year Barangay Business Clearance
  3. Audited Financial Statement (AFS) or BIR Form 1701/1702 or Notarized Sworn Statement of Gross Sales
  4. Current Year Fire Safety Inspection Certificate (BFP)
  5. Current Year Sanitary Permit & Employee Health Cards

#### 14. Occupational / Work Permit (Mayor's Permit for Workers)
- **Legal Basis**: Local Revenue Code
- **Eligibility**: Individuals employed or practicing an occupation/trade within the municipality.
- **Statutory SLA**: Simple (1-2 working days).
- **Fees**: ~₱100 – ₱200 regulatory fee.
- **Requirements Checklist**:
  1. One (1) Valid Government ID
  2. Health Certificate (Health Card) from the Municipal Health Office
  3. Police Clearance or NBI Clearance
  4. Community Tax Certificate (Cedula)

---

### D. Municipal Treasurer's Office (Treasury & Local Taxation)

#### 15. Community Tax Certificate (Cedula)
- **Legal Basis**: Local Government Code of 1991, Sec. 156-164
- **Eligibility**: Every resident 18 years of age or over who has been regularly employed or owns real property.
- **Statutory SLA**: Simple (15-30 minutes / Same day).
- **Fees**: ₱5.00 basic + ₱1.00 per ₱1,000 of gross earnings/income from business/profession.
- **Requirements Checklist**:
  1. One (1) Valid Government ID
  2. Proof of Income / BIR 2316 / Payslip (for employed individuals)

#### 16. Real Property Tax (RPT / Land Tax) Payment & Statement of Account (SOA)
- **Legal Basis**: Local Government Code of 1991, Title II (Real Property Taxation)
- **Eligibility**: Declared real property owner or authorized representative.
- **Statutory SLA**: Simple (Same day / 1 working day).
- **Fees**: 1% basic real property tax + 1% Special Education Fund (SEF) of assessed value.
- **Requirements Checklist**:
  1. Previous Year Real Property Tax Official Receipt (OR)
  2. Copy of Tax Declaration (TDN) from Assessor's Office
  3. Valid ID of property owner or representative

#### 17. Real Property Tax Clearance
- **Legal Basis**: Local Revenue Code
- **Eligibility**: Property owner with all RPT obligations settled for the current and prior years.
- **Statutory SLA**: Simple (1 working day / Same day).
- **Fees**: ~₱50.00 – ₱100.00 certification fee.
- **Requirements Checklist**:
  1. Official Receipts of full RPT payment for current year
  2. Copy of Tax Declaration
  3. Valid ID of applicant

#### 18. Transfer Tax Payment & Certification (Real Property Transfer)
- **Legal Basis**: R.A. 7160 Sec. 135
- **Eligibility**: Buyer, seller, or transferee of real property within 60 days of deed execution.
- **Statutory SLA**: Simple (1-2 working days).
- **Fees**: 0.5% – 0.75% of total consideration or fair market value (whichever is higher).
- **Requirements Checklist**:
  1. Notarized Deed of Absolute Sale, Donation, or Extrajudicial Settlement
  2. BIR Certificate Authorizing Registration (CAR) & Tax Return Receipts
  3. Certified True Copy of Transfer Certificate of Title (TCT / CCT)
  4. Updated Tax Declaration and RPT Tax Clearance

---

### E. Municipal Assessor's Office

#### 19. Transfer / Issuance of Tax Declaration (New Ownership)
- **Legal Basis**: Local Government Code of 1991, Property Assessment Rules
- **Eligibility**: New property owner or authorized representative with SPA.
- **Statutory SLA**: Complex (3-5 working days).
- **Fees**: ~₱100.00 – ₱200.00 transfer and inspection fee.
- **Requirements Checklist**:
  1. Registered Deed of Conveyance (Deed of Sale/Donation) stamped by Registry of Deeds
  2. New Transfer Certificate of Title (TCT) under buyer's name
  3. BIR Certificate Authorizing Registration (CAR)
  4. Real Property Transfer Tax Official Receipt (from Treasurer)
  5. Updated Real Property Tax Clearance (from Treasurer)

#### 20. Certified True Copy of Tax Declaration
- **Legal Basis**: Assessment Regulations
- **Eligibility**: Declared owner, mortgagor, or authorized representative.
- **Statutory SLA**: Simple (Same day / 1 working day).
- **Fees**: ~₱50.00 – ₱100.00 per copy.
- **Requirements Checklist**:
  1. Valid Government ID of owner / requester
  2. Tax Declaration Number / Property Identification Number (PIN)
  3. Authorization Letter / SPA (if representative)

---

### F. Municipal Planning & Development Office (MPDO / Zoning)

#### 21. Locational / Zoning Clearance
- **Legal Basis**: Housing and Land Use Regulatory Board (DHSUD) guidelines, Comprehensive Land Use Plan (CLUP)
- **Eligibility**: Property owner or developer applying for building permit or business establishment.
- **Statutory SLA**: Complex (3-5 working days).
- **Fees**: Assessed per square meter / project cost schedule.
- **Requirements Checklist**:
  1. Duly accomplished Locational Clearance Application Form
  2. Certified True Copy of Land Title (TCT) or Contract of Lease
  3. Vicinity Map and Architectural Site Development Plan (signed and sealed by licensed Architect/Civil Engineer)
  4. Barangay Clearance for Zoning / Construction
  5. Real Property Tax Official Receipt for current year

---

### G. Office of the Building Official (OBO / Municipal Engineering)

#### 22. Building Permit (New Construction / Alteration / Renovation)
- **Legal Basis**: P.D. 1096 (National Building Code of the Philippines)
- **Eligibility**: Registered lot owner or authorized licensed professional (Architect / Civil Engineer).
- **Statutory SLA**: Complex to Highly Technical (7-15 working days).
- **Fees**: Assessed based on NBCP Schedule of Fees (floor area, building classification).
- **Requirements Checklist**:
  1. Accomplished Building Permit Application Forms (Unified Application Form)
  2. Five (5) sets of complete Architectural, Structural, Electrical, Sanitary, and Mechanical Plans (signed & sealed by respective licensed professionals with valid PRC IDs and PTRs)
  3. Certified True Copy of Transfer Certificate of Title (TCT) & Tax Declaration
  4. Structural Design Analysis and Computations (for buildings > 2 storeys)
  5. Bill of Materials and Cost Estimates / Specifications
  6. Locational / Zoning Clearance from MPDO
  7. Fire Safety Evaluation Clearance (FSEC) from Bureau of Fire Protection (BFP)
  8. Barangay Clearance for Construction

#### 23. Certificate of Occupancy
- **Legal Basis**: P.D. 1096 Sec. 309
- **Eligibility**: Building owner upon full completion of authorized construction.
- **Statutory SLA**: Complex (5-7 working days inclusive of multi-discipline site inspection).
- **Fees**: Assessed based on building floor area and occupancy classification.
- **Requirements Checklist**:
  1. Duly accomplished Certificate of Completion Forms signed and sealed by the architect/engineer in-charge
  2. Approved Building Permit & Official Receipts of all regulatory fees
  3. As-Built Plans (if there were deviations during construction)
  4. Fire Safety Inspection Certificate (FSIC for Occupancy) from BFP
  5. Construction Logbook signed by supervising architect/engineer

---

### H. Municipal Health Office (Rural Health Unit — RHU)

#### 24. Sanitary Permit to Operate (Establishments)
- **Legal Basis**: P.D. 856 (Code on Sanitation of the Philippines)
- **Eligibility**: Food establishment owners, water refilling stations, industrial operators.
- **Statutory SLA**: Simple to Complex (2-3 working days).
- **Fees**: Assessed based on establishment type.
- **Requirements Checklist**:
  1. Business Permit Application / Registration details
  2. Microbiological & Physical-Chemical Water Analysis Test Results (from DOH-accredited laboratory)
  3. Employee Health Certificates (Health Cards) of all staff
  4. Pest Control Management Certification

#### 25. Food Handler's Health Certificate (Health Card)
- **Legal Basis**: P.D. 856
- **Eligibility**: Food handlers, servers, cooks, and personal service workers.
- **Statutory SLA**: Simple (1 working day after submission of lab clearances).
- **Fees**: ~₱50.00 – ₱100.00.
- **Requirements Checklist**:
  1. Chest X-Ray (Normal / Clear) taken within the last 6 months
  2. Routine Stool Examination / Fecalysis (Negative for ova/parasites)
  3. Urinalysis examination result
  4. One (1) 1x1 or 2x2 ID picture

---

### I. Municipal Social Welfare & Development Office (MSWDO / OSCA)

#### 26. Assistance to Individuals in Crisis Situations (AICS) / Indigency Assistance
- **Legal Basis**: DSWD Memorandum Circular No. 15, Series of 2022
- **Eligibility**: Residents experiencing sudden acute distress (medical hospitalization, death/burial, transportation, education).
- **Statutory SLA**: Simple (1-2 working days).
- **Fees**: FREE / No Charge.
- **Requirements Checklist**:
  1. Barangay Certificate of Indigency for Medical/Financial Assistance
  2. Valid Government ID of patient/beneficiary and claimant
  3. Medical Certificate / Clinical Abstract & Itemized Hospital Bill / Official Prescriptions (for medical aid)
  4. Certified Death Certificate & Funeral Contract / Statement of Account (for burial aid)

#### 27. Senior Citizen ID Registration & Booklet
- **Legal Basis**: R.A. 7432 / R.A. 9994 (Expanded Senior Citizens Act)
- **Eligibility**: Filipino citizens residing in the municipality who have reached sixty (60) years of age.
- **Statutory SLA**: Simple (Same day / 1-2 working days).
- **Fees**: FREE / No Charge.
- **Requirements Checklist**:
  1. PSA / Local Birth Certificate proving age $\ge$ 60 years old (or valid Passport / Voter's ID)
  2. Barangay Certificate of Residency
  3. Two (2) copies 1x1 recent ID photos

#### 28. Person with Disability (PWD) ID Application
- **Legal Basis**: R.A. 7277 / R.A. 10754 (Magna Carta for Persons with Disabilities)
- **Eligibility**: Residents with permanent physical, mental, intellectual, or sensory impairments.
- **Statutory SLA**: Simple (1-3 working days).
- **Fees**: FREE / No Charge.
- **Requirements Checklist**:
  1. Medical Certificate or Disability Assessment Form signed by licensed government/private physician
  2. Barangay Certificate of Residency
  3. Two (2) copies 1x1 recent ID photos
  4. One (1) Valid ID of applicant or parent/guardian (if minor)

---

## 3. Digital Requirements Upload & In-Person Verification Rule

### Digital Upload Purpose
The AGAPP web portal and mobile app enable citizens to upload digital copies (scanned PDFs or clear JPG/PNG photos) of their required documents upon initial submission. This accomplishes:
- **Pre-Assessment Efficiency**: Backroom staff (e.g. BPLO, Civil Registrar, Engineering) can inspect completeness prior to the citizen travelling to the municipal hall.
- **Queue Elimination**: Avoids citizens waiting in line only to discover they are missing a required document.

### The Physical Requirement Mandate
> [!IMPORTANT]
> In accordance with Philippine jurisprudence, anti-fraud standards, and LGU audit requirements (COA), digital uploads **do not substitute** the legal requirement to present physical originals (or certified photocopies) upon final claiming.
> 
> **Every citizen application displays the following binding legal reminder:**
> *"Paunawa: Ang pag-upload ng digital requirements ay para sa paunang pagsusuri (pre-assessment). MANDATORY po na dalhin at ipakita ang orihinal o opisyal na kopya ng mga dokumentong ito sa oras ng pag-claim at pagbabayad sa Municipal Hall."*

---

## 4. Database Schema & Data Dictionary

The catalog is stored in `lgu_services` and referenced in `service_requests`:

```sql
-- Standard LGU Services Catalog Table
CREATE TABLE lgu_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
    office_name text NOT NULL, -- e.g. 'Civil Registrar', 'BPLO', 'Treasurer', 'Assessor', 'OBO', 'Health', 'MSWDO'
    name text NOT NULL,        -- e.g. 'Late Birth Registration (>30 days)'
    description text,
    requirements jsonb DEFAULT '[]'::jsonb NOT NULL, -- Array of string requirements
    fee_note text DEFAULT 'Pay at Municipal Hall' NOT NULL,
    processing_time text,      -- e.g. '10 working days (10-day posting)'
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```
