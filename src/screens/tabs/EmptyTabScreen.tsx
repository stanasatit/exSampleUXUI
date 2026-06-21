import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

import { Icon, Text, VStack } from '../../components/ui';

type EmptyTabScreenProps = {
  icon: ComponentProps<typeof Icon>['name'];
  title: string;
};

export function EmptyTabScreen({ icon, title }: EmptyTabScreenProps) {
  return (
    <VStack alignItems="center" justifyContent="center" style={styles.container}>
      <Icon color="#9AA3AF" name={icon} size={46} />
      <Text style={styles.title}>{title}</Text>
    </VStack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 10,
  },
  title: {
    color: '#64748B',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
});
