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
import { lguIdFromName } from '@/lib/lgu';
import {
  ChatCircle,
  User,
  Clock,
  Check,
  X,
  Pencil,
  MagnifyingGlass,
  ChatDots,
  CaretDown,
  CaretUp
} from '@phosphor-icons/react';

export default function ForumPage() {
  const [postsList, setPostsList] = useState<any[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, any[]>>({});
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'flagged' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const { showToast, ToastContainer } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const params = useSearchParams();

  const lguNameParam = params?.get('lguName') || 'Liliw, Laguna';
  const lguId = React.useMemo(() => lguIdFromName(lguNameParam), [lguNameParam]);

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

      const postIds = (data || []).map((p: any) => p.id);
      let commentCounts: Record<string, number> = {};
      let commentsMap: Record<string, any[]> = {};

      if (postIds.length > 0) {
        // forum_comments has no lgu_id column (RLS scopes it via a join to
        // forum_posts.lgu_id instead) — fetch by post_id list.
        const { data: comments, error: commentsError } = await supabase
          .from('forum_comments')
          .select('*')
          .in('post_id', postIds)
          .order('created_at', { ascending: true });

        if (commentsError) throw commentsError;

        for (const c of comments || []) {
          commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
          (commentsMap[c.post_id] = commentsMap[c.post_id] || []).push(c);
        }
      }

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
          comments: commentCounts[p.id] || 0,
          status,
          time: new Date(p.created_at).toLocaleString(),
          flaggedReason: p.flagged_keywords && p.flagged_keywords.length > 0
            ? `Flagged words: ${p.flagged_keywords.join(', ')}`
            : null
        };
      });
      setPostsList(mapped);
      setCommentsByPost(commentsMap);
    } catch (err: any) {
      console.error('Failed to load forum posts:', err);
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lguId]);

  const handleApproveComment = async (commentId: string, postId: string) => {
    const { error } = await supabase
      .from('forum_comments')
      .update({ is_approved: true, flagged_keywords: [] })
      .eq('id', commentId);
    if (error) {
      showToast('Failed to approve comment. Please try again.', 'error');
      return;
    }
    setCommentsByPost(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).map(c => c.id === commentId ? { ...c, is_approved: true, flagged_keywords: [] } : c),
    }));
    showToast('Comment approved.', 'success');
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    const { error } = await supabase.from('forum_comments').delete().eq('id', commentId);
    if (error) {
      showToast('Failed to delete comment. Please try again.', 'error');
      return;
    }
    setCommentsByPost(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).filter(c => c.id !== commentId),
    }));
    setPostsList(prev => prev.map(p => p.id === postId ? { ...p, comments: Math.max(0, p.comments - 1) } : p));
    showToast('Comment deleted.', 'info');
  };

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
              ? 'bg-text-primary text-bg' 
              : 'bg-surface border border-theme text-text-muted hover:bg-surface-alt'
          }`}
        >
          Pending ({postsList.filter(p => p.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('flagged')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'flagged' 
              ? 'bg-red-600 text-white'
              : 'bg-surface border border-theme text-text-muted hover:bg-surface-alt'
          }`}
        >
          Flagged ({postsList.filter(p => p.status === 'flagged').length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'all' 
              ? 'bg-text-primary text-bg' 
              : 'bg-surface border border-theme text-text-muted hover:bg-surface-alt'
          }`}
        >
          All Posts
        </button>
      </div>

      {/* Search */}
      <Card padding="sm" className="mb-6">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search posts by author or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-theme rounded-md text-sm focus:outline-none focus:border-accent"
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
                <div className="w-10 h-10 bg-surface-alt rounded-full flex items-center justify-center">
                  {post.avatar ? (
                    <img src={post.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-text-muted" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-text-primary">{post.author}</p>
                  <div className="flex items-center gap-2 text-sm text-text-muted">
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
                <p className="text-text-primary leading-relaxed">{post.content}</p>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-text-muted mb-4">
              <span>Category: {post.category}</span>
              <button
                className="flex items-center gap-1 hover:text-text-primary transition-colors"
                onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
              >
                <ChatDots className="w-4 h-4" />
                {post.comments} comment{post.comments === 1 ? '' : 's'}
                {post.comments > 0 && (expandedPost === post.id ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />)}
              </button>
            </div>

            {/* Flagged Reason */}
            {post.flaggedReason && (
              <div className="p-3 bg-red-500/10 rounded-md mb-4">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Reason: {post.flaggedReason}
                </p>
              </div>
            )}

            {/* Comment Thread */}
            {expandedPost === post.id && (
              <div className="space-y-3 mb-4 pl-4 border-l-2 border-theme">
                {(commentsByPost[post.id] || []).length === 0 ? (
                  <p className="text-sm text-text-faint italic">No comments yet.</p>
                ) : (
                  (commentsByPost[post.id] || []).map((c: any) => (
                    <div key={c.id} className="bg-surface-alt rounded-md p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-text-muted" />
                          <span className="text-sm font-medium text-text-primary">{c.citizen_name || 'Citizen'}</span>
                          <span className="text-xs text-text-faint">{new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        {!c.is_approved && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-medium">
                            {c.flagged_keywords?.length > 0 ? 'Flagged' : 'Pending'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-primary">{c.content}</p>
                      {c.flagged_keywords?.length > 0 && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Flagged words: {c.flagged_keywords.join(', ')}</p>
                      )}
                      {!c.is_approved && (
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={() => handleApproveComment(c.id, post.id)}>
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDeleteComment(c.id, post.id)}>
                            <X className="w-3.5 h-3.5 mr-1" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Actions */}
            {post.status !== 'approved' && editingPost !== post.id && (
              <div className="flex gap-3 pt-4 border-t border-theme">
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
            <div className="text-center py-8 text-text-muted">
              <ChatCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No posts found matching your criteria</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
