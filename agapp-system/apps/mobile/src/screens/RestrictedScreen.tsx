import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Image, StyleSheet, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { supabase } from '../../supabaseClient';
import { ShieldCross, Eye, MessageQuestion, CloseSquare, Danger } from 'iconsax-react-native';

export function RestrictedScreen({ navigation }: any) {
  const { T, isDarkMode } = useTheme();
  const { selectedLgu, profile } = useAuth();
  const { showToast } = useToast();

  const [appealModalOpen, setAppealModalOpen] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleDismiss = () => {
    if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation) {
      navigation.replace('Main');
    }
  };

  const handleSubmitAppeal = async () => {
    if (!appealText.trim()) {
      showToast('Please describe your appeal reason before submitting.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('submit_citizen_appeal', {
        p_message: appealText.trim(),
      });

      if (error) throw error;

      showToast('Your appeal has been submitted for LGU admin review.', 'success');
      setAppealModalOpen(false);
      setAppealText('');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit appeal. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const lguName = selectedLgu?.name || 'your local municipality';

  const notices = [
    {
      Icon: ShieldCross,
      title: 'Restricted Features',
      description: 'Filing official reports, posting new forum topics, and applying for eServices are currently paused for your account.',
    },
    {
      Icon: Eye,
      title: 'View-Only Access',
      description: 'You can still browse municipal announcements, view emergency guides, and check your previous request history.',
    },
    {
      Icon: MessageQuestion,
      title: 'Moderation Appeal',
      description: 'If you believe this restriction was issued by mistake, you can submit an appeal directly to your LGU administrators.',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Immersive background map */}
      <Image
        source={require('../../assets/brand/bg-map-2.png')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          opacity: isDarkMode ? 0.05 : 0.08,
          tintColor: '#EF4444',
        }}
        resizeMode="cover"
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 40, alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Sticker 14 */}
          <Image
            source={require('../../assets/brand/stickers/14.png')}
            style={{ width: 160, height: 160, marginBottom: 20 }}
            resizeMode="contain"
          />

          {/* Heading */}
          <Text style={[styles.title, { color: T.text }]}>
            Your Account is Restricted
          </Text>

          <Text style={[styles.subtitle, { color: T.textMuted }]}>
            Notice from the LGU of {lguName}. Your citizen account is currently operating under restricted status.
          </Text>

          {/* Moderation Reason Box */}
          {!!profile?.moderation_reason && (
            <View style={[styles.reasonBox, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
              <Danger size={20} color="#DC2626" variant="Bold" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Octarine-Bold', fontSize: 13, color: '#DC2626', marginBottom: 2 }}>
                  REASON FOR RESTRICTION
                </Text>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: T.text, lineHeight: 18 }}>
                  "{profile.moderation_reason}"
                </Text>
              </View>
            </View>
          )}

          {/* Notice list */}
          <View style={{ width: '100%', gap: 16, marginBottom: 32 }}>
            {notices.map(({ Icon, title, description }, i) => (
              <View
                key={i}
                style={[
                  styles.featureCard,
                  {
                    backgroundColor: T.card,
                    borderColor: T.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconWrapper,
                    {
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    },
                  ]}
                >
                  <Icon size={24} color="#DC2626" variant="Bold" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featureTitle, { color: T.text }]}>
                    {title}
                  </Text>
                  <Text style={[styles.featureDesc, { color: T.textMuted }]}>
                    {description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Action buttons */}
          <View style={{ width: '100%', gap: 12 }}>
            <TouchableOpacity
              style={styles.btn}
              onPress={handleDismiss}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFFCF5', fontFamily: 'Octarine-Bold', fontSize: 16 }}>
                Proceed to App
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.outlineBtn, { borderColor: T.border }]}
              onPress={() => setAppealModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={{ color: T.text, fontFamily: 'Octarine-Bold', fontSize: 16 }}>
                Submit an Appeal
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Appeal Submission Modal */}
      <Modal visible={appealModalOpen} transparent animationType="slide" onRequestClose={() => setAppealModalOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, backgroundColor: T.card, borderWidth: 1, borderColor: T.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 18 }}>Submit Appeal to LGU</Text>
              <TouchableOpacity onPress={() => setAppealModalOpen(false)}>
                <CloseSquare size={22} color={T.textMuted} variant="Bold" />
              </TouchableOpacity>
            </View>

            <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 13, lineHeight: 18, marginBottom: 16 }}>
              Explain clearly why you believe your account restriction should be lifted. Your appeal will be sent to your LGU administrators for review.
            </Text>

            <TextInput
              multiline
              numberOfLines={4}
              value={appealText}
              onChangeText={setAppealText}
              placeholder="Type your appeal message here..."
              placeholderTextColor={T.textMuted}
              style={{
                minHeight: 100,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: T.border,
                backgroundColor: T.bg,
                color: T.text,
                fontFamily: 'Inter-Medium',
                padding: 16,
                fontSize: 14,
                textAlignVertical: 'top',
                marginBottom: 20,
              }}
            />

            <TouchableOpacity
              onPress={handleSubmitAppeal}
              disabled={submitting}
              activeOpacity={0.9}
              style={{
                height: 52,
                borderRadius: 999,
                backgroundColor: '#292929',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFCF5', fontFamily: 'Octarine-Bold', fontSize: 15 }}>Send Appeal</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Octarine-Bold',
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  reasonBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontFamily: 'Octarine-Bold',
    fontSize: 15,
    marginBottom: 4,
  },
  featureDesc: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  btn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#292929',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  outlineBtn: {
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});
