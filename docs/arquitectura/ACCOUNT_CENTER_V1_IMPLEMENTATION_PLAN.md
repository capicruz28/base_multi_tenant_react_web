# ACCOUNT_CENTER_V1 — Implementation Plan

**Documento:** `docs/arquitectura/ACCOUNT_CENTER_V1_IMPLEMENTATION_PLAN.md`  
**Épica:** `ACCOUNT_CENTER_V1` (Mi Cuenta)  
**Versión:** 1.0  
**Fecha:** 2026-06-24  
**Tipo:** Plan técnico de implementación  
**Modo:** READ ONLY al crear — sin cambios de código

**Documentos vinculados (cerrados — no redefinir):**

| Documento | Rol |
|-----------|-----|
| `ACCOUNT_CENTER_V1_SPEC.md` | Contrato funcional |
| `ACCOUNT_CENTER_V1_UX_DESIGN.md` | Contrato UX/UI |
| `ACCOUNT_CENTER_V1_AUDIT.md` | Estado inicial |
| `FRONTEND_AUTH_AUDIT.md` | Auth reutilizable |
| `AUTH_FRONTEND_CONTRACT_CERTIFICATION.md` | Endpoints auth |
| `ERP_FRONTEND_STANDARDS_V2.md` | Norma plataforma |

---

## 1. Arquitectura técnica

### 1.1 Visión general

Mi Cuenta se implementa como **módulo feature** `src/features/account/` con layout propio (sidebar + outlet), registrado en el árbol de rutas `/app/cuenta/*` bajo el guard operativo existente. **No** se modifica la arquitectura AuthContext/compositors (Baseline V1 P-01).

```
/app (ProtectedRoute requireOperationalUser + AppLayout)
└── cuenta/
    ├── AccountCenterLayout          ← shell hub (sidebar + Outlet)
    ├── informacion → AccountProfilePage
    ├── seguridad   → AccountSecurityPage
    ├── sesiones    → MySessionsPanel (wrapper sobre contenido existente)
    └── preferencias → AccountPreferencesPage
```

### 1.2 Componentes (nuevos)

| Componente | Path propuesto | Responsabilidad |
|------------|----------------|-----------------|
| `AccountCenterLayout` | `features/account/layout/AccountCenterLayout.tsx` | Flex row: sidebar + `<Outlet />` |
| `AccountCenterSidebar` | `features/account/components/AccountCenterSidebar.tsx` | Nav interna 4 ítems; `NavLink` activo |
| `AccountCenterSectionHeader` | `features/account/components/AccountCenterSectionHeader.tsx` | Título L1 + subtítulo (no H1) |
| `AccountProfilePage` | `features/account/pages/AccountProfilePage.tsx` | Orquesta cards informacion |
| `AccountProfileIdentityCard` | `features/account/components/profile/AccountProfileIdentityCard.tsx` | Avatar iniciales + resumen |
| `AccountProfileDetailsGrid` | `features/account/components/profile/AccountProfileDetailsGrid.tsx` | Grid label/valor read-only |
| `AccountProfileRolesList` | `features/account/components/profile/AccountProfileRolesList.tsx` | Lista/chips roles |
| `AccountReadOnlyNotice` | `features/account/components/profile/AccountReadOnlyNotice.tsx` | Banner contacto admin |
| `AccountSecurityPage` | `features/account/pages/AccountSecurityPage.tsx` | Orquesta cards seguridad |
| `AccountChangePasswordForm` | `features/account/components/security/AccountChangePasswordForm.tsx` | Form voluntario |
| `AccountSecuritySessionGlobalCard` | `features/account/components/security/AccountSecuritySessionGlobalCard.tsx` | CTA logout all + copy |
| `AccountPreferencesPage` | `features/account/pages/AccountPreferencesPage.tsx` | Orquesta preferencias |
| `AccountPreferencesAppearanceCard` | `features/account/components/preferences/AccountPreferencesAppearanceCard.tsx` | Radio tema |
| `AccountPreferencesNavigationCard` | `features/account/components/preferences/AccountPreferencesNavigationCard.tsx` | Radio nav mode |
| `AccountAdminSessionsLink` | `features/account/components/sessions/AccountAdminSessionsLink.tsx` | Enlace condicional `/admin/sesiones` |
| `MySessionsPanel` | `features/account/pages/MySessionsPanel.tsx` | **Wrapper delgado**: section header + `MySessionsPage` body o refactor export |

### 1.3 Layouts

| Layout | Uso |
|--------|-----|
| `AccountCenterLayout` | Único layout hub; hijos vía React Router `Outlet` |
| `OrgPageLayout` / `InvPageLayout` | Reutilizado **dentro** de Sesiones (contenido tabular existente) |
| `AppLayout` / `NewLayout` | Sin cambio — envuelve `/app/*` |

### 1.4 Compositors

| Área | Cambio V1 |
|------|-----------|
| `auth-provider-*` | **Sin cambios** |
| `auth-provider-public-actions` | **Reutilizar** `completePasswordChange`, `logoutAllSessions` |
| `auth-provider-termination` | **Sin cambios** (opcional: toast error logout all — ver F6) |
| `auth-provider-interceptors` | **Sin cambios** |

### 1.5 Hooks

| Hook | Origen | Uso Mi Cuenta |
|------|--------|---------------|
| `useAuth` | `AuthContext` | Perfil, seguridad, guards |
| `useTheme` | `ThemeContext` | Preferencias |
| `useNavMode` | `NavModeContext` | Preferencias |
| `useMySessionsList` | `admin/hooks` | Sesiones — sin fork |
| `useRevokeSession` | `admin/hooks` | Sesiones — `mode: 'self'` |
| `useAccountProfile` *(nuevo, opcional)* | `features/account/hooks/` | Agregación read-only `auth.user` + resolución nombre empresa |
| `useAccountCenterNav` *(nuevo, opcional)* | `features/account/hooks/` | Items sidebar + rutas canónicas |

**Regla:** No crear hooks que dupliquen `completePasswordChange` o llamadas HTTP auth.

### 1.6 Providers / Contextos

| Contexto | Cambio |
|----------|--------|
| `AuthProvider` / `AuthContext` | **Sin cambio API** |
| `ThemeProvider` | **Sin cambio** — consumo en Preferencias |
| `NavModeProvider` | **Sin cambio** |
| Nuevo contexto Account | **No** — estado local de formularios únicamente |

### 1.7 Servicios

| Servicio | Cambio |
|----------|--------|
| `auth.service.ts` | **Reutilizar** `changePassword` vía `completePasswordChange` |
| `session.service.ts` | **Reutilizar** `getMySessions`, `revokeSessionSelf`; logout all vía AuthContext |
| Nuevo `account.service.ts` | **No** en V1 — sin endpoints propios |

### 1.8 Routing

| Archivo | Cambio |
|---------|--------|
| `src/app/router/app-route-tree.tsx` | Reemplazar ruta plana `cuenta/sesiones` por árbol anidado `cuenta` + children |
| `src/features/account/routes.tsx` *(nuevo)* | Definición children exportable para import en app-route-tree |
| `src/features/auth/routes.tsx` | **Sin cambio** (`/change-password` permanece auth-level) |

**Constantes rutas:** `src/features/account/account.routes.ts` — paths canónicos + helpers breadcrumb.

### 1.9 Utils (nuevos / extraídos)

| Util | Origen | Motivo |
|------|--------|--------|
| `account-password-validation.ts` | Extraer de `ChangePasswordPage.tsx` | DRY form force + voluntario |
| `account-profile-display.utils.ts` | Nuevo | Resolver label tipo usuario, nombre empresa sin UUID |
| `account-center-breadcrumbs.utils.ts` | Nuevo | Mapa estático `/app/cuenta/*` → segmentos Header |

---

## 2. Inventario de archivos

### 2.1 Archivos nuevos

| Archivo | Responsabilidad | Motivo | Impacto |
|---------|-----------------|--------|---------|
| `features/account/account.routes.ts` | Constantes rutas | Single source paths | Bajo |
| `features/account/routes.tsx` | RouteObject children | Modularidad | Medio — router |
| `features/account/layout/AccountCenterLayout.tsx` | Shell hub | UX sidebar | Medio |
| `features/account/components/AccountCenterSidebar.tsx` | Nav interna | UX §3 | Bajo |
| `features/account/components/AccountCenterSectionHeader.tsx` | Título sección | TB-01 | Bajo |
| `features/account/pages/AccountProfilePage.tsx` | Información personal | AC-02 | Bajo |
| `features/account/pages/AccountSecurityPage.tsx` | Seguridad | AC-03 | Medio |
| `features/account/pages/AccountPreferencesPage.tsx` | Preferencias | AC-05 | Bajo |
| `features/account/pages/MySessionsPanel.tsx` | Wrapper sesiones | Integración hub | Medio |
| `features/account/components/profile/*` (4) | Cards perfil | AC-02 | Bajo |
| `features/account/components/security/*` (2) | Password + logout all card | AC-03 | Medio |
| `features/account/components/preferences/*` (2) | Tema + nav | AC-05 | Bajo |
| `features/account/components/sessions/AccountAdminSessionsLink.tsx` | Enlace admin | AC-C2 | Bajo |
| `features/account/utils/account-password-validation.ts` | Validación password | DRY | Bajo |
| `features/account/utils/account-profile-display.utils.ts` | Display perfil | E-ME4 | Bajo |
| `features/account/utils/account-center-breadcrumbs.utils.ts` | Breadcrumbs | UX §4 | Bajo |
| `features/account/hooks/useAccountProfile.ts` | Agregación perfil | Opcional limpieza pages | Bajo |
| `features/account/components/security/AccountChangePasswordForm.tsx` | Form reutilizable | Seguridad | Medio |
| `features/account/__tests__/*` | Tests módulo | QA | Bajo |

### 2.2 Archivos modificados

| Archivo | Cambio | Motivo | Impacto |
|---------|--------|--------|---------|
| `src/app/router/app-route-tree.tsx` | Árbol `cuenta/*` anidado | F2 Routing | **Alto** — entry point |
| `src/shared/components/layout/Header.tsx` | Rewire dropdown; tokens Capa 1 | AC-06, UX §15 | **Medio** — visible |
| `src/shared/components/layout/useShellBreadcrumbs.ts` | Fallback mapa cuenta | Breadcrumbs | Bajo |
| `src/features/auth/pages/MySessionsPage.tsx` | Refactor: export body o quitar wrapper duplicado si layout anida | F7 integración | **Medio** — regresión sesiones |
| `src/features/auth/pages/ChangePasswordPage.tsx` | Import validación compartida | DRY password | Bajo |
| `src/core/auth/provider/auth-provider-termination.compositor.ts` | *(Opcional F6)* toast/logout all error UX | FRONTEND_AUTH_AUDIT gap | Bajo |

### 2.3 Archivos reutilizados (sin fork)

| Archivo | Uso |
|---------|-----|
| `MySessionsPage` (contenido) | Sesiones |
| `ActiveSessionsTableView` / `ActiveSessionsCardsView` | Sesiones |
| `useMySessionsList`, `useRevokeSession` | Sesiones |
| `session.service.ts` | Sesiones |
| `LogoutAllConfirmDialog` | Seguridad + Header |
| `ConfirmDialog` | Revoke sesiones |
| `InvPageLayout`, `OrgCompanyToolbar` | Sesiones toolbar |
| `InvTableSkeleton`, `IamTableEmptyState` | Sesiones estados |
| `AuthContext` / `useAuth` | Hub completo |
| `ThemeContext`, `NavModeContext` | Preferencias |
| `getErrorMessage`, `isPasswordChangeRequired` | Errores form |
| `auth.service.ts` | Indirecto vía AuthContext |

### 2.4 Archivos eliminados

| Archivo | ¿Eliminar? |
|---------|------------|
| Ninguno | **No** — norma preservación código; placeholders se quitan de Header, no archivos |

---

## 3. Dependencias — orden de implementación

```
F1 Shell (layout + sidebar vacío)
  ↓
F2 Routing (árbol cuenta/* + redirect index)
  ↓
F3 Header (entrada Mi cuenta; quitar placeholders; breadcrumbs utils)
  ↓
F4 Información personal (primera sección con contenido)
  ↓
F5 Seguridad (form password + extracción validación)
  ↓
F6 Logout All integración Seguridad (+ gaps toast/guards)
  ↓
F7 Sesiones (MySessionsPanel + refactor mínimo MySessionsPage)
  ↓
F8 Preferencias
  ↓
F9 QA (tests + regresión manual)
  ↓
F10 Cleanup (deuda Header tokens si no en F3; docs epic signoff)
```

**Dependencias cruzadas críticas:**

- F2 antes de F3 (Header navega a rutas que deben existir).
- F5 antes de F6 (logout all card vive en SecurityPage).
- Extracción `account-password-validation` antes o dentro de F5, antes de refactor `ChangePasswordPage`.
- F7 después de F1+F2 (layout envuelve sesiones).

---

## 4. Fases

### F1 — Shell

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Layout hub renderizable con sidebar y outlet vacío |
| **Archivos** | `AccountCenterLayout`, `AccountCenterSidebar`, `account.routes.ts`, `routes.tsx` (stub pages) |
| **Entrada** | SPEC + UX aprobados; rama feature |
| **Salida** | Layout compila; sidebar 4 links; outlet renderiza placeholder por ruta |
| **Riesgos** | Doble scroll si layout conflictúa con AppLayout — validar flex `min-h-0` |

### F2 — Routing

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Registrar árbol `/app/cuenta/*` en `app-route-tree.tsx` |
| **Archivos** | `app-route-tree.tsx`, `features/account/routes.tsx` |
| **Entrada** | F1 completo |
| **Salida** | `/app/cuenta` → redirect `informacion`; deep links funcionan; `ProtectedRoute` heredado |
| **Riesgos** | Ruta legacy `cuenta/sesiones` plana — **reemplazar**, no duplicar |

**Rutas finales:**

| Path | Element |
|------|---------|
| `cuenta` | `AccountCenterLayout` |
| `cuenta` index | `<Navigate to="informacion" replace />` |
| `cuenta/informacion` | `AccountProfilePage` |
| `cuenta/seguridad` | `AccountSecurityPage` |
| `cuenta/sesiones` | `MySessionsPanel` |
| `cuenta/preferencias` | `AccountPreferencesPage` |

### F3 — Header

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Dropdown alineado SPEC §9; breadcrumbs cuenta |
| **Archivos** | `Header.tsx`, `account-center-breadcrumbs.utils.ts`, `useShellBreadcrumbs.ts` |
| **Entrada** | F2 (rutas existentes) |
| **Salida** | «Mi cuenta» → `/app/cuenta/informacion`; eliminados 3 placeholders; tokens Capa 1 dropdown; breadcrumb Mi cuenta → sección |
| **Riesgos** | Regresión `Header.logout-all.test.tsx` — actualizar asserts |

### F4 — Información personal

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Sección read-only completa AC-02 |
| **Archivos** | `AccountProfilePage`, components/profile/*, `useAccountProfile`, `account-profile-display.utils.ts` |
| **Entrada** | F1+F2 |
| **Salida** | Campos SPEC §5 visibles; sin UUID; loading skeleton; roles empty state |
| **Riesgos** | `empresa_activa` solo UUID — resolver nombre vía `empresasElegibles` AuthContext |

### F5 — Seguridad (cambio password)

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Cambio voluntario password vía `completePasswordChange` |
| **Archivos** | `AccountChangePasswordForm`, `AccountSecurityPage`, `account-password-validation.ts`, refactor `ChangePasswordPage.tsx` |
| **Entrada** | F4 (hub navegable) |
| **Salida** | Submit OK → toast + clear form; errores API; validación cliente |
| **Riesgos** | Duplicar toast (ER-02) — error solo hook o patrón existente ChangePasswordPage |

### F6 — Logout All (integración Seguridad)

| Campo | Detalle |
|-------|---------|
| **Objetivo** | CTA Seguridad + paridad Header; cerrar gaps FRONTEND_AUTH_AUDIT |
| **Archivos** | `AccountSecuritySessionGlobalCard`, `AccountSecurityPage`, opcional `auth-provider-termination.compositor.ts`, `Header.tsx` toast error |
| **Entrada** | F5 |
| **Salida** | Mismo `LogoutAllConfirmDialog`; guards `requiresPasswordChange` oculta CTA; toast en error 403/500 |
| **Riesgos** | Doble dialog si Header y Seguridad abren simultáneo — state local por página |

### F7 — Sesiones

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Integrar `MySessionsPage` bajo hub sin regresión |
| **Archivos** | `MySessionsPanel.tsx`, refactor `MySessionsPage.tsx`, `AccountAdminSessionsLink.tsx` |
| **Entrada** | F1+F2 |
| **Estrategia refactor** | Opción A (preferida): extraer `MySessionsPageContent` en mismo archivo o `MySessionsContent.tsx`; `MySessionsPage` re-export; `MySessionsPanel` = SectionHeader + Content. Opción B: wrapper route-only sin tocar page — riesgo doble padding layout |
| **Salida** | Paridad tests enterprise sesiones; breadcrumb Sesiones; enlace admin condicional |
| **Riesgos** | **Alto** — regresión IAM; ejecutar suite `useMySessionsList`, `active-sessions-views.enterprise` |

### F8 — Preferencias

| Campo | Detalle |
|-------|---------|
| **Objetivo** | UI tema 3 estados + nav mode; sync Header |
| **Archivos** | `AccountPreferencesPage`, cards preferences/* |
| **Entrada** | F1+F2 |
| **Salida** | Cambio radio refleja shell instantáneo; copy localStorage notice |
| **Riesgos** | Bajo — contexts ya probados |

### F9 — QA

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Tests automatizados + checklist manual SPEC |
| **Archivos** | `features/account/__tests__/*`, actualizar Header tests |
| **Entrada** | F3–F8 completos |
| **Salida** | `tsc --noEmit` PASS; tests nuevos PASS; checklist §12 completo |
| **Riesgos** | Cobertura SSO condicional sin campo BE — skip test documentado |

### F10 — Cleanup

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Deuda residual; signoff épica |
| **Archivos** | Revisión imports; comentarios TODO SSO; epic report opcional `ACCOUNT_CENTER_V1_SIGNOFF.md` *(fuera alcance si user prohíbe docs extra — solo código hygiene)* |
| **Entrada** | F9 PASS |
| **Salida** | Sin placeholders; sin rutas huérfanas; linter limpio en paths tocados |
| **Riesgos** | Ninguno crítico |

---

## 5. Reutilización — reglas anti-duplicación

| Capacidad | Reutilizar | Prohibido |
|-----------|------------|-----------|
| Listado sesiones self | `MySessionsPage` content + hooks admin | Nueva page `AccountSessionsPage` con fetch propio |
| Tabla/card sesiones | `ActiveSessions*View variant=self` | `MySessionsTableView` duplicado |
| Logout all HTTP | `logoutAllSessions()` AuthContext | Nueva llamada directa en SecurityPage |
| Change password HTTP | `completePasswordChange()` | Llamar `authService.changePassword` desde page sin AuthContext |
| Logout all dialog | `LogoutAllConfirmDialog` | Segundo componente confirm |
| Revoke dialog | `ConfirmDialog` patrón MySessions | Custom modal |
| Validación password | Util compartida post-extracción | Copiar función en Account form |
| Preferencias | `useTheme`, `useNavMode` | Nuevo localStorage keys |
| Layout tabular | `InvPageLayout` | Reimplement OrgPageLayout |

---

## 6. Cambios en Header

### 6.1 Dropdown — diff funcional

| Acción | Detalle técnico |
|--------|-----------------|
| **Añadir** | Botón «Mi cuenta» `onClick={() => navigate('/app/cuenta/informacion')}` |
| **Mantener** | «Mis sesiones» → `/app/cuenta/sesiones` |
| **Eliminar JSX** | Botones «Mi perfil», «Bandeja de entrada», «Configuraciones de la cuenta» |
| **Mantener** | Logout, Logout all + `LogoutAllConfirmDialog`, bloque identidad, admin global |
| **CSS** | Reemplazar `bg-brand-surface`, `border-brand-border`, `text-brand-text-*` → tokens Capa 1 (UX §15.2) |

### 6.2 Barra Header (sin dropdown)

| Control | Cambio |
|---------|--------|
| `EmpresaSelector` | Ninguno |
| Toggle tema / nav | Ninguno |
| Breadcrumbs | Integrar `resolveAccountCenterBreadcrumbs(pathname)` antes de fallback Dashboard |

### 6.3 Tests Header a actualizar

- `src/shared/components/layout/__tests__/Header.logout-all.test.tsx`
- Añadir: `Header.account-center.test.tsx` — presencia «Mi cuenta», ausencia placeholders

---

## 7. Cambios en Routing

### 7.1 Antes (actual)

```text
appRouteChildren:
  - path: 'cuenta/sesiones' → MySessionsPage (lazy, plano)
```

### 7.2 Después (V1)

```text
appRouteChildren:
  - path: 'cuenta' → AccountCenterLayout
      children:
        - index → Navigate informacion
        - informacion → AccountProfilePage
        - seguridad → AccountSecurityPage
        - sesiones → MySessionsPanel
        - preferencias → AccountPreferencesPage
```

### 7.3 Sin cambio

| Ruta | Notas |
|------|-------|
| `/change-password` | Permanece en `authRoutes` |
| `/admin/sesiones` | Admin IAM |
| `/login` | Post logout |

### 7.4 Lazy loading

- `AccountCenterLayout` + pages: lazy en `account/routes.tsx` con `Suspense` + `LoadingSpinner` (patrón `app-route-tree` existente).

---

## 8. Cambios en Auth

### 8.1 AuthContext shell (`shared/context/AuthContext.tsx`)

| Cambio | Veredicto |
|--------|-----------|
| API pública | **Sin cambios** |
| Nuevos métodos | **No** |

### 8.2 Compositors

| Compositor | Cambio |
|------------|--------|
| `auth-provider-public-actions` | **Reutilizar** `completePasswordChange`, `requiresPasswordChange` |
| `auth-provider-termination` | **Reutilizar** `logoutAllSessions`; opcional UX toast F6 |
| `auth-provider-interceptors` | **Sin cambios** — force-password sigue bloqueando hub |
| `auth-provider-bootstrap` | **Sin cambios** |
| `auth-provider-cleanup` | **Sin cambios** |

### 8.3 Interceptors / Axios

| Área | Cambio |
|------|--------|
| Request interceptor | **Sin cambios** — change/logout_all con Bearer auto |
| Password redirect whitelist | **Sin cambios** — rutas cuenta no necesitan whitelist (no son auth API) |
| `auth.service.ts` | **Sin cambios** obligatorios |

### 8.4 Guards en pages (no AuthContext)

| Guard | Dónde implementar |
|-------|-------------------|
| `requiresPasswordChange` | Hereda `ProtectedRoute` — no duplicar |
| Ocultar logout all CTA | `AccountSecuritySessionGlobalCard` + Header `showLogoutAllOption` añadir `!requiresPasswordChange` |
| Impersonación | Reutilizar checks existentes Header/termination |
| SSO hide password | `AccountSecurityPage` — condicional cuando exista `proveedor_autenticacion`; V1 fallback: mostrar form |

### 8.5 React Query

| Query | Cambio |
|-------|--------|
| `MY_SESSIONS_LIST_QUERY_KEY` | **Sin cambio** |
| Invalidación post-revoke | **Sin cambio** |

---

## 9. Riesgos técnicos

| ID | Riesgo | Sev. | Mitigación |
|----|--------|------|------------|
| RT1 | Regresión MySessions al anidar layout | Alta | F7 dedicada; tests enterprise existentes |
| RT2 | Doble layout/padding Sesiones | Media | Refactor content vs wrapper explícito |
| RT3 | Breadcrumb no resuelve `/app/cuenta/*` | Baja | Mapa estático F3 |
| RT4 | Toast duplicado password error | Media | Seguir ER-02 — un solo origen |
| RT5 | Header test breakage | Baja | Actualizar en F3/F6 |
| RT6 | Import `auth → account → admin` cycle | Baja | account importa admin hooks (precedente IAM); account **no** exportado a admin |
| RT7 | Force-password accede hub URL manual | Baja | ProtectedRoute redirect existente |
| RT8 | Logout all sin toast error Header | Media | F6 — `getErrorMessage` + toast en catch SecurityPage |
| RT9 | Empresa nombre no resuelto | Media | `account-profile-display.utils` + `empresasElegibles` |
| RT10 | Scope creep edición perfil | Alta | SPEC §12 — code review gate |

---

## 10. Estrategia de rollback

### 10.1 Por fase (git revert)

| Fase | Rollback | Efecto |
|------|----------|--------|
| F1–F2 | Revert commit(s) layout+routing | Vuelve `cuenta/sesiones` plano si se restaura diff router |
| F3 | Revert Header | Placeholders visibles de nuevo (estado previo) |
| F4–F8 | Revert módulo `features/account` parcial | Hub parcial roto — revertir bloque completo F1–F8 recomendado |
| F9–F10 | Revert tests only | No afecta prod |

### 10.2 Rollback parcial Sesiones

Si F7 falla en QA: mantener ruta plana temporal `cuenta/sesiones` **fuera** del layout hub (feature flag interno `ACCOUNT_CENTER_SESSIONS_IN_HUB=false` opcional en `account.routes.ts`) — **solo si necesario**; preferir fix forward.

### 10.3 Sin feature flag global V1

No hay flag compilado obligatorio en SPEC. Rollback = **revert git** por PR atómico por fase.

### 10.4 Auth rollback

Imposible sin revert — **no se modifican compositors** salvo toast opcional F6 (aislado).

---

## 11. Plan de pruebas

### 11.1 Tests unitarios nuevos

| Test | Archivo | Cubre |
|------|---------|-------|
| Validación password | `account-password-validation.test.ts` | Reglas 8+/mayúsc/minúsc/número |
| Profile display utils | `account-profile-display.utils.test.ts` | Sin UUID; nombre empresa |
| Breadcrumbs cuenta | `account-center-breadcrumbs.utils.test.ts` | 4 rutas + redirect |
| Sidebar nav activo | `AccountCenterSidebar.test.tsx` | `aria-current` por ruta mock |

### 11.2 Tests integración / componente

| Test | Archivo | Cubre |
|------|---------|-------|
| Profile page render | `AccountProfilePage.test.tsx` | Campos read-only desde mock `useAuth` |
| Security form submit | `AccountChangePasswordForm.test.tsx` | Llama `completePasswordChange` mock |
| Security logout all | `AccountSecurityPage.test.tsx` | Abre dialog; guard impersonation |
| Preferences sync | `AccountPreferencesPage.test.tsx` | Cambio tema llama `setThemeMode` |
| Header mi cuenta | `Header.account-center.test.tsx` | Nav + no placeholders |

### 11.3 Regresión existente (MUST PASS)

| Suite | Motivo |
|-------|--------|
| `Header.logout-all.test.tsx` | Logout all Header |
| `useMySessionsList.test.ts` | Sesiones data |
| `useRevokeSession.test.ts` | Self revoke |
| `active-sessions-views.enterprise.test.tsx` | variant self |
| `LogoutAllConfirmDialog.test.tsx` | Dialog |
| `auth-provider-contract.test.ts` | Sin cambio API AuthContext |
| `ProtectedRoute` / force-password tests | Guards |

### 11.4 Pruebas manuales (checklist)

| # | Escenario |
|---|-----------|
| M1 | Header → Mi cuenta → Información personal carga |
| M2 | Sidebar navega 4 secciones; breadcrumb actualiza |
| M3 | Cambio password voluntario OK → toast → form limpio |
| M4 | Password incorrecta → error visible |
| M5 | Seguridad → Logout all → confirm → login |
| M6 | Header logout all sigue funcionando |
| M7 | Sesiones: tabla/grid, revoke, empty, error retry |
| M8 | Preferencias tema/nav ↔ Header toggles sync |
| M9 | Force-password: URL `/app/cuenta/seguridad` redirect `/change-password` |
| M10 | Impersonación: logout all oculto/bloqueado |
| M11 | Placeholders eliminados — no botones muertos |
| M12 | No UUID visible en Información personal |

### 11.5 Comandos CI

```text
npx tsc --noEmit
npm test -- features/account
npm test -- Header
npm test -- MySessions
npm test -- active-sessions-views
```

---

## 12. Criterios de aceptación (épica completa)

### 12.1 Hub y navegación

- [ ] Rutas `/app/cuenta`, `/app/cuenta/informacion`, `/seguridad`, `/sesiones`, `/preferencias` operativas
- [ ] Redirect `/app/cuenta` → `informacion`
- [ ] Sidebar 4 ítems; item activo correcto
- [ ] Breadcrumb: Inicio → Mi cuenta → [Sección]
- [ ] Desktop First layout ≥1280px sin regresión AppLayout

### 12.2 Header (AC-06)

- [ ] «Mi cuenta» navega a hub
- [ ] «Mis sesiones» atajo funcional
- [ ] Eliminados: Mi perfil, Bandeja, Configuraciones cuenta
- [ ] Logout y Logout all operativos
- [ ] Dropdown tokens Capa 1 (sin `bg-brand-surface` estructural)

### 12.3 Información personal (AC-02)

- [ ] Campos SPEC §5.2 visibles read-only
- [ ] Sin UUID en UI (E-ME4)
- [ ] Roles listados o empty state
- [ ] Banner read-only notice
- [ ] Loading skeleton inicial

### 12.4 Seguridad (AC-03)

- [ ] Cambio voluntario password funcional (`completePasswordChange`)
- [ ] Validación cliente alineada BE
- [ ] Logout all desde Seguridad con dialog
- [ ] Hint logout dispositivo actual → Header
- [ ] Logout all oculto si `requiresPasswordChange`
- [ ] Toast error logout all en fallo API

### 12.5 Sesiones (AC-04)

- [ ] `MySessionsPage` paridad funcional pre-hub
- [ ] Sin segunda implementación listado
- [ ] Revoke self + estados loading/error/empty
- [ ] Enlace admin condicional (si RBAC)

### 12.6 Preferencias (AC-05)

- [ ] Tema claro/oscuro/sistema
- [ ] Modo sidebar/navbar
- [ ] Sync con Header toggles
- [ ] Notice preferencias locales

### 12.7 Auth / regresión

- [ ] AuthContext API sin cambios breaking
- [ ] `/change-password` force flow intacto
- [ ] `ProtectedRoute` force-password bloquea hub
- [ ] Tests regresión §11.3 PASS
- [ ] `tsc --noEmit` PASS

### 12.8 Normas V2

- [ ] TB-01: sin H1 body
- [ ] SK-01 / ES-01: sesiones skeleton/empty
- [ ] ER-02: toast error en hook/mutation
- [ ] UX-06: logout all / revoke `variant danger`
- [ ] BR-01/05: tokens Capa 1 estructura Mi Cuenta

---

## 13. Autoauditoría

| Pregunta | Respuesta |
|----------|-----------|
| ¿Contiene código React/TS/CSS implementable? | **No** — solo nombres de archivos y responsabilidades |
| ¿Redefine funcionalidad SPEC? | **No** |
| ¿Redefine UX? | **No** — referencia UX DESIGN |
| ¿Modifica docs oficiales V2/cursorrules? | **No** |
| ¿Permite duplicación sesiones/auth? | **No** — §5 anti-duplicación |
| ¿AuthContext refactor? | **No** — §8 |
| ¿Fases con criterios entrada/salida? | **Sí** — §4 |
| ¿Rollback definido? | **Sí** — §10 |
| ¿Tests definidos? | **Sí** — §11 |
| ¿Checklist aceptación? | **Sí** — §12 |

---

## 14. Dictamen final

# **A) Plan técnico aprobado y listo para implementación**

**Justificación:**

El plan define arquitectura modular (`features/account/`), inventario completo de archivos nuevos/modificados/reutilizados, orden de dependencias en 10 fases, impacto Auth **limitado a reutilización** (sin cambio contrato AuthContext), routing anidado `/app/cuenta/*`, integración Header/Sesiones/Seguridad alineada con SPEC y UX DESIGN, estrategia rollback por fase, plan de pruebas y checklist de aceptación exhaustivo.

**No quedan bloqueantes técnicos** antes de iniciar F1. Riesgo principal (RT1 regresión Sesiones) está acotado en F7 con estrategia de refactor explícita y suites de regresión identificadas.

**Recomendación operativa:** Implementar en **PRs por fase** (F1–F2, F3, F4, F5–F6, F7, F8, F9) para facilitar review y rollback.

---

*Implementation Plan ACCOUNT_CENTER_V1 — 2026-06-24.*
