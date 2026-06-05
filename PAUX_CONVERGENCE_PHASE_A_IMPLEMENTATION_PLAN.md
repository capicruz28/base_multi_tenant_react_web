# PAUX_CONVERGENCE_PHASE_A_IMPLEMENTATION_PLAN.md

**Fase:** PAUX-Convergence — Fase A (P1)  
**Fecha:** 2026-06-03  
**Base:** `PLATFORM_UX_CONSISTENCY_FINAL_AUDIT.md`  
**Tipo:** Plan de implementación — **sin código en esta entrega**

**Alcance aprobado:**

| ID | Ítem |
|----|------|
| P1-01 | Filtros Plan y Estado en Clientes |
| P1-02 | Convergencia semántica filtro activo/inactivo (Clientes, Módulos, Catálogos) |
| P1-03 | Botón Editar en `ClientDetailPage` |
| P1-04 | Manejo errores 422 por campo |
| P1-05 | Alinear mensajes ER-03 con comportamiento real |

**Restricciones:**

- No tocar Backend.
- No modificar Dashboard.
- No iniciar P2 (PlatformListToolbar, badges catálogo, etc.).
- No crear componentes compartidos nuevos.
- Cambios mínimos y bajo riesgo.

---

## 0. Resumen ejecutivo

| Aspecto | Decisión |
|---------|----------|
| **Objetivo** | Cerrar deuda P1 funcional/semántica antes de BFF o Dashboard P2 |
| **Estrategia P1-01** | Filtrado **client-side** en `cliente.service` (patrón existente «Inactivos» + snapshot 1000) |
| **Estrategia P1-02** | Modelo canónico **«Ver inactivos»** (checkbox); catálogos = referencia; ajuste Clientes + Módulos |
| **Estrategia P1-03** | Reutilizar `EditClientModal` ya usado en listado |
| **Estrategia P1-04/05** | Reutilizar `getValidationErrors` existente (`error.service.ts`); patrón `EmpresaPage.tsx` |
| **Esfuerzo estimado** | **2–3 días** FE |
| **Riesgo global** | **Bajo–medio** (cambio default Módulos: ver §4.2) |

---

## 1. Modelo canónico — filtro activo/inactivo (P1-02)

Referencia adoptada: **Catálogos + ORG** (`Ver inactivos`).

| Control | Default (unchecked) | Checked |
|---------|---------------------|---------|
| **Etiqueta UI** | `Ver inactivos` | `Ver inactivos` |
| **Semántica** | Solo registros **activos** | Incluye **inactivos** (listado ampliado) |
| **API catálogos** | `solo_activos: true` | `solo_activos: false` |

**Nota Clientes:** Se conserva acceso a vista **«Solo inactivos»** como opción secundaria (select compacto o link), porque es flujo operativo validado en P0 — no se elimina, solo se subordina al modelo canónico.

```
┌─ Toolbar Clientes (objetivo) ────────────────────────────────────────────┐
│ [🔍 Buscar]  [Plan ▼]  [Estado suscripción ▼]  [☐ Ver inactivos]       │
│                [Registro: Activos ▼]  ← solo si aplica (Activos/Todos/Solo inactivos) │
│                                                      [↻] [+ Nuevo]      │
└──────────────────────────────────────────────────────────────────────────┘
```

Propuesta mínima Clientes:

- Checkbox **«Ver inactivos»** reemplaza opciones «Todos» del select actual.
- Select **«Registro»** reducido: `Activos` (default) | `Solo inactivos` — elimina «Todos» redundante con checkbox.
- Mapeo:
  - Registro=Activos, Ver inactivos=off → `activeFilter: 'active'`
  - Registro=Activos, Ver inactivos=on → `activeFilter: 'all'` (activos + inactivos)
  - Registro=Solo inactivos → `activeFilter: 'inactive'` (path existente)

---

## 2. P1-01 — Filtros Plan y Estado (Clientes)

### 2.1 Problema

`ClientManagementPage` envía `plan_suscripcion` y `estado_suscripcion` en `ClienteFilters`, pero `cliente.service.getClientes` **no los aplica** — controles decorativos.

### 2.2 Solución (sin Backend)

Extender `getClientes()` con rama **filtrado client-side** cuando exista `plan_suscripcion` y/o `estado_suscripcion`:

1. Detectar `needsSubscriptionFilter = !!(plan || estado)`.
2. Si true (o combinado con `inactive`):
   - `GET /clientes/?skip=0&limit=1000&solo_activos=false` (+ `buscar` si aplica).
   - Filtrar en FE:
     - `plan_suscripcion` exact match si definido.
     - `estado_suscripcion` exact match si definido.
     - `es_activo` según `activeFilter` (activo / inactive / all).
   - Paginar resultado filtrado (`pagina`, `limite`) — **mismo patrón que rama `inactive`**.
3. Si ningún filtro suscripción: flujo actual sin cambios.

### 2.3 UX de degradación

Cuando `needsSubscriptionFilter` y `total_clientes > 1000`:

- Mostrar nota en toolbar (texto `text-xs text-text-soft`):
  - *«Filtro aplicado sobre los primeros 1000 clientes»*
- Sin badge invasivo; sin mock.

### 2.4 Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `clientes/services/cliente.service.ts` | Rama filtrado plan/estado + helper interno `filterAndPaginateClientes()` |
| `clientes/services/__tests__/cliente.service.test.ts` | Tests filtro plan/estado + combinación inactive |
| `clientes/pages/ClientManagementPage.tsx` | Nota degradación parcial (condicional) |

**Sin cambios:** hooks dashboard, OpenAPI, Backend.

### 2.5 Criterios de aceptación P1-01

- [ ] Select Plan reduce filas visibles acorde al plan elegido.
- [ ] Select Estado suscripción idem.
- [ ] Combinación Plan + Estado + Registro activo/inactivo coherente.
- [ ] Búsqueda `buscar` sigue funcionando con filtros suscripción.
- [ ] Sin regresión rama `inactive` existente.
- [ ] Nota parcial si snapshot > 1000.

---

## 3. P1-02 — Convergencia filtro activo/inactivo

### 3.1 Catálogos (×5) — referencia, cambio mínimo

**Estado actual:** Ya implementan «Ver inactivos» correctamente.

| Archivo | Cambio |
|---------|--------|
| `catalogos/pages/PaisesPage.tsx` | Solo comentario JSDoc semántica canónica (opcional) |
| `MonedasPage.tsx`, `DepartamentosPage.tsx`, `ProvinciasPage.tsx`, `DistritosPage.tsx` | Idem |

**Opcional P1-02:** Eliminar `.filter(es_activo)` redundante post-API (P3 en auditoría) — **fuera de scope** salvo 1 línea por archivo si se desea limpieza zero-risk.

### 3.2 Módulos — renombrar + alinear semántica

**Estado actual:**

- Checkbox «**Solo activos**» (`soloActivos`).
- `filters.es_activo = soloActivos` → default `false` envía `solo_activos=false` → **muestra todos** (incl. inactivos).
- **Default distinto** a Catálogos/Clientes (activos only).

**Cambio propuesto:**

| Antes | Después |
|-------|---------|
| `soloActivos: boolean` | `showInactivos: boolean` (default `false`) |
| Label «Solo activos» | Label «Ver inactivos» |
| `es_activo = soloActivos` | `solo_activos: !showInactivos` vía service mapping |

Mapeo API (`modulo-v2.service.ts` sin cambio de contrato):

```typescript
// showInactivos === false → solo_activos=true (solo activos)
// showInactivos === true  → solo_activos=false (incluye inactivos)
filters.es_activo = !showInactivos;
```

**Impacto comportamiento:** Default pasa de «todos» a «solo activos» — alineado con Catálogos. **Riesgo medio** documentado en §6.

**Archivos:**

| Archivo | Cambio |
|---------|--------|
| `modulos/pages/ModuleManagementPage.tsx` | State, label, mapeo filtro, export handlers (L262, L327) |
| Tests existentes de módulos | Actualizar si hay asserts de filtro |

### 3.3 Clientes — convergencia UI

**Estado actual:** Select 3 vías: Todos / Activos / Inactivos.

**Cambio propuesto:**

| Archivo | Cambio |
|---------|--------|
| `clientes/pages/ClientManagementPage.tsx` | Checkbox «Ver inactivos» + select «Registro» (Activos \| Solo inactivos) |
| `clientes/types/cliente.types.ts` | Comentario `ClienteActiveFilter` alineado a modelo canónico |
| `cliente.service.ts` | Sin cambio semántico en `activeFilter` (ya soporta active/all/inactive) |

Lógica derivada:

```typescript
// Registro=Solo inactivos → activeFilter='inactive'
// Registro=Activos + !showInactivos → activeFilter='active'
// Registro=Activos + showInactivos → activeFilter='all'
```

### 3.4 Criterios de aceptación P1-02

- [ ] Las tres superficies muestran checkbox **«Ver inactivos»** con la misma etiqueta.
- [ ] Unchecked = solo activos (Módulos, Catálogos, Clientes registro Activos).
- [ ] Checked = incluye inactivos en listado.
- [ ] Clientes conserva vista «Solo inactivos» vía select Registro.
- [ ] Documentación inline (comentario) del modelo en `cliente.service.ts`.

---

## 4. P1-03 — Botón Editar en ClientDetailPage

### 4.1 Problema

```tsx
// ClientDetailPage.tsx ~L184-190
<button type="button" className="...">
  <Edit3 /> Editar
</button>
// Sin onClick — no abre modal
```

### 4.2 Solución

Reutilizar patrón de `ClientManagementPage`:

1. Importar `EditClientModal`, `OrgDiscardConfirmDialog` (si discard ya usado en detalle — verificar).
2. State: `isEditModalOpen`, `clienteDiscardPending` (opcional, si modal soporta discard).
3. `onClick={() => setIsEditModalOpen(true)}` con `cliente` actual.
4. `onSuccess` → `fetchClienteData()` para refrescar detalle.

**Archivos:**

| Archivo | Cambio |
|---------|--------|
| `clientes/pages/ClientDetailPage.tsx` | Wire Editar + modal + success refresh |
| `clientes/components/EditClientModal.tsx` | Sin cambio estructural (ya funcional) |

**Sin cambios:** routing, tabs, impersonación.

### 4.3 Criterios de aceptación P1-03

- [ ] Clic «Editar» abre `EditClientModal` con datos del cliente.
- [ ] Guardar exitoso refresca detalle y cierra modal.
- [ ] Discard guard existente sigue operativo.
- [ ] No regresión «Entrar al ERP» / refresh.

---

## 5. P1-04 — Errores 422 por campo

### 5.1 Problema

- `getValidationErrors()` **existe** en `core/services/error.service.ts` (patrón ORG).
- Formularios Platform super-admin usan solo `getErrorMessage()` → toast con msg Pydantic crudo.
- Formularios Clientes ya tienen state `errors` para validación local — **no mergean** errores API.

### 5.2 Solución (sin componentes nuevos)

Patrón por formulario (copiar de `EmpresaPage.tsx` L348-349):

```typescript
catch (err) {
  const { fieldErrors, message } = getValidationErrors(err);
  setErrors((prev) => ({ ...prev, ...fieldErrors }));
  if (Object.keys(fieldErrors).length === 0) {
    toast.error(message);
  }
}
```

Aplicar **border-error** existente en inputs que ya leen `errors[campo]`.

### 5.3 Alcance Phase A (mínimo, alto valor)

| Prioridad | Archivo | Mutación |
|-----------|---------|----------|
| **Must** | `CreateClientModal.tsx` | catch submit + merge fieldErrors |
| **Must** | `EditClientModal.tsx` | catch submit / onError mutate |
| **Should** | `CreateModuleModal.tsx` | idem si tiene errors state |
| **Should** | `EditModuleModal.tsx` | idem |
| **Should** | `catalogos/pages/PaisesPage.tsx` | create/edit submit (replicar en ×5 catálogos) |

**Fuera de scope Phase A (bajo riesgo / menor frecuencia):**

- Tabs cliente (`CreateConnectionModal`, etc.)
- Páginas Módulos satélite (menús, secciones, plantillas)
- Mutaciones `useClienteMutations` global onError — mantener toast fallback; modal prevalece si maneja catch local

### 5.4 Mapeo campos API → form

Usar último segmento de `loc` Pydantic (`getValidationErrors` ya lo hace).

Verificar alineación nombres BE ↔ form para campos críticos Clientes:

| Campo API | Campo form |
|-----------|------------|
| `contacto_email` | `contacto_email` |
| `razon_social` | `razon_social` |
| `subdominio` | `subdominio` |
| `codigo_cliente` | `codigo_cliente` |

Si `loc` no coincide, añadir mapa inline mínimo en modal (objeto `API_FIELD_ALIASES`) — **sin archivo shared**.

### 5.5 Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `CreateClientModal.tsx` | import `getValidationErrors`; merge en catch |
| `EditClientModal.tsx` | idem en mutate onError |
| `CreateModuleModal.tsx` | idem |
| `EditModuleModal.tsx` | idem |
| `catalogos/pages/*Page.tsx` (×5) | state `fieldErrors`; inputs con border-error |
| `core/services/__tests__/error.service.test.ts` | Tests adicionales si se ajustan mensajes P1-05 |

### 5.6 Criterios de aceptación P1-04

- [ ] 422 en crear/editar cliente muestra error bajo campo afectado.
- [ ] Al menos un catálogo (Países) demuestra patrón replicado en los 5.
- [ ] Módulos create/edit muestran errores por campo.
- [ ] Toast solo cuando no hay mapeo campo a campo.

---

## 6. P1-05 — Alinear ER-03 con comportamiento real

### 6.1 Problema

`messageFromHttpStatus` en `error.service.ts`:

```typescript
case 400:
  return '... Revisa los campos marcados en rojo ...';
case 422:
  return '... Revisa el formato de los campos ...';
```

Platform **no pintaba** campos en rojo → promesa incumplida (ER-03).

### 6.2 Solución (coordinada con P1-04)

**Opción adoptada (mínima):**

1. Tras P1-04, formularios scope pintan `border-error` → mensajes pueden referir campos.
2. Ajustar fallbacks en `getValidationErrors` / `messageFromHttpStatus`:

| Caso | Mensaje |
|------|---------|
| 422 + `fieldErrors` no vacío | `'Revisa los campos indicados en el formulario.'` |
| 422 sin fieldErrors | `'Los datos enviados no son válidos.'` (sin «rojo») |
| 400 sin fieldErrors | `'Los datos enviados son incorrectos.'` (sin «rojo») |
| 400 + fieldErrors | `'Revisa los campos indicados en el formulario.'` |

3. `getErrorMessage` para 422 array detail: mantener concat msgs técnicos **solo en toast** cuando modal no capturó fieldErrors.

**Archivos:**

| Archivo | Cambio |
|---------|--------|
| `core/services/error.service.ts` | Ajuste copy `messageFromHttpStatus` + rama `getValidationErrors` |
| `core/services/__tests__/error.service.test.ts` | Actualizar expects |

**Sin cambios:** Dashboard, interceptors axios.

### 6.3 Criterios de aceptación P1-05

- [ ] Ningún fallback genérico promete «campos en rojo» sin fieldErrors.
- [ ] Con fieldErrors mapeados, copy coherente con UI roja.
- [ ] Tests `error.service` verdes.

---

## 7. Análisis de impacto consolidado

### 7.1 Superficies tocadas vs intactas

| Superficie | P1-01 | P1-02 | P1-03 | P1-04 | P1-05 |
|------------|:-----:|:-----:|:-----:|:-----:|:-----:|
| Dashboard | — | — | — | — | — |
| Clientes list | ✅ | ✅ | — | — | — |
| Clientes detalle | — | — | ✅ | — | — |
| Clientes modals | — | — | — | ✅ | ✅ |
| Módulos list | — | ✅ | — | — | — |
| Módulos modals | — | — | — | ✅ | ✅ |
| Catálogos ×5 | — | 📋 ref | — | ✅ | ✅ |
| Auditoría | — | — | — | — | — |

### 7.2 Dependencias

```
P1-05 ──depende de──► P1-04 (mensajes honestos requieren UI campo)
P1-01 ──independiente──► cliente.service (puede paralelizarse)
P1-02 ──independiente──► Clientes + Módulos UI (catálogos referencia)
P1-03 ──independiente──► ClientDetailPage + EditClientModal existente
```

**Orden de implementación recomendado:**

1. P1-03 (aislado, rápido, cierra condición cierre MVP)
2. P1-01 (servicio + test)
3. P1-02 (Clientes UI → Módulos UI)
4. P1-04 (modales Clientes → Módulos → Catálogos)
5. P1-05 (error.service + tests)

### 7.3 Contratos API consumidos (sin cambios Backend)

| Endpoint | Uso Phase A |
|----------|-------------|
| `GET /clientes/` | Filtros plan/estado vía snapshot 1000 |
| `GET /modulos-v2/` | `solo_activos` mapeo invertido |
| `GET /catalogos/*` | Sin cambio contrato |
| POST/PUT clientes, módulos, catálogos | 422 detail array existente |

---

## 8. Riesgos y mitigaciones

| ID | Riesgo | Prob. | Impacto | Mitigación |
|----|--------|-------|---------|------------|
| R-01 | Módulos default pasa de «todos» a «solo activos» | Alta | Medio | QA explícito; nota en reporte implementación; usuarios esperaban ver inactivos por defecto → usar «Ver inactivos» |
| R-02 | Filtro plan/estado incompleto si >1000 clientes | Media | Bajo | Nota UI «primeros 1000»; coherente con Dashboard snapshot |
| R-03 | `loc` Pydantic no coincide con name input catálogo | Media | Bajo | Mapa alias inline por página; toast fallback |
| R-04 | Regresión paginación Clientes inactive | Baja | Alto | Tests `cliente.service.test.ts` existentes + nuevos |
| R-05 | Doble toast modal + mutation onError | Media | Bajo | En modals con catch local, evitar toast duplicado si fieldErrors > 0 |
| R-06 | Clientes pierde opción «Todos» explícita | Baja | Bajo | Checkbox «Ver inactivos» equivale a Todos con registro Activos |

---

## 9. QA esperado

### 9.1 P1-01 — Filtros Plan/Estado

| # | Caso | Resultado esperado |
|---|------|-------------------|
| QA-01 | Plan=Trial, Registro=Activos | Solo clientes trial activos |
| QA-02 | Estado=suspendido | Solo suspendidos en página |
| QA-03 | Plan + Estado combinados | Intersección correcta |
| QA-04 | Plan + búsqueda texto | Ambos aplicados |
| QA-05 | >1000 clientes (si entorno lo permite) | Nota degradación visible |
| QA-06 | Limpiar filtros | Vuelve listado normal paginado |

### 9.2 P1-02 — Filtro activo/inactivo

| # | Caso | Resultado esperado |
|---|------|-------------------|
| QA-07 | Catálogos: default | Solo activos |
| QA-08 | Módulos: default tras cambio | Solo activos (no todos) |
| QA-09 | Módulos: Ver inactivos ✓ | Aparecen módulos inactivos |
| QA-10 | Clientes: Registro Activos, checkbox off | Solo `es_activo=true` |
| QA-11 | Clientes: Registro Activos, checkbox on | Activos + inactivos |
| QA-12 | Clientes: Registro Solo inactivos | Solo `es_activo=false` |
| QA-13 | Etiqueta checkbox idéntica «Ver inactivos» en 3 superficies | Visual |

### 9.3 P1-03 — Editar detalle

| # | Caso | Resultado esperado |
|---|------|-------------------|
| QA-14 | Clic Editar | Modal abre con datos |
| QA-15 | Guardar cambio | Detalle refresca |
| QA-16 | Cancelar con cambios | Discard guard (si aplica) |

### 9.4 P1-04 / P1-05 — 422

| # | Caso | Resultado esperado |
|---|------|-------------------|
| QA-17 | Crear cliente email inválido (422) | Error bajo campo email; borde rojo |
| QA-18 | Editar cliente campo requerido vacío | Error en campo |
| QA-19 | Crear país duplicado (409) | Toast conflict; sin falso «rojo» |
| QA-20 | 422 sin loc reconocible | Toast mensaje genérico honesto |
| QA-21 | Mensaje fallback 400/422 | No menciona «rojo» sin fieldErrors |

### 9.5 Regresión transversal

| # | Caso | Resultado esperado |
|---|------|-------------------|
| QA-22 | Dashboard `/super-admin/dashboard` | Sin cambios visuales/funcionales |
| QA-23 | Auditoría Global | Sin cambios |
| QA-24 | Confirm desactivar/reactivar Clientes/Catálogos | Sin regresión |
| QA-25 | Tests automatizados | `cliente.service.test.ts`, `error.service.test.ts` verdes |

### 9.6 Comandos tests

```bash
npm test -- src/features/super-admin/clientes/services/__tests__/cliente.service.test.ts --run
npm test -- src/core/services/__tests__/error.service.test.ts --run
```

---

## 10. Archivos — resumen total

### Modificar

```
src/features/super-admin/clientes/services/cliente.service.ts
src/features/super-admin/clientes/services/__tests__/cliente.service.test.ts
src/features/super-admin/clientes/pages/ClientManagementPage.tsx
src/features/super-admin/clientes/pages/ClientDetailPage.tsx
src/features/super-admin/clientes/types/cliente.types.ts          (comentarios)
src/features/super-admin/clientes/components/CreateClientModal.tsx
src/features/super-admin/clientes/components/EditClientModal.tsx

src/features/super-admin/modulos/pages/ModuleManagementPage.tsx
src/features/super-admin/modulos/components/CreateModuleModal.tsx
src/features/super-admin/modulos/components/EditModuleModal.tsx

src/features/super-admin/catalogos/pages/PaisesPage.tsx
src/features/super-admin/catalogos/pages/MonedasPage.tsx
src/features/super-admin/catalogos/pages/DepartamentosPage.tsx
src/features/super-admin/catalogos/pages/ProvinciasPage.tsx
src/features/super-admin/catalogos/pages/DistritosPage.tsx

src/core/services/error.service.ts
src/core/services/__tests__/error.service.test.ts
```

### No modificar

```
src/features/super-admin/dashboard/**     (explícito)
src/features/super-admin/auditoria/**     (fuera scope Phase A)
src/shared/components/layout/**         (shell)
Backend / OpenAPI
Nuevo PlatformListToolbar / componentes shared
```

---

## 11. Entregables post-implementación

Al completar código, generar:

**`PAUX_CONVERGENCE_PHASE_A_IMPLEMENTATION_REPORT.md`**

Incluir:

- Checklist QA §9 ejecutado
- Confirmación default Módulos (R-01)
- Diff comportamiento filtros Clientes
- Capturas o mock textual toolbar convergido
- Declaración cierre condicionado Clientes detalle

---

## 12. Criterios de cierre Phase A

| # | Criterio |
|---|----------|
| CA-01 | P1-01 a P1-05 implementados en alcance §5.3 / §3 |
| CA-02 | Dashboard intacto |
| CA-03 | Sin endpoints Backend nuevos |
| CA-04 | Sin componentes shared nuevos |
| CA-05 | QA §9 pasado en entorno con API real |
| CA-06 | Platform Administration MVP **cerrado sin condiciones** tras P1-03 |

---

## 13. Próximo paso

**Pendiente aprobación de este plan** → implementación en orden §7.2 → informe Phase A.

**No iniciar:** PAUX Fase B (P2), Dashboard P2, BFF.

---

*Plan generado 2026-06-03 — sin commits, sin código.*
