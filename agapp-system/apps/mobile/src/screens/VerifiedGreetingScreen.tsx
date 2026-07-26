import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Scroll, Briefcase, Messages } from 'iconsax-react-native';

export function VerifiedGreetingScreen({ navigation }: any) {
  const { T, isDarkMode } = useTheme();
  const { selectedLgu } = useAuth();

  const handleDismiss = () => {
    if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation) {
      navigation.replace('Main');
    }
  };

  const lguName = selectedLgu?.name || 'your local municipality';

  const features = [
    {
      Icon: Scroll,
      title: 'File Official Reports',
      description: 'Submit community issues, infrastructure hazards, and emergencies directly to the LGU with real-time status updates.',
    },
    {
      Icon: Briefcase,
      title: 'Apply for Services',
      description: 'Avail municipal benefits, digital permits, local documents, and participate in LGU-sponsored programs.',
    },
    {
      Icon: Messages,
      title: 'Join the Forum Discussions',
      description: 'Start new discussion threads, share updates, and write replies to build a vibrant neighborhood community.',
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
          tintColor: T.accent,
        }}
        resizeMode="cover"
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 40, alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Sticker */}
          <Image
            source={require('../../assets/brand/stickers/11.png')}
            style={{ width: 160, height: 160, marginBottom: 20 }}
            resizeMode="contain"
          />

          {/* Heading */}
          <Text style={[styles.title, { color: T.text }]}>
            You're Now Verified!
          </Text>

          <Text style={[styles.subtitle, { color: T.textMuted }]}>
            Congratulations! Your account has been verified by the LGU of {lguName}. You now have full access to all verified citizen features:
          </Text>

          {/* Features list */}
          <View style={{ width: '100%', gap: 16, marginBottom: 32 }}>
            {features.map(({ Icon, title, description }, i) => (
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
                      backgroundColor: T.accentSoft,
                    },
                  ]}
                >
                  <Icon size={24} color={T.accent} variant="Bold" />
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

          {/* Action button */}
          <TouchableOpacity
            style={styles.btn}
            onPress={handleDismiss}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#FFFCF5', fontFamily: 'Octarine-Bold', fontSize: 16 }}>
              Continue to App
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Octarine-Bold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 12,
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
});
