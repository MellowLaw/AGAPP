import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { PASTELS } from '../theme';
import { ArrowLeft2, DocumentText, Danger, ArrowRight2, Heart } from 'iconsax-react-native';
import { ScreenBackground } from '../components/ScreenBackground';

export function NewsDetailScreen({ route, navigation }: any) {
  const { newsId } = route.params;
  const { T, isDarkMode } = useTheme();
  const { session, profile } = useAuth();
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const fetchNewsAndReactions = async () => {
      setLoading(true);
      // Fetch news article
      const { data } = await supabase.from('news_announcements').select('*').eq('id', newsId).single();
      if (data) setNews(data);

      // Fetch actual DB reactions count for this news article
      try {
        const { count, error } = await supabase
          .from('news_reactions')
          .select('news_id', { count: 'exact', head: true })
          .eq('news_id', newsId);

        if (!error && count !== null) {
          setLikeCount(count);
        }
      } catch (err) {
        console.warn('news_reactions table query error:', err);
      }

      // Check if logged-in user has reacted
      if (profile?.id) {
        try {
          const { data: userReaction } = await supabase
            .from('news_reactions')
            .select('user_id')
            .eq('news_id', newsId)
            .eq('user_id', profile.id)
            .maybeSingle();

          if (userReaction) {
            setIsLiked(true);
          } else {
            setIsLiked(false);
          }
        } catch (err) {
          console.warn('Error checking user reaction:', err);
        }
      } else {
        // Fallback check for guests using local AsyncStorage
        try {
          const storedLikes = await AsyncStorage.getItem('liked_news_ids');
          if (storedLikes) {
            const ids: string[] = JSON.parse(storedLikes);
            setIsLiked(ids.includes(newsId));
          }
        } catch (err) {
          console.warn('Error reading local liked news', err);
        }
      }

      setLoading(false);
    };

    fetchNewsAndReactions();
  }, [newsId, profile?.id]);

  const toggleLike = async () => {
    // If not logged in, prompt user to sign in
    if (!session || !profile?.id) {
      Alert.alert('Sign In Required', 'Please sign in to react and leave a Good Read feedback on news articles.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    try {
      if (isLiked) {
        // Optimistic UI update
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));

        const { error } = await supabase
          .from('news_reactions')
          .delete()
          .eq('news_id', newsId)
          .eq('user_id', profile.id);

        if (error) {
          console.warn('Failed to remove news reaction from DB:', error.message);
        }
      } else {
        // Optimistic UI update
        setIsLiked(true);
        setLikeCount(prev => prev + 1);

        const { error } = await supabase
          .from('news_reactions')
          .insert({ news_id: newsId, user_id: profile.id });

        if (error) {
          console.warn('Failed to insert news reaction into DB:', error.message);
        }
      }

      // Sync local AsyncStorage cache as well
      const storedLikes = await AsyncStorage.getItem('liked_news_ids');
      let ids: string[] = storedLikes ? JSON.parse(storedLikes) : [];
      if (isLiked) {
        ids = ids.filter(id => id !== newsId);
      } else {
        if (!ids.includes(newsId)) ids.push(newsId);
      }
      await AsyncStorage.setItem('liked_news_ids', JSON.stringify(ids));
    } catch (err) {
      console.warn('Error toggling news reaction:', err);
    }
  };

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

  const getPillDetails = () => {
    switch (news.type) {
      case 'advisory':
        return {
          bg: '#fee2e2',
          text: 'ADVISORY',
          color: '#ef4444',
          Icon: Danger,
        };
      case 'announcement':
        return {
          bg: '#e0e7ff',
          text: 'ANNOUNCEMENT',
          color: '#4f46e5',
          Icon: DocumentText,
        };
      case 'news':
      default:
        return {
          bg: '#ccfbf1',
          text: 'NEWS',
          color: '#0d9488',
          Icon: DocumentText,
        };
    }
  };

  const pill = getPillDetails();

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
            <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 20, marginLeft: 16, textTransform: 'capitalize' }}>
              {news.type === 'news' ? 'News' : news.type === 'advisory' ? 'Advisory' : 'Announcement'}
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
                  backgroundColor: pill.bg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 1.41,
                }}>
                  <pill.Icon size={14} color={pill.color} variant="Bold" />
                  <Text style={{ fontSize: 10, fontFamily: 'Octarine-Bold', color: pill.color }}>{pill.text}</Text>
                </View>
              </View>
            ) : (
              /* If no cover photo, still render the pill inline */
              <View style={{
                alignSelf: 'flex-start',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: pill.bg,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}>
                <pill.Icon size={14} color={pill.color} variant="Bold" />
                <Text style={{ fontSize: 10, fontFamily: 'Octarine-Bold', color: pill.color }}>{pill.text}</Text>
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
            {(news.content || news.body || '').split('\n').map((line: string, idx: number) => {
              if (line === '') return <View key={idx} style={{ height: 12 }} />;
              
              const isH1 = line.startsWith('# ');
              const isH2 = line.startsWith('## ');
              const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');

              let cleanLine = line;
              let fontSize = 15;
              let fontFamily = 'Inter-Medium';
              let fontWeight: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | undefined = 'normal';
              let marginBottom = 12;
              let marginLeft = 0;

              if (isH1) {
                cleanLine = line.substring(2);
                fontSize = 22;
                fontFamily = 'Octarine-Bold';
                fontWeight = 'bold';
                marginBottom = 16;
              } else if (isH2) {
                cleanLine = line.substring(3);
                fontSize = 18;
                fontFamily = 'Octarine-Bold';
                fontWeight = 'bold';
                marginBottom = 14;
              } else if (isBullet) {
                cleanLine = '•  ' + line.trim().substring(2);
                marginLeft = 16;
                marginBottom = 8;
              }

              // Helper function to render inline markdown formats (bold/italic)
              const renderInline = (text: string) => {
                const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
                const parts = text.split(regex);
                return parts.map((part, index) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <Text key={index} style={{ fontFamily: 'Inter-Bold', fontWeight: 'bold' }}>
                        {part.slice(2, -2)}
                      </Text>
                    );
                  }
                  if (part.startsWith('*') && part.endsWith('*')) {
                    return (
                      <Text key={index} style={{ fontStyle: 'italic' }}>
                        {part.slice(1, -1)}
                      </Text>
                    );
                  }
                  return part;
                });
              };

              return (
                <Text
                  key={idx}
                  style={{
                    color: T.text,
                    fontFamily,
                    fontSize,
                    fontWeight,
                    lineHeight: fontSize * 1.6,
                    textAlign: isH1 || isH2 ? 'left' : 'justify',
                    marginBottom,
                    marginLeft,
                  }}
                  textBreakStrategy="highQuality"
                >
                  {renderInline(cleanLine)}
                </Text>
              );
            })}

            {/* ── Like / Reaction Section ("Was this a good read?") ── */}
            <View style={{
              marginTop: 32,
              padding: 20,
              borderRadius: 24,
              backgroundColor: T.card,
              borderWidth: 1,
              borderColor: T.border,
              alignItems: 'center',
              shadowColor: 'rgba(0,0,0,0.06)',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 10,
              elevation: 2,
            }}>
              <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 16, color: T.text, textAlign: 'center', marginBottom: 4 }}>
                Did you find this article helpful?
              </Text>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: T.textMuted, textAlign: 'center', marginBottom: 16 }}>
                Let us know if this was a good read for you!
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity
                  onPress={toggleLike}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isLiked ? '#EF4444' : T.accentSoft,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 999,
                    gap: 8,
                    borderWidth: 1,
                    borderColor: isLiked ? '#EF4444' : T.border,
                  }}
                >
                  <Heart
                    size={22}
                    color={isLiked ? '#FFFFFF' : T.onAccentSoft}
                    variant="Bold"
                  />
                  <Text style={{
                    fontFamily: 'Octarine-Bold',
                    fontSize: 14,
                    color: isLiked ? '#FFFFFF' : T.onAccentSoft,
                  }}>
                    {isLiked ? 'Liked!' : 'Good Read'}
                  </Text>
                  <View style={{
                    backgroundColor: isLiked ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 12,
                  }}>
                    <Text style={{
                      fontFamily: 'Inter-Bold',
                      fontSize: 12,
                      color: isLiked ? '#FFFFFF' : T.onAccentSoft,
                    }}>
                      {likeCount}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {isLiked && (
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: '#10B981', marginTop: 12 }}>
                  ✓ Thanks for your feedback!
                </Text>
              )}
            </View>
            {Array.isArray(news.attachments) && news.attachments.filter((att: any) => !att.type?.startsWith('image/') && !/\.(jpg|jpeg|png|webp|gif)/i.test(att.url)).length > 0 && (
              <View style={{ marginTop: 32 }}>
                <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 16, color: T.text, marginBottom: 12 }}>
                  Attachments
                </Text>
                {news.attachments
                  .filter((att: any) => !att.type?.startsWith('image/') && !/\.(jpg|jpeg|png|webp|gif)/i.test(att.url))
                  .map((att: any, idx: number) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={async () => {
                        try {
                          const supported = await Linking.canOpenURL(att.url);
                          if (supported) {
                            await Linking.openURL(att.url);
                          } else {
                            Alert.alert('Error', 'Cannot open this attachment URL.');
                          }
                        } catch (error) {
                          console.error('Error opening URL:', error);
                        }
                      }}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: T.card,
                        borderWidth: 1,
                        borderColor: T.border,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                      }}
                    >
                      <DocumentText size={24} color={T.accent} variant="Bold" style={{ marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: T.text }} numberOfLines={1}>
                          {att.name || 'Attachment'}
                        </Text>
                        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                          {att.type === 'application/pdf' ? 'PDF Document' : 'File Attachment'}
                        </Text>
                      </View>
                      <ArrowRight2 size={18} color={T.textMuted} variant="Outline" />
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}
