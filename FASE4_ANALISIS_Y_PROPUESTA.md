# 🚀 FASE 4: Store Reset y Aislamiento de Tenant - Análisis y Propuesta

## 📋 Análisis del Estado Actual

### 1. **Stores Actuales**

#### Branding Store:
- **Ubicación:** `src/features/tenant/stores/branding.store.ts`
- **Estado:** ✅ Ya particionado por tenant
- **Reset:** ✅ Implementado en `TenantContext`
- **Métodos:** `resetBranding(tenantId)`, `clearAll()`

#### Otros Stores:
- ❌ No hay otros stores Zustand identificados
- ⚠️ Futuros stores (planillas, logística, etc.) necesitarán el mismo patrón

### 2. **TenantContext Actual**

#### Funcionalidad Existente:
- ✅ Detecta cambio de tenant
- ✅ Resetea `branding.store` al cambiar tenant
- ✅ Invalida caché de React Query al cambiar tenant
- ✅ Limpia stores en logout

#### Problemas Identificados:
1. ⚠️ **Reset manual** - Cada store debe registrarse manualmente en `resetStores()`
2. ⚠️ **No hay registro centralizado** - No hay forma de registrar stores automáticamente
3. ⚠️ **Sincronización entre pestañas** - No hay sincronización cuando cambia tenant en otra pestaña
4. ⚠️ **React Query** - Invalidación funciona, pero no hay limpieza completa

### 3. **React Query**

#### Estado Actual:
- ✅ `QueryClient` configurado en `App.tsx`
- ✅ Invalidación por tenant implementada
- ⚠️ No hay limpieza completa de caché al cambiar tenant
- ⚠️ No hay sincronización entre pestañas

### 4. **Sincronización entre Pestañas**

#### Estado Actual:
- ❌ No implementado
- ⚠️ Si un usuario cambia de tenant en una pestaña, otras pestañas no se actualizan

---

## 🎯 Objetivos de la FASE 4

1. ✅ **Sistema centralizado de registro de stores** - Facilita agregar nuevos stores
2. ✅ **Reset automático de stores** - Todos los stores se resetean al cambiar tenant
3. ✅ **Limpieza completa de React Query** - Limpiar caché completo al cambiar tenant
4. ✅ **Sincronización entre pestañas** - Usar `BroadcastChannel` o `localStorage` events
5. ✅ **Patrón reutilizable** - Fácil de aplicar a futuros stores

---

## 🏗️ Propuesta de Arquitectura

### **Opción 1: Store Registry Pattern (RECOMENDADA) ⭐**

**Ventajas:**
- ✅ Centralizado y fácil de mantener
- ✅ Escalable para futuros stores
- ✅ No requiere cambios en stores existentes
- ✅ Fácil de testear

**Implementación:**
1. Crear `StoreRegistry` para registrar stores
2. Cada store se registra con su función de reset
3. `TenantContext` usa el registry para resetear todos los stores
4. Agregar sincronización entre pestañas

**Estructura:**
```typescript
// src/core/stores/store-registry.ts
interface StoreResetFunction {
  (tenantId: string | null): void;
}

class StoreRegistry {
  private stores: Map<string, StoreResetFunction> = new Map();
  
  register(name: string, resetFn: StoreResetFunction): void;
  resetAll(tenantId: string | null): void;
  reset(name: string, tenantId: string | null): void;
  clear(): void;
}
```

### **Opción 2: Hook Pattern**

**Ventajas:**
- ✅ React-native
- ✅ Fácil de usar

**Desventajas:**
- ❌ Requiere cambios en cada store
- ❌ Más complejo de mantener

**No recomendada** por requerir cambios en todos los stores.

---

## 📝 Plan de Implementación (Opción 1: Store Registry)

### **Paso 1: Crear Store Registry**
- ✅ Crear `src/core/stores/store-registry.ts`
- ✅ Implementar registro de stores
- ✅ Implementar reset de todos los stores

### **Paso 2: Crear Tenant Store Sync (Opcional)**
- ✅ Crear `src/core/stores/tenant-store-sync.ts`
- ✅ Usar `BroadcastChannel` para sincronización entre pestañas
- ✅ Emitir eventos cuando cambia tenant

### **Paso 3: Actualizar TenantContext**
- ✅ Usar `StoreRegistry` para resetear stores
- ✅ Integrar sincronización entre pestañas
- ✅ Mejorar limpieza de React Query

### **Paso 4: Registrar Branding Store**
- ✅ Registrar `branding.store` en el registry
- ✅ Verificar que funciona correctamente

### **Paso 5: Mejorar React Query Cleanup**
- ✅ Limpiar caché completo al cambiar tenant
- ✅ Invalidar todas las queries del tenant anterior

---

## ⚠️ Consideraciones y Riesgos

### **Riesgos:**
1. ⚠️ **Sincronización entre pestañas** - Puede causar conflictos si no se maneja bien
2. ⚠️ **Performance** - Resetear muchos stores puede ser costoso
3. ⚠️ **React Query** - Limpiar todo el caché puede ser agresivo

### **Consideraciones:**
1. ✅ **Lazy reset** - Solo resetear stores que realmente necesitan reset
2. ✅ **Selective cleanup** - Limpiar solo queries del tenant anterior en React Query
3. ✅ **Event-driven** - Usar eventos para sincronización entre pestañas
4. ✅ **Logging** - Loggear todos los resets para debugging

---

## 🔄 Flujo Propuesto

### **Escenario 1: Cambio de Tenant (Misma Pestaña)**
1. Usuario cambia de tenant (login/logout)
2. `TenantContext` detecta cambio
3. `StoreRegistry.resetAll()` resetea todos los stores registrados
4. `QueryClient` invalida/quita queries del tenant anterior
5. Stores se cargan con datos del nuevo tenant

### **Escenario 2: Cambio de Tenant (Otra Pestaña)**
1. Usuario cambia de tenant en pestaña A
2. `TenantStoreSync` emite evento `tenant-changed`
3. Pestaña B recibe evento
4. Pestaña B ejecuta mismo flujo de reset
5. Ambas pestañas sincronizadas

### **Escenario 3: Logout**
1. Usuario hace logout
2. `StoreRegistry.resetAll(null)` resetea todos los stores
3. `QueryClient.clear()` limpia todo el caché
4. Estado vuelve a inicial

---

## ✅ Checklist de Implementación

- [ ] Crear `StoreRegistry` service
- [ ] Crear `TenantStoreSync` para sincronización (opcional)
- [ ] Actualizar `TenantContext` para usar registry
- [ ] Registrar `branding.store` en registry
- [ ] Mejorar limpieza de React Query
- [ ] Probar cambio de tenant
- [ ] Probar sincronización entre pestañas (si se implementa)
- [ ] Probar logout
- [ ] Documentar patrón para futuros stores

---

## 📦 Archivos a Crear/Modificar

### **Nuevos:**
- `src/core/stores/store-registry.ts` - Registry centralizado
- `src/core/stores/tenant-store-sync.ts` - Sincronización entre pestañas (opcional)

### **Modificar:**
- `src/features/tenant/components/TenantContext.tsx` - Usar registry
- `src/features/tenant/stores/branding.store.ts` - Registrar en registry (opcional, puede hacerse desde TenantContext)

---

## 🎯 Resultado Esperado

Después de esta fase:
- ✅ Sistema centralizado para reset de stores
- ✅ Todos los stores se resetean automáticamente al cambiar tenant
- ✅ React Query se limpia correctamente
- ✅ Sincronización entre pestañas (opcional)
- ✅ Patrón fácil de aplicar a futuros stores
- ✅ No hay fugas de datos entre tenants

---

**¿Proceder con la implementación?**


