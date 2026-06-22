import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '../components/Screen';
import { Box, HStack, Icon, Text, VStack } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { TabContent } from './tabs/TabContent';
import type { TabKey } from './tabs/types';

type HomeScreenProps = {
  onLogout: () => void;
  userId?: number;
  username?: string;
};

type TabItem = {
  badge?: number;
  icon: ComponentProps<typeof Icon>['name'];
  key: TabKey;
  label: string;
};

const tabs: TabItem[] = [
  { icon: 'home', key: 'home', label: 'หน้าหลัก' },
  { icon: 'calendar-outline', key: 'booking', label: 'รายการจอง' },
  { icon: 'location-sharp', key: 'map', label: 'แผนที่' },
  {
    badge: 3,
    icon: 'notifications-outline',
    key: 'alerts',
    label: 'แจ้งเตือน',
  },
  { icon: 'person', key: 'profile', label: 'โปรไฟล์' },
];

export function HomeScreen({ onLogout, userId, username }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const contentBottomPadding = Math.round(
    Math.min(Math.max(height * 0.035, 20), 38),
  );

  return (
    <Screen>
      <Box flex={1} style={styles.container}>
        <AppHeader onAlertsPress={() => setActiveTab('alerts')} />
        <Box
          flex={1}
          style={[styles.screenArea, { paddingBottom: contentBottomPadding }]}
        >
          <TabContent
            activeTab={activeTab}
            onLogout={onLogout}
            onTabPress={setActiveTab}
            userId={userId}
            username={username}
          />
        </Box>
      </Box>
      <BottomTabBar
        activeTab={activeTab}
        bottomOffset={-(insets.bottom + spacing.lg)}
        bottomPadding={insets.bottom + 32}
        onTabPress={setActiveTab}
      />
    </Screen>
  );
}

function AppHeader({ onAlertsPress }: { onAlertsPress: () => void }) {
  return (
    <VStack space="lg" style={{ paddingHorizontal: spacing.sm }}>
      <HStack alignItems="center" justifyContent="space-between">
        <View style={styles.headerSpacer} />
        <Text style={styles.logo}>
          EV <Text style={styles.logoAccent}>PlusGO</Text>
        </Text>
        <Pressable onPress={onAlertsPress} style={styles.headerIcon}>
          <Icon name="notifications-outline" size={31} />
          <Box style={styles.notificationBadge}>
            <Text style={styles.notificationText}>3</Text>
          </Box>
        </Pressable>
      </HStack>
    </VStack>
  );
}

function BottomTabBar({
  activeTab,
  bottomOffset,
  bottomPadding,
  onTabPress,
}: {
  activeTab: TabKey;
  bottomOffset: number;
  bottomPadding: number;
  onTabPress: (tab: TabKey) => void;
}) {
  return (
    <HStack
      style={[
        styles.tabBar,
        {
          bottom: bottomOffset,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;

        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            style={styles.tabItem}
          >
            <Box>
              <Icon
                color={isActive ? colors.primary : '#9AA3AF'}
                name={tab.icon}
                size={26}
              />
              {tab.badge ? (
                <Box style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                </Box>
              ) : null}
            </Box>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </HStack>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0,
  },
  greetingSubtitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  greetingTitle: {
    fontSize: 31,
    fontWeight: '800',
    lineHeight: 39,
  },
  headerIcon: {
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  headerSpacer: {
    width: 32,
  },
  logo: {
    color: '#13BE61',
    fontSize: 28,
    fontStyle: 'italic',
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 34,
  },
  logoAccent: {
    color: '#079E47',
    fontSize: 25,
    fontStyle: 'italic',
    fontWeight: '900',
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    top: -1,
    width: 24,
  },
  notificationText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  screenArea: {
    paddingBottom: 0,
    paddingTop: 12,
  },
  tabBadge: {
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -10,
    top: -7,
    width: 20,
  },
  tabBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  tabBar: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 10,
    left: 0,
    paddingBottom: 32,
    paddingHorizontal: 14,
    paddingTop: 12,
    position: 'absolute',
    right: 0,
    shadowColor: '#0F172A',
    shadowOffset: { height: -5, width: 0 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    minHeight: 58,
  },
  tabLabel: {
    color: '#7C8796',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 4,
    minHeight: 30,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
});
