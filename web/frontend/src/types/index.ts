export type TargetType = 'product' | 'collection' | 'variant';

export interface PricingTier {
  id?: number;
  rule_id?: number;
  min_quantity: number;
  discount_percentage: number; // 0-100
  currency?: string;
  created_at?: string;
}

export interface PricingRule {
  id?: number;
  shop?: string;
  target_type: TargetType;
  target_id: string;
  target_name?: string;
  rule_name: string;
  priority?: number;
  active?: boolean;
  tiers?: PricingTier[];
  created_at?: string;
  updated_at?: string;
}

export interface RuleLog {
  id?: number;
  shop?: string;
  order_id?: string;
  rule_id?: number;
  tier_applied?: string;
  quantity?: number;
  original_price?: number;
  adjusted_price?: number;
  created_at?: string;
}

