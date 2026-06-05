# PLATFORM_ACTIVE_SURFACE_AUDIT.md

Auditoría de vigencia de hallazgos UX/UI/Arquitectura para **Platform Administration (Super Admin)**, re-evaluada contra la **superficie funcional accesible desde el menú dinámico real** (DB).

## Normativa aplicada (referencia)

- Fuente normativa única: `ERP_FRONTEND_STANDARDS_V2.md`
- En particular: §9.4 Platform (**PL-01…PL-04**), **ER-02**, **UX-01/UX-02**, **B.1.1 (B11-xx)**, **ES-01**, **SK-01**, **TB-xx**.

## Superficie activa declarada (menú Platform actual)

Pantallas actualmente accesibles desde navegación real:

- Dashboard → `/super-admin/dashboard`
- Gestión de Clientes → `/super-admin/clientes` (y por flujo: detalle `/super-admin/clientes/:id`)
- Módulos del Sistema → `/super-admin/modulos`
- Auditoría Global → **no evidenciable por routing actual** (ver “Requiere validación manual”)
- Países → `/super-admin/catalogos/paises`
- Departamentos → `/super-admin/catalogos/departamentos`
- Provincias → `/super-admin/catalogos/provincias`
- Distritos → `/super-admin/catalogos/distritos`
- Monedas → `/super-admin/catalogos/monedas`

Pantallas Platform existentes por routing pero **no listadas** en el menú activo declarado (potencial legacy / no usadas):

- Gestión de Secciones → `/super-admin/secciones`
- Gestión de Menús → `/super-admin/menus`
- Plantillas de Roles → `/super-admin/plantillas-roles`
- Vista Jerárquica → `/super-admin/vista-jerarquica`

> Nota: la auditoría previa se basó en routing (`src/features/super-admin/routes.tsx`). Este documento **no asume** que todo lo routeado esté “en uso”; usa el menú activo declarado como referencia principal.

---

## Hallazgo: PLAT-UX-01 — Vocabulario “Eliminar” vs naturaleza de la acción (baja lógica vs borrado)

### 1) Pantallas afectadas

- **Confirmado (mismatch observable en Frontend)**:
  - `/super-admin/menus` (Gestión de menús): UI usa “Eliminar” pero el servicio llama a endpoint de **desactivación** (`deactivateMenuItem` → `/desactivar/`).
- **Potencialmente afectadas (depende de si el backend hace borrado físico o soft delete)**:
  - `/super-admin/catalogos/paises`
  - `/super-admin/catalogos/departamentos`
  - `/super-admin/catalogos/provincias`
  - `/super-admin/catalogos/distritos`
  - `/super-admin/catalogos/monedas`

### 2) ¿La pantalla sigue activa en navegación actual?

- `/super-admin/menus`: **No** (no está en el menú activo declarado).
- Catálogos (países/departamentos/provincias/distritos/monedas): **Sí** (están en el menú activo declarado).

### 3) ¿Parece legacy/no utilizada?

- `/super-admin/menus`: **Sí, probablemente legacy/no usada** respecto a superficie activa (no navega desde menú actual).
- Catálogos: **No** (son parte de la navegación activa declarada).

### 4) Impacto real sobre usuarios Platform

- En **catálogos activos**:
  - Si el backend implementa **baja lógica**: usar “Eliminar” en UI genera **riesgo de incumplimiento normativo (UX-01/UX-02)** y expectativa incorrecta (pensar que se borra definitivamente).
  - Si el backend implementa **borrado físico real**: el copy “Eliminar” **podría ser correcto**; el hallazgo no aplica.
- En **menús (no activos)**:
  - Impacto **bajo** en usuarios reales si la pantalla no es accesible desde navegación.

### 5) Clasificación final

- **Vigente**: **solo para catálogos activos, pero requiere validar la naturaleza real de la operación**.
- **Solo legacy**: `/super-admin/menus` (si efectivamente no está accesible desde el menú dinámico actual).
- **Requiere validación manual**:
  - Determinar para cada catálogo global si “Eliminar” es borrado físico o baja lógica (no demostrable solo con Frontend porque el uso de `DELETE` no lo distingue).

**Resultado resumido**: **Requiere validación manual** (por depender de catálogos activos), con un subcaso **Solo legacy** para `/super-admin/menus`.

---

## Hallazgo: PLAT-UX-02 — `window.confirm` en acciones críticas (en lugar de ConfirmDialog)

### 1) Pantallas afectadas

- `/super-admin/clientes` (Gestión de clientes): desactivación de cliente usa `window.confirm`.

### 2) ¿La pantalla sigue activa en navegación actual?

- **Sí** (está en el menú activo declarado).

### 3) ¿Parece legacy/no utilizada?

- **No** (superficie activa principal).

### 4) Impacto real sobre usuarios Platform

- Experiencia inconsistente respecto a otras pantallas Platform que sí usan `ConfirmDialog` (p. ej. catálogos).
- Accesibilidad/estilo/consistencia del sistema de diseño puede degradarse en confirmaciones nativas.
- No es un bloqueo funcional, pero sí afecta coherencia y UX de acciones sensibles.

### 5) Clasificación final

- **Vigente** (pantalla activa; impacto directo).

---

## Hallazgo: PLAT-UX-03 — Empty states / Skeletons no estandarizados (ES-01 / SK-01), aplicado a Platform como SHOULD (PL-04)

### 1) Pantallas afectadas

En la superficie activa declarada, se observa patrón “spinner + empty artesanal” en:

- `/super-admin/modulos` (Módulos del sistema)
- `/super-admin/clientes` (Gestión de clientes)
- Catálogos:
  - `/super-admin/catalogos/paises`
  - `/super-admin/catalogos/departamentos`
  - `/super-admin/catalogos/provincias`
  - `/super-admin/catalogos/distritos`
  - `/super-admin/catalogos/monedas`

### 2) ¿La pantalla sigue activa en navegación actual?

- **Sí** (todas las anteriores están en el menú activo declarado).

### 3) ¿Parece legacy/no utilizada?

- **No** (superficie activa principal).

### 4) Impacto real sobre usuarios Platform

- **Consistencia**: variaciones de empty/skeleton entre pantallas activas.
- **Calidad percibida**: loaders y empty states inconsistentes impactan confianza en operaciones administrativas.
- **Normativa**: en V2, §9.4 Platform sugiere reutilizar (`PL-04` = SHOULD), por lo que el impacto es más de consistencia/estándar que de incumplimiento “duro”.

### 5) Clasificación final

- **Vigente** (pantallas activas; impacto visible).

---

## Hallazgo: PLAT-UX-04 — B.1.1 (discard) ausente en modales multi-campo Platform (PL-03 = SHOULD)

### 1) Pantallas afectadas

En la superficie activa declarada, hay modales extensos con alta probabilidad de “dirty close”:

- `/super-admin/clientes`
  - `CreateClientModal` (multisección)
  - `EditClientModal` (multisección)
- `/super-admin/modulos`
  - `CreateModuleModal`, `EditModuleModal` (según implementación; modales presentes)
- (Posible) Conexiones dentro del detalle de cliente (`/super-admin/clientes/:id`, tab Conexiones) con modales create/edit.

### 2) ¿La pantalla sigue activa en navegación actual?

- **Sí**: Gestión de clientes y módulos están en el menú activo declarado.
- **Detalle de cliente** (`/super-admin/clientes/:id`) es flujo natural desde “Gestión de clientes”.

### 3) ¿Parece legacy/no utilizada?

- **No** (superficie activa principal).

### 4) Impacto real sobre usuarios Platform

- Riesgo de pérdida de cambios en formularios largos (operaciones sensibles de plataforma: tenant, branding, auth-mode, conexiones).
- Impacto aumenta con formularios multisección/wizard.
- Normativamente en V2 esto es **SHOULD** para Platform (**PL-03**), por lo que es “calidad/seguridad UX” recomendada, no necesariamente “bloqueo”.

### 5) Clasificación final

- **Vigente** (pantallas activas; impacto real probable).

---

## Hallazgo: PLAT-ARC-04 — ER-02 (toast error solo en hook `onError`) y arquitectura mixta en Platform

### 1) Pantallas afectadas

En superficie activa declarada hay `toast.error` emitidos desde componentes (no desde hooks):

- `/super-admin/modulos` (ModuleManagementPage)
- `/super-admin/clientes/:id` (ClientDetailPage)
- Catálogos:
  - `/super-admin/catalogos/paises`
  - `/super-admin/catalogos/departamentos`
  - `/super-admin/catalogos/provincias`
  - `/super-admin/catalogos/distritos`
  - `/super-admin/catalogos/monedas`

Y simultáneamente existe arquitectura Platform donde el toast de error vive en hooks de mutación (sí alineada con ER-02):

- Mutaciones de clientes: `useClienteMutations.ts` usa `useMutation(... onError → toast.error ...)`.

### 2) ¿La pantalla sigue activa en navegación actual?

- **Sí** (módulos, clientes, catálogos).

### 3) ¿Parece legacy/no utilizada?

- **No** (superficie activa principal).

### 4) Impacto real sobre usuarios Platform

- **Consistencia y control**: diferentes estrategias de error handling por pantalla (algunas centralizadas en hooks, otras en UI).
- **Riesgo de duplicación**: si una pantalla migra a hooks con `onError` pero conserva `toast.error` en UI, puede aparecer doble toast (exactamente lo que ER-02 busca evitar).
- **Observación crítica**: desde este repo se puede demostrar “arquitectura mixta”, pero **no** se puede demostrar al 100% que Platform adoptó ER-02 como mandato global para todas las pantallas (depende de decisión normativa de aplicar ER-02 transversal a Platform, o permitir excepciones Platform).

### 5) Clasificación final

- **Requiere validación manual**:
  - Validar si ER-02 se aplica a Platform como regla transversal (normativa) o si Platform admite excepción documentada.
  - Validar si actualmente se observan toasts duplicados en runtime (solo observable ejecutando UI / QA).

---

## Auditoría Global (menú activo declarado) — estado

El menú activo incluye “Auditoría Global”, pero en el routing de `/super-admin/*` revisado no aparece una ruta explícita dedicada a “Auditoría Global” (solo tab de auditoría dentro de detalle de cliente).

- **Clasificación**: **Requiere validación manual**
  - Confirmar si “Auditoría Global” redirige a una ruta existente (p. ej. `/super-admin/dashboard` con widget) o si es un ítem de menú DB que apunta a una ruta aún no implementada.

---

## Resumen ejecutivo (por hallazgo)

- **PLAT-UX-01**: **Requiere validación manual** (vigente en catálogos activos solo si la operación es baja lógica; el caso “menús” parece **solo legacy** si no está en navegación).
- **PLAT-UX-02**: **Vigente** (clientes está activo; confirm nativo).
- **PLAT-UX-03**: **Vigente** (módulos/clientes/catálogos activos; consistencia SHOULD §9.4 PL-04).
- **PLAT-UX-04**: **Vigente** (modales largos en clientes/módulos; PL-03 SHOULD).
- **PLAT-ARC-04**: **Requiere validación manual** (arquitectura mixta demostrable; aplicabilidad estricta de ER-02 a Platform y duplicación real requieren verificación).

