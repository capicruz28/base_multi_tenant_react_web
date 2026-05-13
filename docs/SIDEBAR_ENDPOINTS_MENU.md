# Sidebar: endpoints y lógica del menú de módulos

El sidebar **no es estático**. Los ítems de la sección "Módulos" se cargan desde el backend. Desde la refactorización, **todos los tipos de usuario** (normal, Tenant Admin, Super Admin) usan **un solo endpoint**.

---

## 1. Endpoint único para el sidebar

**Endpoint:**  
`GET /api/v1/modulos-menus/me/`

- No se envían `usuario_id` ni `cliente_id` en la URL; el backend usa el token (usuario + tenant).
- **Una sola petición** para obtener el árbol completo: módulos → secciones → menús → submenús.

**Servicio:** `menuService.getMenuMe()`  
**Archivos:**  
- `src/features/admin/services/menu.service.ts` (método `getMenuMe`)  
- `src/shared/components/layout/NewSidebar.tsx` (en el `useEffect` que hace `fetchData`)

**Respuesta esperada:**  
`{ modulos: ModuloConSecciones[] }`  
Cada módulo tiene `secciones[]` y cada sección tiene `menus[]` (y `submenus` si aplica). Cada ítem incluye `permisos` (ver, crear, editar, etc.).

**Comportamiento por tipo de usuario (resuelto en backend):**

| Tipo de usuario   | Qué ve en el menú |
|-------------------|-------------------|
| Usuario normal    | Solo módulos contratados y menús donde tiene permiso **ver** (según sus roles). |
| Admin tenant      | Módulos contratados + menús según permisos de sus roles. |
| Super Admin       | Todos los menús de los módulos contratados del tenant actual, con todos los permisos. |

---

## 2. Si no se visualizan módulos/secciones/menús

1. **¿El módulo está activado para el cliente (tenant)?**  
   Revisar en Super Admin → Clientes → [cliente] → Módulos, o en BD tabla `cliente_modulo`.

2. **¿Las secciones están activas?**  
   El backend solo incluye secciones activas en la respuesta de `/me/`.

3. **¿Los menús están asociados al módulo y sección correctos?**  
   Revisar en backend la construcción del árbol (tabla `modulo_menu`, etc.).

4. **Usuario normal:**  
   Si no ves un ítem, el backend está filtrando por permisos (rol_menu_permiso). Revisar en DevTools la respuesta de `GET /api/v1/modulos-menus/me/` y comprobar que los `modulos` incluyan lo esperado.

---

## 3. Dónde está la lógica en el frontend

- **Carga del menú:**  
  `src/shared/components/layout/NewSidebar.tsx`: en el `useEffect` que hace `fetchData` se llama a `menuService.getMenuMe()` y el resultado se transforma con `transformModulosToSidebarItems`.

- **Transformación a ítems del sidebar:**  
  `transformModulosToSidebarItems` en el mismo archivo.

- **Servicio:**  
  `src/features/admin/services/menu.service.ts` (`getMenuMe()`).

- **Gestión de permisos por rol (admin):**  
  `src/features/admin/components/RolePermissionsManager.tsx` también usa `menuService.getMenuMe()` y mapea la respuesta a la estructura jerárquica que muestra (módulos → secciones → menús). No se usa ya la construcción N+1 por módulo/sección.

---

## 4. Endpoint alternativo (por ID de usuario)

Si en algún flujo de admin se necesita el menú de **otro** usuario (mismo tenant):

**Endpoint:** `GET /api/v1/modulos-menus/usuario/{usuario_id}/`  
**Servicio:** `menuService.getUserMenu(usuarioId, clienteId?)`

Para el **sidebar del usuario actual** se debe usar siempre **GET /modulos-menus/me/**.

---

Con esto puedes verificar en backend y en Red que el endpoint `/me/` devuelva los módulos, secciones y menús esperados para el usuario autenticado y el tenant actual.
