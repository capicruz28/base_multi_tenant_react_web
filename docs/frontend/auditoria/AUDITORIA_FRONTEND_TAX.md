# AUDITORÍA FRONTEND — Módulo TAX (Gestión Tributaria)

**Fecha:** 2026-05-09  
**Módulo:** TAX — Libros Electrónicos / PLE SUNAT  
**Contrato API:** `docs/api/TAX_API.json`  
**Tipo de módulo:** Transaccional (flujo de estados: borrador → generado → enviado / anulado)  
**Módulo de referencia:** FIN

---

## 1. Endpoints del contrato API

| # | Ruta | Método | Entidad | Notas |
|---|------|--------|---------|-------|
| 1 | `/api/v1/tax/libros-electronicos` | GET | LibroElectronico | Filtros: empresa_id, tipo_libro, anio, mes, estado. Sin paginación (array directo). |
| 2 | `/api/v1/tax/libros-electronicos` | POST | LibroElectronico | empresa_id requerido en body. Siempre crea en estado `borrador`. |
| 3 | `/api/v1/tax/libros-electronicos/{libro_id}` | GET | LibroElectronico | Detalle por ID. |
| 4 | `/api/v1/tax/libros-electronicos/{libro_id}` | PUT | LibroElectronico | Edición parcial. No incluye campo `estado`. |
| 5 | `/api/v1/tax/libros-electronicos/{libro_id}/marcar-generado` | POST | LibroElectronico | Transición: borrador → generado. Sin request body. |
| 6 | `/api/v1/tax/libros-electronicos/{libro_id}/registrar-envio` | POST | LibroElectronico | Transición: generado → enviado. Body opcional: fecha_envio_sunat, codigo_respuesta_sunat. |
| 7 | `/api/v1/tax/libros-electronicos/{libro_id}/anular` | POST | LibroElectronico | Anulación desde cualquier estado. Sin request body. |

**Flujo de estados:** `borrador` → `generado` → `enviado` / `anulado`

---

## 2. Implementación actual detectada

### Archivos existentes

| Archivo | Tipo | Estado |
|---------|------|--------|
| `src/features/tax/services/tax.service.ts` | Service (Axios) | ⚠ Parcial |
| `src/features/tax/types/tax.types.ts` | Types/Interfaces | ⚠ Parcial |
| `src/features/tax/components/TaxPageLayout.tsx` | Componente layout | ✔ Completo |
| `src/features/tax/pages/PlePage.tsx` | Página principal | ⚠ Parcial |
| `src/features/tax/routes.tsx` | Rutas | ⚠ Parcial |

### Hooks React Query

No existe ningún archivo de hooks (`use*.ts`) en el módulo TAX. La página usa `useState` + `useCallback` + `useEffect` directamente.

---

## 3. Evaluación por endpoint

| Endpoint | Método | Service | Hook RQ | Componente | Estado |
|----------|--------|---------|---------|------------|--------|
| `/libros-electronicos` | GET | ✔ `list()` | ✖ Faltante | ⚠ `PlePage` (useEffect) | ⚠ Parcial |
| `/libros-electronicos` | POST | ✔ `create()` | ✖ Faltante | ⚠ `PlePage` (modal crear) | ⚠ Parcial |
| `/libros-electronicos/{id}` | GET | ✔ `getById()` | ✖ Faltante | ✖ Sin vista de detalle | ✖ Faltante |
| `/libros-electronicos/{id}` | PUT | ✔ `update()` | ✖ Faltante | ⚠ `PlePage` (modal editar) | ⚠ Parcial |
| `/libros-electronicos/{id}/marcar-generado` | POST | ✖ Faltante | ✖ Faltante | ✖ Faltante | ✖ Faltante |
| `/libros-electronicos/{id}/registrar-envio` | POST | ✖ Faltante | ✖ Faltante | ✖ Faltante | ✖ Faltante |
| `/libros-electronicos/{id}/anular` | POST | ✖ Faltante | ✖ Faltante | ✖ Faltante | ✖ Faltante |

---

## 4. Brechas por endpoint

### Endpoint 1 — GET /libros-electronicos
- ✖ Sin React Query (`useQuery`). Usa `useEffect` + `useState`.
- ⚠ Estado vacío visible pero sin ícono/mensaje diferenciado cuando la lista está vacía tras aplicar filtros.
- ⚠ No hay loading state separado para el filtro por empresa al cargar periodos.

### Endpoint 2 — POST /libros-electronicos
- ✖ Sin React Query (`useMutation`). Usa `useState` + `async/await` directo.
- ⚠ `DEFAULT.estado` = `'generado'` — incorrecto: el campo es ignorado por el API (siempre crea en `borrador`). Puede generar confusión en el usuario.
- ⚠ El formulario no incluye el campo `ruta_archivo` (presente en `LibroElectronicoCreate`).
- ⚠ El formulario no incluye el campo `generado_por_usuario_id` (presente en `LibroElectronicoCreate`).

### Endpoint 3 — GET /libros-electronicos/{id}
- ✖ No existe vista de detalle (`LibroElectronicoDetailPage` o similar).
- ✖ `getById()` existe en el service pero no se consume en ningún componente.
- ✖ Sin hook de detalle.

### Endpoint 4 — PUT /libros-electronicos/{id}
- ✖ Sin React Query (`useMutation`).
- ⚠ El formulario de edición incluye campo **`estado`** que **no existe** en `LibroElectronicoUpdate` del contrato API.
- ⚠ El campo `ruta_archivo` no aparece en el formulario de edición (sí está en el contrato).
- ⚠ El campo `generado_por_usuario_id` no aparece en el formulario de edición (sí está en el contrato).

### Endpoint 5 — POST /marcar-generado
- ✖ Sin función en el service.
- ✖ Sin hook React Query.
- ✖ Sin botón de acción en la lista (no hay acción "Marcar generado" por fila).

### Endpoint 6 — POST /registrar-envio
- ✖ Sin función en el service.
- ✖ Sin hook React Query.
- ✖ Sin componente de acción (modal con fecha_envio_sunat y codigo_respuesta_sunat).

### Endpoint 7 — POST /anular
- ✖ Sin función en el service.
- ✖ Sin hook React Query.
- ✖ Sin botón de acción con confirmación.

---

## 5. Campos faltantes en formularios y vistas

### Formulario Crear (`LibroElectronicoCreate`)

| Campo | En API | En formulario | Observación |
|-------|--------|--------------|-------------|
| empresa_id | ✔ Required | ✔ | OK |
| tipo_libro | ✔ Required | ✔ | OK |
| periodo_id | ✔ Required | ✔ | OK |
| anio | ✔ Required | ✔ | OK |
| mes | ✔ Required | ✔ | OK |
| nombre_archivo | Opcional | ✔ | OK |
| ruta_archivo | Opcional | ✖ Faltante | No incluido |
| estado | Opcional (ignorado) | ⚠ Incluido | Campo innecesario (API lo ignora, genera confusión) |
| fecha_envio_sunat | Opcional | ✖ Faltante | No incluido |
| codigo_respuesta_sunat | Opcional | ✖ Faltante | No incluido |
| total_registros | Opcional | ✔ | OK |
| observaciones | Opcional | ✔ | OK |
| generado_por_usuario_id | Opcional | ✖ Faltante | No incluido |

### Formulario Editar (`LibroElectronicoUpdate`)

| Campo | En API | En formulario | Observación |
|-------|--------|--------------|-------------|
| nombre_archivo | Opcional | ✔ | OK |
| ruta_archivo | Opcional | ✖ Faltante | No incluido |
| fecha_envio_sunat | Opcional | ✔ | OK |
| codigo_respuesta_sunat | Opcional | ✔ | OK |
| total_registros | Opcional | ✔ | OK |
| observaciones | Opcional | ✔ | OK |
| generado_por_usuario_id | Opcional | ✖ Faltante | No incluido |
| estado | ✖ NO existe en API Update | ⚠ Incluido | **Desalineado** — campo inexistente en contrato |

### Vista de lista (`LibroElectronicoRead`)

| Campo | En API | En tabla | Observación |
|-------|--------|---------|-------------|
| libro_id | ✔ | — | Solo como key, no visible |
| cliente_id | ✔ | ✖ | No mostrado (aceptable, contexto tenant) |
| empresa_id | ✔ | ✖ | No mostrado (filtrado por empresa, aceptable) |
| tipo_libro | ✔ | ✔ | OK |
| periodo_id | ✔ | ✖ | Solo se muestra anio/mes, no el ID (aceptable) |
| anio | ✔ | ✔ | OK |
| mes | ✔ | ✔ | OK |
| fecha_generacion | ✔ | ✔ | OK |
| nombre_archivo | ✔ | ✔ | OK |
| ruta_archivo | ✔ | ✖ Faltante | No mostrado |
| estado | ✔ | ✔ (texto plano) | ⚠ Sin badge/chip de color por estado |
| fecha_envio_sunat | ✔ | ✖ Faltante | No mostrado |
| codigo_respuesta_sunat | ✔ | ✖ Faltante | No mostrado |
| total_registros | ✔ | ✔ | OK |
| observaciones | ✔ | ✖ Faltante | No mostrado |
| fecha_creacion | ✔ | ✖ Faltante | No mostrado |
| generado_por_usuario_id | ✔ | ✖ Faltante | No mostrado |

---

## 6. Componentes desalineados

### `src/features/tax/pages/PlePage.tsx`

| Problema | Detalle |
|---------|---------|
| ⚠ Desalineado | `DEFAULT.estado = 'generado'` — el contrato dice que el campo es ignorado en creación (siempre `borrador`) |
| ⚠ Desalineado | Formulario editar incluye campo `estado` — no existe en `LibroElectronicoUpdate` del contrato |
| ⚠ Desalineado | Constante `ESTADOS = ['generado', 'enviado', 'aceptado', 'rechazado']` — debería ser `['borrador', 'generado', 'enviado', 'anulado']` según flujo real del API |
| ✖ Faltante | Sin acciones de transición de estado en la tabla (marcar-generado, registrar-envio, anular) |
| ✖ Faltante | Sin confirmación antes de acciones irreversibles (anular) |
| ✖ Faltante | Sin badge/chip visual para el estado |

### `src/features/tax/types/tax.types.ts`

| Problema | Detalle |
|---------|---------|
| ✖ Faltante | Interface `LibroElectronicoRegistrarEnvio` no definida |
| ⚠ Desalineado | `EstadoLibroTax` no incluye `'borrador'` ni `'anulado'` — estados reales del flujo |
| ⚠ Desalineado | `LibroElectronicoUpdate` incluye campo `estado?: string` que **no existe** en el contrato API |
| ⚠ Desalineado | `LibroElectronico.fecha_generacion` marcada como `?: string | null` cuando el contrato la define como `required` (`string`, no null) |
| ⚠ Desalineado | `LibroElectronico.fecha_creacion` marcada como `?: string | null` cuando el contrato la define como `required` |
| ⚠ Desalineado | `LibroElectronicoCreate.tipo_libro` tipado como `TipoLibroTax` (union literal) pero el API acepta cualquier `string` (max 30) |

### `src/features/tax/services/tax.service.ts`

| Problema | Detalle |
|---------|---------|
| ✖ Faltante | Función `marcarGenerado(libroId: string)` |
| ✖ Faltante | Función `registrarEnvio(libroId: string, payload?: LibroElectronicoRegistrarEnvio)` |
| ✖ Faltante | Función `anular(libroId: string)` |

### `src/features/tax/routes.tsx`

| Problema | Detalle |
|---------|---------|
| ✖ Faltante | Ruta para vista de detalle (`/tax/ple/:libro_id`) |

---

## 7. Problemas de tipado

| Archivo | Problema | Severidad |
|---------|---------|-----------|
| `tax.types.ts` | `EstadoLibroTax` no incluye `borrador` ni `anulado` | Alta |
| `tax.types.ts` | `LibroElectronicoUpdate` tiene campo `estado` inexistente en contrato | Alta |
| `tax.types.ts` | `LibroElectronico.fecha_generacion` declarada opcional, es required en API | Media |
| `tax.types.ts` | `LibroElectronico.fecha_creacion` declarada opcional, es required en API | Media |
| `tax.types.ts` | Falta interface `LibroElectronicoRegistrarEnvio` | Alta |
| `tax.types.ts` | `LibroElectronicoCreate.tipo_libro: TipoLibroTax` — demasiado restrictivo vs contrato (string) | Baja |
| `PlePage.tsx` | Usa `any` implícito en parámetros del catch: `catch { }` sin tipo | Baja |

---

## 8. Problemas de RBAC y tenant

| Archivo | Problema |
|---------|---------|
| `PlePage.tsx` | Sin verificación de permisos RBAC antes de renderizar botón "Nuevo libro" |
| `PlePage.tsx` | Sin verificación de permisos RBAC antes de renderizar botones de editar por fila |
| `PlePage.tsx` | Las acciones de transición de estado (a implementar) deberán incluir guards RBAC |
| `PlePage.tsx` | `empresa_id` se obtiene de un selector manual; no se valida contra el tenant activo del store Zustand |

---

## 9. Resumen de implementación requerida en Fase 3

### Bloque 1 — Types
- Corregir `LibroElectronico`: `fecha_generacion` y `fecha_creacion` como required (no opcionales)
- Corregir `EstadoLibroTax`: agregar `'borrador'` y `'anulado'`
- Corregir `LibroElectronicoUpdate`: eliminar campo `estado`
- Agregar interface `LibroElectronicoRegistrarEnvio`

### Bloque 2 — Service
- Agregar `marcarGenerado(libroId: string): Promise<LibroElectronico>`
- Agregar `registrarEnvio(libroId: string, payload?: LibroElectronicoRegistrarEnvio): Promise<LibroElectronico>`
- Agregar `anular(libroId: string): Promise<LibroElectronico>`

### Bloque 3 — Hooks React Query
- Crear `src/features/tax/hooks/useLibrosElectronicos.ts`:
  - `useLibrosElectronicos(params)` — `useQuery` para GET lista
  - `useLibroElectronico(libroId)` — `useQuery` para GET detalle
  - `useCreateLibroElectronico()` — `useMutation` POST
  - `useUpdateLibroElectronico()` — `useMutation` PUT
  - `useMarcarGenerado()` — `useMutation` POST /marcar-generado
  - `useRegistrarEnvio()` — `useMutation` POST /registrar-envio
  - `useAnularLibro()` — `useMutation` POST /anular

### Bloque 4 — Componentes
- Refactorizar `PlePage.tsx`:
  - Migrar a React Query
  - Corregir constante `ESTADOS` → `['borrador', 'generado', 'enviado', 'anulado']`
  - Eliminar campo `estado` del formulario de edición
  - Agregar campo `ruta_archivo` en formularios crear y editar
  - Agregar badge/chip con color por estado
  - Agregar columnas faltantes en tabla: `ruta_archivo`, `fecha_envio_sunat`, `codigo_respuesta_sunat` (como detalle expandible o en vista de detalle)
  - Agregar acciones de transición de estado con guards por estado actual
  - Agregar confirmación antes de Anular
  - Agregar guards RBAC en acciones
- Crear `LibroElectronicoDetailPage.tsx` (detalle completo con todos los campos del response)
- Actualizar `routes.tsx` con ruta de detalle
