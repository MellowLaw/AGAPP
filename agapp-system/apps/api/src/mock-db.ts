import { LGU, User, Report, ServiceRequest, AuditLog, ForumPost } from '@agapp/shared';

export const initialLgus: LGU[] = [
  {
    id: 'liliw-laguna',
    name: 'Municipality of Liliw',
    logo: 'https://placehold.co/100x100/A2B59F/1A1A1A?text=LILIW',
    bannerUrl: 'https://placehold.co/800x200/A2B59F/1a1a1a?text=Welcome+to+Liliw%2C+Laguna',
    primaryColor: '#A2B59F', // Sage Green (dusty/muted)
    secondaryColor: '#D9CDB8', // Muted Wheat
    latitude: 13.9297,
    longitude: 121.4644,
    isActive: true,
    onboardingFeePaid: true,
    featureFlags: {
      chatbot: true,
      potholeDetection: true,
      forum: true
    }
  },
  {
    id: 'nagcarlan-laguna',
    name: 'Municipality of Nagcarlan',
    logo: 'https://placehold.co/100x100/9FADB5/1A1A1A?text=NAGC',
    bannerUrl: 'https://placehold.co/800x200/9FADB5/1a1a1a?text=Welcome+to+Nagcarlan',
    primaryColor: '#9FADB5', // Dusty Blue
    secondaryColor: '#CAD3D9', // Muted Ice Blue
    latitude: 13.9214,
    longitude: 121.4157,
    isActive: true,
    onboardingFeePaid: false,
    featureFlags: {
      chatbot: false,
      potholeDetection: true,
      forum: false
    }
  },
  {
    id: 'magdalena-laguna',
    name: 'Municipality of Magdalena',
    logo: 'https://placehold.co/100x100/AE9FB5/1A1A1A?text=MGDL',
    bannerUrl: 'https://placehold.co/800x200/AE9FB5/1a1a1a?text=Welcome+to+Magdalena',
    primaryColor: '#AE9FB5', // Dusty Lilac
    secondaryColor: '#DFD9E3', // Pale Lilac
    latitude: 13.9692,
    longitude: 121.4278,
    isActive: false,
    onboardingFeePaid: false,
    featureFlags: {
      chatbot: false,
      potholeDetection: false,
      forum: false
    }
  },
  {
    id: 'majayjay-laguna',
    name: 'Municipality of Majayjay',
    logo: 'https://placehold.co/100x100/B5A59F/1A1A1A?text=MJYJ',
    bannerUrl: 'https://placehold.co/800x200/B5A59F/1a1a1a?text=Welcome+to+Majayjay',
    primaryColor: '#B5A59F', // Dusty Terracotta
    secondaryColor: '#E6DFDB', // Pale Peach
    latitude: 13.9008,
    longitude: 121.4747,
    isActive: false,
    onboardingFeePaid: false,
    featureFlags: {
      chatbot: false,
      potholeDetection: false,
      forum: false
    }
  },
  {
    id: 'pila-laguna',
    name: 'Municipality of Pila',
    logo: 'https://placehold.co/100x100/B59FA5/1A1A1A?text=PILA',
    bannerUrl: 'https://placehold.co/800x200/B59FA5/1a1a1a?text=Welcome+to+Pila',
    primaryColor: '#B59FA5', // Dusty Rose
    secondaryColor: '#E3D9DB', // Pale Rose
    latitude: 14.0625,
    longitude: 121.3653,
    isActive: false,
    onboardingFeePaid: false,
    featureFlags: {
      chatbot: false,
      potholeDetection: false,
      forum: false
    }
  }
];

export const initialUsers: User[] = [
  {
    id: 'usr-super',
    email: 'superadmin@agapp.gov.ph',
    name: 'Patricia Santos',
    role: 'SUPER_ADMIN',
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString()
  },
  {
    id: 'usr-liliw-admin',
    email: 'admin@liliw.gov.ph',
    name: 'Ricardo dela Cruz',
    role: 'LGU_ADMIN',
    lguId: 'liliw-laguna',
    isActive: true,
    createdAt: new Date(Date.now() - 25 * 24 * 3600000).toISOString()
  },
  {
    id: 'usr-liliw-personnel',
    email: 'eng.dept@liliw.gov.ph',
    name: 'Engr. Jose Reyes',
    role: 'LGU_PERSONNEL',
    lguId: 'liliw-laguna',
    isActive: true,
    createdAt: new Date(Date.now() - 24 * 24 * 3600000).toISOString()
  },
  {
    id: 'usr-citizen',
    email: 'lawrence@email.com',
    name: 'Lawrence Alcantara',
    role: 'CITIZEN',
    lguId: 'liliw-laguna',
    barangay: 'Poblacion',
    notificationPreferences: { push: true, sms: true, email: true },
    isActive: true,
    createdAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString()
  }
];

export const initialReports: Report[] = [
  {
    id: 'rep-001',
    referenceNumber: 'REP-2026-0001',
    lguId: 'liliw-laguna',
    citizenId: 'usr-citizen',
    citizenName: 'Lawrence Alcantara',
    category: 'pothole',
    description: 'Malaking butas sa kalsada sa tapat ng Liliw Public Market. Mapanganib para sa mga motorsiklo.',
    photoUrl: 'https://placehold.co/400x300/78716c/ffffff?text=Pothole+on+Road',
    latitude: 13.9301,
    longitude: 121.4651,
    barangay: 'Poblacion',
    status: 'Submitted',
    mlConfidence: 0.94,
    mlVerified: true,
    isLowCredibility: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    statusHistory: [
      { status: 'Submitted', updatedBy: 'usr-citizen', notes: 'Report submitted via mobile app', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() }
    ]
  },
  {
    id: 'rep-002',
    referenceNumber: 'REP-2026-0002',
    lguId: 'liliw-laguna',
    citizenId: 'usr-citizen',
    citizenName: 'Lawrence Alcantara',
    category: 'clogged_drainage',
    description: 'Overflowing canal near the Liliw Elementary School causing flooding on the road during light rain.',
    photoUrl: 'https://placehold.co/400x300/44403c/ffffff?text=Clogged+Drainage',
    latitude: 13.9285,
    longitude: 121.4630,
    barangay: 'San Juan',
    status: 'Under Review',
    assignedOffice: 'Engineering Office',
    slaTier: 'simple',
    slaDueDate: new Date(Date.now() + 3 * 24 * 3600000).toISOString(),
    mlConfidence: 0.88,
    mlVerified: true,
    isLowCredibility: false,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    statusHistory: [
      { status: 'Submitted', updatedBy: 'usr-citizen', notes: 'Report submitted via mobile app', timestamp: new Date(Date.now() - 24 * 3600000).toISOString() },
      { status: 'Under Review', updatedBy: 'usr-liliw-admin', notes: 'Routed to Engineering Office. Estimated resolution in 3 days.', timestamp: new Date(Date.now() - 20 * 3600000).toISOString() }
    ]
  },
  {
    id: 'rep-003',
    referenceNumber: 'REP-2026-0003',
    lguId: 'liliw-laguna',
    citizenId: 'usr-citizen',
    citizenName: 'Lawrence Alcantara',
    category: 'stray_animal',
    description: 'Aggressive stray dogs roaming near the Liliw town plaza, a safety hazard for children.',
    photoUrl: 'https://placehold.co/400x300/a8a29e/ffffff?text=Stray+Dogs',
    latitude: 13.9295,
    longitude: 121.4645,
    barangay: 'Poblacion',
    status: 'Resolved',
    assignedOffice: 'Municipal Veterinary Office',
    slaTier: 'complex',
    mlConfidence: 0.85,
    mlVerified: true,
    isLowCredibility: false,
    rating: 5,
    feedback: 'Thank you for responding quickly! The team captured the stray dogs safely.',
    createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    statusHistory: [
      { status: 'Submitted', updatedBy: 'usr-citizen', timestamp: new Date(Date.now() - 3 * 24 * 3600000).toISOString() },
      { status: 'Under Review', updatedBy: 'usr-liliw-admin', timestamp: new Date(Date.now() - 2.5 * 24 * 3600000).toISOString() },
      { status: 'In Progress', updatedBy: 'usr-liliw-personnel', notes: 'Vet dispatch deployed', timestamp: new Date(Date.now() - 2 * 24 * 3600000).toISOString() },
      { status: 'Resolved', updatedBy: 'usr-liliw-personnel', notes: 'Stray dogs secured and brought to municipal shelter.', timestamp: new Date(Date.now() - 1 * 24 * 3600000).toISOString() }
    ]
  }
];

export const initialServiceRequests: ServiceRequest[] = [
  {
    id: 'req-001',
    referenceNumber: 'REQ-2026-0001',
    lguId: 'liliw-laguna',
    citizenId: 'usr-citizen',
    citizenName: 'Lawrence Alcantara',
    serviceType: 'Birth Certificate Request',
    officeName: 'Civil Registrar',
    status: 'Submitted',
    formDetails: {
      fullName: 'Lawrence B. Alcantara',
      birthDate: '2003-08-15',
      placeOfBirth: 'Liliw District Hospital',
      fatherName: 'Benjamin Alcantara',
      motherName: 'Lina Alcantara'
    },
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REQ-2026-0001',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    statusHistory: [
      { status: 'Submitted', updatedBy: 'usr-citizen', notes: 'Request submitted', timestamp: new Date(Date.now() - 4 * 3600000).toISOString() }
    ]
  },
  {
    id: 'req-002',
    referenceNumber: 'REQ-2026-0002',
    lguId: 'liliw-laguna',
    citizenId: 'usr-citizen',
    citizenName: 'Lawrence Alcantara',
    serviceType: 'Business Permit Renewal',
    officeName: 'BPLO',
    status: 'In Progress',
    formDetails: {
      businessName: 'LBA Web Solutions & Tech Services',
      ownerName: 'Lawrence B. Alcantara',
      lineOfBusiness: 'Information Technology Services',
      barangay: 'Poblacion',
      capitalization: '150000'
    },
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REQ-2026-0002',
    createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    statusHistory: [
      { status: 'Submitted', updatedBy: 'usr-citizen', notes: 'Request submitted with attached requirements', timestamp: new Date(Date.now() - 2 * 24 * 3600000).toISOString() },
      { status: 'Under Review', updatedBy: 'usr-liliw-admin', notes: 'Checking tax declaration and clearances', timestamp: new Date(Date.now() - 1.5 * 24 * 3600000).toISOString() },
      { status: 'In Progress', updatedBy: 'usr-liliw-personnel', notes: 'Pending assessment of fees', timestamp: new Date(Date.now() - 1 * 24 * 3600000).toISOString() }
    ]
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-001',
    lguId: 'liliw-laguna',
    userId: 'usr-liliw-admin',
    userEmail: 'admin@liliw.gov.ph',
    userRole: 'LGU_ADMIN',
    action: 'LGU_CONFIG_UPDATE',
    ipAddress: '192.168.1.5',
    details: 'LGU Admin updated feature flags and secondary branding color',
    timestamp: new Date(Date.now() - 12 * 3600000).toISOString()
  }
];

export const initialForumPosts: ForumPost[] = [
  {
    id: 'forum-001',
    lguId: 'liliw-laguna',
    citizenId: 'usr-citizen',
    citizenName: 'Lawrence Alcantara',
    content: 'May schedule ba ng garbage collection bukas sa Barangay Poblacion, Liliw? Hindi pa dumaan ang truck ngayong umaga.',
    isApproved: true,
    flaggedKeywords: [],
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString()
  }
];

export const mockFaqs: { question: string; answer: string; source: string; keywords: string[] }[] = [
  // ── BUSINESS PERMITS ────────────────────────────────────────────────────────
  {
    question: 'How do I renew my business permit in Liliw?',
    answer: 'To renew a business permit in Liliw, Laguna: (1) Go to the BPLO counter at the Liliw Municipal Hall. (2) Submit your barangay clearance, sanitary permit, and fire safety certificate. (3) Pay the assessed local taxes at the Municipal Treasurer. (4) Collect your physical permit plate. Processing takes 1–3 working days under RA 11032.',
    source: 'BPLO Citizen Charter — Section 3',
    keywords: ['business', 'permit', 'renew', 'renewal', 'bplo', 'mayor', 'license', 'negosyo', 'sari-sari', 'store']
  },
  {
    question: 'What are the requirements for a new business permit?',
    answer: 'For a NEW business permit in Liliw: (1) Accomplished application form from the BPLO. (2) Barangay Business Clearance. (3) Lease contract or proof of property ownership. (4) Fire Safety Inspection Certificate from BFP. (5) Sanitary Permit from the Municipal Health Office. (6) DTI Registration (for sole proprietors) or SEC Articles of Incorporation. Processing is 5–7 working days.',
    source: 'BPLO Citizen Charter — New Application',
    keywords: ['new', 'business', 'permit', 'requirements', 'start', 'open', 'apply', 'application', 'register', 'registration']
  },

  // ── CIVIL REGISTRY ───────────────────────────────────────────────────────────
  {
    question: 'How do I request a birth certificate?',
    answer: 'To request a birth certificate in Liliw: (1) Bring a valid government-issued ID of the owner or an immediate relative. (2) Pay the ₱150 processing fee at the Municipal Treasurer. (3) Use AGAPP to submit a Service Request — a QR code will be generated. Present the QR at the Civil Registrar counter for priority verification and release. Processing takes 1–2 working days.',
    source: 'Civil Registrar Citizen Charter 2026',
    keywords: ['birth', 'certificate', 'birth certificate', 'birth cert', 'nso', 'psa', 'civil', 'registry', 'registrar', 'record', 'kasal', 'kapanganakan']
  },
  {
    question: 'How do I request a marriage certificate?',
    answer: 'To request a marriage certificate in Liliw: (1) Present a valid ID of either spouse or an immediate family member. (2) Pay ₱150 at the Municipal Treasurer. (3) File via AGAPP Service Request and present the generated QR at the Civil Registrar. If the record is not on file locally, you will be referred to the PSA. Processing: 1–2 working days.',
    source: 'Civil Registrar Citizen Charter 2026',
    keywords: ['marriage', 'certificate', 'marriage cert', 'wedding', 'kasal', 'spouse', 'married', 'civil', 'registry']
  },
  {
    question: 'How do I request a death certificate?',
    answer: 'To request a death certificate in Liliw: (1) Immediate family member must present a valid ID. (2) Pay ₱150 at the Municipal Treasurer. (3) Use AGAPP Service Request for priority queuing. Processing: 1–2 working days. For PSA-certified copies, you will be referred to the nearest PSA office in Sta. Cruz, Laguna.',
    source: 'Civil Registrar Citizen Charter 2026',
    keywords: ['death', 'certificate', 'death cert', 'patay', 'kamatayan', 'civil', 'registry', 'deceased', 'obituary']
  },

  // ── CEDULA / COMMUNITY TAX CERTIFICATE ──────────────────────────────────────
  {
    question: 'How do I get a cedula or community tax certificate?',
    answer: 'To get a Community Tax Certificate (Cedula) in Liliw: (1) Go to the Municipal Treasurer\'s Office. (2) Bring a valid government ID. (3) Pay the community tax (minimum ₱5.00 base + income-based surcharge). (4) Cedulas are released on the same day. You can use AGAPP to pre-file and skip the queue.',
    source: 'Municipal Treasurer Citizen Charter',
    keywords: ['cedula', 'community tax', 'ctc', 'community tax certificate', 'tax certificate', 'buwis', 'treasurer', 'tagasiningil']
  },

  // ── BARANGAY CLEARANCE ───────────────────────────────────────────────────────
  {
    question: 'How do I get a barangay clearance?',
    answer: 'Barangay clearances are issued at your local barangay hall (not the Municipal Hall). Bring: (1) Valid government ID. (2) Proof of residency (utility bill or barangay certificate). (3) Fee: ₱50–₱100 depending on purpose. Processing is same day. For business purposes, barangay clearance is a prerequisite before applying for a Mayor\'s Permit at the BPLO.',
    source: 'Barangay Services Guide — Liliw',
    keywords: ['barangay', 'clearance', 'barangay clearance', 'punong barangay', 'kapitan', 'clearance certificate', 'baranggay']
  },

  // ── CERTIFICATE OF INDIGENCY ─────────────────────────────────────────────────
  {
    question: 'How do I get a certificate of indigency?',
    answer: 'A Certificate of Indigency in Liliw is issued by the Municipal Social Welfare and Development Office (MSWDO): (1) Go to the MSWDO at the Municipal Hall. (2) Present valid ID and proof of residency. (3) State the purpose (medical, scholarship, legal aid, etc.). Processing is same day and the certificate is FREE. For barangay-level indigency, visit your barangay hall.',
    source: 'MSWDO Citizen Charter — Indigency',
    keywords: ['indigency', 'certificate of indigency', 'indigent', 'poor', 'dswd', 'mswdo', 'welfare', 'mahirap', 'ayuda', 'assistance']
  },

  // ── HEALTH CERTIFICATE ───────────────────────────────────────────────────────
  {
    question: 'How do I get a health or sanitary certificate?',
    answer: 'Health/Sanitary Certificates in Liliw are issued by the Municipal Health Office (MHO): (1) Undergo a physical examination at the MHO. (2) Submit Chest X-Ray result (if required for food handlers). (3) Pay ₱100–₱250 fee at the Municipal Treasurer. Processing: 1 working day. Health certificates are required for all food-related business permits and employment abroad.',
    source: 'Municipal Health Office Citizen Charter',
    keywords: ['health', 'sanitary', 'certificate', 'health certificate', 'sanitary permit', 'food handler', 'medical', 'mho', 'doctor', 'checkup', 'kalusugan']
  },

  // ── BUILDING / CONSTRUCTION PERMIT ──────────────────────────────────────────
  {
    question: 'How do I apply for a building permit?',
    answer: 'To apply for a building permit in Liliw: (1) Submit building plans signed by a licensed engineer/architect to the Office of the Municipal Engineer. (2) Requirements: lot plan, tax declaration, bill of materials, and structural design. (3) Pay assessed fees at the Municipal Treasurer. Processing: 5–15 working days depending on structure size. RA 11032 guarantees processing within the prescribed timeline.',
    source: 'Office of the Municipal Engineer Citizen Charter',
    keywords: ['building', 'permit', 'construction', 'building permit', 'engineer', 'bahay', 'gusali', 'construct', 'renovate', 'renovation', 'structure']
  },

  // ── AGRICULTURAL CERTIFICATES ────────────────────────────────────────────────
  {
    question: 'How do I get an agricultural certificate or farm certification?',
    answer: 'Agricultural certifications in Liliw are handled by the Municipal Agriculture Office (MAO): (1) Visit the MAO at the Municipal Hall. (2) Bring farm ownership documents or Certificate of Land Ownership Award (CLOA) if applicable. (3) State the purpose (loan application, insurance claim, subsidy). Processing: 1–3 working days. The MAO also assists with seeds, fertilizers, and RSBSA registration.',
    source: 'Municipal Agriculture Office Services',
    keywords: ['agriculture', 'farm', 'farmer', 'agricultural', 'certificate', 'crop', 'mao', 'palay', 'mais', 'gulay', 'livestock', 'rsbsa', 'cloa', 'land', 'subsidy', 'fertilizer', 'binhi']
  },

  // ── LOST & FOUND / STRAY ANIMALS ────────────────────────────────────────────
  {
    question: 'How do I report a lost pet or stray animal?',
    answer: 'To report a lost/found pet or stray animal in Liliw: (1) Use the AGAPP Report feature — select "Stray Animal" or "Lost/Found" category. (2) Attach a photo and pin the GPS location. (3) The report is automatically routed to the City Veterinary Office (CVO). (4) For impounded animals, contact the CVO directly at the Municipal Hall. SLA: 3 working days under RA 11032.',
    source: 'City Veterinary Office — Animal Control',
    keywords: ['lost', 'found', 'pet', 'dog', 'cat', 'stray', 'animal', 'aso', 'pusa', 'hayop', 'missing', 'nawawala', 'veterinary', 'cvo', 'impound']
  },

  // ── ROAD / INFRASTRUCTURE REPORTS ───────────────────────────────────────────
  {
    question: 'How do I report a pothole or road damage?',
    answer: 'To report a pothole or road damage in Liliw: (1) Open the AGAPP Report tab. (2) Select "Pothole" or "Road Damage" category. (3) Take a photo using AGAPP — it will run an AI scan to verify the road damage. (4) Confirm your GPS coordinates (auto-detected). (5) Submit. The report is routed to the Engineering Office with a 3-day SLA under RA 11032. You can track status in real-time in the app.',
    source: 'Municipal Engineering Office — Citizen Charter',
    keywords: ['pothole', 'road', 'damage', 'crack', 'street', 'kalsada', 'butas', 'report', 'engineering', 'paved', 'daan', 'gravel', 'flood', 'drainage', 'clogged', 'canal', 'ilog', 'tubig']
  },
  {
    question: 'How do I report a clogged canal or drainage problem?',
    answer: 'To report clogged drainage in Liliw: (1) Open AGAPP Report and select "Clogged Drainage". (2) Attach a photo and verify your GPS location. (3) Submit — it will be routed to the Municipal Engineering Office. (4) SLA is 3 working days. You will receive a status update via the app when work is scheduled.',
    source: 'Municipal Engineering Office — Citizen Charter',
    keywords: ['drainage', 'canal', 'clogged', 'flood', 'baha', 'tubig', 'imburnal', 'sewer', 'blocked', 'water', 'overflow']
  },

  // ── AGAPP APP USAGE ──────────────────────────────────────────────────────────
  {
    question: 'How do I submit a report using AGAPP?',
    answer: 'To submit a concern report using AGAPP: (1) Log in with your email/OTP. (2) Tap the "Reports" tab at the bottom. (3) Select a category (Pothole, Stray Animal, Damaged Pole, etc.). (4) Tap "Snap Photo" to take a photo — the app will verify the issue using AI. (5) Confirm your GPS location. (6) Tap Submit. You will receive a reference number to track your report\'s status.',
    source: 'AGAPP User Guide — Reporting Module',
    keywords: ['agapp', 'app', 'report', 'submit', 'how to', 'use', 'guide', 'tutorial', 'paano', 'send', 'photo', 'camera', 'gps', 'location']
  },
  {
    question: 'How do I apply for a document using AGAPP?',
    answer: 'To apply for a government document through AGAPP: (1) Tap the "Services" tab. (2) Browse and select the service you need (e.g., Birth Certificate, Business Permit, Cedula). (3) Fill out the guided form. (4) Submit — a QR code reference will be generated. (5) Go to the corresponding Municipal Hall counter and present the QR code for priority processing.',
    source: 'AGAPP User Guide — Services Module',
    keywords: ['agapp', 'services', 'document', 'apply', 'application', 'request', 'service request', 'qr', 'qr code', 'counter', 'hall', 'munisipyo']
  },
  {
    question: 'How do I track the status of my report or request?',
    answer: 'To track your report or document request in AGAPP: (1) Go to the "Reports" tab to see all submitted reports and their current status (Submitted → Under Review → In Progress → Resolved). (2) For document requests, go to "Services" tab — each item shows its status (Submitted → Under Review → Released). (3) You will also receive in-app status updates when LGU personnel take action.',
    source: 'AGAPP User Guide — Status Tracking',
    keywords: ['track', 'status', 'update', 'follow up', 'follow-up', 'check', 'progress', 'resolved', 'pending', 'timeline', 'reference number', 'ref', 'kung saan na']
  },
  {
    question: 'What is AGAPP?',
    answer: 'AGAPP (Automated Governance and Public Service Platform) is a mobile app that connects citizens of Liliw, Laguna with their local government services. Through AGAPP, you can: (1) Report public concerns (potholes, stray animals, drainage issues) directly from your phone. (2) Apply for government documents with a QR code for priority processing. (3) Ask questions via this AI-assisted chatbot. (4) Participate in community discussions via the forum.',
    source: 'AGAPP About Page',
    keywords: ['agapp', 'what is', 'about', 'platform', 'app', 'application', 'system', 'governance', 'government', 'saan', 'ano', 'paano']
  },

  // ── MUNICIPAL HALL HOURS / CONTACT ──────────────────────────────────────────
  {
    question: 'What are the operating hours and contact details for Liliw Municipal Hall?',
    answer: 'Liliw Municipal Hall operating hours: Monday to Friday, 8:00 AM – 5:00 PM (no noon break for frontline services). Address: Poblacion, Liliw, Laguna. For urgent concerns outside office hours, use AGAPP to file a report — it will be processed the next working day. AGAPP is available 24/7 for report submissions and document pre-filing.',
    source: 'Liliw LGU — Public Information Office',
    keywords: ['hours', 'schedule', 'open', 'close', 'contact', 'address', 'location', 'municipal hall', 'munisipyo', 'saan', 'oras', 'telephone', 'phone', 'hotline', 'office']
  }
];
