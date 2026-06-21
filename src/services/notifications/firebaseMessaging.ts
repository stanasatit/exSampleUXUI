import { Platform, PermissionsAndroid } from 'react-native';
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
  setBackgroundMessageHandler,
  type RemoteMessage,
} from '@react-native-firebase/messaging';

const messaging = getMessaging();

function isNotificationAuthorized(status: number) {
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
}

async function requestAndroidNotificationPermission() {
  if (Platform.OS !== 'android' || Platform.Version < 33) {
    return true;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function requestNotificationPermission() {
  const androidGranted = await requestAndroidNotificationPermission();
  const status = await requestPermission(messaging);

  return androidGranted && isNotificationAuthorized(status);
}

export async function initializeFirebaseMessaging() {
  const isAuthorized = await requestNotificationPermission();

  if (!isAuthorized) {
    return null;
  }

  await registerDeviceForRemoteMessages(messaging);
  const token = await getToken(messaging);
  console.log('FCM token:', token);

  return token;
}

export function subscribeToFirebaseMessages() {
  const unsubscribeOnMessage = onMessage(
    messaging,
    async (remoteMessage: RemoteMessage) => {
      console.log('FCM foreground message:', remoteMessage);
    },
  );

  const unsubscribeTokenRefresh = onTokenRefresh(messaging, token => {
    console.log('FCM token refreshed:', token);
  });

  const unsubscribeOpenedApp = onNotificationOpenedApp(
    messaging,
    (remoteMessage: RemoteMessage) => {
      console.log('FCM notification opened:', remoteMessage);
    },
  );

  getInitialNotification(messaging).then(remoteMessage => {
    if (remoteMessage) {
      console.log('FCM initial notification:', remoteMessage);
    }
  });

  return () => {
    unsubscribeOnMessage();
    unsubscribeTokenRefresh();
    unsubscribeOpenedApp();
  };
}

export function registerFirebaseBackgroundHandler() {
  setBackgroundMessageHandler(
    messaging,
    async (remoteMessage: RemoteMessage) => {
      console.log('FCM background message:', remoteMessage);
    },
  );
}
