# ERP Frontend — Architecture Baseline V1

**Ticket:** ERP-FRONTEND-ARCHITECTURE-BASELINE-01  
**Versión:** 1.2  
**Estado:** **OFICIAL — CONGELADO post IAM-FE-PHASE-09 SIGNOFF-02**  
**Fecha:** 2026-06-19  
**Origen normativo:** Arquitectura L9 certificada en `src/core/auth/provider/` (Phase-09 SIGNED OFF)

> Este documento define el **patrón arquitectónico obligatorio** para descomposición de providers complejos y composición por dominio en el Frontend ERP.  
> **No sustituye** contratos OpenAPI ni `ERP_FRONTEND_STANDARDS_V2.md` (UX, plantillas, listados, multiempresa).  
> **Complementa** esos estándares con la capa estructural **Provider + Compositors + Assembler**.

---

## Precedencia

| Prioridad | Documento | Alcance |
|-----------|-----------|---------|
| 0 | OpenAPI del módulo | Contratos API |
| 1 | `ERP_FRONTEND_STANDARDS_V2.md` | UX, plantillas A/B, RBAC visual, multiempresa JWT |
| 2 | **Este documento (Baseline V1)** | Patrón Provider + Compositors, ensamblaje, dependencias, testing estructural |
| 3 | `.cursorrules` | Recordatorios operativos |
| 4 | `PROMPT_FRONTEND_MAESTRO.md` | Bootstrap módulos ERP (Fase 0–3.5) · procedimiento epic estructural (Fase E) |

---

## Relación con V2

| Tema | Propietario | Notas |
|------|-------------|-------|
| UX plantillas, multiempresa JWT, RBAC visual, listados | `ERP_FRONTEND_STANDARDS_V2.md` | Este documento **no** redefine ME-*, PA-*, B11-* |
| Comportamiento auth observable (AUTH-*, IMP-*) | V2 §4.8 | Flujos login, selección empresa, impersonation |
| Implementación estructural Provider + Compositors | **Este documento** | P-*, AC rules, fases A→D, testing §8 |
| **Baseline (formulario)** | V2 §7.1 (`useOrgModalCreateDirty`, `isDirtyAgainstBaseline`) | **≠** Architecture Baseline V1 |
| **AuthContext shell público** | V2 §10 — `@/shared/context/AuthContext` | App consume `useAuth()`; capa L9 interna §14 |
| Refactor estructural core | **Este documento** §10–§11 | Epic con SIGNOFF; procedimiento agente → `PROMPT_FRONTEND_MAESTRO.md` Fase E |

---

## 1. Resumen ejecutivo

Phase-09 demostró que un **Context monolítico** (~3.068 líneas) puede descomponerse en:

- **Shell público** delgado (`AuthContext.tsx` — **184 líneas**)
- **Ensamblador único** (`useAuthProvider.ts` — **358 líneas**)
- **Compositors por dominio** (10 módulos bajo `src/core/auth/provider/`)
- **Capa de acciones públicas** (`auth-provider-public-actions.ts`)
- **Dominio congelado** en capas inferiores (`session/`, `features/`) sin reescritura

Resultado certificado: **236/236 tests**, contrato **36 keys / 39 exports** intacto, **APPROVED FOR PRODUCTION**, **SIGNOFF APPROVED**.

Este baseline generaliza ese patrón como estándar ERP para futuras fases estructurales.

---

## 2. Principios arquitectónicos oficiales

| ID | Principio | Descripción |
|----|-----------|-------------|
| **P-01** | **Shell público estable** | El path de importación consumido por la app (`@/shared/context/*`, hooks públicos) **no cambia** tras refactor estructural. |
| **P-02** | **Copy-first, refactor-second** | Extraer bloques literales del monolito antes de abstraer o optimizar. |
| **P-03** | **Zero feature delta** | Refactor estructural **no** altera comportamiento observable, UX, OpenAPI ni contratos públicos. |
| **P-04** | **Dominio congelado abajo** | Módulos de dominio (`session/`, services, policies) no se reescriben en fases de composición. |
| **P-05** | **Ensamblador único** | Un solo hook `useXProvider` importa todos los compositors y define el orden de wiring. |
| **P-06** | **SRP por compositor** | Un compositor = un subdominio cohesivo (bootstrap, interceptors, termination, etc.). |
| **P-07** | **Inyección por parámetros** | Compositors reciben slices tipados (state, refs, setters, callbacks); **no** importan siblings. |
| **P-08** | **Regresión continua** | Cada entrega intermedia deja manifesto/tests verdes antes del siguiente paso. |
| **P-09** | **Provider tree invariante** | El árbol React de `provider.tsx` (o equivalente app) **no se mueve** sin ticket de fase dedicado. |
| **P-10** | **Tipos como contrato** | `{module}-provider.types.ts` es la fuente normativa de keys públicas, fases de ensamblaje e import policy. |

---

## 3. Patrón Provider + Compositors

### 3.1 Capas (modelo L9 — referencia IAM)

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA PÚBLICA (Shell)                                       │
│  src/shared/context/{Module}Context.tsx                     │
│  • createContext + defaults                                 │
│  • re-exports helpers/tests                                 │
│  • {Module}Provider → useXProvider()                        │
│  • useX() hook                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  ENSAMBLADOR (Assembler)                                    │
│  src/core/{module}/provider/useXProvider.ts                 │
│  • Orden fases A → B → C → D                                │
│  • Único importador de *-compositor.*                       │
│  • contextValue + renderProviderTree                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     ▼                     ▼                     ▼
┌─────────┐    ┌──────────────────┐    ┌─────────────────┐
│ State   │    │ *-compositor.ts  │    │ public-actions  │
│ cleanup │    │ (por dominio)    │    │ (context value) │
│ refs    │    │                  │    │                 │
└─────────┘    └──────────────────┘    └─────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  DOMINIO CONGELADO                                          │
│  session/*, features/*/services, policies, utils            │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Fases de ensamblaje (A → B → C → D)

Orden normativo derivado del monolito AuthContext (DR-D02):

| Fase | Nombre | Contenido | Ejemplo L9 |
|------|--------|-----------|------------|
| **A** | Pre-effects | State, refs, hooks de dominio early, cleanup factories | permissions early, impersonation early, empresa sync |
| **B** | Effects | `useEffect` de interceptors, bootstrap, listeners | E5 request, E6 response, E7 bootstrap |
| **C** | Post-effects / público | Handlers, `contextValue` useMemo, derivados | `useAuthProviderPublicActions` |
| **D** | Render / binders | JSX auxiliar bajo Provider (sin mover UX app-level) | `AuthProviderPhaseDBinders` |

**Regla:** no reordenar fases ni effects dentro de una fase sin regresión manifesto + diseño de fase.

### 3.3 Tipos de módulo en `provider/`

| Sufijo / nombre | Rol |
|-----------------|-----|
| `{module}-provider.types.ts` | Contratos, keys públicas, import policy, fases |
| `{module}-provider-state.ts` | State + setters + ref sync |
| `{module}-provider-cleanup.ts` | Cleanup / queue / local reset |
| `{module}-provider-runtime.refs.ts` | Singletons module-level (ej. refresh promise) |
| `{module}-provider-termination.helpers.ts` | Helpers exportados para tests (si aplica) |
| `{module}-provider-{domain}.compositor.ts(x)` | Wiring de un subdominio |
| `{module}-provider-public-actions.ts` | Handlers + `contextValue` (capa O) |
| `use{Module}Provider.ts` | Ensamblador |
| `index.ts` | Barrel interno (no reemplaza shell público) |

### 3.4 Provider tree de aplicación (separado de L9)

El patrón compositor **no** incluye reordenar `src/app/provider.tsx`. Phase-09 certificó orden invariante:

```
QueryClientProvider
  └ ThemeProvider
      └ AuthProvider                    ← shell + L9 ensamblador
          └ SessionUxBinder             ← UX L7 (sibling, NO dentro compositor)
              └ AuthGate
                  └ TenantProvider
                      └ PermissionProvider
                          └ AppReadyGate → …
```

**Regla:** binders UX de plataforma (SessionUxBinder, AuthGate) permanecen **fuera** del ensamblador L9 salvo ticket explícito.

---

## 4. Responsabilidades de `useXProvider` (ensamblador)

El ensamblador **SÍ debe**:

| # | Responsabilidad |
|---|-----------------|
| 1 | Instanciar state bundle (`useXProviderState`) |
| 2 | Invocar compositors en orden de fases A→B→C→D |
| 3 | Pasar deps tipadas (refs, setters, callbacks) a cada compositor |
| 4 | Registrar effects vía compositors (no duplicar lógica inline) |
| 5 | Construir o delegar `contextValue` final |
| 6 | Exponer `renderProviderTree(children)` para binders Fase D |
| 7 | Retornar `{ contextValue, renderProviderTree }` al shell |

El ensamblador **NO debe**:

| # | Prohibición |
|---|-------------|
| 1 | Contener lógica de dominio inline (HTTP, classify termination, hydrate body) |
| 2 | Importar `@/shared/context/{Module}Context` (anti-ciclo) |
| 3 | Importar `@/app/provider` |
| 4 | Exponer APIs nuevas a la app (solo vía shell/`useX`) |
| 5 | Reordenar effects respecto al baseline copy-first sin regresión |

**Referencia:** `useAuthProvider.ts` — único archivo que importa los 10 compositors L9.

---

## 5. Reglas de dependencias

### 5.1 Dirección permitida

```
app / features UI
    ↓ consume
shared/context shell (useX, Provider)
    ↓ delega
core/{module}/provider/useXProvider
    ↓ compone
core/{module}/provider/*-compositor.*
    ↓ usa
core/{module}/session/* | features/*/services | utils | types
```

### 5.2 Reglas AC (Anti-Cycle) — obligatorias

| ID | Regla |
|----|-------|
| **AC-01** | `session/*` (dominio) **nunca** importa `provider/*` |
| **AC-02** | `*-compositor.ts(x)` **nunca** importa otro `*-compositor.ts(x)` |
| **AC-03** | Compositor → permitido: `types`, `runtime.refs`, `cleanup`, `*.helpers`, `session/*`, `features/*`, utils |
| **AC-04** | `useXProvider.ts` es el **único** importador de todos los compositors |
| **AC-05** | Shell `{Module}Context.tsx` importa solo `useXProvider` + re-exports helpers |
| **AC-06** | Test `{module}-provider-acyclic-imports.test.ts` valida grafo estático |
| **AC-07** | Helpers no importan ensamblador ni compositors inversamente |

### 5.3 Waiver documentado Phase-09 (no replicar sin diseño)

| ID | Desviación | Disposición |
|----|------------|-------------|
| **AC-04-L9-O** | `auth-provider-public-actions.ts` importa hooks de 3 compositors | Waiver SIGNOFF; preferir inyección en futuros módulos |

### 5.4 Prefixes permitidos en `provider/` (L9)

Definidos en `{module}-provider.types.ts` → `*_ALLOWED_IMPORT_PREFIXES`:

- `@/core/api/`, `@/core/{module}/provider/`, `@/core/{module}/session/`
- `@/core/{module}/types/`, `@/core/{module}/utils/`
- `@/features/`, `@tanstack/react-query`, `react`, `axios`, etc.

**Prohibidos:** `@/shared/context/{Module}Context`, `@/app/provider`.

---

## 6. Reglas anti-ciclos — verificación

### 6.1 Enforcement

1. **Estático:** test `auth-provider-acyclic-imports.test.ts` (obligatorio por módulo provider).
2. **Convención:** compositors solo exportan hooks/factories; no exportan ensamblador.
3. **Review gate:** PR que toque `provider/` debe incluir test acyclic verde.

### 6.2 Señales de violación

- Compositor A importa Compositor B
- `session/*.ts` importa `provider/*.ts`
- Shell importa compositor directamente (salvo ensamblador vía `useXProvider` únicamente)
- Provider importa componente de feature UI

---

## 7. Organización de archivos

### 7.1 Layout canónico (referencia IAM post-SIGNOFF)

```
src/
├── shared/context/
│   └── AuthContext.tsx              # Shell público (≤250 líneas objetivo)
├── core/auth/
│   ├── provider/                    # Capa L9
│   │   ├── __tests__/
│   │   │   ├── *-contract.test.ts
│   │   │   ├── *-acyclic-imports.test.ts
│   │   │   └── *-compositor.smoke.test.tsx
│   │   ├── auth-provider.types.ts
│   │   ├── auth-provider-state.ts
│   │   ├── auth-provider-cleanup.ts
│   │   ├── auth-provider-runtime.refs.ts
│   │   ├── auth-provider-termination.helpers.ts
│   │   ├── auth-provider-*-compositor.ts(x)
│   │   ├── auth-provider-public-actions.ts
│   │   ├── useAuthProvider.ts
│   │   └── index.ts
│   └── session/                     # Dominio congelado F1–F8
├── features/auth/services/          # Service layer canónico
└── app/provider.tsx                 # Provider tree app (invariante)
```

### 7.2 Reglas de ubicación

| Artefacto | Ubicación |
|-----------|-----------|
| Hook público `useX()` | Shell en `shared/context/` |
| Ensamblador | `core/{module}/provider/useXProvider.ts` |
| Compositors | `core/{module}/provider/*-compositor.ts(x)` |
| Tests de contrato | `core/{module}/provider/__tests__/` |
| Tests de regresión de fase | `shared/context/__tests__/auth-phase-{N}-regression.test.ts` |
| Services HTTP | `features/{module}/services/` — **nunca** duplicar en `src/services/` |

### 7.3 Líneas orientativas (Phase-09 certificado)

| Archivo | Objetivo | Observado F9 |
|---------|----------|--------------|
| Shell Context | ≤ **250** | **184** ✅ |
| Ensamblador | ≤ **400** (DT-06 waiver) | **358** ✅ |
| Compositor individual | ≤ **450** | 106–579 (waiver copy-first) |
| public-actions | ≤ **450** | **579** (waiver) |

---

## 8. Convenciones de testing

### 8.1 Pirámide obligatoria por provider complejo

| Nivel | Archivo patrón | Propósito |
|-------|----------------|-----------|
| **Contract** | `{module}-provider-contract.test.ts` | Keys públicas, exports, defaults, wiring estructural contextValue |
| **Acyclic** | `{module}-provider-acyclic-imports.test.ts` | Import policy AC-01…07 |
| **Smoke render** | `{module}-provider-compositor.smoke.test.tsx` | Mount/unmount Provider real, N keys, bootstrap path mínimo |
| **Regression fase** | `auth-phase-{NN}-regression.test.ts` | Manifesto por fase IAM |
| **Regression L9** | `auth-phase-09-regression.test.ts` | Ensamblaje completo post-decomposición |
| **Manifesto** | Suites `shared/context/__tests__/` | Regresión acumulada V1–V8+ |

### 8.2 Gates numéricos (IAM certificado SIGNOFF-02)

| Gate | Criterio |
|------|----------|
| V9.1 | Contract tests — keys + exports |
| V9.2 | Regresión L9 + manifesto dominio |
| V9.3 | AuthGate / ProtectedRoute / provider tree |
| `tsc --noEmit` | Sin errores |
| Smoke manual §8 | Documentado en Validation Report |

### 8.3 Reglas de tests

1. **Contract tests** son estructurales (sin render) salvo smoke dedicado.
2. **No duplicar** toast de error entre hook y componente (ER-02 V2).
3. **Manifesto verde** antes de cerrar cada IMPL.
4. Tras eliminar artefactos temporales de fase, actualizar tests que verificaban su existencia (SIGNOFF-02 patrón V9.2.m).

---

## 9. Convenciones de naming

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Shell | `{Name}Context.tsx` | `AuthContext.tsx` |
| Ensamblador | `use{Name}Provider.ts` | `useAuthProvider.ts` |
| Compositor | `{prefix}-provider-{domain}.compositor.ts(x)` | `auth-provider-bootstrap.compositor.ts` |
| State | `{prefix}-provider-state.ts` | `auth-provider-state.ts` |
| Types | `{prefix}-provider.types.ts` | `auth-provider.types.ts` |
| Public actions | `{prefix}-provider-public-actions.ts` | `auth-provider-public-actions.ts` |
| Hook compositor | `use{Name}Provider{Domain}{Role}` | `useAuthProviderBootstrapEffect` |
| Keys públicas const | `{PREFIX}_PUBLIC_CONTEXT_KEYS` | `AUTH_PROVIDER_PUBLIC_CONTEXT_KEYS` |
| Test contract | `{module}-provider-contract.test.ts` | — |
| Fase regression | `auth-phase-{NN}-regression.test.ts` | — |

**Prefijo:** `{module}` del dominio core (`auth`, futuro `tenant-provider`, etc.).

---

## 10. Checklist para nuevos módulos (Provider decomposition)

Usar cuando un Context supera **~800 líneas** o acumula **≥3 dominios** mezclados.

> **Arch-Gates 0–3** (refactor estructural) — distinto de **Module Gates 0–4** en V2 §11 (sprints módulo ERP).

### Arch-Gate 0 — Diseño

- [ ] Kickoff + Technical Design aprobados
- [ ] Inventario baseline (líneas, exports, keys, effects, closures)
- [ ] Mapa de compositors propuesto
- [ ] Zero feature delta declarado

### Arch-Gate 1 — Estructura

- [ ] Carpeta `src/core/{module}/provider/` creada
- [ ] `{module}-provider.types.ts` con keys públicas + AC constants
- [ ] Test acyclic desde IMPL-02 equivalente

### Arch-Gate 2 — Extracción

- [ ] Copy-first por dominio (strangler incremental)
- [ ] Manifesto/regresión verde por IMPL
- [ ] Shell delega a `useXProvider` antes de slim final

### Arch-Gate 3 — Cierre

- [ ] Shell ≤ 250 líneas (o waiver documentado)
- [ ] 0 imports dominio en shell
- [ ] Contract tests PASS
- [ ] Smoke manual documentado
- [ ] Closure Report + SIGNOFF acta
- [ ] Legacy huérfanos eliminados (grep 0)

---

## 11. Criterios para futuras refactorizaciones

### 11.1 Cuándo SÍ iniciar refactor estructural

| Criterio | Umbral orientativo |
|----------|-------------------|
| Context monolítico | > **800–1000** líneas sostenidas |
| Dominios mezclados | ≥ **3** responsabilidades ortogonales |
| Regresión frágil | Cambio local requiere tocar > **40%** del archivo |
| GAP arquitectónico documentado | Ticket epic aprobado |

### 11.2 Cuándo NO refactorizar

| Situación | Acción |
|-----------|--------|
| Optimización algoritmo / perf | Ticket separado, no mezclar con compositor |
| Cambio UX o API pública | Feature phase, no decomposition phase |
| Deuda en dominio congelado | Ticket dominio (F1–F8), no provider |
| "Cleanup" sin baseline tests | Bloqueado hasta manifesto mínimo |
| Consolidación por estética | Post-F9 debt, no gate |

### 11.3 Metodología oficial — flujo epic

Flujo normativo institucionalizado tras **IAM-FE-PHASE-09 SIGNOFF-02**. Aplica **únicamente** a refactors estructurales core (§11.1–§11.2) — **no** a sprints módulo ERP (V2 §11).

```
Kickoff
  → Technical Design
  → Design Review (aprobación explícita)
  → Implementation Plan
  → IMPL incrementales (manifesto verde entre cada uno)
  → Pre-Signoff Review (READ ONLY — waivers P1/P2/P3)
  → Production Audit (READ ONLY)
  → Validation (+ smoke manual documentado)
  → Closure Report
  → Signoff (acta + eliminación artefactos temporales de fase)
```

| Etapa | Modo | Criterio de salida (resumen) | Norma detallada |
|-------|------|----------------------------|-----------------|
| **Kickoff** | Documental | Objetivos, zero feature delta, dominio congelado declarado | §11.4 · Arch-Gate 0 |
| **Technical Design** | Documental | Arquitectura target, mapa compositors, gates epic | §11.4 · Arch-Gate 0 |
| **Design Review** | Gate humano | Aprobación explícita antes de IMPL-01 | §11.4 |
| **Implementation Plan** | Documental | Tickets IMPL ordenados, regresión planificada | §11.4 |
| **IMPL incrementales** | Implementación | Manifesto/tests verdes por entrega | §10 Arch-Gate 2 · §8 |
| **Pre-Signoff Review** | READ ONLY | Waivers documentados; READY FOR SIGNOFF o lista fixes | §13 L-06, L-07 |
| **Production Audit** | READ ONLY | APPROVED FOR PRODUCTION (≠ Signoff) | §13 L-10 |
| **Validation** | Evidencia | tsc, tests, smoke manual §8 documentado | §8 · §11.4 |
| **Closure Report** | Documental | COMPLETED / COMPLETED WITH DEVIATIONS | §11.4 |
| **Signoff** | Gate documental | Acta APPROVED; legacy/artefactos temporales eliminados | §10 Arch-Gate 3 · §12 #10 |

**Procedimiento operativo (agente / equipo):** `docs/prompts/PROMPT_FRONTEND_MAESTRO.md` **Fase E** — índice de etapas; no duplica reglas de este documento.

**Reglas UX, multiempresa, OpenAPI durante epic:** V2 + contrato OpenAPI — zero feature delta (P-03).

### 11.4 Plantilla artefactos — referencia canónica IAM-FE-PHASE-09

Usar como **plantilla de nombres y secuencia** para futuros epics estructurales. **No copiar** contenido técnico — adaptar al dominio del epic.

| Etapa §11.3 | Patrón artefacto | Referencia canónica (Phase-09) |
|-------------|------------------|-------------------------------|
| Kickoff | `docs/arquitectura/{EPIC}_KICKOFF.md` | `IAM_FE_PHASE_09_KICKOFF.md` |
| Technical Design | `docs/arquitectura/{EPIC}_TECHNICAL_DESIGN.md` | `IAM_FE_PHASE_09_TECHNICAL_DESIGN.md` |
| Implementation Plan | `docs/arquitectura/{EPIC}_IMPLEMENTATION_PLAN.md` | `IAM_FE_PHASE_09_IMPLEMENTATION_PLAN.md` |
| IMPL report | `docs/arquitectura/{EPIC}_IMPL_NN_REPORT.md` | `IAM_FE_PHASE_09_IMPL_01_REPORT.md` … `IMPL_02` |
| Validation | `docs/arquitectura/{EPIC}_VALIDATION_REPORT.md` | `IAM_FE_PHASE_09_VALIDATION_REPORT.md` |
| Closure Report | `docs/arquitectura/{EPIC}_CLOSURE_REPORT.md` | `IAM_FE_PHASE_09_CLOSURE_REPORT.md` |
| Signoff | `docs/arquitectura/{EPIC}_SIGNOFF.md` | `IAM_FE_PHASE_09_SIGNOFF.md` |

Evidencia cierre certificado: §14 (métricas L9 auth). Comportamiento app consumidor: V2 §4.8.

---

## 12. Buenas prácticas derivadas de Phase-09

| # | Práctica |
|---|----------|
| 1 | **Baseline firmado** antes de mover una línea (IMPL-01). |
| 2 | **Grafo de closures congelado** — callbacks post-effect en Fase C, no A. |
| 3 | **Re-export helpers** en shell para no romper tests existentes. |
| 4 | **Interceptor cleanup** con `eject` en return de effect. |
| 5 | **contextValue** en `useMemo` con deps literales del monolito. |
| 6 | **Handlers** en `useCallback` en capa public-actions. |
| 7 | **Refs bundle único** — no duplicar refs entre compositors. |
| 8 | **Provider tree app** intocable salvo ticket plataforma. |
| 9 | **Eliminar legacy** solo tras grep 0 (IMPL-13 patrón). |
| 10 | **Artefactos temporales de fase** eliminados en SIGNOFF, no en producción. |

---

## 13. Lecciones aprendidas (Phase-09)

| # | Lección | Evidencia |
|---|---------|-----------|
| L-01 | Copy-first evita regresiones silenciosas en interceptors/bootstrap | 236 tests verdes post-decomposición |
| L-02 | Contract tests estructurales permiten refactor sin render E2E | V9.1 25/25 |
| L-03 | Orden effects es contrato — no simplificar por estética | DR-P1-05, fases A–D |
| L-04 | Smoke render con path `/login` evita bootstrap HTTP en tests | compositor.smoke.test.tsx |
| L-05 | Tests `.tsx` obligatorios si hay JSX en tests de Provider | error transform esbuild |
| L-06 | Waivers deben documentarse antes de SIGNOFF, no after-the-fact | AC-04-L9-O, budgets |
| L-07 | SIGNOFF es gate documental + cleanup — no confundir con "solo código" | SIGNOFF-01 rejected → SIGNOFF-02 |
| L-08 | Manifesto crece con fases — contar tests post-cambios (244→236 tras cleanup flags) | Validation Report |
| L-09 | SessionUxBinder fuera del compositor evita acoplar UX L7 a L9 | provider.tsx invariante |
| L-10 | Production APPROVED ≠ SIGNOFF — gates G5 y §22.2 #4 son proceso | SIGNOFF-01/02 |

---

## 14. Referencia canónica — L9 IAM Auth Provider

| Métrica | Valor post-SIGNOFF-02 |
|---------|----------------------|
| Shell | `AuthContext.tsx` — **184 líneas** |
| Ensamblador | `useAuthProvider.ts` — **358 líneas** |
| Compositors | **10** archivos `*-compositor.*` |
| Keys `useAuth()` | **36** |
| Exports shell | **39** |
| Tests manifesto auth | **236/236 PASS** |
| Provider tree | `src/app/provider.tsx` — sin cambios F9 |
| Artefactos rollback | **Eliminados** (SIGNOFF-02) |

**Documentación Phase-09:**

| Documento | Uso |
|-----------|-----|
| `IAM_FE_PHASE_09_KICKOFF.md` | Objetivos originales |
| `IAM_FE_PHASE_09_TECHNICAL_DESIGN.md` | Diseño L9 detallado |
| `IAM_FE_PHASE_09_IMPLEMENTATION_PLAN.md` | IMPL-01…14, AC rules |
| `IAM_FE_PHASE_09_VALIDATION_REPORT.md` | Evidencia tests + smoke |
| `IAM_FE_PHASE_09_CLOSURE_REPORT.md` | Cierre epic |
| `IAM_FE_PHASE_09_SIGNOFF.md` | Acta SIGNOFF APPROVED |

**Reglas consumo app (comportamiento auth):** V2 §4.8 AUTH-01…05, IMP-01…04 — no replicar aquí.

**Metodología epic replicable:** §11.3–§11.4 · procedimiento agente → `PROMPT_FRONTEND_MAESTRO.md` Fase E.

---

## 15. Aplicación a módulos futuros (INV, ORG, etc.)

Phase-09 establece el **patrón**; módulos ERP existentes (INV, ORG) ya usan patrones company-scoped documentados en V2 §4.5.

| Contexto | Patrón Baseline V1 | Patrón V2 existente |
|----------|-------------------|---------------------|
| Provider monolítico core (auth) | **L9 Compositors** | — |
| Catálogos company-scoped | Shell delgado si crece | Plantilla A + `use*CompanyQueryGate` |
| Transaccional B-F/B-L | No aplica compositor | Cabecera + detalle embebido |
| Multiempresa | No selector local | JWT `scopeEmpresaId` |

**Regla:** antes de aplicar L9 a otro módulo, verificar clasificación plantilla V2 §2.1 — compositor solo para **orquestadores core** multi-dominio.

---

## 16. Control de versiones

| Versión | Fecha | Cambio |
|---------|-------|--------|
| **1.0** | 2026-06-21 | Baseline inicial post IAM-FE-PHASE-09 SIGNOFF-02 |
| **1.1** | 2026-06-19 | Integración ecosistema estándares (ERP-FRONTEND-STANDARDS-UPDATE-01A): precedencia, §0 Relación V2, Arch-Gates, pointer §4.8 |
| **1.2** | 2026-06-19 | Metodología oficial epic §11.3–§11.4 (ERP-FRONTEND-STANDARDS-UPDATE-01B); plantilla IAM-FE-PHASE-09; pointer PROMPT Fase E |

**Congelamiento:** cambios a este documento requieren ticket **ERP-FRONTEND-ARCHITECTURE-BASELINE-XX** con Design Review.

---

**Fin — ERP Frontend Architecture Baseline V1**
