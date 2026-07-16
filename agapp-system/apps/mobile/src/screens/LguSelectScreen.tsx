import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowRight2 } from 'iconsax-react-native';

export function LguSelectScreen() {
  const { setSelectedLgu } = useAuth();
  const { T, isDarkMode } = useTheme();
  const [lgus, setLgus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLgus = async () => {
      try {
        const { data, error } = await supabase.from('lgus').select('*').eq('is_active', true);
        if (!error && data) {
          setLgus(data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLgus();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      {/* Tinted Map Background */}
      <Image
        source={isDarkMode ? require('../../assets/brand/bg-map-2.png') : require('../../assets/brand/bg-map-1.png')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          opacity: isDarkMode ? 0.04 : 0.07,
          tintColor: T.accent,
        }}
        resizeMode="cover"
      />

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 32, marginTop: 40 }}>
          Select your LGU.
        </Text>
        <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginTop: 6, marginBottom: 32 }}>
          Choose your municipality to access local services and reports.
        </Text>

        {loading ? (
          <ActivityIndicator color={T.text} style={{ marginTop: 40 }} />
        ) : (
          lgus.map((lgu) => (
            <TouchableOpacity
              key={lgu.id}
              style={{
                backgroundColor: T.card,
                borderWidth: 1,
                borderColor: T.border,
                borderRadius: 20, // card radii 20
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                marginBottom: 12,
              }}
              onPress={() => setSelectedLgu(lgu)}
              activeOpacity={0.8}
            >
              {(() => {
                const logoSource = lgu.logo && lgu.logo.startsWith('http')
                  ? { uri: lgu.logo }
                  : require('../../assets/brand/liliw-seal.jpg');
                return (
                  <Image
                    source={logoSource}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      borderWidth: 1,
                      borderColor: T.border,
                      marginRight: 16,
                      backgroundColor: '#FFFFFF',
                    }}
                    resizeMode="contain"
                  />
                );
              })()}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontFamily: 'Octarine-Bold', color: T.text }}>
                  {lgu.name}
                </Text>
              </View>
              <ArrowRight2 size={18} color={T.textMuted} variant="Bold" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
