# 🏗️ FASE 1: ANÁLISIS Y PROPUESTA DE ARQUITECTURA DDD/FRACTAL

**Fecha:** 2024  
**Arquitecto:** Análisis Profesional de Arquitectura Frontend  
**Proyecto:** React 18 + Vite + TypeScript - Multi-Tenant ERP  
**Estado:** 📋 PROPUESTA (Pendiente de Confirmación)

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Auditoría Completa de Estructura Actual](#auditoría-completa-de-estructura-actual)
3. [Problemas Críticos Identificados](#problemas-críticos-identificados)
4. [Propuesta de Arquitectura DDD/Fractal](#propuesta-de-arquitectura-ddd-fractal)
5. [Mapa de Migración Detallado](#mapa-de-migración-detallado)
6. [Detección de Riesgos](#detección-de-riesgos)
7. [Plan de Ejecución Seguro](#plan-de-ejecución-seguro)

---

## 🎯 RESUMEN EJECUTIVO

### Estado Actual del Proyecto

**Fortalezas Identificadas:**
- ✅ React Query instalado y parcialmente implementado
- ✅ Zustand configurado para estado global
- ✅ TypeScript bien tipado
- ✅ Sistema de autenticación robusto
- ✅ Lazy loading parcial en App.tsx
- ✅ Estructura `features/` iniciada (parcial)

**Problemas Críticos Encontrados:**
- 🔴 **CRÍTICO:** Duplicación masiva de archivos (TenantContext, branding stores, hooks)
- 🔴 **CRÍTICO:** Estructura mixta: `pages/` + `features/` coexistiendo
- 🔴 **CRÍTICO:** Servicios duplicados: `src/services/` + `features/*/services/`
- 🔴 **CRÍTICO:** Tipos duplicados: `src/types/` + `features/*/types/`
- 🔴 **CRÍTICO:** Hooks duplicados: `src/hooks/`, `src/core/hooks/`, `features/*/hooks/`
- 🟡 **ALTO:** Carpeta `core/` incompleta (falta `api.ts`)
- 🟡 **ALTO:** Dependencias cruzadas entre `pages/` y `features/`
- 🟡 **MEDIO:** Componentes compartidos mal organizados

### Métricas Clave

| Métrica | Estado Actual | Objetivo | Gap |
|---------|--------------|----------|-----|
| Duplicación de código | ~15 archivos duplicados | 0 | 🔴 Crítico |
| Consistencia arquitectónica | 40% (mixto) | 100% (DDD/Fractal) | 🔴 Crítico |
| Separación por dominio | Parcial | Completa | 🔴 Crítico |
| Aislamiento de features | 30% | 100% | 🔴 Crítico |
| Reutilización de código | Baja (duplicación) | Alta | 🔴 Crítico |

---

## 🔍 AUDITORÍA COMPLETA DE ESTRUCTURA ACTUAL

### 1. Estructura de Carpetas Actual

```
src/
├── assets/                    # Recursos estáticos
├── common/                    # ⚠️ Carpeta poco usada (solo LayoutWrapper.tsx)
├── components/               # Componentes compartidos
│   ├── layout/               # Layouts (Header, Sidebar, NewLayout)
│   ├── ui/                  # Componentes UI genéricos (shadcn/ui)
│   ├── clients/             # ⚠️ Vacía
│   ├── modules/             # ⚠️ Vacía
│   └── [varios componentes] # BrandingDebug, LoadingSpinner, etc.
├── config/                   # Configuración (menús)
├── context/                  # Contextos React
│   ├── AuthContext.tsx      # ✅ Correcto
│   ├── TenantContext.tsx    # ⚠️ DUPLICADO (también en features/tenant/)
│   ├── ThemeContext.tsx      # ✅ Correcto
│   └── BreadcrumbContext.tsx # ✅ Correcto
├── core/                     # ⚠️ INCOMPLETO
│   ├── api/                 # ⚠️ api.ts NO EXISTE (está en services/)
│   └── hooks/               # ✅ Hooks base (useTenantQuery, useTenantMutation)
│       ├── useClientes.ts   # ⚠️ DUPLICADO (también en features/super-admin/clientes/)
│       └── useClienteMutations.ts # ⚠️ DUPLICADO
├── docs/                     # Documentación
├── features/                 # ⚠️ PARCIAL - Solo algunas features
│   ├── admin/               # ⚠️ Vacía (solo pages/ vacía)
│   ├── auth/                # ✅ Completa
│   │   ├── components/      # Vacía
│   │   ├── hooks/          # Vacía
│   │   ├── pages/          # Login.tsx
│   │   ├── services/        # auth.service.ts
│   │   └── types/          # auth.types.ts
│   ├── logistica/           # ⚠️ Placeholder (solo index.ts)
│   ├── planillas/           # ⚠️ Placeholder (solo index.ts)
│   ├── super-admin/         # ⚠️ PARCIAL
│   │   ├── clientes/       # ✅ Completa
│   │   │   ├── components/ # Vacía
│   │   │   ├── hooks/      # useClientes.ts, useClienteMutations.ts
│   │   │   ├── pages/      # ClientManagementPage.tsx
│   │   │   ├── services/   # cliente.service.ts
│   │   │   └── types/      # cliente.types.ts
│   │   └── modulos/         # ⚠️ Solo pages/ vacía
│   └── tenant/              # ✅ Completa
│       ├── components/      # TenantContext.tsx ⚠️ DUPLICADO
│       ├── hooks/          # useBranding.ts ⚠️ DUPLICADO
│       ├── services/       # branding.service.ts
│       ├── stores/         # branding.store.ts ⚠️ DUPLICADO
│       └── types/          # branding.types.ts
├── hooks/                    # ⚠️ Hooks globales (deberían estar en core/ o features/)
│   ├── useBranding.ts      # ⚠️ DUPLICADO (también en features/tenant/)
│   ├── useDebounce.ts      # ✅ Utilidad genérica (debería estar en core/utils/)
│   ├── useEficienciaKPIs.ts # ⚠️ Específico de dominio (debería estar en feature)
│   ├── useEficienciaProcesada.ts # ⚠️ Específico de dominio
│   ├── useFormValidation.ts # ✅ Utilidad genérica (debería estar en core/utils/)
│   └── useUserType.ts      # ✅ Utilidad genérica
├── lib/                      # ✅ Utilidades (icon-utils, utils)
├── pages/                    # ⚠️ MEZCLADO CON features/
│   ├── admin/              # ⚠️ Debería estar en features/admin/
│   │   ├── ActiveSessionsPage.tsx
│   │   ├── AreaManagementPage.tsx
│   │   ├── MenuManagementPage.tsx
│   │   ├── RoleManagementPage.tsx
│   │   ├── RolePermissionsManager.tsx
│   │   └── UserManagementPage.tsx
│   ├── auth/               # ⚠️ DUPLICADO (también en features/auth/)
│   │   └── Login.tsx       # ⚠️ DUPLICADO
│   ├── super-admin/        # ⚠️ MEZCLADO - Algunos en features/, otros en pages/
│   │   ├── ClientManagementPage.tsx # ⚠️ DUPLICADO (también en features/)
│   │   ├── ClientDetailPage.tsx
│   │   ├── ClientAuditTab.tsx
│   │   ├── ClientConnectionsTab.tsx
│   │   ├── ClientModulesTab.tsx
│   │   ├── ClientUsersTab.tsx
│   │   ├── CreateClientModal.tsx
│   │   ├── EditClientModal.tsx
│   │   ├── ModuleManagementPage.tsx
│   │   ├── SuperAdminDashboard.tsx
│   │   └── [varios modales]
│   ├── AutorizacionPage.tsx # ⚠️ Debería estar en feature de autorización
│   ├── FinalizarTareoPage.tsx # ⚠️ Debería estar en feature de tareo
│   ├── Home.tsx             # ✅ Página principal
│   ├── ReporteAutorizacionPage.tsx # ⚠️ Debería estar en feature
│   └── UnauthorizedPage.tsx # ✅ Página compartida
├── reference_backend/        # ✅ Referencias del backend
├── services/                # ⚠️ MEZCLADO - Algunos también en features/
│   ├── api.ts              # ✅ Instancia base de Axios
│   ├── area.service.ts     # ⚠️ Debería estar en features/admin/
│   ├── auth.service.ts     # ⚠️ DUPLICADO (también en features/auth/)
│   ├── autorizacion.service.ts # ⚠️ Debería estar en feature de autorización
│   ├── branding.service.ts # ⚠️ DUPLICADO (también en features/tenant/)
│   ├── cliente.service.ts  # ⚠️ DUPLICADO (también en features/super-admin/)
│   ├── conexion.service.ts # ⚠️ Debería estar en features/super-admin/
│   ├── error.service.ts    # ✅ Servicio compartido (debería estar en core/)
│   ├── menu.service.ts     # ⚠️ Debería estar en features/admin/
│   ├── modulo.service.ts  # ⚠️ Debería estar en features/super-admin/
│   ├── permission.service.ts # ⚠️ Debería estar en features/admin/
│   ├── rol.service.ts      # ⚠️ Debería estar en features/admin/
│   ├── session.service.ts  # ⚠️ Debería estar en features/admin/
│   ├── superadmin-auditoria.service.ts # ⚠️ Debería estar en features/super-admin/
│   ├── superadmin-usuario.service.ts # ⚠️ Debería estar en features/super-admin/
│   └── usuario.service.ts  # ⚠️ Debería estar en features/admin/
├── stores/                  # ⚠️ MEZCLADO
│   └── branding.store.ts  # ⚠️ DUPLICADO (también en features/tenant/)
├── types/                   # ⚠️ MEZCLADO - Algunos también en features/
│   ├── area.types.ts       # ⚠️ Debería estar en features/admin/
│   ├── auth.types.ts       # ⚠️ DUPLICADO (también en features/auth/)
│   ├── autorizacion.types.ts # ⚠️ Debería estar en feature de autorización
│   ├── branding.types.ts   # ⚠️ DUPLICADO (también en features/tenant/)
│   ├── cliente.types.ts    # ⚠️ DUPLICADO (también en features/super-admin/)
│   ├── conexion.types.ts   # ⚠️ Debería estar en features/super-admin/
│   ├── menu.types.ts       # ⚠️ Debería estar en features/admin/
│   ├── modulo.types.ts    # ⚠️ Debería estar en features/super-admin/
│   ├── permission.types.ts # ⚠️ Debería estar en features/admin/
│   ├── rol.types.ts        # ⚠️ Debería estar en features/admin/
│   ├── superadmin-auditoria.types.ts # ⚠️ Debería estar en features/super-admin/
│   ├── superadmin-usuario.types.ts # ⚠️ Debería estar en features/super-admin/
│   └── usuario.types.ts    # ⚠️ Debería estar en features/admin/
└── utils/                   # ⚠️ MEZCLADO
    ├── branding.utils.ts   # ⚠️ Debería estar en features/tenant/
    └── module.utils.ts     # ⚠️ Debería estar en features/super-admin/
```

### 2. Análisis de Duplicaciones

#### 🔴 Duplicaciones Críticas Identificadas

1. **TenantContext** (2 archivos):
   - `src/context/TenantContext.tsx` (266 líneas)
   - `src/features/tenant/components/TenantContext.tsx` (286 líneas)
   - **Problema:** App.tsx usa `features/tenant/components/TenantContext`, pero existe otro en `context/`
   - **Impacto:** Confusión sobre cuál usar, posible inconsistencia

2. **Branding Store** (2 archivos):
   - `src/stores/branding.store.ts` (127 líneas) - Versión simple
   - `src/features/tenant/stores/branding.store.ts` (295 líneas) - Versión con tenant
   - **Problema:** Dos implementaciones diferentes
   - **Impacto:** Código inconsistente, posible bug

3. **useBranding Hook** (2 archivos):
   - `src/hooks/useBranding.ts` (59 líneas) - Usa store simple
   - `src/features/tenant/hooks/useBranding.ts` (64 líneas) - Usa store con tenant
   - **Problema:** Dependencias diferentes
   - **Impacto:** Comportamiento inconsistente

4. **Auth Service** (2 archivos):
   - `src/services/auth.service.ts`
   - `src/features/auth/services/auth.service.ts`
   - **Problema:** Duplicación innecesaria
   - **Impacto:** Mantenimiento duplicado

5. **Auth Types** (2 archivos):
   - `src/types/auth.types.ts`
   - `src/features/auth/types/auth.types.ts`
   - **Problema:** Duplicación innecesaria
   - **Impacto:** Mantenimiento duplicado

6. **Login Page** (2 archivos):
   - `src/pages/auth/Login.tsx`
   - `src/features/auth/pages/Login.tsx`
   - **Problema:** App.tsx usa `pages/auth/Login`, pero existe otro en `features/`
   - **Impacto:** Confusión sobre cuál usar

7. **Cliente Service** (2 archivos):
   - `src/services/cliente.service.ts`
   - `src/features/super-admin/clientes/services/cliente.service.ts`
   - **Problema:** Duplicación innecesaria
   - **Impacto:** Mantenimiento duplicado

8. **Cliente Types** (2 archivos):
   - `src/types/cliente.types.ts`
   - `src/features/super-admin/clientes/types/cliente.types.ts`
   - **Problema:** Duplicación innecesaria
   - **Impacto:** Mantenimiento duplicado

9. **useClientes Hook** (2 archivos):
   - `src/core/hooks/useClientes.ts` (47 líneas)
   - `src/features/super-admin/clientes/hooks/useClientes.ts` (48 líneas)
   - **Problema:** Casi idénticos, solo difieren en imports
   - **Impacto:** Mantenimiento duplicado

10. **useClienteMutations Hook** (2 archivos):
    - `src/core/hooks/useClienteMutations.ts` (104 líneas)
    - `src/features/super-admin/clientes/hooks/useClienteMutations.ts` (similar)
    - **Problema:** Duplicación innecesaria
    - **Impacto:** Mantenimiento duplicado

11. **ClientManagementPage** (2 archivos):
    - `src/pages/super-admin/ClientManagementPage.tsx` (452 líneas)
    - `src/features/super-admin/clientes/pages/ClientManagementPage.tsx` (similar)
    - **Problema:** App.tsx importa desde `features/`, pero existe otro en `pages/`
    - **Impacto:** Confusión sobre cuál usar

### 3. Análisis de Dependencias Cruzadas

#### Problemas de Acoplamiento

1. **Pages importando desde features:**
   ```typescript
   // src/pages/super-admin/ClientManagementPage.tsx
   import { useClientes } from '../../core/hooks/useClientes';
   // ⚠️ Debería importar desde su propia feature
   ```

2. **Features importando desde pages:**
   ```typescript
   // src/features/super-admin/clientes/pages/ClientManagementPage.tsx
   import CreateClientModal from '../../../../pages/super-admin/CreateClientModal';
   // ⚠️ Dependencia cruzada: feature → pages
   ```

3. **Core importando desde features:**
   ```typescript
   // src/core/hooks/useTenantQuery.ts
   import { useTenant } from '../../features/tenant/components/TenantContext';
   // ⚠️ Core no debería depender de features
   ```

4. **Context importando desde features:**
   ```typescript
   // src/context/AuthContext.tsx
   import { useBrandingStore } from '../features/tenant/stores/branding.store';
   // ⚠️ Context no debería depender de features específicas
   ```

### 4. Dominios de Negocio Identificados

Basado en el análisis del código, se identifican los siguientes dominios:

1. **Auth** - Autenticación y autorización
2. **Tenant** - Gestión de tenant y branding
3. **Admin** - Administración de tenant (usuarios, roles, áreas, menús, sesiones)
4. **SuperAdmin** - Administración global (clientes, módulos, conexiones, auditoría)
5. **Autorizacion** - Gestión de autorizaciones y tareo
6. **Planillas** - Módulo ERP (placeholder)
7. **Logistica** - Módulo ERP (placeholder)

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. Duplicación Masiva de Archivos

**Severidad:** 🔴 CRÍTICO  
**Impacto:** Mantenimiento duplicado, posibles bugs, confusión

**Archivos Duplicados:**
- 11+ archivos duplicados
- ~2000+ líneas de código duplicado
- Riesgo de inconsistencias

### 2. Estructura Mixta (Pages + Features)

**Severidad:** 🔴 CRÍTICO  
**Impacto:** Imposible escalar, confusión sobre dónde colocar código nuevo

**Problemas:**
- Algunas features en `features/`, otras en `pages/`
- No hay criterio claro sobre qué va dónde
- Dificulta onboarding de nuevos desarrolladores

### 3. Servicios y Tipos Duplicados

**Severidad:** 🔴 CRÍTICO  
**Impacto:** Mantenimiento duplicado, posibles inconsistencias

**Problemas:**
- Servicios en `src/services/` y `features/*/services/`
- Tipos en `src/types/` y `features/*/types/`
- No hay fuente única de verdad

### 4. Core Incompleto

**Severidad:** 🟡 ALTO  
**Impacto:** Lógica compartida mal organizada

**Problemas:**
- `core/api/api.ts` no existe (está en `services/api.ts`)
- Hooks base mezclados con hooks de features
- Falta estructura clara para código compartido

### 5. Dependencias Cruzadas

**Severidad:** 🟡 ALTO  
**Impacto:** Alto acoplamiento, difícil testing, difícil refactoring

**Problemas:**
- Pages → Features
- Features → Pages
- Core → Features
- Context → Features

### 6. Hooks Mal Organizados

**Severidad:** 🟡 MEDIO  
**Impacto:** Difícil encontrar hooks, duplicación

**Problemas:**
- Hooks en `src/hooks/` (genéricos y específicos mezclados)
- Hooks en `src/core/hooks/` (base y específicos mezclados)
- Hooks en `features/*/hooks/` (correcto, pero inconsistente)

---

## 🏗️ PROPUESTA DE ARQUITECTURA DDD/FRACTAL

### Principios de la Arquitectura

1. **Feature-Based (Vertical Slicing)**: Cada feature es un módulo vertical completo
2. **DDD (Domain-Driven Design)**: Organización por dominios de negocio
3. **Fractal**: Estructura recursiva (cada feature puede tener sub-features)
4. **Aislamiento**: Features independientes, sin dependencias cruzadas
5. **Composabilidad**: Features se componen en la aplicación principal

### Estructura Propuesta

```
src/
├── app/                      # 🆕 Configuración de la aplicación
│   ├── App.tsx              # ✅ Movido desde raíz
│   ├── main.tsx             # ✅ Movido desde raíz
│   ├── routes.tsx           # 🆕 Configuración de rutas
│   └── providers.tsx        # 🆕 Providers (QueryClient, Theme, Auth, Tenant)
│
├── core/                     # ✅ MEJORADO - Código compartido entre features
│   ├── api/                 # ✅ API base
│   │   ├── api.ts           # ✅ Instancia de Axios (movido desde services/)
│   │   ├── interceptors.ts  # 🆕 Interceptores de Axios
│   │   └── types.ts         # 🆕 Tipos de API
│   ├── hooks/               # ✅ Hooks base compartidos
│   │   ├── useTenantQuery.ts    # ✅ Query con tenant
│   │   ├── useTenantMutation.ts # ✅ Mutation con tenant
│   │   └── index.ts         # 🆕 Exports
│   ├── utils/               # 🆕 Utilidades compartidas
│   │   ├── debounce.ts      # ✅ Movido desde hooks/
│   │   ├── formValidation.ts # ✅ Movido desde hooks/
│   │   ├── sanitize.ts       # ✅ Ya existe
│   │   ├── secureStorage.ts  # ✅ Ya existe
│   │   └── index.ts         # 🆕 Exports
│   ├── services/            # 🆕 Servicios compartidos
│   │   └── error.service.ts  # ✅ Movido desde services/
│   └── types/               # 🆕 Tipos compartidos
│       └── common.types.ts  # 🆕 Tipos comunes (paginación, etc.)
│
├── shared/                   # 🆕 Componentes y utilidades compartidas
│   ├── components/          # ✅ Componentes UI genéricos
│   │   ├── layout/          # ✅ Layouts (Header, Sidebar, NewLayout)
│   │   ├── ui/              # ✅ Componentes shadcn/ui
│   │   ├── LoadingSpinner.tsx # ✅ Movido desde components/
│   │   ├── ProtectedRoute.tsx  # ✅ Movido desde components/
│   │   ├── SmartRedirect.tsx  # ✅ Movido desde components/
│   │   └── ThemeSwitch.tsx    # ✅ Movido desde components/
│   ├── context/             # ✅ Contextos compartidos
│   │   ├── AuthContext.tsx  # ✅ Movido desde context/
│   │   ├── ThemeContext.tsx # ✅ Movido desde context/
│   │   └── BreadcrumbContext.tsx # ✅ Movido desde context/
│   ├── config/              # ✅ Configuración compartida
│   │   ├── adminMenu.ts     # ✅ Movido desde config/
│   │   └── superAdminMenu.ts # ✅ Movido desde config/
│   └── lib/                 # ✅ Utilidades de librerías
│       ├── icon-utils.tsx   # ✅ Ya existe
│       └── utils.ts         # ✅ Ya existe
│
├── features/                 # ✅ MEJORADO - Features organizadas por dominio
│   │
│   ├── auth/                 # ✅ DOMINIO: Autenticación
│   │   ├── components/      # 🆕 Componentes específicos de auth
│   │   ├── hooks/           # 🆕 Hooks específicos de auth
│   │   ├── pages/           # ✅ Login.tsx (único, sin duplicación)
│   │   ├── services/        # ✅ auth.service.ts (único)
│   │   ├── stores/          # 🆕 Stores de auth (si es necesario)
│   │   ├── types/           # ✅ auth.types.ts (único)
│   │   └── index.ts         # 🆕 Exports públicos del módulo
│   │
│   ├── tenant/               # ✅ DOMINIO: Gestión de tenant
│   │   ├── components/      # ✅ TenantContext.tsx (único)
│   │   ├── hooks/           # ✅ useBranding.ts (único)
│   │   ├── services/        # ✅ branding.service.ts (único)
│   │   ├── stores/          # ✅ branding.store.ts (único)
│   │   ├── types/           # ✅ branding.types.ts (único)
│   │   ├── utils/           # ✅ branding.utils.ts (movido desde utils/)
│   │   └── index.ts         # 🆕 Exports públicos
│   │
│   ├── admin/                # 🆕 DOMINIO: Administración de tenant
│   │   ├── components/      # 🆕 Componentes específicos
│   │   │   └── RolePermissionsManager.tsx # ✅ Movido desde pages/admin/
│   │   ├── hooks/           # 🆕 Hooks específicos
│   │   ├── pages/           # ✅ Todas las páginas de admin
│   │   │   ├── UserManagementPage.tsx
│   │   │   ├── RoleManagementPage.tsx
│   │   │   ├── AreaManagementPage.tsx
│   │   │   ├── MenuManagementPage.tsx
│   │   │   └── ActiveSessionsPage.tsx
│   │   ├── services/        # ✅ Servicios movidos desde services/
│   │   │   ├── usuario.service.ts
│   │   │   ├── rol.service.ts
│   │   │   ├── area.service.ts
│   │   │   ├── menu.service.ts
│   │   │   ├── permission.service.ts
│   │   │   └── session.service.ts
│   │   ├── stores/          # 🆕 Stores si es necesario
│   │   ├── types/           # ✅ Tipos movidos desde types/
│   │   │   ├── usuario.types.ts
│   │   │   ├── rol.types.ts
│   │   │   ├── area.types.ts
│   │   │   ├── menu.types.ts
│   │   │   └── permission.types.ts
│   │   └── index.ts         # 🆕 Exports públicos
│   │
│   ├── super-admin/          # ✅ DOMINIO: Administración global
│   │   ├── clientes/         # ✅ Sub-feature: Gestión de clientes
│   │   │   ├── components/   # 🆕 Componentes específicos
│   │   │   │   ├── CreateClientModal.tsx # ✅ Movido desde pages/
│   │   │   │   ├── EditClientModal.tsx   # ✅ Movido desde pages/
│   │   │   │   └── ClientDetailTabs.tsx  # 🆕 Componente para tabs
│   │   │   ├── hooks/        # ✅ Hooks (únicos, sin duplicación)
│   │   │   │   ├── useClientes.ts
│   │   │   │   └── useClienteMutations.ts
│   │   │   ├── pages/        # ✅ Páginas (únicas, sin duplicación)
│   │   │   │   ├── ClientManagementPage.tsx
│   │   │   │   └── ClientDetailPage.tsx
│   │   │   ├── services/    # ✅ Servicios (únicos)
│   │   │   │   └── cliente.service.ts
│   │   │   ├── stores/       # 🆕 Stores si es necesario
│   │   │   ├── types/        # ✅ Tipos (únicos)
│   │   │   │   └── cliente.types.ts
│   │   │   └── index.ts      # 🆕 Exports públicos
│   │   │
│   │   ├── modulos/          # 🆕 Sub-feature: Gestión de módulos
│   │   │   ├── components/   # 🆕 Componentes
│   │   │   │   ├── CreateModuleModal.tsx
│   │   │   │   ├── EditModuleModal.tsx
│   │   │   │   ├── ActivateModuleModal.tsx
│   │   │   │   └── EditModuleActivoModal.tsx
│   │   │   ├── hooks/        # 🆕 Hooks
│   │   │   ├── pages/        # ✅ ModuleManagementPage.tsx
│   │   │   ├── services/     # ✅ modulo.service.ts (movido)
│   │   │   ├── stores/       # 🆕 Stores si es necesario
│   │   │   ├── types/        # ✅ modulo.types.ts (movido)
│   │   │   └── index.ts      # 🆕 Exports
│   │   │
│   │   ├── conexiones/       # 🆕 Sub-feature: Gestión de conexiones
│   │   │   ├── components/   # 🆕 Componentes
│   │   │   │   ├── CreateConnectionModal.tsx
│   │   │   │   └── EditConnectionModal.tsx
│   │   │   ├── hooks/        # 🆕 Hooks
│   │   │   ├── services/     # ✅ conexion.service.ts (movido)
│   │   │   ├── stores/       # 🆕 Stores si es necesario
│   │   │   ├── types/        # ✅ conexion.types.ts (movido)
│   │   │   └── index.ts      # 🆕 Exports
│   │   │
│   │   ├── auditoria/        # 🆕 Sub-feature: Auditoría global
│   │   │   ├── components/   # 🆕 Componentes
│   │   │   │   └── ClientAuditTab.tsx # ✅ Movido desde pages/
│   │   │   ├── hooks/        # 🆕 Hooks
│   │   │   ├── services/     # ✅ superadmin-auditoria.service.ts (movido)
│   │   │   ├── stores/       # 🆕 Stores si es necesario
│   │   │   ├── types/        # ✅ superadmin-auditoria.types.ts (movido)
│   │   │   └── index.ts      # 🆕 Exports
│   │   │
│   │   ├── usuarios/         # 🆕 Sub-feature: Usuarios globales
│   │   │   ├── components/   # 🆕 Componentes
│   │   │   │   └── ClientUsersTab.tsx # ✅ Movido desde pages/
│   │   │   ├── hooks/        # 🆕 Hooks
│   │   │   ├── services/     # ✅ superadmin-usuario.service.ts (movido)
│   │   │   ├── stores/       # 🆕 Stores si es necesario
│   │   │   ├── types/        # ✅ superadmin-usuario.types.ts (movido)
│   │   │   └── index.ts      # 🆕 Exports
│   │   │
│   │   ├── dashboard/         # 🆕 Sub-feature: Dashboard
│   │   │   ├── components/   # 🆕 Componentes
│   │   │   ├── hooks/        # 🆕 Hooks
│   │   │   ├── pages/        # ✅ SuperAdminDashboard.tsx
│   │   │   └── index.ts      # 🆕 Exports
│   │   │
│   │   └── index.ts          # 🆕 Exports públicos del módulo super-admin
│   │
│   ├── autorizacion/          # 🆕 DOMINIO: Autorizaciones y tareo
│   │   ├── components/        # 🆕 Componentes específicos
│   │   ├── hooks/             # 🆕 Hooks específicos
│   │   ├── pages/             # ✅ Páginas movidas desde pages/
│   │   │   ├── AutorizacionPage.tsx
│   │   │   ├── FinalizarTareoPage.tsx
│   │   │   └── ReporteAutorizacionPage.tsx
│   │   ├── services/          # ✅ autorizacion.service.ts (movido)
│   │   ├── stores/            # 🆕 Stores si es necesario
│   │   ├── types/             # ✅ autorizacion.types.ts (movido)
│   │   └── index.ts           # 🆕 Exports públicos
│   │
│   ├── planillas/             # ✅ DOMINIO: Módulo ERP Planillas (placeholder)
│   │   └── index.ts           # ✅ Ya existe
│   │
│   └── logistica/              # ✅ DOMINIO: Módulo ERP Logística (placeholder)
│       └── index.ts            # ✅ Ya existe
│
├── assets/                     # ✅ Recursos estáticos
├── docs/                       # ✅ Documentación
└── reference_backend/          # ✅ Referencias del backend
```

### Reglas de Organización

1. **Cada feature es independiente:**
   - No puede importar de otras features
   - Solo puede importar de `core/` y `shared/`
   - Expone su API pública a través de `index.ts`

2. **Core contiene código compartido:**
   - API base, hooks base, utilidades genéricas
   - No contiene lógica de negocio específica
   - Puede importar de `shared/` pero no de `features/`

3. **Shared contiene componentes y contextos compartidos:**
   - Componentes UI genéricos
   - Contextos globales (Auth, Theme)
   - Configuración compartida
   - Puede importar de `core/` pero no de `features/`

4. **App contiene configuración de la aplicación:**
   - Rutas, providers, punto de entrada
   - Puede importar de `core/`, `shared/` y `features/`

### Estructura Interna de una Feature

Cada feature sigue esta estructura interna (Fractal):

```
feature/
├── components/     # Componentes específicos de la feature
├── hooks/         # Hooks específicos de la feature
├── pages/         # Páginas de la feature
├── services/      # Servicios API de la feature
├── stores/        # Stores Zustand (si es necesario)
├── types/         # Tipos TypeScript de la feature
├── utils/         # Utilidades específicas (opcional)
└── index.ts       # Exports públicos (API de la feature)
```

---

## 🗺️ MAPA DE MIGRACIÓN DETALLADO

### Fase 1: Preparación (Sin cambios de código)

1. ✅ Crear estructura de carpetas nueva
2. ✅ Documentar mapeo de archivos

### Fase 2: Core y Shared (Base sólida)

#### 2.1 Crear `core/`

**Archivos a crear:**
- `src/core/api/api.ts` ← `src/services/api.ts`
- `src/core/services/error.service.ts` ← `src/services/error.service.ts`
- `src/core/utils/debounce.ts` ← `src/hooks/useDebounce.ts` (convertir a utilidad)
- `src/core/utils/formValidation.ts` ← `src/hooks/useFormValidation.ts` (convertir a utilidad)
- `src/core/utils/sanitize.ts` ← Ya existe, mover
- `src/core/utils/secureStorage.ts` ← Ya existe, mover

**Archivos a mantener:**
- `src/core/hooks/useTenantQuery.ts` (ya existe)
- `src/core/hooks/useTenantMutation.ts` (ya existe)

**Archivos a eliminar:**
- `src/core/hooks/useClientes.ts` (mover a feature)
- `src/core/hooks/useClienteMutations.ts` (mover a feature)

#### 2.2 Crear `shared/`

**Archivos a mover:**
- `src/components/` → `src/shared/components/`
- `src/context/` → `src/shared/context/` (excepto TenantContext que va a features/tenant)
- `src/config/` → `src/shared/config/`
- `src/lib/` → `src/shared/lib/`

**Archivos específicos:**
- `src/components/LoadingSpinner.tsx` → `src/shared/components/LoadingSpinner.tsx`
- `src/components/ProtectedRoute.tsx` → `src/shared/components/ProtectedRoute.tsx`
- `src/components/SmartRedirect.tsx` → `src/shared/components/SmartRedirect.tsx`
- `src/components/ThemeSwitch.tsx` → `src/shared/components/ThemeSwitch.tsx`
- `src/components/layout/` → `src/shared/components/layout/`
- `src/components/ui/` → `src/shared/components/ui/`

### Fase 3: Features - Auth

**Archivos a consolidar:**
- `src/features/auth/pages/Login.tsx` (mantener este, eliminar `src/pages/auth/Login.tsx`)
- `src/features/auth/services/auth.service.ts` (mantener este, eliminar `src/services/auth.service.ts`)
- `src/features/auth/types/auth.types.ts` (mantener este, eliminar `src/types/auth.types.ts`)

**Archivos a crear:**
- `src/features/auth/index.ts` (exports públicos)

### Fase 4: Features - Tenant

**Archivos a consolidar:**
- `src/features/tenant/components/TenantContext.tsx` (mantener este, eliminar `src/context/TenantContext.tsx`)
- `src/features/tenant/stores/branding.store.ts` (mantener versión con tenant, eliminar `src/stores/branding.store.ts`)
- `src/features/tenant/hooks/useBranding.ts` (mantener este, eliminar `src/hooks/useBranding.ts`)
- `src/features/tenant/services/branding.service.ts` (mantener este, eliminar `src/services/branding.service.ts`)
- `src/features/tenant/types/branding.types.ts` (mantener este, eliminar `src/types/branding.types.ts`)

**Archivos a mover:**
- `src/utils/branding.utils.ts` → `src/features/tenant/utils/branding.utils.ts`

**Archivos a crear:**
- `src/features/tenant/index.ts` (exports públicos)

### Fase 5: Features - Admin

**Archivos a mover:**
- `src/pages/admin/*` → `src/features/admin/pages/`
- `src/services/usuario.service.ts` → `src/features/admin/services/`
- `src/services/rol.service.ts` → `src/features/admin/services/`
- `src/services/area.service.ts` → `src/features/admin/services/`
- `src/services/menu.service.ts` → `src/features/admin/services/`
- `src/services/permission.service.ts` → `src/features/admin/services/`
- `src/services/session.service.ts` → `src/features/admin/services/`
- `src/types/usuario.types.ts` → `src/features/admin/types/`
- `src/types/rol.types.ts` → `src/features/admin/types/`
- `src/types/area.types.ts` → `src/features/admin/types/`
- `src/types/menu.types.ts` → `src/features/admin/types/`
- `src/types/permission.types.ts` → `src/features/admin/types/`

**Archivos a crear:**
- `src/features/admin/components/RolePermissionsManager.tsx` (mover desde `src/pages/admin/`)
- `src/features/admin/index.ts` (exports públicos)

### Fase 6: Features - Super Admin

#### 6.1 Clientes

**Archivos a consolidar:**
- `src/features/super-admin/clientes/pages/ClientManagementPage.tsx` (mantener este, eliminar `src/pages/super-admin/ClientManagementPage.tsx`)
- `src/features/super-admin/clientes/hooks/useClientes.ts` (mantener este, eliminar `src/core/hooks/useClientes.ts`)
- `src/features/super-admin/clientes/hooks/useClienteMutations.ts` (mantener este, eliminar `src/core/hooks/useClienteMutations.ts`)
- `src/features/super-admin/clientes/services/cliente.service.ts` (mantener este, eliminar `src/services/cliente.service.ts`)
- `src/features/super-admin/clientes/types/cliente.types.ts` (mantener este, eliminar `src/types/cliente.types.ts`)

**Archivos a mover:**
- `src/pages/super-admin/ClientDetailPage.tsx` → `src/features/super-admin/clientes/pages/`
- `src/pages/super-admin/CreateClientModal.tsx` → `src/features/super-admin/clientes/components/`
- `src/pages/super-admin/EditClientModal.tsx` → `src/features/super-admin/clientes/components/`
- `src/pages/super-admin/ClientAuditTab.tsx` → `src/features/super-admin/auditoria/components/`
- `src/pages/super-admin/ClientUsersTab.tsx` → `src/features/super-admin/usuarios/components/`
- `src/pages/super-admin/ClientModulesTab.tsx` → `src/features/super-admin/modulos/components/`
- `src/pages/super-admin/ClientConnectionsTab.tsx` → `src/features/super-admin/conexiones/components/`

**Archivos a crear:**
- `src/features/super-admin/clientes/index.ts` (exports públicos)

#### 6.2 Módulos

**Archivos a mover:**
- `src/pages/super-admin/ModuleManagementPage.tsx` → `src/features/super-admin/modulos/pages/`
- `src/pages/super-admin/CreateModuleModal.tsx` → `src/features/super-admin/modulos/components/`
- `src/pages/super-admin/EditModuleModal.tsx` → `src/features/super-admin/modulos/components/`
- `src/pages/super-admin/ActivateModuleModal.tsx` → `src/features/super-admin/modulos/components/`
- `src/pages/super-admin/EditModuleActivoModal.tsx` → `src/features/super-admin/modulos/components/`
- `src/services/modulo.service.ts` → `src/features/super-admin/modulos/services/`
- `src/types/modulo.types.ts` → `src/features/super-admin/modulos/types/`
- `src/utils/module.utils.ts` → `src/features/super-admin/modulos/utils/`

**Archivos a crear:**
- `src/features/super-admin/modulos/index.ts` (exports públicos)

#### 6.3 Conexiones

**Archivos a mover:**
- `src/pages/super-admin/CreateConnectionModal.tsx` → `src/features/super-admin/conexiones/components/`
- `src/pages/super-admin/EditConnectionModal.tsx` → `src/features/super-admin/conexiones/components/`
- `src/services/conexion.service.ts` → `src/features/super-admin/conexiones/services/`
- `src/types/conexion.types.ts` → `src/features/super-admin/conexiones/types/`

**Archivos a crear:**
- `src/features/super-admin/conexiones/index.ts` (exports públicos)

#### 6.4 Auditoría

**Archivos a mover:**
- `src/services/superadmin-auditoria.service.ts` → `src/features/super-admin/auditoria/services/`
- `src/types/superadmin-auditoria.types.ts` → `src/features/super-admin/auditoria/types/`

**Archivos a crear:**
- `src/features/super-admin/auditoria/index.ts` (exports públicos)

#### 6.5 Usuarios

**Archivos a mover:**
- `src/services/superadmin-usuario.service.ts` → `src/features/super-admin/usuarios/services/`
- `src/types/superadmin-usuario.types.ts` → `src/features/super-admin/usuarios/types/`

**Archivos a crear:**
- `src/features/super-admin/usuarios/index.ts` (exports públicos)

#### 6.6 Dashboard

**Archivos a mover:**
- `src/pages/super-admin/SuperAdminDashboard.tsx` → `src/features/super-admin/dashboard/pages/`

**Archivos a crear:**
- `src/features/super-admin/dashboard/index.ts` (exports públicos)

### Fase 7: Features - Autorización

**Archivos a mover:**
- `src/pages/AutorizacionPage.tsx` → `src/features/autorizacion/pages/`
- `src/pages/FinalizarTareoPage.tsx` → `src/features/autorizacion/pages/`
- `src/pages/ReporteAutorizacionPage.tsx` → `src/features/autorizacion/pages/`
- `src/services/autorizacion.service.ts` → `src/features/autorizacion/services/`
- `src/types/autorizacion.types.ts` → `src/features/autorizacion/types/`

**Archivos a crear:**
- `src/features/autorizacion/index.ts` (exports públicos)

### Fase 8: App y Rutas

**Archivos a mover:**
- `src/App.tsx` → `src/app/App.tsx`
- `src/main.tsx` → `src/app/main.tsx`

**Archivos a crear:**
- `src/app/routes.tsx` (configuración de rutas)
- `src/app/providers.tsx` (providers consolidados)

### Fase 9: Limpieza

**Carpetas a eliminar (después de migración):**
- `src/pages/` (vacía después de migración)
- `src/services/` (vacía después de migración)
- `src/types/` (vacía después de migración)
- `src/hooks/` (vacía después de migración)
- `src/components/` (vacía después de migración)
- `src/context/` (vacía después de migración)
- `src/config/` (vacía después de migración)
- `src/lib/` (vacía después de migración)
- `src/utils/` (vacía después de migración)
- `src/stores/` (vacía después de migración)
- `src/common/` (si está vacía)

**Archivos a eliminar (duplicados):**
- Ver lista completa en sección de duplicaciones

---

## ⚠️ DETECCIÓN DE RIESGOS

### Riesgos Críticos

1. **Ruptura de Imports**
   - **Probabilidad:** Alta
   - **Impacto:** Alto
   - **Mitigación:** 
     - Actualizar imports automáticamente con herramienta
     - Verificar compilación después de cada fase
     - Tests de compilación antes de commit

2. **Dependencias Circulares**
   - **Probabilidad:** Media
   - **Impacto:** Alto
   - **Mitigación:**
     - Revisar imports antes de mover
     - Usar `index.ts` para exports públicos
     - Evitar imports directos entre features

3. **Pérdida de Funcionalidad**
   - **Probabilidad:** Baja
   - **Impacto:** Crítico
   - **Mitigación:**
     - Migración atómica (un archivo a la vez)
     - Verificar funcionalidad después de cada movimiento
     - Tests manuales después de cada fase

### Riesgos Altos

4. **Inconsistencias en Duplicados**
   - **Probabilidad:** Media
   - **Impacto:** Medio
   - **Mitigación:**
     - Comparar archivos duplicados antes de eliminar
     - Mantener el más completo/actualizado
     - Documentar diferencias si las hay

5. **Rutas Rotas**
   - **Probabilidad:** Media
   - **Impacto:** Alto
   - **Mitigación:**
     - Actualizar rutas en `App.tsx` después de mover páginas
     - Verificar navegación después de cada fase

### Riesgos Medios

6. **Performance en Build**
   - **Probabilidad:** Baja
   - **Impacto:** Bajo
   - **Mitigación:**
     - Verificar que code splitting sigue funcionando
     - Revisar bundle size después de migración

7. **Confusión Temporal**
   - **Probabilidad:** Alta
   - **Impacto:** Bajo
   - **Mitigación:**
     - Documentar cambios en cada fase
     - Comunicar estructura nueva al equipo

---

## 📋 PLAN DE EJECUCIÓN SEGURO

### Estrategia: Migración Atómica por Fases

Cada fase es:
- ✅ **Atómica**: Se puede hacer commit después de cada fase
- ✅ **Reversible**: Se puede revertir fácilmente
- ✅ **Verificable**: Se puede compilar y probar después de cada fase
- ✅ **Incremental**: No rompe funcionalidad existente

### Orden de Ejecución

#### **FASE 1: Preparación** (Sin cambios de código)
1. ✅ Crear este documento
2. ✅ Revisar y aprobar propuesta
3. ⏸️ **ESPERAR CONFIRMACIÓN**

#### **FASE 2: Core y Shared** (Base sólida)
1. Crear estructura `core/`
2. Mover `services/api.ts` → `core/api/api.ts`
3. Mover `services/error.service.ts` → `core/services/error.service.ts`
4. Mover hooks genéricos → `core/utils/`
5. Crear estructura `shared/`
6. Mover componentes compartidos → `shared/components/`
7. Mover contextos → `shared/context/` (excepto TenantContext)
8. Mover config → `shared/config/`
9. Mover lib → `shared/lib/`
10. Actualizar imports en archivos afectados
11. ✅ **VERIFICAR COMPILACIÓN**
12. ✅ **COMMIT**: "refactor: crear estructura core y shared"

#### **FASE 3: Feature Auth** (Consolidar)
1. Eliminar duplicados de auth
2. Mantener solo `features/auth/`
3. Actualizar imports
4. ✅ **VERIFICAR COMPILACIÓN**
5. ✅ **COMMIT**: "refactor: consolidar feature auth"

#### **FASE 4: Feature Tenant** (Consolidar)
1. Eliminar duplicados de tenant
2. Mantener solo `features/tenant/`
3. Mover `utils/branding.utils.ts` → `features/tenant/utils/`
4. Actualizar imports
5. ✅ **VERIFICAR COMPILACIÓN**
6. ✅ **COMMIT**: "refactor: consolidar feature tenant"

#### **FASE 5: Feature Admin** (Migrar)
1. Crear estructura `features/admin/`
2. Mover páginas de admin
3. Mover servicios de admin
4. Mover tipos de admin
5. Actualizar imports
6. ✅ **VERIFICAR COMPILACIÓN**
7. ✅ **COMMIT**: "refactor: migrar feature admin"

#### **FASE 6: Feature Super Admin** (Migrar por sub-features)
6.1. Clientes
6.2. Módulos
6.3. Conexiones
6.4. Auditoría
6.5. Usuarios
6.6. Dashboard
- Cada sub-feature: mover, actualizar imports, verificar, commit

#### **FASE 7: Feature Autorización** (Migrar)
1. Crear estructura `features/autorizacion/`
2. Mover páginas de autorización
3. Mover servicios y tipos
4. Actualizar imports
5. ✅ **VERIFICAR COMPILACIÓN**
6. ✅ **COMMIT**: "refactor: migrar feature autorizacion"

#### **FASE 8: App y Rutas** (Reorganizar)
1. Mover `App.tsx` → `app/App.tsx`
2. Mover `main.tsx` → `app/main.tsx`
3. Crear `app/routes.tsx`
4. Crear `app/providers.tsx`
5. Actualizar imports
6. ✅ **VERIFICAR COMPILACIÓN**
7. ✅ **COMMIT**: "refactor: reorganizar app y rutas"

#### **FASE 9: Limpieza** (Eliminar vacíos)
1. Eliminar carpetas vacías
2. Eliminar archivos duplicados
3. Verificar que no queden referencias
4. ✅ **VERIFICAR COMPILACIÓN**
5. ✅ **COMMIT**: "refactor: limpiar carpetas y archivos duplicados"

#### **FASE 10: Verificación Final**
1. ✅ Compilación completa sin errores
2. ✅ Tests manuales de funcionalidad
3. ✅ Verificar que todas las rutas funcionan
4. ✅ Verificar que no hay imports rotos
5. ✅ Documentar estructura final

---

## 📊 RESUMEN DE CAMBIOS

### Archivos a Mover
- **~150+ archivos** a reorganizar
- **~15 archivos duplicados** a eliminar
- **~10 carpetas** a crear

### Archivos a Actualizar (Imports)
- **~200+ archivos** con imports a actualizar
- **~50+ rutas** en App.tsx a actualizar

### Tiempo Estimado
- **Fase 2-4**: 2-3 horas (core, shared, auth, tenant)
- **Fase 5**: 1-2 horas (admin)
- **Fase 6**: 3-4 horas (super-admin, 6 sub-features)
- **Fase 7**: 1 hora (autorización)
- **Fase 8**: 1 hora (app y rutas)
- **Fase 9**: 30 minutos (limpieza)
- **Fase 10**: 1 hora (verificación)

**Total estimado:** 10-13 horas

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de comenzar cada fase:
- [ ] Backup del código actual
- [ ] Branch nuevo creado
- [ ] Documentación de la fase leída

Después de cada fase:
- [ ] Compilación sin errores
- [ ] Imports actualizados
- [ ] Funcionalidad verificada
- [ ] Commit realizado
- [ ] Documentación actualizada

---

## 🎯 PRÓXIMOS PASOS

1. **Revisar esta propuesta**
2. **Aprobar o solicitar cambios**
3. **Una vez aprobado, comenzar FASE 2**

---

**Estado:** ⏸️ **ESPERANDO CONFIRMACIÓN**

¿Procedo con la implementación de esta arquitectura?




