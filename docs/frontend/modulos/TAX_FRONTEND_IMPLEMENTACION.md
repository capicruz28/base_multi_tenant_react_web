# TAX — Frontend Implementation

**Módulo:** Gestión Tributaria / PLE SUNAT  
**Código:** TAX  
**Fecha de implementación:** 2026-05-09  
**Tipo de módulo:** Transaccional  
**Flujo de estados:** `borrador` → `generado` → `enviado` / `anulado`

---

## 1. Archivos del módulo

| Archivo | Tipo | Acción |
|---------|------|--------|
| `src/features/tax/types/tax.types.ts` | Types / Interfaces | Modificado |
| `src/features/tax/services/tax.service.ts` | Service (Axios) | Modificado |
| `src/features/tax/hooks/useLibrosElectronicos.ts` | Hooks (React Query) | Creado |
| `src/features/tax/components/TaxPageLayout.tsx` | Layout | Sin cambios |
| `src/features/tax/pages/PlePage.tsx` | Página lista | Refactorizado |
| `src/features/tax/pages/LibroElectronicoDetailPage.tsx` | Página detalle | Creado |
| `src/features/tax/routes.tsx` | Rutas | Modificado |

---

## 2. Cobertura de endpoints del contrato API

| # | Endpoint | Método | Interface | Service | Hook | Componente |
|---|----------|--------|-----------|---------|------|------------|
| 1 | `/api/v1/tax/libros-electronicos` | GET | `LibroElectronico` | `librosElectronicosService.list()` | `useLibrosElectronicos()` | `PlePage` |
| 2 | `/api/v1/tax/libros-electronicos` | POST | `LibroElectronicoCreate` | `librosElectronicosService.create()` | `useCreateLibroElectronico()` | `PlePage` (modal crear) |
| 3 | `/api/v1/tax/libros-electronicos/{id}` | GET | `LibroElectronico` | `librosElectronicosService.getById()` | `useLibroElectronico()` | `LibroElectronicoDetailPage` |
| 4 | `/api/v1/tax/libros-electronicos/{id}` | PUT | `LibroElectronicoUpdate` | `librosElectronicosService.update()` | `useUpdateLibroElectronico()` | `PlePage` (modal editar) |
| 5 | `/api/v1/tax/libros-electronicos/{id}/marcar-generado` | POST | — | `librosElectronicosService.marcarGenerado()` | `useMarcarGenerado()` | `PlePage` (botón por fila) |
| 6 | `/api/v1/tax/libros-electronicos/{id}/registrar-envio` | POST | `LibroElectronicoRegistrarEnvio` | `librosElectronicosService.registrarEnvio()` | `useRegistrarEnvio()` | `PlePage` (modal envío) |
| 7 | `/api/v1/tax/libros-electronicos/{id}/anular` | POST | — | `librosElectronicosService.anular()` | `useAnularLibro()` | `PlePage` (modal confirmación) |

**Cobertura: 7/7 endpoints — 100%**

---

## 3. Interfaces TypeScript

### `tax.types.ts`

```typescript
type TipoLibroTax = 'ventas' | 'compras' | 'diario' | 'mayor' | 'inventarios'
type EstadoLibroTax = 'borrador' | 'generado' | 'enviado' | 'anulado'

interface LibroElectronico           // LibroElectronicoRead del contrato
interface LibroElectronicoCreate     // POST body
interface LibroElectronicoUpdate     // PUT body (sin campo `estado`)
interface LibroElectronicoRegistrarEnvio  // POST /registrar-envio body (opcional)
```

---

## 4. Service layer

### `tax.service.ts` — `librosElectronicosService`

| Función | Método HTTP | Ruta |
|---------|------------|------|
| `list(params?)` | GET | `/tax/libros-electronicos` |
| `getById(libroId)` | GET | `/tax/libros-electronicos/{id}` |
| `create(payload)` | POST | `/tax/libros-electronicos` |
| `update(libroId, payload)` | PUT | `/tax/libros-electronicos/{id}` |
| `marcarGenerado(libroId)` | POST | `/tax/libros-electronicos/{id}/marcar-generado` |
| `registrarEnvio(libroId, payload?)` | POST | `/tax/libros-electronicos/{id}/registrar-envio` |
| `anular(libroId)` | POST | `/tax/libros-electronicos/{id}/anular` |

Cliente Axios: `import api from '@/core/api/api'`

---

## 5. Hooks React Query

### `hooks/useLibrosElectronicos.ts`

| Hook | Tipo | Query Key | Descripción |
|------|------|-----------|-------------|
| `useLibrosElectronicos(options?)` | `useTenantQuery` | `['tax','libros-electronicos','list',...]` | Lista con filtros |
| `useLibroElectronico(libroId?)` | `useTenantQuery` | `['tax','libros-electronicos','detail',id]` | Detalle por ID |
| `useCreateLibroElectronico()` | `useMutation` | — | Crea libro, invalida lista |
| `useUpdateLibroElectronico()` | `useMutation` | — | Actualiza libro, invalida lista y detalle |
| `useMarcarGenerado()` | `useMutation` | — | Transición borrador→generado, invalida lista y detalle |
| `useRegistrarEnvio()` | `useMutation` | — | Transición generado→enviado, invalida lista y detalle |
| `useAnularLibro()` | `useMutation` | — | Anula libro, invalida lista y detalle |

- Todos los hooks usan `useTenantQuery` (garantiza aislamiento por tenant).
- Todas las mutaciones manejan `onSuccess` (toast + invalidación) y `onError` (toast de error).

---

## 6. Componentes

### `pages/PlePage.tsx`

- **Ruta:** `/tax/ple`
- **Estado servidor:** `useLibrosElectronicos` (React Query)
- **Filtros:** empresa_id, tipo_libro, año, mes, estado
- **Tabla:** tipo, periodo, archivo, estado (badge), registros, fecha_generación, acciones
- **Badges de estado:**
  - `borrador` → gris
  - `generado` → azul
  - `enviado` → verde
  - `anulado` → rojo
- **Acciones por fila:**
  - Ver detalle (siempre visible)
  - Editar — requiere `can('tax', 'editar')`
  - Marcar generado — solo en estado `borrador`, requiere `can('tax', 'editar')`
  - Registrar envío SUNAT — solo en estado `generado`, requiere `can('tax', 'editar')` (abre modal con campos opcionales)
  - Anular — en cualquier estado excepto `anulado`, requiere `can('tax', 'editar')` (modal de confirmación)
- **Formulario Crear** (`LibroElectronicoCreate`): empresa, tipo_libro, periodo, año, mes, nombre_archivo, ruta_archivo, total_registros, observaciones
- **Formulario Editar** (`LibroElectronicoUpdate`): nombre_archivo, ruta_archivo, fecha_envio_sunat, codigo_respuesta_sunat, total_registros, observaciones

### `pages/LibroElectronicoDetailPage.tsx`

- **Ruta:** `/tax/ple/:libro_id`
- **Estado servidor:** `useLibroElectronico(libro_id)`
- **Campos mostrados:** todos los del response `LibroElectronicoRead` (17 campos)
- Maneja: loading, error, empty state
- Botón "Volver" a `/tax/ple`

### `components/TaxPageLayout.tsx`

Sin modificaciones. Layout estándar con título, descripción y slot de acción.

---

## 7. Rutas

```
/tax                    → redirect a /tax/ple
/tax/ple                → PlePage (lista)
/tax/ple/:libro_id      → LibroElectronicoDetailPage (detalle)
/tax/*                  → redirect a /tax/ple
```

---

## 8. Verificaciones finales

| Verificación | Resultado |
|-------------|-----------|
| Todos los endpoints tienen interface TypeScript | ✔ |
| Todos los endpoints tienen función en el service | ✔ |
| Todos los endpoints tienen hook de React Query | ✔ |
| Todos los endpoints tienen componente que los consume | ✔ |
| Ningún componente existente fue eliminado | ✔ |
| Sin uso de `any` en ningún archivo del módulo | ✔ (verificado con grep) |
| Sin errores de linter en ningún archivo | ✔ |
| Flujo de estados completo e implementado | ✔ |
| Guards RBAC en todas las acciones de escritura | ✔ |
| Confirmación antes de acción irreversible (anular) | ✔ |
| Sin inventar endpoints fuera del contrato | ✔ |
| Cliente Axios sin modificaciones | ✔ |

---

## 9. Dependencias entre módulos

| Módulo externo | Uso |
|---------------|-----|
| `@/features/org/services/org.service` → `empresaService.list()` | Selector de empresa en filtros y formulario crear |
| `@/features/fin/services/fin.service` → `periodoContableService.list()` | Selector de periodo contable en formulario crear |
| `@/core/auth/hooks/usePermissions` → `usePermissions()` | Guards RBAC |
| `@/core/hooks/useTenantQuery` → `useTenantQuery()` | Queries con aislamiento por tenant |
| `@/core/services/error.service` → `getErrorMessage()` | Normalización de errores en hooks |
