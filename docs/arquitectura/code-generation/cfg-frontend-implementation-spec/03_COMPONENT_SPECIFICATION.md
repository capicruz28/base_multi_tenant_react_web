# CFG — Component Specification

**Versión:** 1.0

---

## 1. `CfgSecuenciaStatusBadges`

**Path:** `components/CfgSecuenciaStatusBadges.tsx`  
**Wave:** 3  
**Export:** named `CfgSecuenciaStatusBadges`

### Props

| Prop | Tipo | Req |
|------|------|-----|
| `es_activo` | `boolean` | Sí |
| `config_locked` | `boolean` | Sí |
| `policy_drift` | `boolean` | Sí |
| `className` | `string` | No |

### Estado interno

Ninguno.

### Render

- Activa / Inactiva (siempre uno)
- Bloqueada si `config_locked`
- Drift si `policy_drift` (+ Tooltip corto opcional)

### a11y

Texto en badge; no solo color.

### Tests

Render combinaciones locked+activa+drift.

---

## 2. `CfgLockedBanner`

**Path:** `components/CfgLockedBanner.tsx`  
**Wave:** 4  
**Export:** named

### Props

| Prop | Tipo |
|------|------|
| `className?` | string |

### Copy

“Esta secuencia está bloqueada y no se puede modificar.”

### Estado / hooks

Ninguno.

---

## 3. `CfgSecuenciaFormatoFields`

**Path:** `components/CfgSecuenciaFormatoFields.tsx`  
**Wave:** 4  
**Export:** named

### Props

| Prop | Tipo | Notas |
|------|------|-------|
| `value` | `CfgSecuenciaFormatoForm` | controlled |
| `onChange` | `(next) => void` | |
| `errors` | `CfgSecuenciaFieldErrors` | |
| `disabled` | `boolean` | readonly mode |
| `idPrefix` | `string` | a11y ids |

### Estado interno

Ninguno (controlled).

### Campos

- prefijo (uppercase visual onChange)
- separador select `'' | '-'`
- longitud_numero number
- numero_inicial number

### Imports

Label, iamInputClass/inputClass, FormSection opcional.

### Tests

onChange prefijo upper; disabled no edita; muestra errors.

---

## 4. `CfgSecuenciaEditDialog`

**Path:** `components/CfgSecuenciaEditDialog.tsx`  
**Wave:** 4  
**Export:** named

### Props

| Prop | Tipo | Req |
|------|------|-----|
| `open` | `boolean` | Sí |
| `secuenciaId` | `string \| null` | Sí |
| `onOpenChange` | `(open: boolean) => void` | Sí |
| `canUpdate` | `boolean` | Sí |
| `onRequestDesactivar` | `(id: string) => void` | Sí |
| `onRequestReactivar` | `(id: string) => void` | Sí |
| `onRequestPreview` | `(id: string) => void` | Sí |
| `onDirtyChange` | `(dirty: boolean) => void` | No |
| `discardHandlers` | object B11 compatible | No — o page maneja via dirty flag |

**Spec de integración dirty (oficial):**

- Dialog reporta `onDirtyChange`.
- Page usa `createOrgDiscardHandlers` con `isDirty` derivado.
- Al intentar cerrar con dirty: page setea `discardPending`; dialog recibe `onOpenChange(false)` solo tras discard confirm **después** de cerrar Radix (B11-11). Patrón: page cierra `editOpen` first then opens discard — igual ORG.

### Estado interno

| Estado | Origen |
|--------|--------|
| form formato | local, sync desde detail |
| baseline formato | snapshot on detail success |
| fieldErrors | local + mutation error parse |
| forceReadonlyLocked | si locked o 422 locked |

### Hooks

- `useCfgSecuencia(secuenciaId, { enabled: open && !!id })`
- `useUpdateCfgSecuencia`

### Loading / error

| Caso | UI |
|------|-----|
| `isLoading` detail | spinner en DialogBody |
| detail error 404 | toast/mensaje; `onOpenChange(false)` |
| `isPending` update | disable Guardar + form |

### Dirty

- Compare solo formato via dirty utils + `isDirtyAgainstBaseline` ORG
- ESC/overlay: prevent si dirty (orgDialogGuardProps pattern)

### Callbacks footer

| Botón | Condición | Acción |
|-------|-----------|--------|
| Preview | supports_preview && not in disabled set | `onRequestPreview(id)` |
| Desactivar | canUpdate && activa && !locked | `onRequestDesactivar` |
| Reactivar | canUpdate && !activa && !locked | `onRequestReactivar` |
| Cancelar | always | close flow |
| Guardar | canUpdate && !locked && dirty | validate → mutate PATCH |

Post-PATCH 200: merge response, reset baseline, **dialog permanece abierto** (D5b).

### Tests P1

- readonly sin canUpdate
- locked banner + no Guardar
- save llama update con payload dirty only
- request desactivar no llama DELETE dentro del dialog

---

## 5. `CfgSecuenciaPreviewDialog`

**Path:** `components/CfgSecuenciaPreviewDialog.tsx`  
**Wave:** 5  
**Export:** named

### Props

| Prop | Tipo | Req |
|------|------|-----|
| `open` | `boolean` | Sí |
| `secuenciaId` | `string \| null` | Sí |
| `onOpenChange` | `(open: boolean) => void` | Sí |
| `secuenciaInactivaHint` | `boolean` | No |
| `onPreviewNotAllowed` | `(id: string) => void` | No — page añade a disabled set |

### Estado interno

| Estado | Notas |
|--------|-------|
| result | data mutation success |
| localError | 422 message |

### Hooks

`usePreviewCfgSecuencia` — trigger `mutate(id)` en `useEffect` cuando `open && id` (o botón “Calcular” interno; **Spec oficial:** auto-fetch al abrir).

### Loading / success / error

- previewing → spinner
- 200 → codigo_estimado + disclaimer + consume text + optional inactive banner
- 422 PREVIEW_NOT_ALLOWED → message + `onPreviewNotAllowed`
- cerrar → clear result

### Invalidación

Ninguna (mutation hook garantiza).

### a11y

DialogTitle “Código estimado”; valor en elemento con texto legible.

### Tests

- muestra disclaimer
- no invalidate (a nivel hook)
- inactive hint visible

---

## 6. Componentes reutilizados (no especificar props propias)

ConfirmDialog, OrgDiscardConfirmDialog, ErpList*, Dialog*, Button, Label, FormSection, Tooltip — usar APIs existentes del repo.
