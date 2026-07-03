import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { globalStyles, ACCENT, PASTELS } from '../theme';
import { reportCategoryLabel } from '@agapp/shared';
import { Ionicons } from '@expo/vector-icons';

export function HomeScreen({ navigation }: any) {
  const { T, isDarkMode } = useTheme();
  const { profile, selectedLgu, guestLgu } = useAuth();
  const [activeTab, setActiveTab] = useState<'for_you' | 'updates' | 'activity'>('for_you');
  const [news, setNews] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Guests (no account) can still browse Home. Fall back to guestLgu (detected or selected)
  // or finally Liliw if not selected/skipped; logged-in users get the LGU they selected.
  const activeLgu = selectedLgu || guestLgu || { id: 'liliw-laguna', name: 'Liliw, Laguna' };

  useEffect(() => {
    // News & facilities only need an LGU id — fetch for guests too.
    const fetchPublicData = async () => {
      const { data: newsData } = await supabase
        .from('news_announcements')
        .select('*')
        .eq('lgu_id', activeLgu.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(5);

      if (newsData) setNews(newsData);

      const { data: facilitiesData } = await supabase
        .from('lgu_facilities')
        .select('*')
        .eq('lgu_id', activeLgu.id)
        .limit(5);

      if (facilitiesData) setFacilities(facilitiesData);
    };

    // Private data needs a logged-in profile.
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
  const lguColor = activeLgu.primary_color || activeLgu.primaryColor || ACCENT;

  // Localized mock landmarks fallback based on selected LGU for premium visual feel
  const getMockLandmarks = () => {
    if (activeLgu?.name?.toLowerCase().includes('liliw')) {
      return [
        { id: 'l1', name: 'Liliw Cold Springs', category: 'Nature & Parks', desc: 'Chill in crystal-clear mountain waters.', img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80' },
        { id: 'l2', name: 'St. John the Baptist Parish', category: 'Heritage', desc: 'Historic 16th-century red-brick church.', img: 'https://images.unsplash.com/photo-1548625361-155de0cbb55a?auto=format&fit=crop&w=400&q=80' },
        { id: 'l3', name: 'Gat Tayaw Street', category: 'Shopping', desc: 'The famous footwear shopping strip.', img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80' },
      ];
    }
    return [
      { id: 'n1', name: 'Nagcarlan Underground Cemetery', category: 'Heritage', desc: 'Unique historical underground burial site.', img: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=400&q=80' },
      { id: 'n2', name: 'Bunga Falls', category: 'Nature & Parks', desc: 'Twin waterfalls perfect for weekend outings.', img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80' },
      { id: 'n3', name: 'St. Bartholomew Church', category: 'Heritage', desc: 'Majestic Spanish colonial structure.', img: 'https://images.unsplash.com/photo-1438784471464-6c3e3870bb75?auto=format&fit=crop&w=400&q=80' },
    ];
  };

  const landmarksToShow = facilities.length > 0
    ? facilities.map(f => ({
        id: f.id,
        name: f.name,
        category: f.category || 'LGU Facility',
        desc: f.description || 'Visit and explore this local landmark.',
        img: f.photo_url || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80'
      }))
    : getMockLandmarks();

  // Status Badge styling helper for Activity Tab
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
      <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
        <Text style={[styles.statusText, { color: textColor }]}>{status}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      {/* ElevenReader-style Branding Header */}
      <View style={[styles.headerContainer, { borderColor: T.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[globalStyles.serif, { color: T.text, fontSize: 28, fontWeight: '700' }]}>
            Home
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerCircleBtn, { backgroundColor: T.cardAlt, borderColor: T.border }]}
            onPress={() => navigation.navigate('ServicesTab')}
          >
            <Ionicons name="search-outline" size={20} color={T.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerCircleBtn, { backgroundColor: T.cardAlt, borderColor: T.border }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={T.text} />
            {unreadCount > 0 && (
              <View style={[styles.badgeDot, { backgroundColor: ACCENT }]} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Pill Navigation Tabs */}
      <View style={styles.tabBarContainer}>
        {[
          { id: 'for_you', label: 'For you', icon: 'sparkles-outline' },
          { id: 'updates', label: 'Updates', icon: 'newspaper-outline' },
          { id: 'activity', label: 'Activity', icon: 'time-outline' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id as any)}
              style={[
                styles.tabItem,
                {
                  backgroundColor: isActive ? T.text : T.cardAlt,
                  borderColor: isActive ? T.text : T.border,
                }
              ]}
              activeOpacity={0.9}
            >
              <Ionicons name={tab.icon as any} size={15} color={isActive ? T.bg : T.textMuted} />
              <Text style={[styles.tabText, { color: isActive ? T.bg : T.text }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* TAB 1: FOR YOU */}
        {activeTab === 'for_you' && (
          <View style={{ paddingHorizontal: 20 }}>
            {/* Soft LGU Greeting Card */}
            <View style={[styles.greetingCard, { backgroundColor: T.cardAlt }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontSize: 13, color: T.textMuted, fontWeight: '600', letterSpacing: 0.5 }}>MAGANDANG ARAW</Text>
                <Text style={[globalStyles.serif, { color: T.text, fontSize: 24, marginTop: 4 }]}>
                  {firstName}.
                </Text>
                <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>
                  {profile?.barangay ? `Barangay ${profile.barangay} · ` : ''}{activeLgu?.name?.replace('Municipality of ', '') || 'Liliw, Laguna'}
                </Text>
              </View>
              {activeLgu?.logo ? (
                <Image source={{ uri: activeLgu.logo }} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: T.border }} />
              ) : (
                <Ionicons name="location-outline" size={32} color={lguColor} style={{ opacity: 0.8 }} />
              )}
            </View>

            {/* Quick Actions Grid (Compact flat style: no borders, no shadows) */}
            <Text style={[styles.sectionTitle, { color: T.text, marginTop: 12 }]}>E-Services & Actions</Text>
            <View style={styles.qantasGrid}>
              {[
                { icon: 'document-text-outline', label: 'Apply',      onPress: () => navigation.navigate('ServicesTab') },
                { icon: 'camera-outline',        label: 'Report',     onPress: () => navigation.navigate('ReportsTab')  },
                { icon: 'map-outline',           label: 'Explore',    onPress: () => navigation.navigate('MapTab')      },
                { icon: 'chatbubble-outline',    label: 'Assistant',  onPress: () => navigation.navigate('ChatbotTab')  },
                { icon: 'people-outline',        label: 'Forum',      onPress: () => navigation.navigate('Forum')       },
                { icon: 'person-outline',        label: 'Profile',    onPress: () => navigation.navigate('Profile')     },
              ].map((a) => (
                <View key={a.label} style={styles.qantasGridItem}>
                  <TouchableOpacity 
                    style={[styles.qantasIconCard, { backgroundColor: lguColor + '12' }]} 
                    onPress={a.onPress} 
                    activeOpacity={0.8}
                  >
                    <Ionicons name={a.icon as any} size={24} color={lguColor} />
                  </TouchableOpacity>
                  <Text style={[styles.qantasLabel, { color: T.text }]} numberOfLines={1}>{a.label}</Text>
                </View>
              ))}
            </View>

            {/* Recommended LGU News / Announcements (ElevenReader Style) */}
            <View style={globalStyles.sectionHeader}>
              <Text style={[globalStyles.sectionTitle, { color: T.text }]}>Suggested for you</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20, marginBottom: 24 }}>
              {news.length === 0 ? (
                <View style={[styles.recommendationCard, { backgroundColor: T.cardAlt, borderColor: T.border, borderWidth: 1, padding: 20, height: 130, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: T.textMuted, fontSize: 12 }}>No LGU updates yet.</Text>
                </View>
              ) : (
                news.map(n => (
                  <TouchableOpacity 
                    key={n.id} 
                    style={[styles.recommendationCard, { backgroundColor: T.card, borderColor: T.border, borderWidth: 1 }]}
                    onPress={() => navigation.navigate('NewsDetail', { newsId: n.id })}
                    activeOpacity={0.9}
                  >
                    <View style={{ height: 6, backgroundColor: lguColor }} />
                    <View style={styles.recommendationInfo}>
                      <Text style={[styles.recommendationTag, { color: lguColor }]}>LGU UPDATE</Text>
                      <Text style={[styles.recommendationTitle, { color: T.text }]} numberOfLines={1}>{n.title}</Text>
                      <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 4, height: 34 }} numberOfLines={2}>{n.body || n.content}</Text>
                      <Text style={{ fontSize: 10, color: T.textMuted, marginTop: 8, fontWeight: '500' }}>{new Date(n.published_at).toLocaleDateString()}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Emergency Hotline Strip */}
            <View style={globalStyles.sectionHeader}>
              <Text style={[globalStyles.sectionTitle, { color: T.text }]}>Emergency Hotlines</Text>
            </View>
            <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border, padding: 4, marginBottom: 20 }]}>
              {[
                { name: 'Police (PNP)',     number: '117',  icon: 'shield-outline' },
                { name: 'Fire Bureau (BFP)', number: '160', icon: 'flame-outline' },
                { name: 'Medical / Rescue', number: '911',  icon: 'medkit-outline' },
              ].map((h, i) => (
                <TouchableOpacity
                  key={h.name}
                  style={[styles.emergencyRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: T.border }]}
                  onPress={() => Linking.openURL(`tel:${h.number}`)}
                >
                  <View style={[styles.emergencyIcon, { backgroundColor: T.cardAlt }]}>
                    <Ionicons name={h.icon as any} size={18} color={T.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: T.text, fontWeight: '600' }}>{h.name}</Text>
                    <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Tap to dial · {h.number}</Text>
                  </View>
                  <Ionicons name="call-outline" size={18} color={lguColor} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* TAB 2: UPDATES / ANNOUNCEMENTS */}
        {activeTab === 'updates' && (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={[styles.sectionTitle, { color: T.text, marginBottom: 16 }]}>What's happening</Text>
            {news.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: T.cardAlt, borderColor: T.border }]}>
                <Ionicons name="newspaper-outline" size={36} color={T.textMuted} />
                <Text style={{ color: T.textMuted, marginTop: 12, textAlign: 'center' }}>No news published yet.</Text>
              </View>
            ) : (
              news.map(n => (
                <TouchableOpacity 
                  key={n.id} 
                  style={[styles.updateCard, { backgroundColor: T.card, borderColor: T.border, borderWidth: 1 }]} 
                  onPress={() => navigation.navigate('NewsDetail', { newsId: n.id })}
                  activeOpacity={0.8}
                >
                  <View style={styles.updateHeader}>
                    <View style={[styles.updateBadge, { backgroundColor: lguColor + '15' }]}>
                      <Text style={{ color: lguColor, fontSize: 11, fontWeight: '700' }}>ANNOUNCEMENT</Text>
                    </View>
                    <Text style={styles.updateDate}>{new Date(n.published_at).toLocaleDateString()}</Text>
                  </View>
                  <Text style={[styles.updateTitle, { color: T.text }]} numberOfLines={2}>{n.title}</Text>
                  <Text style={[styles.updateBody, { color: T.textMuted }]} numberOfLines={3}>{n.body || n.content}</Text>
                  <View style={styles.readMoreRow}>
                    <Text style={{ color: lguColor, fontWeight: '600', fontSize: 13 }}>Read full article</Text>
                    <Ionicons name="arrow-forward" size={14} color={lguColor} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* TAB 3: ACTIVITY TRACKING */}
        {activeTab === 'activity' && (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={[styles.sectionTitle, { color: T.text, marginBottom: 16 }]}>Your Activity & Requests</Text>
            
            {reports.length === 0 && requests.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: T.cardAlt, borderColor: T.border }]}>
                <Ionicons name="time-outline" size={36} color={T.textMuted} />
                <Text style={{ color: T.textMuted, marginTop: 12, textAlign: 'center', lineHeight: 20 }}>
                  No recent activity found. Apply for services or file reports to track them here.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {/* Render requests */}
                {requests.map(req => (
                  <View key={req.id} style={[styles.activityCard, { backgroundColor: T.card, borderColor: T.border }]}>
                    <View style={styles.activityHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="document-text-outline" size={16} color={lguColor} />
                        <Text style={[styles.activityCategory, { color: T.text }]}>{req.service_type || 'Service request'}</Text>
                      </View>
                      {getStatusBadge(req.status)}
                    </View>
                    <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Ref: {req.reference_number || req.id.substring(0, 8).toUpperCase()}</Text>
                    <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Filed: {new Date(req.created_at).toLocaleDateString()}</Text>
                  </View>
                ))}

                {/* Render reports */}
                {reports.map(rep => (
                  <View key={rep.id} style={[styles.activityCard, { backgroundColor: T.card, borderColor: T.border }]}>
                    <View style={styles.activityHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="camera-outline" size={16} color={lguColor} />
                        <Text style={[styles.activityCategory, { color: T.text }]}>{rep.category ? reportCategoryLabel(rep.category).toUpperCase() : 'Incident Report'}</Text>
                      </View>
                      {getStatusBadge(rep.status)}
                    </View>
                    <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }} numberOfLines={1}>{rep.description}</Text>
                    <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Filed: {new Date(rep.created_at).toLocaleDateString()}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lguLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  lguFallbackIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tabBarContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginVertical: 12,
  },
  greetingCard: {
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  qantasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: 16,
    rowGap: 12,
    marginBottom: 16,
  },
  qantasGridItem: {
    width: '21.5%',
    alignItems: 'center',
  },
  qantasIconCard: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qantasLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  recommendationCard: {
    width: 220,
    borderRadius: 20,
    marginRight: 14,
    overflow: 'hidden',
  },
  recommendationInfo: {
    padding: 12,
  },
  recommendationTag: {
    fontSize: 9,
    fontWeight: '800',
    color: ACCENT,
    letterSpacing: 0.5,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  emergencyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emptyState: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  updateCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 14,
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  updateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  updateDate: {
    fontSize: 11,
    color: 'gray',
  },
  updateTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  updateBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityCategory: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});

