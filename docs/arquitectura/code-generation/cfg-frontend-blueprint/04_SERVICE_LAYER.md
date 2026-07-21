# CFG — Service Layer Blueprint

**Versión:** 1.0  
**Archivo:** `src/features/cfg/services/cfg-secuencias.service.ts`  
**Cliente:** `import api from '@/core/api/api'`  
**BASE:** `'/api/v1/cfg'`

---

## 1. Principios

1. Un service por recurso admin (`secuencias`).
2. Tipado estricto; retorno Promise de types CFG.
3. Sin toast, sin React Query, sin `window`.
4. Query params: solo definidos; omitir `undefined`/`null`.
5. Listado UI siempre con `page` (aunque el API tolere array).
6. Documentar `operationId` en JSDoc de cada método.
7. No enviar `cliente_id`.

---

## 2. Métodos oficiales

| Método service | HTTP | Path | operationId |
|----------------|------|------|-------------|
| `list(params)` | GET | `/secuencias` | `list_cfg_codigo_secuencias` |
| `getById(secuenciaId)` | GET | `/secuencias/{id}` | `get_cfg_codigo_secuencia` |
| `update(secuenciaId, body)` | PATCH | `/secuencias/{id}` | `update_cfg_codigo_secuencia` |
| `desactivar(secuenciaId)` | DELETE | `/secuencias/{id}` | `desactivar_cfg_codigo_secuencia` |
| `reactivar(secuenciaId)` | POST | `/secuencias/{id}/reactivar` | `reactivar_cfg_codigo_secuencia` |
| `preview(secuenciaId)` | POST | `/secuencias/{id}/preview` | `preview_cfg_codigo_secuencia` |

URL completa = `BASE + path` → `/api/v1/cfg/secuencias…`

---

## 3. Contratos de params / body (service)

### `list(params: CfgSecuenciaListParams)`

Params FE (subset API):

| Param | En UI MVP |
|-------|-----------|
| `page` | Siempre |
| `limit` | Siempre |
| `buscar` | Sí |
| `modulo_codigo` | Sí |
| `es_activo` | Sí (boolean \| undefined para “Todas”) |
| `scope_type` | Sí |
| `sort_by` / `sort_dir` | Sí |
| `empresa_id` | **No** expuesto por UI; tipo puede existir por si Blueprint futuro |
| `sequence_key` | No UI (buscar cubre) |

Retorno tipado: `CodigoSecuenciaRead[] | CfgSecuenciaListEnvelope`  
(o unificar vía helper `normalizeListResponse` en el hook, no en service — **Decisión T-S1:** service retorna `unknown` tipado como unión; hook normaliza. Preferible: service tipa unión; ErpList fetcher ya normaliza.)

**Decisión:** el `fetcher` del ErpList llama al service y retorna lo que venga; `useErpListQuery` aplica `normalizeListResponse`.

### `getById` → `CodigoSecuenciaRead`

### `update` → body `CodigoSecuenciaUpdate` (partial, ≥1 field) → `CodigoSecuenciaRead`

### `desactivar` / `reactivar` → `CodigoSecuenciaRead` (sin body)

### `preview` → `CodigoSecuenciaPreviewResponse` (body vacío / `undefined`)

---

## 4. Helpers de query string

Reutilizar patrones INV:

- `buildErpListQueryParams` / builder local `buildCfgSecuenciaListQuery`
- Serializar booleans de forma consistente con otros módulos
- No enviar `limit` sin `page` (UI siempre envía ambos)

---

## 5. Errores

- Dejar propagar Axios errors.
- Hooks usan `getErrorMessage`.
- `cfg-error.utils` interpreta `internal_code` cuando el response lo exponga.

---

## 6. Export

```text
export const cfgSecuenciaService = { list, getById, update, desactivar, reactivar, preview }
```

Nombre estable para tests y hooks.

---

## 7. Anti-patrones service

| Prohibido |
|-----------|
| `POST …/activar` o paths legacy |
| PATCH con `es_activo` |
| Generar correlativos en FE |
| Llamar APIs ORG/INV para admin secuencias |
| Duplicar client Axios |
