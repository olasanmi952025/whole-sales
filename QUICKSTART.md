# Guía Rápida de Inicio

## Instalación en 5 Minutos

### 1. Requisitos Previos

```bash
node --version  # Debe ser 18+
npm --version
```

### 2. Clonar e Instalar

```bash
cd mayorista
npm install
```

### 3. Configurar Shopify

```bash
# Instalar Shopify CLI
npm install -g @shopify/cli

# Conectar a Partners account
shopify login
```

### 4. Configurar Variables

Crear `.env`:

```env
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SCOPES=write_products,read_products,write_orders,read_orders,write_discounts,read_discounts,write_script_tags,read_script_tags
HOST=
DATABASE_PATH=./database.db
NODE_ENV=development
```

### 5. Iniciar en Desarrollo

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd web/frontend
npm install
npm run dev
```

### 6. Abrir App

```bash
# La CLI mostrará una URL como:
# https://your-app.myshopify.com/admin/apps/wholesale-pricing
```

## Uso Básico

### Crear tu Primera Regla

1. **Abre la app** en Shopify Admin
2. **Click "Create Rule"**
3. **Completa el formulario:**
   - Rule Name: "Mayorista Nivel 1"
   - Target Type: "Product"
   - Target ID: Copia el GID del producto (ver abajo)
   - Priority: 10
   - Active: ✓

4. **Añade Tiers manualmente:**
   - Click "Add First Tier"
   - Min Quantity: 5, Price: $10.00
   - Click "Add Another Tier"
   - Min Quantity: 10, Price: $8.00
   - Click "Add Another Tier"
   - Min Quantity: 20, Price: $6.00
   
   ⚠️ **Importante**: NO hay precios por defecto. Debes configurar cada tier manualmente.

5. **Click "Create Rule"**

### Obtener Product ID

#### Opción A: GraphiQL

1. Shopify Admin → Settings → Apps and sales channels
2. Develop apps → Create app
3. API credentials → Admin API access token
4. GraphiQL: `query { products(first: 1) { edges { node { id title } } } }`

#### Opción B: URL del Admin

Si la URL es:
```
https://admin.shopify.com/store/tu-tienda/products/8234567890123
```

El GID es:
```
gid://shopify/Product/8234567890123
```

### Probar en Storefront

1. **Visita la página del producto**
2. **Deberías ver** una tabla con los precios por cantidad
3. **Cambia la cantidad** a 10
4. **El precio se actualiza** automáticamente
5. **Añade al carrito**
6. **En checkout** verás el precio ajustado

## Ejemplo Completo

### Producto: Camiseta Básica

```json
{
  "rule_name": "Mayorista Camisetas",
  "target_type": "product",
  "target_id": "gid://shopify/Product/8234567890123",
  "priority": 10,
  "active": true,
  "tiers": [
    { "min_quantity": 1, "price": 20.00 },
    { "min_quantity": 5, "price": 15.00 },
    { "min_quantity": 10, "price": 12.00 },
    { "min_quantity": 25, "price": 10.00 },
    { "min_quantity": 50, "price": 8.00 }
  ]
}
```

### Resultado Esperado

| Cantidad | Precio Unitario | Total |
|----------|----------------|-------|
| 1-4      | $20.00         | $20-80|
| 5-9      | $15.00         | $75-135|
| 10-24    | $12.00         | $120-288|
| 25-49    | $10.00         | $250-490|
| 50+      | $8.00          | $400+ |

## Comandos Útiles

```bash
# Ver logs del backend
npm run dev

# Compilar TypeScript
npx tsc

# Inicializar DB manualmente
node -e "require('./web/database/database.js').initializeDatabase()"

# Ver reglas en DB
sqlite3 database.db "SELECT * FROM pricing_rules;"

# Deploy a producción
npm run deploy

# Ver información de la app
shopify app info
```

## Troubleshooting Rápido

### Error: "Cannot find module"
```bash
npm install
cd web/frontend && npm install
```

### Error: "Database locked"
```bash
# Cerrar todas las conexiones
pkill -f node
rm database.db-wal database.db-shm
```

### Script no carga en storefront
1. Verifica que la app tenga scope `write_script_tags`
2. Revisa en Admin → Settings → Files si el script está subido
3. Fuerza reinstalación del script tag vía API

### Prices no cambian
1. Verifica que la regla esté `active: true`
2. Revisa el `target_id` sea correcto (GID formato)
3. Chequea logs del navegador (DevTools)
4. Confirma que la cantidad cumple el `min_quantity`

### Function no aplica descuento
1. Deploy function: `shopify app deploy`
2. Activa en Admin → Settings → Checkout
3. Verifica property `_wholesale_tier` existe en line item
4. Revisa logs en Partner Dashboard

## Próximos Pasos

- [ ] Crear reglas para tus productos principales
- [ ] Probar en dev store completamente
- [ ] Customizar estilos del script (storefront-script.js)
- [ ] Configurar deployment (ver DEPLOYMENT.md)
- [ ] Instalar en tienda de producción
- [ ] Monitorear logs para ajustes

## Recursos

- [Documentación Completa](README.md)
- [Arquitectura](ARCHITECTURE.md)
- [Deploy](DEPLOYMENT.md)
- [Shopify Functions Docs](https://shopify.dev/docs/api/functions)
- [Polaris Components](https://polaris.shopify.com/)

## Soporte

¿Problemas? Revisa:
1. Logs del servidor
2. DevTools del navegador
3. Shopify Partner Dashboard
4. Issues en GitHub

