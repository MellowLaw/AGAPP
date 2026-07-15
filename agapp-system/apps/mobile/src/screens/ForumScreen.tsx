import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Image, KeyboardAvoidingView, Platform, PanResponder, Animated, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';
import { isVerified } from '../utils/verification';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { globalStyles, PASTELS } from '../theme';
import { useToast } from '../components/Toast';
import { ScreenBackground } from '../components/ScreenBackground';
import * as Clipboard from 'expo-clipboard';
import {
  SearchNormal1,
  Add,
  Send2,
  ArrowLeft2,
  Link,
  MessageText1,
  Edit2,
  CloseSquare,
  InfoCircle,
  ShieldTick,
  EmojiHappy,
  Bookmark,
  Bookmark2,
  Danger,
  MessageQuestion,
  Calendar,
  More,
  TickCircle,
  Heart,
} from 'iconsax-react-native';

type ViewState = 'list' | 'detail' | 'create';

const AVAILABLE_TAGS = ['General', 'Questions', 'Alerts', 'Suggestions', 'Events'];

const TAG_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  'General': { bg: '#E2EBE0', text: '#3E5434', darkBg: '#3E5434', darkText: '#E2EBE0' },     // Sage
  'Questions': { bg: '#DEE7EC', text: '#213E4F', darkBg: '#213E4F', darkText: '#DEE7EC' },   // Blue
  'Alerts': { bg: '#FADEE1', text: '#7E2532', darkBg: '#7E2532', darkText: '#FADEE1' },      // Pink
  'Suggestions': { bg: '#F5EBD6', text: '#644F1D', darkBg: '#644F1D', darkText: '#F5EBD6' }, // Cream
  'Events': { bg: '#EADFEA', text: '#4D3666', darkBg: '#4D3666', darkText: '#EADFEA' },      // Lilac
};

const PRESET_IMAGES = [
  { name: 'Town Plaza', url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&auto=format&fit=crop&q=60' },
  { name: 'Community Path', url: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=500&auto=format&fit=crop&q=60' },
  { name: 'Municipal Hall', url: 'https://images.unsplash.com/photo-1541829011-85b82d9467ee?w=500&auto=format&fit=crop&q=60' },
  { name: 'Barangay Clean', url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500&auto=format&fit=crop&q=60' }
];

export function ForumScreen({ navigation }: any) {
  const { T, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const { profile, selectedLgu, guestLgu, session } = useAuth();
  
  // ── Swipeable Row component (swipe right → reply) ──────────────────────
  const SwipeableRow = useCallback(({ children, onSwipe }: { children: React.ReactNode; onSwipe: () => void }) => {
    const translateX = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dx > 8 && Math.abs(g.dy) < Math.abs(g.dx),
        onPanResponderMove: (_, g) => {
          if (g.dx > 0) translateX.setValue(Math.min(g.dx, 80));
        },
        onPanResponderRelease: (_, g) => {
          if (g.dx > 40) {
            onSwipe();
          }
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 200,
            friction: 20,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 200, friction: 20 }).start();
        },
      })
    ).current;

    return (
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    );
  }, []);
  
  // Navigation & View State
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  
  // Data State
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'foryou' | 'bookmarks'>('foryou');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);

  // Form State (New Post / Thread)
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string | null>(null);

  // Form State (New Comment)
  const [newComment, setNewComment] = useState('');
  const [replyTarget, setReplyTarget] = useState<any | null>(null);
  const [showPresetsInChat, setShowPresetsInChat] = useState(false);
  const verified = isVerified(profile);
  
  const commentScrollViewRef = useRef<ScrollView>(null);

  // Load bookmarks & likes
  useEffect(() => {
    const loadBookmarksAndLikes = async () => {
      try {
        const stored = await AsyncStorage.getItem('bookmarked_posts');
        if (stored) {
          setBookmarkedIds(JSON.parse(stored));
        }
        const storedLikes = await AsyncStorage.getItem('liked_posts');
        if (storedLikes) {
          setLikedPostIds(JSON.parse(storedLikes));
        }
      } catch (err) {
        console.warn('Failed to load bookmarks or likes', err);
      }
    };
    loadBookmarksAndLikes();
  }, []);

  // 1. Fetch Posts subscription
  useEffect(() => {
    const lgu = selectedLgu || guestLgu;
    if (!lgu) return;
    fetchPosts();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedFetchPosts = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchPosts();
      }, 1500);
    };

    const postsSubscription = supabase
      .channel('public:forum_posts_global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts', filter: `lgu_id=eq.${lgu.id}` }, () => {
        debouncedFetchPosts();
      })
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(postsSubscription);
    };
  }, [selectedLgu, guestLgu, profile]);

  // 2. Fetch Comments subscription (only active when inside detail view)
  useEffect(() => {
    if (viewState !== 'detail' || !selectedPost) return;
    
    fetchPostComments(selectedPost.id);

    const commentsSubscription = supabase
      .channel(`public:forum_comments_post:${selectedPost.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_comments', filter: `post_id=eq.${selectedPost.id}` }, () => {
        fetchPostComments(selectedPost.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(commentsSubscription);
    };
  }, [viewState, selectedPost?.id]);

  const fetchPosts = async () => {
    const lgu = selectedLgu || guestLgu;
    if (!lgu) return;
    try {
      let query = supabase
        .from('forum_posts')
        .select('*, citizen:users!citizen_id(avatar_url), forum_comments(id, is_approved)')
        .eq('lgu_id', lgu.id);

      if (profile) {
        query = query.or(`is_approved.eq.true,citizen_id.eq.${profile.id}`);
      } else {
        query = query.eq('is_approved', true);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      if (data) {
        const mapped = data.map((p: any) => {
          const approvedComments = (p.forum_comments || []).filter((c: any) => c.is_approved);
          return {
            ...p,
            commentsCount: approvedComments.length
          };
        });
        setPosts(mapped);
      }
    } catch (err: any) {
      console.error('Failed to fetch posts:', err.message);
    }
  };

  const fetchPostComments = async (postId: string) => {
    setCommentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('forum_comments')
        .select('*, citizen:users!citizen_id(avatar_url)')
        .eq('post_id', postId)
        .or(`is_approved.eq.true,citizen_id.eq.${profile?.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
      
      // Auto scroll comments to end
      setTimeout(() => {
        commentScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      console.error('Failed to fetch comments:', err.message);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim() || !profile || !selectedLgu) return;
    setLoading(true);

    const titleText = newTitle.trim();
    const contentText = newContent.trim();
    
    // Auto-moderation profanity checker fallback
    const profanities = ['putang ina', 'gago', 'tarantado', 'pota', 'ulol', 'shet'];
    const flaggedTitle = profanities.filter(word => titleText.toLowerCase().includes(word));
    const flaggedContent = profanities.filter(word => contentText.toLowerCase().includes(word));
    const mergedFlagged = Array.from(new Set([...flaggedTitle, ...flaggedContent]));
    const isApproved = mergedFlagged.length === 0;

    try {
      const { error } = await supabase.from('forum_posts').insert({
        lgu_id: selectedLgu.id,
        citizen_id: profile.id,
        citizen_name: profile.name,
        title: titleText,
        content: contentText,
        tags: newTags,
        photo_url: newPhotoUrl,
        is_approved: isApproved,
        flagged_keywords: mergedFlagged
      });

      if (error) throw error;
      
      setNewTitle('');
      setNewContent('');
      setNewTags([]);
      setNewPhotoUrl(null);
      setViewState('list');
      
      if (isApproved) {
        showToast('Your new topic was posted to the community forum.', 'success');
        fetchPosts();
      } else {
        showToast(
          'Flagged for Moderation: your post contains sensitive or inappropriate words and was flagged. LGU admins will review it soon.',
          'info'
        );
      }
    } catch (err: any) {
      showToast(`Create thread failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async (customText?: string) => {
    const textToSend = customText ?? newComment;
    if (!textToSend.trim() || !profile || !selectedPost) return;
    if (!verified) {
      showToast('Please verify your identity before replying in the forum.', 'error');
      return;
    }
    const contentText = textToSend.trim();

    const profanities = ['putang ina', 'gago', 'tarantado', 'pota', 'ulol', 'shet'];
    const flagged = profanities.filter(word => contentText.toLowerCase().includes(word));
    const isApproved = flagged.length === 0;

    try {
      const { error } = await supabase.from('forum_comments').insert({
        post_id: selectedPost.id,
        parent_comment_id: replyTarget?.id || null,
        citizen_id: profile.id,
        citizen_name: profile.name,
        content: contentText,
        is_approved: isApproved,
        flagged_keywords: flagged
      });

      if (error) throw error;
      setNewComment('');
      setReplyTarget(null);
      setShowPresetsInChat(false);
      
      if (isApproved) {
        fetchPostComments(selectedPost.id);
        setSelectedPost((prev: any) => prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : null);
      } else {
        showToast(
          'Comment Flagged: your comment contains inappropriate words and has been submitted to LGU moderators for approval.',
          'info'
        );
      }
    } catch (err: any) {
      showToast(`Comment failed: ${err.message}`, 'error');
    }
  };

  const toggleTagSelection = (tag: string) => {
    if (newTags.includes(tag)) {
      setNewTags(prev => prev.filter(t => t !== tag));
    } else {
      setNewTags(prev => [...prev, tag]);
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now.getTime() - then.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHr > 0) return `${diffHr}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return 'Just now';
  };

  const getAvatarBg = (name: string) => {
    const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [PASTELS.sage, PASTELS.blue, PASTELS.pink, PASTELS.cream, PASTELS.lilac, PASTELS.butter];
    return colors[sum % colors.length];
  };

  const getTagColors = (tag: string) => {
    const rawColors = TAG_COLORS[tag];
    if (!rawColors) {
      return { bg: T.cardAlt, text: T.textMuted };
    }
    return {
      bg: isDarkMode ? rawColors.darkBg : rawColors.bg,
      text: isDarkMode ? rawColors.darkText : rawColors.text,
    };
  };

  const toggleBookmark = async (postId: string) => {
    try {
      let updated: string[];
      if (bookmarkedIds.includes(postId)) {
        updated = bookmarkedIds.filter(id => id !== postId);
        showToast('Removed from Bookmarks', 'success');
      } else {
        updated = [...bookmarkedIds, postId];
        showToast('Saved to Bookmarks', 'success');
      }
      setBookmarkedIds(updated);
      await AsyncStorage.setItem('bookmarked_posts', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save bookmark', err);
    }
  };

  const toggleLike = async (postId: string) => {
    try {
      let updated: string[];
      if (likedPostIds.includes(postId)) {
        updated = likedPostIds.filter(id => id !== postId);
        showToast('Removed like', 'success');
      } else {
        updated = [...likedPostIds, postId];
        showToast('Liked post', 'success');
      }
      setLikedPostIds(updated);
      await AsyncStorage.setItem('liked_posts', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save like', err);
    }
  };

  const getLikeCount = (post: any) => {
    const sum = post.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const base = (sum % 15) + 3;
    return likedPostIds.includes(post.id) ? base + 1 : base;
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      (post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.citizen_name.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesTag = 
      selectedFilter === 'All' || 
      (post.tags && post.tags.includes(selectedFilter));

    const matchesTab = 
      activeTab === 'foryou' || 
      bookmarkedIds.includes(post.id);

    return matchesSearch && matchesTag && matchesTab;
  });

  // ──────── LAYOUT RENDERING ────────

  if (viewState === 'create') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
        <Image
          source={isDarkMode ? require('../../assets/brand/bg-map-2.png') : require('../../assets/brand/bg-map-1.png')}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            opacity: isDarkMode ? 0.04 : 0.07,
            tintColor: T.accent,
          }}
          resizeMode="cover"
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: T.border }}>
              <TouchableOpacity onPress={() => setViewState('list')} style={{ padding: 4, marginRight: 8 }}>
                <ArrowLeft2 size={30} color={T.text} variant="Outline" />
              </TouchableOpacity>
              <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 18 }}>New Forum Thread</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
              {!verified && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: '#FEF3C7',
                  borderWidth: 1,
                  borderColor: '#F59E0B',
                  marginBottom: 16,
                  gap: 10,
                }}>
                  <ShieldTick size={24} color="#B45309" variant="Bold" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#92400E', fontFamily: 'Octarine-Bold', fontSize: 14 }}>Verification Required</Text>
                    <Text style={{ color: '#A16207', fontFamily: 'Inter-Medium', fontSize: 12, marginTop: 2 }}>Verify your identity to post in the community forum.</Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#B45309',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                    }}
                    onPress={() => navigation.navigate('VerifyIdentity')}
                  >
                    <Text style={{ color: '#fff', fontFamily: 'Octarine-Bold', fontSize: 12 }}>Verify</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>TITLE</Text>
              <TextInput
                style={{
                  height: 48,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: T.border,
                  backgroundColor: T.cardAlt,
                  color: T.text,
                  fontFamily: 'Inter-Medium',
                  paddingHorizontal: 16,
                  fontSize: 14,
                  marginBottom: 16,
                }}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Give your post a concise title..."
                placeholderTextColor={T.textMuted}
                maxLength={100}
              />

              <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>CONTENT</Text>
              <TextInput
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: T.border,
                  backgroundColor: T.cardAlt,
                  color: T.text,
                  fontFamily: 'Inter-Medium',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 14,
                  minHeight: 120,
                  textAlignVertical: 'top',
                  marginBottom: 16,
                }}
                value={newContent}
                onChangeText={setNewContent}
                placeholder="What would you like to discuss with the community?"
                placeholderTextColor={T.textMuted}
                multiline
                numberOfLines={6}
              />

              <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 8 }}>SELECT TAGS</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {AVAILABLE_TAGS.map(tag => {
                  const isSelected = newTags.includes(tag);
                  const tagColor = TAG_COLORS[tag];
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => toggleTagSelection(tag)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 999, // Pill layout
                        borderWidth: 1,
                        borderColor: isSelected ? tagColor.text : T.border,
                        backgroundColor: isSelected ? tagColor.bg : T.cardAlt,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontFamily: 'Inter-Medium', color: isSelected ? tagColor.text : T.textMuted }}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 8 }}>ATTACH IMAGE PRESET (OPTIONAL)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4, marginBottom: 20 }}>
                {PRESET_IMAGES.map((img, index) => {
                  const isSelected = newPhotoUrl === img.url;
                  return (
                    <TouchableOpacity 
                      key={index}
                      onPress={() => setNewPhotoUrl(isSelected ? null : img.url)}
                      style={{
                        width: 90,
                        borderRadius: 14,
                        overflow: 'hidden',
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? T.accent : T.border,
                        backgroundColor: T.cardAlt,
                        alignItems: 'center',
                        paddingBottom: 6,
                      }}
                    >
                      <Image source={{ uri: img.url }} style={{ width: '100%', height: 60, marginBottom: 4 }} />
                      <Text style={{ fontSize: 10, fontFamily: 'Inter-Medium', color: T.text, paddingHorizontal: 4 }} numberOfLines={1}>{img.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={{
                  height: 52,
                  borderRadius: 999,
                  backgroundColor: !verified ? '#D1D5DB' : '#292929',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={verified ? handleCreatePost : () => navigation.navigate('VerifyIdentity')}
                disabled={loading || !verified || !newTitle.trim() || !newContent.trim()}
              >
                <Text style={{
                  color: !verified ? '#9CA3AF' : '#FFFCF5',
                  fontFamily: 'Octarine-Bold',
                  fontSize: 15,
                }}>
                  {!verified ? 'Verify to Post' : loading ? 'Publishing...' : 'Create Thread'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (viewState === 'detail' && selectedPost) {
    const avatarOPBg = getAvatarBg(selectedPost.citizen_name);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.card }} edges={['top']}>
        <KeyboardAvoidingView 
          style={{ flex: 1, backgroundColor: T.card }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Detail Header Bar */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: T.border,
            backgroundColor: T.card,
          }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <MessageText1 size={18} color={T.accent} variant="Bold" style={{ marginRight: 8 }} />
              <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 16, flex: 1 }} numberOfLines={1}>
                {selectedPost.title || 'Discussion'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <TouchableOpacity onPress={() => toggleBookmark(selectedPost.id)}>
                {bookmarkedIds.includes(selectedPost.id) ? (
                  <Bookmark size={18} color={T.accent} variant="Bold" />
                ) : (
                  <Bookmark size={18} color={T.textMuted} variant="Bold" />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                await Clipboard.setStringAsync(`agapp://forum/${selectedPost.id}`);
                showToast('Thread link copied to clipboard.', 'success');
              }}>
                <Link size={18} color={T.textMuted} variant="Bold" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setSelectedPost(null); setViewState('list'); }} style={{ marginLeft: 4 }}>
                <CloseSquare size={20} color={T.text} variant="Bold" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            ref={commentScrollViewRef}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 40, backgroundColor: T.card }}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
          >
            {/* Original Post */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, alignItems: 'flex-start', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: avatarOPBg, justifyContent: 'center', alignItems: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {selectedPost.citizen?.avatar_url ? (
                  <Image source={{ uri: selectedPost.citizen.avatar_url }} style={{ width: 42, height: 42 }} />
                ) : (
                  <Text style={{ color: '#292929', fontFamily: 'Octarine-Bold', fontSize: 16 }}>
                    {selectedPost.citizen_name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 15 }}>{selectedPost.citizen_name}</Text>
                  <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 11 }}>
                    {getRelativeTime(selectedPost.created_at)}
                  </Text>
                  {!selectedPost.is_approved && (
                    <View style={{ backgroundColor: '#FEF08A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ color: '#854D0E', fontSize: 9, fontFamily: 'Octarine-Bold' }}>PENDING</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 18, marginTop: 4, marginBottom: 6 }}>
                  {selectedPost.title}
                </Text>
                
                {selectedPost.tags && selectedPost.tags.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {selectedPost.tags.map((t: string) => {
                      const tagColor = getTagColors(t);
                      return (
                        <View key={t} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: tagColor.bg }}>
                          <Text style={{ fontSize: 10, fontFamily: 'Inter-Medium', color: tagColor.text }}>#{t}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
                <Text style={{ fontFamily: 'Inter-Medium', color: T.text, fontSize: 14, lineHeight: 20 }}>
                  {selectedPost.content}
                </Text>
                {selectedPost.photo_url && (
                  <Image source={{ uri: selectedPost.photo_url }} style={{ width: '100%', height: 180, borderRadius: 12, marginTop: 8 }} resizeMode="cover" />
                )}
              </View>
            </View>

            {/* Replies Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10, paddingHorizontal: 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: T.border, opacity: 0.2 }} />
              <Text style={{ fontSize: 10, fontFamily: 'Octarine-Bold', color: T.textMuted, letterSpacing: 1.2 }}>REPLIES</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: T.border, opacity: 0.2 }} />
            </View>

            {commentsLoading ? (
              <ActivityIndicator color={T.textMuted} style={{ marginTop: 20 }} />
            ) : comments.length === 0 ? (
              <Text style={{ textAlign: 'center', color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 13, marginTop: 12 }}>No replies yet. Be the first to start the discussion!</Text>
            ) : (
              comments.map(c => {
                const commentAvatarBg = getAvatarBg(c.citizen_name);
                const parentComment = c.parent_comment_id 
                  ? comments.find((p: any) => p.id === c.parent_comment_id)
                  : null;

                return (
                  <SwipeableRow key={c.id} onSwipe={() => session ? setReplyTarget(c) : navigation.navigate('Login', { initialMode: 'register' })}>
                    <TouchableOpacity 
                      activeOpacity={0.8}
                      onLongPress={() => session ? setReplyTarget(c) : navigation.navigate('Login', { initialMode: 'register' })}
                      style={{
                        flexDirection: 'row',
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: commentAvatarBg, justifyContent: 'center', alignItems: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {c.citizen?.avatar_url ? (
                          <Image source={{ uri: c.citizen.avatar_url }} style={{ width: 36, height: 36 }} />
                        ) : (
                          <Text style={{ color: '#292929', fontFamily: 'Octarine-Bold', fontSize: 14 }}>
                            {c.citizen_name.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        {parentComment && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 }}>
                            <View style={{ width: 2, height: 12, backgroundColor: T.accent }} />
                            <Text style={{ fontSize: 11, fontFamily: 'Inter-Medium', color: T.textMuted }} numberOfLines={1}>
                              Replying to <Text style={{ fontFamily: 'Octarine-Bold', color: T.text }}>@{parentComment.citizen_name}</Text>
                            </Text>
                          </View>
                        )}

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 13 }}>
                            {c.citizen_name}
                          </Text>
                          <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 10 }}>
                            {getRelativeTime(c.createdAt || c.created_at)}
                          </Text>
                          {!c.is_approved && (
                            <View style={{ backgroundColor: '#FEF08A', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                              <Text style={{ color: '#854D0E', fontSize: 8, fontFamily: 'Octarine-Bold' }}>PENDING</Text>
                            </View>
                          )}
                          <TouchableOpacity onPress={() => session ? setReplyTarget(c) : navigation.navigate('Login', { initialMode: 'register' })} style={{ marginLeft: 'auto', padding: 2 }}>
                            <Text style={{ fontSize: 10, fontFamily: 'Octarine-Bold', color: T.textMuted }}>Reply</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={{ fontFamily: 'Inter-Medium', color: T.text, fontSize: 14, lineHeight: 18 }}>{c.content}</Text>
                      </View>
                    </TouchableOpacity>
                  </SwipeableRow>
                );
              })
            )}
          </ScrollView>

          {/* Reply Target Indicator */}
          {replyTarget && (
            <View style={{
              flexDirection: 'row',
              paddingHorizontal: 16,
              paddingVertical: 8,
              alignItems: 'center',
              borderTopWidth: 1,
              borderColor: T.border,
              backgroundColor: T.cardAlt,
            }}>
              <View style={{ width: 2, height: 16, backgroundColor: T.accent, marginRight: 8 }} />
              <Text style={{ color: T.text, fontSize: 12, fontFamily: 'Inter-Medium', flex: 1 }} numberOfLines={1}>
                Replying to <Text style={{ fontFamily: 'Octarine-Bold', color: T.accent }}>@{replyTarget.citizen_name}</Text>
              </Text>
              <TouchableOpacity onPress={() => setReplyTarget(null)}>
                <CloseSquare size={16} color={T.textMuted} variant="Bold" />
              </TouchableOpacity>
            </View>
          )}

          {/* Chat presets selector */}
          {showPresetsInChat && (
            <View style={{ paddingTop: 10, paddingBottom: 14, borderTopWidth: 1, borderColor: T.border, backgroundColor: T.card }}>
              <Text style={{ fontSize: 10, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6, paddingHorizontal: 16 }}>
                SELECT IMAGE PRESET TO SEND
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
                {PRESET_IMAGES.map((img, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    onPress={() => handleCreateComment(`Sent preset: ${img.name} ${img.url}`)}
                    style={{ width: 70, alignItems: 'center' }}
                  >
                    <Image source={{ uri: img.url }} style={{ width: 60, height: 44, borderRadius: 6 }} />
                    <Text style={{ fontSize: 9, fontFamily: 'Inter-Medium', color: T.text, textAlign: 'center', marginTop: 2 }} numberOfLines={1}>
                      {img.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Chat input bar */}
          {!session ? (
            <View style={{
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderTopWidth: 1,
              borderColor: T.border,
              backgroundColor: T.card,
              alignItems: 'center',
            }}>
              <TouchableOpacity
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#292929',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => navigation.navigate('Login', { initialMode: 'register' })}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#FFFFFF', fontFamily: 'Octarine-Bold', fontSize: 14 }}>
                  Sign in to join the conversation
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{
              flexDirection: 'row',
              paddingHorizontal: 16,
              paddingVertical: 12,
              alignItems: 'center',
              borderTopWidth: 1,
              borderColor: T.border,
              backgroundColor: T.card,
            }}>
              <TouchableOpacity 
                onPress={() => setShowPresetsInChat(!showPresetsInChat)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: T.cardAlt,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10,
                }}
              >
                <Add size={18} color={T.text} variant="Bold" />
              </TouchableOpacity>
              
              <View style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 999, // Pill layout
                backgroundColor: T.cardAlt,
                paddingHorizontal: 14,
                height: 40,
                marginRight: 6,
              }}>
                <TextInput
                  style={{
                    flex: 1,
                    height: '100%',
                    fontSize: 14,
                    fontFamily: 'Inter-Medium',
                    color: T.text,
                    paddingVertical: 0,
                  }}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder={`Message "${selectedPost.title}"…`}
                  placeholderTextColor={T.textMuted}
                  onSubmitEditing={() => handleCreateComment()}
                />
                <TouchableOpacity onPress={() => setNewComment(prev => prev + ' 😊')}>
                  <EmojiHappy size={18} color={T.textMuted} variant="Linear" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: T.accentSoft,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginLeft: 6,
                }}
                onPress={() => handleCreateComment()}
                disabled={!newComment.trim()}
              >
                <Send2 size={16} color="#292929" variant="Bold" />
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Helper tags icons map
  const TAG_ICONS: Record<string, any> = {
    'All': SearchNormal1,
    'General': MessageText1,
    'Questions': MessageQuestion,
    'Alerts': Danger,
    'Suggestions': Edit2,
    'Events': Calendar,
  };

  // Extract top trending threads sorted by replies/comments count
  const trendingThreads = [...posts]
    .sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0))
    .slice(0, 3);

  // 4. Default: THREAD LIST (viewState === 'list')
  return (
    <ScreenBackground>
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <View style={{ flex: 1 }}>
        {/* Centered navigation tabs (For you / Bookmarks) */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 36,
          paddingTop: 20,
          marginBottom: 16,
        }}>
          <TouchableOpacity onPress={() => setActiveTab('foryou')} activeOpacity={0.8}>
            <Text style={{
              fontFamily: 'Octarine-Bold',
              fontSize: 18,
              color: activeTab === 'foryou' ? T.text : T.textMuted,
            }}>
              For you
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('bookmarks')} activeOpacity={0.8}>
            <Text style={{
              fontFamily: 'Octarine-Bold',
              fontSize: 18,
              color: activeTab === 'bookmarks' ? T.text : T.textMuted,
            }}>
              Bookmarks
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar Row */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          alignItems: 'center',
          gap: 10,
          marginBottom: 6,
        }}>
          <View style={{
            flex: 1,
            flexDirection: 'row',
            height: 44,
            borderRadius: 999, // Pill layout
            borderWidth: 1,
            borderColor: T.border,
            backgroundColor: T.card,
            alignItems: 'center',
            paddingHorizontal: 16,
          }}>
            <SearchNormal1 size={18} color={T.textMuted} variant="Outline" style={{ marginRight: 8 }} />
            <TextInput
              style={{
                flex: 1,
                height: '100%',
                fontSize: 14,
                fontFamily: 'Inter-Medium',
                color: T.text,
              }}
              placeholder="Search threads..."
              placeholderTextColor={T.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <CloseSquare size={16} color={T.textMuted} variant="Bold" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Horizontal tag filter bar with icons */}
        <View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{
              flexDirection: 'row',
              paddingHorizontal: 20,
              paddingVertical: 10,
              gap: 8,
            }}
          >
            {['All', ...AVAILABLE_TAGS].map(tag => {
              const isSelected = selectedFilter === tag;
              const TagIcon = TAG_ICONS[tag] || SearchNormal1;
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => setSelectedFilter(tag)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 999, // Pill layout
                    borderWidth: isSelected ? 0 : 1,
                    borderColor: T.border,
                    backgroundColor: isSelected ? T.text : T.card,
                    gap: 6,
                  }}
                >
                  <TagIcon size={14} color={isSelected ? T.bg : T.textMuted} variant="Bold" />
                  <Text style={{ fontSize: 13, fontFamily: 'Inter-Medium', color: isSelected ? T.bg : T.text }}>
                    #{tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Threads ScrollView Container */}
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          {/* 1. Trending Threads (Horizontal small cards - only in "For you", empty search, and "All" tag filter) */}
          {activeTab === 'foryou' && selectedFilter === 'All' && searchQuery === '' && trendingThreads.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 18, color: T.text, marginBottom: 12 }}>Trending Threads</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingRight: 20 }}>
                {trendingThreads.map((thread, idx) => {
                  const ranking = idx + 1;
                  const tag = thread.tags?.[0] || 'General';
                  const tagColors = getTagColors(tag);
                  const avatarBg = getAvatarBg(thread.citizen_name);
                  return (
                    <TouchableOpacity
                      key={thread.id}
                      style={{
                        width: 220,
                        minHeight: 270,
                        padding: 20,
                        borderRadius: 24,
                        borderWidth: 1,
                        borderColor: T.border,
                        backgroundColor: T.card,
                      }}
                      onPress={() => {
                        setSelectedPost(thread);
                        setViewState('detail');
                      }}
                    >
                      {/* Top Header Row: Ranking + dots option */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: T.textMuted }}>
                          #{ranking} on Trending
                        </Text>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); toggleBookmark(thread.id); }}>
                          {bookmarkedIds.includes(thread.id) ? (
                            <Bookmark size={18} color={T.accent} variant="Bold" />
                          ) : (
                            <More size={20} color={T.textMuted} variant="Bold" />
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Main Title */}
                      <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 18, color: T.text, lineHeight: 22, marginBottom: 12 }} numberOfLines={4}>
                        {thread.title || 'General Discussion'}
                      </Text>

                      {/* Category Tag Badge */}
                      <View style={{
                        alignSelf: 'flex-start',
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 12,
                        backgroundColor: tagColors.bg,
                        borderWidth: 1,
                        borderColor: tagColors.text,
                        marginBottom: 12,
                      }}>
                        <Text style={{ fontSize: 10, fontFamily: 'Octarine-Bold', color: tagColors.text }}>
                          #{tag}
                        </Text>
                      </View>

                      {/* Simulating overlapping avatars stack */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: PASTELS.sage, borderWidth: 1.5, borderColor: T.card }} />
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: PASTELS.blue, borderWidth: 1.5, borderColor: T.card, marginLeft: -8 }} />
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: PASTELS.pink, borderWidth: 1.5, borderColor: T.card, marginLeft: -8 }} />
                        <View style={{
                          paddingHorizontal: 8,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: T.cardAlt,
                          borderWidth: 1,
                          borderColor: T.border,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginLeft: 6,
                        }}>
                          <Text style={{ fontSize: 9, fontFamily: 'Octarine-Bold', color: T.textMuted }}>
                            +{((thread.commentsCount || 0) * 3) + 2}
                          </Text>
                        </View>
                      </View>

                      {/* Author row at the bottom (solid colored avatar + name) */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 'auto' }}>
                        <View style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: avatarBg,
                          borderWidth: 1.5,
                          borderColor: T.text,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 8,
                          overflow: 'hidden',
                        }}>
                          {thread.citizen?.avatar_url ? (
                            <Image source={{ uri: thread.citizen.avatar_url }} style={{ width: 28, height: 28 }} />
                          ) : (
                            <Text style={{ color: '#292929', fontFamily: 'Octarine-Bold', fontSize: 11 }}>
                              {thread.citizen_name.charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 13, color: T.text, marginRight: 4 }} numberOfLines={1}>
                          {thread.citizen_name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 2. Featured Threads / Main Stream Feed */}
          {activeTab === 'bookmarks' && bookmarkedIds.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60 }}>
              <Bookmark size={48} color={T.textMuted} variant="Linear" style={{ marginBottom: 16 }} />
              <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', textAlign: 'center', fontSize: 15 }}>
                You haven't bookmarked any threads yet.
              </Text>
            </View>
          ) : filteredPosts.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60 }}>
              <MessageText1 size={48} color={T.textMuted} variant="Linear" style={{ marginBottom: 16 }} />
              <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', textAlign: 'center', fontSize: 15 }}>
                No threads found. Be the first to start the discussion!
              </Text>
            </View>
          ) : (
            <>
              {activeTab === 'foryou' && selectedFilter === 'All' && searchQuery === '' && (
                <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 18, color: T.text, marginBottom: 12 }}>Featured Threads</Text>
              )}
              {filteredPosts.map(post => {
                const avatarBg = getAvatarBg(post.citizen_name);
                return (
                  <TouchableOpacity 
                    key={post.id} 
                    style={{
                      padding: 20,
                      borderRadius: 24, // Rounded mockup card corners
                      borderWidth: 1,
                      borderColor: T.border,
                      backgroundColor: T.card,
                      marginBottom: 16,
                    }}
                    onPress={() => {
                      setSelectedPost(post);
                      setViewState('detail');
                    }}
                  >
                    {/* Author row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: avatarBg, justifyContent: 'center', alignItems: 'center', marginRight: 10, overflow: 'hidden' }}>
                        {post.citizen?.avatar_url ? (
                          <Image source={{ uri: post.citizen.avatar_url }} style={{ width: 36, height: 36 }} />
                        ) : (
                          <Text style={{ color: '#292929', fontFamily: 'Octarine-Bold', fontSize: 14 }}>
                            {post.citizen_name.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontFamily: 'Octarine-Bold', color: T.text }}>
                          {post.citizen_name}
                        </Text>
                      </View>
                      <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 12 }}>
                        {getRelativeTime(post.created_at)}
                      </Text>
                    </View>

                    {/* Title */}
                    <Text style={{ fontSize: 20, fontFamily: 'Octarine-Bold', color: T.text, lineHeight: 24, marginBottom: 8 }} numberOfLines={2}>
                      {post.title || 'General Discussion'}
                    </Text>

                    {/* Snippet */}
                    <Text style={{ fontSize: 14, fontFamily: 'Inter-Medium', color: T.textMuted, lineHeight: 20, marginBottom: 12 }} numberOfLines={3}>
                      {post.content}
                    </Text>

                    {/* Thread Thumbnail Photo Preview */}
                    {post.photo_url && (
                      <Image source={{ uri: post.photo_url }} style={{ width: '100%', height: 160, borderRadius: 16, marginBottom: 12 }} />
                    )}

                    {/* Category Tags (Placed under description as shown in mockup) */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      {post.tags && post.tags.slice(0, 2).map((t: string) => {
                        const tagColors = getTagColors(t);
                        return (
                          <View
                            key={t}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 4,
                              borderRadius: 12,
                              backgroundColor: tagColors.bg,
                              borderWidth: 1,
                              borderColor: tagColors.text,
                            }}
                          >
                            <Text style={{ fontSize: 10, fontFamily: 'Octarine-Bold', color: tagColors.text }}>#{t}</Text>
                          </View>
                        );
                      })}
                    </View>

                    {/* Divider line before reactions */}
                    <View style={{ height: 1, backgroundColor: T.border, opacity: 0.15, marginVertical: 8 }} />

                    {/* Footer Reaction buttons (likes count, comments count, bookmark option) */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 16 }}>
                      {/* Heart reaction trigger */}
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleLike(post.id);
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 12,
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(26,26,26,0.04)',
                        }}
                      >
                        <Heart
                          size={16}
                          color={likedPostIds.includes(post.id) ? '#EF4444' : T.text}
                          variant="Bold"
                          style={{ marginRight: 4 }}
                        />
                        <Text style={{ color: T.text, fontSize: 12, fontFamily: 'Octarine-Bold' }}>
                          {getLikeCount(post)}
                        </Text>
                      </TouchableOpacity>

                      {/* Comment Count preview */}
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(26,26,26,0.04)',
                      }}>
                        <MessageText1 size={16} color={T.text} variant="Linear" style={{ marginRight: 4 }} />
                        <Text style={{ color: T.text, fontSize: 12, fontFamily: 'Octarine-Bold' }}>
                          {post.commentsCount || 0}
                        </Text>
                      </View>

                      {/* Bookmark toggle icon pushed to the right */}
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleBookmark(post.id);
                        }}
                        style={{ marginLeft: 'auto', padding: 4 }}
                      >
                        {bookmarkedIds.includes(post.id) ? (
                          <Bookmark size={18} color={T.accent} variant="Bold" />
                        ) : (
                          <Bookmark2 size={18} color={T.textMuted} variant="Bold" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>

        {/* Floating Action Button (FAB) for New Post */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: T.text, // high contrast solid ink black or white
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}
          onPress={() => {
            if (!session) {
              navigation.navigate('Login', { initialMode: 'register' });
              return;
            }
            if (!verified) {
              showToast('Please verify your identity before creating forum threads.', 'error');
              return;
            }
            setViewState('create');
          }}
          activeOpacity={0.9}
        >
          <Edit2 size={24} color={T.bg} variant="Bold" />
        </TouchableOpacity>

      </View>
    </SafeAreaView>
    </ScreenBackground>
  );
}
