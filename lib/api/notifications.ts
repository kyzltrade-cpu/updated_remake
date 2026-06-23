import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { createClient } from '../supabase';

// Configure local notification handlers (how they display when app is active)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as any),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    // 1. Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 2. If not granted, request them
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission for push notifications not granted.');
      return null;
    }

    // 3. Retrieve EAS project ID (required for Expo 54)
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn('[Notifications] EAS Project ID not found in Constants. Ensure eas.json is configured.');
    }

    // 4. Fetch Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    console.log('[Notifications] Retained Expo Push Token successfully:', token);

    // 5. Configure Android channel properties
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E8399A',
      });
    }

    return token;
  } catch (error) {
    console.warn('[Notifications] Error retrieving Expo push token:', error);
    return null;
  }
}

export async function savePushTokenToDb(userId: string, token: string): Promise<boolean> {
  try {
    const supabase = createClient() as any;
    const { error } = await supabase
      .from('profiles')
      .update({ expo_push_token: token })
      .eq('id', userId);

    if (error) {
      console.warn('[Notifications] Failed to save push token to Supabase:', error.message);
      return false;
    }

    console.log('[Notifications] Successfully saved push token to Supabase for user:', userId);
    return true;
  } catch (error) {
    console.error('[Notifications] Failed to write push token to DB:', error);
    return false;
  }
}

export async function setupUserPushNotifications(userId: string): Promise<string | null> {
  const token = await registerForPushNotificationsAsync();
  if (token) {
    await savePushTokenToDb(userId, token);
  }
  return token;
}
