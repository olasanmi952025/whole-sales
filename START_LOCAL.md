# 🚀 Iniciar en Modo Local (Sin Shopify Partners)

Esta guía te permite **desarrollar y probar la aplicación completamente en local** sin necesidad de crear una cuenta de Shopify Partners ni configurar apps.

## ✅ Ventajas del Modo Local

- ✅ No necesitas cuenta de Shopify Partners
- ✅ No necesitas crear apps en Shopify
- ✅ No necesitas dev store
- ✅ Funciona 100% offline
- ✅ Perfecto para desarrollo de UI y lógica

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
npm install
cd web/frontend
npm install
cd ../..
```

### 2. Iniciar Backend (Modo Standalone)

**Terminal 1:**
```bash
npm run dev:local
```

Verás:
```
✅ Backend running on: http://localhost:3000
📊 API endpoints: http://localhost:3000/api/rules
💡 This is standalone mode - mock Shopify session
```

### 3. Iniciar Frontend

**Terminal 2:**
```bash
cd web/frontend
npm run dev
```

### 4. Abrir en Navegador

```
http://localhost:3001
```

## 🎯 Funcionalidad Disponible

### ✅ Funciona Completamente

- ✅ **Dashboard de Reglas**: Crear, editar, eliminar reglas
- ✅ **Configuración de Tiers**: Añadir múltiples niveles de precio
- ✅ **Base de Datos Local**: SQLite funcional
- ✅ **Logs**: Ver historial de cambios
- ✅ **Validaciones**: Todas las validaciones funcionan
- ✅ **API REST**: Todos los endpoints disponibles

### ⚠️ No Funciona (requiere Shopify real)

- ❌ Integración con productos reales de Shopify
- ❌ Script en storefront
- ❌ Cart Transform Function
- ❌ Webhooks

## 🧪 Probar la Aplicación

### Crear una Regla de Prueba

1. **Abrir**: http://localhost:3001
2. **Click**: "Create Rule"
3. **Completar**:
   - Rule Name: `Test Wholesale`
   - Target Type: `Product`
   - Target ID: `gid://shopify/Product/12345` (mock ID)
   - Priority: `10`
   - Active: ✓

4. **Añadir Tiers**:
   - Click "Add First Tier"
   - Min Quantity: `5`, Price: `10.00`
   - Click "Add Another Tier"
   - Min Quantity: `10`, Price: `8.00`
   - Click "Add Another Tier"
   - Min Quantity: `20`, Price: `6.00`

5. **Guardar**: Click "Create Rule"

### Ver la Regla Creada

La regla aparecerá en la lista con:
- ✅ Badge "Active"
- ✅ Badge "product"
- ✅ "3 tiers" indicator

### Editar o Eliminar

- **Edit**: Click en "Edit" → Modifica → "Update Rule"
- **Delete**: Click en "Delete" → Confirma

### Ver Logs

- Click en "Logs" en el menú lateral
- Verás el historial de operaciones

## 🗄️ Base de Datos

Los datos se guardan en:
```
./database.db
```

### Resetear Base de Datos

```bash
# Eliminar base de datos
rm database.db

# Reiniciar backend (se crea automáticamente)
npm run dev:local
```

## 🔧 Comandos Útiles

```bash
# Modo local (sin Shopify)
npm run dev:local

# Modo Shopify (requiere Partners account)
npm run dev

# Build frontend
cd web/frontend && npm run build

# Ver logs detallados
DEBUG=* npm run dev:local
```

## 🧪 Test de API con curl

```bash
# Listar reglas
curl http://localhost:3000/api/rules

# Crear regla
curl -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "rule_name": "Test API",
    "target_type": "product",
    "target_id": "gid://shopify/Product/999",
    "priority": 5,
    "active": true,
    "tiers": [
      {"min_quantity": 5, "price": 15.00},
      {"min_quantity": 10, "price": 12.00}
    ]
  }'

# Obtener regla por ID
curl http://localhost:3000/api/rules/1

# Calcular precio
curl -X POST http://localhost:3000/api/rules/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "target_type": "product",
    "target_id": "gid://shopify/Product/999",
    "quantity": 10
  }'
```

## 📝 Diferencias con Modo Shopify

| Característica | Modo Local | Modo Shopify |
|---------------|------------|--------------|
| Shopify Partners | ❌ No requiere | ✅ Requiere |
| Dev Store | ❌ No requiere | ✅ Requiere |
| UI Dashboard | ✅ Completo | ✅ Completo |
| API REST | ✅ Completo | ✅ Completo |
| Base de Datos | ✅ SQLite local | ✅ SQLite/PostgreSQL |
| Productos Reales | ❌ Mock IDs | ✅ Productos reales |
| Storefront Script | ❌ No funciona | ✅ Funcional |
| Cart Transform | ❌ No funciona | ✅ Funcional |
| OAuth | ❌ Mock session | ✅ OAuth real |

## 🎓 Cuándo Usar Cada Modo

### Usa Modo Local (`npm run dev:local`)

- 🎨 Desarrollo de UI/UX
- 🧪 Pruebas de lógica de negocio
- 🐛 Debugging de algoritmos
- 📚 Aprendizaje del código
- ⚡ Iteración rápida sin dependencias

### Usa Modo Shopify (`npm run dev`)

- 🛍️ Integración con productos reales
- 🛒 Prueba de cart transform
- 📦 Testing end-to-end
- 🚀 Deploy a producción
- 🔗 Webhooks y eventos

## 🔄 Migrar de Local a Shopify

Cuando estés listo para conectar con Shopify:

1. **Crear cuenta Partners**: https://partners.shopify.com/signup
2. **Actualizar `.env`** con credenciales reales
3. **Ejecutar**: `npm run dev -- --reset`
4. **Seguir** el asistente de Shopify CLI

La base de datos y reglas creadas en local se mantienen.

## 🆘 Troubleshooting

### Puerto en uso

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Cambiar puerto
PORT=3001 npm run dev:local
```

### Base de datos corrupta

```bash
rm database.db
npm run dev:local
```

### Frontend no conecta con backend

Verificar `web/frontend/vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': 'http://localhost:3000'
  }
}
```

## ✨ Resumen

**Modo Local es perfecto para:**
- ✅ Desarrollar sin configurar Shopify
- ✅ Probar la UI completa
- ✅ Testear lógica de reglas
- ✅ Aprender el código

**Para producción necesitarás:**
- Cuenta Shopify Partners
- Dev Store o tienda real
- Ejecutar `npm run dev` (modo Shopify)

---

**¡Empieza ahora!**
```bash
npm run dev:local
cd web/frontend && npm run dev
```

Abre: http://localhost:3001 🚀

