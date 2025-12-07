import { Card, ResourceList, ResourceItem, Badge, Button, ButtonGroup, Text } from '@shopify/polaris';
import type { PricingRule } from '../types';

interface RulesListProps {
  rules: PricingRule[];
  onEdit: (rule: PricingRule) => void;
  onDelete: (id: number) => void;
}

export default function RulesList({ rules, onEdit, onDelete }: RulesListProps) {
  return (
    <Card>
      <ResourceList
        resourceName={{ singular: 'rule', plural: 'rules' }}
        items={rules}
        renderItem={(rule) => {
          const { id, rule_name, target_type, target_name, target_id, active, tiers } = rule;
          const tierCount = tiers?.length || 0;
          
          // Formatear el tipo de target
          const targetTypeLabel = target_type === 'product' ? 'Producto' : 
                                  target_type === 'variant' ? 'Variante' : 'Colección';
          
          // Usar el nombre si está disponible, sino el ID
          const targetDisplay = target_name || target_id;

          return (
            <ResourceItem
              id={id!.toString()}
              onClick={() => onEdit(rule)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <Text variant="bodyMd" fontWeight="bold" as="h3">
                    {rule_name}
                  </Text>
                  <Text variant="bodySm" as="p" tone="subdued" fontWeight="medium">
                    {targetTypeLabel}: {targetDisplay}
                  </Text>
                  <div style={{ marginTop: '4px' }}>
                    <Badge tone={active ? 'success' : 'attention'}>
                      {active ? 'Activa' : 'Inactiva'}
                    </Badge>
                    {' '}
                    <Text variant="bodySm" as="span" tone="subdued">
                      {tierCount} nivel{tierCount !== 1 ? 'es' : ''} de precio
                    </Text>
                  </div>
                </div>
                <ButtonGroup>
                  <Button onClick={(e) => {
                    e.stopPropagation();
                    onEdit(rule);
                  }}>
                    Edit
                  </Button>
                  <Button
                    tone="critical"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(id!);
                    }}
                  >
                    Delete
                  </Button>
                </ButtonGroup>
              </div>
            </ResourceItem>
          );
        }}
      />
    </Card>
  );
}

