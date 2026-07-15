import React, { useEffect } from 'react';
import { View, Image } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export function SplashGreetingScreen({ navigation }: any) {
  const { session, selectedLgu } = useAuth();

  useEffect(() => {
    if (!navigation) return;

    const timer = setTimeout(() => {
      if (session) {
        if (selectedLgu) {
          navigation.replace('Main');
        } else {
          navigation.replace('LguSelect');
        }
      } else {
        navigation.replace('Login');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [session, selectedLgu, navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFCF5' }}>
      <Image
        source={require('../../assets/brand/pagbati-splash.png')}
        style={{ flex: 1, width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </View>
  );
}
