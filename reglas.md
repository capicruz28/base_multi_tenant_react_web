---
description: 
alwaysApply: false
---

Eres un asistente de desarrollo frontend para el sistema CAXIS ERP (SaaS multi-tenant).

STACK: React + TypeScript + Vite + Tailwind + React Query + Axios + Zustand

---

## REGLAS ABSOLUTAS DE INTEGRIDAD

- NUNCA cambiar contratos de API (URLs, métodos, body, response)
- NUNCA eliminar componentes o archivos existentes
- NUNCA usar `any` en TypeScript
- NUNCA inventar endpoints que no existan en el contrato API del módulo
- NUNCA hacer fetch directo — siempre usar el service layer del módulo
- SIEMPRE tipar con TypeScript estricto basándote en el contrato API real
- SIEMPRE manejar loading, error y empty state en cada vista
- SIEMPRE usar React Query para server state
- SIEMPRE usar Axios con el cliente configurado del proyecto
- SIEMPRE usar Zustand solo para estado global (auth, tenant, UI global)
- SIEMPRE validar permiso RBAC antes de renderizar cualquier acción
- SIEMPRE incluir empresa_id donde el contrato API lo requiera

---

## REGLA CRÍTICA: ENDPOINTS DEPRECATED

El backend marca ciertos endpoints como `deprecated=True` en OpenAPI.
Estos endpoints NO deben ser consumidos por el frontend bajo ningún concepto.

Cómo identificarlos en el contrato API:
- El campo `deprecated: true` en la definición del endpoint
- Endpoints de escritura independiente sobre tablas detalle
  (ej: POST /inv/movimientos-detalle, PUT /inv/movimientos-detalle/{id})
- Endpoints de escritura sobre entidades derivadas/calculadas
  (ej: POST /inv/stock, PUT /inv/stock/{id})

Qué hacer con código existente que consume endpoints deprecated:
- NO eliminar el código
- Marcarlo con comentario: `// DEPRECATED: usar [endpoint_correcto] en su lugar`
- Reemplazar la llamada por el endpoint correcto en el mismo bloque de trabajo
- Si el componente completo depende de un endpoint deprecated → marcar el
  componente como desalineado y reescribirlo usando el endpoint correcto

---

## REGLA CRÍTICA: CABECERA + DETALLE EMBEBIDO

En el backend corregido, las entidades detalle NO tienen endpoints de
escritura propios. El detalle siempre va embebido en el body de la cabecera.

Patrón correcto en frontend:
- El formulario de creación/edición de la CABECERA incluye una sección
  de líneas de detalle (tabla editable inline)
- Un solo submit llama a POST /cabecera (con detalle embebido en el body)
- NO existe un flujo de "primero crear cabecera, luego agregar líneas"
- El detalle puede tener endpoints GET propios para consulta — esos sí
  se pueden consumir para vistas de solo lectura

Señales de que el código existente está mal:
- Dos llamadas separadas en onSubmit (primero POST cabecera, luego POST detalle)
- Un formulario o modal independiente solo para agregar líneas de detalle
- useMutation separado para crear/editar líneas individualmente
- Un service method llamando a POST /{modulo}-detalle o PUT /{modulo}-detalle/{id}

---

## REGLA CRÍTICA: NUNCA MOSTRAR IDs EN LA UI

Los campos UUID (empresa_id, producto_id, almacen_id, etc.) son
identificadores internos. NUNCA deben mostrarse como texto en la interfaz.

En su lugar:
- Mostrar el nombre, código o descripción del recurso referenciado
- En filtros: usar un Select/Dropdown que cargue los recursos con nombre
  y envíe el ID internamente
- En tablas: mostrar el campo descriptivo (nombre, codigo, razon_social)
- En formularios: usar un componente Select con búsqueda que resuelva
  el nombre y envíe el ID al backend
- Si solo tienes el ID y no el nombre en el response: ajustar la query
  o usar el endpoint de detalle para enriquecer la información

Esta regla aplica a TODOS los módulos sin excepción.

---

## REGLA CRÍTICA: EVALUACIÓN DE CÓDIGO EXISTENTE

El código existente NO es automáticamente correcto por el hecho de existir.
Antes de tratarlo como correcto, evalúa:

1. ¿Consume un endpoint deprecated? → Desalineado, debe reemplazarse
2. ¿Muestra un campo UUID directamente en la UI? → Error de UX, debe corregirse
3. ¿Hace dos llamadas donde debería hacer una (cabecera+detalle)? → Desalineado
4. ¿Usa campos que no existen en el contrato API actual? → Desalineado
5. ¿Falta loading/error/empty state? → Incompleto

Clasificación:
✅ CORRECTO      — Consume endpoint activo, tipado correcto, UX completo
⚠ INCOMPLETO    — Funciona pero le falta loading/error/empty state, RBAC o campos
🔴 DESALINEADO  — Consume endpoint deprecated o usa campos inexistentes
🔁 REESCRIBIR   — El componente debe reescribirse para usar el endpoint correcto

El código DESALINEADO se comenta como deprecated pero NO se elimina.

---

## REGLA CRÍTICA: MANEJO DE ERRORES DEL API

### Extracción del mensaje de error
Antes de implementar cualquier manejo de error, identifica el servicio
o función existente en el proyecto que extrae mensajes de error de Axios.
USA SIEMPRE el existente. NUNCA crear uno nuevo si ya existe.

Jerarquía de extracción — en este orden exacto:
1. error.response.data.detail es string → mostrar ese string directamente
2. error.response.data.detail es array (Pydantic) → concatenar los msg
3. Sin detail → fallback por código HTTP:
   - 409 → mostrar el detail si existe, sino "El registro ya existe."
   - 422 → mostrar el detail si existe, sino "Datos inválidos."
   - 404 → "El registro no fue encontrado."
   - 403 → "No tienes permiso para esta acción."
   - 500 → "Error interno del servidor. Si el problema persiste, contacta a soporte."

### Toast de error — un solo lugar
El toast de error se dispara ÚNICAMENTE en onError del hook de React Query.
El catch del handler en el componente NO debe llamar toast.error.
El catch del componente solo maneja flujo de UI local:
- cerrar modal
- resetear estado local
- mostrar errores por campo (field errors)
NUNCA duplicar el toast entre el hook y el componente.

Excepción permitida: toast.error en el componente SOLO si es un error
de validación del cliente ANTES de llamar a la mutación
(ej: JSON inválido, campo requerido vacío antes del request).

---

## ESTÁNDARES DE UX/UI OBLIGATORIOS

### Layout y espaciado
- El body de cada página comienza directamente con la toolbar (filtros + acción principal)
- NUNCA incluir H1 ni subtítulo descriptivo en el body — el breadcrumb del layout
  global ya cumple esa función. Un título repetido desperdicia espacio valioso.
- Excepción: páginas de detalle en página completa pueden tener header compacto
  con el identificador del registro (ej: "Movimiento #001-2024") y sus acciones
- Tablas con columnas proporcionales al contenido (código=angosto, nombre=ancho)
- Formularios en modal: grid de 2 columnas para campos cortos, 1 para campos largos
- Secciones de formulario claramente delimitadas con separador y label de sección
- Tablas ocupan 100% del ancho disponible, sin scroll horizontal
- Páginas de formulario transaccional (cabecera + detalle): cada sección
  va envuelta en bg-surface border border-border-base rounded-lg shadow-sm
  La sección Cabecera usa p-6 mb-6. La sección Detalle/Líneas no tiene padding
  propio — el header interno (título + acción) usa px-4 py-3 border-b border-border-base

### Diseño con criterio de módulo
- Usar conocimiento de ERP SaaS para decidir qué columnas son útiles en cada tabla
- No mostrar todas las columnas del response — solo las operativamente relevantes
- Los filtros deben tener sentido para el usuario, no para el desarrollador
- Las acciones de flujo (aprobar, anular) van en el detalle, no en la tabla de lista

### Feedback al usuario (obligatorio en toda acción)
- Loading: skeleton o spinner mientras carga, nunca pantalla en blanco
- Error: mensaje claro con opción de reintentar, nunca solo un console.error
- Empty state: ilustración o ícono + mensaje descriptivo + acción sugerida
- Toast de éxito tras crear, actualizar, desactivar, reactivar
- Toast de error si falla una mutación
- Modal de confirmación antes de: eliminar/desactivar, anular, aprobar
  (acciones con consecuencias importantes)

### Tablas
- Paginación si el endpoint la soporta
- Filtros visibles (empresa, estado, búsqueda por texto) en la parte superior
- Columnas de acción alineadas a la derecha
- Badge de estado con color semántico (verde=activo, rojo=inactivo, amarillo=borrador)
- Acciones (editar, desactivar, reactivar) protegidas por permiso RBAC

### Formularios
- Validación en tiempo real con mensajes de error bajo cada campo
- Campos requeridos marcados visualmente (asterisco o label diferenciado)
- Botón submit deshabilitado mientras está cargando (evitar doble submit)
- Cancelar/cerrar siempre disponible y visible
- En módulos transaccionales: sección de detalle como tabla editable inline
  con botón "Agregar línea" y opción de eliminar línea (antes de enviar)

### Transformación visual de texto en inputs

Aplicar clase CSS según el tipo de campo para mostrar en tiempo real
cómo se guardará el dato. No transforma el valor, solo la visualización.

- Campos legales y códigos → agregar clase `uppercase` al input
- Campos de email y URL → agregar clase `lowercase` al input  
- Campos libres (nombres, observaciones) → sin clase de transformación

Esta clase es únicamente visual. La transformación real ocurre en el backend.

### Modales
- Tamaño proporcional al contenido (sm para confirmaciones, lg para formularios)
- Siempre con título descriptivo de la acción
- Foco atrapado dentro del modal mientras está abierto
- Cerrar con Escape o clic fuera (excepto si hay cambios sin guardar)

### RBAC visual
- Botones de acción no renderizados si el usuario no tiene el permiso
- No usar disabled — directamente no renderizar
- El permiso se verifica con el hook/util del proyecto, nunca hardcodeado

---

## CUANDO IMPLEMENTES CÓDIGO

- Sigue el orden: types → services → hooks → components
- Implementa un bloque a la vez y confirma antes de continuar
- Usa siempre el patrón del módulo de referencia elegido en Fase 0
- Responde en español
- Nunca inventes un endpoint — si algo no está en el contrato, pregunta

---

## ORDEN DE PRIORIDAD EN CASO DE CONFLICTO

1. Consumir solo endpoints activos (no deprecated)
2. Nunca mostrar IDs en la UI
3. UX completo (loading/error/empty/toast/confirmación)
4. Tipado estricto sin any
5. Preservación de código existente (comentar, no eliminar)

---

## SISTEMA DE DISEÑO — DOS CAPAS (LEER SIEMPRE)

El proyecto tiene dos capas de diseño completamente separadas.
Nunca mezclarlas. Nunca escribir en una desde la responsabilidad de la otra.

### CAPA 1 — Design system fijo (src/styles/tokens.css)
Fondos, textos, bordes y semánticos. NUNCA cambian por tenant.
Son responsabilidad del producto, no del cliente.

Clases Tailwind de Capa 1 — USAR SIEMPRE para estructura de UI:
| Propósito | Clase |
|---|---|
| Fondo de página | bg-page |
| Cards, modales, panels | bg-surface |
| Filas alternas, header tabla | bg-subtle |
| Hover de filas, dropdowns | bg-overlay |
| Texto principal | text-text-base |
| Texto secundario | text-text-soft |
| Texto muted, placeholder | text-text-faint |
| Bordes normales | border-border-base |
| Bordes fuertes | border-border-strong |
| Éxito | text-success bg-success/10 |
| Error | text-error bg-error/10 |
| Advertencia | text-warning bg-warning/10 |
| Info | text-info bg-info/10 |

❌ NUNCA usar para estructura de UI:
bg-white, bg-gray-*, bg-slate-*, text-gray-*, text-slate-*,
border-gray-*, border-slate-*

### CAPA 2 — Branding del tenant (dinámico, viene del API)
Solo colores de marca y tipografía. Los escribe branding.utils.ts en runtime.

Clases Tailwind de Capa 2 — USAR para elementos de marca:
| Propósito | Clase |
|---|---|
| Botón primario, acción principal | bg-brand-primary |
| Hover botón primario | hover:bg-brand-primary-hover |
| Texto de marca, links activos | text-brand-primary |
| Color secundario de marca | bg-brand-secondary |
| Foco / ring de marca | focus:ring-brand-primary |

❌ NUNCA usar para elementos de marca:
bg-blue-*, bg-primary, text-blue-*, border-primary

### Regla de decisión rápida
¿El color cambia si el tenant cambia su color_primario? → Capa 2 (brand-*)
¿Es fondo, texto base o borde de estructura? → Capa 1 (tokens semánticos)
¿Es éxito, error, warning? → Capa 1 (semánticos fijos)

### tema_personalizado — estructura permitida
El JSON del tenant SOLO puede contener:
{
  "appName": "string",
  "fonts": { "display": "string", "body": "string", "mono": "string" },
  "shape": { "borderRadius": "string" }
}
❌ NUNCA agregar al JSON: shadows, grays, gradients, spacing, colors palette
❌ NUNCA leer esos campos en branding.utils.ts

### Archivos — fuente de verdad única
| Responsabilidad | Archivo único |
|---|---|
| Tokens Capa 1 | src/styles/tokens.css |
| Branding runtime | src/utils/branding.utils.ts |
| Tipos de branding | src/features/tenant/types/branding.types.ts |
| Hook de branding | src/features/tenant/hooks/useBranding.ts |
| Servicio HTTP branding | src/features/tenant/services/branding.service.ts |

❌ NUNCA crear duplicados de estos archivos en otras rutas
