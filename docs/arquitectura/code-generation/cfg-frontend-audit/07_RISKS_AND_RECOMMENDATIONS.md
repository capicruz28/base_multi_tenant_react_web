# CFG Frontend Audit — Riesgos, deuda y recomendaciones pre-diseño

**Fecha:** 2026-07-17  
**Dictamen:** ver `00_EXECUTIVE_SUMMARY.md`

Este documento **no** propone implementación. Solo riesgos del AS-IS y recomendaciones antes de escribir código.

---

## 1. Riesgos de integración

### R1 — Confundir FCE con Administrador CFG (Alto)

| | |
|--|--|
| **Síntoma** | Extender `src/core/codigo` o pantallas `CodigoField` como “admin de secuencias”. |
| **Impacto** | Mezcla de responsabilidades; UX incorrecta; acoplamiento a manifests ORG/INV. |
| **Mitigación de diseño** | Feature `cfg` separado; FCE permanece consumidor. |

### R2 — Dualidad LBAC vs códigos punteados (Alto)

| | |
|--|--|
| **Síntoma** | Solo `can('cfg','editar')` o solo menú, ignorando `cfg.secuencias.consultar/actualizar`. |
| **Impacto** | Acciones visibles sin permiso real, o bloqueo de ruta aunque el usuario tenga código. |
| **Mitigación de diseño** | Cerrar matriz: puerta de módulo + `hasPermission` en acciones (precedente WMS/INV B). Confirmar con Backend que menú LBAC y `/auth/permissions/me` publican ambos. |

### R3 — Snapshot OpenAPI ausente (Medio)

| | |
|--|--|
| **Síntoma** | `app/docs/openapi_snapshot.json` no está en el repo; `docs/backend_openapi.json` sin CFG. |
| **Impacto** | Tipado incompleto; checklist J del contrato no cerrable. |
| **Mitigación de diseño** | Obtener/publicar snapshot certificado antes de tipar services; mientras tanto diseñar contra `docs/frontend-contracts/cfg/`. |

### R4 — Filtro `empresa_id` vs norma ME-02 (Medio)

| | |
|--|--|
| **Síntoma** | Toolbar con selector “Todas las empresas” o selector libre de empresa en pantalla company-scoped. |
| **Impacto** | Violación V2 ME-02 si se interpreta mal el scope. |
| **Hecho AS-IS** | CFG API permite `empresa_id` opcional en listado; el recurso es tenant-wide con scopes mixtos. |
| **Mitigación de diseño** | Decidir si el filtro empresa es: (a) opcional de dominio sobre secuencias EMPRESA, (b) atado a `scopeEmpresaId` JWT, o (c) omitido en MVP UI. Documentar la decisión; no inventar “Todas las empresas” en shell company. |

### R5 — Company query gates incorrectos (Medio)

| | |
|--|--|
| **Síntoma** | Copiar `useInvCompanyQueryGate` y dejar el listado disabled sin empresa. |
| **Impacto** | Módulo inutilizable para secuencias TENANT o al cambiar sesión. |
| **Mitigación** | Tratar CFG como tenant-first + `useTenantQuery`; gates company solo si el diseño lo exige. |

### R6 — Menú Backend no cableado (Medio)

| | |
|--|--|
| **Síntoma** | Rutas FE listas pero sin ítem en `/auth/menu`. |
| **Impacto** | Módulo invisible; post-login no llega a CFG. |
| **Mitigación** | Coordinar menú “Secuencias de código” + ruta SPA; fuera del alcance de código FE puro, pero debe estar en plan de diseño. |

### R7 — Soft-delete vía PATCH `es_activo` (Medio)

| | |
|--|--|
| **Síntoma** | Reutilizar patrón de formularios que envían `es_activo` en update. |
| **Impacto** | 422 / desalineación contrato (DELETE + POST reactivar). |
| **Mitigación** | Diseñar acciones explícitas Desactivar/Reactivar como INV/ORG catálogo. |

### R8 — Preview tratado como allocate (Medio)

| | |
|--|--|
| **Síntoma** | Copy “próximo código reservado”; invalidar contador tras preview. |
| **Impacto** | Expectativa de producto falsa; ruido de cache. |
| **Mitigación** | Seguir `02_UI_BEHAVIOR` §6 y `06_LIMITATIONS`. |

### R9 — Copiar WMS local-state como plantilla (Bajo–Medio)

| | |
|--|--|
| **Síntoma** | Usar `ZonasPage` (fetch en useEffect) por su RBAC dotted. |
| **Impacto** | Deuda LR-08; peor DX y tests. |
| **Mitigación** | Tomar RBAC de WMS, listado de INV ErpList, UX de ORG. |

### R10 — Serie fiscal `inv-bill` como referencia (Bajo)

| | |
|--|--|
| **Síntoma** | Reutilizar `SeriesPage` por nombre “series/secuencias”. |
| **Impacto** | Dominio y contratos distintos. |
| **Mitigación** | Excluir como referencia primaria. |

---

## 2. Deuda técnica que afecta la implementación futura

| Deuda | Dónde | Efecto en CFG |
|-------|-------|---------------|
| Dos sistemas de permisos sin bridge de ruta por código | Auth core | Diseño debe explicitar LBAC + códigos |
| Sin Badge / Preview genéricos | shared UI | CFG necesitará UI local (aceptable) |
| WMS (y otros) sin ErpList | features/wms | No copiar stack de datos |
| `ERP_MODULES` sin CFG | `erp-modules.ts` | Registro pendiente al cablear |
| OpenAPI local desfasado / incompleto | docs | Tipado depende de snapshot externo |
| `LoadingSpinner` con clase brand-text antipatrón | shared | Preferir tokens en UI nueva |
| Imports ORG dirty desde INV | cross-feature | Patrón aceptado hoy; CFG puede reutilizar ORG helpers |

Ninguna de estas deudas es un **bloqueo arquitectónico** que obligue a refactor previo del core.

---

## 3. Recomendaciones antes de comenzar a escribir código

### Obligatorias para el diseño funcional

1. **Anclar el contrato** `docs/frontend-contracts/cfg/` (00–07) como única entrada funcional.
2. **Fijar shell y ruta SPA** (`/app/cfg/…`) y nombre de menú (“Secuencias de código”).
3. **Cerrar matriz RBAC** LBAC ruta + `hasPermission` acciones + modo solo lectura.
4. **Clasificar scope de listado** (tenant-first vs company) y política del filtro `empresa_id`.
5. **Elegir patrón de detalle** (modal vs página) y dirty discard si modal.
6. **Obtener snapshot OpenAPI** vigente con schemas CFG antes de tipar services.
7. **Separar explícitamente** FCE (`src/core/codigo`) del admin CFG.

### Referencias a leer en diseño (no implementar aún)

| Prioridad | Artefacto |
|-----------|-----------|
| 1 | `docs/frontend-contracts/cfg/*` |
| 2 | Este paquete de auditoría |
| 3 | INV `CategoriasPage` + `categorias.hooks.ts` (ErpList) |
| 4 | ORG catálogo (dirty + Desactivar/Reactivar) |
| 5 | WMS/INV B (`hasPermission` dotted) |
| 6 | `ERP_FRONTEND_STANDARDS_V2` §5 (Plantilla A), §5.11 (listados), §8.5 (errores) |

### Explicitamente no hacer todavía

- Crear `src/features/cfg`, rutas, páginas, menú local.
- Modificar OpenAPI o Backend.
- Extender el FCE para “administrar” secuencias.
- Generar propuestas de tickets de implementación en este paquete.

---

## 4. Checklist de preparación (diseño)

| Ítem | ¿Listo AS-IS? |
|------|:-------------:|
| Shell `/app` claro | Sí |
| Layout reutilizable | Sí |
| Stack listados ErpList | Sí |
| Patrón service Axios | Sí |
| Patrón React Query | Sí |
| Patrón dirty + confirm | Sí |
| Códigos RBAC soportados por `hasPermission` | Sí |
| Feature cfg existente | No (esperado) |
| OpenAPI snapshot en repo | No |
| Menú Backend verificado en este repo | No (dependencia externa) |
| Decisiones scope/RBAC/ruta cerradas | No — trabajo de diseño |

---

## 5. Dictamen de cierre

### ¿El Frontend está preparado para iniciar el diseño funcional del módulo CFG?

**SÍ.**

La arquitectura AS-IS (shells, features, listados, auth, React Query, UI compartida) es suficiente y coherente con el contrato certificado. No se requiere refactor estructural previo (Baseline V1 / core) para poder diseñar CFG.

### ¿Existen bloqueos arquitectónicos previos?

**NO.**

Los gaps detectados (OpenAPI snapshot, registro `ERP_MODULES`, menú Backend, decisión dual RBAC, filtro empresa) son **condiciones de diseño / coordinación**, no fallas de arquitectura que impidan comenzar el documento de diseño funcional.

### Criterio para pasar a implementación (futuro)

Solo después de:

1. Diseño funcional Frontend aprobado.
2. Snapshot OpenAPI CFG disponible para tipado.
3. Confirmación de menú + permisos en ambiente de integración.
4. Decisiones R2/R4/R5 cerradas por escrito.
