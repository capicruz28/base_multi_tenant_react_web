# PLATFORM_ACTIVE_UX_REVIEW.md

Auditoría UX manual enfocada **exclusivamente** en la superficie **activa** actual de Platform Administration (Super Admin), según menú real:

- Dashboard (`/super-admin/dashboard`)
- Clientes (`/super-admin/clientes`, `/super-admin/clientes/:id`)
- Módulos (`/super-admin/modulos`)
- Catálogos globales: Países/Departamentos/Provincias/Distritos/Monedas (`/super-admin/catalogos/*`)

## Marco normativo (referencia)

Fuente normativa única: `ERP_FRONTEND_STANDARDS_V2.md`  
Aplicación relevante: §9.4 Platform (PL-01…PL-04), **B.1.1 (§7, B11-xx / SEC-xx)** como referencia, **TB-xx / ES-xx / SK-xx**, **UX-01/UX-02**, **ER-02**.

> Importante: Platform no se asume Plantilla A/B. Cuando se cite ES/SK/TB/B11 se hace como **consistencia recomendada** o hardening UX, considerando PL-03/PL-04 (SHOULD).

---

## Observaciones por área (10 focos solicitados)

### 1) ConfirmDialog vs `window.confirm`

#### Hallazgo UX-PLAT-ACT-01 — Desactivación de Cliente usa `window.confirm`
- **Pantallas**: `Clientes` (`/super-admin/clientes`)
- **Prioridad**: **P1**
- **Impacto real**:
  - Inconsistencia visible: catálogos usan `ConfirmDialog` con estilo del sistema, pero clientes usa confirm nativo.
  - Riesgo de UX pobre en una acción sensible (desactivar tenant) y menor control de copy/estados loading.
- **Riesgo adicional**: confirm nativo no permite loading/disable coherente con mutación.

---

### 2) B.1.1 (discard changes / protección ante pérdida de cambios)

#### Hallazgo UX-PLAT-ACT-02 — Modales largos sin protección “dirty close”
- **Pantallas**:
  - `Clientes`: `CreateClientModal` y `EditClientModal` (multi-sección; muchos campos, incluyendo branding y configuración)
  - `Módulos`: modales create/edit (y flows similares)
  - Catálogos: modales create/edit (más cortos)
- **Prioridad**: **P1** (Clientes), **P2** (Módulos y Catálogos)
- **Impacto real**:
  - En Clientes, el costo de pérdida de cambios es alto (configuración de tenant / endpoints / branding / suscripción).
  - El riesgo aumenta por navegación por secciones: el usuario puede invertir tiempo sin “guardrails”.
- **Nota normativa**: en §9.4 Platform, B.1.1 para modales Platform es **SHOULD** (PL-03), pero el impacto operacional de Platform sugiere tratarlo como prioridad alta en Clientes.

---

### 3) Empty states

#### Hallazgo UX-PLAT-ACT-03 — Empty states implementados “ad hoc” y no homogéneos
- **Pantallas**:
  - `Clientes` (tabla con empty artesanal + CTA condicional)
  - `Módulos` (tabla/grid con empty artesanal)
  - Catálogos globales (mensaje “No hay …” vs “No hay resultados…” en una sola línea dentro de `<tbody>`)
- **Prioridad**: **P3**
- **Impacto real**:
  - No bloquea tareas, pero degrada consistencia y calidad percibida.
  - Mensajes no siempre distinguen claramente “sin datos” vs “sin resultados” con acciones sugeridas.

---

### 4) Skeletons (loading states)

#### Hallazgo UX-PLAT-ACT-04 — Loading predominantemente “spinner + texto”; ausencia de skeletons de tabla consistentes
- **Pantallas**:
  - `Clientes`: loading muestra spinner centrado dentro del contenedor; no skeleton por filas/columnas.
  - `Módulos`: idem (spinner).
  - Catálogos: idem (spinner).
- **Prioridad**: **P3**
- **Impacto real**:
  - Percepción de “latencia” mayor (no hay estructura anticipada de tabla).
  - Consistencia menor con módulos cerrados IAM/ORG/INV que usan skeletons estandarizados en listados (SK-01 como referencia).

---

### 5) Toolbars (layout, acciones, consistencia)

#### Hallazgo UX-PLAT-ACT-05 — Toolbars coherentes en estructura general, pero sin un patrón único de “acciones sensibles”
- **Pantallas**:
  - `Clientes`, `Módulos`, Catálogos globales: todas tienen “barra” con búsqueda + refresh + CTA.
- **Prioridad**: **P3**
- **Impacto real**:
  - Generalmente buena: búsqueda a la izquierda, acciones a la derecha.
  - Falta uniformidad en microcopy y affordances (p. ej. “Nuevo Cliente” vs “Nuevo País” vs “Nueva Moneda”).

---

### 6) Consistencia visual con IAM / ORG / INV

#### Hallazgo UX-PLAT-ACT-06 — Consistencia parcial: se mezclan patrones “custom Tailwind” y componentes UI (Radix)
- **Pantallas**:
  - Catálogos: usan `Dialog` (Radix) + `Button` (ui/button) + `ConfirmDialog` custom.
  - Clientes/Módulos: usan modales custom (div fixed overlay) y botones Tailwind directos.
- **Prioridad**: **P2**
- **Impacto real**:
  - El usuario percibe que Platform “no se ve igual” entre pantallas del mismo panel.
  - Riesgo de accesibilidad (manejo de focus/escape/overlay) disparejo por coexistencia de dos sistemas de modal.

---

### 7) Modales largos (diseño, navegación, scroll, ergonomía)

#### Hallazgo UX-PLAT-ACT-07 — Modales largos en Clientes: buena estructura por secciones, pero con riesgos de fatiga y salida accidental
- **Pantallas**: `Clientes` (crear/editar)
- **Prioridad**: **P1**
- **Impacto real**:
  - Positivo: secciones (basic/config/branding/subscription) reducen carga cognitiva.
  - Riesgos: sin B.1.1 + sin confirm consistente (ver Hallazgo 02) + footer con navegación no estándar.

---

### 8) Mensajes de error y éxito (toasts, banners, redundancias)

#### Hallazgo UX-PLAT-ACT-08 — Estrategia de feedback mixta (toasts en hooks y en páginas)
- **Pantallas**: `Clientes` (mixto), `Módulos`, Catálogos globales
- **Prioridad**: **P2**
- **Impacto real**:
  - Consistencia desigual: algunas acciones hacen toast en hook de mutación (clientes), otras en el componente.
  - Riesgo de duplicación futura si una pantalla migra parcialmente a hooks con `onError/onSuccess` sin retirar toasts en UI.
- **Nota**: esto afecta también “Arquitectura de errores” (ER-02), pero aquí se evalúa como experiencia de usuario.

---

### 9) Acciones destructivas (copy, severidad, seguridad de UX)

#### Hallazgo UX-PLAT-ACT-09 — “Eliminar” en catálogos globales sin distinguir irreversibilidad vs desactivación
- **Pantallas**: Países, Departamentos, Provincias, Distritos, Monedas
- **Prioridad**: **P1**
- **Impacto real**:
  - Alto riesgo de error humano si el usuario interpreta “Eliminar” como reversible o equivalente a “Desactivar”.
  - No se muestra (desde UI) información de reversibilidad, ni “soft delete vs hard delete”.
- **Nota**: sin backend no se puede afirmar si el delete es físico; UX requiere al menos clarificar alcance/irreversibilidad en confirmación.

---

### 10) Flujo completo de Clientes (principal + detalle)

#### Hallazgo UX-PLAT-ACT-10 — Flujo principal de Clientes es funcional, pero el detalle mezcla “dashboard-like UI” con acciones poco definidas
- **Pantallas**:
  - Lista: `/super-admin/clientes`
  - Detalle: `/super-admin/clientes/:id` con tabs Info/Módulos/Conexiones/Usuarios/Auditoría
- **Prioridad**: **P2**
- **Impacto real**:
  - Positivo: lista tiene paginación, filtros, CTA claro, navegación a detalle, activar/desactivar.
  - Detalle: botón “Editar” en header parece no ejecutar acción (no se ve handler en el componente del detalle), lo que puede generar fricción/confusión.
  - Acción “Entrar al ERP” (modo soporte): tiene affordances buenas (disabled si ya hay impersonación + tooltip), pero es una acción de alto riesgo operacional; su confirmación/guardrails no están claramente integrados en el flujo del detalle (más allá del banner global de modo soporte en shells tenant).

---

## Hallazgos priorizados (P0–P3) con impacto para usuarios Platform

### P0 (bloqueante / riesgo severo)

No se identificó un P0 estrictamente bloqueante en la UX activa (hay riesgos altos, pero no se demuestra pérdida de datos inevitable o fallo de seguridad UX “MUST” dentro de Platform por V2).

### P1 (alto impacto)

- **UX-PLAT-ACT-02**: Modales largos sin B.1.1/dirty guard (Clientes principalmente).
- **UX-PLAT-ACT-01**: `window.confirm` en desactivación de cliente (acción sensible).
- **UX-PLAT-ACT-09**: Acciones “Eliminar” en catálogos sin clarificar reversibilidad/alcance.
- **UX-PLAT-ACT-07**: Riesgo de salida accidental en modales largos (consecuencia práctica del 02, pero relevante para UX).

### P2 (impacto medio)

- **UX-PLAT-ACT-06**: Inconsistencia visual y de accesibilidad por mezcla de sistemas de modal/UI.
- **UX-PLAT-ACT-08**: Feedback mixto de mensajes éxito/error (riesgo de duplicación y experiencia desigual).
- **UX-PLAT-ACT-10**: Detalle de cliente con acción “Editar” poco clara + guardrails limitados en acciones de alto riesgo (modo soporte).

### P3 (cosmético / calidad percibida)

- **UX-PLAT-ACT-03**: Empty states ad hoc, copy no homogéneo.
- **UX-PLAT-ACT-04**: Skeletons ausentes; spinner predominante.
- **UX-PLAT-ACT-05**: Toolbars correctas pero sin estándar único de microcopy/acciones.

---

## Impacto global estimado sobre usuarios Platform (superficie activa)

- **Alta frecuencia**: Clientes y Catálogos (búsqueda, CRUD, confirmaciones, errores) → cualquier inconsistencia se siente diariamente.
- **Alto costo de error**: Clientes (desactivar tenant; configuración; conexiones; modo soporte) → requiere mejores guardrails (confirmación consistente + B.1.1 en modales largos + mensajes claros).
- **Percepción de producto**: mezcla de componentes UI y patrones de loading/empty → reduce “sensación de plataforma cerrada”, aunque no rompa funcionalidad.

