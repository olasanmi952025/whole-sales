import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import App from './App';
import { ShopProvider } from './context/ShopContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider i18n={{}}>
      <ShopProvider>
        <App />
      </ShopProvider>
    </AppProvider>
  </React.StrictMode>
);

