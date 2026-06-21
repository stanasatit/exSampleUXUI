import { StyleSheet, View } from 'react-native';

import { Text, VStack } from '../../components/ui';

export function HomeTabScreen() {
  return (
    <View style={styles.homeContainer}>
      <VStack space="xs">
        <Text style={styles.greetingTitle}>สวัสดี, สุรสิทธิ์ 👋</Text>
        <Text tone="muted" style={styles.greetingSubtitle}>
          พร้อมชาร์จพลังงานไปด้วยกัน!
        </Text>
      </VStack>
    </View>
  );
}

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  greetingSubtitle: {
    fontSize: 16,
  },
});
