import React, { useRef } from 'react';
import { View, Animated, TouchableOpacity, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export function SplashGreetingScreen({ navigation, onFinish }: any) {
  const { session, selectedLgu } = useAuth();
  const { T } = useTheme();
  const animationRef = useRef<LottieView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleTransition = () => {
    // Fade out first before transitioning to make it look smooth
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onFinish) {
        onFinish();
        return;
      }
      if (!navigation) return;
      if (session) {
        if (selectedLgu) {
          navigation.replace('Main');
        } else {
          navigation.replace('LguSelect');
        }
      } else {
        navigation.replace('Login');
      }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFCF5', justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={{ width: '80%', height: '70%', opacity: fadeAnim, justifyContent: 'center', alignItems: 'center' }}>
        <LottieView
          ref={animationRef}
          source={require('../../assets/brand/pagbati.json')}
          style={{ width: '100%', height: '100%' }}
          autoPlay
          loop={false}
          renderMode="HARDWARE"
          resizeMode="contain"
        />
      </Animated.View>

      {/* Manual "Continue to Agapp" button at the bottom */}
      <Animated.View style={{ width: '100%', paddingHorizontal: 24, paddingBottom: 48, opacity: fadeAnim }}>
        <TouchableOpacity
          style={{
            height: 52,
            borderRadius: 999, // Pill layout
            backgroundColor: '#292929',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 3.84,
            elevation: 3,
          }}
          onPress={handleTransition}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#FFFCF5', fontFamily: 'Octarine-Bold', fontSize: 15 }}>
            Continue to Agapp
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}


