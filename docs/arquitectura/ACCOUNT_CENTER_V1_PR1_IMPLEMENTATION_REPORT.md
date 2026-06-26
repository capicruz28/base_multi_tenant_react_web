# ACCOUNT_CENTER_V1 — Informe de implementación PR1 (F1 + F2 + F7)

**Documento:** `docs/arquitectura/ACCOUNT_CENTER_V1_PR1_IMPLEMENTATION_REPORT.md`  
**Épica:** `ACCOUNT_CENTER_V1` (Mi Cuenta)  
**Alcance:** PR1 — Shell + Routing + Sesiones (Opción C)  
**Fecha:** 2026-06-24  
**Referencias:** SPEC, UX DESIGN, Implementation Plan, Implementation Plan Review

---

## 1. Resumen

Se implementó el **hub Mi Cuenta** como módulo `src/features/account/` con layout (sidebar + section header centralizado + outlet), árbol de rutas anidado bajo `/app/cuenta/*` y reutilización directa de `MySessionsPage` sin refactor IAM.

**No se avanzó a PR2** (Header, breadcrumbs, contenido de secciones).

---

## 2. Archivos creados

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/features/account/account.routes.ts` | SSOT paths, metadata sección (título, subtítulo, `contentVariant`) |
| `src/features/account/routes.tsx` | `RouteObject[]` exportable; lazy loading por page |
| `src/features/account/layout/AccountCenterLayout.tsx` | Shell hub: sidebar + section header + outlet (narrow/full) |
| `src/features/account/components/AccountCenterSidebar.tsx` | Nav interna 4 ítems (`NavLink`, iconos Lucide) |
| `src/features/account/components/AccountCenterSectionHeader.tsx` | Título L2 + subtítulo (TB-01 — no H1) |
| `src/features/account/pages/AccountProfilePage.tsx` | Stub PR1 — contenido en PR3 |
| `src/features/account/pages/AccountSecurityPage.tsx` | Stub PR1 — contenido en PR4 |
| `src/features/account/pages/AccountPreferencesPage.tsx` | Stub PR1 — contenido en PR5 |
| `src/features/account/__tests__/account.routes.test.ts` | Resolución metadata y paths |
| `src/features/account/__tests__/AccountCenterSidebar.test.tsx` | Render 4 links sidebar |

**Total:** 10 archivos nuevos.

---

## 3. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/app/router/app-route-tree.tsx` | Eliminada ruta plana `cuenta/sesiones`; spread `...accountRoutes` |

**Total:** 1 archivo modificado.

---

## 4. Archivos explícitamente NO tocados (alcance PR1)

| Área | Archivos |
|------|----------|
| Header | `Header.tsx`, `useShellBreadcrumbs.ts` |
| Auth | `AuthContext`, compositors, interceptors, `ChangePasswordPage` |
| Sesiones IAM | `MySessionsPage.tsx` (sin cambios) |
| Logout all | Sin cambios |
| Contenido secciones | Sin implementación real (stubs únicamente) |

---

## 5. Decisiones tomadas

### 5.1 F7 — Opción C (review arquitectónica)

| Decisión | Detalle |
|----------|---------|
| **No** `MySessionsPanel` | Ruta `sesiones` importa lazy `@/features/auth/pages/MySessionsPage` |
| **No** refactor `MySessionsPage` | Lógica IAM intacta |
| **No** `MySessionsPageContent` | No extraído |

### 5.2 Section header centralizado

- `AccountCenterLayout` resuelve sección vía `resolveAccountCenterSection(pathname)` desde `account.routes.ts`.
- Un único `AccountCenterSectionHeader` por ruta activa — no repetido en pages.
- Wrapper outlet: `max-w-3xl` para `informacion|seguridad|preferencias`; **full width** para `sesiones`.

### 5.3 Layout eager, pages lazy

- `AccountCenterLayout` se carga de forma **eager** (evita flash sidebar vacío).
- Pages hijas + `MySessionsPage` con `lazy()` + `Suspense` + `LoadingSpinner` (patrón `homeRoutes` / ruta anterior `cuenta/sesiones`).

### 5.4 Sidebar sin hook

- Array `ACCOUNT_CENTER_SECTIONS` en `account.routes.ts`.
- Iconos mapeados en `AccountCenterSidebar.tsx`.
- **No** creados `useAccountCenterNav` ni `useAccountProfile`.

### 5.5 Stubs de sección

- `AccountProfilePage`, `AccountSecurityPage`, `AccountPreferencesPage` exportan contenedor mínimo (`data-testid` + `aria-hidden`) para routing funcional sin anticipar PR3–PR5.

### 5.6 Diferidos conscientemente (fuera PR1)

| Item | PR destino |
|------|------------|
| Breadcrumbs Header | PR2 |
| Enlace admin condicional bajo Sesiones | PR posterior (layout o prop mínima) |
| `account-center-breadcrumbs.utils.ts` | PR2 |
| Tokens Capa 1 dropdown Header | PR2 |

---

## 6. Confirmación — recomendaciones de la revisión

| Recomendación review | Estado PR1 |
|---------------------|------------|
| Opción C F7 — ruta directa `MySessionsPage` | ✅ Aplicada |
| No `MySessionsPanel` | ✅ |
| No refactor `MySessionsPage` | ✅ |
| Section header en layout | ✅ |
| No `useAccountCenterNav` | ✅ |
| No `useAccountProfile` | ✅ |
| AuthContext sin cambios | ✅ |
| Compositors sin cambios | ✅ |
| Interceptors sin cambios | ✅ |
| `account.routes.ts` SSOT metadata | ✅ |
| Merge F1+F2+F7 mismo entregable | ✅ |

---

## 7. Validación de compilación y tests

### 7.1 TypeScript

```text
npx tsc --noEmit  →  PASS (exit 0)
```

### 7.2 Tests automatizados

```text
npx vitest run features/account MySessions active-sessions-views  →  PASS
```

| Suite | Resultado |
|-------|-----------|
| `account.routes.test.ts` | 3/3 PASS |
| `AccountCenterSidebar.test.tsx` | 1/1 PASS |
| `useMySessionsList.test.ts` | 3/3 PASS |
| `active-sessions-views.enterprise.test.tsx` | 9/9 PASS |

**Total:** 16 tests PASS — sin regresión IAM sesiones self.

---

## 8. Riesgos encontrados

| ID | Riesgo | Sev. | Estado |
|----|--------|------|--------|
| R1 | Doble encabezado visual en Sesiones (layout L1 + toolbar descriptor) | Baja | Aceptado — alineado UX DESIGN §7.3 (título hub + toolbar existente) |
| R2 | Breadcrumb no resuelve `/app/cuenta/*` hasta PR2 | Media | Conocido — Header sin cambios en PR1 |
| R3 | Stubs vacíos en 3 secciones | Baja | Esperado — PR3–PR5 |
| R4 | Scroll anidado layout vs tabla sesiones | Baja | No observado en tests; monitorear QA manual |
| R5 | Header «Mis sesiones» apunta a URL correcta pero sin entrada «Mi cuenta» | Baja | URL `/app/cuenta/sesiones` operativa; UX incompleta hasta PR2 |

---

## 9. Checklist de aceptación F1 + F2 + F7

### F1 — Shell

- [x] `AccountCenterLayout` renderiza sidebar + outlet
- [x] `AccountCenterSidebar` con 4 ítems orden fijo SPEC
- [x] Estados activo/default NavLink (borde `border-brand-primary`, `bg-overlay`)
- [x] Tokens Capa 1 estructura (`bg-surface`, `text-text-*`, `border-border-base`)
- [x] Section header centralizado (no H1 — `h2` visual)

### F2 — Routing

- [x] `/app/cuenta` → redirect `informacion`
- [x] `/app/cuenta/informacion` registrada
- [x] `/app/cuenta/seguridad` registrada
- [x] `/app/cuenta/sesiones` registrada
- [x] `/app/cuenta/preferencias` registrada
- [x] Ruta plana legacy `cuenta/sesiones` **reemplazada** (no duplicada)
- [x] Registro en `app-route-tree.tsx` vía `accountRoutes`
- [x] Lazy loading pages + Suspense
- [x] `ProtectedRoute requireOperationalUser` heredado (sin cambio router raíz)

### F7 — Sesiones (Opción C)

- [x] `MySessionsPage` montada en ruta `sesiones` sin modificar archivo
- [x] Sin `MySessionsPanel`
- [x] Sin extracción content
- [x] Hooks IAM (`useMySessionsList`, `useRevokeSession`) sin fork
- [x] Tests enterprise sesiones PASS

### Restricciones PR1

- [x] Header no modificado
- [x] Auth/compositors/interceptors no modificados
- [x] ChangePasswordPage no modificado
- [x] Logout all no modificado
- [x] Sin documentación funcional nueva

---

## 10. Rutas finales (post-PR1)

| Path | Element |
|------|---------|
| `cuenta` | `AccountCenterLayout` |
| `cuenta` (index) | `<Navigate to="informacion" replace />` |
| `cuenta/informacion` | `AccountProfilePage` (stub) |
| `cuenta/seguridad` | `AccountSecurityPage` (stub) |
| `cuenta/sesiones` | `MySessionsPage` (auth, sin cambios) |
| `cuenta/preferencias` | `AccountPreferencesPage` (stub) |

---

## 11. Autoauditoría

| Pregunta | Respuesta |
|----------|-----------|
| ¿Se implementó solo PR1? | **Sí** — sin Header ni contenido secciones |
| ¿Se aplicó Opción C F7? | **Sí** |
| ¿Se modificó `MySessionsPage.tsx`? | **No** |
| ¿Se creó `MySessionsPanel`? | **No** |
| ¿Se tocó AuthContext/compositors? | **No** |
| ¿Se creó documentación fuera del informe? | **No** |
| ¿`tsc --noEmit` PASS? | **Sí** |
| ¿Tests regresión sesiones PASS? | **Sí** |

---

## 12. Dictamen final

# **A) PR1 implementado correctamente**

El entregable cumple F1 (shell), F2 (routing anidado con redirect) y F7 (integración sesiones Opción C) según Implementation Plan y Review. La compilación y suites de regresión IAM pasan. Observaciones menores (breadcrumbs, enlace admin, stubs vacíos) están acotadas a PRs posteriores y no bloquean PR2.

---

*Informe PR1 ACCOUNT_CENTER_V1 — 2026-06-24.*
