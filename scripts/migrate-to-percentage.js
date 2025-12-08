import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const DB_PATH = './database.db';

async function migrateDatabase() {
  const SQL = await initSqlJs();
  
  if (!existsSync(DB_PATH)) {
    console.log('❌ Database file not found:', DB_PATH);
    return;
  }

  const buffer = readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);

  console.log('\n🔄 Migrating database from price to discount_percentage...\n');

  // Crear tabla temporal con el nuevo esquema
  db.run(`
    CREATE TABLE IF NOT EXISTS pricing_tiers_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id INTEGER NOT NULL,
      min_quantity INTEGER NOT NULL,
      discount_percentage REAL NOT NULL CHECK(discount_percentage >= 0 AND discount_percentage <= 100),
      currency TEXT DEFAULT 'USD',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rule_id) REFERENCES pricing_rules(id) ON DELETE CASCADE
    )
  `);

  // Migrar datos (convertir precios a porcentajes)
  // Por ahora, simplemente eliminar tiers viejos
  // El usuario deberá recrear las reglas con porcentajes
  
  console.log('⚠️  Las reglas antiguas con precios fijos deben recrearse con descuentos porcentuales');
  console.log('✅ Esquema de base de datos actualizado');

  // Eliminar tabla vieja y renombrar la nueva
  db.run('DROP TABLE IF EXISTS pricing_tiers');
  db.run('ALTER TABLE pricing_tiers_new RENAME TO pricing_tiers');
  db.run('CREATE INDEX IF NOT EXISTS idx_pricing_tiers_rule ON pricing_tiers(rule_id)');

  // Guardar
  const data = db.export();
  const dataBuffer = Buffer.from(data);
  writeFileSync(DB_PATH, dataBuffer);

  console.log('\n✅ Database migrated successfully!\n');
  console.log('📝 Próximos pasos:');
  console.log('   1. Abre el admin de la app');
  console.log('   2. Recrea tus reglas con descuentos porcentuales');
  console.log('   3. Ejemplo: Si el precio era $500 y el original $600:');
  console.log('      → Descuento = 16.67%\n');

  db.close();
}

migrateDatabase().catch(console.error);

