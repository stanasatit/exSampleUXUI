import { AlertsTabScreen } from './AlertsTabScreen';
import { BookingTabScreen } from './BookingTabScreen';
import { HomeTabScreen } from './HomeTabScreen';
import { MapTabScreen } from './MapTabScreen';
import { ProfileTabScreen } from './ProfileTabScreen';
import type { TabKey } from './types';

type TabContentProps = {
  activeTab: TabKey;
  onLogout: () => void;
};

export function TabContent({ activeTab, onLogout }: TabContentProps) {
  switch (activeTab) {
    case 'booking':
      return <BookingTabScreen />;
    case 'map':
      return <MapTabScreen />;
    case 'alerts':
      return <AlertsTabScreen />;
    case 'profile':
      return <ProfileTabScreen onLogout={onLogout} />;
    case 'home':
    default:
      return <HomeTabScreen />;
  }
}
