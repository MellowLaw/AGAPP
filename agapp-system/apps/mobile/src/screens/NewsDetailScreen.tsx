import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { globalStyles, PASTELS } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export function NewsDetailScreen({ route, navigation }: any) {
  const { newsId } = route.params;
  const { T } = useTheme();
  const [news, setNews] = useState<any>(null);

  useEffect(() => {
    const fetchNews = async () => {
      const { data } = await supabase.from('news_announcements').select('*').eq('id', newsId).single();
      if (data) setNews(data);
    };
    fetchNews();
  }, [newsId]);

  if (!news) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <View style={[globalStyles.screen, { backgroundColor: T.bg }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: T.card, borderBottomWidth: 1, borderColor: T.border }}>
          <Ionicons name="arrow-back" size={24} color={T.text} onPress={() => navigation.goBack()} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: PASTELS.sage, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#1A1A1A' }}>Announcement</Text>
          </View>

          <Text style={[globalStyles.serif, { color: T.text, fontSize: 32, marginBottom: 12 }]}>{news.title}</Text>
          
          <Text style={{ color: T.textMuted, fontSize: 14, fontWeight: '500', marginBottom: 32 }}>
            Published on {new Date(news.published_at).toLocaleDateString()}
          </Text>

          <Text style={{ color: T.text, fontSize: 16, lineHeight: 26 }}>
            {news.content}
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
