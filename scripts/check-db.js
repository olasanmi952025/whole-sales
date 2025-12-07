import initSqlJs from 'sql.js';
import { readFileSync, existsSync } from 'fs';

const DB_PATH = './database.db';

async function checkDatabase() {
  const SQL = await initSqlJs();
  
  if (!existsSync(DB_PATH)) {
    console.log('❌ Database file not found:', DB_PATH);
    return;
  }

  const buffer = readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);

  console.log('\n=== PRICING RULES ===');
  
  const rulesStmt = db.prepare('SELECT id, rule_name, target_type, target_id, active, shop FROM pricing_rules');
  
  let ruleCount = 0;
  while (rulesStmt.step()) {
    const rule = rulesStmt.getAsObject();
    ruleCount++;
    
    console.log(`\nID: ${rule.id}`);
    console.log(`Name: ${rule.rule_name}`);
    console.log(`Target Type: ${rule.target_type}`);
    console.log(`Target ID: ${rule.target_id}`);
    console.log(`Active: ${rule.active}`);
    console.log(`Shop: ${rule.shop}`);
    
    const tiersStmt = db.prepare('SELECT min_quantity, price, currency FROM pricing_tiers WHERE rule_id = ? ORDER BY min_quantity');
    tiersStmt.bind([rule.id]);
    
    let tierCount = 0;
    const tiers = [];
    while (tiersStmt.step()) {
      const tier = tiersStmt.getAsObject();
      tiers.push(tier);
      tierCount++;
    }
    tiersStmt.free();
    
    console.log(`Tiers: ${tierCount}`);
    tiers.forEach(tier => {
      console.log(`  - ${tier.min_quantity}+ units: $${tier.price} ${tier.currency}`);
    });
  }
  rulesStmt.free();

  console.log('\n=== TOTAL RULES: ' + ruleCount + ' ===\n');

  db.close();
}

checkDatabase().catch(console.error);

