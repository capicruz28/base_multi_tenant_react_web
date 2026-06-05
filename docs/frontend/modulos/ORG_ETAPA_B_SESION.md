# ORG — Etapa B: API / services JWT-driven

**Fecha cierre:** 2026-05-21  
**Depende de:** Etapa A (`ORG_ETAPA_A_SESION.md`)

## Cambios

1. `org.service.ts` — eliminado `?empresa_id` en sucursales, departamentos, cargos, centros-costo, parámetros (list, getById, update, delete, reactivar).
2. Types — `OrgCompanyListParams`, `OrgParametroListParams`; `OrgListParams` deprecated.
3. Hooks — query keys segmentadas por `scopeEmpresaId` (sesión); `useOrgCompanyQueryGate` / `useOrgHybridQueryGate`.
4. `useEmpresasTenant()` — catálogo tenant sin scope company.
5. Pages ORG — mutaciones sin `empresa_id` en query; create con `assertBodyEmpresaMatchesSession`.
6. Docs — `ORG_ETAPA_B_API_JWT.md`, `ORG_ETAPA_B_BLAST_RADIUS.md`.

## Criterios de cierre

| Criterio | Estado |
|----------|--------|
| Cero query `empresa_id` HTTP ORG company-scoped | ✅ |
| Company scope JWT-driven | ✅ |
| React Query consistente al cambiar empresa | ✅ (keys + Etapa A invalidation) |
| Hooks/pages ORG alineados | ✅ |
| Blast radius documentado | ✅ |
| Módulos externos migrados | ❌ (fuera de alcance) |

## Checklist manual

- [ ] Network tab: `GET /org/sucursales` sin query `empresa_id`.
- [ ] Cambiar empresa en header → listados ORG refrescan sin 403 legacy.
- [ ] Crear sucursal con empresa activa → POST body `empresa_id` = JWT.
- [ ] Intentar forzar `?empresa_id=` en DevTools → backend 403 (si probado).
- [ ] Parámetros: list sin `empresa_id` query.

## Confirmación explícita

**0 requests ORG company-scoped emitidos por `src/features/org/**` con query param `empresa_id`.**

Los módulos fuera de `src/features/org` que aún pasan `empresa_id` a services ORG quedan **rotos en compile-time** hasta su propia migración (ver blast radius).
