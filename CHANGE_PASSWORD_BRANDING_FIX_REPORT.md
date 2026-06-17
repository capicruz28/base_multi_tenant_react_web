# Reporte — Fix branding ChangePasswordPage

**Versión:** 1.0  
**Fecha:** 2026-06-08  
**Referencia:** `CHANGE_PASSWORD_BRANDING_AUDIT.md`  
**Estado:** Implementación completada

---

## 1. Resumen

Se corrigió la regresión de branding en `/change-password` usando el **canal público por subdominio** mientras `requiresPasswordChange === true`, alineado al contrato `FORCE_PASSWORD_CHANGE_FRONTEND_CONTRACT.md` (endpoint autenticado `/clientes/tenant/branding` bloqueado con flag activo).

**Archivo modificado:** 1 (`ChangePasswordPage.tsx`).

---

## 2. Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `src/features/auth/pages/ChangePasswordPage.tsx` | Branding efectivo por `subdomainCache`; carga `loadBrandingBySubdomain` si falta cache; `applyBranding(effectiveBranding)`; header con branding efectivo |

**Sin cambios en:** `BrandingInitializer`, `branding.store`, `useBranding`, `Login`, `AuthContext`, `SmartRedirect`, Historia A.

---

## 3. Implementación

### 3.1 Branding efectivo

```typescript
const effectiveBranding = requiresPasswordChange
  ? subdomainBranding ?? branding   // prioridad subdomainCache
  : branding;                       // comportamiento previo (redirect antes de UI)
```

### 3.2 Carga si cache vacío (F5 directo en `/change-password`)

```typescript
if (requiresPasswordChange && subdomain && !cached) {
  loadBrandingBySubdomain(subdomain);  // GET /clientes/branding (público)
}
```

### 3.3 Colores / tokens CSS

```typescript
useEffect(() => {
  if (requiresPasswordChange && effectiveBranding) {
    applyBranding(effectiveBranding);
  }
}, [requiresPasswordChange, effectiveBranding]);
```

Ejecutado **después** del hook `useBranding(false)` para sobrescribir `defaultBranding` de la partición tenant.

### 3.4 UI

- `LoginBrandingHeader` / `LoginLegacyHeader` reciben `effectiveBranding` y `effectiveBrandingLoading`
- `resolveClientDisplayName(effectiveBranding, subdomain)` para título documento

---

## 4. Casos de prueba ejecutados (automáticos)

| Prueba | Resultado |
|--------|-----------|
| Linter `ChangePasswordPage.tsx` | ✅ Sin errores |
| TypeScript archivos P1 relacionados | ✅ Sin errores nuevos en ChangePasswordPage |
| `password-change-error.test.ts` | ✅ 2/2 |
| `auth-http-password-change.test.ts` | ✅ 2/2 |

---

## 5. Checklist QA manual (branding)

> Ejecutar en `http://{tenant}.app.local:5173`

### Branding

- [ ] **1.** Login tenant → logo y colores tenant correctos
- [ ] **2.** Login con contraseña temporal → `/change-password` muestra **mismo logo y colores** que Login
- [ ] **3.** F5 directo en `/change-password` (sesión con flag) → branding tenant correcto (no avatar iniciales genérico)
- [ ] **4.** Cambio exitoso de contraseña → ERP mantiene branding tenant autenticado
- [ ] **5.** `ENABLE_CONTEXTUAL_LOGIN_UI=false` → `LoginLegacyHeader` con logo/fallback

### Regresión P1 (sin cambios en estos módulos)

- [ ] **6.** SmartRedirect: F5 en `/` con flag → `/change-password`
- [ ] **7.** Interceptor 403: API ERP con flag → redirect sin toast genérico
- [ ] **8.** Exclusiones: impersonación / platform_admin sin redirect change

### Historia A

- [ ] **9.** Provisionamiento + reveal credenciales sin regresión

---

## 6. Riesgos residuales

| Riesgo | Severidad | Notas |
|--------|-----------|-------|
| Race `useBranding` vs `applyBranding` local | Baja | Effect local declarado después del hook; subdomain gana |
| `subdomainLoading` global del store | Baja | Solo usado cuando `requiresPasswordChange && !subdomainBranding` |
| Tras cambio password, branding tenant auth | Muy baja | `BrandingInitializer` retoma `loadBranding(tenantId)` sin flag |
| Schema A sin subdomain en URL | Baja | Mismo requisito que Login |

---

## 7. Validación manual

La validación en navegador (puntos 1–9 del checklist) **debe confirmarse en el entorno local del equipo**. Esta sesión no dispone de acceso al browser del usuario.

---

**Fin del reporte.**
