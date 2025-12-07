import { Page, Layout, Card, Button, Banner, Text, InlineStack, BlockStack } from '@shopify/polaris';
import { useState } from 'react';
import { useApi } from '../hooks/useApi';

export default function SettingsPage() {
  const { request } = useApi();
  const [isReinstalling, setIsReinstalling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'critical', content: string } | null>(null);

  const handleReinstallScripts = async () => {
    setIsReinstalling(true);
    setMessage(null);

    try {
      const result = await request('/api/settings/reinstall-script', {
        method: 'POST'
      });

      if (result) {
        setMessage({
          type: 'success',
          content: 'Scripts reinstalados exitosamente! Los cambios estarán disponibles en tu tienda en unos momentos.'
        });
      } else {
        setMessage({
          type: 'critical',
          content: 'Error al reinstalar los scripts. Por favor intenta de nuevo.'
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'critical',
        content: error.message || 'Error al reinstalar los scripts'
      });
    } finally {
      setIsReinstalling(false);
    }
  };

  return (
    <Page title="Configuración">
      <Layout>
        {message && (
          <Layout.Section>
            <Banner
              tone={message.type}
              onDismiss={() => setMessage(null)}
            >
              {message.content}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Scripts del Storefront
              </Text>
              
              <Text as="p" tone="subdued">
                Los scripts son necesarios para mostrar los precios mayoristas en tu tienda.
                Si realizaste cambios o los precios no aparecen correctamente, reinstala los scripts.
              </Text>

              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Scripts instalados:
                </Text>
                <ul style={{ paddingLeft: '20px' }}>
                  <li>wholesale-pricing.js - Muestra precios en páginas de productos</li>
                  <li>wholesale-draft-order.js - Botón de checkout mayorista en el carrito</li>
                </ul>
              </BlockStack>

              <InlineStack align="start">
                <Button
                  variant="primary"
                  onClick={handleReinstallScripts}
                  loading={isReinstalling}
                >
                  Reinstalar Scripts
                </Button>
              </InlineStack>

              <Banner tone="info">
                <BlockStack gap="200">
                  <Text as="p" fontWeight="semibold">
                    ¿Cuándo reinstalar los scripts?
                  </Text>
                  <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li>Después de actualizar la app</li>
                    <li>Si los precios mayoristas no aparecen en productos</li>
                    <li>Si el botón de checkout mayorista no aparece en el carrito</li>
                    <li>Si hay errores en la consola del navegador</li>
                  </ul>
                </BlockStack>
              </Banner>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                URLs de los Scripts
              </Text>
              
              <Text as="p" tone="subdued">
                Estas son las URLs de los scripts instalados en tu tienda:
              </Text>

              <BlockStack gap="200">
                <div style={{
                  background: '#f6f6f7',
                  padding: '12px',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  wordBreak: 'break-all'
                }}>
                  https://whole-sales-production.up.railway.app/wholesale-pricing.js
                </div>
                <div style={{
                  background: '#f6f6f7',
                  padding: '12px',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  wordBreak: 'break-all'
                }}>
                  https://whole-sales-production.up.railway.app/wholesale-draft-order.js
                </div>
              </BlockStack>

              <Text as="p" tone="subdued" variant="bodySm">
                Estos scripts se cargan automáticamente en todas las páginas de tu tienda.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Debug & Troubleshooting
              </Text>
              
              <Text as="p" tone="subdued">
                Si tienes problemas, abre la consola del navegador (F12) en tu tienda y busca mensajes que comiencen con:
              </Text>

              <BlockStack gap="200">
                <div style={{
                  background: '#f6f6f7',
                  padding: '8px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '11px'
                }}>
                  [Wholesale] ...
                </div>
                <div style={{
                  background: '#f6f6f7',
                  padding: '8px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '11px'
                }}>
                  [Wholesale Draft Order] ...
                </div>
              </BlockStack>

              <Text as="p" tone="subdued" variant="bodySm">
                Estos logs te ayudarán a identificar si los scripts se están cargando correctamente.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

