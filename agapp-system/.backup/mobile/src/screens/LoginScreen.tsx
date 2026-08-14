import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { Eye, EyeSlash, Check } from 'iconsax-react-native';

export function LoginScreen({ navigation, route }: any) {
  const { T, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const { hasCompletedGuestLguChoice } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [signupStep, setSignupStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(true);
  const [isLoginMode, setIsLoginMode] = useState(route?.params?.initialMode !== 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleNextStep = () => {
    const cleanFirstName = sanitize(firstName);
    const cleanLastName = sanitize(lastName);
    const cleanAge = sanitize(age);
    if (!cleanFirstName || !cleanLastName || !cleanAge) {
      showToast('Please fill in first name, last name, and age.', 'error');
      return;
    }
    const numAge = parseInt(cleanAge, 10);
    if (isNaN(numAge) || numAge <= 0) {
      showToast('Please enter a valid age.', 'error');
      return;
    }
    setSignupStep(2);
  };

  useEffect(() => {
    if (route?.params?.initialMode === 'register') {
      setIsLoginMode(false);
    } else if (route?.params?.initialMode === 'login') {
      setIsLoginMode(true);
    }
  }, [route?.params?.initialMode]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isStrongPassword = (password: string) => {
    return password.length >= 8;
  };

  const sanitize = (str: string) => str.trim();

  const handleLogin = async () => {
    const cleanEmail = sanitize(email);
    if (!cleanEmail || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });
      if (error) throw error;
    } catch (err: any) {
      showToast(`Sign In Failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const cleanEmail = sanitize(email);
    const cleanFirstName = sanitize(firstName);
    const cleanLastName = sanitize(lastName);
    const cleanMiddleName = sanitize(middleName);
    const cleanAge = sanitize(age);

    if (!privacyAccepted) {
      showToast('Please accept the Privacy Notice to continue.', 'error');
      return;
    }
    if (!cleanFirstName || !cleanLastName || !cleanEmail || !password || !confirmPassword || !cleanAge) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!isStrongPassword(password)) {
      showToast('Password must be at least 8 characters long.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const fullName = `${cleanFirstName} ${cleanMiddleName ? cleanMiddleName + ' ' : ''}${cleanLastName}`;
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            first_name: cleanFirstName,
            middle_name: cleanMiddleName,
            last_name: cleanLastName,
            full_name: fullName,
            age: parseInt(cleanAge, 10) || null,
          }
        },
      });
      if (error) throw error;

      if (data.session) {
        showToast('Account created successfully!', 'success');
      } else {
        // Navigate to the OTP verification screen
        navigation.navigate('EmailOtp', { email: cleanEmail });
      }
    } catch (err: any) {
      showToast(`Registration Failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = sanitize(email);
    if (!cleanEmail) {
      showToast('Please enter your email to reset password.', 'error');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) throw error;
      showToast('Check your email for the password reset link.', 'success');
    } catch (err: any) {
      showToast(`Reset Failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    if (!hasCompletedGuestLguChoice) {
      navigation.navigate('GuestLguDetect');
    } else {
      navigation.replace('Main');
    }
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setMiddleName('');
    setAge('');
    setSignupStep(1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
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
          opacity: isLoginMode ? 0.6 : 0.3,
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, zIndex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 40,
            flexGrow: 1,
            justifyContent: 'center',
          }}
          showsVerticalScrollIndicator={false}
        >
          
          {/* Welcome Header */}
          <View style={{ alignItems: 'center', marginBottom: isLoginMode ? 32 : 16, marginTop: 16 }}>
            <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 32, textAlign: 'center' }}>
              {isLoginMode ? 'Welcome to agapp.' : 'Join agapp.'}
            </Text>
            <Text style={{ fontFamily: 'Inter-Medium', color: T.text, marginTop: 12, fontSize: 14, textAlign: 'center', paddingHorizontal: 12, lineHeight: 20 }}>
              {isLoginMode
                ? 'Enter your email to log-in to an existing\naccount or instantly set up your new account'
                : 'Create an account to securely access government services.'}
            </Text>
          </View>

          {/* Stepper only for registration */}
          {!isLoginMode && (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: T.border,
              marginBottom: 24,
            }}>
              {['Personal Info', 'Credentials'].map((label, i) => {
                const stepNum = i + 1;
                const isActiveOrDone = stepNum <= signupStep;
                const isDone = stepNum < signupStep;
                return (
                  <View key={label} style={{ alignItems: 'center', flex: 1 }}>
                    <View style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      borderWidth: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: isActiveOrDone ? T.accentSoft : T.cardAlt,
                      borderColor: isActiveOrDone ? T.accent : T.border,
                    }}>
                      {isDone ? (
                        <Check size={14} color="#292929" variant="Bold" />
                      ) : (
                        <Text style={{ color: isActiveOrDone ? '#292929' : T.textMuted, fontFamily: 'Octarine-Bold', fontSize: 12 }}>
                          {stepNum}
                        </Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 11, fontFamily: 'Inter-Medium', color: isActiveOrDone ? T.text : T.textMuted, marginTop: 4 }}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Flat Form container (No box or outline, blends flat with screen) */}
          <View style={{ paddingHorizontal: 4 }}>
            
            {/* TODO(auth-phone): Migrate authentication to phone-number-first UI when SMS provider is set up */}
            
            {/* 1. SIGN IN MODE */}
            {isLoginMode && (
              <>
                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 8 }}>EMAIL ADDRESS</Text>
                <TextInput
                  style={{
                    height: 48,
                    borderRadius: 999, // Pill layout
                    borderWidth: 1,
                    borderColor: T.border,
                    backgroundColor: T.card,
                    color: T.text,
                    fontFamily: 'Inter-Medium',
                    paddingHorizontal: 20,
                    fontSize: 14,
                    marginBottom: 16,
                  }}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@email.com"
                  placeholderTextColor={T.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 8 }}>PASSWORD</Text>
                <View style={{ marginBottom: 20 }}>
                  <TextInput
                    style={{
                      height: 48,
                      borderRadius: 999, // Pill layout
                      borderWidth: 1,
                      borderColor: T.border,
                      backgroundColor: T.card,
                      color: T.text,
                      fontFamily: 'Inter-Medium',
                      paddingHorizontal: 20,
                      fontSize: 14,
                      paddingRight: 48,
                    }}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={T.textMuted}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 18, height: 48, justifyContent: 'center' }}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlash size={18} color={T.textMuted} variant="Bold" />
                    ) : (
                      <Eye size={18} color={T.textMuted} variant="Bold" />
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={loading ? ['#E5E7EB', '#E5E7EB'] : ['#C3E8B8', '#F5DCB0', '#F3C4C4', '#DCEE8C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      height: 52,
                      borderRadius: 999, // Pill layout
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginTop: 12,
                    }}
                  >
                    {loading ? <ActivityIndicator color="#292929" /> : <Text style={{ color: '#292929', fontFamily: 'Octarine-Bold', fontSize: 15 }}>Sign in</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 24,
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}>
                  <TouchableOpacity onPress={switchMode}>
                    <Text style={{ color: T.text, fontFamily: 'Inter-Medium', fontSize: 13, fontWeight: '600' }}>
                      Create new account
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={{ color: T.text, fontFamily: 'Inter-Medium', fontSize: 13, fontWeight: '600' }}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* 2. REGISTRATION STEP 1: PERSONAL DETAILS */}
            {!isLoginMode && signupStep === 1 && (
              <>
                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 8 }}>FIRST NAME</Text>
                <TextInput
                  style={{
                    height: 48,
                    borderRadius: 999, // Pill layout
                    borderWidth: 1,
                    borderColor: T.border,
                    backgroundColor: T.card,
                    color: T.text,
                    fontFamily: 'Inter-Medium',
                    paddingHorizontal: 20,
                    fontSize: 14,
                    marginBottom: 16,
                  }}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Juan"
                  placeholderTextColor={T.textMuted}
                  autoCapitalize="words"
                />

                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 8 }}>MIDDLE NAME (OPTIONAL)</Text>
                <TextInput
                  style={{
                    height: 48,
                    borderRadius: 999, // Pill layout
                    borderWidth: 1,
                    borderColor: T.border,
                    backgroundColor: T.card,
                    color: T.text,
                    fontFamily: 'Inter-Medium',
                    paddingHorizontal: 20,
                    fontSize: 14,
                    marginBottom: 16,
                  }}
                  value={middleName}
                  onChangeText={setMiddleName}
                  placeholder="Santos"
                  placeholderTextColor={T.textMuted}
                  autoCapitalize="words"
                />

                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 8 }}>LAST NAME</Text>
                <TextInput
                  style={{
                    height: 48,
                    borderRadius: 999, // Pill layout
                    borderWidth: 1,
                    borderColor: T.border,
                    backgroundColor: T.card,
                    color: T.text,
                    fontFamily: 'Inter-Medium',
                    paddingHorizontal: 20,
                    fontSize: 14,
                    marginBottom: 16,
                  }}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Dela Cruz"
                  placeholderTextColor={T.textMuted}
                  autoCapitalize="words"
                />

                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 8 }}>AGE</Text>
                <TextInput
                  style={{
                    height: 48,
                    borderRadius: 999, // Pill layout
                    borderWidth: 1,
                    borderColor: T.border,
                    backgroundColor: T.card,
                    color: T.text,
                    fontFamily: 'Inter-Medium',
                    paddingHorizontal: 20,
                    fontSize: 14,
                    marginBottom: 20,
                  }}
                  value={age}
                  onChangeText={setAge}
                  placeholder="25"
                  placeholderTextColor={T.textMuted}
                  keyboardType="number-pad"
                />

                <TouchableOpacity
                  onPress={handleNextStep}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#C3E8B8', '#F5DCB0', '#F3C4C4', '#DCEE8C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      height: 52,
                      borderRadius: 999, // Pill layout
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginTop: 12,
                    }}
                  >
                    <Text style={{ color: '#292929', fontFamily: 'Octarine-Bold', fontSize: 15 }}>Continue</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  marginTop: 24,
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}>
                  <TouchableOpacity onPress={switchMode}>
                    <Text style={{ color: T.text, fontFamily: 'Inter-Medium', fontSize: 13, fontWeight: '600' }}>
                      Sign in instead
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* 3. REGISTRATION STEP 2: CREDENTIALS & CONSENT */}
            {!isLoginMode && signupStep === 2 && (
              <>
                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 8 }}>EMAIL ADDRESS</Text>
                <TextInput
                  style={{
                    height: 48,
                    borderRadius: 999, // Pill layout
                    borderWidth: 1,
                    borderColor: T.border,
                    backgroundColor: T.card,
                    color: T.text,
                    fontFamily: 'Inter-Medium',
                    paddingHorizontal: 20,
                    fontSize: 14,
                    marginBottom: 16,
                  }}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@email.com"
                  placeholderTextColor={T.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 8 }}>PASSWORD</Text>
                <View style={{ marginBottom: 20 }}>
                  <TextInput
                    style={{
                      height: 48,
                      borderRadius: 999, // Pill layout
                      borderWidth: 1,
                      borderColor: T.border,
                      backgroundColor: T.card,
                      color: T.text,
                      fontFamily: 'Inter-Medium',
                      paddingHorizontal: 20,
                      fontSize: 14,
                      paddingRight: 48,
                    }}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={T.textMuted}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 18, height: 48, justifyContent: 'center' }}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlash size={18} color={T.textMuted} variant="Bold" />
                    ) : (
                      <Eye size={18} color={T.textMuted} variant="Bold" />
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.text, marginBottom: 8 }}>CONFIRM PASSWORD</Text>
                <View style={{ marginBottom: 20 }}>
                  <TextInput
                    style={{
                      height: 48,
                      borderRadius: 999, // Pill layout
                      borderWidth: 1,
                      borderColor: T.border,
                      backgroundColor: T.card,
                      color: T.text,
                      fontFamily: 'Inter-Medium',
                      paddingHorizontal: 20,
                      fontSize: 14,
                      paddingRight: 48,
                    }}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor={T.textMuted}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 18, height: 48, justifyContent: 'center' }}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlash size={18} color={T.textMuted} variant="Bold" />
                    ) : (
                      <Eye size={18} color={T.textMuted} variant="Bold" />
                    )}
                  </TouchableOpacity>
                </View>

                <Pressable onPress={() => setPrivacyAccepted(!privacyAccepted)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 }}>
                  <View style={{ width: 18, height: 18, borderRadius: 5, borderWidth: 1, borderColor: T.border, backgroundColor: privacyAccepted ? T.accent : 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                    {privacyAccepted && <Check size={12} color="#292929" variant="Bold" />}
                  </View>
                  <Text style={{ color: T.text, fontFamily: 'Inter-Medium', fontSize: 12, flex: 1, lineHeight: 16 }}>
                    I accept the <Text style={{ color: T.text, fontWeight: '700' }}>Privacy Notice</Text> and consent to GPS sharing under RA 10173.
                  </Text>
                </Pressable>

                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={!privacyAccepted || loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={(!privacyAccepted || loading) ? ['#E5E7EB', '#E5E7EB'] : ['#C3E8B8', '#F5DCB0', '#F3C4C4', '#DCEE8C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      height: 52,
                      borderRadius: 999, // Pill layout
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginTop: 12,
                    }}
                  >
                    {loading ? <ActivityIndicator color="#292929" /> : <Text style={{ color: '#292929', fontFamily: 'Octarine-Bold', fontSize: 15 }}>Create account</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 24,
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}>
                  <TouchableOpacity onPress={() => setSignupStep(1)}>
                    <Text style={{ color: T.text, fontFamily: 'Inter-Medium', fontSize: 13, fontWeight: '600' }}>
                      ← Back to Info
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={switchMode}>
                    <Text style={{ color: T.text, fontFamily: 'Inter-Medium', fontSize: 13, fontWeight: '600' }}>
                      Sign in instead
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Continue as Guest */}
          <TouchableOpacity
            onPress={handleContinueAsGuest}
            activeOpacity={0.8}
            style={{ alignSelf: 'center', marginTop: 32, padding: 8 }}
          >
            <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 15, textDecorationLine: 'underline' }}>
              Continue as Guest
            </Text>
          </TouchableOpacity>

          <Text style={{
            fontSize: 12,
            fontFamily: 'Inter-Medium',
            color: T.text,
            textAlign: 'center',
            marginTop: 32,
            paddingHorizontal: 20,
            lineHeight: 18,
          }}>
            By continuing, you agree to our{' '}
            <Text style={{ color: T.text, fontWeight: '700', textDecorationLine: 'underline' }}>Terms &{'\n'}Conditions</Text> and verify that you have read{'\n'}our{' '}
            <Text style={{ color: T.text, fontWeight: '700', textDecorationLine: 'underline' }}>Privacy Policy</Text>.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
