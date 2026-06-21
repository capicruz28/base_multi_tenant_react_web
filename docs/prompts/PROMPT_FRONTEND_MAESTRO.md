CAXIS ERP — PROMPT MAESTRO FRONTEND v4.2
=======================================

# CONTEXTO

Sistema SaaS ERP multi-tenant.
Stack: React + TypeScript + Vite + Tailwind + React Query + Axios + Zustand.
Autenticación JWT, RBAC, arquitectura modular.

Módulo objetivo: [MODULO]
Código: [CODIGO]

**Norma ERP:** `ERP_FRONTEND_STANDARDS_V2.md` (CONGELADO — única fuente normativa UX/plataforma)

**Arquitectura estructural:** `docs/arquitectura/ERP_FRONTEND_ARCHITECTURE_BASELINE_V1.md` (Provider + Compositors)

**Precedencia:** OpenAPI > **V2** > **Baseline V1** > `.cursorrules` > **este prompt**

**Alcance:** este prompt cubre **módulos ERP operativos** (Fase 0–3.5). Refactors estructurales core → **Fase E** + Baseline V1 §11.3–§11.4.

**Diseño visual 2 capas (tokens + brand):** ver `.cursorrules` — no repetir aquí.

**Referencias oficiales cerradas:** IAM (componentes tabla) · **ORG (referencia A/T/H)** · **INV (referencia A/A+/B-L/B-F/B-R)**

---

# REGLAS ABSOLUTAS (leer primero)

❌ NO consumir endpoints `deprecated: true` (V2 API-01)
❌ NO eliminar componentes o archivos existentes — **excepción:** reemplazo deprecated documentado (V2 API-01) en el mismo bloque; refactors estructurales certificados SIGNOFF (Baseline V1 §11.3)
❌ NO usar `any` en TypeScript
❌ NO inventar endpoints fuera del contrato OpenAPI
❌ NO fetch directo — solo service layer
❌ NO mostrar UUID en UI (V2 E-ME4)
❌ NO separar cabecera y detalle en dos POST/PUT (V2 CD-01)
❌ NO hardcodear FK — Select dinámico (V2 FK-01)
❌ NO "Eliminar" / "Dar de baja" — Desactivar/Reactivar (V2 UX-01)
❌ NO selector empresa ni "Todas las empresas" en toolbar company-scoped (V2 ME-02)
❌ NO `empresaFilter` local — empresa operativa = sesión JWT `scopeEmpresaId` (V2 ME-01)
❌ NO Radix Dialog `open` + ConfirmDialog `isOpen` simultáneos (V2 B11-10, AP-13)
❌ NO acciones fila catálogo sin rama `row.es_activo` (V2 RB-ROW-02)
❌ NO `variant="danger"` en Aprobar/Autorizar/Procesar/Finalizar (V2 UX-05)

✅ ConfirmDialog del proyecto para confirmaciones
✅ React Query server state; Zustand solo global
✅ Loading / error / empty / toast / confirmación
✅ RBAC: no renderizar acción sin permiso (V2 RB-01)
✅ Toast error solo en hook `onError` (V2 ER-02)
✅ Company-scoped: `empresa_id` payload = sesión JWT, `OrgSessionEmpresaField` en create (ME-05)
✅ Listados A: `IamSearchInput`, `IamTableEmptyState`, `InvTableSkeleton` (V2 §10)
✅ Modales CRUD A: B.1.1 dirty (V2 §7.1)
✅ Catálogo A: matriz acciones fila RB-ROW (V2 §5.10)
✅ ConfirmDialog `variant` según V2 §8.8 (UX-05…08)
✅ Gates obligatorios al cerrar sprint: V2 §11

---

# FASE 0 — CONTRATO API + CLASIFICACIÓN + PATRÓN

⚠ Ejecutar **0.1 → 0.2 → 0.3 → 0.4 → 0.5** en secuencia.
Presentar resultado consolidado al final de 0.5.
⛔ DETENTE. Espera confirmación antes de Fase 1.

## Paso 0.1 — Contrato API del módulo

Lee `[CODIGO]_API.json` (o OpenAPI del módulo).
Filtra endpoints con prefix `/[codigo]/`.

Por cada endpoint:
- ruta, método HTTP
- `deprecated: true` → 🔴 DEPRECATED
- request/response principales
- requiere `empresa_id` (query/body)
- paginación (`page`/`limit` o `pagina`/`limite`)
- **Tier listado** (V2 §5.11.1): A / B / C según contrato y volumen
- filtros (`buscar`, estado, fechas, etc.)
- cabecera con detalle embebido en POST/PUT

Tabla:
| Ruta | Método | Deprecated | Cabecera+Detalle | empresa_id | Tier (A/B/C) | Filtros/Paginación |

## Paso 0.2 — Estructura técnica del proyecto

Extrae patrones existentes (NO lógica de negocio):
- carpetas: pages, hooks, services, types, components, guards
- Axios, React Query (queryKey, staleTime, onError)
- **Multiempresa:** `useEmpresaActiva`, `use*SessionScope`, `use*CompanyQueryGate`, `*CompanyRouteGuard`, `invalidate*Queries` — V2 §4.5, §10
- RBAC: `usePermissions`, `PermissionGuard`
- Toasts, `ConfirmDialog`, `getErrorMessage`
- Formularios (react-hook-form / validación API)
- Componentes estándar: `IamSearchInput`, `OrgToolbarSearch`, `IamTableEmptyState`, `InvTableSkeleton`, `OrgDiscardConfirmDialog` — V2 §10
- **Listados Tier B/C:** `useErpListQuery`, `useDebouncedSearch`, `normalizeListResponse`, `ErpPagination`, `ErpSortableHeader` — V2 §5.11, `@/core/list`, `@/shared/components/erp-list`
- Contrato listados: `FRONTEND_LISTADOS_CONTRACT_V1.md` (whitelists sort/filtros)
- Tenant/Hybrid: `OrgTenantRouteGuard`, `useOrgHybridQueryGate` — V2 §4.5
- Dirty A+: `useOrgModalCreateDirty`, `isDirtyAgainstBaseline` — V2 §5.8, §7.1
- Modal largo: `DialogBody`, MD-05…08 — V2 §7.1.2
- RBAC negocio: `usePermission`, `INV_PERMISSIONS`, `useInvRbacFormAccess` — V2 §8.3.1, §7.2 SEC-14
- Workflow: `movimiento-workflow.ui.ts`, `workflowConfirmOpen` — V2 §6.3.1
- Branding: V2 §8.9 BR-01…05 + `.cursorrules` Capa 2
- Auth L9 (solo lectura): `@/shared/context/AuthContext` shell público; capa interna `@/core/auth/provider/` — Baseline V1 §14; **no modificar sin epic estructural**

## Paso 0.3 — Inventario frontend del módulo + clasificación

Busca archivos existentes del módulo [CODIGO].

Por archivo, clasifica:
✅ CORRECTO · ⚠ INCOMPLETO · 🔴 DESALINEADO · 🔁 REESCRIBIR

Detectar explícitamente:
- Endpoints deprecated consumidos
- UUID visible en UI
- Cabecera+detalle en dos llamadas
- **`empresaFilter` / selector empresa local / "Todas las empresas"** → 🔴 ME-02
- Tabla Tier B/C con hook legacy full-load o sin `normalizeListResponse` → 🔴 §5.11 LR-01, LR-08, LR-N01

Presenta:
A. Tabla endpoints (activos vs deprecated)
B. Tabla archivos: **| Archivo | Clasificación | Plantilla V2 (si aplica) |**
C. Problemas críticos
D. Lo que falta implementar

## Paso 0.4 — Clasificación plantilla por ruta (V2 §2.1)

Para **cada ruta** del módulo [CODIGO], aplicar árbol V2 §2.1:

| Ruta | Plantilla V2 | Justificación breve |
|------|--------------|---------------------|
| … | A / A+ / B-L / B-F / B-R / T / H | … |

Reglas: CL-01, CL-06 — no inventar plantillas ad hoc.

**Ejemplo PUR** (tabla completa: V2 §2.3):
| Escenario | Plantilla |
|-----------|-----------|
| Proveedores, contactos | A |
| Solicitudes, cotizaciones | B-L |
| OC, recepciones | B-F |

## Paso 0.5 — Selección patrón de referencia (V2 §9.5)

Por plantilla usada en el módulo, indicar archivo a copiar:

| Plantilla | Copiar de (referencia cerrada) | V2 § |
|-----------|-------------------------------|------|
| A catálogo Tier A | ORG `DepartamentosPage`, `SucursalesPage`, `CargosPage` | §9.2 |
| A catálogo Tier B | INV `CategoriasPage` o `UnidadesMedidaPage` | §5.11.5, §9.3 |
| A ORG Tier B | `CentrosCostoPage` | §5.11.5, §9.2 |
| T | `EmpresaPage` (AP-10) | §9.2 |
| H | `ParametrosPage` | §9.2, §5.11 |
| A+ | INV `ProductosPage` | §5.11.5, §9.3 |
| B-L Tier C | INV `MovimientosPage` | §5.11.5, §9.3 |
| B-L detalle | INV `InventarioFisicoPage` | §9.3 |
| B-F | INV `MovimientoFormPage` + M2-SEC | §9.3, §7.2 |
| B-F RBAC | `MovimientoFormPage` + `useInvRbacFormAccess` | §7.2 SEC-14 |
| B-R Tier C | INV `KardexPage` / `StockPage` | §5.11.5, §9.3 |
| ErpList stack | `ProductosPage` + `useProductosErpList` | §5.11.2, §10 |
| Multiempresa M0 | INV M0-b infra: `useInvSessionScope`, `InvCompanyRouteGuard` | §4.5 |
| Tenant guard | `OrgTenantRouteGuard` | §4.5 |
| Componentes IAM | `IamSearchInput`, `IamTableEmptyState` | §9.1 |

Indicar **sprint objetivo** y Gates previstos:
- **M0:** Gates 0, 1, 4
- **M1 catálogos:** Gates 0, 2, 4 por pantalla
- **M2 transaccional:** Gates 0, 3, 4 por ruta B

---

# FASE 1 — AUDITORÍA DETALLADA (sin código)

## Paso 1.1 — Diagnóstico de salud

🟢 SALUDABLE · 🟡 AJUSTES · 🔴 PROBLEMAS — justificación 3–5 líneas.

## Paso 1.2 — Auditoría por endpoint activo

| Endpoint | Método | Service | Hook | Componente | IDs UI | Loading/Error | RBAC |

## Paso 1.3 — Auditoría UX por vista

| Vista | Plantilla V2 | Existe | Paginación | Filtros | Empty IAM | Skeleton | Toast | Confirm | Badge |

## Paso 1.4 — Campos faltantes en UI

🔴 CRÍTICO · ⚠ IMPORTANTE · ➕ MENOR

## Paso 1.5 — Reporte

Generar: `docs/frontend/auditoria/AUDITORIA_FRONTEND_[CODIGO].md`

Estructura obligatoria:

---
### DIAGNÓSTICO GENERAL

### CLASIFICACIÓN PLANTILLA POR RUTA
| Ruta | Plantilla V2 | Referencia §9 | Gates (M0/M1/M2) |

### ENDPOINTS DEPRECATED CONSUMIDOS

### UUIDs EXPUESTOS EN UI

### MULTIEMPRESA — DESALINEACIONES (empresaFilter, selector local)

### FLUJOS CABECERA+DETALLE MAL IMPLEMENTADOS

### AUDITORÍA POR ENDPOINT

### AUDITORÍA DE VISTAS UX/UI

### CAMPOS FALTANTES EN UI

### ARCHIVOS A REESCRIBIR

### ARCHIVOS NUEVOS A CREAR
---

⛔ DETENTE. Espera confirmación antes de Fase 2.

---

# FASE 2 — IMPLEMENTACIÓN CONTROLADA

Implementa SOLO lo auditado. Orden: Bloque 1 → 2 → 3 → 4. Detente tras cada bloque.

## Bloque 1 — Types

- Types Create / Update / Read separados (V2 API-04)
- Cabecera+detalle: `detalle: DetalleCreate[]` embebido
- Sin `any`

## Bloque 2 — Services

- `[codigo].service.ts`; Axios configurado; sin deprecated (API-01)
- `empresa_id` según contrato; en company-scoped = sesión (ME-01)
- Un método `*ConDetalle` para B-F

## Bloque 3 — Hooks

- `useTenantQuery` en GET nuevos cuando aplique (ME-10)
- Company-scoped: queryKey con `scopeEmpresaId`; gate `enabled` (ME-04)
- Toast éxito onSuccess; error solo onError + `getErrorMessage` (ER-01, ER-02)
- Invalidar queries al mutar; invalidar módulo al cambiar empresa (ME-03)
- **Tier B/C listado:** hook `use*ErpList` → `useErpListQuery`; fetcher con `normalizeListResponse`; MUST NOT adaptador por pantalla (LR-N01…03)
- **Legacy full-load:** solo selects/combobox/FK/modales — LR-08; MUST NOT tablas Tier B/C

## Bloque 4 — Componentes

⚠ Antes de codificar: confirmar clasificación Fase 0.4 y patrón Fase 0.5.

### Paso 4.0 — Decisiones por entidad (procedimiento)

Por entidad: columnas tabla, filtros dominio, modal vs página, agrupación campos.

**Filtros relevantes:** búsqueda, estado, filtros de dominio (fechas, almacén, etc.).
**PROHIBIDO** filtro/select empresa en toolbar company-scoped (ME-02).
Ejemplo Almacenes: Tipo, estado, búsqueda — **sin** selector empresa.

Presenta análisis antes de escribir componentes.

### Plantilla A / A+ (V2 §5)

- Layout: `OrgPageLayout` / módulo equivalente; toolbar `OrgCompanyToolbar` pattern
- `OrgToolbarSearch` + `IamSearchInput`; `InvTableSkeleton`; `IamTableEmptyState` + `hasSearch`
- Modales create/edit: B.1.1 — `createOrgDiscardHandlers`, `OrgDiscardConfirmDialog`, `form-dirty/*`
- Create company: `OrgSessionEmpresaField` readonly (ME-05)
- A+: verificar PA+-01…03 si aplica (V2 §5.8)
- A+ create dirty dinámico: `useOrgModalCreateDirty` (PA+-02)
- Modal largo: `DialogContent flex flex-col overflow-hidden` + `DialogBody` + footer fijo (MD-05…08)
- **Gate 2:** checklist V2 §11.3; QA modal: `INV_M3_B11_CATALOGS_AUDIT.md`

**Acciones de fila (RB-ROW):**
- Rama `row.es_activo ? (Editar + Desactivar) : (Reactivar)` con RBAC (RB-01)
- Hybrid: guards dominio dentro de cada rama (RB-ROW-03)
- Reactivar: `ConfirmDialog` `variant="info"` antes de mutar (UX-07)
- Desactivar: `variant="danger"` (UX-06); independiente de `discardPending` (B11-02)

### Listados Tier B / C (V2 §5.11) — catálogos B, A+ B, B-L, B-R con paginación

- Clasificar Tier en Fase 0.1; stack: `*_LIST_CONFIG` → `use*ErpList` → `useErpListQuery` → `orgFetchList`/`invFetchList` + `normalizeListResponse`
- MUST `forcePagination: true`, default `limit=50` — LR-02
- Búsqueda: `useDebouncedSearch` 350 ms + `OrgToolbarSearch`/`ErpSearchInput` si API expone `buscar` — SR-03
- Sort: `ErpSortableHeader` + whitelist contrato — LR-04; MUST NOT sort in-memory — LR-05
- UI: `ErpPagination`, `InvTableSkeleton`, `IamTableEmptyState` + `hasSearch`
- Reset `page=1` al cambiar filtros/búsqueda/tab — LR-06; reset empresa ME-09 — LR-07
- Tier C sin `buscar`: filtros dominio únicamente — LR-09
- Plantilla H: una instancia ErpList por tab — LR-10
- Referencias: §5.11.5 — copiar patrón en PUR/SLS/FIN/CRM al cerrar contrato OpenAPI
- **Gate 2/3:** LR-01…LR-09, LR-N01…LR-N04, PR-01…PR-04 según V2 §11

### Plantilla B-F (V2 §6.5, §7.2)

- Página completa; secciones CD-08, CD-09; POST/PUT único con-detalle
- Dirty guard: copiar `useInvTransactionalFormGuard` o rename module-local (SEC-01)
- RBAC ruta: `useInvRbacFormAccess` + constantes `*_PERMISSIONS` (SEC-14, RB-N03)
- Referencia: `MovimientoFormPage`, `InventarioFisicoFormPage`
- `OrgDiscardConfirmDialog` + page discard handlers
- **Gate 3 B-F:** V2 §11.4; QA: `INV_M2_SEC_QA_BEHAVIOR_MATRIX.md`

### Plantilla B-L (V2 §6.3)

- Lista + workflow; toolbar operativa; sin patrón catálogo "Ver inactivos"
- Tier C: ErpList + filtros dominio (sin toolbar `buscar` si API no lo expone) — §5.11 LR-09
- `ConfirmDialog` workflow separado de B.1.1 form
- **Gate 3 B-L:** PB-04…PB-08

**Stacking modal (B-L):**
- Clasificar detalle como Tipo A, confirms como Tipo C (MD-01…04)
- Al pulsar workflow en detalle: `setDetailOpen(false)` antes del confirm (PB-13)
- Defensa: `workflowConfirmOpen` + `detailDialogOpen = detailOpen && !workflowConfirmOpen` (PB-14)
- Workflow positivo: `variant="warning"` (UX-05); Anular: `variant="danger"` (UX-06)
- Referencia: `INV_MODAL_STACKING_AUDIT.md`, INV `MovimientosPage`

**Acciones listado Hub (ERP-BL-ACT-01 — V2 §6.3.1):**
- Columna Acciones: botón «Ver detalle» (`Eye`) — único entry point al modal
- MUST NOT `onClick` en `<tr>` para abrir detalle (PB-15)
- MUST NOT workflow ni edición en grilla (PB-04, PB-18)
- Modal detalle Hub: workflow (PB-13/14) + CTA **«Editar documento»** si `puedeEditarDocumento` (PB-19…PB-21)
- Helper local `puedeEditarDocumento` — guards de estado por dominio (PB-20)
- Referencia: INV `MovimientosPage`, `InventarioFisicoPage`
- Helpers dominio: copiar patrón `movimiento-workflow.ui.ts` (§6.3.1)
- Lifecycle: `hasPermission(INV_PERMISSIONS.…)` + regla estado (RB-N01…02)
- Detalle modal: `DialogBody` para contenido largo (MD-05…08)
- Antecedente INV-BL-DET-01 (híbrido fila+icono): no replicar; patrón vigente ERP-BL-ACT-01

**Dirty guard confirms workflow (si campos editables — V2 §7.3.1):**
- Baseline al abrir; `OrgDiscardConfirmDialog` al cancelar dirty
- Referencia INV: INV-UX-003 (Aprobar IF), INV-UX-004 (Anular Mov)

### Plantilla B-R (V2 §6.4)

- Solo lectura; filtros dominio; E-ME4; sin Crear
- Tier C: ErpList + gate dominio (ej. kardex `producto_id`) — §5.11
- **Gate 3 B-R:** PB-09…PB-12

### Normas transversales (pointers — no repetir tablas)

- Vocabulario, FK, `es_activo`, acciones fila, ConfirmDialog `variant`: **V2 §5.10, §8.2–§8.4, §8.8**
- RBAC catálogo: **V2 §8.3** · RBAC negocio: **V2 §8.3.1**
- Branding: **V2 §8.9** + `.cursorrules`

### M0 multiempresa — infraestructura (si sprint M0)

Copiar patrón INV M0-b antes de migrar pantallas:
- `use[Codigo]SessionScope`, `use[Codigo]CompanyQueryGate`, `[Codigo]CompanyRouteGuard`
- `invalidate[Codigo]Queries` integrado en cambio empresa
- Eliminar `empresaFilter`, `loadEmpresas`, "Todas las empresas"
- Tenant routes: `OrgTenantRouteGuard` si aplica plantilla T
- Reset: `use*ScopeEmpresaReset` con filtros + modales + discardPending (ME-09)

---

# FASE 3 — VERIFICACIÓN FINAL

1. Archivos creados/modificados
2. Ningún endpoint deprecated consumido
3. Ningún UUID visible en UI
4. Por endpoint activo: types / service / hook / componente ✅/❌
5. Transaccional: con-detalle una llamada; estados visibles; RBAC+estado
6. Ningún componente eliminado; sin `any`
7. **ME-02:** grep sin `empresaFilter`, "Todas las empresas", selector empresa toolbar
8. Plantilla A: `IamTableEmptyState`, `InvTableSkeleton` presentes
9. B-F: transactional form guard presente
10. Generar: `docs/frontend/modulos/[CODIGO]_FRONTEND_IMPLEMENTACION.md`
11. Plantilla A: matriz acciones fila activo/inactivo conforme RB-ROW-01
12. B-L: 0 instancias Radix `open` + ConfirmDialog `isOpen` simultáneos (B11-10)
13. B-L: conforme ERP-BL-ACT-01 — sin click fila; solo Eye; sin Editar/workflow en grilla
14. B-L: CTA modal edición = «Editar documento»; `puedeEditarDocumento` presente
15. A+ con baseline dinámico: `useOrgModalCreateDirty` presente si PA+-02
16. Modal largo: `DialogBody` + `overflow-hidden` en `DialogContent` si aplica
17. B-F: `useInvRbacFormAccess` wired (SEC-14)
18. B-L: helpers `*-workflow.ui.ts` si workflow por estado
19. Branding: `focus:ring-brand-primary` en inputs; sin `ring-ring` en shared/ui tocado
20. Tier B/C: `use*ErpList` + `normalizeListResponse` + `ErpPagination` presentes — §5.11
21. Sin hook legacy full-load en tablas Tier B/C — LR-08
22. Sin adaptadores de respuesta list[]/envelope por pantalla — LR-N03

---

# FASE 3.5 — GATES V2 §11 (obligatorio antes de sign-off)

Verificar checklist **`ERP_FRONTEND_STANDARDS_V2.md` §11** según sprint:

### M0 — Multiempresa
- [ ] §11.1 Gate 0 (CL-01, API-01, patrón §9.5)
- [ ] §11.2 Gate 1 (ME-01…ME-06, E-ME4, guards, invalidate)
- [ ] §11.5 Gate 4 (RB-01, ER-02, tsc/eslint)

### M1 — Catálogos Plantilla A (por pantalla)
- [ ] §11.3 Gate 2 (PA, TB, ES, SK, SR, B11)
- [ ] A+: PA+-01…03 si aplica
- [ ] QA B.1.1 modal (matriz INV_M3)
- [ ] RB-ROW-01…03; confirms reactivar UX-07 y desactivar UX-06
- [ ] MD-05…08 si modal largo
- [ ] `useOrgModalCreateDirty` si A+
- [ ] Tier B catálogo: LR-01…LR-08, LR-N01…LR-N04, PR-01…PR-02 (§5.11) si aplica Fase 0.1

### M2 — Transaccional (por ruta según plantilla B-L / B-F / B-R)
- [ ] §11.4 Gate 3 — **solo ítems de la plantilla de esa ruta**
- [ ] B-L: PB-13, PB-14, UX-05/06 — ref. `INV_MODAL_STACKING_AUDIT.md`
- [ ] B-L: PB-15…PB-21 (ERP-BL-ACT-01)
- [ ] B-L: SEC-11…13 si confirm workflow tiene campos editables
- [ ] B-L: RB-N01…02, workflow helpers
- [ ] B-F: SEC-14, RB-N03
- [ ] B-F: QA INV_M2_SEC matriz
- [ ] Tier C listado: LR-01, LR-02, LR-06, LR-08, LR-09, PR-01, PR-02 (§5.11) si aplica

No pegar checklist completa aquí — leer V2 §11.

---

# FASE E — REFACTOR ESTRUCTURAL (solo epics)

> **NO aplica a módulos ERP operativos** (PUR, SLS, FIN, INV catálogos, ORG pantallas, etc.).  
> Esos módulos usan **Fase 0 → 3.5** y Gates **V2 §11** (Module Gates 0–4).

**Cuándo usar Fase E:** descomposición de Context/provider core multi-dominio — criterios → `ERP_FRONTEND_ARCHITECTURE_BASELINE_V1.md` §11.1–§11.2.

**Metodología oficial:** Baseline V1 §11.3–§11.4 (plantilla certificada **IAM-FE-PHASE-09** SIGNOFF-02).

**Reglas arquitectónicas (P-*, AC rules, fases A→D, budgets, testing):** **solo Baseline V1** §2–§8 — no redefinir aquí.

**Reglas UX / multiempresa / OpenAPI:** **solo V2** — zero feature delta obligatorio (Baseline V1 P-03).

## Índice de etapas (pointers — no duplicar contenido)

| # | Etapa | Artefacto epic | Referencia canónica Phase-09 | Norma |
|---|-------|----------------|------------------------------|-------|
| 1 | Kickoff | `{EPIC}_KICKOFF.md` | `docs/arquitectura/IAM_FE_PHASE_09_KICKOFF.md` | Baseline §11.4 |
| 2 | Technical Design | `{EPIC}_TECHNICAL_DESIGN.md` | `IAM_FE_PHASE_09_TECHNICAL_DESIGN.md` | Baseline §11.4 |
| 3 | Design Review | Aprobación explícita en Design | G0 en Technical Design §22 | Baseline §11.3 |
| 4 | Implementation Plan | `{EPIC}_IMPLEMENTATION_PLAN.md` | `IAM_FE_PHASE_09_IMPLEMENTATION_PLAN.md` | Baseline §11.4 |
| 5 | IMPL incrementales | `{EPIC}_IMPL_NN_REPORT.md` | `IAM_FE_PHASE_09_IMPL_*_REPORT.md` | Baseline §11.3; Arch-Gate 2 → §10 |
| 6 | Pre-Signoff Review | Informe READ ONLY (waivers P1/P2/P3) | Pre-Signoff Phase-09 | Baseline §11.3 |
| 7 | Production Audit | Informe READ ONLY | Production Audit Phase-09 | Baseline §11.3 |
| 8 | Validation | `{EPIC}_VALIDATION_REPORT.md` | `IAM_FE_PHASE_09_VALIDATION_REPORT.md` | Baseline §8 (testing — solo pointer) |
| 9 | Closure Report | `{EPIC}_CLOSURE_REPORT.md` | `IAM_FE_PHASE_09_CLOSURE_REPORT.md` | Baseline §11.3 |
| 10 | Signoff | `{EPIC}_SIGNOFF.md` | `IAM_FE_PHASE_09_SIGNOFF.md` | Baseline §11.3; Arch-Gate 3 → §10 |

## Reglas operativas Fase E (resumen — detalle en Baseline)

- ⛔ **NO iniciar IMPL** sin Kickoff + Technical Design + Design Review aprobados.
- ⛔ **NO cerrar epic** sin Validation + Production Audit + Closure Report + **SIGNOFF** (eliminar artefactos temporales de fase en Signoff).
- ⛔ **NO mezclar** con sprint módulo ERP (V2 §11) ni cambios UX/API (V2 + OpenAPI).
- ✅ Manifesto/tests **verdes** antes de cada IMPL siguiente (Baseline §11.3).
- ✅ Checklist cierre estructural → Baseline V1 **§10 Arch-Gates 0–3** (≠ V2 §11 Module Gates).

**Inicio Fase E:** crear Kickoff siguiendo estructura `IAM_FE_PHASE_09_KICKOFF.md`. Detener tras Kickoff aprobado; continuar solo con Design Review explícito.

---

# INICIO

Comienza Fase 0 completa: Pasos **0.1 → 0.5** en secuencia.
Detente al finalizar 0.5 y espera confirmación.
