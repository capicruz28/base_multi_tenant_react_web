CAXIS ERP — PROMPT MAESTRO FRONTEND v3
=======================================

# CONTEXTO

Sistema SaaS ERP multi-tenant.
Stack: React + TypeScript + Vite + Tailwind + React Query + Axios + Zustand.
Autenticación JWT, RBAC, arquitectura modular.

Módulo objetivo: [MODULO]
Código: [CODIGO]

**Norma ERP:** `ERP_FRONTEND_STANDARDS_V2.md` (CONGELADO — única fuente normativa)

**Precedencia:** OpenAPI > **V2** > `.cursorrules` > **este prompt**

**Diseño visual 2 capas (tokens + brand):** ver `.cursorrules` — no repetir aquí.

**Referencias cerradas:** IAM (componentes tabla) · ORG (multiempresa, E-SEC) · INV (Plantilla A/B completa)

---

# REGLAS ABSOLUTAS (leer primero)

❌ NO consumir endpoints `deprecated: true` (V2 API-01)
❌ NO eliminar componentes o archivos existentes
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
- filtros (`buscar`, estado, fechas, etc.)
- cabecera con detalle embebido en POST/PUT

Tabla:
| Ruta | Método | Deprecated | Cabecera+Detalle | empresa_id | Filtros/Paginación |

## Paso 0.2 — Estructura técnica del proyecto

Extrae patrones existentes (NO lógica de negocio):
- carpetas: pages, hooks, services, types, components, guards
- Axios, React Query (queryKey, staleTime, onError)
- **Multiempresa:** `useEmpresaActiva`, `use*SessionScope`, `use*CompanyQueryGate`, `*CompanyRouteGuard`, `invalidate*Queries` — V2 §4.5, §10
- RBAC: `usePermissions`, `PermissionGuard`
- Toasts, `ConfirmDialog`, `getErrorMessage`
- Formularios (react-hook-form / validación API)
- Componentes estándar: `IamSearchInput`, `OrgToolbarSearch`, `IamTableEmptyState`, `InvTableSkeleton`, `OrgDiscardConfirmDialog` — V2 §10

## Paso 0.3 — Inventario frontend del módulo + clasificación

Busca archivos existentes del módulo [CODIGO].

Por archivo, clasifica:
✅ CORRECTO · ⚠ INCOMPLETO · 🔴 DESALINEADO · 🔁 REESCRIBIR

Detectar explícitamente:
- Endpoints deprecated consumidos
- UUID visible en UI
- Cabecera+detalle en dos llamadas
- **`empresaFilter` / selector empresa local / "Todas las empresas"** → 🔴 ME-02

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
| A catálogo | INV `UnidadesMedidaPage` o ORG `DepartamentosPage` | §9.3 / §9.2 |
| A+ | INV `ProductosPage` | §9.3 |
| B-L | INV `MovimientosPage` | §9.3 |
| B-F | INV `MovimientoFormPage` + M2-SEC | §9.3, §7.2 |
| B-R | INV `StockPage` / `KardexPage` | §9.3 |
| Multiempresa M0 | INV M0-b infra: `useInvSessionScope`, `InvCompanyRouteGuard` | §4.5 |
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
- **Gate 2:** checklist V2 §11.3; QA modal: `INV_M3_B11_CATALOGS_AUDIT.md`

**Acciones de fila (RB-ROW):**
- Rama `row.es_activo ? (Editar + Desactivar) : (Reactivar)` con RBAC (RB-01)
- Hybrid: guards dominio dentro de cada rama (RB-ROW-03)
- Reactivar: `ConfirmDialog` `variant="info"` antes de mutar (UX-07)
- Desactivar: `variant="danger"` (UX-06); independiente de `discardPending` (B11-02)

### Plantilla B-F (V2 §6.5, §7.2)

- Página completa; secciones CD-08, CD-09; POST/PUT único con-detalle
- Dirty guard: copiar `useInvTransactionalFormGuard` o rename module-local (SEC-01)
- `OrgDiscardConfirmDialog` + page discard handlers
- **Gate 3 B-F:** V2 §11.4; QA: `INV_M2_SEC_QA_BEHAVIOR_MATRIX.md`

### Plantilla B-L (V2 §6.3)

- Lista + workflow; toolbar operativa; sin patrón catálogo "Ver inactivos"
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
- Antecedente INV-BL-DET-01 (híbrido fila+icono): no replicar; patrón vigente ERP-BL-ACT-01

**Dirty guard confirms workflow (si campos editables — V2 §7.3.1):**
- Baseline al abrir; `OrgDiscardConfirmDialog` al cancelar dirty
- Referencia INV: INV-UX-003 (Aprobar IF), INV-UX-004 (Anular Mov)

### Plantilla B-R (V2 §6.4)

- Solo lectura; filtros dominio; E-ME4; sin Crear
- **Gate 3 B-R:** PB-09…PB-12

### Normas transversales (pointers — no repetir tablas)

- Vocabulario, FK, `es_activo`, acciones fila, ConfirmDialog `variant`: **V2 §5.10, §8.2–§8.4, §8.8**
- RBAC: **V2 §8.3**
- Diseño visual tokens/brand: **`.cursorrules`**

### M0 multiempresa — infraestructura (si sprint M0)

Copiar patrón INV M0-b antes de migrar pantallas:
- `use[Codigo]SessionScope`, `use[Codigo]CompanyQueryGate`, `[Codigo]CompanyRouteGuard`
- `invalidate[Codigo]Queries` integrado en cambio empresa
- Eliminar `empresaFilter`, `loadEmpresas`, "Todas las empresas"

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

### M2 — Transaccional (por ruta según plantilla B-L / B-F / B-R)
- [ ] §11.4 Gate 3 — **solo ítems de la plantilla de esa ruta**
- [ ] B-L: PB-13, PB-14, UX-05/06 — ref. `INV_MODAL_STACKING_AUDIT.md`
- [ ] B-L: PB-15…PB-21 (ERP-BL-ACT-01)
- [ ] B-L: SEC-11…13 si confirm workflow tiene campos editables
- [ ] B-F: QA INV_M2_SEC matriz

No pegar checklist completa aquí — leer V2 §11.

---

# INICIO

Comienza Fase 0 completa: Pasos **0.1 → 0.5** en secuencia.
Detente al finalizar 0.5 y espera confirmación.
