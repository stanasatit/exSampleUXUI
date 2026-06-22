import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { HStack, Icon, Text, VStack } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';

type AlertCategory = 'all' | 'booking' | 'charging' | 'promotion' | 'system';

type AlertItem = {
  accentColor: string;
  category: Exclude<AlertCategory, 'all'>;
  icon: ComponentProps<typeof Icon>['name'];
  id: string;
  isUnread?: boolean;
  lines: string[];
  timestamp: string;
  title: string;
};

const filters: { key: AlertCategory; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'booking', label: 'การจอง' },
  { key: 'charging', label: 'การชาร์จ' },
  { key: 'promotion', label: 'โปรโมชั่น' },
  { key: 'system', label: 'ระบบ' },
];

const alertItems: AlertItem[] = [
  {
    accentColor: '#16B968',
    category: 'booking',
    icon: 'calendar',
    id: 'booking-confirmed',
    isUnread: true,
    lines: ['PTT EV Station วันที่ 23 มิ.ย. 2569', '10:00 - 12:00 น.'],
    timestamp: '2 นาทีที่แล้ว',
    title: 'การจองได้รับการยืนยัน',
  },
  {
    accentColor: '#2563EB',
    category: 'charging',
    icon: 'flash',
    id: 'charging-started',
    isUnread: true,
    lines: ['PTT EV Station หัวชาร์จ 2', 'DC 120 kW'],
    timestamp: '09:50 น.',
    title: 'เริ่มต้นการชาร์จ',
  },
  {
    accentColor: '#16B968',
    category: 'charging',
    icon: 'battery-charging',
    id: 'charging-completed',
    lines: ['พลังงานที่ได้รับ 35.2 kWh', 'ค่าใช้จ่าย ฿281.60'],
    timestamp: '18:20 น.',
    title: 'ชาร์จเสร็จสิ้น',
  },
  {
    accentColor: '#D97706',
    category: 'promotion',
    icon: 'gift',
    id: 'promotion',
    lines: ['ลด 20% สำหรับการชาร์จ DC Fast Charge', 'ถึง 31 ก.ค. 2569'],
    timestamp: 'เมื่อวาน',
    title: 'โปรโมชั่นพิเศษสำหรับคุณ!',
  },
  {
    accentColor: '#7C3AED',
    category: 'system',
    icon: 'megaphone',
    id: 'system-update',
    lines: ['ระบบจะปิดปรับปรุงวันที่ 25 มิ.ย. 2569', 'เวลา 01:00 - 04:00 น.'],
    timestamp: '2 วันที่แล้ว',
    title: 'อัปเดตระบบ',
  },
];

export function AlertsTabScreen() {
  const [activeFilter, setActiveFilter] = useState<AlertCategory>('all');
  const visibleItems =
    activeFilter === 'all'
      ? alertItems
      : alertItems.filter(item => item.category === activeFilter);

  return (
    <VStack style={styles.container}>
      <Text style={styles.pageTitle}>แจ้งเตือน</Text>

      <ScrollView
        contentContainerStyle={styles.filterContent}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {filters.map(filter => {
          const isActive = filter.key === activeFilter;
          return (
            <Pressable
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterText,
                  isActive && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      >
        {visibleItems.map(item => (
          <AlertCard item={item} key={item.id} />
        ))}
      </ScrollView>
    </VStack>
  );
}

function AlertCard({ item }: { item: AlertItem }) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View
        style={[
          styles.iconBox,
          { backgroundColor: withAlpha(item.accentColor) },
        ]}
      >
        <Icon color={item.accentColor} name={item.icon} size={28} />
      </View>

      <VStack flex={1} style={styles.cardBody}>
        <HStack alignItems="flex-start" justifyContent="space-between">
          <Text numberOfLines={1} style={styles.cardTitle}>
            {item.title}
          </Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </HStack>

        {item.lines.map(line => (
          <Text key={line} numberOfLines={1} style={styles.cardLine}>
            {line}
          </Text>
        ))}
      </VStack>

      {item.isUnread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

function withAlpha(hexColor: string) {
  return `${hexColor}18`;
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    elevation: 4,
    flexDirection: 'row',
    gap: 14,
    minHeight: 118,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#0F172A',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardBody: {
    gap: 3,
    minWidth: 0,
  },
  cardLine: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  cardPressed: {
    opacity: 0.86,
  },
  cardTitle: {
    color: '#0F172A',
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    paddingRight: 8,
  },
  container: {
    flex: 1,
  },
  filterChip: {
    backgroundColor: colors.white,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterContent: {
    gap: 8,
    paddingHorizontal: spacing.md,
  },
  filterScroll: {
    flexGrow: 0,
    marginBottom: spacing.lg,
  },
  filterText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  filterTextActive: {
    color: colors.white,
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: 20,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 12,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  pageTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 30,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  timestamp: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
  },
  unreadDot: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    height: 8,
    marginLeft: 2,
    width: 8,
  },
});
