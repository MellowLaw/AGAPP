import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { globalStyles, PASTELS } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { AgappLogo } from '../components/AgappLogo';

const isExpoGo = Constants?.executionEnvironment === ExecutionEnvironment.StoreClient || Constants?.appOwnership === 'expo';

const getNotificationsModule = () => {
  if (isExpoGo) return null;
  try {
    return require('expo-notifications');
  } catch (e) {
    return null;
  }
};

const Notifications = getNotificationsModule();

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function NotificationsScreen({ navigation }: any) {
  const { profile } = useAuth();
  const { T } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    fetchNotifications();

    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, payload => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [profile]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) setNotifications(data);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <View style={[globalStyles.screen, { backgroundColor: T.bg }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: T.card, borderBottomWidth: 1, borderColor: T.border }}>
          <Ionicons name="arrow-back" size={24} color={T.text} onPress={() => navigation.goBack()} />
          <Text style={[globalStyles.serif, { color: T.text, fontSize: 22, marginLeft: 16 }]}>Notifications</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <Text style={{ color: T.textMuted, marginTop: 40, textAlign: 'center' }}>No notifications yet.</Text>
          ) : (
            notifications.map(n => (
              <View key={n.id} style={[globalStyles.card, { backgroundColor: n.is_read ? T.card : T.cardAlt, borderColor: T.border, padding: 16, marginBottom: 12 }]} onTouchEnd={() => !n.is_read && markAsRead(n.id)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <View style={{flex: 1}}>
                      <Text style={{ color: T.text, fontWeight: n.is_read ? '500' : '700', fontSize: 16, marginBottom: 4 }}>{n.title}</Text>
                      <Text style={{ color: T.textMuted, fontSize: 14 }}>{n.body}</Text>
                      <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 8 }}>{new Date(n.created_at).toLocaleString()}</Text>
                   </View>
                   {!n.is_read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F497A2', marginTop: 6 }} />}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}


