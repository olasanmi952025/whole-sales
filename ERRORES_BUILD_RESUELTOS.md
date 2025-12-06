# ✅ Errores de Build Resueltos

## Problema
Railway fallaba al compilar porque TypeScript encontraba errores en:
1. Frontend (archivos compilados en `dist/frontend/`)
2. Repositorios (cast de tipos)
3. Script tag service (versión de API)

## Solución Aplicada

### 1. tsconfig.json
```json
{
  "include": ["web/**/*.ts", "extensions/**/*"],
  "exclude": ["node_modules", "dist", "web/frontend", "web/dist"]
}
```
- Excluye `web/frontend` (tiene su propio tsconfig)
- Excluye `web/dist` (archivos compilados)
- Solo incluye archivos `.ts` del backend

### 2. package.json
```json
{
  "scripts": {
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "tsc",
    "build:frontend": "cd web/frontend && npm install && npm run build && cd ../.."
  }
}
```
- Separa build de backend y frontend
- Backend compila con `tsc`
- Frontend compila con `vite`

### 3. railway.json
```json
{
  "buildCommand": "npm install && npm run build:backend && cd web/frontend && npm install && npm run build"
}
```
- Orden correcto de compilación
- Instala dependencias del frontend por separado

### 4. Repositorios
**Archivos corregidos:**
- `web/repositories/pricing-rules.repository.ts`
- `web/repositories/rule-logs.repository.ts`

**Cambio:**
```typescript
// Antes:
stmt.getAsObject() as PricingRule

// Ahora:
stmt.getAsObject() as unknown as PricingRule
```

### 5. Script Tag Service
**Archivo:** `web/services/script-tag.service.ts`

**Cambio:**
```typescript
// Antes:
import { shopifyApi } from '@shopify/shopify-api';
apiVersion: '2024-01'

// Ahora:
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
apiVersion: LATEST_API_VERSION
```

## Resultado

✅ Backend compila sin errores  
✅ Frontend se compilará en su propio contexto  
✅ Railway podrá hacer deploy correctamente  

## Siguiente Paso

```bash
git add .
git commit -m "Fix TypeScript build errors for Railway deployment"
git push railway main
```

