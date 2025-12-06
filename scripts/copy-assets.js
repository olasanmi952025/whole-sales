import { cpSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Crear directorio si no existe
try {
  mkdirSync('dist/web/database', { recursive: true });
} catch (err) {
  // Ignorar si ya existe
}

// Copiar schema.sql
try {
  cpSync('web/database/schema.sql', 'dist/web/database/schema.sql');
  console.log('✅ Copied schema.sql');
} catch (err) {
  console.error('❌ Error copying schema.sql:', err.message);
  process.exit(1);
}

// Copiar public si existe
try {
  cpSync('public', 'dist/public', { recursive: true });
  console.log('✅ Copied public folder');
} catch (err) {
  console.log('⚠️  No public folder to copy');
}

console.log('✅ Assets copied successfully');

