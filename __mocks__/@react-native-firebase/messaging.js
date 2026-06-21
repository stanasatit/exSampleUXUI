const messaging = {};

module.exports = {
  AuthorizationStatus: {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
    EPHEMERAL: 3,
  },
  getInitialNotification: () => Promise.resolve(null),
  getMessaging: () => messaging,
  getToken: () => Promise.resolve('test-fcm-token'),
  onMessage: () => () => {},
  onNotificationOpenedApp: () => () => {},
  onTokenRefresh: () => () => {},
  registerDeviceForRemoteMessages: () => Promise.resolve(),
  requestPermission: () => Promise.resolve(1),
  setBackgroundMessageHandler: () => {},
};
