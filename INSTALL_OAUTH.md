# Guía Rápida de Instalación OAuth

## 🎯 Resumen de Cambios

Tu app ahora utiliza **OAuth de Shopify** para obtener automáticamente los tokens de acceso. Ya no necesitas configurar tokens manualmente.

### ✨ Lo que esto significa:

- ✅ **Instalación automática**: Solo visita una URL y autoriza
- ✅ **Multi-tienda**: Soporta múltiples tiendas sin reconfiguración
- ✅ **Tokens seguros**: Guardados en base de datos, no en código
- ✅ **Tokens permanentes**: No expiran (usando offline access)
- ✅ **Producción ready**: Listo para deploy en Railway/Heroku

## 🚀 Instalación en 3 Pasos

### Paso 1: Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Copiar template
cp .env.example .env

# O crear manualmente con:
SHOPIFY_API_KEY=tu_client_id_aqui
SHOPIFY_API_SECRET=tu_client_secret_aqui
HOST=https://your-app-url.com
SCOPES=read_products,write_products,read_orders,write_orders,read_discounts,write_discounts,read_script_tags,write_script_tags
PORT=8081
NODE_ENV=development
DATABASE_PATH=./database.db
```

**Dónde obtener las credenciales:**
1. Ve a [Shopify Partners Dashboard](https://partners.shopify.com/)
2. Apps → [Tu App] → Configuration
3. Copia el **Client ID** → `SHOPIFY_API_KEY`
4. Copia el **Client secret** → `SHOPIFY_API_SECRET`

### Paso 2: Configurar URLs en Shopify Partners

En la configuración de tu app en Partners Dashboard:

**App URL:**
```
https://your-app-url.com/
```

**Allowed redirection URL(s):**
```
https://your-app-url.com/api/auth/callback
https://your-app-url.com/api/auth
https://your-app-url.com/
```

### Paso 3: Iniciar y Instalar

```bash
# Instalar dependencias (si es necesario)
npm install

# Iniciar servidor
npm run dev

# En tu navegador, visita:
http://localhost:8081/api/auth?shop=tu-tienda.myshopify.com
```

**Reemplaza** `tu-tienda` con el nombre de tu tienda Shopify.

## 🔧 Para Desarrollo Local

Si estás desarrollando localmente, necesitas exponer tu servidor local a internet:

### Opción 1: ngrok (Recomendado)

```bash
# Instalar ngrok
npm install -g ngrok

# Terminal 1: Iniciar tu app
npm run dev

# Terminal 2: Iniciar ngrok
ngrok http 8081

# Copiar la URL de ngrok (ej: https://xxxx-xxx.ngrok.io)
# Actualizar .env:
HOST=https://xxxx-xxx.ngrok.io

# Actualizar URLs en Shopify Partners Dashboard con la URL de ngrok

# Reiniciar la app para que use la nueva URL
```

### Opción 2: Cloudflare Tunnel

```bash
cloudflared tunnel --url http://localhost:8081
```

### Opción 3: Development Store

Si tienes una development store, puedes usar la URL de Railway/Heroku directamente.

## 📋 Verificación

### 1. Verificar que el servidor está corriendo

```bash
curl http://localhost:8081/api/auth/verify?shop=tu-tienda.myshopify.com
```

### 2. Instalar la app

Visita en tu navegador:
```
http://localhost:8081/api/auth?shop=tu-tienda.myshopify.com
```

Deberías:
1. Ser redirigido a Shopify
2. Ver la página de autorización
3. Aceptar permisos
4. Ser redirigido de vuelta a tu app
5. Ver la interfaz de la app

### 3. Verificar que la sesión se guardó

```bash
# Ver sesiones guardadas
sqlite3 database.db "SELECT shop, substr(accessToken, 1, 20) || '...' as token, created_at FROM shopify_sessions"
```

### 4. Probar endpoint de productos

```bash
curl "http://localhost:8081/api/products?shop=tu-tienda.myshopify.com"
```

Deberías ver tus productos reales de Shopify.

## 🎨 Estructura de Archivos Nuevos

```
web/
├── middleware/
│   └── shopify-auth.ts          # ✨ Actualizado - Middleware de OAuth
├── routes/
│   ├── api.routes.ts            # Rutas de API existentes
│   └── auth.routes.ts           # ✨ NUEVO - Rutas OAuth
├── services/
│   └── session-storage.service.ts # ✨ NUEVO - Almacenamiento de sesiones
├── database/
│   └── schema.sql               # ✨ Actualizado - Tabla de sesiones
└── index.ts                     # ✨ Actualizado - Integra OAuth
```

## 🔐 Cómo Funciona

### Flujo de Autenticación:

```
1. Usuario → /api/auth?shop=tienda.myshopify.com
                ↓
2. App → Redirige a Shopify OAuth
                ↓
3. Usuario autoriza permisos en Shopify
                ↓
4. Shopify → /api/auth/callback?code=xxx&shop=...
                ↓
5. App → Intercambia código por token
                ↓
6. App → Guarda token en database.db
                ↓
7. Usuario → Redirigido a la app (instalación completa)
```

### Uso del Token:

```
Cliente → /api/products?shop=tienda.myshopify.com
              ↓
Middleware → Carga sesión de DB
              ↓
Middleware → Valida token
              ↓
Controller → Usa token para Shopify API
              ↓
Cliente ← Respuesta con productos
```

## 🐛 Solución de Problemas

### "Missing shop parameter"

Asegúrate de incluir `?shop=tu-tienda.myshopify.com` en todas las URLs.

### "Invalid HMAC signature"

- Verifica que `SHOPIFY_API_SECRET` sea correcto
- No modifiques los parámetros de la URL de callback

### "No active session"

Reinstala la app:
```
http://localhost:8081/api/auth?shop=tu-tienda.myshopify.com
```

### "Authentication failed"

1. Verifica credenciales en `.env`
2. Verifica que `HOST` coincida con Partners Dashboard
3. Verifica que las redirect URLs estén configuradas
4. Reinicia el servidor después de cambiar `.env`

### Los productos no cargan

1. Verifica que la instalación fue exitosa
2. Verifica que el token está en la base de datos:
   ```bash
   sqlite3 database.db "SELECT * FROM shopify_sessions"
   ```
3. Verifica los logs del servidor para errores

### Error de CORS

Si ves errores de CORS, verifica que tu app esté embebida correctamente en Shopify Admin.

## 📚 Documentación Adicional

- [OAUTH_SETUP.md](./OAUTH_SETUP.md) - Documentación completa de OAuth
- [SHOPIFY_ACCESS_TOKEN_GUIDE.md](./SHOPIFY_ACCESS_TOKEN_GUIDE.md) - Guía anterior (tokens manuales)
- [README.md](./README.md) - Documentación general de la app

## 🎯 Próximos Pasos

Una vez que hayas instalado la app exitosamente:

1. **Configurar reglas de precios** en el dashboard
2. **Probar el flujo completo** desde el storefront
3. **Implementar webhook de uninstall** (opcional pero recomendado)
4. **Deploy a producción** (Railway, Heroku, etc.)

## 🌐 Deploy a Producción

### Railway

```bash
# 1. Configurar variables de entorno en Railway
SHOPIFY_API_KEY=xxx
SHOPIFY_API_SECRET=xxx
HOST=https://your-app.railway.app
SCOPES=read_products,write_products,...

# 2. Deploy
git push railway main

# 3. Actualizar URLs en Shopify Partners Dashboard
# 4. Instalar en tu tienda de producción
```

### Heroku

```bash
# 1. Configurar variables de entorno
heroku config:set SHOPIFY_API_KEY=xxx
heroku config:set SHOPIFY_API_SECRET=xxx
heroku config:set HOST=https://your-app.herokuapp.com

# 2. Deploy
git push heroku main
```

## ✅ Checklist de Instalación

- [ ] Archivo `.env` creado con credenciales correctas
- [ ] URLs configuradas en Shopify Partners Dashboard
- [ ] Servidor iniciado sin errores
- [ ] Instalación completada en una tienda de prueba
- [ ] Token guardado en base de datos
- [ ] Endpoint `/api/products` funciona correctamente
- [ ] Frontend carga sin errores

## 💡 Tips

- **Usa una development store** para pruebas
- **Mantén ngrok corriendo** durante desarrollo
- **Revisa los logs** del servidor para debugging
- **Usa herramientas de debug** de Shopify Partners Dashboard
- **Prueba la instalación** en diferentes tiendas

## 🆘 ¿Necesitas Ayuda?

1. Revisa los logs del servidor
2. Revisa `OAUTH_SETUP.md` para detalles técnicos
3. Consulta [Shopify OAuth Docs](https://shopify.dev/docs/apps/auth/oauth)
4. Verifica la configuración en Partners Dashboard

---

**¡Listo!** Tu app ahora obtiene tokens automáticamente mediante OAuth. 🎉

