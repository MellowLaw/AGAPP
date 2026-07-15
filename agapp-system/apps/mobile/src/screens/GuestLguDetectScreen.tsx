import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Location, ArrowLeft2, InfoCircle } from 'iconsax-react-native';

export function GuestLguDetectScreen() {
  const { setGuestLgu, skipGuestLgu } = useAuth();
  const { T, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [step, setStep] = useState<'welcome' | 'manual'>('welcome');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [lgus, setLgus] = useState<any[]>([]);
  const [loadingManual, setLoadingManual] = useState(false);

  const fetchActiveLgus = async () => {
    setLoadingManual(true);
    try {
      const { data, error } = await supabase.from('lgus').select('*').eq('is_active', true);
      if (!error && data) {
        setLgus(data);
      }
    } catch (err) {
      console.error('Failed to fetch LGUs:', err);
    } finally {
      setLoadingManual(false);
    }
  };

  const handleSelectManual = (lgu: any) => {
    setGuestLgu(lgu);
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Bottom Swirl Decor — taller band, full-bleed to the screen edge (no gap),
          with a long soft fade so it never washes out the buttons/skip link above it.
          Uses theme-bg alpha stops (`${T.bg}xx`) instead of the 'transparent' keyword,
          which renders a visible dark halo on RN instead of a clean fade. */}
      <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 460, zIndex: 0 }}>
        <Image
          source={require('../../assets/brand/swirl.png')}
          style={{
            width: '100%',
            height: '100%',
            opacity: 1,
            resizeMode: 'cover',
            transform: [{ rotate: '180deg' }],
          }}
        />
        <LinearGradient
          colors={[T.bg, `${T.bg}F5`, `${T.bg}90`, `${T.bg}20`, `${T.bg}00`]}
          locations={[0, 0.42, 0.62, 0.82, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </View>

      <SafeAreaView style={{ flex: 1, zIndex: 1 }} edges={['top', 'bottom']}>
        {step === 'welcome' && (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 40,
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Sticker 1 instead of Mascot */}
            <Image
              source={require('../../assets/brand/stickers/1.png')}
              style={{ width: 220, height: 220, resizeMode: 'contain', marginBottom: 16 }}
            />
            <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 32, textAlign: 'center', lineHeight: 36 }}>
              Discover your town.
            </Text>
            <Text style={{ fontFamily: 'Inter-Medium', color: T.text, textAlign: 'center', marginTop: 12, fontSize: 15, lineHeight: 22, paddingHorizontal: 12 }}>
              Select your municipality manually to load news, announcements, and landmarks for your town.
            </Text>
            
            <TouchableOpacity
              style={{
                height: 52,
                borderRadius: 999, // Pill layout
                width: 280,
                backgroundColor: '#292929', // Ink black pill
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 36,
              }}
              onPress={async () => {
                await fetchActiveLgus();
                setStep('manual');
              }}
              activeOpacity={0.9}
            >
              <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 15, color: '#FFFCF5' }}>Select your town</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 24, padding: 8 }}
              onPress={skipGuestLgu}
              activeOpacity={0.7}
            >
              <Text style={{ fontFamily: 'Octarine-Bold', color: T.textMuted, fontSize: 14, textDecorationLine: 'underline' }}>
                Skip for now
              </Text>
            </TouchableOpacity>
            
            {/* Bottom spacer to shift layout elements slightly upwards */}
            <View style={{ height: 180 }} />
          </ScrollView>
        )}


        {step === 'manual' && (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 40,
            }}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={{ marginBottom: 16 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => setStep('welcome')}
            >
              <ArrowLeft2 size={30} color={T.text} variant="Outline" />
            </TouchableOpacity>

            <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 32 }}>
              Select your LGU.
            </Text>
            
            {errorMessage && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: T.border,
                backgroundColor: T.cardAlt,
                marginTop: 16,
                marginBottom: 8,
                gap: 10,
              }}>
                <InfoCircle size={20} color={T.accent} variant="Bold" />
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, flex: 1, fontSize: 13 }}>{errorMessage}</Text>
              </View>
            )}

            <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginTop: 8, marginBottom: 24 }}>
              Choose your municipality to load relevant local updates:
            </Text>

            {loadingManual ? (
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
                  onPress={() => handleSelectManual(lgu)}
                >
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: lgu.primary_color || T.accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 16,
                  }}>
                    <Text style={{ fontSize: 16, fontFamily: 'Octarine-Bold', color: '#292929' }}>{lgu.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontFamily: 'Octarine-Bold', color: T.text }}>{lgu.name}</Text>
                  </View>
                  <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 16, color: T.textMuted }}>›</Text>
                </TouchableOpacity>
              ))
            )}
            
            <TouchableOpacity
              style={{ marginTop: 24, padding: 8 }}
              onPress={skipGuestLgu}
              activeOpacity={0.7}
            >
              <Text style={{ fontFamily: 'Octarine-Bold', color: T.textMuted, textAlign: 'center', fontSize: 14, textDecorationLine: 'underline' }}>
                Skip and browse empty feed
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
