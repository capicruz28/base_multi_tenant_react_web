# ORG — Etapa C: UX company-scoped y limpieza visual

**Fecha:** 2026-05-21  
**Estado:** Completada (alcance ORG `src/features/org/**` únicamente)

## Objetivo

Alinear la experiencia de usuario al modelo JWT-driven (Etapas A+B): sin selector manual cross-company en pantallas company-scoped, empresa activa solo desde sesión, formularios y tablas coherentes.

## Cambios principales

### Componentes nuevos

| Archivo | Rol |
|---------|-----|
| `OrgCompanyToolbar.tsx` | Barra estándar: banner empresa activa + filtros + acciones |
| `OrgSessionEmpresaField.tsx` | Campo readonly + hidden `empresa_id` de sesión |
| `OrgHybridPrecedenceHint.tsx` | Nota visual: override > global |
| `OrgParametroAlcanceField.tsx` | Radio global vs override (sin combo de empresas) |
| `org-parametro-scope.ts` | Filtro vista, labels alcance, payload create híbrido |

### Páginas company-scoped

- **Sucursales, Departamentos, Cargos, Centros de costo**
  - Eliminada columna «Empresa» en tablas (contexto = empresa activa JWT).
  - Eliminado estado `formEmpresaId` y filtros `*MismaEmpresa` por `empresa_id`.
  - Toolbar unificada + `OrgSessionEmpresaField` en modales create.
  - Create: `assertBodyEmpresaMatchesSession` (sin edición manual de `empresa_id`).

- **Parámetros (híbrido)**
  - Eliminados selects «Empresa (alcance)» en create/edit.
  - Separación visual: filtro lista (todos / global tenant / override empresa activa).
  - Columna «Alcance» con badges.
  - Create: radio global (solo `tenant_admin` / super admin) vs override (inyecta `scopeEmpresaId`).
  - Edit: alcance readonly (no cambio cross-company).
  - Banner precedencia backend.

### Sin cambios (por diseño)

- `EmpresaPage.tsx` — catálogo tenant (`/app/org/empresa`).
- Módulos externos (INV, HCM, LOG, FIN, etc.) que llaman `org.service` con `empresa_id` — ver `ORG_ETAPA_B_BLAST_RADIUS.md`.
- Hardening QA final y documentación global.

## Confirmación explícita

- **ORG frontend queda completamente JWT-driven** en las 5 pantallas company/hybrid: scope operativo = `useOrgSessionScope().scopeEmpresaId`; HTTP sin `?empresa_id` (Etapa B); body create company = sesión.
- **Sin interacción company manual** en sucursales, departamentos, cargos, centros de costo ni parámetros (override/global vía radio de alcance, no selector de otra empresa).
- **Alineado arquitectónicamente al backend ORG multiempresa**: guards `OrgCompanyRouteGuard` / `selection_pending`, invalidación React Query al cambiar empresa (`useOrgScopeEmpresaReset` + `invalidateOrgQueries`).

## Checklist QA

- [ ] Login multiempresa → seleccionar empresa → entrar a cada ruta ORG company-scoped; banner muestra empresa activa.
- [ ] Cambiar empresa en header → listas y filtros locales se reinician; datos refrescan sin mezclar empresa anterior.
- [ ] `selection_pending` → redirect a selección; solo `/app/org/empresa` accesible para tenant.
- [ ] Crear sucursal/departamento/cargo/centro: no hay combo empresa; POST con `empresa_id` = JWT.
- [ ] Tablas company-scoped sin columna Empresa.
- [ ] Parámetros: filtro global/override; crear override con empresa activa; crear global solo como tenant_admin.
- [ ] Parámetros: editar no permite cambiar alcance a otra empresa.
- [ ] Impersonación: banner + scope coherentes con sesión impersonada.

## Riesgos residuales

1. **Consumidores externos** de `sucursalService.list({ empresa_id })` — rotos hasta migración (Etapa E).
2. **Parámetros Etapa D**: lectura de valor efectivo resuelto en backend; UI aún no muestra «valor efectivo» vs «definición global» lado a lado.
3. **Build global** puede fallar por TS en módulos no-ORG (preexistente + blast radius B).
4. **OpenAPI ORG** en docs puede seguir desactualizado respecto al contrato JWT.

## Archivos modificados (Etapa C)

```
src/features/org/components/OrgCompanyToolbar.tsx          (nuevo)
src/features/org/components/OrgSessionEmpresaField.tsx   (nuevo)
src/features/org/components/OrgHybridPrecedenceHint.tsx  (nuevo)
src/features/org/components/OrgParametroAlcanceField.tsx   (nuevo)
src/features/org/utils/org-parametro-scope.ts              (nuevo)
src/features/org/pages/SucursalesPage.tsx
src/features/org/pages/DepartamentosPage.tsx
src/features/org/pages/CargosPage.tsx
src/features/org/pages/CentrosCostoPage.tsx
src/features/org/pages/ParametrosPage.tsx
docs/frontend/modulos/ORG_ETAPA_C_UX.md                    (este doc)
```
