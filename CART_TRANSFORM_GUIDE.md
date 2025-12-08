# 🎯 Implementación de Cart Transformations para Precios Mayoristas

## ⚠️ REQUISITO IMPORTANTE

**Cart Transformations requiere Shopify Plus ($2000/mes mínimo)**

Si NO tienes Shopify Plus, hay 2 alternativas:
1. **Cart & Checkout Validation** (disponible en todos los planes)
2. **Payment Customizations** (disponible en planes Advanced y Plus)

## 📋 Verificar si tienes Shopify Plus

1. Ve a tu Shopify Admin
2. Settings → Plan
3. Si dice "Shopify Plus", puedes continuar con Cart Transformations

## 🚀 Implementación (Shopify Plus)

### Paso 1: Instalar Rust (necesario para compilar)

```powershell
# Descargar e instalar desde: https://www.rust-lang.org/tools/install
# O usar chocolatey:
choco install rust

# Agregar target wasm32-wasi
rustup target add wasm32-wasi
```

### Paso 2: Compilar la Función

```bash
cd extensions/cart-transform
cargo wasi build --release
```

### Paso 3: Desplegar con Shopify CLI

```bash
shopify app deploy
```

### Paso 4: Activar en Shopify Admin

1. Ve a: Settings → Apps and sales channels → Develop apps
2. Encuentra tu app "Wholesale Pricing"
3. En la sección "Extensions", activa "Cart Transform"
4. Configura para que se ejecute en todos los carritos

## 🔧 Cómo Funciona

1. Cliente agrega producto al carrito
2. Script agrega propiedad `_wholesale_price` al line item
3. Cart Transform lee la propiedad
4. **Modifica `lineItem.cost` directamente**
5. ✅ El carrito muestra el precio mayorista (NO como descuento)

## 📊 Flujo Completo

```
Producto → Add to Cart → Line Item Properties:
{
  "_wholesale_price": "500.00",
  "_wholesale_tier": "6",
  "_has_wholesale": "true"
}
↓
Cart Transform Function lee properties
↓
Modifica price con fixed_price_per_unit
↓
✅ Carrito muestra $500 (no $600 con descuento)
```

## 🎯 Alternativas Sin Shopify Plus

### Opción 1: Cart & Checkout Validation
- Valida el precio en checkout
- Bloquea si el precio no es correcto
- Muestra mensaje al cliente

### Opción 2: Payment Customizations  
- Modifica el total en checkout
- Solo disponible en Advanced ($299/mes) y Plus

### Opción 3: Draft Orders (YA IMPLEMENTADO)
- ✅ Ya funciona
- ✅ Precios correctos
- ⚠️ Cliente usa link especial

## 🚀 Próximos Pasos

**SI TIENES SHOPIFY PLUS:**
1. Instala Rust
2. Compila la función
3. Despliega con `shopify app deploy`
4. Activa en el admin

**SI NO TIENES SHOPIFY PLUS:**
- Usa la solución de Draft Orders (ya implementada)
- O actualiza a Shopify Plus para Cart Transformations

## 📞 Verificación

Para verificar si tienes Shopify Plus y puedes usar Cart Transformations:

```bash
shopify app info
```

Busca en la salida: "extensions_enabled: true"

