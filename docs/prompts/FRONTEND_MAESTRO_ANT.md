CAXIS ERP — PROMPT MAESTRO FRONTEND v2
=======================================

# CONTEXTO

Sistema SaaS ERP multi-tenant.
Stack: React + TypeScript + Vite + Tailwind + React Query + Axios + Zustand.
El sistema ya tiene autenticación JWT, RBAC y arquitectura modular.

Módulo objetivo: [MODULO]
Código: [CODIGO]

---

# REGLAS ABSOLUTAS (leer primero, respetar siempre)

❌ NO consumir endpoints marcados como deprecated en el contrato API
❌ NO eliminar componentes o archivos existentes
❌ NO usar any en TypeScript
❌ NO inventar endpoints que no existan en el contrato API del módulo
❌ NO hacer fetch directo fuera del service layer
❌ NO mostrar campos UUID en la interfaz de usuario
❌ NO separar en dos llamadas lo que el backend recibe en una (cabecera+detalle)
❌ NO hardcodear valores de campos FK — cualquier campo que termine
   en _id y no sea la PK del propio recurso es una FK y DEBE cargarse
   desde su endpoint de catálogo mediante un Select dinámico
❌ NO usar "Eliminar" ni "Dar de baja" como vocabulario de acción —
   el sistema usa baja lógica, nunca física
✅ Usar SIEMPRE el componente ConfirmDialog del proyecto para confirmaciones
✅ Vocabulario de acciones estandarizado (ver Bloque 4 — Estándar de vocabulario)
✅ Tipar todo con TypeScript estricto basado en el contrato API real
✅ Usar React Query para server state
✅ Usar Zustand solo para estado global
✅ Manejar siempre: loading / error / empty state / toast / confirmación
✅ Respetar permisos RBAC antes de renderizar acciones
✅ Respetar contexto multi-tenant (empresa_id donde el API lo requiera)
✅ Diseño que aproveche el espacio, con UX/UI de calidad profesional
✅ Respetar SIEMPRE el sistema de diseño de dos capas del proyecto

---

## REGLA CRÍTICA: SISTEMA DE DISEÑO — DOS CAPAS

Antes de escribir cualquier componente, interioriza esta regla.
Es tan importante como no consumir endpoints deprecated.

### CAPA 1 — Estructura (fija, nunca cambia por tenant)
Usar SIEMPRE estas clases para fondos, textos y bordes de UI:

| Propósito | Clase correcta |
|---|---|
| Fondo de página | bg-page |
| Cards, modales, panels, tabla | bg-surface |
| Header de tabla, filas alternas | bg-subtle |
| Hover de filas | hover:bg-overlay |
| Texto principal | text-text-base |
| Texto secundario, labels | text-text-soft |
| Texto muted, placeholders | text-text-faint |
| Bordes normales | border-border-base |
| Bordes fuertes | border-border-strong |
| Estado éxito | text-success bg-success/10 |
| Estado error | text-error bg-error/10 |
| Estado advertencia | text-warning bg-warning/10 |
| Estado info | text-info bg-info/10 |

❌ NUNCA usar para estructura:
bg-white, bg-gray-*, bg-slate-*, text-gray-*, text-slate-*,
border-gray-*, border-slate-*, dark:bg-gray-*, dark:text-white

### CAPA 2 — Marca del tenant (dinámico, viene del API)
Usar SIEMPRE estas clases para elementos de acción y marca:

| Propósito | Clase correcta |
|---|---|
| Botón primario, acción principal | bg-brand-primary text-white |
| Hover botón primario | hover:bg-brand-primary-hover |
| Texto de marca, links activos | text-brand-primary |
| Foco de inputs y controles | focus:ring-brand-primary |

❌ NUNCA usar para elementos de marca:
bg-primary, bg-blue-*, text-primary, text-blue-*, border-primary,
bg-brand-surface, bg-brand-surface-secondary, border-brand-border,
text-brand-text-primary, text-brand-text-secondary

⚠ ATENCIÓN: Las clases bg-brand-surface, border-brand-border y
text-brand-text-* son un antipatrón en este proyecto. Están prohibidas
en tablas, inputs, formularios y cualquier elemento estructural.
Solo bg-brand-primary y sus variantes son válidas de Capa 2.

### Patrón obligatorio para tablas

```tsx
// ✅ CORRECTO
<div className="bg-surface border border-border-base rounded-lg shadow-sm">
  <table className="w-full">
    <thead>
      <tr className="bg-subtle border-b border-border-base">
        <th className="text-text-soft text-xs font-medium uppercase">...</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-border-base">
      <tr className="hover:bg-overlay transition-colors">
        <td className="text-text-base">...</td>
        <td className="text-text-soft">...</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Patrón obligatorio para inputs en formularios

```tsx
// ✅ CORRECTO
<input
  className="
    w-full bg-surface border border-border-base rounded-md
    text-text-base placeholder:text-text-faint
    focus:outline-none focus:ring-2 focus:ring-brand-primary
    focus:border-brand-primary
  "
/>
```

### Patrón obligatorio para badges de estado

```tsx
// ✅ CORRECTO
// Activo
<span className="bg-success/10 text-success px-2 py-1 rounded-full text-xs">
  Activo
</span>
// Inactivo
<span className="bg-error/10 text-error px-2 py-1 rounded-full text-xs">
  Inactivo
</span>
// Borrador
<span className="bg-subtle text-text-soft px-2 py-1 rounded-full text-xs">
  Borrador
</span>
// Pendiente
<span className="bg-warning/10 text-warning px-2 py-1 rounded-full text-xs">
  Pendiente
</span>
```

### Verificación obligatoria antes de entregar cualquier componente

Antes de considerar un componente terminado, verifica:
- ¿Alguna clase contiene gray-*, slate-*, white hardcodeado? → Corregir
- ¿Alguna clase usa bg-brand-surface o text-brand-text-*? → Corregir
- ¿Los inputs usan bg-surface y border-border-base? → Verificar
- ¿Los botones primarios usan bg-brand-primary? → Verificar
- ¿Los badges usan los semánticos (success/error/warning)? → Verificar
- ¿El dark mode funciona sin clases dark:* hardcodeadas? → Verificar
  (si los tokens están bien, el dark mode es automático)

---

# FASE 0 — ANÁLISIS DEL CONTRATO API + CONTRASTE CON FRONTEND ACTUAL

⚠ INSTRUCCIÓN CLAVE: Esta fase se ejecuta COMPLETA sin detenerse.
No esperes confirmación entre pasos. Ejecuta 0.1 → 0.2 → 0.3 en secuencia
y preséntate el resultado consolidado en el Paso 0.3.

## Paso 0.1 — Leer el contrato API del módulo

Lee el archivo adjunto [CODIGO]_API.json.
Filtra ÚNICAMENTE los endpoints del módulo (path prefix /[codigo]/).

Para cada endpoint encontrado indica:
- ruta completa y método HTTP
- si está marcado como deprecated: true → anotar como 🔴 DEPRECATED
- request body: campos y tipos (para POST/PUT)
- response body: campos y tipos principales
- si requiere empresa_id (query param o body)
- si tiene paginación (page, limit, total)
- si tiene filtros (search, estado, es_activo, empresa_id, etc.)
- si es endpoint de cabecera que incluye lista de detalle en el body

Construye una tabla:
| Ruta | Método | Deprecated | Cabecera+Detalle | empresa_id | Filtros/Paginación |

## Paso 0.2 — Leer la estructura técnica del frontend

Busca en el proyecto la estructura de cualquier módulo existente para identificar:
- estructura de carpetas (pages, components, hooks, services, types, stores)
- nombres de archivos convencionales
- cómo está configurado el cliente Axios (baseURL, interceptores, token)
- cómo se instancia useQuery y useMutation (queryKey, staleTime, onSuccess)
- cómo se accede al store de Zustand (auth, empresa_id del tenant)
- cómo se verifica un permiso RBAC antes de renderizar
- cómo están construidos los formularios (react-hook-form, zod, etc.)
- cómo se muestran los toasts (librería, patrón de uso)
- cómo se implementan los modales de confirmación
- qué componente exacto usa el proyecto para modales de confirmación
  (ConfirmDialog, AlertDialog, etc.) y cómo se instancia
- qué vocabulario usan los módulos existentes en botones y títulos
  de modales (Desactivar/Reactivar o alguna variante)
- cómo se cargan los catálogos FK en los formularios (qué hook,
  qué endpoint, cómo se muestra nombre y se envía ID)

⚠ Solo extrae estructura y patrones técnicos, NO lógica de negocio.

## Paso 0.3 — Inventario del frontend actual del módulo + clasificación

Busca todos los archivos existentes del módulo [CODIGO] en el frontend:
- pages, components, hooks, services, types, stores

Para cada componente/archivo encontrado, clasifícalo:

✅ CORRECTO     — Consume endpoint activo, tipado correcto, UX completo
⚠ INCOMPLETO   — Funciona pero le falta: loading/error/empty state,
                  RBAC, campos del response, o IDs expuestos en UI
🔴 DESALINEADO — Consume endpoint deprecated, usa campos inexistentes,
                  separa en dos llamadas lo que debe ser una, muestra UUID en UI
🔁 REESCRIBIR  — El componente debe reescribirse completamente para
                  alinearse al contrato actual

Presenta:
A. Tabla de endpoints del contrato (activos vs deprecated)
B. Tabla de archivos existentes con clasificación
C. Lista de problemas críticos detectados:
   - Endpoints deprecated que se consumen actualmente
   - UUIDs mostrados en UI (como el caso Producto (ID))
   - Flujos cabecera+detalle mal implementados (2 llamadas en lugar de 1)
   - Campos inexistentes en el contrato usados en el código
D. Lista de lo que falta implementar completamente

⛔ DETENTE AQUÍ. Espera confirmación antes de continuar con Fase 1.

---

# FASE 1 — AUDITORÍA DETALLADA (NO escribir código aún)

Con base en el contraste de Fase 0:

## Paso 1.1 — Diagnóstico de salud del frontend

Emite un diagnóstico general:

🟢 SALUDABLE   — El módulo cubre sus vistas principales correctamente.
                  Solo hay ajustes menores de UX o campos faltantes.
🟡 AJUSTES     — El módulo funciona parcialmente pero tiene brechas
                  de UX, endpoints deprecated activos o flujos incorrectos.
🔴 PROBLEMAS   — El módulo tiene errores graves: consume deprecated,
                  muestra IDs en UI, flujos cabecera-detalle rotos.

Justifica el diagnóstico en 3-5 líneas concretas.

## Paso 1.2 — Auditoría por endpoint activo

Para cada endpoint NO deprecated del contrato, verifica:

| Endpoint | Método | Service ✅/❌ | Hook ✅/❌ | Componente ✅/❌ | IDs en UI ✅/❌ | Loading/Error ✅/❌ | RBAC ✅/❌ |

## Paso 1.3 — Auditoría de UX/UI por vista

Para cada vista principal del módulo (lista, formulario, detalle):

| Vista | Existe | Paginación | Filtros | Empty state | Toast | Confirmación modal | Badge estado |

## Paso 1.4 — Campos faltantes en UI

Para cada endpoint GET con response rico, verifica qué campos del response
no se muestran en ninguna vista.

🔴 CRÍTICO   — Campo que el usuario necesita para operar (nombre, estado, fecha)
⚠ IMPORTANTE — Campo útil que mejora la experiencia
➕ MENOR     — Campo técnico que el usuario no necesita ver

## Paso 1.5 — Reporte de auditoría

Genera el archivo:
docs/frontend/auditoria/AUDITORIA_FRONTEND_[CODIGO].md

Con esta estructura exacta:

---
### DIAGNÓSTICO GENERAL
[Semáforo + justificación]

### ENDPOINTS DEPRECATED CONSUMIDOS ACTUALMENTE
[Lista: endpoint, archivo que lo consume, endpoint correcto a usar]
[Si ninguno: "Ninguno detectado."]

### UUIDs EXPUESTOS EN UI
[Lista: campo UUID, vista donde aparece, qué debería mostrar en su lugar]
[Si ninguno: "Ninguno detectado."]

### FLUJOS CABECERA+DETALLE MAL IMPLEMENTADOS
[Lista: descripción del flujo incorrecto, archivo, corrección requerida]
[Si ninguno: "Ninguno detectado."]

### AUDITORÍA POR ENDPOINT
[Tabla completa del Paso 1.2]

### AUDITORÍA DE VISTAS UX/UI
[Tabla completa del Paso 1.3]

### CAMPOS FALTANTES EN UI
[Por vista y prioridad]

### ARCHIVOS A REESCRIBIR
[Lista con motivo para cada uno]

### ARCHIVOS NUEVOS A CREAR
[Lista con descripción funcional]
---

⛔ DETENTE AQUÍ. Espera confirmación antes de continuar con Fase 2.

---

# FASE 2 — IMPLEMENTACIÓN CONTROLADA

Implementa SOLO lo detectado en la auditoría.
Orden obligatorio — detente tras cada bloque y confirma:

## Bloque 1 — Types e interfaces

- Un archivo types.ts por módulo en su carpeta correspondiente
- Interfaces basadas ÚNICAMENTE en el contrato API (campos reales)
- Interfaces separadas para: request (Create/Update) y response (Read)
- Para cabecera+detalle: DetalleCreate embebido en CabeceraCreate
  como `detalle: DetalleCreate[]`
- NUNCA usar any
- Exportar todas las interfaces desde el archivo types.ts del módulo

## Bloque 2 — Services (Axios)

- Un archivo [codigo].service.ts por módulo
- Usar el cliente Axios configurado del proyecto (nunca fetch directo)
- Incluir empresa_id donde el contrato lo requiera
- SOLO llamar a endpoints NO deprecated
- Tipar request y response con las interfaces del Bloque 1
- Para cabecera+detalle: un solo método que envía cabecera+detalle juntos
- Métodos nombrados descriptivamente: getMovimientos, createMovimiento,
  updateMovimiento, anularMovimiento (no genéricos)

## Bloque 3 — Hooks (React Query)

- Un archivo use[Entidad].ts por entidad principal
- useQuery para GET (lista y detalle) con queryKey descriptivo
- useMutation para POST, PUT, DELETE/desactivar, acciones de estado
- Invalidar queries relacionadas tras mutaciones exitosas
- onSuccess: mostrar toast de éxito
- onError: usar el servicio de errores existente del proyecto para extraer
  el mensaje. Jerarquía: (1) detail string → mostrar directo,
  (2) detail array Pydantic → concatenar msg, (3) fallback por código HTTP
  incluyendo 409. El toast se dispara SOLO aquí — nunca en el componente.
- Para cabecera+detalle: un solo useMutation que envía todo junto

### Auditoría de manejo de errores existente
Antes de implementar los hooks, verifica si ya existen hooks para este módulo.
Si existen, comprueba que onError use el servicio de errores del proyecto
y que NO haya toast.error duplicado en los handlers de los componentes.
Si hay duplicación → eliminar toast.error del catch del componente,
conservando solo el manejo de flujo UI (cerrar modal, field errors).

## Bloque 4 — Diseño inteligente por módulo

Antes de escribir cualquier componente, usa tu conocimiento de ERP SaaS
para definir el diseño óptimo de cada vista del módulo [MODULO].

### Paso 4.0 — Decisiones de diseño por entidad

Para cada entidad principal del módulo define:

**Columnas de tabla:** ¿Cuáles son las más útiles para el usuario operativo?
No todas las del response — solo las que aportan valor de un vistazo.
Ejemplo (Almacenes): Código, Nombre, Tipo, Sucursal (nombre), Principal, Estado.
NUNCA: IDs/UUIDs, campos de auditoría, campos técnicos internos.

**Filtros relevantes:** ¿Qué filtros tienen sentido operativo real?
Ejemplo (Almacenes): Empresa, Tipo de almacén, Estado (activo/inactivo).

**Acciones rápidas en tabla:** ¿Qué se hace con frecuencia sobre este registro?
Las acciones de flujo (aprobar, anular) van en el detalle, no en la tabla.

**Agrupación de campos en formulario:** ¿Cómo se agrupan lógicamente?
Ejemplo (Almacenes): "Identificación" → código, nombre, tipo |
"Ubicación" → sucursal, dirección | "Configuración" → flags, centro de costo.

**¿Modal o página completa?**
Maestros simples → modal. Transaccionales con detalle embebido → página propia.

Presenta este análisis antes de escribir código. Es la guía de diseño del bloque.

### Reglas de layout — OBLIGATORIAS en toda vista

**Títulos de página:**
❌ NO incluir H1 ni subtítulo descriptivo en el body de la página.
   El breadcrumb del layout global ya identifica dónde está el usuario.
   Un título repetido desperdicia 60-80px de espacio útil en cada vista.
✅ La página comienza directamente con la barra de acciones (toolbar).
Excepción única: páginas de detalle en página completa pueden tener un
header compacto con el identificador del registro (ej: "Movimiento #001-2024")
y sus acciones. Sin subtítulo descriptivo.

**Toolbar (barra de acciones):**
✅ Filtros y botón de acción principal en una sola línea horizontal
✅ Filtros a la izquierda, botón crear a la derecha
✅ Compacta — sin padding excesivo entre toolbar y tabla

**Tablas:**
✅ Ancho 100% del contenedor disponible
✅ Columnas con ancho proporcional (código=angosto, nombre=ancho, acciones=fijo)
✅ Filas con altura compacta pero legible
❌ NO dejar ninguna columna con UUID — siempre resolver al nombre descriptivo
❌ NO agregar columnas que el usuario no necesita para operar

**Formularios en modal:**
✅ Tamaño proporcional a la cantidad de campos (sm/md/lg/xl según necesidad)
✅ Grid 2 columnas para campos cortos, 1 columna para campos largos
✅ Campos agrupados por sección con separador y label de sección
✅ Footer: Cancelar (izquierda) + Guardar (derecha, color primario)

**Formularios en página completa (transaccionales):**
✅ Header compacto con identificador del documento + acciones (Guardar/Cancelar/Anular)
✅ Sección Cabecera envuelta en:
   bg-surface border border-border-base rounded-lg shadow-sm p-6 mb-6
   Título de sección dentro del contenedor: text-text-base font-semibold text-sm mb-4
✅ Cabecera en grid 3-4 columnas dentro del contenedor bg-surface
✅ Sección Líneas/Detalle envuelta en:
   bg-surface border border-border-base rounded-lg shadow-sm
   Header interno (título + botón Agregar línea):
   flex items-center justify-between px-4 py-3 border-b border-border-base
   Título de sección: text-text-base font-semibold text-sm
   Header de columnas de la tabla: bg-subtle border-b border-border-base
   th: text-text-soft text-xs font-medium uppercase tracking-wider px-3 py-2
✅ Detalle como tabla editable que ocupa el ancho completo
✅ Sin scroll horizontal — columnas de detalle ajustadas al ancho disponible
❌ NUNCA dejar secciones de cabecera o detalle sin contenedor bg-surface —
   se pierden visualmente contra el fondo bg-page de la página

## Bloque 4 — Componentes

### Estándar de vocabulario UI — OBLIGATORIO en todo el módulo

Antes de implementar cualquier componente, lee los archivos del módulo ORG
como referencia de vocabulario y diseño de modales:
- src/features/org/pages/SucursalesPage.tsx
- src/features/org/pages/DepartamentosPage.tsx

Aplica EXACTAMENTE el mismo vocabulario y el mismo componente de confirmación:

**Vocabulario de acciones (nunca inventar alternativas):**
| Acción | Texto botón tabla | Título modal | Mensaje modal | Botón confirmar |
|---|---|---|---|---|
| Desactivar registro | ícono papelera | "Desactivar [entidad]" | "¿Desactivar [entidad] '[nombre]'? Podrá reactivarlo después." | "Desactivar" |
| Reactivar registro | ícono refresh | "Reactivar [entidad]" | "¿Reactivar [entidad] '[nombre]'? Volverá a estar disponible." | "Reactivar" |
| Anular documento | botón "Anular" | "Anular [entidad]" | "¿Anular [entidad] '[número]'? Esta acción no se puede deshacer." | "Anular" |
| Aprobar documento | botón "Aprobar" | "Aprobar [entidad]" | "¿Aprobar [entidad] '[número]'? Se generarán los registros correspondientes." | "Aprobar" |
| Procesar documento | botón "Procesar" | "Procesar [entidad]" | "¿Procesar [entidad] '[número]'? Impactará en el stock/saldo." | "Procesar" |
| Autorizar documento | botón "Autorizar" | "Autorizar [entidad]" | "¿Autorizar [entidad] '[número]'?" | "Autorizar" |

❌ NUNCA usar: "Eliminar", "Dar de baja", "Borrar", "Quitar"
✅ SIEMPRE usar el componente ConfirmDialog del proyecto — nunca window.confirm

**Estándar de campos FK en formularios:**

Antes de implementar cualquier formulario, identifica TODOS los campos
que terminen en _id en el schema Create y Update del contrato API.
Para cada uno:
1. ¿Es la PK del propio recurso? → No es FK, ignorar
2. ¿Es cualquier otro campo terminado en _id? → ES FK obligatoria

Para cada FK identificada:
- Busca en el proyecto qué endpoint y qué hook carga ese catálogo
- Implementa un Select que cargue las opciones desde ese endpoint
- Muestra el campo descriptivo (nombre, codigo, razon_social, simbolo)
- Envía el campo _id al backend
- NUNCA hardcodear el valor — ni "PEN", ni "activo", ni ningún otro
- Si no existe hook para ese catálogo, créalo antes de implementar el formulario

Ejemplos de FKs comunes y su resolución:
| Campo FK | Catálogo | Endpoint | Mostrar |
|---|---|---|---|
| moneda_id / moneda_salarial | cat_moneda | /catalogos/monedas | codigo — nombre |
| empresa_id | org_empresa | /org/empresa | razon_social |
| sucursal_id | org_sucursal | /org/sucursales | codigo — nombre |
| almacen_id | inv_almacen | /inv/almacenes | codigo — nombre |
| producto_id | inv_producto | /inv/productos | codigo_sku — nombre |
| categoria_id | inv_categoria | /inv/categorias | codigo — nombre |
| unidad_medida_id | inv_unidad_medida | /inv/unidades-medida | codigo — nombre |
| tipo_movimiento_id | inv_tipo_movimiento | /inv/tipos-movimiento | codigo — nombre |

**Estándar de campo es_activo en formularios:**
- Formulario de CREACIÓN → NO incluir es_activo. Todo registro nace activo.
- Formulario de EDICIÓN → NO incluir es_activo como checkbox. El estado
  se controla exclusivamente con los botones Desactivar/Reactivar en la tabla.

### Para módulos MAESTROS:

**[Entidad]Page** (página principal)
- SIN título H1 ni subtítulo — el breadcrumb ya identifica la página
- Toolbar en una línea: filtros definidos en Paso 4.0 a la izquierda,
  botón crear a la derecha (protegido por RBAC crear)
- Tabla con columnas definidas en Paso 4.0, badge de estado con color semántico,
  acciones por fila protegidas por RBAC, sin ningún UUID en columnas
- Paginación si el endpoint la soporta
- Empty state con ícono + mensaje descriptivo + acción sugerida
- Loading con skeleton de tabla mientras carga
- Toast de éxito/error tras cada acción

**[Entidad]Form** (modal o page de formulario)
- Modo crear y editar en el mismo componente (prop: entidad? para editar)
- Grid de 2-3 columnas para campos cortos
- Selects para FKs (cargan el nombre, envían el ID — nunca input de UUID)
- Validación en tiempo real con mensaje bajo cada campo
- Inputs con clase `uppercase` para campos legales y códigos
- Inputs con clase `lowercase` para emails y URLs
- Botón submit deshabilitado mientras está mutando
- Modal de confirmación solo si la acción es irreversible

**[Entidad]Detail** (solo si el módulo lo requiere)
- Vista de solo lectura con todos los campos del response
- Nunca mostrar campos UUID crudos

### Para módulos TRANSACCIONALES además:

**Flujo de estados**
- Badge visible con color semántico en lista y detalle:
  borrador=gris, pendiente=amarillo, aprobado=verde, anulado=rojo
- Acciones disponibles según estado (solo renderizar las válidas para el estado actual)
- Modal de confirmación obligatorio para: aprobar, procesar, anular

**Sección cabecera + detalle inline**
- En el formulario de creación/edición: tabla editable de líneas de detalle
- Botón "Agregar línea" añade una fila vacía a la tabla
- Cada fila tiene: campos editables + botón eliminar fila
- Los Selects de las líneas (producto, almacén, etc.) muestran nombre, envían ID
- Un solo botón "Guardar" al final envía cabecera + todas las líneas en una llamada
- NUNCA un modal separado para gestionar líneas individualmente

### Para módulos ANALÍTICOS/DERIVADOS:

- Solo vistas de lectura con filtros avanzados
- Tablas con exportación si aplica
- Sin formularios de creación ni edición
- Filtros: empresa, fechas, rangos — nunca input de UUID para filtrar

### Reglas de componentes transversales:

- Los Selects que referencian otra entidad SIEMPRE:
  1. Llaman al endpoint de lista de esa entidad para cargar opciones
  2. Muestran el campo descriptivo (nombre, codigo, razon_social)
  3. Envían el campo ID al backend
  4. Nunca muestran ni aceptan UUID como input del usuario

- Los campos de solo lectura en tablas SIEMPRE:
  1. Muestran el nombre/descripción, no el ID
  2. Si el response solo trae el ID, enriquecer usando el endpoint
     de detalle o ajustar con un join en el backend (documentar como deuda técnica)

---

# FASE 3 — VERIFICACIÓN FINAL

Al terminar:

1. Lista todos los archivos creados o modificados
2. Confirma que NINGÚN endpoint deprecated es consumido
3. Confirma que NINGÚN UUID se muestra directamente en la UI
4. Para cada endpoint activo del contrato confirma:
   - interface TypeScript correspondiente ✅/❌
   - función en el service ✅/❌
   - hook de React Query ✅/❌
   - componente que lo consume ✅/❌
5. Para módulos transaccionales confirma:
   - cabecera y detalle se envían en una sola llamada ✅/❌
   - flujo de estados visible en UI ✅/❌
   - acciones protegidas por RBAC y estado ✅/❌
6. Confirma que ningún componente existente fue eliminado
7. Confirma que no se usa any en ningún archivo del módulo
8. Genera el archivo:
   docs/frontend/modulos/[CODIGO]_FRONTEND_IMPLEMENTACION.md

---

# INICIO

Comienza por la Fase 0 completa (Pasos 0.1 → 0.2 → 0.3).
No te detengas entre pasos dentro de la Fase 0.
En el Paso 0.1 lee el contrato API y clasifica endpoints.
En el Paso 0.2 identifica el patrón técnico del proyecto.
En el Paso 0.3 clasifica todos los archivos existentes del módulo.
Detente al finalizar el Paso 0.3 y espera confirmación.