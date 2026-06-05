# Auditoría — Layout del banner “Modo soporte” vs sidebar / header / main

**Fecha:** 31 mayo 2026  
**Alcance:** Solo frontend.  
**Estado:** Auditoría y recomendación — **sin código, sin repair, sin commit**.

**Síntoma QA (complemento a** `PLATFORM_IMPERSONATION_BANNER_SHELL_AUDIT.md`**):**

- Con banner visible en `/app/*`, el **logo CAXIS** del sidebar queda **parcialmente cubierto** por el banner.
- Header y contenido principal parecen **desplazados hacia abajo**; el encabezado del sidebar **no**.
- Sensación de **capas desalineadas** (sidebar vs columna principal).

**Relacionado:** El banner solo se monta con `variant === 'app'` (auditoría shell); este documento analiza **geometría y stacking** cuando está visible.

---

## 1. Resumen ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿Es comportamiento intencional? | **No** — no hay documentación ni comentario que defina solapamiento del logo |
| Clasificación | **Bug UX de layout** (arquitectura inconsistente entre banner en flujo y sidebar `fixed`) |
| Causa raíz | Banner en **flujo documental** encima del row; sidebar **`position: fixed; top: 0`** anclado al viewport, no al hueco bajo el banner |
| ¿Header y main “correctos”? | **Relativamente sí** — viven en la columna que sí baja tras el banner |
| Comportamiento correcto esperado | Banner **ancho completo**; **sidebar + header + main** inician **debajo** del banner como una sola superficie de aplicación |
| Coherencia Modelo A | El indicador de soporte debe ser global al shell tenant, **sin tapar** el chrome lateral |

---

## 2. Árbol de layout actual (`NewLayout`)

### 2.1 Estructura DOM (simplificada)

```
div.flex.min-h-screen.flex-col          ← contenedor raíz columna
│
├── ImpersonationSupportBanner          ← hijo 1: EN FLUJO (sticky, z-60)
│
└── div.flex.min-h-0.flex-1             ← hijo 2: fila horizontal
    ├── NewSidebar                      ← fixed top-0 left-0 h-full z-30 (FUERA DE FLUJO)
    └── div.flex-1.flex.flex-col        ← columna principal (pl-16 / pl-64)
        ├── Header                      ← EN FLUJO, h-16
        ├── TopNavbar (opcional)
        └── main                        ← EN FLUJO, flex-1
```

**Archivo:** `src/shared/components/layout/NewLayout.tsx` L31–64.

### 2.2 Diagrama de capas (viewport)

```
┌─────────────────────────────────────────────────────────────┐
│ ImpersonationSupportBanner  sticky top-0  z-[60]  (flujo)   │ ← ancho 100% columna raíz
├──────────────┬──────────────────────────────────────────────┤
│ NewSidebar   │  Header (desplazado — debajo del banner)      │
│ fixed        │  ───────────────────────────────────────────  │
│ top: 0       │  main                                         │
│ z-30         │                                               │
│ ┌──────────┐ │                                               │
│ │ LOGO     │ │  ← solapado por banner (misma Y que banner)   │
│ │ (CAXIS)  │ │                                               │
│ └──────────┘ │                                               │
│  menú...     │                                               │
└──────────────┴──────────────────────────────────────────────┘
     ↑
     anclado a top del VIEWPORT, no a top del row flex
```

---

## 3. Interacción `ImpersonationSupportBanner` ↔ `NewLayout`

### 3.1 Banner

| Propiedad | Valor | Efecto |
|-----------|-------|--------|
| Posición en árbol | Primer hijo de columna raíz | Reserva **altura** en el flujo; empuja el `div.flex-1` inferior |
| CSS | `sticky top-0 z-[60]` | Al scroll del contenedor scrollable ancestro, se pega arriba; **por encima** del sidebar (z-30) |
| Ancho | Implícito 100% del padre columna | **Span completo** del layout (incluye zona visual del sidebar) |
| `flex-wrap` | Sí | Altura variable según texto / viewport |

**Archivo:** `ImpersonationSupportBanner.tsx` L19–23.

El banner **no** está dentro de la columna principal (`pl-64`); está **por encima** de toda la fila sidebar+main.

### 3.2 Columna principal (header + main)

| Elemento | Posicionamiento | Efecto con banner |
|----------|-----------------|-------------------|
| Wrapper `div.flex-1.flex-col` | Flujo normal + `pl-64`/`pl-16` | Comienza **debajo** del banner → header y main **bajan** (QA: “empuja header y main”) |
| `Header` | `h-16 flex-shrink-0`, sin `fixed` | Se mueve con la columna |
| `main` | `flex-1 min-h-screen` | Se mueve con la columna |

**Conclusión:** La percepción de que “header y main se desplazan” es **correcta** respecto al flujo documental.

### 3.3 Sidebar y cabecera del logo

| Elemento | Posicionamiento | Efecto con banner |
|----------|-----------------|-------------------|
| Contenedor `NewSidebar` | `fixed top-0 left-0 h-full z-30` | **Ignora** el espacio que ocupa el banner en el padre |
| Cabecera logo | `h-16` dentro del sidebar fijo | Queda en **Y = 0** del viewport → **misma franja vertical** que el banner |
| Toggle colapsar | `absolute top-16` | Referido al borde inferior del header del sidebar, no al banner |

**Archivo:** `NewSidebar.tsx` L627–683.

| Propiedad | Implicación |
|-----------|-------------|
| `fixed` | Sacado del flujo flex del `div.flex.flex-1` |
| `top-0` | Alineado al **borde superior de la ventana**, no al borde inferior del banner |
| `h-full` | Altura = 100% viewport, **sin** restar altura del banner |
| `z-30` < `z-60` | El banner **pinta encima** de la franja del logo |

**Conclusión:** El logo no se “desplaza”; el banner **se superpone** — encaja con “parcialmente cubierto”.

---

## 4. ¿Sidebar usa posición fija o cálculo independiente?

| Componente | Mecanismo | ¿Comparte offset con banner? |
|------------|-----------|------------------------------|
| **NewSidebar** (contenedor) | `position: fixed` | **No** |
| Logo / cabecera sidebar | Bloque normal dentro del fixed | **No** — hereda `top: 0` del sidebar |
| **Header** | Flujo en columna principal | **Sí** (indirectamente, vía padre debajo del banner) |
| **main** | Flujo en columna principal | **Sí** |
| **ImpersonationSupportBanner** | Flujo + `sticky` en columna raíz | N/A (referencia de offset) |

El `padding-left` (`pl-64` / `pl-16`) solo compensa el **ancho** del sidebar; **no** sincroniza la coordenada **vertical** con el banner.

**No es intencional** como patrón “banner solo sobre área de contenido”: el banner es hijo del ancho completo y el sidebar fue diseñado para ocupar `top: 0` en viewport **antes** del modo soporte.

---

## 5. Comportamiento correcto esperado (layout)

### 5.1 Principio (SaaS / Modelo A)

Cuando existe banner de soporte en shells tenant (`app` y, tras corrección shell, `admin`):

1. El banner es una **banda global** de alerta (ancho completo).
2. **Todo el chrome de aplicación** — sidebar incluido — comienza **inmediatamente debajo** del banner.
3. Sidebar, header y main comparten el mismo **origen vertical** (superficie única).
4. El botón “Salir del modo soporte” permanece visible sin ocultar marca del producto.

### 5.2 Opciones arquitectónicas (conceptuales)

| Opción | Descripción | Sidebar | Header/main | Logo |
|--------|-------------|---------|-------------|------|
| **A (recomendada)** | Banner fila 1; fila 2 = sidebar \| contenido en **grid/flex** sin `fixed top-0` en sidebar, o `fixed` con `top: var(--support-banner-h)` | Debajo del banner | Debajo del banner | Visible |
| **B** | Banner solo sobre columna `pl-64` (no sobre sidebar) | `top: 0` full height | Debajo del banner en su columna | OK | Banner no alineado a IMP-04 “modo soporte global” |
| **C** | Sidebar `fixed` + `padding-top` / `top` = altura banner vía CSS variable medida | Offset explícito | Ya OK en flujo | Visible |
| **D** | Banner `fixed top-0` full width + `padding-top` en `body`/root igual a altura banner | Offset explícito | Offset explícito | Visible |

**Recomendación:** **A o C** en `NewLayout` (único dueño del chrome). **C** es cambio mínimo si se mantiene sidebar fixed; **A** es más robusto a largo plazo (un solo layout grid).

### 5.3 Scroll

| Pieza | Comportamiento esperado |
|-------|-------------------------|
| Banner | `sticky` o fijo en top **global** — sigue visible al scroll del contenido |
| Sidebar | Scroll interno (`overflow-y-auto`) **solo** en ítems de menú; cabecera logo **fija dentro del sidebar** pero el bloque sidebar entero debajo del banner |
| main | Scroll del contenido sin que el banner tape el logo |

Hoy: banner sticky en columna raíz, sidebar scroll independiente con cabecera en Y=0 viewport → **desincronización** al scroll.

---

## 6. ¿Sidebar, header y main deben desplazarse juntos?

| Respuesta | **Sí** — cuando el banner está montado |
|-----------|----------------------------------------|

| Región | Debe bajar con banner |
|--------|---------------------|
| Cabecera logo sidebar | **Sí** |
| Ítems menú sidebar | **Sí** (mismo contenedor) |
| Header | **Sí** (ya ocurre) |
| main | **Sí** (ya ocurre) |

La columna principal ya cumple; el sidebar **no** — ahí está el bug.

Sin banner (`showSupportBanner === false`), el sidebar en `top: 0` sigue siendo el comportamiento histórico deseado.

---

## 7. Clasificación

| Tipo | Veredicto |
|------|-----------|
| Comportamiento intencional | **No** |
| Bug UX | **Sí** |
| Bug funcional (auth/sesión) | **No** |
| Deuda de implementación | Banner añadido como hermano en columna sin ajustar contrato `fixed` del sidebar |
| Severidad | **Media-alta** — afecta marca, legibilidad y confianza en “modo soporte” |
| Relación con auditoría shell | **Independiente** pero misma zona (`NewLayout`); conviene **una sola** corrección de layout |

---

## 8. Matriz de evidencias

| ID | Afirmación | Confirmado en código |
|----|------------|---------------------|
| L-01 | Banner es hijo directo de columna raíz, antes del row flex | `NewLayout.tsx` L31–35 |
| L-02 | Banner `sticky top-0 z-[60]` | `ImpersonationSupportBanner.tsx` L23 |
| L-03 | Sidebar `fixed top-0 left-0 h-full z-30` | `NewSidebar.tsx` L630 |
| L-04 | Cabecera logo sidebar `h-16` | `NewSidebar.tsx` L645–683 |
| L-05 | Header sin `fixed`, en columna principal | `Header.tsx` L104 |
| L-06 | Columna principal `pl-64`/`pl-16` solo compensa ancho | `NewLayout.tsx` L44–51 |
| L-07 | No hay `--banner-height` ni `top` dinámico en sidebar | grep layout |
| L-08 | Solapamiento explicado por z-index y distinto origen vertical | Análisis estructural |

---

## 9. Recomendación final (alineada con auditorías previas)

### Corrección conceptual única en `NewLayout`

Tratar el banner como **franja superior del shell tenant**, no como “solo contenido”:

1. **Visibilidad:** `isImpersonation && (variant === 'app' || variant === 'admin')` (ver `PLATFORM_IMPERSONATION_BANNER_SHELL_AUDIT.md`).
2. **Geometría:** Tras el banner, un contenedor **único** aloja sidebar + columna principal con **mismo `top` efectivo**:
   - Preferible: CSS Grid `grid-rows: auto 1fr` / `grid-template-columns: sidebar-width 1fr`, o
   - Sidebar fixed con `top` = altura del banner (variable CSS medida o estimada estable).
3. **No** dejar `NewSidebar` en `fixed top-0` sin offset mientras el banner ocupe flujo encima del row.
4. Validar en **ambos** shells tenant tras ampliar visibilidad del banner a `admin`.

### Criterios de aceptación QA (layout)

1. Con banner visible: logo CAXIS **completamente visible**, sin solapamiento.
2. Borde inferior del banner alinea visualmente con el borde superior del header del sidebar y del `Header` de contenido.
3. Redimensionar ventana / texto largo en banner: sin tapar logo (altura banner puede crecer → offset sidebar debe seguir).
4. Scroll en `main`: banner permanece accesible (`sticky` o equivalente global) sin cubrir logo.
5. Sin banner: layout idéntico al actual (regresión cero).

### Documentación V2 (futuro, no en esta entrega)

Ampliar **IMP-04** con: “banner en shells tenant; chrome lateral y contenido comparten offset vertical”.

---

## 10. Archivos revisados

```
src/shared/components/layout/NewLayout.tsx
src/shared/components/layout/ImpersonationSupportBanner.tsx
src/shared/components/layout/NewSidebar.tsx
src/shared/components/layout/Header.tsx
PLATFORM_IMPERSONATION_BANNER_SHELL_AUDIT.md
PLATFORM_IMPERSONATION_CONTEXT_SWITCH_AUDIT.md
```

---

*Auditoría layout banner vs sidebar. Sin código. Sin repair. Sin commit.*
