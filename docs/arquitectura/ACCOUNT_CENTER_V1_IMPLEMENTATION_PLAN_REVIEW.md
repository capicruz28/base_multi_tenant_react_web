# ACCOUNT_CENTER_V1 — Revisión crítica del Implementation Plan

**Documento:** `docs/arquitectura/ACCOUNT_CENTER_V1_IMPLEMENTATION_PLAN_REVIEW.md`  
**Objeto auditado:** `docs/arquitectura/ACCOUNT_CENTER_V1_IMPLEMENTATION_PLAN.md` v1.0  
**Fecha:** 2026-06-24  
**Modo:** READ ONLY — sin modificación del plan ni del código  
**Rol:** Arquitecto Principal Frontend ERP

**Referencias:** SPEC, UX DESIGN y AUDIT cerrados — esta revisión **no** reevalúa funcionalidad ni UX.

---

## 1. Resumen ejecutivo

El Implementation Plan es ** arquitectónicamente sólido y alineado** con Baseline V1 (shell AuthContext estable), V2 (reutilización INV/ORG, anti-duplicación sesiones) y el gate IAM Sessions FE (import `account/admin` unidireccional).

La decisión de **`features/account/`** como módulo hub es correcta frente a extender `features/auth/` (login, force-password, selección empresa).

**Veredicto:** el plan puede ejecutarse, pero **no** debe implementarse literalmente en todos los puntos del inventario. Hay **sobre-fragmentación de componentes**, **F7 más compleja de lo necesaria** y **ajustes menores** en ubicación de utils, fases y toast logout-all. Ninguno es bloqueante si se aplican las recomendaciones de esta revisión **durante** la implementación (sin reescribir el plan).

---

## 2. Arquitectura

### 2.1 Evaluación `features/account`

| Criterio | Evaluación |
|----------|------------|
| Separación auth vs cuenta autenticada | ✅ Correcta — `/change-password` permanece en `auth` |
| Cohesión | ✅ Alta — hub self-service acotado |
| Acoplamiento | ⚠️ Aceptable — `account → admin` (hooks IAM) y `account → auth` (MySessions, validación password); **sin** `admin → account` |
| Alineación Baseline V1 P-01 | ✅ No toca compositors ni shell AuthContext |
| Patrón vs ORG/INV | ⚠️ ORG usa `OrgRouter` + `<Routes>` interno; account usa `RouteObject` + `Outlet` — **válido** en `createBrowserRouter`; coherente con entrada plana actual en `app-route-tree` |

**Dictamen:** **mantener** módulo `features/account/`.

### 2.2 Alternativa descartada (correctamente)

| Alternativa | Por qué no |
|-------------|------------|
| Todo en `features/auth/pages/` | Mezcla pre-auth y post-auth; viola separación conceptual SPEC |
| Hub solo en `shared/` | Sin dominio feature; rompe convención `features/*` del ERP |

### 2.3 Recomendación arquitectónica principal

**Centralizar título de sección en el layout** mediante mapa de rutas en `account.routes.ts`, en lugar de repetir `AccountCenterSectionHeader` en cada page y en `MySessionsPanel`.

```
AccountCenterLayout
├── AccountCenterSidebar
├── AccountCenterSectionHeader  ← derivado de pathname / route handle
└── Outlet (wrapper narrow | full según ruta)
```

| Elemento | Acción recomendada |
|----------|-------------------|
| `AccountCenterSectionHeader` en cada page | **Fusionar** — una sola instancia en layout |
| Wrapper `max-w` estrecho vs full width | **Mantener** lógica en layout (`informacion|seguridad|preferencias` → narrow; `sesiones` → full) |

Reduce 4 imports duplicados y evita olvidar header en una sección nueva.

---

## 3. Inventario de archivos — auditoría item por item

### 3.1 Mantener (necesarios)

| Archivo | Motivo |
|---------|--------|
| `account.routes.ts` | SSOT paths + metadata sección/breadcrumb |
| `routes.tsx` | Registro hijos (patrón desacoplado de `app-route-tree`) |
| `layout/AccountCenterLayout.tsx` | Core hub |
| `components/AccountCenterSidebar.tsx` | Nav interna |
| `pages/AccountProfilePage.tsx` | Orquestación AC-02 |
| `pages/AccountSecurityPage.tsx` | Orquestación AC-03 |
| `pages/AccountPreferencesPage.tsx` | Orquestación AC-05 |
| `components/security/AccountChangePasswordForm.tsx` | DRY con force flow |
| `components/security/AccountSecuritySessionGlobalCard.tsx` | Logout all en hub |
| `utils/account-profile-display.utils.ts` | E-ME4 empresa/tipo usuario |
| `utils/account-center-breadcrumbs.utils.ts` | Header breadcrumb |
| `__tests__/*` | QA |

### 3.2 Fusionar / simplificar

| Archivo plan | Acción | Fusión propuesta |
|--------------|--------|------------------|
| `AccountCenterSectionHeader.tsx` | **Fusionar en layout** | Un componente, un uso |
| `AccountProfileIdentityCard` + `AccountProfileDetailsGrid` | **Opcional fusionar** | Una card «Identidad y datos» + card «Roles» (2 cards en lugar de 4) |
| `AccountProfileRolesList` | **Mantener** o sub-bloque de card fusionada | — |
| `AccountReadOnlyNotice` | **Mantener** | Pie de ProfilePage — 10 líneas inline también válido |
| `AccountPreferencesAppearanceCard` + `NavigationCard` | **Mantener** | Granularidad OK (2 bloques UX distintos) |
| `AccountAdminSessionsLink.tsx` | **Fusionar** | Inline en wrapper sesiones o en layout meta — componente de ~15 líneas no justifica archivo solo |
| `pages/MySessionsPanel.tsx` | **Simplificar** | Ver §7 — puede eliminarse como page |
| `hooks/useAccountCenterNav.ts` | **Eliminar** | Array constante en `AccountCenterSidebar.tsx` |
| `hooks/useAccountProfile.ts` | **Eliminar en V1** | Lógica en page + utils; hook solo si page > ~120 líneas post-UX |

### 3.3 Mover (ubicación incorrecta en plan)

| Archivo plan | Acción | Destino recomendado |
|--------------|--------|---------------------|
| `account-password-validation.ts` en `features/account/utils/` | **Mover** | `features/auth/utils/password-validation.utils.ts` (o `core/auth/utils/`) — consumido por `ChangePasswordPage` y form account; dominio **auth**, no account |

Evita dependencia `auth → account` para validación.

### 3.4 Eliminar del inventario inicial (innecesarios si se aplica §2.3 y §7)

| Archivo | Razón |
|---------|-------|
| `MySessionsPanel.tsx` | Sustituible por ruta directa a `MySessionsPage` + header en layout |
| `useAccountCenterNav.ts` | Config estática en sidebar |
| `useAccountProfile.ts` (V1) | YAGNI |

### 3.5 Archivos modificados — validación

| Archivo | Veredicto |
|---------|-----------|
| `app-route-tree.tsx` | **Mantener** — cambio inevitable y acotado |
| `Header.tsx` | **Mantener** — impacto acotado si diff limitado a dropdown + 1 guard (ver §5) |
| `useShellBreadcrumbs.ts` | **Mantener** — preferir delegar a `account-center-breadcrumbs.utils` sin inflar `useShellBreadcrumbs` |
| `MySessionsPage.tsx` | **Evitar modificar en V1** — ver §7 |
| `ChangePasswordPage.tsx` | **Mantener** — solo import validación movida |
| `auth-provider-termination.compositor.ts` | **Eliminar del scope** — ver §6 |

---

## 4. Componentes — granularidad y consistencia ORG/INV

### 4.1 Granularidad

| Área | Plan | Revisión |
|------|------|----------|
| Profile (4 subcomponentes) | Alta fragmentación | **Aceptable** para testabilidad; **opcional** reducir a 2 cards |
| Security (2 cards + form) | Adecuada | **Mantener** — separación password vs logout all es clara |
| Preferences (2 cards) | Adecuada | **Mantener** |
| Layout (3 piezas) | Adecuada | **Mantener** |

### 4.2 Riesgo sobreingeniería

| Señal | Severidad |
|-------|-----------|
| Hooks opcionales duplicando `useAuth` | Media — **no crear** en V1 |
| `MySessionsPanel` + refactor content | Alta — **sobreingeniería** |
| Componente dedicado admin link | Baja — **inline OK** |

### 4.3 Consistencia ORG/INV

| Patrón INV/ORG | Plan account | Alineado |
|----------------|--------------|----------|
| `OrgPageLayout` / toolbar first | Sesiones conserva `OrgCompanyToolbar` | ✅ |
| Sin H1 body (TB-01) | Section header L1 en layout | ✅ |
| Tokens Capa 1 | Plan lo exige; Header dropdown fix en F3 | ✅ |
| Module `routes.tsx` | Sí | ✅ (ORG usa default export router — diferencia menor aceptable) |

---

## 5. Header — impacto mínimo

### 5.1 Cambios necesarios (mínimo viable)

| Cambio | Obligatorio V1 |
|--------|----------------|
| Añadir «Mi cuenta» + navigate | ✅ |
| Eliminar 3 placeholders | ✅ |
| Actualizar ruta «Mis sesiones» (misma URL post-F2) | ✅ |
| Añadir `!requiresPasswordChange` a `showLogoutAllOption` | ✅ — **omitido explícitamente en §6.1 del plan**; FRONTEND_AUTH_AUDIT G3 |
| Tokens Capa 1 dropdown | ✅ Recomendado misma PR |
| Refactor bloque identidad / badges | ❌ Fuera scope — no tocar |

### 5.2 Impacto real

| Dimensión | Nivel |
|-----------|-------|
| Líneas estimadas | ~40–60 netas (eliminar 3 botones, añadir 1, CSS class swap) |
| Riesgo regresión | Bajo — tests `Header.logout-all` existentes |
| Acoplamiento | Bajo — solo import path constants desde `account.routes.ts` |

**Veredicto:** impacto **mínimo y aceptable** si el PR Header no incluye refactors colaterales del bloque identidad.

---

## 6. Auth — confirmación de cambios

### 6.1 Sin cambios (confirmado)

| Artefacto | Cambio |
|-----------|--------|
| `AuthContext` shell / API pública | **Ninguno** |
| `auth-provider-public-actions` | **Ninguno** |
| `auth-provider-interceptors` | **Ninguno** |
| `auth-provider-bootstrap` / cleanup | **Ninguno** |
| `auth.service.ts` | **Ninguno** obligatorio |

### 6.2 Cambios que el plan marca opcionales — revisión

| Cambio propuesto | ¿Necesario? | Recomendación |
|------------------|-------------|---------------|
| Toast logout-all en `auth-provider-termination.compositor.ts` | **No** | **Eliminar del scope.** Implementar toast en `AccountSecurityPage` / Header `handleConfirmLogoutAll` catch — errores UX de flujo usuario, no terminación core |
| Guard `requiresPasswordChange` en Header | **Sí** — en UI Header, no AuthContext | Añadir a condición `showLogoutAllOption` |

### 6.3 ER-02 y cambio password

El plan advierte RT4 (toast duplicado). **Confirmación:** `AccountChangePasswordForm` debe seguir el patrón de `ChangePasswordPage` — toast error en submit catch **o** único banner campo; no ambos para el mismo error API.

**Auth: listo para implementar sin tocar compositors.**

---

## 7. Sesiones (F7) — análisis crítico

### 7.1 Riesgo declarado en plan

RT1 (regresión) y RT2 (doble layout) son **reales**. El plan reconoce Opción B (wrapper sin tocar page) como inferior; Opción A (extraer content) como preferida — **la revisión discrepa**.

### 7.2 Evidencia código actual

`InvPageLayout` es un wrapper trivial:

```tsx
// OrgPageLayout — alias InvPageLayout
<div className="w-full">{children}</div>
```

`MySessionsPage` ya usa `InvPageLayout`. Anidar bajo `AccountCenterLayout` **no** introduce doble padding estructural salvo que el layout hub añada padding extra al outlet.

### 7.3 Alternativa más simple (recomendada)

**Opción C — zero refactor `MySessionsPage`:**

| Paso | Acción |
|------|--------|
| 1 | `account/routes.tsx`: `lazy(() => import('@/features/auth/pages/MySessionsPage'))` en ruta `sesiones` |
| 2 | `AccountCenterLayout`: sidebar + section header from route map + `<Outlet />` |
| 3 | Outlet wrapper: `sesiones` → sin `max-w`; otras rutas → `max-w-3xl mx-auto` |
| 4 | **No** crear `MySessionsPanel.tsx` |
| 5 | **No** modificar `MySessionsPage.tsx` en V1 |
| 6 | Enlace admin: bloque opcional bajo section header en layout cuando `pathname.includes('sesiones')` o meta ruta |

**Ventajas:** cero regresión lógica IAM; tests enterprise siguen importando `MySessionsPage` sin cambios; F7 pasa de «alto riesgo» a «bajo riesgo».

**Único delta UX vs plan:** section header vive en layout, no en panel intermedio — mismo resultado visual.

### 7.4 Cuándo sí tocar `MySessionsPage`

Solo si QA detecta:
- conflicto scroll doble → ajustar flex en `AccountCenterLayout` (`min-h-0`, `overflow-auto` en content)
- necesidad copy admin link dentro del toolbar sesiones → añadir prop opcional `footerSlot?: ReactNode` — **no** extraer content

### 7.5 Veredicto F7

| Estrategia plan (Opción A refactor) | **Sustituir por Opción C** |
|-------------------------------------|----------------------------|
| `MySessionsPanel.tsx` | **Eliminar** |
| Refactor `MySessionsPage` | **Posponer / cancelar** V1 |

---

## 8. Routing

### 8.1 Rutas y redirects

| Aspecto | Evaluación |
|---------|------------|
| Árbol `cuenta` + children | ✅ Correcto |
| Redirect index → `informacion` | ✅ Alineado SPEC |
| Reemplazo ruta plana `cuenta/sesiones` | ✅ Obligatorio — no duplicar |
| Deep links Header | ✅ Compatibles post-F2 |

### 8.2 Lazy loading

| Observación | Recomendación |
|-------------|---------------|
| Plan: lazy por page en `account/routes.tsx` | **Mantener** |
| Suspense boundary | Un `Suspense` en `app-route-tree` al montar `cuenta` **o** por hijo — seguir patrón existente `cuenta/sesiones` (spinner «Cargando sesiones…») |
| Lazy layout + lazy children | Layout puede ser **eager** (pequeño) y pages lazy — evita flash sidebar vacío |

### 8.3 Compatibilidad `app-route-tree`

Entrada propuesta es idiomática para `RouteObject[]`:

```text
{ path: 'cuenta', element: <AccountCenterRoutes /> }
```

donde `AccountCenterRoutes` exporta layout + children, **o** spread de `accountRouteBranch` — **mantener** modularidad del plan.

**Riesgo no detectado en plan:** bookmark `/app/cuenta/sesiones` durante deploy parcial (F1–F2 sin F7 content) — mitigación: merge F1+F2 con al menos stub o ruta sesiones apuntando a MySessionsPage en mismo PR.

---

## 9. Dependencias entre fases

### 9.1 Orden plan vs revisión

| Dependencia plan | Válida |
|------------------|--------|
| F2 antes F3 | ✅ |
| F5 antes F6 | ✅ pero **fusionables en un PR** |
| F7 después F1+F2 | ✅ |
| F4 antes F5 | ⚠️ **No estricta** — F5 puede paralelizarse tras F2 |
| F8 solo necesita F1+F2 | ✅ — **puede ir en paralelo con F4–F7** |

### 9.2 Error de secuenciación

F7 **no depende** de F4 ni F5. El plan la coloca tarde (después F6) por riesgo, no por dependencia técnica. **Recomendación:** ejecutar F7 (Opción C) **inmediatamente después F2** en el mismo PR que routing, para que «Mis sesiones» nunca quede rota.

---

## 10. Riesgos adicionales (no en plan)

| ID | Riesgo | Sev. | Mitigación |
|----|--------|------|------------|
| RA1 | Deploy intermedio sin ruta `cuenta/sesiones` | Alta | F2 incluye sesiones en mismo PR |
| RA2 | `account.routes` importado en Header crea cycle | Baja | Export solo strings/constants desde `account.routes.ts` sin importar pages |
| RA3 | Section header layout desincronizado al añadir ruta | Media | SSOT meta en `account.routes.ts` |
| RA4 | Toast password viola ER-02 si form + hook mutación | Media | Documentar patrón en F5: mismo que ChangePasswordPage |
| RA5 | Tests import path `MySessionsPage` desde auth | Baja | Opción C no mueve archivo |
| RA6 | Responsive sidebar plan UX vs impl | Baja | F8/F10 — tabs mobile pueden ser F1 layout con CSS only |

---

## 11. Simplificación de fases

### 11.1 Plan actual: 10 fases

Válido para tracking granular; **excesivo** para PRs pequeños en equipo reducido.

### 11.2 Propuesta consolidada (7 fases operativas)

| Fase | Contenido | PR sugerido |
|------|-----------|-------------|
| **P1** | Shell + routing + sesiones sin refactor (F1+F2+F7 Opción C) | 1 PR crítico |
| **P2** | Header + breadcrumbs (F3) | 1 PR |
| **P3** | Información personal (F4) | 1 PR |
| **P4** | Seguridad + logout all + validación DRY (F5+F6) | 1 PR |
| **P5** | Preferencias (F8) | 1 PR |
| **P6** | QA automatizado + manual (F9) | — |
| **P7** | Cleanup tokens Header si pendiente (F10) | opcional merge en P2 |

**Eliminar como fases separadas:** F10 standalone (absorbido en P6/P2); F6 separada de F5; F7 separada de F2.

### 11.3 ¿10 fases incorrectas?

**No** — son correctas pedagógicamente. **Sí** pueden simplificarse operativamente sin cambiar el plan documental.

---

## 12. Matriz de acciones consolidada

| Item | Acción auditor |
|------|----------------|
| Módulo `features/account/` | **Mantener** |
| Layout + sidebar + routes | **Mantener** |
| Section header por page | **Fusionar** en layout |
| 4 profile cards | **Mantener** (o fusionar a 2 — opcional) |
| `MySessionsPanel` | **Eliminar** — usar Opción C |
| Refactor `MySessionsPage` | **Eliminar** del scope V1 |
| `useAccountCenterNav` | **Eliminar** |
| `useAccountProfile` V1 | **Eliminar** |
| `password-validation` en account | **Mover** a `features/auth/utils` |
| `auth-provider-termination` toast | **Eliminar** del scope |
| Header `requiresPasswordChange` guard | **Añadir** (plan incompleto) |
| Compositors Auth | **Sin cambios** |
| 10 fases | **Mantener** doc; **7 PRs** en ejecución |

---

## 13. Conclusión por área

| # | Área | Resultado |
|---|------|-----------|
| 1 | Arquitectura | ✅ Sólida — ajuste layout centralizado |
| 2 | Inventario | ⚠️ Reducir ~3–5 archivos/hooks |
| 3 | Componentes | ⚠️ Profile ligeramente sobre-particionado — aceptable |
| 4 | Routing | ✅ Correcto — merge F2+F7 en deploy |
| 5 | Header | ✅ Impacto mínimo — completar guard logout all |
| 6 | Auth | ✅ Sin cambios compositors |
| 7 | Sesiones | ⚠️ **Cambiar estrategia F7 a Opción C** |
| 8 | Dependencias | ⚠️ F7 no debe esperar F6 |
| 9 | Riesgos | RA1–RA3 añadidos |
| 10 | Fases | Simplificar a 7 PRs operativos |

---

## 14. Autoauditoría

| Pregunta | Respuesta |
|----------|-----------|
| ¿Se modificó `ACCOUNT_CENTER_V1_IMPLEMENTATION_PLAN.md`? | **No** |
| ¿Se modificó código fuente? | **No** |
| ¿Se redefinió SPEC/UX? | **No** |
| ¿Se auditó Backend? | **No** |
| ¿Revisión READ ONLY? | **Sí** |
| ¿Dictamen sobre implementabilidad? | **Sí** — con ajustes menores |

---

## 15. Dictamen final

# **B) Plan aprobado con ajustes menores recomendados**

**Justificación:**

El Implementation Plan es **implementable** y representa la **solución correcta** a nivel módulo (`features/account/`, routing anidado, reutilización IAM/auth, AuthContext intacto). No requiere reescritura del plan ni correcciones arquitectónicas mayores.

Los ajustes recomendados son **operativos y de simplificación**, no cambios de dirección:

1. **F7:** adoptar **Opción C** (ruta directa a `MySessionsPage`, sin refactor ni `MySessionsPanel`).
2. **Layout:** centralizar **section header** y wrapper ancho/full en `AccountCenterLayout`.
3. **Utils password:** **mover** a `features/auth/utils`, no `account`.
4. **Hooks opcionales:** no crear `useAccountCenterNav` / `useAccountProfile` en V1.
5. **Auth compositor:** no modificar `auth-provider-termination` para toast; manejar en UI.
6. **Header:** añadir guard `!requiresPasswordChange` en logout all (gap del plan).
7. **PRs:** fusionar F1+F2+F7 en primer entregable; F5+F6 en uno solo.

**No aplica C)** — no hay fallo estructural, acoplamiento prohibido ni violación Baseline/V2 que impida comenzar F1.

---

*Revisión READ ONLY — ACCOUNT_CENTER_V1 Implementation Plan — 2026-06-24.*
