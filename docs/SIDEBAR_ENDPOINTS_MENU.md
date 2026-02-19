# Sidebar: endpoints y lógica del menú de módulos

El sidebar **no es estático**. Los ítems de la sección "Módulos" se cargan desde el backend según el tipo de usuario. Aquí se indican los endpoints que se consumen y por qué podrían no mostrarse módulos/secciones/menús nuevos.

---

## 1. Qué usuario estás usando

El comportamiento cambia según el rol:

| Tipo de usuario | Condición en código | Origen del menú |
|-----------------|---------------------|------------------|
| **Usuario normal** | `!isSuperAdmin && accessLevel < 4` | Un solo endpoint que devuelve la estructura completa. |
| **Tenant Admin / Super Admin** | `accessLevel >= 4` o `isSuperAdmin` | Se construye a partir de **módulos activos del cliente** y luego se piden secciones y menús por módulo. |

---

## 2. Usuario normal: un solo endpoint

**Endpoint:**  
`GET /api/v1/modulos-menus/usuario/{usuario_id}/`  
Query opcional: `?cliente_id={cliente_id}`

**Servicio:** `menuService.getUserMenu(usuarioId, clienteId)`  
**Archivo:** `src/features/admin/services/menu.service.ts` (aprox. líneas 57–92)

**Respuesta esperada:**  
`{ modulos: ModuloConSecciones[] }`  
Cada módulo tiene `secciones[]` y cada sección tiene `menus[]` (y submenús si aplica).

**Si no ves módulos nuevos (usuario normal):**

- El backend debe incluir esos módulos en la respuesta de `/modulos-menus/usuario/{usuario_id}/`.
- Revisar en backend: ¿el endpoint filtra por roles del usuario, por permisos por menú, o por módulos activos del cliente? Si el usuario no tiene al menos un permiso “ver” sobre algún ítem del nuevo módulo, el backend podría no devolverlo.
- Comprobar en DevTools (pestaña Red) la llamada a `modulos-menus/usuario/...` y ver si en la respuesta vienen los módulos/secciones/menús que registraste.

---

## 3. Tenant Admin / Super Admin: varios endpoints

Para estos usuarios el menú se **construye en el frontend** a partir de:

1. Módulos **activados para el cliente** (tabla `cliente_modulo`).
2. Para cada módulo activado: detalle del módulo, secciones del módulo, menús por sección.

**Flujo en código:** `buildHierarchicalMenuFromClienteModulos(clienteId)` en `NewSidebar.tsx` (aprox. líneas 273–388).

### 3.1 Módulos activos del cliente

**Endpoint:**  
`GET /api/v1/cliente-modulo/cliente/{cliente_id}/`

**Servicio:** `clienteModuloService.getClienteModulosByClienteId(clienteId)`  
**Archivo:** `src/features/modulos/services/cliente-modulo.service.ts`

**Respuesta esperada:**  
`{ success: boolean, message: string, data: ClienteModulo[] }`  
Cada ítem tiene al menos `modulo_id` (y datos de activación).

**Importante:** Solo aparecen en el sidebar los módulos que estén **activados para ese cliente**. Si solo registraste filas en `modulo`, `seccion` y `menu` pero **no** diste de alta el módulo en `cliente_modulo` para el cliente con el que entras, ese módulo no se mostrará.

- En la app: Super Admin → Clientes → [tu cliente] → pestaña “Módulos” → activar los módulos que quieras ver.
- En BD: que existan filas en `cliente_modulo` con ese `cliente_id` y el `modulo_id` correspondiente.

### 3.2 Detalle de cada módulo

**Endpoint:**  
`GET /api/v1/modulos/{modulo_id}/`

**Servicio:** `moduloV2Service.getModuloById(moduloId)`  
**Archivo:** `src/features/modulos/services/modulo-v2.service.ts`

Se usa para nombre, icono, color, orden del módulo.

### 3.3 Secciones del módulo

**Endpoint:**  
`GET /api/v1/secciones/modulo/{modulo_id}/`

**Servicio:** `seccionService.getSecciones({ modulo_id: moduloId, es_activa: true })`  
Internamente llama a `getSeccionesByModulo(moduloId)` y aplica filtro `es_activa: true`.  
**Archivo:** `src/features/modulos/services/seccion.service.ts`

**Respuesta esperada:**  
`{ success: boolean, message: string, data: Seccion[] }`  
El frontend además pagina en memoria (por defecto `limit: 20`). Si un módulo tiene más de 20 secciones activas, solo se muestran las primeras 20. Para muchos módulos/secciones se aumentó el `limit` al pedir secciones para el sidebar (ver más abajo).

Solo se muestran secciones con `es_activa === true`. Si las nuevas secciones están inactivas, no salen.

### 3.4 Menús de cada sección

**Endpoint:**  
`GET /api/v1/modulos-menus/modulo/{modulo_id}/?seccion_id={seccion_id}`

**Servicio:** `menuService.getMenusByModulo(moduloId, seccion.seccion_id)`  
**Archivo:** `src/features/admin/services/menu.service.ts` (aprox. líneas 404–430)

**Respuesta esperada:**  
Lista de ítems de menú (y submenús si el backend los devuelve anidados) para esa sección.

En el sidebar solo se muestran secciones que tengan al menos un menú (`menus.length > 0`). Si el backend devuelve vacío para esa `seccion_id`, la sección no se muestra.

---

## 4. Resumen de endpoints según tipo de usuario

**Usuario normal:**

| Paso | Método | Endpoint |
|------|--------|----------|
| 1 | GET | `/api/v1/modulos-menus/usuario/{usuario_id}/?cliente_id=...` |

**Tenant Admin / Super Admin:**

| Paso | Método | Endpoint |
|------|--------|----------|
| 1 | GET | `/api/v1/cliente-modulo/cliente/{cliente_id}/` |
| 2 | GET | `/api/v1/modulos/{modulo_id}/` (por cada módulo activo) |
| 3 | GET | `/api/v1/secciones/modulo/{modulo_id}/` (por cada módulo) |
| 4 | GET | `/api/v1/modulos-menus/modulo/{modulo_id}/?seccion_id={seccion_id}` (por cada sección) |

---

## 5. Checklist si no se visualizan módulos/secciones/menús

**Si entras como Tenant Admin o Super Admin:**

1. ¿El módulo está **activado para el cliente** con el que iniciaste sesión?  
   - Revisar en Super Admin → Clientes → [cliente] → Módulos, o en BD tabla `cliente_modulo`.
2. ¿Las **secciones** del módulo están activas?  
   - Backend debe devolverlas en `GET /secciones/modulo/{modulo_id}/` con `es_activo: true` (el frontend mapea a `es_activa`).
3. ¿Los **menús** están asociados al módulo y a la sección correcta?  
   - Comprobar en la respuesta de `GET /modulos-menus/modulo/{modulo_id}/?seccion_id={seccion_id}`.

**Si entras como usuario normal:**

1. ¿El endpoint `GET /modulos-menus/usuario/{usuario_id}/` devuelve en `modulos` los nuevos módulos?  
   - Revisar en DevTools la respuesta del request.
2. Si no los devuelve: en backend, revisar la lógica que arma esa respuesta (roles, permisos por menú, módulos activos del cliente, etc.).

---

## 6. Dónde está la lógica en el frontend

- **Decisión de flujo (usuario normal vs admin):**  
  `src/shared/components/layout/NewSidebar.tsx`, dentro del `useEffect` que hace `fetchData`, aprox. líneas 411–436 (variable `isNormalUser`, llamada a `getUserMenu` o a `buildHierarchicalMenuFromClienteModulos`).
- **Construcción del árbol para admin:**  
  `buildHierarchicalMenuFromClienteModulos`, mismo archivo aprox. líneas 273–388.
- **Transformación a ítems del sidebar:**  
  `transformModulosToSidebarItems`, mismo archivo aprox. líneas 483–565.
- **Servicios y endpoints:**  
  - Menú: `src/features/admin/services/menu.service.ts`  
  - Cliente-módulo: `src/features/modulos/services/cliente-modulo.service.ts`  
  - Secciones: `src/features/modulos/services/seccion.service.ts`  
  - Módulos V2: `src/features/modulos/services/modulo-v2.service.ts`

Con esto puedes verificar en backend y en Red que los endpoints que alimentan el sidebar devuelvan los módulos, secciones y menús que acabas de registrar.
