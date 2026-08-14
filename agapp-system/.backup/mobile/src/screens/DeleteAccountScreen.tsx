import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { supabase } from '../../supabaseClient';

export function DeleteAccountScreen({ navigation }: any) {
  const { T } = useTheme();
  const { profile, signOut } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<'warn' | 'confirm'>('warn');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (!password.trim()) {
      showToast('Please enter your password to confirm.', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify the password by attempting to sign in
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: profile?.email,
        password: password,
      });

      if (signInErr) {
        showToast('Incorrect password. Please try again.', 'error');
        setLoading(false);
        return;
      }

      // 2. Delete the user row from public.users table
      const { error: deleteErr } = await supabase
        .from('users')
        .delete()
        .eq('id', profile.id);

      if (deleteErr) {
        throw deleteErr;
      }

      // 3. Log out and clear session
      await signOut();
      showToast('Your account has been permanently deleted.', 'success');
      
      // Reset navigation stack to LguSelect
      navigation.reset({
        index: 0,
        routes: [{ name: 'LguSelect' }],
      });
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete account. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Full screen background image */}
      <Image
        source={require('../../assets/brand/bg-mobile-2.png')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          resizeMode: 'cover',
        }}
      />

      <SafeAreaView style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, zIndex: 1 }}>
        <View style={{
          backgroundColor: T.card,
          borderRadius: 32,
          borderWidth: 1,
          borderColor: T.border,
          padding: 24,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.05,
          shadowRadius: 15,
          elevation: 5,
        }}>
          {/* Delete Account Sticker Asset */}
          <Image
            source={require('../../assets/brand/stickers/7.png')}
            style={{
              width: 100,
              height: 100,
              resizeMode: 'contain',
              marginBottom: 24,
            }}
          />

          {step === 'warn' ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text style={{
                fontFamily: 'Octarine-Bold',
                fontSize: 24,
                color: T.text,
                textAlign: 'center',
                marginBottom: 12,
              }}>
                Delete Account?
              </Text>

              <Text style={{
                fontFamily: 'Inter-Medium',
                fontSize: 14,
                color: T.textMuted,
                textAlign: 'center',
                lineHeight: 20,
                marginBottom: 32,
                paddingHorizontal: 8,
              }}>
                Are you sure you want to delete your account? This action is permanent. All your filed reports, history, profile data, and verification status will be permanently deleted.
              </Text>

              {/* Proceed Button */}
              <TouchableOpacity
                style={{ width: '100%', marginBottom: 12 }}
                onPress={() => setStep('confirm')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    height: 52,
                    borderRadius: 999,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Octarine-Bold', fontSize: 16 }}>
                    Proceed to Deletion
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                style={{
                  width: '100%',
                  height: 52,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: T.border,
                  backgroundColor: 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Text style={{ color: T.text, fontFamily: 'Octarine-Bold', fontSize: 16 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text style={{
                fontFamily: 'Octarine-Bold',
                fontSize: 24,
                color: T.text,
                textAlign: 'center',
                marginBottom: 12,
              }}>
                Confirm Password
              </Text>

              <Text style={{
                fontFamily: 'Inter-Medium',
                fontSize: 14,
                color: T.textMuted,
                textAlign: 'center',
                lineHeight: 20,
                marginBottom: 20,
                paddingHorizontal: 8,
              }}>
                Please enter your password below to confirm the permanent deletion of your account.
              </Text>

              <TextInput
                style={{
                  height: 48,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: T.border,
                  backgroundColor: T.bg,
                  color: T.text,
                  fontFamily: 'Inter-Medium',
                  paddingHorizontal: 20,
                  fontSize: 14,
                  width: '100%',
                  marginBottom: 24,
                  textAlign: 'center',
                }}
                placeholder="Enter password"
                placeholderTextColor={T.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />

              {/* Confirm Delete Button */}
              <TouchableOpacity
                style={{ width: '100%', marginBottom: 12 }}
                onPress={handleDeleteAccount}
                disabled={loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    height: 52,
                    borderRadius: 999,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontFamily: 'Octarine-Bold', fontSize: 16 }}>
                      Permanently Delete
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Back Button */}
              <TouchableOpacity
                style={{
                  width: '100%',
                  height: 52,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: T.border,
                  backgroundColor: 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => setStep('warn')}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={{ color: T.text, fontFamily: 'Octarine-Bold', fontSize: 16 }}>
                  Back
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
