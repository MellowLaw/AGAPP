import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { globalStyles, ACCENT, PASTELS } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export function HomeScreen({ navigation }: any) {
  const { T, isDarkMode } = useTheme();
  const { profile, selectedLgu } = useAuth();
  const [news, setNews] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!selectedLgu || !profile) return;

    const fetchDashboardData = async () => {
      // Fetch news
      const { data: newsData } = await supabase
        .from('news_announcements')
        .select('*')
        .eq('lgu_id', selectedLgu.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(5);
      
      if (newsData) setNews(newsData);

      // Fetch unread notifications count
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);
      
      setUnreadCount(count || 0);
    };

    fetchDashboardData();
  }, [selectedLgu, profile]);

  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Citizen';
  const lguColor = isDarkMode ? T.card : (selectedLgu?.primary_color || PASTELS.sage);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={[globalStyles.muted, { color: T.textMuted }]}>Magandang araw,</Text>
            <Text style={[globalStyles.serif, { color: T.text, fontSize: 24, marginTop: 2 }]}>
              {firstName}.
            </Text>
          </View>
          <TouchableOpacity
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.card, borderColor: T.border, borderWidth: 1, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={T.text} />
            {unreadCount > 0 && (
              <View style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT }} />
            )}
          </TouchableOpacity>
        </View>

        {/* Hero LGU Card */}
        <View style={[styles.heroCard, { backgroundColor: lguColor }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>YOUR MUNICIPALITY</Text>
              <Text style={styles.heroLgu}>{selectedLgu?.name.replace('Municipality of ', '')}</Text>
              <Text style={styles.heroBarangay}>Barangay {profile?.barangay || 'Poblacion'}</Text>
            </View>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickGrid}>
          {[
            { icon: 'document-text-outline', label: 'Apply',      onPress: () => navigation.navigate('ServicesTab'), color: PASTELS.sage },
            { icon: 'camera-outline',        label: 'Report',     onPress: () => navigation.navigate('ReportsTab'),  color: PASTELS.pink },
            { icon: 'map-outline',           label: 'Explore',    onPress: () => navigation.navigate('MapTab'),      color: PASTELS.butter },
            { icon: 'chatbubble-outline',    label: 'Assistant',  onPress: () => navigation.navigate('ChatbotTab'),  color: PASTELS.cream },
            { icon: 'people-outline',        label: 'Forum',      onPress: () => navigation.navigate('Forum'),       color: PASTELS.blue },
            { icon: 'person-outline',        label: 'Profile',    onPress: () => navigation.navigate('Profile'),     color: PASTELS.lilac },
          ].map(a => (
            <TouchableOpacity key={a.label} style={[styles.quickItem, { backgroundColor: a.color }]} onPress={a.onPress} activeOpacity={0.85}>
              <Ionicons name={a.icon as any} size={26} color="#1A1A1A" />
              <Text style={styles.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* News carousel */}
        <View style={globalStyles.sectionHeader}>
          <Text style={[globalStyles.sectionTitle, { color: T.text }]}>What's happening</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
          {news.length === 0 ? (
            <Text style={{ color: T.textMuted, marginVertical: 20 }}>No news published yet.</Text>
          ) : (
            news.map(n => (
              <TouchableOpacity key={n.id} style={[styles.newsCard, { backgroundColor: T.card, borderColor: T.border, borderWidth: 1 }]} onPress={() => navigation.navigate('NewsDetail', { newsId: n.id })}>
                <Text style={styles.newsTitle} numberOfLines={2}>{n.title}</Text>
                <Text style={styles.newsDate}>{new Date(n.published_at).toLocaleDateString()}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Emergency */}
        <View style={globalStyles.sectionHeader}>
          <Text style={[globalStyles.sectionTitle, { color: T.text }]}>Emergency hotlines</Text>
        </View>
        <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border, padding: 4 }]}>
          {[
            { name: 'Police (PNP)',     number: '117',  icon: 'shield-outline' },
            { name: 'Fire Bureau (BFP)', number: '160', icon: 'flame-outline' },
            { name: 'Medical / Rescue', number: '911',  icon: 'medkit-outline' },
          ].map((h, i, arr) => (
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
              <Ionicons name="call-outline" size={18} color={ACCENT} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroCard: { padding: 24, borderRadius: 24, marginBottom: 24 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: 'rgba(26,26,26,0.6)', marginBottom: 4 },
  heroLgu: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5, marginBottom: 2 },
  heroBarangay: { fontSize: 15, fontWeight: '500', color: 'rgba(26,26,26,0.8)' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  quickItem: { width: '48%', padding: 20, borderRadius: 20, alignItems: 'center' },
  quickLabel: { marginTop: 12, fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  newsCard: { width: 220, padding: 20, borderRadius: 20, marginRight: 12 },
  newsTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12, lineHeight: 22 },
  newsDate: { fontSize: 12, fontWeight: '500', color: 'rgba(26,26,26,0.6)' },
  emergencyRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  emergencyIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
});
