import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet, Image, KeyboardAvoidingView, Platform, PanResponder, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';
import { isVerified } from '../utils/verification';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { globalStyles, ACCENT, PASTELS } from '../theme';
import { Ionicons } from '@expo/vector-icons';

type ViewState = 'list' | 'detail' | 'create';

const AVAILABLE_TAGS = ['General', 'Questions', 'Alerts', 'Suggestions', 'Events'];

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  'General': { bg: 'rgba(199,213,193,0.25)', text: '#4B633F' },     // Pastel Sage
  'Questions': { bg: 'rgba(196,208,215,0.25)', text: '#2B4D5F' },   // Pastel Blue
  'Alerts': { bg: 'rgba(242,196,203,0.25)', text: '#8F3845' },      // Pastel Pink
  'Suggestions': { bg: 'rgba(232,222,201,0.25)', text: '#7A622A' }, // Pastel Cream
  'Events': { bg: 'rgba(212,204,224,0.25)', text: '#5D447A' },      // Pastel Lilac
};

// Preset images for local thread attachments
const PRESET_IMAGES = [
  { name: 'Town Plaza', url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&auto=format&fit=crop&q=60' },
  { name: 'Community Path', url: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=500&auto=format&fit=crop&q=60' },
  { name: 'Municipal Hall', url: 'https://images.unsplash.com/photo-1541829011-85b82d9467ee?w=500&auto=format&fit=crop&q=60' },
  { name: 'Barangay Clean', url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500&auto=format&fit=crop&q=60' }
];

export function ForumScreen({ navigation }: any) {
  const { T, isDarkMode } = useTheme();
  const { profile, selectedLgu } = useAuth();
  
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

  // Form State (New Post / Thread)
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string | null>(null);

  // Form State (New Comment)
  const [newComment, setNewComment] = useState('');
  const [replyTarget, setReplyTarget] = useState<any | null>(null);
  const [showPresetsInChat, setShowPresetsInChat] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const verified = isVerified(profile);
  
  const commentScrollViewRef = useRef<ScrollView>(null);

  // 1. Fetch Posts subscription
  useEffect(() => {
    if (!selectedLgu) return;
    fetchPosts();

    const postsSubscription = supabase
      .channel('public:forum_posts_global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts', filter: `lgu_id=eq.${selectedLgu.id}` }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsSubscription);
    };
  }, [selectedLgu]);

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
    if (!selectedLgu || !profile) return;
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*, forum_comments(id, is_approved)')
        .eq('lgu_id', selectedLgu.id)
        .or(`is_approved.eq.true,citizen_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

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
        .select('*')
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
      
      // Clear form
      setNewTitle('');
      setNewContent('');
      setNewTags([]);
      setNewPhotoUrl(null);
      setViewState('list');
      
      if (isApproved) {
        Alert.alert('Thread Created', 'Your new topic was posted to the community forum.');
        fetchPosts();
      } else {
        Alert.alert(
          'Flagged for Moderation',
          'Your post contains sensitive or inappropriate words and was flagged. LGU admins will review it soon.'
        );
      }
    } catch (err: any) {
      Alert.alert('Create thread failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async (customText?: string) => {
    const textToSend = customText ?? newComment;
    if (!textToSend.trim() || !profile || !selectedPost) return;
    if (!verified) {
      Alert.alert('Verification Required', 'Please verify your identity before replying in the forum.');
      return;
    }
    const contentText = textToSend.trim();

    // Auto-moderation profanity checker fallback
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
        // also update comments count locally in post detail view
        setSelectedPost((prev: any) => prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : null);
      } else {
        Alert.alert(
          'Comment Flagged',
          'Your comment contains inappropriate words and has been submitted to LGU moderators for approval.'
        );
      }
    } catch (err: any) {
      Alert.alert('Comment failed', err.message);
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

  // Filter & Search computation
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      (post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.citizen_name.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesTag = 
      selectedFilter === 'All' || 
      (post.tags && post.tags.includes(selectedFilter));

    return matchesSearch && matchesTag;
  });

  // ──────── LAYOUT RENDERING ────────

  if (viewState === 'create') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.card }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[globalStyles.screen, { backgroundColor: T.card }]}>
          <View style={[styles.headerBar, { borderBottomColor: T.border }]}>
            <TouchableOpacity onPress={() => setViewState('list')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={T.text} />
            </TouchableOpacity>
            <Text style={[styles.headerBarTitle, { color: T.text }]}>New Forum Thread</Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            {!verified && (
              <View style={[styles.verificationBanner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="shield-checkmark-outline" size={22} color="#B45309" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#92400E', fontWeight: '700', fontSize: 14 }}>Verification Required</Text>
                    <Text style={{ color: '#A16207', fontSize: 12, marginTop: 2 }}>Verify your identity to post in the community forum.</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.verifyBtn, { backgroundColor: '#B45309' }]}
                    onPress={() => navigation.navigate('VerifyIdentity')}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Verify</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <Text style={[styles.fieldLabel, { color: T.textMuted }]}>TITLE</Text>
            <TextInput
              style={[styles.titleInput, { color: T.text, backgroundColor: T.cardAlt, borderColor: T.border }]}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Give your post a concise title..."
              placeholderTextColor={T.textMuted}
              maxLength={100}
            />

            <Text style={[styles.fieldLabel, { color: T.textMuted, marginTop: 14 }]}>CONTENT</Text>
            <TextInput
              style={[styles.contentInput, { color: T.text, backgroundColor: T.cardAlt, borderColor: T.border }]}
              value={newContent}
              onChangeText={setNewContent}
              placeholder="What would you like to discuss with the community?"
              placeholderTextColor={T.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <Text style={[styles.fieldLabel, { color: T.textMuted, marginTop: 14 }]}>SELECT TAGS</Text>
            <View style={styles.tagGrid}>
              {AVAILABLE_TAGS.map(tag => {
                const isSelected = newTags.includes(tag);
                const tagColor = TAG_COLORS[tag];
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleTagSelection(tag)}
                    style={[
                      styles.tagSelectorPill,
                      { 
                        backgroundColor: isSelected ? tagColor.bg : T.cardAlt,
                        borderColor: isSelected ? tagColor.text : T.border 
                      }
                    ]}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: isSelected ? tagColor.text : T.textMuted }}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: T.textMuted, marginTop: 18 }]}>ATTACH IMAGE PRESET (OPTIONAL)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
              {PRESET_IMAGES.map((img, index) => {
                const isSelected = newPhotoUrl === img.url;
                return (
                  <TouchableOpacity 
                    key={index}
                    onPress={() => setNewPhotoUrl(isSelected ? null : img.url)}
                    style={[
                      styles.presetCard, 
                      { 
                        borderColor: isSelected ? ACCENT : T.border,
                        borderWidth: isSelected ? 2 : 1,
                        backgroundColor: T.cardAlt
                      }
                    ]}
                  >
                    <Image source={{ uri: img.url }} style={styles.presetThumb} />
                    <Text style={[styles.presetText, { color: T.text }]} numberOfLines={1}>{img.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[globalStyles.primaryButton, { backgroundColor: !verified ? '#D1D5DB' : ACCENT, marginTop: 24 }]}
              onPress={verified ? handleCreatePost : () => navigation.navigate('VerifyIdentity')}
              disabled={loading || !verified || !newTitle.trim() || !newContent.trim()}
            >
              <Text style={[globalStyles.primaryButtonText, { color: !verified ? '#9CA3AF' : '#1A1A1A' }]}>
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
      <SafeAreaView style={{ flex: 1, backgroundColor: T.card }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView 
          style={{ flex: 1, backgroundColor: T.card }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Harmonized Detail Header Bar */}
          <View style={[styles.headerBar, { borderBottomColor: T.border, backgroundColor: T.card }]}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="chatbox-ellipses" size={18} color={ACCENT} style={{ marginRight: 8 }} />
              <Text style={[styles.headerBarTitle, { color: T.text }]} numberOfLines={1}>
                {selectedPost.title || 'Discussion'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <TouchableOpacity onPress={() => setIsFollowing(!isFollowing)}>
                <Ionicons 
                  name={isFollowing ? "notifications" : "notifications-outline"} 
                  size={20} 
                  color={isFollowing ? ACCENT : T.textMuted} 
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('Link Copied', 'Thread link copied to clipboard.')}>
                <Ionicons name="link-outline" size={20} color={T.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setSelectedPost(null); setViewState('list'); }} style={{ marginLeft: 4 }}>
                <Ionicons name="close" size={22} color={T.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            ref={commentScrollViewRef}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 40, backgroundColor: T.card }}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
          >
            {/* Original Post — flat Discord style */}
            <View style={[styles.discordRow, { paddingTop: 16, paddingBottom: 12 }]}>
              <View style={[styles.discordAvatar, { backgroundColor: avatarOPBg, width: 42, height: 42, borderRadius: 21 }]}>
                <Text style={{ color: '#1A1A1A', fontWeight: '700', fontSize: 16 }}>
                  {selectedPost.citizen_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={[styles.discordMeta, { marginBottom: 6 }]}>
                  <Text style={[styles.discordAuthor, { color: T.text, fontSize: 15 }]}>{selectedPost.citizen_name}</Text>
                  <Text style={[styles.discordTimestamp, { color: T.textMuted }]}>
                    {getRelativeTime(selectedPost.created_at)}
                  </Text>
                  {!selectedPost.is_approved && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>PENDING</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.detailThreadTitle, { color: T.text, marginTop: 0, marginBottom: 6, fontSize: 17 }]}>
                  {selectedPost.title}
                </Text>
                {/* Tag Pills */}
                {selectedPost.tags && selectedPost.tags.length > 0 && (
                  <View style={[styles.tagsContainer, { marginBottom: 8 }]}>
                    {selectedPost.tags.map((t: string) => {
                      const tagColor = TAG_COLORS[t] || { bg: T.cardAlt, text: T.textMuted };
                      return (
                        <View key={t} style={[styles.tagBadge, { backgroundColor: tagColor.bg }]}>
                          <Text style={[styles.tagBadgeText, { color: tagColor.text }]}>#{t}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
                <Text style={[styles.detailThreadContent, { color: T.text, marginBottom: 4 }]}>
                  {selectedPost.content}
                </Text>
                {selectedPost.photo_url && (
                  <Image source={{ uri: selectedPost.photo_url }} style={[styles.threadOPImage, { marginTop: 8 }]} resizeMode="cover" />
                )}
              </View>
            </View>

            {/* Clean Divider Line */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: T.border }]} />
              <Text style={[styles.dividerText, { color: T.textMuted }]}>DISCUSSION REPLIES</Text>
              <View style={[styles.dividerLine, { backgroundColor: T.border }]} />
            </View>

            {commentsLoading ? (
              <Text style={[styles.statusMsg, { color: T.textMuted }]}>Loading replies...</Text>
            ) : comments.length === 0 ? (
              <Text style={[styles.statusMsg, { color: T.textMuted }]}>No replies yet. Be the first to start the discussion!</Text>
            ) : (
              comments.map(c => {
                const commentAvatarBg = getAvatarBg(c.citizen_name);
                const parentComment = c.parent_comment_id 
                  ? comments.find((p: any) => p.id === c.parent_comment_id)
                  : null;

                return (
                  <SwipeableRow key={c.id} onSwipe={() => setReplyTarget(c)}>
                    <TouchableOpacity 
                      activeOpacity={0.7}
                      onLongPress={() => setReplyTarget(c)}
                      style={styles.discordRow}
                    >
                      {/* Avatar column */}
                      <View style={[styles.discordAvatar, { backgroundColor: commentAvatarBg }]}>
                        <Text style={{ color: '#1A1A1A', fontWeight: '700', fontSize: 14 }}>
                          {c.citizen_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      {/* Message column */}
                      <View style={{ flex: 1 }}>
                        {/* Discord reply quote bar */}
                        {parentComment && (
                          <View style={styles.discordReplyBar}>
                            <View style={[styles.discordReplyAccent, { backgroundColor: ACCENT }]} />
                            <Text style={[styles.discordReplyText, { color: T.textMuted }]} numberOfLines={1}>
                              <Text style={{ fontWeight: '700', color: T.text }}>@{parentComment.citizen_name}</Text>
                              {'  '}{parentComment.content}
                            </Text>
                          </View>
                        )}

                        {/* Author + timestamp row */}
                        <View style={styles.discordMeta}>
                          <Text style={[styles.discordAuthor, { color: T.text }]}>
                            {c.citizen_name}
                          </Text>
                          <Text style={[styles.discordTimestamp, { color: T.textMuted }]}>
                            {getRelativeTime(c.createdAt || c.created_at)}
                          </Text>
                          {!c.is_approved && (
                            <View style={styles.pendingBadge}>
                              <Text style={styles.pendingText}>PENDING</Text>
                            </View>
                          )}
                          <TouchableOpacity onPress={() => setReplyTarget(c)} style={styles.discordReplyBtn}>
                            <Ionicons name="return-down-forward-outline" size={13} color={T.textMuted} />
                          </TouchableOpacity>
                        </View>

                        {/* Message text */}
                        <Text style={[styles.discordMessage, { color: T.text }]}>{c.content}</Text>
                      </View>
                    </TouchableOpacity>
                  </SwipeableRow>
                );
              })
            )}
          </ScrollView>

          {/* Reply Target Indicator Bar */}
          {replyTarget && (
            <View style={[styles.replyTargetBar, { backgroundColor: T.cardAlt, borderTopColor: T.border }]}>
              <View style={[styles.discordReplyAccent, { backgroundColor: ACCENT, marginRight: 10 }]} />
              <Ionicons name="return-down-forward-outline" size={14} color={ACCENT} style={{ marginRight: 6 }} />
              <Text style={{ color: T.text, fontSize: 12, flex: 1 }} numberOfLines={1}>
                Replying to <Text style={{ fontWeight: '700', color: ACCENT }}>@{replyTarget.citizen_name}</Text>
                {'  '}<Text style={{ color: T.textMuted }}>{replyTarget.content}</Text>
              </Text>
              <TouchableOpacity onPress={() => setReplyTarget(null)}>
                <Ionicons name="close-circle" size={18} color={T.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Preset Photo Selector Panel inside thread discussion */}
          {showPresetsInChat && (
            <View style={[styles.chatPresetsPanel, { backgroundColor: T.card, borderTopColor: T.border }]}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: T.textMuted, marginBottom: 8, paddingHorizontal: 16 }}>
                SELECT IMAGE PRESET TO SEND
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
                {PRESET_IMAGES.map((img, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    onPress={() => handleCreateComment(`Sent a preset image: ${img.name} ${img.url}`)}
                    style={styles.chatPresetThumbCard}
                  >
                    <Image source={{ uri: img.url }} style={styles.chatPresetThumb} />
                    <Text style={{ fontSize: 10, color: T.text, textAlign: 'center', marginTop: 2 }} numberOfLines={1}>
                      {img.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Clean bottom chat input bar */}
          <View style={[styles.chatInputBar, { backgroundColor: T.card, borderColor: T.border }]}>
            <TouchableOpacity 
              onPress={() => setShowPresetsInChat(!showPresetsInChat)}
              style={[styles.chatAttachBtn, { backgroundColor: T.cardAlt }]}
            >
              <Ionicons name="add" size={20} color={T.text} />
            </TouchableOpacity>
            
            <View style={[styles.chatInputContainer, { backgroundColor: T.cardAlt }]}>
              <TextInput
                style={[styles.chatInput, { color: T.text }]}
                value={newComment}
                onChangeText={setNewComment}
                placeholder={`Message "${selectedPost.title}"…`}
                placeholderTextColor={T.textMuted}
                onSubmitEditing={() => handleCreateComment()}
              />
              <TouchableOpacity onPress={() => setNewComment(prev => prev + ' 😊')}>
                <Ionicons name="happy-outline" size={20} color={T.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.chatSend, { backgroundColor: ACCENT }]} 
              onPress={() => handleCreateComment()} 
              disabled={!newComment.trim()}
            >
              <Ionicons name="send" size={14} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // 4. Default: THREAD LIST (viewState === 'list')
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.cardAlt }} edges={['top']}>
      <View style={[globalStyles.screen, { backgroundColor: T.cardAlt }]}>
        <View style={{ padding: 20, paddingBottom: 10 }}>
          <Text style={[globalStyles.serif, { color: T.text, fontSize: 28 }]}>Forum.</Text>
          <Text style={[globalStyles.muted, { color: T.textMuted, marginTop: 4, marginBottom: 12 }]}>
            Discuss municipal concerns and build ideas with Liliw citizens.
          </Text>
        </View>

        {/* Search Bar + New Post Button */}
        <View style={styles.searchRow}>
          <View style={[styles.searchContainer, { backgroundColor: T.card, borderColor: T.border }]}>
            <Ionicons name="search" size={18} color={T.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: T.text }]}
              placeholder="Search threads..."
              placeholderTextColor={T.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={T.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={[styles.newPostBtn, { backgroundColor: ACCENT }]} onPress={() => {
            if (!verified) {
              Alert.alert('Verification Required', 'Please verify your identity before creating forum threads.');
              return;
            }
            setViewState('create');
          }}>
            <Ionicons name="add" size={20} color="#1A1A1A" style={{ marginRight: 4 }} />
            <Text style={styles.newPostBtnText}>New Post</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal tag filter bar */}
        <View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterBarContainer}
          >
            {['All', ...AVAILABLE_TAGS].map(tag => {
              const isSelected = selectedFilter === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => setSelectedFilter(tag)}
                  style={[
                    styles.filterPill,
                    { 
                      backgroundColor: isSelected ? T.text : T.card,
                      borderColor: isSelected ? T.text : T.border 
                    }
                  ]}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: isSelected ? T.bg : T.text }}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Threads Grid/List */}
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {filteredPosts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={T.textMuted} style={{ marginBottom: 16 }} />
              <Text style={{ color: T.textMuted, textAlign: 'center', fontSize: 16 }}>
                No threads found. Be the first to start the discussion!
              </Text>
            </View>
          ) : (
            filteredPosts.map(post => {
              const avatarBg = getAvatarBg(post.citizen_name);
              return (
                <TouchableOpacity 
                  key={post.id} 
                  style={[styles.threadCard, { backgroundColor: T.card, borderColor: T.border }]}
                  onPress={() => {
                    setSelectedPost(post);
                    setViewState('detail');
                  }}
                >
                  {/* Author row */}
                  <View style={styles.postHeader}>
                    <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
                      <Text style={{ color: '#1A1A1A', fontWeight: '700', fontSize: 13 }}>
                        {post.citizen_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.authorName, { color: T.text }]}>
                        {post.citizen_name}
                        <Text style={{ color: T.textMuted, fontWeight: '400', fontSize: 12 }}> · {getRelativeTime(post.created_at)}</Text>
                      </Text>
                    </View>
                    {!post.is_approved && (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>PENDING</Text>
                      </View>
                    )}
                  </View>

                  {/* Title */}
                  <Text style={[styles.threadTitle, { color: T.text }]} numberOfLines={2}>
                    {post.title || 'General Discussion'}
                  </Text>

                  {/* Snippet */}
                  <Text style={[styles.threadSnippet, { color: T.textMuted }]} numberOfLines={2}>
                    {post.content}
                  </Text>

                  {/* Thread Thumbnail Photo Preview */}
                  {post.photo_url && (
                    <Image source={{ uri: post.photo_url }} style={styles.threadThumbImage} />
                  )}

                  {/* Footer (Tags + Replies Count) */}
                  <View style={styles.threadCardFooter}>
                    <View style={styles.tagsRow}>
                      {post.tags && post.tags.slice(0, 2).map((t: string) => {
                        const tagColors = TAG_COLORS[t] || { bg: T.cardAlt, text: T.textMuted };
                        return (
                          <View key={t} style={[styles.tagBadge, { backgroundColor: tagColors.bg }]}>
                            <Text style={[styles.tagBadgeText, { color: tagColors.text }]}>#{t}</Text>
                          </View>
                        );
                      })}
                    </View>
                    <View style={[styles.commentsCountBubble, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(26,26,26,0.04)' }]}>
                      <Ionicons name="chatbubble-ellipses-outline" size={14} color={T.text} style={{ marginRight: 4 }} />
                      <Text style={{ color: T.text, fontSize: 12, fontWeight: '600' }}>
                        {post.commentsCount || 0}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  verificationBanner: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 14 },
  verifyBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  titleInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  contentInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  tagSelectorPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetsRow: {
    gap: 12,
    paddingVertical: 4,
  },
  presetCard: {
    width: 90,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    paddingBottom: 6,
  },
  presetThumb: {
    width: '100%',
    height: 60,
    marginBottom: 4,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  newPostBtn: {
    flexDirection: 'row',
    height: 42,
    borderRadius: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPostBtnText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 14,
  },
  filterBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  threadCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  relativeTime: {
    fontSize: 12,
    marginTop: 1,
  },
  pendingBadge: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  pendingText: {
    color: '#854D0E',
    fontSize: 9,
    fontWeight: '700',
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  threadSnippet: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  threadThumbImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 12,
  },
  threadCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  commentsCountBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  threadOPCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  detailThreadTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginVertical: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  detailThreadContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  threadOPImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.12,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  statusMsg: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
  // Discord-style flat message rows
  discordRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'flex-start',
    gap: 12,
  },
  discordAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  discordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  discordAuthor: {
    fontSize: 14,
    fontWeight: '700',
  },
  discordTimestamp: {
    fontSize: 11,
    fontWeight: '400',
  },
  discordMessage: {
    fontSize: 15,
    lineHeight: 21,
  },
  discordReplyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingLeft: 4,
    gap: 8,
  },
  discordReplyAccent: {
    width: 2,
    height: '100%',
    minHeight: 16,
    borderRadius: 2,
    flexShrink: 0,
  },
  discordReplyText: {
    fontSize: 12,
    flex: 1,
  },
  discordReplyBtn: {
    marginLeft: 'auto' as any,
    padding: 4,
  },
  // Legacy kept for other parts
  commentBubble: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
  },
  commentTime: {
    fontSize: 11,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 32,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto' as any,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  parentReplyReference: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    borderLeftWidth: 2,
    marginBottom: 8,
    marginLeft: 12,
  },
  parentReplyReferenceText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  replyTargetBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  chatPresetsPanel: {
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  chatPresetThumbCard: {
    width: 70,
    alignItems: 'center',
  },
  chatPresetThumb: {
    width: 60,
    height: 45,
    borderRadius: 6,
  },
  chatInputBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  chatAttachBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  chatInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    marginRight: 6,
  },
  chatInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    paddingVertical: 0,
  },
  chatSend: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
});
