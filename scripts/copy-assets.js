import { cpSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Crear directorio si no existe
try {
  mkdirSync('dist/web/database', { recursive: true });
  mkdirSync('dist/web/frontend', { recursive: true });
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

// Copiar frontend compilado
if (existsSync('web/dist/frontend')) {
  try {
    cpSync('web/dist/frontend', 'dist/web/frontend', { recursive: true });
    console.log('✅ Copied frontend build');
  } catch (err) {
    console.error('❌ Error copying frontend:', err.message);
    process.exit(1);
  }
} else {
  console.log('⚠️  Frontend not built yet (will be built later)');
}

// Copiar install.html
if (existsSync('web/frontend/install.html')) {
  try {
    cpSync('web/frontend/install.html', 'dist/web/frontend/install.html');
    console.log('✅ Copied install.html');
  } catch (err) {
    console.log('⚠️  Could not copy install.html:', err.message);
  }
}

// Copiar public/wholesale-pricing.js al frontend
if (existsSync('public/wholesale-pricing.js')) {
  try {
    cpSync('public/wholesale-pricing.js', 'dist/web/frontend/wholesale-pricing.js');
    console.log('✅ Copied wholesale-pricing.js to frontend');
  } catch (err) {
    console.log('⚠️  Could not copy wholesale-pricing.js:', err.message);
  }
}

// Copiar public si existe
try {
  cpSync('public', 'dist/public', { recursive: true });
  console.log('✅ Copied public folder');
} catch (err) {
  console.log('⚠️  No public folder to copy');
}

console.log('✅ Assets copied successfully');

