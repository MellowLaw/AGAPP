import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { globalStyles } from '../theme';
import { ArrowLeft2, ArrowRight2, Notification } from 'iconsax-react-native';

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
  const { T, isDarkMode } = useTheme();
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
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setNotifications(data);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const hasUnread = notifications.some(n => !n.is_read);

  // Mark as read then deep-link to the relevant screen
  const handleNotificationPress = async (n: any) => {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
    }

    const payload = n.payload || {};

    if (n.type === 'report_status' && payload.report_id) {
      navigation.navigate('TrackingDetail', { id: payload.report_id, type: 'report' });
    } else if (n.type === 'service_status' && payload.request_id) {
      navigation.navigate('TrackingDetail', { id: payload.request_id, type: 'service' });
    }
    // other types: just mark read, stay on the screen
  };

  const isNavigable = (n: any) =>
    (n.type === 'report_status' && n.payload?.report_id) ||
    (n.type === 'service_status' && n.payload?.request_id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      {/* Tinted Map Background */}
      <Image
        source={isDarkMode ? require('../../assets/brand/bg-map-2.png') : require('../../assets/brand/bg-map-1.png')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          opacity: isDarkMode ? 0.04 : 0.07,
          tintColor: T.accent,
        }}
        resizeMode="cover"
      />

      <View style={{ flex: 1 }}>
        {/* Header Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderColor: T.border,
        }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <ArrowLeft2 size={30} color={T.text} variant="Outline" />
          </TouchableOpacity>
          <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 20, marginLeft: 16, flex: 1 }}>Notifications</Text>
          {hasUnread && (
            <TouchableOpacity
              onPress={markAllAsRead}
              activeOpacity={0.75}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: T.accentSoft,
              }}
            >
              <Text style={{
                color: T.onAccentSoft,
                fontFamily: 'Octarine-Bold',
                fontSize: 12,
              }}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
              <Image
                source={require('../../assets/brand/mascot.png')}
                style={{ width: 120, height: 120, opacity: 0.6, marginBottom: 16 }}
                resizeMode="contain"
              />
              <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 15, textAlign: 'center' }}>
                No notifications yet.
              </Text>
            </View>
          ) : (
            notifications.map(n => (
              <TouchableOpacity
                key={n.id}
                style={{
                  backgroundColor: n.is_read ? T.card : T.cardAlt,
                  borderWidth: 1,
                  borderColor: T.border,
                  borderRadius: 20, // card radii 20
                  padding: 16,
                  marginBottom: 12,
                }}
                onPress={() => handleNotificationPress(n)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: n.is_read ? T.cardAlt : T.accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Notification size={18} color={n.is_read ? T.text : '#292929'} variant={n.is_read ? 'Linear' : 'Bold'} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: T.text,
                      fontFamily: 'Octarine-Bold',
                      fontSize: 15,
                      marginBottom: 4,
                    }}>
                      {n.title}
                    </Text>
                    <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 13, lineHeight: 18 }}>
                      {n.body}
                    </Text>
                    <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 11, marginTop: 8 }}>
                      {new Date(n.created_at).toLocaleString()}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'center', gap: 6, marginTop: 2 }}>
                    {!n.is_read && (
                      <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#EF4444',
                      }} />
                    )}
                    {isNavigable(n) && (
                      <ArrowRight2 size={16} color={T.textMuted} variant="Outline" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
