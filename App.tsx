import { useEffect, useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GluestackUIProvider } from './src/components/ui';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SplashScreen } from './src/screens/SplashScreen';
import {
  initializeFirebaseMessaging,
  subscribeToFirebaseMessages,
} from './src/services/notifications/firebaseMessaging';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 1400);
    const unsubscribeFirebaseMessages = subscribeToFirebaseMessages();

    initializeFirebaseMessaging().catch(error => {
      console.warn('Unable to initialize Firebase messaging:', error);
    });

    return () => {
      clearTimeout(timer);
      unsubscribeFirebaseMessages();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <GluestackUIProvider colorMode={isDarkMode ? 'dark' : 'light'}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        {isSplashVisible ? <SplashScreen /> : <AppNavigator />}
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}

export default App;
