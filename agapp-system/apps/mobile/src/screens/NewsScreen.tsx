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
  const [activeSegment, setActiveSegment] = useState<'news' | 'advisories' | 'archived'>('news');
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

  // Filter and group news based on search text, segment, and item type
  const searchFiltered = allNews.filter(n => 
    n.title.toLowerCase().includes(searchText.toLowerCase()) ||
    n.content.toLowerCase().includes(searchText.toLowerCase())
  );

  let featuredNews: any[] = [];
  let latestNews: any[] = [];

  if (activeSegment === 'archived') {
    // Archived segment: show archived/expired items (news, announcements, advisories)
    const archivedItems = searchFiltered.filter(n => {
      const isExpired = n.expires_at ? new Date(n.expires_at).getTime() < Date.now() : false;
      return (n.status === 'archived' || isExpired) && (n.is_public ?? true);
    });

    // Sort by date (descending)
    latestNews = [...archivedItems].sort((a, b) => 
      new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime()
    );
  } else {
    // Latest segment:
    // 1. Get active published announcements and advisories (not expired)
    const activeAnnouncementsAndAdvisories = searchFiltered.filter(n => {
      const isExpired = n.expires_at ? new Date(n.expires_at).getTime() < Date.now() : false;
      return (n.type === 'announcement' || n.type === 'advisory') && n.status === 'published' && !isExpired;
    });

    // Sort active announcements: Advisories first, then Announcements, then date
    const sortedActiveAnnouncements = [...activeAnnouncementsAndAdvisories].sort((a, b) => {
      const typePriority = (type: string) => (type === 'advisory' ? 2 : 1);
      const priorityA = typePriority(a.type);
      const priorityB = typePriority(b.type);
      if (priorityA !== priorityB) return priorityB - priorityA;
      return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
    });

    // 2. Get active published news
    const publishedNews = searchFiltered.filter(n => {
      const isExpired = n.expires_at ? new Date(n.expires_at).getTime() < Date.now() : false;
      return n.type === 'news' && n.status === 'published' && !isExpired;
    });

    // Sort news by date
    const sortedPublishedNews = [...publishedNews].sort((a, b) => 
      new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime()
    );

    // 3. Featured updates (carousel): items marked is_featured first, then normal priority
    const combined = [...sortedActiveAnnouncements, ...sortedPublishedNews];
    const sortedFeatured = [...combined].sort((a, b) => {
      if (a.is_featured !== b.is_featured) {
        return a.is_featured ? -1 : 1;
      }
      return 0;
    });
    featuredNews = sortedFeatured.slice(0, 3);

    // 4. Latest News (vertical list): ONLY news (type === 'news') and exclude any that are already in featuredNews
    const featuredIds = new Set(featuredNews.map(f => f.id));
    latestNews = sortedPublishedNews.filter(n => !featuredIds.has(n.id));
  }

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

        {/* Segmented Chips Control (News vs Advisories & Announcements vs Archived) */}
        <View style={{ marginBottom: 16 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveSegment('news')}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: activeSegment === 'news' ? T.accentSoft : T.card,
                borderWidth: 1,
                borderColor: activeSegment === 'news' ? T.accent : T.border,
              }}
            >
              <Text style={{
                fontFamily: 'Octarine-Bold',
                fontSize: 13,
                color: activeSegment === 'news' ? T.onAccentSoft : T.text,
              }}>
                Latest News
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveSegment('advisories')}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: activeSegment === 'advisories' ? T.accentSoft : T.card,
                borderWidth: 1,
                borderColor: activeSegment === 'advisories' ? T.accent : T.border,
              }}
            >
              <Text style={{
                fontFamily: 'Octarine-Bold',
                fontSize: 13,
                color: activeSegment === 'advisories' ? T.onAccentSoft : T.text,
              }}>
                Advisories & Announcements
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
          </ScrollView>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={T.text} />
          </View>
        ) : (featuredNews.length === 0 && latestNews.length === 0) ? (
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
            {/* Horizontal Featured News Carousel (ONLY on Latest News tab when matching news exist) */}
            {activeSegment === 'news' && featuredNews.length > 0 && (
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
                        {/* Category Badge */}
                        <View style={{
                          alignSelf: 'flex-start',
                          backgroundColor: item.type === 'advisory' ? '#EF4444' : item.type === 'announcement' ? T.accent : 'rgba(0,0,0,0.5)',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                          marginBottom: 4,
                        }}>
                          <Text style={{ fontSize: 8, fontFamily: 'Octarine-Bold', color: '#FFFFFF', textTransform: 'uppercase' }}>
                            {item.type}
                          </Text>
                        </View>
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
                {activeSegment === 'news' ? 'Latest News' : activeSegment === 'advisories' ? 'Advisories & Announcements' : 'Archived News'}
              </Text>

              {/* Render first item as a Large visual card if on latest segment */}
              {activeSegment === 'news' && latestNews.length > 0 && (
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
                        {/* Category Badge */}
                        <View style={{
                          alignSelf: 'flex-start',
                          backgroundColor: firstItem.type === 'advisory' ? '#EF4444' : firstItem.type === 'announcement' ? T.accent : 'rgba(0,0,0,0.5)',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 4,
                          marginBottom: 6,
                        }}>
                          <Text style={{ fontSize: 9, fontFamily: 'Octarine-Bold', color: '#FFFFFF', textTransform: 'uppercase' }}>
                            {firstItem.type}
                          </Text>
                        </View>
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
              {(activeSegment === 'news' ? latestNews.slice(1) : latestNews).map((item) => (
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
                    {/* Category Badge */}
                    <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                      <View style={{
                        backgroundColor: item.type === 'advisory' ? '#EF4444' : item.type === 'announcement' ? T.accent : T.textMuted,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}>
                        <Text style={{ fontSize: 9, fontFamily: 'Octarine-Bold', color: '#FFFFFF', textTransform: 'uppercase' }}>
                          {item.type}
                        </Text>
                      </View>
                    </View>
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
