# 📦 Convención de Stores - Guía de Referencia

## 🎯 Principio

Los stores de Zustand deben estar organizados según su alcance y propósito, siguiendo la estructura de features.

## 📂 Estructura de Stores

### 1. Stores de Dominio (Módulos de Negocio)
**Ubicación**: `src/features/{dominio}/{modulo}/store/`

**Ejemplo**:
```
src/features/hcm/planillas/store/
└── planilla.store.ts
```

**Uso**: Stores específicos de un módulo de negocio.

### 2. Stores de Feature (No Dominio)
**Ubicación**: `src/features/{feature}/stores/`

**Ejemplo**:
```
src/features/tenant/stores/
└── branding.store.ts
```

**Uso**: Stores relacionados con una feature específica (tenant, auth, etc.).

### 3. Stores Globales (Core)
**Ubicación**: `src/core/stores/`

**Ejemplo**:
```
src/core/stores/
├── store-registry.ts
└── tenant-store-sync.ts
```

**Uso**: Stores del framework, no del negocio.

## 🔧 Convenciones

### 1. Usar `createTenantStore` para Stores con Datos por Tenant

**✅ CORRECTO**:
```typescript
import { createTenantStore } from '@/core/store/createTenantStore';

export const usePlanillaStore = createTenantStore<PlanillaState>(
  'planillas',
  (set) => ({
    data: null,
    reset: (tenantId) => set({ data: null }),
  })
);
```

**❌ INCORRECTO**:
```typescript
import { create } from 'zustand';

export const usePlanillaStore = create<PlanillaState>((set) => ({
  data: null,
}));
// ❌ No se registra automáticamente para limpieza
```

### 2. Método `reset` Obligatorio

Todos los stores que usan `createTenantStore` deben tener un método `reset`:

```typescript
interface MyStoreState {
  data: MyData | null;
  reset: (tenantId: string | null) => void;
}
```

### 3. Nombres de Stores

- Usar camelCase: `usePlanillaStore`, `useLogisticaStore`
- Nombre debe coincidir con el módulo: `planillas` → `usePlanillaStore`

## 📝 Ejemplo Completo

```typescript
// src/features/hcm/planillas/store/planilla.store.ts
import { createTenantStore } from '@/core/store/createTenantStore';
import type { Planilla } from '../types/planilla.types';

interface PlanillaState {
  activePlanilla: Planilla | null;
  setActivePlanilla: (p: Planilla | null) => void;
  filters: Record<string, any>;
  setFilters: (f: Record<string, any>) => void;
  reset: (tenantId: string | null) => void;
}

const initialState = {
  activePlanilla: null,
  filters: {},
};

export const usePlanillaStore = createTenantStore<PlanillaState>(
  'planillas',
  (set) => ({
    ...initialState,
    setActivePlanilla: (p) => set({ activePlanilla: p }),
    setFilters: (f) => set({ filters: f }),
    reset: (tenantId) => {
      console.log(`🧹 Limpiando store de Planillas para tenant: ${tenantId}`);
      set(initialState);
    },
  })
);
```

## ✅ Checklist

Al crear un nuevo store:

- [ ] ¿Está en la ubicación correcta según su alcance?
- [ ] ¿Usa `createTenantStore` si maneja datos por tenant?
- [ ] ¿Tiene método `reset(tenantId)`?
- [ ] ¿El nombre del store coincide con el módulo?
- [ ] ¿Está registrado automáticamente en `storeRegistry`?

## 🚫 NO Hacer

- ❌ Crear stores en `src/stores/` (raíz)
- ❌ Usar `create` directamente sin `createTenantStore` para datos por tenant
- ❌ Olvidar el método `reset`
- ❌ Duplicar stores en múltiples ubicaciones

## 📚 Referencias

- [createTenantStore](../src/core/store/createTenantStore.ts)
- [store-registry](../src/core/stores/store-registry.ts)
- [Multi-tenancy Best Practices](./multi-tenancy-best-practices.md)

