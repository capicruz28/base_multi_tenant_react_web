# Mejores Prácticas Multi-Tenancy

Este documento describe las mejores prácticas para trabajar con multi-tenancy en este proyecto.

## 1. Stores con Auto-Registro

### Usar `createTenantStore` Factory

Todos los stores que manejan datos por tenant deben usar el factory `createTenantStore` para auto-registrarse en el StoreRegistry:

```typescript
import { createTenantStore } from '@/core/store/createTenantStore';

interface MyStoreState {
  data: MyData | null;
  loading: boolean;
  reset: (tenantId: string | null) => void;
}

export const useMyStore = createTenantStore<MyStoreState>(
  'my-store',
  (set) => ({
    data: null,
    loading: false,
    reset: (tenantId) => set({ data: null, loading: false }),
  })
);
```

### Requisitos del Store

1. **Método `reset` obligatorio**: El store debe tener un método `reset(tenantId: string | null)` que limpie el estado cuando cambia el tenant.
2. **Aislamiento por tenant**: Si el store maneja datos de múltiples tenants, debe particionar el estado por `tenantId`.

## 2. Queries con Tenant-Aware

### Usar `useTenantQuery` y `useTenantMutation`

Todas las queries que requieren `tenantId` deben usar los hooks especializados:

```typescript
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { useTenantMutation } from '@/core/hooks/useTenantMutation';

// Query con tenantId automático en la key
const { data, isLoading } = useTenantQuery({
  queryKey: ['clientes'],
  queryFn: () => clienteService.getClientes(),
  // requireTenant: true por defecto
});

// Mutation con tenantId automático
const mutation = useTenantMutation({
  mutationFn: (data: CreateClienteData) => clienteService.createCliente(data),
});
```

### Ventajas

- **Aislamiento automático**: El `tenantId` se incluye automáticamente en las query keys, previniendo mezcla de datos.
- **Invalidación por tenant**: Al cambiar de tenant, las queries se invalidan automáticamente.
- **Type safety**: TypeScript asegura que las queries incluyan el tenant correcto.

## 3. Cambio de Tenant

### Flujo de Cambio

Cuando un usuario cambia de tenant:

1. **StoreRegistry.resetAll(tenantId)**: Resetea todos los stores registrados.
2. **QueryClient.invalidateQueries()**: Invalida todas las queries del tenant anterior.
3. **TenantContext.setTenant(tenantId)**: Actualiza el tenant actual.
4. **BroadcastChannel**: Sincroniza el cambio entre pestañas del navegador.

### Implementación

```typescript
import { storeRegistry } from '@/core/stores/store-registry';
import { useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/features/tenant/components/TenantContext';

function useTenantSwitch() {
  const queryClient = useQueryClient();
  const { setTenant } = useTenant();

  const switchTenant = async (newTenantId: string) => {
    // 1. Resetear stores
    storeRegistry.resetAll(newTenantId);
    
    // 2. Invalidar queries
    await queryClient.invalidateQueries();
    
    // 3. Cambiar tenant
    setTenant(newTenantId);
  };

  return { switchTenant };
}
```

## 4. Sincronización entre Pestañas

El sistema usa `BroadcastChannel` para sincronizar cambios de tenant entre pestañas:

- **Cambio de tenant**: Se notifica a todas las pestañas.
- **Logout**: Se notifica a todas las pestañas para limpiar el estado.
- **Login**: Se sincroniza el tenant inicial.

No es necesario hacer nada especial, el sistema lo maneja automáticamente.

## 5. Servicios API

### Incluir tenantId en Requests

Los servicios deben incluir el `tenantId` en las requests cuando sea necesario:

```typescript
import { useTenant } from '@/features/tenant/components/TenantContext';

export const clienteService = {
  async getClientes() {
    const { tenantId } = useTenant.getState(); // Si es un store
    // O pasar tenantId como parámetro
    return api.get(`/clientes?tenant_id=${tenantId}`);
  },
};
```

### Headers Automáticos

El interceptor de Axios puede incluir automáticamente el `tenantId` en los headers:

```typescript
// En api.ts o api-config.ts
api.interceptors.request.use((config) => {
  const tenantId = getTenantId(); // Obtener del contexto/store
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }
  return config;
});
```

## 6. Testing Multi-Tenancy

### Mockear Tenant Context

En tests, mockear el `TenantContext`:

```typescript
import { vi } from 'vitest';

vi.mock('@/features/tenant/components/TenantContext', () => ({
  useTenant: () => ({
    tenantId: 'test-tenant-1',
    isTenantValid: true,
    setTenant: vi.fn(),
    resetTenant: vi.fn(),
  }),
}));
```

### Testear Aislamiento

Verificar que los datos no se mezclan entre tenants:

```typescript
it('should isolate data between tenants', async () => {
  // Cambiar a tenant 1
  setTenant('tenant-1');
  const { result: result1 } = renderHook(() => useMyQuery());
  
  // Cambiar a tenant 2
  setTenant('tenant-2');
  const { result: result2 } = renderHook(() => useMyQuery());
  
  // Verificar que los datos son diferentes
  expect(result1.current.data).not.toEqual(result2.current.data);
});
```

## 7. Debugging

### StoreRegistry Debug

El `StoreRegistry` tiene métodos de debug:

```typescript
import { storeRegistry } from '@/core/stores/store-registry';

// Ver stores registrados
console.log(storeRegistry.getRegisteredStores());

// Ver historial de resets
console.log(storeRegistry.getResetHistory());

// Resetear un store específico
storeRegistry.reset('my-store', 'tenant-1');
```

### Tenant Context Debug

El `TenantContext` expone el estado actual:

```typescript
import { useTenant } from '@/features/tenant/components/TenantContext';

function DebugTenant() {
  const { tenantId, isTenantValid, subdomain } = useTenant();
  
  return (
    <div>
      <p>Tenant ID: {tenantId}</p>
      <p>Is Valid: {isTenantValid}</p>
      <p>Subdomain: {subdomain}</p>
    </div>
  );
}
```

## 8. Checklist de Nuevas Features

Al crear una nueva feature con datos por tenant:

- [ ] ¿El store usa `createTenantStore`?
- [ ] ¿El store tiene método `reset(tenantId)`?
- [ ] ¿Las queries usan `useTenantQuery`?
- [ ] ¿Las mutations usan `useTenantMutation`?
- [ ] ¿Los servicios incluyen `tenantId` en requests?
- [ ] ¿Los tests mockean el `TenantContext`?
- [ ] ¿Se testea el aislamiento entre tenants?

## 9. Errores Comunes

### ❌ No resetear stores al cambiar tenant

```typescript
// ❌ MAL: No resetea el store
const switchTenant = (newTenantId: string) => {
  setTenant(newTenantId);
};
```

```typescript
// ✅ BIEN: Resetea stores
const switchTenant = (newTenantId: string) => {
  storeRegistry.resetAll(newTenantId);
  setTenant(newTenantId);
};
```

### ❌ No incluir tenantId en query keys

```typescript
// ❌ MAL: Query key sin tenantId
const { data } = useQuery({
  queryKey: ['clientes'],
  queryFn: () => clienteService.getClientes(),
});
```

```typescript
// ✅ BIEN: Usa useTenantQuery
const { data } = useTenantQuery({
  queryKey: ['clientes'],
  queryFn: () => clienteService.getClientes(),
});
```

### ❌ Mezclar datos entre tenants

```typescript
// ❌ MAL: Store sin particionar por tenant
interface MyStore {
  data: MyData | null; // Solo un tenant
}
```

```typescript
// ✅ BIEN: Store particionado por tenant
interface MyStore {
  tenants: Map<string, MyData>; // Múltiples tenants
  getData: (tenantId: string) => MyData | null;
}
```

## 10. Recursos Adicionales

- [Store Registry Documentation](../src/core/stores/store-registry.ts)
- [Tenant Context Documentation](../src/features/tenant/components/TenantContext.tsx)
- [Tenant Query Hooks](../src/core/hooks/useTenantQuery.ts)

