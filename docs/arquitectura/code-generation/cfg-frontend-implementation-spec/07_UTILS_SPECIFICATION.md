# CFG — Utils & Constants Specification

**Versión:** 1.0

---

## 1. Constants

### `constants/cfg-permissions.ts` (W0)

**Export:** `CFG_PERMISSIONS` as const

| Key | Value |
|-----|-------|
| `SECUENCIAS_CONSULTAR` | `cfg.secuencias.consultar` |
| `SECUENCIAS_ACTUALIZAR` | `cfg.secuencias.actualizar` |

### `constants/cfg-list.constants.ts` (W0)

**Export:** `SECUENCIAS_LIST_CONFIG`, `SECUENCIAS_SORTABLE_COLUMNS`

| Config | Value |
|--------|-------|
| tier | `'B'` |
| forcePagination | `true` |
| defaultLimit | `50` |
| sortableColumns | whitelist contrato |
| defaultSort | `{ sort_by: 'sequence_key', sort_dir: 'asc' }` si el tipo lo soporta |

### `constants/cfg-scope-labels.ts` (W0)

**Export:** `CFG_SCOPE_LABELS`, `getCfgScopeLabel(scope)`

| Scope | Label UI |
|-------|----------|
| TENANT | Tenant |
| EMPRESA | Empresa |
| ALMACEN | Almacén |
| PUNTO_VENTA | Punto de venta |

---

## 2. `utils/cfg-display.utils.ts` (W1)

| Función | Comportamiento |
|---------|----------------|
| `formatCfgScopeType` | usa labels; unknown → “—” |
| `formatCfgScopeRef` | nombre enrich o “—”; **nunca** UUID |
| `formatCfgModulo` | string o “—” |

**Tests:** UUID input → “—”.

---

## 3. `utils/cfg-secuencia-form.utils.ts` (W1)

| Función | Comportamiento |
|---------|----------------|
| `normalizeCfgPrefijoInput` | trim + uppercase |
| `validateCfgSecuenciaFormato` | rules contrato; return fieldErrors |
| `buildCfgSecuenciaUpdatePayload(baseline, current)` | only changed keys; empty object if none |
| `isCfgUpdatePayloadEmpty` | boolean |

Validaciones:

- prefijo: max 10; nonempty if sent; prefer alphanumeric
- separador: `''` \| `'-'`
- longitud_numero ≥ 1 int
- numero_inicial ≥ 1 int
- no bloquear numero_inicial ≤ ultimo_numero

**Tests:** payload dirty-only; empty payload; invalid separador.

---

## 4. `utils/cfg-secuencia-dirty.utils.ts` (W1)

| Función | Comportamiento |
|---------|----------------|
| `normalizeCfgFormatoForDirty` | stable shape for compare |
| (uso) | pasar a `isDirtyAgainstBaseline` ORG |

**Tests:** igual baseline → not dirty; change prefijo → dirty.

---

## 5. `utils/cfg-error.utils.ts` (W1)

| Función | Comportamiento |
|---------|----------------|
| `CFG_ERROR_CODES` | const map códigos contrato |
| `extractCfgInternalCode(error)` | string \| null |
| `mapCfgErrorToFieldErrors(error)` | FieldErrors |
| `isCfgLockedError(error)` | boolean |
| `isCfgPreviewNotAllowed(error)` | boolean |
| `getCfgUserMessage(error)` | fallback mensajes contrato si detail vacío |

**Tests:** cada código → field/flag esperado.

---

## 6. `utils/invalidate-cfg-queries.ts` (W2)

| Export | Comportamiento |
|--------|----------------|
| `CFG_QUERY_KEY_PREFIX` | `['cfg']` |
| `invalidateCfgQueries(qc)` | invalidate prefix |
| `removeCfgQueries(qc)` | remove prefix |
| `invalidateCfgSecuenciasList(qc)` | `['cfg','secuencias','list']` |
| `invalidateCfgSecuenciaDetail(qc, id)` | secuencia key |
| `removeCfgSecuenciaDetail(qc, id)` | remove detail |

**Imports:** `QueryClient` type; `cfgQueryKeys` opcional.

**Wiring auth (W2):** ver `01` §2.10 — añadir llamadas junto a ORG/INV.

**Tests:** functions call invalidate con key esperada (mock qc).

---

## 7. Dependencias utils

```text
display ← scope-labels, types
form ← types
dirty ← types
error ← types / axios error shape
invalidate ← query-keys, QueryClient
```

Utils puros excepto invalidate (side-effect qc).
