import { TextField, Button, Text } from '@shopify/polaris';
import type { PricingTier } from '../types';

interface TiersInputProps {
  tiers: PricingTier[];
  onChange: (tiers: PricingTier[]) => void;
}

export default function TiersInput({ tiers, onChange }: TiersInputProps) {
  const addTier = () => {
    const lastQuantity = tiers.length > 0 
      ? Math.max(...tiers.map(t => t.min_quantity)) 
      : 0;
    onChange([...tiers, { 
      min_quantity: lastQuantity + 1, 
      price: 0, 
      currency: 'USD' 
    }]);
  };

  const updateTier = (index: number, field: keyof PricingTier, value: string) => {
    const newTiers = [...tiers];
    if (field === 'min_quantity') {
      newTiers[index][field] = parseInt(value) || 0;
    } else if (field === 'price') {
      newTiers[index][field] = parseFloat(value) || 0;
    }
    onChange(newTiers);
  };

  const removeTier = (index: number) => {
    if (tiers.length > 0) {
      onChange(tiers.filter((_, i) => i !== index));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="headingMd" as="h2">Price Tiers</Text>
        <Text variant="bodySm" as="span" tone="subdued">
          Configure at least one pricing tier
        </Text>
      </div>
      <div style={{ marginTop: '12px' }}>
        {tiers.length === 0 ? (
          <div style={{ 
            padding: '24px', 
            textAlign: 'center', 
            border: '1px dashed #ddd', 
            borderRadius: '4px',
            marginBottom: '12px'
          }}>
            <Text variant="bodyMd" as="p" tone="subdued">
              No pricing tiers configured yet.
            </Text>
            <Text variant="bodySm" as="p" tone="subdued">
              Click "Add First Tier" below to create your first pricing tier.
            </Text>
          </div>
        ) : null}
        {tiers.map((tier, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '12px',
            alignItems: 'flex-end'
          }}>
            <div style={{ flex: 1 }}>
              <TextField
                label="Min Quantity"
                type="number"
                value={tier.min_quantity.toString()}
                onChange={(value) => updateTier(index, 'min_quantity', value)}
                autoComplete="off"
                min="1"
              />
            </div>
            <div style={{ flex: 1 }}>
              <TextField
                label="Price"
                type="number"
                value={tier.price.toString()}
                onChange={(value) => updateTier(index, 'price', value)}
                autoComplete="off"
                prefix="$"
                min="0"
                step="0.01"
              />
            </div>
            <Button
              tone="critical"
              onClick={() => removeTier(index)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
      <Button onClick={addTier} variant="primary">
        {tiers.length === 0 ? 'Add First Tier' : 'Add Another Tier'}
      </Button>
    </div>
  );
}
