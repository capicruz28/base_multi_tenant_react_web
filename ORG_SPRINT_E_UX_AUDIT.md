# Sprint ORG E-UX — Auditoría de implementación

**Fecha:** 31 mayo 2026  
**Estado:** Listo para revisión y aprobación — **sin implementación, sin commit**  
**Prerequisitos cerrados:** Multiempresa, P0/P1 contexto, E-SEC B.1.1 (ver `ORG_SPRINT_CLOSURE_AUDIT.md`)

**Alcance aprobado:** Empty states homogéneos · Skeletons · `IamSearchInput` · E-ME4 (sin UUID en UI) · Smoke regresión.

**Fuera de alcance:** Refactor `EmpresaPage`, wizard onboarding, hub `/admin`, APIs, AuthContext, B.1.1 (ya cerrado), debounce de búsqueda (opcional §6.4).

---

## 1. Resumen ejecutivo y ROI

| Pregunta | Respuesta |
|----------|-----------|
| ¿Vale la pena antes de INV? | **Sí** — bajo riesgo, alto impacto visible, reutiliza componentes ya pagados en IAM/INV |
| Esfuerzo estimado | **2–4 días** (1 dev) |
| Riesgo de regresión funcional | **Bajo** — solo capa presentación; no toca hooks de mutación ni contratos |
| Riesgo de regresión E-SEC / multiempresa | **Medio-bajo** — mitigado con smoke QA obligatorio §7 |

**ROI esperado:**

| Entregable | Beneficio usuario | Coste dev |
|------------|-------------------|-----------|
| `IamTableEmptyState` | Mensajes + CTA + búsqueda sin resultados coherentes | Bajo (sustitución mecánica) |
| `OrgTableSkeleton` | Tabla “ocupando espacio” al cargar; menos salto visual | Bajo (patrón INV probado) |
| `IamSearchInput` | Paridad visual IAM; icono búsqueda; accesibilidad | Muy bajo |
| E-ME4 | Elimina UUID en tooltip (M4 multiempresa) | Muy bajo |
| Smoke §7 | Protege inversión P0/P1/E-SEC | ~0.5 día QA |

**Nota de expectativa:** IAM (`UserManagementPage`, `RoleManagementPage`) hoy usa **spinner `Loader`**, no skeleton de tabla. E-UX alinea ORG con **INV** (`InvTableSkeleton`), que es el patrón más moderno del monorepo para listados — mejora respecto a IAM en percepción de carga.

---

## 2. Estado actual vs objetivo

### 2.1 Empty states

Todas las páginas ya tienen un patrón **visualmente similar** a `IamTableEmptyState` (icono Lucide 12×12, título, CTA opcional), pero implementado **inline** (~15–25 líneas duplicadas por página).

| Página | `colSpan` | Icono | Título dinámico | CTA | `description` | Variante búsqueda |
|--------|-----------|-------|-----------------|-----|---------------|-------------------|
| **EmpresaPage** | 6 | `Building2` | activos / todos | `openCreate` si `canCrear` | ❌ | ❌ |
| **SucursalesPage** | 8 | `MapPin` | activos / todos | `openCreate` + `scopeEmpresaId` | ❌ | ❌ |
| **DepartamentosPage** | 6 | `Layers` | activos / todos | idem | ❌ | ❌ |
| **CargosPage** | 6 | `Briefcase` | activos / todos | idem | ❌ | ❌ |
| **CentrosCostoPage** | 6 | `DollarSign` | activos / todos | idem | ❌ | ❌ |
| **ParametrosPage** | 8 | `Settings` | activos / filtro tab | `openCreate` si `canCreateOnTab` | ❌ | ❌ |

**Objetivo:** sustituir bloques inline por `IamTableEmptyState` con:

- `hasSearch = buscar.trim().length > 0` (patrón IAM).
- `description` secundaria cuando hay búsqueda (“Pruebe otro término…”).
- `actionDisabled` incluyendo `discardPending !== null` donde aplique CTA.
- Company-scoped: CTA crear solo si `scopeEmpresaId` (ya implícito en varias; formalizar).

**Empresa (tenant):** no depende de `scopeEmpresaId` para listar; CTA según `canCrear` únicamente.

### 2.2 Carga (skeleton vs loader)

| Página | Patrón actual | Objetivo |
|--------|---------------|----------|
| Las 6 | `{loading && <Loader center py-12 />}` — **oculta tabla** | `{loading && <OrgTableSkeleton columns={N} />}` — **mantiene chrome tabla** |
| Error | Bloque debajo del loader | Sin cambio |
| Datos | Tabla completa | Sin cambio |

**Columnas skeleton (deben coincidir con `<thead>`):**

| Página | `columns` |
|--------|-----------|
| EmpresaPage | 6 |
| SucursalesPage | 8 |
| DepartamentosPage | 6 |
| CargosPage | 6 |
| CentrosCostoPage | 6 |
| ParametrosPage | 8 |

**Referencia:** `src/features/inv/components/InvTableSkeleton.tsx` — mismo contenedor `overflow-x-auto rounded-lg border … shadow`.

### 2.3 Búsqueda

| Página | Ubicación input | Clases actuales | Placeholder | Otros filtros toolbar |
|--------|-----------------|-----------------|-------------|------------------------|
| EmpresaPage | Toolbar propio (`div.mb-4`) | `w-52` + border local | Código, razón social, RUC… | Ver inactivos |
| SucursalesPage | `OrgCompanyToolbar` | `w-52` | Código, nombre, dirección… | Ver inactivos |
| DepartamentosPage | `OrgCompanyToolbar` | `w-52` | Código, nombre… | Ver inactivos |
| CargosPage | `OrgCompanyToolbar` | `w-52` | Código, nombre… | Ver inactivos |
| CentrosCostoPage | `OrgCompanyToolbar` | `w-52` | Código, nombre, tipo… | Ver inactivos |
| ParametrosPage | `OrgCompanyToolbar` | `w-52` | Código, nombre… | **`<select>` módulo** + Ver inactivos |

**Sustitución:**

```tsx
<IamSearchInput
  value={buscar}
  onChange={setBuscar}
  placeholder="…"
  className="w-52"
  aria-label="Buscar …"
  disabled={discardPending !== null}  // opcional, recomendado
/>
```

**No sustituir:** `<select moduloFilter>` en ParametrosPage (no es búsqueda de texto).

**Debounce:** ORG pasa `buscar` directo a React Query (cada tecla refetch). IAM usa `useDebounce(500)`. **Fuera de alcance explícito**; ver §6.4 como mejora opcional.

### 2.4 E-ME4 — exposición de UUID

| Ubicación | Mecanismo | Visible al usuario | Acción E-ME4 |
|-----------|-----------|-------------------|--------------|
| `OrgActiveEmpresaBanner.tsx` L15 | `title={scopeEmpresaId}` | Sí (hover) si banner visible | **Eliminar `title`** o usar `title={activeEmpresaLabel}` |
| `OrgSessionEmpresaField.tsx` L35 | `title={scopeEmpresaId ?? undefined}` | Sí (hover) en modales create | **Eliminar `title`**; label visible basta |
| `OrgCompanyToolbar` + header | Sin UUID en copy | — | Sin cambio |
| Tablas company-scoped | No columna `empresa_id` | — | Sin cambio |
| `OrgParametroAlcanceBadge` | Muestra GLOBAL/OVERRIDE | — | Sin cambio |
| Hidden `empresa_id_session` | Valor en DOM, no tooltip | — | Sin cambio (necesario para forms) |

**Criterio E-ME4:** ningún `title` / `aria-label` / texto visible con UUID de empresa en componentes ORG de contexto.

---

## 3. Estrategia de reutilización

### 3.1 Componentes fuente (no duplicar lógica)

| Componente | Ruta | Uso en E-UX |
|------------|------|-------------|
| `IamTableEmptyState` | `@/features/admin/components/iam` | Empty states tabulares |
| `IamSearchInput` | idem | 6 campos `buscar` |
| `InvTableSkeleton` | `@/features/inv/components/InvTableSkeleton` | Base visual skeleton |

### 3.2 Artefactos ORG propuestos (mínimos)

| Artefacto | Ruta sugerida | Propósito |
|-----------|---------------|-----------|
| `OrgTableSkeleton` | `src/features/org/components/OrgTableSkeleton.tsx` | Re-export o thin wrapper de `InvTableSkeleton` + comentario “mismo chrome que tablas ORG” |
| `org-empty-state-messages.ts` (opcional) | `src/features/org/utils/org-empty-state-messages.ts` | Factory `getOrgListEmptyState({ entity, includeInactive, hasSearch, canCreate })` — reduce copy duplicada |

**Recomendación:** Fase 1 sin factory — 6 llamadas explícitas a `IamTableEmptyState` (más legible en PR). Factory solo si copy diverge mucho en QA.

### 3.3 Patrón de renderizado unificado

```tsx
// Pseudocódigo — todas las páginas company-scoped + Empresa
const hasSearch = buscar.trim().length > 0;

{loading && <OrgTableSkeleton columns={COLS} />}
{error && !loading && <ErrorBanner />}
{!loading && !error && (
  <table>…
    {rows.length > 0 ? rows.map(...) : (
      <IamTableEmptyState … />
    )}
  </table>
)}
```

**Importante:** con skeleton, **no** usar `{!loading && !error && (` que oculte toda la tabla; solo reemplazar el bloque `loading && <Loader>`.

### 3.4 Orden de implementación sugerido

1. `OrgTableSkeleton` (1 archivo).
2. **CentrosCostoPage** — piloto (más pequeña company-scoped).
3. Departamentos → Cargos → Sucursales → Parametros.
4. **EmpresaPage** — toolbar distinto; validar onboarding no afectado.
5. E-ME4 en `OrgActiveEmpresaBanner` + `OrgSessionEmpresaField`.
6. Smoke QA §7 completo.

### 3.5 Archivos a modificar (estimación)

| Acción | Archivos |
|--------|----------|
| Crear | `OrgTableSkeleton.tsx` (+ opcional `org-empty-state-messages.ts`) |
| Modificar | 6 × `*Page.tsx` |
| Modificar E-ME4 | `OrgActiveEmpresaBanner.tsx`, `OrgSessionEmpresaField.tsx` |
| **Total** | **~8–9 archivos** |

**Sin tocar:** `useOrgSessionScope`, guards, `org.service`, `form-dirty`, `org-discard-handlers`, hooks React Query (salvo opcional debounce).

---

## 4. Inventario detallado por página

### 4.1 EmpresaPage (`/app/org/empresa`)

| Ítem | Detalle |
|------|---------|
| Listado | Tenant-wide; sin `OrgCompanyToolbar` |
| Empty | “No hay empresas activas/registradas” + CTA crear |
| Search | Sustituir input toolbar; `aria-label="Buscar empresas"` |
| Skeleton | 6 columnas |
| E-ME4 | No usa `OrgSessionEmpresaField` en listado; modales create no tienen campo empresa de sesión |
| Onboarding | Auto-open create — **no cambiar** lógica; solo regresión QA |
| Riesgo | Layout toolbar distinto; probar con `discardPending` |

### 4.2 SucursalesPage

| Ítem | Detalle |
|------|---------|
| Empty + CTA | Requiere `scopeEmpresaId` para CTA (ya existe) |
| Skeleton | 8 cols (incl. Casa matriz) |
| Search | En `OrgCompanyToolbar` |

### 4.3 DepartamentosPage / CargosPage / CentrosCostoPage

Patrón idéntico: 6 cols, `OrgCompanyToolbar`, `OrgSessionEmpresaField` en create → **E-ME4 en field aplica**.

### 4.4 ParametrosPage

| Ítem | Detalle |
|------|---------|
| Empty | Depende de `activeTab` + `includeInactive` + `canCreateOnTab` |
| Copy vacío | Diferenciar “no hay parámetros para este filtro” vs búsqueda sin resultados |
| Toolbar | **Solo** reemplazar input `buscar`; mantener `select` módulo |
| Skeleton | 8 cols |
| Guard | Si `!canQueryHybridScoped`, guard de ruta — empty de tabla es secundario |

---

## 5. Riesgos

| ID | Riesgo | Prob. | Impacto | Mitigación |
|----|--------|-------|---------|------------|
| R1 | Regresión **B.1.1** al editar JSX de páginas | Media | Alto | Smoke §7.3; no tocar handlers discard |
| R2 | Regresión **multiempresa** / cambio empresa | Baja | Alto | Smoke §7.1–7.2 |
| R3 | **Layout shift** skeleton vs loader | Baja | Bajo | Aceptado; INV ya lo usa |
| R4 | `colSpan` incorrecto | Baja | Medio | Tabla por página en checklist |
| R5 | Empty con búsqueda sin `hasSearch` | Media | Bajo | Copy IAM estándar |
| R6 | CTA crear con `discardPending` activo | Baja | Bajo | `actionDisabled` |
| R7 | Onboarding Empresa + skeleton en carga inicial | Baja | Medio | QA explícito §7.4 |
| R8 | Import ORG → `features/admin/iam` acoplamiento | Baja | Bajo | Ya existe en proyecto; mismo que futuro INV si aplica |

---

## 6. Alcance opcional (no bloquear E-UX)

### 6.1 Debounce búsqueda (E-SEARCH+)

- Añadir `useDebounce(buscar, 500)` en cada página antes de pasar a hooks.
- Reduce carga API; alinea con IAM.
- **+0.5 día**; validar que query keys sigan correctas.

### 6.2 `OrgSessionEmpresaField` en modales

- Tras E-ME4, evaluar si el campo readonly sigue aportando valor con header visible (P1 ya ocultó banner).
- **No eliminar en E-UX** sin decisión producto — solo quitar UUID.

### 6.3 Mensaje cambio empresa con modal abierto (E-RESET)

- Fuera de E-UX; sprint siguiente.

---

## 7. Plan QA — Smoke de regresión

Ejecutar **después** de E-UX en entorno con datos reales. Duración estimada: **2–3 h**.

### 7.1 Multiempresa y contexto (P0/P1)

| # | Caso | Perfiles | Esperado |
|---|------|----------|----------|
| M1 | tenant_admin → `/app/org/sucursales` | tenant_admin | Lista carga; header muestra empresa; **sin** banner duplicado |
| M2 | Cambiar empresa en header | tenant_admin / MANAGER | Lista refresca; skeleton breve; datos de otra empresa |
| M3 | Sin empresa / selection_pending | USER | Redirect o guard; sin datos ajenos |
| M4 | Hover banner fallback (si visible) | Caso sin header | **Sin UUID** en tooltip (E-ME4) |
| M5 | Crear departamento → hover campo Empresa | MANAGER | **Sin UUID** en tooltip del input readonly |

### 7.2 E-UX funcional

| # | Caso | Esperado |
|---|------|----------|
| U1 | Carga inicial (throttle red) | Skeleton N columnas, no spinner centrado solo |
| U2 | Lista vacía sin búsqueda | `IamTableEmptyState` + CTA si permiso |
| U3 | Búsqueda sin resultados | Título “no encontraron…” + description; **sin** CTA crear (IAM) |
| U4 | Limpiar búsqueda | Vuelve lista / empty normal |
| U5 | Icono búsqueda visible | `IamSearchInput` alineado IAM |
| U6 | Parametros + filtro módulo + búsqueda | Combinación no rompe empty |

### 7.3 B.1.1 (muestra — no re-test completo 12 dialogs)

| # | Caso | Página muestra |
|---|------|----------------|
| B1 | Dirty → Cancelar → confirm | CentrosCosto |
| B2 | Seguir editando | Sucursales |
| B3 | Sí, descartar — sin pantalla negra | Cargos |
| B4 | ESC / click fuera con dirty | Parametros |
| B5 | Guardar exitoso cierra sin confirm | Departamentos |

### 7.4 Onboarding Empresa

| # | Caso | Esperado |
|---|------|----------|
| O1 | `/app/org/empresa?onboarding=true` | Modal crear abre; skeleton en carga lista si aplica |
| O2 | Dirty en onboarding → descartar | Confirm B.1.1 |
| O3 | Crear empresa exitosa | Redirect home / selección; sin regresión |

### 7.5 Criterios de cierre E-UX

- [ ] 6/6 páginas con `IamTableEmptyState` + variantes búsqueda.
- [ ] 6/6 páginas con `OrgTableSkeleton` y column count correcto.
- [ ] 6/6 búsquedas con `IamSearchInput`.
- [ ] E-ME4: 0 tooltips con UUID en banner y campo sesión.
- [ ] Smoke M1–M5, U1–U6, B1–B5, O1–O3 pasan.
- [ ] ESLint en archivos tocados.
- [ ] Sin cambios en payloads/red.

---

## 8. Comparativa ROI vs alternativas

| Siguiente paso | ROI usuario | ROI dev | Dependencias |
|----------------|-------------|---------|--------------|
| **E-UX (este sprint)** | ★★★★★ | ★★★★★ | Ninguna |
| E-EMP refactor Empresa | ★★☆☆☆ (largo plazo) | ★★★☆☆ | Post E-UX |
| INV módulo | ★★★★☆ | ★★★☆☆ | Contratos INV |
| Hub `/admin` | ★★★★☆ | ★★★☆☆ | Producto |

**Recomendación:** Aprobar E-UX → QA §7 → **luego** iniciar INV con confianza en patrón ORG estabilizado.

---

## 9. Checklist pre-implementación

- [x] Inventario empty / loader / search por página
- [x] Mapa E-ME4
- [x] Estrategia componentes IAM + INV
- [x] Riesgos y mitigaciones
- [x] Plan smoke regresión
- [ ] Aprobación usuario para iniciar código
- [ ] Commit solo si se solicita explícitamente

---

*Documento generado para validación de ROI antes de implementar ORG E-UX. Sin código. Sin commit.*
