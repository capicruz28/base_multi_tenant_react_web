# Auditoría funcional frontend — Módulo ORG (Organización)

**Fecha de auditoría:** 2025-03-05  
**Alcance:** Solo análisis. Sin modificación de código.  
**Fuentes:** CATALOGO_MODULOS.md, MENU_NAVEGACION.md, MANUAL_USUARIO.md, backend_openapi.json, código frontend del proyecto.

---

## 1. Resumen del módulo

El **módulo ORG (Organización)** es el primer módulo del ERP (Starter). Según la documentación:

- **CATALOGO_MODULOS.md:** Incluye estructura organizacional completa, sucursales, departamentos, cargos, centros de costo, catálogo de monedas y multi-moneda.
- **MENU_NAVEGACION.md** define 7 opciones de menú:
  1. Monedas (catálogo de monedas, moneda base y decimales)
  2. Mi Empresa (datos empresa, RUC, razón social, logo, moneda base, activar/desactivar multi-moneda)
  3. Sucursales
  4. Departamentos
  5. Cargos
  6. Centros de Costo
  7. Parámetros del Sistema

**Implementación frontend actual:**  
- Rutas bajo `/org/*` (router principal), con `PermissionGuard` módulo `org` acción `ver`.
- Carpetas: `src/features/org/` (pages, services, types, components, routes).
- **6 pantallas** implementadas: Mi Empresa, Sucursales, Departamentos, Cargos, Centros de costo, Parámetros.
- **No existe** pantalla ni ruta para **Monedas**.

---

## 2. Funcionalidades definidas en documentación

| # | Funcionalidad | Documento | Descripción esperada |
|---|----------------|-----------|----------------------|
| 1 | Catálogo de monedas | MENU_NAVEGACION, MANUAL (PASO 0) | Catálogo PEN, USD, EUR, BRL; configurar moneda base y decimales; solo una moneda base; activo/inactivo. |
| 2 | Mi Empresa | MENU_NAVEGACION, MANUAL (PASO 1) | Ver/editar RUC, razón social, nombre comercial, tipo empresa, país; configurar moneda base (selector desde catálogo); activar/desactivar multi-moneda; subir logo (PNG). |
| 3 | Sucursales | MENU_NAVEGACION, MANUAL (PASO 2) | Gestionar sucursales: código, nombre, dirección, teléfono, responsable; marcar “es principal” (casa matriz). |
| 4 | Departamentos | MENU_NAVEGACION, MANUAL (PASO 3) | Estructura jerárquica por áreas; código, nombre; jerarquía (departamento padre). |
| 5 | Cargos | MENU_NAVEGACION, MANUAL (PASO 4) | Puestos de trabajo: código, nombre (ej. operario, vendedor, contador). |
| 6 | Centros de costo | MENU_NAVEGACION, MANUAL (PASO 5) | Código, nombre, tipo (documentación: Productivo / No productivo). |
| 7 | Parámetros del sistema | MENU_NAVEGACION, MANUAL (PASO 6) | Configuración global: método costeo, decimales, IGV, redondeo, opciones producción, etc. |

---

## 3. Pantallas detectadas en frontend

| Pantalla | Archivo | Componentes principales | Hooks / estado | Permisos |
|----------|---------|--------------------------|----------------|----------|
| Mi Empresa | `src/features/org/pages/EmpresaPage.tsx` | OrgPageLayout, Dialog, tabla, inputs | useState, useEffect, useCallback, useMemo | Ruta protegida por PermissionGuard org/ver |
| Sucursales | `src/features/org/pages/SucursalesPage.tsx` | OrgPageLayout, Dialog, tabla, select empresa | useState, useEffect, useCallback | Idem |
| Departamentos | `src/features/org/pages/DepartamentosPage.tsx` | OrgPageLayout, Dialog, tabla, select empresa | useState, useEffect, useCallback | Idem |
| Cargos | `src/features/org/pages/CargosPage.tsx` | OrgPageLayout, Dialog, tabla, select empresa | useState, useEffect, useCallback | Idem |
| Centros de costo | `src/features/org/pages/CentrosCostoPage.tsx` | OrgPageLayout, Dialog, tabla, select empresa | useState, useEffect, useCallback | Idem |
| Parámetros del sistema | `src/features/org/pages/ParametrosPage.tsx` | OrgPageLayout, Dialog, tabla, select módulo | useState, useEffect, useCallback | Idem |

**Layout común:** `src/features/org/components/OrgPageLayout.tsx` (título, descripción, acción opcional).

**Rutas SPA:** Definidas en `src/features/org/routes.tsx`: `/org` (redirect a empresa), `/org/empresa`, `/org/sucursales`, `/org/departamentos`, `/org/cargos`, `/org/centros-costo`, `/org/parametros`. No existe ruta `/org/monedas`.

---

## 4. Consumo de endpoints detectado

Servicio único: `src/features/org/services/org.service.ts` (base `/org`). Instancia: `@/core/api/api` (axios con Bearer).

| Recurso | GET list | GET by id | POST | PUT | DELETE / Reactivar |
|---------|----------|-----------|------|-----|--------------------|
| Empresa | ✅ `empresaService.list` → GET `/org/empresa` | ✅ `empresaService.getById` (no usado en páginas) | ✅ `empresaService.create` | ✅ `empresaService.update` | ❌ No usado |
| Sucursales | ✅ `sucursalService.list` → GET `/org/sucursales` | ✅ getById (no usado en UI) | ✅ create | ✅ update | ❌ No usado |
| Departamentos | ✅ `departamentoService.list` | ✅ getById (no usado en UI) | ✅ create | ✅ update | ❌ No usado |
| Cargos | ✅ `cargoService.list` | ✅ getById (no usado en UI) | ✅ create | ✅ update | ❌ No usado |
| Centros de costo | ✅ `centroCostoService.list` | ✅ getById (no usado en UI) | ✅ create | ✅ update | ❌ No usado |
| Parámetros | ✅ `parametroService.list` | ✅ getById (no usado en UI) | ✅ create | ✅ update | ❌ No usado |
| Monedas | ❌ No existe en frontend | ❌ | ❌ | ❌ | ❌ |

**Uso en otras features:** `empresaService`, `sucursalService`, `departamentoService`, `cargoService`, `centroCostoService` se consumen desde FIN, LOG, HCM, INV, SLS, PUR, BDG, MFG, MNT, POS, INV_BILL, etc., para selectores y filtros.

---

## 5. Matriz funcionalidad vs implementación

| Funcionalidad | Estado | Observaciones |
|---------------|--------|----------------|
| Catálogo de monedas | ✖ No implementada | Sin pantalla, sin ruta, sin servicio ni tipos. Backend expone GET/POST/PUT/DELETE `/api/v1/org/monedas`. |
| Mi Empresa | ⚠ Parcial | Listado, crear, editar. Implementado: selector moneda base en edición, switch multi-moneda, **tipo empresa** en tipos y formularios. Falta: logo (doc). RUC bloqueado en edición (alineado doc). |
| Sucursales | ✔ Implementada | Listar, filtrar por empresa, crear, editar. Campos: código, nombre, tipo, dirección, teléfono, email, responsable, casa matriz, punto de venta, almacén. |
| Departamentos | ⚠ Parcial | Listar, crear, editar. Falta: jerarquía (departamento padre) en formulario y vista; descripción en create. |
| Cargos | ⚠ Parcial | Listar, crear, editar. Solo código y nombre en formularios; tipos incluyen descripción, nivel, categoría, área, departamento, cargo jefe, rango salarial (no expuestos en UI). |
| Centros de costo | ✔ Implementada | Listar, crear, editar con tipo (operativo/administrativo/proyecto). Doc menciona “Productivo/No productivo” (posible mapeo backend). |
| Parámetros del sistema | ⚠ Parcial | Listar por módulo, crear, editar. Edición: solo valor texto y activo; no se editan según tipo_dato (valor_numerico, valor_booleano, valor_fecha). Parámetros predefinidos del manual (costeo, IGV, decimales) no se presentan como pantalla guiada. |

---

## 6. Pantallas faltantes

### 6.1 Monedas (prioridad alta)

- **Funcionalidad faltante:** Catálogo de monedas (PASO 0 del manual).
- **Pantalla sugerida:** “Monedas” en ORG, ruta `/org/monedas`.
- **Endpoints a consumir:**  
  - GET `/api/v1/org/monedas` (listar), GET `/api/v1/org/monedas/{moneda_id}` (detalle),  
  - POST `/api/v1/org/monedas`, PUT `/api/v1/org/monedas/{moneda_id}`, DELETE `/api/v1/org/monedas/{moneda_id}`.
- **Operaciones:** Alta, edición, activar/desactivar (o delete según política). Campos esperados (según manual): código, nombre, símbolo, decimales, “es moneda base” (única), activo.
- **Ubicación:** `src/features/org/pages/MonedasPage.tsx`, ruta en `org/routes.tsx`, ítem en menú dinámico (backend). Servicio: `monedaService` en `org.service.ts`; tipos en `org.types.ts`.

---

## 7. Pantallas incompletas

| Pantalla | Falta | Recomendación |
|----------|--------|----------------|
| Mi Empresa | Logo (subir PNG) | Selector moneda, multi-moneda y tipo empresa ya implementados. Pendiente: subida de logo si el backend lo expone. |
| Departamentos | Jerarquía (departamento padre) en formulario; vista en árbol o jerárquica | Incluir `departamento_padre_id` en create/edit y listado con jerarquía. |
| Cargos | Descripción, departamento, categoría, cargo jefe, rango salarial (opcionales) | Ampliar formularios create/edit con campos del tipo `CargoCreate`. |
| Parámetros | Edición según tipo_dato (numérico, booleano, fecha); pantalla guiada de “parámetros ORG” (costeo, IGV, decimales) | Formulario de edición condicional por tipo_dato; opcional: vista por módulo ORG con parámetros predefinidos. |
| Todas (Empresa, Sucursales, Departamentos, Cargos, Centros de costo) | Eliminar / desactivar; reactivar (Empresa) | Consumir DELETE y POST `…/reactivar` donde el backend lo ofrezca; sustituir o complementar con “Activo” según diseño. |

---

## 8. Endpoints backend no utilizados

Según `backend_openapi.json`:

| Endpoint | Métodos | Uso en frontend |
|----------|---------|-------------------|
| `/api/v1/org/monedas` | get, post | No utilizado (no existe módulo Monedas). |
| `/api/v1/org/monedas/{moneda_id}` | get, put, delete | No utilizado. |
| `/api/v1/org/empresa/{empresa_id}/reactivar` | post | No utilizado. |
| DELETE `/api/v1/org/empresa/{empresa_id}` | delete | No utilizado. |
| DELETE `/api/v1/org/sucursales/{sucursal_id}` | delete | No utilizado. |
| DELETE `/api/v1/org/departamentos/{departamento_id}` | delete | No utilizado. |
| DELETE `/api/v1/org/cargos/{cargo_id}` | delete | No utilizado. |
| DELETE `/api/v1/org/centros-costo/{centro_costo_id}` | delete | No utilizado. |
| DELETE `/api/v1/org/parametros/{parametro_id}` | delete | No utilizado. |

**Resumen:** Toda la API de **monedas** está sin usar; **reactivar** empresa y **DELETE** de todas las entidades ORG no están utilizados en la UI.

---

## 9. Problemas de navegación

- **Orden y existencia en menú:** El menú se construye de forma dinámica (p. ej. desde backend `getmenu`). Si el seed/backend no incluye la opción “Monedas” con ruta `/org/monedas`, el usuario no podrá acceder aunque se implemente la pantalla. Hay que asegurar que el ítem “Monedas” exista en el menú del módulo ORG y que su orden sea el primero (PASO 0).
- **Redirect por defecto:** `/org` redirige a `/org/empresa`. Según el manual, el flujo recomendado es Monedas → Mi Empresa → …; si se añade Monedas, valorar redirigir `/org` a `/org/monedas` o mantener empresa según criterio de producto.
- **Rutas definidas en frontend:** Coinciden con MENU_NAVEGACION para todo lo implementado excepto Monedas (falta ruta y pantalla).

---

## 10. Problemas de formularios

| Área | Problema | Detalle |
|------|----------|---------|
| Empresa | Moneda base libre texto | Campo `moneda_base` es input texto; debería ser selector desde catálogo de monedas (cuando exista). |
| Empresa | — | Multi-moneda y tipo empresa ya están en tipos y formularios (crear/editar). |
| Departamentos | Sin jerarquía en formulario | No se muestra ni edita `departamento_padre_id`; no hay vista en árbol. |
| Cargos | Formularios mínimos | Solo código y nombre; el tipo permite más campos (descripción, departamento_id, etc.). |
| Parámetros | Edición de valor incompleta | En edición solo se muestra valor texto y activo; no hay campos condicionales para valor_numerico, valor_booleano, valor_fecha según tipo_dato. |
| Parámetros | Creación sin valores por tipo | En crear no se piden valores iniciales según tipo_dato. |
| General | Validación de errores API | Se usa `getErrorMessage(err)` y toast; no hay muestra estructurada de errores 422 (campos) en formularios. |
| General | Sin confirmación de eliminación | No hay flujo de eliminación (DELETE) ni mensajes de confirmación. |

---

## 11. Riesgos detectados

| Riesgo | Impacto | Mitigación sugerida |
|--------|--------|----------------------|
| Flujo inicial del manual imposible | Alto | Usuario no puede seguir “PASO 0: Monedas” ni elegir moneda base desde catálogo en Mi Empresa. Implementar Monedas y acoplar Mi Empresa al catálogo. |
| Multi-moneda sin soporte en UI | Medio | Documentos en otras monedas y reportes pueden depender de configuración que el usuario no puede completar desde ORG. Definir con backend si existe campo multi_moneda y exponerlo en Mi Empresa. |
| Eliminación/desactivación solo vía backend | Medio | Sin DELETE ni reactivar en UI, el usuario no puede desactivar o reactivar entidades desde el frontend. Añadir acciones “Desactivar”/“Reactivar” o “Eliminar” según política. |
| Parámetros del sistema poco usables | Medio | Parámetros genéricos (crear/editar por código) no guían al usuario como en el manual (costeo, IGV, decimales). Valorar pantalla específica o plantilla de parámetros ORG. |
| Inconsistencia tipo centro de costo | Bajo | Manual: “Productivo / No productivo”; frontend: “operativo / administrativo / proyecto”. Verificar con backend el dominio de valores y alinear etiquetas. |
| Dependencias cruzadas | Bajo | FIN, HCM, SLS, etc. usan empresa, sucursal, centro de costo; si se elimina o desactiva sin flujo claro, puede afectar a otros módulos. Documentar y, si aplica, restringir eliminación cuando existan dependencias. |

---

## 12. Plan de implementación recomendado

### Fase 1 — Monedas y alineación Mi Empresa

1. **Pantalla Monedas**
   - Crear `MonedasPage.tsx` en `src/features/org/pages/`.
   - Añadir en `org.service.ts`: `monedaService` con list, getById, create, update; opcional delete o desactivar.
   - Añadir tipos `Moneda`, `MonedaCreate`, `MonedaUpdate` en `org.types.ts` (código, nombre, símbolo, decimales, es_moneda_base, es_activo, etc., según OpenAPI).
   - Ruta en `org/routes.tsx`: path `monedas`, lazy de MonedasPage.
   - Asegurar ítem “Monedas” en menú (backend/seed) apuntando a `/org/monedas`.

2. **Mi Empresa**
   - Consumir GET `/api/v1/org/monedas` para rellenar selector de moneda base (en lugar de input texto).
   - Si el backend expone multi-moneda y tipo empresa, añadir campos al tipo y formularios.

### Fase 2 — Completar CRUD y flujos

3. **Eliminar / desactivar / reactivar**
   - En cada listado (Empresa, Sucursales, Departamentos, Cargos, Centros de costo, Parámetros): añadir acción “Desactivar” o “Eliminar” según política, llamando a DELETE del recurso; para Empresa, añadir “Reactivar” con POST `…/reactivar`.
   - Confirmación modal antes de eliminar/desactivar.
   - Actualizar lista tras la acción.

4. **Departamentos**
   - Incluir `departamento_padre_id` en create/update; selector de departamento padre en formulario (lista plana o jerárquica).
   - Opcional: vista en árbol o columnas anidadas en tabla.

5. **Cargos**
   - Ampliar formularios create/edit con descripción, departamento (selector), y opcionalmente categoría, cargo jefe, rango salarial.

6. **Parámetros**
   - En edición, mostrar y editar valor según `tipo_dato`: input numérico, checkbox, date, o texto según corresponda.
   - En creación, permitir valor inicial por tipo_dato.

### Fase 3 — UX y consistencia

7. **Validación y errores**
   - Mostrar errores 422 por campo en formularios (mensajes del backend) además del toast.

8. **Navegación**
   - Decidir si `/org` debe redirigir a Monedas o a Empresa; mantener coherencia con el manual y el menú.

9. **Documentación**
   - Actualizar DOC_FRONTEND_MODULO_ORG.md con endpoints y esquemas de Monedas; documentar DELETE y reactivar si se implementan.

---

## 13. Verificación del plan de implementación (post-implementación)

Estado de cada ítem del plan, verificado en código:

| # | Ítem | Estado | Notas |
|---|------|--------|--------|
| 1 | **Pantalla Monedas** | ✅ Implementado | `MonedasPage.tsx`, `monedaService` en org.service.ts, tipos en org.types.ts, ruta `/org/monedas` en routes.tsx. |
| 2 | **Mi Empresa: selector moneda + multi-moneda + tipo empresa** | ✅ Implementado | En edición: selector de moneda base desde GET monedas; checkbox multi-moneda en crear y editar; campo **Tipo empresa** añadido a tipos (`Empresa`, `EmpresaCreate`) y a formularios crear/editar (backend OpenAPI expone `tipo_empresa`). |
| 3 | **Eliminar / reactivar** | ✅ Implementado | Empresa, Sucursales, Departamentos, Cargos, Centros de costo, Parámetros y Monedas: botón Eliminar + `ConfirmDialog`; Empresa además tiene Reactivar (POST reactivar). |
| 4 | **Departamentos: departamento padre** | ✅ Implementado | `departamento_padre_id` en create/update, selector en formularios y columna "Padre" en tabla. |
| 5 | **Cargos: descripción y departamento** | ✅ Implementado | Formularios create/edit incluyen descripción y selector de departamento; tabla muestra departamento. |
| 6 | **Parámetros: valor por tipo_dato** | ✅ Implementado | Creación: valor inicial según tipo_dato (texto, numérico, booleano, fecha, json). Edición: campo de valor condicional por tipo_dato. |
| 7 | **Validación y errores 422** | ⚠ Pendiente | Solo toast; no hay muestra estructurada de errores por campo en formularios. |
| 8 | **Navegación /org** | ✔ Decidido | `/org` redirige a `/org/empresa`; manual sugiere Monedas primero pero se mantiene empresa como entrada. |
| 9 | **Documentación DOC_FRONTEND_MODULO_ORG** | ⚠ Pendiente | Actualizar con Monedas, DELETE y reactivar si no está ya reflejado. |

**Resumen:** Los puntos 1 a 6 del plan están implementados. Tipo empresa está en tipos y en formularios de Mi Empresa (crear y editar). Pendientes opcionales: 7 (errores 422 por campo) y 9 (documentación).

---

**Fin del documento de auditoría.**
