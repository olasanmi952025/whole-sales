# Changelog

## [1.0.1] - 2025-11-29

### Changed
- **Pricing Configuration**: Los precios ahora son 100% configurables
  - Eliminado tier por defecto en el formulario de reglas
  - Usuario debe agregar tiers manualmente haciendo click en "Add First Tier"
  - Validación mejorada: requiere al menos un tier antes de guardar
  - Mensajes informativos cuando no hay tiers configurados

### Improved
- **UX del Formulario**:
  - Banner informativo en creación de reglas
  - Mensaje visual cuando no hay tiers configurados
  - Botón "Add First Tier" vs "Add Another Tier" según contexto
  - Validación en tiempo real con banners de advertencia
  - Inputs con min/max values y step para decimales

### Technical
- Estado inicial de `tiers` cambiado de array con un elemento a array vacío
- Lógica de `addTier` ahora sugiere próxima cantidad basada en último tier
- Todos los campos de precio con validación min="0" step="0.01"
- Campos de cantidad con validación min="1"

## [1.0.0] - 2025-11-29

### Added
- Implementación inicial completa de Shopify Wholesale Pricing App
- Backend con Node.js + Koa + TypeScript
- Frontend con React + Polaris
- Database SQLite con 3 tablas
- API REST con 8 endpoints
- Shopify Function (Cart Transform)
- Script para storefront
- Documentación completa (README, ARCHITECTURE, DEPLOYMENT, QUICKSTART)
- Scripts de automatización (setup, test, seed)

