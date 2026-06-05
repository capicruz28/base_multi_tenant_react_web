# Auditoría profunda — capas de diseño CAXIS ERP

**Objetivo:** comprobar si existen dos capas (design system fijo vs branding tenant) y si están bien separadas. Solo análisis.  
**Fecha:** 15 de mayo de 2026.

---

## PASO 1 — Inventario real de archivos de diseño

### Hojas de estilo (`.css` / `.scss`)

No hay `.scss` / `.sass` en el repositorio. Archivos `.css` encontrados:

| Ruta | Líneas (aprox.) | Propósito |
|------|-----------------|-----------|
| `src/styles/caxis-tokens.css` | ~255 | Tokens por defecto del design system CAXIS: paleta `--caxis-*`, escala de grises, tipografía (tamaños/pesos), spacing, radius, sombras, transiciones, z-index, gradientes, blur; bloque opcional `prefers-color-scheme: dark` con `--caxis-bg`, `--caxis-surface`, etc. |
| `src/index.css` | ~160 | Importa `caxis-tokens.css`; define variables **shadcn** (`--background`, `--foreground`, `--primary`, …), tokens **`--color-primary*` / `--color-secondary*`** (branding por defecto + overrides para `.dark`), **`--color-surface`**, **`--color-text-*`**, **`--color-border`**, capas Tailwind y utilidad `.nav-item-active-bg`. |
| `src/App.css` | ~43 | Plantilla Vite (`#root`, `.logo`, animación); colores sueltos en HEX (`#646cffaa`, `#888`); **no** forma parte del sistema de tokens ERP. |
| `src\index.css` | (duplicado ruta Windows) | En el árbol del proyecto aparece como copia de la misma ruta lógica que `src/index.css`; mismo rol si el contenido está sincronizado. |

### Configuración Tailwind

| Ruta | Líneas (aprox.) | Propósito |
|------|-----------------|-----------|
| `tailwind.config.js` | ~251 | `extend.colors` para shadcn (`background`, `primary`, …), **`brand-*`**, **`caxis.*`**, `brand-input`; `borderRadius`, `boxShadow`, `backgroundImage`, transiciones, `fontFamily`, plugin `tailwindcss-animate` y componentes `.card`, `.btn-*` con `@apply`. |

### Archivos por nombre (*token*, *theme*, *design*, *branding*, *colors*, *variables*)

| Ruta | Notas |
|------|--------|
| `src/utils/branding.utils.ts` | Aplica branding en runtime (CSS vars, favicon, hoja inyectada shell). |
| `src/styles/caxis-tokens.css` | Tokens base CAXIS. |
| `src/features/tenant/stores/branding.store.ts` | Estado Zustand del branding. |
| `src/features/tenant/types/branding.types.ts`, `src/types/branding.types.ts` | Tipos `BrandingRead` / `TemaPersonalizado`. |
| `src/features/tenant/hooks/useBranding.ts`, `src/hooks/useBranding.ts` | Hooks (hay duplicación de rutas). |
| `src/features/tenant/services/branding.service.ts`, `src/services/branding.service.ts` | Servicios HTTP (el activo es el de `features/tenant/`). |
| `src/shared/components/BrandingInitializer.tsx`, `BrandingDebug.tsx` | Inicialización / debug de branding. |
| `src/shared/context/ThemeContext.tsx`, `src/context/ThemeContext.tsx` | Tema claro/oscuro (clase `.dark`). |
| `src/shared/components/ThemeSwitch.tsx` | UI para cambiar tema. |
| `docs/frontend/auditoria/AUDITORIA_BRANDING.md` | Documentación de auditoría previa (no código). |

### Carpetas solicitadas

| Carpeta | Estado |
|---------|--------|
| `src/styles/` | Existe: contiene `caxis-tokens.css`. |
| `src/assets/` | Existe pero **sin** hojas CSS indexadas en la búsqueda. |
| `src/design-system/` | **No existe** en el repo. |
| `src/shared/styles/` | **No existe**. |

---

## PASO 2 — Análisis de Capa 1 (design system fijo)

**Criterio del informe:** fondos `--bg-page`, `--bg-surface`, textos `--text-primary`, bordes `--border-default`, semánticos `--color-success|error|warning|info`, y equivalentes `.dark {}`.

En el código real **no** existen esos nombres exactos; hay convenciones paralelas (`--background`, `--brand-surface`, `--color-surface`, `--caxis-*`, shadcn).

### `src/styles/caxis-tokens.css`

**A) Fondos (`--bg-*`, surface)**  
No hay `--bg-page` ni `--bg-subtle`. Hay paleta de marca y grises en HEX; en `@media (prefers-color-scheme: dark)` dentro de `:root`:

- `--caxis-bg: var(--caxis-gray-900)`
- `--caxis-surface: var(--caxis-gray-800)`
- `--caxis-border: var(--caxis-gray-700)`
- (implícitos como superficie/texto, no “page/subtle/overlay” nombrados como en el criterio.)

**B) Texto (`--text-*`)**  
No hay `--text-primary` del criterio. Hay:

- Escala de tamaños: `--text-xs` … `--text-6xl` (tamaños de fuente, no color).
- En dark por `prefers-color-scheme`: `--caxis-text`, `--caxis-text-dim`.

**C) Bordes (`--border-*`)**  
No hay `--border-default`. Los grises `--caxis-gray-200`, `--caxis-gray-300` funcionan como tokens de borde en comentarios; `--caxis-border` solo en el bloque `prefers-color-scheme`.

**D) Semánticos (success, error, warning, info)**  
No hay `--color-success` etc. Sí hay **funcionales en HEX**:

- `--caxis-red`, `--caxis-green`, `--caxis-amber`, … (warning/error/success “por convención”, no namespace `--color-*` del criterio).

**E) `.dark {}`**  
**No.** El archivo usa `@media (prefers-color-scheme: dark) { :root { … } }`, distinto del dark mode por clase `html.dark` que usa el resto del stack.

**F) Mapeo Tailwind “Capa 1” semántica (`bg-page`, `text-soft`, …)**  
**No existe** ese set de clases. Lo más cercano es el grupo `colors.caxis.*` y utilidades estándar de Tailwind sobre variables `--caxis-*` (ver PASO 4).

---

### `src/index.css`

**A) Fondos**  
En `@layer base :root` (shadcn, valores HSL sin función):

- `--background`, `--card`, `--popover` (todos `0 0% 100%` en claro).
- `--color-surface: 0 0% 100%`, `--color-surface-alt: 0 0% 98%`.

En `.dark`:

- `--background: 0 0% 3.9%`, `--card` / `--popover` oscuros.
- `--color-surface: 0 0% 12%`, `--color-surface-alt: 0 0% 18%`.

**B) Texto**  
- `--foreground: 0 0% 3.9%` (claro), `0 0% 98%` (`.dark`).
- `--color-text-primary`, `--color-text-secondary` (claro / oscuro definidos en ambos bloques).

**C) Bordes**  
- `--border: 0 0% 89.8%` (claro); `0 0% 14.9%` (`.dark`).
- `--color-border` acorde en cada modo.

**D) Semánticos**  
- `--destructive` / `--destructive-foreground` (patrón “error” shadcn).  
- **No** hay `--color-warning` ni `--color-info` dedicados en este archivo.

**E) `.dark {}`**  
**Sí:** redefine variables shadcn, `--color-*` de superficie/texto/borde/input, y `--primary` / `--primary-foreground` ligados al matiz de marca en oscuro.

**F) Tailwind**  
`tailwind.config.js` mapea `background` → `hsl(var(--background))`, etc.; y `brand-surface` / `brand-text` a `--brand-*` con fallback a `--color-*` (inyectados también por JS — ver PASO 3).

---

### `src/App.css`

**A–E)** No define sistema de tokens ERP; solo estilos demo y HEX sueltos.  
**F)** No mapeado en Tailwind para la app.

---

### Resumen Capa 1 vs expectativa

| Expectativa | Estado en repo |
|-------------|----------------|
| Variables con nombres `--bg-page`, `--text-primary`, `--border-default`, `--color-success`, … | **No cumplidos literalmente.** |
| Superficies neutras fijas no ligadas a tenant | **Parcialmente:** shadcn + `--color-surface*` en `index.css`; `--brand-*` shell por JS fijo; `caxis-tokens.css` mezcla marca fija CAXIS con utilidades. |
| `.dark` equivalente | **`index.css` sí** (clase `.dark`); **`caxis-tokens.css` usa `prefers-color-scheme`**, inconsistente con el toggle de tema. |

---

## PASO 3 — Análisis de Capa 2 (branding del tenant)

Archivo principal: **`src/utils/branding.utils.ts`** (`applyBranding`, `applyBrandingColors`, `applyTemaPersonalizado`, `syncBrandShellTokensStylesheet`, `resetBranding`).

### A) Variables que escribe en `document.documentElement` (`setProperty`)

**`applyBrandingColors(branding)`** (siempre relativas a marca / primario-secundario):

- `--color-primary`, `--color-primary-hsl`, `--color-primary-rgb` (si aplica)
- `--color-primary-hover-hsl`, `--color-primary-active-hsl`, `--color-primary-light-hsl`, `--color-primary-dark-hsl`
- `--caxis-blue` (condicional si no viene `tema_personalizado.colors.blue`)
- `--color-secondary`, `--color-secondary-hsl`, `--color-secondary-rgb`
- `--color-secondary-hover-hsl`, `--color-secondary-active-hsl`, `--color-secondary-light-hsl`, `--color-secondary-dark-hsl`
- `--caxis-navy` (condicional si no viene `colors.navy`)
- `--color-primary-dark-mode-hsl`, `--color-primary-dark-mode-rgb`
- `--color-secondary-dark-mode-hsl`, `--color-secondary-dark-mode-rgb`

**`applyTemaPersonalizado(tema)`** (cuando `tema` es válido):

- Fuentes: `--font-display`, `--font-body`, `--font-family`, `--font-mono`; `document.body.style.fontFamily`
- `--border-radius`
- `--app-name` y `document.title`
- Por objeto `spacing`: `--spacing-{clave}`
- Por objeto `shadows`: `--shadow-{clave}` (**recorrido duplicado** en la misma función)
- Por objeto `colors` (HEX): `--caxis-{clave}`; si `blue` / `navy`, recalcula de nuevo todo el bloque `--color-primary*` / `--color-secondary*` y variantes; para otras claves fuera de la lista interna, también `--color-{clave}`
- Por `grays`: `--caxis-gray-{clave}`
- Por `gradients`: `--gradient-{clave}`
- **Bucle genérico:** cualquier otra propiedad string del objeto `tema` (camelCase → kebab) como `--{clave-css}`

**`syncBrandShellTokensStylesheet()`** (inyecta `<style id="brand-shell-tokens">` en `:root` y `html.dark`, no solo `documentElement.style`, pero forma parte del mismo flujo):

- `--brand-surface`, `--brand-surface-secondary`, `--brand-border`, `--brand-text-primary`, `--brand-text-secondary`
- Alias: `--color-surface`, `--color-surface-alt`, `--color-border`, `--color-text-primary`, `--color-text-secondary`

**No** aparece `setProperty('--primary', …)` ni `setProperty('--ring', …)` en el proyecto (búsqueda en `src/`).

### B) ¿Escribe variables que “deberían ser solo Capa 1”?

Según el criterio estricto del usuario (Capa 2 solo marca: `--color-primary*`, `--font-*`, `--border-radius`, `--app-name`):

**Sí — violaciones de separación:**

| Variable / familia | Origen en código |
|--------------------|------------------|
| `--color-surface`, `--color-surface-alt`, `--color-border`, `--color-text-primary`, `--color-text-secondary` | `syncBrandShellTokensStylesheet` (valores fijos por modo, pero ejecutados desde branding). |
| `--spacing-*` | `tema_personalizado.spacing` |
| `--shadow-*` | `tema_personalizado.shadows` |
| `--caxis-*` (paleta completa), `--caxis-gray-*` | `tema_personalizado.colors` / `grays` |
| `--gradient-*` | `tema_personalizado.gradients` |
| Props string arbitrarias del JSON tema → `--algo-custom` | Bucle genérico al final de `applyTemaPersonalizado` |

Además **`applyBrandingColors`** escribe `--caxis-blue` / `--caxis-navy`, mezclando **marca** con nombres del **design system CAXIS** completo.

### C) ¿Sincroniza `--primary` de shadcn con el tenant?

**No.** No hay `setProperty('--primary', …)` ni `--ring` desde JS. En **`src/index.css`**, en `:root` (modo claro), `--primary` sigue siendo **`0 0% 9%`** (casi negro) y **no** referencia `--color-primary-hsl`. Solo en **`.dark`** se redefine `--primary: var(--color-primary-hsl, …)`.  
→ **Problema crítico** para componentes que usan `bg-primary` / `text-primary` (Checkbox, Button default, plugin `.btn-primary`).

### D) ¿`tema_personalizado` más allá de appName, fonts y shape?

**Sí:** sombras, grises, gradientes, spacing, paleta `colors` completa, y claves string arbitrarias. Todo ello son **candidatos a retirar del JSON tenant** si se quiere una Capa 2 mínima.

---

## PASO 4 — Análisis de `tailwind.config.js`

### A) Clases semánticas tipo Capa 1 (`bg-page`, `surface`, `subtle`, `overlay`, …)

**No** aparecen utilidades con esos nombres. Lo disponible:

- **shadcn:** `background`, `foreground`, `card`, `muted`, `border`, etc.
- **Marca / shell:** `brand-surface`, `brand-surface-secondary`, `brand-text`, `brand-border`, `brand-input`.

Bloque relevante (referencia; el archivo fuente es la verdad):

```20:104:d:\base_multi_tenant_react_web\tailwind.config.js
      colors: {
        // Colores base de shadcn/ui (usando variables CSS)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ...
        'brand-surface': {
          DEFAULT: 'hsl(var(--brand-surface, var(--color-surface, 210 20% 98%)))',
          secondary: 'hsl(var(--brand-surface-secondary, var(--color-surface-alt, 220 14% 96%)))',
          alt: 'hsl(var(--brand-surface-secondary, var(--color-surface-alt, 220 14% 96%)))',
        },
        'brand-text': {
          DEFAULT: 'hsl(var(--brand-text-primary, var(--color-text-primary, 222 47% 11%)))',
          secondary: 'hsl(var(--brand-text-secondary, var(--color-text-secondary, 215 16% 47%)))',
        },
        'brand-border': 'hsl(var(--brand-border, var(--color-border, 220 13% 91%)))',
```

→ **Faltante** respecto al checklist del usuario: `bg-page`, `bg-subtle`, `bg-overlay`, `text-soft`, `text-faint`, `border-base`, `border-hard`, etc.

### B) Clases de marca Capa 2

**Sí:** `brand-primary` (+ hover/active/light/dark), `brand-primary-hover`, `brand-secondary`, y todo el objeto `colors.caxis` con fallback HEX.

```68:131:d:\base_multi_tenant_react_web\tailwind.config.js
        'brand-primary': {
          DEFAULT: 'var(--caxis-blue, rgb(var(--color-primary-rgb, 25, 118, 210)))',
          hex: 'var(--caxis-blue, var(--color-primary))',
          hover: 'hsl(var(--color-primary-hover-hsl, 210 79% 41%))',
          active: 'hsl(var(--color-primary-active-hsl, 210 79% 36%))',
          light: 'hsl(var(--color-primary-light-hsl, 210 79% 86%))',
          dark: 'hsl(var(--color-primary-dark-hsl, 210 79% 26%))',
        },
        'brand-primary-hover': 'hsl(var(--color-primary-hover-hsl, 210 79% 41%))',
        'brand-secondary': {
          DEFAULT: 'var(--caxis-navy, rgb(var(--color-secondary-rgb, 66, 66, 66)))',
          // ...
        },
        'caxis': {
          navy: 'var(--caxis-navy, #0A1628)',
          blue: 'var(--caxis-blue, #1E56A0)',
          // ... gray-50 … black con HEX fallback
        }
```

### C) Colores HEX hardcodeados en `tailwind.config.js`

**Sí**, en los **fallbacks** del objeto `caxis` (`#0A1628`, `#1E56A0`, … hasta `#020617`). Deben migrarse a variables si se exige “solo `var(--…)`” en config.

### D) shadcn y `--primary`

Bloque exacto de colores primarios shadcn:

```27:30:d:\base_multi_tenant_react_web\tailwind.config.js
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
```

La variable **`--primary`** en modo claro **no** está alineada con el branding del tenant (ver PASO 3C y `src/index.css`).

---

## PASO 5 — Verificación de consistencia (muestra de 10 componentes)

Leyenda columnas: **Capa 1-like** = `bg-background`, `bg-brand-surface`, `text-brand-text-*`, etc.; **gray*** = `bg-gray-*` / `text-gray-*` / `border-gray-*`; **brand** = `bg-brand-primary` / `text-brand-primary`; **primary** = `bg-primary` / `border-primary` / shadcn.

| Componente | Usa superficies tipo token (bg-background / bg-brand-surface / …) | Usa `bg-gray-*` / `bg-white` hardcode | Usa `bg-brand-primary` | Usa `bg-primary` / `border-primary` | Usa tokens `text-brand-text-*` / `text-foreground` | Usa `text-gray-*` hardcode |
|------------|---------------------------------------------------------------------|----------------------------------------|-------------------------|--------------------------------------|-----------------------------------------------------|----------------------------|
| `src/shared/components/layout/NewSidebar.tsx` | Sí (`bg-brand-surface`, bordes `brand-border`) | No en fragmentos principales revisados | No en shell lateral | No | Sí (vía `nav-item-classes` → `text-brand-text-secondary`, activo `text-brand-primary`) | No |
| `src/shared/components/layout/TopNavbar.tsx` | Sí (`bg-brand-surface`, `brand-border`, `brand-surface-secondary`) | No | No | No | Sí (`text-brand-text-secondary`) | No |
| `src/shared/components/layout/Header.tsx` | Sí (`bg-brand-surface`, `brand-border`) | No | Sí (badge admin / `brand-primary` tintes) | No | Sí (`brand-text-*`, `brand-primary` para crumbs) | No |
| `src/shared/components/ui/dialog.tsx` | Parcial (`bg-background`; `dark:bg-brand-surface`) | No | No | No | Implícito vía shadcn | No |
| `src/shared/components/ui/button.tsx` | No directo | No | No | **Sí** (`bg-primary` en variante default) | No explícito | No |
| `src/shared/components/ui/checkbox.tsx` | No | No | No | **Sí** (`border-primary`, `bg-primary` checked) | No | No |
| `src/shared/components/ui/Wizard.tsx` | No | No | Sí (paso activo) | No | No | No |
| `src/features/auth/pages/Login.tsx` | No | **Sí** (`bg-gray-50`, `bg-white`, inputs gray) | **Sí** (submit) | No | No | **Sí** (`text-gray-900`, `text-gray-600`, …) |
| `src/features/hcm/pages/VacacionesPage.tsx` | No en tabla/toolbar | **Sí** (tabla `gray-*`, `border-gray-*`, `bg-white`) | **Sí** (botón principal, focus ring) | Usa `<Button>` shadcn en otros puntos posibles | Parcial (focus `brand-primary`) | **Sí** (cabeceras y celdas `text-gray-*`) |
| `src/features/inv/components/InvTableSkeleton.tsx` | No | **Sí** (toda la tabla skeleton `gray-*`) | No | No | No | No |

### Conclusión cuantitativa (aproximada)

Medición con PowerShell sobre **`src/**/*.tsx`**:

- **256** archivos `.tsx`.
- **164** (~**64%**) contienen al menos una referencia a tokens `bg-brand-*`, `text-brand-*` o `brand-surface`.
- **120** (~**47%**) contienen al menos `bg-gray-*`, `text-gray-*`, `bg-white` o `bg-slate-*`.

Hay solapamiento (muchos archivos mezclan ambos). **No** es posible afirmar que la mayoría de pantallas eviten neutros Tailwind: una parte muy grande sigue usando **grises hardcodeados** para tablas, layouts y formularios.

---

## PASO 6 — Diagnóstico de separación de capas

### 1. ¿Archivo dedicado únicamente a tokens Capa 1?

**No** hay un único archivo que siga el contrato pedido (`--bg-page`, semánticos `--color-success`, etc.).

**Dispersión actual:**

- `src/styles/caxis-tokens.css`: densidad de tokens, pero mezcla **marca CAXIS fija**, sombras, gradientes y tipografía; dark por `prefers-color-scheme`, no por clase.
- `src/index.css`: **shadcn + branding defaults + `--color-surface/text/border`** en el mismo `:root` que `--color-primary*`.

### 2. ¿Capa 2 escribe solo marca?

**No.** Además de primarios/secundarios y fuentes, escribe (o reinyecta) **spacing, sombras, grises, gradientes, paleta `--caxis-*`, variables genéricas `--*` desde JSON**, y mediante **`syncBrandShellTokensStylesheet`** los alias **`--brand-*` / `--color-surface*` / texto / borde** del shell.

### 3. ¿Tailwind permite evitar `bg-white` / `bg-gray-*` solo con tokens?

**No de forma completa.** Faltan utilidades semánticas tipo `bg-page`, `bg-subtle`, `bg-overlay`, `text-muted-semantic`, `border-strong`, y semánticos unificados (`success`, `warning`, `info`) mapeados a variables dedicadas Capa 1. Hoy se compensa parcialmente con `background`/`muted` shadcn y `brand-*`, pero las páginas siguen usando **gray-* masivamente**.

### 4. ¿shadcn sigue el branding en modo claro?

**No.** `--primary` en `:root` no está enlazado a `--color-primary-hsl`; los componentes `primary` de shadcn **no** reflejan el color del tenant en light mode.

### 5. ¿CSS que mezcla Capa 1 y Capa 2 en el mismo bloque?

**Sí:**

| Archivo | Observación |
|---------|-------------|
| `src/index.css` | En un mismo `:root`: variables shadcn (Capa 1 neutra), **`--color-primary*` / `--color-secondary*`** (defaults de marca / Capa 2), y **`--font-family` / `--border-radius`** con comentario de tema personalizado. |
| `src/styles/caxis-tokens.css` | Comentario explícito: valores “se pueden sobrescribir dinámicamente desde tema_personalizado”; la paleta `--caxis-*` es a la vez **design system** y **objetivo de override** vía tenant. |

---

## Referencias de código clave

- Tokens base: `src/styles/caxis-tokens.css`
- Capa global + shadcn + defaults marca: `src/index.css`
- Branding runtime: `src/utils/branding.utils.ts`
- Tailwind: `tailwind.config.js`

---

*Fin del informe.*
