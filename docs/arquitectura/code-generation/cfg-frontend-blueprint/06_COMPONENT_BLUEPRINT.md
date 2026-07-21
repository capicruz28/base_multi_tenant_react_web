# CFG — Component Blueprint

**Versión:** 1.0

---

## 1. Page

### `pages/SecuenciasPage.tsx`

**Responsabilidad:** orquestar listado + dialogs + confirms.

**Estado local típico:**

| Estado | Uso |
|--------|-----|
| filtros UI (`modulo_codigo`, `es_activo`, `scope_type`) | baseFilters list |
| `useDebouncedSearch` | buscar |
| `editId` / `editOpen` | Edit Dialog |
| `previewId` / `previewOpen` | Preview Dialog |
| `desactivarTarget` / `reactivarTarget` | ConfirmDialogs |
| `discardPending` | B11 dirty stack |
| form state edit | dentro del dialog o lifted |

**Composición:**

1. Page layout wrapper (Org/Inv style)
2. Gate `consultar` → unauthorized
3. `ErpListToolbar` + filtros + search + limpiar
4. `ErpListTableShell` + table + badges + row actions
5. `ErpPagination`
6. `CfgSecuenciaEditDialog`
7. `CfgSecuenciaPreviewDialog`
8. `ConfirmDialog` desactivar / reactivar
9. `OrgDiscardConfirmDialog`

**MUST NOT:** botón Crear; selector empresa; fetch Axios directo.

---

## 2. Components nuevos

### `CfgSecuenciaEditDialog`

| Prop conceptual | Tipo |
|-----------------|------|
| `open` | boolean |
| `secuenciaId` | string \| null |
| `onOpenChange` | (open) => void |
| `canUpdate` | boolean |
| `onRequestDesactivar` | (id) => void |
| `onRequestReactivar` | (id) => void |
| `onRequestPreview` | (id) => void |
| `onDiscardRequest` | handlers B11 |

Interno: `useCfgSecuencia`, `useUpdateCfgSecuencia`, dirty baseline, formato fields, badges, locked banner.

### `CfgSecuenciaPreviewDialog`

| Prop | Tipo |
|------|------|
| `open` | boolean |
| `secuenciaId` | string \| null |
| `onOpenChange` | … |
| `secuenciaInactivaHint` | boolean opcional desde fila |

Interno: `usePreviewCfgSecuencia` al abrir; muestra estimación + disclaimer.

### `CfgSecuenciaStatusBadges`

Props: `es_activo`, `config_locked`, `policy_drift`.

### `CfgLockedBanner`

Mensaje fijo locked.

### `CfgSecuenciaFormatoFields` (opcional)

Inputs controlados prefijo/separador/longitud/numero_inicial + field errors.

---

## 3. Componentes reutilizados (obligatorio)

Ver diseño funcional `09_COMPONENT_REUSE.md`. Checklist técnico:

- [ ] ErpList* stack
- [ ] InvTableSkeleton / IamTableEmptyState
- [ ] Dialog + DialogBody
- [ ] ConfirmDialog
- [ ] OrgDiscardConfirmDialog + createOrgDiscardHandlers
- [ ] FormSection / Label / Button
- [ ] getErrorMessage + toast pattern

---

## 4. Acciones de fila (implementación)

```text
if (row.es_activo) {
  Ver|Editar, Preview?, Desactivar?
} else {
  Ver, Preview?, Reactivar?
}
// guards: canUpdate, !config_locked, supports_preview
```

Una sola rama ternaria (RB-ROW-02).

---

## 5. Stack dialogs (guardrails UI)

1. Antes de Confirm desactivar/reactivar → `editOpen=false`.
2. Preview puede coexistir sobre Edit.
3. `discardPending` deshabilita toolbar (B11-03).
4. No Radix open + Confirm isOpen simultáneos (B11-10).

---

## 6. Tokens

- Estructura: Capa 1
- Guardar: `bg-brand-primary`
- Badges: semánticos success/error/warning/info

---

## 7. Accesibilidad mínima por componente

| Componente | Requisitos |
|------------|------------|
| Row icon buttons | `aria-label` |
| Edit Dialog | Title/Description |
| Preview | anunciar código estimado |
| Confirms | focus en acción primaria no destructiva por defecto (patrón ConfirmDialog existente) |
