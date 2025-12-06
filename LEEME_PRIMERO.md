# 🎉 ¡Tu App Ahora Obtiene Tokens Automáticamente!

## ¿Qué cambió?

Tu app de Shopify ahora usa **OAuth** para obtener los tokens de acceso automáticamente cuando se instala en una tienda. **Ya no necesitas configurar tokens manualmente.**

---

## 🚀 Empezar en 3 Pasos

### Paso 1: Configurar `.env`

Crea un archivo `.env` en la raíz del proyecto:

```env
SHOPIFY_API_KEY=tu_client_id_aqui
SHOPIFY_API_SECRET=tu_client_secret_aqui
HOST=https://your-app-url.com
SCOPES=read_products,write_products,read_orders,write_orders,read_discounts,write_discounts,read_script_tags,write_script_tags
PORT=8081
NODE_ENV=development
DATABASE_PATH=./database.db
```

**¿Dónde obtengo las credenciales?**

1. Ve a https://partners.shopify.com/
2. Selecciona tu app
3. Ve a "Configuration"
4. Copia el **Client ID** y **Client secret**

### Paso 2: Configurar URLs en Shopify Partners

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

### Paso 3: Instalar

```bash
# Verificar configuración
.\scripts\test-oauth.ps1

# Iniciar servidor
npm install
npm run dev

# En tu navegador, visita:
http://localhost:8081/api/auth?shop=tu-tienda.myshopify.com
```

**Reemplaza** `tu-tienda` con el nombre de tu tienda.

---

## 🔥 Desarrollo Local con ngrok

Para desarrollo local necesitas ngrok:

```bash
# Terminal 1: ngrok
ngrok http 8081

# Copiar la URL que te da ngrok (ej: https://abc123.ngrok.io)
# Actualizar en .env:
HOST=https://abc123.ngrok.io

# Actualizar también en Shopify Partners Dashboard

# Terminal 2: App
npm run dev
```

---

## ✅ Verificar que Funciona

### Ver sesiones guardadas:

```bash
sqlite3 database.db "SELECT shop, substr(accessToken, 1, 20) || '...' as token FROM shopify_sessions"
```

### Probar endpoint de productos:

```bash
curl "http://localhost:8081/api/products?shop=tu-tienda.myshopify.com"
```

Deberías ver tus productos reales de Shopify.

---

## 📚 Documentación Completa

- **[QUICKSTART_OAUTH.md](./QUICKSTART_OAUTH.md)** - Guía rápida de 5 minutos
- **[INSTALL_OAUTH.md](./INSTALL_OAUTH.md)** - Instalación paso a paso detallada
- **[OAUTH_SETUP.md](./OAUTH_SETUP.md)** - Documentación técnica completa
- **[RESUMEN_CAMBIOS_OAUTH.md](./RESUMEN_CAMBIOS_OAUTH.md)** - Lista completa de cambios

---

## 🎯 ¿Qué se instaló?

### Archivos nuevos:

- ✅ `web/routes/auth.routes.ts` - Rutas de OAuth
- ✅ `web/services/session-storage.service.ts` - Almacenamiento de sesiones
- ✅ Tabla `shopify_sessions` en la base de datos
- ✅ Scripts de verificación (PowerShell y Bash)
- ✅ Documentación completa

### Archivos modificados:

- 🔄 `web/middleware/shopify-auth.ts` - Adaptado para Koa
- 🔄 `web/index.ts` - Integra OAuth
- 🔄 `web/database/schema.sql` - Añade tabla de sesiones
- 🔄 `shopify.app.toml` - URLs actualizadas
- 🔄 `README.md` - Documentación actualizada

---

## 🔐 Cómo Funciona

### Antes (Manual):
```
Tu → Obtener token manualmente desde Shopify
Tu → Pegar token en .env
Tu → Reiniciar servidor
```

### Ahora (Automático):
```
Usuario → Visita URL de instalación
Usuario → Acepta permisos en Shopify
App → Obtiene y guarda token automáticamente
App → Lista para usar
```

---

## 💡 Endpoints Nuevos

| URL | Para qué sirve |
|-----|---------------|
| `/api/auth?shop=tienda.myshopify.com` | Instalar la app |
| `/api/auth/callback` | Callback de Shopify (automático) |
| `/api/auth/verify?shop=...` | Verificar autenticación |

Todos los endpoints de API (`/api/products`, `/api/rules`, etc.) ahora requieren que la app esté instalada.

---

## 🐛 Problemas Comunes

### "Missing shop parameter"
```bash
# ❌ Incorrecto
http://localhost:8081/api/products

# ✅ Correcto
http://localhost:8081/api/products?shop=tu-tienda.myshopify.com
```

### "No active session"
```bash
# Reinstalar la app:
http://localhost:8081/api/auth?shop=tu-tienda.myshopify.com
```

### "Invalid HMAC signature"
Verifica que `SHOPIFY_API_SECRET` en `.env` sea correcto.

### No funciona en localhost
Necesitas usar ngrok para desarrollo local.

---

## 🎯 Ventajas del Nuevo Sistema

| Antes | Ahora |
|-------|-------|
| ❌ Token manual | ✅ Token automático |
| ❌ Una sola tienda | ✅ Múltiples tiendas |
| ❌ Requiere reconfiguración | ✅ Instalar y listo |
| ❌ Token puede expirar | ✅ Token permanente |
| ❌ No publicable en App Store | ✅ Lista para App Store |

---

## 📞 ¿Necesitas Ayuda?

1. **Verificar configuración**: `.\scripts\test-oauth.ps1`
2. **Revisar logs**: Consola del servidor muestra errores detallados
3. **Documentación**: Ver archivos en la raíz del proyecto
4. **Shopify Docs**: https://shopify.dev/docs/apps/auth/oauth

---

## ✅ Checklist Rápido

- [ ] Archivo `.env` creado con credenciales
- [ ] URLs configuradas en Shopify Partners Dashboard
- [ ] ngrok corriendo (si es desarrollo local)
- [ ] Servidor iniciado con `npm run dev`
- [ ] App instalada visitando `/api/auth?shop=...`
- [ ] Productos se listan correctamente

---

## 🚀 ¡Listo para Empezar!

1. **Configurar .env** (ver Paso 1 arriba)
2. **Ejecutar**: `.\scripts\test-oauth.ps1`
3. **Iniciar**: `npm run dev`
4. **Instalar**: Visita la URL de instalación

**¿Tienes ngrok?** → Úsalo para desarrollo local  
**¿Sin ngrok?** → Deploy a Railway/Heroku primero

---

**Creado**: Diciembre 2025  
**Tiempo de configuración**: ~5 minutos  
**Nivel**: Fácil  
**Estado**: ✅ Listo para usar

