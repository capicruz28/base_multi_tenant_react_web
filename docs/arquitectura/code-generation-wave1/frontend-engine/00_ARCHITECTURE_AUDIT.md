# Auditoría arquitectónica — Frontend Code Generation Engine

**Etapa:** Revisión pre-implementación PR-UX-1  
**Fecha:** 2026-07-12  
**Estado:** **AUDITORÍA CERRADA** — upgrade arquitectónico requerido  
**Alcance:** Plataforma completa — no ORG, no CodigoField aislado  
**Documento complementario:** [`01_PLATFORM_BLUEPRINT_V1.md`](01_PLATFORM_BLUEPRINT_V1.md) (especificación definitiva)

---

## 1. Veredicto ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿La propuesta UX actual (`frontend-ux/`) es correcta en **intención**? | **Sí** — AUTO_DEFAULT sin textbox default, manual colapsado, copy unificado |
| ¿Es suficiente como **arquitectura de plataforma** 5–10 años? | **No** — riesgo medio-alto de fragmentación y fat component |
| ¿Recomendación? | Adoptar **Frontend Code Generation Engine** (Blueprint V1) antes de PR-UX-1 |
| ¿CodigoField sigue existiendo? | **Sí** — como **shell UI delgado**, no como contenedor de lógica |
| ¿Nivel Enterprise? | Propuesta UX: **MVP sólido**. Blueprint V1: **Enterprise-ready** |

---

## 2. Evaluación de la propuesta actual (`frontend-ux/`)

### 2.1 Fortalezas

| # | Fortaleza |
|---|-----------|
| F-01 | Policy-driven UX alineada con Backend |
| F-02 | Separación conceptual UI vs payload (`buildCodigoPayloadValue`) |
| F-03 | Prohibición EXTERNAL en CodigoField — evita confusión RUC/código |
| F-04 | Copy CTX-* centralizado — base i18n |
| F-05 | Compatibilidad PR-1 congelado |
| F-06 | Plan rollout incremental ORG → resto ERP |

### 2.2 Debilidades estructurales (críticas)

| ID | Debilidad | Impacto 5–10 años |
|----|-----------|---------------------|
| W-01 | **CodigoField como “god component”** — policy, mode, assignment, payload, permissions, preview en props | Cada módulo repite wiring; API props inestable |
| W-02 | **Config solo por módulo** sin registry runtime unificado | 20+ archivos config divergentes; sin validación cruzada |
| W-03 | **Lógica en UI** — state machine implícita dentro del componente | Imposible testear motor sin DOM; duplicación headless |
| W-04 | **Sin `sequenceKey` como identidad primaria** en API pública | Pages acoplan meta ORG/INV manualmente |
| W-05 | **Preview como prop** (`estimatedNextCode`) vs adapter | Cada página fetch preview ad hoc cuando exista API |
| W-06 | **Permisos inline** (`allowManualOverride` por página) | Inconsistencia RBAC cross-módulo |
| W-07 | **Sin Provider / bootstrap** de manifests | Registro módulo ad hoc; orden carga impredecible |
| W-08 | **Estados UI incompletos** — diagrama simplificado sin loading/error/saving | Race conditions preview; UX inconsistente submit |
| W-09 | **Error mapper aislado** — sin estrategia unificada 409/400/404 | Duplicación catch en 50+ formularios |
| W-10 | **Sin extensión formal de policies futuras** | Refactor breaking al añadir policy #5 |

### 2.3 Veredicto por capa (propuesta actual)

| Capa | Ubicación propuesta | Veredicto |
|------|---------------------|-----------|
| UI | `shared/components/codigo/` | ✅ Correcta ubicación — **pero debe ser más delgada** |
| Lógica | Mezclada UI + `core/codigo/*.utils.ts` | ⚠ Insuficiente — falta **engine** |
| Config | `features/*/config/codigo-field.config.ts` | ⚠ Parcial — falta **registry central** |
| Integración | Páginas llaman utils directamente | ⚠ No escala — falta **controller headless** |

---

## 3. Análisis de los 15 puntos obligatorios

### 3.1 Separación UI / lógica / configuración

| Capa | Propuesta actual | Evaluación | Blueprint V1 |
|------|------------------|------------|--------------|
| **UI** | CodigoField + subcomponentes | Mezcla lógica | Presenter puro + viewModel |
| **Lógica** | utils sueltos + props | Fragmentada | `core/codigo/engine/*` + `useCodigoFieldController` |
| **Config** | JSON por módulo | Estática local | Manifests módulo + **Registry** runtime |

**Conclusión:** Separación **débil** hoy. Blueprint impone **3 capas estrictas** + manifests.

---

### 3.2 Responsabilidades de CodigoField

| Responsabilidad | ¿Debe estar en CodigoField? | Dónde va |
|-----------------|----------------------------|----------|
| Render panel auto / manual / readonly | **Sí** | CodigoField |
| Máquina de estados | **No** | `useCodigoFieldController` |
| Resolver policy | **No** | `PolicyResolver` |
| Construir payload | **No** | `PayloadBuilder` |
| Resolver permisos manual | **No** | `PermissionResolver` |
| Fetch preview | **No** | `PreviewAdapter` + hook |
| Mapear errores HTTP | **No** | `ErrorMapper` |
| Aplicar tokens diseño | **Sí** | CodigoField |
| i18n copy | **Sí** (via copy resolver) | `CopyResolver` consumido por UI |

**Conclusión:** Propuesta actual **sobrecarga** CodigoField. Debe reducirse a **~100–150 LOC presenter**.

---

### 3.3 Exceso de lógica en el componente

**Sí — riesgo alto** en spec actual:

- 15+ props incluyendo `assignmentMode`, `onPayloadValueChange`, `allowManualOverride`, `estimatedNextCode`
- State machine en diagrama pero sin módulo testeable
- Integración dirty embebida en hook opcional acoplado al componente

**Remediación:** patrón **Headless UI** (TanStack/Radix style): controller hook + dumb component.

---

### 3.4 Necesidad de Código Engine Frontend

| Pieza | ¿Necesaria? | Prioridad PR-UX-1 |
|-------|-------------|-------------------|
| **Registry** | **Sí** | P0 |
| **PolicyResolver** | **Sí** | P0 |
| **PayloadBuilder** | **Sí** | P0 (exists as util — promote) |
| **ErrorMapper** | **Sí** | P0 |
| **PermissionResolver** | **Sí** | P1 |
| **StateMachine** | **Sí** | P0 |
| **PreviewAdapter** (interface + stub) | **Sí** | P1 (stub OK) |
| **ConfigAdapter** (future API cfg) | **Sí** | P2 stub |
| **Provider** | **Recomendado** | P1 |
| **CopyResolver** | **Sí** | P0 |

**Conclusión:** No basta con componente + 3 utils. Se requiere **motor de plataforma** mínimo.

---

### 3.5 Config por módulo vs Registry central

| Enfoque | Pros | Contras |
|---------|------|---------|
| Solo config módulo | Simple ORG | Sin single source of truth; duplicate sequenceKey; no startup validation |
| Solo registry central | Una verdad | Archivo gigante; conflictos git cross-equipos |
| **Híbrido (recomendado)** | Manifests por módulo + merge en Registry | Requiere bootstrap — patrón ERP estándar |

**Decisión Blueprint V1:**

```
features/org/codigo/org-codigo.manifest.ts   → registerOrgCodigoEntries()
features/inv/codigo/inv-codigo.manifest.ts     → registerInvCodigoEntries()
core/codigo/engine/codigo-registry.ts        → Map<sequenceKey, CodigoEntry>
app/bootstrap/register-codigo-manifests.ts   → invoca todos al arranque
```

Pages consumen: `sequenceKey="org_sucursal"` — **no importan config ORG**.

---

### 3.6 Estados internos necesarios

| Estado | Descripción | Propuesta actual | Blueprint |
|--------|-------------|------------------|-----------|
| `idle` | Inicial antes de hydrate | Implícito | Explícito |
| `auto` | CREATE sin manual | Parcial | Explícito |
| `manual` | Override activo | Parcial | Explícito |
| `loading` | Preview/config fetch | **Ausente** | Explícito |
| `saving` | Parent submitting | disabled prop | `saving` + disabled |
| `success` | Post-201 (opcional inline) | **Ausente** | Opcional flash |
| `error` | Inline field error | error prop | `error` + mapper |
| `readonly` | READ / AUTO_REQUIRED UPDATE | mode=read | Explícito |
| `disabled` | Form/global lock | disabled prop | Composición |

**Máquina formal** en `core/codigo/engine/state-machine.ts` — testeable sin React.

---

### 3.7 Preparación APIs configuración secuencias

| Capacidad | Propuesta actual | Blueprint |
|-----------|------------------|-----------|
| Preview próximo código | Prop opcional | `PreviewAdapter.preview(sequenceKey, scope)` |
| Cache | Ninguna | React Query en adapter |
| Fallback | N/A | Stub no-op — panel sin número |
| cfg admin read | Ninguna | `ConfigAdapter.getSequenceMeta()` — future |
| Invalidación | N/A | Al cambiar empresa sesión (ME-03 pattern) |

**Interface-first:** adapter inyectable en Provider; stub en PR-UX-1.

---

### 3.8 Policies actuales y futuras

| Policy | Soporte actual | Extensibilidad |
|--------|----------------|----------------|
| AUTO_DEFAULT | ✅ UX completa | OK si PolicyResolver strategy pattern |
| AUTO_REQUIRED | ✅ UX definida | OK |
| MANUAL_ONLY | ✅ | OK |
| EXTERNAL | ✅ excluded | OK |
| **Futuras** (ej. AUTO_ON_APPROVAL) | ❌ | Requiere registry version + resolver plugin |

**Patrón:** `PolicyBehaviorProfile` por policy — open/closed principle.

```typescript
interface PolicyBehaviorProfile {
  allowsManualOnCreate: boolean;
  defaultAssignmentMode: CodigoAssignmentMode;
  createPresentation: 'auto_panel' | 'manual_input' | 'locked_panel';
  updatePresentation: 'editable' | 'readonly';
}
```

---

### 3.9 Acoplamientos ocultos con ORG

| Acoplamiento | Riesgo | Mitigación Blueprint |
|--------------|--------|----------------------|
| `ORG_CODIGO_CONFIG` importado en pages | Medio | `sequenceKey` only |
| Copy menciona EMP002/SUC001 | Bajo | CopyResolver + entry meta |
| `useOrgModalCreateDirty` | Medio | `CodigoDirtySnapshot` interface genérica |
| form-dirty ORG paths | Medio | Adapter en features/org — no en core |
| Onboarding EmpresaPage | Bajo | sequenceKey `org_empresa` — sin special case en engine |

**Regla:** `core/codigo` **MUST NOT** import `@/features/org/*`.

---

### 3.10 Riesgos mantenimiento 5–10 años

| Horizonte | Riesgo | Probabilidad | Mitigación |
|-----------|--------|--------------|------------|
| 5 años | 30 módulos × wiring props distinto | Alta | Registry + sequenceKey API |
| 5 años | Preview API cambia contrato | Media | Adapter versionado |
| 5 años | Nueva policy Backend | Media | PolicyResolver plugins |
| 10 años | CodigoField legacy forks | Alta | Single presenter + engine version |
| 10 años | i18n multi-idioma | Alta | CopyResolver desde día 1 |
| 10 años | Mobile / embedded forms | Media | Headless controller reutilizable |

---

### 3.11 Superficie pública del framework

**Propuesta actual (inestable):**

```typescript
import { CodigoField, buildCodigoPayloadValue } from '...';
// + 15 props manuales por página
```

**Blueprint V1 (estable — shell público Baseline P-01):**

```typescript
// Consumidor estándar (95% casos)
import { CodigoField } from '@/shared/components/codigo';

<CodigoField
  sequenceKey="org_sucursal"
  mode="create"
  controller={controller}  // from useCodigoFieldController
/>

// Integración formulario
import { useCodigoFieldController, mergeCodigoIntoPayload } from '@/core/codigo';

// Registro módulo (bootstrap)
import { registerCodigoManifest } from '@/core/codigo';
```

**Exports congelados** en `core/codigo/index.ts` + `shared/components/codigo/index.ts`.

---

### 3.12 core/ vs shared/ vs features/

| Artefacto | Capa | Razón |
|-----------|------|-------|
| Registry, resolvers, state machine, payload builder | **core/codigo/engine** | Lógica pura — sin JSX |
| PreviewAdapter, ConfigAdapter | **core/codigo/adapters** | IO boundaries |
| useCodigoFieldController | **core/codigo/hooks** | Headless React |
| CodigoEngineProvider | **core/codigo/provider** | DI opcional |
| CodigoField, subcomponentes | **shared/components/codigo** | UI tokens Capa 1 |
| org-codigo.manifest.ts | **features/org/codigo** | Declaración dominio |
| merge en handleCreate | **features/*/pages** | Orquestación form — mínima |

**Prohibido:** engine en shared; UI con lógica policy en features.

---

### 3.13 Evitar duplicación con decenas de módulos

| Anti-duplicación | Mecanismo |
|------------------|-----------|
| Lookup entidad | Registry por `sequenceKey` |
| UX policy | PolicyResolver |
| Payload | PayloadBuilder.merge() |
| Errores | ErrorMapper.toFieldError() |
| Permisos manual | PermissionResolver |
| Preview | PreviewAdapter singleton |
| Copy | CopyResolver |
| Tests | Engine unit tests una vez; UI snapshot tests |

**Cada módulo nuevo:** 1 manifest file + `<CodigoField sequenceKey="..." />` — **~30 LOC**.

---

### 3.14 Infraestructura vs componentes visuales

| Infraestructura (core) | Visual (shared) |
|------------------------|-----------------|
| codigo-registry.ts | CodigoField.tsx |
| policy-resolver.ts | CodigoFieldAutoPanel.tsx |
| payload-builder.ts | CodigoFieldManualSection.tsx |
| error-mapper.ts | CodigoFieldReadOnly.tsx |
| permission-resolver.ts | — |
| state-machine.ts | — |
| preview-adapter.* | — |
| useCodigoFieldController | — |

**Regla:** Si no tiene JSX y sobrevive sin React → **core**. Si renderiza → **shared**.

---

### 3.15 ¿Nivel Enterprise?

| Criterio Enterprise | Propuesta UX | Blueprint V1 |
|---------------------|--------------|--------------|
| Separación concerns | Parcial | ✅ |
| Shell público estable (P-01) | No definido | ✅ |
| Extensibilidad policies | Limitada | ✅ |
| Testabilidad sin DOM | Baja | ✅ engine tests |
| Multi-módulo 20+ | Riesgo medio | ✅ registry |
| Adapter boundaries IO | No | ✅ |
| Zero feature delta refactor | N/A | ✅ copy-first |
| Observabilidad / diagnóstico | No | P2 telemetry hook |

**Veredicto:** Propuesta UX = **no Enterprise completo**. Blueprint V1 = **sí, alineado Baseline V1**.

---

## 4. Arquitectura superior propuesta — resumen

La propuesta UX se **preserva semánticamente** (matriz policy, copy, paneles).  
Se **reestructura** en **Frontend Code Generation Engine** de 4 capas:

```
MANIFESTS (features) → ENGINE (core) → CONTROLLER (core/hooks) → UI SHELL (shared)
```

Detalle completo: [`01_PLATFORM_BLUEPRINT_V1.md`](01_PLATFORM_BLUEPRINT_V1.md).

---

## 5. Impacto en PR-UX-1 planificado

| PR-UX-1 original | PR-UX-1 revisado (Blueprint) |
|------------------|------------------------------|
| CodigoField monolítico | Engine P0 + Controller + thin CodigoField |
| utils sueltos | engine/* módulos |
| org config file | org-codigo.manifest.ts + registry bootstrap |
| 8 archivos shared | ~15 archivos core + 6 shared (más, pero correctos) |

**Esfuerzo adicional estimado:** +1–1.5 días vs PR-UX-1 original.  
**ROI:** evita refactor breaking al segundo módulo (INV).

---

## 6. Relación con documentos existentes

| Documento | Estatus post-auditoría |
|-----------|------------------------|
| `frontend-ux/01_POLICY_UX_MATRIX.md` | **Vigente** — norma UX sin cambio |
| `frontend-ux/02_CODIGO_FIELD_SPEC.md` | **Supersedido** por Blueprint §UI (API simplificada) |
| `frontend-ux/03_ERP_CONSISTENCY_GUIDELINES.md` | **Vigente** — complementa Blueprint |
| `frontend-ux/04_ORG_REFERENCE_ROLLOUT_PLAN.md` | **Actualizar** fases post-Blueprint |
| `frontend-alignment/*` | **Vigente** — capa técnica PR-1 |
| **Este paquete `frontend-engine/`** | **Autoridad arquitectónica** pre-código |

**Precedencia:** Blueprint V1 > CodigoField spec > rollout plan.

---

## 7. Decisión requerida antes de código

| Opción | Descripción | Recomendación |
|--------|-------------|---------------|
| A | Implementar PR-UX-1 original (componente grueso) | ❌ Deuda técnica |
| B | Implementar Blueprint V1 Engine + thin UI | ✅ **Recomendado** |
| C | Solo utils sin componente | ❌ UX inconsistente |

---

## 8. Conclusión

La propuesta UX conceptual es **aprobada y correcta**.  
La arquitectura de implementación propuesta en `02_CODIGO_FIELD_SPEC.md` es **insuficiente para estándar ERP decenal**.

**Acción:** Implementar PR-UX-1 según [`01_PLATFORM_BLUEPRINT_V1.md`](01_PLATFORM_BLUEPRINT_V1.md), no según spec monolítica anterior.

---

*Especificación definitiva: [`01_PLATFORM_BLUEPRINT_V1.md`](01_PLATFORM_BLUEPRINT_V1.md)*
