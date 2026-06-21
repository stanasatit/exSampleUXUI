import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../hooks/useAuth';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { isLoggedIn, login, logout } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="Home">
            {() => <HomeScreen onLogout={logout} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Login">
              {({ navigation }) => (
                <LoginScreen
                  onForgotPasswordPress={() => navigation.navigate('ForgotPassword')}
                  onLogin={login}
                  onRegisterPress={() => navigation.navigate('Register')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="ForgotPassword">
              {({ navigation }) => (
                <ForgotPasswordScreen
                  onBackPress={() => navigation.goBack()}
                  onResetPasswordRequested={username =>
                    navigation.navigate('ResetPassword', { username })
                  }
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="ResetPassword">
              {({ navigation, route }) => (
                <ResetPasswordScreen
                  onBackPress={() => navigation.goBack()}
                  onResetDone={() => navigation.popToTop()}
                  username={route.params.username}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {({ navigation }) => (
                <RegisterScreen
                  onBackPress={() => navigation.goBack()}
                  onRegistered={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
