import { AlertsTabScreen } from './AlertsTabScreen';
import { BookingTabScreen } from './BookingTabScreen';
import { HomeTabScreen } from './HomeTabScreen';
import { MapTabScreen } from './MapTabScreen';
import { ProfileTabScreen } from './ProfileTabScreen';
import type { TabKey } from './types';

type TabContentProps = {
  activeTab: TabKey;
  onLogout: () => void;
  onTabPress: (tab: TabKey) => void;
  userId?: number;
  username?: string;
};

export function TabContent({
  activeTab,
  onLogout,
  onTabPress,
  userId,
  username,
}: TabContentProps) {
  switch (activeTab) {
    case 'booking':
      return <BookingTabScreen userId={userId} username={username} />;
    case 'map':
      return <MapTabScreen userId={userId} username={username} />;
    case 'alerts':
      return <AlertsTabScreen />;
    case 'profile':
      return <ProfileTabScreen onLogout={onLogout} />;
    case 'home':
    default:
      return (
        <HomeTabScreen
          onShowAllBookings={() => onTabPress('booking')}
          userId={userId}
          username={username}
        />
      );
  }
}
