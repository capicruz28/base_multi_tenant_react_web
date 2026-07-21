# CFG Frontend — Alineación Contrato / Diseño / Blueprint / Spec

**Versión:** 1.0  
**Fecha:** 2026-07-18

---

## 1. Matriz de decisiones de producto (D1–D20)

| Decisión | Diseño | Implementación | Resultado |
|----------|--------|----------------|:---------:|
| D1 Shell `/app` | Sí | `app-route-tree` + feature routes | PASS |
| D2 Ruta `/app/cfg/secuencias` | Sí | Implementada | PASS |
| D3 Sin Create | Sí | Sin botón/UI Create | PASS |
| D4 Plantilla A/A+ Tier B | Sí | ErpList + forcePagination | PASS |
| D5/D5b Edit dialog + stay open | Sí | EditDialog post-PATCH abierto | PASS |
| D6 Preview dialog | Sí | PreviewDialog Wave 5 | PASS |
| D7 Tenant-first | Sí | Sin company gate | PASS |
| D8 Sin filtro `empresa_id` UI | Sí | Toolbar sin empresa | PASS |
| D9 RBAC dual | Sí | Guard + `CFG_PERMISSIONS` | PASS |
| D10 Soft DELETE + reactivar | Sí | Hooks + ConfirmDialogs | PASS |
| D11–D20 (errores, dirty, copy, etc.) | Sí | Utils + dialogs + page | PASS |

---

## 2. Contrato Backend — 6 operaciones

| operationId | Service | Hook / UI | Resultado |
|-------------|---------|-----------|:---------:|
| `list_cfg_codigo_secuencias` | `list` | `useCfgSecuenciasErpList` / page | PASS |
| `get_cfg_codigo_secuencia` | `getById` | `useCfgSecuencia` / Edit | PASS |
| `update_cfg_codigo_secuencia` | `update` | `useUpdateCfgSecuencia` / Edit | PASS |
| `desactivar_cfg_codigo_secuencia` | `desactivar` | hook + Confirm | PASS |
| `reactivar_cfg_codigo_secuencia` | `reactivar` | hook + Confirm | PASS |
| `preview_cfg_codigo_secuencia` | `preview` | `usePreviewCfgSecuencia` / Preview | PASS |

Reglas contractuales verificadas:

- PATCH solo formato (sin `es_activo` / contador / identidad).
- Preview sin body; no invalidación de list/detail.
- Errores `internal_code` mapeados en `cfg-error.utils.ts`.
- Sin `cliente_id` en Read UI/types de presentación.

---

## 3. Blueprint ↔ Spec ↔ Código

| Tema | Blueprint | Spec | Código | Notas |
|------|-----------|------|--------|-------|
| Query keys | Oficiales | Idénticas | Idénticas | PASS |
| Update cache | Prefería `setQueryData` | Oficial: invalidate | Invalidate | Spec gana; documentado en Spec 12 |
| Waves 0–5 | Plan | Plan archivo | Completo | PASS |
| Auth invalidate ×3 | W2 | W2.10 | 3 archivos | PASS |
| Preview no invalidate | Sí | Sí + test | Sí | PASS |

**Cambios de arquitectura respecto a docs:** ninguno material. Desviaciones operativas menores catalogadas como observaciones (toast Preview, filtro módulo).

---

## 4. Checklist contrato FE `07` A–J (certificación estática)

| Sección | Evaluación estática código/tests | Pendiente integración |
|---------|:--------------------------------:|------------------------|
| A RBAC | PASS (gates + readonly) | Smoke con roles reales |
| B Listado | PASS | Smoke filtros/sort |
| C Detalle | PASS (dialog) | — |
| D PATCH | PASS (payload dirty-only + tests) | — |
| E Lifecycle | PASS | Smoke list refresh |
| F Preview | PASS | — |
| G Errores | PASS (mapa utils) | 401 vía plataforma auth |
| H Cache | PASS | Cambio empresa smoke |
| I Fuera de alcance | PASS (no Create/align) | — |
| J OpenAPI | Tipado contrato + operationIds | Snapshot OpenAPI en repo (O-04) |

La sección J queda **parcialmente condicionada** a publicación/consumo de snapshot OpenAPI (watch Readiness W-01). No invalida la certificación FE tipada contra contrato documental.

---

## 5. Dictamen alineación

**PASS** — el código es una proyección fiel de la autoridad documental. Las diferencias Spec↔Blueprint en cache de update fueron resueltas a favor de Spec y son compatibles.
