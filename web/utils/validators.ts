import type { PricingRule, PricingTier } from '../types/pricing.js';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validatePricingRule(rule: Partial<PricingRule>): void {
  if (!rule.rule_name || rule.rule_name.trim().length === 0) {
    throw new ValidationError('Rule name is required');
  }

  if (!rule.target_type) {
    throw new ValidationError('Target type is required');
  }

  if (!['product', 'collection', 'variant'].includes(rule.target_type)) {
    throw new ValidationError('Invalid target type. Must be product, collection, or variant');
  }

  if (!rule.target_id || rule.target_id.trim().length === 0) {
    throw new ValidationError('Target ID is required');
  }

  if (!rule.target_id.startsWith('gid://shopify/')) {
    throw new ValidationError('Target ID must be a valid Shopify GID');
  }

  if (rule.priority !== undefined && (rule.priority < 0 || rule.priority > 100)) {
    throw new ValidationError('Priority must be between 0 and 100');
  }

  if (!rule.tiers || rule.tiers.length === 0) {
    throw new ValidationError('At least one pricing tier is required');
  }

  validatePricingTiers(rule.tiers);
}

export function validatePricingTiers(tiers: PricingTier[]): void {
  if (!tiers || tiers.length === 0) {
    throw new ValidationError('At least one pricing tier is required');
  }

  for (const tier of tiers) {
    if (!tier.min_quantity || tier.min_quantity < 1) {
      throw new ValidationError('Minimum quantity must be at least 1');
    }

    if (tier.discount_percentage < 0 || tier.discount_percentage > 100) {
      throw new ValidationError('Discount percentage must be between 0 and 100');
    }
  }

  // Verificar que los tiers tengan descuentos crecientes (mayor cantidad = mayor descuento)
  const sortedTiers = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity);
  for (let i = 1; i < sortedTiers.length; i++) {
    if (sortedTiers[i].discount_percentage < sortedTiers[i - 1].discount_percentage) {
      throw new ValidationError('Higher quantity tiers should have equal or greater discounts');
    }
  }
}

export function sanitizeString(input: string, maxLength: number = 255): string {
  return input.trim().slice(0, maxLength);
}

export function isValidShopifyGID(gid: string, type?: string): boolean {
  if (!gid.startsWith('gid://shopify/')) {
    return false;
  }

  if (type) {
    const pattern = new RegExp(`^gid://shopify/${type}/\\d+$`);
    return pattern.test(gid);
  }

  return /^gid:\/\/shopify\/\w+\/\d+$/.test(gid);
}

export function extractIdFromGID(gid: string): string {
  const parts = gid.split('/');
  return parts[parts.length - 1];
}
