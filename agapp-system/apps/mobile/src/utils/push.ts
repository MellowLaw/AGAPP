import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants?.executionEnvironment === ExecutionEnvironment.StoreClient || Constants?.appOwnership === 'expo';

export const getNotificationsModule = () => {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-notifications');
  } catch (e) {
    return null;
  }
};

const Notifications = getNotificationsModule();

// Single source of truth for "which screen does a notification deep-link to",
// shared by the in-app tap handler (NotificationsScreen.tsx) and the OS-push
// tap handler (App.tsx) — previously each maintained its own copy of this
// mapping, which could silently drift out of sync.
export type NotificationTarget = { screen: string; params?: any };

export function resolveNotificationTarget(type: string, payload: any): NotificationTarget {
  const p = payload || {};
  if (type === 'report_status' && p.report_id) {
    return { screen: 'TrackingDetail', params: { id: p.report_id, type: 'report' } };
  }
  if (type === 'service_status' && p.request_id) {
    return { screen: 'TrackingDetail', params: { id: p.request_id, type: 'service' } };
  }
  if (type === 'verification_approved' || type === 'verification_rejected') {
    return { screen: 'VerifyIdentity' };
  }
  return { screen: 'Notifications' };
}

export function isNotificationNavigable(type: string, payload: any): boolean {
  const p = payload || {};
  return (
    (type === 'report_status' && !!p.report_id) ||
    (type === 'service_status' && !!p.request_id) ||
    type === 'verification_approved' ||
    type === 'verification_rejected'
  );
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web' || !Notifications) {
    return;
  }

  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice || isExpoGo) {
    const existingStatus = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus.granted;
    if (!existingStatus.granted) {
      const status = await Notifications.requestPermissionsAsync();
      finalStatus = status.granted;
    }
    if (!finalStatus) {
      console.log('Failed to get push token for push notification!');
      return;
    }
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      console.warn("Could not get push token. Note: In Expo Go, push tokens require a projectId configured in app.json.");
    }
  }

  return token;
}
