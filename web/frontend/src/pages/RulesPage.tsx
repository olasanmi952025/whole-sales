import { Page, Layout, Card, Button, Banner, EmptyState, Spinner, InlineStack } from '@shopify/polaris';
import { useState } from 'react';
import { usePricingRules } from '../hooks/usePricingRules';
import { useSessionStatus } from '../hooks/useSessionStatus';
import RulesList from '../components/RulesList';
import RuleForm from '../components/RuleForm';
import type { PricingRule } from '../types';

export default function RulesPage() {
  const { rules, loading, error, createRule, updateRule, deleteRule } = usePricingRules();
  const { needsAuth, checking, reinstallApp } = useSessionStatus();
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  const handleCreate = () => {
    setEditingRule(null);
    setShowForm(true);
  };

  const handleEdit = (rule: PricingRule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleSave = async (rule: PricingRule) => {
    const success = editingRule?.id
      ? await updateRule(editingRule.id, rule)
      : await createRule(rule);

    if (success) {
      setShowForm(false);
      setEditingRule(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRule(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      await deleteRule(id);
    }
  };

  if (loading && rules.length === 0) {
    return (
      <Page title="Pricing Rules">
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

  // Acciones del header
  const actions = [];
  
  if (needsAuth && !checking) {
    actions.push({
      content: 'Reinstalar App',
      onAction: reinstallApp,
      tone: 'critical' as const,
    });
  }

  return (
    <Page
      title="Pricing Rules"
      primaryAction={{
        content: 'Create Rule',
        onAction: handleCreate,
      }}
      secondaryActions={actions}
    >
      <Layout>
        {needsAuth && !checking && (
          <Layout.Section>
            <Banner
              title="App no autorizada"
              tone="warning"
              action={{
                content: 'Reinstalar ahora',
                onAction: reinstallApp
              }}
            >
              <p>La app necesita ser autorizada para acceder a los productos de Shopify.</p>
            </Banner>
          </Layout.Section>
        )}
        
        {error && (
          <Layout.Section>
            <Banner status="critical">{error}</Banner>
          </Layout.Section>
        )}

        {showForm && (
          <Layout.Section>
            <RuleForm
              rule={editingRule}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </Layout.Section>
        )}

        <Layout.Section>
          {rules.length === 0 ? (
            <Card>
              <EmptyState
                heading="No pricing rules yet"
                action={{
                  content: 'Create your first rule',
                  onAction: handleCreate,
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Create quantity-based pricing rules for your wholesale customers.</p>
              </EmptyState>
            </Card>
          ) : (
            <RulesList
              rules={rules}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

