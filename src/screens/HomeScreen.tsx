import { StyleSheet } from 'react-native';

import { Screen } from '../components/Screen';
import {
  Box,
  Button,
  ButtonIcon,
  ButtonText,
  Card,
  Heading,
  HStack,
  Icon,
  Text,
  VStack,
} from '../components/ui';
import { colors } from '../constants/theme';

type HomeScreenProps = {
  onLogout: () => void;
};

export function HomeScreen({ onLogout }: HomeScreenProps) {
  return (
    <Screen>
      <Box flex={1} justifyContent="space-between">
        <VStack space="lg">
          <HStack alignItems="center" justifyContent="space-between">
            <Box style={styles.iconBadge}>
              <Icon color={colors.primary} name="apps" size={28} />
            </Box>
            <Text tone="muted" variant="caption" weight="semibold">
              gluestack UI
            </Text>
          </HStack>

          <VStack space="sm">
            <Text variant="eyebrow">React Native Training</Text>
            <Heading>EVPlugGo</Heading>
            <Text tone="muted">
              Login flow is active. This screen is shown after a successful
              sign in.
            </Text>
          </VStack>

          <Card>
            <HStack alignItems="center" space="md">
              <Box style={styles.cardIcon}>
                <Icon color={colors.white} name="shield-checkmark" size={22} />
              </Box>
              <VStack flex={1} space="xs">
                <Text weight="bold">Authenticated</Text>
                <Text tone="muted" variant="caption">
                  Navigation switches route groups from Login to Home.
                </Text>
              </VStack>
            </HStack>
          </Card>
        </VStack>

        <Button action="secondary" onPress={onLogout}>
          <ButtonIcon name="log-out-outline" />
          <ButtonText>Logout</ButtonText>
        </Button>
      </Box>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
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
