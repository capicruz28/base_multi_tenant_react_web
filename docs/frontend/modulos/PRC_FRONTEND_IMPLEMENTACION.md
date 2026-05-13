# PRC — Implementación Frontend (Fase 4: verificación final)

Fecha: 2026-05-09  
Módulo: Gestión de Precios y Promociones (`PRC`)  
Contrato: `docs/api/PRC_API.json`  
Auditoría previa: `docs/frontend/auditoria/AUDITORIA_FRONTEND_PRC.md`

---

## 1) Archivos creados o modificados (alcance PRC)

### Creados
- `src/features/prc/utils/prc-numeric.ts` — helpers `prcToNumber` / `prcFormatMoney` para valores numéricos del API.
- `src/features/prc/hooks/listas-precio.hooks.ts`
- `src/features/prc/hooks/lista-precio-detalles.hooks.ts`
- `src/features/prc/hooks/promociones.hooks.ts`
- `docs/frontend/auditoria/AUDITORIA_FRONTEND_PRC.md` (Fase 2)
- `docs/frontend/modulos/PRC_FRONTEND_IMPLEMENTACION.md` (este documento)

### Modificados (implementación Fase 3)
- `src/features/prc/types/prc.types.ts`
- `src/features/prc/services/prc.service.ts`
- `src/features/prc/pages/ListasPrecioPage.tsx`
- `src/features/prc/pages/ListaPrecioDetallePage.tsx`
- `src/features/prc/pages/PromocionesPage.tsx`

### Sin cambios estructurales (confirmación)
- `src/features/prc/components/PrcPageLayout.tsx` — **no eliminado** ni sustituido.
- `src/features/prc/routes.tsx` — **no eliminado**; mismas rutas lazy (`listas-precio`, `listas-precio/:id/detalles`, `promociones`).

### Consumidores externos del tipo `ListaPrecio`
- `src/features/pos/pages/PuntosVentaPage.tsx` importa `ListaPrecio` para selects; el tipo pasó a `moneda_id` (UUID). No se eliminó lógica POS; solo conviene validar en UI POS que el listado siga mostrando código/nombre de lista.

---

## 2) Reglas de calidad verificadas

| Regla | Estado |
|--------|--------|
| Sin `any` en `src/features/prc/**` | Cumple (`rg` sin coincidencias) |
| Componentes existentes del módulo no eliminados | Cumple (`PrcPageLayout`, rutas y páginas presentes) |
| Contrato API como fuente de verdad | Tipos y rutas alineados con `docs/api/PRC_API.json` |
| React Query + `useTenantQuery` en lecturas | Cumple en hooks de listas, detalles y promociones |
| RBAC en acciones mutantes | `usePermissions().can('prc', …)` en crear/editar/eliminar; reactivar bajo `editar` |

---

## 3) Cobertura por endpoint (types / service / hook / UI)

**Total operaciones PRC**: 16 (8 paths bajo `/api/v1/prc/`).

Convención:
- **Types**: `src/features/prc/types/prc.types.ts`
- **Service**: `src/features/prc/services/prc.service.ts`
- **Hooks**: `src/features/prc/hooks/*.hooks.ts`
- **UI**: `src/features/prc/pages/*Page.tsx`

Leyenda UI: **Sí** = pantalla invoca el hook o el flujo equivalente; **Disponible** = hook y service listos, sin pantalla dedicada aún.

### Listas de precio (`/listas-precio`)

| Método | Ruta | Types | Service | Hook | UI |
|--------|------|--------|---------|------|-----|
| GET | `/listas-precio` | `ListaPrecio`, `ListaPrecioListParams` | `listaPrecioService.list` | `useListasPrecio` | `ListasPrecioPage` |
| POST | `/listas-precio` | `ListaPrecioCreate`, `ListaPrecio` | `listaPrecioService.create` | `useCreateListaPrecio` | `ListasPrecioPage` |
| GET | `/listas-precio/{id}` | `ListaPrecio` | `listaPrecioService.getById` | `useListaPrecio` | `ListaPrecioDetallePage` |
| PUT | `/listas-precio/{id}` | `ListaPrecioUpdate`, `ListaPrecio` | `listaPrecioService.update` | `useUpdateListaPrecio` | `ListasPrecioPage` |
| DELETE | `/listas-precio/{id}` | — | `listaPrecioService.delete` | `useDeleteListaPrecio` | `ListasPrecioPage` |
| POST | `/listas-precio/{id}/reactivar` | `ListaPrecio` | `listaPrecioService.reactivar` | `useReactivarListaPrecio` | `ListasPrecioPage` |

### Detalles de lista (`/listas-precio/.../detalles`)

| Método | Ruta | Types | Service | Hook | UI |
|--------|------|--------|---------|------|-----|
| GET | `/{lista_precio_id}/detalles` | `ListaPrecioDetalle[]` | `listaPrecioDetalleService.list` | `useListaPrecioDetalles` | `ListaPrecioDetallePage` |
| POST | `/{lista_precio_id}/detalles` | `ListaPrecioDetalleCreate`, `ListaPrecioDetalle` | `listaPrecioDetalleService.create` | `useCreateListaPrecioDetalle` | `ListaPrecioDetallePage` |
| GET | `/detalles/{lista_precio_detalle_id}` | `ListaPrecioDetalle` | `listaPrecioDetalleService.getById` | `useListaPrecioDetalle` | **Disponible** (p. ej. vista detalle línea o deep-link futuro) |
| PUT | `/detalles/{lista_precio_detalle_id}` | `ListaPrecioDetalleUpdate`, `ListaPrecioDetalle` | `listaPrecioDetalleService.update` | `useUpdateListaPrecioDetalle` | `ListaPrecioDetallePage` |

**Nota**: el OpenAPI permite `empresa_id` en query en listados/detalle de línea; `listaPrecioDetalleService` aún no expone ese query en `list`/`getById`/`update` (solo cabeceras lista/promoción se extendieron en servicio). Si el backend lo exige en multi-empresa, ampliar params en service y hooks.

### Promociones (`/promociones`)

| Método | Ruta | Types | Service | Hook | UI |
|--------|------|--------|---------|------|-----|
| GET | `/promociones` | `Promocion`, `PromocionListParams` | `promocionService.list` | `usePromociones` | `PromocionesPage` |
| POST | `/promociones` | `PromocionCreate`, `Promocion` | `promocionService.create` | `useCreatePromocion` | `PromocionesPage` |
| GET | `/promociones/{id}` | `Promocion` | `promocionService.getById` | `usePromocion` | **Disponible** (la edición usa fila de la lista; se puede enlazar `usePromocion` para refrescar por id) |
| PUT | `/promociones/{id}` | `PromocionUpdate`, `Promocion` | `promocionService.update` | `useUpdatePromocion` | `PromocionesPage` |
| DELETE | `/promociones/{id}` | — | `promocionService.delete` | `useDeletePromocion` | `PromocionesPage` |
| POST | `/promociones/{id}/reactivar` | `Promocion` | `promocionService.reactivar` | `useReactivarPromocion` | `PromocionesPage` |

---

## 4) Resumen de hooks exportados

**`listas-precio.hooks.ts`**
- `listaPrecioQueryKeys`
- `useListasPrecio`, `useListaPrecio`
- `useCreateListaPrecio`, `useUpdateListaPrecio`, `useDeleteListaPrecio`, `useReactivarListaPrecio`

**`lista-precio-detalles.hooks.ts`**
- `listaPrecioDetalleQueryKeys`
- `useListaPrecioDetalles`, `useListaPrecioDetalle`
- `useCreateListaPrecioDetalle`, `useUpdateListaPrecioDetalle`

**`promociones.hooks.ts`**
- `promocionQueryKeys`
- `usePromociones`, `usePromocion`
- `useCreatePromocion`, `useUpdatePromocion`, `useDeletePromocion`, `useReactivarPromocion`

---

## 5) UX y permisos

- Listas y promociones: filtros `solo_vigentes`, `solo_activas` (mapea a `solo_activos` / `solo_vigentes` del API), búsqueda y filtros de negocio.
- Promociones: filtros adicionales `aplica_a`, `producto_id`, `categoria_id` (selects dependen de empresa seleccionada en filtro).
- Desactivar / reactivar con `window.confirm`.
- RBAC módulo `prc`: `crear`, `editar`, `eliminar`; reactivar usa permiso `editar`. La ruta sigue protegida con `PermissionGuard module="prc" action="ver"` en `src/app/router.tsx`.

---

## 6) Confirmaciones Fase 4 (checklist maestro)

1. **Archivos** — listados en sección 1.
2. **Cada endpoint** — tiene interfaz en `prc.types.ts` y función en `prc.service.ts`; mutaciones/listas tienen hook; **2 lecturas** (`GET` detalle línea, `GET` promoción por id) tienen hook **sin** pantalla exclusiva aún (marcado arriba).
3. **Componentes no eliminados** — `PrcPageLayout`, rutas y tres páginas intactas como entradas del módulo.
4. **Sin `any`** en archivos bajo `src/features/prc/`.
5. **Este documento** — `docs/frontend/modulos/PRC_FRONTEND_IMPLEMENTACION.md` generado.

---

## 7) Mejoras opcionales posteriores

- Enlazar `usePromocion(id)` al abrir el diálogo de edición para datos frescos por id.
- Enlazar `useListaPrecioDetalle(detalleId)` en una ruta o panel de detalle de línea.
- Extender `listaPrecioDetalleService` con `empresa_id` en query donde el OpenAPI lo define.
- Sustituir `window.confirm` por componente de confirmación del design system si existe patrón global.
- Evaluar `useApi()` / instancia híbrida en `prc.service.ts` para paridad con otros módulos on-premise.
