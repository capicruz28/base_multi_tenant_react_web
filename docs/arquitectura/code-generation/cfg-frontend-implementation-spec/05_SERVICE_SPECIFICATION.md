# CFG — Service Specification

**Versión:** 1.0  
**Archivo:** `src/features/cfg/services/cfg-secuencias.service.ts`  
**Export:** `cfgSecuenciaService`  
**Wave:** 1  
**BASE:** `'/api/v1/cfg'`

---

## 1. Responsabilidad

Único acceso HTTP al recurso secuencias. Sin UI, sin RQ, sin toast.

---

## 2. Imports esperados

| From | What |
|------|------|
| `@/core/api/api` | default `api` |
| `../types/cfg.types` | Read, Update, Preview |
| `../types/cfg-list.types` | ListParams |

Opcional: helpers query from `@/core/list` si el módulo ya los usa para serializar.

---

## 3. Métodos — contrato exacto

### `list(params: CfgSecuenciaListParams)`

| | |
|--|--|
| HTTP | `GET ${BASE}/secuencias` |
| operationId | `list_cfg_codigo_secuencias` |
| Query | page, limit, buscar, modulo_codigo, es_activo, scope_type, sort_by, sort_dir (omit undefined) |
| Return | Promise data (array \| envelope) — tipar unión |

**UI siempre envía page+limit** (caller hooks).

### `getById(secuenciaId: string)`

| | |
|--|--|
| HTTP | `GET ${BASE}/secuencias/${secuenciaId}` |
| operationId | `get_cfg_codigo_secuencia` |
| Return | `CodigoSecuenciaRead` |

### `update(secuenciaId: string, body: CfgSecuenciaUpdate)`

| | |
|--|--|
| HTTP | `PATCH` |
| operationId | `update_cfg_codigo_secuencia` |
| Body | JSON subset formato |
| Return | `CodigoSecuenciaRead` |

### `desactivar(secuenciaId: string)`

| | |
|--|--|
| HTTP | `DELETE` |
| operationId | `desactivar_cfg_codigo_secuencia` |
| Body | none |
| Return | `CodigoSecuenciaRead` |

### `reactivar(secuenciaId: string)`

| | |
|--|--|
| HTTP | `POST ${BASE}/secuencias/${id}/reactivar` |
| operationId | `reactivar_cfg_codigo_secuencia` |
| Body | none / empty |
| Return | `CodigoSecuenciaRead` |

### `preview(secuenciaId: string)`

| | |
|--|--|
| HTTP | `POST …/preview` |
| operationId | `preview_cfg_codigo_secuencia` |
| Body | none |
| Return | `CodigoSecuenciaPreviewResponse` |

---

## 4. Anti-contratos (tests deben fallar si se implementan)

- PATCH con `es_activo`
- POST activate legacy
- `cliente_id` en query/body
- Base distinta de `/api/v1/cfg`

---

## 5. DoD archivo

- [ ] 6 métodos exportados en objeto `cfgSecuenciaService`
- [ ] JSDoc operationId en cada método
- [ ] Tests mock api: methods/urls/bodies
- [ ] Sin `any`
