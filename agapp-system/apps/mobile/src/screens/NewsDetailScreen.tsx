import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { PASTELS } from '../theme';
import { ArrowLeft2, DocumentText, Danger } from 'iconsax-react-native';
import { ScreenBackground } from '../components/ScreenBackground';

export function NewsDetailScreen({ route, navigation }: any) {
  const { newsId } = route.params;
  const { T, isDarkMode } = useTheme();
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      const { data } = await supabase.from('news_announcements').select('*').eq('id', newsId).single();
      if (data) setNews(data);
      setLoading(false);
    };
    fetchNews();
  }, [newsId]);

  if (!news) {
    return (
      <ScreenBackground>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                <ArrowLeft2 size={30} color={T.text} variant="Outline" />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              {loading ? (
                <ActivityIndicator size="large" color={T.text} />
              ) : (
                <>
                  <Danger size={40} color={T.textMuted} variant="Bold" style={{ marginBottom: 12 }} />
                  <Text style={{ color: T.text, fontFamily: 'Octarine-Bold', fontSize: 18, textAlign: 'center' }}>Not Found</Text>
                  <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 14, textAlign: 'center', marginTop: 6 }}>
                    This announcement could not be found, or you don't have access.
                  </Text>
                </>
              )}
            </View>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  const imageAttachment = Array.isArray(news.attachments)
    ? news.attachments.find((att: any) => att.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)/i.test(att.url))
    : null;
  const imageUrl = imageAttachment?.url || news.banner_url || news.photo_url || null;

  return (
    <ScreenBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <View style={{ flex: 1 }}>
          {/* Header row */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 16,
          }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
              <ArrowLeft2 size={30} color={T.text} variant="Outline" />
            </TouchableOpacity>
            <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 20, marginLeft: 16 }}>
              Announcement
            </Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
            {/* 1. Hero Cover Image with Overlay Tag */}
            {imageUrl ? (
              <View style={{ position: 'relative', marginBottom: 20 }}>
                <Image
                  source={{ uri: imageUrl }}
                  style={{
                    width: '100%',
                    height: 220,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: T.border,
                    backgroundColor: T.border,
                  }}
                  resizeMode="cover"
                />
                
                {/* Tag category label pill (absolute positioned on top of the image) */}
                <View style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: T.accentSoft,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 1.41,
                }}>
                  <DocumentText size={14} color="#292929" variant="Bold" />
                  <Text style={{ fontSize: 10, fontFamily: 'Octarine-Bold', color: '#292929' }}>ANNOUNCEMENT</Text>
                </View>
              </View>
            ) : (
              /* If no cover photo, still render the pill inline */
              <View style={{
                alignSelf: 'flex-start',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: T.accentSoft,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}>
                <DocumentText size={14} color="#292929" variant="Bold" />
                <Text style={{ fontSize: 10, fontFamily: 'Octarine-Bold', color: '#292929' }}>ANNOUNCEMENT</Text>
              </View>
            )}

            {/* Title */}
            <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 26, lineHeight: 32, marginBottom: 8 }}>
              {news.title}
            </Text>

            {/* Date */}
            <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 12, marginBottom: 20 }}>
              Published on {new Date(news.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: T.border, opacity: 0.15, marginBottom: 20 }} />

            {/* Content body text */}
            {(news.content || news.body || '').split('\n').map((paragraph: string, idx: number) => {
              const trimmed = paragraph.trim();
              if (!trimmed) return <View key={idx} style={{ height: 12 }} />;
              return (
                <Text
                  key={idx}
                  style={{
                    color: T.text,
                    fontFamily: 'Inter-Medium',
                    fontSize: 15,
                    lineHeight: 26,
                    textAlign: 'justify',
                    marginBottom: 12,
                  }}
                  textBreakStrategy="highQuality"
                >
                  {trimmed}
                </Text>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}
