import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { useToast } from '../components/Toast';
import { ScreenBackground } from '../components/ScreenBackground';
import {
  Warning2,
  Logout,
  Send2,
  InfoCircle,
  Clock,
  CloseCircle,
  TickCircle,
  Sms,
  Location,
} from 'iconsax-react-native';

export function BannedScreen({ navigation }: any) {
  const { T, isDarkMode } = useTheme();
  const { profile, signOut, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [appealMessage, setAppealMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingAppeal, setLoadingAppeal] = useState(true);
  const [existingAppeal, setExistingAppeal] = useState<any | null>(null);

  // Load existing appeal if any
  const fetchAppeal = async () => {
    setLoadingAppeal(true);
    try {
      if (!profile?.id) return;
      const { data, error } = await supabase
        .from('citizen_appeals')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setExistingAppeal(data[0]);
      } else {
        setExistingAppeal(null);
      }
    } catch (err: any) {
      console.error('[BannedScreen] Fetch appeal error:', err);
    } finally {
      setLoadingAppeal(false);
    }
  };

  useEffect(() => {
    fetchAppeal();
  }, [profile?.id]);

  const handleSubmitAppeal = async () => {
    if (!appealMessage.trim()) {
      showToast('Please type an appeal message before submitting.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('submit_citizen_appeal', {
        p_message: appealMessage.trim(),
      });

      if (error) throw error;

      showToast('Your appeal has been submitted to your LGU administrators for review.', 'success');

      setAppealMessage('');
      fetchAppeal();
      refreshProfile();
    } catch (err: any) {
      console.error('[handleSubmitAppeal] Error:', err);
      showToast(err.message || 'Could not submit appeal.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ padding: 24, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Warning Icon */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                width: 80, height: 80, borderRadius: 40,
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                justifyContent: 'center', alignItems: 'center', marginBottom: 16,
              }}>
                <Warning2 size={44} color={isDarkMode ? '#F87171' : '#DC2626'} variant="Bold" />
              </View>

              <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 24, textAlign: 'center', marginBottom: 8 }}>
                Account Suspended
              </Text>

              <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 16, lineHeight: 20 }}>
                Your account has been suspended due to violations of community guidelines.
              </Text>
            </View>

            {/* Reason Card */}
            {profile?.moderation_reason && (
              <View style={{
                backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                borderWidth: 1,
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
              }}>
                <Text style={{ fontFamily: 'Octarine-Bold', color: isDarkMode ? '#F87171' : '#DC2626', fontSize: 13, marginBottom: 4 }}>
                  REASON FOR SUSPENSION:
                </Text>
                <Text style={{ fontFamily: 'Inter-Medium', color: T.text, fontSize: 14, lineHeight: 20 }}>
                  {profile.moderation_reason}
                </Text>
              </View>
            )}

            {/* In-Person Note Card */}
            <View style={{
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              borderColor: T.border,
              borderWidth: 1,
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}>
              <Location size={20} color={T.accent} variant="Bold" style={{ marginRight: 12, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 13, marginBottom: 2 }}>
                  In-Person Appeal
                </Text>
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 13, lineHeight: 18 }}>
                  You may also visit your Municipal Hall in person during office hours (Mon–Fri, 8 AM–5 PM) with a valid ID to present your appeal directly.
                </Text>
              </View>
            </View>

            {/* Appeal Section */}
            <View style={{
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
              borderColor: T.border,
              borderWidth: 1,
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
            }}>
              <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 16, marginBottom: 12 }}>
                Submit an Appeal
              </Text>

              {loadingAppeal ? (
                <ActivityIndicator size="small" color={T.accent} style={{ padding: 20 }} />
              ) : existingAppeal && existingAppeal.status === 'pending' ? (
                <View style={{ backgroundColor: isDarkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.08)', borderRadius: 14, padding: 14, borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Clock size={18} color="#F59E0B" variant="Bold" style={{ marginRight: 6 }} />
                    <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 14 }}>
                      Appeal Submitted — Pending Review
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 8 }}>
                    "{existingAppeal.message}"
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 11 }}>
                    Submitted on {new Date(existingAppeal.created_at).toLocaleDateString()}
                  </Text>
                </View>
              ) : existingAppeal && existingAppeal.status === 'denied' ? (
                <View style={{ gap: 12 }}>
                  <View style={{ backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.06)', borderRadius: 14, padding: 14, borderLeftWidth: 4, borderLeftColor: '#EF4444', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <CloseCircle size={18} color="#EF4444" variant="Bold" style={{ marginRight: 6 }} />
                      <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 14 }}>
                        Prior Appeal Reviewed: Denied
                      </Text>
                    </View>
                    {existingAppeal.admin_response && (
                      <Text style={{ fontFamily: 'Inter-Medium', color: T.text, fontSize: 13, lineHeight: 18 }}>
                        Note: {existingAppeal.admin_response}
                      </Text>
                    )}
                  </View>

                  <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 12, marginBottom: 8 }}>
                    If you have additional context or documentation, you may submit a follow-up message below:
                  </Text>

                  <TextInput
                    multiline
                    numberOfLines={4}
                    placeholder="Explain why your account should be reinstated..."
                    placeholderTextColor={T.textMuted}
                    value={appealMessage}
                    onChangeText={setAppealMessage}
                    style={{
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
                      borderColor: T.border,
                      borderWidth: 1,
                      borderRadius: 14,
                      padding: 14,
                      color: T.text,
                      fontFamily: 'Inter-Medium',
                      fontSize: 14,
                      textAlignVertical: 'top',
                      minHeight: 100,
                      marginBottom: 12,
                    }}
                  />

                  <TouchableOpacity
                    style={{
                      height: 48,
                      borderRadius: 999,
                      backgroundColor: T.accent,
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'row',
                      opacity: submitting ? 0.7 : 1,
                    }}
                    onPress={handleSubmitAppeal}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Send2 size={18} color="#FFFFFF" variant="Bold" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#FFFFFF', fontFamily: 'Octarine-Bold', fontSize: 14 }}>
                          Submit Follow-up Appeal
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 13, marginBottom: 12, lineHeight: 18 }}>
                    If you believe this suspension is a mistake, you can submit a statement to your LGU administration below.
                  </Text>

                  <TextInput
                    multiline
                    numberOfLines={4}
                    placeholder="State your appeal message here..."
                    placeholderTextColor={T.textMuted}
                    value={appealMessage}
                    onChangeText={setAppealMessage}
                    style={{
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
                      borderColor: T.border,
                      borderWidth: 1,
                      borderRadius: 14,
                      padding: 14,
                      color: T.text,
                      fontFamily: 'Inter-Medium',
                      fontSize: 14,
                      textAlignVertical: 'top',
                      minHeight: 100,
                      marginBottom: 14,
                    }}
                  />

                  <TouchableOpacity
                    style={{
                      height: 48,
                      borderRadius: 999,
                      backgroundColor: T.accent,
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'row',
                      opacity: submitting ? 0.7 : 1,
                    }}
                    onPress={handleSubmitAppeal}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Send2 size={18} color="#FFFFFF" variant="Bold" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#FFFFFF', fontFamily: 'Octarine-Bold', fontSize: 14 }}>
                          Submit Appeal
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity
              style={{
                height: 50,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: T.border,
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
              }}
              onPress={signOut}
            >
              <Logout size={18} color={T.text} variant="Outline" style={{ marginRight: 8 }} />
              <Text style={{ color: T.text, fontFamily: 'Octarine-Bold', fontSize: 14 }}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}
