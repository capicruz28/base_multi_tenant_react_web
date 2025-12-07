# Dependencias Circulares Identificadas

Este documento lista las dependencias circulares y acoplamientos problemáticos encontrados en el código actual. Estas serán resueltas durante la refactorización.

## 🔴 Dependencias Circulares Críticas

### 1. Core → Features

**Problema:** Core no debería depender de features específicas.

**Ejemplos:**
- `src/core/hooks/useTenantQuery.ts` → `src/features/tenant/components/TenantContext.tsx`
- `src/core/hooks/useTenantMutation.ts` → `src/features/tenant/components/TenantContext.tsx`
- `src/core/hooks/useClientes.ts` → `src/features/tenant/components/TenantContext.tsx`
- `src/core/hooks/useClienteMutations.ts` → `src/features/tenant/components/TenantContext.tsx`

**Solución:** Mover TenantContext a `src/core/tenant/` o crear un hook abstracto en core.

### 2. Pages → Features → Pages

**Problema:** Dependencia cruzada entre pages y features.

**Ejemplos:**
- `src/features/super-admin/clientes/pages/ClientManagementPage.tsx` → `src/pages/super-admin/CreateClientModal.tsx`
- `src/pages/super-admin/ClientDetailPage.tsx` → `src/features/super-admin/clientes/...`

**Solución:** Mover todos los componentes modales a sus respectivas features.

### 3. Context → Features

**Problema:** Contextos globales no deberían depender de features específicas.

**Ejemplos:**
- `src/context/AuthContext.tsx` → `src/features/tenant/stores/branding.store.ts` (posible, verificar)

**Solución:** Mover lógica de branding a core o crear abstracción.

## ⚠️ Acoplamientos Problemáticos

### 1. Components Duplicados

**Problema:** Mismo componente en múltiples ubicaciones.

**Ejemplos:**
- `src/components/layout/Header.tsx` vs `src/shared/components/layout/Header.tsx`
- `src/components/layout/NewLayout.tsx` vs `src/shared/components/layout/NewLayout.tsx`
- `src/components/LoadingSpinner.tsx` vs `src/shared/components/LoadingSpinner.tsx`

**Solución:** Consolidar en `src/shared/components/` (Fase 1).

### 2. Services en Raíz vs Features

**Problema:** Servicios mezclados entre `src/services/` y `src/features/*/services/`.

**Ejemplos:**
- `src/services/cliente.service.ts` vs `src/features/super-admin/clientes/services/cliente.service.ts`
- `src/services/usuario.service.ts` (debería estar en `features/admin/services/`)

**Solución:** Mover servicios a sus respectivas features (Fase 2).

### 3. Types en Raíz vs Features

**Problema:** Tipos mezclados entre `src/types/` y `src/features/*/types/`.

**Ejemplos:**
- `src/types/cliente.types.ts` vs `src/features/super-admin/clientes/types/cliente.types.ts`
- `src/types/usuario.types.ts` (debería estar en `features/admin/types/`)

**Solución:** Mover tipos a sus respectivas features (Fase 2).

## 📋 Plan de Resolución

### Fase 1: Consolidación de Componentes
- [ ] Eliminar `src/components/`
- [ ] Consolidar en `src/shared/components/`
- **Resuelve:** Duplicidad de componentes

### Fase 2: Migración de Páginas a Features
- [ ] Mover todas las páginas a features
- [ ] Mover servicios a features
- [ ] Mover tipos a features
- **Resuelve:** Dependencias cruzadas pages ↔ features

### Fase 3: Sistema de Rutas Modular
- [ ] Crear router modular
- [ ] Separar providers
- **Resuelve:** Acoplamiento en App.tsx

### Fase 6: Multi-tenancy Mejorado
- [ ] Mover TenantContext a core si es necesario
- [ ] Crear abstracciones para evitar dependencias circulares
- **Resuelve:** Core → Features dependencies

## 🔍 Verificación Post-Refactorización

Después de completar todas las fases, verificar:

1. **No hay dependencias circulares:**
   ```bash
   # Usar herramienta como madge
   npx madge --circular src/
   ```

2. **Core no depende de features:**
   ```bash
   # Verificar imports en core/
   grep -r "from.*features" src/core/
   ```

3. **Features no dependen de pages:**
   ```bash
   # Verificar imports en features/
   grep -r "from.*pages" src/features/
   ```

## 📝 Notas

- Este documento se actualizará durante la refactorización
- Las dependencias circulares se resolverán progresivamente
- Al finalizar, este documento servirá como referencia histórica

