# 🚀 FASE 3: Dynamic API (Híbrido + On-Premise) - Análisis y Propuesta

## 📋 Análisis del Estado Actual

### 1. **Configuración Actual de API**

#### Instancia de Axios:
- **Ubicación:** `src/core/api/api.ts`
- **Configuración:** Instancia única y estática
- **baseURL:** `import.meta.env.VITE_API_BASE_URL || '/api/v1'`
- **Uso:** Todos los servicios importan esta instancia única

#### Problemas Identificados:
1. ❌ **baseURL estático** - No cambia según el tenant
2. ❌ **No soporta on-premise** - No usa `servidor_api_local` cuando está disponible
3. ❌ **No soporta híbrido** - No cambia dinámicamente según `tipo_instalacion`
4. ❌ **Una sola instancia** - Todos los servicios comparten la misma configuración

### 2. **Tipos de Instalación**

Según `src/types/cliente.types.ts`:
- **`shared`** - Servidor centralizado (cloud) → usar servidor central
- **`dedicated`** - Servidor dedicado (cloud) → usar servidor central
- **`onpremise`** - Servidor local del cliente → usar `servidor_api_local`
- **`hybrid`** - Local pero sincroniza con central → usar `servidor_api_local`

### 3. **Información Disponible**

En `AuthContext.clienteInfo`:
- `tipo_instalacion: string` - Tipo de instalación del cliente
- `servidor_api_local: string | null` - URL del API local (solo para onpremise/hybrid)

**Problema:** Esta información solo está disponible DESPUÉS del login.

### 4. **Interceptores Actuales**

En `AuthContext`:
- **Request Interceptor:** Agrega `Authorization` header con token
- **Response Interceptor:** Maneja refresh token automático

**Consideración:** Los interceptores ya están configurados, podemos agregar lógica de baseURL aquí.

### 5. **Servicios que Usan la API**

Todos los servicios importan `api` desde `src/core/api/api.ts`:
- `branding.service.ts`
- `auth.service.ts`
- `usuario.service.ts`
- `rol.service.ts`
- `area.service.ts`
- `menu.service.ts`
- `modulo.service.ts`
- `conexion.service.ts`
- Y muchos más...

**Impacto:** Cualquier cambio debe ser transparente para todos estos servicios.

---

## 🎯 Objetivos de la FASE 3

1. ✅ **API dinámica por tenant** - Cambiar `baseURL` según `tipo_instalacion` y `servidor_api_local`
2. ✅ **Soporte on-premise** - Usar `servidor_api_local` cuando `tipo_instalacion === 'onpremise'`
3. ✅ **Soporte híbrido** - Usar `servidor_api_local` cuando `tipo_instalacion === 'hybrid'`
4. ✅ **Soporte cloud** - Usar servidor central cuando `tipo_instalacion === 'shared' | 'dedicated'`
5. ✅ **Transparente para servicios** - No cambiar imports ni uso de servicios
6. ✅ **Manejo de cambio de tenant** - Actualizar baseURL cuando cambia el tenant

---

## 🏗️ Propuesta de Arquitectura

### **Opción 1: Interceptor de Request (RECOMENDADA) ⭐**

**Ventajas:**
- ✅ No requiere cambios en servicios existentes
- ✅ Centralizado en un solo lugar
- ✅ Funciona con la instancia única de Axios
- ✅ Fácil de mantener

**Implementación:**
1. Crear función helper para determinar `baseURL` según tenant
2. Agregar interceptor de request que modifique `config.baseURL` dinámicamente
3. Usar `clienteInfo` desde `AuthContext` o `TenantContext`
4. Manejar casos especiales (login/refresh siempre usan servidor central)

**Estructura:**
```typescript
// src/core/api/api-config.ts
export const getApiBaseUrl = (clienteInfo: ClienteInfo | null): string => {
  if (!clienteInfo) {
    return defaultBaseUrl; // Servidor central
  }
  
  const { tipo_instalacion, servidor_api_local } = clienteInfo;
  
  // Para onpremise o hybrid, usar servidor local
  if ((tipo_instalacion === 'onpremise' || tipo_instalacion === 'hybrid') && servidor_api_local) {
    return servidor_api_local;
  }
  
  // Para shared o dedicated, usar servidor central
  return defaultBaseUrl;
};
```

**Interceptor:**
```typescript
// En AuthContext o nuevo ApiConfigProvider
api.interceptors.request.use((config) => {
  const baseURL = getApiBaseUrl(clienteInfo);
  config.baseURL = baseURL;
  return config;
});
```

### **Opción 2: Factory Pattern**

**Ventajas:**
- ✅ Múltiples instancias si es necesario
- ✅ Aislamiento completo por tenant

**Desventajas:**
- ❌ Requiere cambios en todos los servicios
- ❌ Más complejo de mantener
- ❌ Puede causar problemas con interceptores

**No recomendada** por el alto impacto en código existente.

### **Opción 3: Plugin/Adapter Pattern**

**Ventajas:**
- ✅ Encapsulación clara
- ✅ Fácil de testear

**Desventajas:**
- ❌ Requiere refactorización significativa
- ❌ Más complejo de implementar

**No recomendada** por la complejidad innecesaria.

---

## 📝 Plan de Implementación (Opción 1: Interceptor)

### **Paso 1: Crear API Config Helper**
- ✅ Crear `src/core/api/api-config.ts`
- ✅ Función `getApiBaseUrl(clienteInfo)`
- ✅ Función `shouldUseLocalApi(clienteInfo)`
- ✅ Validación de URLs

### **Paso 2: Crear API Config Context/Provider (Opcional)**
- ✅ Context para acceder a `clienteInfo` sin depender de `AuthContext`
- ✅ O usar `TenantContext` que ya tiene acceso a `clienteInfo`

### **Paso 3: Agregar Interceptor de Request**
- ✅ Modificar `AuthContext` para agregar interceptor
- ✅ O crear nuevo `ApiConfigProvider` que envuelva la app
- ✅ Interceptor modifica `config.baseURL` dinámicamente
- ✅ Excepciones: login/refresh siempre usan servidor central

### **Paso 4: Manejar Cambio de Tenant**
- ✅ Detectar cambio de `clienteInfo`
- ✅ Actualizar baseURL automáticamente
- ✅ Invalidar requests pendientes si es necesario

### **Paso 5: Testing y Validación**
- ✅ Probar con `shared` (servidor central)
- ✅ Probar con `onpremise` (servidor local)
- ✅ Probar con `hybrid` (servidor local)
- ✅ Probar cambio de tenant
- ✅ Verificar que login/refresh funcionan

---

## ⚠️ Consideraciones y Riesgos

### **Riesgos:**
1. ⚠️ **Endpoints de autenticación** - Login/refresh deben usar siempre servidor central
2. ⚠️ **Cambio de tenant** - Requests pendientes pueden fallar si cambia baseURL
3. ⚠️ **CORS** - Servidor local debe permitir CORS desde el frontend
4. ⚠️ **Validación de URL** - Asegurar que `servidor_api_local` es válido
5. ⚠️ **Fallback** - Si `servidor_api_local` no responde, ¿usar servidor central?

### **Consideraciones:**
1. ✅ **Login/Refresh** - Siempre usar servidor central (no dependen de tenant)
2. ✅ **Validación** - Validar formato de `servidor_api_local` (debe ser URL válida)
3. ✅ **Cache** - Cachear baseURL por tenant para evitar recálculos
4. ✅ **Logging** - Loggear cambios de baseURL para debugging
5. ✅ **Error handling** - Manejar errores de conexión a servidor local

---

## 🔄 Flujo Propuesto

### **Escenario 1: Cliente Shared/Dedicated (Cloud)**
1. Usuario se autentica
2. `clienteInfo.tipo_instalacion === 'shared'`
3. Interceptor usa servidor central (`/api/v1`)
4. Todas las requests van al servidor central

### **Escenario 2: Cliente On-Premise**
1. Usuario se autentica
2. `clienteInfo.tipo_instalacion === 'onpremise'`
3. `clienteInfo.servidor_api_local === 'https://api-cliente.local'`
4. Interceptor usa `servidor_api_local`
5. Todas las requests van al servidor local

### **Escenario 3: Cliente Hybrid**
1. Usuario se autentica
2. `clienteInfo.tipo_instalacion === 'hybrid'`
3. `clienteInfo.servidor_api_local === 'https://api-cliente.local'`
4. Interceptor usa `servidor_api_local`
5. Todas las requests van al servidor local (sincronización con central es backend)

### **Escenario 4: Login/Refresh (Siempre Central)**
1. Usuario hace login
2. Interceptor detecta endpoint `/auth/login` o `/auth/refresh`
3. Usa servidor central (sin importar tenant)
4. Después del login, interceptor usa baseURL según tenant

---

## ✅ Checklist de Implementación

- [ ] Crear `api-config.ts` con helper functions
- [ ] Agregar interceptor de request en `AuthContext` o nuevo provider
- [ ] Manejar excepciones para login/refresh
- [ ] Validar URLs de `servidor_api_local`
- [ ] Agregar logging para debugging
- [ ] Manejar cambio de tenant
- [ ] Probar con diferentes tipos de instalación
- [ ] Verificar que servicios existentes funcionan sin cambios
- [ ] Documentar comportamiento

---

## 📦 Archivos a Crear/Modificar

### **Nuevos:**
- `src/core/api/api-config.ts` - Helper functions para determinar baseURL

### **Modificar:**
- `src/shared/context/AuthContext.tsx` - Agregar interceptor de request
- O crear `src/core/api/ApiConfigProvider.tsx` - Provider dedicado (opcional)

---

## 🎯 Resultado Esperado

Después de esta fase:
- ✅ El `baseURL` cambia dinámicamente según el tenant
- ✅ Clientes on-premise usan su servidor local
- ✅ Clientes híbridos usan su servidor local
- ✅ Clientes cloud usan servidor central
- ✅ Login/refresh siempre usan servidor central
- ✅ Servicios existentes funcionan sin cambios
- ✅ Cambio de tenant actualiza baseURL automáticamente

---

**¿Proceder con la implementación?**


