# Fase 0 — Hallazgos de evidencia (impersonación / ORG 403)

**Fecha:** 31 mayo 2026  
**Alcance:** Exclusivamente repositorio **frontend** + contratos documentados en este repo.  
**Backend:** repositorio separado — **fuera de alcance de implementación**; referenciado solo como fuente de respuestas HTTP.  
**Estado:** Solo evidencia, clasificación y diagnóstico — **sin código, sin repair, sin commit, sin propuestas de corrección**.

**Documento previo:** [`PLATFORM_IMPERSONATION_AUDIT.md`](./PLATFORM_IMPERSONATION_AUDIT.md) (veredicto preliminar aprobado).

---

## 1. Objetivo Fase 0

Determinar, **solo con lo que existe en este repositorio**, qué se puede afirmar o descartar sobre:

| ID | Hipótesis |
|----|-----------|
| **H1** | JWT impersonado sin permisos ORG efectivos |
| **H2** | `/auth/menu` permite ORG pero RBAC API lo deniega |
| **H3** | `/auth/permissions/me` no contiene permisos ORG |

Y definir qué capturar en **Network QA** para cerrar la causa raíz fuera de este repo.

---

## 2. Veredictos preliminares aprobados (contexto)

| Afirmación | Estado |
|------------|--------|
| Flujo FE impersonación correcto | ✅ Aprobado |
| ORG multiempresa sin cambios por esta incidencia | ✅ Aprobado |
| INV sin cambios | ✅ Aprobado |
| `ERP_FRONTEND_STANDARDS_V2.md` sin ajustes | ✅ Aprobado |

Esta Fase 0 **no revisa** esas decisiones; las toma como premisa y aporta **trazabilidad de evidencia**.

---

## 3. Arquitectura de autorización en frontend (hecho verificable)

El frontend implementa **tres capas independientes**. No hay unificador que garantice coherencia menú ↔ permisos string ↔ API.

| Capa | Endpoint / fuente | Consumidor FE | Granularidad | Usado en ruta ORG |
|------|-------------------|---------------|--------------|-------------------|
| **A — Menú / rutas** | `GET /auth/menu` → `indexRoutePermissionsFromMenu` | `PermissionGuard`, `usePermissions().can()`, sidebar, botones ORG | Módulo + acciones `ver/crear/editar/...` (ej. `org.ver`) | **Sí** — acceso a `/app/org/*` |
| **B — Permisos string** | `GET /auth/permissions/me` | `PermissionContext.hasPermission()` | Códigos LBAC (ej. `org.sucursal.leer`) | **No** — ORG no consulta esta capa antes de queries |
| **C — RBAC API** | Validación en cada `GET/POST /org/*` | Respuesta HTTP (403 + `detail`) | Códigos LBAC por recurso | **Sí** — fallo observado en QA |

**Evidencia en código:**

```7:9:src/core/auth/PermissionContext.tsx
 * Nota: el menú lateral y PermissionGuard usan permisos derivados de GET /auth/menu
 * (AuthContext). Este provider solo inicializa `permissionsInitialized` para ProtectedRoute
 * y `hasPermission(codigo)` granular; no sustituye la visibilidad del menú.
```

```124:128:src/features/org/pages/SucursalesPage.tsx
  const listQuery = useSucursales({
    solo_activos: !includeInactive,
    buscar,
    enabled: canQueryCompanyScoped,
  });
```

```98:101:src/features/org/pages/SucursalesPage.tsx
  const { can } = usePermissions();
  const canCrear = can('org', 'crear');
  const canEditar = can('org', 'editar');
  const canEliminar = can('org', 'eliminar');
```

**Conclusión arquitectónica (repo):** Es **estructuralmente posible** que capa A autorice navegación ORG mientras capa C deniegue datos — sin bug obvio en guards FE. Esto alinea con **H2** como patrón esperable si backend no sincroniza resolvers.

---

## 4. Revisión por componente / contrato

### 4.1 `AuthContext`

| Evidencia | Ubicación | Implicación |
|-----------|-----------|-------------|
| Impersonación guarda parent en `sessionStorage` antes de API | `startImpersonationHandler` → `savePlatformParentSession` | Flujo platform → tenant trazable |
| Tras token completo: `applyFullSessionToken` → `initializeAuth` → `loadMenuAndPermissionsFromAuthMenu` | L1179–1227, L622–735 | Misma secuencia que login normal |
| **Platform bypass desactivado en impersonación** | `isSuperAdmin = platform_admin && !impersonating` (L432–433) | Impersonado **no** tiene `permissions = null` ni bypass `can()` |
| Carga menú impersonada entra rama **operativa** (roles requeridos) | L358–385 — no entra rama L337–356 salvo token platform sin impersonación | Si menú carga en QA → `userData.roles.length > 0` |
| JWT decodificado: **sin array de permisos** | `decodeAccessToken.ts` — claims `is_impersonation`, `empresa_id`, `user_type`, etc. | **H1 no verificable desde decode JWT en FE** |
| Sin roles → `permissions = {}`, menú null | L358–363 | Si menú visible, roles **no vacíos** en `/auth/me` |
| Refresh menú al cambiar empresa | `applyFullSessionToken`, `cambiarEmpresaActiva` | FE re-invoca `/auth/menu` y `/auth/permissions/me` (vía PermissionContext) |

**Impresión impersonación en sesión:** `syncImpersonationFromToken` lee `is_impersonation`, `impersonated_by`, `impersonated_by_username` del JWT — no permisos LBAC.

### 4.2 `PermissionContext`

| Evidencia | Implicación |
|-----------|-------------|
| `GET /auth/permissions/me` → `permissions: string[]` | Única fuente capa B en FE |
| Recarga cuando cambian `auth.user?.usuario_id` o `empresaActivaId` | Coherente con multiempresa |
| Error silencioso → `permissions = []` | Array vacío **no bloquea** rutas ORG (PermissionGuard no usa este provider) |
| `hasPermission(code)` **no usado** en hooks/pages ORG | **H3 verdadera o falsa no cambia enablement de queries ORG en FE** |

### 4.3 `PermissionGuard`

| Evidencia | Implicación |
|-----------|-------------|
| Ruta ORG: `module="org" action="ver"` | `app-route-tree.tsx` L67–74 |
| Usa `usePermissions().can()` → capa A | Redirect `/unauthorized` si `org.ver === false` |
| Espera `menuPermissionsReady` | No evalúa hasta fin de carga `/auth/menu` |
| **No consulta** `PermissionContext` ni códigos `org.*.leer` | 403 API **posterior** al guard de ruta |

**Hecho QA coherente:** Usuario llega a pantalla Sucursales → **`PermissionGuard` pasó** → fallo es capa C.

### 4.4 `usePermissions`

| Evidencia | Implicación |
|-----------|-------------|
| `can(module, action)` lee `AuthContext.permissions` indexados desde menú | Capa A exclusivamente |
| `isSuperAdmin` → `can()` siempre `true` | **Off** en impersonación (`isSuperAdmin = false`) |
| ORG pages: `can('org', 'crear'|'editar'|'eliminar')` para botones | No usa `org.sucursal.leer` |

### 4.5 `useImpersonation`

| Evidencia | Implicación |
|-----------|-------------|
| Orquesta `startImpersonation` / `endImpersonation` + navigate | Sin lógica de permisos propia |
| Post-selección: `resolvePostEmpresaSelectionPath(..., { isImpersonation: true })` → `/app/home` | No afecta RBAC ORG |
| Banner vía `NewLayout` + `isImpersonation` | IMP-04 cubierto en FE |

### 4.6 Guards ORG (`OrgCompanyRouteGuard`, `useOrgSessionScope`)

| Evidencia | Implicación |
|-----------|-------------|
| Query enablement: `canQueryCompanyScoped` + `scopeEmpresaId` | JWT `empresa_id` / sesión — **no** LBAC string |
| `canOperateOrgCompanyScope`: excluye `platform_admin` puro, permite `user`/`tenant_admin` | Impersonado con `user_type` operativo → gate **habilita** queries |
| `invalidateOrgQueries` al cambiar empresa | Multiempresa FE correcto |

**Hecho QA coherente:** 403 en Network con pantalla montada → guard company **no** bloqueó; API sí.

### 4.7 `org.service.ts` / hooks

| Evidencia | Implicación |
|-----------|-------------|
| `GET /org/sucursales` sin `?empresa_id` | Etapa B — ámbito solo JWT (`ORG_ETAPA_B_API_JWT.md`) |
| Sin pre-check `hasPermission('org.sucursal.leer')` | 403 expuesto vía React Query + `getErrorMessage` |
| Mismo cliente Axios + Bearer que INV | INV 200 + ORG 403 → **misma sesión**, distinto RBAC recurso (consistente con backend) |

### 4.8 `FLUJO_AUTH_MULTIEMPRESA_FE.md`

| Contenido documentado | Gap para Fase 0 |
|----------------------|-----------------|
| Impersonate = misma respuesta login; claims `is_impersonation*` | ✅ |
| Menú y permisos tras sesión completa | ✅ |
| **No define** matriz permisos efectivos en impersonación | No ayuda a descartar H1–H3 |
| **No menciona** códigos `org.*.leer` vs `org.ver` menú | Gap contrato FE |

### 4.9 OpenAPI (`docs/backend_openapi.json`)

| Path | Evidencia en contrato | Gap |
|------|----------------------|-----|
| `POST /auth/impersonate/{cliente_id}/` | Schema A/B; claims JWT listados; **sin** especificación permisos ORG | No descarta H1 |
| `GET /auth/menu` | Descripción: filtrado por Permission Resolver + `rol_menu_permiso`; payload `permisos.ver` boolean | No menciona códigos `org.sucursal.leer` |
| `GET /auth/permissions/me` | `{ permissions: string[] }` — Permission Resolver | Ejemplos genéricos (`billing.read`), **sin** `org.*` |
| `GET /org/sucursales` | Bearer; parámetro opcional `empresa_id` en query | OpenAPI **desalineado** con FE Etapa B (FE no envía query); **no explica 403 LBAC** en descripción |

**Nota contrato:** OpenAPI afirma que menú y `permissions/me` comparten Permission Resolver, pero el FE **no verifica** equivalencia ni usa la misma capa para ORG listados.

---

## 5. Evaluación de hipótesis (solo evidencia frontend)

### H1 — JWT impersonado sin permisos ORG efectivos

| Criterio | Resultado |
|----------|-----------|
| ¿FE lee permisos del JWT? | **No** — solo claims de identidad/sesión |
| ¿FE puede confirmar H1 sin Network? | **No** |
| ¿FE puede descartar H1? | **No** |
| Evidencia indirecta a favor | 403 con texto `Se requiere: org.sucursal.leer` (mensaje **generado por API**, mostrado por `getErrorMessage`) |
| Evidencia indirecta en contra | Menú ORG visible + guards pasados → identidad de sesión válida; no prueba permisos LBAC en token |

**Clasificación H1:** **No verificable desde frontend** · **Requiere validación backend** (contenido efectivo del sujeto del token / resolver).

---

### H2 — `/auth/menu` permite ORG pero RBAC API lo deniega

| Criterio | Resultado |
|----------|-----------|
| ¿FE separa capa menú vs capa API? | **Sí — por diseño** (§3) |
| ¿FE puede confirmar desalineación sin Network? | **No** — falta payload `/auth/menu` + respuesta `/org/*` de la misma sesión |
| ¿FE hace imposible H2? | **No** — arquitectura **permite** menú `org.ver=true` + API 403 |
| ¿Síntoma QA compatible? | **Sí** — patrón exacto: navegación OK, `GET /org/sucursales` 403 |

**Clasificación H2:** **Compatible con evidencia frontend** · **Confirmación definitiva vía Network QA** · Causa raíz en **backend/contrato** si payloads confirman mismatch.

---

### H3 — `/auth/permissions/me` no contiene permisos ORG

| Criterio | Resultado |
|----------|-----------|
| ¿FE usa `permissions/me` para ORG listados? | **No** |
| ¿H3 explicaría solo el 403? | **Parcialmente** — explicaría ausencia en capa B, pero **no** bloqueo de ruta; el 403 viene de capa C |
| ¿FE puede confirmar H3 sin Network? | **No** |
| Si H3 es true y menú tiene ORG | Comportamiento FE **esperado** con arquitectura actual |

**Clasificación H3:** **No verificable desde frontend** · **Requiere captura Network** · Verdadera o falsa, **no invalida** el veredicto “flujo impersonación FE correcto”.

---

## 6. Checklist Network QA (confirmación causa raíz)

Ejecutar **en la misma sesión impersonada** donde ORG falla e INV responde 200. Exportar HAR o capturas.

### 6.1 Secuencia obligatoria

| # | Request | Qué capturar | Para qué |
|---|---------|--------------|----------|
| 1 | `POST /auth/impersonate/{cliente_id}/` | Status, body (Schema A/B), `access_token` o `selection_token` | Baseline impersonación |
| 2 | `POST /auth/empresa/seleccionar/` (si A) | Body request `empresa_id`, response `access_token`, `user_data.roles`, `user_data.user_type` | Sujeto post-selección |
| 3 | `GET /auth/me` | `empresa_activa`, `roles[]`, `user_type`, `cliente_id` | Identidad efectiva |
| 4 | JWT access (decode payload) | `is_impersonation`, `empresa_id`, `user_type`, `sub`, `cliente_id` | **H1** — claims (no permisos) |
| 5 | `GET /auth/menu` | Módulo `codigo: "ORG"` → ítems con `permisos.ver`, rutas `/app/org/*` | **H2** — capa A |
| 6 | `GET /auth/permissions/me` | Array completo `permissions[]`; buscar `org.`, `org.sucursal.leer`, `org.empresa.leer` | **H3** — capa B |
| 7 | `GET /org/sucursales` | Status, headers `Authorization` (mismo token), body error `detail` | **H2/H1** — capa C |
| 8 | `GET /org/centros-costo` | Idem | Correlación multi-endpoint ORG |
| 9 | `GET /inv/...` (catálogo que responde 200) | Status 200, mismo Bearer | Control — misma sesión, otro módulo |
| 10 | (Opcional) Login operativo mismo tenant | Repetir 5–8 con usuario real | Baseline “esperado” vs impersonado |

### 6.2 Campos de correlación

En **todas** las peticiones 5–9 verificar:

- Mismo `Authorization: Bearer <access_token>` (prefix idéntico)
- Mismo `empresa_id` en JWT y `/auth/me.empresa_activa`
- Timestamp: menú y permissions/me **antes** de org/sucursales (orden bootstrap FE)

### 6.3 Matriz de decisión post-captura

| Si Network muestra… | Conclusión |
|---------------------|------------|
| Menú ORG `permisos.ver: true` + `permissions/me` **sin** `org.sucursal.leer` + `/org/sucursales` 403 | **H2 + H3 confirmados**; desalineación resolvers backend |
| Menú ORG `ver: true` + `permissions/me` **con** `org.sucursal.leer` + `/org/sucursales` 403 | **H2 confirmado** (menú vs API); H3 **descartada** — investigar RBAC endpoint en backend |
| Menú ORG `ver: false` pero usuario en pantalla ORG | Inconsistencia FE (race PermissionGuard) — **reabrir** auditoría FE |
| `permissions/me` 401/409 o vacío + menú 200 | Capa B caída; no explica 403 si menú pasó — foco capa C |
| Operativo real: mismos endpoints 200, impersonado 403 | **H1** — sujeto impersonado sin LBAC ORG en backend |

### 6.4 Logs DEV útiles (misma sesión)

Consola con `import.meta.env.DEV`:

- `[IMPERSONATION-FE]`, `[IMPERSONATE-FE]`
- `[AuthContext] route permissions indexed from /auth/menu`
- `[AuthSnapshot] post-login (applyFullSessionToken)`
- Response body 403 visible en UI vía `getErrorMessage`

---

## 7. Matriz de evidencias

| # | Afirmación | Clasificación | Fuente en repo |
|---|------------|---------------|----------------|
| E-01 | Flujo impersonate → selección → bootstrap implementado | **Confirmado por frontend** | `AuthContext`, `useImpersonation`, `FLUJO_AUTH_MULTIEMPRESA_FE.md` |
| E-02 | Parent session en `sessionStorage` antes de impersonar | **Confirmado por frontend** | `platform-parent-session.ts` |
| E-03 | Impersonación desactiva bypass `isSuperAdmin` / `permissions=null` | **Confirmado por frontend** | `AuthContext` L432–433, L337–356 vs L366–385 |
| E-04 | Tres capas auth (menú / permissions/me / API) sin reconciliación | **Confirmado por frontend** | `PermissionContext.tsx` comentario; ORG hooks |
| E-05 | `PermissionGuard org.ver` usa solo capa A | **Confirmado por frontend** | `PermissionGuard`, `index-route-permissions-from-menu.ts` |
| E-06 | ORG listados no consultan `hasPermission('org.*.leer')` | **Confirmado por frontend** | `SucursalesPage`, `sucursal.hooks.ts`, `org.service.ts` |
| E-07 | Query ORG gated por JWT empresa, no por LBAC string | **Confirmado por frontend** | `useOrgCompanyQueryGate`, `OrgCompanyRouteGuard` |
| E-08 | Mensaje `Se requiere: org.*.leer` proviene de respuesta API | **Confirmado por frontend** | `getErrorMessage` en pages ORG; no string hardcoded en FE |
| E-09 | JWT FE no incluye permisos LBAC decodificables | **Confirmado por frontend** | `decodeAccessToken.ts` |
| E-10 | Contenido permisos efectivos en JWT impersonado | **No verificable desde frontend** | — |
| E-11 | `/auth/menu` devuelve `org.ver: true` en sesión QA | **No verificable desde frontend** | Requiere Network |
| E-12 | `/auth/permissions/me` incluye o excluye `org.*.leer` | **No verificable desde frontend** | Requiere Network |
| E-13 | RBAC `/org/*` deniega por política impersonación | **Requiere validación backend** | Solo síntoma 403 en QA |
| E-14 | Permission Resolver alinea menú, permissions/me y API | **Requiere validación backend** | OpenAPI afirma; FE no comprueba |
| E-15 | INV 200 + ORG 403 misma sesión implica RBAC por recurso | **Confirmado por frontend** (mismo Axios/Bearer) | `axios-instances`, servicios INV vs ORG |
| E-16 | OpenAPI `/org/sucursales` aún documenta `?empresa_id` opcional | **Confirmado por frontend** (contrato) | `backend_openapi.json` vs `org.service.ts` Etapa B |
| E-17 | Contrato impersonate no especifica permisos ORG mínimos | **Confirmado por frontend** (contrato) | OpenAPI + `FLUJO_AUTH_MULTIEMPRESA_FE.md` |

---

## 8. Qué afirmamos con certeza (desde este repositorio)

1. **El flujo de impersonación frontend está implementado de punta a punta** (parent session, API impersonate, selección empresa, bootstrap, banner, salida) y coincide con `FLUJO_AUTH_MULTIEMPRESA_FE.md` y V2 §4.8 IMP-xx.

2. **La incidencia ORG 403 no es explicable por un guard multiempresa roto en FE:** si la pantalla carga y Network muestra `GET /org/sucursales`, los guards `ProtectedRoute`, `PermissionGuard`, `OrgCompanyRouteGuard` y `useOrgCompanyQueryGate` **ya permitieron** la petición.

3. **El frontend no comprueba códigos LBAC `org.*.leer` antes de llamar API ORG** — usa capa A (`org.ver`, `org.crear`, …) del menú. Por tanto, **H3 verdadera no sería un bug FE** dado el diseño actual.

4. **La arquitectura FE hace posible H2 por diseño** (capas A y C independientes). El síntoma QA (menú OK + API 403) es **compatible** con desalineación backend, no con regresión INV/ORG multiempresa en guards.

5. **H1 no puede confirmarse ni descartarse** decodificando JWT en este repo — el FE no lee permisos del token.

6. **`ERP_FRONTEND_STANDARDS_V2`, ORG Etapa B y INV no requieren cambios** para explicar esta incidencia según evidencia disponible en repo.

---

## 9. Qué debe investigarse en el repositorio backend

| # | Pregunta backend | Relación hipótesis |
|---|------------------|-------------------|
| B-01 | ¿Qué identidad (`sub`, roles, `usuario_id`) emite `POST /auth/impersonate`? | H1 |
| B-02 | ¿El Permission Resolver devuelve los mismos códigos para menú, `permissions/me` y decoradores `/org/*` cuando `is_impersonation=true`? | H2, H3 |
| B-03 | ¿Existe rol/política “modo soporte” con grant `org.sucursal.leer`, `org.empresa.leer`, etc.? | H1 |
| B-04 | ¿Por qué INV responde 200 e ORG 403 con el **mismo** Bearer? | Matriz RBAC por módulo/recurso |
| B-05 | ¿El 403 ORG usa dependency distinta al filtro que construye `/auth/menu`? | H2 |
| B-06 | ¿Claims JWT post-selección preservan `is_impersonation` y `empresa_id` coherentes? | Descartar token mal formado |
| B-07 | ¿OpenAPI backend debe actualizar `/org/sucursales` (JWT-only vs query `empresa_id`)? | Contrato — no causa 403 LBAC |

**Entregable backend esperado:** tabla comparativa **misma sesión impersonada** — filas = endpoints auth + ORG + INV; columnas = status, permisos exigidos, permisos resueltos.

---

## 10. Conclusión Fase 0

| Dimensión | Conclusión |
|-----------|------------|
| **Frontend** | Evidencia suficiente para mantener veredicto: flujo impersonación **correcto**; ORG multiempresa e INV **sin cambios** por esta incidencia. |
| **H1** | **Indeterminada** en repo · Network JWT claims + identidad `/auth/me` · cierre en **backend**. |
| **H2** | **Altamente compatible** con arquitectura FE y síntoma QA · **confirmación = Network** (menú `org.ver` vs 403 API). |
| **H3** | **Indeterminada** en repo · **confirmación = Network** (`permissions/me`); impacto limitado en FE porque capa B no gatea listados ORG. |
| **Causa raíz probable** | **Fuera de este repositorio** — política RBAC / Permission Resolver del sujeto impersonado, no guards ni scope JWT en FE. |
| **Siguiente paso** | Ejecutar checklist §6 y adjuntar payloads a ticket backend — **sin proponer correcciones FE** hasta resultado Network. |

---

## 11. Archivos revisados (Fase 0)

```
src/shared/context/AuthContext.tsx
src/core/auth/PermissionContext.tsx
src/core/auth/hooks/usePermissions.ts
src/app/router/guards/PermissionGuard.tsx
src/app/router/app-route-tree.tsx
src/core/auth/utils/index-route-permissions-from-menu.ts
src/core/auth/utils/decodeAccessToken.ts
src/core/auth/utils/impersonation-session.ts
src/core/auth/utils/platform-parent-session.ts
src/core/auth/utils/impersonation-fe-log.ts
src/core/auth/types/auth-menu.types.ts
src/core/auth/types/permission.types.ts
src/features/auth/hooks/useImpersonation.ts
src/features/auth/services/auth.service.ts
src/features/org/components/guards/OrgCompanyRouteGuard.tsx
src/features/org/hooks/useOrgSessionScope.ts
src/features/org/hooks/org-company-query-gate.ts
src/features/org/hooks/sucursal.hooks.ts
src/features/org/pages/SucursalesPage.tsx
src/features/org/services/org.service.ts
src/features/admin/services/menu.service.ts
docs/FLUJO_AUTH_MULTIEMPRESA_FE.md
docs/backend_openapi.json (paths impersonate, menu, permissions/me, org/sucursales)
ERP_FRONTEND_STANDARDS_V2.md §4.8
PLATFORM_IMPERSONATION_AUDIT.md
```

---

*Fase 0 evidencia impersonación. Solo diagnóstico. Sin código. Sin repair. Sin commit.*
