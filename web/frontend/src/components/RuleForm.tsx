import { Card, FormLayout, TextField, Select, Button, ButtonGroup, Checkbox, Banner } from '@shopify/polaris';
import { useState } from 'react';
import type { PricingRule, PricingTier, TargetType } from '../types';
import TiersInput from './TiersInput';
import ProductSelector from './ProductSelector';

interface RuleFormProps {
  rule: PricingRule | null;
  onSave: (rule: PricingRule) => void;
  onCancel: () => void;
}

export default function RuleForm({ rule, onSave, onCancel }: RuleFormProps) {
  const [ruleName, setRuleName] = useState(rule?.rule_name || '');
  const [targetType, setTargetType] = useState<TargetType>(rule?.target_type || 'product');
  const [targetId, setTargetId] = useState(rule?.target_id || '');
  const [priority, setPriority] = useState(rule?.priority?.toString() || '0');
  const [active, setActive] = useState(rule?.active ?? true);
  const [tiers, setTiers] = useState<PricingTier[]>(rule?.tiers || []);

  const targetTypeOptions = [
    { label: 'Product', value: 'product' },
    { label: 'Collection', value: 'collection' },
    { label: 'Variant', value: 'variant' },
  ];

  const handleSubmit = () => {
    const newRule: PricingRule = {
      rule_name: ruleName,
      target_type: targetType,
      target_id: targetId,
      priority: parseInt(priority),
      active,
      tiers: tiers.filter(t => t.min_quantity > 0 && t.discount_percentage >= 0 && t.discount_percentage <= 100),
    };

    onSave(newRule);
  };

  const isValid = ruleName && targetId && tiers.length > 0 && 
    tiers.every(t => t.min_quantity > 0 && t.discount_percentage >= 0 && t.discount_percentage <= 100);

  const hasInvalidTiers = tiers.length > 0 && tiers.some(t => 
    t.min_quantity <= 0 || t.discount_percentage < 0 || t.discount_percentage > 100
  );

  return (
    <Card>
      <div style={{ padding: '16px' }}>
        <FormLayout>
          {!rule && (
            <Banner tone="info">
              Configure your wholesale pricing rule. All prices must be manually set - no defaults are applied.
            </Banner>
          )}

          <TextField
            label="Rule Name"
            value={ruleName}
            onChange={setRuleName}
            autoComplete="off"
            placeholder="e.g., Wholesale Pricing Tier 1"
            requiredIndicator
          />

          <Select
            label="Target Type"
            options={targetTypeOptions}
            value={targetType}
            onChange={(value) => {
              setTargetType(value as TargetType);
              setTargetId('');
            }}
            helpText="Select what this rule applies to"
          />

          <ProductSelector
            targetType={targetType}
            value={targetId}
            onChange={setTargetId}
            error={!targetId && tiers.length > 0 ? 'Please select a target' : undefined}
          />

          <TextField
            label="Priority"
            type="number"
            value={priority}
            onChange={setPriority}
            autoComplete="off"
            helpText="Higher priority rules are applied first (0-100)"
            min="0"
            max="100"
          />

          <Checkbox
            label="Active"
            checked={active}
            onChange={setActive}
            helpText="Inactive rules will not be applied to orders"
          />

          <TiersInput
            tiers={tiers}
            onChange={setTiers}
          />

          {hasInvalidTiers && (
            <Banner tone="warning">
              Todos los niveles deben tener una cantidad mayor a 0 y un descuento entre 0% y 100%.
            </Banner>
          )}

          {tiers.length === 0 && (
            <Banner tone="critical">
              You must configure at least one pricing tier before saving.
            </Banner>
          )}

          <ButtonGroup>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!isValid}
            >
              {rule ? 'Update Rule' : 'Create Rule'}
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </ButtonGroup>
        </FormLayout>
      </div>
    </Card>
  );
}
