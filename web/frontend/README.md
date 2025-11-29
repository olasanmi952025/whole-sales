# Frontend - Wholesale Pricing App

## Componentes Principales

### Pages

#### RulesPage
Página principal para gestión de reglas de precios.
- Lista todas las reglas configuradas
- Permite crear, editar y eliminar reglas
- Muestra estado activo/inactivo

#### LogsPage
Dashboard de logs de aplicación de reglas.
- Muestra historial de reglas aplicadas
- Filtrable por orden
- Tabla con DataTable de Polaris

### Components

#### RuleForm
Formulario completo para crear/editar reglas.

**Props:**
- `rule`: Regla a editar (null para crear nueva)
- `onSave`: Callback al guardar
- `onCancel`: Callback al cancelar

**Características:**
- Validación en tiempo real
- Banners informativos
- Campos requeridos marcados
- Sin valores por defecto en tiers

**Validación:**
- Rule name obligatorio
- Target ID obligatorio (formato GID)
- Al menos un tier requerido
- Todos los tiers deben tener quantity > 0 y price >= 0

#### RulesList
Lista de reglas con ResourceList de Polaris.

**Props:**
- `rules`: Array de reglas
- `onEdit`: Callback al editar
- `onDelete`: Callback al eliminar

**Características:**
- Badges para estado (Active/Inactive)
- Badge para tipo de target
- Contador de tiers
- Acciones inline (Edit/Delete)

#### TiersInput
Editor dinámico de tiers de precios.

**Props:**
- `tiers`: Array de tiers
- `onChange`: Callback al cambiar

**Características:**
- Añadir/eliminar tiers dinámicamente
- Validación de inputs (min values)
- Mensaje cuando no hay tiers configurados
- Sugiere próxima cantidad basada en último tier
- Botón contextual: "Add First Tier" vs "Add Another Tier"

**⚠️ Importante:**
- NO hay tiers por defecto
- Usuario debe agregar manualmente cada tier
- Mínimo 1 tier requerido para guardar

### Hooks

#### useApi
Hook genérico para llamadas a la API.

```typescript
const { loading, error, request } = useApi<DataType>();

const data = await request('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(payload)
});
```

**Returns:**
- `loading`: Estado de carga
- `error`: Mensaje de error si aplica
- `request`: Función para hacer request

#### usePricingRules
Hook específico para gestión de reglas.

```typescript
const { 
  rules, 
  loading, 
  error, 
  fetchRules, 
  createRule, 
  updateRule, 
  deleteRule 
} = usePricingRules();
```

**Returns:**
- `rules`: Array de reglas
- `loading`: Estado de carga
- `error`: Mensaje de error
- `fetchRules`: Refrescar lista
- `createRule`: Crear nueva regla
- `updateRule`: Actualizar regla existente
- `deleteRule`: Eliminar regla

**Funcionalidades:**
- Auto-fetch al montar
- Auto-refresh después de crear/editar/eliminar
- Manejo de errores automático

## Tipos

### PricingRule
```typescript
interface PricingRule {
  id?: number;
  shop?: string;
  target_type: 'product' | 'collection' | 'variant';
  target_id: string;
  rule_name: string;
  priority?: number;
  active?: boolean;
  tiers?: PricingTier[];
  created_at?: string;
  updated_at?: string;
}
```

### PricingTier
```typescript
interface PricingTier {
  id?: number;
  rule_id?: number;
  min_quantity: number;
  price: number;
  currency?: string;
  created_at?: string;
}
```

### RuleLog
```typescript
interface RuleLog {
  id?: number;
  shop?: string;
  order_id?: string;
  rule_id?: number;
  tier_applied?: string;
  quantity?: number;
  original_price?: number;
  adjusted_price?: number;
  created_at?: string;
}
```

## Flujo de Datos

### Crear Regla
```
User Input → RuleForm 
  → Validación 
  → usePricingRules.createRule() 
  → POST /api/rules 
  → Refresh lista
```

### Editar Regla
```
Click Edit → Load data en RuleForm 
  → User modifica 
  → usePricingRules.updateRule() 
  → PUT /api/rules/:id 
  → Refresh lista
```

### Eliminar Regla
```
Click Delete → Confirmación 
  → usePricingRules.deleteRule() 
  → DELETE /api/rules/:id 
  → Refresh lista
```

## Desarrollo

### Iniciar Dev Server
```bash
npm run dev
```

### Build para Producción
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

## Configuración

### vite.config.ts
- Puerto: 3001
- Proxy: `/api` → `http://localhost:3000`
- Output: `../dist/frontend`

### tsconfig.json
- Target: ES2020
- JSX: react-jsx
- Strict mode habilitado
- Path alias: `@/*` → `./src/*`

## Estilo y UX

### Polaris Design System
Todos los componentes usan Polaris para consistencia con Shopify Admin.

### Banners Informativos
- **Info**: Instrucciones y ayuda
- **Warning**: Validaciones no críticas
- **Critical**: Errores que impiden guardar

### Estados Vacíos
Todos los listados vacíos muestran EmptyState con:
- Imagen ilustrativa
- Mensaje descriptivo
- Acción primaria

### Loading States
- Spinner durante fetch inicial
- Estados de loading en botones
- Feedback visual en todas las acciones

## Validación

### Client-Side
- Campos requeridos
- Formato de IDs (GID de Shopify)
- Rangos numéricos (priority 0-100)
- Al menos un tier configurado

### Server-Side
Backend valida nuevamente todos los datos antes de guardar.

## Accesibilidad

- Labels en todos los inputs
- Help text descriptivo
- Indicadores de campos requeridos
- Estados de error claramente visibles
- Navegación por teclado

## Performance

### Optimizaciones
- React.StrictMode para detectar problemas
- Lazy loading de componentes (futuro)
- Memoization donde aplica
- Debounce en inputs (si es necesario)

### Bundle Size
- Polaris tree-shaking automático
- Vite optimiza imports
- Build minificado en producción

## Troubleshooting

### "Cannot find module"
```bash
npm install
```

### Proxy no funciona
Verifica que el backend esté corriendo en puerto 3000.

### Tipos no coinciden
Asegúrate que `web/frontend/src/types/index.ts` esté sincronizado con `web/types/pricing.ts`.

## Testing (Futuro)

### Recomendaciones
- Jest para unit tests
- React Testing Library para componentes
- Cypress/Playwright para E2E

### Áreas a testear
- Validación de formularios
- CRUD operations
- Estados de error
- Estados vacíos
- Navegación

