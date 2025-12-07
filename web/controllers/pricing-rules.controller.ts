import type { Context } from 'koa';
import { PricingRulesRepository } from '../repositories/pricing-rules.repository.js';
import { ProductInfoService } from '../services/product-info.service.js';
import type { PricingRule } from '../types/pricing.js';

export class PricingRulesController {
  private repository: PricingRulesRepository;
  private productInfoService: ProductInfoService;

  constructor() {
    this.repository = new PricingRulesRepository();
    this.productInfoService = new ProductInfoService();
  }

  async getAll(ctx: Context): Promise<void> {
    const shop = ctx.state.shopify.session.shop;
    const session = ctx.state.shopify.session;
    const rules = await this.repository.findAll(shop);
    
    // Enriquecer las reglas con los nombres de los productos/variantes/colecciones
    const enrichedRules = await Promise.all(
      rules.map(async (rule) => {
        try {
          const targetName = await this.productInfoService.getTargetName(
            session,
            rule.target_type,
            rule.target_id
          );
          return { ...rule, target_name: targetName };
        } catch (error) {
          console.error('Error enriching rule:', error);
          return rule;
        }
      })
    );
    
    ctx.body = { success: true, data: enrichedRules };
  }

  async getById(ctx: Context): Promise<void> {
    const shop = ctx.state.shopify.session.shop;
    const id = parseInt(ctx.params.id);

    if (isNaN(id)) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Invalid rule ID' };
      return;
    }

    const rule = await this.repository.findById(id, shop);
    
    if (!rule) {
      ctx.status = 404;
      ctx.body = { success: false, error: 'Rule not found' };
      return;
    }

    ctx.body = { success: true, data: rule };
  }

  async create(ctx: Context): Promise<void> {
    const shop = ctx.state.shopify.session.shop;
    const ruleData: PricingRule = ctx.request.body as PricingRule;

    if (!this.validateRule(ruleData)) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Invalid rule data' };
      return;
    }

    ruleData.shop = shop;
    const ruleId = await this.repository.create(ruleData);
    const createdRule = await this.repository.findById(ruleId, shop);

    ctx.status = 201;
    ctx.body = { success: true, data: createdRule };
  }

  async update(ctx: Context): Promise<void> {
    const shop = ctx.state.shopify.session.shop;
    const id = parseInt(ctx.params.id);
    const ruleData: Partial<PricingRule> = ctx.request.body as Partial<PricingRule>;

    if (isNaN(id)) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Invalid rule ID' };
      return;
    }

    const updated = await this.repository.update(id, shop, ruleData);

    if (!updated) {
      ctx.status = 404;
      ctx.body = { success: false, error: 'Rule not found' };
      return;
    }

    const updatedRule = await this.repository.findById(id, shop);
    ctx.body = { success: true, data: updatedRule };
  }

  async delete(ctx: Context): Promise<void> {
    const shop = ctx.state.shopify.session.shop;
    const id = parseInt(ctx.params.id);

    if (isNaN(id)) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Invalid rule ID' };
      return;
    }

    const deleted = await this.repository.delete(id, shop);

    if (!deleted) {
      ctx.status = 404;
      ctx.body = { success: false, error: 'Rule not found' };
      return;
    }

    ctx.status = 204;
  }

  async calculate(ctx: Context): Promise<void> {
    const shop = ctx.state.shopify.session.shop;
    const { target_type, target_id, quantity } = ctx.request.body as any;

    if (!target_type || !target_id || !quantity) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Missing required parameters' };
      return;
    }

    const rule = await this.repository.findByTarget(shop, target_type, target_id);

    if (!rule || !rule.tiers) {
      ctx.body = { success: true, data: null };
      return;
    }

    const sortedTiers = [...rule.tiers].sort((a, b) => b.min_quantity - a.min_quantity);
    const applicableTier = sortedTiers.find(t => quantity >= t.min_quantity);

    ctx.body = {
      success: true,
      data: applicableTier ? {
        rule_name: rule.rule_name,
        tier: applicableTier,
        total: quantity * applicableTier.price
      } : null
    };
  }

  private validateRule(rule: PricingRule): boolean {
    if (!rule.target_type || !rule.target_id || !rule.rule_name) {
      return false;
    }

    if (!['product', 'collection', 'variant'].includes(rule.target_type)) {
      return false;
    }

    if (!rule.tiers || rule.tiers.length === 0) {
      return false;
    }

    for (const tier of rule.tiers) {
      if (tier.min_quantity <= 0 || tier.price < 0) {
        return false;
      }
    }

    return true;
  }
}

