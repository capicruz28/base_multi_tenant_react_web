# IAM-FE-PHASE-09 — Informe IMPL-01 (Baseline & Inventario)

**Ticket:** IAM-FE-PHASE-09-IMPL-01  
**Fecha:** 2026-06-19  
**Modo:** Verificación READ ONLY — **0 cambios** en código funcional, tests, imports o producción  
**Referencia:** `IAM_FE_PHASE_09_IMPLEMENTATION_PLAN.md` v1.0  

---

## Resumen ejecutivo

IMPL-01 confirma el baseline oficial del monolito `AuthContext.tsx` (**3.068 líneas**), inventarios completos (exports, state, refs, effects, callbacks), **36 propiedades** públicas de `useAuth()`, mapa manifesto V1 real, grafo de closures definitivo (con **una desviación material** respecto al plan §2 DR-P1-05), legacy huérfano verificado, y `provider.tsx` inmutable.

**Resultado:** Baseline **firmado**. IMPL-02 **autorizado** tras checklist §25 (ítems 1–7, 9–12) con **recomendación obligatoria** de ajustar grafo de definición (callbacks post-effect).

| Métrica plan | Verificado | Estado |
|--------------|------------|--------|
| Líneas AuthContext | 3.068 | ✅ |
| `src/core/auth/provider/` | No existe | ✅ |
| Legacy 0 imports | Confirmado | ✅ |
| 36 keys useAuth | Confirmado | ✅ |
| 7 useEffect | Confirmado | ✅ |
| F1–F8 sin diff | git clean paths clave | ✅ |

---

## 1. Baseline oficial AuthContext

| Campo | Valor verificado |
|-------|------------------|
| **Archivo** | `src/shared/context/AuthContext.tsx` |
| **Líneas totales** | **3.068** |
| **Helpers exportados (pre-Provider)** | L172–L666 (~495 líneas) |
| **AuthProvider** | L770–L3056 (~2.287 líneas) |
| **useAuth hook** | L3061–L3067 |
| **Module singleton** | `isRefreshingPromise` L169 (fuera Provider) |
| **Imports `@/core/auth/session`** | **33** referencias en archivo |
| **AuthContextType** | Interface **interna** L676–721 (no exportada) |

---

## 2. Inventario completo de exports (40 declaraciones)

### 2.1 Constantes (2)

| Símbolo | Línea |
|---------|-------|
| `AUTH_REFRESH_TERMINATION_URL` | 172 |
| `LEGACY_SESSION_QUEUE_ERROR_MESSAGE` | 264 |

### 2.2 Interfaces exportadas (10)

| Símbolo | Línea |
|---------|-------|
| `GetTerminateSessionDepsParams` | 178 |
| `AuthTerminationToastApi` | 229 |
| `LegacySessionLogoutDeps` | 266 |
| `RunSessionTerminationExitOptions` | 307 |
| `GetLogoutAllFlowDepsParams` | 434 |
| `SessionValidityProbeDeps` | 481 |
| `GetSessionValidityProbeDepsParams` | 486 |
| `ExecuteClassifiedTerminationOptions` | 540 |
| `HydrateFetchMeErrorRef` | 623 |
| `CreateTerminateFromHydrateFailureOptions` | 646 |

### 2.3 Funciones exportadas (25)

| Símbolo | Línea |
|---------|-------|
| `getTerminateSessionDeps` | 191 |
| `createAuthTerminateRedirectToLogin` | 221 |
| `createAuthShowTerminationToast` | 238 |
| `performLegacySessionLogout` | 277 |
| `buildTerminationClearQueryCache` | 300 |
| `runSessionTerminationExit` | 317 |
| `extractTerminationHttpContextFromError` | 327 |
| `buildBootstrapTerminationClassifyInput` | 349 |
| `buildInterceptorRefreshTerminationClassifyInput` | 361 |
| `buildTerminateSessionInput` | 375 |
| `buildDoLogoutTerminateInput` | 397 |
| `executeDoLogoutTermination` | 410 |
| `buildLogoutAllTerminateInput` | 425 |
| `getLogoutAllFlowDeps` | 442 |
| `executeLogoutAllTermination` | 457 |
| `getSessionValidityProbeDeps` | 492 |
| `runSessionValidityProbe` | 507 |
| `buildInterceptorTerminationClassifyInput` | 531 |
| `executeClassifiedTermination` | 552 |
| `executeBootstrapRefreshTermination` | 568 |
| `executeInterceptorRefreshTermination` | 587 |
| `buildHydrateFailureClassifyInput` | 606 |
| `executeHydrateFailureTermination` | 611 |
| `createHydrateFetchMeWithErrorCapture` | 631 |
| `createTerminateFromHydrateFailure` | 654 |

### 2.4 Runtime exports (2)

| Símbolo | Línea |
|---------|-------|
| `AuthProvider` | 770 |
| `useAuth` | 3061 |

**Total superficie export:** **39 símbolos nombrados** + tipos re-exportables = **40 declaraciones `export`**.

> Nota: Implementation Plan cita «42 exports» — desviación menor (DR-D01); V9.1.d allowlist debe usar lista §2 verificada.

---

## 3. Inventario useEffect (7)

| ID | Línea | Propósito | Deps array |
|----|-------|-----------|------------|
| **E1** | 816 | Sync `authRef` ← `auth` | `[auth]` |
| **E2** | 820 | Sync `loadingRef` ← `loading` | `[loading]` |
| **E3** | 824 | Sync `empresaActivaIdRef` ← `empresaActivaId` | `[empresaActivaId]` |
| **E4** | 829 | DEV mount/unmount log | `[]` |
| **E5** | 1767 | Register/eject **request** interceptor | `[skipsTokenRefresh, isPublicEndpoint]` |
| **E6** | 1839 | Register/eject **response** interceptor | `[skipsTokenRefresh, runTerminateSession, legacyLogoutDeps, isImpersonationActive, restorePlatformSession, runPostRefreshSession, emitAuthSyncSessionToken, queryClient, runImpersonationControlledExit]` |
| **E7** | 2164 | Bootstrap `runBootstrap()` once | `[runTerminateSession, legacyLogoutDeps, initializeAuth, restorePlatformSession, syncImpersonationFromToken, emitAuthSyncSessionToken, runImpersonationControlledExit]` |

**Orden invariante effects:** E1 → E2 → E3 → E4 → E5 → E6 → E7.

---

## 4. Inventario useState (18)

| Estado | Setter | Línea | Default |
|--------|--------|-------|---------|
| `auth` | `setAuth` | 772 | `initialAuth` |
| `loading` | `setLoading` | 773 | `true` |
| `authInitialized` | `setAuthInitialized` | 774 | `false` |
| `isBootstrapped` | `setIsBootstrapped` | 775 | `false` |
| `accessLevel` | `setAccessLevel` | 778 | `0` |
| `isSuperAdmin` | `setIsSuperAdmin` | 779 | `false` |
| `userType` | `setUserType` | 780 | `'user'` |
| `clienteInfo` | `setClienteInfo` | 781 | `null` |
| `permissions` | `setPermissions` | 783 | `null` |
| `menuModulos` | `setMenuModulos` | 785 | `null` |
| `menuPermissionsReady` | `setMenuPermissionsReady` | 786 | `false` |
| `empresaActivaId` | `setEmpresaActivaId` | 788 | `null` |
| `empresasElegibles` | `setEmpresasElegibles` | 789 | `[]` |
| `requiereSeleccionEmpresa` | `setRequiereSeleccionEmpresa` | 790 | `false` |
| `esAdminCliente` | `setEsAdminCliente` | 791 | `false` |
| `isImpersonation` | `setIsImpersonation` | 792 | `false` |
| `impersonatedBy` | `setImpersonatedBy` | 793 | `null` |
| `impersonatedByUsername` | `setImpersonatedByUsername` | 794 | `null` |
| `impersonationClienteLabel` | `setImpersonationClienteLabel` | 798 | `null` |

**Externo Zustand (no useState):** `selectionUserPreview`, `hasPendingSelectionStore` L796–797.

---

## 5. Inventario useRef (11) + module singleton

| Ref | Línea | Inicial |
|-----|-------|---------|
| `authRef` | 801 | `auth` |
| `loadingRef` | 802 | `loading` |
| `empresaActivaIdRef` | 803 | `empresaActivaId` |
| `isInitializedRef` | 804 | `false` |
| `failedQueueRef` | 806 | `[]` |
| `isTerminatingRef` | 810 | `false` |
| `isLogoutAllInFlightRef` | 811 | `false` |
| `isSessionValidityProbeInFlightRef` | 812 | `false` |
| `terminationCallerHintRef` | 813 | `undefined` |
| `sessionMenuSnapshotRef` | 787 | `null` |
| `hydrateFetchMeErrorRef` | 1485 | `undefined` |

**Module-level (L9-C):** `isRefreshingPromise` L169 — **fuera** del componente.

> Nota: `hydrateFetchMeErrorRef` se declara **tarde** (L1485), después de múltiples callbacks — preservar en extracción.

---

## 6. Inventario useMemo (14)

| # | Variable | Línea |
|---|----------|-------|
| 1 | `sessionUxTerminationWiring` | 1158 |
| 2 | `redirectToLoginAfterTermination` | 1173 |
| 3 | `showTerminationToastAfterTermination` | 1177 |
| 4 | `legacyLogoutDeps` | 1182 |
| 5 | `authSyncTerminationEmitter` | 1202 |
| 6 | `sessionTelemetryTerminationEmitter` | 1207 |
| 7 | `composedTerminationEmitter` | 1217 |
| 8 | `terminateSessionDeps` | 1277 |
| 9 | `terminateFromHydrateFailure` | 1487 |
| 10 | `requiresPasswordChange` | 2681 |
| 11 | `empresaFlowInput` | 2870 |
| 12 | `canAccessErpFlag` | 2881 |
| 13 | `mustSelectEmpresaFlag` | 2886 |
| 14 | `value` (context) | 2891 |

---

## 7. Callbacks públicos (expuestos vía context value)

| Campo context | Handler interno | Línea handler |
|---------------|-----------------|---------------|
| `setAuthFromLogin` | `setAuthFromLogin` | 2529 |
| `completeEmpresaSelection` | `completeEmpresaSelection` | 2556 |
| `cambiarEmpresaActiva` | `cambiarEmpresaActiva` | 2609 |
| `logout` | `logout` | 2826 |
| `logoutAllSessions` | `logoutAllSessions` | 1322 |
| `runSessionValidityProbe` | `runSessionValidityProbeForSession` | 1385 |
| `hasRole` | `hasRole` | 2843 |
| `reloadMenuAndPermissions` | `reloadMenuAndPermissions` | 2674 |
| `startImpersonation` | `startImpersonationHandler` | 2725 |
| `endImpersonation` | `endImpersonationHandler` | 2786 |
| `completePasswordChange` | `completePasswordChange` | 2711 |

**Derivados en value (no handlers):** `isAuthenticated`, `hasEmpresaActivaFlag`, `canAccessErp`, `mustSelectEmpresa`, `empresasDisponibles` (alias), `requiresPasswordChange`.

---

## 8. Callbacks internos (useCallback — 40)

| # | Callback | Línea | Dominio |
|---|----------|-------|---------|
| 1 | `determineUserType` | 843 | Permissions |
| 2 | `clearImpersonationState` | 849 | Impersonation |
| 3 | `syncImpersonationFromToken` | 856 | Impersonation |
| 4 | `isImpersonationActive` | 872 | Impersonation |
| 5 | `syncEmpresaSession` | 876 | Empresa |
| 6 | `shouldSkipErpMenuLoad` | 900 | Permissions |
| 7 | `buildRoutePermissionsFromMenu` | 927 | Permissions |
| 8 | `loadMenuAndPermissionsFromAuthMenu` | 935 | Permissions |
| 9 | `updateAccessLevels` | 1030 | Permissions |
| 10 | `skipsTokenRefresh` | 1095 | Interceptors |
| 11 | `isPublicEndpoint` | 1107 | Interceptors |
| 12 | `processQueue` | 1120 | Refresh |
| 13 | `performLocalAuthCleanup` | 1131 | Termination |
| 14 | `emitAuthSyncSessionToken` | 1226 | Auth Sync |
| 15 | `runTerminateSession` | 1308 | Termination |
| 16 | `logoutAllSessions` | 1322 | Termination |
| 17 | `runSessionValidityProbeForSession` | 1385 | Probe F3 |
| 18 | `doLogout` | 1404 | Termination |
| 19 | `loadEmpresasElegiblesForSession` | 1427 | Empresa |
| 20 | `hydrateFetchMe` | 1507 | Bootstrap F1 |
| 21 | `getHydrateSessionCoreDeps` | 1520 | Bootstrap F1 |
| 22 | `runHydrateSessionCore` | 1560 | Bootstrap F1 |
| 23 | `runPostRefreshSession` | 1582 | Refresh F1/F5 |
| 24 | `initializeAuth` | 1623 | Bootstrap F1 |
| 25 | `restorePlatformSession` | 1630 | Impersonation F6 |
| 26 | `getImpersonationExitDeps` | 1683 | Impersonation F6 |
| 27 | `runImpersonationControlledExit` | 1703 | Impersonation F6 |
| 28 | `applyInboundImpersonationExitStorageCleanup` | 1740 | Impersonation F6 |
| 29 | `applyFullSessionToken` | 2471 | Public API |
| 30 | `setAuthFromLogin` | 2529 | Public API |
| 31 | `invalidateSelectionSession` | 2547 | Empresa |
| 32 | `completeEmpresaSelection` | 2556 | Public API |
| 33 | `cambiarEmpresaActiva` | 2609 | Public API |
| 34 | `reloadMenuAndPermissions` | 2674 | Public API |
| 35 | `completePasswordChange` | 2711 | Public API |
| 36 | `startImpersonationHandler` | 2725 | Public API |
| 37 | `endImpersonationHandler` | 2786 | Public API |
| 38 | `logout` | 2826 | Public API |
| 39 | `hasRole` | 2843 | Public API |
| 40 | `getAuthSyncListenerDeps` | 2967 | Auth Sync F4 |

---

## 9. Grafo definitivo de closures (DR-P1-05 — verificado contra monolito)

### 9.1 Fase A — Pre-effects (L771–L1740)

```
queryClient
→ useState (18) + Zustand selection
→ useRef (10 tempranos; hydrateFetchMeErrorRef NO — ver 9.2)
→ E1, E2, E3, E4
→ determineUserType
→ clearImpersonationState / syncImpersonationFromToken / isImpersonationActive
→ syncEmpresaSession / shouldSkipErpMenuLoad
→ loadMenuAndPermissionsFromAuthMenu / updateAccessLevels / buildRoutePermissionsFromMenu
→ skipsTokenRefresh / isPublicEndpoint / processQueue / performLocalAuthCleanup
→ useMemo: sessionUxTerminationWiring → redirect/showToast
→ useMemo: legacyLogoutDeps
→ useMemo: authSyncTerminationEmitter + telemetry + composedTerminationEmitter
→ emitAuthSyncSessionToken
→ useMemo: terminateSessionDeps
→ runTerminateSession / logoutAllSessions / runSessionValidityProbeForSession / doLogout
→ loadEmpresasElegiblesForSession
→ hydrateFetchMeErrorRef (L1485)          ← POSICIÓN TARDÍA
→ useMemo: terminateFromHydrateFailure
→ hydrateFetchMe / getHydrateSessionCoreDeps / runHydrateSessionCore
→ runPostRefreshSession / initializeAuth
→ restorePlatformSession / getImpersonationExitDeps / runImpersonationControlledExit
→ applyInboundImpersonationExitStorageCleanup
```

### 9.2 Fase B — Effects dominio (L1767–L2465)

```
E5 request interceptor
E6 response interceptor  (deps: ver §3)
E7 bootstrap runBootstrap
```

### 9.3 Fase C — Post-effects públicos (L2471–L2967)

```
applyFullSessionToken
→ setAuthFromLogin / invalidateSelectionSession
→ completeEmpresaSelection / cambiarEmpresaActiva
→ reloadMenuAndPermissions
→ useMemo: requiresPasswordChange
→ completePasswordChange
→ startImpersonationHandler / endImpersonationHandler / logout / hasRole
→ useMemo: empresaFlowInput → canAccessErpFlag → mustSelectEmpresaFlag
→ useMemo: value (deps L2930–2964)
→ getAuthSyncListenerDeps
```

### 9.4 Fase D — Render (L3035–L3054)

```
AuthContext.Provider value={value}
  1. AuthSyncListenerBinder
  2. SessionRemoteProbeBinder
  3. SessionTelemetryAuthSyncEmittedBinder
  4. SessionTelemetryAuthSyncBinder
  children
```

### 9.5 Correspondencia Implementation Plan §2 vs monolito real

| Plan §2 paso | Monolito | Match |
|--------------|----------|-------|
| 1–10 pre-termination | Fase A inicio | ✅ |
| 11–13 interceptors effects **después** public-actions | Public-actions **split** post-E7 | ⚠️ **DR-D02** |
| public-actions antes effects | Solo pre-effect subset | ⚠️ |

**Norma IMPL copy-first:** Replicar **Fase A → B → C → D**, no colapsar Fase C antes de E5–E7.

---

## 10. Mapa dependencias imports AuthContext → session (33 refs)

| Módulo session | Uso |
|----------------|-----|
| `session-refresh-hydrate` | F1 hydrate |
| `session-claims-snapshot` | F1/F4 snapshots |
| `session-post-refresh` | F1 post-refresh |
| `session-rq-invalidation` | F1 RQ |
| `session-menu-ux` | F7 menu load options |
| `refresh-hydrate.flags` | F1 flag |
| `session-termination.*` | F2 |
| `session-ux-auth-wiring` | F7 termination UX |
| `session-ux.flags` | F7 |
| `session-logout-v3.flags` | F3 |
| `session-logout-all` | F3 |
| `session-auth-sync-*` | F4 |
| `useAuthSyncListener` | F4 binder |
| `useSessionRemoteProbe` | F3 binder |
| `session-cambiar-empresa-l02` | F5 |
| `session-refresh-resilience` | F5 |
| `session-impersonation-*` | F6 |
| `session-telemetry-*` | F8 |

**Regla F9:** Post-IMPL-12 estos imports migran a `provider/*`; AuthContext shell **0** session imports.

---

## 11. Mapa manifesto V1 (DR-P1-02 — oficial)

| Escenario | Suite(s) verificada(s) |
|-----------|------------------------|
| **V1.1–V1.4** | `auth-phase-02-closure.test.ts` (bloque «regresión Fase 1») |
| **V1 hydrate DI** | `auth-hydrate-termination-di.test.ts` |
| **V1 session core** | `session/__tests__/session-refresh-hydrate.test.ts`, `session-post-refresh.test.ts`, `session-claims-sync.test.ts`, `session-interceptor-flow.test.ts` |
| **Referencia cruzada** | `auth-phase-03-regression.test.ts` → `REGRESSION_SUITE_MANIFEST.phase01*` |

**Confirmado:** `auth-phase-01-regression.test.ts` **NO EXISTE**.

---

## 12. 36 propiedades públicas useAuth() — confirmadas

Lista canónica (orden interface L676–721):

1. `auth` · 2. `setAuthFromLogin` · 3. `completeEmpresaSelection` · 4. `cambiarEmpresaActiva` · 5. `logout` · 6. `logoutAllSessions` · 7. `runSessionValidityProbe` · 8. `isAuthenticated` · 9. `loading` · 10. `authInitialized` · 11. `isBootstrapped` · 12. `hasRole` · 13. `accessLevel` · 14. `isSuperAdmin` · 15. `userType` · 16. `clienteInfo` · 17. `permissions` · 18. `menuModulos` · 19. `menuPermissionsReady` · 20. `empresaActivaId` · 21. `empresasElegibles` · 22. `empresasDisponibles` · 23. `requiereSeleccionEmpresa` · 24. `esAdminCliente` · 25. `hasEmpresaActivaFlag` · 26. `canAccessErp` · 27. `mustSelectEmpresa` · 28. `reloadMenuAndPermissions` · 29. `isImpersonation` · 30. `impersonatedBy` · 31. `impersonatedByUsername` · 32. `impersonationClienteLabel` · 33. `startImpersonation` · 34. `endImpersonation` · 35. `requiresPasswordChange` · 36. `completePasswordChange`

**Semántica `isAuthenticated`:** `!!auth.token && !!auth.user` (L2900).

---

## 13. Símbolos AuthContext importados por tests (27 únicos + 1 type)

| Símbolo | Archivos test |
|---------|---------------|
| `AUTH_REFRESH_TERMINATION_URL` | auth-terminate-session-deps |
| `buildBootstrapTerminationClassifyInput` | phase-02-closure, phase-05 |
| `buildDoLogoutTerminateInput` | phase-03-regression, phase-03-integration, auth-logout-terminate-migration, auth-termination-ux-wiring |
| `buildHydrateFailureClassifyInput` | auth-hydrate-termination-di |
| `buildInterceptorRefreshTerminationClassifyInput` | auth-terminate-session-deps, phase-05 |
| `buildInterceptorTerminationClassifyInput` | auth-runtime-termination-wiring, phase-05 |
| `buildLogoutAllTerminateInput` | auth-logout-all, phase-03-regression, phase-03-integration |
| `buildTerminateSessionInput` | auth-terminate-session-deps, auth-runtime-termination-wiring |
| `buildTerminationClearQueryCache` | auth-session-termination-flags-wiring |
| `createAuthShowTerminationToast` | auth-termination-ux-wiring |
| `createAuthTerminateRedirectToLogin` | auth-terminate-session-deps, auth-termination-ux-wiring |
| `createHydrateFetchMeWithErrorCapture` | auth-hydrate-termination-di |
| `createTerminateFromHydrateFailure` | auth-hydrate-termination-di |
| `executeBootstrapRefreshTermination` | phase-02-closure, phase-03-regression, phase-05, auth-termination-ux-wiring |
| `executeClassifiedTermination` | auth-runtime-termination-wiring |
| `executeDoLogoutTermination` | auth-logout-terminate-migration, phase-03-regression, phase-03-integration |
| `executeHydrateFailureTermination` | auth-hydrate-termination-di, auth-runtime-termination-wiring |
| `executeInterceptorRefreshTermination` | phase-02-closure, phase-03-regression, phase-05, auth-runtime-termination-wiring, auth-session-termination-flags-wiring, auth-termination-ux-wiring, phase-03-integration |
| `executeLogoutAllTermination` | auth-logout-all, phase-03-regression, phase-03-integration |
| `extractTerminationHttpContextFromError` | auth-terminate-session-deps |
| `getLogoutAllFlowDeps` | auth-logout-all, phase-03-regression, phase-03-integration |
| `getSessionValidityProbeDeps` | auth-session-validity-probe, phase-03-regression, phase-03-integration |
| `getTerminateSessionDeps` | 12 archivos test |
| `LEGACY_SESSION_QUEUE_ERROR_MESSAGE` | auth-session-termination-flags-wiring |
| `performLegacySessionLogout` | auth-session-termination-flags-wiring |
| `runSessionTerminationExit` | phase-02-closure, phase-03-regression, phase-03-integration |
| `runSessionValidityProbe` | auth-session-validity-probe, phase-03-regression, phase-03-integration |
| `LegacySessionLogoutDeps` (type) | auth-logout-all, auth-session-termination-flags-wiring, phase-03-* |

**13 archivos test** importan desde `@/shared/context/AuthContext`.

---

## 14. Legacy files — zero imports en `src/`

| Archivo | Imports en `src/` | Canónico |
|---------|-------------------|----------|
| `src/services/auth.service.ts` | **0** | `features/auth/services/auth.service.ts` (Login + AuthContext) |
| `src/context/TenantContext.tsx` | **0** | `features/tenant/components/TenantContext.tsx` (`provider.tsx` L13) |

---

## 15. provider.tsx — inmutable (verificado)

Árbol actual **coincide** con Implementation Plan §15:

```
QueryClientProvider → ThemeProvider → AuthProvider → SessionUxBinder → AuthGate → TenantProvider → PermissionProvider → AppReadyGate → …
```

**git status** `src/app/provider.tsx`: sin modificaciones pendientes.

---

## 16. F1–F8 congeladas (verificado)

| Check | Resultado |
|-------|-----------|
| `src/core/auth/session/**` git clean | ✅ |
| `AuthContext.tsx` git clean | ✅ |
| `src/core/auth/provider/` existe | ❌ No (correcto pre-IMPL-02) |
| IMPL-01 modificó código | ❌ No |
| L7 components (`SessionUxBinder`, etc.) | Sin diff |

---

## Checklist Implementation Plan §25 (pre-IMPL-02)

| # | Criterio | Estado IMPL-01 |
|---|----------|----------------|
| 1 | Baseline 3068 líneas firmado | ✅ |
| 2 | Grafo closures §9 documentado | ✅ |
| 3 | Mapa manifesto V1 §11 publicado | ✅ |
| 4 | Lista 36 keys §12 en spec | ✅ |
| 5 | `AuthProviderRuntime` spec §10 plan — revisar en IMPL-02 | ☐ IMPL-02 |
| 6 | Anti-cycle rules §9 plan aceptadas | ✅ (verificado compatible) |
| 7 | `runtime.refs` API aceptada | ✅ |
| 8 | DESIGN APPROVED ack | ✅ |
| 9 | Branch F9 + CI verde pre-cambios | ☐ DevOps (fuera IMPL-01) |
| 10 | Snapshot monolith plan IMPL-05 acordado | ✅ (baseline este informe) |
| 11 | Equipo ack zero delta | ☐ Team |
| 12 | IMPL-01 no movió código | ✅ |

**IMPL-02 desbloqueado** en documentación (ítems 1–4, 6–8, 10, 12). Pendiente: 5 (IMPL-02 entregable), 9, 11.

---

## Desviaciones detectadas

| ID | Desviación | Severidad |
|----|------------|-----------|
| **DR-D01** | Plan cita ~40 session imports / 42 exports; verificado **33** session refs y **40** export declarations | P3 |
| **DR-D02** | Plan §2 DR-P1-05 coloca `public-actions` **antes** de effects; monolito tiene **Fase C post-E7** (L2471+) | **P1** — ajustar IMPL-02 grafo |
| **DR-D03** | `hydrateFetchMeErrorRef` declarado L1485 (tarde vs refs tempranos) | P2 — copy literal |
| **DR-D04** | Design §5.3 no lista `useMemo` (14) ni Zustand L796 | P3 — inventario IMPL-01 extiende design |

---

## Riesgos encontrados

| ID | Riesgo | Mitigación IMPL-02+ |
|----|--------|---------------------|
| **R-01** | Reordenar Fase C pre-effects rompe TDZ / deps E6 | Copy Fase A→B→C→D §9 |
| **R-02** | `isRefreshingPromise` split incorrecto | DR-P1-03 runtime.refs único |
| **R-03** | E6 deps array 9 elementos — cualquier drift rompe interceptor | Copiar literal L2159 |
| **R-04** | `value` useMemo 34 deps — drift silencioso | Copiar literal L2930–2964 |
| **R-05** | Tests acoplados a 27 símbolos — re-export path crítico | IMPL-05 allowlist §13 |

---

## Recomendaciones antes de IMPL-02

1. **Actualizar grafo DR-P1-05** en ticket IMPL-02 con **Fase A / B / C / D** (§9) — no el orden simplificado de 19 pasos del plan si contradice Fase C post-effect.
2. **IMPL-02 types:** incluir `hydrateFetchMeErrorRef` en `AuthProviderRefs` con nota «declaración tardía permitida en compositor».
3. **IMPL-04 allowlist:** 40 exports §2 + 36 keys §12 (no 34, no 42).
4. **IMPL-05:** snapshot `AuthContext.tsx` completo (3.068 líneas) como `AuthContext.monolith.snapshot.ts` read-only.
5. **Branch F9:** crear antes de IMPL-02; ejecutar manifesto baseline CI.
6. **No crear `provider/`** hasta IMPL-02 — respetado.

---

## Criterios de éxito IMPL-01

| Criterio | Cumplido |
|----------|----------|
| Baseline verificado sin mover código | ✅ |
| Inventarios completos §2–§8 | ✅ |
| Grafo closures definitivo | ✅ |
| Manifesto V1 real | ✅ |
| Legacy 0 imports | ✅ |
| 36 props useAuth | ✅ |
| provider.tsx inmutable | ✅ |
| F1–F8 congeladas | ✅ |
| Sin `provider/` creado | ✅ |

---

**Fin informe IAM-FE-PHASE-09-IMPL-01**

PHASE-09 IMPL-01 COMPLETE
