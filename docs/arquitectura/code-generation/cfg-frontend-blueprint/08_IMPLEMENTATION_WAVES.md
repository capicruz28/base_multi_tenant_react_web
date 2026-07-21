# CFG — Implementation Waves

**Versión:** 1.0  
**Estrategia:** incremental, cada wave mergeable / revisable  
**Prohibido:** saltar waves o implementar UI antes de service+types estables

---

## 1. Vista general

```text
Wave 0  Foundation (types, constants, registry, stub route)
   ↓
Wave 1  Service layer + unit tests service/utils
   ↓
Wave 2  React Query hooks + invalidate + hook tests
   ↓
Wave 3  SecuenciasPage listado (read-only UI)
   ↓
Wave 4  Edit Dialog + dirty + PATCH + lifecycle confirms
   ↓
Wave 5  Preview Dialog + polish + hardening + DoD
```

---

## 2. Wave 0 — Foundation

### Entregables

- [ ] `types/` mínimos (`cfg.types`, list types)
- [ ] `constants/cfg-permissions.ts`, `cfg-list.constants.ts`, `cfg-scope-labels.ts`
- [ ] `routes.tsx` + page stub (“CFG Secuencias”)
- [ ] Registro `ERP_MODULES` + `ERP_ROUTE_SEGMENTS`
- [ ] Lazy entry en `app-route-tree.tsx` + `PermissionGuard`
- [ ] (Ideal) OpenAPI snapshot disponible para tipado

### Dependencias

- Ninguna de código feature.
- P1 OpenAPI: si falta, tipar contra contrato §7 y marcar deuda tipada.

### Exit criteria

- Navegar a `/app/cfg/secuencias` con usuario que tenga LBAC `cfg.ver` muestra stub.
- `tsc` no rompe por registros.

---

## 3. Wave 1 — Service + utils

### Entregables

- [ ] `cfg-secuencias.service.ts` (6 métodos)
- [ ] `cfg-secuencia-form.utils.ts`, `cfg-error.utils.ts`, `cfg-display.utils.ts`
- [ ] Tests unitarios service (mock axios) + utils

### Exit criteria

- 6 operationIds cubiertos.
- Payload PATCH solo campos permitidos (test).
- Preview POST sin body (test).

---

## 4. Wave 2 — React Query

### Entregables

- [ ] `cfg-query-keys.ts`, `cfg-query-defaults.ts`
- [ ] `invalidate-cfg-queries.ts`
- [ ] Hooks list/detail + 4 mutations
- [ ] Tests hooks (invalidate matrix, preview no-invalidate)
- [ ] Wire invalidación en cambio empresa/tenant si aplica (grep)

### Exit criteria

- List hook con `forcePagination`.
- Mutations toasts en onSuccess/onError.
- Preview no invalida list.

---

## 5. Wave 3 — Listado read-only

### Entregables

- [ ] `SecuenciasPage` toolbar + tabla + badges + pagination
- [ ] Row actions Ver + Preview placeholder (o disabled hasta W5)
- [ ] Empty / loading / error states
- [ ] Gate `consultar`
- [ ] Test página smoke (RTL) filtros → page reset

### Exit criteria

- Lista real contra API (o mock MSW).
- Sin botón Crear.
- Sin `empresa_id` filter.
- RB-ROW visible (Desactivar oculto hasta W4 o wired disabled).

**Nota:** se puede mostrar botones mutación en W3 solo si W4 llega en el mismo PR; preferible W3 read-only estricto.

---

## 6. Wave 4 — Edit + lifecycle

### Entregables

- [ ] `CfgSecuenciaEditDialog` + formato fields + locked banner + badges
- [ ] Dirty discard B11
- [ ] PATCH guardar
- [ ] Confirm Desactivar / Reactivar + DELETE/POST
- [ ] Field errors 422
- [ ] Tests dialog/utils dirty + mutation integration

### Exit criteria

- Solo lectura si !actualizar o locked.
- B11-10/11 cumplido.
- List refresh tras mutaciones.

---

## 7. Wave 5 — Preview + hardening

### Entregables

- [ ] `CfgSecuenciaPreviewDialog`
- [ ] Wire Preview desde fila y edit
- [ ] `PREVIEW_NOT_ALLOWED` → hide button
- [ ] Responsive/a11y pass
- [ ] Checklist post-impl `11` + contrato FE `07_IMPLEMENTATION_CHECKLIST`
- [ ] DoD `12`

### Exit criteria

- Disclaimer siempre visible.
- No invalidate list on preview.
- Sin create/align/fiscal UI.
- Módulo usable E2E manual con permisos reales.

---

## 8. Dependencias entre etapas

| Wave | Depende de |
|------|------------|
| 0 | — |
| 1 | 0 (types) |
| 2 | 1 |
| 3 | 2 |
| 4 | 3 (+ 2 mutations) |
| 5 | 4 (edit opcional) + 3 |

**Paralelizable menor:** utils display/labels en W0–W1; badges component en W3.

**No paralelizar:** W4 antes de W2; W3 antes de W1.

---

## 9. Orden exacto de implementación (archivo)

1. `cfg.types.ts` / `cfg-list.types.ts`
2. `cfg-permissions.ts` / `cfg-list.constants.ts` / `cfg-scope-labels.ts`
3. `erp-modules.ts` + `post-login-path.ts`
4. `routes.tsx` + stub `SecuenciasPage.tsx`
5. `app-route-tree.tsx`
6. `cfg-secuencias.service.ts`
7. utils form/error/display
8. `invalidate-cfg-queries.ts` + `cfg-query-keys.ts`
9. hooks queries/mutations
10. list UI completa en `SecuenciasPage`
11. `CfgSecuenciaStatusBadges` / `CfgLockedBanner`
12. `CfgSecuenciaEditDialog` (+ formato fields)
13. Confirms lifecycle en page
14. `CfgSecuenciaPreviewDialog`
15. Tests faltantes + polish

---

## 10. Relación con Spec de Implementación

La **Specification de Implementación** (siguiente paquete) debe:

- Expandir cada wave en tareas archivo-a-archivo con firmas export.
- Listar mocks/fixtures.
- No contradecir este Blueprint.

Implementación de código **solo** después de esa Spec (o Spec+Wave0 acordada).
