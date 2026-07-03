'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { 
  Newspaper,
  Plus,
  Calendar,
  Clock,
  Paperclip,
  Eye,
  Trash,
  Pencil,
  PaperPlane,
  Image as ImageIcon,
  FilePdf,
  X
} from '@phosphor-icons/react';

type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'archived';

interface AnnouncementItem {
  id: string; // underlying news_announcements.id
  title: string;
  content: string;
  status: AnnouncementStatus;
  publishedAt?: string;
  scheduledFor?: string;
  publishedAtRaw?: string | null;
  scheduledForRaw?: string | null;
  views: number;
  attachments: number; // count
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
    publishedAt: row.published_at ? new Date(row.published_at).toLocaleString() : undefined,
    scheduledFor: row.scheduled_for ? new Date(row.scheduled_for).toLocaleString() : undefined,
    publishedAtRaw: row.published_at ?? null,
    scheduledForRaw: row.scheduled_for ?? null,
    views: row.views ?? 0,
    attachments: Array.isArray(row.attachments) ? row.attachments.length : 0,
  };
};

export default function NewsPage() {
  const [announcementsList, setAnnouncementsList] = useState<AnnouncementItem[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
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
  const lguId = lguNameParam.toLowerCase().replace(/,/g, '').replace(/\s+/g, '-');

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

    if (editingAnnouncement) {
      const { data, error } = await supabase
        .from('news_announcements')
        .update({
          title,
          content,
          status: 'published',
          published_at: now.toISOString(),
          scheduled_for: null,
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
          published_at: now.toISOString(),
          scheduled_for: null,
          attachments: [],
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

    showToast('Announcement published successfully!', 'success');
    setShowCreateForm(false);
    setTitle('');
    setContent('');
    setAttachments([]);
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

    if (editingAnnouncement) {
      const { data, error } = await supabase
        .from('news_announcements')
        .update({
          title,
          content,
          status: 'scheduled',
          scheduled_for: when.toISOString(),
          published_at: null,
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
          scheduled_for: when.toISOString(),
          published_at: null,
          attachments: [],
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
    showToast('Announcement scheduled successfully!', 'success');
    setShowCreateForm(false);
    setTitle('');
    setContent('');
    setAttachments([]);
    setScheduleDate('');
    setScheduleTime('');
    setEditingAnnouncement(null);
  };

  const handleEdit = (announcement: AnnouncementItem) => {
    setEditingAnnouncement(announcement);
    setShowCreateForm(true);
    setTitle(announcement.title);
    setContent(announcement.content);
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
    setAttachments([]);
    setScheduleDate('');
    setScheduleTime('');
    setEditingAnnouncement(null);
  };

  return (
    <DashboardLayout 
      role="lgu-admin" 
      title="News and Announcements"
      action={
        <Button onClick={() => { setShowCreateForm(true); setEditingAnnouncement(null); }}>
          <Plus className="w-4 h-4 mr-1" />
          Create New
        </Button>
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
            <h2 className="text-lg font-semibold text-text-primary mb-6">Create Announcement</h2>
            
            <div className="space-y-4">
              <Input
                label="Title"
                placeholder="Enter announcement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <TextArea
                label="Content"
                placeholder="Write your announcement here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
              />

              {/* Attachments */}
              <div>
                <label className="block text-sm text-text-muted mb-2">Attachments</label>
                <div className="border border-dashed border-theme rounded-lg p-6 text-center">
                  <div className="w-10 h-10 bg-surface-alt rounded-md flex items-center justify-center mx-auto mb-2">
                    <Paperclip className="w-5 h-5 text-text-muted" />
                  </div>
                  <p className="text-sm text-text-muted">Drop files here or click to upload</p>
                  <p className="text-xs text-text-faint mt-1">Images and PDFs supported</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handlePublish}>
                  <PaperPlane className="w-4 h-4 mr-1" />
                  Publish Now
                </Button>
                <Button variant="secondary" onClick={openSchedule}>
                  <Clock className="w-4 h-4 mr-1" />
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
                    <h4 className="font-semibold text-text-primary text-sm mb-2">
                      {title || 'Announcement Title'}
                    </h4>
                    <p className="text-xs text-text-muted mb-2">
                      {content || 'Announcement content will appear here...'}
                    </p>
                    <p className="text-xs text-[#2563eb]">Read more</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {announcementsList.map((announcement) => (
            <Card key={announcement.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-text-primary">{announcement.title}</h3>
                    <Badge 
                      variant={
                        announcement.status === 'published' ? 'success' :
                        announcement.status === 'scheduled' ? 'info' :
                        'default'
                      }
                    >
                      {announcement.status}
                    </Badge>
                  </div>
                  
                  <p className="text-text-muted text-sm mb-3 line-clamp-2">{announcement.content}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    {announcement.status === 'published' && (
                      <>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Published {announcement.publishedAt}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {announcement.views} views
                        </span>
                      </>
                    )}
                    {announcement.status === 'scheduled' && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Scheduled for {announcement.scheduledFor}
                      </span>
                    )}
                    {announcement.attachments > 0 && (
                      <span className="flex items-center gap-1">
                        <Paperclip className="w-4 h-4" />
                        {announcement.attachments} attachment{announcement.attachments > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-start gap-2 ml-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEdit(announcement)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(announcement.id)}
                  >
                    <Trash className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {!loading && !loadError && announcementsList.length === 0 && (
            <Card>
              <div className="text-center py-8">
                <Newspaper className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">No announcements yet</p>
                <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
                  Create First Announcement
                </Button>
              </div>
            </Card>
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
