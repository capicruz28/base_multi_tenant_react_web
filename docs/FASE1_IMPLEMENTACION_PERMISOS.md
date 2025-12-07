# ✅ FASE 1: Sistema de Permisos Granulares (LBAC) - COMPLETADA

## 📋 Resumen

Se ha implementado el sistema de permisos granulares basado en la tabla `rol_menu_permiso` de la BD. El sistema permite verificar permisos específicos por módulo y acción (ver, crear, editar, eliminar, exportar, imprimir).

## 🎯 Archivos Creados

### 1. Tipos (`src/core/auth/types/permission.types.ts`)
- `PermissionAction`: Tipo para acciones de permisos
- `ModulePermissions`: Interface para permisos de un módulo
- `UserPermissions`: Tipo para permisos del usuario organizados por módulo
- `BackendRolePermission`: Interface para respuesta del backend

### 2. Servicio (`src/core/auth/services/permission.service.ts`)
- `getRolePermissions()`: Obtiene permisos de un rol desde el backend
- `getMenuIdToModuleMap()`: Mapea menu_id (UUID) a nombre de módulo
- `calculateUserPermissions()`: Calcula permisos agregados del usuario desde sus roles
- `getUserPermissions()`: Punto de entrada principal (preparado para endpoint futuro)

### 3. Hook (`src/core/auth/hooks/usePermissions.ts`)
- `usePermissions()`: Hook principal para verificación de permisos
- `can(module, action)`: Verifica si el usuario tiene un permiso específico
- `canAny(module, actions)`: Verifica si tiene al menos uno de los permisos
- `canAll(module, actions)`: Verifica si tiene todos los permisos
- `getModulePermissions(module)`: Obtiene todos los permisos de un módulo

### 4. Guard (`src/app/router/guards/PermissionGuard.tsx`)
- `PermissionGuard`: Componente para proteger rutas con permisos granulares
- Redirige a `/unauthorized` si el usuario no tiene el permiso requerido
- Super admin siempre tiene acceso

## 🔧 Archivos Modificados

### `src/shared/context/AuthContext.tsx`
- Agregado estado `permissions: UserPermissions | null`
- Agregada función `loadUserPermissions()` para cargar permisos desde roles
- Integrada carga de permisos en `updateAccessLevels()`
- Permisos se cargan automáticamente en login y al obtener perfil
- Permisos se limpian en logout

## 📝 Uso

### En Componentes
```tsx
import { usePermissions } from '@/core/auth/hooks/usePermissions';

function MyComponent() {
  const { can } = usePermissions();
  
  return (
    <>
      {can('planillas', 'crear') && (
        <button>Crear Planilla</button>
      )}
      {can('planillas', 'editar') && (
        <button>Editar Planilla</button>
      )}
    </>
  );
}
```

### En Rutas
```tsx
import { PermissionGuard } from '@/app/router/guards/PermissionGuard';

<Route
  path="planillas/*"
  element={
    <PermissionGuard module="planillas" action="ver">
      <PlanillasRoutes />
    </PermissionGuard>
  }
/>
```

## ⚠️ Notas Importantes

1. **Cálculo en Frontend**: Actualmente los permisos se calculan en el frontend desde los roles del usuario. Esto requiere múltiples requests al backend (uno por rol).

2. **Optimización Futura**: Cuando el backend implemente `GET /auth/me/permisos/`, se debe actualizar `getUserPermissions()` para usar ese endpoint (1 request vs N requests).

3. **Mapeo de Módulos**: El sistema extrae el nombre del módulo desde la ruta del menú (ej: `/planillas/empleados` → `planillas`). Este mapeo debe mantenerse sincronizado con la BD.

4. **Super Admin**: Los super admins tienen `permissions: null`, lo que indica que tienen todos los permisos. El hook `can()` retorna `true` para super admins.

## ✅ Estado

- ✅ Tipos creados
- ✅ Servicio implementado
- ✅ Hook implementado
- ✅ Guard implementado
- ✅ AuthContext actualizado
- ✅ Build exitoso
- ⚠️ Pendiente: Optimización con endpoint backend (opcional)

## 🚀 Próximos Pasos

1. **FASE 2**: Refactorizar API Híbrida (eliminar race conditions)
2. **FASE 3**: Reestructurar carpetas por dominio
3. **FASE 4**: Modularizar rutas completamente

