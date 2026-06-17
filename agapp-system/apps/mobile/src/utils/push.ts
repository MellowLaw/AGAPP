import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';

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

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web' || isExpoGo || !Notifications) {
    console.log('Skipping push notifications registration (web or expo go).');
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

  if (Device.isDevice) {
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
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } catch (e) {
      console.warn("Could not get push token. Note: Expo Go does not support push notifications in SDK 53+.");
    }
  }

  return token;
}
