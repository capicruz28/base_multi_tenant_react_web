# CFG — Test Specification

**Versión:** 1.0  
**Ubicación preferida:** colocalizado `*.test.ts(x)` junto al archivo o `src/features/cfg/__tests__/`  
**Stack:** Vitest + Testing Library + mock api (patrón INV)

---

## 1. Fixtures necesarios

**Archivo sugerido:** `src/features/cfg/__tests__/fixtures/cfg-secuencia.fixtures.ts` (W1+)

| Fixture | Características |
|---------|-----------------|
| `fixtureSecuenciaActiva` | es_activo true, !locked, supports_preview true |
| `fixtureSecuenciaInactiva` | es_activo false |
| `fixtureSecuenciaLocked` | config_locked true, sequence_key tipo org_empresa |
| `fixtureSecuenciaDrift` | policy_drift true |
| `fixtureSecuenciaNoPreview` | supports_preview false |
| `fixtureListEnvelope` | items + total/pagina/limit |
| `fixturePreviewOk` | codigo_estimado + disclaimer + consume_contador false |
| `fixtureFormatoBaseline` | valores formato estables |

IDs: UUIDs fake fijos (solo en data, no en UI asserts de texto UUID).

---

## 2. Mocks necesarios

| Mock | Uso |
|------|-----|
| `api.get/post/patch/delete` | service tests |
| `cfgSecuenciaService` module | hook tests |
| `usePermission` / PermissionProvider | page/component RBAC |
| `QueryClientProvider` test wrapper | hooks/page |
| `toast` (react-hot-toast) | assert success/error calls |
| MSW (opcional W3+) | list integration |

No mockear Backend real en unit tests.

---

## 3. Casos de prueba por archivo

### Service `cfg-secuencias.service.test.ts` (W1)

| Caso | Assert |
|------|--------|
| list GET url + params page | called |
| list omite undefined | query |
| getById path id | |
| update PATCH body sin es_activo | |
| desactivar DELETE | |
| reactivar POST …/reactivar | |
| preview POST …/preview sin data | |

### Utils form/dirty/error/display (W1)

Ver Blueprint testing P0 + Spec 07.

### `invalidate-cfg-queries.test.ts` (W2)

| Caso | Assert |
|------|--------|
| invalidateCfgQueries key `cfg` | |
| invalidate list key | |
| remove detail id | |

### Hooks (W2)

| Archivo | Casos clave |
|---------|-------------|
| `useCfgSecuenciasErpList.test.ts` | fetch when enabled; page reset |
| `useCfgSecuencia.test.ts` | no fetch without id |
| `useUpdateCfgSecuencia.test.ts` | invalidate list on success; toast |
| `useDesactivarCfgSecuencia.test.ts` | invalidate list+detail |
| `useReactivarCfgSecuencia.test.ts` | idem |
| `usePreviewCfgSecuencia.test.ts` | **no** invalidate list |

### Components (W3–W5)

| Archivo | Casos |
|---------|-------|
| `CfgSecuenciaStatusBadges.test.tsx` | combinaciones |
| `CfgSecuenciaFormatoFields.test.tsx` | disabled/errors/upper |
| `CfgSecuenciaEditDialog.test.tsx` | loading; readonly; locked; save payload |
| `CfgSecuenciaPreviewDialog.test.tsx` | disclaimer; not allowed callback |
| `SecuenciasPage.test.tsx` | gate consultar; empty; RB-ROW; B11 stack; no Crear |

---

## 4. Cobertura mínima por Wave

| Wave | Tests obligatorios para merge |
|------|-------------------------------|
| 0 | tsc; smoke route opcional |
| 1 | service + utils P0 |
| 2 | hooks P0 + invalidate + preview no-invalidate |
| 3 | page list smoke + badges |
| 4 | edit dialog + page confirms/RBAC |
| 5 | preview dialog + page preview wire |

---

## 5. DoD testing módulo

- [ ] P0 verdes
- [ ] P1 críticos RBAC/B11 verdes
- [ ] Ningún test requiere red real
- [ ] Fixtures sin secretos
