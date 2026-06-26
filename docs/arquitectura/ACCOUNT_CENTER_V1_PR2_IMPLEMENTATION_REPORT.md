# ACCOUNT_CENTER_V1 — Informe de implementación PR2 (Header + Breadcrumbs)

**Documento:** `docs/arquitectura/ACCOUNT_CENTER_V1_PR2_IMPLEMENTATION_REPORT.md`  
**Épica:** `ACCOUNT_CENTER_V1` (Mi Cuenta)  
**Alcance:** PR2 — Header + Breadcrumbs + integración hub  
**Fecha:** 2026-06-24  
**Prerequisito:** PR1 (shell + routing + sesiones Opción C) — completado

---

## 1. Resumen

Se integró **Mi Cuenta** en el dropdown del Header, se eliminaron placeholders sin acción, se implementaron breadcrumbs del hub desde `account.routes.ts` (SSOT) y se cerró el gap **G3** de `FRONTEND_AUTH_AUDIT`: ocultar Logout All cuando `requiresPasswordChange === true` — **solo en UI**, sin tocar AuthContext ni compositors.

**No se avanzó a PR3** (Información personal).

---

## 2. Archivos creados

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/features/account/utils/account-center-breadcrumbs.utils.ts` | `resolveAccountCenterBreadcrumbs()` desde SSOT |
| `src/features/account/__tests__/account-center-breadcrumbs.utils.test.ts` | Tests util breadcrumbs (4 rutas + base) |
| `src/shared/components/layout/__tests__/Header.account-center.test.tsx` | Mi cuenta, navegación, ausencia placeholders |
| `src/shared/components/layout/__tests__/useShellBreadcrumbs.account.test.ts` | Integración resolveShellBreadcrumbs + account |

**Total:** 4 archivos nuevos.

---

## 3. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/features/account/account.routes.ts` | `ACCOUNT_CENTER_HUB_LABEL`, `ACCOUNT_CENTER_SESSIONS_PATH` |
| `src/shared/components/layout/Header.tsx` | Mi cuenta; eliminados placeholders; guard logout all; tokens Capa 1 dropdown menú |
| `src/shared/components/layout/useShellBreadcrumbs.ts` | Prioridad account crumbs en shell `app` (antes de menú vacío) |
| `src/shared/components/layout/__tests__/Header.logout-all.test.tsx` | Test `requiresPasswordChange` oculta logout all |

**Total:** 4 archivos modificados.

---

## 4. Navegación final del Header

| Acción dropdown | Destino | Estado |
|-----------------|---------|--------|
| **Mi cuenta** | `/app/cuenta` → redirect `informacion` | ✅ Nuevo |
| **Mis sesiones** | `/app/cuenta/sesiones` (SSOT `ACCOUNT_CENTER_SESSIONS_PATH`) | ✅ Mantenido |
| Cambiar empresa | `EmpresaSelector` (sin cambio) | ✅ |
| Cerrar sesión en todos los dispositivos | Dialog existente | ✅ Condicional |
| Cerrar sesión | `logout()` | ✅ Sin cambio comportamiento |

### Eliminados (placeholders)

| Item | Estado |
|------|--------|
| Mi perfil | ❌ Eliminado |
| Bandeja de entrada | ❌ Eliminado |
| Configuraciones de la cuenta | ❌ Eliminado |

Imports huérfanos eliminados: `Mail`, `Settings`.

---

## 5. Logout All — guard `requiresPasswordChange`

Condición `showLogoutAllOption` actualizada en `Header.tsx`:

```typescript
SESSION_LOGOUT_V3_ENABLED &&
isAuthenticated &&
!isImpersonation &&
!requiereSeleccionEmpresa &&
!requiresPasswordChange  // ← PR2
```

| Restricción | Cumplida |
|-------------|----------|
| Solo UI | ✅ |
| Sin AuthContext | ✅ |
| Sin compositors | ✅ |
| Sin interceptors | ✅ |
| Logout simple intacto | ✅ |

---

## 6. Breadcrumbs

### Trail por ruta (SSOT `account.routes.ts`)

| Path | Breadcrumb |
|------|------------|
| `/app/cuenta` | Mi cuenta → Información personal |
| `/app/cuenta/informacion` | Mi cuenta → Información personal |
| `/app/cuenta/seguridad` | Mi cuenta → Seguridad |
| `/app/cuenta/sesiones` | Mi cuenta → Sesiones |
| `/app/cuenta/preferencias` | Mi cuenta → Preferencias |

- «Mi cuenta» clickeable → `/app/cuenta/informacion` (`ACCOUNT_CENTER_DEFAULT_PATH`).
- Último segmento no clickeable (lógica existente Header `isLast`).
- Textos desde `ACCOUNT_CENTER_HUB_LABEL` y `section.navLabel` — **sin hardcode duplicado** en Header/breadcrumbs.

### Integración

`resolveShellBreadcrumbs` evalúa `resolveAccountCenterBreadcrumbs` **primero** en shell `app`, incluso si `menuModulos` está vacío (fix regresión detectado en test).

---

## 7. Limpieza realizada

| Elemento | Acción |
|----------|--------|
| Botones placeholder Header (3) | Eliminados |
| Imports `Mail`, `Settings` | Eliminados |
| Rutas hardcodeadas `/app/cuenta/sesiones` en Header | Reemplazadas por `ACCOUNT_CENTER_SESSIONS_PATH` |
| Código muerto en otros módulos | **Ninguno** — placeholders solo existían en `Header.tsx` |

---

## 8. Validaciones

| Validación | Resultado |
|------------|-----------|
| Navegación Header Mi cuenta → `/app/cuenta` | ✅ Test automatizado |
| Mis sesiones → `/app/cuenta/sesiones` | ✅ Test automatizado |
| Ausencia placeholders | ✅ Test automatizado |
| Logout All oculto si `requiresPasswordChange` | ✅ Test automatizado |
| Logout simple sin cambio | ✅ Tests logout-all existentes PASS |
| Breadcrumbs 4 rutas + base | ✅ Tests utils + useShellBreadcrumbs |
| `npx tsc --noEmit` | ✅ PASS |
| MySessionsPage sin modificar | ✅ |
| Auth/compositors/interceptors sin modificar | ✅ |

---

## 9. Pruebas ejecutadas

```text
npx tsc --noEmit  →  PASS

npx vitest run features/account shared/components/layout/__tests__/Header shared/components/layout/__tests__/useShellBreadcrumbs  →  PASS
```

| Suite | Tests |
|-------|-------|
| `account.routes.test.ts` | 3/3 |
| `account-center-breadcrumbs.utils.test.ts` | 4/4 |
| `AccountCenterSidebar.test.tsx` | 1/1 |
| `Header.account-center.test.tsx` | 3/3 |
| `Header.logout-all.test.tsx` | 8/8 |
| `useShellBreadcrumbs.account.test.ts` | 1/1 |

**Total:** 20 tests PASS.

---

## 10. Riesgos

| ID | Riesgo | Sev. | Mitigación |
|----|--------|------|------------|
| R1 | Bloque identidad dropdown sigue tokens `brand-text-*` legacy | Baja | Fuera alcance PR2 — solo ítems menú migrados a Capa 1 (UX §15.2 parcial) |
| R2 | Barra Header principal aún usa `bg-brand-surface` | Baja | Deuda visual preexistente; no bloquea PR3 |
| R3 | Enlace admin bajo Sesiones (UX §7.3) | Baja | Diferido — no en alcance PR2 |
| R4 | Breadcrumb «Mi cuenta» apunta a `informacion` no a `/app/cuenta` | Baja | Alineado SPEC/UX §4.2 |

---

## 11. Checklist de aceptación PR2

### Header (AC-06)

- [x] «Mi cuenta» navega al hub (`/app/cuenta` → redirect informacion)
- [x] «Mis sesiones» atajo funcional
- [x] Eliminados: Mi perfil, Bandeja, Configuraciones cuenta
- [x] Logout operativo sin cambios
- [x] Logout all operativo con guards existentes + `requiresPasswordChange`
- [x] Dropdown ítems menú: tokens Capa 1 (`bg-surface`, `text-text-base`, `border-border-base`)

### Breadcrumbs

- [x] `/app/cuenta/informacion` resuelto
- [x] `/app/cuenta/seguridad` resuelto
- [x] `/app/cuenta/sesiones` resuelto
- [x] `/app/cuenta/preferencias` resuelto
- [x] SSOT `account.routes.ts` — sin textos duplicados

### Restricciones PR2

- [x] Sin Información personal / Seguridad / Preferencias contenido
- [x] Sin cambio password voluntario
- [x] Sin logout all funcional nuevo (solo guard UI)
- [x] Sin MySessionsPage / Auth / compositors / interceptors / API

---

## 12. Autoauditoría

| Pregunta | Respuesta |
|----------|-----------|
| ¿Solo PR2 implementado? | **Sí** |
| ¿Placeholders eliminados? | **Sí** |
| ¿Breadcrumbs desde SSOT? | **Sí** |
| ¿Guard requiresPasswordChange solo UI? | **Sí** |
| ¿Documentación funcional nueva? | **No** — solo este informe |
| ¿Tests PASS? | **Sí** |

---

## 13. Dictamen final

# **A) PR2 implementado correctamente**

Header integrado con Mi Cuenta, breadcrumbs operativos para las 4 secciones del hub, gap logout-all/`requiresPasswordChange` cerrado en UI, placeholders eliminados y validaciones automatizadas PASS. Listo para PR3 (Información personal).

---

*Informe PR2 ACCOUNT_CENTER_V1 — 2026-06-24.*
