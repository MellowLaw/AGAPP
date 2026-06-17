import express from 'express';
import cors from 'cors';
import { 
  LGU, User, Report, ServiceRequest, AuditLog, ForumPost,
  ReportCategory, ReportStatus, ServiceStatus, SLATier, UserRole 
} from '@agapp/shared';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In-Memory Database
let lgus: LGU[] = [
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

let users: User[] = [
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

let reports: Report[] = [
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

let serviceRequests: ServiceRequest[] = [
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

let auditLogs: AuditLog[] = [
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
  },
  {
    id: 'log-002',
    lguId: 'liliw-laguna',
    userId: 'usr-liliw-admin',
    userEmail: 'admin@liliw.gov.ph',
    userRole: 'LGU_ADMIN',
    action: 'FORUM_POST_APPROVE',
    ipAddress: '192.168.1.5',
    details: 'LGU Admin approved forum thread ID forum-002: "Solid waste segregation advisory"',
    timestamp: new Date(Date.now() - 8 * 3600000).toISOString()
  }
];

let forumPosts: ForumPost[] = [
  {
    id: 'forum-001',
    lguId: 'liliw-laguna',
    citizenId: 'usr-citizen',
    citizenName: 'Lawrence Alcantara',
    content: 'May schedule ba ng garbage collection bukas sa Barangay Poblacion, Liliw? Hindi pa dumaan ang truck ngayong umaga.',
    isApproved: true,
    flaggedKeywords: [],
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString()
  },
  {
    id: 'forum-002',
    lguId: 'liliw-laguna',
    citizenId: 'usr-citizen',
    citizenName: 'Juan Dela Cruz',
    content: 'Ang tagal naman ng civil registrar. Ilang araw na! putang ina this is annoying.',
    isApproved: false,
    flaggedKeywords: ['putang ina'],
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString()
  }
];

// Mock Chatbot KB
const FAQ_KNOWLEDGE_BASE = [
  {
    keywords: ['bplo', 'business permit', 'permit fee', 'renew business'],
    answer: 'To renew a business permit in Liliw, Laguna: 1) Go to the BPLO counter at the Liliw Municipal Hall, 2) Submit your barangay clearance, sanitary permit, and fire safety certificate, 3) Pay the assessed local taxes at the Municipal Treasurer, and 4) Collect your physical permit plate. Processing usually takes 1-3 working days, aligned with RA 11032.',
    source: 'BPLO Citizen Charter Section 3'
  },
  {
    keywords: ['birth certificate', 'civil registrar', 'marriage certificate', 'death record'],
    answer: 'Requesting Civil Registry documents (birth, marriage, or death records) in Liliw requires: 1) A valid government ID of the owner or immediate relative, 2) Processing fee of ₱150 paid at the Municipal Treasurer. AGAPP generates a QR code upon submission — present it at the Civil Registrar counter for instant priority verification and release.',
    source: 'Civil Registrar Guide 2026'
  },
  {
    keywords: ['garbage', 'waste collection', 'trash schedule'],
    answer: 'Liliw garbage collection runs: Monday/Wednesday/Friday for biodegradable waste, and Tuesday/Thursday/Saturday for non-biodegradable waste. Collection starts at 6:00 AM. Please coordinate with your respective Barangay captain for localized truck delays.',
    source: 'Liliw Solid Waste Management Office Rules'
  },
  {
    keywords: ['cedula', 'community tax certificate', 'tax'],
    answer: 'Community Tax Certificates (Cedula) can be requested at the Liliw Municipal Treasurer\'s Office. Bring a valid ID. Fee is based on your gross income. Processing time is usually same-day.',
    source: 'Treasurer\'s Office Guide 2026'
  },
  {
    keywords: ['barangay clearance', 'clearance'],
    answer: 'Barangay Clearances must be requested from your specific barangay hall in Liliw. Bring 1 valid ID, 1 cedula, and pay the barangay fee (usually ₱50–₱100). Processing is typically same-day.',
    source: 'Liliw Barangay Operations Manual'
  }
];

// Helper to write audit log
const writeLog = (lguId: string | undefined, userId: string, email: string, role: UserRole, action: string, details: string, ip: string = '127.0.0.1') => {
  const newLog: AuditLog = {
    id: `log-${Date.now()}`,
    lguId,
    userId,
    userEmail: email,
    userRole: role,
    action,
    ipAddress: ip,
    details,
    timestamp: new Date().toISOString()
  };
  auditLogs.unshift(newLog);
};

// --- API ENDPOINTS ---

// Auth Endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return res.status(404).json({ error: 'User not found. Try superadmin@agapp.gov.ph, admin@liliw.gov.ph, or lawrence@email.com' });
  }

  // Pre-approved password bypass for local prototype convenience
  res.json({ user, token: 'mock-jwt-token' });
});

app.post('/api/auth/otp', (req, res) => {
  const { email } = req.body;
  res.json({ success: true, message: `Mock OTP sent to ${email}. Use OTP "123456" to log in.` });
});

// LGU Endpoints
app.get('/api/lgus', (req, res) => {
  res.json(lgus);
});

app.post('/api/lgus', (req, res) => {
  const { name, primaryColor, secondaryColor, latitude, longitude } = req.body;
  const newId = name.toLowerCase().replace(/\s+/g, '-');
  const newLgu: LGU = {
    id: newId,
    name,
    logo: `https://placehold.co/100x100/${primaryColor.replace('#','')}/ffffff?text=${name.substring(0,4).toUpperCase()}`,
    bannerUrl: `https://placehold.co/800x200/${primaryColor.replace('#','')}/ffffff?text=Welcome+to+${encodeURIComponent(name)}`,
    primaryColor,
    secondaryColor,
    latitude,
    longitude,
    isActive: true,
    onboardingFeePaid: false,
    featureFlags: {
      chatbot: true,
      potholeDetection: true,
      forum: true
    }
  };
  lgus.push(newLgu);
  writeLog(undefined, 'usr-super', 'superadmin@agapp.gov.ph', 'SUPER_ADMIN', 'LGU_PROVISION', `Provisioned new LGU tenant: ${name}`);
  res.status(201).json(newLgu);
});

app.patch('/api/lgus/:id/subscription', (req, res) => {
  const { id } = req.params;
  const { onboardingFeePaid } = req.body;
  const lgu = lgus.find(l => l.id === id);
  if (!lgu) return res.status(404).json({ error: 'LGU not found' });
  lgu.onboardingFeePaid = onboardingFeePaid;
  writeLog(undefined, 'usr-super', 'superadmin@agapp.gov.ph', 'SUPER_ADMIN', 'LGU_SUBSCRIPTION_UPDATE', `Subscription for ${lgu.name} updated: onboardingFeePaid=${onboardingFeePaid}`);
  res.json(lgu);
});

app.patch('/api/lgus/:id/feature-flags', (req, res) => {
  const { id } = req.params;
  const { featureFlags } = req.body;
  const lgu = lgus.find(l => l.id === id);
  if (!lgu) return res.status(404).json({ error: 'LGU not found' });
  lgu.featureFlags = { ...lgu.featureFlags, ...featureFlags };
  writeLog(id, 'usr-liliw-admin', 'admin@liliw.gov.ph', 'LGU_ADMIN', 'FEATURE_FLAGS_UPDATE', `Updated feature flags: ${JSON.stringify(featureFlags)}`);
  res.json(lgu);
});

// Reports Endpoints
app.get('/api/reports', (req, res) => {
  const { lguId, citizenId } = req.query;
  let filtered = [...reports];
  if (lguId) filtered = filtered.filter(r => r.lguId === lguId);
  if (citizenId) filtered = filtered.filter(r => r.citizenId === citizenId);
  res.json(filtered);
});

// Mock YOLOv8 Road damage / pothole detector validation API
app.post('/api/reports/verify-image', (req, res) => {
  const { photoUrl, category } = req.body;
  // Simulated ML checking: if the category is pothole, we return a confidence check
  let mlConfidence = 0.85 + Math.random() * 0.14; // random high score
  let mlVerified = true;
  let isLowCredibility = false;

  // Let's mock a case where a user tries to submit a non-pothole image for a pothole report:
  if (photoUrl && photoUrl.includes('invalid')) {
    mlConfidence = 0.22;
    mlVerified = false;
    isLowCredibility = true;
  }

  res.json({ mlConfidence, mlVerified, isLowCredibility });
});

// File Upload Endpoint for Report Photos
app.post('/api/upload/photo', async (req, res) => {
  const { imageBase64, reportId, category } = req.body;
  
  if (!imageBase64 || !reportId) {
    return res.status(400).json({ error: 'Missing required fields: imageBase64, reportId' });
  }

  try {
    const result = await uploadReportPhoto(reportId, imageBase64, category);
    
    if (result.success) {
      res.json({
        success: true,
        url: result.url,
        path: result.path,
        storageConfigured: isStorageConfigured(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        storageConfigured: isStorageConfigured(),
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Upload failed',
      storageConfigured: isStorageConfigured(),
    });
  }
});

app.post('/api/reports', (req, res) => {
  const { 
    lguId, citizenId, citizenName, category, description, 
    photoUrl, latitude, longitude, barangay,
    mlConfidence, mlVerified, isLowCredibility
  } = req.body;

  // Geofencing verification simulation using coordinate boundaries
  const targetLGU = lgus.find(l => l.id === lguId);
  let resolvedBarangay = barangay;
  
  if (targetLGU) {
    // Basic bounding box geofence check (around LGU coordinate +- 0.2 degree)
    const latDiff = Math.abs(latitude - targetLGU.latitude);
    const lngDiff = Math.abs(longitude - targetLGU.longitude);
    if (latDiff > 0.2 || lngDiff > 0.2) {
      return res.status(400).json({ 
        error: 'Geofence Error: Report coordinates fall outside the jurisdiction of ' + targetLGU.name 
      });
    }
  }

  const refNum = `REP-2026-${String(reports.length + 1).padStart(4, '0')}`;
  const newReport: Report = {
    id: `rep-${Date.now()}`,
    referenceNumber: refNum,
    lguId,
    citizenId,
    citizenName,
    category,
    description,
    photoUrl: photoUrl || 'https://placehold.co/400x300/a8a29e/ffffff?text=No+Photo',
    latitude,
    longitude,
    barangay: resolvedBarangay,
    status: 'Submitted',
    mlConfidence: mlConfidence || 1.0,
    mlVerified: mlVerified ?? true,
    isLowCredibility: isLowCredibility ?? false,
    createdAt: new Date().toISOString(),
    statusHistory: [
      { status: 'Submitted', updatedBy: citizenId, notes: 'Submitted via mobile device', timestamp: new Date().toISOString() }
    ]
  };

  // Auto-routing engine logic
  // category => Office assignment & SLA tier (RA 11032)
  if (category === 'pothole' || category === 'clogged_drainage') {
    newReport.assignedOffice = 'Engineering Office';
    newReport.slaTier = 'simple'; // Simple road repair: 3 days
    newReport.slaDueDate = new Date(Date.now() + 3 * 24 * 3600000).toISOString();
  } else if (category === 'stray_animal' || category === 'missing_pet') {
    newReport.assignedOffice = 'City Veterinary Office';
    newReport.slaTier = 'simple';
    newReport.slaDueDate = new Date(Date.now() + 3 * 24 * 3600000).toISOString();
  } else {
    newReport.assignedOffice = 'Public Assistance Desk';
    newReport.slaTier = 'complex'; // Complex assessment: 7 days
    newReport.slaDueDate = new Date(Date.now() + 7 * 24 * 3600000).toISOString();
  }

  reports.unshift(newReport);
  writeLog(lguId, citizenId, citizenName, 'CITIZEN', 'REPORT_SUBMIT', `Submitted report ${refNum}. Category: ${category}`);
  res.status(201).json(newReport);
});

app.patch('/api/reports/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, updatedBy, userRole, userEmail, notes } = req.body;
  const report = reports.find(r => r.id === id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  report.status = status;
  report.statusHistory.push({
    status,
    updatedBy,
    notes,
    timestamp: new Date().toISOString()
  });

  writeLog(report.lguId, updatedBy, userEmail || 'system@agapp.gov.ph', userRole || 'LGU_PERSONNEL', 'REPORT_STATUS_UPDATE', `Updated report ${report.referenceNumber} to ${status}`);
  res.json(report);
});

app.post('/api/reports/:id/rate', (req, res) => {
  const { id } = req.params;
  const { rating, feedback } = req.body;
  const report = reports.find(r => r.id === id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  report.rating = rating;
  report.feedback = feedback;
  writeLog(report.lguId, report.citizenId, report.citizenName, 'CITIZEN', 'REPORT_RATE', `Rated resolution of ${report.referenceNumber}: ${rating} stars`);
  res.json(report);
});

import { generateServiceRequestPDF } from './pdf-generator';
import { uploadReportPhoto, isStorageConfigured } from './storage.service';

// Service Requests Endpoints
app.get('/api/services', (req, res) => {
  const { lguId, citizenId } = req.query;
  let filtered = [...serviceRequests];
  if (lguId) filtered = filtered.filter(s => s.lguId === lguId);
  if (citizenId) filtered = filtered.filter(s => s.citizenId === citizenId);
  res.json(filtered);
});

app.post('/api/services', (req, res) => {
  const { lguId, citizenId, citizenName, serviceType, formDetails } = req.body;
  const refNum = `REQ-2026-${String(serviceRequests.length + 1).padStart(4, '0')}`;
  
  const officeName = serviceType.includes('Business') ? 'BPLO' : 'Civil Registrar';

  const newRequest: ServiceRequest = {
    id: `req-${Date.now()}`,
    referenceNumber: refNum,
    lguId,
    citizenId,
    citizenName,
    serviceType,
    officeName,
    status: 'Submitted',
    formDetails,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${refNum}`,
    createdAt: new Date().toISOString(),
    statusHistory: [
      { status: 'Submitted', updatedBy: citizenId, notes: 'Document application submitted online', timestamp: new Date().toISOString() }
    ]
  };

  serviceRequests.unshift(newRequest);
  writeLog(lguId, citizenId, citizenName, 'CITIZEN', 'SERVICE_REQUEST_SUBMIT', `Applied for ${serviceType} (${refNum})`);
  res.status(201).json(newRequest);
});

app.patch('/api/services/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, updatedBy, userRole, userEmail, notes, attachmentUrl, rejectReason } = req.body;
  const request = serviceRequests.find(s => s.id === id);
  if (!request) return res.status(404).json({ error: 'Service request not found' });

  request.status = status;
  if (attachmentUrl) request.attachmentUrl = attachmentUrl;
  if (rejectReason) request.rejectReason = rejectReason;

  request.statusHistory.push({
    status,
    updatedBy,
    notes,
    timestamp: new Date().toISOString()
  });

  writeLog(request.lguId, updatedBy, userEmail || 'system@agapp.gov.ph', userRole || 'LGU_PERSONNEL', 'SERVICE_REQUEST_STATUS_UPDATE', `Updated service request ${request.referenceNumber} to ${status}`);
  res.json(request);
});

// PDF Generation Endpoint
app.get('/api/services/:id/pdf', async (req, res) => {
  const { id } = req.params;
  const request = serviceRequests.find(s => s.id === id);
  
  if (!request) {
    return res.status(404).json({ error: 'Service request not found' });
  }

  const lgu = lgus.find(l => l.id === request.lguId);
  
  try {
    const pdfBytes = await generateServiceRequestPDF({
      referenceNumber: request.referenceNumber,
      citizenName: request.citizenName,
      serviceType: request.serviceType,
      officeName: request.officeName,
      formDetails: request.formDetails,
      lguName: lgu?.name || 'Municipality of Liliw',
      qrCodeUrl: request.qrCodeUrl,
      createdAt: request.createdAt,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${request.referenceNumber}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Community Forum Endpoints
app.get('/api/forum', (req, res) => {
  const { lguId, includePending } = req.query;
  let filtered = [...forumPosts];
  if (lguId) filtered = filtered.filter(f => f.lguId === lguId);
  if (includePending !== 'true') {
    filtered = filtered.filter(f => f.isApproved);
  }
  res.json(filtered);
});

app.post('/api/forum', (req, res) => {
  const { lguId, citizenId, citizenName, content } = req.body;
  
  // Basic profanity filter (simulating moderation tool)
  const profanityList = ['putang ina', 'gago', 'tarantado', 'pota'];
  const flaggedKeywords = profanityList.filter(word => content.toLowerCase().includes(word));
  const isApproved = flaggedKeywords.length === 0;

  const newPost: ForumPost = {
    id: `forum-${Date.now()}`,
    lguId,
    citizenId,
    citizenName,
    content,
    isApproved,
    flaggedKeywords,
    createdAt: new Date().toISOString()
  };

  forumPosts.unshift(newPost);
  writeLog(lguId, citizenId, citizenName, 'CITIZEN', 'FORUM_POST_CREATE', `Posted to community forum. Auto-Approved: ${isApproved}`);
  res.status(201).json(newPost);
});

app.patch('/api/forum/:id/approve', (req, res) => {
  const { id } = req.params;
  const { approvedBy, userEmail, userRole } = req.body;
  const post = forumPosts.find(f => f.id === id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  post.isApproved = true;
  post.flaggedKeywords = [];
  writeLog(post.lguId, approvedBy, userEmail, userRole, 'FORUM_POST_APPROVE', `Moderator approved post ${id}`);
  res.json(post);
});

app.delete('/api/forum/:id', (req, res) => {
  const { id } = req.params;
  const { deletedBy, userEmail, userRole } = req.body;
  const index = forumPosts.findIndex(f => f.id === id);
  if (index === -1) return res.status(404).json({ error: 'Post not found' });

  const post = forumPosts[index];
  forumPosts.splice(index, 1);
  writeLog(post.lguId, deletedBy, userEmail, userRole, 'FORUM_POST_DELETE', `Moderator rejected/deleted post: "${post.content.substring(0,30)}..."`);
  res.json({ success: true });
});

// Chatbot RAG FAQ similarity search endpoint
app.post('/api/chatbot/ask', (req, res) => {
  const { query, lguId } = req.body;

  let lguName = 'Liliw';
  if (lguId) {
    const match = lgus.find(l => l.id === lguId);
    if (match) {
      lguName = match.name.replace('Municipality of ', '');
    }
  }
  
  // Simple similarity score check based on keyword matching
  let bestMatch: typeof FAQ_KNOWLEDGE_BASE[number] | null = null;
  let maxMatches = 0;

  FAQ_KNOWLEDGE_BASE.forEach(faq => {
    let matchCount = 0;
    faq.keywords.forEach(keyword => {
      if (query.toLowerCase().includes(keyword)) {
        matchCount++;
      }
    });
    if (matchCount > maxMatches) {
      maxMatches = matchCount;
      bestMatch = faq;
    }
  });

  if (bestMatch && maxMatches > 0) {
    let faqRedirect: { screen: string; label: string } | null = null;
    const kw = (bestMatch as any).keywords;
    if (kw.includes('pothole') || kw.includes('drainage') || kw.includes('stray') || kw.includes('lost') || kw.includes('report')) {
      faqRedirect = { screen: 'ReportsTab', label: 'Submit a Report' };
    } else if (kw.includes('track') || kw.includes('status')) {
      faqRedirect = { screen: 'ReportsTab', label: 'Track My Reports' };
    } else if (kw.includes('business') || kw.includes('birth') || kw.includes('marriage') || kw.includes('death') || kw.includes('cedula') || kw.includes('indigency') || kw.includes('health') || kw.includes('building') || kw.includes('permit') || kw.includes('document')) {
      faqRedirect = { screen: 'ServicesTab', label: 'Go to Services' };
    }

    res.json({
      answer: (bestMatch as any).answer.replace(/Liliw/g, lguName),
      source: (bestMatch as any).source,
      found: true,
      redirect: faqRedirect
    });
  } else {
    res.json({
      answer: `I'm sorry, I couldn't find a direct answer in the ${lguName} LGU Knowledge Base. Would you like to file a support ticket to the Help Desk?`,
      source: "RAG System Fallback",
      found: false,
      offerTicket: true,
      redirect: null
    });
  }
});

// Audit Logs Endpoints
app.get('/api/audit-logs', (req, res) => {
  const { lguId } = req.query;
  let filtered = [...auditLogs];
  if (lguId) filtered = filtered.filter(l => l.lguId === lguId);
  res.json(filtered);
});

// Server Initialization
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[AGAPP API] Backend running on port ${PORT}`);
});
