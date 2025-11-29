# Cómo Obtener el Access Token de Shopify

Para que el endpoint `/api/products` funcione y obtenga productos reales de tu tienda Shopify, necesitas un **Admin API Access Token**.

## Método 1: Crear una App Personalizada (Recomendado para Desarrollo)

### Pasos:

1. **Accede a tu tienda Shopify Admin**
   - Ve a: `https://tu-tienda.myshopify.com/admin`

2. **Ve a Configuración → Apps and sales channels**
   - Click en "Settings" (esquina inferior izquierda)
   - Click en "Apps and sales channels"

3. **Desarrollar apps**
   - Click en "Develop apps" (Desarrollar apps)
   - Si es la primera vez, acepta los términos

4. **Crear nueva app**
   - Click en "Create an app"
   - Nombre: "Wholesale Pricing Dev"
   - App developer: Tu email

5. **Configurar API Scopes**
   - Click en "Configure Admin API scopes"
   - Selecciona los permisos necesarios:
     - ✓ `read_products`
     - ✓ `write_products`
     - ✓ `read_orders`
     - ✓ `write_orders`
     - ✓ `read_discounts`
     - ✓ `write_discounts`
     - ✓ `read_script_tags`
     - ✓ `write_script_tags`
   - Click "Save"

6. **Instalar la App**
   - Click en la pestaña "API credentials"
   - Click en "Install app"
   - Confirma la instalación

7. **Copiar el Access Token**
   - Después de instalar, verás "Admin API access token"
   - Click en "Reveal token once"
   - **¡COPIA EL TOKEN! Solo se muestra una vez**
   - El token tendrá formato: `shpat_xxxxxxxxxxxxxxxxxxxxxxxx`

## Método 2: Usar Token Existente de tu App

Si ya tienes una app instalada:

1. Ve a Shopify Partner Dashboard
2. Apps → Tu App → Test on development store
3. El token se obtiene durante el flujo OAuth cuando instalas la app

## Configurar Variables de Entorno

Crea o edita tu archivo `.env` en la raíz del proyecto:

```env
# Shopify Store Access
SHOPIFY_SHOP=tu-tienda.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxx

# Shopify App Configuration (si usas Shopify CLI)
SHOPIFY_API_KEY=tu_api_key
SHOPIFY_API_SECRET=tu_api_secret
SCOPES=write_products,read_products,write_orders,read_orders,write_discounts,read_discounts,write_script_tags,read_script_tags

# Server Configuration
HOST=https://tu-dominio.ngrok.io
PORT=8081
DATABASE_PATH=./database.db
NODE_ENV=development
```

## Verificar que Funciona

1. Reinicia el servidor:
   ```bash
   npm run dev
   ```

2. Prueba el endpoint:
   ```bash
   curl http://localhost:8081/api/products
   ```

3. Deberías ver tus productos reales de la tienda, no datos mock.

## Seguridad

⚠️ **IMPORTANTE**:
- **NUNCA** subas el token a GitHub
- Añade `.env` a tu `.gitignore`
- El token da acceso completo a tu tienda
- Rota el token si se compromete

## Troubleshooting

### Error: "Invalid or mock access token"
- Verifica que `SHOPIFY_ACCESS_TOKEN` esté en tu `.env`
- Verifica que el token comience con `shpat_`
- Verifica que el token no esté expirado

### Error: "Authentication failed"
- Verifica que `SHOPIFY_SHOP` tenga el formato correcto: `tienda.myshopify.com`
- Verifica que la app esté instalada en esa tienda
- Verifica que los scopes incluyan `read_products`

### No hay productos
- Verifica que tu tienda tenga productos creados
- Los productos deben estar publicados
- Prueba con una query más simple primero

