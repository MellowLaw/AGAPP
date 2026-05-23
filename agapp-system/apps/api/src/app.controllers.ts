import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SupabaseService } from './supabase.service';
import { 
  initialLgus, initialUsers, initialReports, 
  initialServiceRequests, initialForumPosts, initialAuditLogs, mockFaqs 
} from './mock-db';
import { LGU, User, Report, ServiceRequest, ForumPost, AuditLog } from '@agapp/shared';

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

// 5. FORUM CONTROLLER
@Controller('api/forum')
export class ForumController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  async getForumPosts(@Query('lguId') lguId?: string, @Query('includePending') includePending?: string) {
    const supabase = this.supabaseService.getClient();
    if (supabase) {
      let query = supabase.from('forum_posts').select('*');
      if (lguId) query = query.eq('lgu_id', lguId);
      if (includePending !== 'true') query = query.eq('is_approved', true);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      
      return data.map((f: any) => ({
        id: f.id,
        lguId: f.lgu_id,
        citizenId: f.citizen_id,
        citizenName: f.citizen_name,
        content: f.content,
        isApproved: f.is_approved,
        flaggedKeywords: f.flagged_keywords,
        createdAt: f.created_at
      }));
    }

    let filtered = [...initialForumPosts];
    if (lguId) filtered = filtered.filter(f => f.lguId === lguId);
    if (includePending !== 'true') {
      filtered = filtered.filter(f => f.isApproved);
    }
    return filtered;
  }

  @Post()
  async createForumPost(@Body() body: any) {
    const { lguId, citizenId, citizenName, content } = body;
    
    // Auto-moderation profanity checker matching database triggers
    const profanities = ['putang ina', 'gago', 'tarantado', 'pota', 'ulol', 'shet'];
    const flagged = profanities.filter(word => content.toLowerCase().includes(word));
    const isApproved = flagged.length === 0;

    const newPost: ForumPost = {
      id: `forum-${Date.now()}`,
      lguId,
      citizenId,
      citizenName,
      content,
      isApproved,
      flaggedKeywords: flagged,
      createdAt: new Date().toISOString()
    };

    const supabase = this.supabaseService.getClient();
    if (supabase) {
      const { error } = await supabase.from('forum_posts').insert({
        lgu_id: lguId,
        citizen_id: citizenId === 'usr-citizen' ? null : citizenId,
        citizen_name: citizenName,
        content,
        is_approved: isApproved,
        flagged_keywords: flagged
      });
      if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    } else {
      initialForumPosts.unshift(newPost);
    }

    await writeAuditLog(this.supabaseService, lguId, citizenId || 'system', citizenName, 'CITIZEN', 'FORUM_POST_CREATE', `Posted in forum. Approved: ${isApproved}`);
    return newPost;
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
  async askChatbot(@Body() body: any) {
    const { query } = body;

    if (!query || !query.trim()) {
      return { answer: 'Please type a question so I can help you.', source: 'AGAPP Chatbot', found: false };
    }

    // ── STEP 1: Predefined keyword-scored matching ───────────────────────────
    let bestMatch: typeof mockFaqs[0] | null = null;
    let bestScore = 0;

    for (const faq of mockFaqs) {
      const score = scoreFaq(query, faq.keywords);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq;
      }
    }

    // Threshold: at least 1 keyword must match to use predefined answer
    if (bestMatch && bestScore >= 1) {
      return {
        answer: bestMatch.answer,
        source: bestMatch.source,
        found: true,
        method: 'predefined'
      };
    }

    // ── STEP 2: Gemini API fallback (only when GEMINI_API_KEY is set) ────────
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are a helpful government service assistant for the Municipality of Liliw, Laguna, Philippines. 
A citizen asked: "${query}"

Answer concisely and practically based on standard Philippine LGU services and RA 11032 (Ease of Doing Business Act). 
If the question is outside government services scope, politely say so and suggest they visit the Municipal Hall or use the AGAPP report feature.
Keep the answer under 5 sentences.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (text && text.trim()) {
          return {
            answer: text.trim(),
            source: 'Gemini AI — Liliw LGU Assistant',
            found: true,
            method: 'gemini'
          };
        }
      } catch (err) {
        console.error('[ChatbotController] Gemini fallback failed:', (err as any).message);
      }
    }

    // ── STEP 3: No answer found ───────────────────────────────────────────────
    return {
      answer: "I'm sorry, I couldn't find an answer for that in the Liliw LGU knowledge base. For specific concerns, please visit the Municipal Hall (Mon–Fri, 8AM–5PM) or use the AGAPP Report feature to file your concern directly.",
      source: 'AGAPP Chatbot',
      found: false,
      offerTicket: true
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
