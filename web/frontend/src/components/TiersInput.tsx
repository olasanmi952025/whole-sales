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
      discount_percentage: 0, 
      currency: 'USD' 
    }]);
  };

  const updateTier = (index: number, field: keyof PricingTier, value: string) => {
    const newTiers = [...tiers];
    if (field === 'min_quantity') {
      newTiers[index][field] = parseInt(value) || 0;
    } else if (field === 'discount_percentage') {
      let discount = parseFloat(value) || 0;
      // Validar que esté entre 0 y 100
      discount = Math.max(0, Math.min(100, discount));
      newTiers[index][field] = discount;
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
        <Text variant="headingMd" as="h2">Niveles de Descuento</Text>
        <Text variant="bodySm" as="span" tone="subdued">
          Configura al menos un nivel de descuento
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
              No hay niveles de descuento configurados.
            </Text>
            <Text variant="bodySm" as="p" tone="subdued">
              Click en "Agregar Primer Nivel" para crear tu primer nivel de descuento.
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
                label="Cantidad Mínima"
                type="number"
                value={tier.min_quantity.toString()}
                onChange={(value) => updateTier(index, 'min_quantity', value)}
                autoComplete="off"
                min="1"
                helpText="Cantidad mínima de unidades"
              />
            </div>
            <div style={{ flex: 1 }}>
              <TextField
                label="Descuento %"
                type="number"
                value={tier.discount_percentage?.toString() || '0'}
                onChange={(value) => updateTier(index, 'discount_percentage', value)}
                autoComplete="off"
                suffix="%"
                min="0"
                max="100"
                step="0.01"
                error={
                  tier.discount_percentage < 0 || tier.discount_percentage > 100
                    ? 'Debe estar entre 0 y 100'
                    : undefined
                }
                helpText="Porcentaje de descuento (0-100)"
              />
            </div>
            <Button
              tone="critical"
              onClick={() => removeTier(index)}
            >
              Eliminar
            </Button>
          </div>
        ))}
      </div>
      <Button onClick={addTier} variant="primary">
        {tiers.length === 0 ? 'Agregar Primer Nivel' : 'Agregar Otro Nivel'}
      </Button>
    </div>
  );
}
