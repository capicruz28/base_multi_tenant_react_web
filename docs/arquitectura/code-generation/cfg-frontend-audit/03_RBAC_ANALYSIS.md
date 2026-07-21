# CFG Frontend Audit — RBAC (AS-IS)

**Fecha:** 2026-07-17  
**Contrato:** `docs/frontend-contracts/cfg/04_RBAC.md`

---

## 1. Permisos del contrato CFG (MVP)

| Código | Uso |
|--------|-----|
| `cfg.secuencias.consultar` | Entrada módulo, listado, detalle, preview |
| `cfg.secuencias.actualizar` | PATCH, DELETE soft, reactivar |

No hay create, ni permisos por campo, ni por `sequence_key` en el MVP.

---

## 2. Dos sistemas de permisos en el Frontend (AS-IS)

El proyecto opera con **dos canales paralelos**. Confundirlos es el principal riesgo RBAC para CFG.

### 2.1 LBAC derivado del menú

| Aspecto | Detalle |
|---------|---------|
| Fuente | `GET /auth/menu` → permisos en `AuthContext` |
| Hook | `usePermissions()` → `can(module, action)` |
| Acciones tipadas | `ver` \| `crear` \| `editar` \| `eliminar` \| `exportar` \| `imprimir` |
| Guard de ruta | `PermissionGuard module="…" action="ver"` |
| Uso típico | Catálogos ORG/INV: botones crear/editar/desactivar vía `can('org','editar')` |

Archivos:

- `src/core/auth/hooks/usePermissions.ts`
- `src/app/router/guards/PermissionGuard.tsx`
- `src/core/auth/types/permission.types.ts`

### 2.2 RBAC de negocio (códigos punteados)

| Aspecto | Detalle |
|---------|---------|
| Fuente | `GET /auth/permissions/me` |
| Hook | `usePermission()` → `hasPermission(code)` |
| Forma de código | `'wms.zona.crear'`, `'inv.movimiento.autorizar'`, … |
| Uso típico | WMS páginas, INV transaccional B-L/B-F |
| Nota | No sustituye visibilidad del menú |

Archivos:

- `src/core/auth/PermissionContext.tsx`
- Constantes ejemplo: `src/features/inv/constants/inv-permissions.ts`
- Uso UI ejemplo: `src/features/wms/pages/ZonasPage.tsx`

---

## 3. Encaje de los permisos CFG

Los códigos del contrato son **punteados** (`cfg.secuencias.consultar`), no acciones LBAC genéricas (`cfg` + `ver`).

| Capacidad contrato | Canal Frontend natural (AS-IS) |
|--------------------|--------------------------------|
| `cfg.secuencias.consultar` | `hasPermission('cfg.secuencias.consultar')` |
| `cfg.secuencias.actualizar` | `hasPermission('cfg.secuencias.actualizar')` |
| Visibilidad menú sidebar | Payload `/auth/menu` (Backend asigna rol ↔ menú) |
| Guard de ruta módulo | Hoy el patrón dominante es `PermissionGuard` LBAC |

### Matriz contrato → UI (referencia de auditoría)

| Zona UI | Requiere (contrato) |
|---------|---------------------|
| Entrada / listado / detalle / preview | `consultar` |
| Guardar / Desactivar / Reactivar | `actualizar` **y** no `config_locked` |
| Crear secuencia | **No existe** — no mostrar |

Modo solo lectura: `consultar` sin `actualizar`.

---

## 4. Cómo lo hacen módulos similares hoy

### Catálogo ORG/INV (LBAC)

```ts
const { can } = usePermissions();
const canEdit = can('org', 'editar');
const canDelete = can('org', 'eliminar'); // UI: Desactivar
```

Ruta: `PermissionGuard module="org" action="ver"`.

### WMS / INV transaccional (códigos)

```ts
const { hasPermission } = usePermission();
const canEdit = hasPermission('wms.zona.actualizar');
```

Ruta: aún así suelen estar bajo `PermissionGuard module="wms" action="ver"` (LBAC de menú), y las **acciones** usan códigos.

### Patrón dual observado (relevante para CFG)

La mayoría de módulos ERP combinan:

1. **Puerta de módulo (LBAC):** `can('<mod>','ver')` vía `PermissionGuard`.
2. **Acciones finas (códigos):** `hasPermission('…')` cuando el Backend publica códigos granulares.

CFG encaja en ese patrón dual **si** el Backend también publica LBAC de menú para el módulo `cfg` (p. ej. `ver` derivado del menú) **además** de los códigos `cfg.secuencias.*`.

---

## 5. Condiciones de negocio adicionales (no son RBAC, pero afectan botones)

Del contrato UI (`02_UI_BEHAVIOR.md`, `04_RBAC.md`):

| Condición | Efecto |
|-----------|--------|
| `config_locked === true` | Sin Guardar / Desactivar / Reactivar (aunque haya `actualizar`) |
| `es_activo` | Ternario Desactivar vs Reactivar (RB-ROW-01) |
| `supports_preview === false` | Ocultar/deshabilitar Preview |
| Mutación en curso | Deshabilitar acciones concurrentes |

Estas reglas son **estado de entidad**, no permisos.

---

## 6. Integración de permisos — inventario de puntos de control AS-IS

Para un módulo nuevo, el Frontend ya tiene estos puntos (sin código CFG aún):

| Capa | Mecanismo | Pregunta de diseño a cerrar |
|------|-----------|-----------------------------|
| Shell | `ProtectedRoute requireOperationalUser` | Cubierto |
| Menú | Flags + rol en `/auth/menu` | Backend debe exponer ítem CFG |
| Ruta | `PermissionGuard` LBAC | ¿`module="cfg" action="ver"` basta o se exige `hasPermission(consultar)`? |
| Página | `hasPermission` códigos | Obligatorio para alinear contrato |
| API | 403 Backend | Defensa en profundidad (`03_ERROR_HANDLING.md`) |

**Hecho de auditoría:** no existe hoy un guard genérico “require permission code” a nivel de ruta; el patrón de página WMS/INV es el precedente.

---

## 7. Constantes de permisos (patrón AS-IS)

INV define constantes:

```ts
// src/features/inv/constants/inv-permissions.ts
export const INV_PERMISSIONS = {
  MOVIMIENTO_CREAR: 'inv.movimiento.crear',
  // …
} as const;
```

Para CFG, el patrón natural observado sería un archivo análogo en `src/features/cfg/constants/` con los dos códigos del contrato. *(No implementado; solo patrón.)*

---

## 8. Super Admin y bypass

`usePermissions().can` retorna `true` si `isSuperAdmin`.  
`hasPermission` depende de la lista de `/auth/permissions/me` (el comportamiento exacto para platform_admin en shell ERP está gobernado por `ProtectedRoute` / tipo de usuario).

CFG vive en shell operativo: los platform admins **no** son el usuario objetivo del módulo (blocked por `requireOperationalUser` salvo reglas de impersonación/sesión).

---

## 9. Resumen RBAC

| Tema | Estado AS-IS |
|------|--------------|
| Códigos contrato | `cfg.secuencias.consultar` / `.actualizar` |
| Hook alineado a códigos | `usePermission().hasPermission` |
| Hook LBAC menú/ruta | `usePermissions().can` + `PermissionGuard` |
| Feature CFG | Inexistente — sin constantes ni checks |
| Mejor precedente | Dual: PermissionGuard módulo + hasPermission acciones (WMS/INV B) |
| Gap de diseño | Cómo mapear entrada de módulo si LBAC `cfg.ver` no está sincronizado con `consultar` |
