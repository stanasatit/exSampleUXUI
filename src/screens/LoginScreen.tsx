import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { Screen } from '../components/Screen';
import {
  Box,
  Button,
  ButtonIcon,
  ButtonText,
  Card,
  Heading,
  Icon,
  Input,
  Text,
  VStack,
} from '../components/ui';
import { colors } from '../constants/theme';

type LoginScreenProps = {
  onLogin: (credentials: { password: string; username: string }) => boolean;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    const didLogin = onLogin({ password, username });

    setError(didLogin ? '' : 'Please enter username and password.');
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <Box flex={1} justifyContent="center">
          <Card>
            <VStack space="xl">
              <VStack space="sm">
                <Box style={styles.iconBadge}>
                  <Icon color={colors.primary} name="lock-closed" size={28} />
                </Box>
                <Text variant="eyebrow">Welcome</Text>
                <Heading>Login</Heading>
                <Text tone="muted">
                  Use any username and password to start the app.
                </Text>
              </VStack>

              <VStack space="md">
                <VStack space="sm">
                  <Text weight="semibold">Username</Text>
                  <Input
                    autoCapitalize="none"
                    autoCorrect={false}
                    leftIcon="person-outline"
                    onChangeText={setUsername}
                    placeholder="your name"
                    value={username}
                  />
                </VStack>

                <VStack space="sm">
                  <Text weight="semibold">Password</Text>
                  <Input
                    leftIcon="key-outline"
                    onChangeText={setPassword}
                    placeholder="password"
                    secureTextEntry
                    value={password}
                  />
                </VStack>

                {error.length > 0 ? (
                  <Text tone="danger" variant="caption" weight="semibold">
                    {error}
                  </Text>
                ) : null}

                <Button onPress={handleLogin}>
                  <ButtonIcon name="log-in-outline" />
                  <ButtonText>Login</ButtonText>
                </Button>
              </VStack>
            </VStack>
          </Card>
        </Box>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: colors.mutedSurface,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
});
