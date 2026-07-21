# CFG Frontend — Auditoría AS-IS (Executive Summary)

**Paquete:** `docs/arquitectura/code-generation/cfg-frontend-audit/`  
**Fecha:** 2026-07-17  
**Alcance:** solo Frontend (lectura / documentación)  
**Contrato oficial de integración:** `docs/frontend-contracts/cfg/` (MVP v1.0, Backend CERTIFICADO)  
**Estado de esta auditoría:** **COMPLETA**  
**Código modificado:** ninguno

---

## 1. Dictamen

**El Frontend está preparado para iniciar el diseño funcional del módulo CFG.**

No existen bloqueos arquitectónicos duros que impidan diseñar el módulo. La plataforma ya dispone de:

- Shell ERP operativo (`/app`) con layout, menú dinámico y guards.
- Stack de listados Tier B/C (`useErpListQuery`, `normalizeListResponse`, `ErpPagination`).
- Patrones de catálogo (ORG/INV) alineados al UX que exige el contrato CFG.
- RBAC de códigos puntuales (`usePermission().hasPermission`) compatible con `cfg.secuencias.*`.
- Service layer Axios tipado a mano por feature (mismo patrón que ORG/INV).

Sí existen **condiciones previas de diseño** (no de reescritura de arquitectura) que deben resolverse en la fase de diseño funcional, no en esta auditoría:

| Condición | Tipo | Impacto |
|-----------|------|---------|
| Snapshot OpenAPI `app/docs/openapi_snapshot.json` ausente en el repo | Gap documental / tipado | Tipar schemas contra contrato + obtener snapshot antes de implementar |
| `CFG` no está en `ERP_MODULES` ni en `ERP_ROUTE_SEGMENTS` | Registro pendiente | Cableado estándar al implementar (no bloquea diseño) |
| Dualidad LBAC menú (`can('cfg','ver')`) vs RBAC negocio (`cfg.secuencias.consultar`) | Decisión de diseño | Definir guard de ruta + controles de acción |
| Ítem de menú “Secuencias de código” depende de `GET /auth/menu` (Backend) | Dependencia de plataforma | Fuera de alcance Frontend para crear; debe existir en menú certificado |

---

## 2. Hallazgos clave (AS-IS)

1. **No existe** `src/features/cfg`. El módulo CFG admin **no está implementado**.
2. Existe infraestructura relacionada pero **distinta**:
   - `src/core/codigo/` + `src/shared/components/codigo/` → **Motor de códigos (FCE)** consumido por formularios ORG/INV.
   - Manifests `src/features/org/codigo/` e `src/features/inv/codigo/` → registro de `sequenceKey` en formularios.
   - `inv-bill` Series → series fiscales; **no** es CFG.
3. CFG pertenece al **shell ERP `/app`**, no a Tenant Admin (`/admin`) ni Super Admin (`/super-admin`).
4. La mejor composición de referencia es: **ORG (UX catálogo A+)** + **INV (stack ErpList)** + **WMS/INV transaccional (permisos punteados)**.
5. El contrato CFG describe un catálogo **sin create**, con edit parcial, soft-delete/reactivar y preview — encaja en Plantilla A / listado Tier B.

---

## 3. Respuestas a las 15 preguntas de auditoría

| # | Pregunta | Respuesta corta |
|---|----------|-----------------|
| 1 | ¿Dónde vive cfg? | `src/features/cfg/` bajo rutas `/app/cfg/*` |
| 2 | ¿Tenant Admin u otro shell? | **Shell ERP operativo** (`AppLayout`), no `/admin` |
| 3 | ¿Qué menú? | Menú dinámico ERP (`GET /auth/menu`), ítem “Secuencias de código” |
| 4 | ¿Patrón de navegación? | Lazy router en `app-route-tree` + `routes.tsx` del feature |
| 5 | ¿Layouts? | `AppLayout` → `NewLayout variant="app"` |
| 6 | ¿Guards? | `ProtectedRoute requireOperationalUser` + `PermissionGuard` + checks `hasPermission` en página |
| 7 | ¿Permisos? | `cfg.secuencias.consultar` / `cfg.secuencias.actualizar` vía `usePermission` |
| 8 | ¿Componentes reutilizables? | Ver `04_COMPONENT_REUSE.md` — stack erp-list + ORG dirty + ConfirmDialog |
| 9 | ¿React Query? | `useTenantQuery` + `useErpListQuery` + mutations con invalidación por prefijo |
| 10 | ¿OpenAPI? | Servicios Axios a mano; sin codegen; snapshot CFG no presente en repo |
| 11 | ¿Carpetas? | types → services → hooks → pages/components → routes (patrón ORG/INV) |
| 12 | ¿Referencias? | ORG (UX), INV (listados), WMS (RBAC dotted); no FCE admin |
| 13 | ¿Riesgos? | Dual RBAC, confusión con FCE, filtro `empresa_id` vs ME-02, OpenAPI ausente |
| 14 | ¿Deuda técnica? | WMS legacy local-state; sin Badge/Preview genéricos; LBAC vs códigos |
| 15 | ¿Antes de código? | Cerrar decisiones de diseño en docs siguientes; no implementar aún |

Detalle en los documentos 01–07 de este paquete.

---

## 4. Índice del paquete

| Documento | Contenido |
|-----------|-----------|
| `00_EXECUTIVE_SUMMARY.md` | Este resumen y dictamen |
| `01_CURRENT_ARCHITECTURE.md` | Arquitectura Frontend AS-IS y encaje de CFG |
| `02_NAVIGATION_ANALYSIS.md` | Shells, menú, rutas, layouts |
| `03_RBAC_ANALYSIS.md` | Sistemas de permisos y mapeo CFG |
| `04_COMPONENT_REUSE.md` | Inventario de componentes reutilizables |
| `05_OPENAPI_INTEGRATION.md` | Consumo API / tipado / gaps OpenAPI |
| `06_REACT_QUERY_ANALYSIS.md` | Queries, mutations, keys, invalidación |
| `07_RISKS_AND_RECOMMENDATIONS.md` | Riesgos, deuda y recomendaciones pre-diseño |

---

## 5. Fuera de alcance (respetado)

- Implementación de páginas, componentes, rutas o menú.
- Cambios a código Frontend o Backend.
- Modificación de contratos OpenAPI o del paquete `docs/frontend-contracts/cfg/`.
- Propuesta detallada de implementación (pantallas wireframe, tickets de código).

---

## 6. Conclusión operativa

| Pregunta de cierre | Respuesta |
|--------------------|-----------|
| ¿Listo para **diseño funcional**? | **SÍ** |
| ¿Listo para **implementación inmediata**? | **NO** — falta fase de diseño (navegación, RBAC de ruta, tipado OpenAPI, UX detalle vs modal) |
| ¿Hay bloqueo arquitectónico previo? | **NO** |
| ¿Hay gaps que el diseño debe cerrar? | **SÍ** (OpenAPI snapshot, registro ERP_MODULES, estrategia dual RBAC, filtro empresa) |

**Siguiente paso recomendado (fuera de este paquete):** documento de diseño funcional Frontend CFG, tomando este AS-IS y el contrato `docs/frontend-contracts/cfg/` como únicas entradas.
