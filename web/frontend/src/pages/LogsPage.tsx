import { Page, Layout, Card, DataTable, Banner, EmptyState, Spinner } from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import type { RuleLog } from '../types';

export default function LogsPage() {
  const [logs, setLogs] = useState<RuleLog[]>([]);
  const { loading, error, request } = useApi<RuleLog[]>();

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await request('/api/logs?limit=100');
      if (data) {
        setLogs(data);
      }
    };
    fetchLogs();
  }, [request]);

  const rows = logs.map(log => [
    log.order_id || '-',
    log.tier_applied || '-',
    log.quantity?.toString() || '-',
    log.original_price ? `$${log.original_price.toFixed(2)}` : '-',
    log.adjusted_price ? `$${log.adjusted_price.toFixed(2)}` : '-',
    new Date(log.created_at!).toLocaleString(),
  ]);

  if (loading) {
    return (
      <Page title="Rule Logs">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Spinner size="large" />
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page title="Rule Logs">
      <Layout>
        {error && (
          <Layout.Section>
            <Banner status="critical">{error}</Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          {logs.length === 0 ? (
            <Card>
              <EmptyState
                heading="No logs yet"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>When pricing rules are applied to orders, they will appear here.</p>
              </EmptyState>
            </Card>
          ) : (
            <Card>
              <DataTable
                columnContentTypes={['text', 'text', 'numeric', 'numeric', 'numeric', 'text']}
                headings={['Order ID', 'Tier Applied', 'Quantity', 'Original', 'Adjusted', 'Date']}
                rows={rows}
              />
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

