import { z } from 'zod';

export * from './theme';
export { ThemeProvider, useTheme } from './contexts/ThemeContext';
export { AgappLogo } from './components/AgappLogo';

// Roles
export type UserRole = 'SUPER_ADMIN' | 'LGU_ADMIN' | 'LGU_PERSONNEL' | 'CITIZEN';

// Report Categories — must match the reports.category CHECK constraint in
// supabase/schema.sql. Labels are the single source of truth for all UIs.
export const REPORT_CATEGORIES = [
  'pothole',
  'clogged_drainage',
  'stray_animal',
  'damaged_pole'
] as const;
export type ReportCategory = typeof REPORT_CATEGORIES[number];

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  pothole: 'Pothole / Road Damage',
  clogged_drainage: 'Drainage / Canal',
  stray_animal: 'Stray Pets',
  damaged_pole: 'Damaged Pole',
};

export function reportCategoryLabel(category: string): string {
  return REPORT_CATEGORY_LABELS[category as ReportCategory] || category || 'Other';
}

// Report Statuses
export const REPORT_STATUSES = [
  'Submitted',
  'Under Review',
  'In Progress',
  'Resolved',
  'Rejected'
] as const;
export type ReportStatus = typeof REPORT_STATUSES[number];

// Service Request Statuses
export const SERVICE_STATUSES = [
  'Submitted',
  'Under Review',
  'In Progress',
  'Released',
  'Rejected'
] as const;
export type ServiceStatus = typeof SERVICE_STATUSES[number];

// SLA Tiers (Republic Act No. 11032)
export type SLATier = 'simple' | 'complex' | 'highly_technical';

export interface LGU {
  id: string;
  name: string;
  region?: string; // PSGC region, set by the super-admin onboarding wizard
  province?: string; // PSGC province (or "Metro Manila" for NCR)
  logo: string; // Base64 or URL
  bannerUrl?: string;
  primaryColor: string; // hex
  secondaryColor: string; // hex
  latitude: number;
  longitude: number;
  boundaryGeoJSON?: any; // For geofencing validation
  isActive: boolean;
  onboardingFeePaid: boolean;
  featureFlags: {
    chatbot: boolean;
    potholeDetection: boolean;
    forum: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  lguId?: string; // Optional: null for SUPER_ADMIN
  barangay?: string; // For CITIZEN
  notificationPreferences?: {
    push: boolean;
    sms: boolean;
    email: boolean;
  };
  isActive: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  referenceNumber: string;
  lguId: string;
  citizenId: string;
  citizenName: string;
  category: ReportCategory;
  description?: string;
  photoUrl: string;
  latitude: number;
  longitude: number;
  barangay: string;
  status: ReportStatus;
  assignedOffice?: string;
  slaTier?: SLATier;
  slaDueDate?: string;
  mlConfidence: number | null; // confidence score (0.0 to 1.0); null = not analyzed (ML not implemented yet)
  mlVerified: boolean | null;  // model verdict once the pothole model runs; null = not analyzed
  isLowCredibility: boolean; // Flagged if ML failed and user bypassed or EXIF mismatched
  rating?: number; // 1 to 5 stars
  feedback?: string;
  createdAt: string;
  statusHistory: {
    status: ReportStatus;
    updatedBy: string; // User ID or system
    notes?: string;
    timestamp: string;
  }[];
}

export interface ServiceRequest {
  id: string;
  referenceNumber: string;
  lguId: string;
  citizenId: string;
  citizenName: string;
  serviceType: string; // e.g. "Birth Certificate Request", "Business Permit Renewal"
  officeName: string;   // e.g. "Civil Registrar", "BPLO"
  status: ServiceStatus;
  formDetails: Record<string, string>; // Guided dynamic form inputs
  qrCodeUrl: string; // QR to present in municipal hall for collection
  attachmentUrl?: string; // released doc (if any)
  assignedPersonnel?: string;
  rejectReason?: string;
  createdAt: string;
  statusHistory: {
    status: ServiceStatus;
    updatedBy: string;
    notes?: string;
    timestamp: string;
  }[];
}

export interface AuditLog {
  id: string;
  lguId?: string;
  userId: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  ipAddress: string;
  details: string;
  timestamp: string;
}

export interface ForumPost {
  id: string;
  lguId: string;
  citizenId: string;
  citizenName: string;
  title?: string;
  content: string;
  tags?: string[];
  photoUrl?: string;
  isApproved: boolean; // Moderation flag
  flaggedKeywords: string[];
  createdAt: string;
  commentsCount?: number;
}

export interface ForumComment {
  id: string;
  postId: string;
  citizenId: string;
  citizenName: string;
  content: string;
  isApproved: boolean;
  flaggedKeywords: string[];
  createdAt: string;
}

// Zod schemas for request validation
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const ReportSubmitSchema = z.object({
  lguId: z.string(),
  category: z.enum(REPORT_CATEGORIES),
  description: z.string().optional(),
  photoUrl: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  barangay: z.string(),
  mlConfidence: z.number().nullable(),
  mlVerified: z.boolean().nullable(),
  isLowCredibility: z.boolean(),
});
