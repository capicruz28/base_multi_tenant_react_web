# CFG — Types Specification

**Versión:** 1.0  
**Wave:** 0  
**Fuente:** Contrato `01_API_CONTRACT` + OpenAPI snapshot cuando exista (P1)

---

## 1. `types/cfg.types.ts`

### Exports públicos (named)

| Type | Definición mínima |
|------|-------------------|
| `CfgScopeType` | `'TENANT' \| 'EMPRESA' \| 'ALMACEN' \| 'PUNTO_VENTA'` |
| `CfgSecuencia` / `CodigoSecuenciaRead` | ver campos abajo |
| `CfgSecuenciaUpdate` / `CodigoSecuenciaUpdate` | partial formato |
| `CfgSecuenciaPreview` / `CodigoSecuenciaPreviewResponse` | preview fields |
| `CfgSeparador` | `'' \| '-'` |

### Campos obligatorios `CfgSecuencia` (UI)

`secuencia_id`, `sequence_key`, `prefijo`, `separador`, `longitud_numero`, `numero_inicial`, `ultimo_numero`, `es_activo`, `generation_policy`, `modulo_codigo`, `scope_type`, `config_locked`, `policy_drift`, `supports_preview`, `fecha_creacion`, `fecha_actualizacion`

Campos enrich opcionales (si OpenAPI los trae): nombres de empresa/almacén/PV — tipar como `string | null | undefined`. IDs de scope tipados pero **nunca renderizados** (display utils).

**MUST NOT:** `cliente_id` en Read.

### `CfgSecuenciaUpdate`

```text
{
  prefijo?: string
  separador?: CfgSeparador
  longitud_numero?: number
  numero_inicial?: number
}
```

### `CfgSecuenciaPreview`

`codigo_estimado`, `disclaimer`, `consume_contador`, `ultimo_numero_actual`, `numero_inicial`, `es_activo` (+ extras OpenAPI si hay)

### DoD

Compila; usado por service en W1.

---

## 2. `types/cfg-list.types.ts`

### Exports

| Type | Uso |
|------|-----|
| `CfgSecuenciaListParams` | service.list + ErpList |
| `CfgEsActivoFilterUi` | `'activas' \| 'inactivas' \| 'todas'` |
| `CfgSecuenciaListFiltersUi` | estado toolbar |
| `CfgSecuenciaFormatoForm` | edit form |
| `CfgSecuenciaFieldErrors` | Partial Record campos formato |

`CfgSecuenciaListParams` incluye ErpList base (`page`, `limit`, `buscar`, `sort_by`, `sort_dir`) + dominio.  
`empresa_id?: string` **puede tiparse** pero UI MVP no lo setea.

### Helpers type-level

Ninguno requerido.

---

## 3. `types/cfg-discard.types.ts`

```text
export type CfgDiscardPending = 'edit' | null
```

Alternativa aceptada: importar tipo ORG equivalente y alias — documentar en PR.

---

## 4. Dependencias

```text
cfg.types ← cfg-list.types
cfg.types ← constants scope labels
cfg.types ← service, hooks, components
```

Types **no** importan React ni axios.

---

## 5. Alineación OpenAPI (P1)

Cuando llegue snapshot:

1. Diff campos Read/Update/Preview.
2. Añadir opcionales missing.
3. No eliminar campos UI ya usados sin migración.

Hasta entonces: contrato §7 es piso suficiente para Wave 0–1.
