import { Frame, Navigation, TopBar } from '@shopify/polaris';
import { useState } from 'react';
import RulesPage from './pages/RulesPage';
import LogsPage from './pages/LogsPage';

type Page = 'rules' | 'logs';

export default function App() {
  const [activePage, setActivePage] = useState<Page>('rules');
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);

  const toggleMobileNavigation = () => {
    setMobileNavigationActive(prev => !prev);
  };

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={toggleMobileNavigation}
    />
  );

  const navigationMarkup = (
    <Navigation location="/">
      <Navigation.Section
        items={[
          {
            label: 'Pricing Rules',
            onClick: () => setActivePage('rules'),
            selected: activePage === 'rules',
          },
          {
            label: 'Logs',
            onClick: () => setActivePage('logs'),
            selected: activePage === 'logs',
          },
        ]}
      />
    </Navigation>
  );

  return (
    <Frame
      topBar={topBarMarkup}
      navigation={navigationMarkup}
      showMobileNavigation={mobileNavigationActive}
      onNavigationDismiss={toggleMobileNavigation}
    >
      {activePage === 'rules' && <RulesPage />}
      {activePage === 'logs' && <LogsPage />}
    </Frame>
  );
}

