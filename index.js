/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { registerFirebaseBackgroundHandler } from './src/services/notifications/firebaseMessaging';

registerFirebaseBackgroundHandler();
AppRegistry.registerComponent(appName, () => App);
