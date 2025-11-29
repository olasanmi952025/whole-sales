import { getDatabase, saveDatabase } from '../database/database-sqljs.js';
import type { RuleLog } from '../types/pricing.js';

export class RuleLogsRepository {
  
  async findAll(shop: string, limit: number = 100): Promise<RuleLog[]> {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT * FROM rule_logs WHERE shop = ? ORDER BY created_at DESC LIMIT ?');
    stmt.bind([shop, limit]);
    
    const logs: RuleLog[] = [];
    while (stmt.step()) {
      logs.push(stmt.getAsObject() as RuleLog);
    }
    stmt.free();
    
    return logs;
  }

  async findByOrderId(shop: string, orderId: string): Promise<RuleLog[]> {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT * FROM rule_logs WHERE shop = ? AND order_id = ? ORDER BY created_at DESC');
    stmt.bind([shop, orderId]);
    
    const logs: RuleLog[] = [];
    while (stmt.step()) {
      logs.push(stmt.getAsObject() as RuleLog);
    }
    stmt.free();
    
    return logs;
  }

  async create(log: RuleLog): Promise<number> {
    const db = await getDatabase();
    
    db.run(
      `INSERT INTO rule_logs (shop, order_id, rule_id, tier_applied, quantity, original_price, adjusted_price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        log.shop,
        log.order_id || null,
        log.rule_id || null,
        log.tier_applied || null,
        log.quantity || null,
        log.original_price || null,
        log.adjusted_price || null
      ]
    );

    const stmt = db.prepare('SELECT last_insert_rowid() as id');
    stmt.step();
    const logId = (stmt.getAsObject() as any).id as number;
    stmt.free();

    saveDatabase();
    return logId;
  }

  async deleteOldLogs(shop: string, daysToKeep: number = 90): Promise<number> {
    const db = await getDatabase();
    
    db.run(
      `DELETE FROM rule_logs WHERE shop = ? AND created_at < datetime('now', '-' || ? || ' days')`,
      [shop, daysToKeep]
    );

    saveDatabase();
    return 1;
  }
}
