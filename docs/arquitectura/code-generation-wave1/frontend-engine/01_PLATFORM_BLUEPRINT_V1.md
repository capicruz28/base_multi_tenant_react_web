# Frontend Code Generation Engine — Platform Blueprint V1

**Versión:** 1.0.0  
**Estado:** **ESPECIFICACIÓN DEFINITIVA** — congelar antes de PR-UX-1  
**Fecha:** 2026-07-12  
**Nombre código:** `FCE` (Frontend Code Generation Engine)  
**Audiencia:** Frontend platform, arquitectura, leads módulo  
**Precedencia:** Contrato Backend > **este documento** > `frontend-ux/` > implementación módulo

---

## 1. Propósito

Definir la **plataforma Frontend** que implementa la UX del Motor de Códigos Backend para **todo el ERP**, durante 10+ años, con:

- Shell UI delgado (`CodigoField`)
- Motor headless testeable (`core/codigo/engine`)
- Registry central por `sequenceKey`
- Extensibilidad policies y adapters
- Cero acoplamiento a ORG o cualquier feature

**Este documento es la primera línea de implementación permitida.**

---

## 2. Principios arquitectónicos (FCE-P-*)

| ID | Principio | Descripción |
|----|-----------|-------------|
| **FCE-P-01** | **sequenceKey es identidad** | Toda entidad motor se referencia por `sequenceKey` Backend — no por módulo ni fieldKey sueltos |
| **FCE-P-02** | **Headless first** | Lógica en engine + controller; UI solo renderiza viewModel |
| **FCE-P-03** | **Registry, not scatter** | Manifests por módulo → merge en registry runtime |
| **FCE-P-04** | **Policy drives behavior** | UX derivada de `generation_policy` via PolicyResolver — nunca hardcode en pages |
| **FCE-P-05** | **Adapters at boundaries** | Preview, config remota, permisos → interfaces inyectables |
| **FCE-P-06** | **Shell público estable** | Exports congelados; features no importan engine internals |
| **FCE-P-07** | **EXTERNAL is not FCE** | Campos externos al motor nunca pasan por FCE |
| **FCE-P-08** | **Payload omit, not empty** | Auto → propiedad ausente en JSON |
| **FCE-P-09** | **Zero preview local** | FE nunca calcula correlativo |
| **FCE-P-10** | **Copy-first extensibility** | Nueva policy = nuevo profile + tests — no fork UI |

Alineado con Baseline V1 **P-01…P-10** donde aplica.

---

## 3. Arquitectura de capas

```
┌──────────────────────────────────────────────────────────────────────────┐
│  CAPA 0 — CONSUMO (features/*/pages)                                     │
│  • <CodigoField sequenceKey="…" mode="create" controller={…} />         │
│  • mergeCodigoIntoPayload(formPayload, controller.payloadSlice)          │
│  • Toast post-201 (feature — usa código del 201 response)                │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│  CAPA 1 — UI SHELL (shared/components/codigo/)                           │
│  CodigoField, AutoPanel, ManualSection, ReadOnly, WarningBanner          │
│  • Solo JSX + tokens Capa 1                                              │
│  • Recibe CodigoFieldViewModel — sin if (policy) complejos               │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│  CAPA 2 — CONTROLLER (core/codigo/hooks/)                                │
│  useCodigoFieldController                                                │
│  • Orquesta engine + adapters + React state                              │
│  • Expone viewModel + payloadSlice + dirtySnapshot                       │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│  CAPA 3 — ENGINE (core/codigo/engine/)                                  │
│  Registry │ PolicyResolver │ PayloadBuilder │ ErrorMapper                │
│  PermissionResolver │ StateMachine │ CopyResolver                        │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│  CAPA 4 — ADAPTERS (core/codigo/adapters/)                               │
│  PreviewAdapter │ ConfigAdapter │ (future TelemetryAdapter)              │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│  CAPA 5 — MANIFESTS (features/*/codigo/*.manifest.ts)                    │
│  Declaraciones estáticas registradas en app bootstrap                    │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  CAPA DI (opcional) — CodigoEngineProvider                               │
│  Inyecta adapters, flags tenant, override PermissionResolver               │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Estructura de archivos normativa

```
src/core/codigo/
├── index.ts                              # Shell público engine — exports congelados
├── engine/
│   ├── codigo-engine.types.ts            # Tipos canónicos FCE
│   ├── codigo-registry.ts                # Map sequenceKey → CodigoRegistryEntry
│   ├── codigo-registry.validation.ts     # Startup assert no duplicates
│   ├── policy-resolver.ts                # policy + mode → PolicyBehaviorProfile
│   ├── policy-profiles.ts                # Perfiles AUTO_DEFAULT, AUTO_REQUIRED, …
│   ├── payload-builder.ts                # build + merge payload
│   ├── error-mapper.ts                   # Axios → CodigoFieldError
│   ├── permission-resolver.ts            # RBAC + flags → allowManualOverride
│   ├── state-machine.ts                  # Transiciones formales
│   └── copy-resolver.ts                  # CTX-* messages
├── adapters/
│   ├── preview-adapter.types.ts
│   ├── preview-adapter.stub.ts           # PR-UX-1 default
│   ├── preview-adapter.http.ts           # Future — admin cfg API
│   ├── config-adapter.types.ts
│   └── config-adapter.stub.ts
├── hooks/
│   ├── useCodigoFieldController.ts       # Headless orchestrator
│   └── useCodigoRegistryEntry.ts         # sequenceKey lookup + assert
├── provider/
│   ├── CodigoEngineProvider.tsx          # DI opcional
│   └── codigo-engine.context.ts
├── integration/
│   ├── codigo-dirty.types.ts             # Snapshot para dirty guards
│   └── merge-codigo-payload.ts           # Helper form merge
└── __tests__/
    ├── policy-resolver.test.ts
    ├── payload-builder.test.ts
    ├── state-machine.test.ts
    └── registry.test.ts

src/shared/components/codigo/
├── index.ts                              # Shell público UI
├── CodigoField.tsx                       # Presenter principal
├── CodigoField.types.ts                  # ViewModel types (UI-only)
├── CodigoFieldAutoPanel.tsx
├── CodigoFieldManualSection.tsx
├── CodigoFieldReadOnly.tsx
├── CodigoFieldWarningBanner.tsx
└── __tests__/
    └── CodigoField.test.tsx

src/features/{modulo}/codigo/
└── {modulo}-codigo.manifest.ts           # Registro declarativo del módulo

src/app/bootstrap/
└── register-codigo-manifests.ts          # Invoca todos los manifests
```

---

## 5. Modelo de datos — tipos canónicos

### 5.1 Generation policies

```typescript
/** Alineado Backend SequenceCatalog — extensible */
export type CodigoGenerationPolicy =
  | 'AUTO_DEFAULT'
  | 'AUTO_REQUIRED'
  | 'MANUAL_ONLY';
  // Futuro: | 'AUTO_ON_APPROVAL' | 'IMPORT_ONLY'

/** EXTERNAL — explícitamente excluido del FCE */
export type CodigoExternalFieldPolicy = 'EXTERNAL';
```

### 5.2 Registry entry (manifest)

```typescript
export interface CodigoRegistryEntry {
  /** Clave Backend — PRIMARY KEY FCE */
  sequenceKey: string;

  /** Módulo dueño declarativo — ej. 'org', 'inv' */
  moduleCode: string;

  /** Nombre entidad lógica — ej. 'sucursal' */
  entityKey: string;

  /** Campo JSON API — ej. 'codigo' | 'codigo_empresa' */
  fieldKey: string;

  /** Policy congelada — MUST match Backend catalog */
  policy: CodigoGenerationPolicy;

  /** Metadata UX / copy — no binding numérico */
  meta: {
    prefixHint?: string;
    exampleFormat?: string;
    scopeLabel?: 'tenant' | 'empresa';
    entityLabel?: string;           // "Sucursal" — toast post-201
    maxLength?: number;             // default 20
  };

  /** Overrides opcionales por tenant — future ConfigAdapter */
  overrides?: Partial<Pick<CodigoRegistryEntry, 'meta'>>;
}
```

### 5.3 Controller state (formal)

```typescript
export type CodigoUiPhase =
  | 'idle'
  | 'auto'
  | 'manual'
  | 'loading'      // preview/config fetch
  | 'readonly'
  | 'disabled';

export type CodigoSubmitPhase =
  | 'idle'
  | 'saving'
  | 'success'      // optional flash
  | 'error';

export interface CodigoFieldControllerState {
  uiPhase: CodigoUiPhase;
  submitPhase: CodigoSubmitPhase;
  assignmentMode: 'auto' | 'manual';   // AUTO_DEFAULT only
  value: string;
  error: string | null;
  previewEstimate: string | null;
  allowManualOverride: boolean;
  isManualSectionExpanded: boolean;
}
```

### 5.4 ViewModel (UI shell)

```typescript
/** UI recibe esto — sin lógica policy */
export interface CodigoFieldViewModel {
  label: string;
  fieldKey: string;
  showAutoPanel: boolean;
  showManualSection: boolean;
  showManualToggleLink: boolean;
  showReadOnly: boolean;
  showEditableInput: boolean;
  showWarningBanner: boolean;
  autoPanelCopy: { title: string; description: string; hint?: string };
  manualToggleLabel: string;
  revertToAutoLabel: string;
  warningCopy?: string;
  value: string;
  error: string | null;
  disabled: boolean;
  required: boolean;
  inputProps: { id: string; maxLength: number; className: string };
}
```

---

## 6. Componentes del Engine — responsabilidades

### 6.1 Registry (`codigo-registry.ts`)

| Función | Descripción |
|---------|-------------|
| `registerCodigoManifest(moduleCode, entries[])` | Merge idempotente |
| `getCodigoEntry(sequenceKey)` | Lookup — throw si missing en dev |
| `listCodigoEntriesByModule(moduleCode)` | Introspección / tests |
| `assertRegistryValid()` | Duplicados, fieldKey vacío, policy unknown |

**Bootstrap:** `register-codigo-manifests.ts` llama todos los manifests **antes** de render app.

### 6.2 PolicyResolver

```typescript
resolvePolicyBehavior(entry: CodigoRegistryEntry, mode: CodigoFieldMode): PolicyBehaviorProfile;
```

| Policy | CREATE profile | UPDATE profile |
|--------|----------------|----------------|
| AUTO_DEFAULT | auto panel; manual optional | editable + warning |
| AUTO_REQUIRED | locked panel | readonly |
| MANUAL_ONLY | manual required | manual required |

**Extensión futura:** `registerPolicyProfile(policy, profile)` — plugin registry.

### 6.3 PayloadBuilder

```typescript
buildCodigoPayloadSlice(state, entry, mode): { fieldKey: string; value: string | undefined };
mergeCodigoIntoPayload<T>(payload: T, slice): T;  // omit key if undefined
```

Compatible 100% con PR-1 congelado.

### 6.4 ErrorMapper

```typescript
mapCodigoFieldError(error: unknown, fieldKey: string): CodigoFieldError | null;
```

| HTTP | Resultado |
|------|-----------|
| 409 + detail código | `{ fieldKey, message }` |
| 400 formato | idem |
| 404 cfg | `{ type: 'technical', message }` — toast, no inline |
| Otros | `null` — delegar getErrorMessage |

### 6.5 PermissionResolver

```typescript
resolveAllowManualOverride(ctx: {
  policy: CodigoGenerationPolicy;
  permissions: PermissionApi;  // usePermissions adapter
  tenantFlags?: CodigoTenantFlags;
}): boolean;
```

| Input | Default |
|-------|---------|
| AUTO_DEFAULT + operativo | `false` |
| AUTO_DEFAULT + admin/implantación | `true` |
| Flag `CODIGO_MANUAL_OVERRIDE` | `true` |
| AUTO_REQUIRED / MANUAL_ONLY | N/A / always manual |

### 6.6 StateMachine

Transiciones explícitas — tabla testeada:

| From | Event | To | Side effect |
|------|-------|-----|-------------|
| idle | INIT_CREATE_AUTO | auto | — |
| auto | EXPAND_MANUAL | manual | expand section |
| manual | REVERT_AUTO | auto | clear value |
| auto | PREVIEW_START | loading | — |
| loading | PREVIEW_OK | auto | set previewEstimate |
| * | SET_ERROR | error | set error message |
| * | PARENT_SAVING | disabled | — |
| * | PARENT_DISABLED | disabled | — |

### 6.7 CopyResolver

Centraliza CTX-01…CTX-07 de `frontend-ux/03`.  
Soporta interpolación `{entityLabel}`, `{exampleFormat}`, `{previewEstimate}`.

---

## 7. Adapters

### 7.1 PreviewAdapter (interface)

```typescript
interface CodigoPreviewAdapter {
  /** Returns estimated next code — non-binding */
  fetchPreview(params: {
    sequenceKey: string;
    scopeContext: CodigoScopeContext;  // tenantId, empresaId
  }): Promise<string | null>;
}
```

| Implementación | Cuándo |
|----------------|--------|
| `preview-adapter.stub.ts` | PR-UX-1 — retorna null |
| `preview-adapter.http.ts` | Cuando exista admin cfg API |

Hook: `useCodigoPreview(sequenceKey, enabled)` — React Query, staleTime 30s.

### 7.2 ConfigAdapter (future)

```typescript
interface CodigoConfigAdapter {
  fetchSequenceMeta(sequenceKey: string): Promise<Partial<CodigoRegistryEntry['meta']>>;
}
```

Permite prefijos dinámicos sin redeploy FE.

---

## 8. CodigoEngineProvider (DI opcional)

```typescript
interface CodigoEngineContextValue {
  previewAdapter: CodigoPreviewAdapter;
  configAdapter: CodigoConfigAdapter;
  permissionResolver?: PermissionResolverFn;
  tenantFlags?: CodigoTenantFlags;
}
```

| Aspecto | Sin Provider | Con Provider |
|---------|--------------|--------------|
| PR-UX-1 | Defaults stub | Recomendado |
| Preview real | No | Sí |
| Tests | Inject mock adapter | Inject mock adapter |

**Ubicación árbol app:** sibling bajo `PermissionProvider` — **no** dentro Auth compositor L9.

```
PermissionProvider
  └ CodigoEngineProvider   ← nuevo, opcional PR-UX-1
      └ App routes
```

---

## 9. useCodigoFieldController — API headless

```typescript
function useCodigoFieldController(options: {
  sequenceKey: string;
  mode: CodigoFieldMode;
  initialValue?: string;
  disabled?: boolean;
  saving?: boolean;
  externalError?: string | null;
}): {
  viewModel: CodigoFieldViewModel;
  state: CodigoFieldControllerState;
  actions: {
    setValue: (v: string) => void;
    expandManual: () => void;
    revertToAuto: () => void;
    clearError: () => void;
  };
  payloadSlice: { fieldKey: string; value: string | undefined };
  dirtySnapshot: CodigoDirtySnapshot;
  applyAssignedCode: (code: string) => void;  // post-201 optional
};
```

**Pages NO calculan policy ni payload** — solo merge payloadSlice.

---

## 10. CodigoField — responsabilidades UI (delgado)

```typescript
interface CodigoFieldProps {
  sequenceKey: string;
  mode: CodigoFieldMode;
  controller: ReturnType<typeof useCodigoFieldController>;
  /** Override label — rare */
  label?: string;
  className?: string;
}
```

| Hace | No hace |
|------|---------|
| Render subcomponentes según viewModel | Resolver policy |
| Forward a11y id/htmlFor | Fetch preview |
| Aplicar tokens Tailwind Capa 1 | Build payload |
| Emitir eventos UI a controller.actions | RBAC |

**LOC objetivo:** < 80 presenter + subcomponentes.

---

## 11. Matriz UX por policy (vigente — sin cambio semántico)

Referencia normativa completa: `frontend-ux/01_POLICY_UX_MATRIX.md`.

Blueprint **implementa** esa matriz via PolicyResolver + viewModel — no redefine UX.

| Policy | CREATE default UI | Manual toggle | UPDATE |
|--------|-------------------|---------------|--------|
| AUTO_DEFAULT | AutoPanel | Colapsado + gated | Input + warning |
| AUTO_REQUIRED | Locked panel | ❌ | Readonly |
| MANUAL_ONLY | Input required | N/A | Input required |
| EXTERNAL | **No FCE** | — | — |

---

## 12. Estados UI — especificación completa

| Estado compuesto | uiPhase | submitPhase | Presentación |
|------------------|---------|-------------|--------------|
| Inicial CREATE auto | auto | idle | AutoPanel |
| Manual expandido | manual | idle | AutoPanel hidden + Input |
| Cargando preview | loading | idle | AutoPanel + skeleton hint |
| Enviando form | * | saving | disabled total |
| Error campo | * | error | error inline |
| Post-201 flash | readonly | success | badge opcional 2s |
| READ detalle | readonly | idle | ReadOnly |
| UPDATE editable | auto/manual | idle | Input + warning si dirty |
| Disabled global | disabled | * | Opacity + no interaction |

---

## 13. Manifests por módulo — patrón escalable

### 13.1 ORG (referencia — no implementar aquí)

```typescript
// src/features/org/codigo/org-codigo.manifest.ts
export const ORG_CODIGO_MANIFEST: CodigoRegistryEntry[] = [
  {
    sequenceKey: 'org_empresa',
    moduleCode: 'org',
    entityKey: 'empresa',
    fieldKey: 'codigo_empresa',
    policy: 'AUTO_DEFAULT',
    meta: { prefixHint: 'EMP', exampleFormat: 'EMP002', scopeLabel: 'tenant', entityLabel: 'Empresa' },
  },
  // org_sucursal, org_departamento, org_centro_costo, org_cargo
];

export function registerOrgCodigoManifest(): void {
  registerCodigoManifest('org', ORG_CODIGO_MANIFEST);
}
```

### 13.2 INV (futuro)

Mismo patrón — `inv_producto`, `inv_almacen`, etc.

### 13.3 Bootstrap

```typescript
// src/app/bootstrap/register-codigo-manifests.ts
export function registerAllCodigoManifests(): void {
  registerOrgCodigoManifest();
  // registerInvCodigoManifest(); — future
  assertRegistryValid();
}
```

Invocado en `main.tsx` o `AppProviders` **una vez**.

---

## 14. Superficie pública congelada (FCE-API-1)

### 14.1 Consumidor feature (permitido)

```typescript
import { CodigoField } from '@/shared/components/codigo';
import {
  useCodigoFieldController,
  mergeCodigoIntoPayload,
  mapCodigoFieldError,
} from '@/core/codigo';
```

### 14.2 Consumidor feature (prohibido)

```typescript
import { codigoRegistry } from '@/core/codigo/engine/codigo-registry';  // internal
import { resolvePolicyBehavior } from '@/core/codigo/engine/policy-resolver';  // internal
```

### 14.3 Export manifest (módulo)

```typescript
import { registerOrgCodigoManifest } from '@/features/org/codigo/org-codigo.manifest';
```

---

## 15. Integración formulario — patrón canónico

```typescript
// En página CREATE — pseudocódigo normativo
const codigo = useCodigoFieldController({
  sequenceKey: 'org_sucursal',
  mode: 'create',
  saving: createMutation.isPending,
});

const handleCreate = async () => {
  let payload = assertBodyEmpresaMatchesSession({ ...form }, scopeEmpresaId);
  payload = mergeCodigoIntoPayload(payload, codigo.payloadSlice);

  try {
    const created = await createSucursal.mutateAsync(payload);
    toast.success(formatCodigoSuccessCopy('org_sucursal', created.codigo));
    closeCreate();
  } catch (err) {
    const fieldErr = mapCodigoFieldError(err, codigo.payloadSlice.fieldKey);
    if (fieldErr) codigo.actions.setExternalError(fieldErr.message);
    // toast: hook onError — ER-02
  }
};

// JSX
<CodigoField sequenceKey="org_sucursal" mode="create" controller={codigo} />
```

---

## 16. Dirty forms — integración

```typescript
export interface CodigoDirtySnapshot {
  assignmentMode: 'auto' | 'manual';
  value: string;
}

// features/org/utils/form-dirty/* — ORG compone snapshot
function isCreateSucursalDirty(form, codigoSnapshot: CodigoDirtySnapshot): boolean {
  return isCreateSucursalDirtyLegacy(form) || !codigoSnapshotsEqual(codigoSnapshot, BASELINE);
}
```

**Engine define tipo; feature compone** — no acoplar dirty ORG dentro core.

---

## 17. Testing strategy

| Capa | Tipo | Cobertura objetivo |
|------|------|-------------------|
| engine/* | Unit puro | 95%+ |
| useCodigoFieldController | RTL hook tests | Ramas policy × mode |
| CodigoField | RTL snapshot + a11y | ViewModels |
| Registry bootstrap | Integration | No duplicate keys |
| E2E | Playwright optional | ORG CREATE auto smoke |

**Contract test:** cada manifest entry MUST match Backend sequence catalog snapshot (future CI gate).

---

## 18. Extensibilidad 10 años

| Escenario | Mecanismo |
|-----------|-----------|
| Nueva policy Backend | `policy-profiles.ts` + PolicyResolver plugin |
| Preview API v2 | Nuevo PreviewAdapter — Provider swap |
| i18n | CopyResolver → i18n keys |
| Mobile compact UI | Mismo controller, presenter alternativo |
| UPDATE read-only BR-M-30 | PolicyProfile flag `updateReadOnly: true` |
| Import CSV masivo | Flujo separado — bypass FCE modal |
| OpenAPI codegen meta | ConfigAdapter genera manifests |

---

## 19. PR-UX-1 revisado — plan implementación

### Fase E-1 — Engine core (sin UI)

| # | Entregable |
|---|------------|
| E-1.1 | Types + Registry + validation |
| E-1.2 | PolicyResolver + profiles |
| E-1.3 | PayloadBuilder + merge |
| E-1.4 | ErrorMapper |
| E-1.5 | StateMachine |
| E-1.6 | CopyResolver |
| E-1.7 | Unit tests engine |

### Fase E-2 — Controller + adapters stub

| # | Entregable |
|---|------------|
| E-2.1 | PreviewAdapter stub |
| E-2.2 | PermissionResolver default |
| E-2.3 | useCodigoFieldController |
| E-2.4 | Hook tests |

### Fase E-3 — UI shell

| # | Entregable |
|---|------------|
| E-3.1 | CodigoField + subcomponentes |
| E-3.2 | Component tests |

### Fase E-4 — Bootstrap + ORG manifest (sin tocar pages aún)

| # | Entregable |
|---|------------|
| E-4.1 | org-codigo.manifest.ts |
| E-4.2 | register-codigo-manifests.ts |

### Fase E-5 — ORG pages (PR-UX-2)

Integrar controller + CodigoField en 5 CREATE — reemplaza PR-UX-2 original.

**CodigoEngineProvider:** E-2 o E-3 — optional first iteration.

---

## 20. Criterios de aceptación Blueprint V1

- [ ] `core/codigo` zero imports from `features/`
- [ ] Pages usan `sequenceKey` — no pasan policy/fieldKey sueltos
- [ ] CodigoField < 100 LOC presenter
- [ ] Engine unit tests green
- [ ] Registry valida duplicados at bootstrap
- [ ] Payload PR-1 compatible
- [ ] UX matrix AUTO_DEFAULT sin textbox default
- [ ] EXTERNAL documentado — no FCE
- [ ] Shell exports documentados §14
- [ ] ORG manifest 5 entries — pages en fase posterior

---

## 21. Relación documental

| Documento | Rol |
|-----------|-----|
| **Este Blueprint V1** | Autoridad implementación |
| `frontend-engine/00_ARCHITECTURE_AUDIT.md` | Justificación upgrade |
| `frontend-ux/01_POLICY_UX_MATRIX.md` | Norma UX — vigente |
| `frontend-ux/03_ERP_CONSISTENCY_GUIDELINES.md` | Cross-módulo — vigente |
| `frontend-ux/02_CODIGO_FIELD_SPEC.md` | Supersedido API — referencia histórica |
| `frontend-alignment/*` | Capa técnica PR-1 |

---

## 22. Glosario

| Término | Definición |
|---------|------------|
| **FCE** | Frontend Code Generation Engine |
| **sequenceKey** | ID Backend en SequenceCatalog |
| **Manifest** | Lista declarative CodigoRegistryEntry por módulo |
| **payloadSlice** | `{ fieldKey, value \| undefined }` listo para merge |
| **viewModel** | Proyección UI sin lógica de negocio |
| **EXTERNAL** | Campo fuera del motor — no FCE |

---

## 23. Firma de congelamiento

**Blueprint V1.0.0** queda **CONGELADO** para iniciar PR-UX-1 (Fase E-1).  
Cambios breaking requieren **FCE-API-2** + migration guide.

---

*Auditoría: [`00_ARCHITECTURE_AUDIT.md`](00_ARCHITECTURE_AUDIT.md)*
