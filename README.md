# Shopify Wholesale Pricing App

Sistema B2B completo para precios por cantidad (Tiered Pricing / Quantity Breaks) en Shopify.

## Características

- **Precios por Volumen**: Configura múltiples niveles de precios basados en cantidad
- **Aplicación Automática**: Los precios se ajustan dinámicamente en el storefront y carrito
- **Priorización Inteligente**: Variante > Producto > Colección
- **Dashboard Admin**: Interfaz completa en Shopify Admin para gestionar reglas
- **Logs Detallados**: Tracking de todas las reglas aplicadas a órdenes
- **Shopify Functions**: Integración nativa con Cart Transform API

## Estructura del Proyecto

```
.
├── web/                          # Backend (Node.js + Koa)
│   ├── database/                 # SQLite schema y configuración
│   ├── repositories/             # Data access layer
│   ├── services/                 # Business logic
│   ├── controllers/              # API controllers
│   ├── routes/                   # API routes
│   ├── middleware/               # Shopify auth
│   ├── types/                    # TypeScript types
│   └── index.ts                  # Server entry point
│
├── web/frontend/                 # Frontend (React + Polaris)
│   ├── src/
│   │   ├── components/          # UI components
│   │   ├── hooks/               # Custom hooks
│   │   ├── pages/               # Main pages
│   │   └── types/               # TypeScript types
│   └── vite.config.ts
│
├── extensions/                   # Shopify Extensions
│   └── cart-transform/          # Cart Transform Function
│       └── src/
│
└── public/                       # Static files
    └── storefront-script.js     # Frontend script
```

## Stack Tecnológico

- **Backend**: Node.js, Koa, TypeScript
- **Frontend**: React, Polaris, Vite
- **Database**: SQLite (better-sqlite3)
- **APIs**: Shopify Admin API, Shopify Functions API
- **Auth**: Shopify App Bridge

## Instalación

### 1. Requisitos

- Node.js 18+
- npm o yarn
- Cuenta de Shopify Partners
- Shopify CLI 3

### 2. Configuración Inicial

```bash
# Instalar Shopify CLI
npm install -g @shopify/cli @shopify/app

# Clonar y configurar
npm install

# Configurar variables de entorno
cp .env.example .env
```

### 3. Variables de Entorno

Edita `.env`:

```env
SHOPIFY_API_KEY=tu_api_key
SHOPIFY_API_SECRET=tu_api_secret
SCOPES=write_products,read_products,write_orders,read_orders,write_discounts,read_discounts,write_script_tags,read_script_tags
HOST=https://tu-dominio.ngrok.io
DATABASE_PATH=./database.db
NODE_ENV=development
```

### 4. Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# En otra terminal, compilar frontend
cd web/frontend
npm install
npm run dev
```

### 5. Deploy

```bash
# Deploy a Shopify
npm run deploy

# Build frontend para producción
cd web/frontend
npm run build
```

## Base de Datos

### Schema

#### pricing_rules
- Almacena las reglas de precios
- Campos: shop, target_type, target_id, rule_name, priority, active

#### pricing_tiers
- Define los niveles de precio para cada regla
- Campos: rule_id, min_quantity, price, currency

#### rule_logs
- Tracking de aplicación de reglas
- Campos: shop, order_id, rule_id, tier_applied, quantity, original_price, adjusted_price

### Inicialización

La base de datos se inicializa automáticamente al arrancar el servidor por primera vez usando `schema.sql`.

## API Endpoints

### Pricing Rules

```
GET    /api/rules              - Listar todas las reglas
GET    /api/rules/:id          - Obtener regla por ID
POST   /api/rules              - Crear nueva regla
PUT    /api/rules/:id          - Actualizar regla
DELETE /api/rules/:id          - Eliminar regla
POST   /api/rules/calculate    - Calcular precio para cantidad
```

### Logs

```
GET    /api/logs               - Listar logs
GET    /api/logs/order/:id     - Logs por orden
```

### Ejemplo de Payload

Crear regla:

```json
{
  "rule_name": "Wholesale Tier 1",
  "target_type": "product",
  "target_id": "gid://shopify/Product/123456",
  "priority": 10,
  "active": true,
  "tiers": [
    { "min_quantity": 5, "price": 10.00 },
    { "min_quantity": 10, "price": 8.00 },
    { "min_quantity": 20, "price": 6.00 }
  ]
}
```

**Nota**: Todos los precios deben ser configurados manualmente. No hay valores por defecto.

## Shopify Function (Cart Transform)

### Funcionamiento

1. El script del storefront añade atributos al line item (`_wholesale_tier`)
2. La Cart Transform Function lee estos atributos
3. Ajusta el precio del line item en el carrito
4. El checkout muestra el precio correcto

### Deploy de Functions

```bash
# Desde la raíz del proyecto
shopify app generate extension --type function

# Seleccionar Cart Transform
# Deploy
shopify app deploy
```

## Script del Storefront

### Instalación

El script se instala automáticamente vía Script Tags API cuando la app se instala.

### Funcionalidades

- **Detección automática** del producto y cantidad
- **Tabla de precios** visible en la página de producto
- **Actualización dinámica** del precio según cantidad
- **Notificación visual** cuando se aplica un tier
- **Persistencia** de datos en el carrito (line item properties)

### Personalización

El script está en `public/storefront-script.js` y puede personalizarse según el tema de la tienda.

## Flujo de Trabajo

### 1. Configuración de Reglas

Admin crea regla en el dashboard:
- Selecciona producto/colección/variante
- **Añade tiers manualmente** haciendo click en "Add First Tier"
- Define niveles de precio (ej: 5+ unidades = $10)
- Añade múltiples tiers según necesidad
- Activa la regla

⚠️ **Los precios son 100% configurables - no hay valores por defecto**

### 2. Cliente en Storefront

Cliente visita página de producto:
- Ve tabla de precios por volumen
- Selecciona cantidad
- Precio se actualiza automáticamente

### 3. Agregar al Carrito

Cliente añade producto:
- Script adjunta tier aplicado como property
- Line item lleva información del descuento

### 4. Checkout

Cart Transform Function:
- Lee properties del line item
- Aplica descuento correspondiente
- Cliente ve precio final correcto

### 5. Orden Creada

Sistema registra en logs:
- Qué regla se aplicó
- Precio original vs ajustado
- Cantidad y tier usado

## Priorización de Reglas

Cuando múltiples reglas aplican, se usa esta prioridad:

1. **Variante específica**: Más específico
2. **Producto**: Medio
3. **Colección**: Más general

Dentro del mismo nivel, se usa el campo `priority` (mayor número = mayor prioridad).

## Testing

### Test Manual

1. Crear producto de prueba en Shopify
2. Copiar Product ID (gid://shopify/Product/XXX)
3. Crear regla en el dashboard
4. Visitar página de producto en storefront
5. Verificar tabla de precios
6. Cambiar cantidad y verificar actualización
7. Agregar al carrito
8. Verificar precio en checkout

### Debugging

- Logs del backend: consola del servidor
- Logs del frontend: DevTools del navegador
- Function logs: Shopify Partner Dashboard > Apps > Functions

## Limitaciones Conocidas

- Los precios se calculan por line item (no por cantidad total en carrito)
- Requiere temas compatibles con Script Tags (mayoría de temas modernos)
- Cart Transform Functions tienen límite de ejecución (200ms)

## Troubleshooting

### Script no carga en storefront

Verificar:
- Script Tag está instalado (`GET /admin/api/2024-01/script_tags.json`)
- URL del HOST es correcta en `.env`
- La app tiene permisos `write_script_tags`

### Precios no se actualizan

Verificar:
- Regla está activa (`active: true`)
- Target ID es correcto (formato GID de Shopify)
- Cantidad cumple mínimo del tier

### Function no aplica descuento

Verificar:
- Function está deployed (`shopify app deploy`)
- Line item tiene property `_wholesale_tier`
- JSON del property es válido

## Arquitectura Técnica

### Backend

- **Repository Pattern**: Separación de lógica de acceso a datos
- **Service Layer**: Lógica de negocio (cálculo de precios)
- **Controller Layer**: Manejo de requests HTTP
- **Database**: SQLite con WAL mode para concurrencia

### Frontend

- **Component-based**: React con Polaris Design System
- **Custom Hooks**: Abstracción de API calls
- **State Management**: React useState/useEffect
- **Type Safety**: TypeScript en todo el código

### Integration

- **Shopify Functions**: Ejecución serverless en Shopify infrastructure
- **Script Tags**: Inyección de JavaScript en storefront
- **GraphQL/REST**: APIs de Shopify Admin
- **Webhooks**: (Opcional) Para sincronización automática

## Extensibilidad

### Añadir Webhook de Órdenes

Para registrar automáticamente en logs cuando se crea una orden:

1. Registrar webhook `orders/create`
2. Crear handler en `web/controllers/webhooks.controller.ts`
3. Extraer line item properties
4. Guardar en `rule_logs`

### Añadir Autenticación de Clientes

Para restringir precios B2B solo a clientes específicos:

1. Verificar customer tags en storefront script
2. Filtrar reglas por customer ID/tags
3. Actualizar `pricing_rules` con campo `allowed_customers`

### Multi-currency

Para soportar múltiples monedas:

1. Añadir campo `currency` a tiers (ya existe)
2. Detectar moneda en storefront
3. Filtrar tiers por moneda activa

## Seguridad

- **Session Storage**: SQLite con encriptación opcional
- **CORS**: Configurado para Shopify domains únicamente
- **Validation**: Input sanitization en todos los endpoints
- **Scopes**: Permisos mínimos necesarios

## Performance

- **Caching**: Rules cacheadas en frontend
- **Database Indexes**: Índices en campos frecuentes
- **WAL Mode**: SQLite optimizado para lectura concurrente
- **Lazy Loading**: Frontend carga componentes bajo demanda

## Soporte

Para problemas o preguntas:
- Revisar logs del servidor
- Verificar Shopify Partner Dashboard
- Consultar documentación de Shopify Functions

## Licencia

Proyecto propietario para uso interno.

