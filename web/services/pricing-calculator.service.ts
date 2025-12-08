import type { PricingRule, PricingTier, AppliedTier } from '../types/pricing.js';

export class PricingCalculatorService {
  
  calculatePrice(quantity: number, tiers: PricingTier[]): PricingTier | null {
    if (!tiers || tiers.length === 0) return null;

    const sortedTiers = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity);

    for (const tier of sortedTiers) {
      if (quantity >= tier.min_quantity) {
        return tier;
      }
    }

    return null;
  }

  findApplicableRule(
    rules: PricingRule[],
    productId: string,
    variantId: string | null,
    collectionIds: string[]
  ): PricingRule | null {
    
    const activeRules = rules.filter(r => r.active);
    if (activeRules.length === 0) return null;

    if (variantId) {
      const variantRule = activeRules.find(
        r => r.target_type === 'variant' && r.target_id === variantId
      );
      if (variantRule) return variantRule;
    }

    const productRule = activeRules.find(
      r => r.target_type === 'product' && r.target_id === productId
    );
    if (productRule) return productRule;

    const collectionRule = activeRules.find(
      r => r.target_type === 'collection' && collectionIds.includes(r.target_id)
    );
    if (collectionRule) return collectionRule;

    return null;
  }

  applyTierToLineItem(
    quantity: number,
    rule: PricingRule
  ): AppliedTier | null {
    if (!rule.tiers) return null;

    const tier = this.calculatePrice(quantity, rule.tiers);
    if (!tier) return null;

    return {
      ...tier,
      rule_name: rule.rule_name,
      rule_id: rule.id!
    };
  }

  calculateDiscountAmount(originalPrice: number, discountPercentage: number): number {
    return (originalPrice * discountPercentage) / 100;
  }

  calculateFinalPrice(originalPrice: number, tier: PricingTier): number {
    const discount = this.calculateDiscountAmount(originalPrice, tier.discount_percentage);
    return originalPrice - discount;
  }

  calculateTotalDiscount(quantity: number, originalPricePerUnit: number, tier: PricingTier): number {
    const discount = this.calculateDiscountAmount(originalPricePerUnit, tier.discount_percentage);
    return discount * quantity;
  }
}
