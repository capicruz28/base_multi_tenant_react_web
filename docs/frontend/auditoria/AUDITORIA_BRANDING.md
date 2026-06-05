# Auditoría de branding — frontend CAXIS ERP

**Alcance:** implementación actual del branding multi-tenant (solo análisis).  
**Fecha de revisión:** 15 de mayo de 2026.

---

## PASO 1 — Endpoint de branding

### URLs exactas

El cliente HTTP usa `axios` con `baseURL` por defecto `import.meta.env.VITE_API_BASE_URL || '/api/v1'` (`src/core/api/api-config.ts`). Las rutas relativas del servicio activo son:

| Uso | Método HTTP | Ruta relativa | URL efectiva típica |
|-----|-------------|---------------|----------------------|
| Tenant autenticado (contexto de tenant en servidor) | `GET` | `/clientes/tenant/branding` | `{baseURL}/clientes/tenant/branding` → p. ej. `/api/v1/clientes/tenant/branding` o `https://host/.../api/v1/clientes/tenant/branding` |
| Público por subdominio (pre-login) | `GET` | `/clientes/branding` | `{baseURL}/clientes/branding?subdominio={subdomain}` → p. ej. `/api/v1/clientes/branding?subdominio=acme` |

**Archivo de la llamada:** `src/features/tenant/services/branding.service.ts` (`brandingService.getBranding`, `brandingService.getBrandingBySubdomain`). El store que invoca el servicio es `src/features/tenant/stores/branding.store.ts`.

**Nota:** Existe un duplicado legacy `src/services/branding.service.ts` (solo `getBranding`, sin endpoint público). **No está referenciado** por el store actual; el flujo productivo usa el servicio bajo `features/tenant/`.

### ¿Cuándo se llama?

1. **`BrandingInitializer`** (`src/shared/components/BrandingInitializer.tsx`), montado en `src/app/provider.tsx`:
   - Si **no** hay sesión y hay **subdominio** → `loadBrandingBySubdomain(subdomain)` (pre-login).
   - Si hay sesión y **`tenantId`** → `loadBranding(tenantId)` (post-login).

2. **`TenantContext`** (`src/features/tenant/components/TenantContext.tsx`): `ensureBrandingLoaded(tenantId)` puede llamar a `loadBranding` si no hay branding cacheado para ese tenant (con ref para evitar doble carga en StrictMode).

3. **`useBranding(autoLoad)`** (`src/features/tenant/hooks/useBranding.ts`): con `autoLoad === true` (por defecto), si hay `isAuthenticated` y `tenantId`, dispara `loadBranding()`. `Login.tsx` usa `useBranding(false)` para **no** forzar otra carga automática en login, pero sigue leyendo `branding` del store (rellenado por el inicializador / tenant).

No hay carga “lazy” por ruta: el branding se dispara por **auth + tenant/subdominio**, no por navegación a un módulo concreto.

### ¿Se cachea? ¿Dónde?

- **Zustand** (`useBrandingStore`): mapa `tenants` por `tenantId` con `branding`, `loading`, `error`, `lastUpdated`; además `subdomainCache: Map<subdomain, BrandingRead>` para pre-login.
- **No** se usa **React Query** para el endpoint de branding.
- **No** se persiste en **localStorage** para el payload de branding (el cache es en memoria en el store).

### Tipado TypeScript

- La respuesta se tipa como **`BrandingRead`** en `api.get<BrandingRead>(...)` en `branding.service.ts`.
- Definición: `src/features/tenant/types/branding.types.ts` (y copia en `src/types/branding.types.ts` para el servicio legacy).
- **`TemaPersonalizado`** incluye `[key: string]: any` → parte del tema queda **explícitamente como `any`**.
- En `branding.service.ts`, el `catch` usa **`error: any`** al leer el error.

---

## PASO 2 — Campos del response que se consumen

Contrato principal (`BrandingRead`):

| Campo del response | ¿Se usa? | Para qué |
|--------------------|----------|----------|
| `color_primario` | Sí | Entrada a `applyBrandingColors` (y fallback si no hay `tema_personalizado.colors.blue` válido). Variables CSS `--color-primary*`, y si no hay `colors.blue` en tema, también `--caxis-blue`. Validación/normalización HEX en el servicio. |
| `color_secundario` | Sí | Igual que primario para secundario / `--caxis-navy` cuando no hay `colors.navy` en tema. |
| `logo_url` | Sí | UI: logo en `Login.tsx`, `NewSidebar.tsx`; depuración en `BrandingDebug.tsx`. No participa en `applyBranding` de colores. |
| `favicon_url` | Sí | `updateFavicon()` en `applyBranding` → `<link rel="icon">` dinámico. |
| `tema_personalizado` | Sí | `applyTemaPersonalizado()` + prioridad de colores en `applyBrandingColors` cuando existe `tema_personalizado.colors`. |

### `tema_personalizado` — subcampos usados en código

Aplicación principal en `src/utils/branding.utils.ts`:

| Subcampo / área | ¿Se usa? | Para qué |
|-----------------|----------|----------|
| `fonts.display` | Sí | `--font-display` |
| `fonts.body` | Sí | `--font-body`, `--font-family`, `document.body.style.fontFamily` |
| `fonts.mono` | Sí | `--font-mono` |
| `fontFamily` (legacy) | Sí | Si no hay `fonts.body`: `--font-family` y `body` |
| `borderRadius` | Sí | `--border-radius` |
| `appName` | Sí | `--app-name`, `document.title` |
| `spacing` (objeto) | Sí | `--spacing-{clave}` por cada entrada string |
| `shadows` (objeto) | Sí | `--shadow-{clave}` (**el bloque se recorre dos veces** en la misma función: duplicado lógico) |
| `colors` (objeto) | Sí | `--caxis-{key}` por cada color HEX válido; claves `blue` / `navy` además sincronizan tokens `--color-primary*` / `--color-secondary*` y variantes |
| `grays` | Sí | `--caxis-gray-{key}` |
| `gradients` | Sí | `--gradient-{key}` |
| Cualquier otra propiedad de tipo **string** en el objeto tema (no listada arriba) | Sí (genérico) | Se convierte a kebab-case y se asigna `--{clave}` en `:root` |

**Campos tipados en la interfaz que el backend podría enviar pero el front no trata de forma específica:** cualquier clave extra en `tema_personalizado` que sea **string** entra en el bucle genérico; valores **no string** (objetos/arrays) no se aplican salvo que encajen en las ramas conocidas (`colors`, `spacing`, etc.).

**Riesgo:** si el API envía `tema_personalizado` como **string JSON** en lugar de objeto, `validateTemaPersonalizado` fallará y se ignorará casi todo el tema (solo quedarían colores vía `color_primario` / `color_secundario` en `applyBrandingColors`).

---

## PASO 3 — Generación de variantes de color

| Pregunta | Respuesta |
|----------|-----------|
| ¿Se generan variantes? | **Sí** |
| ¿Librería? | **Ninguna** (tinycolor2 / chroma-js no están en dependencias). Cálculo **manual**: conversión HEX→RGB/HSL y ajuste de luminosidad en `branding.utils.ts` (`hexToHsl`, `adjustLightness`, `generateDarkModeColor`, `generateColorVariations`). |
| ¿Qué variantes? | Por color base (primario y secundario): `--color-*-hover-hsl`, `*-active-hsl`, `*-light-hsl`, `*-dark-hsl`, y para dark mode `--color-*-dark-mode-hsl` y `--color-*-dark-mode-rgb`. Además `--color-*-hsl`, `--color-*-rgb`, y `--color-primary` / `--color-secondary` en HEX. |

**Dónde se aplican:** `document.documentElement.style.setProperty(...)` en `:root` (no hoja estática exclusiva; convive con defaults en `src/index.css` y `syncBrandShellTokensStylesheet` que inyecta otra `<style>` para tokens de superficie).

---

## PASO 4 — Aplicación en CSS / Tailwind

### CSS custom properties

- **Defaults estáticos** en `src/index.css` (`:root` y `.dark`): incluyen `--color-primary`, `--color-primary-hsl`, variaciones, tokens shadcn (`--primary`, etc.), y comentarios de branding.
- **Runtime:** `applyBranding` / `applyTemaPersonalizado` / `applyBrandingColors` escriben en el `documentElement` variables como:  
  `--color-primary`, `--color-primary-hsl`, `--color-primary-rgb`, `--color-primary-hover-hsl`, `--color-primary-active-hsl`, `--color-primary-light-hsl`, `--color-primary-dark-hsl`, `--color-primary-dark-mode-hsl`, `--color-primary-dark-mode-rgb`,  
  análogas para `secondary`,  
  `--caxis-blue`, `--caxis-navy` (condicionados), `--caxis-*` para paleta, `--caxis-gray-*`, `--gradient-*`, `--shadow-*`, `--font-*`, `--border-radius`, `--app-name`, `--spacing-*`, etc.
- **`syncBrandShellTokensStylesheet`** define `--brand-surface`, `--brand-border`, `--brand-text-primary`, etc., y alias `--color-surface`, `--color-border`, … (valores fijos claro/oscuro, no derivados del tenant).

### Tailwind

**Archivo:** `tailwind.config.js` (no `tailwind.config.ts`).

El bloque relevante ya mapea colores de marca a variables, por ejemplo:

```js
'brand-primary': {
  DEFAULT: 'var(--caxis-blue, rgb(var(--color-primary-rgb, 25, 118, 210)))',
  hex: 'var(--caxis-blue, var(--color-primary))',
  hover: 'hsl(var(--color-primary-hover-hsl, 210 79% 41%))',
  active: 'hsl(var(--color-primary-active-hsl, 210 79% 36%))',
  light: 'hsl(var(--color-primary-light-hsl, 210 79% 86%))',
  dark: 'hsl(var(--color-primary-dark-hsl, 210 79% 26%))',
},
'brand-primary-hover': 'hsl(var(--color-primary-hover-hsl, 210 79% 41%))',
// ... brand-secondary, brand-surface, brand-text, caxis.*, boxShadow, backgroundImage, fontFamily ...
```

(`tailwind.config.js`, sección `theme.extend.colors` y siguientes.)

### Componentes: tokens vs Tailwind “estático”

- **Con tokens de branding:** layout/navegación y muchos módulos usan clases `text-brand-primary`, `bg-brand-primary`, `border-brand-border`, `text-brand-text-secondary`, etc. Ejemplos: `src/shared/components/layout/nav-item-classes.ts`, `src/features/log/pages/GuiasRemisionPage.tsx`, `src/features/hcm/pages/VacacionesPage.tsx`, `src/features/super-admin/modulos/pages/MenuManagementPageSuperAdmin.tsx`.
- **Shadcn `Button` por defecto** (`src/shared/components/ui/button.tsx`): `bg-primary text-primary-foreground` → variables **`--primary`** (shadcn), no `brand-primary`.

**Inconsistencia importante (modo claro):** en `src/index.css`, `:root` define `--primary: 0 0% 9%` (casi negro) y **no** lo enlaza a `--color-primary-hsl`. Solo en **`.dark`** se redefine `--primary: var(--color-primary-hsl, ...)`. El branding **sí** actualiza `--color-primary-hsl` en runtime, pero **`--primary` en modo claro no sigue al tenant** salvo que otro código lo cambie (no hay `setProperty('--primary')` en el repo).

Ejemplos concretos:

1. `button.tsx` — `default` → `bg-primary` (shadcn, desalineado del tenant en claro).
2. `VacacionesPage.tsx` — `className="bg-brand-primary hover:bg-brand-primary-hover text-white"` (alineado con tokens de marca).
3. `nav-item-classes.ts` — `text-brand-primary`, `hover:bg-brand-surface-secondary`.
4. `MenuManagementPageSuperAdmin.tsx` — `focus:ring-brand-primary`, `bg-brand-primary`.
5. `AutorizacionPage.tsx` (HCM) — mezcla `focus:ring-brand-primary` con muchas clases `text-gray-*` / `bg-gray-*`.
6. `EjecucionPage.tsx` (BDG) — tablas con `text-gray-500`, `bg-gray-50`, etc.
7. `Login.tsx` — `branding?.logo_url` para imagen (datos), estilos según layout.
8. `NewSidebar.tsx` — `logo_url`, `tema_personalizado.appName` para fallback de texto.
9. `tailwind.config.js` — plugin `.btn-primary` con `@apply bg-primary` (misma línea que shadcn, no `brand-primary`).
10. `index.css` — `body` usa `font-family: var(--font-body, var(--font-family))` (coherente con tema).

---

## PASO 5 — Consistencia en componentes

### ¿Tokens o hardcode?

- **Patrón mixto:** hay módulos que usan bien `brand-*` y otros que usan escala **Tailwind `gray-*` / `slate-*` / `red-*`** fija, independiente del tenant.
- **Lista orientativa de áreas con colores “neutros” fijos** (no exhaustiva; el grep global encontró muchas tablas/formularios): por ejemplo `src/features/bdg/pages/EjecucionPage.tsx`, `src/features/hcm/asistencia/autorizacion/pages/AutorizacionPage.tsx`, y en general páginas legacy con `text-gray-*`.

### Componentes UI centralizados

- **Sí:** `Button`, `dialog`, etc. bajo `src/shared/components/ui/` (patrón shadcn).
- **Paralelamente:** muchas pantallas aplican **`className` ad hoc** encima del `Button` (`bg-brand-primary`, etc.) o usan utilidades sin pasar por un solo sistema de diseño.

### Tipografía del tenant (`tema_personalizado.fonts`)

- **Sí se aplica** en `applyTemaPersonalizado`: `--font-display`, `--font-body`, `--font-mono`, y `document.body.style.fontFamily` para body.
- **Tailwind** (`tailwind.config.js` → `fontFamily.sans`, `display`, `body`, `mono`) referencia esas variables con fallback a system-ui/sans-serif.
- **`index.css`** en `body` refuerza `font-family: var(--font-body, var(--font-family))`.

Si no hay tema o fuentes, se usan los valores por defecto del design system (`caxis-tokens.css` + fallbacks).

---

## PASO 6 — Diagnóstico final

| Área | Estado | Problema detectado |
|------|--------|-------------------|
| Consumo del endpoint | Verde | Rutas claras; flujo pre-login / post-login documentado en código. Duplicado legacy de servicio/types poco riesgo si no se importa. |
| Tipado TypeScript | Amarillo | `BrandingRead` bien tipado en el servicio; `TemaPersonalizado` con index signature `any` y validador interno con `any`. Errores con `error: any`. |
| Generación de variantes | Verde | Variantes HSL/RGB coherentes sin dependencias externas. |
| CSS custom properties | Amarillo | Muchas variables en runtime + defaults en CSS + hoja inyectada shell; posible solapamiento mental para quien mantenga. |
| Configuración Tailwind | Verde | `brand-*` y `caxis.*` enlazados a variables; fallbacks numéricos en `rgb(var(...))`. |
| Consistencia en componentes | Rojo / amarillo | Conviven `bg-primary` (shadcn), `bg-brand-primary` y grises Tailwind fijos; modo claro no enlaza `--primary` al branding. |
| Uso de `tema_personalizado` | Amarillo | Amplio soporte (fuentes, radios, sombras, paleta); riesgo si el API manda string en vez de objeto; bucle duplicado de `shadows`. |

### Preguntas concretas

1. **¿Hace falta toda la información de `tema_personalizado`?**  
   El frontend **puede usar** casi todo lo tipado y además propiedades string genéricas. Si el backend envía campos que no son strings ni las estructuras conocidas, **no** tendrán efecto. Muchos tenants podrían vivir solo con colores/logo si la UI no dependiera de la paleta extendida (`--caxis-*`).

2. **¿Bastaría con `color_primario`, `color_secundario`, `logo_url` y `favicon_url` para lo que hoy usa el front?**  
   **Casi para un MVP de marca:** colores base, favicon y logo están cubiertos. **No basta** si se quiere conservar: título/app name, fuentes, radios, sombras, grises y gradientes del design system vía JSON — hoy eso pasa por `tema_personalizado`.

3. **Lo más urgente para branding consistente**  
   - Unificar **`--primary` / `bg-primary` (shadcn)** con los tokens de tenant en **modo claro** (o migrar botones a `brand-primary`).  
   - Reducir **grises hardcodeados** en pantallas críticas a tokens `brand-text`, `brand-surface`, `caxis-gray-*` o variables shell.  
   - Resolver duplicados (`src/hooks/useBranding.ts` vs `features/tenant/hooks`, servicios legacy) para una sola fuente de verdad.  
   - Asegurar contrato API: **`tema_personalizado` siempre objeto** parseado antes de `applyTemaPersonalizado`.

---

## Referencias rápidas de archivos

| Tema | Archivo(s) |
|------|----------------|
| Servicio HTTP | `src/features/tenant/services/branding.service.ts` |
| Store / cache | `src/features/tenant/stores/branding.store.ts` |
| Carga inicial | `src/shared/components/BrandingInitializer.tsx`, `src/app/provider.tsx` |
| Hook + aplicación DOM | `src/features/tenant/hooks/useBranding.ts`, `src/utils/branding.utils.ts` |
| Tipos | `src/features/tenant/types/branding.types.ts` |
| Tailwind | `tailwind.config.js` |
| CSS base | `src/index.css`, `src/styles/caxis-tokens.css` |

---

*Fin del informe.*
