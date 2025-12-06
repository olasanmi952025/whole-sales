# 🚀 Deploy a Railway - Pasos EXACTOS

## ✅ Archivos Listos

He preparado TODO para Railway. Estos son los archivos actualizados:

- ✅ `shopify.app.toml` - URLs de Railway configuradas
- ✅ `package.json` - Scripts de `build` y `start` añadidos
- ✅ `railway.json` - Configuración de deploy para Railway
- ✅ `web/frontend/` - Frontend compilado con ShopContext
- ✅ `web/` - Backend con OAuth implementado

---

## 🎯 PASO 1: Obtener Client Secret de Shopify

1. **Ve a**: https://partners.shopify.com/
2. **Apps** → **whole-sale** → **Configuration**
3. **Busca**: "Client secret" o "API secret key"
4. **Cópialo** (algo como: `shpat_xxxxxxxxxxxxx` o similar)
5. **Guárdalo** temporalmente (lo necesitarás en el Paso 3)

---

## 🎯 PASO 2: Compilar Frontend Localmente

Antes de hacer push a Railway, compila el frontend:

```powershell
# Ir a la carpeta del frontend
cd web/frontend

# Instalar dependencias (si no las tienes)
npm install

# Compilar
npm run build

# Volver a la raíz
cd ../..
```

**Verificar:** Deberías ver la carpeta `web/dist/frontend/` con archivos HTML, CSS y JS.

---

## 🎯 PASO 3: Configurar Variables en Railway

### 3.1 Ve a Railway Dashboard

1. **Abre**: https://railway.app/
2. **Selecciona** tu proyecto (whole-sales-production o similar)
3. **Ve a**: Variables (o Settings → Variables)

### 3.2 Añade Estas Variables:

**Copia y pega estas 7 variables:**

```
SHOPIFY_API_KEY=3279b2b69ff81a988056fdacd05c5c7b
```

```
SHOPIFY_API_SECRET=TU_CLIENT_SECRET_DE_PASO_1
```
**⚠️ IMPORTANTE**: Reemplaza `TU_CLIENT_SECRET_DE_PASO_1` con el secret que copiaste

```
HOST=https://whole-sales-production.up.railway.app
```

```
SCOPES=read_products,write_products,read_orders,write_orders,read_discounts,write_discounts,read_script_tags,write_script_tags,read_price_rules,write_price_rules
```

```
NODE_ENV=production
```

```
PORT=8081
```

```
DATABASE_PATH=./database.db
```

### 3.3 Guardar

- **Click** en "Add" o "Save" para cada variable
- **Verifica** que todas las 7 variables estén guardadas

---

## 🎯 PASO 4: Configurar Shopify Partners

### 4.1 Ve a Shopify Partners

1. **Abre**: https://partners.shopify.com/
2. **Apps** → **whole-sale** → **Configuration**

### 4.2 Configurar URLs

**App URL:**
```
https://whole-sales-production.up.railway.app/
```

**Allowed redirection URL(s):** (Añade las 3)
```
https://whole-sales-production.up.railway.app/api/auth/callback
```
```
https://whole-sales-production.up.railway.app/api/auth
```
```
https://whole-sales-production.up.railway.app/
```

### 4.3 Guardar

- **Click** en "Save" en la parte superior
- **Espera** a que se guarde (puede tardar unos segundos)

---

## 🎯 PASO 5: Deploy a Railway

### 5.1 Commit de Cambios

```powershell
# Agregar todos los archivos
git add .

# Commit
git commit -m "Configure OAuth and Railway deployment"
```

### 5.2 Push a Railway

```powershell
# Si ya tienes remote de Railway configurado:
git push railway main

# Si NO tienes remote de Railway:
# Primero añádelo (obtén la URL de Railway Dashboard → Settings → Git):
# git remote add railway TU_URL_DE_RAILWAY_GIT
# git push railway main
```

### 5.3 Esperar Deploy

1. **Ve a** Railway Dashboard
2. **Ve a** "Deployments"
3. **Espera** a que termine (2-5 minutos)
4. **Verifica** que el estado sea "Success" o "Active"

---

## 🎯 PASO 6: Instalar la App

### 6.1 URL de Instalación

**Abre en tu navegador:**
```
https://whole-sales-production.up.railway.app/api/auth?shop=mayoreo-9044.myshopify.com
```

### 6.2 Flujo de Instalación

1. **Te redirige** a Shopify
2. **Ves** página de autorización con lista de permisos
3. **Click** en "Instalar" o "Install app"
4. **Espera** redirección (puede tardar unos segundos)
5. **Deberías ver** tu app cargada

### 6.3 Si Funciona

✅ Verás la interfaz de tu app (Pricing Rules, Logs)  
✅ No habrá error "Missing shop parameter"  
✅ Podrás listar productos y crear reglas

---

## 🎯 PASO 7: Verificar que Funciona

### 7.1 Desde Shopify Admin

1. **Ve a** tu Admin de Shopify
2. **Apps** → **whole-sale**
3. **Verifica** que cargue sin errores

### 7.2 Verificar en Railway Logs

1. **Railway Dashboard** → Tu proyecto → **View logs**
2. **Busca** líneas como:
   ```
   ✅ Session stored: offline_mayoreo-9044.myshopify.com
   🔑 Access Token obtained: shpat_...
   ```

### 7.3 Probar API

Abre en tu navegador o usa curl:
```
https://whole-sales-production.up.railway.app/api/products?shop=mayoreo-9044.myshopify.com
```

Deberías ver JSON con tus productos.

---

## 🐛 Troubleshooting

### Error: "redirect_uri is not whitelisted"

**Solución:**
1. Verifica URLs en Shopify Partners (Paso 4)
2. Asegúrate de haber guardado los cambios
3. Espera 1-2 minutos y reintenta

### Error: "Invalid HMAC"

**Solución:**
1. Verifica `SHOPIFY_API_SECRET` en Railway
2. Debe ser exactamente igual al de Partners
3. Redeploy Railway después de cambiar

### Error: "Missing shop parameter"

**Solución:**
1. Verifica que el frontend esté compilado
2. Verifica que se hizo push del código actualizado
3. Limpia caché del navegador (Ctrl+F5)

### Deploy Falla en Railway

**Solución:**
1. Ve a Railway → Deployments → Ver logs
2. Busca el error específico
3. Verifica que `npm run build` funcione localmente:
   ```powershell
   npm run build
   ```
4. Si hay errores de TypeScript, corrígelos primero

### La App No Carga

**Solución:**
1. Ve a Railway → View logs
2. Busca errores en tiempo real
3. Verifica variables de entorno están configuradas
4. Verifica que el deploy terminó exitosamente

---

## 📋 Checklist Final

Antes de instalar, verifica:

- [ ] ✅ Frontend compilado (`web/dist/frontend/` existe)
- [ ] ✅ Variables de entorno en Railway (7 variables)
- [ ] ✅ `SHOPIFY_API_SECRET` correcto
- [ ] ✅ URLs configuradas en Shopify Partners
- [ ] ✅ Cambios guardados en Partners
- [ ] ✅ Push a Railway exitoso
- [ ] ✅ Deploy completado en Railway
- [ ] ✅ App estado "Active" en Railway

Si TODO está ✅, instala desde:
```
https://whole-sales-production.up.railway.app/api/auth?shop=mayoreo-9044.myshopify.com
```

---

## 🎯 Resumen de URLs Importantes

**Railway Dashboard:**
https://railway.app/

**Shopify Partners:**
https://partners.shopify.com/

**URL de Instalación:**
https://whole-sales-production.up.railway.app/api/auth?shop=mayoreo-9044.myshopify.com

**Tu App en Shopify Admin:**
https://admin.shopify.com/store/mayoreo-9044/apps/whole-sale-3

---

## ✅ ¡Listo!

Sigue los 7 pasos en orden y tu app funcionará en Railway.

**Tiempo estimado:** 15-20 minutos

**¿Dudas?** Revisa el archivo `RAILWAY_DEPLOYMENT_CHECKLIST.md` para más detalles.

