# AUDITORÍA FRONTEND — Módulo PRC (Gestión de Precios y Promociones)

Fuente de verdad: `docs/api/PRC_API.json` (paths bajo `/api/v1/prc/...`).

## Resumen ejecutivo

- **Contrato PRC**: **16** operaciones HTTP (8 paths bajo `/api/v1/prc/...`).
- **Implementación detectada**: `src/features/prc/` con rutas lazy, tres páginas, un layout, **`prc.service.ts`** y **`prc.types.ts`**.
- **React Query hooks dedicados**: **no** — las páginas invocan servicios desde `useEffect`/`useCallback` con estado local (loading/error/lista), no `useTenantQuery` / `useMutation` como en `src/features/inv/hooks/*.hooks.ts`.
- **RBAC**:
  - Ruta protegida: `PermissionGuard module="prc" action="ver"` en `src/app/router.tsx`.
  - **Acciones dentro de páginas** (crear, editar, desactivar, reactivar): **sin** `usePermissions().can(...)` en botones o diálogos.

---

## Inventario de implementación actual

### Archivos del módulo PRC

| Área | Ruta |
|------|------|
| Rutas | `src/features/prc/routes.tsx` |
| Páginas | `src/features/prc/pages/ListasPrecioPage.tsx`, `ListaPrecioDetallePage.tsx`, `PromocionesPage.tsx` |
| Layout | `src/features/prc/components/PrcPageLayout.tsx` |
| Servicio Axios | `src/features/prc/services/prc.service.ts` |
| Tipos TS | `src/features/prc/types/prc.types.ts` |
| Hooks React Query (`hooks/`) | **No existe** |
| Stores Zustand | **No** |

### Dependencias fuera de PRC (referencia)

- **ORG**: `empresaService` para filtros / selects de empresa.
- **INV**: `productoService`, `unidadMedidaService`, `categoriaService` para catálogos en detalle de lista y promociones.

### Observación técnica (multi-tenant / API híbrida)

- El service usa `import api from '@/core/api/api'` (instancia central), **no** `useApi()` / `getApiInstance()` para servidor local cuando aplique instalación híbrida — mismo tipo de observación que en auditorías de otros módulos.

---

## Evaluación por endpoint (contrato vs implementación)

Leyenda:

- **✔ Completo**: service + consumo en UI alineado con el contrato (tipos uso razonable).
- **⚠ Parcial**: implementación incompleta (hooks faltantes, `empresa_id` opcional omitido siempre en query, payloads parciales, UI incompleta, o uso de tipo/campo desalineado con OpenAPI pero algo funciona).
- **✖ Faltante**: no hay método en service o no hay uso en UI.

| Endpoint | Método | Service | Hook | Componente | Estado |
|----------|:------:|---------|------|------------|--------|
| `/api/v1/prc/listas-precio` | GET | `listaPrecioService.list` | ✖ | `ListasPrecioPage` | ⚠ |
| `/api/v1/prc/listas-precio` | POST | `listaPrecioService.create` | ✖ | `ListasPrecioPage` | ⚠ |
| `/api/v1/prc/listas-precio/{lista_precio_id}/reactivar` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/prc/listas-precio/{lista_precio_id}` | DELETE | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/prc/listas-precio/{lista_precio_id}` | GET | `listaPrecioService.getById` | ✖ | `ListaPrecioDetallePage` (cabecera) | ⚠ |
| `/api/v1/prc/listas-precio/{lista_precio_id}` | PUT | `listaPrecioService.update` | ✖ | `ListasPrecioPage` | ⚠ |
| `/api/v1/prc/listas-precio/{lista_precio_id}/detalles` | GET | `listaPrecioDetalleService.list` | ✖ | `ListaPrecioDetallePage` | ⚠ |
| `/api/v1/prc/listas-precio/{lista_precio_id}/detalles` | POST | `listaPrecioDetalleService.create` | ✖ | `ListaPrecioDetallePage` | ⚠ |
| `/api/v1/prc/listas-precio/detalles/{lista_precio_detalle_id}` | GET | `listaPrecioDetalleService.getById` | ✖ | ✖ | ✖ |
| `/api/v1/prc/listas-precio/detalles/{lista_precio_detalle_id}` | PUT | `listaPrecioDetalleService.update` | ✖ | `ListaPrecioDetallePage` | ⚠ |
| `/api/v1/prc/promociones` | GET | `promocionService.list` | ✖ | `PromocionesPage` | ⚠ |
| `/api/v1/prc/promociones` | POST | `promocionService.create` | ✖ | `PromocionesPage` | ⚠ |
| `/api/v1/prc/promociones/{promocion_id}/reactivar` | POST | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/prc/promociones/{promocion_id}` | DELETE | ✖ | ✖ | ✖ | ✖ |
| `/api/v1/prc/promociones/{promocion_id}` | GET | `promocionService.getById` | ✖ | ✖ | ✖ |
| `/api/v1/prc/promociones/{promocion_id}` | PUT | `promocionService.update` | ✖ | `PromocionesPage` | ⚠ |

---

## Brechas por endpoint / área

### Sin capa React Query (`hooks/`)

- Ningún endpoint cuenta con hooks `useQuery`/`useMutation` con `tenantId` en keys (patrón `useTenantQuery` del proyecto).
- Impacto: sin caché unificada, sin invalidación declarativa tras mutaciones, peor UX frente al estándar del prompt maestro.

### Rutas definidas pero acciones omitidas en UI

1. **`POST …/reactivar`** (lista y promoción): no existe en `prc.service.ts` ni botones/flujo en páginas.
2. **`DELETE …` (lista y promoción)**: borrado lógico (`204`): no existe en service ni UI.
3. **`GET …/promociones/{id}`**: existe método `getById` en service pero ninguna página lo usa (edición trabaja sólo desde filas de la lista cargada por GET colección).

### Parámetro `empresa_id` (query opcional pero descrito como filtro empresa+tenant)

- Los métodos `getById` / `update` de lista, detalle y promoción **no** aceptan ni envían `empresa_id` en query como permite el contrato (útil cuando hay ambigüedad multi-empresa en el mismo tenant).
- Las listas de detalles tampoco envían `empresa_id` en query.

### Filtros de listado incompletos en UI

- **Listas**: el contrato ofrece `solo_vigentes`; la página fija sólo banderas que arma en objeto (p.ej. `solo_activos: true`) y no expone vigentes.
- **Promociones**: el contrato ofrece `aplica_a`, `producto_id`, `categoria_id`, `solo_vigentes`; la UI sólo empresa (opcional), tipo, texto de búsqueda y `solo_activos` implícito en params.

### Request body POST detalle (`ListaPrecioDetalleCreate`)

- OpenAPI exige **`lista_precio_id`** y **`empresa_id`** en el body junto con `producto_id`, `precio_unitario`, `unidad_medida_id`.
- El tipo `ListaPrecioDetalleCreate` en frontend **no incluye** `lista_precio_id` ni `empresa_id`, y `ListaPrecioDetallePage` envía sólo los campos del formulario actual.
- Estado: brecha contractual directa hasta que se confirme que el backend acepte cuerpo parcial por compatibilidad; según archivo OpenAPI oficial, debe corregirse.

### Lista de precio — campo moneda vs contrato

- OpenAPI: **`moneda_id`** (UUID).
- Frontend: modelo y formularios usan **`moneda: string`** con valores `'PEN' | 'USD'` (lista fija).
- Riesgo: **desalineación** fuerte si el backend persiste sólo FK a tabla de monedas.

### Tipificación y convenciones del prompt maestro

- Uso de **`any`** en páginas: p.ej. `params: any`, casts `as any` en selects (violación declarada «NO usar any» para implementación nueva/limpieza).
- Tipos **`tipo_lista`** / **`tipo_promocion`** / **`aplica_a`** como uniones cerradas locales frente a OpenAPI (**string con maxLength**), lo que puede rechazar valores válidos nuevos sin cambiar front.

---

## Campos faltantes o parciales en formularios y vistas

### Listas de precio (`ListasPrecioPage`)

- Tabla: no muestra `es_activo`, `cliente_id`, `usuario_creacion_id`, `fecha_actualizacion` explícitos (solo lectura opcional útil para auditoría).
- Filtros: falta **`solo_vigentes`** visible para el usuario.
- Acciones: no hay «desactivar» / «reactivar» coherentes con `DELETE` y `POST /reactivar`.

### Detalle de lista (`ListaPrecioDetallePage`)

- No consume **`GET /detalles/{id}`** para edición dirigida ni deep-link a un detalle puntual.
- Formulario crear no refleja en tipos/UI los campos obligatorios **`empresa_id`** y **`lista_precio_id`** del contrato.
- Edición omite algunos campos permitidos por `ListaPrecioDetalleUpdate` (p.ej. `producto_id`, fechas vigencia en edición están parciales vs create).

### Promociones (`PromocionesPage`)

- **`PUT` edición**: el diálogo de edición es **mucho más acotado** que `PromocionUpdate` (tipo promoción, aplica_a, descuentos, marcas/reglas/`aplica_canal_venta`/`cantidad_usos_actuales`, etc.).
- **`reglas_aplicacion`**, **`aplica_canal_venta`**, **`cantidad_usos_actuales`** del contrato creación/edición: no están en crear o están incompletos.
- Lista: filtros **`solo_vigentes`**, **`aplica_a`**, **`producto_id`**, **`categoria_id`** ausentes como controles UI.
- No hay insignia/indicadores explícitos de **activo** / **fuera de vigencia** sólo mediante datos ya devueltos.

---

## Componentes desalineados con el contrato actual

Marcar como **⚠ Desalineado** (no eliminar de la auditoría; requieren revisión antes de llamar «conformes»):

| Ubicación | Problema |
|-----------|----------|
| `src/features/prc/types/prc.types.ts` | `ListaPrecio.moneda` vs `ListaPrecioRead.moneda_id` (UUID); `ListaPrecioCreate` igual. |
| `src/features/prc/types/prc.types.ts` + `ListaPrecioDetallePage` | Cuerpo de creación sin `lista_precio_id` / `empresa_id` exigidos por OpenAPI. |
| `ListasPrecioPage.tsx` | Envío de `moneda` código en lugar de `moneda_id` si backend exige FK. |
| `PromocionesPage.tsx` | Unión estricta de enums vs strings abiertos en API; payloads de creación pueden omitir campos opcionales que el backend documenta como JSON/string libre (`reglas_aplicacion`). |
| `prc.service.ts` | Paths correctos bajo prefijo esperado desde la base `/api/v1`, pero métodos incompletos (sin delete/reactivate) y sin parámetro query `empresa_id` en todas las llamadas donde el contrato lo documenta. |

---

## Tipado

- Presencia explícita de **`any`** en componentes del módulo (params y casts).
- Posible **crash en runtime** si `ListaPrecioDetalleRead.precio_unitario` llega como **string** desde API (según OpenAPI schema Read) pero el tipo TS lo marca como **`number`** y se usa `.toFixed(2)`.
- **`descuento_maximo_porcentaje`** y montos pueden ser string en lectura OpenAPI pero number en frontend.

---

## RBAC y contexto empresa / tenant

- **RBAC granular**: rutas sólo garantizan `ver`; crear/editar en diálogos no verifica `crear`/`editar`/`eliminar` según nomenclatura de permisos del backend.
- **empresa**: la UI permite elegir empresa en formularios y filtros usando ORG, lo cual está alineado con `empresa_id` en POST de cabeceras; sin embargo los **queries opcionales** en GET/PUT/DELETE no se envían cuando podrían reforzar el alcance empresa+tenant según documentación OpenAPI.

---

## Problemas de loading / error / empty

- Hay estados locales de loading, mensaje de error en tabla y estado vacío: **cumplimiento parcial** del guideline.
- **Cabecera** en `ListaPrecioDetallePage`: si falla `getById`, el usuario sigue viendo tabla de detalles posiblemente incoherente (“Cargando...” indefinido en título si lista falla después).

---

⛔ **Fase 2 completada.** El siguiente paso según prompt maestro es **Fase 3 — implementación controlada**, aplicando sólo correcciones acordadas a partir de esta auditoría.
