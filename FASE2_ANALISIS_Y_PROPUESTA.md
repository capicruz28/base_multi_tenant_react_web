# 🚀 FASE 2: Branding Pre-Login (Tenant Resolution) - Análisis y Propuesta

## 📋 Análisis del Estado Actual

### 1. **Branding Actual**

#### Ubicación y Flujo:
- **Store:** `src/features/tenant/stores/branding.store.ts` - Store particionado por tenant
- **Hook:** `src/features/tenant/hooks/useBranding.ts` - Hook que usa `TenantContext`
- **Inicializador:** `src/components/BrandingInitializer.tsx` - Carga branding cuando `isAuthenticated === true`
- **Servicio:** `src/features/tenant/services/branding.service.ts` - Endpoint: `GET /clientes/tenant/branding`

#### Problemas Identificados:
1. ❌ **Branding se carga SOLO después del login** - Depende de `isAuthenticated` y `clienteInfo`
2. ❌ **Acoplado a autenticación** - No puede cargarse antes del login
3. ❌ **No hay resolución de tenant por subdominio** - Solo se resuelve desde `AuthContext.clienteInfo.cliente_id`
4. ❌ **Login page no tiene branding** - Aunque intenta usar `useBranding(false)`, no hay tenantId disponible

### 2. **TenantContext Actual**

#### Ubicación:
- `src/features/tenant/components/TenantContext.tsx`

#### Funcionamiento:
- Deriva `tenantId` desde `AuthContext.clienteInfo.cliente_id`
- Solo funciona cuando el usuario está autenticado
- No detecta subdominio desde la URL

#### Problemas:
1. ❌ **No resuelve tenant antes del login** - Requiere `isAuthenticated === true`
2. ❌ **No detecta subdominio** - No lee `window.location.hostname`
3. ❌ **No hay endpoint público para branding por subdominio**

### 3. **API y Backend**

#### Endpoint Actual:
- `GET /api/v1/clientes/tenant/branding`
- Usa el contexto del tenant del request (subdominio en headers o cookies)
- **Requiere autenticación** (probablemente)

#### Necesidad:
- Endpoint público: `GET /api/v1/clientes/branding?subdominio=xxx` o similar
- O usar el endpoint actual con header `X-Subdomain: xxx` sin autenticación

### 4. **Estructura de Subdominio**

Según el esquema de base de datos:
- Cada cliente tiene un `subdominio` único (ej: `acme`, `banco`)
- Acceso esperado: `acme.tuapp.com`, `banco.tuapp.com`
- Desarrollo local: `localhost:5173` (sin subdominio) → usar query param o header

---

## 🎯 Objetivos de la FASE 2

1. ✅ **Desacoplar branding de autenticación**
2. ✅ **Detectar tenant por subdominio ANTES del login**
3. ✅ **Cargar branding en la página de login**
4. ✅ **Mantener compatibilidad con flujo post-login**
5. ✅ **Soporte para desarrollo local (sin subdominio)**

---

## 🏗️ Propuesta de Arquitectura

### 1. **TenantResolver (Nuevo)**

**Ubicación:** `src/core/services/tenant-resolver.service.ts`

**Responsabilidades:**
- Extraer subdominio desde `window.location.hostname`
- Detectar si estamos en desarrollo local
- Validar formato de subdominio
- Proporcionar subdominio para uso en API

**Estructura:**
```typescript
interface TenantResolverResult {
  subdomain: string | null;
  isLocal: boolean;
  isValid: boolean;
}

export const tenantResolver = {
  getSubdomain(): string | null;
  isLocalDevelopment(): boolean;
  resolve(): TenantResolverResult;
}
```

### 2. **Modificar TenantContext**

**Cambios:**
- Agregar resolución de tenant por subdominio ANTES del login
- Mantener resolución por `clienteInfo.cliente_id` DESPUÉS del login
- Prioridad: `clienteInfo.cliente_id` > `subdomain` (si hay autenticación)

**Flujo:**
1. Al montar: Intentar resolver por subdominio
2. Si hay autenticación: Usar `clienteInfo.cliente_id` (prioridad)
3. Si no hay autenticación: Usar subdominio detectado
4. Cargar branding cuando hay tenantId (autenticado o no)

### 3. **Modificar Branding Service**

**Cambios:**
- Agregar método para obtener branding por subdominio (público)
- Mantener método actual que usa contexto de tenant (autenticado)

**Estructura:**
```typescript
export const brandingService = {
  // Método actual (requiere autenticación)
  async getBranding(): Promise<BrandingRead>;
  
  // Nuevo método (público, por subdominio)
  async getBrandingBySubdomain(subdomain: string): Promise<BrandingRead>;
}
```

### 4. **Modificar Branding Store**

**Cambios:**
- Agregar soporte para cargar branding por subdominio (sin tenantId)
- Mantener particionado por tenant para post-login
- Cachear branding por subdominio temporalmente

### 5. **Modificar BrandingInitializer**

**Cambios:**
- Cargar branding ANTES del login si hay subdominio
- Cargar branding DESPUÉS del login si hay autenticación
- No depender solo de `isAuthenticated`

---

## 📝 Plan de Implementación

### **Paso 1: Crear TenantResolver**
- ✅ Crear `src/core/services/tenant-resolver.service.ts`
- ✅ Implementar detección de subdominio
- ✅ Manejar desarrollo local (localhost)

### **Paso 2: Modificar Branding Service**
- ✅ Agregar método `getBrandingBySubdomain()`
- ✅ Usar header `X-Subdomain` o query param

### **Paso 3: Modificar TenantContext**
- ✅ Agregar resolución por subdominio
- ✅ Priorizar `clienteInfo.cliente_id` si hay autenticación
- ✅ Exponer `subdomain` en el contexto

### **Paso 4: Modificar Branding Store**
- ✅ Agregar método para cargar por subdominio
- ✅ Cachear branding por subdominio

### **Paso 5: Modificar BrandingInitializer**
- ✅ Cargar branding pre-login si hay subdominio
- ✅ Mantener carga post-login

### **Paso 6: Actualizar App.tsx**
- ✅ Asegurar que `TenantProvider` esté antes de `AuthProvider` o después (según necesidad)
- ✅ Verificar orden de providers

---

## ⚠️ Riesgos y Consideraciones

### **Riesgos:**
1. ⚠️ **Endpoint público de branding** - Necesita validación en backend
2. ⚠️ **Desarrollo local** - Sin subdominio, necesitamos fallback
3. ⚠️ **Cambio de subdominio** - Detectar cambios y recargar branding
4. ⚠️ **Compatibilidad** - No romper flujo actual post-login

### **Consideraciones:**
1. ✅ **Backend debe soportar** - Endpoint público o header `X-Subdomain`
2. ✅ **Seguridad** - El branding es público, pero validar que el subdominio existe
3. ✅ **Performance** - Cachear branding por subdominio
4. ✅ **Testing** - Probar con y sin subdominio, con y sin autenticación

---

## 🔄 Flujo Propuesto

### **Escenario 1: Usuario NO autenticado, con subdominio**
1. Usuario accede a `acme.tuapp.com/login`
2. `TenantResolver` detecta subdominio: `acme`
3. `TenantContext` establece `subdomain: 'acme'`
4. `BrandingInitializer` carga branding por subdominio
5. Login page muestra branding de `acme`

### **Escenario 2: Usuario autenticado**
1. Usuario ya autenticado
2. `TenantContext` usa `clienteInfo.cliente_id` (prioridad)
3. `BrandingInitializer` carga branding por tenantId
4. Todo funciona como antes

### **Escenario 3: Desarrollo local (sin subdominio)**
1. Usuario accede a `localhost:5173/login`
2. `TenantResolver` detecta que es local
3. Opción A: Usar query param `?subdomain=acme`
4. Opción B: Usar valores por defecto
5. Login page muestra branding por defecto o del subdominio especificado

---

## ✅ Checklist de Implementación

- [ ] Crear `TenantResolver` service
- [ ] Modificar `BrandingService` para soportar subdominio
- [ ] Modificar `TenantContext` para resolver por subdominio
- [ ] Modificar `BrandingStore` para cargar por subdominio
- [ ] Modificar `BrandingInitializer` para cargar pre-login
- [ ] Actualizar `App.tsx` si es necesario
- [ ] Probar con subdominio real
- [ ] Probar sin subdominio (local)
- [ ] Probar con autenticación
- [ ] Verificar que no se rompe flujo actual

---

## 📦 Archivos a Crear/Modificar

### **Nuevos:**
- `src/core/services/tenant-resolver.service.ts`

### **Modificar:**
- `src/features/tenant/components/TenantContext.tsx`
- `src/features/tenant/services/branding.service.ts`
- `src/features/tenant/stores/branding.store.ts`
- `src/components/BrandingInitializer.tsx`
- `src/App.tsx` (si es necesario)

---

## 🎯 Resultado Esperado

Después de esta fase:
- ✅ El branding se carga ANTES del login basándose en el subdominio
- ✅ La página de login muestra el branding correcto del tenant
- ✅ El flujo post-login sigue funcionando igual
- ✅ Desarrollo local funciona con fallback o query param
- ✅ No hay acoplamiento entre branding y autenticación

---

**¿Proceder con la implementación?**


