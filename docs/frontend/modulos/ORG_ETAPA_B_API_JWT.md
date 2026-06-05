# ORG — Contrato HTTP JWT-driven (Etapa B)

**Fecha:** 2026-05-21  
**Backend:** multiempresa / impersonación-safe (ámbito en JWT, no en query).

## Reglas globales

| Ámbito | Rutas | Query `empresa_id` | Query `cliente_id` | Body `empresa_id` |
|--------|-------|--------------------|--------------------|-------------------|
| Tenant | `GET/POST/PUT/DELETE /org/empresa` | ❌ | ❌ | Create: asignado por backend |
| Company | `/org/sucursales`, `departamentos`, `cargos`, `centros-costo` | ❌ | ❌ | Create/Update: obligatorio, debe coincidir con JWT |
| Hybrid | `/org/parametros` | ❌ | ❌ | Create: `empresa_id` null = global tenant; UUID = override empresa (validado JWT) |

## Errores 403 esperados

| Código | Cuándo |
|--------|--------|
| `MISSING_SESSION_EMPRESA` | `empresa_selection_pending` o sin empresa en JWT |
| `EMPRESA_SCOPE_MISMATCH` | Body/query legacy con empresa distinta a sesión |

## Frontend (Etapa B)

- `org.service.ts`: sin `params.empresa_id` en company/hybrid.
- Hooks: `useOrgCompanyQueryGate` / `useOrgHybridQueryGate` + `scopeEmpresaId` solo en **query keys** React Query.
- Catálogo tenant: `useEmpresasTenant()` → `GET /org/empresa` (no scope company).

## OpenAPI

`docs/api/ORG_API.json` puede seguir mostrando `empresa_id` query hasta sincronización desde backend vivo (`GET /openapi.json`).  
**Fuente de verdad operativa:** este documento + código en `src/features/org/services/org.service.ts`.
