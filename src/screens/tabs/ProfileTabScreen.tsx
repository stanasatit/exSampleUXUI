import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { HStack, Icon, Text, VStack } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';

type ProfileTabScreenProps = {
  onLogout: () => void;
};

type StatItem = {
  label: string;
  value: string;
};

type MenuItem = {
  icon: ComponentProps<typeof Icon>['name'];
  label: string;
};

const stats: StatItem[] = [
  { label: 'การชาร์จทั้งหมด', value: '125\nครั้ง' },
  { label: 'พลังงานรวม', value: '2,540\nkWh' },
  { label: 'ค่าใช้จ่ายรวม', value: '18,950\nบาท' },
];

const menuItems: MenuItem[] = [
  { icon: 'car-sport-outline', label: 'รถของฉัน' },
  { icon: 'calendar-outline', label: 'ประวัติการชาร์จ' },
  { icon: 'card-outline', label: 'วิธีการชำระเงิน' },
  { icon: 'gift-outline', label: 'คูปอง & สิทธิพิเศษ' },
  { icon: 'settings-outline', label: 'ตั้งค่า' },
  { icon: 'help-circle-outline', label: 'ช่วยเหลือ & ติดต่อเรา' },
];

export function ProfileTabScreen({ onLogout }: ProfileTabScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      <View style={styles.memberCard}>
        <HStack alignItems="center" style={styles.memberRow}>
          <View style={styles.avatar}>
            <Icon color="#0F9F58" name="person" size={46} />
          </View>

          <VStack flex={1} style={styles.memberInfo}>
            <HStack alignItems="center" justifyContent="space-between">
              <Text numberOfLines={1} style={styles.memberName}>
                สุรสิทธิ์ ธนสถิตย์
              </Text>
              <Icon color="#FFFFFF" name="chevron-forward" size={24} />
            </HStack>
            <Text style={styles.memberSubtitle}>EVPlus Member 👑</Text>
            <View style={styles.tierPill}>
              <Text style={styles.tierText}>Gold Tier</Text>
            </View>
            <Text numberOfLines={1} style={styles.vehicleText}>
              Tesla Model 3 • กข 1234
            </Text>
          </VStack>
        </HStack>
      </View>

      <HStack style={styles.statsRow}>
        {stats.map(stat => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </HStack>

      <View style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [
              styles.menuItem,
              index < menuItems.length - 1 && styles.menuDivider,
              pressed && styles.menuPressed,
            ]}
          >
            <HStack alignItems="center" style={styles.menuLeft}>
              <Icon color="#64748B" name={item.icon} size={22} />
              <Text style={styles.menuText}>{item.label}</Text>
            </HStack>
            <Icon color="#94A3B8" name="chevron-forward" size={22} />
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={onLogout}
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.logoutPressed,
        ]}
      >
        <Icon color={colors.danger} name="log-out-outline" size={22} />
        <Text style={styles.logoutText}>ออกจากระบบ</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: '#EAF8F0',
    borderColor: '#FFFFFF',
    borderRadius: 42,
    borderWidth: 3,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  container: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    elevation: 3,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 64,
    shadowColor: '#0F172A',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  logoutPressed: {
    opacity: 0.82,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  memberCard: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    elevation: 6,
    padding: spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  memberInfo: {
    gap: 4,
  },
  memberName: {
    color: colors.white,
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  memberRow: {
    gap: spacing.md,
  },
  memberSubtitle: {
    color: '#E9FFF3',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    elevation: 4,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
  },
  menuDivider: {
    borderBottomColor: '#EEF2F7',
    borderBottomWidth: 1,
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 62,
    paddingHorizontal: spacing.md,
  },
  menuLeft: {
    gap: spacing.base,
  },
  menuPressed: {
    backgroundColor: '#F8FAFC',
  },
  menuText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    elevation: 3,
    flex: 1,
    justifyContent: 'center',
    minHeight: 106,
    paddingHorizontal: spacing.sm,
    shadowColor: '#0F172A',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'center',
  },
  statsRow: {
    gap: spacing.sm,
  },
  statValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 27,
    textAlign: 'center',
  },
  tierPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#8A6A12',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 4,
  },
  tierText: {
    color: '#FFECA6',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  vehicleText: {
    color: '#DFFCEB',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 2,
  },
});
