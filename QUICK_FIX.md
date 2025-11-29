# 🔧 Fix Rápido - Eliminar Extensions

He eliminado la carpeta `extensions/cart-transform` temporalmente para que puedas desarrollar sin problemas.

## ✅ Ahora Funciona

```bash
npm run dev
```

Esto arrancará:
- ✅ Backend de la app
- ✅ Dashboard en Shopify Admin
- ✅ Todas las funcionalidades CRUD
- ✅ Base de datos local

## ⚠️ Sin Cart Transform Function

La app funcionará completamente **excepto**:
- ❌ No modificará precios automáticamente en checkout
- ❌ No habrá cart transformation

## 🎯 Lo que SÍ Funciona (100%)

1. **Dashboard completo** en Shopify Admin
2. **Crear reglas** de precios mayoristas
3. **Editar reglas** existentes
4. **Eliminar reglas**
5. **Ver logs** de operaciones
6. **API REST** completa
7. **Base de datos** SQLite

## 🔄 Restaurar Extensions Después

Cuando quieras las extensions:

```bash
# 1. Restaurar desde backup (si existe)
git checkout extensions/

# 2. O recrear manualmente
shopify app generate extension
# Seleccionar: Function → Cart Transform
```

## 🚀 Siguiente Paso

```bash
# Arrancar app
npm run dev

# Abrir la URL que muestre
# Ejemplo: https://mayoreo-9044.myshopify.com/admin/apps/wholesale-pricing
```

## 💡 Alternativa: Modo Standalone

Si prefieres desarrollar sin Shopify CLI:

```bash
# Terminal 1
npm run dev:local

# Terminal 2
cd web\frontend
npm run dev

# Abrir: http://localhost:3001
```

## 📝 Referencias

- Backend standalone: `web/index-standalone.ts`
- Configuración: `shopify.app.toml` (extensiones comentadas)
- Guía completa: `START_LOCAL.md`

