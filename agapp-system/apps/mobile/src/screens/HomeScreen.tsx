import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Image, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenBackground } from '../components/ScreenBackground';
import { globalStyles } from '../theme';
import { reportCategoryLabel } from '@agapp/shared';
import {
  Briefcase,
  Danger,
  Scroll,
  DocumentText,
  Messages,
  Map,
  Notification,
  SearchNormal1,
  ArrowLeft2,
  ArrowRight2,
  Forward,
  Call,
} from 'iconsax-react-native';

// User hand-picked this exact glyph (Ionicons "chatbox-ellipses", bold/filled)
// for the Chatbot quick-action tile — no Iconsax icon matched it visually, so
// this one tile uses Ionicons (already bundled via @expo/vector-icons)
// instead. Wrapped so `quickActions` below can still treat every entry's
// `icon` field the same way (a component taking size+color).
function ChatboxIcon({ size, color }: { size: number; color: string; variant?: string }) {
  // `variant` is accepted (and ignored) because the quick-action grid below
  // renders every tile's icon uniformly with `variant="Bold"` — Ionicons has
  // no such prop, this glyph is already the filled/bold style by name.
  return <Ionicons name="chatbox-ellipses" size={size} color={color} />;
}

export function HomeScreen({ navigation }: any) {
  const { T, isDarkMode } = useTheme();
  const { session, profile, selectedLgu, guestLgu } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Magandang Umaga,';
    if (hour >= 11 && hour < 13) return 'Magandang Tanghali,';
    if (hour >= 13 && hour < 18) return 'Magandang Hapon,';
    return 'Magandang Gabi,';
  };

  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[currentDateTime.getDay()];
    const monthName = months[currentDateTime.getMonth()];
    const date = currentDateTime.getDate();
    
    let hours = currentDateTime.getHours();
    const minutes = currentDateTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    
    return `${dayName}, ${monthName} ${date} · ${hours}:${strMinutes} ${ampm}`;
  };
  const [activeTab, setActiveTab] = useState<'for_you' | 'community'>('for_you');
  const [news, setNews] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [trendingThread, setTrendingThread] = useState<any | null>(null);

  // Search Overlay State
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    news: any[];
    services: any[];
    offices: any[];
    forum: any[];
    reportCategories: any[];
    myReports: any[];
  }>({ news: [], services: [], offices: [], forum: [], reportCategories: [], myReports: [] });

  const activeLgu = selectedLgu || guestLgu || { id: 'liliw-laguna', name: 'Liliw, Laguna' };

  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResults({ news: [], services: [], offices: [], forum: [], reportCategories: [], myReports: [] });
      setSearching(false);
      return;
    }

    const REPORT_CATEGORIES = [
      { id: 'pothole',          label: 'Pothole', iconName: 'car' },
      { id: 'clogged_drainage', label: 'Drainage', iconName: 'water' },
      { id: 'stray_animal',     label: 'Stray Pets', iconName: 'paw' },
      { id: 'damaged_pole',     label: 'Damaged Pole', iconName: 'flash' },
    ];

    setSearching(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const query = searchText.trim();

        // Search local categories
        const matchingCategories = REPORT_CATEGORIES.filter(cat => 
          cat.label.toLowerCase().includes(query.toLowerCase())
        );
        
        // Concurrent Supabase queries filtered by active LGU context
        const queries: any[] = [
          supabase
            .from('news_announcements')
            .select('*')
            .eq('lgu_id', activeLgu.id)
            .ilike('title', `%${query}%`)
            .limit(5),
          supabase
            .from('lgu_services')
            .select('*')
            .eq('lgu_id', activeLgu.id)
            .ilike('name', `%${query}%`)
            .limit(5),
          supabase
            .from('lgu_facilities')
            .select('*')
            .eq('lgu_id', activeLgu.id)
            .ilike('name', `%${query}%`)
            .limit(5),
          supabase
            .from('forum_posts')
            .select('*, citizen:users!citizen_id(avatar_url)')
            .eq('lgu_id', activeLgu.id)
            .ilike('title', `%${query}%`)
            .limit(5),
        ];

        // Search submitted reports if citizen has a profile
        if (profile?.id) {
          queries.push(
            supabase
              .from('reports')
              .select('*')
              .eq('citizen_id', profile.id)
              .or(`description.ilike.%${query}%,category.ilike.%${query}%`)
              .limit(5)
          );
        } else {
          queries.push(Promise.resolve({ data: [] }));
        }

        const [newsRes, servicesRes, officesRes, forumRes, reportsRes] = await Promise.all(queries);

        setSearchResults({
          news: newsRes.data || [],
          services: servicesRes.data || [],
          offices: officesRes.data || [],
          forum: forumRes.data || [],
          reportCategories: matchingCategories,
          myReports: reportsRes.data || [],
        });
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [searchText, activeLgu.id, profile?.id]);

  useEffect(() => {
    const fetchPublicData = async () => {
      const { data: newsData } = await supabase
        .from('news_announcements')
        .select('*')
        .eq('lgu_id', activeLgu.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(5);

      if (newsData) setNews(newsData);

      // Fetch trending threads
      const { data: forumData } = await supabase
        .from('forum_posts')
        .select('*, citizen:users!citizen_id(avatar_url), forum_comments(id, is_approved, citizen:users!citizen_id(avatar_url, name))')
        .eq('lgu_id', activeLgu.id)
        .eq('is_approved', true)
        .limit(10);

      if (forumData) {
        const mapped = forumData.map((p: any) => {
          const approvedComments = (p.forum_comments || []).filter((c: any) => c.is_approved);
          
          // Get unique replier avatars
          const replierAvatars: string[] = [];
          approvedComments.forEach((c: any) => {
            const avatar = c.citizen?.avatar_url;
            if (avatar && !replierAvatars.includes(avatar)) {
              replierAvatars.push(avatar);
            }
          });

          // Fallbacks for avatar stack
          if (approvedComments.length > 0) {
            const presets = [
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80',
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80',
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop&q=80',
            ];
            while (replierAvatars.length < Math.min(3, approvedComments.length)) {
              const fallback = presets[replierAvatars.length % presets.length];
              replierAvatars.push(fallback);
            }
          }

          return {
            ...p,
            commentsCount: approvedComments.length,
            replierAvatars,
          };
        });

        // Sort by comments count to find top trending
        const sorted = mapped.sort((a, b) => b.commentsCount - a.commentsCount);
        if (sorted.length > 0) {
          setTrendingThread(sorted[0]);
        } else {
          setTrendingThread(null);
        }
      }
    };

    const fetchPrivateData = async () => {
      if (!profile) return;

      const { data: reportsData } = await supabase
        .from('reports')
        .select('*')
        .eq('citizen_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (reportsData) setReports(reportsData);

      const { data: requestsData } = await supabase
        .from('service_requests')
        .select('*')
        .eq('citizen_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (requestsData) setRequests(requestsData);

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    };

    fetchPublicData();
    fetchPrivateData();
  }, [activeLgu.id, profile]);

  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Citizen';

  const nextCarousel = () => {
    if (news.length > 0) {
      setCarouselIndex((prev) => (prev + 1) % news.length);
    }
  };

  const prevCarousel = () => {
    if (news.length > 0) {
      setCarouselIndex((prev) => (prev - 1 + news.length) % news.length);
    }
  };

  const getStatusBadge = (status: string) => {
    let bgColor = '#E5E7EB';
    let textColor = '#374151';

    switch (status?.toLowerCase()) {
      case 'submitted':
        bgColor = '#E0F2FE';
        textColor = '#0369A1';
        break;
      case 'in progress':
      case 'processing':
        bgColor = '#FEF3C7';
        textColor = '#D97706';
        break;
      case 'resolved':
      case 'completed':
      case 'approved':
        bgColor = '#D1FAE5';
        textColor = '#059669';
        break;
      case 'rejected':
      case 'cancelled':
        bgColor = '#FEE2E2';
        textColor = '#DC2626';
        break;
    }

    return (
      <View style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: bgColor,
      }}>
        <Text style={{
          fontSize: 9,
          fontFamily: 'Octarine-Bold',
          color: textColor,
          textTransform: 'uppercase',
        }}>{status}</Text>
      </View>
    );
  };

  const quickActions = [
    { icon: Briefcase, label: 'E-Services', onPress: () => navigation.navigate('ServicesTab') },
    { icon: Danger, label: 'Report', onPress: () => navigation.navigate('ReportsTab') },
    { icon: Scroll, label: 'Citizen Guide', onPress: () => navigation.navigate('Assistant', { initialQuery: 'Citizen Guide' }) },
    { icon: DocumentText, label: 'News', onPress: () => setActiveTab('community') },
    { icon: Messages, label: 'Forum', onPress: () => navigation.navigate('Forum') },
    { icon: ChatboxIcon, label: 'Chatbot', onPress: () => navigation.navigate('Assistant') },
    { icon: Map, label: 'Explore', onPress: () => navigation.navigate('Explore') },
    { icon: Call, label: 'Emergency', onPress: () => navigation.navigate('Emergency') },
  ];

  return (
    <ScreenBackground>
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      {/* Tabs navigation at the top */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingBottom: 0,
        marginTop: 8,
        gap: 36,
      }}>
        <TouchableOpacity
          onPress={() => setActiveTab('for_you')}
          activeOpacity={0.8}
          style={{
            paddingBottom: 6,
          }}
        >
          <Text style={{
            color: activeTab === 'for_you' ? T.text : T.textMuted,
            fontFamily: 'Octarine-Bold',
            fontSize: 18,
          }}>
            For you
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('community')}
          activeOpacity={0.8}
          style={{
            paddingBottom: 6,
          }}
        >
          <Text style={{
            color: activeTab === 'community' ? T.text : T.textMuted,
            fontFamily: 'Octarine-Bold',
            fontSize: 18,
          }}>
            Community
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar & Notification Row */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 16,
        marginBottom: 8,
        gap: 12,
      }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setShowSearchModal(true)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: T.card,
            borderWidth: 1,
            borderColor: T.border,
            borderRadius: 999,
            height: 48,
            paddingHorizontal: 16,
            gap: 10,
          }}
        >
          <SearchNormal1 size={20} color={T.textMuted} variant="Outline" />
          <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 14 }}>
            Search services, news...
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (!session || !selectedLgu) {
              Alert.alert('Sign in required', 'Sign in to view your notifications.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign In', onPress: () => navigation.navigate('Login') },
              ]);
              return;
            }
            navigation.navigate('Notifications');
          }}
          activeOpacity={0.7}
          style={{
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Notification size={26} color={T.text} variant="Bold" />
          {unreadCount > 0 && (
            <View style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: T.accent,
            }} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        
        {/* TAB 1: FOR YOU */}
        {activeTab === 'for_you' && (
          <View style={{ paddingHorizontal: 20 }}>
            {/* Greeting & Location Meta Block */}
            <View style={{ marginTop: 12, marginBottom: 16 }}>
              {(() => {
                const lguName = (activeLgu?.name || 'Municipality of Liliw').replace(/^Municipality of\s*/i, '');
                const lguId = activeLgu?.id || 'liliw-laguna';
                const parts = lguId.split('-');
                const rawProvince = parts.length > 1 ? parts[parts.length - 1] : '';
                const province = rawProvince.charAt(0).toUpperCase() + rawProvince.slice(1);
                
                const cleanLocation = lguName.toLowerCase().includes(province.toLowerCase())
                  ? lguName
                  : `${lguName}, ${province}`;

                const rawBarangay = session && profile?.barangay ? profile.barangay : 'Poblacion';
                const barangay = rawBarangay.toLowerCase().startsWith('brgy') 
                  ? rawBarangay 
                  : `Brgy. ${rawBarangay}`;

                return (
                  <Text style={{ fontSize: 12, fontFamily: 'Inter-Medium', color: T.textMuted }}>
                    {barangay} · {cleanLocation} · {formatDateTime()}
                  </Text>
                );
              })()}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 32, lineHeight: 36 }}>
                  {getGreeting()}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 2 }}>
                  <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 32, lineHeight: 34 }}>
                    {firstName}!
                  </Text>
                  <Image
                    source={require('../../assets/brand/mascot.png')}
                    style={{ width: 56, height: 28, marginLeft: 8, marginBottom: 3 }}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {(() => {
                const activeLgu = session ? selectedLgu : guestLgu;
                const lguLogoSource = activeLgu?.id === 'liliw-laguna'
                  ? require('../../assets/brand/liliw-seal.jpg')
                  : activeLgu?.logo && activeLgu.logo.startsWith('http')
                    ? { uri: activeLgu.logo }
                    : require('../../assets/brand/liliw-seal.jpg');

                return (
                  <Image
                    source={lguLogoSource}
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 34,
                      borderWidth: 1.5,
                      borderColor: T.border,
                      marginLeft: 16,
                      backgroundColor: '#FFFFFF',
                    }}
                    resizeMode="contain"
                  />
                );
              })()}
            </View>
            </View>

            {/* Quick Actions Grid Card */}
            <View style={{
              backgroundColor: T.card,
              borderWidth: 1,
              borderColor: T.border,
              borderRadius: 28,
              padding: 20,
              marginBottom: 20,
            }}>
              <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 16, color: T.text, marginBottom: 16, paddingLeft: 4 }}>
                What would you like to do?
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {quickActions.map((action, idx) => (
                  <View
                    key={idx}
                    style={{
                      width: '23%',
                      alignItems: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <TouchableOpacity
                      onPress={action.onPress}
                      activeOpacity={0.7}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: T.border,
                        backgroundColor: isDarkMode ? '#3A3A33' : '#FFFFFF',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      {/* Only these quick-action icons react to the LGU's
                          customized icon color (falls back to the nav accent
                          when not separately set) — everything else in the
                          app stays on theme tokens by design. */}
                      <action.icon size={36} color={T.iconAccent} variant="Bold" />
                    </TouchableOpacity>
                    <Text style={{
                      fontFamily: 'Inter-Medium',
                      fontSize: 12,
                      color: T.text,
                      textAlign: 'center',
                      lineHeight: 14,
                    }} numberOfLines={2}>
                      {action.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Guest Sign-In CTA Card */}
            {!session && (
              <View style={{
                backgroundColor: '#3F3D56',
                borderRadius: 24,
                padding: 24,
                marginBottom: 20,
                overflow: 'hidden',
                position: 'relative',
              }}>
                {/* Decorative background shapes */}
                <View style={{
                  position: 'absolute',
                  right: -30,
                  top: -30,
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                }} />
                <View style={{
                  position: 'absolute',
                  right: -10,
                  bottom: -40,
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                }} />

                <Text style={{
                  fontFamily: 'Octarine-Bold',
                  fontSize: 20,
                  color: '#FFFFFF',
                  marginBottom: 8,
                }}>
                  Help us improve our city
                </Text>
                
                <Text style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 20,
                  marginBottom: 20,
                }}>
                  Create an account to report local issues directly to the city.
                </Text>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#FFFFFF',
                    height: 48,
                    borderRadius: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => navigation.navigate('Login', { initialMode: 'login' })}
                  activeOpacity={0.9}
                >
                  <Text style={{
                    fontFamily: 'Octarine-Bold',
                    fontSize: 15,
                    color: '#292929',
                  }}>
                    Sign in
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Featured Section Header */}
            <Text style={{
              fontFamily: 'Octarine-Bold',
              fontSize: 20,
              color: T.text,
              marginTop: 8,
              marginBottom: 14,
            }}>
              Featured
            </Text>

            {/* Featured Carousel Card */}
            {news.length > 0 ? (
              <View style={{
                backgroundColor: T.card,
                borderWidth: 1,
                borderColor: T.border,
                borderRadius: 24,
                overflow: 'hidden',
                marginBottom: 20,
                height: 195,
                position: 'relative',
              }}>
                {/* News Image Base (if exists) */}
                {(() => {
                  const item = news[carouselIndex];
                  const imageAttachment = Array.isArray(item.attachments)
                    ? item.attachments.find((att: any) => att.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)/i.test(att.url))
                    : null;
                  
                  if (!imageAttachment) {
                    return (
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.accent + '15' }} />
                    );
                  }

                  return (
                    <Image
                      source={{ uri: imageAttachment.url }}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.border }}
                      resizeMode="cover"
                    />
                  );
                })()}

                {/* White blend gradient overlay over the image (full height for seamless bleed) */}
                <LinearGradient
                  colors={[`${T.card}00`, `${T.card}99`, T.card]}
                  locations={[0, 0.35, 0.85]}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />

                {/* Centered big chevrons navigation without backgrounds or borders */}
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                }} pointerEvents="box-none">
                  <TouchableOpacity 
                    onPress={prevCarousel} 
                    activeOpacity={0.6}
                    style={{
                      padding: 8,
                    }}
                  >
                    <ArrowLeft2 size={36} color={T.text} variant="Outline" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={nextCarousel}
                    activeOpacity={0.6}
                    style={{
                      padding: 8,
                    }}
                  >
                    <ArrowRight2 size={36} color={T.text} variant="Outline" />
                  </TouchableOpacity>
                </View>

                {/* Text & Button content row (placed absolutely at bottom) */}
                <View style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  paddingHorizontal: 20,
                  paddingBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                  <Text style={{
                    fontFamily: 'Octarine-Bold',
                    fontSize: 18,
                    color: T.text,
                    lineHeight: 22,
                    flex: 1,
                  }} numberOfLines={2}>
                    {news[carouselIndex].title}
                  </Text>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('NewsDetail', { newsId: news[carouselIndex].id })}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: T.accent,
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 13, color: T.onAccent }}>View</Text>
                    <Forward size={16} color={T.onAccent} variant="Bold" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{
                backgroundColor: T.card,
                borderWidth: 1,
                borderColor: T.border,
                borderRadius: 24,
                padding: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: T.textMuted }}>
                  No featured updates at this time.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 2: COMMUNITY / ANNOUNCEMENTS */}
        {activeTab === 'community' && (
          <View style={{ paddingHorizontal: 20 }}>
            {/* Trending Discussion Section */}
            {trendingThread && (
              <>
                <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 18, color: T.text, marginTop: 12, marginBottom: 12 }}>
                  Trending Discussion
                </Text>
                
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('Forum', { initialPostId: trendingThread.id })}
                  style={{
                    backgroundColor: T.card,
                    borderWidth: 1,
                    borderColor: T.border,
                    borderRadius: 24,
                    padding: 20,
                    marginBottom: 20,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    {/* Badge */}
                    <View style={{
                      backgroundColor: '#FADEE1',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 12,
                    }}>
                      <Text style={{ fontSize: 10, fontFamily: 'Octarine-Bold', color: '#7E2532' }}>
                        #{trendingThread.category || 'General'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, fontFamily: 'Inter-Medium', color: T.textMuted }}>
                      {trendingThread.created_at ? new Date(trendingThread.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 18, fontFamily: 'Octarine-Bold', color: T.text, lineHeight: 22, marginBottom: 8 }}>
                    {trendingThread.title}
                  </Text>

                  <Text style={{ fontSize: 13, fontFamily: 'Inter-Medium', color: T.textMuted, lineHeight: 18, marginBottom: 16 }} numberOfLines={3}>
                    {trendingThread.content}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: T.border, paddingTop: 12 }}>
                    {/* Replier Avatars Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', marginRight: 8 }}>
                        {trendingThread.replierAvatars?.slice(0, 3).map((url: string, index: number) => (
                          <View
                            key={index}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              borderWidth: 1.5,
                              borderColor: T.card,
                              marginLeft: index === 0 ? 0 : -8,
                              backgroundColor: T.border,
                              overflow: 'hidden',
                              zIndex: 3 - index,
                            }}
                          >
                            <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} />
                          </View>
                        ))}
                      </View>
                      <Text style={{ fontSize: 12, fontFamily: 'Octarine-Bold', color: T.text }}>
                        +{trendingThread.commentsCount || 0} replies
                      </Text>
                    </View>

                    {/* Action text */}
                    <Text style={{ fontSize: 12, fontFamily: 'Octarine-Bold', color: T.accent }}>
                      Join Discussion &rarr;
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* Announcements Section */}
            <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 18, color: T.text, marginTop: 12, marginBottom: 12 }}>
              Announcements
            </Text>
            {news.length === 0 ? (
              <View style={{
                backgroundColor: T.cardAlt,
                borderWidth: 1,
                borderColor: T.border,
                borderRadius: 20,
                padding: 32,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}>
                <DocumentText size={32} color={T.textMuted} variant="Bold" />
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginTop: 12, textAlign: 'center' }}>
                  No announcements published yet.
                </Text>
              </View>
            ) : (
              news.map((n) => {
                const imageAttachment = Array.isArray(n.attachments)
                  ? n.attachments.find((att: any) => att.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)/i.test(att.url))
                  : null;
                const imageUrl = imageAttachment?.url || activeLgu.banner_url || 'https://placehold.co/800x400/A2B59F/1A1A1A?text=Announcement';
                
                return (
                  <View
                    key={n.id}
                    style={{
                      backgroundColor: T.card,
                      borderWidth: 1,
                      borderColor: T.border,
                      borderRadius: 24, // High-end radii
                      marginBottom: 16,
                      overflow: 'hidden',
                    }}
                  >
                    {/* 1. Image block at the top */}
                    <Image
                      source={{ uri: imageUrl }}
                      style={{ width: '100%', height: 180, backgroundColor: T.border }}
                      resizeMode="cover"
                    />

                    {/* 2. Content section */}
                    <View style={{ padding: 20 }}>
                      {/* Title */}
                      <Text style={{ fontSize: 22, fontFamily: 'Octarine-Bold', color: T.text, lineHeight: 26, marginBottom: 6 }}>
                        {n.title}
                      </Text>

                      {/* Date */}
                      <Text style={{ fontSize: 12, fontFamily: 'Inter-Medium', color: T.textMuted, marginBottom: 12 }}>
                        {new Date(n.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </Text>

                      {/* Description with blend cover & button */}
                      <View style={{ position: 'relative' }}>
                        <Text style={{ fontSize: 14, fontFamily: 'Inter-Medium', color: T.text, lineHeight: 20, paddingBottom: 64 }} numberOfLines={4}>
                          {n.body || n.content}
                        </Text>
                        
                        {/* Blend gradient overlay at the bottom fading out text (blends with T.card) */}
                        <LinearGradient
                          colors={[`${T.card}00`, `${T.card}CC`, T.card]}
                          locations={[0, 0.45, 0.9]}
                          style={{
                            position: 'absolute',
                            left: -20,
                            right: -20,
                            bottom: -20,
                            height: 110,
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            paddingBottom: 20,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => navigation.navigate('NewsDetail', { newsId: n.id })}
                            activeOpacity={0.85}
                            style={{
                              backgroundColor: '#292929', // Solid high-contrast black ink button
                              borderRadius: 999, // Perfect pill shape
                              paddingHorizontal: 24,
                              paddingVertical: 10,
                              borderWidth: 1,
                              borderColor: T.border,
                              elevation: 3,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.1,
                              shadowRadius: 4,
                            }}
                          >
                            <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 13, color: '#FFFFFF' }}>
                              Read Full Article
                            </Text>
                          </TouchableOpacity>
                        </LinearGradient>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

      </ScrollView>

      <Modal
        visible={showSearchModal}
        animationType="slide"
        onRequestClose={() => {
          setShowSearchModal(false);
          setSearchText('');
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
          {/* Top header search input row */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
            gap: 10,
          }}>
            {/* Pill Search Input */}
            <View style={{
              flex: 1,
              flexDirection: 'row',
              height: 48,
              borderRadius: 24,
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
                  fontSize: 15,
                  fontFamily: 'Inter-Medium',
                  color: T.text,
                }}
                placeholder="Search news, services, offices..."
                placeholderTextColor={T.textMuted}
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
              />
              {searchText !== '' && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={20} color={T.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Circular Close Button */}
            <TouchableOpacity
              onPress={() => {
                setShowSearchModal(false);
                setSearchText('');
              }}
              activeOpacity={0.8}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: T.cardAlt,
                borderWidth: 1,
                borderColor: T.border,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="close" size={24} color={T.text} />
            </TouchableOpacity>
          </View>

          {/* Search Results Area */}
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {searching ? (
              <ActivityIndicator color={T.text} style={{ marginTop: 40 }} />
            ) : searchText.trim() === '' ? (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <SearchNormal1 size={48} color={T.textMuted} variant="Linear" style={{ marginBottom: 12 }} />
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, textAlign: 'center', fontSize: 14 }}>
                  Type keywords to search news articles, civic services, government offices, or community discussions.
                </Text>
              </View>
            ) : (searchResults.news.length === 0 &&
                 searchResults.services.length === 0 &&
                 searchResults.offices.length === 0 &&
                 searchResults.forum.length === 0 &&
                 searchResults.reportCategories.length === 0 &&
                 searchResults.myReports.length === 0) ? (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 18, marginBottom: 8 }}>
                  No Results Found
                </Text>
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, textAlign: 'center', fontSize: 14 }}>
                  We couldn't find anything matching "{searchText}". Try checking your spelling or search terms.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 20, marginTop: 10 }}>
                {/* 1. Articles / News Results */}
                {searchResults.news.length > 0 && (
                  <View style={{
                    backgroundColor: T.card,
                    borderWidth: 1,
                    borderColor: T.border,
                    borderRadius: 24,
                    padding: 20,
                  }}>
                    <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 15, color: T.textMuted, marginBottom: 16 }}>
                      Articles
                    </Text>
                    {searchResults.news.map((item, index) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          setShowSearchModal(false);
                          setSearchText('');
                          navigation.navigate('NewsDetail', { newsId: item.id });
                        }}
                        activeOpacity={0.7}
                        style={{
                          borderBottomWidth: index < searchResults.news.length - 1 ? 1 : 0,
                          borderBottomColor: T.border,
                          paddingVertical: 12,
                          paddingTop: index === 0 ? 0 : 12,
                        }}
                      >
                        <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 15, color: T.text, lineHeight: 20 }}>
                          {item.title}
                        </Text>
                        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: T.textMuted, marginTop: 4, lineHeight: 18 }} numberOfLines={2}>
                          {item.body || item.content}
                        </Text>
                        <Text style={{ fontSize: 11, fontFamily: 'Inter-Medium', color: T.textMuted, marginTop: 8 }}>
                          {new Date(item.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* 2. Services Results */}
                {searchResults.services.length > 0 && (
                  <View style={{
                    backgroundColor: T.card,
                    borderWidth: 1,
                    borderColor: T.border,
                    borderRadius: 24,
                    padding: 20,
                  }}>
                    <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 15, color: T.textMuted, marginBottom: 16 }}>
                      Services
                    </Text>
                    {searchResults.services.map((item, index) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          setShowSearchModal(false);
                          setSearchText('');
                          navigation.navigate('ServicesTab');
                        }}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          borderBottomWidth: index < searchResults.services.length - 1 ? 1 : 0,
                          borderBottomColor: T.border,
                          paddingVertical: 12,
                          paddingTop: index === 0 ? 0 : 12,
                        }}
                      >
                        {/* PDF Icon */}
                        <View style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: '#FEE2E2',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12,
                        }}>
                          <Ionicons name="document-text" size={20} color="#DC2626" />
                        </View>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 14, color: T.text, lineHeight: 18 }}>
                            {item.name}
                          </Text>
                          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                            Office: {item.office_name}
                          </Text>
                        </View>
                        <Forward size={18} color={T.textMuted} variant="Outline" style={{ transform: [{ rotate: '-45deg' }] }} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Report Categories */}
                {searchResults.reportCategories.length > 0 && (
                  <View style={{
                    backgroundColor: T.card,
                    borderWidth: 1,
                    borderColor: T.border,
                    borderRadius: 24,
                    padding: 20,
                  }}>
                    <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 15, color: T.textMuted, marginBottom: 16 }}>
                      Report Categories
                    </Text>
                    {searchResults.reportCategories.map((item, index) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          setShowSearchModal(false);
                          setSearchText('');
                          navigation.navigate('ReportsTab', { initialCategory: item.id });
                        }}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          borderBottomWidth: index < searchResults.reportCategories.length - 1 ? 1 : 0,
                          borderBottomColor: T.border,
                          paddingVertical: 12,
                          paddingTop: index === 0 ? 0 : 12,
                        }}
                      >
                        <View style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: T.accentSoft,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12,
                        }}>
                          <Danger size={18} color={T.accent} variant="Bold" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 15, color: T.text }}>
                            File a Report: {item.label}
                          </Text>
                          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                            Tap to submit a new report
                          </Text>
                        </View>
                        <Forward size={16} color={T.textMuted} variant="Outline" style={{ transform: [{ rotate: '-45deg' }] }} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* My Reports */}
                {searchResults.myReports.length > 0 && (
                  <View style={{
                    backgroundColor: T.card,
                    borderWidth: 1,
                    borderColor: T.border,
                    borderRadius: 24,
                    padding: 20,
                  }}>
                    <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 15, color: T.textMuted, marginBottom: 16 }}>
                      My Reports
                    </Text>
                    {searchResults.myReports.map((item, index) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          setShowSearchModal(false);
                          setSearchText('');
                          navigation.navigate('TrackingDetail', { id: item.id, type: 'report' });
                        }}
                        activeOpacity={0.7}
                        style={{
                          borderBottomWidth: index < searchResults.myReports.length - 1 ? 1 : 0,
                          borderBottomColor: T.border,
                          paddingVertical: 12,
                          paddingTop: index === 0 ? 0 : 12,
                        }}
                      >
                        <Text style={{ color: T.textMuted, fontSize: 11, fontFamily: 'Inter-Medium' }}>
                          {item.reference_number}
                        </Text>
                        <Text style={{ color: T.text, fontSize: 15, fontFamily: 'Octarine-Bold', marginTop: 2 }}>
                          {reportCategoryLabel(item.category)}
                        </Text>
                        <Text style={{ color: T.textMuted, fontSize: 13, fontFamily: 'Inter-Medium', marginTop: 4 }} numberOfLines={1}>
                          {item.description}
                        </Text>
                        <Text style={{ color: T.accent, fontSize: 12, fontFamily: 'Octarine-Bold', marginTop: 8 }}>
                          Status: {item.status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* 3. Government Offices / Facilities Results */}
                {searchResults.offices.length > 0 && (
                  <View style={{
                    backgroundColor: T.card,
                    borderWidth: 1,
                    borderColor: T.border,
                    borderRadius: 24,
                    padding: 20,
                  }}>
                    <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 15, color: T.textMuted, marginBottom: 16 }}>
                      Government Offices
                    </Text>
                    {searchResults.offices.map((item, index) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          setShowSearchModal(false);
                          setSearchText('');
                          navigation.navigate('Explore');
                        }}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          borderBottomWidth: index < searchResults.offices.length - 1 ? 1 : 0,
                          borderBottomColor: T.border,
                          paddingVertical: 12,
                          paddingTop: index === 0 ? 0 : 12,
                        }}
                      >
                        {/* Building Icon */}
                        <View style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: '#F3F4F6',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12,
                          borderWidth: 1,
                          borderColor: T.border,
                        }}>
                          <Ionicons name="business" size={18} color="#E11D48" />
                        </View>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 14, color: T.text, lineHeight: 18 }}>
                            {item.name}
                          </Text>
                          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                            {item.address || 'Municipality Address'}
                          </Text>
                        </View>
                        <Forward size={16} color={T.accent} variant="Bold" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* 4. Forum Discussion Results */}
                {searchResults.forum.length > 0 && (
                  <View style={{
                    backgroundColor: T.card,
                    borderWidth: 1,
                    borderColor: T.border,
                    borderRadius: 24,
                    padding: 20,
                  }}>
                    <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 15, color: T.textMuted, marginBottom: 16 }}>
                      Forum Discussions
                    </Text>
                    {searchResults.forum.map((item, index) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          setShowSearchModal(false);
                          setSearchText('');
                          navigation.navigate('Forum');
                        }}
                        activeOpacity={0.7}
                        style={{
                          borderBottomWidth: index < searchResults.forum.length - 1 ? 1 : 0,
                          borderBottomColor: T.border,
                          paddingVertical: 12,
                          paddingTop: index === 0 ? 0 : 12,
                        }}
                      >
                        <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 15, color: T.text, lineHeight: 20 }}>
                          {item.title}
                        </Text>
                        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: T.textMuted, marginTop: 4, lineHeight: 18 }} numberOfLines={2}>
                          {item.content}
                        </Text>
                        <Text style={{ fontSize: 11, fontFamily: 'Inter-Medium', color: T.textMuted, marginTop: 8 }}>
                          Started by {item.citizen_name || 'Citizen'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
    </ScreenBackground>
  );
}
