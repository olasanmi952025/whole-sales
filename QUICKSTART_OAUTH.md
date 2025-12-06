# ⚡ Inicio Rápido - OAuth en 5 Minutos

## 🎯 Objetivo
Configurar OAuth y obtener tokens automáticamente de tu tienda Shopify.

---

## 📋 Paso 1: Crear `.env`

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

**Dónde obtener las credenciales:**
1. Ve a https://partners.shopify.com/
2. Apps → [Tu App] → Configuration
3. Copia **Client ID** y **Client secret**

---

## 🔧 Paso 2: Configurar en Shopify Partners

En la configuración de tu app:

**App URL:**
```
https://your-app-url.com/
```

**Allowed redirection URL(s):** (agregar estas 3 URLs)
```
https://your-app-url.com/api/auth/callback
https://your-app-url.com/api/auth
https://your-app-url.com/
```

---

## 🚀 Paso 3: Desarrollo Local

### Opción A: Con ngrok (Recomendado)

```bash
# Terminal 1: Instalar y ejecutar ngrok
npm install -g ngrok
ngrok http 8081

# Copiar URL de ngrok (ej: https://abc123.ngrok.io)
# Actualizar .env:
# HOST=https://abc123.ngrok.io

# Actualizar URLs en Shopify Partners Dashboard

# Terminal 2: Iniciar app
npm install
npm run dev
```

### Opción B: Solo localhost (limitado)

```bash
npm install
npm run dev

# Solo funcionará con ciertas configuraciones
```

---

## 🎯 Paso 4: Instalar la App

Visita en tu navegador:

```
http://localhost:8081/api/auth?shop=TU-TIENDA.myshopify.com
```

**Reemplaza** `TU-TIENDA` con el nombre de tu tienda.

**¿Qué va a pasar?**
1. Te redirige a Shopify ✓
2. Pides autorización de permisos ✓
3. Aceptas los permisos ✓
4. La app obtiene el token automáticamente ✓
5. Token se guarda en base de datos ✓
6. Regresas a la app ✓

---

## ✅ Paso 5: Verificar

### Verificar configuración:

```powershell
# Windows
.\scripts\test-oauth.ps1

# Linux/Mac
./scripts/test-oauth.sh
```

### Verificar sesión:

```bash
curl "http://localhost:8081/api/auth/verify?shop=TU-TIENDA.myshopify.com"
```

Respuesta esperada:
```json
{
  "success": true,
  "authenticated": true,
  "shop": "tu-tienda.myshopify.com"
}
```

### Probar productos:

```bash
curl "http://localhost:8081/api/products?shop=TU-TIENDA.myshopify.com"
```

Deberías ver tus productos reales de Shopify.

---

## 🐛 Problemas Comunes

| Problema | Solución |
|----------|----------|
| "Missing shop parameter" | Agrega `?shop=tu-tienda.myshopify.com` a la URL |
| "Invalid HMAC" | Verifica `SHOPIFY_API_SECRET` en `.env` |
| "No active session" | Reinstala: `/api/auth?shop=...` |
| "Authentication failed" | Verifica credenciales y URLs en Partners |

---

## 📚 Más Información

- **Instalación completa**: [INSTALL_OAUTH.md](./INSTALL_OAUTH.md)
- **Documentación técnica**: [OAUTH_SETUP.md](./OAUTH_SETUP.md)
- **Resumen completo**: [OAUTH_IMPLEMENTATION_SUMMARY.md](./OAUTH_IMPLEMENTATION_SUMMARY.md)

---

## 🎉 ¡Listo!

Tu app ahora obtiene tokens automáticamente. Ya no necesitas configurar tokens manualmente.

**Siguiente paso:** Configurar reglas de precios en el dashboard de la app.

---

## 🔗 Enlaces Rápidos

- [Shopify Partners Dashboard](https://partners.shopify.com/)
- [OAuth Documentation](https://shopify.dev/docs/apps/auth/oauth)
- [API Scopes](https://shopify.dev/docs/api/usage/access-scopes)

---

**Tiempo estimado**: 5 minutos  
**Dificultad**: Fácil  
**Requisitos**: Cuenta de Shopify Partners, ngrok (opcional)

