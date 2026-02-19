# 📋 Guía de Migración: Módulos y Menús V2

## ✅ Estado de la Migración

### Completado

1. **Tipos TypeScript nuevos creados:**
   - ✅ `modulo-v2.types.ts` - Tipos para módulos V2
   - ✅ `seccion.types.ts` - Tipos para secciones
   - ✅ `cliente-modulo.types.ts` - Tipos para activación de módulos
   - ✅ `plantilla-rol.types.ts` - Tipos para plantillas de roles
   - ✅ `menu.types.ts` - Actualizado con tipos jerárquicos

2. **Servicios nuevos creados:**
   - ✅ `modulo-v2.service.ts` - CRUD de módulos V2
   - ✅ `seccion.service.ts` - CRUD de secciones
   - ✅ `cliente-modulo.service.ts` - Activación de módulos
   - ✅ `plantilla-rol.service.ts` - Gestión de plantillas

3. **Servicios actualizados:**
   - ✅ `menu.service.ts` - Agregado `getUserMenu()` método nuevo
   - ✅ `modulo.service.ts` - Métodos marcados como deprecados

4. **Componentes actualizados:**
   - ✅ `NewSidebar.tsx` - Usa nuevo endpoint `getUserMenu()`
   - ✅ `MenuManagementPage.tsx` - Agregado selectores de módulos y secciones

### Pendiente de Actualización

Los siguientes componentes aún usan métodos deprecados y necesitan actualización:

1. **`ClientModulesTab.tsx`**
   - Usa: `moduloService.getModulosByCliente()`
   - Migrar a: `clienteModuloService.getClienteModulos({ cliente_id })`

2. **`ActivateModuleModal.tsx`**
   - Usa: `moduloService.activarModuloCliente()`
   - Migrar a: `clienteModuloService.activateModulo()`

3. **`ModuleManagementPage.tsx`**
   - Usa: `moduloService.getModulos()`
   - Migrar a: `moduloV2Service.getModulos()`

4. **`ClientConnectionsTab.tsx`**
   - Usa: `moduloService.getModulos()`
   - Migrar a: `moduloV2Service.getModulos()`

5. **`CreateConnectionModal.tsx`**
   - Usa: `moduloService.getModulos()`
   - Migrar a: `moduloV2Service.getModulos()`

## 🔄 Mapeo de Métodos

### Menús

| Método Antiguo | Estado | Método Nuevo |
|----------------|--------|--------------|
| `menuService.getSidebarMenu()` | ⚠️ Deprecado | `menuService.getUserMenu(usuarioId)` |
| `menuService.getAreaList()` | ⚠️ Deprecado | `seccionService.getSecciones({ modulo_id })` |
| `menuService.getMenuTreeByArea(areaId)` | ⚠️ Deprecado | `menuService.getUserMenu(usuarioId)` o endpoints `/modulos-menus/` |

### Módulos

| Método Antiguo | Estado | Método Nuevo |
|----------------|--------|--------------|
| `moduloService.getModulos()` | ⚠️ Deprecado | `moduloV2Service.getModulos()` |
| `moduloService.getModulosByCliente(clienteId)` | ⚠️ Deprecado | `clienteModuloService.getClienteModulos({ cliente_id })` |
| `moduloService.activarModuloCliente()` | ⚠️ Deprecado | `clienteModuloService.activateModulo()` |

## 📝 Notas de Implementación

### Estructura Jerárquica del Menú

La nueva estructura es:
```
ModuloConSecciones
  ├── SeccionConMenus
  │   ├── MenuConPermisos
  │   │   └── submenus: MenuConPermisos[]
```

### Permisos

Los permisos ahora vienen integrados en cada menú:
```typescript
permisos: {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
  exportar: boolean;
  imprimir: boolean;
  aprobar: boolean;
}
```

El sidebar filtra automáticamente los menús sin permiso `ver`.

### Compatibilidad Temporal

- El `NewSidebar` mantiene una función de transformación temporal para compatibilidad
- Los métodos antiguos están marcados como deprecados pero siguen funcionando
- Se recomienda migrar gradualmente los componentes restantes

## 🚀 Próximos Pasos

1. Actualizar componentes que usan métodos deprecados
2. Eliminar función de transformación temporal en `NewSidebar`
3. Refactorizar renderizado del sidebar para usar estructura jerárquica directamente
4. Eliminar métodos deprecados cuando todos los componentes estén migrados

