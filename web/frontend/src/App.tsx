import { Frame, Navigation, TopBar, Banner, Page, Spinner } from '@shopify/polaris';
import { useState } from 'react';
import RulesPage from './pages/RulesPage';
import LogsPage from './pages/LogsPage';
import SettingsPage from './pages/SettingsPage';
import { useShop } from './context/ShopContext';

type PageType = 'rules' | 'logs' | 'settings';

export default function App() {
  const [activePage, setActivePage] = useState<PageType>('rules');
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);
  const { shop, isLoading } = useShop();

  const toggleMobileNavigation = () => {
    setMobileNavigationActive(prev => !prev);
  };

  // Mostrar spinner mientras se carga el shop
  if (isLoading) {
    return (
      <Page>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spinner accessibilityLabel="Loading" size="large" />
        </div>
      </Page>
    );
  }

  // Mostrar error si no se encuentra el shop
  if (!shop) {
    return (
      <Page>
        <Banner tone="critical">
          <p>Error: No se pudo identificar la tienda. Por favor, reinstala la app.</p>
          <p style={{ marginTop: '1rem' }}>
            Para instalar la app, visita desde el admin de Shopify o usa la URL de instalación correcta con el parámetro shop.
          </p>
        </Banner>
      </Page>
    );
  }

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
          {
            label: 'Settings',
            onClick: () => setActivePage('settings'),
            selected: activePage === 'settings',
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
      {activePage === 'settings' && <SettingsPage />}
    </Frame>
  );
}

