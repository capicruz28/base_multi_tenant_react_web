# ORG — Etapa D: Parámetros HYBRID completo

**Fecha:** 2026-05-21  
**Alcance:** solo `src/features/org/**` (parámetros híbridos).

## Objetivo

Vista híbrida definitiva alineada al backend multiempresa/JWT: lectura efectiva (override > global), escritura global restringida, override solo empresa activa, caché por vista.

## Implementación

### Vistas (tabs)

| Tab | Query key | HTTP `?vista=` | Fallback FE |
|-----|-----------|----------------|-------------|
| Valores efectivos | `['org','parametros','effective', scopeEmpresaId, …]` | `efectivo` | merge global + override |
| Globales tenant | `['org','parametros','global', …]` | `global` | filtro `!empresa_id` |
| Overrides empresa activa | `['org','parametros','override', scopeEmpresaId, …]` | `override` | filtro `empresa_id` |

Sin `?empresa_id` en query (Etapa B).

### UX

- Badges: **GLOBAL**, **OVERRIDE**, **EFECTIVO** (`OrgParametroAlcanceBadge`)
- Tooltip precedencia en vista efectiva
- Forms: alcance readonly en edición; create con `forceAlcance` por tab
- Acciones globales ocultas si no `tenant_admin` / `platform_admin`

### Errores FE

| Código | Mensaje |
|--------|---------|
| `MISSING_SESSION_EMPRESA` | Sesión sin empresa activa |
| `EMPRESA_SCOPE_MISMATCH` | Operación fuera de empresa JWT |
| `GLOBAL_PARAM_FORBIDDEN` | Sin permiso para parámetros globales |

Parseo vía `parseEmpresaScopeError` + `toastOrgApiError`.

### Archivos nuevos / clave

- `parametro-query-keys.ts`, `parametro.hooks.ts` (3 list hooks)
- `org-parametro-resolve.ts`, `invalidate-org-parametro-queries.ts`
- `OrgParametroHybridTabs.tsx`, `OrgParametroAlcanceBadge.tsx`
- `useOrgCanManageGlobalParametros.ts`
- `ParametrosPage.tsx` (tabs definitivas)

## Checklist QA manual

- [ ] Impersonación ACME → Empresa A: overrides y efectivos coherentes
- [ ] Mismo código: override en efectivos gana sobre global
- [ ] Cambio empresa en header: tabs override/efectivos refrescan (keys con `scopeEmpresaId`)
- [ ] `selection_pending`: guard hybrid redirige; no listados
- [ ] Network: GET `/org/parametros` sin `empresa_id`; opcional `vista=`
- [ ] Usuario operativo: ve globales read-only; sin crear/editar global
- [ ] `tenant_admin`: CRUD globales en tab Globales tenant
- [ ] POST global sin permiso → toast `GLOBAL_PARAM_FORBIDDEN` (403)

## Riesgos residuales

1. OpenAPI repo puede no documentar `?vista=`; fallback merge en FE.
2. Si backend devuelve listado mixto sin `alcance_efectivo`, FE infiere en merge.
3. Módulos externos no migrados (fuera de alcance).

## Confirmación

- **ORG frontend queda completamente alineado al backend multiempresa/JWT-driven** en parámetros híbridos.
- **Sin interacción cross-company manual** en parámetros.
- **Precedencia override > global** reflejada en tab Valores efectivos.
