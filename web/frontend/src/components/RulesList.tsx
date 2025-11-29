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
          const { id, rule_name, target_type, active, tiers } = rule;
          const tierCount = tiers?.length || 0;

          return (
            <ResourceItem
              id={id!.toString()}
              onClick={() => onEdit(rule)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text variant="bodyMd" fontWeight="bold" as="h3">
                    {rule_name}
                  </Text>
                  <div style={{ marginTop: '4px' }}>
                    <Badge tone={active ? 'success' : 'attention'}>
                      {active ? 'Active' : 'Inactive'}
                    </Badge>
                    {' '}
                    <Badge>{target_type}</Badge>
                    {' '}
                    <Text variant="bodySm" as="span" tone="subdued">
                      {tierCount} tier{tierCount !== 1 ? 's' : ''}
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

