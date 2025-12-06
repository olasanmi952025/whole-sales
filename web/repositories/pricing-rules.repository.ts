import { getDatabase, saveDatabase } from '../database/database-sqljs.js';
import type { PricingRule, PricingTier } from '../types/pricing.js';

export class PricingRulesRepository {
  
  async findAll(shop: string): Promise<PricingRule[]> {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT * FROM pricing_rules WHERE shop = ? ORDER BY priority DESC, created_at DESC');
    stmt.bind([shop]);
    
    const rules: PricingRule[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as unknown as PricingRule;
      rules.push({
        ...row,
        active: Boolean(row.active),
        tiers: await this.findTiersByRuleId(row.id!)
      });
    }
    stmt.free();
    
    return rules;
  }

  async findById(id: number, shop: string): Promise<PricingRule | undefined> {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT * FROM pricing_rules WHERE id = ? AND shop = ?');
    stmt.bind([id, shop]);
    
    let rule: PricingRule | undefined;
    if (stmt.step()) {
      rule = stmt.getAsObject() as unknown as PricingRule;
      rule.active = Boolean(rule.active);
      rule.tiers = await this.findTiersByRuleId(id);
    }
    stmt.free();
    
    return rule;
  }

  async findByTarget(shop: string, targetType: string, targetId: string): Promise<PricingRule | undefined> {
    const db = await getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM pricing_rules 
      WHERE shop = ? AND target_type = ? AND target_id = ? AND active = 1
      ORDER BY priority DESC
      LIMIT 1
    `);
    stmt.bind([shop, targetType, targetId]);
    
    let rule: PricingRule | undefined;
    if (stmt.step()) {
      rule = stmt.getAsObject() as unknown as PricingRule;
      rule.active = Boolean(rule.active);
      rule.tiers = await this.findTiersByRuleId(rule.id!);
    }
    stmt.free();
    
    return rule;
  }

  async create(rule: PricingRule): Promise<number> {
    const db = await getDatabase();
    
    db.run(
      `INSERT INTO pricing_rules (shop, target_type, target_id, rule_name, priority, active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [rule.shop, rule.target_type, rule.target_id, rule.rule_name, rule.priority || 0, rule.active ? 1 : 0]
    );

    const stmt = db.prepare('SELECT last_insert_rowid() as id');
    stmt.step();
    const ruleId = (stmt.getAsObject() as any).id as number;
    stmt.free();

    if (rule.tiers && rule.tiers.length > 0) {
      await this.createTiers(ruleId, rule.tiers);
    }

    saveDatabase();
    return ruleId;
  }

  async update(id: number, shop: string, rule: Partial<PricingRule>): Promise<boolean> {
    const db = await getDatabase();
    
    const sets: string[] = [];
    const values: any[] = [];

    if (rule.rule_name !== undefined) {
      sets.push('rule_name = ?');
      values.push(rule.rule_name);
    }
    if (rule.priority !== undefined) {
      sets.push('priority = ?');
      values.push(rule.priority);
    }
    if (rule.active !== undefined) {
      sets.push('active = ?');
      values.push(rule.active ? 1 : 0);
    }
    
    sets.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, shop);

    db.run(
      `UPDATE pricing_rules SET ${sets.join(', ')} WHERE id = ? AND shop = ?`,
      values
    );

    if (rule.tiers) {
      await this.deleteTiers(id);
      await this.createTiers(id, rule.tiers);
    }

    saveDatabase();
    return true;
  }

  async delete(id: number, shop: string): Promise<boolean> {
    const db = await getDatabase();
    db.run('DELETE FROM pricing_rules WHERE id = ? AND shop = ?', [id, shop]);
    saveDatabase();
    return true;
  }

  private async findTiersByRuleId(ruleId: number): Promise<PricingTier[]> {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT * FROM pricing_tiers WHERE rule_id = ? ORDER BY min_quantity ASC');
    stmt.bind([ruleId]);
    
    const tiers: PricingTier[] = [];
    while (stmt.step()) {
      tiers.push(stmt.getAsObject() as unknown as PricingTier);
    }
    stmt.free();
    
    return tiers;
  }

  private async createTiers(ruleId: number, tiers: PricingTier[]): Promise<void> {
    const db = await getDatabase();
    
    for (const tier of tiers) {
      db.run(
        'INSERT INTO pricing_tiers (rule_id, min_quantity, price, currency) VALUES (?, ?, ?, ?)',
        [ruleId, tier.min_quantity, tier.price, tier.currency || 'USD']
      );
    }
  }

  private async deleteTiers(ruleId: number): Promise<void> {
    const db = await getDatabase();
    db.run('DELETE FROM pricing_tiers WHERE rule_id = ?', [ruleId]);
  }
}
