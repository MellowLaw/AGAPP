import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const slides = [
  require('../../assets/brand/onboarding-1.png'),
  require('../../assets/brand/onboarding-2.png'),
  require('../../assets/brand/onboarding-3.png'),
];

export function OnboardingScreen({ navigation, onComplete }: any) {
  const { T } = useTheme();
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleFinishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      if (onComplete) onComplete();
      navigation.replace('GuestLguDetect');
    } catch (err) {
      console.warn('Failed to save onboarding progress:', err);
      if (onComplete) onComplete();
      navigation.replace('GuestLguDetect');
    }
  };

  const handleScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveSlide(slide);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFCF5' }}>
      {/* Swipeable full-bleed slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {slides.map((imgSource, idx) => (
          <View key={idx} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
            <Image
              source={imgSource}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>

      {/* Footer controls overlay */}
      <View style={{
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 36,
      }}>
        {/* Dot Pagination indicators */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: activeSlide === 2 ? 24 : 0 }}>
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={{
                width: idx === activeSlide ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: idx === activeSlide ? '#292929' : 'rgba(0,0,0,0.15)',
              }}
            />
          ))}
        </View>

        {/* "Get Started" button appears ONLY on the last slide */}
        {activeSlide === 2 && (
          <TouchableOpacity
            onPress={handleFinishOnboarding}
            activeOpacity={0.9}
            style={{
              width: '100%',
              height: 54,
              borderRadius: 999,
              backgroundColor: '#292929', // Ink black pill
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text style={{
              color: '#FFFCF5', // Cream text
              fontFamily: 'Octarine-Bold',
              fontSize: 15,
            }}>
              Get Started
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
