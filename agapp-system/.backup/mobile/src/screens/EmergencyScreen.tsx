import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft2, Call } from 'iconsax-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenBackground } from '../components/ScreenBackground';

export function EmergencyScreen({ navigation }: any) {
  const { T } = useTheme();

  const hotlines = [
    { name: 'National Emergency Response', number: '911', desc: 'Medical, fire, and police dispatch' },
    { name: 'Police Station (PNP)', number: '117', desc: 'Local police assistance and reports' },
    { name: 'Fire Bureau (BFP)', number: '160', desc: 'Fire rescue and emergencies' },
    { name: 'Philippine Red Cross', number: '143', desc: 'Blood bank and disaster rescue services' },
    { name: 'NDRRMC Hotlines', number: '02-8911-1406', desc: 'National Disaster Risk Reduction & Management' },
  ];

  return (
    <ScreenBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Header Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 14,
        }}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={{ padding: 4, marginRight: 8 }}
          >
            <ArrowLeft2 size={30} color={T.text} variant="Outline" />
          </TouchableOpacity>
          <Text style={{
            fontSize: 20,
            fontFamily: 'Octarine-Bold',
            color: T.text,
            marginLeft: 8,
          }}>
            Emergency
          </Text>
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 24, paddingBottom: 60 }} 
          showsVerticalScrollIndicator={false}
        >
          <Text style={{
            fontFamily: 'Octarine-Bold',
            fontSize: 28,
            color: T.text,
            marginBottom: 8,
            lineHeight: 34,
          }}>
            Municipal Hotlines
          </Text>
          <Text style={{
            fontFamily: 'Inter-Medium',
            fontSize: 14,
            color: T.textMuted,
            lineHeight: 20,
            marginBottom: 32,
          }}>
            If you or someone else is in immediate danger, tap any of the hotlines below to dial rescue services.
          </Text>

          <View style={{ backgroundColor: T.card, borderWidth: 1, borderColor: T.border, borderRadius: 28, padding: 8 }}>
            {hotlines.map((h, i) => (
              <TouchableOpacity
                key={h.name}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 18,
                  borderBottomWidth: i < hotlines.length - 1 ? 1 : 0,
                  borderBottomColor: T.border,
                }}
                onPress={() => Linking.openURL(`tel:${h.number}`)}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: T.cardAlt,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 16,
                }}>
                  <Call size={20} color={T.text} variant="Bold" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: T.text, fontFamily: 'Octarine-Bold', fontSize: 15 }}>
                    {h.name}
                  </Text>
                  <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 12, marginTop: 4 }}>
                    {h.desc}
                  </Text>
                  <Text style={{ color: T.accent, fontFamily: 'Inter-Bold', fontSize: 13, marginTop: 4 }}>
                    Dial: {h.number}
                  </Text>
                </View>
                <Text style={{ color: T.accent, fontFamily: 'Octarine-Bold', fontSize: 18, marginLeft: 8 }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}
