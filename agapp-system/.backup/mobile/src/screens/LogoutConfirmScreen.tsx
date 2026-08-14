import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export function LogoutConfirmScreen({ navigation }: any) {
  const { T } = useTheme();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (err) {
      console.warn('Logout failed', err);
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
          {/* Logout Sticker Asset */}
          <Image
            source={require('../../assets/brand/stickers/20.png')}
            style={{
              width: 100,
              height: 100,
              resizeMode: 'contain',
              marginBottom: 24,
            }}
          />

          <Text style={{
            fontFamily: 'Octarine-Bold',
            fontSize: 24,
            color: T.text,
            textAlign: 'center',
            marginBottom: 12,
          }}>
            Logging Out?
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
            Are you sure you want to log out of your account? You will need to sign back in to file reports or check your verification status.
          </Text>

          {/* Confirm Button */}
          <TouchableOpacity
            style={{ width: '100%', marginBottom: 12 }}
            onPress={handleLogout}
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
                  Log Out
                </Text>
              )}
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
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={{ color: T.text, fontFamily: 'Octarine-Bold', fontSize: 16 }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
