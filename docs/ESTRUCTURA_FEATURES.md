# 📁 Estructura de Features - Guía de Referencia

## 🎯 Principio: Feature-First + Domain-Driven Design

La estructura combina **Feature-First Architecture** con **Domain-Driven Design** para escalar a 50+ módulos ERP.

## 📂 Estructura Actual

```
src/features/
├── admin/              # Gestión del tenant (Usuarios, Roles, Áreas, Menús)
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── types/
│   └── routes.tsx
│
├── super-admin/        # Gestión de plataforma (Clientes, Módulos)
│   ├── clientes/
│   ├── dashboard/
│   └── modulos/
│
├── auth/               # Autenticación
│   ├── pages/
│   ├── services/
│   └── types/
│
├── tenant/             # Multi-tenancy (Branding, TenantContext)
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   └── types/
│
├── home/               # Página de inicio
│   └── pages/
│
├── hcm/                # Human Capital Management
│   ├── asistencia/
│   │   └── autorizacion/
│   │       ├── pages/
│   │       ├── services/
│   │       ├── types/
│   │       └── routes.tsx
│   ├── planillas/      # Futuro
│   └── reportes/
│
├── scm/                # Supply Chain Management
│   └── logistica/      # Futuro
│
└── finance/            # Finanzas
    └── (futuro)
```

## 🏗️ Convenciones

### 1. Agrupadores por Dominio
- **`hcm/`**: Human Capital Management (Planillas, Asistencia, RRHH)
- **`scm/`**: Supply Chain Management (Logística, Almacén, Compras)
- **`finance/`**: Finanzas (Contabilidad, Tesorería, Facturación)

### 2. Módulos dentro de Dominios
Cada módulo tiene estructura completa:
```
{dominio}/{modulo}/
├── pages/          # Páginas del módulo
├── components/     # Componentes específicos del módulo
├── services/       # Servicios API del módulo
├── hooks/          # Hooks específicos del módulo
├── stores/         # Stores Zustand del módulo (si aplica)
├── types/          # Tipos TypeScript del módulo
└── routes.tsx      # Rutas internas del módulo
```

### 3. Admin y Super-Admin
- **NO son módulos de negocio**
- Se mantienen en raíz de `features/`
- Gestionan la plataforma, no el negocio del cliente

### 4. Index Files
Cada agrupador tiene `index.ts` para exports centralizados:
```typescript
// src/features/hcm/index.ts
export * from './asistencia';
export * from './planillas';
export * from './reportes';
```

## 📝 Ejemplos de Uso

### Agregar Nuevo Módulo en HCM
```
src/features/hcm/nuevo-modulo/
├── pages/
│   └── Dashboard.tsx
├── services/
│   └── nuevo-modulo.service.ts
├── types/
│   └── nuevo-modulo.types.ts
└── routes.tsx
```

### Agregar Nuevo Dominio
```
src/features/nuevo-dominio/
├── modulo1/
├── modulo2/
└── index.ts
```

## ✅ Ventajas

1. **Escalable**: Fácil agregar 50+ módulos sin desorden
2. **Organizado**: Módulos relacionados están juntos
3. **Mantenible**: Fácil encontrar código relacionado
4. **Claro**: La estructura refleja el dominio de negocio

## 🚫 NO Hacer

- ❌ Crear módulos en raíz de `features/` (excepto admin, super-admin, auth, tenant, home)
- ❌ Mezclar módulos de diferentes dominios
- ❌ Crear carpetas planas sin agrupadores

## 📚 Referencias

- [FASE3_ESTRUCTURA_DOMINIO.md](./FASE3_ESTRUCTURA_DOMINIO.md)
- [PLAN_REFACTORIZACION_ERP.md](./PLAN_REFACTORIZACION_ERP.md)

