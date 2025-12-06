# ✅ Checklist Completo: Railway Deployment

## 🎯 Validación Completa para Railway

Esta guía valida **TODO** lo necesario para que tu app funcione en Railway.

---

## 📋 PARTE 1: Archivos del Proyecto

### ✅ 1.1 shopify.app.toml

Tu archivo debe tener:

```toml
client_id = "3279b2b69ff81a988056fdacd05c5c7b"
name = "whole-sale"
application_url = "https://whole-sales-production.up.railway.app/"
embedded = true

[access_scopes]
scopes = "read_products,write_products,read_orders,write_orders,read_discounts,write_discounts,read_script_tags,write_script_tags,read_price_rules,write_price_rules"
use_legacy_install_flow = true

[auth]
redirect_urls = [
  "https://whole-sales-production.up.railway.app/api/auth/callback",
  "https://whole-sales-production.up.railway.app/api/auth",
  "https://whole-sales-production.up.railway.app/"
]
```

**Verificar:**
- [ ] `application_url` apunta a Railway
- [ ] `redirect_urls` tienen las 3 URLs de Railway
- [ ] `scopes` solo tiene lo necesario

---

### ✅ 1.2 package.json

Debe tener un script de `start` para producción:

```json
{
  "scripts": {
    "dev": "shopify app dev",
    "dev:standalone": "node --loader ts-node/esm web/index-standalone.ts",
    "start": "node web/index.ts",
    "build": "tsc",
    "deploy": "npm run build"
  }
}
```

**Verificar:**
- [ ] Tiene script `start`
- [ ] Tiene script `build` (para compilar TypeScript)

---

### ✅ 1.3 railway.json (Opcional pero recomendado)

Crea este archivo en la raíz:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build && cd web/frontend && npm install && npm run build"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Crear archivo:**
- [ ] Crear `railway.json` en la raíz del proyecto

---

### ✅ 1.4 .gitignore

Asegúrate de que incluya:

```
node_modules/
dist/
.env
database.db
*.log
```

**Verificar:**
- [ ] `.env` está en `.gitignore`
- [ ] `node_modules/` está en `.gitignore`
- [ ] `database.db` está en `.gitignore` (opcional, depende si quieres persistencia)

---

## 📋 PARTE 2: Variables de Entorno en Railway

### ✅ 2.1 Configurar Variables en Railway Dashboard

Ve a: https://railway.app/ → Tu Proyecto → Variables

**Variables REQUERIDAS:**

```bash
SHOPIFY_API_KEY=3279b2b69ff81a988056fdacd05c5c7b
SHOPIFY_API_SECRET=tu_client_secret_de_partners
HOST=https://whole-sales-production.up.railway.app
SCOPES=read_products,write_products,read_orders,write_orders,read_discounts,write_discounts,read_script_tags,write_script_tags,read_price_rules,write_price_rules
NODE_ENV=production
PORT=8081
DATABASE_PATH=./database.db
```

**Obtener SHOPIFY_API_SECRET:**
1. Ve a https://partners.shopify.com/
2. Apps → whole-sale → Configuration
3. Busca "Client secret"
4. Cópialo y úsalo como valor de `SHOPIFY_API_SECRET`

**Checklist:**
- [ ] `SHOPIFY_API_KEY` configurado
- [ ] `SHOPIFY_API_SECRET` configurado (desde Partners)
- [ ] `HOST` apunta a Railway
- [ ] `SCOPES` coinciden con shopify.app.toml
- [ ] `NODE_ENV=production`
- [ ] `PORT=8081`

---

## 📋 PARTE 3: Shopify Partners Dashboard

### ✅ 3.1 Configuración de la App

Ve a: https://partners.shopify.com/ → Apps → whole-sale → Configuration

**Configurar:**

#### App URL:
```
https://whole-sales-production.up.railway.app/
```

#### Allowed redirection URL(s):
```
https://whole-sales-production.up.railway.app/api/auth/callback
https://whole-sales-production.up.railway.app/api/auth
https://whole-sales-production.up.railway.app/
```

#### API access scopes:
```
read_products
write_products
read_orders
write_orders
read_discounts
write_discounts
read_script_tags
write_script_tags
read_price_rules
write_price_rules
```

**Checklist:**
- [ ] App URL configurada
- [ ] Las 3 Allowed redirection URLs añadidas
- [ ] API scopes configurados
- [ ] Cambios guardados ("Save" button)

---

### ✅ 3.2 Obtener Credenciales

En la misma página (Configuration):

**Client ID:**
```
3279b2b69ff81a988056fdacd05c5c7b
```
(Ya lo tienes)

**Client secret:**
- [ ] Copiado y guardado en Railway como `SHOPIFY_API_SECRET`

---

## 📋 PARTE 4: Deploy a Railway

### ✅ 4.1 Compilar el Frontend

Antes de hacer deploy, compila el frontend:

```powershell
cd web/frontend
npm install
npm run build
cd ../..
```

**Verificar:**
- [ ] `web/dist/frontend/` existe con archivos compilados
- [ ] No hay errores de compilación

---

### ✅ 4.2 Commit y Push

```powershell
# Agregar todos los cambios
git add .

# Commit
git commit -m "Configure OAuth for Railway deployment"

# Push a Railway
git push railway main
```

**Checklist:**
- [ ] Todos los archivos commiteados
- [ ] Push exitoso a Railway
- [ ] Deploy iniciado en Railway Dashboard

---

### ✅ 4.3 Verificar Deploy

1. Ve a Railway Dashboard
2. Ve a tu proyecto
3. Ve a la pestaña "Deployments"
4. Espera a que el deploy termine (puede tardar 2-5 minutos)

**Verificar:**
- [ ] Deploy completado sin errores
- [ ] App está corriendo (estado: "Active")
- [ ] Logs no muestran errores críticos

---

## 📋 PARTE 5: Instalación de la App

### ✅ 5.1 Instalar en tu Tienda

**Abre en tu navegador:**
```
https://whole-sales-production.up.railway.app/api/auth?shop=mayoreo-9044.myshopify.com
```

**Flujo esperado:**
1. Te redirige a Shopify
2. Ves página de autorización
3. Lista de permisos (los 10 scopes)
4. Botón "Instalar app" o "Install"
5. Aceptas
6. Redirige de vuelta a tu app
7. Ves la interfaz de la app

**Checklist:**
- [ ] Redirección a Shopify funciona
- [ ] Página de autorización se muestra
- [ ] Permisos son correctos
- [ ] Instalación completa exitosamente
- [ ] App carga sin errores

---

### ✅ 5.2 Verificar Instalación

**Opción 1: Desde Shopify Admin**

1. Ve a tu Admin de Shopify
2. Apps → whole-sale
3. La app debería cargar sin errores

**Opción 2: Verificar en Railway Logs**

En Railway Dashboard → Logs, deberías ver:
```
✅ Session stored: offline_mayoreo-9044.myshopify.com for shop: mayoreo-9044.myshopify.com
🔑 Access Token obtained: shpat_xxxxx...
```

**Opción 3: Verificar en Base de Datos**

Si tienes acceso a Railway shell:
```bash
sqlite3 database.db "SELECT shop, substr(accessToken, 1, 20) FROM shopify_sessions"
```

**Checklist:**
- [ ] App aparece en Shopify Admin → Apps
- [ ] Logs de Railway muestran sesión guardada
- [ ] No hay errores en los logs

---

## 📋 PARTE 6: Pruebas de Funcionalidad

### ✅ 6.1 Probar Endpoints

**Productos:**
```bash
curl "https://whole-sales-production.up.railway.app/api/products?shop=mayoreo-9044.myshopify.com"
```

Debería retornar:
```json
{
  "success": true,
  "data": [...]
}
```

**Reglas:**
```bash
curl "https://whole-sales-production.up.railway.app/api/rules?shop=mayoreo-9044.myshopify.com"
```

**Checklist:**
- [ ] Endpoint `/api/products` funciona
- [ ] Endpoint `/api/rules` funciona
- [ ] Respuestas son JSON válido
- [ ] No hay error "Missing shop parameter"

---

### ✅ 6.2 Probar Frontend

1. Abre la app en Shopify Admin
2. Ve a "Pricing Rules"
3. Intenta crear una regla de prueba
4. Verifica que se guarde

**Checklist:**
- [ ] Frontend carga correctamente
- [ ] No hay errores en consola del navegador
- [ ] Puede listar productos
- [ ] Puede crear reglas
- [ ] Datos se guardan correctamente

---

## 📋 PARTE 7: Troubleshooting

### ✅ 7.1 Si el Deploy Falla

**Ver logs en Railway:**
```
Railway Dashboard → Tu Proyecto → Deployments → Ver logs
```

**Problemas comunes:**

1. **Error: "Cannot find module"**
   - Solución: Verificar que `npm install` se ejecutó correctamente
   - Verificar `package.json` tiene todas las dependencias

2. **Error: "Port already in use"**
   - Solución: Railway asigna el puerto automáticamente
   - No uses `PORT=8081` hardcodeado, usa `process.env.PORT || 8081`

3. **Error: "Build failed"**
   - Solución: Compilar localmente primero: `npm run build`
   - Verificar que no hay errores de TypeScript

---

### ✅ 7.2 Si OAuth Falla

**Error: "redirect_uri is not whitelisted"**
- Solución: Verificar URLs en Shopify Partners (PARTE 3.1)
- Asegurarse de que coinciden exactamente con Railway

**Error: "Invalid HMAC"**
- Solución: Verificar `SHOPIFY_API_SECRET` en Railway
- Debe ser exactamente igual al de Partners Dashboard

**Error: "Missing shop parameter"**
- Solución: Verificar que frontend compilado incluye los cambios
- Recompilar: `cd web/frontend && npm run build`

---

### ✅ 7.3 Si la App no Carga

**Revisar:**
1. Variables de entorno en Railway
2. Deploy completado exitosamente
3. Logs de Railway para errores
4. Shopify Partners URLs configuradas correctamente

**Ver logs en tiempo real:**
```
Railway Dashboard → Tu Proyecto → View logs
```

---

## 📋 RESUMEN: Checklist Rápido

### Antes del Deploy:
- [ ] `shopify.app.toml` actualizado con URLs de Railway
- [ ] Frontend compilado (`cd web/frontend && npm run build`)
- [ ] Variables de entorno preparadas

### En Railway Dashboard:
- [ ] Variables de entorno configuradas (7 variables)
- [ ] `SHOPIFY_API_SECRET` obtenido de Partners
- [ ] Deploy completado exitosamente

### En Shopify Partners:
- [ ] App URL configurada
- [ ] 3 Allowed redirection URLs añadidas
- [ ] API scopes configurados
- [ ] Cambios guardados

### Instalación:
- [ ] Visitar URL de instalación
- [ ] Autorizar permisos
- [ ] App instalada correctamente
- [ ] Verificar en Shopify Admin

### Pruebas:
- [ ] Endpoints API funcionan
- [ ] Frontend carga sin errores
- [ ] Puede crear/editar reglas
- [ ] No hay errores en logs

---

## 🎯 URL de Instalación Final

Una vez que TODO esté configurado:

```
https://whole-sales-production.up.railway.app/api/auth?shop=mayoreo-9044.myshopify.com
```

---

## 📞 Comandos Útiles

**Ver logs de Railway (si tienes Railway CLI):**
```bash
railway logs
```

**Redeploy manual:**
```bash
git commit --allow-empty -m "Redeploy"
git push railway main
```

**Verificar variables:**
```bash
railway variables
```

---

## ✅ Estado Actual

- [x] OAuth implementado
- [x] Frontend actualizado con ShopContext
- [x] shopify.app.toml configurado para Railway
- [ ] Variables de entorno en Railway
- [ ] App desplegada en Railway
- [ ] URLs configuradas en Shopify Partners
- [ ] App instalada en tienda

---

**Siguiente paso:** Configurar variables de entorno en Railway y hacer deploy.


