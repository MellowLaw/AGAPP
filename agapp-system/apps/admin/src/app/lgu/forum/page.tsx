'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { ForumStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { 
  ChatCircle,
  User,
  Clock,
  Check,
  X,
  Pencil,
  MagnifyingGlass,
  ChatDots
} from '@phosphor-icons/react';

export default function ForumPage() {
  const [postsList, setPostsList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'flagged' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const { showToast, ToastContainer } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const params = useSearchParams();

  const lguNameParam = params?.get('lguName') || 'Liliw, Laguna';
  const lguId = React.useMemo(
    () => lguNameParam.toLowerCase().replace(/,/g, '').replace(/\s+/g, '-'),
    [lguNameParam]
  );

  const fetchPosts = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('lgu_id', lguId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((p: any) => {
        let status = 'approved';
        if (!p.is_approved) {
          status = (p.flagged_keywords && p.flagged_keywords.length > 0) ? 'flagged' : 'pending';
        }
        return {
          id: p.id,
          author: p.citizen_name || 'Citizen',
          avatar: null,
          content: p.content,
          category: 'General',
          comments: 0,
          status,
          time: new Date(p.created_at).toLocaleString(),
          flaggedReason: p.flagged_keywords && p.flagged_keywords.length > 0
            ? `Flagged words: ${p.flagged_keywords.join(', ')}`
            : null
        };
      });
      setPostsList(mapped);
    } catch (err: any) {
      console.error('Failed to load forum posts:', err);
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lguId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filteredPosts = postsList.filter(post => {
    const matchesTab = activeTab === 'all' || post.status === activeTab;
    const matchesSearch = post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleEdit = (post: any) => {
    setEditingPost(post.id);
    setEditContent(post.content);
  };

  const handleSaveEdit = async () => {
    const prev = postsList;
    setPostsList(prev.map(p => p.id === editingPost ? { ...p, content: editContent } : p));
    const { error } = await supabase
      .from('forum_posts')
      .update({ content: editContent })
      .eq('id', editingPost);
    if (error) {
      console.error('Failed to save post edit:', error);
      setPostsList(prev);
      showToast('Failed to edit post. Please try again.', 'error');
    } else {
      setEditingPost(null);
      showToast('Post updated successfully!', 'success');
      fetchPosts();
    }
  };

  const handleApprove = async (postId: string) => {
    const prev = postsList;
    setPostsList(prev.map(p => p.id === postId ? { ...p, status: 'approved' } : p));
    const { error } = await supabase
      .from('forum_posts')
      .update({ is_approved: true, flagged_keywords: [] })
      .eq('id', postId);
    if (error) {
      console.error('Failed to approve post:', error);
      setPostsList(prev);
      showToast('Failed to approve post. Please try again.', 'error');
    } else {
      showToast(`Post approved!`, 'success');
      fetchPosts();
    }
  };

  const handleReject = async (postId: string) => {
    const prev = postsList;
    setPostsList(prev.filter(p => p.id !== postId));
    const { error } = await supabase
      .from('forum_posts')
      .delete()
      .eq('id', postId);
    if (error) {
      console.error('Failed to reject/delete post:', error);
      setPostsList(prev);
      showToast('Failed to delete post. Please try again.', 'error');
    } else {
      showToast(`Post deleted!`, 'info');
      fetchPosts();
    }
  };

  return (
    <DashboardLayout 
      role="lgu-admin" 
      title="Forum Moderation"
    >
      <ToastContainer />
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'pending' 
              ? 'bg-[#1a1a1a] text-white' 
              : 'bg-white border border-[#e5e5e5] text-[#737373] hover:bg-[#f5f5f5]'
          }`}
        >
          Pending ({postsList.filter(p => p.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('flagged')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'flagged' 
              ? 'bg-[#dc2626] text-white' 
              : 'bg-white border border-[#e5e5e5] text-[#737373] hover:bg-[#f5f5f5]'
          }`}
        >
          Flagged ({postsList.filter(p => p.status === 'flagged').length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'all' 
              ? 'bg-[#1a1a1a] text-white' 
              : 'bg-white border border-[#e5e5e5] text-[#737373] hover:bg-[#f5f5f5]'
          }`}
        >
          All Posts
        </button>
      </div>

      {/* Search */}
      <Card padding="sm" className="mb-6">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
          <input
            type="text"
            placeholder="Search posts by author or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:border-[#2563eb]"
          />
        </div>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f5f5f5] rounded-full flex items-center justify-center">
                  {post.avatar ? (
                    <img src={post.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-[#737373]" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-[#1a1a1a]">{post.author}</p>
                  <div className="flex items-center gap-2 text-sm text-[#737373]">
                    <Clock className="w-3 h-3" />
                    {post.time}
                  </div>
                </div>
              </div>
              <ForumStatusBadge status={post.status as any} />
            </div>

            {/* Content */}
            <div className="mb-4">
              {editingPost === post.id ? (
                <div className="space-y-3">
                  <TextArea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingPost(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="text-[#1a1a1a] leading-relaxed">{post.content}</p>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-[#737373] mb-4">
              <span>Category: {post.category}</span>
              <span className="flex items-center gap-1">
                <ChatDots className="w-4 h-4" />
                {post.comments} comments
              </span>
            </div>

            {/* Flagged Reason */}
            {post.flaggedReason && (
              <div className="p-3 bg-[#fee2e2] rounded-md mb-4">
                <p className="text-sm text-[#dc2626]">
                  Reason: {post.flaggedReason}
                </p>
              </div>
            )}

            {/* Actions */}
            {post.status !== 'approved' && editingPost !== post.id && (
              <div className="flex gap-3 pt-4 border-t border-[#e5e5e5]">
                <Button variant="primary" onClick={() => handleApprove(post.id)}>
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button variant="secondary" onClick={() => handleEdit(post)}>
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="danger" onClick={() => handleReject(post.id)}>
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </Card>
        ))}

        {filteredPosts.length === 0 && (
          <Card>
            <div className="text-center py-8 text-[#737373]">
              <ChatCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No posts found matching your criteria</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
