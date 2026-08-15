'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { lguIdFromName } from '@/lib/lgu';
import { Book, Add, Calendar, Clock, Paperclip, Eye, Trash, Edit, Send, Image as ImageIcon, DocumentText, CloseCircle, Danger, Notification } from 'iconsax-react';
import { Skeleton } from '@/components/ui/Skeleton';

type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'archived';

type AnnouncementType = 'news' | 'announcement' | 'advisory';

interface AnnouncementItem {
  id: string; // underlying news_announcements.id
  title: string;
  content: string;
  status: AnnouncementStatus;
  type: AnnouncementType;
  durationHours: number | null;
  expiresAt?: string;
  isPublic: boolean;
  isFeatured: boolean;
  publishedAt?: string;
  scheduledFor?: string;
  publishedAtRaw?: string | null;
  scheduledForRaw?: string | null;
  views: number;
  attachments: number; // count
  attachmentsRaw?: any[];
}

const mapDbStatusToStatus = (status: string | null): AnnouncementStatus => {
  switch (status) {
    case 'published':
      return 'published';
    case 'scheduled':
      return 'scheduled';
    case 'archived':
      return 'archived';
    case 'draft':
    default:
      return 'draft';
  }
};

const mapAnnouncementRowToItem = (row: any): AnnouncementItem => {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    status: mapDbStatusToStatus(row.status),
    type: (row.type as AnnouncementType) || 'news',
    durationHours: row.duration_hours ?? null,
    expiresAt: row.expires_at ? new Date(row.expires_at).toLocaleString() : undefined,
    isPublic: row.is_public ?? true,
    isFeatured: row.is_featured ?? false,
    publishedAt: row.published_at ? new Date(row.published_at).toLocaleString() : undefined,
    scheduledFor: row.scheduled_for ? new Date(row.scheduled_for).toLocaleString() : undefined,
    publishedAtRaw: row.published_at ?? null,
    scheduledForRaw: row.scheduled_for ?? null,
    views: row.views ?? 0,
    attachments: Array.isArray(row.attachments) ? row.attachments.length : 0,
    attachmentsRaw: row.attachments || [],
  };
};

export default function NewsPage() {
  const [announcementsList, setAnnouncementsList] = useState<AnnouncementItem[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [formType, setFormType] = useState<'news' | 'announcement' | 'advisory'>('news');
  const [durationHours, setDurationHours] = useState<string>('manual');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Column Timeline and Planner state hooks
  const [viewMode, setViewMode] = useState<'list' | 'columns' | 'planner'>('list');
  const [plannerView, setPlannerView] = useState<'week' | 'month'>('month');
  const [currentPlannerDate, setCurrentPlannerDate] = useState(new Date());
  const [colsExpanded, setColsExpanded] = useState({
    news: true,
    announcement: true,
    advisory: true,
  });

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    const replacement = before + (selectedText || '') + after;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    
    setContent(newContent);
    
    // Put focus back to textarea
    setTimeout(() => {
      textarea.focus();
      const selectionStart = start + before.length;
      const selectionEnd = selectionStart + (selectedText || '').length;
      textarea.setSelectionRange(selectionStart, selectionEnd);
    }, 0);
  };

  const renderInlineFormats = (text: string) => {
    const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-text-primary">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic text-text-primary">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const renderMarkdown = (text: string) => {
    if (!text) return <p className="text-text-muted italic">No content to preview.</p>;

    return text.split('\n').map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-2xl font-bold text-text-primary mt-4 mb-2 border-b border-theme pb-1">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-xl font-bold text-text-primary mt-3 mb-2">{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-lg font-bold text-text-primary mt-3 mb-1">{line.substring(4)}</h3>;
      }
      if (line.startsWith('> ')) {
        return <blockquote key={idx} className="border-l-4 border-accent pl-4 italic my-2 text-text-muted">{line.substring(2)}</blockquote>;
      }
      if (line.trim().startsWith('- ')) {
        return <li key={idx} className="list-disc ml-6 my-1 text-text-primary">{renderInlineFormats(line.trim().substring(2))}</li>;
      }
      if (line.trim().startsWith('* ')) {
        return <li key={idx} className="list-disc ml-6 my-1 text-text-primary">{renderInlineFormats(line.trim().substring(2))}</li>;
      }
      const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return <li key={idx} className="list-decimal ml-6 my-1 text-text-primary">{renderInlineFormats(numMatch[2])}</li>;
      }
      if (!line.trim()) {
        return <div key={idx} className="h-4" />;
      }
      return (
        <p key={idx} className="text-text-primary leading-relaxed mb-3 text-justify">
          {renderInlineFormats(line)}
        </p>
      );
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...selectedFiles]);
    }
  };

  const uploadAttachments = async (): Promise<any[]> => {
    const uploadedUrls: any[] = [];
    for (const file of attachments) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('service-attachments')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        showToast(`Failed to upload ${file.name}`, 'error');
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('service-attachments')
        .getPublicUrl(fileName);

      uploadedUrls.push({
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
      });
    }
    return uploadedUrls;
  };
  const { showToast, ToastContainer } = useToast();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const params = useSearchParams();
  const lguNameParam = params?.get('lguName') || 'Liliw, Laguna';
  const lguId = lguIdFromName(lguNameParam);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await supabase
        .from('news_announcements')
        .select('*')
        .eq('lgu_id', lguId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading announcements', error);
        setLoadError(error.message);
        showToast('Failed to load announcements. Please try again.', 'error');
        setLoading(false);
        return;
      }

      const mapped = (data || []).map(mapAnnouncementRowToItem);
      setAnnouncementsList(mapped);
      setLoading(false);
    };

    fetchAnnouncements();
    // showToast is deliberately excluded — useToast() returns a new function
    // reference on every render, so including it here would refetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lguId]);

  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching auth user', error);
        return;
      }
      setCurrentUserId(data.user?.id ?? null);
    };

    loadUser();
  }, []);

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      showToast('Please enter a title and content', 'info');
      return;
    }

    const now = new Date();
    let expiresAtVal: string | null = null;
    let durationHoursVal: number | null = null;
    if ((formType === 'announcement' || formType === 'advisory') && durationHours !== 'manual') {
      durationHoursVal = parseInt(durationHours, 10);
      const expires = new Date(now.getTime() + durationHoursVal * 60 * 60 * 1000);
      expiresAtVal = expires.toISOString();
    }

    // Upload files
    let uploaded = [];
    try {
      uploaded = await uploadAttachments();
    } catch (e) {
      return; // Stop on upload error
    }
    const finalAttachments = [...existingAttachments, ...uploaded];

    if (editingAnnouncement) {
      const { data, error } = await supabase
        .from('news_announcements')
        .update({
          title,
          content,
          status: 'published',
          is_public: isPublic,
          is_featured: isFeatured,
          type: formType,
          duration_hours: durationHoursVal,
          expires_at: expiresAtVal,
          published_at: now.toISOString(),
          scheduled_for: null,
          attachments: finalAttachments,
        })
        .eq('id', editingAnnouncement.id)
        .eq('lgu_id', lguId)
        .select('*')
        .single();

      if (error) {
        console.error('Failed to publish announcement', error);
        showToast('Failed to publish announcement. Please try again.', 'error');
        return;
      }

      const mapped = mapAnnouncementRowToItem(data);
      setAnnouncementsList(prev => prev.map(a => a.id === editingAnnouncement.id ? mapped : a));
    } else {
      const { data, error } = await supabase
        .from('news_announcements')
        .insert({
          lgu_id: lguId,
          created_by: currentUserId,
          title,
          content,
          status: 'published',
          is_public: isPublic,
          is_featured: isFeatured,
          type: formType,
          duration_hours: durationHoursVal,
          expires_at: expiresAtVal,
          published_at: now.toISOString(),
          scheduled_for: null,
          attachments: finalAttachments,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Failed to publish announcement', error);
        showToast('Failed to publish announcement. Please try again.', 'error');
        return;
      }

      const mapped = mapAnnouncementRowToItem(data);
      setAnnouncementsList(prev => [mapped, ...prev]);
    }

    showToast('Published successfully!', 'success');
    setShowCreateForm(false);
    setTitle('');
    setContent('');
    setIsPublic(true);
    setIsFeatured(false);
    setFormType('news');
    setDurationHours('manual');
    setAttachments([]);
    setExistingAttachments([]);
    setEditingAnnouncement(null);
    setScheduleDate('');
    setScheduleTime('');
  };

  const openSchedule = () => {
    setShowScheduleModal(true);
  };  
  const confirmSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      showToast('Please select date and time', 'info');
      return;
    }
    const when = new Date(`${scheduleDate}T${scheduleTime}`);
    let expiresAtVal: string | null = null;
    let durationHoursVal: number | null = null;
    if ((formType === 'announcement' || formType === 'advisory') && durationHours !== 'manual') {
      durationHoursVal = parseInt(durationHours, 10);
      const expires = new Date(when.getTime() + durationHoursVal * 60 * 60 * 1000);
      expiresAtVal = expires.toISOString();
    }

    // Upload files
    let uploaded = [];
    try {
      uploaded = await uploadAttachments();
    } catch (e) {
      return; // Stop on upload error
    }
    const finalAttachments = [...existingAttachments, ...uploaded];

    if (editingAnnouncement) {
      const { data, error } = await supabase
        .from('news_announcements')
        .update({
          title,
          content,
          status: 'scheduled',
          is_public: isPublic,
          is_featured: isFeatured,
          type: formType,
          duration_hours: durationHoursVal,
          expires_at: expiresAtVal,
          scheduled_for: when.toISOString(),
          published_at: null,
          attachments: finalAttachments,
        })
        .eq('id', editingAnnouncement.id)
        .eq('lgu_id', lguId)
        .select('*')
        .single();

      if (error) {
        console.error('Failed to schedule announcement', error);
        showToast('Failed to schedule announcement. Please try again.', 'error');
        return;
      }

      const mapped = mapAnnouncementRowToItem(data);
      setAnnouncementsList(prev => prev.map(a => a.id === editingAnnouncement.id ? mapped : a));
    } else {
      const { data, error } = await supabase
        .from('news_announcements')
        .insert({
          lgu_id: lguId,
          created_by: currentUserId,
          title,
          content,
          status: 'scheduled',
          is_public: isPublic,
          is_featured: isFeatured,
          type: formType,
          duration_hours: durationHoursVal,
          expires_at: expiresAtVal,
          scheduled_for: when.toISOString(),
          published_at: null,
          attachments: finalAttachments,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Failed to schedule announcement', error);
        showToast('Failed to schedule announcement. Please try again.', 'error');
        return;
      }

      const mapped = mapAnnouncementRowToItem(data);
      setAnnouncementsList(prev => [mapped, ...prev]);
    }

    setShowScheduleModal(false);
    showToast('Scheduled successfully!', 'success');
    setShowCreateForm(false);
    setTitle('');
    setContent('');
    setIsPublic(true);
    setIsFeatured(false);
    setFormType('news');
    setDurationHours('manual');
    setAttachments([]);
    setExistingAttachments([]);
    setScheduleDate('');
    setScheduleTime('');
    setEditingAnnouncement(null);
  };

  const handleEdit = (announcement: AnnouncementItem) => {
    setEditingAnnouncement(announcement);
    setShowCreateForm(true);
    setTitle(announcement.title);
    setContent(announcement.content);
    setIsPublic(announcement.isPublic);
    setIsFeatured(announcement.isFeatured || false);
    setFormType(announcement.type || 'news');
    setDurationHours(announcement.durationHours ? announcement.durationHours.toString() : 'manual');
    setExistingAttachments(Array.isArray(announcement.attachmentsRaw) ? announcement.attachmentsRaw : []);
    if (announcement.scheduledForRaw) {
      const date = new Date(announcement.scheduledForRaw);
      setScheduleDate(date.toISOString().slice(0, 10));
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      setScheduleTime(`${hours}:${minutes}`);
    } else {
      setScheduleDate('');
      setScheduleTime('');
    }
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
  };
  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    const id = pendingDeleteId;
    const { error } = await supabase
      .from('news_announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete announcement', error);
      showToast('Failed to delete announcement. Please try again.', 'error');
      return;
    }

    setAnnouncementsList(prev => prev.filter(a => a.id !== id));
    setPendingDeleteId(null);
    showToast('Announcement deleted', 'success');
  };
  const cancelDelete = () => setPendingDeleteId(null);

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setTitle('');
    setContent('');
    setIsPublic(true);
    setIsFeatured(false);
    setFormType('news');
    setDurationHours('manual');
    setAttachments([]);
    setExistingAttachments([]);
    setScheduleDate('');
    setScheduleTime('');
    setEditingAnnouncement(null);
  };

  // Calendar grid and navigation helpers
  const getDaysInMonthGrid = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const grid = [];
    
    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      grid.push({
        day: prevMonthTotalDays - i,
        month: month === 0 ? 11 : month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      grid.push({
        day: i,
        month,
        year,
        isCurrentMonth: true,
      });
    }

    // Next month filler days
    const remainingCells = 42 - grid.length;
    for (let i = 1; i <= remainingCells; i++) {
      grid.push({
        day: i,
        month: month === 11 ? 0 : month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false,
      });
    }

    return grid;
  };

  const getDaysInWeekGrid = (date: Date) => {
    const currentDay = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - currentDay); // Go to Sunday

    const grid = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      grid.push({
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        isCurrentMonth: d.getMonth() === date.getMonth(),
        dateObject: d,
      });
    }
    return grid;
  };

  const getAnnouncementsForDate = (day: number, month: number, year: number) => {
    return announcementsList.filter(ann => {
      const dateStr = ann.status === 'scheduled' ? ann.scheduledForRaw : ann.publishedAtRaw;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const changeMonth = (offset: number) => {
    const nextDate = new Date(currentPlannerDate.getFullYear(), currentPlannerDate.getMonth() + offset, 1);
    setCurrentPlannerDate(nextDate);
  };

  const changeWeek = (offset: number) => {
    const nextDate = new Date(currentPlannerDate);
    nextDate.setDate(currentPlannerDate.getDate() + (offset * 7));
    setCurrentPlannerDate(nextDate);
  };

  return (
    <DashboardLayout 
      role="lgu-admin" 
      title="Community"
      action={
        <div className="flex gap-2">
          <Button onClick={() => { setShowCreateForm(true); setFormType('news'); setEditingAnnouncement(null); }}>
            <Add className="w-4 h-4 mr-1" />
            Make News
          </Button>
          <Button onClick={() => { setShowCreateForm(true); setFormType('announcement'); setEditingAnnouncement(null); }}>
            <Add className="w-4 h-4 mr-1" />
            Make Announcement
          </Button>
          <Button onClick={() => { setShowCreateForm(true); setFormType('advisory'); setEditingAnnouncement(null); }}>
            <Add className="w-4 h-4 mr-1" />
            Make Advisory
          </Button>
        </div>
      }
    >
      <ToastContainer />
      {loading && (
        <div className="mb-3 px-4 py-2 text-sm text-text-muted bg-surface-alt rounded-md">
          Loading announcements…
        </div>
      )}
      {loadError && !loading && (
        <div className="mb-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-red-500/10 rounded-md">
          Error loading announcements: {loadError}
        </div>
      )}
      {showCreateForm ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Form */}
          <Card>
            {/* Warning / Explanation Banners to prevent confusion */}
            {formType === 'advisory' && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 flex items-start gap-3">
                <Danger variant="Bold" className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-600 dark:text-red-400">CRITICAL: Creating LGU Advisory</h3>
                  <p className="text-xs text-red-600/80 dark:text-red-300/80 mt-0.5 leading-relaxed">
                    Advisories are for emergency warnings, road closures, severe weather, health alerts, or local crises. Citizens will see this with a red status badge on the mobile app's Advisories quick action.
                  </p>
                </div>
              </div>
            )}
            {formType === 'announcement' && (
              <div className="mb-6 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/50 flex items-start gap-3">
                <Notification variant="Bold" className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-indigo-600 dark:text-indigo-400">Creating LGU Announcement</h3>
                  <p className="text-xs text-indigo-600/80 dark:text-indigo-300/80 mt-0.5 leading-relaxed">
                    Announcements are for municipal programs, community town halls, holiday notices, and job openings. Citizens will see this in their Community tab.
                  </p>
                </div>
              </div>
            )}
            {formType === 'news' && (
              <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/50 flex items-start gap-3">
                <DocumentText variant="Bold" className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-emerald-600 dark:text-emerald-400">Creating Public News Article</h3>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-300/80 mt-0.5 leading-relaxed">
                    News reports are for municipal accomplishments, development updates, and general information. Citizens will see this in their Latest News list.
                  </p>
                </div>
              </div>
            )}

            <h2 className="text-lg font-semibold text-text-primary mb-6">
              {editingAnnouncement ? 'Edit' : 'Create'} {formType === 'advisory' ? 'Advisory' : formType === 'announcement' ? 'Announcement' : 'News'}
            </h2>
            
            <div className="space-y-4">
              {/* Type Switcher Selector inside form */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Change Article Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['news', 'announcement', 'advisory'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormType(type)}
                      className={`py-2 px-3 text-xs font-bold border transition-all uppercase tracking-wider ${
                        formType === type
                          ? type === 'advisory'
                            ? 'bg-red-500 text-white border-red-500 shadow-sm'
                            : type === 'announcement'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-surface border-theme text-text-primary hover:bg-surface-alt'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Title"
                placeholder="Enter announcement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-sm text-text-muted">Content</label>
                <div className="border border-theme rounded-md overflow-hidden bg-surface">
                  {/* Toolbar */}
                  <div className="flex items-center gap-1 p-2 bg-surface-alt border-b border-theme flex-wrap">
                    <button
                      type="button"
                      onClick={() => insertMarkdown('**', '**')}
                      className="px-2.5 py-1 hover:bg-surface border border-theme rounded text-sm font-bold text-text-primary hover:text-accent transition-colors"
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('*', '*')}
                      className="px-2.5 py-1 hover:bg-surface border border-theme rounded text-sm italic text-text-primary hover:text-accent transition-colors"
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('# ')}
                      className="px-2 py-1 hover:bg-surface border border-theme rounded text-xs font-semibold text-text-primary hover:text-accent transition-colors"
                      title="Heading 1"
                    >
                      H1
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('## ')}
                      className="px-2 py-1 hover:bg-surface border border-theme rounded text-xs font-semibold text-text-primary hover:text-accent transition-colors"
                      title="Heading 2"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('- ')}
                      className="px-2 py-1 hover:bg-surface border border-theme rounded text-xs text-text-primary hover:text-accent transition-colors font-medium"
                      title="Bullet List"
                    >
                      List
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('1. ')}
                      className="px-2 py-1 hover:bg-surface border border-theme rounded text-xs text-text-primary hover:text-accent transition-colors font-medium"
                      title="Numbered List"
                    >
                      1. List
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('> ')}
                      className="px-2 py-1 hover:bg-surface border border-theme rounded text-xs text-text-primary hover:text-accent transition-colors font-medium"
                      title="Quote"
                    >
                      Quote
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('\n\n')}
                      className="px-2 py-1 hover:bg-surface border border-theme rounded text-xs text-text-primary hover:text-accent transition-colors font-medium"
                      title="Line Break / Space"
                    >
                      Break
                    </button>
                  </div>
                  <textarea
                    ref={textareaRef}
                    placeholder="Write content here. Markdown syntax is supported (e.g. **bold**, *italic*, # Headings, - Lists). Use the toolbar or write manually."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 bg-surface text-text-primary placeholder-text-faint focus:outline-none resize-none font-sans text-sm leading-relaxed"
                  />
                </div>
              </div>

              {/* Public/Private Toggle Option */}
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="isPublicCheckbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-theme text-primary focus:ring-primary"
                />
                <label htmlFor="isPublicCheckbox" className="text-sm font-medium text-text-primary select-none cursor-pointer">
                  Visible to Citizens (Make Public)
                </label>
              </div>

              {/* Feature on Homepage Toggle Option */}
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="isFeaturedCheckbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-theme text-primary focus:ring-primary"
                />
                <label htmlFor="isFeaturedCheckbox" className="text-sm font-medium text-text-primary select-none cursor-pointer flex items-center gap-1.5">
                  ⭐ Feature on Homepage Carousel
                </label>
              </div>

              {/* Announcement-only duration selection */}
              {(formType === 'announcement' || formType === 'advisory') && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-text-muted">
                    Removal Schedule (Duration)
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-theme rounded-md text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="manual">Manual removal</option>
                    <option value="2">Remove automatically after 2 hours</option>
                    <option value="4">Remove automatically after 4 hours</option>
                    <option value="12">Remove automatically after 12 hours</option>
                    <option value="24">Remove automatically after 24 hours</option>
                  </select>
                </div>
              )}

              {/* Attachments */}
              <div>
                <label className="block text-sm text-text-muted mb-2">Attachments</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-theme rounded-lg p-6 text-center cursor-pointer hover:bg-surface-alt transition-colors"
                >
                  <div className="w-10 h-10 bg-surface-alt rounded-md flex items-center justify-center mx-auto mb-2">
                    <Paperclip variant="Bold" className="w-5 h-5 text-text-muted" />
                  </div>
                  <p className="text-sm text-text-muted">Click to select files</p>
                  <p className="text-xs text-text-faint mt-1">Images and PDFs supported (Max 5MB each)</p>
                </div>
                
                {/* Existing attachments */}
                {editingAnnouncement && existingAttachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs font-semibold text-text-muted">Currently Uploaded Files</label>
                    {existingAttachments.map((file: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-surface-alt px-3 py-2 rounded-md text-sm text-text-primary">
                        <span className="truncate max-w-[80%]">{file.name || 'Attachment'}</span>
                        <button
                          type="button"
                          onClick={() => setExistingAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New attachments queue */}
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs font-semibold text-text-muted">Files to Upload</label>
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-surface-alt px-3 py-2 rounded-md text-sm text-text-primary">
                        <span className="truncate max-w-[80%]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handlePublish}>
                  <Send className="w-4 h-4 mr-1" />
                  Publish Now
                </Button>
                <Button variant="secondary" onClick={openSchedule}>
                  <Clock variant="Bold" className="w-4 h-4 mr-1" />
                  Schedule
                </Button>
                <Button variant="ghost" onClick={handleCancelForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>

          {/* Mobile Preview */}
          <Card>
            <h3 className="text-sm font-medium text-text-muted uppercase tracking-wide mb-4">Mobile Preview</h3>
            
            {/* Phone Mockup */}
            <div className="mx-auto w-[280px] h-[500px] bg-[#1a1a1a] rounded-[32px] p-3">
              <div className="w-full h-full bg-surface rounded-[24px] overflow-hidden flex flex-col">
                {/* Status Bar */}
                <div className="h-6 bg-surface-alt flex items-center justify-center">
                  <div className="w-20 h-1 bg-[#1a1a1a] rounded-full"></div>
                </div>
                
                {/* App Header */}
                <div className="h-12 bg-[#1a1a1a] flex items-center px-4">
                  <span className="text-white font-semibold">AGAPP</span>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="mb-4">
                    <h4 className="font-semibold text-text-primary text-sm mb-2 border-b border-theme pb-1">
                      {title || 'Announcement Title'}
                    </h4>
                    <div className="text-xs text-text-muted mb-2">
                      {renderMarkdown(content || 'Announcement content will appear here...')}
                    </div>
                    <p className="text-xs text-[#2563eb] mt-2">Read more</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {/* View Switcher Tabs */}
          <div className="flex border-b border-theme mb-4 gap-4">
            <button
              onClick={() => setViewMode('list')}
              className={`pb-2 px-1 text-sm font-semibold border-b-2 transition-all ${
                viewMode === 'list'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setViewMode('columns')}
              className={`pb-2 px-1 text-sm font-semibold border-b-2 transition-all ${
                viewMode === 'columns'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              Column Boards
            </button>
            <button
              onClick={() => setViewMode('planner')}
              className={`pb-2 px-1 text-sm font-semibold border-b-2 transition-all ${
                viewMode === 'planner'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              Planner Calendar
            </button>
          </div>

          {viewMode === 'columns' ? (
            <div className="flex gap-4 items-stretch min-h-[600px] overflow-x-auto pb-4">
              {(['news', 'announcement', 'advisory'] as const).map((type) => {
                const items = announcementsList.filter(a => a.type === type);
                const isExpanded = colsExpanded[type];
                const title = type === 'advisory' ? 'Advisories' : type === 'announcement' ? 'Announcements' : 'News';
                const themeColorClass = type === 'advisory' ? 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/50' : type === 'announcement' ? 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50' : 'bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-900/50';
                const cardTintClass = type === 'advisory' ? '!bg-red-50/80 dark:!bg-red-950/30 !border-red-300 dark:!border-red-800' : type === 'announcement' ? '!bg-amber-50/80 dark:!bg-amber-950/30 !border-amber-300 dark:!border-amber-800' : '';

                if (!isExpanded) {
                  return (
                    <div
                      key={type}
                      className="w-14 bg-surface-alt border border-theme rounded-lg py-4 flex flex-col items-center justify-between cursor-pointer hover:bg-surface-alt/80 transition-all select-none"
                      onClick={() => setColsExpanded(prev => ({ ...prev, [type]: true }))}
                    >
                      <button className="text-text-muted hover:text-text-primary text-xs font-bold mb-2">▶</button>
                      <span className="text-text-muted text-xs font-bold tracking-wider uppercase whitespace-nowrap rotate-90 my-auto">
                        {title} ({items.length})
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={type} className="flex-1 min-w-[320px] bg-surface-alt border border-theme rounded-lg p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b border-theme pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${themeColorClass}`}>
                          {title}
                        </span>
                        <span className="text-xs text-text-muted font-bold">({items.length})</span>
                      </div>
                      <button
                        onClick={() => setColsExpanded(prev => ({ ...prev, [type]: false }))}
                        className="text-text-muted hover:text-text-primary text-xs font-bold"
                      >
                        ◀ Collapse
                      </button>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[700px] pr-1">
                      {loading && Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className={cardTintClass} padding="sm">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-4 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                            <div className="flex items-center justify-between pt-2 border-t border-theme/40">
                              <Skeleton className="h-3 w-20" />
                              <Skeleton className="h-3 w-8" />
                            </div>
                          </div>
                        </Card>
                      ))}
                      {!loading && items.map((announcement) => (
                        <Card key={announcement.id} className={cardTintClass} padding="sm">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-semibold text-sm text-text-primary truncate">{announcement.title}</h4>
                              <div className="flex gap-1 shrink-0">
                                <Badge variant={announcement.status === 'published' ? 'success' : announcement.status === 'scheduled' ? 'info' : 'warning'}>
                                  {announcement.status}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-text-muted line-clamp-2">{announcement.content}</p>
                            <div className="flex items-center justify-between text-[11px] text-text-muted mt-2 border-t border-theme/40 pt-2">
                              <span>
                                {announcement.status === 'scheduled' ? 'Sched: ' : 'Posted: '}
                                {announcement.status === 'scheduled' ? announcement.scheduledFor : announcement.publishedAt}
                              </span>
                              <div className="flex gap-1">
                                <button onClick={() => handleEdit(announcement)} className="text-text-muted hover:text-text-primary">
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(announcement.id)} className="text-red-500 hover:text-red-700">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                      {!loading && items.length === 0 && (
                        <div className="text-center py-8 text-xs text-text-muted">
                          No {title.toLowerCase()} posted.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'planner' ? (
            <div className="space-y-4">
              <Card>
                {/* Planner Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-theme pb-4">
                  <div className="flex items-center gap-2 bg-surface-alt p-1 rounded-md border border-theme">
                    <button
                      onClick={() => setPlannerView('week')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        plannerView === 'week' ? 'bg-indigo-600 text-white' : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setPlannerView('month')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        plannerView === 'month' ? 'bg-indigo-600 text-white' : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Month
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => plannerView === 'month' ? changeMonth(-1) : changeWeek(-1)}
                      className="p-1.5 border border-theme rounded-md hover:bg-surface-alt text-sm"
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => setCurrentPlannerDate(new Date())}
                      className="px-3 py-1 border border-theme rounded-md hover:bg-surface-alt text-xs font-semibold"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => plannerView === 'month' ? changeMonth(1) : changeWeek(1)}
                      className="p-1.5 border border-theme rounded-md hover:bg-surface-alt text-sm"
                    >
                      ▶
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-text-primary">
                    {plannerView === 'month' ? (
                      currentPlannerDate.toLocaleString('default', { month: 'long', year: 'numeric' })
                    ) : (
                      `Week of ${currentPlannerDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                    )}
                  </h3>
                </div>

                {/* Grid Header days */}
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-text-muted uppercase border-b border-theme pb-2 mb-2">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>

                {/* Grid Days */}
                <div className="grid grid-cols-7 gap-1">
                  {(plannerView === 'month' ? getDaysInMonthGrid(currentPlannerDate) : getDaysInWeekGrid(currentPlannerDate)).map((cell, idx) => {
                    const dayItems = getAnnouncementsForDate(cell.day, cell.month, cell.year);
                    return (
                      <div
                        key={idx}
                        className={`min-h-[110px] border border-theme rounded-md p-2 flex flex-col justify-between transition-all ${
                          cell.isCurrentMonth ? 'bg-surface' : 'bg-surface-alt/40 opacity-50'
                        }`}
                      >
                        <span className={`text-[11px] font-bold self-start ${
                          cell.isCurrentMonth ? 'text-text-primary' : 'text-text-muted'
                        }`}>
                          {cell.day}
                        </span>

                        <div className="flex-1 overflow-y-auto mt-2 space-y-1.5 max-h-[75px] pr-0.5">
                          {dayItems.map((item) => {
                            const dateStr = item.status === 'scheduled' ? item.scheduledForRaw : item.publishedAtRaw;
                            const timeStr = dateStr ? new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
                            
                            let badgeBg = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50';
                            if (item.type === 'advisory') {
                              badgeBg = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50';
                            } else if (item.type === 'announcement') {
                              badgeBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
                            }

                            return (
                              <div
                                key={item.id}
                                onClick={() => handleEdit(item)}
                                className={`flex items-center justify-between border rounded px-1.5 py-0.5 text-[10px] truncate cursor-pointer hover:opacity-80 transition-all ${badgeBg}`}
                                title={`${item.title} (${item.type})`}
                              >
                                <span className="truncate max-w-[60%] font-semibold">{item.title}</span>
                                <span className="shrink-0 font-bold ml-1">{timeStr}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              {loading && Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex items-center gap-4 pt-1">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3.5 w-24" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-16 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </div>
                </Card>
              ))}
              {!loading && announcementsList.map((announcement) => (
                <Card
                  key={announcement.id}
                  className={
                    announcement.type === 'advisory'
                      ? '!bg-red-50/80 dark:!bg-red-950/30 !border-red-300 dark:!border-red-800'
                      : announcement.type === 'announcement'
                      ? '!bg-amber-50/80 dark:!bg-amber-950/30 !border-amber-300 dark:!border-amber-800'
                      : ''
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-text-primary">{announcement.title}</h3>
                        <Badge 
                          variant={
                            announcement.status === 'published' ? 'success' :
                            announcement.status === 'scheduled' ? 'info' :
                            announcement.status === 'archived' ? 'warning' :
                            'default'
                          }
                        >
                          {announcement.status}
                        </Badge>
                        <Badge 
                          variant={announcement.isPublic ? 'success' : 'default'}
                        >
                          {announcement.isPublic ? 'Public' : 'Private'}
                        </Badge>
                        <Badge variant={announcement.type === 'advisory' ? 'error' : announcement.type === 'announcement' ? 'info' : 'default'}>
                          {announcement.type === 'advisory' ? 'Advisory' : announcement.type === 'announcement' ? 'Announcement' : 'News'}
                        </Badge>
                        {announcement.isFeatured && (
                          <Badge variant="warning">
                            Featured
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-text-muted text-sm mb-3 line-clamp-2">{announcement.content}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-text-muted">
                        {announcement.status === 'published' && (
                          <>
                            <span className="flex items-center gap-1">
                              <Clock variant="Bold" className="w-4 h-4" />
                              Published {announcement.publishedAt}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye variant="Bold" className="w-4 h-4" />
                              {announcement.views} views
                            </span>
                          </>
                        )}
                        {announcement.status === 'scheduled' && (
                          <span className="flex items-center gap-1">
                            <Calendar variant="Bold" className="w-4 h-4" />
                            Scheduled for {announcement.scheduledFor}
                          </span>
                        )}
                        {announcement.attachments > 0 && (
                          <span className="flex items-center gap-1">
                            <Paperclip variant="Bold" className="w-4 h-4" />
                            {announcement.attachments} attachment{announcement.attachments > 1 ? 's' : ''}
                          </span>
                        )}
                        {(announcement.type === 'announcement' || announcement.type === 'advisory') && (
                          <span className="text-xs text-text-muted">
                            · {announcement.durationHours ? `Duration: ${announcement.durationHours}h` : 'Manual removal'}
                            {announcement.expiresAt && ` (Expires: ${announcement.expiresAt})`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-start gap-2 ml-4">
                      {announcement.status === 'published' && (
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={async () => {
                            const { data, error } = await supabase
                              .from('news_announcements')
                              .update({ status: 'archived' })
                              .eq('id', announcement.id)
                              .select('*')
                              .single();
                            if (error) {
                              console.error(error);
                              showToast('Failed to archive news', 'error');
                            } else {
                              setAnnouncementsList(prev => prev.map(a => a.id === announcement.id ? mapAnnouncementRowToItem(data) : a));
                              showToast('News archived successfully', 'success');
                            }
                          }}
                        >
                          Archive
                        </Button>
                      )}
                      {announcement.status === 'archived' && (
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={async () => {
                            const { data, error } = await supabase
                              .from('news_announcements')
                              .update({ status: 'published', published_at: new Date().toISOString() })
                              .eq('id', announcement.id)
                              .select('*')
                              .single();
                            if (error) {
                              console.error(error);
                              showToast('Failed to publish news', 'error');
                            } else {
                              setAnnouncementsList(prev => prev.map(a => a.id === announcement.id ? mapAnnouncementRowToItem(data) : a));
                              showToast('News published successfully', 'success');
                            }
                          }}
                        >
                          Publish
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(announcement)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(announcement.id)}
                      >
                        <Trash variant="Bold" className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {!loading && !loadError && announcementsList.length === 0 && (
                <Card>
                  <div className="text-center py-8">
                    <Book className="w-12 h-12 text-text-muted mx-auto mb-3" />
                    <p className="text-text-muted">No announcements yet</p>
                    <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
                      Create First Announcement
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-surface rounded-lg border border-theme p-5">
            <h3 className="text-lg font-semibold mb-3">Schedule Publication</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-text-muted mb-1">Date</label>
                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full px-3 py-2 bg-surface border border-theme rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Time</label>
                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full px-3 py-2 bg-surface border border-theme rounded-md text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
              <Button onClick={confirmSchedule}>Confirm Schedule</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-surface rounded-lg border border-theme p-5">
            <h3 className="text-base font-semibold mb-2">Delete Announcement</h3>
            <p className="text-sm text-text-muted mb-4">Are you sure you want to delete {pendingDeleteId}?</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={cancelDelete}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
