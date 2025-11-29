# Guía de Deployment

## Preparación

### 1. Crear App en Shopify Partners

1. Ir a [Shopify Partners](https://partners.shopify.com)
2. Apps → Create app → Custom app
3. Anotar:
   - API Key
   - API Secret Key

### 2. Configurar Variables de Entorno

Crear archivo `.env`:

```env
SHOPIFY_API_KEY=tu_api_key_aqui
SHOPIFY_API_SECRET=tu_secret_aqui
SCOPES=write_products,read_products,write_orders,read_orders,write_discounts,read_discounts,write_script_tags,read_script_tags
HOST=https://tu-app.fly.dev
DATABASE_PATH=/data/database.db
NODE_ENV=production
PORT=8080
```

### 3. Actualizar shopify.app.toml

```toml
name = "wholesale-pricing"
client_id = "tu_api_key_aqui"
application_url = "https://tu-app.fly.dev"
embedded = true

[build]
dev_store_url = "tu-tienda.myshopify.com"
```

## Opción 1: Deploy en Fly.io (Recomendado)

### Instalación

```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

### Configurar fly.toml

Crear `fly.toml`:

```toml
app = "wholesale-pricing-app"
primary_region = "ord"

[build]
  builder = "heroku/buildpacks:20"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[[services]]
  http_checks = []
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20

[[mounts]]
  source = "data"
  destination = "/data"
```

### Deploy

```bash
# Crear app
fly apps create wholesale-pricing-app

# Crear volumen persistente para SQLite
fly volumes create data --region ord --size 1

# Configurar secrets
fly secrets set SHOPIFY_API_KEY=tu_key
fly secrets set SHOPIFY_API_SECRET=tu_secret
fly secrets set SCOPES=write_products,read_products,write_orders,read_orders,write_discounts,read_discounts,write_script_tags,read_script_tags

# Deploy
fly deploy

# Ver logs
fly logs
```

## Opción 2: Deploy en Heroku

### Instalación

```bash
npm install -g heroku
heroku login
```

### Configurar

```bash
# Crear app
heroku create wholesale-pricing-app

# Añadir buildpack
heroku buildpacks:add heroku/nodejs

# Configurar variables
heroku config:set SHOPIFY_API_KEY=tu_key
heroku config:set SHOPIFY_API_SECRET=tu_secret
heroku config:set SCOPES=write_products,read_products,write_orders,read_orders,write_discounts,read_discounts,write_script_tags,read_script_tags
heroku config:set NODE_ENV=production
heroku config:set HOST=$(heroku info -s | grep web_url | cut -d= -f2)

# Deploy
git push heroku main

# Ver logs
heroku logs --tail
```

### Database en Heroku

Heroku usa filesystem efímero. Opciones:

#### Opción A: PostgreSQL
Migrar de SQLite a PostgreSQL (requiere refactoring).

#### Opción B: Attached Storage
Usar addon como `heroku-postgres` o storage persistente.

## Opción 3: Deploy en Railway

### Instalación

```bash
npm i -g @railway/cli
railway login
```

### Deploy

```bash
# Inicializar
railway init

# Configurar variables
railway variables set SHOPIFY_API_KEY=tu_key
railway variables set SHOPIFY_API_SECRET=tu_secret
railway variables set SCOPES=write_products,read_products,write_orders,read_orders,write_discounts,read_discounts,write_script_tags,read_script_tags

# Deploy
railway up

# Ver logs
railway logs
```

Railway provee storage persistente automáticamente.

## Deploy de Shopify Functions

### 1. Instalar Javy (Compiler JS → WASM)

```bash
# macOS
brew install javy

# Linux
curl -L https://github.com/bytecodealliance/javy/releases/download/v1.0.0/javy-x86_64-linux -o /usr/local/bin/javy
chmod +x /usr/local/bin/javy

# Windows
# Descargar desde https://github.com/bytecodealliance/javy/releases
```

### 2. Build Function

```bash
cd extensions/cart-transform
npm run build
```

### 3. Deploy

```bash
# Desde la raíz
shopify app deploy

# Seleccionar Cart Transform function
# Confirmar deploy
```

### 4. Activar Function en Shopify

1. Ir a Shopify Admin → Settings → Checkout
2. Checkout extensibility → Cart transform
3. Activar "Wholesale Pricing Transform"

## Instalar Script Tag

### Opción A: Manual (Admin)

1. Admin → Settings → Files
2. Upload `public/storefront-script.js`
3. Copiar URL
4. Settings → Checkout → Additional scripts
5. Pegar:

```html
<script src="https://cdn.shopify.com/s/files/1/xxxx/files/storefront-script.js"></script>
```

### Opción B: Automático (API)

El script se instala automáticamente cuando la app se instala via `ScriptTagService`.

Verificar instalación:

```bash
curl -X GET \
  "https://tu-tienda.myshopify.com/admin/api/2024-01/script_tags.json" \
  -H "X-Shopify-Access-Token: tu_access_token"
```

## Post-Deploy

### 1. Verificar Salud

```bash
# Health check
curl https://tu-app.fly.dev/api/rules

# Debe retornar JSON
```

### 2. Instalar en Dev Store

```bash
shopify app dev

# Abrir URL que muestra
# Instalar app en dev store
```

### 3. Test Completo

1. Crear regla de prueba
2. Configurar producto
3. Abrir storefront
4. Verificar script carga
5. Agregar al carrito
6. Verificar checkout

### 4. Monitoreo

Configurar alertas:

```bash
# Fly.io
fly dashboard

# Heroku
heroku logs --tail

# Railway
railway logs --follow
```

## Rollback

### Fly.io

```bash
# Ver releases
fly releases

# Rollback
fly releases rollback <version>
```

### Heroku

```bash
# Ver releases
heroku releases

# Rollback
heroku rollback v<number>
```

### Railway

```bash
# Railway hace rollback automático si falla el deploy
# Manual: redeploy commit anterior
railway up --commit <commit-hash>
```

## Backup

### Database

```bash
# Fly.io - descargar volumen
fly ssh console
cd /data
tar -czf backup.tar.gz database.db
exit

# Copiar localmente
fly ssh sftp get /data/backup.tar.gz

# Heroku - si usas addon
heroku pg:backups:download
```

### Restaurar

```bash
# Fly.io
fly ssh console
cd /data
# Subir archivo
# tar -xzf backup.tar.gz
```

## CI/CD con GitHub Actions

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Fly.io
        uses: superfly/flyctl-actions/setup-flyctl@master
      
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
      
      - name: Deploy Shopify Functions
        run: |
          npm install -g @shopify/cli
          shopify app deploy
        env:
          SHOPIFY_API_KEY: ${{ secrets.SHOPIFY_API_KEY }}
          SHOPIFY_API_SECRET: ${{ secrets.SHOPIFY_API_SECRET }}
```

## Troubleshooting

### Script no carga

1. Verificar CORS:
```javascript
// Añadir a web/index.ts
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  await next();
});
```

2. Verificar URL en Script Tag

### Function no ejecuta

1. Verificar está deployed:
```bash
shopify app info
```

2. Ver logs:
Partner Dashboard → Apps → tu app → Extensions → Logs

3. Verificar WASM compiló:
```bash
cd extensions/cart-transform
ls -lh dist/index.wasm
```

### Database locked

SQLite en producción con múltiples instancias:

**Solución:** Migrar a PostgreSQL o usar Redis para cache.

### Rate limiting

Shopify tiene límites de API:

**Solución:** Implementar exponential backoff y request queuing.

## Checklist Pre-Production

- [ ] Variables de entorno configuradas
- [ ] Database respaldada
- [ ] Script Tag instalado
- [ ] Function deployada y activa
- [ ] Tests pasando
- [ ] Monitoreo configurado
- [ ] Alertas activas
- [ ] Documentación actualizada
- [ ] Team notificado

## Soporte

Issues comunes resueltos en:
- GitHub Issues
- Shopify Community
- Stack Overflow (tag: shopify)

