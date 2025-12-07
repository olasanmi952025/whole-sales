import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const DB_PATH = './database.db';
const SHOP = 'mayoreo-9044.myshopify.com';
const PRODUCT_GID = 'gid://shopify/Product/1489719853694';

async function createTestRule() {
  const SQL = await initSqlJs();
  
  let db;
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    // Crear schema
    const schema = readFileSync('./web/database/schema.sql', 'utf-8');
    db.exec(schema);
  }

  console.log('\n🔧 Creating test rule...\n');

  // Crear la regla
  db.run(
    `INSERT INTO pricing_rules (shop, target_type, target_id, rule_name, priority, active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [SHOP, 'product', PRODUCT_GID, 'The Collection Snowboard: Hydrogen - Regla', 0, 1]
  );

  // Obtener el ID de la regla recién creada
  const stmt = db.prepare('SELECT last_insert_rowid() as id');
  stmt.step();
  const ruleId = stmt.getAsObject().id;
  stmt.free();

  console.log(`✅ Created rule with ID: ${ruleId}`);

  // Crear los tiers
  const tiers = [
    { min_quantity: 6, price: 500 },
    { min_quantity: 10, price: 450 }
  ];

  for (const tier of tiers) {
    db.run(
      'INSERT INTO pricing_tiers (rule_id, min_quantity, price, currency) VALUES (?, ?, ?, ?)',
      [ruleId, tier.min_quantity, tier.price, 'USD']
    );
    console.log(`✅ Created tier: ${tier.min_quantity}+ units at $${tier.price}`);
  }

  // Guardar la base de datos
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_PATH, buffer);

  console.log('\n✅ Database saved successfully!\n');

  // Verificar
  const verifyStmt = db.prepare('SELECT * FROM pricing_rules WHERE id = ?');
  verifyStmt.bind([ruleId]);
  if (verifyStmt.step()) {
    const rule = verifyStmt.getAsObject();
    console.log('Verification:');
    console.log('  Rule Name:', rule.rule_name);
    console.log('  Target ID:', rule.target_id);
    console.log('  Active:', rule.active === 1 ? 'Yes' : 'No');
  }
  verifyStmt.free();

  db.close();
}

createTestRule().catch(console.error);

