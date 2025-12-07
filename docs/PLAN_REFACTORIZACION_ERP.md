# 🚀 Plan de Refactorización: De 7.5/10 a 10/10 (ERP Enterprise Grade)

## ✅ Verificación de Factibilidad

### Análisis del Esquema de BD (`MULTITENANT_SCHEMA.sql`)

**✅ COMPATIBLE - La BD ya soporta permisos granulares:**

1. **Tabla `rol_menu_permiso`** (líneas 519-578):
   - Campos: `puede_ver`, `puede_crear`, `puede_editar`, `puede_eliminar`, `puede_exportar`, `puede_imprimir`
   - Relación: `rol_id` → `menu_id`
   - **✅ PERFECTO**: Estructura lista para LBAC (Level-Based Access Control)

2. **Tabla `menu`** (líneas 454-517):
   - Campo `ruta` (path del frontend): `/planillas/empleados`, `/reportes/ventas`
   - Relación con `area_menu` (agrupación lógica)
   - **✅ PERFECTO**: Permite mapear permisos a rutas del frontend

3. **Tabla `usuario_rol`** (líneas 374-418):
   - Relación N:N entre usuarios y roles
   - **✅ PERFECTO**: Un usuario puede tener múltiples roles, permisos se agregan

### Análisis del Backend

**✅ COMPATIBLE - Endpoints existentes:**

1. **`GET /roles/{rol_id}/permisos/`** (ya existe):
   - Devuelve permisos de un rol específico
   - Formato: `{ menu_id, puede_ver, puede_editar, puede_eliminar }`
   - **✅ PERFECTO**: Base para construir permisos del usuario

2. **`GET /auth/me/`** (ya existe):
   - Devuelve datos del usuario actual
   - Incluye `roles` del usuario
   - **⚠️ FALTA**: No devuelve permisos agregados del usuario

**🔧 REQUERIDO (Backend):**
- Nuevo endpoint: `GET /auth/me/permisos/` que devuelva permisos agregados del usuario actual
- O calcular permisos en el frontend desde los roles del usuario

### Análisis del Frontend Actual

**❌ INCOMPLETO - Falta implementación:**

1. **Sistema de permisos**: Solo existe `hasRole()`, no hay `can(module, action)`
2. **PermissionGuard**: No existe, solo `ProtectedRoute` con roles/niveles
3. **Estructura de carpetas**: Plana, no agrupada por dominio
4. **API híbrida**: Race condition en interceptor

---

## 📋 Plan de Refactorización (Fases)

### **FASE 1: Sistema de Permisos Granulares (LBAC)** ⚠️ CRÍTICO

**Objetivo**: Implementar verificación de permisos basada en `rol_menu_permiso`

#### 1.1 Backend (Requerido)
- [ ] Crear endpoint `GET /auth/me/permisos/` que devuelva:
  ```json
  {
    "permisos": {
      "planillas": { "ver": true, "crear": false, "editar": true, "eliminar": false },
      "logistica": { "ver": true, "crear": true, "editar": true, "eliminar": false }
    }
  }
  ```
- [ ] O calcular en frontend desde roles del usuario

#### 1.2 Frontend - Tipos y Servicios
- [ ] Crear `src/core/auth/types/permission.types.ts`:
  ```typescript
  export type PermissionAction = 'ver' | 'crear' | 'editar' | 'eliminar' | 'exportar' | 'imprimir';
  export type ModulePermissions = Record<PermissionAction, boolean>;
  export type UserPermissions = Record<string, ModulePermissions>; // key = module name
  ```
- [ ] Crear `src/core/auth/services/permission.service.ts`:
  - `getUserPermissions()`: Obtiene permisos del usuario actual
  - `calculatePermissionsFromRoles()`: Calcula permisos desde roles (si backend no lo hace)

#### 1.3 Frontend - Hook `usePermissions`
- [ ] Crear `src/core/auth/hooks/usePermissions.ts`:
  ```typescript
  export const usePermissions = () => {
    const { permissions, loading } = useAuth();
    
    const can = (module: string, action: PermissionAction): boolean => {
      if (isSuperAdmin) return true;
      return permissions?.[module]?.[action] ?? false;
    };
    
    return { can, permissions, loading };
  };
  ```

#### 1.4 Frontend - Actualizar AuthContext
- [ ] Agregar `permissions: UserPermissions | null` al `AuthContext`
- [ ] Cargar permisos en `setAuthFromLogin()` y `getCurrentUserProfile()`
- [ ] Cachear permisos en estado del contexto

#### 1.5 Frontend - PermissionGuard
- [ ] Crear `src/app/router/guards/PermissionGuard.tsx`:
  ```typescript
  <PermissionGuard module="planillas" action="ver">
    <PlanillasRoutes />
  </PermissionGuard>
  ```

**Estimación**: 2-3 días

---

### **FASE 2: Refactorizar API Híbrida (Eliminar Race Conditions)** ⚠️ CRÍTICO

**Objetivo**: Eliminar modificación dinámica de `baseURL` en interceptor

#### 2.1 Crear Factory de Instancias Axios
- [ ] Crear `src/core/api/axios-instances.ts`:
  ```typescript
  export const apiCentral = axios.create({ baseURL: DEFAULT_API_BASE_URL });
  export const createLocalApi = (localUrl: string) => axios.create({ baseURL: localUrl });
  ```

#### 2.2 Crear Hook `useApi`
- [ ] Crear `src/core/api/useApi.ts`:
  ```typescript
  export const useApi = () => {
    const { clienteInfo } = useAuth();
    return useMemo(() => {
      if (shouldUseLocalApi(clienteInfo)) {
        return createLocalApi(clienteInfo.servidor_api_local);
      }
      return apiCentral;
    }, [clienteInfo]);
  };
  ```

#### 2.3 Refactorizar Servicios
- [ ] Actualizar servicios para usar `useApi()` en lugar de `api` singleton
- [ ] O crear servicios como hooks que usen `useApi()` internamente

#### 2.4 Eliminar Lógica del Interceptor
- [ ] Remover modificación de `baseURL` del interceptor en `AuthContext`
- [ ] Mantener solo lógica de tokens en interceptor

**Estimación**: 1-2 días

---

### **FASE 3: Reestructurar Carpetas por Dominio** ⚠️ ALTO

**Objetivo**: Organizar features por dominio de negocio (HCM, SCM, Finance)

#### 3.1 Crear Estructura de Agrupadores
- [ ] Crear `src/features/hcm/` (Human Capital Management)
- [ ] Crear `src/features/scm/` (Supply Chain Management)
- [ ] Crear `src/features/finance/` (Finanzas)

#### 3.2 Migrar Módulos Existentes
- [ ] Mover `features/autorizacion/` → `features/hcm/asistencia/`
- [ ] Preparar `features/planillas/` → `features/hcm/planillas/` (cuando exista)
- [ ] Preparar `features/logistica/` → `features/scm/logistica/` (cuando exista)

#### 3.3 Mantener Admin y Super-Admin Separados
- [ ] `features/admin/` → Gestión del tenant (no es módulo de negocio)
- [ ] `features/super-admin/` → Gestión de plataforma (no es módulo de negocio)

**Estructura Final:**
```
src/features/
├── admin/              # Gestión del tenant
├── super-admin/        # Gestión de plataforma
├── hcm/                # Human Capital Management
│   ├── planillas/
│   └── asistencia/
├── scm/                # Supply Chain Management
│   ├── logistica/
│   └── almacen/
└── finance/            # Finanzas
    ├── contabilidad/
    └── tesoreria/
```

**Estimación**: 2-3 días

---

### **FASE 4: Modularizar Rutas Completamente** 🟡 MEDIO

**Objetivo**: Lazy loading de módulos completos, no solo páginas

#### 4.1 Crear `routes.tsx` en Cada Módulo
- [ ] Cada módulo debe tener su propio `routes.tsx`:
  ```typescript
  // src/features/hcm/planillas/routes.tsx
  export default function PlanillasRouter() {
    return (
      <Routes>
        <Route path="" element={<PlanillasDashboard />} />
        <Route path="calculo/:periodoId" element={<CalculoPlanilla />} />
      </Routes>
    );
  }
  ```

#### 4.2 Actualizar Router Principal
- [ ] `src/app/router.tsx` debe usar lazy loading de módulos:
  ```typescript
  const PlanillasRoutes = lazy(() => import('@/features/hcm/planillas/routes'));
  
  {
    path: 'planillas/*',
    element: (
      <PermissionGuard module="planillas" action="ver">
        <Suspense fallback={<LoadingSpinner />}>
          <PlanillasRoutes />
        </Suspense>
      </PermissionGuard>
    )
  }
  ```

**Estimación**: 1 día

---

### **FASE 5: Constantes y Enums** 🟢 BAJO

**Objetivo**: Eliminar hardcoded strings

#### 5.1 Crear Enums
- [ ] `src/core/constants/installation.types.ts`:
  ```typescript
  export enum InstallationType {
    SHARED = 'shared',
    DEDICATED = 'dedicated',
    ONPREMISE = 'onpremise',
    HYBRID = 'hybrid'
  }
  ```
- [ ] `src/core/constants/subscription.types.ts`:
  ```typescript
  export enum SubscriptionPlan {
    TRIAL = 'trial',
    BASIC = 'basico',
    PROFESSIONAL = 'profesional',
    ENTERPRISE = 'enterprise'
  }
  ```

#### 5.2 Reemplazar Strings
- [ ] Buscar y reemplazar todos los hardcoded strings en componentes
- [ ] Usar enums en lugar de strings literales

**Estimación**: 0.5 días

---

### **FASE 6: Convención de Stores** 🟡 MEDIO

**Objetivo**: Establecer convención clara para stores

#### 6.1 Documentar Convención
- [ ] Stores de dominio: `src/features/{domain}/{module}/store/`
- [ ] Stores globales: `src/core/stores/`
- [ ] Todos los stores deben usar `createTenantStore`

#### 6.2 Consolidar Stores Duplicados
- [ ] Eliminar `src/stores/branding.store.ts` (duplicado)
- [ ] Mantener solo `src/features/tenant/stores/branding.store.ts`

**Estimación**: 0.5 días

---

## 📊 Resumen de Prioridades

### 🔴 **CRÍTICO (Bloquea producción)**
1. **FASE 1**: Sistema de Permisos Granulares (LBAC)
2. **FASE 2**: Refactorizar API Híbrida (Race Conditions)

### 🟡 **ALTO (Deuda técnica a corto plazo)**
3. **FASE 3**: Reestructurar Carpetas por Dominio
4. **FASE 4**: Modularizar Rutas Completamente

### 🟢 **BAJO (Mejoras de calidad)**
5. **FASE 5**: Constantes y Enums
6. **FASE 6**: Convención de Stores

---

## ⚠️ Dependencias del Backend

### Requerido para FASE 1:
- **Opción A (Recomendada)**: Backend crea endpoint `GET /auth/me/permisos/` que devuelve permisos agregados del usuario
- **Opción B**: Frontend calcula permisos desde roles del usuario usando `GET /roles/{rol_id}/permisos/` para cada rol

**Recomendación**: Opción A es más eficiente (1 request vs N requests)

---

## ✅ Checklist de Validación

Antes de empezar cada fase, verificar:
- [ ] Backend tiene endpoints necesarios (FASE 1)
- [ ] Tests existentes siguen pasando
- [ ] Build no tiene errores
- [ ] No hay regresiones en funcionalidad existente

---

## 🎯 Resultado Esperado

Después de completar todas las fases:
- ✅ **Calificación: 10/10** (Enterprise Grade)
- ✅ Sistema de permisos granular funcional
- ✅ Sin race conditions en API híbrida
- ✅ Estructura escalable para 50+ módulos
- ✅ Lazy loading completo de módulos
- ✅ Código mantenible y documentado

---

## 📝 Notas Importantes

1. **Backend debe implementar `GET /auth/me/permisos/`** antes de FASE 1.1
2. **Migración gradual**: No romper funcionalidad existente durante refactorización
3. **Tests**: Agregar tests para nuevos componentes (PermissionGuard, usePermissions)
4. **Documentación**: Actualizar docs después de cada fase

