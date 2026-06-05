# AUDITORÍA FRONTEND — Módulo ORG (Organización)

**Fecha:** 2026-05-12
**Contrato fuente:** `docs/api/ORG_API.json`
**Implementación revisada:** `src/features/org/*`
**Auditor:** PROMPT_FRONTEND_MAESTRO v2

---

## DIAGNÓSTICO GENERAL

🟡 **AJUSTES**

La infraestructura de datos del módulo ORG (types, services, hooks React Query) está **completamente implementada y alineada** con el contrato API: 36 endpoints activos cubiertos, 6 entidades con CRUD + reactivar, `empresa_id` como query param donde corresponde, `buscar` soportado, tipado TypeScript sin `any`. Sin embargo, **las 6 páginas** presentan brechas sistemáticas de UX/UI: ausencia de badge de estado semántico, toolbar no compacta, carga de dependencias auxiliares sin pasar por los hooks React Query, y un bug de tipo en `CargosPage` (`moneda_salarial` requerido se inicializa como `undefined`). Adicionalmente `OrgPageLayout` incluye un `<h1>` + subtítulo que el Prompt Maestro prohíbe expresamente. Ningún problema es de datos o conectividad — todos son de presentación y arquitectura de componentes.

---

## ENDPOINTS DEPRECATED CONSUMIDOS ACTUALMENTE

Ninguno detectado. El contrato ORG no tiene endpoints deprecated y todos los 36 endpoints activos son consumidos correctamente.

---

## UUIDs EXPUESTOS EN UI

Ninguno detectado. Los campos `*_id` se usan únicamente como `key` de React y como parámetros internos de mutaciones. Ninguno aparece en columnas visibles de tablas ni en campos de solo lectura.

**Único caso de atención:** `moneda_salarial` en `CargoRead` devuelve un **UUID** (FK a `cat_moneda`). La tabla de `CargosPage` no muestra esta columna actualmente, lo cual evita exponer el UUID. Sin embargo, el formulario de Cargo actualmente lee el UUID crudo del response (`row.moneda_salarial`) y lo asigna al `<select>` que carga monedas por catálogo — esto es correcto siempre que el Select muestre el nombre de la moneda y envíe el UUID. Ver sección "Campos faltantes".

---

## FLUJOS CABECERA+DETALLE MAL IMPLEMENTADOS

Ninguno detectado. El módulo ORG es de maestros simples. No existen entidades con detalle embebido.

---

## AUDITORÍA POR ENDPOINT

| Endpoint | Método | Service ✅/❌ | Hook ✅/❌ | Componente ✅/❌ | UUIDs en UI ✅/❌ | Loading/Error ✅/❌ | RBAC ✅/❌ |
|---|---|---|---|---|---|---|---|
| `GET /api/v1/org/empresa` | GET | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/org/empresa` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/v1/org/empresa/{id}` | GET | ✅ | ✅ | ⚠ (service/hook exist; UI no usa detalle) | ✅ | ✅ | N/A |
| `PUT /api/v1/org/empresa/{id}` | PUT | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `DELETE /api/v1/org/empresa/{id}` | DELETE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/org/empresa/{id}/reactivar` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/v1/org/sucursales` | GET | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/org/sucursales` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/v1/org/sucursales/{id}` | GET | ✅ | ✅ | ⚠ (no usado en UI) | ✅ | ✅ | N/A |
| `PUT /api/v1/org/sucursales/{id}` | PUT | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `DELETE /api/v1/org/sucursales/{id}` | DELETE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/org/sucursales/{id}/reactivar` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/v1/org/centros-costo` | GET | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/org/centros-costo` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/v1/org/centros-costo/{id}` | GET | ✅ | ✅ | ⚠ (no usado en UI) | ✅ | ✅ | N/A |
| `PUT /api/v1/org/centros-costo/{id}` | PUT | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `DELETE /api/v1/org/centros-costo/{id}` | DELETE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/org/centros-costo/{id}/reactivar` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/v1/org/departamentos` | GET | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/org/departamentos` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/v1/org/departamentos/{id}` | GET | ✅ | ✅ | ⚠ (no usado en UI) | ✅ | ✅ | N/A |
| `PUT /api/v1/org/departamentos/{id}` | PUT | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `DELETE /api/v1/org/departamentos/{id}` | DELETE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/org/departamentos/{id}/reactivar` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/v1/org/cargos` | GET | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/org/cargos` | POST | ✅ | ✅ | ⚠ (bug: `moneda_salarial` puede ser vacío) | ✅ | ✅ | ✅ |
| `GET /api/v1/org/cargos/{id}` | GET | ✅ | ✅ | ⚠ (no usado en UI) | ✅ | ✅ | N/A |
| `PUT /api/v1/org/cargos/{id}` | PUT | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `DELETE /api/v1/org/cargos/{id}` | DELETE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/org/cargos/{id}/reactivar` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/v1/org/parametros` | GET | ✅ | ✅ | ⚠ (falta filtro empresa_id en toolbar) | ✅ | ✅ | ✅ |
| `POST /api/v1/org/parametros` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/v1/org/parametros/{id}` | GET | ✅ | ✅ | ⚠ (no usado en UI) | ✅ | ✅ | N/A |
| `PUT /api/v1/org/parametros/{id}` | PUT | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `DELETE /api/v1/org/parametros/{id}` | DELETE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/org/parametros/{id}/reactivar` | POST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## AUDITORÍA DE VISTAS UX/UI

| Vista | Existe | Búsqueda | Filtro empresa | Ver inactivos | Empty state | Toast | Modal confirm. | Badge estado | Toolbar compacta |
|---|---|---|---|---|---|---|---|---|---|
| EmpresaPage | ✅ | ✅ | N/A | ✅ | ⚠ (sin botón acción) | ✅ | ✅ | ❌ (texto plano) | ❌ (vertical) |
| SucursalesPage | ✅ | ✅ | ✅ | ✅ | ⚠ (sin botón acción) | ✅ | ✅ | ❌ (ausente) | ❌ (vertical) |
| CentrosCostoPage | ✅ | ✅ | ✅ | ✅ | ⚠ (sin botón acción) | ✅ | ✅ | ❌ (ausente) | ❌ (vertical) |
| DepartamentosPage | ✅ | ✅ | ✅ | ✅ | ⚠ (sin botón acción) | ✅ | ✅ | ❌ (ausente) | ❌ (vertical) |
| CargosPage | ✅ | ✅ | ✅ | ✅ | ⚠ (sin botón acción) | ✅ | ✅ | ❌ (ausente) | ❌ (vertical) |
| ParametrosPage | ✅ | ✅ | ❌ (falta empresa_id) | ✅ | ⚠ (sin botón acción) | ✅ | ✅ | ❌ (ausente) | ❌ (vertical) |

---

## CAMPOS FALTANTES EN UI

### EmpresaPage — tabla

| Campo del response | Prioridad | Situación actual | Corrección |
|---|---|---|---|
| `es_activo` | 🔴 CRÍTICO | Texto "Activa/Inactiva" sin color | Badge verde/rojo semántico |
| `nombre_comercial` | ⚠ IMPORTANTE | No visible en tabla | Agregar como columna o en tooltip del nombre |
| `tipo_empresa` | ➕ MENOR | No visible en tabla | Opcional — columna corta |

### SucursalesPage — tabla

| Campo del response | Prioridad | Situación actual | Corrección |
|---|---|---|---|
| `es_activo` | 🔴 CRÍTICO | Ausente en tabla (solo se muestra reactivar si inactivo) | Badge verde/rojo en columna Estado |
| `es_casa_matriz` | ⚠ IMPORTANTE | Columna "Principal" muestra "Sí/No" sin estilo | Badge o icono semántico |
| `direccion` | ➕ MENOR | No visible en tabla | Tooltip o columna angosta |

### CentrosCostoPage — tabla

| Campo del response | Prioridad | Situación actual | Corrección |
|---|---|---|---|
| `es_activo` | 🔴 CRÍTICO | Ausente en tabla | Badge verde/rojo en columna Estado |
| `responsable_nombre` | ⚠ IMPORTANTE | No visible en tabla | Columna compacta |
| `tiene_presupuesto` | ➕ MENOR | No visible | Icono/check en tabla |

### DepartamentosPage — tabla

| Campo del response | Prioridad | Situación actual | Corrección |
|---|---|---|---|
| `es_activo` | 🔴 CRÍTICO | Ausente en tabla | Badge verde/rojo en columna Estado |
| `jefe_nombre` | ⚠ IMPORTANTE | No visible en tabla | Columna compacta |
| `tipo_departamento` | ⚠ IMPORTANTE | No visible en tabla | Columna corta |

### CargosPage — tabla y formulario

| Campo del response | Prioridad | Situación actual | Corrección |
|---|---|---|---|
| `es_activo` | 🔴 CRÍTICO | Ausente en tabla | Badge verde/rojo en columna Estado |
| `moneda_salarial` | 🔴 CRÍTICO | UUID crudo en formulario (`DEFAULT: undefined` → posible 422 al crear) | Select cargado desde `catalogosService.listMonedas`, DEFAULT = primer `moneda_id` activo; muestra código+nombre, envía UUID |
| `nivel_jerarquico` | ⚠ IMPORTANTE | No visible en tabla | Columna numérica angosta |
| `area_funcional` | ➕ MENOR | No visible en tabla | — |

### ParametrosPage — tabla

| Campo del response | Prioridad | Situación actual | Corrección |
|---|---|---|---|
| `es_activo` | 🔴 CRÍTICO | Ausente en tabla | Badge verde/rojo en columna Estado |
| `tipo_dato` | ⚠ IMPORTANTE | No visible en tabla | Badge de tipo (texto, numérico, json…) |
| `modulo_codigo` | ⚠ IMPORTANTE | Solo filtra ORG; no muestra módulo al ver todos | Columna "Módulo" cuando filtro está vacío |
| `empresa_id` | ⚠ IMPORTANTE | Filtro por empresa no implementado en toolbar | Select empresa en toolbar (igual que otras páginas) |

---

## ARCHIVOS A REESCRIBIR

Ningún archivo requiere reescritura total. Todos los problemas son correcciones incrementales.

---

## ARCHIVOS A MODIFICAR

| Archivo | Tipo de cambio | Motivo |
|---|---|---|
| `components/OrgPageLayout.tsx` | Modificar | Eliminar `<h1>` y `<p>` descriptivo. Convertir en wrapper limpio que solo aplica padding/max-width. El breadcrumb global ya identifica la página. |
| `pages/EmpresaPage.tsx` | Modificar | (1) Badge semántico en columna Estado. (2) Toolbar horizontal compacta (filtros izq + botón der). (3) Empty state con botón de acción inline. |
| `pages/SucursalesPage.tsx` | Modificar | (1) Badge semántico Estado. (2) Toolbar compacta. (3) Empty state con acción. (4) Reemplazar `useEffect+centroCostoService.list()` por hook `useCentrosCosto`. (5) Reemplazar carga geográficos con hook o mantener `useEffect` pero documentar como deuda técnica. |
| `pages/CentrosCostoPage.tsx` | Modificar | (1) Badge semántico Estado. (2) Toolbar compacta. (3) Empty state con acción. (4) Agregar columna `responsable_nombre`. |
| `pages/DepartamentosPage.tsx` | Modificar | (1) Badge semántico Estado. (2) Toolbar compacta. (3) Empty state con acción. (4) Reemplazar `useEffect+sucursalService/centroCostoService.list()` por hooks RQ. (5) Agregar columnas `tipo_departamento` y `jefe_nombre`. |
| `pages/CargosPage.tsx` | Modificar | (1) Badge semántico Estado. (2) Toolbar compacta. (3) Empty state con acción. (4) Corregir `moneda_salarial`: Select cargado de catálogo, DEFAULT = primer `moneda_id` activo. (5) Reemplazar `useEffect+departamentoService.list()` por hook `useDepartamentos`. (6) Agregar columna `nivel_jerarquico`. |
| `pages/ParametrosPage.tsx` | Modificar | (1) Badge semántico Estado. (2) Toolbar compacta. (3) Agregar filtro `empresa_id`. (4) Agregar columnas `tipo_dato` (badge) y `modulo_codigo`. (5) Empty state con acción. |
| `types/org.types.ts` | Modificar | Corregir `CargoRead.rango_salarial_min/max` para aceptar `string | number | null` (el OpenAPI los devuelve como `string | null` en el Read, aunque Create acepta `number | string | null`). |

---

## ARCHIVOS NUEVOS A CREAR

Ninguno. Todos los archivos necesarios (types, service, hooks, páginas, layout, routes) ya existen. Solo se requieren modificaciones.

---

## RESUMEN DE PRIORIDADES

| Prioridad | Elemento | Impacto |
|---|---|---|
| 🔴 1 | Bug `moneda_salarial` en `CargosPage` | El create envía UUID vacío → 422 del backend |
| 🔴 2 | Badge de estado en todas las tablas | Visibilidad de inactivos inexistente |
| 🔴 3 | Toolbar compacta en todas las páginas | Desperdicio de espacio, UX inconsistente |
| 🔴 4 | Eliminar H1+subtítulo de `OrgPageLayout` | Viola regla de layout del Prompt Maestro |
| ⚠ 5 | Filtro empresa_id en ParametrosPage | Funcionalidad del contrato no expuesta |
| ⚠ 6 | Carga auxiliares con hooks RQ | Inconsistencia arquitectural (useEffect+service directo) |
| ⚠ 7 | Empty state con acción en 5 páginas | UX — el usuario no sabe qué hacer cuando no hay datos |
| ➕ 8 | Campos adicionales en tablas | Enriquecimiento informativo |
