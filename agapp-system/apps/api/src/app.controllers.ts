import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SupabaseService } from './supabase.service';
import { 
  initialLgus, initialUsers, initialReports, 
  initialServiceRequests, initialForumPosts, initialAuditLogs, mockFaqs 
} from './mock-db';
import { LGU, User, Report, ServiceRequest, ForumPost, AuditLog } from '@agapp/shared';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class ChatbotAskDto {
  @IsString()
  @IsNotEmpty()
  query!: string;

  @IsString()
  @IsOptional()
  lguId?: string;

  @IsArray()
  @IsOptional()
  history?: { sender: string; text: string }[];
}

// Helper for generating custom audit logs
async function writeAuditLog(
  supabaseService: SupabaseService, 
  lguId: string | null, 
  userId: string, 
  userEmail: string, 
  userRole: string, 
  action: string, 
  details: string
) {
  const supabase = supabaseService.getClient();
  if (supabase) {
    await supabase.from('audit_logs').insert({
      lgu_id: lguId,
      user_id: userId === 'usr-super' || userId === 'usr-liliw-admin' ? null : userId,
      user_email: userEmail,
      user_role: userRole,
      action,
      ip_address: '127.0.0.1',
      details
    });
  } else {
    initialAuditLogs.unshift({
      id: `log-${Date.now()}`,
      lguId: lguId || undefined,
      userId,
      userEmail,
      userRole: userRole as any,
      action,
      ipAddress: '127.0.0.1',
      details,
      timestamp: new Date().toISOString()
    });
  }
}

// 1. AUTH CONTROLLER
@Controller('api/auth')
export class AuthController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Post('login')
  async login(@Body() body: any) {
    const { email } = body;
    const supabase = this.supabaseService.getClient();

    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error || !data) {
        throw new HttpException('User not found in database.', HttpStatus.NOT_FOUND);
      }
      return { user: data, token: 'supabase-jwt-auth-session' };
    }

    // Mock DB Fallback
    const user = initialUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new HttpException('User not found. Try superadmin@agapp.gov.ph, admin@liliw.gov.ph, or lawrence@email.com', HttpStatus.NOT_FOUND);
    }
    return { user, token: 'mock-jwt-token' };
  }

  @Post('otp')
  async requestOtp(@Body() body: any) {
    const { email } = body;
    return { success: true, message: `OTP code sent to ${email}. Enter OTP "123456" to proceed.` };
  }
}

// 2. LGU CONTROLLER
@Controller('api/lgus')
export class LguController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  async getLgus() {
    const supabase = this.supabaseService.getClient();
    if (supabase) {
      const { data, error } = await supabase.from('lgus').select('*').order('created_at', { ascending: true });
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      
      // Map database snake_case keys back to shared interface camelCase keys
      return data.map((l: any) => ({
        id: l.id,
        name: l.name,
        logo: l.logo,
        bannerUrl: l.banner_url,
        primaryColor: l.primary_color,
        secondaryColor: l.secondary_color,
        latitude: l.latitude,
        longitude: l.longitude,
        isActive: l.is_active,
        onboardingFeePaid: l.onboarding_fee_paid,
        featureFlags: l.feature_flags
      }));
    }
    return initialLgus;
  }

  @Post()
  async provisionLgu(@Body() body: any) {
    const { name, primaryColor, secondaryColor, latitude, longitude } = body;
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
      featureFlags: { chatbot: true, potholeDetection: true, forum: true }
    };

    const supabase = this.supabaseService.getClient();
    if (supabase) {
      const { error } = await supabase.from('lgus').insert({
        id: newLgu.id,
        name: newLgu.name,
        logo: newLgu.logo,
        banner_url: newLgu.bannerUrl,
        primary_color: newLgu.primaryColor,
        secondary_color: newLgu.secondaryColor,
        latitude: newLgu.latitude,
        longitude: newLgu.longitude,
        is_active: newLgu.isActive,
        onboarding_fee_paid: newLgu.onboardingFeePaid,
        feature_flags: newLgu.featureFlags
      });
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    } else {
      initialLgus.push(newLgu);
    }

    await writeAuditLog(this.supabaseService, null, 'usr-super', 'superadmin@agapp.gov.ph', 'SUPER_ADMIN', 'LGU_PROVISION', `Provisioned LGU: ${name}`);
    return newLgu;
  }

  @Patch(':id/subscription')
  async updateSubscription(@Param('id') id: string, @Body() body: any) {
    const { onboardingFeePaid } = body;
    const supabase = this.supabaseService.getClient();

    if (supabase) {
      const { data, error } = await supabase
        .from('lgus')
        .update({ onboarding_fee_paid: onboardingFeePaid })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      
      await writeAuditLog(this.supabaseService, null, 'usr-super', 'superadmin@agapp.gov.ph', 'SUPER_ADMIN', 'LGU_SUBSCRIPTION_UPDATE', `LGU subscription status ${id}: onboardingFeePaid=${onboardingFeePaid}`);
      return data;
    }

    const lgu = initialLgus.find(l => l.id === id);
    if (!lgu) throw new HttpException('LGU not found', HttpStatus.NOT_FOUND);
    lgu.onboardingFeePaid = onboardingFeePaid;
    await writeAuditLog(this.supabaseService, null, 'usr-super', 'superadmin@agapp.gov.ph', 'SUPER_ADMIN', 'LGU_SUBSCRIPTION_UPDATE', `LGU subscription status ${id}: onboardingFeePaid=${onboardingFeePaid}`);
    return lgu;
  }

  @Patch(':id/feature-flags')
  async updateFeatureFlags(@Param('id') id: string, @Body() body: any) {
    const { featureFlags } = body;
    const supabase = this.supabaseService.getClient();

    if (supabase) {
      const { data, error } = await supabase
        .from('lgus')
        .update({ feature_flags: featureFlags })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      
      await writeAuditLog(this.supabaseService, id, 'usr-liliw-admin', 'admin@liliw.gov.ph', 'LGU_ADMIN', 'FEATURE_FLAGS_UPDATE', `Updated settings: ${JSON.stringify(featureFlags)}`);
      return data;
    }

    const lgu = initialLgus.find(l => l.id === id);
    if (!lgu) throw new HttpException('LGU not found', HttpStatus.NOT_FOUND);
    lgu.featureFlags = { ...lgu.featureFlags, ...featureFlags };
    await writeAuditLog(this.supabaseService, id, 'usr-liliw-admin', 'admin@liliw.gov.ph', 'LGU_ADMIN', 'FEATURE_FLAGS_UPDATE', `Updated settings: ${JSON.stringify(featureFlags)}`);
    return lgu;
  }

  // Map metadata for a specific LGU (center + optional boundary polygon)
  @Get(':id/map')
  async getLguMap(@Param('id') id: string) {
    const supabase = this.supabaseService.getClient();

    if (supabase) {
      const { data, error } = await supabase
        .from('lgus')
        .select('id, name, latitude, longitude, boundary_geojson')
        .eq('id', id)
        .single();

      if (error || !data) {
        throw new HttpException('LGU not found', HttpStatus.NOT_FOUND);
      }

      return {
        id: data.id,
        name: data.name,
        center: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
        boundary: data.boundary_geojson || null,
      };
    }

    const lgu = initialLgus.find(l => l.id === id);
    if (!lgu) throw new HttpException('LGU not found', HttpStatus.NOT_FOUND);

    return {
      id: lgu.id,
      name: lgu.name,
      center: {
        latitude: lgu.latitude,
        longitude: lgu.longitude,
      },
      boundary: null,
    };
  }
}

// 3. REPORTS CONTROLLER
@Controller('api/reports')
export class ReportController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  async getReports(@Query('lguId') lguId?: string, @Query('citizenId') citizenId?: string) {
    const supabase = this.supabaseService.getClient();
    if (supabase) {
      let query = supabase.from('reports').select('*');
      if (lguId) query = query.eq('lgu_id', lguId);
      if (citizenId) query = query.eq('citizen_id', citizenId);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      
      return data.map((r: any) => ({
        id: r.id,
        referenceNumber: r.reference_number,
        lguId: r.lgu_id,
        citizenId: r.citizen_id,
        citizenName: r.citizen_name,
        category: r.category,
        description: r.description,
        photoUrl: r.photo_url,
        latitude: r.latitude,
        longitude: r.longitude,
        barangay: r.barangay,
        status: r.status,
        assignedOffice: r.assigned_office,
        slaTier: r.sla_tier,
        slaDueDate: r.sla_due_date,
        mlConfidence: r.ml_confidence,
        mlVerified: r.ml_verified,
        isLowCredibility: r.is_low_credibility,
        rating: r.rating,
        feedback: r.feedback,
        statusHistory: r.status_history,
        createdAt: r.created_at
      }));
    }

    let filtered = [...initialReports];
    if (lguId) filtered = filtered.filter(r => r.lguId === lguId);
    if (citizenId) filtered = filtered.filter(r => r.citizenId === citizenId);
    return filtered;
  }

  @Post('verify-image')
  async verifyImage(@Body() body: any) {
    const { photoUrl } = body;
    let mlConfidence = 0.85 + Math.random() * 0.14;
    let mlVerified = true;
    let isLowCredibility = false;

    if (photoUrl && photoUrl.includes('invalid')) {
      mlConfidence = 0.22;
      mlVerified = false;
      isLowCredibility = true;
    }

    return { mlConfidence, mlVerified, isLowCredibility };
  }

  @Post()
  async createReport(@Body() body: any) {
    const { 
      lguId, citizenId, citizenName, category, description, 
      photoUrl, latitude, longitude, barangay,
      mlConfidence, mlVerified, isLowCredibility
    } = body;

    // Check geofence (bounding box logic for fallback, Postgres geography index for live)
    const targetLgu = initialLgus.find(l => l.id === lguId);
    if (targetLgu) {
      const latDiff = Math.abs(latitude - targetLgu.latitude);
      const lngDiff = Math.abs(longitude - targetLgu.longitude);
      if (latDiff > 0.2 || lngDiff > 0.2) {
        throw new HttpException('Geofence Error: Report is outside LGU boundaries.', HttpStatus.BAD_REQUEST);
      }
    }

    const refNum = `REP-2026-${String(initialReports.length + 1).padStart(4, '0')}`;
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
      barangay,
      status: 'Submitted',
      mlConfidence: mlConfidence || 1.0,
      mlVerified: mlVerified ?? true,
      isLowCredibility: isLowCredibility ?? false,
      createdAt: new Date().toISOString(),
      statusHistory: [
        { status: 'Submitted', updatedBy: citizenId || 'citizen', notes: 'Report submitted', timestamp: new Date().toISOString() }
      ]
    };

    // Auto-routing engine logic matching RA 11032
    if (category === 'pothole' || category === 'clogged_drainage') {
      newReport.assignedOffice = 'Engineering Office';
      newReport.slaTier = 'simple';
      newReport.slaDueDate = new Date(Date.now() + 3 * 24 * 3600000).toISOString();
    } else if (category === 'stray_animal' || category === 'missing_pet') {
      newReport.assignedOffice = 'City Veterinary Office';
      newReport.slaTier = 'simple';
      newReport.slaDueDate = new Date(Date.now() + 3 * 24 * 3600000).toISOString();
    } else {
      newReport.assignedOffice = 'Public Assistance Desk';
      newReport.slaTier = 'complex';
      newReport.slaDueDate = new Date(Date.now() + 7 * 24 * 3600000).toISOString();
    }

    const supabase = this.supabaseService.getClient();
    if (supabase) {
      const { error } = await supabase.from('reports').insert({
        reference_number: newReport.referenceNumber,
        lgu_id: newReport.lguId,
        citizen_id: newReport.citizenId === 'usr-citizen' ? null : newReport.citizenId,
        citizen_name: newReport.citizenName,
        category: newReport.category,
        description: newReport.description,
        photo_url: newReport.photoUrl,
        latitude: newReport.latitude,
        longitude: newReport.longitude,
        barangay: newReport.barangay,
        status: newReport.status,
        assigned_office: newReport.assignedOffice,
        sla_tier: newReport.slaTier,
        sla_due_date: newReport.slaDueDate,
        ml_confidence: newReport.mlConfidence,
        ml_verified: newReport.mlVerified,
        is_low_credibility: newReport.isLowCredibility,
        status_history: newReport.statusHistory
      });
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    } else {
      initialReports.unshift(newReport);
    }

    await writeAuditLog(this.supabaseService, lguId, citizenId || 'system', citizenName, 'CITIZEN', 'REPORT_SUBMIT', `Submitted report ${refNum}`);
    return newReport;
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: any) {
    const { status, updatedBy, userRole, userEmail, notes } = body;
    const supabase = this.supabaseService.getClient();

    if (supabase) {
      // Fetch report first to append history
      const { data: record, error: findError } = await supabase.from('reports').select('*').eq('id', id).single();
      if (findError || !record) throw new HttpException('Report not found', HttpStatus.NOT_FOUND);

      const history = record.status_history || [];
      history.push({ status, updatedBy, notes, timestamp: new Date().toISOString() });

      const { data, error } = await supabase
        .from('reports')
        .update({ status, status_history: history })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      
      await writeAuditLog(this.supabaseService, data.lgu_id, updatedBy, userEmail, userRole, 'REPORT_STATUS_UPDATE', `Updated report status to ${status}`);
      return data;
    }

    const report = initialReports.find(r => r.id === id);
    if (!report) throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
    report.status = status;
    report.statusHistory.push({ status, updatedBy, notes, timestamp: new Date().toISOString() });
    
    await writeAuditLog(this.supabaseService, report.lguId, updatedBy, userEmail, userRole, 'REPORT_STATUS_UPDATE', `Updated report ${report.referenceNumber} to ${status}`);
    return report;
  }

  @Post(':id/rate')
  async rateResolution(@Param('id') id: string, @Body() body: any) {
    const { rating, feedback } = body;
    const supabase = this.supabaseService.getClient();

    if (supabase) {
      const { data, error } = await supabase
        .from('reports')
        .update({ rating, feedback })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      return data;
    }

    const report = initialReports.find(r => r.id === id);
    if (!report) throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
    report.rating = rating;
    report.feedback = feedback;
    return report;
  }
}

// 4. SERVICES CONTROLLER
@Controller('api/services')
export class ServiceController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  async getServices(@Query('lguId') lguId?: string, @Query('citizenId') citizenId?: string) {
    const supabase = this.supabaseService.getClient();
    if (supabase) {
      let query = supabase.from('service_requests').select('*');
      if (lguId) query = query.eq('lgu_id', lguId);
      if (citizenId) query = query.eq('citizen_id', citizenId);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      
      return data.map((s: any) => ({
        id: s.id,
        referenceNumber: s.reference_number,
        lguId: s.lgu_id,
        citizenId: s.citizen_id,
        citizenName: s.citizen_name,
        serviceType: s.service_type,
        officeName: s.office_name,
        status: s.status,
        formDetails: s.form_details,
        qrCodeUrl: s.qr_code_url,
        attachmentUrl: s.attachment_url,
        assignedPersonnel: s.assigned_personnel,
        rejectReason: s.reject_reason,
        statusHistory: s.status_history,
        createdAt: s.created_at
      }));
    }

    let filtered = [...initialServiceRequests];
    if (lguId) filtered = filtered.filter(s => s.lguId === lguId);
    if (citizenId) filtered = filtered.filter(s => s.citizenId === citizenId);
    return filtered;
  }

  @Post()
  async createServiceRequest(@Body() body: any) {
    const { lguId, citizenId, citizenName, serviceType, formDetails } = body;
    const refNum = `REQ-2026-${String(initialServiceRequests.length + 1).padStart(4, '0')}`;
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
        { status: 'Submitted', updatedBy: citizenId || 'citizen', notes: 'Document application submitted', timestamp: new Date().toISOString() }
      ]
    };

    const supabase = this.supabaseService.getClient();
    if (supabase) {
      const { error } = await supabase.from('service_requests').insert({
        reference_number: newRequest.referenceNumber,
        lgu_id: newRequest.lguId,
        citizen_id: newRequest.citizenId === 'usr-citizen' ? null : newRequest.citizenId,
        citizen_name: newRequest.citizenName,
        service_type: newRequest.serviceType,
        office_name: newRequest.officeName,
        status: newRequest.status,
        form_details: newRequest.formDetails,
        qr_code_url: newRequest.qrCodeUrl,
        status_history: newRequest.statusHistory
      });
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    } else {
      initialServiceRequests.unshift(newRequest);
    }

    await writeAuditLog(this.supabaseService, lguId, citizenId || 'system', citizenName, 'CITIZEN', 'SERVICE_REQUEST_SUBMIT', `Applied for ${serviceType}`);
    return newRequest;
  }

  @Patch(':id/status')
  async updateRequestStatus(@Param('id') id: string, @Body() body: any) {
    const { status, updatedBy, userRole, userEmail, notes, attachmentUrl, rejectReason } = body;
    const supabase = this.supabaseService.getClient();

    if (supabase) {
      const { data: record, error: findError } = await supabase.from('service_requests').select('*').eq('id', id).single();
      if (findError || !record) throw new HttpException('Request not found', HttpStatus.NOT_FOUND);

      const history = record.status_history || [];
      history.push({ status, updatedBy, notes, timestamp: new Date().toISOString() });

      const updates: any = { status, status_history: history };
      if (attachmentUrl) updates.attachment_url = attachmentUrl;
      if (rejectReason) updates.reject_reason = rejectReason;

      const { data, error } = await supabase
        .from('service_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      
      await writeAuditLog(this.supabaseService, data.lgu_id, updatedBy, userEmail, userRole, 'SERVICE_REQUEST_STATUS_UPDATE', `Updated request ${data.reference_number} to ${status}`);
      return data;
    }

    const request = initialServiceRequests.find(s => s.id === id);
    if (!request) throw new HttpException('Service request not found', HttpStatus.NOT_FOUND);
    request.status = status;
    if (attachmentUrl) request.attachmentUrl = attachmentUrl;
    if (rejectReason) request.rejectReason = rejectReason;
    request.statusHistory.push({ status, updatedBy, notes, timestamp: new Date().toISOString() });
    
    await writeAuditLog(this.supabaseService, request.lguId, updatedBy, userEmail, userRole, 'SERVICE_REQUEST_STATUS_UPDATE', `Updated request ${request.referenceNumber} to ${status}`);
    return request;
  }
}

// Helper for local profanity, spam, and PII auto-moderation
function localModeratePost(content: string): { isApproved: boolean; flaggedKeywords: string[] } {
  const flaggedKeywords: string[] = [];
  const text = content.toLowerCase();

  // 1. Expanded list of Tagalog, English, and Taglish profanities
  const localProfanities = [
    'putang ina', 'putangina', 'tangina', 'gago', 'tarantado', 'pota', 'ulol', 'shet', 
    'bwisit', 'fuck', 'shit', 'asshole', 'bitch', 'pakyaw', 'bobo', 'hudas', 'kupal'
  ];
  for (const word of localProfanities) {
    if (text.includes(word)) {
      flaggedKeywords.push(word);
    }
  }

  // 2. Personally Identifiable Information (PII) Checks
  // Phone numbers (e.g. 09171234567, +639171234567, 0917-123-4567)
  const phoneRegex = /(?:09|\+639)\d{2}[-\s]?\d{3}[-\s]?\d{4}/g;
  const phones = content.match(phoneRegex);
  if (phones && phones.length > 0) {
    for (const phone of phones) {
      flaggedKeywords.push(`Phone: ${phone}`);
    }
  }

  // Email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = content.match(emailRegex);
  if (emails && emails.length > 0) {
    for (const email of emails) {
      flaggedKeywords.push(`Email: ${email}`);
    }
  }

  // 3. Spam / Suspicious links (URLs)
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = content.match(urlRegex);
  if (urls && urls.length > 0) {
    for (const url of urls) {
      flaggedKeywords.push(`Link: ${url}`);
    }
  }

  return {
    isApproved: flaggedKeywords.length === 0,
    flaggedKeywords
  };
}

// 5. FORUM CONTROLLER
@Controller('api/forum')
export class ForumController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  async getForumPosts(@Query('lguId') lguId?: string, @Query('includePending') includePending?: string) {
    const supabase = this.supabaseService.getClient();
    if (supabase) {
      // Select posts along with their comments so we can count them
      let query = supabase.from('forum_posts').select('*, forum_comments(id, is_approved)');
      if (lguId) query = query.eq('lgu_id', lguId);
      if (includePending !== 'true') query = query.eq('is_approved', true);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      
      return data.map((f: any) => {
        const approvedComments = (f.forum_comments || []).filter((c: any) => c.is_approved);
        return {
          id: f.id,
          lguId: f.lgu_id,
          citizenId: f.citizen_id,
          citizenName: f.citizen_name,
          title: f.title || 'General Discussion',
          content: f.content,
          tags: f.tags || [],
          photoUrl: f.photo_url || null,
          isApproved: f.is_approved,
          flaggedKeywords: f.flagged_keywords,
          createdAt: f.created_at,
          commentsCount: approvedComments.length
        };
      });
    }

    let filtered = [...initialForumPosts];
    if (lguId) filtered = filtered.filter(f => f.lguId === lguId);
    if (includePending !== 'true') {
      filtered = filtered.filter(f => f.isApproved);
    }
    return filtered.map(f => ({
      ...f,
      title: f.title || 'General Discussion',
      tags: f.tags || [],
      photoUrl: f.photoUrl || null,
      commentsCount: 0
    }));
  }

  @Post()
  async createForumPost(@Body() body: any) {
    const { lguId, citizenId, citizenName, title, content, tags, photoUrl } = body;
    
    // 1. Run local moderation check first (fast and covers basic profanities/PII)
    const moderation = localModeratePost(content);

    // 2. Run Gemini moderation check if key exists (to analyze context/hate speech/harassment/sentiment)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && moderation.isApproved) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: { responseMimeType: 'application/json' }
        });

        const prompt = `You are a strict, automated content moderation assistant for the AGAPP community forum of the Municipality of Laguna, Philippines.
Evaluate if the following forum post content violates community standards.

Community Standards include:
1. Hate Speech or Bullying: Attack or abuse against individuals or groups based on race, ethnicity, religion, or personal traits.
2. Harassment or Threats: Aggressive or threatening messages targeting specific municipal personnel, public servants, or citizens.
3. Vulgarity, Nudity, or Inappropriate Content: Sexually explicit, violent, or highly offensive words (in English, Tagalog/Filipino, or Taglish).
4. Spam or Self-Promotion: Unrelated commercial advertisements, scams, clickbait links, or repetitive postings.
5. Personally Identifiable Information (PII): Unnecessary public exposure of phone numbers, emails, bank accounts, or home addresses.

Evaluate the following forum post:
"${content}"

Respond in strict JSON format:
{
  "isApproved": boolean,
  "flaggedKeywords": string[] (if not approved, list the violation categories, offending terms, or reasons, e.g. ["Hate Speech", "PII: Address"])
}`;

        const result = await model.generateContent(prompt);
        const resText = result.response.text();
        if (resText && resText.trim()) {
          const parsed = JSON.parse(resText.trim());
          if (parsed && typeof parsed.isApproved === 'boolean') {
            moderation.isApproved = parsed.isApproved;
            moderation.flaggedKeywords = [
              ...moderation.flaggedKeywords,
              ...(parsed.flaggedKeywords || [])
            ];
            // Remove duplicates
            moderation.flaggedKeywords = Array.from(new Set(moderation.flaggedKeywords));
          }
        }
      } catch (err) {
        console.error('[ForumModeration] Gemini safety check failed:', (err as any).message);
      }
    }

    const isApproved = moderation.isApproved;
    const flagged = moderation.flaggedKeywords;

    const newPost: ForumPost = {
      id: `forum-${Date.now()}`,
      lguId,
      citizenId,
      citizenName,
      title: title || 'General Discussion',
      content,
      tags: tags || [],
      photoUrl: photoUrl || null,
      isApproved,
      flaggedKeywords: flagged,
      createdAt: new Date().toISOString(),
      commentsCount: 0
    };

    const supabase = this.supabaseService.getClient();
    if (supabase) {
      const { error } = await supabase.from('forum_posts').insert({
        lgu_id: lguId,
        citizen_id: citizenId === 'usr-citizen' ? null : citizenId,
        citizen_name: citizenName,
        title: title || 'General Discussion',
        content,
        tags: tags || [],
        photo_url: photoUrl || null,
        is_approved: isApproved,
        flagged_keywords: flagged
      });
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    } else {
      initialForumPosts.unshift(newPost);
    }

    await writeAuditLog(this.supabaseService, lguId, citizenId || 'system', citizenName, 'CITIZEN', 'FORUM_POST_CREATE', `Posted in forum. Approved: ${isApproved}. Flagged: ${flagged.join(', ')}`);
    return newPost;
  }

  @Get(':postId/comments')
  async getForumComments(@Param('postId') postId: string) {
    const supabase = this.supabaseService.getClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('forum_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      
      return data.map((c: any) => ({
        id: c.id,
        postId: c.post_id,
        parentCommentId: c.parent_comment_id || null,
        citizenId: c.citizen_id,
        citizenName: c.citizen_name,
        content: c.content,
        isApproved: c.is_approved,
        flaggedKeywords: c.flagged_keywords,
        createdAt: c.created_at
      }));
    }
    
    // Fallback
    return [];
  }

  @Post(':postId/comments')
  async createForumComment(@Param('postId') postId: string, @Body() body: any) {
    const { citizenId, citizenName, content, parentCommentId } = body;
    
    // 1. Run local moderation check first
    const moderation = localModeratePost(content);

    // 2. Run Gemini moderation check if key exists
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && moderation.isApproved) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: { responseMimeType: 'application/json' }
        });

        const prompt = `You are a strict, automated content moderation assistant for the AGAPP community forum of the Municipality of Laguna, Philippines.
Evaluate if the following forum COMMENT content violates community standards.

Community Standards include:
1. Hate Speech or Bullying: Attack or abuse against individuals or groups based on race, ethnicity, religion, or personal traits.
2. Harassment or Threats: Aggressive or threatening messages targeting specific municipal personnel, public servants, or citizens.
3. Vulgarity, Nudity, or Inappropriate Content: Sexually explicit, violent, or highly offensive words (in English, Tagalog/Filipino, or Taglish).
4. Spam or Self-Promotion: Unrelated commercial advertisements, scams, clickbait links, or repetitive postings.
5. Personally Identifiable Information (PII): Unnecessary public exposure of phone numbers, emails, bank accounts, or home addresses.

Evaluate the following comment:
"${content}"

Respond in strict JSON format:
{
  "isApproved": boolean,
  "flaggedKeywords": string[] (if not approved, list the violation categories, offending terms, or reasons, e.g. ["Hate Speech", "PII: Address"])
}`;

        const result = await model.generateContent(prompt);
        const resText = result.response.text();
        if (resText && resText.trim()) {
          const parsed = JSON.parse(resText.trim());
          if (parsed && typeof parsed.isApproved === 'boolean') {
            moderation.isApproved = parsed.isApproved;
            moderation.flaggedKeywords = [
              ...moderation.flaggedKeywords,
              ...(parsed.flaggedKeywords || [])
            ];
            moderation.flaggedKeywords = Array.from(new Set(moderation.flaggedKeywords));
          }
        }
      } catch (err) {
        console.error('[ForumCommentModeration] Gemini safety check failed:', (err as any).message);
      }
    }

    const isApproved = moderation.isApproved;
    const flagged = moderation.flaggedKeywords;

    const supabase = this.supabaseService.getClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('forum_comments')
        .insert({
          post_id: postId,
          parent_comment_id: parentCommentId || null,
          citizen_id: citizenId === 'usr-citizen' ? null : citizenId,
          citizen_name: citizenName,
          content,
          is_approved: isApproved,
          flagged_keywords: flagged
        })
        .select()
        .single();
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      
      await writeAuditLog(this.supabaseService, null, citizenId || 'system', citizenName, 'CITIZEN', 'FORUM_COMMENT_CREATE', `Posted comment in thread ${postId}. Approved: ${isApproved}. Flagged: ${flagged.join(', ')}`);
      return {
        id: data.id,
        postId: data.post_id,
        parentCommentId: data.parent_comment_id || null,
        citizenId: data.citizen_id,
        citizenName: data.citizen_name,
        content: data.content,
        isApproved: data.is_approved,
        flaggedKeywords: data.flagged_keywords,
        createdAt: data.created_at
      };
    }
    
    // Fallback mock return
    const mockComment = {
      id: `comment-${Date.now()}`,
      postId,
      parentCommentId: parentCommentId || null,
      citizenId,
      citizenName,
      content,
      isApproved,
      flaggedKeywords: flagged,
      createdAt: new Date().toISOString()
    };
    return mockComment;
  }

  @Patch(':id/approve')
  async approvePost(@Param('id') id: string, @Body() body: any) {
    const { approvedBy, userEmail, userRole } = body;
    const supabase = this.supabaseService.getClient();

    if (supabase) {
      const { data, error } = await supabase
        .from('forum_posts')
        .update({ is_approved: true, flagged_keywords: [] })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      
      await writeAuditLog(this.supabaseService, data.lgu_id, approvedBy, userEmail, userRole, 'FORUM_POST_APPROVE', `Moderator approved post ${id}`);
      return data;
    }

    const post = initialForumPosts.find(f => f.id === id);
    if (!post) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    post.isApproved = true;
    post.flaggedKeywords = [];
    
    await writeAuditLog(this.supabaseService, post.lguId, approvedBy, userEmail, userRole, 'FORUM_POST_APPROVE', `Moderator approved post ${id}`);
    return post;
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string, @Body() body: any) {
    const { deletedBy, userEmail, userRole } = body;
    const supabase = this.supabaseService.getClient();

    if (supabase) {
      const { data: record, error: findError } = await supabase.from('forum_posts').select('*').eq('id', id).single();
      if (findError || !record) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);

      const { error } = await supabase.from('forum_posts').delete().eq('id', id);
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      
      await writeAuditLog(this.supabaseService, record.lgu_id, deletedBy, userEmail, userRole, 'FORUM_POST_DELETE', `Rejected post: "${record.content.substring(0,30)}..."`);
      return { success: true };
    }

    const idx = initialForumPosts.findIndex(f => f.id === id);
    if (idx === -1) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    
    const post = initialForumPosts[idx];
    initialForumPosts.splice(idx, 1);
    
    await writeAuditLog(this.supabaseService, post.lguId, deletedBy, userEmail, userRole, 'FORUM_POST_DELETE', `Rejected post: "${post.content.substring(0,30)}..."`);
    return { success: true };
  }
}

// ── Chatbot helpers ──────────────────────────────────────────────────────────

/**
 * Scores a FAQ entry against the user query using keyword overlap.
 * Each keyword that appears in the lowercased query adds 1 point.
 * Multi-word keyword phrases score higher (length bonus).
 */
function scoreFaq(query: string, keywords: string[]): number {
  const q = query.toLowerCase();
  return keywords.reduce((score, kw) => {
    if (q.includes(kw.toLowerCase())) {
      return score + kw.split(/\s+/).length; // multi-word phrases worth more
    }
    return score;
  }, 0);
}

// 6. CHATBOT CONTROLLER — Predefined Q&A primary, Gemini API fallback
@Controller('api/chatbot')
export class ChatbotController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Post('ask')
  @UseGuards(SupabaseAuthGuard)
  async askChatbot(@Body() body: ChatbotAskDto) {
    const { query, lguId, history } = body;

    if (!query || !query.trim()) {
      return { answer: 'Please type a question so I can help you.', source: 'AGAPP Chatbot', found: false, redirect: null };
    }

    // Resolve active LGU name and fetch FAQs dynamically from Supabase
    let lguName = 'Liliw';
    let faqs = mockFaqs;
    const supabase = this.supabaseService.getClient();
    if (supabase && lguId) {
      try {
        const { data: lguData } = await supabase.from('lgus').select('name').eq('id', lguId).single();
        if (lguData) {
          lguName = lguData.name.replace('Municipality of ', '');
        }

        const { data: faqData } = await supabase
          .from('chatbot_faqs')
          .select('question, answer, source, tags')
          .eq('lgu_id', lguId);
        
        if (faqData && faqData.length > 0) {
          faqs = faqData.map((d: any) => ({
            question: d.question,
            answer: d.answer,
            source: d.source,
            keywords: d.tags || []
          }));
        }
      } catch (err) {
        // Fallback to in-memory check
        const match = initialLgus.find(l => l.id === lguId);
        if (match) lguName = match.name.replace('Municipality of ', '');
      }
    } else if (lguId) {
      const match = initialLgus.find(l => l.id === lguId);
      if (match) lguName = match.name.replace('Municipality of ', '');
    }

    // ── STEP 1: Predefined keyword-scored matching ───────────────────────────
    let bestMatch: typeof mockFaqs[0] | null = null;
    let bestScore = 0;

    for (const faq of faqs) {
      const score = scoreFaq(query, faq.keywords);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq;
      }
    }

    // Threshold: at least 1 keyword must match to use predefined answer
    if (bestMatch && bestScore >= 1) {
      // Predefined FAQ redirect mapper
      let faqRedirect: { screen: string; label: string } | null = null;
      const kw = bestMatch.keywords;
      if (kw.includes('pothole') || kw.includes('drainage') || kw.includes('stray') || kw.includes('lost') || kw.includes('report')) {
        faqRedirect = { screen: 'ReportsTab', label: 'Submit a Report' };
      } else if (kw.includes('track') || kw.includes('status')) {
        faqRedirect = { screen: 'ReportsTab', label: 'Track My Reports' };
      } else if (kw.includes('business') || kw.includes('birth') || kw.includes('marriage') || kw.includes('death') || kw.includes('cedula') || kw.includes('indigency') || kw.includes('health') || kw.includes('building') || kw.includes('permit') || kw.includes('document')) {
        faqRedirect = { screen: 'ServicesTab', label: 'Go to Services' };
      }

      return {
        answer: bestMatch.answer.replace(/Liliw/g, lguName), // Personalize answer to LGU
        source: bestMatch.source,
        found: true,
        method: 'predefined',
        redirect: faqRedirect
      };
    }

    // ── STEP 2: Gemini API fallback (only when GEMINI_API_KEY is set) ────────
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: { responseMimeType: 'application/json' }
        });

        // Format chat history context
        let historyContextText = '';
        if (history && Array.isArray(history) && history.length > 0) {
          historyContextText = '\nHere is the recent conversation history for context:\n' + 
            history.slice(-6).map((h: any) => `${h.sender === 'user' ? 'Citizen' : 'AI'}: "${h.text}"`).join('\n') + '\n';
        }

        const prompt = `You are a helpful, professional government service AI assistant built strictly for the AGAPP mobile application of the Municipality of ${lguName}, Laguna, Philippines.

You must ONLY answer queries related to ${lguName} LGU municipal services (such as document applications, business permits, community reports, local government operations, or AGAPP application guide).
If the citizen's question is unrelated to ${lguName} government services, or if it asks for general knowledge, coding, creative tasks, recipes, sports, or other countries outside of municipal service scopes, you MUST politely decline to answer, state your narrow scope as an LGU assistant, and guide them to use AGAPP's features.
${historyContextText}
Based on the citizen's current query: "${query}" (incorporating the conversation history context above), determine if the query implies they want to perform an action inside the AGAPP application. If so, determine which tab/screen they should navigate to:
- If they want to submit a report, file a complaint, report road issues, potholes, stray animals, clogged drainage, etc. -> screen is "ReportsTab", label is "Submit a Report".
- If they want to request a birth certificate, marriage certificate, death certificate, business permit, cedula, or any other government document/clearance -> screen is "ServicesTab", label is "Go to Services".
- If they want to view local government buildings, find the police station, municipal hall, fire station, hospital, public market, or explore the town map -> screen is "MapTab", label is "Open Map Explorer".
- If they want to read/participate in community discussions or ask other citizens -> screen is "Forum", label is "Go to Forum".
- Otherwise -> redirect is null.

You MUST respond in valid JSON format matching this schema:
{
  "answer": "string (your concise answer under 5 sentences, keeping the tone helpful, polite and professional)",
  "redirect": null or {
    "screen": "ReportsTab" | "ServicesTab" | "MapTab" | "Forum",
    "label": "string (matching the action, e.g. 'Submit a Report', 'Go to Services', 'Open Map Explorer', 'Go to Forum')"
  }
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (text && text.trim()) {
          try {
            const parsed = JSON.parse(text.trim());
            return {
              answer: parsed.answer,
              source: `Gemini AI — ${lguName} LGU Assistant`,
              found: true,
              method: 'gemini',
              redirect: parsed.redirect || null
            };
          } catch (jsonErr) {
            return {
              answer: text.trim(),
              source: `Gemini AI — ${lguName} LGU Assistant`,
              found: true,
              method: 'gemini',
              redirect: null
            };
          }
        }
      } catch (err) {
        console.error('[ChatbotController] Gemini fallback failed:', (err as any).message);
      }
    }

    // ── STEP 3: No answer found ───────────────────────────────────────────────
    return {
      answer: `I'm sorry, I couldn't find an answer for that in the ${lguName} LGU knowledge base. For specific concerns, please visit the Municipal Hall (Mon–Fri, 8AM–5PM) or use the AGAPP Report feature to file your concern directly.`,
      source: 'AGAPP Chatbot',
      found: false,
      offerTicket: true,
      redirect: null
    };
  }
}

// 7. AUDIT LOG CONTROLLER
@Controller('api/audit-logs')
export class AuditController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  async getLogs(@Query('lguId') lguId?: string) {
    const supabase = this.supabaseService.getClient();
    if (supabase) {
      let query = supabase.from('audit_logs').select('*');
      if (lguId) query = query.eq('lgu_id', lguId);
      
      const { data, error } = await query.order('timestamp', { ascending: false });
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      
      return data.map((l: any) => ({
        id: l.id,
        lguId: l.lgu_id,
        userId: l.user_id,
        userEmail: l.user_email,
        userRole: l.user_role,
        action: l.action,
        ipAddress: l.ip_address,
        details: l.details,
        timestamp: l.timestamp
      }));
    }
    return initialAuditLogs;
  }
}
