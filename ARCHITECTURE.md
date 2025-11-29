# Arquitectura Técnica

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        Shopify Admin                         │
│                    (Embedded App Frame)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (React + Polaris)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  RulesPage   │  │   LogsPage   │  │  Components  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           │                │                 │               │
│           └────────────────┴─────────────────┘               │
│                           │                                  │
│                    ┌──────▼──────┐                          │
│                    │   useApi    │                          │
│                    └──────┬──────┘                          │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTP/JSON
┌────────────────────────────▼────────────────────────────────┐
│              Backend (Node.js + Koa + TypeScript)           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   API Routes                          │  │
│  │  /api/rules  /api/logs  /api/rules/calculate         │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │                Controllers                            │  │
│  │  PricingRulesController  RuleLogsController          │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │                  Services                             │  │
│  │  PricingCalculatorService  ScriptTagService          │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │                Repositories                           │  │
│  │  PricingRulesRepository  RuleLogsRepository          │  │
│  └──────────────────┬───────────────────────────────────┘  │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   SQLite Database      │
         │  - pricing_rules       │
         │  - pricing_tiers       │
         │  - rule_logs           │
         └────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Shopify Storefront                        │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              storefront-script.js                      │  │
│  │  - Fetch pricing rules                                 │  │
│  │  - Display tier table                                  │  │
│  │  - Update price dynamically                            │  │
│  │  - Inject line item properties                         │  │
│  └───────────────────┬───────────────────────────────────┘  │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
          ┌──────────────────────────┐
          │    Shopping Cart         │
          │  (with properties)       │
          └──────────┬───────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Shopify Function (Cart Transform)                 │
│                                                              │
│  1. Read line item attributes (_wholesale_tier)             │
│  2. Parse tier data (price, min_quantity, rule_name)        │
│  3. Calculate percentage discount                           │
│  4. Return cart transformation operations                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────────┐
          │    Checkout/Order        │
          │  (adjusted prices)       │
          └──────────────────────────┘
```

## Flujo de Datos

### 1. Crear Regla de Precios

```
Admin → Frontend Form → POST /api/rules → Controller → Repository → SQLite
```

### 2. Cliente ve Producto

```
Storefront → Script Load → GET /api/rules/calculate → Repository → SQLite
→ Script → Display Tier Table
```

### 3. Cliente Cambia Cantidad

```
Quantity Input Change → Script → Calculate Tier → Update Price Display
```

### 4. Agregar al Carrito

```
Add to Cart → Script Intercept → Inject Properties → Shopify Cart API
```

### 5. Checkout

```
Cart → Shopify Function → Read Properties → Calculate Discount
→ Transform Operations → Adjusted Cart → Checkout UI
```

### 6. Orden Creada (Opcional Webhook)

```
Order Created → Webhook → POST /api/logs → Repository → SQLite
```

## Patrones de Diseño

### Backend

#### Repository Pattern
Separa la lógica de acceso a datos del resto de la aplicación.

```
Controller → Repository (Interface) → Database
```

Beneficios:
- Testeable (mock repositories)
- Cambio de DB transparente
- Queries centralizadas

#### Service Layer
Lógica de negocio separada de controllers.

```
Controller → Service → Repository
```

Ejemplo: `PricingCalculatorService` contiene toda la lógica de cálculo de precios.

#### Dependency Injection (Simple)
Controllers reciben dependencies en constructor.

```typescript
class PricingRulesController {
  constructor(private repository: PricingRulesRepository) {}
}
```

### Frontend

#### Custom Hooks Pattern
Lógica reutilizable en hooks.

```typescript
useApi() → Generic API handler
usePricingRules() → Rules-specific logic
```

#### Component Composition
Componentes pequeños y reutilizables.

```
RulesPage
  ├── RuleForm
  │   └── TiersInput
  └── RulesList
```

## Principios Aplicados

### SOLID

#### Single Responsibility
- Cada clase/módulo tiene una responsabilidad única
- `PricingCalculatorService` solo calcula precios
- `PricingRulesRepository` solo accede a datos

#### Open/Closed
- Extensible sin modificar código existente
- Nuevos target types se agregan sin cambiar core logic

#### Liskov Substitution
- Repositories son intercambiables
- Services pueden ser mockeados

#### Interface Segregation
- Interfaces específicas por funcionalidad
- No interfaces gordas con métodos innecesarios

#### Dependency Inversion
- Dependencias de abstracciones, no implementaciones
- Controllers dependen de interfaces, no de SQLite directamente

### DRY (Don't Repeat Yourself)
- Tipos TypeScript compartidos entre frontend/backend
- Funciones de cálculo centralizadas
- Validaciones reutilizables

### KISS (Keep It Simple, Stupid)
- SQLite en vez de PostgreSQL (suficiente para el caso de uso)
- REST API simple en vez de GraphQL
- Estructura de carpetas clara y directa

## Decisiones de Arquitectura

### ¿Por qué SQLite?

**Pros:**
- Zero configuration
- File-based (fácil backup)
- Suficientemente rápido para esta app
- Better-sqlite3 es síncrono (más simple)

**Contras:**
- No escala para millones de reglas (pero no es necesario)
- No soporta conexiones concurrentes masivas

**Decisión:** SQLite es suficiente. Si se necesita escalar, migrar a PostgreSQL es directo gracias al Repository Pattern.

### ¿Por qué Koa?

**Pros:**
- Ligero y moderno
- Async/await nativo
- Middleware simple
- Compatible con Shopify CLI 3

**Alternativas consideradas:**
- Express: Más viejo, callbacks
- Fastify: Más complejo para esta app

### ¿Por qué Shopify Functions?

**Pros:**
- Ejecución nativa en Shopify infrastructure
- No requiere servidor externo
- Más rápido que discounts API
- Integración perfecta con checkout

**Alternativas consideradas:**
- Discount API: Más limitado, no cambia precio directamente
- Script Tags en checkout: Deprecado por Shopify

### ¿Por qué Script Tags?

**Pros:**
- Funciona con cualquier tema
- Fácil instalación/desinstalación
- No requiere modificar código del tema

**Alternativas consideradas:**
- Theme Extension: Requiere tema Online Store 2.0
- Manual: No escalable

## Seguridad

### Backend
- Session-based auth con Shopify OAuth
- CSRF protection (Shopify App Bridge)
- Input validation en controllers
- SQL injection prevention (prepared statements)

### Frontend
- App Bridge para comunicación segura
- No almacena API keys en frontend
- CORS configurado para Shopify domains

### Database
- SQLite con file permissions restrictivas
- Foreign keys habilitadas
- Transactions para operaciones críticas

## Performance

### Optimizaciones Implementadas

#### Database
- Índices en campos de búsqueda frecuente
- WAL mode para lecturas concurrentes
- Transactions para inserts múltiples

#### Frontend
- Lazy loading de componentes
- Memoization de cálculos
- Debounce en quantity input

#### Backend
- Response caching (en headers)
- Prepared statements reutilizables
- Connection pooling (implícito en better-sqlite3)

### Métricas Esperadas
- API response time: < 100ms
- Frontend load time: < 2s
- Function execution: < 50ms
- Database queries: < 10ms

## Escalabilidad

### Límites Actuales
- ~10,000 reglas por shop
- ~100,000 logs
- ~50 requests/segundo

### Cómo Escalar

#### Horizontal
- Múltiples instancias del backend
- Load balancer delante
- Redis para sessions compartidas

#### Vertical
- Migrar a PostgreSQL
- Cachear reglas en Redis
- CDN para storefront script

#### Optimizaciones
- Índices adicionales
- Query optimization
- Background jobs para logs cleanup

## Testing

### Estrategia Recomendada

#### Unit Tests
- Repositories: Mock database
- Services: Mock repositories
- Controllers: Mock services

#### Integration Tests
- API endpoints completos
- Database real (in-memory SQLite)

#### E2E Tests
- Playwright/Cypress
- Test en dev store de Shopify

### Herramientas Sugeridas
- Jest para unit/integration
- Supertest para API testing
- Playwright para E2E

## Deployment

### Producción

#### Shopify Hosting
```bash
shopify app deploy
```

#### Custom Hosting
1. Backend: Railway, Heroku, DigitalOcean
2. Database: Persistent volume
3. Frontend: Compilado y servido por backend
4. Functions: Deploy con Shopify CLI

### CI/CD Recomendado
- GitHub Actions para tests
- Auto-deploy en merge a main
- Rollback automático si falla health check

## Monitoreo

### Logs Recomendados
- Request logs (Koa middleware)
- Error logs (Sentry, Rollbar)
- Performance metrics (New Relic)
- Database queries (SQLite EXPLAIN)

### Alertas
- API response time > 500ms
- Error rate > 1%
- Database size > 1GB
- Function timeouts

## Mantenimiento

### Tareas Recurrentes
- Cleanup de logs viejos (> 90 días)
- Backup de database (diario)
- Revisar índices (mensual)
- Actualizar dependencies (semanal)

### Evolución Futura
- Customer-specific pricing
- Time-based rules (seasonal)
- Integración con ERP
- Exportar/importar reglas en CSV
- Multi-currency avanzado

