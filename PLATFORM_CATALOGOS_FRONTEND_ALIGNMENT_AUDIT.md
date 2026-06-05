# PLATFORM_CATALOGOS_FRONTEND_ALIGNMENT_AUDIT.md

Auditoría de impacto Frontend para cerrar **UX-PLAT-P1-03** (alineación de catálogos globales Platform a **Desactivar / Reactivar** y consumo de `es_activo`), **revisando únicamente este repositorio**.

## Contexto (confirmado por negocio/back)

Para catálogos globales Platform:

- Campo: `es_activo`
- GET soporta `solo_activos`
- DELETE = **desactivar**
- PUT = **reactivar**

Objetivo: identificar brechas actuales en Frontend (tipos/servicios/UI) y el set exacto de archivos a modificar, con prioridad.

---

## Estado actual en este repo (evidencia de código)

### Servicio común (catálogos globales)

- **Archivo**: `src/core/services/catalogos.service.ts`
- **Objeto**: `catalogosGlobalService`
- **Métodos actuales relevantes**:
  - **Países**: `listPaises(params?: { solo_activos?: boolean })`, `createPais`, `updatePais`, `deletePais`
  - **Monedas**: `listMonedas(params?: { solo_activos?: boolean })`, `createMoneda`, `updateMoneda`, `deleteMoneda`
  - **Departamentos**: `listDepartamentos(params?: { pais_id?: string })`, `createDepartamento`, `updateDepartamento`, `deleteDepartamento`
  - **Provincias**: `listProvincias(params?: { departamento_id?: string })`, `createProvincia`, `updateProvincia`, `deleteProvincia`
  - **Distritos**: `listDistritos(params?: { provincia_id?: string })`, `createDistrito`, `updateDistrito`, `deleteDistrito`

**Observación clave**: solo Países y Monedas ya aceptan `solo_activos` en el método `list*` en este repo. Departamentos/Provincias/Distritos no.

### Tipos/DTOs

- **Archivo**: `src/types/catalogos.types.ts`
- **Evidencia**:
  - `CatPais` / `CatMoneda` incluyen `es_activo?: boolean | null` y sus Create/Update también.
  - `CatDepartamento`, `CatProvincia`, `CatDistrito` **no** incluyen `es_activo` en este repo.
  - Sus Create/Update **no** incluyen `es_activo`.

### UI (páginas)

Páginas Platform activas:

- Países: `src/features/super-admin/catalogos/pages/PaisesPage.tsx`
- Monedas: `src/features/super-admin/catalogos/pages/MonedasPage.tsx`
- Departamentos: `src/features/super-admin/catalogos/pages/DepartamentosPage.tsx`
- Provincias: `src/features/super-admin/catalogos/pages/ProvinciasPage.tsx`
- Distritos: `src/features/super-admin/catalogos/pages/DistritosPage.tsx`

Patrón UI común actual:

- Acción por fila: **Trash2** → abre `ConfirmDialog` con copy “Eliminar …”
- Handler: `handleDeleteConfirm()` llama a `catalogosGlobalService.deleteX(id)` y toast “... eliminado.”
- No existe control “Ver inactivos” ni filtro `solo_activos` (excepto que el servicio podría permitirlo en Países/Monedas, pero la UI no lo usa).

---

## Auditoría por catálogo (impacto y brechas)

> Para cada catálogo se indica: Página / Tabla / Modal / Servicio / Type afectado, y qué falta para alineación.

### 1) Países

1. **Página afectada**: `src/features/super-admin/catalogos/pages/PaisesPage.tsx`
2. **Tabla afectada**: tabla principal (incluye columna **Activo**)
3. **Modal afectado**:
   - Create: `Dialog` “Crear país” (incluye checkbox Activo)
   - Edit: `Dialog` “Editar país” (incluye checkbox Activo)
   - Confirmación: `ConfirmDialog` “Eliminar país”
4. **Servicio afectado**: `src/core/services/catalogos.service.ts`
   - `catalogosGlobalService.listPaises({ solo_activos? })`
   - `catalogosGlobalService.updatePais(paisId, payload)`
   - `catalogosGlobalService.deletePais(paisId)` (hoy semántica FE: “delete”; nueva semántica: **desactivar**)
5. **DTO/Type afectado**: `src/types/catalogos.types.ts`
   - `CatPais`, `CatPaisCreate`, `CatPaisUpdate` (ya incluyen `es_activo`)

Determinación (brechas):
- **Falta consumir `solo_activos`**: la UI no envía `solo_activos` a `listPaises`.
- **Estado Activo/Inactivo**: **ya se muestra** (columna “Activo”).
- **Botón “Eliminar”**: existe y **debe cambiar a “Desactivar”** (por contrato nuevo DELETE=desactivar).
- **Soporte Reactivar**:
  - En contrato FE ya existe `updatePais(..., { es_activo })`, pero **no hay acción UI** para reactivar.
- **Ver inactivos**: no existe toggle; hoy la UI muestra lo que devuelva el backend.

### 2) Monedas

1. **Página afectada**: `src/features/super-admin/catalogos/pages/MonedasPage.tsx`
2. **Tabla afectada**: tabla principal (incluye columna **Activo**)
3. **Modal afectado**:
   - Create/Edit incluyen checkbox Activo
   - Confirmación: `ConfirmDialog` “Eliminar moneda”
4. **Servicio afectado**: `src/core/services/catalogos.service.ts`
   - `listMonedas({ solo_activos? })`, `updateMoneda`, `deleteMoneda`
5. **DTO/Type afectado**: `src/types/catalogos.types.ts`
   - `CatMoneda`, `CatMonedaCreate`, `CatMonedaUpdate` (ya incluyen `es_activo`)

Brechas:
- **Falta consumir `solo_activos`**: la UI no lo usa.
- **Estado Activo/Inactivo**: **ya se muestra**.
- **Botón “Eliminar”**: existe y **debe pasar a “Desactivar”**.
- **Soporte Reactivar**: el tipo/update lo permitiría, pero no hay acción visible.
- **Ver inactivos**: no existe toggle explícito.

### 3) Departamentos

1. **Página afectada**: `src/features/super-admin/catalogos/pages/DepartamentosPage.tsx`
2. **Tabla afectada**: tabla principal (hoy: Código, Nombre, País, Acciones)
3. **Modal afectado**:
   - Create/Edit: `Dialog` (sin checkbox Activo)
   - Confirmación: `ConfirmDialog` “Eliminar departamento”
4. **Servicio afectado**: `src/core/services/catalogos.service.ts`
   - `listDepartamentos({ pais_id? })`, `updateDepartamento`, `deleteDepartamento`
5. **DTO/Type afectado**: `src/types/catalogos.types.ts`
   - `CatDepartamento`, `CatDepartamentoCreate`, `CatDepartamentoUpdate` (**sin** `es_activo` hoy)

Brechas:
- **Falta consumir `es_activo`**: tipos no lo tienen; UI no lo muestra.
- **Falta mostrar estado Activo/Inactivo**: no hay columna ni badge.
- **Botón “Eliminar”**: existe y debe cambiar a **Desactivar** (DELETE=desactivar).
- **Soporte Reactivar**:
  - No hay endpoint/método explícito “reactivar” en servicio FE.
  - `updateDepartamento` existe pero su type `CatDepartamentoUpdate` no soporta `es_activo`.
- **Ver inactivos**: no hay toggle ni soporte en `listDepartamentos` para `solo_activos`.

### 4) Provincias

1. **Página afectada**: `src/features/super-admin/catalogos/pages/ProvinciasPage.tsx`
2. **Tabla afectada**: tabla principal (hoy: Código, Nombre, Departamento, Acciones)
3. **Modal afectado**:
   - Create/Edit sin checkbox Activo
   - Confirmación: `ConfirmDialog` “Eliminar provincia”
4. **Servicio afectado**: `src/core/services/catalogos.service.ts`
   - `listProvincias({ departamento_id? })`, `updateProvincia`, `deleteProvincia`
5. **DTO/Type afectado**: `src/types/catalogos.types.ts`
   - `CatProvincia*` (**sin** `es_activo`)

Brechas:
- Igual que Departamentos: falta `es_activo` en types/UI, copy “Eliminar”, no hay reactivar visible, no hay `solo_activos` en list.

### 5) Distritos

1. **Página afectada**: `src/features/super-admin/catalogos/pages/DistritosPage.tsx`
2. **Tabla afectada**: tabla principal (hoy: Código, Nombre, Ubigeo, Provincia, Acciones)
3. **Modal afectado**:
   - Create/Edit sin checkbox Activo
   - Confirmación: `ConfirmDialog` “Eliminar distrito”
4. **Servicio afectado**: `src/core/services/catalogos.service.ts`
   - `listDistritos({ provincia_id? })`, `updateDistrito`, `deleteDistrito`
5. **DTO/Type afectado**: `src/types/catalogos.types.ts`
   - `CatDistrito*` (**sin** `es_activo`)

Brechas:
- Igual que Departamentos/Provincias: falta `es_activo` en types/UI, copy “Eliminar”, no hay reactivar visible, no hay `solo_activos` en list.

---

## Inconsistencias visuales actuales entre catálogos (solo frontend)

1) **Columna Activo**
- **Sí existe**: Países, Monedas
- **No existe**: Departamentos, Provincias, Distritos

2) **Checkbox Activo en Create/Edit**
- **Sí existe**: Países, Monedas
- **No existe**: Departamentos, Provincias, Distritos

3) **Acción de “Eliminar”**
- Presente en **todos** (ConfirmDialog “Eliminar …” + Trash2), pero su semántica es ambigua vs contrato nuevo (DELETE=desactivar).

4) **Control para ver inactivos**
- No existe en ninguno como toggle/checkbox explícito.

---

## 1) Lista exacta de archivos Frontend a modificar (para cerrar UX-PLAT-P1-03)

### Tipos/DTOs
- `src/types/catalogos.types.ts`
  - Agregar `es_activo` a `CatDepartamento`, `CatProvincia`, `CatDistrito`
  - Agregar `es_activo` a `CatDepartamentoUpdate`, `CatProvinciaUpdate`, `CatDistritoUpdate` (y si corresponde a Create)

### Servicio
- `src/core/services/catalogos.service.ts`
  - Extender `catalogosGlobalService.listDepartamentos/listProvincias/listDistritos` para aceptar y enviar `solo_activos`
  - Alinear semántica de `delete*` (a nivel copy/uso; el método puede mantenerse, pero su uso UI debe tratarlo como “desactivar”)
  - Confirmar que `updateDepartamento/updateProvincia/updateDistrito` puede transportar `es_activo` (requiere types arriba)

### UI (páginas)
- `src/features/super-admin/catalogos/pages/PaisesPage.tsx`
- `src/features/super-admin/catalogos/pages/MonedasPage.tsx`
- `src/features/super-admin/catalogos/pages/DepartamentosPage.tsx`
- `src/features/super-admin/catalogos/pages/ProvinciasPage.tsx`
- `src/features/super-admin/catalogos/pages/DistritosPage.tsx`

### (Componente usado, no necesariamente a modificar)
- `src/shared/components/ui/ConfirmDialog.tsx` (ya soporta `loading` y variantes; solo se tocaría si se necesita un patrón adicional, pero no es requisito para el cierre).

---

## 2) Clasificación por prioridad (impacto para cierre completo)

### P0 — Bloqueantes para poder implementar Reactivar/Ver inactivos coherente
- `src/types/catalogos.types.ts`
  - Sin `es_activo` en Departamentos/Provincias/Distritos no se puede mostrar estado ni decidir acción Desactivar/Reactivar en UI.
- `src/core/services/catalogos.service.ts`
  - Sin `solo_activos` en list* de Departamentos/Provincias/Distritos, no se puede implementar toggle “ver inactivos” de forma uniforme.

### P1 — Cierre UX-PLAT-P1-03 (UI/Copy/Acciones)
- Todas las páginas `src/features/super-admin/catalogos/pages/*Page.tsx`
  - Reemplazar “Eliminar” → “Desactivar” (y cambiar toast/mensaje asociado).
  - Exponer acción visible de “Reactivar” cuando el registro está inactivo (según `es_activo`).
  - Agregar control para ver inactivos (toggle/checkbox) que invierta `solo_activos`.
  - Mostrar estado Activo/Inactivo de forma consistente (columna o badge) en **todos** los catálogos.

### P2 — Consistencia fina (opcional, pero mejora la coherencia entre los 5)
- Homogeneizar:
  - orden/posición de columna “Activo”
  - labels (“Activo: Sí/No” vs badge)
  - tooltips y variantes visuales (danger para desactivar, success/info para reactivar)
  - comportamiento cuando `es_activo` venga `null/undefined` (fallback visual)

---

## 3) Propuesta de implementación mínima (sin soluciones nuevas; solo lo mínimo para “cerrar” UX-PLAT-P1-03)

> “Mínima” aquí significa: mismo layout general, mismos componentes, sin refactor transversal; solo agregar lo imprescindible para (a) consumir `es_activo`, (b) permitir ver inactivos, (c) cambiar “Eliminar” a “Desactivar” y (d) exponer “Reactivar”.

### Paso 0 (P0) — Contrato FE: types + servicio
- Actualizar `src/types/catalogos.types.ts` para incluir `es_activo` en Departamentos/Provincias/Distritos (entity + update).
- Actualizar `src/core/services/catalogos.service.ts` para:
  - Aceptar `solo_activos?: boolean` en `listDepartamentos/listProvincias/listDistritos` y enviarlo como query param.
  - Permitir que `updateDepartamento/updateProvincia/updateDistrito` acepte `es_activo` (una vez types lo permitan).

### Paso 1 (P1) — UI: estado, toggle “ver inactivos”, acciones Desactivar/Reactivar
Aplicar patrón consistente a las 5 páginas:
- Mostrar estado Activo/Inactivo en tabla (columna “Activo” o badge).
- Agregar control en toolbar para alternar `solo_activos` (por defecto true/activos).
- Reemplazar acción “Eliminar” por:
  - “Desactivar” cuando `es_activo === true`
  - “Reactivar” cuando `es_activo === false`
- ConfirmDialog:
  - títulos/mensajes/botones coherentes con desactivación lógica
- Ajustar toasts de éxito para reflejar desactivar/reactivar (no “eliminado”).

### Paso 2 (P2) — Pulido de consistencia entre catálogos
- Alinear microcopy y estilos entre Países/Monedas (ya tienen “Activo”) y el resto.

---

## Determinación final (impacto para “solo FE” vs “requiere ampliar contrato”)

Con el backend ya alineado (y dado que el FE hoy no consume `es_activo` ni `solo_activos` en 3/5 catálogos), **el cierre completo de UX-PLAT-P1-03 requiere cambios en Frontend** en:

- **P0**: types + service (para poder consumir el contrato nuevo en Departamentos/Provincias/Distritos).
- **P1**: UI (acciones + estado + toggle).

No se observa necesidad de ampliar backend **adicionalmente** (según el contrato que indicaste), pero el FE actualmente no está preparado para consumirlo en 3 catálogos.

