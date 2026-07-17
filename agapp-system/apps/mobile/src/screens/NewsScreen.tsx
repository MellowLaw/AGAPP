import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, TextInput, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ScreenBackground } from '../components/ScreenBackground';
import { ArrowLeft2, SearchNormal1, Notification, Danger, Book } from 'iconsax-react-native';

const { width } = Dimensions.get('window');

export function NewsScreen({ navigation }: any) {
  const { T, isDarkMode } = useTheme();
  const { selectedLgu, guestLgu, session, profile } = useAuth();
  const activeLgu = selectedLgu || guestLgu;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allNews, setAllNews] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [activeSegment, setActiveSegment] = useState<'latest' | 'archived'>('latest');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetchNewsAndUpdates(true);
    fetchUnreadNotifications();
  }, [activeLgu?.id]);

  const fetchNewsAndUpdates = async (showSpinner = true) => {
    if (!activeLgu?.id) return;
    if (showSpinner) setLoading(true);
    try {
      // Fetch both published and archived news
      const { data, error } = await supabase
        .from('news_announcements')
        .select('*')
        .eq('lgu_id', activeLgu.id)
        .or('status.eq.published,status.eq.archived')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setAllNews(data || []);
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const fetchUnreadNotifications = async () => {
    if (!session || !profile?.id) return;
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);

      if (!error && count !== null) {
        setUnreadNotifications(count);
      }
    } catch (e) {
      console.warn('Error fetching unread notifications count:', e);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchNewsAndUpdates(false),
      fetchUnreadNotifications()
    ]);
    setRefreshing(false);
  }, [activeLgu?.id, session, profile?.id]);

  // Filter news based on search text and segment
  const filteredNews = allNews.filter(n => {
    const matchesSearch = 
      n.title.toLowerCase().includes(searchText.toLowerCase()) ||
      n.content.toLowerCase().includes(searchText.toLowerCase());

    const isArchived = n.status === 'archived';
    
    // Check expiration
    const isExpired = n.expires_at ? new Date(n.expires_at).getTime() < Date.now() : false;
    if (isExpired) return false;

    if (activeSegment === 'archived') {
      // In archived tab: show archived news that are set to public
      return matchesSearch && isArchived && (n.is_public ?? true);
    } else {
      // In latest tab: show published news
      return matchesSearch && n.status === 'published';
    }
  });

  // Sort: Advisories -> Announcements -> News, then sorted by date
  const sortedFilteredNews = [...filteredNews].sort((a: any, b: any) => {
    const typePriority = (type: string) => {
      if (type === 'advisory') return 3;
      if (type === 'announcement') return 2;
      return 1;
    };
    
    const priorityA = typePriority(a.type);
    const priorityB = typePriority(b.type);
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }
    return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
  });

  // Featured news (the first 3 items in the sorted list when on 'latest' segment)
  const featuredNews = activeSegment === 'latest' ? sortedFilteredNews.slice(0, 3) : [];
  const latestNews = activeSegment === 'latest' ? sortedFilteredNews.slice(3) : sortedFilteredNews;

  const renderNewsImage = (item: any) => {
    const imageAttachment = Array.isArray(item.attachments)
      ? item.attachments.find((att: any) => att.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)/i.test(att.url))
      : null;
    return imageAttachment?.url || item.banner_url || activeLgu?.banner_url || 'https://placehold.co/800x400/A2B59F/1A1A1A?text=News';
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        {/* Header Row */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 10,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
              <ArrowLeft2 size={24} color={T.text} variant="Outline" />
            </TouchableOpacity>
            <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 24 }}>
              News & Updates
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              if (!session) {
                navigation.navigate('Login');
                return;
              }
              navigation.navigate('Notifications');
            }}
            activeOpacity={0.7}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: T.border,
              backgroundColor: T.card,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Notification size={22} color={T.text} variant="Outline" />
            {unreadNotifications > 0 && (
              <View style={{
                position: 'absolute',
                top: -2,
                right: -2,
                backgroundColor: '#EF4444', // Red indicator only
                width: 10,
                height: 10,
                borderRadius: 5,
                borderWidth: 1.5,
                borderColor: T.card,
              }} />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: T.card,
            borderWidth: 1,
            borderColor: T.border,
            borderRadius: 999,
            height: 48,
            paddingHorizontal: 16,
            gap: 10,
          }}>
            <SearchNormal1 size={18} color={T.textMuted} variant="Outline" />
            <TextInput
              style={{
                flex: 1,
                height: '100%',
                fontSize: 14,
                fontFamily: 'Inter-Medium',
                color: T.text,
              }}
              placeholder="Search news & articles..."
              placeholderTextColor={T.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Segmented Chips Control (Latest vs Archived) */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveSegment('latest')}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: activeSegment === 'latest' ? T.accentSoft : T.card,
              borderWidth: 1,
              borderColor: activeSegment === 'latest' ? T.accent : T.border,
            }}
          >
            <Text style={{
              fontFamily: 'Octarine-Bold',
              fontSize: 13,
              color: activeSegment === 'latest' ? T.onAccentSoft : T.text,
            }}>
              Latest News
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveSegment('archived')}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: activeSegment === 'archived' ? T.accentSoft : T.card,
              borderWidth: 1,
              borderColor: activeSegment === 'archived' ? T.accent : T.border,
            }}
          >
            <Text style={{
              fontFamily: 'Octarine-Bold',
              fontSize: 13,
              color: activeSegment === 'archived' ? T.onAccentSoft : T.text,
            }}>
              Archives
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={T.text} />
          </View>
        ) : filteredNews.length === 0 ? (
          <ScrollView
            contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[T.accent]}
                tintColor={T.accent}
              />
            }
          >
            <Book size={48} color={T.textMuted} variant="Outline" style={{ marginBottom: 12 }} />
            <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 16, textAlign: 'center' }}>
              No news items found
            </Text>
            <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4 }}>
              Try checking other municipal archives or adjusting your search term.
            </Text>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[T.accent]}
                tintColor={T.accent}
              />
            }
          >
            {/* Horizontal Featured News Carousel (ONLY on Latest Segment and when matching news exist) */}
            {activeSegment === 'latest' && featuredNews.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  fontFamily: 'Octarine-Bold',
                  fontSize: 15,
                  color: T.textMuted,
                  marginHorizontal: 20,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 1
                }}>
                  Featured Updates
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                >
                  {featuredNews.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
                      style={{
                        width: 140,
                        height: 180,
                        borderRadius: 16,
                        overflow: 'hidden',
                        backgroundColor: T.border,
                      }}
                    >
                      <Image
                        source={{ uri: renderNewsImage(item) }}
                        style={{ width: '100%', height: '100%', position: 'absolute' }}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
                        locations={[0, 0.4, 0.9]}
                        style={{
                          flex: 1,
                          justifyContent: 'flex-end',
                          padding: 12,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: 'Octarine-Bold',
                            color: '#FFFFFF',
                            fontSize: 12,
                            lineHeight: 15,
                            textTransform: 'uppercase',
                          }}
                          numberOfLines={3}
                        >
                          {item.title}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Latest News / Rest of the News (Vertical List) */}
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={{
                fontFamily: 'Octarine-Bold',
                fontSize: 15,
                color: T.textMuted,
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: 1
              }}>
                {activeSegment === 'latest' ? 'Latest News' : 'Archived News'}
              </Text>

              {/* Render first item as a Large visual card if on latest segment */}
              {activeSegment === 'latest' && latestNews.length > 0 && (
                (() => {
                  const firstItem = latestNews[0];
                  return (
                    <TouchableOpacity
                      activeOpacity={0.95}
                      onPress={() => navigation.navigate('NewsDetail', { newsId: firstItem.id })}
                      style={{
                        width: '100%',
                        height: 240,
                        borderRadius: 24,
                        overflow: 'hidden',
                        marginBottom: 16,
                        backgroundColor: T.border,
                        borderWidth: 1,
                        borderColor: T.border,
                      }}
                    >
                      <Image
                        source={{ uri: renderNewsImage(firstItem) }}
                        style={{ width: '100%', height: '100%', position: 'absolute' }}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                        locations={[0, 0.35, 0.85]}
                        style={{
                          flex: 1,
                          justifyContent: 'flex-end',
                          padding: 20,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: 'Octarine-Bold',
                            color: '#FFFFFF',
                            fontSize: 18,
                            lineHeight: 22,
                            textTransform: 'uppercase',
                            marginBottom: 4,
                          }}
                          numberOfLines={2}
                        >
                          {firstItem.title}
                        </Text>
                        <Text style={{
                          fontFamily: 'Inter-Medium',
                          color: 'rgba(255,255,255,0.75)',
                          fontSize: 11,
                        }}>
                          {new Date(firstItem.published_at || firstItem.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })()
              )}

              {/* Render subsequent items in a clean grid/list */}
              {(activeSegment === 'latest' ? latestNews.slice(1) : latestNews).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
                  style={{
                    flexDirection: 'row',
                    backgroundColor: T.card,
                    borderWidth: 1,
                    borderColor: T.border,
                    borderRadius: 20,
                    padding: 12,
                    marginBottom: 12,
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <Image
                    source={{ uri: renderNewsImage(item) }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 12,
                      backgroundColor: T.border,
                    }}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={{
                      fontFamily: 'Octarine-Bold',
                      fontSize: 14,
                      color: T.text,
                      lineHeight: 18,
                    }} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={{
                      fontFamily: 'Inter-Medium',
                      fontSize: 11,
                      color: T.textMuted,
                      marginTop: 6,
                    }}>
                      {new Date(item.published_at || item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </ScreenBackground>
  );
}
