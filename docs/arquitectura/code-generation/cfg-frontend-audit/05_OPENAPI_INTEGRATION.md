# CFG Frontend Audit — Integración OpenAPI / consumo API (AS-IS)

**Fecha:** 2026-07-17  
**Contrato API:** `docs/frontend-contracts/cfg/01_API_CONTRACT.md`  
**Snapshot declarado por contrato:** `app/docs/openapi_snapshot.json`

---

## 1. Cómo consume OpenAPI el Frontend hoy

| Aspecto | Estado AS-IS |
|---------|--------------|
| Codegen (orval, openapi-typescript, hey-api, …) | **No** presente en `package.json` |
| Cliente HTTP | Axios compartido (`src/core/api/api.ts` → instancias) |
| Tipado | Types TypeScript **escritos a mano** por feature, alineados al contrato/OpenAPI |
| Services | `src/features/<mod>/services/*.service.ts` |
| Errores | `getErrorMessage` (`src/core/services/error.service.ts`) |

Patrón dominante:

```text
const BASE = '/api/v1/<mod>'
api.get/post/put/patch/delete(`${BASE}/...`)
```

Ejemplos:

- ORG → `src/features/org/services/org.service.ts`
- INV → `src/features/inv/services/inv.service.ts`
- WMS → `src/features/wms/services/wms.service.ts`

**No hay** capa generada a partir de `operationId`. Los operationIds del contrato CFG son referencia documental; el FE los “usa” al tipar/llamar el path correcto.

---

## 2. Endpoints CFG del contrato (inventario)

Base: `/api/v1/cfg/secuencias`

| Método | Path | operationId | Permiso |
|--------|------|-------------|---------|
| GET | `/api/v1/cfg/secuencias` | `list_cfg_codigo_secuencias` | consultar |
| GET | `/api/v1/cfg/secuencias/{secuencia_id}` | `get_cfg_codigo_secuencia` | consultar |
| PATCH | `/api/v1/cfg/secuencias/{secuencia_id}` | `update_cfg_codigo_secuencia` | actualizar |
| DELETE | `/api/v1/cfg/secuencias/{secuencia_id}` | `desactivar_cfg_codigo_secuencia` | actualizar |
| POST | `…/reactivar` | `reactivar_cfg_codigo_secuencia` | actualizar |
| POST | `…/preview` | `preview_cfg_codigo_secuencia` | consultar |

Sesión: JWT tenant ERP. **No** enviar `cliente_id` para autorizar.

---

## 3. Estado de artefactos OpenAPI en el repo

| Artefacto | Estado en auditoría |
|-----------|---------------------|
| `app/docs/openapi_snapshot.json` (citado por contrato) | **Ausente** (0 archivos) |
| `docs/backend_openapi.json` | Presente, pero **sin** paths `/api/v1/cfg` ni schemas `CodigoSecuencia*` (búsqueda sin matches) |
| `docs/frontend-contracts/cfg/` | Presente — handoff oficial de consumo |

### Implicación

- La **única documentación funcional de consumo** disponible en repo para CFG es el paquete `docs/frontend-contracts/cfg/`.
- El tipado exacto de schemas (`CodigoSecuenciaRead`, etc.) **no** puede derivarse hoy de un snapshot local vigente.
- Esto **no bloquea el diseño funcional** (el contrato describe params, campos clave y comportamientos).
- Sí es un **gap pre-implementación** para tipado estricto y checklist J del contrato (`07_IMPLEMENTATION_CHECKLIST.md`).

---

## 4. Listados y normalización (AS-IS stack)

El core ya tolera el contrato dual de listado CFG:

| Respuesta API | Utilidad FE |
|---------------|-------------|
| Array sin `page` | `normalizeListResponse` / `unwrapListItems` |
| Envelope `{ items, total, pagina_actual, total_paginas, limit }` | Mismo normalize + `ErpPagination` |

Path: `src/core/list/erp-list-normalize.ts`, `useErpListQuery.ts`, `buildErpListQueryParams`.

Whitelist sort CFG (contrato):  
`sequence_key`, `scope_type`, `prefijo`, `ultimo_numero`, `es_activo`, `fecha_creacion`, `fecha_actualizacion`.

INV ya modela whitelists en `ErpListResourceConfig.sortableColumns` — mismo patrón aplicable.

---

## 5. Reglas de payload (contrato → service layer)

El service layer AS-IS de otros módulos encapsula URLs; las reglas de negocio viven en hooks/UI. Para CFG el contrato exige:

| Operación | Regla |
|-----------|-------|
| PATCH | Solo `prefijo`, `separador`, `longitud_numero`, `numero_inicial`; ≥1 campo |
| PATCH | No enviar `es_activo`, `ultimo_numero`, identity, policy |
| Soft delete | `DELETE` (no PATCH `es_activo`) |
| Reactivar | `POST …/reactivar` |
| Preview | POST body vacío |

Violaciones → 422. El FE ya tiene `getErrorMessage` para `detail` string/array; el mapa de `internal_code` CFG (`ORG_EMPRESA_CFG_LOCKED`, `CFG_PREFIX_INVALID`, …) **no** está implementado aún (esperado: capa feature o extensión de manejo local).

---

## 6. Relación con el Motor de Códigos (FCE)

| Capa | API / paths |
|------|-------------|
| FCE Frontend | No llama `/api/v1/cfg/*` para administrar; opera en create/update de entidades ORG/INV |
| CFG Admin | Único consumidor previsto de los 6 operationIds de secuencias |

No hay service CFG hoy. Los services ORG/INV **no** deben usarse como proxy del admin.

---

## 7. Organización esperada de consumo (patrón AS-IS)

Por convención observada:

```text
src/features/cfg/
  types/cfg.types.ts          # tipos alineados a OpenAPI/contrato
  services/cfg.service.ts     # BASE = '/api/v1/cfg'
  hooks/*.hooks.ts            # React Query sobre el service
```

Sin inventar endpoints. Sin fetch directo desde páginas.

---

## 8. Resumen OpenAPI

| Pregunta | Respuesta |
|----------|-----------|
| ¿Hay codegen? | No |
| ¿Cómo tipar? | Types manuales (patrón actual) |
| ¿Snapshot CFG en repo? | No |
| ¿Contrato suficiente para diseño? | Sí |
| ¿Contrato suficiente para tipado cierre checklist J? | Requiere snapshot OpenAPI publicado/actualizado en repo |
| ¿Hay código FE consumiendo CFG? | No |
