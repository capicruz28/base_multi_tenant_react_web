# CFG — Types Blueprint

**Versión:** 1.0  
**Fuente de verdad de schemas:** OpenAPI snapshot CFG + contrato `01_API_CONTRACT.md`  
**Estilo:** types manuales (sin codegen), igual que ORG/INV

---

## 1. Archivos

| Archivo | Contenido |
|---------|-----------|
| `types/cfg.types.ts` | Entidades API + unions scope/policy |
| `types/cfg-list.types.ts` | Params listado FE / filtros UI |
| `types/cfg-discard.types.ts` | `'edit' \| null` discard (si no se reexporta ORG) |

---

## 2. Types API (mínimo obligatorio)

Derivar nombres del contrato/OpenAPI. Campos clave (no lista exhaustiva de enrich):

### `CfgScopeType`

`'TENANT' | 'EMPRESA' | 'ALMACEN' | 'PUNTO_VENTA'`

### `CodigoSecuenciaRead` (alias `CfgSecuencia`)

Campos UI-críticos:

| Campo | Rol |
|-------|-----|
| `secuencia_id` | id |
| `sequence_key` | negocio |
| `prefijo`, `separador`, `longitud_numero`, `numero_inicial` | formato |
| `ultimo_numero` | readonly |
| `es_activo` | estado |
| `generation_policy` | readonly |
| `modulo_codigo` | filtro/label |
| `scope_type` | filtro/label |
| `config_locked` | UI lock |
| `policy_drift` | badge |
| `supports_preview` | preview button |
| scope refs | empresa/almacén/PV ids y/o nombres enrich |
| `fecha_creacion`, `fecha_actualizacion` | auditoría |

**MUST NOT** tipar `cliente_id` como campo de respuesta (contrato: no viene).

### `CodigoSecuenciaUpdate` (`CfgSecuenciaUpdate`)

```text
Partial<{
  prefijo: string
  separador: '' | '-'
  longitud_numero: number
  numero_inicial: number
}>
```

Al menos un campo en runtime (validado en utils).

### `CodigoSecuenciaPreviewResponse` (`CfgSecuenciaPreview`)

| Campo | Uso |
|-------|-----|
| `codigo_estimado` | hero |
| `disclaimer` | siempre |
| `consume_contador` | false esperado |
| `ultimo_numero_actual` | secundario |
| `numero_inicial` | secundario |
| `es_activo` | aviso inactiva |

### Envelope listado

Alinear a tipo ErpList existente (`ErpPaginatedResponse<T>` / `{ items, total, pagina_actual, total_paginas, limit }`).

---

## 3. Types listado FE

### `CfgSecuenciaListParams`

Extiende params ErpList (`page`, `limit`, `buscar`, `sort_by`, `sort_dir`) + dominio:

- `modulo_codigo?: string`
- `es_activo?: boolean`
- `scope_type?: CfgScopeType`
- `empresa_id?: string` (reservado; UI no envía en MVP)

### `CfgSecuenciaListFilters` (estado toolbar)

```text
{
  modulo_codigo: string | ''
  es_activo: 'activas' | 'inactivas' | 'todas'
  scope_type: '' | CfgScopeType
}
```

Mapper → `baseFilters` API.

---

## 4. Types formulario

### `CfgSecuenciaFormatoForm`

```text
{
  prefijo: string
  separador: '' | '-'
  longitud_numero: number
  numero_inicial: number
}
```

### `CfgSecuenciaFieldErrors`

`Partial<Record<keyof CfgSecuenciaFormatoForm, string>>`

---

## 5. Constants tipadas de error

```text
CFG_ERROR_CODES = {
  ORG_EMPRESA_CFG_LOCKED: 'ORG_EMPRESA_CFG_LOCKED',
  CFG_PREFIX_INVALID: 'CFG_PREFIX_INVALID',
  …
  PREVIEW_NOT_ALLOWED: 'PREVIEW_NOT_ALLOWED',
  INVALID_SORT_COLUMN: 'INVALID_SORT_COLUMN',
} as const
```

---

## 6. Reglas TypeScript

| Regla | Valor |
|-------|-------|
| `any` | Prohibido |
| IDs | `string` (uuid) |
| Enums | union string literals |
| Export | named exports |
| OpenAPI drift | Si snapshot llega después, alinear types en Wave 0/1 sin cambiar paths |

---

## 7. Prerequisito OpenAPI (P1)

Antes de cerrar types en código:

1. Disponer `app/docs/openapi_snapshot.json` (o snapshot CFG publicado) con schemas `CodigoSecuencia*`.
2. Contrastar campos enrich (nombres de empresa, etc.).
3. Si un campo UI no existe en OpenAPI → no inventarlo; mostrar “—” / omitir.

Hasta entonces, la Spec de Implementación puede usar el contrato `01_API_CONTRACT` §7 como piso mínimo tipable.
