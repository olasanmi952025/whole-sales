# Configuración de OAuth para Shopify App

Esta app ahora utiliza OAuth de Shopify para obtener automáticamente los tokens de acceso cuando se instala en una tienda.

## 🔧 Configuración Inicial

### 1. Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del proyecto con:

```env
# Shopify App Credentials (obtén estos del Shopify Partners Dashboard)
SHOPIFY_API_KEY=tu_api_key_aqui
SHOPIFY_API_SECRET=tu_api_secret_aqui

# Host de tu app (debe ser HTTPS)
# Para desarrollo local usa ngrok: https://tu-app.ngrok.io
# Para producción usa tu dominio: https://your-app.railway.app
HOST=https://whole-sales-production.up.railway.app

# Permisos que tu app necesita
SCOPES=read_products,write_products,read_orders,write_orders,read_discounts,write_discounts,read_script_tags,write_script_tags

# Configuración del servidor
PORT=8081
NODE_ENV=development
DATABASE_PATH=./database.db
```

### 2. Configurar en Shopify Partners

1. **Ve a Shopify Partners Dashboard**
   - https://partners.shopify.com/

2. **Selecciona tu App o crea una nueva**
   - Apps → [Tu App] → Configuration

3. **Configura las URLs de la App**
   - App URL: `https://your-host/`
   - Allowed redirection URL(s):
     ```
     https://your-host/api/auth/callback
     https://your-host/api/auth
     https://your-host/
     ```

4. **Copia las credenciales**
   - Client ID → `SHOPIFY_API_KEY`
   - Client secret → `SHOPIFY_API_SECRET`

### 3. Para Desarrollo Local con ngrok

```bash
# Instalar ngrok
npm install -g ngrok

# Iniciar túnel
ngrok http 8081

# Usar la URL de ngrok en tu .env
HOST=https://xxxx-xxx-xxx-xxx.ngrok.io
```

## 🚀 Instalación de la App

### Flujo de Instalación

1. **Iniciar el servidor**
   ```bash
   npm run dev
   ```

2. **Instalar en una tienda**
   - Visita: `http://localhost:8081/api/auth?shop=tu-tienda.myshopify.com`
   - O usa la URL completa: `https://your-host/api/auth?shop=tu-tienda.myshopify.com`

3. **Autorizar permisos**
   - Shopify te redirigirá a la página de autorización
   - Acepta los permisos solicitados

4. **¡Listo!**
   - La app obtendrá automáticamente el token de acceso
   - El token se guardará en la base de datos
   - Serás redirigido de vuelta a la app

## 🔐 Cómo Funciona OAuth

### Flujo Completo:

1. **Usuario visita** → `/api/auth?shop=tienda.myshopify.com`

2. **App redirige** → `https://tienda.myshopify.com/admin/oauth/authorize`
   - Con: client_id, scope, redirect_uri, state

3. **Usuario autoriza** → Shopify redirige a `/api/auth/callback`
   - Con: code, hmac, shop, state

4. **App intercambia código** → Obtiene access_token

5. **App guarda token** → Base de datos SQLite (tabla `shopify_sessions`)

6. **Token se usa automáticamente** → Para todas las peticiones API

### Tabla de Sesiones

```sql
CREATE TABLE shopify_sessions (
    id TEXT PRIMARY KEY,              -- offline_shop.myshopify.com
    shop TEXT NOT NULL,               -- shop.myshopify.com
    state TEXT NOT NULL,              -- Estado de la sesión
    isOnline INTEGER DEFAULT 0,       -- 0 = offline token (permanente)
    scope TEXT,                       -- Permisos concedidos
    accessToken TEXT,                 -- shpat_xxxxx (el token de acceso)
    expires DATETIME,                 -- NULL para tokens offline
    onlineAccessInfo TEXT,            -- Info adicional (JSON)
    created_at DATETIME,
    updated_at DATETIME
);
```

## 📋 Verificar que Funciona

### 1. Verificar Estado de Autenticación

```bash
curl "http://localhost:8081/api/auth/verify?shop=tu-tienda.myshopify.com"
```

Respuesta esperada:
```json
{
  "success": true,
  "authenticated": true,
  "shop": "tu-tienda.myshopify.com",
  "scope": "read_products,write_products,..."
}
```

### 2. Probar Listar Productos

```bash
curl "http://localhost:8081/api/products?shop=tu-tienda.myshopify.com"
```

Respuesta esperada:
```json
{
  "success": true,
  "data": [
    {
      "id": "gid://shopify/Product/123",
      "title": "Mi Producto",
      "variants": [...]
    }
  ]
}
```

## 🔧 Diferencias con el Modo Anterior

### Antes (Tokens Hardcodeados):
```typescript
// ❌ Tokens en variables de entorno
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN || 'dev-token';
```

### Ahora (OAuth Automático):
```typescript
// ✅ Tokens obtenidos automáticamente y guardados en DB
const session = await sessionStorage.loadSession(sessionId);
const accessToken = session.accessToken;
```

## 🛡️ Seguridad

### Tokens Offline vs Online

- **Offline Token** (usado por defecto):
  - ✅ No expira
  - ✅ Funciona sin usuario conectado
  - ✅ Ideal para apps que ejecutan tareas en background
  - ⚠️ Acceso permanente a la tienda

- **Online Token**:
  - Expira en 24 horas
  - Requiere que el usuario esté conectado
  - Menos permisos

### Mejores Prácticas

1. **Nunca expongas las credenciales**
   - No subas `.env` a Git
   - Usa variables de entorno en producción

2. **Valida siempre el HMAC**
   - Implementado automáticamente en `/api/auth/callback`

3. **Usa HTTPS en producción**
   - Shopify requiere HTTPS para OAuth

4. **Rota credenciales si se comprometen**
   - En Partners Dashboard → App → Rotate credentials

## 🐛 Troubleshooting

### Error: "Missing shop parameter"
- Asegúrate de incluir `?shop=tu-tienda.myshopify.com` en la URL

### Error: "Invalid HMAC signature"
- Verifica que `SHOPIFY_API_SECRET` sea correcto
- No modifiques los parámetros de callback

### Error: "Session expired"
- Reinstala la app visitando `/api/auth?shop=...`
- En producción, implementa renovación automática de tokens

### Error: "Authentication failed"
- Verifica que `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET` sean correctos
- Verifica que `HOST` coincida con la configuración en Partners Dashboard
- Verifica que las URLs de redirección estén configuradas correctamente

### No se guardan las sesiones
- Verifica que la tabla `shopify_sessions` exista en la BD
- Revisa los logs del servidor para errores de base de datos

## 📚 Recursos

- [Shopify OAuth Documentation](https://shopify.dev/docs/apps/auth/oauth)
- [Shopify App Bridge](https://shopify.dev/docs/apps/tools/app-bridge)
- [API Scopes](https://shopify.dev/docs/api/usage/access-scopes)

## 🎯 Próximos Pasos

1. **Para desarrollo**: Usar ngrok y configurar las URLs
2. **Para producción**: Configurar dominio HTTPS permanente
3. **Multi-tienda**: La app ya soporta múltiples tiendas (una sesión por tienda)
4. **Webhooks**: Implementar webhook de `app/uninstalled` para limpiar sesiones

## ⚡ Comandos Rápidos

```bash
# Desarrollo local
npm run dev

# Build para producción
npm run build

# Deploy a Railway/Heroku
git push railway main

# Ver logs de sesiones (en SQLite)
sqlite3 database.db "SELECT shop, accessToken, created_at FROM shopify_sessions"
```

