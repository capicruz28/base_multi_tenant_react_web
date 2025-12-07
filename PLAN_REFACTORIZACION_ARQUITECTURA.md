# 🏗️ Plan de Refactorización: Arquitectura de Clase Mundial

**Objetivo:** Transformar el proyecto de un estado 7.5/10 a 9.5/10, preparándolo para escalar a un ERP masivo con 50+ módulos.

**Estrategia:** Refactorización incremental, segura y reversible. Cada fase es independiente y testeable.

---

## 📋 Índice

1. [Preparación y Seguridad](#preparación-y-seguridad)
2. [Fase 0: Configuración Base](#fase-0-configuración-base)
3. [Fase 1: Consolidación de Componentes](#fase-1-consolidación-de-componentes)
4. [Fase 2: Migración de Páginas a Features](#fase-2-migración-de-páginas-a-features)
5. [Fase 3: Sistema de Rutas Modular](#fase-3-sistema-de-rutas-modular)
6. [Fase 4: Testing y Calidad](#fase-4-testing-y-calidad)
7. [Fase 5: Optimizaciones y Mejoras](#fase-5-optimizaciones-y-mejoras)
8. [Fase 6: Multi-tenancy Mejorado](#fase-6-multi-tenancy-mejorado)
9. [Verificación Final](#verificación-final)

---

## 🔒 Preparación y Seguridad

### Antes de Iniciar

1. **Crear Branch de Refactorización**
   ```bash
   git checkout -b refactor/arquitectura-clase-mundial
   git push -u origin refactor/arquitectura-clase-mundial
   ```

2. **Backup Completo**
   - Commit actual del código
   - Documentar estado actual de funcionalidades
   - Lista de endpoints y servicios críticos

3. **Checklist de Seguridad**
   - [ ] Todas las pruebas manuales pasan
   - [ ] No hay errores de compilación
   - [ ] Documentación de dependencias circulares actuales
   - [ ] Lista de componentes/páginas duplicados

### Estrategia de Commits

- **Un commit por archivo movido/refactorizado**
- **Mensajes descriptivos:** `refactor: move UserManagementPage to features/admin`
- **Commits pequeños y reversibles**
- **Tag después de cada fase:** `git tag fase-1-completa`

---

## 🎯 Fase 0: Configuración Base

**Duración estimada:** 2-3 horas  
**Riesgo:** Bajo  
**Reversibilidad:** Alta

### Objetivos

1. Configurar testing (Vitest)
2. Crear estructura base de carpetas
3. Configurar path aliases
4. Documentar dependencias actuales

### Tareas

#### 0.1 Configurar Vitest

**Archivos a crear/modificar:**
- `vitest.config.ts` (nuevo)
- `package.json` (modificar)
- `.gitignore` (verificar coverage/)

**Configuración:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Dependencias a agregar:**
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^23.0.0"
  }
}
```

**Scripts a agregar:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

#### 0.2 Configurar Path Aliases

**Archivo:** `tsconfig.json` y `vite.config.ts`

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/app/*": ["./src/app/*"],
      "@/core/*": ["./src/core/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/features/*": ["./src/features/*"]
    }
  }
}
```

#### 0.3 Crear Estructura Base de Carpetas

**Crear (sin mover archivos aún):**
```
src/
├── app/                    # Nuevo
│   ├── App.tsx            # Se moverá aquí
│   ├── main.tsx           # Se moverá aquí
│   ├── provider.tsx       # Nuevo (wrapper de providers)
│   └── router.tsx         # Nuevo (router principal)
├── test/                  # Nuevo
│   └── setup.ts           # Configuración de tests
└── ... (resto igual por ahora)
```

#### 0.4 Documentar Dependencias Circulares

**Crear:** `docs/dependencias-circulares.md`

Documentar:
- `core/hooks/useTenantQuery.ts` → `features/tenant/components/TenantContext.tsx`
- `pages/super-admin/*` → `features/super-admin/clientes/*`
- `components/*` ↔ `shared/components/*`

### Criterios de Éxito

- [ ] `npm test` ejecuta sin errores
- [ ] Path aliases funcionan en IDE
- [ ] Estructura base creada (vacía)
- [ ] Documentación de dependencias completa

### Rollback

Si algo falla:
```bash
git reset --hard HEAD
# O revertir commits específicos
```

---

## 🔧 Fase 1: Consolidación de Componentes

**Duración estimada:** 4-6 horas  
**Riesgo:** Medio  
**Reversibilidad:** Alta (solo movimientos de archivos)

### Objetivos

1. Eliminar duplicidad entre `src/components` y `src/shared/components`
2. Consolidar en `src/shared/components` (fuente única de verdad)
3. Actualizar todas las importaciones
4. Eliminar `src/components` completamente

### Análisis Previo

**Componentes duplicados identificados:**
- `Header.tsx` (components/layout vs shared/components/layout)
- `NewLayout.tsx` (components/layout vs shared/components/layout)
- `NewSidebar.tsx` (components/layout vs shared/components/layout)
- `MenuSelector.tsx` (components/layout vs shared/components/layout)
- `LoadingSpinner.tsx` (components vs shared/components)
- `ProtectedRoute.tsx` (components vs shared/components)
- `ThemeSwitch.tsx` (components vs shared/components)
- `ui/*` (components/ui vs shared/components/ui)

### Tareas

#### 1.1 Comparar Componentes Duplicados

**Script de comparación:**
```bash
# Comparar archivos duplicados
diff src/components/layout/Header.tsx src/shared/components/layout/Header.tsx
```

**Decisión:** Mantener la versión en `shared/components` (ya está siendo usada en App.tsx)

#### 1.2 Mover Componentes Únicos de `components/` a `shared/`

**Componentes a mover:**
- `BrandingInitializer.tsx` → `shared/components/BrandingInitializer.tsx`
- `BrandingDebug.tsx` → `shared/components/BrandingDebug.tsx`
- `SmartRedirect.tsx` → Ya está en shared, verificar si hay duplicado

#### 1.3 Actualizar Todas las Importaciones

**Estrategia:**
1. Buscar todas las importaciones de `components/`
2. Reemplazar con `shared/components/`
3. Verificar que no haya importaciones rotas

**Comando de búsqueda:**
```bash
grep -r "from.*components/" src/ --exclude-dir=node_modules
grep -r "from.*components/layout" src/ --exclude-dir=node_modules
```

**Archivos a actualizar (estimado):**
- `App.tsx` (ya usa shared, verificar)
- Cualquier página que importe desde `components/`

#### 1.4 Eliminar `src/components`

**Solo después de:**
- [ ] Todas las importaciones actualizadas
- [ ] Build exitoso
- [ ] Tests pasando (si existen)
- [ ] Verificación manual de funcionalidad

**Comando:**
```bash
rm -rf src/components
```

### Orden de Ejecución

1. **Commit 1:** Mover `BrandingInitializer.tsx` y `BrandingDebug.tsx`
2. **Commit 2:** Actualizar importaciones de `components/` → `shared/components/`
3. **Commit 3:** Eliminar carpeta `src/components`
4. **Commit 4:** Verificar y corregir cualquier importación rota

### Criterios de Éxito

- [ ] No existe `src/components`
- [ ] Todas las importaciones apuntan a `shared/components`
- [ ] Build exitoso sin errores
- [ ] Aplicación funciona correctamente
- [ ] No hay referencias a `components/` en el código

### Rollback

```bash
# Si algo falla, restaurar desde git
git checkout HEAD~1 -- src/components/
```

---

## 📦 Fase 2: Migración de Páginas a Features

**Duración estimada:** 8-12 horas  
**Riesgo:** Alto  
**Reversibilidad:** Media (requiere actualizar rutas)

### Objetivos

1. Mover todas las páginas de `src/pages` a sus respectivas features
2. Mantener solo páginas genéricas en `src/pages` (Login, 404, Unauthorized)
3. Crear estructura completa de features (api, components, hooks, stores, types)
4. Actualizar rutas en App.tsx

### Mapeo de Migraciones

#### 2.1 Feature: `auth`

**Páginas a mover:**
- `src/pages/auth/Login.tsx` → `src/features/auth/pages/Login.tsx` ✅ (ya existe)

**Verificar:**
- [ ] Login.tsx ya está en features/auth/pages
- [ ] Eliminar duplicado de pages/auth/Login.tsx si existe

#### 2.2 Feature: `admin` (Tenant Admin)

**Páginas a mover:**
- `src/pages/admin/UserManagementPage.tsx` → `src/features/admin/pages/UserManagementPage.tsx`
- `src/pages/admin/RoleManagementPage.tsx` → `src/features/admin/pages/RoleManagementPage.tsx`
- `src/pages/admin/AreaManagementPage.tsx` → `src/features/admin/pages/AreaManagementPage.tsx`
- `src/pages/admin/MenuManagementPage.tsx` → `src/features/admin/pages/MenuManagementPage.tsx`
- `src/pages/admin/ActiveSessionsPage.tsx` → `src/features/admin/pages/ActiveSessionsPage.tsx`
- `src/pages/admin/RolePermissionsManager.tsx` → `src/features/admin/components/RolePermissionsManager.tsx` (es componente, no página)

**Estructura a crear:**
```
features/admin/
├── api/
│   ├── usuario.api.ts
│   ├── rol.api.ts
│   ├── area.api.ts
│   └── menu.api.ts
├── components/
│   └── RolePermissionsManager.tsx
├── hooks/
│   ├── useUsuarios.ts
│   ├── useRoles.ts
│   └── useAreas.ts
├── pages/
│   ├── UserManagementPage.tsx
│   ├── RoleManagementPage.tsx
│   ├── AreaManagementPage.tsx
│   ├── MenuManagementPage.tsx
│   └── ActiveSessionsPage.tsx
├── services/
│   ├── usuario.service.ts (mover desde src/services/)
│   ├── rol.service.ts
│   ├── area.service.ts
│   └── menu.service.ts
├── stores/
│   └── (si es necesario)
├── types/
│   ├── usuario.types.ts (mover desde src/types/)
│   ├── rol.types.ts
│   ├── area.types.ts
│   └── menu.types.ts
└── routes.tsx (nuevo)
```

#### 2.3 Feature: `super-admin`

**Páginas a mover:**
- `src/pages/super-admin/SuperAdminDashboard.tsx` → `src/features/super-admin/dashboard/pages/SuperAdminDashboard.tsx`
- `src/pages/super-admin/ClientDetailPage.tsx` → `src/features/super-admin/clientes/pages/ClientDetailPage.tsx`
- `src/pages/super-admin/ModuleManagementPage.tsx` → `src/features/super-admin/modulos/pages/ModuleManagementPage.tsx`

**Componentes a mover:**
- `src/pages/super-admin/CreateClientModal.tsx` → `src/features/super-admin/clientes/components/CreateClientModal.tsx`
- `src/pages/super-admin/EditClientModal.tsx` → `src/features/super-admin/clientes/components/EditClientModal.tsx`
- `src/pages/super-admin/ClientModulesTab.tsx` → `src/features/super-admin/clientes/components/ClientModulesTab.tsx`
- `src/pages/super-admin/ClientConnectionsTab.tsx` → `src/features/super-admin/clientes/components/ClientConnectionsTab.tsx`
- `src/pages/super-admin/ClientUsersTab.tsx` → `src/features/super-admin/clientes/components/ClientUsersTab.tsx`
- `src/pages/super-admin/ClientAuditTab.tsx` → `src/features/super-admin/clientes/components/ClientAuditTab.tsx`
- `src/pages/super-admin/CreateModuleModal.tsx` → `src/features/super-admin/modulos/components/CreateModuleModal.tsx`
- `src/pages/super-admin/EditModuleModal.tsx` → `src/features/super-admin/modulos/components/EditModuleModal.tsx`
- `src/pages/super-admin/ActivateModuleModal.tsx` → `src/features/super-admin/modulos/components/ActivateModuleModal.tsx`
- `src/pages/super-admin/EditModuleActivoModal.tsx` → `src/features/super-admin/modulos/components/EditModuleActivoModal.tsx`
- `src/pages/super-admin/CreateConnectionModal.tsx` → `src/features/super-admin/clientes/components/CreateConnectionModal.tsx`
- `src/pages/super-admin/EditConnectionModal.tsx` → `src/features/super-admin/clientes/components/EditConnectionModal.tsx`

**Estructura final:**
```
features/super-admin/
├── clientes/
│   ├── components/
│   │   ├── CreateClientModal.tsx
│   │   ├── EditClientModal.tsx
│   │   ├── ClientModulesTab.tsx
│   │   ├── ClientConnectionsTab.tsx
│   │   ├── ClientUsersTab.tsx
│   │   ├── ClientAuditTab.tsx
│   │   ├── CreateConnectionModal.tsx
│   │   └── EditConnectionModal.tsx
│   ├── hooks/
│   │   ├── useClientes.ts (ya existe)
│   │   └── useClienteMutations.ts (ya existe)
│   ├── pages/
│   │   ├── ClientManagementPage.tsx (ya existe)
│   │   └── ClientDetailPage.tsx (nuevo)
│   ├── services/
│   │   └── cliente.service.ts (ya existe)
│   ├── types/
│   │   └── cliente.types.ts (ya existe)
│   └── routes.tsx (nuevo)
├── modulos/
│   ├── components/
│   │   ├── CreateModuleModal.tsx
│   │   ├── EditModuleModal.tsx
│   │   ├── ActivateModuleModal.tsx
│   │   └── EditModuleActivoModal.tsx
│   ├── pages/
│   │   └── ModuleManagementPage.tsx
│   ├── services/
│   │   └── modulo.service.ts (mover desde src/services/)
│   ├── types/
│   │   └── modulo.types.ts (mover desde src/types/)
│   └── routes.tsx (nuevo)
├── dashboard/
│   ├── pages/
│   │   └── SuperAdminDashboard.tsx
│   └── routes.tsx (nuevo)
└── routes.tsx (nuevo - agrupa todas las rutas de super-admin)
```

#### 2.4 Páginas Genéricas (Mantener en `src/pages`)

**Páginas que se quedan:**
- `src/pages/Home.tsx` → **DECISIÓN:** ¿Es genérica o pertenece a un módulo?
- `src/pages/AutorizacionPage.tsx` → **DECISIÓN:** ¿Crear feature `autorizacion`?
- `src/pages/FinalizarTareoPage.tsx` → **DECISIÓN:** ¿Crear feature `tareo`?
- `src/pages/ReporteAutorizacionPage.tsx` → **DECISIÓN:** ¿Crear feature `reportes`?
- `src/pages/UnauthorizedPage.tsx` → ✅ Mantener (página genérica)

**Recomendación:** Crear features para estas páginas también:
- `features/autorizacion/` (AutorizacionPage, FinalizarTareoPage)
- `features/reportes/` (ReporteAutorizacionPage)
- `features/home/` (Home) o mover a un módulo específico

### Tareas Detalladas

#### 2.1 Migrar Feature `admin`

**Paso 1:** Crear estructura
```bash
mkdir -p src/features/admin/{api,components,hooks,pages,services,stores,types}
```

**Paso 2:** Mover páginas
```bash
# Mover páginas
mv src/pages/admin/UserManagementPage.tsx src/features/admin/pages/
mv src/pages/admin/RoleManagementPage.tsx src/features/admin/pages/
mv src/pages/admin/AreaManagementPage.tsx src/features/admin/pages/
mv src/pages/admin/MenuManagementPage.tsx src/features/admin/pages/
mv src/pages/admin/ActiveSessionsPage.tsx src/features/admin/pages/

# Mover componente
mv src/pages/admin/RolePermissionsManager.tsx src/features/admin/components/
```

**Paso 3:** Mover servicios y tipos
```bash
# Servicios
mv src/services/usuario.service.ts src/features/admin/services/
mv src/services/rol.service.ts src/features/admin/services/
mv src/services/area.service.ts src/features/admin/services/
mv src/services/menu.service.ts src/features/admin/services/
mv src/services/session.service.ts src/features/admin/services/

# Tipos
mv src/types/usuario.types.ts src/features/admin/types/
mv src/types/rol.types.ts src/features/admin/types/
mv src/types/area.types.ts src/features/admin/types/
mv src/types/menu.types.ts src/features/admin/types/
mv src/types/permission.types.ts src/features/admin/types/
```

**Paso 4:** Actualizar importaciones en archivos movidos
- Cambiar rutas relativas
- Usar path aliases cuando sea posible

**Paso 5:** Crear `features/admin/routes.tsx`
```typescript
import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const RoleManagementPage = lazy(() => import('./pages/RoleManagementPage'));
// ... etc

export const adminRoutes: RouteObject = {
  path: 'admin',
  children: [
    { index: true, element: <Navigate to="usuarios" replace /> },
    { path: 'usuarios', element: <UserManagementPage /> },
    { path: 'roles', element: <RoleManagementPage /> },
    // ... etc
  ],
};
```

**Paso 6:** Commit
```bash
git add src/features/admin/
git commit -m "refactor: migrate admin pages to features/admin"
```

#### 2.2 Migrar Feature `super-admin`

**Similar a admin, pero más complejo por tener sub-features (clientes, modulos, dashboard)**

**Orden recomendado:**
1. Migrar `clientes` (ya parcialmente hecho)
2. Migrar `modulos`
3. Migrar `dashboard`
4. Crear `routes.tsx` principal que agrupe todo

#### 2.3 Crear Features para Páginas Restantes

**Feature `autorizacion`:**
```
features/autorizacion/
├── pages/
│   ├── AutorizacionPage.tsx
│   └── FinalizarTareoPage.tsx
├── services/
│   └── autorizacion.service.ts (mover desde src/services/)
├── types/
│   └── autorizacion.types.ts (mover desde src/types/)
└── routes.tsx
```

**Feature `reportes`:**
```
features/reportes/
├── pages/
│   └── ReporteAutorizacionPage.tsx
└── routes.tsx
```

**Feature `home`:**
```
features/home/
├── pages/
│   └── Home.tsx
└── routes.tsx
```

### Actualizar App.tsx

**Después de cada migración:**
1. Actualizar imports de lazy loading
2. Verificar que las rutas funcionen
3. Probar manualmente

### Criterios de Éxito

- [ ] No hay páginas en `src/pages` excepto `UnauthorizedPage.tsx`
- [ ] Todas las features tienen estructura completa (api, components, hooks, pages, services, types)
- [ ] Todas las rutas funcionan correctamente
- [ ] Build exitoso
- [ ] No hay importaciones rotas
- [ ] Aplicación funciona en desarrollo

### Rollback

```bash
# Restaurar desde commit anterior
git reset --hard <commit-antes-de-fase-2>
```

---

## 🛣️ Fase 3: Sistema de Rutas Modular

**Duración estimada:** 4-6 horas  
**Riesgo:** Medio  
**Reversibilidad:** Alta

### Objetivos

1. Crear sistema de rutas distribuido por feature
2. Refactorizar App.tsx para que sea limpio y mantenible
3. Implementar router modular que importe rutas de features
4. Mantener lazy loading y code splitting

### Estructura Propuesta

```
src/app/
├── App.tsx              # Componente raíz limpio
├── main.tsx             # Entry point
├── provider.tsx         # Wrapper de todos los providers
└── router.tsx           # Router principal que importa rutas
```

### Tareas

#### 3.1 Crear `app/provider.tsx`

**Extraer todos los providers de App.tsx:**

```typescript
// app/provider.tsx
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/shared/context/ThemeContext';
import { AuthProvider } from '@/shared/context/AuthContext';
import { TenantProvider } from '@/features/tenant/components/TenantContext';
import { BrandingInitializer } from '@/shared/components/BrandingInitializer';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TenantProvider>
            <BrandingInitializer />
            <DndProvider backend={HTML5Backend}>
              {children}
            </DndProvider>
          </TenantProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

#### 3.2 Crear `app/router.tsx`

**Router que importa rutas de features:**

```typescript
// app/router.tsx
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { Suspense } from 'react';
import ProtectedRoute from '@/shared/components/ProtectedRoute';
import NewLayout from '@/shared/components/layout/NewLayout';
import SmartRedirect from '@/shared/components/SmartRedirect';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

// Importar rutas de features
import { authRoutes } from '@/features/auth/routes';
import { adminRoutes } from '@/features/admin/routes';
import { superAdminRoutes } from '@/features/super-admin/routes';
import { autorizacionRoutes } from '@/features/autorizacion/routes';
import { reportesRoutes } from '@/features/reportes/routes';
import { homeRoutes } from '@/features/home/routes';

// Páginas genéricas
import Login from '@/features/auth/pages/Login';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

export const router = createBrowserRouter([
  // Rutas públicas
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },

  // Rutas protegidas (usuario normal)
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <NewLayout />,
        children: [
          { index: true, element: <SmartRedirect /> },
          ...homeRoutes,
          ...autorizacionRoutes,
          ...reportesRoutes,
          { path: '*', element: <SmartRedirect /> },
        ],
      },
    ],
  },

  // Rutas de administración (tenant admin)
  {
    element: <ProtectedRoute requiredLevel={4} />,
    children: [
      {
        path: '/admin',
        element: <NewLayout />,
        children: adminRoutes.children || [],
      },
    ],
  },

  // Rutas de super admin
  {
    element: <ProtectedRoute requireSuperAdmin={true} />,
    children: [
      {
        path: '/super-admin',
        element: <NewLayout />,
        children: superAdminRoutes.children || [],
      },
    ],
  },
]);
```

#### 3.3 Refactorizar `app/App.tsx`

**App.tsx limpio:**

```typescript
// app/App.tsx
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProviders } from './provider';
import { router } from './router';

function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </AppProviders>
  );
}

export default App;
```

#### 3.4 Crear `routes.tsx` en cada Feature

**Ejemplo para `features/admin/routes.tsx`:**

```typescript
// features/admin/routes.tsx
import { RouteObject, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import { Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const RoleManagementPage = lazy(() => import('./pages/RoleManagementPage'));
const AreaManagementPage = lazy(() => import('./pages/AreaManagementPage'));
const MenuManagementPage = lazy(() => import('./pages/MenuManagementPage'));
const ActiveSessionsPage = lazy(() => import('./pages/ActiveSessionsPage'));

export const adminRoutes: RouteObject = {
  path: 'admin',
  children: [
    { index: true, element: <Navigate to="usuarios" replace /> },
    {
      path: 'usuarios',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando gestión de usuarios..." />}>
          <UserManagementPage />
        </Suspense>
      ),
    },
    {
      path: 'roles',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando gestión de roles..." />}>
          <RoleManagementPage />
        </Suspense>
      ),
    },
    {
      path: 'areas',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando gestión de áreas..." />}>
          <AreaManagementPage />
        </Suspense>
      ),
    },
    {
      path: 'menus',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando gestión de menús..." />}>
          <MenuManagementPage />
        </Suspense>
      ),
    },
    {
      path: 'sesiones',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando sesiones activas..." />}>
          <ActiveSessionsPage />
        </Suspense>
      ),
    },
    { path: '*', element: <Navigate to="/admin/usuarios" replace /> },
  ],
};
```

### Orden de Ejecución

1. **Commit 1:** Crear `app/provider.tsx` y extraer providers
2. **Commit 2:** Crear `routes.tsx` en cada feature (una por una)
3. **Commit 3:** Crear `app/router.tsx`
4. **Commit 4:** Refactorizar `app/App.tsx`
5. **Commit 5:** Mover `main.tsx` a `app/main.tsx` y actualizar

### Criterios de Éxito

- [ ] App.tsx tiene menos de 50 líneas
- [ ] Todas las rutas funcionan correctamente
- [ ] Lazy loading sigue funcionando
- [ ] Code splitting se mantiene
- [ ] Build exitoso
- [ ] Aplicación funciona en desarrollo

### Rollback

```bash
git reset --hard <commit-antes-de-fase-3>
```

---

## 🧪 Fase 4: Testing y Calidad

**Duración estimada:** 6-8 horas  
**Riesgo:** Bajo  
**Reversibilidad:** Alta

### Objetivos

1. Configurar suite de testing completa
2. Crear tests para componentes críticos
3. Crear tests para hooks críticos
4. Configurar CI/CD básico
5. Establecer cobertura mínima

### Tareas

#### 4.1 Tests para Componentes Core

**Componentes a testear:**
- `shared/components/ProtectedRoute.tsx`
- `shared/components/layout/NewLayout.tsx`
- `features/tenant/components/TenantContext.tsx`

**Ejemplo de test:**

```typescript
// shared/components/__tests__/ProtectedRoute.test.tsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { AuthProvider } from '../../context/AuthContext';

describe('ProtectedRoute', () => {
  it('should redirect to login when not authenticated', () => {
    // Test implementation
  });

  it('should allow access when authenticated', () => {
    // Test implementation
  });

  it('should check access level', () => {
    // Test implementation
  });
});
```

#### 4.2 Tests para Hooks Core

**Hooks a testear:**
- `core/hooks/useTenantQuery.ts`
- `core/hooks/useTenantMutation.ts`
- `features/tenant/hooks/useBranding.ts`

#### 4.3 Tests para Stores

**Stores a testear:**
- `core/stores/store-registry.ts`
- `features/tenant/stores/branding.store.ts`

#### 4.4 Configurar Coverage

**Objetivo:** 60% de cobertura mínima en código crítico

**Archivos críticos:**
- Core multi-tenancy
- Auth y protección de rutas
- Store registry

### Criterios de Éxito

- [ ] Tests pasan: `npm test`
- [ ] Cobertura mínima: 60% en código crítico
- [ ] Tests para componentes core
- [ ] Tests para hooks core
- [ ] CI/CD configurado (opcional)

---

## ⚡ Fase 5: Optimizaciones y Mejoras

**Duración estimada:** 4-6 horas  
**Riesgo:** Bajo  
**Reversibilidad:** Alta

### Objetivos

1. Optimizar imports de Lucide (tree-shaking)
2. Mejorar bundle size
3. Optimizar performance
4. Revisar y optimizar imports

### Tareas

#### 5.1 Optimizar Iconos de Lucide

**Problema actual:**
```typescript
// src/lib/icon-utils.tsx
import * as LucideIcons from 'lucide-react'; // ❌ Importa todo
```

**Solución: Crear mapa estático de iconos permitidos**

```typescript
// src/shared/lib/icon-utils.tsx
import {
  Circle,
  AlertTriangle,
  User,
  Settings,
  // ... solo los iconos que realmente se usan
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  circle: Circle,
  'alert-triangle': AlertTriangle,
  user: User,
  settings: Settings,
  // ... mapeo completo
};

export const getIcon = (iconName: string | null | undefined, props = {}) => {
  if (!iconName) return <Circle {...props} className="opacity-50" />;
  
  const normalized = iconName.toLowerCase().replace(/-/g, '');
  const IconComponent = ICON_MAP[normalized] || Circle;
  
  return <IconComponent {...props} />;
};
```

**Pasos:**
1. Analizar qué iconos se usan realmente
2. Crear mapa estático
3. Actualizar `icon-utils.tsx`
4. Verificar reducción de bundle size

#### 5.2 Analizar Bundle Size

**Herramientas:**
- `vite-bundle-visualizer`
- `npm run build -- --analyze`

**Objetivos:**
- Reducir bundle inicial en al menos 20%
- Identificar dependencias pesadas innecesarias

#### 5.3 Optimizar Imports

**Buscar:**
- Imports de dependencias completas cuando solo se necesita una parte
- Imports duplicados
- Imports no utilizados

### Criterios de Éxito

- [ ] Bundle size reducido en al menos 20%
- [ ] Tree-shaking funcionando para iconos
- [ ] No hay imports innecesarios
- [ ] Performance mejorada (medir con Lighthouse)

---

## 🔐 Fase 6: Multi-tenancy Mejorado

**Duración estimada:** 4-6 horas  
**Riesgo:** Medio  
**Reversibilidad:** Media

### Objetivos

1. Crear factory para stores con auto-registro
2. Mejorar hook useTenantQuery para hacer imposible olvidar tenantId
3. Crear validaciones adicionales
4. Documentar mejores prácticas

### Tareas

#### 6.1 Crear Factory para Stores

**Crear:** `core/store/createTenantStore.ts`

```typescript
// core/store/createTenantStore.ts
import { create, StateCreator } from 'zustand';
import { storeRegistry } from './store-registry';

export const createTenantStore = <T extends object>(
  storeName: string,
  initializer: StateCreator<T>
) => {
  const store = create<T>(initializer);

  // Auto-registro en el registry
  storeRegistry.register(storeName, (tenantId) => {
    // Asume que el store tiene un método reset
    if ('reset' in store.getState() && typeof (store.getState() as any).reset === 'function') {
      (store.getState() as any).reset(tenantId);
    } else {
      // Reset genérico: reinicializar al estado inicial
      const initialState = store.getState();
      store.setState(initialState, true);
    }
  });

  return store;
};
```

**Migrar stores existentes:**
- `features/tenant/stores/branding.store.ts`

#### 6.2 Mejorar useTenantQuery

**Ya existe, pero verificar que:**
- [ ] Todos los desarrolladores lo usen
- [ ] No se use `useQuery` directamente en código de features
- [ ] Documentar en guía de desarrollo

#### 6.3 Crear Validaciones

**Validar que:**
- Todas las queries incluyan tenantId
- Todos los stores estén registrados
- No haya dependencias circulares

**Script de validación:**
```typescript
// scripts/validate-tenant-safety.ts
// Validar que no se use useQuery directamente
// Validar que todos los stores estén registrados
```

### Criterios de Éxito

- [ ] Factory de stores implementado
- [ ] Todos los stores usan el factory
- [ ] Documentación de mejores prácticas
- [ ] Validaciones automáticas (opcional)

---

## ✅ Verificación Final

### Checklist Completo

#### Estructura
- [ ] No existe `src/components`
- [ ] No hay páginas en `src/pages` excepto genéricas
- [ ] Todas las features tienen estructura completa
- [ ] App.tsx tiene menos de 50 líneas

#### Funcionalidad
- [ ] Todas las rutas funcionan
- [ ] Autenticación funciona
- [ ] Multi-tenancy funciona
- [ ] Cambio de tenant funciona
- [ ] Sincronización entre pestañas funciona

#### Calidad
- [ ] Tests pasan
- [ ] Cobertura mínima alcanzada
- [ ] No hay errores de TypeScript
- [ ] No hay warnings de ESLint
- [ ] Bundle size optimizado

#### Documentación
- [ ] README actualizado
- [ ] Guía de desarrollo creada
- [ ] Documentación de arquitectura
- [ ] Guía de contribución

### Métricas de Éxito

**Antes:**
- Calificación: 7.5/10
- App.tsx: ~235 líneas
- Duplicidad: Alta
- Testing: 0%
- Bundle: No optimizado

**Después:**
- Calificación: 9.5/10
- App.tsx: <50 líneas
- Duplicidad: 0%
- Testing: 60%+ en código crítico
- Bundle: Optimizado (-20%)

---

## 📝 Notas Importantes

### Orden de Ejecución

**NO saltar fases.** Cada fase depende de la anterior:
- Fase 0 → Base necesaria
- Fase 1 → Limpieza necesaria antes de migrar
- Fase 2 → Estructura necesaria para rutas
- Fase 3 → Rutas necesarias para testing
- Fase 4-6 → Mejoras incrementales

### Testing Continuo

**Después de cada fase:**
1. Build: `npm run build`
2. Desarrollo: `npm run dev` y probar manualmente
3. Tests: `npm test` (cuando esté configurado)
4. Lint: `npm run lint`

### Git Strategy

**Commits frecuentes:**
- Un commit por tarea pequeña
- Mensajes descriptivos
- Tags después de cada fase

**Ejemplo:**
```bash
git add .
git commit -m "refactor(fase-1): consolidate components to shared/"
git tag fase-1-completa
```

### Rollback Plan

**Si algo falla:**
1. Identificar la fase problemática
2. Revertir a tag anterior: `git reset --hard fase-X-completa`
3. Analizar el problema
4. Corregir y continuar

---

## 🎯 Timeline Estimado

- **Fase 0:** 2-3 horas
- **Fase 1:** 4-6 horas
- **Fase 2:** 8-12 horas
- **Fase 3:** 4-6 horas
- **Fase 4:** 6-8 horas
- **Fase 5:** 4-6 horas
- **Fase 6:** 4-6 horas

**Total:** 32-47 horas (4-6 días de trabajo)

---

## 🚀 Siguiente Paso

**Esperar confirmación del usuario antes de comenzar la implementación.**

Una vez confirmado, comenzar con **Fase 0: Configuración Base**.

