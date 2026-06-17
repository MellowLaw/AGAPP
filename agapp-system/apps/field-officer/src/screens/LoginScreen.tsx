import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../utils/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { AgappLogo } from '../components/AgappLogo';
import { globalStyles } from '../theme';

export function LoginScreen() {
  const { T } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Verify user is actually LGU Personnel or Admin
      if (data.user) {
         const { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).single();
         if (profile && profile.role === 'CITIZEN') {
           await supabase.auth.signOut();
           throw new Error("Access denied. Field Officer App is for LGU Personnel only.");
         }
      }
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[globalStyles.screen, { backgroundColor: T.bg }]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginTop: 60, marginBottom: 40 }}>
          <View style={{ marginBottom: 40, alignItems: 'center' }}>
            <AgappLogo size={56} bgColor="#1A1A1A" textColor="#FFFFFF" showText={true} />
          </View>
          <Text style={[globalStyles.serif, { color: T.text, fontSize: 26 }]}>
            Field Officer Login
          </Text>
          <Text style={[globalStyles.muted, { color: T.textMuted, marginTop: 6 }]}>
            AGAPP System - LGU Portal
          </Text>
        </View>

        <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={[globalStyles.label, { color: T.textMuted }]}>WORK EMAIL ADDRESS</Text>
          <TextInput
            style={[globalStyles.input, { color: T.text, backgroundColor: T.cardAlt, borderColor: T.border }]}
            value={email}
            onChangeText={setEmail}
            placeholder="officer@lgu.gov.ph"
            placeholderTextColor={T.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={[globalStyles.label, { color: T.textMuted }]}>PASSWORD</Text>
          <TextInput
            style={[globalStyles.input, { color: T.text, backgroundColor: T.cardAlt, borderColor: T.border }]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={T.textMuted}
            secureTextEntry
          />

          <TouchableOpacity
            style={[globalStyles.primaryButton, { backgroundColor: T.text, marginTop: 10 }]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={T.bg} /> : (
              <Text style={[globalStyles.primaryButtonText, { color: T.bg }]}>
                Sign in securely
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
