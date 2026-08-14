import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenBackground } from '../components/ScreenBackground';
import {
  ArrowLeft2,
  SearchNormal1,
  Buildings,
  Location,
  Clock,
  Global,
  Call,
} from 'iconsax-react-native';

interface Guide {
  id: string;
  section: string;
  title: string;
  address?: string;
  schedule?: string;
  website?: string;
  phone?: string;
}

const SECTION_ORDER = [
  'ID Registration and Licenses',
  'Benefits & Contributions',
  'Specialized Assistance',
  'Other Local Government Offices'
];

export function CitizenGuideScreen({ navigation }: any) {
  const { T } = useTheme();
  const { selectedLgu, guestLgu } = useAuth();
  const activeLgu = selectedLgu || guestLgu || { id: 'liliw-laguna', name: 'Liliw, Laguna' };

  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchGuides() {
      try {
        const { data, error } = await supabase
          .from('citizen_guides')
          .select('*')
          .eq('lgu_id', activeLgu.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching citizen guides:', error);
        } else {
          setGuides(data || []);
        }
      } catch (err) {
        console.error('Error in fetchGuides:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchGuides();
  }, [activeLgu.id]);

  // Filter in memory
  const filteredGuides = guides.filter((g) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      g.title.toLowerCase().includes(query) ||
      (g.address && g.address.toLowerCase().includes(query)) ||
      g.section.toLowerCase().includes(query)
    );
  });

  // Group by section
  const sectionsMap = filteredGuides.reduce((acc, guide) => {
    if (!acc[guide.section]) {
      acc[guide.section] = [];
    }
    acc[guide.section].push(guide);
    return acc;
  }, {} as Record<string, Guide[]>);

  // Sort sections
  const sortedSections = Object.keys(sectionsMap).sort((a, b) => {
    const idxA = SECTION_ORDER.indexOf(a);
    const idxB = SECTION_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const handleOpenLink = (url: string) => {
    if (!url) return;
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Couldn't open website link:", err));
  };

  const handleDial = (phone: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch((err) => console.error("Couldn't open dialer:", err));
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Header Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 14,
          justifyContent: 'space-between',
        }}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={{ padding: 4 }}
          >
            <ArrowLeft2 size={28} color={T.text} variant="Outline" />
          </TouchableOpacity>
          <Text style={{
            fontSize: 20,
            fontFamily: 'Octarine-Bold',
            color: T.text,
            textAlign: 'center',
          }}>
            Citizen Guide
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Search Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: T.card,
          borderWidth: 1,
          borderColor: T.border,
          borderRadius: 999,
          paddingHorizontal: 16,
          height: 48,
          marginHorizontal: 20,
          marginBottom: 16,
        }}>
          <SearchNormal1 size={18} color={T.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            placeholder="Search..."
            placeholderTextColor={T.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              fontFamily: 'Inter-Medium',
              fontSize: 15,
              color: T.text,
              padding: 0,
            }}
          />
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={T.accent} />
          </View>
        ) : sortedSections.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, color: T.textMuted, textAlign: 'center' }}>
              {searchQuery ? 'No matching guides found.' : 'No directories listed for this municipality yet.'}
            </Text>
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {sortedSections.map((section) => (
              <View key={section} style={{ marginBottom: 28 }}>
                {/* Section Title */}
                <Text style={{
                  fontFamily: 'Octarine-Bold',
                  fontSize: 17,
                  color: T.text,
                  marginHorizontal: 20,
                  marginBottom: 14,
                }}>
                  {section}
                </Text>

                {/* Horizontal Cards Scroll */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                >
                  {sectionsMap[section].map((item) => (
                    <View
                      key={item.id}
                      style={{
                        width: 290,
                        backgroundColor: T.card,
                        borderWidth: 1,
                        borderColor: T.border,
                        borderRadius: 24,
                        padding: 20,
                        marginRight: 14,
                        elevation: 2,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 6,
                      }}
                    >
                      {/* Top Header Card */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                        <View style={{
                          width: 50,
                          height: 50,
                          borderRadius: 14,
                          backgroundColor: T.cardAlt,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 14,
                        }}>
                          <Buildings size={24} color={T.text} variant="Bold" />
                        </View>
                        <Text 
                          style={{ 
                            flex: 1, 
                            fontFamily: 'Octarine-Bold', 
                            fontSize: 15, 
                            color: T.text,
                            lineHeight: 19 
                          }}
                          numberOfLines={3}
                        >
                          {item.title}
                        </Text>
                      </View>

                      {/* Detail Rows */}
                      {!!item.address && (
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                          <Location size={16} color={T.accent} style={{ marginRight: 10, marginTop: 1 }} />
                          <Text style={{ flex: 1, fontFamily: 'Inter-Medium', fontSize: 13, color: T.textMuted, lineHeight: 17 }} numberOfLines={3}>
                            {item.address}
                          </Text>
                        </View>
                      )}

                      {!!item.schedule && (
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                          <Clock size={16} color={T.textMuted} style={{ marginRight: 10, marginTop: 1 }} />
                          <Text style={{ flex: 1, fontFamily: 'Inter-Medium', fontSize: 13, color: T.textMuted, lineHeight: 17 }} numberOfLines={2}>
                            {item.schedule}
                          </Text>
                        </View>
                      )}

                      {!!item.website && (
                        <TouchableOpacity 
                          onPress={() => handleOpenLink(item.website!)}
                          style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}
                          activeOpacity={0.7}
                        >
                          <Global size={16} color={T.accent} style={{ marginRight: 10, marginTop: 1 }} />
                          <Text style={{ flex: 1, fontFamily: 'Inter-Bold', fontSize: 13, color: T.accent, lineHeight: 17 }} numberOfLines={1}>
                            {item.website}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {!!item.phone && (
                        <TouchableOpacity 
                          onPress={() => handleDial(item.phone!)}
                          style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}
                          activeOpacity={0.7}
                        >
                          <Call size={16} color={T.accent} style={{ marginRight: 10, marginTop: 1 }} />
                          <Text style={{ flex: 1, fontFamily: 'Inter-Bold', fontSize: 13, color: T.accent, lineHeight: 17 }} numberOfLines={1}>
                            {item.phone}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </ScreenBackground>
  );
}
