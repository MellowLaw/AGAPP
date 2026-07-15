import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Image, Alert } from 'react-native';
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
  const [activeTab, setActiveTab] = useState<'for_you' | 'community'>('for_you');
  const [news, setNews] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const activeLgu = selectedLgu || guestLgu || { id: 'liliw-laguna', name: 'Liliw, Laguna' };

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
    { icon: Call, label: 'Emergency', onPress: () => {
        Alert.alert('Emergency Hotlines', 'Call the municipal emergency rescue center?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call 911', onPress: () => Linking.openURL('tel:911') },
        ]);
      }
    },
  ];

  return (
    <ScreenBackground>
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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
          onPress={() => navigation.navigate('ServicesTab')}
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

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
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
                
                const rawBarangay = profile?.barangay || 'Poblacion';
                const barangay = rawBarangay.toLowerCase().startsWith('brgy') 
                  ? rawBarangay 
                  : `Brgy. ${rawBarangay}`;
                
                return (
                  <Text style={{ fontSize: 13, fontFamily: 'Inter-Medium', color: T.text }}>
                    {barangay} | {lguName}, {province}
                  </Text>
                );
              })()}
              <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 32, marginTop: 6, lineHeight: 36 }}>
                Magandang Araw,{'\n'}{firstName}!
              </Text>
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
                      <action.icon size={36} color={T.text} variant="Bold" />
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
                    <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 13, color: '#292929' }}>View</Text>
                    <Forward size={16} color="#292929" variant="Bold" />
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

            {/* Emergency Hotline Strip */}
            <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 16, color: T.text, marginBottom: 10 }}>Emergency Hotlines</Text>
            <View style={{ backgroundColor: T.card, borderWidth: 1, borderColor: T.border, borderRadius: 24, padding: 4 }}>
              {[
                { name: 'Police (PNP)', number: '117' },
                { name: 'Fire Bureau (BFP)', number: '160' },
                { name: 'Medical / Rescue', number: '911' },
              ].map((h, i) => (
                <TouchableOpacity
                  key={h.name}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderBottomWidth: i < 2 ? 1 : 0,
                    borderBottomColor: T.border,
                  }}
                  onPress={() => Linking.openURL(`tel:${h.number}`)}
                >
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: T.cardAlt,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                    <Call size={18} color={T.text} variant="Bold" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: T.text, fontFamily: 'Octarine-Bold', fontSize: 14 }}>{h.name}</Text>
                    <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 11, marginTop: 2 }}>Tap to call · {h.number}</Text>
                  </View>
                  <Text style={{ color: T.accent, fontFamily: 'Octarine-Bold', fontSize: 14 }}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* TAB 2: COMMUNITY / ANNOUNCEMENTS */}
        {activeTab === 'community' && (
          <View style={{ paddingHorizontal: 20 }}>
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
    </SafeAreaView>
    </ScreenBackground>
  );
}
