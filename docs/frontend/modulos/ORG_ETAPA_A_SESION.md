# ORG — Etapa A: Infra sesión / contexto / guards

**Fecha cierre:** 2026-05-21  
**Alcance:** solo módulo ORG + utilidades auth compartidas + `ProtectedRoute` / `AuthContext` (mínimo).

## Objetivo

Alinear el frontend ORG al modelo **JWT-driven** sin eliminar aún `?empresa_id` en services (Etapa B).

## Implementado

| # | Entrega | Ubicación |
|---|---------|-----------|
| 1 | `useOrgSessionScope()` + `useOrgScopeEmpresaReset()` | `src/features/org/hooks/useOrgSessionScope.ts` |
| 2 | Errores 403 `MISSING_SESSION_EMPRESA` / `EMPRESA_SCOPE_MISMATCH` | `src/core/auth/utils/empresa-scope-errors.ts` |
| 3 | Toasts ORG con prioridad scope | `src/features/org/utils/org-api-error.ts` + hooks ORG |
| 4 | Invalidación caché `['org']` | `invalidate-org-queries.ts`, `useOrgSessionScope`, `AuthContext.applyFullSessionToken` |
| 5 | Guards tenant / company / hybrid | `OrgTenantRouteGuard`, `OrgCompanyRouteGuard` en `routes.tsx` |
| 6 | Banner empresa activa (sin selector cross-company) | `OrgActiveEmpresaBanner.tsx` |
| 7 | Páginas ORG usan `scopeEmpresaId` (JWT) | 5 company + parámetros |
| 8 | `ProtectedRoute`: pending + excepción `/app/org/empresa` | `ProtectedRoute.tsx` |

## Criterios de cierre

| Criterio | Estado |
|----------|--------|
| ORG usa `empresaActivaId` del JWT/contexto | ✅ `scopeEmpresaId` |
| `selection_pending` alineado a guards | ✅ company/hybrid → selección; tenant empresa vía shell |
| `cambiarEmpresaActiva` refresca ORG | ✅ `queryClient.clear` + `invalidateOrgQueries` + reset local |
| Sin contaminación filtros locales | ✅ eliminado `empresaFilter` operativo en listados |

## Checklist manual QA

- [ ] Login multi-empresa → seleccionar → entrar a Sucursales: banner muestra empresa activa, sin combo “Todas”.
- [ ] Cambiar empresa en header → listado ORG se actualiza (sin datos de empresa anterior).
- [ ] Impersonación con selección pendiente → no accede a `/app/org/sucursales` (redirect selección).
- [ ] Onboarding admin → `/app/org/empresa?onboarding=true` accesible.
- [ ] Simular 403 `MISSING_SESSION_EMPRESA` → toast + redirect selección (si aplica).
- [ ] F5 con sesión completa → mismos datos de empresa activa.

## Impacto cross-módulo

| Área | Impacto Etapa A |
|------|-----------------|
| Módulos que importan `org.service` | **Sin cambios** |
| `AuthContext` | `invalidateOrgQueries` tras token completo |
| `ProtectedRoute` | Excepción `org/empresa` con selection store |
| INV / otros ERP | **No tocados** |

## Riesgos residuales (para Etapa B+)

- Services siguen enviando `?empresa_id` cuando `scopeEmpresaId` está definido (compat temporal; backend nuevo puede 403).
- Parámetros: UI híbrida global/override pendiente (Etapa D).
- Formularios parámetros aún permiten elegir alcance empresa en modal (validar contra JWT en B).

## Siguiente etapa

**Etapa B** — ✅ Ver `ORG_ETAPA_B_SESION.md`.
