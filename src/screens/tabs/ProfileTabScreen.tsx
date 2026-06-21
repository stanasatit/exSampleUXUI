import { Pressable, StyleSheet } from 'react-native';

import { Icon, Text, VStack } from '../../components/ui';
import { colors } from '../../constants/theme';

type ProfileTabScreenProps = {
  onLogout: () => void;
};

export function ProfileTabScreen({ onLogout }: ProfileTabScreenProps) {
  return (
    <VStack alignItems="center" justifyContent="center" style={styles.container}>
      <Icon color="#9AA3AF" name="person" size={46} />
      <Text style={styles.title}>โปรไฟล์</Text>
      <Pressable onPress={onLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>ออกจากระบบ</Text>
      </Pressable>
    </VStack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 10,
  },
  logoutButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  logoutText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 19,
  },
  title: {
    color: '#64748B',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
});
