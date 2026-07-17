import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../components/Toast';
import { Sms, ArrowLeft } from 'iconsax-react-native';

const OTP_LENGTH = 8;

export function EmailOtpScreen({ navigation, route }: any) {
  const { T } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const email: string = route?.params?.email ?? '';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── helpers ──────────────────────────────────────────────────────────────

  const startCooldown = useCallback((seconds = 60) => {
    setResendCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ── digit input handlers ──────────────────────────────────────────────────

  const handleChange = (text: string, index: number) => {
    // Accept only single numeric character
    const char = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (char && index === OTP_LENGTH - 1) {
      const fullCode = [...next.slice(0, OTP_LENGTH - 1), char].join('');
      if (fullCode.length === OTP_LENGTH) {
        verifyCode(fullCode);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── actions ───────────────────────────────────────────────────────────────

  const verifyCode = async (code?: string) => {
    const token = code ?? digits.join('');
    if (token.length < OTP_LENGTH) {
      showToast('Please enter all 6 digits.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      if (error) throw error;

      showToast('Email confirmed! Welcome to AGAPP 🎉', 'success');
      // AuthContext will detect the new session and redirect automatically
    } catch (err: any) {
      showToast(err.message ?? 'Invalid or expired code. Please try again.', 'error');
      // Clear digits on failure so user can re-enter
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
      showToast('Verification code resent — check your inbox.', 'success');
      startCooldown(60);
    } catch (err: any) {
      showToast(err.message ?? 'Could not resend the code. Please try again.', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Background image */}
      <Image
        source={require('../../assets/brand/bg-mobile-2.png')}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          width: '100%', height: '100%',
          resizeMode: 'cover',
          opacity: 0.25,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, zIndex: 1 }}
      >
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 40,
            justifyContent: 'center',
          }}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ position: 'absolute', top: insets.top + 16, left: 24, padding: 4 }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={T.text} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: T.accent + '18',
                borderWidth: 1,
                borderColor: T.accent + '35',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <Sms size={34} color={T.accent} variant="Bold" />
            </View>

            <Text
              style={{
                fontFamily: 'Octarine-Bold',
                fontSize: 28,
                color: T.text,
                textAlign: 'center',
                marginBottom: 10,
              }}
            >
              Verify your email
            </Text>

            <Text
              style={{
                fontFamily: 'Inter-Medium',
                fontSize: 14,
                color: T.textMuted,
                textAlign: 'center',
                lineHeight: 20,
                paddingHorizontal: 12,
              }}
            >
              Enter the 8-digit code we sent to
            </Text>
            <Text
              style={{
                fontFamily: 'Inter-Bold',
                fontSize: 14,
                color: T.text,
                textAlign: 'center',
                marginTop: 4,
              }}
              numberOfLines={1}
            >
              {email}
            </Text>
          </View>

          {/* OTP Box Row */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
              marginBottom: 36,
            }}
          >
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={ref => { inputRefs.current[i] = ref; }}
                value={digit}
                onChangeText={text => handleChange(text, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
                style={{
                  width: 36,
                  height: 48,
                  borderRadius: 10,
                  borderWidth: digit ? 2 : 1.5,
                  borderColor: digit ? T.accent : T.border,
                  backgroundColor: T.card,
                  color: T.text,

                  fontFamily: 'Octarine-Bold',
                  fontSize: 24,
                }}
                editable={!loading}
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            onPress={() => verifyCode()}
            disabled={loading || digits.join('').length < OTP_LENGTH}
            activeOpacity={0.9}
            style={{
              height: 52,
              borderRadius: 999,
              backgroundColor:
                digits.join('').length < OTP_LENGTH ? T.border : T.text,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            {loading ? (
              <ActivityIndicator color={T.bg} />
            ) : (
              <Text
                style={{
                  fontFamily: 'Octarine-Bold',
                  fontSize: 15,
                  color: digits.join('').length < OTP_LENGTH ? T.textMuted : T.bg,
                }}
              >
                Confirm email
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend row */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
            <Text
              style={{
                fontFamily: 'Inter-Medium',
                fontSize: 13,
                color: T.textMuted,
              }}
            >
              Didn't receive it?
            </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendCooldown > 0 || resendLoading}
              activeOpacity={0.7}
            >
              {resendLoading ? (
                <ActivityIndicator size="small" color={T.accent} />
              ) : (
                <Text
                  style={{
                    fontFamily: 'Inter-Bold',
                    fontSize: 13,
                    color: resendCooldown > 0 ? T.textMuted : T.accent,
                  }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
