# CFG — Page Specification (`SecuenciasPage`)

**Versión:** 1.0  
**Archivo:** `src/features/cfg/pages/SecuenciasPage.tsx`  
**Export:** `default function SecuenciasPage`  
**Waves:** stub W0 → list W3 → edit W4 → preview W5

---

## 1. Responsabilidad

Orquestar el listado Tier B y, desde W4/W5, dialogs de edición/preview y confirms de ciclo de vida. Única página del módulo.

---

## 2. Imports esperados (completos en W5)

| Origen | Símbolos |
|--------|----------|
| `@/core/auth/PermissionContext` | `usePermission` |
| `@/features/cfg/constants/cfg-permissions` | `CFG_PERMISSIONS` |
| `@/core/list` | `useDebouncedSearch` |
| hooks cfg | `useCfgSecuenciasErpList`, mutations lifecycle |
| components cfg | Edit, Preview, Badges |
| `@/shared/components/erp-list` | Toolbar, TableShell, Pagination, Search, SortableHeader |
| `@/features/inv/components/InvTableSkeleton` | (vía shell) |
| `@/shared/components/ui/ConfirmDialog` | ConfirmDialog |
| `@/features/org/components/OrgDiscardConfirmDialog` | discard |
| `@/features/org/utils/org-discard-handlers` | `createOrgDiscardHandlers` |
| `@/features/org/components/OrgPageLayout` o Inv equivalente | layout |
| `react-router-dom` | `Navigate` |
| lucide-react | Eye, Pencil, Ban, RotateCcw, icons preview |

**Prohibido:** `cfgSecuenciaService` directo; `@/core/codigo`; axios.

---

## 3. Estado interno

| Estado | Tipo conceptual | Wave |
|--------|-----------------|------|
| `moduloCodigo` | `string` (`''` = todos) | W3 |
| `esActivoFilter` | `'activas' \| 'inactivas' \| 'todas'` | W3 |
| `scopeType` | `'' \| CfgScopeType` | W3 |
| `useDebouncedSearch()` | input/debounced/hasSearch/clear | W3 |
| `editOpen` / `editId` | boolean / string\|null | W4 |
| `previewOpen` / `previewId` | boolean / string\|null | W5 |
| `previewInactiveHint` | boolean | W5 |
| `desactivarTarget` | `CfgSecuencia \| null` | W4 |
| `reactivarTarget` | `CfgSecuencia \| null` | W4 |
| `discardPending` | `CfgDiscardPending` | W4 |
| `previewDisabledIds` | `Set<string>` sesión UI | W5 |

Form state de edición: **dentro** de `CfgSecuenciaEditDialog` (no lifted), salvo que dirty handlers necesiten `isDirty` callback → Spec: dialog expone `onDirtyChange?: (dirty: boolean) => void` opcional; page usa discard handlers ORG.

---

## 4. Hooks consumidos

| Hook | Uso |
|------|-----|
| `usePermission` | `canConsultar`, `canActualizar` |
| `useDebouncedSearch` | buscar |
| `useCfgSecuenciasErpList` | data/pagination/sort/loading/error |
| `useDesactivarCfgSecuencia` | W4 confirm |
| `useReactivarCfgSecuencia` | W4 confirm |
| (Edit dialog interno) | detail + update |
| (Preview dialog interno) | preview mutation |

Mapper filtros → `baseFilters`:

- activas → `es_activo: true`
- inactivas → `es_activo: false`
- todas → omitir `es_activo`
- `modulo_codigo` / `scope_type` omitir si `''`

---

## 5. Query keys / invalidaciones (vía hooks)

Page no llama `invalidateQueries` directo excepto a través de mutations’ `onSuccess`.  
Discard no invalida.

---

## 6. Estados UI

| Estado | Comportamiento |
|--------|----------------|
| Loading list | `ErpListTableShell` skeleton |
| Error list | mensaje + Reintentar (`refetch`) |
| Empty sin filtros | “No hay secuencias” |
| Empty hasSearch/filtros | “Sin resultados para la búsqueda” |
| `discardPending` | toolbar/acciones disabled (B11-03) |
| Sin `consultar` | `<Navigate to="/unauthorized" />` |

---

## 7. Eventos y callbacks

| Evento UI | Acción |
|-----------|--------|
| Limpiar filtros | reset filters + search.clear + page 1 |
| Sort header | list hook `toggleSort` / API ErpList |
| Page/limit change | list hook |
| Click Ver/Editar | `editId=row.id`, `editOpen=true` (W4) |
| Click Preview | `previewId`, hint inactiva, `previewOpen=true` (W5) |
| Click Desactivar | cerrar edit → `desactivarTarget=row` (W4) |
| Click Reactivar | cerrar edit → `reactivarTarget=row` (W4) |
| Confirm desactivar | mutate DELETE → clear target |
| Confirm reactivar | mutate POST → clear target |
| Edit `onRequestPreview` | open preview con mismo id |
| Edit `onRequestDesactivar/Reactivar` | close edit → set target |
| Discard flow | `createOrgDiscardHandlers` |

---

## 8. ConfirmDialogs

| Dialog | variant | isOpen cuando | onConfirm |
|--------|---------|---------------|-----------|
| Desactivar | `danger` | `!!desactivarTarget && discardPending===null && !editOpen` | desactivar.mutate |
| Reactivar | `info` | análogo | reactivar.mutate |
| Discard | warning via OrgDiscard | `discardPending==='edit'` | discard close |

Copy: diseño funcional / contrato UI.

`loading` prop = mutation `isPending`.

---

## 9. Responsive / a11y

- Toolbar wrap; tabla `overflow-x-auto`.
- Icon buttons con `aria-label`.
- Confirms accesibles vía ConfirmDialog existente.
- Sin H1 body (TB-01).

---

## 10. DoD por madurez de página

| Wave | DoD SecuenciasPage |
|------|--------------------|
| W0 | Stub render + gate consultar |
| W3 | List completo RO, sin dialogs mutación |
| W4 | Edit + confirms + dirty |
| W5 | Preview wired + hardening |
