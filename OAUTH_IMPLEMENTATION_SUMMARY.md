# ✅ Implementación OAuth Completada

## 🎉 ¡Listo! Tu app ahora obtiene tokens automáticamente

Tu app de Shopify ha sido actualizada para usar **autenticación OAuth**, lo que significa que ya no necesitas configurar tokens manualmente. La app obtiene automáticamente los tokens de acceso cuando se instala en cualquier tienda.

---

## 📋 Resumen de Cambios

### ✨ Archivos Nuevos Creados:

1. **`web/routes/auth.routes.ts`**
   - Maneja el flujo OAuth completo
   - Rutas: `/api/auth` y `/api/auth/callback`
   - Validación HMAC y generación de sesiones

2. **`web/services/session-storage.service.ts`**
   - Servicio para guardar/cargar sesiones desde SQLite
   - Métodos: `storeSession`, `loadSession`, `deleteSession`

3. **`OAUTH_SETUP.md`**
   - Documentación técnica completa de OAuth
   - Detalles del flujo de autenticación
   - Troubleshooting y mejores prácticas

4. **`INSTALL_OAUTH.md`**
   - Guía rápida de instalación
   - Pasos claros y concisos
   - Ejemplos de configuración

5. **`scripts/test-oauth.ps1`** (Windows)
   - Script para verificar configuración
   - Valida variables de entorno
   - Verifica estado de la base de datos

6. **`scripts/test-oauth.sh`** (Linux/Mac)
   - Versión bash del script de prueba

### 🔧 Archivos Modificados:

1. **`web/middleware/shopify-auth.ts`**
   - Adaptado para usar Koa (antes usaba Express)
   - Integra el servicio de almacenamiento de sesiones
   - Middleware `verifyShopifySession` para proteger rutas

2. **`web/index.ts`**
   - Integra rutas de autenticación
   - Aplica middleware de sesión a rutas de API
   - Elimina tokens hardcodeados

3. **`web/database/schema.sql`**
   - Añade tabla `shopify_sessions` para guardar tokens
   - Índices para búsqueda eficiente por shop

4. **`shopify.app.toml`**
   - Actualiza URLs de redirección para OAuth

5. **`README.md`**
   - Actualiza sección de instalación con OAuth
   - Enlaces a nueva documentación

---

## 🚀 Cómo Usar la Nueva Funcionalidad

### Paso 1: Configurar Credenciales

Crea un archivo `.env` en la raíz del proyecto:

```env
SHOPIFY_API_KEY=tu_client_id_desde_partners_dashboard
SHOPIFY_API_SECRET=tu_client_secret_desde_partners_dashboard
HOST=https://your-app-url.com
SCOPES=read_products,write_products,read_orders,write_orders,read_discounts,write_discounts,read_script_tags,write_script_tags
PORT=8081
NODE_ENV=development
DATABASE_PATH=./database.db
```

### Paso 2: Obtener Credenciales

1. Ve a [Shopify Partners Dashboard](https://partners.shopify.com/)
2. Selecciona tu app o crea una nueva
3. Ve a Configuration
4. Copia:
   - **Client ID** → `SHOPIFY_API_KEY`
   - **Client secret** → `SHOPIFY_API_SECRET`

### Paso 3: Configurar URLs en Partners Dashboard

En la configuración de tu app, añade estas URLs:

**App URL:**
```
https://your-app-url.com/
```

**Allowed redirection URLs:**
```
https://your-app-url.com/api/auth/callback
https://your-app-url.com/api/auth
https://your-app-url.com/
```

### Paso 4: Desarrollo Local (con ngrok)

```bash
# Terminal 1: Iniciar app
npm run dev

# Terminal 2: Iniciar ngrok
ngrok http 8081

# Copiar URL de ngrok (ej: https://abc123.ngrok.io)
# Actualizar .env:
HOST=https://abc123.ngrok.io

# Actualizar URLs en Shopify Partners Dashboard
# Reiniciar la app
```

### Paso 5: Instalar la App

Visita en tu navegador:
```
http://localhost:8081/api/auth?shop=tu-tienda.myshopify.com
```

**¿Qué pasa después?**
1. Serás redirigido a Shopify
2. Verás la página de autorización de permisos
3. Acepta los permisos
4. La app obtiene el token automáticamente
5. El token se guarda en `database.db`
6. Eres redirigido de vuelta a la app

### Paso 6: Verificar Instalación

```bash
# Windows PowerShell
.\scripts\test-oauth.ps1

# Linux/Mac
./scripts/test-oauth.sh
```

O manualmente:

```bash
# Ver sesiones guardadas
sqlite3 database.db "SELECT shop, substr(accessToken, 1, 20) || '...' as token FROM shopify_sessions"

# Probar endpoint de productos
curl "http://localhost:8081/api/products?shop=tu-tienda.myshopify.com"
```

---

## 🔐 Cómo Funciona (Técnicamente)

### Flujo de Autenticación OAuth:

```
1. Usuario visita → /api/auth?shop=tienda.myshopify.com
         ↓
2. App genera state CSRF y redirige a Shopify
         ↓
3. Usuario autoriza permisos en Shopify
         ↓
4. Shopify redirige → /api/auth/callback?code=xxx&shop=...
         ↓
5. App valida HMAC de seguridad
         ↓
6. App intercambia code por access_token
         ↓
7. Token se guarda en tabla shopify_sessions
         ↓
8. Usuario es redirigido a la app instalada
```

### Uso Automático del Token:

```
Cliente → GET /api/products?shop=tienda.myshopify.com
              ↓
Middleware verifyShopifySession:
  - Extrae shop del query param
  - Busca sesión en DB: offline_tienda.myshopify.com
  - Valida que token no haya expirado
  - Agrega sesión a ctx.state.shopify
              ↓
ProductsController:
  - Lee sesión de ctx.state.shopify.session
  - Usa session.accessToken para llamar API de Shopify
  - Retorna productos reales
              ↓
Cliente ← Respuesta con productos
```

### Base de Datos:

```sql
-- Nueva tabla para sesiones
CREATE TABLE shopify_sessions (
    id TEXT PRIMARY KEY,              -- offline_shop.myshopify.com
    shop TEXT NOT NULL,               -- shop.myshopify.com
    state TEXT NOT NULL,              -- Estado de la sesión
    isOnline INTEGER DEFAULT 0,       -- 0 = offline (permanente)
    scope TEXT,                       -- Permisos concedidos
    accessToken TEXT,                 -- shpat_xxxxx (¡el token!)
    expires DATETIME,                 -- NULL para offline tokens
    created_at DATETIME,
    updated_at DATETIME
);
```

---

## 📊 Comparación: Antes vs Ahora

### ❌ Antes (Tokens Hardcodeados):

```typescript
// En web/index.ts
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN || 'dev-token';

ctx.state = {
  shopify: {
    session: {
      shop: process.env.SHOPIFY_SHOP,
      accessToken: accessToken,  // ❌ Token fijo en .env
    }
  }
};
```

**Problemas:**
- ❌ Un solo token para una sola tienda
- ❌ Tokens expirados no se renuevan automáticamente
- ❌ No soporta múltiples tiendas
- ❌ Requiere configuración manual para cada tienda

### ✅ Ahora (OAuth Automático):

```typescript
// En web/middleware/shopify-auth.ts
const sessionId = shopify.session.getOfflineId(shop);
const session = await sessionStorage.loadSession(sessionId);

ctx.state.shopify = {
  session,  // ✅ Token obtenido automáticamente por tienda
  shop: session.shop
};
```

**Ventajas:**
- ✅ Token automático por cada tienda que instala la app
- ✅ Soporta múltiples tiendas simultáneamente
- ✅ Tokens permanentes (offline access)
- ✅ Flujo estándar de Shopify
- ✅ Listo para publicar en App Store

---

## 🎯 Endpoints Disponibles

### Rutas de Autenticación (Nuevas):

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/auth` | GET | Inicia flujo OAuth |
| `/api/auth/callback` | GET | Callback de OAuth (usado por Shopify) |
| `/api/auth/verify` | GET | Verifica estado de autenticación |

### Rutas de API (Protegidas):

| Ruta | Método | Descripción | Autenticación |
|------|--------|-------------|---------------|
| `/api/products` | GET | Lista productos | ✅ Requiere sesión |
| `/api/collections` | GET | Lista colecciones | ✅ Requiere sesión |
| `/api/rules` | GET | Lista reglas de precios | ✅ Requiere sesión |
| `/api/rules` | POST | Crea nueva regla | ✅ Requiere sesión |
| `/api/rules/:id` | PUT | Actualiza regla | ✅ Requiere sesión |
| `/api/rules/:id` | DELETE | Elimina regla | ✅ Requiere sesión |
| `/api/logs` | GET | Lista logs | ✅ Requiere sesión |

---

## 🧪 Scripts de Prueba

### Windows (PowerShell):

```powershell
.\scripts\test-oauth.ps1
```

**Verifica:**
- ✓ Archivo .env existe
- ✓ Variables requeridas están configuradas
- ✓ Formato de HOST es correcto
- ✓ Base de datos existe
- ✓ Tabla shopify_sessions existe
- ✓ Sesiones guardadas
- ✓ Servidor está corriendo

### Linux/Mac (Bash):

```bash
chmod +x scripts/test-oauth.sh
./scripts/test-oauth.sh
```

---

## 🐛 Solución de Problemas Comunes

### "Missing shop parameter"

**Causa:** No se incluyó el parámetro `shop` en la URL

**Solución:**
```bash
# ❌ Incorrecto
http://localhost:8081/api/products

# ✅ Correcto
http://localhost:8081/api/products?shop=tu-tienda.myshopify.com
```

### "Invalid HMAC signature"

**Causa:** El `SHOPIFY_API_SECRET` es incorrecto o los parámetros fueron modificados

**Solución:**
1. Verifica que `SHOPIFY_API_SECRET` en `.env` sea correcto
2. Cópialo exactamente desde Partners Dashboard
3. Reinicia el servidor
4. NO modifiques la URL de callback manualmente

### "No active session"

**Causa:** La app no ha sido instalada en esa tienda

**Solución:**
```bash
# Instalar/reinstalar la app
http://localhost:8081/api/auth?shop=tu-tienda.myshopify.com
```

### "Authentication failed"

**Causa:** Configuración incorrecta

**Solución:**
1. Verifica `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET`
2. Verifica que `HOST` coincida con Partners Dashboard
3. Verifica que las redirect URLs estén configuradas
4. Ejecuta `.\scripts\test-oauth.ps1` para diagnóstico

### Los productos no cargan

**Solución:**
1. Verifica la instalación:
   ```bash
   sqlite3 database.db "SELECT * FROM shopify_sessions"
   ```

2. Verifica que el token esté guardado:
   ```bash
   curl "http://localhost:8081/api/auth/verify?shop=tu-tienda.myshopify.com"
   ```

3. Revisa los logs del servidor para errores detallados

---

## 📦 Archivos del Proyecto

### Estructura de Directorios:

```
c:\trabajo\app\mayorista\
├── web/
│   ├── middleware/
│   │   └── shopify-auth.ts          ✨ Actualizado
│   ├── routes/
│   │   ├── api.routes.ts            (sin cambios)
│   │   └── auth.routes.ts           ✨ NUEVO
│   ├── services/
│   │   └── session-storage.service.ts ✨ NUEVO
│   ├── database/
│   │   └── schema.sql               ✨ Actualizado
│   └── index.ts                     ✨ Actualizado
├── scripts/
│   ├── test-oauth.ps1               ✨ NUEVO
│   └── test-oauth.sh                ✨ NUEVO
├── OAUTH_SETUP.md                   ✨ NUEVO
├── INSTALL_OAUTH.md                 ✨ NUEVO
├── OAUTH_IMPLEMENTATION_SUMMARY.md  ✨ NUEVO (este archivo)
├── README.md                        ✨ Actualizado
├── shopify.app.toml                 ✨ Actualizado
└── .env                             (crear con tus credenciales)
```

---

## ✅ Checklist de Implementación

- [x] Tabla `shopify_sessions` en base de datos
- [x] Servicio de almacenamiento de sesiones (SQLite)
- [x] Rutas de autenticación OAuth (`/api/auth`, `/api/auth/callback`)
- [x] Middleware de verificación de sesión
- [x] Integración en `index.ts`
- [x] Validación HMAC de seguridad
- [x] Soporte multi-tienda
- [x] Scripts de prueba (Windows + Linux)
- [x] Documentación completa
- [x] Ejemplos de configuración
- [x] Guía de troubleshooting

---

## 🚀 Próximos Pasos Recomendados

### 1. Probar la Implementación

```bash
# 1. Crear .env con tus credenciales
# 2. Verificar configuración
.\scripts\test-oauth.ps1

# 3. Iniciar servidor
npm run dev

# 4. Instalar en tienda de prueba
# Visita: http://localhost:8081/api/auth?shop=tu-tienda.myshopify.com
```

### 2. Deploy a Producción

```bash
# Configurar variables en Railway/Heroku
# Deploy
git push railway main

# Actualizar URLs en Partners Dashboard con dominio de producción
```

### 3. Mejoras Opcionales

- [ ] Implementar webhook `app/uninstalled` para limpiar sesiones
- [ ] Agregar renovación automática de tokens (si se necesita)
- [ ] Implementar rate limiting
- [ ] Agregar logging más detallado
- [ ] Implementar refresh de tokens expirados

---

## 📚 Documentación de Referencia

- **[INSTALL_OAUTH.md](./INSTALL_OAUTH.md)** - Guía de instalación paso a paso
- **[OAUTH_SETUP.md](./OAUTH_SETUP.md)** - Documentación técnica completa
- **[README.md](./README.md)** - Documentación general de la app
- **[Shopify OAuth Docs](https://shopify.dev/docs/apps/auth/oauth)** - Documentación oficial

---

## 💡 Notas Importantes

1. **Tokens Offline**: La app usa tokens offline por defecto, que no expiran y funcionan sin usuario conectado. Ideal para operaciones en background.

2. **Seguridad**: Todos los callbacks de OAuth validan el HMAC para prevenir ataques.

3. **Multi-tienda**: La app automáticamente soporta múltiples tiendas. Cada instalación crea una sesión independiente.

4. **Base de Datos**: Las sesiones se guardan en SQLite en la tabla `shopify_sessions`.

5. **HTTPS Requerido**: Shopify requiere HTTPS para OAuth en producción. Usa ngrok para desarrollo local.

---

## 🎉 ¡Implementación Completa!

Tu app de Shopify ahora tiene un sistema completo de autenticación OAuth. Ya no necesitas configurar tokens manualmente - la app los obtiene automáticamente cuando se instala en cualquier tienda.

**¿Preguntas o problemas?**
- Revisa la documentación en `OAUTH_SETUP.md`
- Ejecuta `.\scripts\test-oauth.ps1` para diagnóstico
- Revisa los logs del servidor para errores detallados

---

**Creado**: Diciembre 2025  
**Versión**: 1.0.0  
**Sistema**: Shopify OAuth 2.0 con tokens offline

