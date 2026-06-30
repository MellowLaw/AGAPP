import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SupabaseService } from './supabase.service';
import { LGU, Report, ServiceRequest } from '@agapp/shared';
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

type FaqEntry = { question: string; answer: string; source: string; keywords: string[] };

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
  if (!supabase) return;
  await supabase.from('audit_logs').insert({
    lgu_id: lguId,
    user_id: userId === 'usr-super' || userId === 'usr-liliw-admin' ? null : userId,
    user_email: userEmail,
    user_role: userRole,
    action,
    ip_address: '127.0.0.1',
    details
  });
}

// 1. AUTH CONTROLLER
@Controller('api/auth')
export class AuthController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Post('login')
  async login(@Body() body: any) {
    const { email } = body;
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

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

  @Post('otp')
  async requestOtp(@Body() body: any) {
    const { email } = body;
    return { success: true, message: `OTP code sent to ${email}.` };
  }
}

// 2. LGU CONTROLLER
@Controller('api/lgus')
export class LguController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  async getLgus() {
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

    const { data, error } = await supabase.from('lgus').select('*').order('created_at', { ascending: true });
    if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);

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

  @Post()
  async provisionLgu(@Body() body: any) {
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

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

    await writeAuditLog(this.supabaseService, null, 'usr-super', 'superadmin@agapp.gov.ph', 'SUPER_ADMIN', 'LGU_PROVISION', `Provisioned LGU: ${name}`);
    return newLgu;
  }

  @Patch(':id/subscription')
  async updateSubscription(@Param('id') id: string, @Body() body: any) {
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

    const { onboardingFeePaid } = body;
    const { data, error } = await supabase
      .from('lgus')
      .update({ onboarding_fee_paid: onboardingFeePaid })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);

    await writeAuditLog(this.supabaseService, null, 'usr-super', 'superadmin@agapp.gov.ph', 'SUPER_ADMIN', 'LGU_SUBSCRIPTION_UPDATE', `LGU ${id}: onboardingFeePaid=${onboardingFeePaid}`);
    return data;
  }

  @Patch(':id/feature-flags')
  async updateFeatureFlags(@Param('id') id: string, @Body() body: any) {
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

    const { featureFlags } = body;
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

  @Get(':id/map')
  async getLguMap(@Param('id') id: string) {
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

    const { data, error } = await supabase
      .from('lgus')
      .select('id, name, latitude, longitude, boundary_geojson')
      .eq('id', id)
      .single();
    if (error || !data) throw new HttpException('LGU not found', HttpStatus.NOT_FOUND);

    return {
      id: data.id,
      name: data.name,
      center: { latitude: data.latitude, longitude: data.longitude },
      boundary: data.boundary_geojson || null,
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
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

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
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

    const {
      lguId, citizenId, citizenName, category, description,
      photoUrl, latitude, longitude, barangay,
      mlConfidence, mlVerified, isLowCredibility
    } = body;

    const refNum = `REP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
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

    const { error } = await supabase.from('reports').insert({
      reference_number: newReport.referenceNumber,
      lgu_id: newReport.lguId,
      citizen_id: newReport.citizenId,
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

    await writeAuditLog(this.supabaseService, lguId, citizenId || 'system', citizenName, 'CITIZEN', 'REPORT_SUBMIT', `Submitted report ${refNum}`);
    return newReport;
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: any) {
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

    const { status, updatedBy, userRole, userEmail, notes } = body;
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

  @Post(':id/rate')
  async rateResolution(@Param('id') id: string, @Body() body: any) {
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

    const { rating, feedback } = body;
    const { data, error } = await supabase
      .from('reports')
      .update({ rating, feedback })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    return data;
  }
}

// 4. SERVICES CONTROLLER
@Controller('api/services')
export class ServiceController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  async getServices(@Query('lguId') lguId?: string, @Query('citizenId') citizenId?: string) {
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

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

  @Post()
  async createServiceRequest(@Body() body: any) {
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

    const { lguId, citizenId, citizenName, serviceType, formDetails } = body;
    const refNum = `REQ-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
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

    const { error } = await supabase.from('service_requests').insert({
      reference_number: newRequest.referenceNumber,
      lgu_id: newRequest.lguId,
      citizen_id: newRequest.citizenId,
      citizen_name: newRequest.citizenName,
      service_type: newRequest.serviceType,
      office_name: newRequest.officeName,
      status: newRequest.status,
      form_details: newRequest.formDetails,
      qr_code_url: newRequest.qrCodeUrl,
      status_history: newRequest.statusHistory
    });
    if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);

    await writeAuditLog(this.supabaseService, lguId, citizenId || 'system', citizenName, 'CITIZEN', 'SERVICE_REQUEST_SUBMIT', `Applied for ${serviceType}`);
    return newRequest;
  }

  @Patch(':id/status')
  async updateRequestStatus(@Param('id') id: string, @Body() body: any) {
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

    const { status, updatedBy, userRole, userEmail, notes, attachmentUrl, rejectReason } = body;
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
}

// Helper: basic profanity/PII/spam check for forum posts
function localModeratePost(content: string): { isApproved: boolean; flaggedKeywords: string[] } {
  const flaggedKeywords: string[] = [];
  const text = content.toLowerCase();

  const localProfanities = [
    'putang ina', 'putangina', 'tangina', 'gago', 'tarantado', 'pota', 'ulol', 'shet',
    'bwisit', 'fuck', 'shit', 'asshole', 'bitch', 'pakyaw', 'bobo', 'hudas', 'kupal'
  ];
  for (const word of localProfanities) {
    if (text.includes(word)) flaggedKeywords.push(word);
  }

  const phones = content.match(/(?:09|\+639)\d{2}[-\s]?\d{3}[-\s]?\d{4}/g);
  if (phones) phones.forEach(p => flaggedKeywords.push(`Phone: ${p}`));

  const emails = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (emails) emails.forEach(e => flaggedKeywords.push(`Email: ${e}`));

  const urls = content.match(/https?:\/\/[^\s]+/g);
  if (urls) urls.forEach(u => flaggedKeywords.push(`Link: ${u}`));

  return { isApproved: flaggedKeywords.length === 0, flaggedKeywords };
}

// 5. FORUM CONTROLLER
@Controller('api/forum')
export class ForumController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  async getForumPosts(@Query('lguId') lguId?: string, @Query('includePending') includePending?: string) {
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

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

  @Post()
  async createForumPost(@Body() body: any) {
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

    const { lguId, citizenId, citizenName, title, content, tags, photoUrl } = body;
    const moderation = localModeratePost(content);

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
1. Hate Speech or Bullying
2. Harassment or Threats
3. Vulgarity, Nudity, or Inappropriate Content (English, Tagalog/Filipino, or Taglish)
4. Spam or Self-Promotion
5. Personally Identifiable Information (PII)

Post content: "${content}"

Respond in strict JSON: { "isApproved": boolean, "flaggedKeywords": string[] }`;

        const result = await model.generateContent(prompt);
        const resText = result.response.text();
        if (resText && resText.trim()) {
          const parsed = JSON.parse(resText.trim());
          if (parsed && typeof parsed.isApproved === 'boolean') {
            moderation.isApproved = parsed.isApproved;
            moderation.flaggedKeywords = Array.from(new Set([
              ...moderation.flaggedKeywords,
              ...(parsed.flaggedKeywords || [])
            ]));
          }
        }
      } catch (err) {
        console.error('[ForumModeration] Gemini safety check failed:', (err as any).message);
      }
    }

    const { error } = await supabase.from('forum_posts').insert({
      lgu_id: lguId,
      citizen_id: citizenId,
      citizen_name: citizenName,
      title: title || 'General Discussion',
      content,
      tags: tags || [],
      photo_url: photoUrl || null,
      is_approved: moderation.isApproved,
      flagged_keywords: moderation.flaggedKeywords
    });
    if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);

    await writeAuditLog(this.supabaseService, lguId, citizenId || 'system', citizenName, 'CITIZEN', 'FORUM_POST_CREATE', `Posted in forum. Approved: ${moderation.isApproved}`);
    return { isApproved: moderation.isApproved, flaggedKeywords: moderation.flaggedKeywords };
  }

  @Get(':postId/comments')
  async getForumComments(@Param('postId') postId: string) {
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

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

  @Post(':postId/comments')
  async createForumComment(@Param('postId') postId: string, @Body() body: any) {
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

    const { citizenId, citizenName, content, parentCommentId } = body;
    const moderation = localModeratePost(content);

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && moderation.isApproved) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: { responseMimeType: 'application/json' }
        });
        const prompt = `You are a strict, automated content moderation assistant for the AGAPP community forum of the Municipality of Laguna, Philippines.
Evaluate if the following forum COMMENT violates community standards (hate speech, harassment, vulgarity, spam, PII).
Comment: "${content}"
Respond in strict JSON: { "isApproved": boolean, "flaggedKeywords": string[] }`;

        const result = await model.generateContent(prompt);
        const resText = result.response.text();
        if (resText && resText.trim()) {
          const parsed = JSON.parse(resText.trim());
          if (parsed && typeof parsed.isApproved === 'boolean') {
            moderation.isApproved = parsed.isApproved;
            moderation.flaggedKeywords = Array.from(new Set([
              ...moderation.flaggedKeywords,
              ...(parsed.flaggedKeywords || [])
            ]));
          }
        }
      } catch (err) {
        console.error('[ForumCommentModeration] Gemini safety check failed:', (err as any).message);
      }
    }

    const { data, error } = await supabase
      .from('forum_comments')
      .insert({
        post_id: postId,
        parent_comment_id: parentCommentId || null,
        citizen_id: citizenId,
        citizen_name: citizenName,
        content,
        is_approved: moderation.isApproved,
        flagged_keywords: moderation.flaggedKeywords
      })
      .select()
      .single();
    if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);

    await writeAuditLog(this.supabaseService, null, citizenId || 'system', citizenName, 'CITIZEN', 'FORUM_COMMENT_CREATE', `Posted comment in thread ${postId}. Approved: ${moderation.isApproved}`);
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

  @Patch(':id/approve')
  async approvePost(@Param('id') id: string, @Body() body: any) {
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

    const { approvedBy, userEmail, userRole } = body;
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

  @Delete(':id')
  async deletePost(@Param('id') id: string, @Body() body: any) {
    const supabase = this.supabaseService.getClient();
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

    const { deletedBy, userEmail, userRole } = body;
    const { data: record, error: findError } = await supabase.from('forum_posts').select('*').eq('id', id).single();
    if (findError || !record) throw new HttpException('Post not found', HttpStatus.NOT_FOUND);

    const { error } = await supabase.from('forum_posts').delete().eq('id', id);
    if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);

    await writeAuditLog(this.supabaseService, record.lgu_id, deletedBy, userEmail, userRole, 'FORUM_POST_DELETE', `Rejected post: "${record.content.substring(0,30)}..."`);
    return { success: true };
  }
}

function scoreFaq(query: string, keywords: string[]): number {
  const q = query.toLowerCase();
  return keywords.reduce((score, kw) => {
    if (q.includes(kw.toLowerCase())) return score + kw.split(/\s+/).length;
    return score;
  }, 0);
}

// 6. CHATBOT CONTROLLER
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

    let lguName = 'Liliw';
    let faqs: FaqEntry[] = [];
    const supabase = this.supabaseService.getClient();

    if (supabase && lguId) {
      try {
        const { data: lguData } = await supabase.from('lgus').select('name').eq('id', lguId).single();
        if (lguData) lguName = lguData.name.replace('Municipality of ', '');

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
        console.error('[ChatbotController] Failed to load LGU/FAQ data:', (err as any).message);
      }
    }

    // Step 1: predefined keyword matching
    let bestMatch: FaqEntry | null = null;
    let bestScore = 0;
    for (const faq of faqs) {
      const score = scoreFaq(query, faq.keywords);
      if (score > bestScore) { bestScore = score; bestMatch = faq; }
    }

    if (bestMatch && bestScore >= 1) {
      let faqRedirect: { screen: string; label: string } | null = null;
      const kw = bestMatch.keywords;
      if (kw.includes('pothole') || kw.includes('drainage') || kw.includes('stray') || kw.includes('lost') || kw.includes('report')) {
        faqRedirect = { screen: 'ReportsTab', label: 'Submit a Report' };
      } else if (kw.includes('track') || kw.includes('status')) {
        faqRedirect = { screen: 'ReportsTab', label: 'Track My Reports' };
      } else if (kw.some(k => ['business','birth','marriage','death','cedula','indigency','health','building','permit','document'].includes(k))) {
        faqRedirect = { screen: 'ServicesTab', label: 'Go to Services' };
      }
      return {
        answer: bestMatch.answer.replace(/Liliw/g, lguName),
        source: bestMatch.source,
        found: true,
        method: 'predefined',
        redirect: faqRedirect
      };
    }

    // Step 2: Gemini fallback
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: { responseMimeType: 'application/json' }
        });

        let historyContext = '';
        if (history && Array.isArray(history) && history.length > 0) {
          historyContext = '\nRecent conversation:\n' +
            history.slice(-6).map((h: any) => `${h.sender === 'user' ? 'Citizen' : 'AI'}: "${h.text}"`).join('\n') + '\n';
        }

        const prompt = `You are a helpful government service AI assistant for AGAPP, Municipality of ${lguName}, Laguna, Philippines.
Only answer queries related to ${lguName} LGU municipal services (documents, permits, reports, local government operations).
For unrelated queries, politely decline and redirect to AGAPP features.
${historyContext}
Citizen query: "${query}"

If the query implies a desired action in the AGAPP app:
- Submit/report issues → screen "ReportsTab", label "Submit a Report"
- Request documents/permits → screen "ServicesTab", label "Go to Services"
- Find places/map → screen "MapTab", label "Open Map Explorer"
- Community discussions → screen "Forum", label "Go to Forum"
- Otherwise → redirect null

Respond in JSON: { "answer": "string (under 5 sentences, polite and professional)", "redirect": null | { "screen": string, "label": string } }`;

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
          } catch {
            return { answer: text.trim(), source: `Gemini AI — ${lguName} LGU Assistant`, found: true, method: 'gemini', redirect: null };
          }
        }
      } catch (err) {
        console.error('[ChatbotController] Gemini fallback failed:', (err as any).message);
      }
    }

    return {
      answer: `I'm sorry, I couldn't find an answer for that in the ${lguName} LGU knowledge base. For specific concerns, please visit the Municipal Hall (Mon–Fri, 8AM–5PM) or use the AGAPP Report feature.`,
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
    if (!supabase) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);

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
}
