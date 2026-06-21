# IAM-FE-PHASE-09 — Plan Definitivo de Implementación

**Ticket:** IAM-FE-PHASE-09-IMPLEMENTATION-PLAN-01  
**Epic:** IAM-FE-PHASE-09-AUTH-REFACTOR  
**Versión:** 1.0  
**Estado:** IMPLEMENTATION PLANNING — sin código funcional movido  
**Fecha:** 2026-06-19  
**Entradas obligatorias:**
- IAM-FE-PHASE-09-KICKOFF-01
- IAM-FE-PHASE-09-DESIGN-01 (`IAM_FE_PHASE_09_TECHNICAL_DESIGN.md` v1.0)
- IAM-FE-PHASE-09-DESIGN-REVIEW-01 — **DESIGN APPROVED** (condicionado DR-P1-01…05)

> Este documento es el plan **definitivo** previo a IMPL-02.  
> **Prohibido** mover bloques AuthContext, eliminar archivos o alterar comportamiento hasta cerrar IMPL-01 + checklist §25.

---

## 1. Estado oficial de la fase

| Campo | Valor |
|-------|-------|
| **Fase** | IAM-FE-PHASE-09 — AuthContext Decomposition |
| **Kickoff** | ✅ COMPLETE |
| **Design** | ✅ COMPLETE (v1.0) |
| **Design Review** | ✅ APPROVED — 0 P0; 5 P1 → resueltos en §2 |
| **Implementation Plan** | ✅ Este documento |
| **IMPL-01** | ⏳ Pendiente (arranque) |
| **IMPL-02…14** | 🔒 Bloqueados hasta checklist §25 |
| **Baseline código** | `AuthContext.tsx` ~3.068 líneas; `src/core/auth/provider/` **no existe** |
| **Regresión baseline** | V1–V8 manifesto **116/116** verde (post-F8 SIGNOFF) |
| **F1–F8** | Completamente congeladas |

---

## 2. Resolución formal de cada DR-P1

### DR-P1-01 — Conteo campos `useAuth()` (34 vs 36)

| Campo | Resolución |
|-------|------------|
| **Problema** | V9.1.c del diseño decía 34 campos; `AuthContextType` tiene **36** |
| **Decisión** | Contract test V9.1 usará lista canónica de **36 keys** (§11.1 diseño + verificación código L676–721) |
| **Artefacto** | `AUTH_CONTEXT_PUBLIC_KEYS_V9` constante en `auth-provider-contract.test.ts` (IMPL-04) |
| **Gate** | Test falla si `Object.keys(useAuth())` difiere del set canónico |

**Lista canónica 36 campos:**  
`auth`, `setAuthFromLogin`, `completeEmpresaSelection`, `cambiarEmpresaActiva`, `logout`, `logoutAllSessions`, `runSessionValidityProbe`, `isAuthenticated`, `loading`, `authInitialized`, `isBootstrapped`, `hasRole`, `accessLevel`, `isSuperAdmin`, `userType`, `clienteInfo`, `permissions`, `menuModulos`, `menuPermissionsReady`, `empresaActivaId`, `empresasElegibles`, `empresasDisponibles`, `requiereSeleccionEmpresa`, `esAdminCliente`, `hasEmpresaActivaFlag`, `canAccessErp`, `mustSelectEmpresa`, `reloadMenuAndPermissions`, `isImpersonation`, `impersonatedBy`, `impersonatedByUsername`, `impersonationClienteLabel`, `startImpersonation`, `endImpersonation`, `requiresPasswordChange`, `completePasswordChange`.

---

### DR-P1-02 — Manifesto V1 — archivo inexistente

| Campo | Resolución |
|-------|------------|
| **Problema** | Diseño §17 referencia `auth-phase-01-regression.test.ts` — **no existe** |
| **Decisión** | Mapa manifesto V1 oficial (tabla abajo) registrado en IMPL-01; diseño §17 se interpreta con este mapa |
| **Artefacto** | `docs/arquitectura/IAM_FE_PHASE_09_MANIFESTO_MAP.md` (opcional) o sección en reporte IMPL-01 |

**Mapa manifesto V1 (oficial):**

| Escenario | Archivo(s) canónico(s) |
|-----------|------------------------|
| V1.1–V1.4 | `auth-phase-02-closure.test.ts` (bloque regresión Fase 1) |
| V1 hydrate DI | `auth-hydrate-termination-di.test.ts` |
| V1 session core | `session/__tests__/session-refresh-hydrate.test.ts`, `session-post-refresh.test.ts`, `session-claims-sync.test.ts` |

**Manifesto completo V1–V8 (CI gate):**

| Bloque | Archivo principal |
|--------|-------------------|
| V1 | `auth-phase-02-closure.test.ts` + hydrate tests arriba |
| V2 | `auth-phase-02-closure.test.ts` + `auth-terminate-session-deps.test.ts` + `auth-runtime-termination-wiring.test.ts` |
| V3 | `auth-phase-03-regression.test.ts` + `auth-phase-03-integration.test.ts` |
| V4 | `auth-phase-04-regression.test.ts` |
| V5 | `auth-phase-05-regression.test.ts` |
| V6 | `auth-phase-06-regression.test.ts` |
| V7 | `auth-phase-07-regression.test.ts` |
| V8 | `auth-phase-08-regression.test.ts` |
| Session suite | `src/core/auth/session/__tests__/**` |

**Comando gate estándar (todos los IMPL post-05):**

```bash
npm run test -- src/shared/context/__tests__/ src/core/auth/session/__tests__/
npx tsc --noEmit
```

---

### DR-P1-03 — `isRefreshingPromise` ↔ helpers ↔ interceptors

| Campo | Resolución |
|-------|------------|
| **Problema** | `getTerminateSessionDeps` default muta `isRefreshingPromise` module-level; split helpers/runtime sin norma |
| **Decisión** | **Un solo módulo singleton:** `auth-provider-runtime.refs.ts` |
| **API normativa** | Ver §10 — `AuthRefreshRuntime` |

**Reglas IMPL-05/08:**

1. `isRefreshingPromise` vive **únicamente** en `auth-provider-runtime.refs.ts`.
2. `getTerminateSessionDeps` importa `clearRefreshingPromise` desde runtime.refs (no closure local).
3. Interceptors importan `getRefreshingPromise` / `setRefreshingPromise` del **mismo** módulo.
4. **Prohibido** duplicar variable module-level en helpers o interceptors.

---

### DR-P1-04 — Anti-ciclos entre compositor files

| Campo | Resolución |
|-------|------------|
| **Problema** | Bootstrap↔termination↔refresh acoplados; riesgo import circular entre archivos compositor |
| **Decisión** | Patrón **Compositor-as-Factories** — ver §9 |

**Reglas normativas:**

1. Compositor files exportan **solo** funciones factory / hooks `createXRuntime(deps)` o `useXRuntime(slice)`.
2. **Prohibido** `import` entre `auth-provider-*-compositor.ts` (excepto `types`, `runtime.refs`, `termination.helpers`, `cleanup`).
3. **Único ensamblador:** `useAuthProvider.ts` importa todos los compositors y construye `AuthProviderRuntime`.
4. ESLint / script IMPL-02: `eslint-plugin-import` rule o script `verify-provider-acyclic.mjs` en CI F9.

---

### DR-P1-05 — Orden closures y hooks vs monolito

| Campo | Resolución |
|-------|------------|
| **Problema** | Extraer a hooks anidados puede alterar orden de definición y closures |
| **Decisión** | Grafo de definición **congelado** documentado en IMPL-01; copy-first §11 |

**Orden de definición obligatorio en `useAuthProvider.ts` (equivalente monolito):**

```
1. queryClient
2. useAuthProviderState()           → state, refs, setters, E1–E3
3. useAuthRefreshRuntime(refs)      → singleton accessors
4. createPerformLocalAuthCleanup    → cleanup API
5. useAuthTelemetryUxRuntime        → F7/F8 termination wiring
6. useAuthTerminationRuntime        → runTerminateSession, doLogout, deps
7. useAuthPermissionsRuntime
8. useAuthEmpresaRuntime
9. useAuthImpersonationRuntime
10. useAuthBootstrapRuntime
11. useAuthRefreshWiringRuntime     → post-refresh, processQueue (usa bootstrap+termination)
12. useAuthAuthSyncRuntime
13. useAuthInterceptorsRuntime        → registra E5/E6 handlers (lazy refs a 10–12)
14. useAuthPublicActions
15. useMemo context value             → mismas deps array que monolito L2930–2964
16. useEffect E4 DEV mount            → literal preservado
17. useAuthInterceptorsEffects(E5,E6) → deps arrays copiados
18. useAuthBootstrapEffect(E7)        → deps array copiado L2465
19. return { value, binders }
```

**Effects orden:** E1–E3 (state) → E4 → E5 → E6 → E7 — **invariante**.

---

## 3. Orden definitivo IMPL-01…IMPL-14

| # | ID | Resumen | Depende de |
|---|-----|---------|------------|
| 1 | IMPL-01 | Baseline + grafo closures + manifesto map | — |
| 2 | IMPL-02 | Types + `AuthProviderRuntime` + anti-cycle verify | 01 |
| 3 | IMPL-03 | Flags rollback F9 | 02 |
| 4 | IMPL-04 | V9.1 contract tests (36 keys + exports) | 02 |
| 5 | IMPL-05 | Move termination helpers + runtime.refs + re-export | 02–04 |
| 6 | IMPL-06 | State bundle + cleanup factories | 05 |
| 7 | IMPL-07 | Bootstrap compositor + wire E7 | 06 |
| 8 | IMPL-08 | Interceptors + refresh compositors + E5/E6 | 07 |
| 9 | IMPL-09 | Termination compositor runtime | 08 |
| 10 | IMPL-10 | Impersonation compositor | 09 |
| 11 | IMPL-11 | Empresa + permissions compositors | 10 |
| 12 | IMPL-12 | Auth-sync + telemetry-ux + public-actions + useAuthProvider + slim shell | 11 |
| 13 | IMPL-13 | Delete legacy huérfanos | 12 |
| 14 | IMPL-14 | V9 regresión + V9.3 tests + VALIDATION smoke | 13 |

---

## 4. Gates obligatorios por implementación

| IMPL | Gates obligatorios | Gates opcionales |
|------|-------------------|------------------|
| **01** | Review plan + grafo firmado | — |
| **02** | `tsc --noEmit`; anti-cycle script pass | — |
| **03** | Unit flag test | — |
| **04** | V9.1 baseline verde | — |
| **05** | V2,V3 helper tests; **full manifesto**; `tsc` | grep exports |
| **06** | `tsc`; unit state smoke | — |
| **07** | V1 manifesto; bootstrap manual Schema A/B | session hydrate tests |
| **08** | V5; `session-interceptor-flow.test.ts` | V8 refresh telemetry |
| **09** | V2.6; V3 logout_all/probe wiring | — |
| **10** | V6; smoke platform doc | — |
| **11** | V1.3; menu load | ORG gates manual |
| **12** | V9.1; V7; V8; **full manifesto 116/116**; AuthContext ≤250 líneas | — |
| **13** | grep 0 legacy imports; full manifesto | — |
| **14** | V9.2 + V9.3; smoke §8 manual | rollback L1 drill |

---

## 5. Lista exacta de archivos nuevos

### 5.1 Producción (`src/core/auth/provider/`)

| Archivo | IMPL |
|---------|------|
| `auth-provider.flags.ts` | 03 |
| `auth-provider.types.ts` | 02 |
| `auth-provider-state.ts` | 06 |
| `auth-provider-runtime.refs.ts` | 05 |
| `auth-provider-cleanup.ts` | 06 |
| `auth-provider-termination.helpers.ts` | 05 |
| `auth-provider-termination.compositor.ts` | 09 |
| `auth-provider-bootstrap.compositor.ts` | 07 |
| `auth-provider-interceptors.compositor.ts` | 08 |
| `auth-provider-refresh.compositor.ts` | 08 |
| `auth-provider-impersonation.compositor.ts` | 10 |
| `auth-provider-empresa.compositor.ts` | 11 |
| `auth-provider-permissions.compositor.ts` | 11 |
| `auth-provider-auth-sync.compositor.ts` | 12 |
| `auth-provider-telemetry-ux.compositor.ts` | 12 |
| `auth-provider-public-actions.ts` | 12 |
| `useAuthProvider.ts` | 12 |
| `index.ts` (barrel interno) | 12 |

### 5.2 Rollback (temporal)

| Archivo | IMPL | Eliminado en |
|---------|------|--------------|
| `AuthContext.monolith.snapshot.ts` | 05 | SIGNOFF F9 |

> Copy read-only del monolito pre-IMPL-05; solo importado si `AUTH_PROVIDER_V9_COMPOSITOR_ENABLED === false`.

### 5.3 Tests nuevos

| Archivo | IMPL |
|---------|------|
| `provider/__tests__/auth-provider.flags.test.ts` | 03 |
| `provider/__tests__/auth-provider-contract.test.ts` | 04 |
| `provider/__tests__/auth-provider-runtime-refs.test.ts` | 05 |
| `provider/__tests__/auth-provider-acyclic-imports.test.ts` | 02 |
| `provider/__tests__/auth-provider-compositor.smoke.test.ts` | 12 |
| `shared/context/__tests__/auth-phase-09-regression.test.ts` | 14 |
| `core/auth/__tests__/AuthGate.test.tsx` | 14 |
| `app/__tests__/provider-tree.test.tsx` | 14 |

### 5.4 Tooling (opcional)

| Archivo | IMPL |
|---------|------|
| `scripts/verify-provider-acyclic.mjs` | 02 |

---

## 6. Lista exacta de archivos modificados

| Archivo | IMPL | Naturaleza cambio |
|---------|------|-------------------|
| `src/shared/context/AuthContext.tsx` | 05→12 | Re-exports; delegación progresiva; slim shell IMPL-12 |
| `src/shared/components/__tests__/ProtectedRoute.test.tsx` | 14 | Mocks useAuth — sin cambiar contrato |

**Archivos NO modificados (verificados post-IMPL-12):**

- `src/app/provider.tsx` — **0 cambios** (provider tree invariante)
- `src/core/auth/AuthGate.tsx`
- `src/core/auth/session/**` — cuerpos congelados F1–F8
- `src/features/tenant/components/TenantContext.tsx` — canónico intacto
- `src/features/auth/services/auth.service.ts` — canónico intacto

---

## 7. Lista exacta de archivos congelados

### 7.1 Session modules F1–F8 (cuerpos)

Todos bajo `src/core/auth/session/` excepto `__tests__/` (tests pueden extenderse solo en F9 regression, no alterar expectativas manifesto):

- F1: `session-refresh-hydrate.ts`, `session-post-refresh.ts`, `session-claims-snapshot.ts`, `refresh-hydrate.flags.ts`, …
- F2: `session-terminate.ts`, `session-termination-reason.ts`, `session-termination-ux.ts`, `session-termination.flags.ts`, …
- F3: `session-logout-all.ts`, `session-remote-probe.ts`, `useSessionRemoteProbe.ts`, `session-logout-v3.flags.ts`, …
- F4: `session-auth-sync-*.ts`, `useAuthSyncListener.ts`, …
- F5: `session-refresh-resilience.ts`, `session-refresh-retry.policy.ts`, `session-cambiar-empresa-l02.ts`, …
- F6: `session-impersonation-*.ts`, …
- F7: `session-ux-*.ts`, `session-menu-ux.ts`, `session-bootstrap-gate.policy.ts`, `components/SessionUxBinder.tsx`, `components/SessionBootstrapGate.tsx`, …
- F8: `session-telemetry*.ts`, `session-telemetry-auth-wiring.ts`, …

### 7.2 Otros congelados

| Área | Archivos |
|------|----------|
| OpenAPI / services contrato | `features/auth/services/auth.service.ts`, `session.service.ts`, … |
| UX L7 externa | `SessionUxBinder`, `SessionBootstrapGate`, `session-ux-presenter*.ts` |
| Permission | `PermissionContext.tsx` |
| Tenant canónico | `features/tenant/components/TenantContext.tsx` |

### 7.3 Eliminación solo IMPL-13

| Archivo | Condición |
|---------|-----------|
| `src/services/auth.service.ts` | grep 0 imports |
| `src/context/TenantContext.tsx` | grep 0 imports |

---

## 8. Mapa de dependencias entre compositors

```
                    useAuthProvider.ts (ENSAMBLADOR ÚNICO)
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
auth-provider-state    auth-provider-runtime.refs   auth-provider-cleanup
    │                         │
    └────────────┬────────────┘
                 ▼
    auth-provider-telemetry-ux.compositor
                 │
                 ▼
    auth-provider-termination.compositor
                 │
       ┌─────────┼─────────┬──────────────┐
       ▼         ▼         ▼              ▼
 permissions  empresa  impersonation   (helpers)
       │         │         │
       └────┬────┴────┬────┘
            ▼         ▼
         bootstrap  refresh.wiring
            │         │
            └────┬────┘
                 ▼
         auth-sync.compositor
                 │
                 ▼
      interceptors.compositor  ←── consume refs lazy a bootstrap/termination/refresh
                 │
                 ▼
      auth-provider-public-actions
                 │
                 ▼
           context value useMemo
```

**Flujo datos:** compositors **no se importan entre sí** — reciben slices de `AuthProviderRuntime` construido secuencialmente en `useAuthProvider`.

---

## 9. Reglas anti-imports circulares

| # | Regla |
|---|-------|
| AC-01 | `session/*` **nunca** importa `provider/*` |
| AC-02 | `auth-provider-*-compositor.ts` **nunca** importa otro `*-compositor.ts` |
| AC-03 | Permitido: compositor → `types`, `runtime.refs`, `cleanup`, `termination.helpers`, `session/*`, `features/*` |
| AC-04 | `useAuthProvider.ts` es el **único** importador de todos los compositors |
| AC-05 | `AuthContext.tsx` post-IMPL-12 importa solo `useAuthProvider` + re-export helpers |
| AC-06 | Test `auth-provider-acyclic-imports.test.ts` valida grafo estático |
| AC-07 | `termination.helpers` importa `runtime.refs` — **no** al revés |

---

## 10. Contrato definitivo de AuthProviderRuntime

```typescript
// auth-provider.types.ts — contrato normativo IMPL-02

interface AuthProviderState {
  auth: AuthState;
  loading: boolean;
  authInitialized: boolean;
  isBootstrapped: boolean;
  accessLevel: number;
  isSuperAdmin: boolean;
  userType: string;
  clienteInfo: ClienteInfo | null;
  permissions: UserPermissions | null;
  menuModulos: AuthMenuModulo[] | null;
  menuPermissionsReady: boolean;
  empresaActivaId: string | null;
  empresasElegibles: EmpresaOption[];
  requiereSeleccionEmpresa: boolean;
  esAdminCliente: boolean;
  isImpersonation: boolean;
  impersonatedBy: string | null;
  impersonatedByUsername: string | null;
  impersonationClienteLabel: string | null;
}

interface AuthProviderRefs {
  authRef: React.MutableRefObject<AuthState>;
  loadingRef: React.MutableRefObject<boolean>;
  empresaActivaIdRef: React.MutableRefObject<string | null>;
  failedQueueRef: React.MutableRefObject<FailedQueueEntry[]>;
  isTerminatingRef: React.MutableRefObject<boolean>;
  isLogoutAllInFlightRef: React.MutableRefObject<boolean>;
  isSessionValidityProbeInFlightRef: React.MutableRefObject<boolean>;
  terminationCallerHintRef: React.MutableRefObject<SessionTerminationCaller | undefined>;
  hydrateFetchMeErrorRef: React.MutableRefObject<unknown>;
  isInitializedRef: React.MutableRefObject<boolean>;
  sessionMenuSnapshotRef: React.MutableRefObject<AuthMenuModulo[] | null>;
}

/** DR-P1-03 — singleton module-level F5 */
interface AuthRefreshRuntime {
  getRefreshingPromise: () => RefreshPromise;
  setRefreshingPromise: (p: RefreshPromise) => void;
  clearRefreshingPromise: () => void;
}

interface AuthCleanupApi {
  performLocalAuthCleanup: (preservePreLoginBranding: boolean) => void;
  processQueue: (error: Error | null, token: string | null) => void;
}

interface AuthTerminationRuntime {
  runTerminateSession: (input: TerminateSessionInput) => Promise<void>;
  doLogout: (callServer?: boolean) => Promise<void>;
  logoutAllSessions: () => Promise<void>;
  runSessionValidityProbeForSession: () => Promise<void>;
  legacyLogoutDeps: LegacySessionLogoutDeps;
  redirectToLoginAfterTermination: (path: string) => void;
  showTerminationToastAfterTermination: (profile: SessionTerminationUxProfile) => void;
}

interface AuthBootstrapRuntime {
  initializeAuth: () => Promise<UserData | null>;
  runHydrateSessionCore: (mode: HydrateMode) => Promise<UserData | null>;
  runBootstrap: () => Promise<void>; // effect E7 body
}

interface AuthRefreshWiringRuntime {
  runPostRefreshSession: (newToken: string, prior: SessionClaimsSnapshot) => Promise<unknown>;
  skipsTokenRefresh: (url?: string) => boolean;
  isPublicEndpoint: (url?: string) => boolean;
}

interface AuthImpersonationRuntime {
  syncImpersonationFromToken: (token: string | null) => void;
  clearImpersonationState: () => void;
  isImpersonationActive: () => boolean;
  restorePlatformSession: (options?: { redirectToSuperAdmin?: boolean }) => Promise<void>;
  runImpersonationControlledExit: (input: ImpersonationExitInput) => Promise<void>;
  applyInboundImpersonationExitStorageCleanup: (accessToken: string) => void;
}

interface AuthEmpresaRuntime {
  syncEmpresaSession: (user: UserData | null, token: string | null) => void;
  loadEmpresasElegiblesForSession: (user: UserData) => Promise<EmpresaOption[]>;
  invalidateSelectionSession: () => void;
}

interface AuthPermissionsRuntime {
  loadMenuAndPermissionsFromAuthMenu: (user: UserData | null, ux?: LoadMenuUxOptions) => Promise<AuthMenuModulo[] | null>;
  updateAccessLevels: (user: UserData | null) => void;
  reloadMenuAndPermissions: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
  shouldSkipErpMenuLoad: (user: UserData | null, token: string | null) => boolean;
}

interface AuthAuthSyncRuntime {
  emitAuthSyncSessionToken: EmitAuthSyncFn;
  getAuthSyncListenerDeps: () => ApplyInboundAuthSyncDeps;
}

interface AuthTelemetryUxRuntime {
  composedTerminationEmitter: TerminationEventEmitter;
  emitRefreshOutcome: typeof emitSessionRefreshOutcomeTelemetry;
  // … resto wiring L8 pasivo — mismas firmas session-telemetry-auth-wiring
}

interface AuthPublicActions {
  setAuthFromLogin: AuthContextType['setAuthFromLogin'];
  completeEmpresaSelection: AuthContextType['completeEmpresaSelection'];
  cambiarEmpresaActiva: AuthContextType['cambiarEmpresaActiva'];
  logout: AuthContextType['logout'];
  startImpersonation: AuthContextType['startImpersonation'];
  endImpersonation: AuthContextType['endImpersonation'];
  completePasswordChange: AuthContextType['completePasswordChange'];
  applyFullSessionToken: (response: Token) => Promise<AuthLoginSession | null>;
}

interface AuthProviderRuntime {
  state: AuthProviderState;
  setters: AuthProviderSetters;
  refs: AuthProviderRefs;
  queryClient: QueryClient;
  refreshRuntime: AuthRefreshRuntime;
  cleanup: AuthCleanupApi;
  telemetryUx: AuthTelemetryUxRuntime;
  termination: AuthTerminationRuntime;
  permissions: AuthPermissionsRuntime;
  empresa: AuthEmpresaRuntime;
  impersonation: AuthImpersonationRuntime;
  bootstrap: AuthBootstrapRuntime;
  refresh: AuthRefreshWiringRuntime;
  authSync: AuthAuthSyncRuntime;
  publicActions: AuthPublicActions;
}

interface AuthProviderBinders {
  authSyncListener: ReactNode;
  remoteProbe: ReactNode;
  telemetryEmitted: ReactNode;
  telemetryAuthSync: ReactNode;
}
```

---

## 11. Estrategia copy-first verificable

| Paso | Acción |
|------|--------|
| 1 | Seleccionar bloque por dominio (1 IMPL = 1 dominio principal) |
| 2 | Copiar literal a archivo destino — **sin** rename variables |
| 3 | Importar destino desde AuthContext; eliminar bloque original |
| 4 | `git diff` — solo imports/path changes + movimiento |
| 5 | Ejecutar gate IMPL |
| 6 | Opcional: script diff similarity ≥95% líneas no-blank (IMPL-01 tooling) |

**Prohibido en copy-first:** refactor algoritmo, merge funciones, simplificar condicionales, reordenar branches.

---

## 12. Estrategia preservar closures y orden de hooks

- Grafo §2 DR-P1-05 es **normativo**.
- `useMemo` / `useCallback` **deps arrays copiados literal** del monolito (AuthContext L2930–2964 y equivalentes).
- Interceptors E5/E6: handlers cerrados sobre `refs.*.current` — **no** capturar state React directo donde monolito usa refs.
- Bootstrap E7: deps array = copia exacta L2465.
- Compositor hooks introducidos en IMPL-12 **solo** si retornan objetos estables equivalentes a callbacks monolito.

---

## 13. Estrategia preservar useAuth() byte-compatible

| Mecanismo | Detalle |
|-----------|---------|
| V9.1 contract | 36 keys + tipos inferidos pre/post |
| `isAuthenticated` | `!!auth.token && !!auth.user` — test dedicado V9.1.e |
| `empresasDisponibles` | alias `=== empresasElegibles` — V9.1.f |
| Default context | snapshot stubs async idénticos L728–765 |
| Context value | `buildAuthContextValue` copia literal objeto L2891–2928 |

---

## 14. Estrategia preservar exports usados por tests

**Re-export obligatorio desde `@/shared/context/AuthContext` (IMPL-05):**

| Categoría | Símbolos (42 export surface) |
|-----------|------------------------------|
| Const | `AUTH_REFRESH_TERMINATION_URL`, `LEGACY_SESSION_QUEUE_ERROR_MESSAGE` |
| Interfaces | `GetTerminateSessionDepsParams`, `AuthTerminationToastApi`, `LegacySessionLogoutDeps`, `RunSessionTerminationExitOptions`, `GetLogoutAllFlowDepsParams`, `SessionValidityProbeDeps`, `GetSessionValidityProbeDepsParams`, `ExecuteClassifiedTerminationOptions`, `HydrateFetchMeErrorRef`, `CreateTerminateFromHydrateFailureOptions` |
| Functions | 20 helpers termination/probe/hydrate (§5.1 diseño) |
| Runtime | `AuthProvider`, `useAuth` |

**Test estático V9.1.d:** lista allowlist 42 símbolos exportados — falla si falta alguno.

**Consumidores verificados (no cambiar import path):**

- `auth-terminate-session-deps.test.ts`
- `auth-hydrate-termination-di.test.ts`
- `auth-phase-02-closure.test.ts`
- `auth-phase-03-integration.test.ts`
- `auth-phase-03-regression.test.ts`
- `auth-phase-04-regression.test.ts`
- `auth-phase-05-regression.test.ts`
- `auth-logout-all.test.ts`
- `auth-runtime-termination-wiring.test.ts`
- `auth-session-validity-probe.test.ts`
- `auth-session-termination-flags-wiring.test.ts`
- `auth-logout-terminate-migration.test.ts`
- `auth-termination-ux-wiring.test.ts`

---

## 15. Estrategia preservar provider tree

**Invariante absoluto — 0 edits `provider.tsx`:**

```
QueryClientProvider
  └ ThemeProvider
      └ AuthProvider                    ← shell delega useAuthProvider
          └ SessionUxBinder             ← F7 externo
              └ AuthGate
                  └ TenantProvider      ← canónico features/tenant
                      └ PermissionProvider
                          └ AppReadyGate
                              └ …
```

Test `provider-tree.test.tsx` (IMPL-14): snapshot orden JSX children.

---

## 16. Estrategia preservar binders F3/F4/F8

| Orden | Componente | Flag | Props source |
|-------|------------|------|--------------|
| 1 | `AuthSyncListenerBinder` | `SESSION_AUTH_SYNC_V4_ENABLED` | `getAuthSyncListenerDeps` |
| 2 | `SessionRemoteProbeBinder` | `SESSION_REMOTE_PROBE_ENABLED` | runtime state refs |
| 3 | `SessionTelemetryAuthSyncEmittedBinder` | `SESSION_TELEMETRY_V8_ENABLED` | flag only |
| 4 | `SessionTelemetryAuthSyncBinder` | `SESSION_TELEMETRY_V8_ENABLED` | flag only |

**Norma:** JSX copiado literal desde AuthContext L3035–3054; flags/props sin rename.

---

## 17. Estrategia preservar bootstrap

- Effect E7 body → `auth-provider-bootstrap.compositor.ts` función `runBootstrap` **copy literal** L2170–2464.
- Ramas impersonation delegan a `AuthImpersonationRuntime` — **sin** reimplementar F6 policies.
- `waitForEmpresaSelectionHydration`, `executeRefreshWithResilience`, `initializeAuth` — mismos calls.
- Telemetry: `trackSessionBootstrapCorrelation`, `emitSessionBootstrapCompletedTelemetry` — wiring preservado.
- Gate: V1 manifesto + manual Schema A/B login.

---

## 18. Estrategia preservar refresh

- Singleton `isRefreshingPromise` → §10 `AuthRefreshRuntime` (DR-P1-03).
- Response interceptor refresh block → copy literal; single-flight leader/follower intacto.
- `executeRefreshWithResilience` — **no** modificar; mismo `{ callRefresh: () => authService.refreshToken() }`.
- Post-refresh: `runPostRefreshSession` → `applyPostRefreshSession` F1 congelado.
- L02 guard: `registerCambiarEmpresaL02Guard` / `clearCambiarEmpresaL02Guard` — mismos puntos.
- Gate: V5 + interceptor tests.

---

## 19. Estrategia preservar termination

- Helpers → move literal IMPL-05; runtime wiring → IMPL-09.
- `getTerminateSessionDeps` factory — mismo contrato; `clearRefreshingPromise` desde runtime.refs.
- `composeTerminationEventEmitters(authSync, telemetry)` — orden preservado.
- `runSessionTerminationExit` dispatcher V2/legacy — sin cambio.
- Gate: V2 manifesto + tests deps.

---

## 20. Estrategia preservar impersonation

- `syncImpersonationFromToken`, platform parent session, support session — copy literal bloque L849–1754 subset.
- `runImpersonationControlledExit` → `executeImpersonationControlledExit` F6 congelado.
- Bootstrap impersonation branches invocan runtime impersonation — **no** inline reescritura.
- Gate: V6 + smoke platform impersonate → ERP → exit.

---

## 21. Estrategia preservar empresa

- `syncEmpresaSession`, `loadEmpresasElegiblesForSession` — copy literal.
- `completeEmpresaSelection`, `cambiarEmpresaActiva` en public-actions — emit auth-sync + L02 guard preserved.
- `canAccessErp` / `mustSelectEmpresa` — `useMemo` deps `empresaFlowInput` literal.
- Gate: V1.3 + cambio empresa manual.

---

## 22. Estrategia preservar permissions

- `loadMenuAndPermissionsFromAuthMenu` — copy literal; `menuService.getAuthMenu()` unchanged.
- `updateAccessLevels`, `buildRoutePermissionsFromMenu` — preserved.
- `menuPermissionsReady` semantics — gate PermissionGuard unchanged.
- Gate: V7 + permission loading tests.

---

## 23. Estrategia preservar telemetry L8

- **Prohibido** modificar cuerpos `session-telemetry-*`, `session-telemetry-auth-wiring.ts`.
- Wiring movido a `auth-provider-telemetry-ux.compositor.ts` — solo instanciación factories L8-G.
- `terminationCallerHintRef` permanece en refs bundle.
- `SessionTelemetry*Binder` JSX — copy literal; pasivo only.
- Gate: V8.1, V8.2 + `auth-phase-08-regression.test.ts`.

---

## 24. Estrategia rollback L1–L4

| Nivel | Trigger | Acción |
|-------|---------|--------|
| **L1** | Regresión pre-merge VALIDATION | `VITE_AUTH_PROVIDER_V9_COMPOSITOR=false` → load `AuthContext.monolith.snapshot.ts` |
| **L2** | Fallo dominio aislado | `git revert` commit IMPL-n |
| **L3** | V9.1 roto / multi-dominio | Revert rama F9 completa → post-F8 SIGNOFF |
| **L4** | P0 producción | Hotfix fuera F9 sobre F8 congelado — ticket independiente |

**IMPL-03:** flag default `true`.  
**SIGNOFF F9:** eliminar snapshot monolith + flag rollback.

**Drill L1:** ejecutar una vez en VALIDATION (G10 opcional).

---

## 25. Checklist antes de iniciar IMPL-02

| # | Criterio | Responsable | Estado |
|---|----------|-------------|--------|
| 1 | IMPL-01 completado — baseline 3068 líneas firmado | IMPL | ☐ |
| 2 | Grafo closures §2 DR-P1-05 documentado en IMPL-01 report | IMPL | ☐ |
| 3 | Mapa manifesto V1 §2 DR-P1-02 publicado | IMPL | ☐ |
| 4 | Lista 36 keys useAuth §2 DR-P1-01 en contract spec | IMPL | ☐ |
| 5 | `auth-provider.types.ts` spec §10 revisada | Arch | ☐ |
| 6 | Anti-cycle rules §9 aceptadas | Arch | ☐ |
| 7 | `runtime.refs` API §2 DR-P1-03 aceptada | Arch | ☐ |
| 8 | DESIGN APPROVED ack — 0 P0 | Review | ✅ |
| 9 | Branch F9 creada; CI verde pre-cambios | DevOps | ☐ |
| 10 | Snapshot monolith plan IMPL-05 acordado | IMPL | ☐ |
| 11 | Equipo ack: zero UX / zero OpenAPI / zero useAuth delta | Team | ☐ |
| 12 | IMPL-01 **no** movió código funcional | Gate | ☐ |

**Regla:** IMPL-02 **bloqueado** hasta ☐→✅ en ítems 1–7, 9–12.

---

## Tabla de ejecución IMPL-01…IMPL-14

| IMPL | Entregable | Archivos nuevos | Archivos modificados | Gate principal | Est. riesgo |
|------|------------|-----------------|----------------------|----------------|-------------|
| **01** | Baseline + grafo + manifesto map | 0 prod | 0 prod (doc/report) | Review | Bajo |
| **02** | Types + Runtime contract + acyclic test | types, acyclic test, script? | 0 | tsc | Bajo |
| **03** | Flags | flags, flags test | 0 | unit | Bajo |
| **04** | V9.1 baseline | contract test | 0 | V9.1 | Bajo |
| **05** | Helpers + runtime.refs + snapshot | helpers, runtime.refs, snapshot | AuthContext re-exports | manifesto full | **Alto** |
| **06** | State + cleanup | state, cleanup | 0 | tsc | Medio |
| **07** | Bootstrap compositor | bootstrap compositor | AuthContext delegates E7 | V1 | **Alto** |
| **08** | Interceptors + refresh | 2 compositors | AuthContext E5/E6 delegate | V5 | **Crítico** |
| **09** | Termination runtime | termination compositor | AuthContext wiring | V2,V3 | Alto |
| **10** | Impersonation | impersonation compositor | AuthContext | V6 | Alto |
| **11** | Empresa + permissions | 2 compositors | AuthContext | V1.3,V7 | Medio |
| **12** | useAuthProvider + slim shell | 4 files + useAuthProvider | AuthContext ≤250 | 116/116 + V9.1 | **Crítico** |
| **13** | Legacy delete | — | delete 2 legacy | grep + manifesto | Bajo |
| **14** | V9 validation | 3 test files | ProtectedRoute test | V9.2,V9.3 + smoke | Medio |

---

## Riesgos restantes

| ID | Riesgo | Prob. | Mitigación |
|----|--------|-------|------------|
| RR-01 | Regresión interceptors refresh single-flight | Alta | DR-P1-03; gate V5; copy literal IMPL-08 |
| RR-02 | Orden hooks altera closures | Media | DR-P1-05 grafo; deps arrays literales |
| RR-03 | Bootstrap impersonation branches | Alta | Gate V6 smoke; no reescritura F6 |
| RR-04 | Context value stale memo | Media | Copiar deps L2930–2964 |
| RR-05 | Test export path roto | Baja | V9.1.d allowlist 42 símbolos |
| RR-06 | IMPL-12 big-bang residual wiring | Media | Strangler incremental IMPL-07..11 |

---

## Deudas técnicas conocidas (fuera F9 / aceptadas)

| ID | Deuda | Disposición |
|----|-------|-------------|
| DT-01 | F1 hydrate logs `tokenPrefix` (A-P2-01 F8 audit) | Ticket hygiene post-F9 |
| DT-02 | GAP-P1-07 dual menu/permissions | Excluido F9 |
| DT-03 | GAP-P2-04 selection store cross-tab | Excluido F9 |
| DT-04 | ProtectedRoute tests placeholder pre-IMPL-14 | Cerrado IMPL-14 |
| DT-05 | Console DEV ruido AuthContext mount | No optimizar en F9 |
| DT-06 | `useAuthProvider.ts` puede superar 200 líneas estimadas | Aceptable si compositors ≤450 |

---

## Criterios de éxito

| # | Criterio | Evidencia |
|---|----------|-----------|
| 1 | AuthContext.tsx ≤ **250** líneas | wc -l post-IMPL-12 |
| 2 | 0 imports `session/*` en AuthContext.tsx | grep |
| 3 | V9.1 — 36 campos + 42 exports | contract tests |
| 4 | V9.2 — **116/116** manifesto V1–V8 | CI |
| 5 | V9.3 — ProtectedRoute + AuthGate + provider tree | tests IMPL-14 |
| 6 | Smoke §8 manual PASS | VALIDATION report |
| 7 | GAP-P1-05, P2-02, P2-03, H8 cerrados | closure report |
| 8 | Legacy files eliminados | grep 0 |
| 9 | F1–F8 session cuerpos sin diff funcional | audit READ ONLY |
| 10 | Rollback snapshot eliminado en SIGNOFF | repo clean |

---

## Referencias

| Documento | Rol |
|-----------|-----|
| `IAM_FE_PHASE_09_KICKOFF.md` | Alcance / normas |
| `IAM_FE_PHASE_09_TECHNICAL_DESIGN.md` | Arquitectura L9 |
| Design Review DR-P1-01…05 | Condiciones APPROVED |
| `IAM_SESSION_ALIGNMENT_PLAN_V1.md` | §5 Fase 9, §8 V9, H8 |

---

**Fin del plan IAM-FE-PHASE-09**

PHASE-09 IMPLEMENTATION PLAN COMPLETE
