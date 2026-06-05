# PLATFORM_MODAL_UX_AUDIT.md

**Tema:** Auditoría UX de modales — Platform Administration  
**Fecha:** 2026-06-02  
**Tipo:** Auditoría de ergonomía y usabilidad — **sin implementación, sin código, sin commits**  
**Referencias:** `PLATFORM_MODULES_IMPLEMENTATION_REPORT.md`, `PLATFORM_FINAL_SURFACE_AUDIT.md`, `ERP_FRONTEND_STANDARDS_V2.md` (§5.6 PA/PA+, §7 B11, §8 UX-03/04)

**Alcance:** Modales Create/Edit embebidos en listados activos de Clientes, Módulos y Catálogos globales (×5).  
**Fuera de alcance:** Detalle cliente (`/clientes/:id`), conexiones, auditoría tab, modales legacy fuera de superficie activa.

---

## 1. Resumen ejecutivo

| Superficie | Shell | Campos (aprox.) | Scroll | Footer accesible | B11 | Clasificación global |
|------------|-------|-----------------|--------|------------------|-----|----------------------|
| **Clientes** Create/Edit | Custom `max-w-4xl` | ~25–30 (4 secciones) | Cuerpo sí; footer **no** fijo | **Mejorable** (scroll para acciones en secciones largas) | ✅ | **Mejorable** — buen patrón secciones, deuda footer |
| **Módulos** Create/Edit | Custom `max-w-md` | ~9–10 | Panel completo | **Mejorable** en viewports bajos | ✅ (post PLAT-SURF-005) | **Adecuado** con ajustes menores |
| **Catálogos** ×5 | shadcn `Dialog` `max-w-lg` | 3–5 (+ FK jerárquicos) | `DialogBody` | ✅ Footer fijo (`flex-shrink-0`) | ❌ | **Adecuado** en layout; **mejorable** en descarte y UX-03/04 |

**Conclusión:** No existe un único patrón Platform de modal. **Catálogos** implementaron la mejor ergonomía de footer (header/body/footer con scroll acotado). **Clientes** priorizan organización por secciones (A+) pero el footer vive **dentro** del área desplazable. **Módulos** convergieron en B11 con Clientes pero conservan shell custom más estrecho y scroll monolítico.

El problema UX **más impactante y transversal** es la **accesibilidad del footer** en modales custom (Clientes y Módulos), no el ancho ni la cantidad de campos en Catálogos.

---

## 2. Inventario y baseline por modal

### 2.1 Clientes — `CreateClientModal` / `EditClientModal`

| Atributo | Create | Edit |
|----------|--------|------|
| Ancho | `max-w-4xl` (~896px) | Igual |
| Alto | `max-h-[90vh]`, `flex flex-col` | Igual |
| Navegación | 4 secciones (Básica, Config, Branding, Suscripción) + barra progreso (solo Create) | 4 tabs; sin barra progreso |
| Campos visibles por paso | ~6–12 según sección | Similar |
| Scroll | `form.flex-1.overflow-y-auto` | Igual |
| Footer | Dentro del `<form>` scrolleable; `border-t bg-subtle` | Igual |
| Acciones | Cancelar, Siguiente (pasos 1–3), Crear/Guardar (último paso) | Igual |
| B11 | `useClienteModalDiscard` + `OrgDiscardConfirmDialog` | Igual |
| `pageActionsLocked` | Sí (página) | Sí |

**Clasificación tamaño:** **Adecuado** en ancho (V2 **A+**, PA+-01). **Mejorable** en altura efectiva por densidad de ayudas (`text-xs`) y sub-bloques (p. ej. sincronización, branding URLs).

### 2.2 Módulos — `CreateModuleModal` / `EditModuleModal`

| Atributo | Create | Edit |
|----------|--------|------|
| Ancho | `max-w-md` (~448px) | Igual |
| Alto | `max-h-[90vh]` en contenedor con `overflow-y-auto` **global** | Igual |
| Secciones | Una sola columna | Igual |
| Campos | código, nombre, descripción, icono (`IconSelector`), color (×2 inputs), categoría, orden, `es_activo` | Igual |
| Scroll | Todo el panel (header + form + footer) | Igual |
| Footer | Al final del formulario, no sticky | Igual |
| B11 | `useModuloModalDiscard` (post PLAT-SURF-005) | Igual |

**Clasificación tamaño:** **Adecuado** para patrón **A** (maestro simple). **Mejorable** si `IconSelector` despliega menú largo en viewport bajo (riesgo de solapamiento, no de ancho fijo).

### 2.3 Catálogos — Dialog inline en cada `*Page.tsx`

Patrón homogéneo en Países, Departamentos, Provincias, Distritos, Monedas:

| Atributo | Valor típico |
|----------|----------------|
| Componente | `Dialog` + `DialogContent` `max-w-lg max-h-[90vh] flex flex-col gap-0 p-0` |
| Cuerpo | `DialogBody` → `min-h-0 flex-1 overflow-y-auto` |
| Footer | `DialogFooter` `flex-shrink-0 border-t` |
| Campos | 3–5 (+ select FK en jerárquicos) |
| Cierre | `onOpenChange` / botón Cancelar **sin** confirmación dirty |
| B11 | No implementado |
| `pageActionsLocked` | No (solo bloqueo implícito si `ConfirmDialog` activo en tabla) |

**Clasificación tamaño:** **Adecuado** (patrón **A**, no A+).

---

## 3. Análisis por eje

### 3.1 Tamaño de modales

| ID | Superficie | Hallazgo | Clasificación | Severidad |
|----|------------|----------|---------------|-----------|
| **MODAL-UX-001** | Clientes | `max-w-4xl` + secciones por tab reducen carga cognitiva por pantalla; alineado con **A+** (PA+-01). | Adecuado | — |
| **MODAL-UX-002** | Clientes | Secciones **Config** y **Branding** concentran campos condicionales y textos de ayuda largos; en laptops ≤768px altura útil puede forzar scroll antes del footer. | Mejorable | Media |
| **MODAL-UX-003** | Módulos | `max-w-md` es correcto para ~10 campos; columna única legible. | Adecuado | — |
| **MODAL-UX-004** | Módulos | `overflow-y-auto` en el **contenedor raíz** hace que el header también se desplace al hacer scroll; menor orientación espacial que Catálogos. | Mejorable | Baja |
| **MODAL-UX-005** | Catálogos | `max-w-lg` + pocos campos: rara necesidad de scroll; layout reserva 90vh correctamente. | Adecuado | — |
| **MODAL-UX-006** | Catálogos / Distritos | 4 campos incl. ubigeo — el más “lleno” del grupo; sigue sin clasificar como excesivo. | Adecuado | — |

**Excesivo:** ningún modal del alcance califica como **Excesivo** en dimensiones; el volumen de Clientes está mitigado por secciones, no por un único scroll infinito.

---

### 3.2 Footer y acciones

| ID | Superficie | Hallazgo | Beneficio esperado | Riesgo regresión |
|----|------------|----------|-------------------|------------------|
| **MODAL-UX-010** | Clientes | Footer (Cancelar / Siguiente / Crear) está **dentro** de `form.overflow-y-auto`. En secciones altas (Branding, Suscripción) el usuario debe **desplazarse** para ver acciones primarias. | Alto — reduce abandono y errores (“¿dónde guardo?”) | **Medio** — requiere reestructurar DOM (`flex` + footer fuera del scroll); **puede afectar B11** si el handler de overlay no distingue zonas; **no afecta ConfirmDialog** de tabla |
| **MODAL-UX-011** | Módulos | Mismo anti-patrón: footer al final del form dentro de panel con scroll global. En 1080p suele ser visible; en 768p con teclado virtual o zoom 125% → **mejorable**. | Medio | **Bajo–Medio** — cambio estructural local; **compatible con B11** si se mantiene `handleRequestClose` en botones |
| **MODAL-UX-012** | Catálogos | `DialogFooter` fijo con `flex-shrink-0` — **referencia Platform** para ergonomía. Cancelar/Guardar siempre visibles. | Ya materializado | **Bajo** si solo se replica patrón |
| **MODAL-UX-013** | Clientes | Footer muestra varios botones “← Anterior” (uno por índice de sección en el map); solo el primero está deshabilitado — ruido visual y affordance confusa. | Medio — claridad de navegación | **Bajo** — solo markup; **no afecta dirty** |
| **MODAL-UX-014** | Clientes | CTA primario de Create solo en última sección (“Crear Cliente”); pasos intermedios solo “Siguiente”. Usuario puede saltar tabs sin validar paso actual (tabs clicables). | Medio — alinear expectativa guardado vs exploración | **Medio** si se añade validación por paso (cambia flujo); **Bajo** si solo copy/ayuda |

**Footer sticky — dictamen:**

| Pregunta | Respuesta |
|----------|-----------|
| ¿Beneficio real? | **Sí**, en Clientes (prioridad) y Módulos (secundario). |
| ¿Riesgo de regresión? | **Medio** en Clientes por acoplamiento form+footer+secciones+B11; **Bajo** en Módulos. |
| ¿Afecta B11? | **Puede**, si el scroll container o `shellVisible` no se actualiza; mitigable manteniendo handlers actuales. |
| ¿Afecta dirty? | **No**, si solo se mueve el footer. |
| ¿Afecta `pageActionsLocked`? | **No**. |

---

### 3.3 Organización de contenido

| ID | Superficie | Hallazgo | Severidad | Recomendación |
|----|------------|----------|-----------|---------------|
| **MODAL-UX-020** | Clientes | Agrupación por dominio (básico / técnico / marca / suscripción) es **correcta** y acorde a negocio. | — | Mantener |
| **MODAL-UX-021** | Clientes | **Suscripción** mezcla plan, fechas trial y checkbox **“Cliente activo”** — información de ciclo de vida + flag operativo en mismo bloque que ya se gestiona en listado (UX-04). Ocupa espacio principal y confunde prioridad. | Media | Mover baja lógica solo a tabla (estándar V2); no cambiar reglas de API |
| **MODAL-UX-022** | Clientes | **Config**: bloque “Sincronización multi-instalación” con API key es **secundario** para mayoría de altas; campos condicionales bien ubicados pero densos. | Baja | Considerar `<details>` o sub-sección colapsada (opcional) |
| **MODAL-UX-023** | Módulos | Orden lógico (identidad → presentación → clasificación → orden → estado). Texto “Módulo Activo” + párrafo explicativo en pie del form — redundante con toggle de listado. | Media | Alinear UX-03/04 (quitar checkbox del modal) |
| **MODAL-UX-024** | Catálogos | Formularios mínimos; jerarquía FK (país → depto → prov) en un solo paso — **adecuado** para catálogo maestro. | — | Mantener |
| **MODAL-UX-025** | Catálogos | Checkbox **Activo** en create/edit Países/Monedas (PLAT-SURF-010) — duplica acción de tabla; ocupa línea principal. | Media | Quitar del modal (estándar); beneficio claridad operativa |

---

### 3.4 Wizard / Tabs / Secciones

| ID | Superficie | Hallazgo | Severidad |
|----|------------|----------|-----------|
| **MODAL-UX-030** | Clientes Create | 4 pasos + barra de progreso: **balance aceptable** (~6–10 campos/paso). No es wizard estricto (libre navegación entre tabs). | Baja |
| **MODAL-UX-031** | Clientes Edit | Mismas 4 secciones **sin** barra de progreso — inconsistencia Create vs Edit. | Baja |
| **MODAL-UX-032** | Clientes | “Siguiente” no valida el paso actual; usuario puede llegar a Suscripción con errores en Básica. | Media |
| **MODAL-UX-033** | Clientes | Cambio de sección **no** dispara discard (correcto según B11 y requisito de negocio). | — |
| **MODAL-UX-034** | Módulos | Sin tabs — apropiado para **A**; no requiere wizard. | — |
| **MODAL-UX-035** | Catálogos | Sin tabs — apropiado. | — |

**Sobrecarga visual:** solo Clientes Create (tabs + progreso + footer dual navegación). **Mejorable**, no **Excesivo**.

---

### 3.5 Consistencia Platform

| Dimensión | Clientes | Módulos | Catálogos |
|-----------|----------|---------|-----------|
| Sistema UI | Custom overlay | Custom overlay | Radix `Dialog` shadcn |
| Ancho típico | `4xl` | `md` | `lg` |
| Footer fijo | No | No | **Sí** |
| Secciones / tabs | **Sí** (4) | No | No |
| B11 discard | **Sí** | **Sí** | **No** |
| UX-03/04 `es_activo` en modal | Edit (y lógica suscripción) | Create + Edit | Países, Monedas |
| CTA primario | Crear / Guardar | Crear / Guardar | Crear / Guardar |
| Botones secundarios | `brand-secondary` Cancelar | Igual | `outline` shadcn |

**Veredicto:** **No hay patrón Platform único.** La referencia operativa más madura para **ergonomía de shell** es **Catálogos** (`DialogBody`/`DialogFooter`). La referencia para **formularios extensos + B11** es **Clientes** (secciones + discard). **Módulos** quedó alineado en B11 con Clientes pero no en layout de dialog.

Esto coincide con PLAT-SURF-009 (`PLATFORM_FINAL_SURFACE_AUDIT.md`): dos linajes evolutivos, no divergencia de negocio.

---

## 4. Matriz de hallazgos consolidada

| ID | Eje | Severidad | Beneficio | Riesgo | Impacto B11 / dirty / confirm / lock |
|----|-----|-----------|-----------|--------|--------------------------------------|
| MODAL-UX-010 | Footer Clientes | **Alta** | Alto | Medio | B11: cuidado DOM; dirty: no; ConfirmDialog: no; lock: no |
| MODAL-UX-011 | Footer Módulos | Media | Medio | Bajo | B11: compatible; dirty: no |
| MODAL-UX-012 | Footer Catálogos (positivo) | — | Referencia | — | — |
| MODAL-UX-013 | Footer Anterior duplicado | Baja | Medio | Bajo | Ninguno |
| MODAL-UX-014 | Wizard sin validación por paso | Media | Medio | Medio | dirty: no; cambiar flujo si se valida por paso |
| MODAL-UX-021 | `es_activo` Clientes Edit | Media | Medio | Bajo | dirty: reduce campos; ConfirmDialog tabla: no |
| MODAL-UX-023 | `es_activo` Módulos | Media | Medio | Bajo | dirty: ya excluido en create; edit sí |
| MODAL-UX-025 | `es_activo` Catálogos | Media | Medio | Bajo | UX-03/04 |
| MODAL-UX-040 | Catálogos sin B11 | **Alta** (pérdida datos) | Alto | Medio | **Afecta B11**; overlay Radix cierra sin confirm; lock: no hoy |
| MODAL-UX-004 | Header scroll Módulos | Baja | Bajo | Bajo | No |
| MODAL-UX-031 | Progreso solo Create | Baja | Bajo | Bajo | No |

---

## 5. Cierre — Recomendaciones

### 5.1 Mejoras recomendadas inmediatamente

1. **Footer fijo en Clientes (Create + Edit)** — Sacar la barra de acciones del `overflow-y-auto` y fijarla al pie del shell (`flex-shrink-0`), manteniendo el scroll solo en el cuerpo de sección.  
   - **Beneficio:** acceso permanente a Cancelar / Siguiente / Guardar.  
   - **Riesgo:** Medio.  
   - **B11:** Aplicable sin cambiar reglas de descarte si los botones conservan `handleRequestClose`.

2. **Replicar patrón Catálogos en Módulos** — Misma estructura: contenedor `flex flex-col`, cuerpo scroll, footer fijo (sin migrar a Radix obligatoriamente).  
   - **Riesgo:** Bajo.  
   - **B11:** Sin impacto en dirty tracking.

3. **Eliminar checkbox `es_activo` / “Activo” de modales** donde el listado ya expone Desactivar/Reactivar (Módulos, Catálogos Países/Monedas, Clientes Edit — UX-03/04).  
   - **Beneficio:** menos ruido y una sola vía operativa coherente con Platform.  
   - **Riesgo:** Bajo (comportamiento de baja ya cubierto en tabla).  
   - **Nota:** Es alineación estándar, no cosmética.

4. **Simplificar navegación “Anterior” en footer Clientes** — Un solo botón Anterior vinculado a la sección previa.  
   - **Riesgo:** Bajo.

### 5.2 Mejoras opcionales

1. **B11 en Catálogos** — `OrgDiscardConfirmDialog` + dirty mínimo por entidad (3–5 campos). Alto beneficio anti pérdida accidental; riesgo medio por `onOpenChange` de Radix y cinco páginas duplicadas. Afecta **B11**; no **ConfirmDialog** de tabla.

2. **`pageActionsLocked` en Catálogos** mientras `discardPending` o modal submit — alinear TB-05/B11-03 con Clientes/Módulos.

3. **Barra de progreso en Edit Cliente** o eliminarla en Create — consistencia Create/Edit (riesgo bajo).

4. **Hint de validación al “Siguiente”** — mensaje toast o inline si faltan requeridos en paso actual, sin bloquear cambio de tab (riesgo medio si se endurece).

5. **Ancho Módulos `max-w-md` → `max-w-lg`** — solo si pruebas muestran cortes en `IconSelector` (riesgo bajo, beneficio bajo).

6. **Convergencia visual gradual** — adoptar `Dialog`/`DialogBody`/`DialogFooter` en custom modales manteniendo B11 hooks (riesgo medio; beneficio mantenimiento + UX).

### 5.3 Mejoras que NO se recomienda realizar

1. **Reescritura completa** de `CreateClientModal` / `EditClientModal` (p. ej. nuevo wizard de 4 pasos secuenciales obligatorios). Riesgo alto de regresión B11, validación subdominio y flujos ya validados.

2. **Migración masiva** de todos los modales Platform a otro sistema (Headless UI distinto, drawer full-screen, rutas dedicadas `/nuevo`). Incumple restricción de no replantear arquitectura; riesgo alto.

3. **Unificar Clientes y Módulos al ancho `max-w-md`** — degradaría legibilidad del formulario A+ de Clientes sin beneficio.

4. **Convertir Clientes en wizard con pasos bloqueantes** (no avanzar sin guardar paso intermedio) — cambia modelo mental y soporte; riesgo alto en dirty snapshot global.

5. **Cambios cosméticos aislados** (solo colores, radios, tipografía) sin footer fijo ni limpieza de campos redundantes — beneficio UX marginal.

6. **Tabs adicionales en Módulos o Catálogos** — el volumen de campos no lo justifica (CL-03 / patrón A).

7. **Eliminar secciones en Clientes** y volcar todo en un solo scroll — empeora carga cognitiva; contradice clasificación A+ ya acertada.

---

## 6. Referencia cruzada con auditorías previas

| Hallazgo previo | Relación con esta auditoría |
|-----------------|----------------------------|
| PLAT-SURF-005 / REPORT PLAT-SURF-005 | B11 Módulos **cerrado** — esta auditoría no reabre funcionalidad; solo layout footer. |
| PLAT-SURF-009 | Dos shells — confirmado; recomendación opcional #6 converge sin migración forzada. |
| PLAT-SURF-010 / 011 | Coincide con MODAL-UX-021, 023, 025 (organización / estándar UX-03/04). |
| PA+-01 / B11-09 | Clientes = A+ con dirty global; cambio de sección sin discard es **correcto**. |

---

## 7. Nota metodológica

La evaluación se basó en **estructura DOM y clases** de los componentes en repositorio (altura `90vh`, contenedores `overflow`, presencia de `DialogFooter`, número de campos y secciones), cruzado con estándares V2. No se ejecutó sesión visual en navegador en esta entrega; las clasificaciones de scroll en viewports bajos son **inferencia de patrón**, prioritaria en Clientes footer (MODAL-UX-010).

---

*Fin del documento — sin código, sin repair, sin commits.*
