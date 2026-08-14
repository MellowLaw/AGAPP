'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLgu } from '../../contexts/LguContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { getRelativeTime } from '../../lib/timeAgo';
import { fetchAuthorProfiles, AuthorProfile } from '../../lib/authorProfiles';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  Messages1, 
  Heart, 
  Message, 
  Send, 
  SearchNormal1, 
  Danger, 
  CloseCircle, 
  ShieldSecurity, 
  TickCircle, 
  Clock,
  LoginCurve,
  Edit2
} from 'iconsax-react';

export default function ForumPage() {
  const { activeLgu } = useLgu();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [authorsMap, setAuthorsMap] = useState<Map<string, AuthorProfile>>(new Map());
  const [selectedTag, setSelectedTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newPostModal, setNewPostModal] = useState(false);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTag, setPostTag] = useState('General');
  const [submitting, setSubmitting] = useState(false);

  // Selected post for comment thread
  const [activeThreadPost, setActiveThreadPost] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentAuthorsMap, setCommentAuthorsMap] = useState<Map<string, AuthorProfile>>(new Map());
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Liked posts map
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const tags = [
    { id: 'all', label: 'All Discussions' },
    { id: 'General', label: 'General' },
    { id: 'Questions', label: 'Questions' },
    { id: 'Alerts', label: 'Alerts' },
    { id: 'Suggestions', label: 'Suggestions' },
    { id: 'Events', label: 'Events' },
  ];

  const loadPosts = useCallback(async () => {
    if (!activeLgu?.id) return;
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('lgu_id', activeLgu.id)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setPosts(data);
        const authorIds = data.map((p) => p.citizen_id);
        const profiles = await fetchAuthorProfiles(authorIds);
        setAuthorsMap(profiles);
      } else {
        setPosts([
          {
            id: 'fp-1',
            title: 'Schedule for Barangay Clean-up Drive in Poblacion',
            content: 'Calling all youth volunteers! Clean-up drive this coming Saturday at 7:00 AM. Refreshments will be provided at the barangay covered court.',
            tags: 'Events',
            citizen_name: 'Maria Santos',
            created_at: new Date().toISOString(),
            likes_count: 14,
            comments_count: 5,
          },
          {
            id: 'fp-2',
            title: 'Advisory on Water Interruption this Thursday',
            content: 'Please be informed that maintenance work along Rizal Street will cause temporary low pressure from 1:00 PM to 5:00 PM.',
            tags: 'Alerts',
            citizen_name: 'Municipal Engineering Desk',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            likes_count: 28,
            comments_count: 12,
          },
        ]);
      }

      // Check liked posts for current user
      if (user?.id) {
        const { data: userLikes } = await supabase
          .from('forum_post_likes')
          .select('post_id')
          .eq('user_id', user.id);
        if (userLikes) {
          const map: Record<string, boolean> = {};
          userLikes.forEach((l) => (map[l.post_id] = true));
          setLikedPosts(map);
        }
      }
    } catch (err) {
      console.error('Error loading forum posts:', err);
    }
  }, [activeLgu?.id, user?.id]);

  useEffect(() => {
    loadPosts();

    // Realtime posts subscription
    const channel = supabase
      .channel('realtime-forum-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'forum_posts' },
        () => {
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPosts]);

  const handleOpenNewPost = () => {
    if (!user) {
      setGuestModalOpen(true);
      return;
    }
    if (profile?.moderation_status === 'restricted') {
      showToast('Your posting privileges are temporarily restricted.', 'error');
      return;
    }
    setNewPostModal(true);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setGuestModalOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        lgu_id: activeLgu?.id || 'liliw-laguna',
        citizen_id: user.id,
        citizen_name: profile?.full_name || user.email?.split('@')[0] || 'Resident',
        title: postTitle.trim(),
        content: postContent.trim(),
        tags: postTag,
        is_approved: true,
      };

      const { error } = await supabase.from('forum_posts').insert(payload);
      if (error) throw error;

      setPostTitle('');
      setPostContent('');
      setNewPostModal(false);
      showToast('Discussion topic published successfully!', 'success');
      loadPosts();
    } catch (err: any) {
      console.error('Error creating post:', err);
      showToast(err.message || 'Failed to create discussion topic.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (postId: string, currentLikes: number = 0) => {
    if (!user) {
      setGuestModalOpen(true);
      return;
    }

    const isLiked = !!likedPosts[postId];
    setLikedPosts((prev) => ({ ...prev, [postId]: !isLiked }));

    try {
      if (isLiked) {
        await supabase.from('forum_post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('forum_post_likes').insert({ post_id: postId, user_id: user.id });
      }
    } catch (e) {
      console.warn('Like toggle failed:', e);
    }
  };

  const handleOpenComments = async (post: any) => {
    setActiveThreadPost(post);
    try {
      const { data } = await supabase
        .from('forum_comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      
      const loadedComments = data || [];
      setComments(loadedComments);
      
      const cIds = loadedComments.map((c) => c.citizen_id);
      const cProfiles = await fetchAuthorProfiles(cIds);
      setCommentAuthorsMap(cProfiles);
    } catch (e) {
      console.warn('Error loading comments:', e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setGuestModalOpen(true);
      return;
    }
    if (!commentText.trim() || !activeThreadPost) return;

    setSubmittingComment(true);
    try {
      const payload = {
        post_id: activeThreadPost.id,
        citizen_id: user.id,
        citizen_name: profile?.full_name || user.email?.split('@')[0] || 'Resident',
        content: commentText.trim(),
        is_approved: true,
      };

      const { error } = await supabase.from('forum_comments').insert(payload);
      if (error) throw error;

      setCommentText('');
      showToast('Comment posted successfully!', 'success');
      handleOpenComments(activeThreadPost);
    } catch (err: any) {
      console.error('Error adding comment:', err);
      showToast(err.message || 'Failed to submit comment.', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const filteredPosts = posts.filter((p) => {
    const matchesTag = selectedTag === 'all' || p.tags === selectedTag || p.tag === selectedTag;
    const matchesQuery = !searchQuery.trim() || 
      (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesQuery;
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-28 animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-theme pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-accent shadow-2xs">
            <Messages1 size={18} variant="Bold" />
          </div>
          <div>
            <h1 className="text-sm font-heading text-text-primary">Community Forum</h1>
            <p className="text-[10px] text-text-muted font-['Inter-Medium']">
              {activeLgu?.name || 'Municipality of Liliw'}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNewPost}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent text-accent-contrast text-xs font-['Octarine-Bold'] hover:opacity-90 transition shadow-2xs"
        >
          <Edit2 size={13} variant="Bold" />
          <span>New Topic</span>
        </button>
      </div>

      {/* Search & Categories Bar */}
      <div className="space-y-2">
        <div className="relative">
          <SearchNormal1 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search community discussions, events, questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-surface dark:bg-card border border-theme text-xs text-text-primary placeholder:text-text-muted font-['Inter-Medium'] shadow-xs focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {tags.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTag(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-['Octarine-Bold'] whitespace-nowrap transition shadow-2xs ${
                selectedTag === t.id
                  ? 'bg-accent text-accent-contrast'
                  : 'bg-surface dark:bg-card border border-theme text-text-muted hover:bg-surface-alt dark:hover:bg-chip'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Discussions Feed */}
      <div className="space-y-3 pt-1">
        {filteredPosts.length === 0 ? (
          <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-10 text-center space-y-2">
            <Messages1 size={32} className="text-text-muted mx-auto" />
            <p className="text-xs text-text-muted font-['Inter-Medium']">
              No discussions found matching "{searchQuery}".
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isLiked = !!likedPosts[post.id];
            const author = authorsMap.get(post.citizen_id);
            const authorName = author?.name || post.citizen_name || 'Verified Resident';
            const avatarUrl = author?.avatar_url;

            return (
              <div
                key={post.id}
                className="p-5 rounded-[28px] bg-surface dark:bg-card border border-theme shadow-xs space-y-3 hover:border-accent transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={authorName}
                        className="w-8 h-8 rounded-full object-cover border border-theme"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-['Octarine-Bold'] text-xs flex items-center justify-center">
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="font-['Octarine-Bold'] text-text-primary block text-xs">
                        {authorName}
                      </span>
                      <span className="text-[10px] text-text-muted font-['Inter-Medium']">
                        {getRelativeTime(post.created_at)}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={post.tags || post.tag || 'General'} />
                </div>

                <h2 className="text-sm font-['Octarine-Bold'] text-text-primary leading-snug">
                  {post.title}
                </h2>
                <p className="text-xs text-text-muted font-['Inter-Medium'] leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                <div className="pt-2 border-t border-theme flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleToggleLike(post.id, post.likes_count || 0)}
                    className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-full transition ${
                      isLiked ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 font-heading' : 'text-text-muted hover:text-red-500'
                    }`}
                  >
                    <Heart size={16} variant={isLiked ? 'Bold' : 'Outline'} />
                    <span className="font-['Inter-Medium'] text-xs">{post.likes_count || (isLiked ? 1 : 0)} Likes</span>
                  </button>

                  <button
                    onClick={() => handleOpenComments(post)}
                    className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary py-1 px-3 rounded-full hover:bg-surface-alt dark:hover:bg-chip transition font-['Inter-Medium']"
                  >
                    <Message size={16} />
                    <span>Comments</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Guest Sign-In Prompt Modal */}
      {guestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface dark:bg-card rounded-[32px] border border-theme p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 mx-auto flex items-center justify-center">
              <LoginCurve size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-['Octarine-Bold'] text-text-primary">Sign In to Participate</h3>
              <p className="text-xs text-text-muted font-['Inter-Medium'] leading-relaxed">
                To create discussions, like community posts, and write replies, please sign in with your citizen account.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setGuestModalOpen(false)}
                className="flex-1 py-2.5 rounded-full bg-surface-alt dark:bg-chip border border-theme text-text-muted font-['Octarine-Bold'] text-xs"
              >
                Cancel
              </button>
              <Link
                href="/auth/login"
                className="flex-1 py-2.5 rounded-full bg-accent text-accent-contrast font-['Octarine-Bold'] text-xs hover:opacity-90 transition shadow-xs"
              >
                Sign In →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Create New Topic Modal */}
      {newPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface dark:bg-card rounded-[32px] border border-theme p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="text-base font-['Octarine-Bold'] text-text-primary">Create Discussion Topic</h3>
              <button onClick={() => setNewPostModal(false)} className="text-text-muted hover:text-text-primary">
                <CloseCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3.5 text-xs font-['Inter-Medium']">
              <div className="space-y-1">
                <label className="block font-['Octarine-Bold'] text-text-primary">Topic Category</label>
                <select
                  value={postTag}
                  onChange={(e) => setPostTag(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {tags.filter((t) => t.id !== 'all').map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-['Octarine-Bold'] text-text-primary">Title</label>
                <input
                  type="text"
                  required
                  placeholder="Clear headline for your question or suggestion..."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-['Octarine-Bold'] text-text-primary">Details & Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share details, context, or feedback for fellow residents..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewPostModal(false)}
                  className="px-4 py-2.5 rounded-full bg-surface-alt dark:bg-chip text-text-muted font-['Octarine-Bold'] hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-full bg-accent text-accent-contrast font-['Octarine-Bold'] hover:opacity-90 transition disabled:opacity-50 shadow-xs"
                >
                  {submitting ? 'Publishing...' : 'Publish Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comment Thread Drawer */}
      {activeThreadPost && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
          <div className="bg-surface dark:bg-card rounded-t-[32px] sm:rounded-[32px] border border-theme p-6 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <div>
                <h3 className="text-base font-['Octarine-Bold'] text-text-primary">Discussion Thread</h3>
                <p className="text-[11px] text-text-muted font-['Inter-Medium'] truncate max-w-xs">{activeThreadPost.title}</p>
              </div>
              <button
                onClick={() => setActiveThreadPost(null)}
                className="text-text-muted hover:text-text-primary"
              >
                <CloseCircle size={20} />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {comments.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-muted font-['Inter-Medium']">
                  No replies yet. Be the first to join the discussion!
                </div>
              ) : (
                comments.map((c) => {
                  const author = commentAuthorsMap.get(c.citizen_id);
                  const authorName = author?.name || c.citizen_name || 'Resident';
                  const avatarUrl = author?.avatar_url;

                  return (
                    <div key={c.id} className="p-3.5 rounded-2xl bg-surface-alt dark:bg-chip border border-theme space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={authorName}
                              className="w-6 h-6 rounded-full object-cover border border-theme"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-['Octarine-Bold'] text-[10px] flex items-center justify-center">
                              {authorName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-['Octarine-Bold'] text-text-primary">{authorName}</span>
                        </div>
                        <span className="text-[10px] text-text-muted font-['Inter-Medium']">{getRelativeTime(c.created_at)}</span>
                      </div>
                      <p className="text-xs text-text-muted font-['Inter-Medium'] leading-relaxed pl-8">
                        {c.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="pt-3 border-t border-theme flex items-center gap-2">
              <input
                type="text"
                placeholder={user ? "Write a respectful reply..." : "Sign in to write a reply..."}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={!user || submittingComment}
                className="flex-1 px-4 py-2.5 rounded-full bg-surface-alt dark:bg-chip border border-theme text-xs text-text-primary placeholder:text-text-muted font-['Inter-Medium'] focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!user || !commentText.trim() || submittingComment}
                className="w-9 h-9 rounded-full bg-accent text-accent-contrast flex items-center justify-center hover:opacity-90 transition disabled:opacity-40 shadow-xs"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
