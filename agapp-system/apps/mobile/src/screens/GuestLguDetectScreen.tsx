import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { globalStyles, ACCENT } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { detectGuestLgu, DetectedLgu } from '../utils/locationDetection';

export function GuestLguDetectScreen() {
  const { setGuestLgu, skipGuestLgu } = useAuth();
  const { T } = useTheme();
  
  const [step, setStep] = useState<'welcome' | 'detecting' | 'detected' | 'manual'>('welcome');
  const [detectedLgu, setDetectedLgu] = useState<DetectedLgu | null>(null);
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

  const handleDetect = async () => {
    setStep('detecting');
    setErrorMessage(null);
    const result = await detectGuestLgu();
    if (result.status === 'detected') {
      setDetectedLgu(result.lgu);
      setStep('detected');
    } else if (result.status === 'permission_denied') {
      setErrorMessage('Location permission was denied. Please select your municipality manually.');
      await fetchActiveLgus();
      setStep('manual');
    } else if (result.status === 'out_of_area') {
      setErrorMessage("We couldn't detect any AGAPP-supported municipality at your current location.");
      await fetchActiveLgus();
      setStep('manual');
    } else {
      setErrorMessage(result.message || 'An error occurred during location detection.');
      await fetchActiveLgus();
      setStep('manual');
    }
  };

  const handleSelectManual = (lgu: any) => {
    setGuestLgu(lgu);
  };

  return (
    <SafeAreaView style={[globalStyles.screen, { backgroundColor: T.bg, flex: 1 }]}>
      {step === 'welcome' && (
        <View style={styles.container}>
          <View style={[styles.iconContainer, { backgroundColor: T.cardAlt }]}>
            <Ionicons name="location-outline" size={48} color={ACCENT} />
          </View>
          <Text style={[globalStyles.serif, { color: T.text, fontSize: 32, textAlign: 'center', marginTop: 24 }]}>
            Discover your town.
          </Text>
          <Text style={[globalStyles.muted, { color: T.textMuted, textAlign: 'center', marginTop: 12, paddingHorizontal: 24, fontSize: 16, lineHeight: 24 }]}>
            Enable location to automatically load news, announcements, and landmarks for your municipality.
          </Text>
          
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: T.text }]}
            onPress={handleDetect}
            activeOpacity={0.9}
          >
            <Ionicons name="navigate-outline" size={20} color={T.bg} style={{ marginRight: 8 }} />
            <Text style={[styles.btnText, { color: T.bg }]}>Detect my location</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: T.border }]}
            onPress={async () => {
              await fetchActiveLgus();
              setStep('manual');
            }}
            activeOpacity={0.9}
          >
            <Text style={{ color: T.text, fontWeight: '600' }}>Select manually</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={skipGuestLgu}
            activeOpacity={0.7}
          >
            <Text style={{ color: T.textMuted, fontWeight: '600', fontSize: 14 }}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'detecting' && (
        <View style={styles.container}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={[globalStyles.serif, { color: T.text, fontSize: 20, marginTop: 24, textAlign: 'center' }]}>
            Detecting your location...
          </Text>
          <Text style={[globalStyles.muted, { color: T.textMuted, textAlign: 'center', marginTop: 8 }]}>
            Please wait while we check nearby municipalities.
          </Text>
        </View>
      )}

      {step === 'detected' && detectedLgu && (
        <View style={styles.container}>
          <View style={[styles.iconContainer, { backgroundColor: (detectedLgu.primary_color || ACCENT) + '22' }]}>
            <Ionicons name="checkmark-circle" size={48} color={detectedLgu.primary_color || ACCENT} />
          </View>
          <Text style={[globalStyles.serif, { color: T.text, fontSize: 28, textAlign: 'center', marginTop: 24 }]}>
            Location Detected!
          </Text>
          <Text style={[styles.detectedText, { color: T.text }]}>
            You are in <Text style={{ fontWeight: 'bold', color: detectedLgu.primary_color || ACCENT }}>{detectedLgu.name}</Text>
          </Text>
          <Text style={[globalStyles.muted, { color: T.textMuted, textAlign: 'center', marginTop: 8, paddingHorizontal: 24 }]}>
            We'll customize your home feed with local news and announcements.
          </Text>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: detectedLgu.primary_color || T.text }]}
            onPress={() => setGuestLgu(detectedLgu)}
            activeOpacity={0.9}
          >
            <Text style={[styles.btnText, { color: '#FFF' }]}>Continue to Home</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'manual' && (
        <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep('welcome')}>
            <Ionicons name="arrow-back" size={24} color={T.text} />
          </TouchableOpacity>

          <Text style={[globalStyles.serif, { color: T.text, fontSize: 28, marginTop: 16 }]}>
            Select your LGU.
          </Text>
          
          {errorMessage && (
            <View style={[styles.errorBox, { backgroundColor: T.cardAlt, borderColor: T.border }]}>
              <Ionicons name="information-circle-outline" size={20} color={ACCENT} style={{ marginRight: 8 }} />
              <Text style={{ color: T.textMuted, flex: 1, fontSize: 13 }}>{errorMessage}</Text>
            </View>
          )}

          <Text style={[globalStyles.muted, { color: T.textMuted, marginTop: 6, marginBottom: 24 }]}>
            Choose your municipality to load relevant local updates:
          </Text>

          {loadingManual ? (
            <ActivityIndicator color={T.text} style={{ marginTop: 40 }} />
          ) : (
            lgus.map((lgu) => (
              <TouchableOpacity
                key={lgu.id}
                style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border, flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12 }]}
                onPress={() => handleSelectManual(lgu)}
              >
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: lgu.primary_color || T.chip, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFF' }}>{lgu.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: T.text }}>{lgu.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={T.textMuted} />
              </TouchableOpacity>
            ))
          )}
          
          <TouchableOpacity
            style={[styles.skipBtn, { marginTop: 20 }]}
            onPress={skipGuestLgu}
            activeOpacity={0.7}
          >
            <Text style={{ color: T.textMuted, fontWeight: '600', textAlign: 'center' }}>Skip and browse empty feed</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 56,
    borderRadius: 16,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
  },
  skipBtn: {
    marginTop: 24,
    padding: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  detectedText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 8,
  },
});
