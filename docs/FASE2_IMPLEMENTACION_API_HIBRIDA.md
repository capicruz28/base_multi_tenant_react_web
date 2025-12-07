# ✅ FASE 2: Refactorizar API Híbrida (Eliminar Race Conditions) - COMPLETADA

## 📋 Resumen

Se ha refactorizado el sistema de API híbrida para eliminar race conditions al modificar `baseURL` dinámicamente en el interceptor. En su lugar, se crean instancias separadas de Axios según el tipo de instalación.

## 🎯 Problema Resuelto

**Antes**: El interceptor modificaba `config.baseURL` dinámicamente basándose en `clienteInfo`, lo que causaba race conditions cuando `clienteInfo` no estaba hidratado (ej: refresh F5).

**Después**: Se crean instancias separadas de Axios (`apiCentral` y `createLocalApi()`), y se selecciona la instancia correcta en tiempo de ejecución usando hooks o helpers.

## 🎯 Archivos Creados

### 1. Factory de Instancias (`src/core/api/axios-instances.ts`)
- `apiCentral`: Instancia para servidor central (SaaS)
- `createLocalApi(localUrl)`: Factory para crear instancias de servidor local
- Cache de instancias locales para evitar duplicados

### 2. Hook `useApi` (`src/core/api/useApi.ts`)
- Hook que selecciona la instancia correcta según `clienteInfo`
- Usar en componentes que necesitan hacer requests

### 3. Helper `getApiInstance` (`src/core/api/getApiInstance.ts`)
- Función helper para servicios que no pueden usar hooks
- Requiere pasar `clienteInfo` explícitamente

## 🔧 Archivos Modificados

### `src/core/api/api.ts`
- Ahora exporta `apiCentral` como `api` por defecto
- Se usa principalmente para endpoints de autenticación (siempre central)

### `src/shared/context/AuthContext.tsx`
- **Eliminada** lógica de modificación de `baseURL` en interceptor
- Interceptor ahora solo agrega tokens a las requests
- Eliminadas dependencias de `clienteInfo` en interceptores

## 📝 Uso

### En Componentes (Recomendado)
```tsx
import { useApi } from '@/core/api/useApi';

function MyComponent() {
  const api = useApi(); // Selecciona instancia correcta automáticamente
  
  const fetchData = async () => {
    const response = await api.get('/clientes');
    return response.data;
  };
}
```

### En Servicios (Cuando no se puede usar hooks)
```tsx
import { getApiInstance } from '@/core/api/getApiInstance';
import type { ClienteInfo } from '@/features/auth/types/auth.types';

export const clienteService = {
  async getClientes(clienteInfo: ClienteInfo | null) {
    const api = getApiInstance(clienteInfo);
    return api.get('/clientes');
  }
};
```

### Endpoints de Autenticación
```tsx
// Los endpoints de auth siempre usan apiCentral (import api from '@/core/api/api')
import api from '@/core/api/api';

export const authService = {
  async login(credentials) {
    return api.post('/auth/login', credentials); // Siempre va al servidor central
  }
};
```

## ⚠️ Notas Importantes

1. **Compatibilidad**: Los servicios existentes que usan `import api from '@/core/api/api'` seguirán funcionando, pero siempre usarán el servidor central. Para clientes on-premise/hybrid, deben migrar a `useApi()` o `getApiInstance()`.

2. **Migración Gradual**: No es necesario migrar todos los servicios de inmediato. Los endpoints de autenticación siempre van al servidor central, así que no hay problema.

3. **Cache de Instancias**: Las instancias locales se cachean por URL para evitar crear múltiples instancias para el mismo servidor.

4. **Interceptores**: Los interceptores de tokens se registran en `apiCentral` y se aplican a todas las instancias. Si necesitas interceptores específicos para instancias locales, debes registrarlos manualmente.

## ✅ Estado

- ✅ Factory de instancias creado
- ✅ Hook useApi implementado
- ✅ Helper getApiInstance creado
- ✅ Lógica de baseURL eliminada del interceptor
- ✅ Build exitoso
- ⚠️ Pendiente: Migrar servicios existentes (opcional, gradual)

## 🚀 Próximos Pasos

1. **FASE 3**: Reestructurar carpetas por dominio
2. **FASE 4**: Modularizar rutas completamente
3. **Migración Opcional**: Actualizar servicios para usar `useApi()` cuando sea necesario

