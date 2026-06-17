# Auditoría — Branding en ChangePasswordPage

**Versión:** 1.0  
**Fecha:** 2026-06-08  
**Contexto QA:** Login muestra branding tenant correctamente; ChangePasswordPage no. SmartRedirect, interceptor 403 y exclusiones OK.  
**Estado:** Solo auditoría — **sin implementación**

---

## 1. Veredicto ejecutivo

**Causa raíz:** Tras el login, el sistema **deja de leer el branding del cache por subdominio** (vía pública, que funcionó en Login) y pasa a cargar branding **autenticado** (`GET /clientes/tenant/branding`). Ese endpoint **no está en la whitelist** de `PASSWORD_CHANGE_REQUIRED`, por lo que devuelve **403** mientras `requires_password_change=true`. El store termina con `defaultBranding` (sin logo tenant) y `useBranding(false)` **aplica esos valores por defecto**, sobrescribiendo el CSS que Login había aplicado.

No es un fallo de `LoginBrandingHeader` ni de que ChangePasswordPage “olvide” importar componentes. Es un **conflicto de arquitectura entre el flujo force-password-change y la estrategia post-login de branding**.

---

## 2. Flujo completo de branding en Login

```text
URL: http://{tenant}.app.local:5173/login

TenantContext
  └─ subdomain = "innova" (desde hostname)

BrandingInitializer (app/provider.tsx)
  └─ !isAuthenticated && subdomain
       └─ loadBrandingBySubdomain(subdomain)
            └─ GET /clientes/branding?subdominio=innova  [público, sin auth]
            └─ guarda en subdomainCache + store.branding

Login.tsx
  └─ useBranding(false)   // autoLoad=false → NO dispara carga propia
  └─ useBrandingStoreWithTenant():
       tenantId = null (pre-login)
       branding = getBrandingBySubdomain(subdomain)  ✅ cache poblado
  └─ useBranding effect:
       applyBranding(branding)  ✅ CSS variables + tema
  └─ LoginBrandingHeader
       branding.logo_url → logo tenant
       resolveClientDisplayName(branding, subdomain) → nombre
```

| Paso | Estado |
|------|--------|
| Fuente de datos | `subdomainCache` |
| Endpoint | Público `/clientes/branding` |
| `isAuthenticated` | `false` |
| Bloqueo 403 password | No aplica (endpoint público) |
| Resultado UI | Logo + colores tenant |

---

## 3. Flujo completo de branding en ChangePasswordPage (actual)

```text
Usuario acaba de hacer login (Schema B) con requires_password_change=true
  → navigate('/change-password')  [SPA, sin reload]

TenantContext
  └─ derivedTenantId = user.cliente_id  → tenantId seteado
  └─ resetStores(tenantId) → resetBranding(tenantId) → defaultBranding en partición tenant

BrandingInitializer
  └─ isAuthenticated && tenantId  (rama POST-login)
       └─ getBranding(tenantId) → null o defaultBranding
       └─ loadBranding(tenantId)
            └─ GET /clientes/tenant/branding  [autenticado]
            └─ 403 PASSWORD_CHANGE_REQUIRED  ❌ (no está en whitelist contrato)
       └─ catch → defaultBranding (sin logo_url real)

ChangePasswordPage.tsx
  └─ Espera authInitialized + hydrated (spinner full-page)
  └─ useBranding(false)
  └─ useBrandingStoreWithTenant():
       tenantId = "<uuid>"  ✅ seteado
       branding = getBranding(tenantId)  ❌ ignora subdomainCache
  └─ useBranding effect:
       applyBranding(defaultBranding)  ❌ sobrescribe CSS del Login
  └─ LoginBrandingHeader
       branding.logo_url = null → avatar iniciales, sin logo
       clientDisplayName = fallback subdominio (puede verse nombre, no logo)
```

| Paso | Estado |
|------|--------|
| Fuente de datos | Partición `tenants.get(tenantId)` |
| Endpoint intentado | Autenticado `/clientes/tenant/branding` |
| `subdomainCache` | **Ignorado** aunque tenga branding válido del Login |
| Bloqueo 403 password | **Sí** — endpoint no whitelisteado |
| Resultado UI | Sin logo; colores por defecto |

---

## 4. Diferencias exactas Login vs ChangePasswordPage

| # | Aspecto | Login | ChangePasswordPage |
|---|---------|-------|-------------------|
| 1 | `isAuthenticated` | `false` | `true` (Schema B) o `false` (Schema A) |
| 2 | `tenantId` en TenantContext | `null` | `user.cliente_id` (Schema B) |
| 3 | Rama BrandingInitializer | `loadBrandingBySubdomain` | `loadBranding(tenantId)` |
| 4 | Endpoint branding | `GET /clientes/branding` (público) | `GET /clientes/tenant/branding` (auth) |
| 5 | Lectura en `useBrandingStoreWithTenant` | `getBrandingBySubdomain(subdomain)` | `getBranding(tenantId)` |
| 6 | Compatible con flag password | Sí | **No** (endpoint auth bloqueado) |
| 7 | Spinner previo al header | No | Sí (`authInitialized && hydrated`) |
| 8 | Componentes UI branding | `LoginBrandingHeader` + `useBranding(false)` | **Idénticos** |
| 9 | `LoginBrandingHeader` props | Misma forma | Misma forma — **datos distintos** |

**Conclusión:** El JSX y los imports son equivalentes. La divergencia está en **qué partición del store se lee** y **qué endpoint intenta cargar BrandingInitializer** tras autenticación.

---

## 5. Estado real del store cuando ChangePasswordPage monta

### 5.1 Al llegar desde Login (Schema B — caso QA típico)

| Store | Contenido esperado |
|-------|-------------------|
| `subdomainCache.get("innova")` | `BrandingRead` completo (logo, colores) del Login |
| `tenants.get(cliente_id)` | `defaultBranding` o `null` tras 403 |
| `store.branding` (global) | Sobrescrito a `defaultBranding` por `resetBranding` / error handler |
| `loading` (partición tenant) | `false` tras fallo |
| `error` (partición tenant) | Mensaje 403 posible |

### 5.2 Qué lee `useBranding(false)`

```413:415:src/features/tenant/stores/branding.store.ts
  const branding = tenantId 
    ? store.getBranding(tenantId)
    : (subdomain ? store.getBrandingBySubdomain(subdomain) : store.branding);
```

Con `tenantId` seteado → **nunca** lee `subdomainCache`, aunque contenga el branding correcto.

### 5.3 Schema A (selection_token, no access_token)

| Campo | Valor |
|-------|-------|
| `isAuthenticated` | `false` (`!!auth.token && !!auth.user`) |
| `tenantId` | Probablemente `null` |
| BrandingInitializer | Sigue en rama `loadBrandingBySubdomain` |
| Lectura store | `getBrandingBySubdomain` — **debería funcionar** |

Si QA reporta fallo también en Schema B (flujo provisionamiento típico), la causa raíz de §1 aplica. Schema A merece verificación separada.

---

## 6. ¿`useBranding(false)` ejecuta `applyBranding()`?

**Sí**, cuando hay objeto `branding` en el hook:

```42:54:src/features/tenant/hooks/useBranding.ts
  useEffect(() => {
    if (branding) {
      applyBranding(branding);
    } else if (!loading && !error) {
      resetBranding();
    }
  }, [branding, loading, error, isAuthenticated, tenantId]);
```

En ChangePasswordPage post-login:

- `branding` = `defaultBranding` (truthy) → **sí ejecuta** `applyBranding(defaultBranding)`
- Efecto colateral: **reemplaza** colores tenant que Login había aplicado
- Con `error` seteado y `branding` default, no entra en `resetBranding()` del else

`autoLoad=false` solo desactiva el `useEffect` de carga (líneas 31–39); **no** desactiva la aplicación CSS.

---

## 7. ¿`LoginBrandingHeader` recibe la misma información?

**Misma interfaz, distinto contenido:**

| Prop | Login (OK) | ChangePasswordPage (KO) |
|------|------------|-------------------------|
| `branding` | `BrandingRead` con `logo_url` | `defaultBranding` → `logo_url: null` |
| `brandingLoading` | `false` tras carga subdomain | `false` tras fallo tenant (no muestra skeleton) |
| `clientDisplayName` | De `tema_personalizado.appName` o subdominio | Solo fallback subdominio (sin `appName`) |
| `isPlatformLogin` | `false` | `false` |

```83:106:src/features/auth/pages/LoginBrandingHeader.tsx
  const clientLogoUrl = branding?.logo_url?.trim() || null;
  const showInitialsAvatar = !clientLogoUrl && !!clientDisplayName;
  // Sin logo → muestra iniciales "IN" en lugar del logo tenant
```

---

## 8. ¿`BrandingInitializer` ya cargó branding al renderizar ChangePasswordPage?

**Sí, pero por el canal incorrecto:**

1. En Login cargó correctamente vía **subdominio** (cache poblado).
2. Al autenticarse, el `useEffect` de BrandingInitializer **cambia de rama** y dispara `loadBranding(tenantId)`.
3. Esa segunda carga **falla o degrada** el estado; no reutiliza el cache de subdominio.
4. ChangePasswordPage monta cuando `authInitialized` — para entonces el store global ya puede estar en `defaultBranding`.

`BrandingInitializer` **no** se detiene ni hace fallback a subdominio cuando `requires_password_change=true` (no tiene esa lógica).

---

## 9. Dependencias de Login no replicadas

| Dependencia | Login | ChangePasswordPage | ¿Relevante? |
|-------------|-------|-------------------|-------------|
| `useBranding(false)` | ✅ | ✅ | Mismo hook — **insuficiente** post-login |
| `useTenant().subdomain` | ✅ | ✅ | OK |
| `BrandingInitializer` carga subdomain | ✅ automático | ❌ cambia a tenant tras auth | **Crítico** |
| Lectura `subdomainCache` | ✅ vía hook | ❌ bloqueada por `tenantId` | **Crítico** |
| Endpoint público branding | ✅ usado | ❌ no usado post-login | **Crítico** |
| Espera `authInitialized` | No | Sí (spinner) | Secundario (no causa raíz) |
| `useLocation` / `from` | Sí | No | No afecta branding |

**No falta ningún import de Login en ChangePasswordPage.** Falta **seleccionar la fuente de branding correcta** para el estado “autenticado + password change pendiente”.

---

## 10. Evidencia de código

### 10.1 BrandingInitializer — bifurcación pre/post login

```21:45:src/shared/components/BrandingInitializer.tsx
  useEffect(() => {
    if (!isAuthenticated && subdomain) {
      loadBrandingBySubdomain(subdomain);
      return;
    }
    if (isAuthenticated && tenantId) {
      const cached = useBrandingStore.getState().getBranding(tenantId);
      // ...
      loadBranding(tenantId);
    }
  }, [isAuthenticated, subdomain, tenantId, ...]);
```

### 10.2 Endpoint autenticado (vulnerable a 403)

```26:34:src/features/tenant/services/branding.service.ts
  async getBranding(): Promise<BrandingRead> {
    const { data } = await api.get<BrandingRead>(BASE_URL);
    // BASE_URL = '/clientes/tenant/branding'
```

### 10.3 Whitelist contrato — branding NO incluido

Según `FORCE_PASSWORD_CHANGE_FRONTEND_CONTRACT.md` §5.5, whitelist:

- `/auth/password/change/`, `/auth/me/`, `/auth/logout/`, `/auth/refresh/`, `/auth/empresa/seleccionar/`, `/auth/impersonate/*`

`/clientes/tenant/branding` **no** está → 403 esperado con flag activo.

### 10.4 Reset al cambiar tenant (login)

```347:350:src/features/tenant/components/TenantContext.tsx
    if (nextTenantId) {
      resetStores(nextTenantId);
      ensureBrandingLoaded(nextTenantId);
```

`resetStores` → `resetBranding(tenantId)` → siembra `defaultBranding` antes de que termine la carga autenticada.

### 10.5 ChangePasswordPage — mismos hooks que Login

```51:52:src/features/auth/pages/ChangePasswordPage.tsx
  const { subdomain } = useTenant();
  const { branding, loading: brandingLoading } = useBranding(false);
```

---

## 11. Propuesta mínima de corrección

### Opción recomendada — solo `ChangePasswordPage.tsx` (+0 stores, +0 endpoints)

Mientras `requiresPasswordChange === true`, usar **explícitamente el canal pre-login** (mismo que Login):

```text
1. Leer branding efectivo:
     subdomainCache(subdomain)  [prioridad]
     fallback getBranding(tenantId)

2. Si cache subdomain vacío:
     loadBrandingBySubdomain(subdomain)  [endpoint público, permitido con flag]

3. Pasar branding efectivo a LoginBrandingHeader / LoginLegacyHeader

4. applyBranding(branding efectivo):
     vía useBranding(false) solo si el hook recibe el branding correcto, O
     useEffect local que llame applyBranding cuando cambie el branding efectivo
```

**Implementación concreta sugerida:**

| Cambio | Detalle |
|--------|---------|
| Importar `useBrandingStore` | Lectura directa `getBrandingBySubdomain` |
| `useEffect` en página | Si `requiresPasswordChange && subdomain && !cache` → `loadBrandingBySubdomain(subdomain)` |
| `effectiveBranding` | `getBrandingBySubdomain(subdomain) ?? branding` del hook |
| Pasar `effectiveBranding` al header | En lugar de `branding` del hook |
| `applyBranding` | Asegurar que se aplica `effectiveBranding` (el hook actual aplica la partición tenant incorrecta) |

**Nota:** Si solo se cambia la prop del header sin corregir `applyBranding`, los **colores** pueden seguir siendo default aunque el logo aparezca. Hay que alinear ambos.

### Opción alternativa — `useBrandingStoreWithTenant` (más amplia)

Añadir fallback en el selector:

```typescript
const tenantBranding = tenantId ? store.getBranding(tenantId) : null;
const subdomainBranding = subdomain ? store.getBrandingBySubdomain(subdomain) : null;
const branding = tenantBranding ?? subdomainBranding;
```

**Pros:** Beneficia cualquier pantalla auth post-login con flag.  
**Contras:** Toca store compartido; riesgo de regresión en otras pantallas autenticadas.

### Opción descartada

| Opción | Motivo |
|--------|--------|
| Modificar `BrandingInitializer` | Restricción explícita del usuario |
| Añadir `/clientes/tenant/branding` a whitelist backend | Fuera de alcance FE; contrato ya cerrado |
| Nuevo store / endpoint | Prohibido |

---

## 12. Archivos exactos a modificar (fix mínimo recomendado)

| Archivo | Cambio |
|---------|--------|
| `src/features/auth/pages/ChangePasswordPage.tsx` | Fuente branding efectiva vía `subdomainCache` + `loadBrandingBySubdomain` + `applyBranding` del branding efectivo |

**Opcional** (si se prefiere centralizar sin tocar BrandingInitializer):

| Archivo | Cambio |
|---------|--------|
| `src/features/tenant/hooks/useBranding.ts` | Parámetro o modo `preferSubdomainWhenPasswordChange` |

**Recomendación:** Mantener el fix en **un solo archivo** (`ChangePasswordPage.tsx`) para alcance mínimo.

---

## 13. Riesgos de regresión

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Logo OK pero colores default | Media | Aplicar `applyBranding(effectiveBranding)` explícitamente |
| Schema A ya funcionaba; fix lo rompe | Baja | Condicionar fallback solo si `requiresPasswordChange` |
| Doble fetch subdomain | Baja | Comprobar cache antes de `loadBrandingBySubdomain` |
| Tras cambio password, branding tenant auth | Muy baja | Al limpiar flag, flujo normal `loadBranding(tenantId)` retoma |
| Parpadeo logo al cargar | Baja | `brandingLoading` desde estado subdomain load |

---

## 14. Validación manual post-fix

- [ ] Login `innova.app.local` → logo + colores tenant
- [ ] Login admin temporal → `/change-password` → **mismo logo y colores** que Login
- [ ] F5 directo en `/change-password` con flag → branding subdomain (sin pasar por Login en sesión)
- [ ] Tras cambiar password → ERP con branding tenant autenticado (regresión)
- [ ] Schema A (multi-empresa + flag) → branding subdomain
- [ ] `ENABLE_CONTEXTUAL_LOGIN_UI=false` → `LoginLegacyHeader` con logo fallback

---

## 15. Resumen

| Pregunta | Respuesta |
|----------|-----------|
| ¿Por qué Login OK y ChangePassword no? | Login usa branding **público por subdominio**; ChangePasswordPage usa partición **tenant autenticada** bloqueada por 403 |
| ¿Falta `LoginBrandingHeader`? | No — recibe `branding` vacío/default |
| ¿`useBranding(false)` aplica CSS? | Sí — aplica `defaultBranding`, empeorando el estado |
| ¿BrandingInitializer cargó datos? | Sí en subdomain en Login; luego intenta tenant y falla |
| Fix mínimo | En ChangePasswordPage, leer/cargar **subdomainCache** mientras `requiresPasswordChange` |

---

**Fin de auditoría. Sin cambios de código hasta aprobación del fix.**
