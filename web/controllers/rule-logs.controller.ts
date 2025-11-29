import type { Context } from 'koa';
import { RuleLogsRepository } from '../repositories/rule-logs.repository.js';

export class RuleLogsController {
  private repository: RuleLogsRepository;

  constructor() {
    this.repository = new RuleLogsRepository();
  }

  async getAll(ctx: Context): Promise<void> {
    const shop = ctx.state.shopify.session.shop;
    const limit = parseInt(ctx.query.limit as string) || 100;
    
    const logs = await this.repository.findAll(shop, limit);
    ctx.body = { success: true, data: logs };
  }

  async getByOrderId(ctx: Context): Promise<void> {
    const shop = ctx.state.shopify.session.shop;
    const orderId = ctx.params.orderId;

    const logs = await this.repository.findByOrderId(shop, orderId);
    ctx.body = { success: true, data: logs };
  }
}

