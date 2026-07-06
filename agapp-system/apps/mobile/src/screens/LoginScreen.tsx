import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { AgappLogo } from '../components/AgappLogo';
import { ACCENT, globalStyles } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export function LoginScreen({ navigation }: any) {
  const { T } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(true);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Input Validation
  const isValidEmail = (email: string) => {
    // Basic email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isStrongPassword = (password: string) => {
    // For production: At least 8 chars
    return password.length >= 6;
  };

  // Sanitize input (basic trimming to prevent accidental trailing spaces)
  const sanitize = (str: string) => str.trim();

  const handleLogin = async () => {
    const cleanEmail = sanitize(email);
    if (!cleanEmail || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      Alert.alert('Invalid Input', 'Please enter a valid email address.');
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
      Alert.alert('Sign In Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const cleanEmail = sanitize(email);
    const cleanFirstName = sanitize(firstName);
    const cleanLastName = sanitize(lastName);

    if (!privacyAccepted) {
      Alert.alert('Privacy Notice', 'Please accept the Privacy Notice to continue.');
      return;
    }
    if (!cleanFirstName || !cleanLastName || !cleanEmail || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      Alert.alert('Invalid Input', 'Please enter a valid email address.');
      return;
    }
    if (!isStrongPassword(password)) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Profile creation lives in a DB trigger (handle_new_citizen_signup, on
      // auth.users) now, not here — a client-side insert right after signUp()
      // raced against session propagation (RLS 42501 the moment there's any
      // gap, e.g. email confirmation enabled). The trigger reads full_name
      // from this metadata and is atomic with the auth row, so it can't race.
      const fullName = `${cleanFirstName} ${cleanLastName}`;
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;

      if (data.session) {
        Alert.alert('Success', 'Account created successfully!');
      } else {
        // No session yet means the project requires email confirmation —
        // the profile row still gets created by the trigger either way, but
        // the citizen can't log in until they confirm.
        Alert.alert('Check your email', 'Please confirm your email address, then sign in.');
      }
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = sanitize(email);
    if (!cleanEmail) {
      Alert.alert('Missing email', 'Please enter your email to reset password.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      Alert.alert('Invalid Input', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) throw error;
      Alert.alert('Success', 'Check your email for the password reset link.');
    } catch (err: any) {
      Alert.alert('Reset Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    // Reset fields on mode switch
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
  };

  return (
    <SafeAreaView style={[globalStyles.screen, { backgroundColor: T.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 30 }}>
            <View style={{ marginBottom: 30, alignItems: 'center' }}>
              <AgappLogo size={56} bgColor="#1A1A1A" textColor="#FFFFFF" showText={true} />
            </View>
            <Text style={[globalStyles.serif, { color: T.text, fontSize: 26 }]}>
              {isLoginMode ? 'Welcome back.' : 'Join AGAPP.'}
            </Text>
            <Text style={[globalStyles.muted, { color: T.textMuted, marginTop: 6, textAlign: 'center' }]}>
              {isLoginMode ? 'Sign in to access national citizen services.' : 'Create an account to securely access government services.'}
            </Text>
          </View>

          <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border }]}>
            
            {!isLoginMode && (
              <>
                <Text style={[globalStyles.label, { color: T.textMuted }]}>FIRST NAME</Text>
                <TextInput
                  style={[globalStyles.input, { color: T.text, backgroundColor: T.cardAlt, borderColor: T.border }]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Juan"
                  placeholderTextColor={T.textMuted}
                  autoCapitalize="words"
                />

                <Text style={[globalStyles.label, { color: T.textMuted }]}>LAST NAME</Text>
                <TextInput
                  style={[globalStyles.input, { color: T.text, backgroundColor: T.cardAlt, borderColor: T.border }]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Dela Cruz"
                  placeholderTextColor={T.textMuted}
                  autoCapitalize="words"
                />
              </>
            )}

            <Text style={[globalStyles.label, { color: T.textMuted }]}>EMAIL ADDRESS</Text>
            <TextInput
              style={[globalStyles.input, { color: T.text, backgroundColor: T.cardAlt, borderColor: T.border }]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={T.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={[globalStyles.label, { color: T.textMuted }]}>PASSWORD</Text>
            <View>
              <TextInput
                style={[globalStyles.input, { color: T.text, backgroundColor: T.cardAlt, borderColor: T.border, paddingRight: 40 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={T.textMuted}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={{ position: 'absolute', right: 12, height: '100%', justifyContent: 'center' }}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={T.textMuted} />
              </TouchableOpacity>
            </View>

            {!isLoginMode && (
              <>
                <Text style={[globalStyles.label, { color: T.textMuted }]}>CONFIRM PASSWORD</Text>
                <View>
                  <TextInput
                    style={[globalStyles.input, { color: T.text, backgroundColor: T.cardAlt, borderColor: T.border, paddingRight: 40 }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor={T.textMuted}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 12, height: '100%', justifyContent: 'center' }}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color={T.textMuted} />
                  </TouchableOpacity>
                </View>

                <Pressable onPress={() => setPrivacyAccepted(!privacyAccepted)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: T.border, backgroundColor: privacyAccepted ? ACCENT : 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    {privacyAccepted && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </View>
                  <Text style={{ color: T.textMuted, fontSize: 13, flex: 1, lineHeight: 18 }}>
                    I accept the <Text style={{ color: ACCENT, fontWeight: '700' }}>Privacy Notice</Text> and consent to GPS sharing under RA 10173.
                  </Text>
                </Pressable>
              </>
            )}

            <TouchableOpacity
              style={[globalStyles.primaryButton, { backgroundColor: (!isLoginMode && !privacyAccepted) ? T.chip : T.text }]}
              onPress={isLoginMode ? handleLogin : handleRegister}
              disabled={(!isLoginMode && !privacyAccepted) || loading}
            >
              {loading ? <ActivityIndicator color={(!isLoginMode && !privacyAccepted) ? T.textMuted : T.bg} /> : (
                <Text style={[globalStyles.primaryButtonText, { color: (!isLoginMode && !privacyAccepted) ? T.textMuted : T.bg }]}>
                  {isLoginMode ? 'Sign in' : 'Create account'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, alignItems: 'center' }}>
              <TouchableOpacity onPress={switchMode}>
                <Text style={{ color: T.textMuted, fontSize: 14, fontWeight: '600' }}>
                  {isLoginMode ? 'Create new account' : 'Sign in instead'}
                </Text>
              </TouchableOpacity>
              {isLoginMode && (
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={{ color: ACCENT, fontSize: 14, fontWeight: '600' }}>Forgot password?</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

