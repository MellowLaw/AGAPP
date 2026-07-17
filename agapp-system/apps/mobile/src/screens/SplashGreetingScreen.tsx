import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { useAuth } from '../contexts/AuthContext';

export function SplashGreetingScreen({ navigation, onFinish }: any) {
  const { session, selectedLgu } = useAuth();
  const animationRef = useRef<LottieView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleTransition = () => {
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
  };

  useEffect(() => {
    // Start fade out at 4.5 seconds, fade takes 500ms, then transition
    const fadeTimeout = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        handleTransition();
      });
    }, 4500);

    return () => clearTimeout(fadeTimeout);
  }, [session, selectedLgu, navigation, fadeAnim]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFCF5', justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={{ width: '80%', height: '80%', opacity: fadeAnim, justifyContent: 'center', alignItems: 'center' }}>
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
    </View>
  );
}


