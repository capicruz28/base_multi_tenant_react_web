# CAXIS ERP — PROMPT MAESTRO FRONTEND v1

## CONTEXTO

Sistema SaaS ERP multi-tenant.
Stack: React + TypeScript + Vite + Tailwind + React Query + Axios + Zustand.
El sistema ya tiene autenticación JWT, RBAC y arquitectura modular.

Módulo objetivo: [MODULO]
Código: [CODIGO]

---

## REGLAS ABSOLUTAS

❌ NO cambiar contratos de API
❌ NO eliminar componentes existentes
❌ NO usar any en TypeScript
❌ NO inventar endpoints que no estén en openapi.json
❌ NO hacer fetch directo fuera del service layer
✅ Tipar todo con TypeScript estricto
✅ Usar React Query para server state
✅ Usar Zustand solo para estado global
✅ Manejar siempre: loading / error / empty state
✅ Respetar permisos RBAC antes de renderizar acciones
✅ Respetar contexto multi-tenant (cliente_id, empresa_id)

---

## FASE 1 — LECTURA Y COMPRENSIÓN (NO escribir código aún)

### Paso 1.1 — Leer el contrato de API del módulo

Analiza el archivo adjunto [CODIGO]_API.json.
Contiene ÚNICAMENTE los endpoints de este módulo.

Para cada endpoint encontrado indica:
- ruta completa
- método HTTP
- request body (campos y tipos)
- response body (campos y tipos)
- si requiere empresa_id como query param o en body
- si tiene paginación (page, limit, total)
- si tiene filtros (search, estado, es_activo, etc.)

Lee el archivo completo, todos los endpoints son de este módulo.

### Paso 1.2 — Identificar patrón arquitectónico del frontend

Busca en el proyecto la estructura de carpetas y archivos
de cualquier módulo existente para identificar SOLO:
- estructura de carpetas usada (pages, components, hooks, services, types)
- nombres de archivos convencionales
- cómo está configurado el cliente Axios (baseURL, interceptores, headers)
- cómo se instancia useQuery y useMutation
- cómo se accede al store de Zustand (auth, tenant)
- cómo se verifica un permiso RBAC antes de renderizar

⚠ NO uses la lógica de negocio existente como referencia.
⚠ NO uses los formularios ni componentes existentes como modelo funcional.
⚠ Solo extrae estructura técnica y configuración base.
El contenido funcional lo define el contrato API adjunto, no el código actual.

### Paso 1.3 — Checkpoint obligatorio

Responde antes de continuar:
1. ¿Cuántos endpoints encontraste para el módulo [CODIGO]?
2. ¿Qué tipo de módulo es? (maestro / transaccional / analítico)
3. ¿Qué módulo usarás como referencia de estructura?
4. ¿El módulo tiene flujo de estados? (borrador/aprobado/anulado)
5. ¿Qué vistas principales requiere? (lista, detalle, formulario, etc.)

⛔ DETENTE AQUÍ. Espera confirmación antes de continuar.

---

## FASE 2 — AUDITORÍA FUNCIONAL Y TÉCNICA

### Paso 2.1 — Inventario de implementación actual

Busca en el proyecto todos los archivos del módulo [CODIGO]:
- componentes (pages, components)
- services (Axios)
- hooks (React Query)
- stores (Zustand)
- types/interfaces

### Paso 2.2 — Evaluación por endpoint

Para cada endpoint del contrato API verifica si existe:

| Endpoint | Método | Service | Hook | Componente | Estado |
|----------|--------|---------|------|------------|--------|

Estados: ✔ Completo / ⚠ Parcial / ✖ Faltante

### Paso 2.3 — Detección de brechas

Detectar:
- endpoints sin service implementado
- endpoints sin hook de React Query
- campos del response no mostrados en UI
- campos del request no incluidos en formularios
- ausencia de loading/error/empty state
- acciones sin validación de permiso RBAC
- empresa_id no incluido donde el API lo requiere
- tipado incompleto o uso de any

### Paso 2.4 — Detección de código desalineado

Identificar componentes que:
- llamen a endpoints que ya no existen en el contrato
- usen campos que no existen en el response actual
- tengan URLs hardcodeadas incorrectas
- no estén tipados contra el contrato actual

Marcar como: ⚠ Desalineado (NO eliminar)

### Paso 2.5 — Reporte de auditoría

Genera el archivo:
docs/frontend/auditoria/AUDITORIA_FRONTEND_[CODIGO].md

Con esta estructura:
- Endpoints del contrato API
- Implementación actual detectada
- Brechas por endpoint
- Campos faltantes en formularios y vistas
- Componentes desalineados
- Problemas de tipado
- Problemas de RBAC o tenant

⛔ DETENTE AQUÍ. Espera confirmación antes de continuar.

---

## FASE 3 — IMPLEMENTACIÓN CONTROLADA

Implementa SOLO lo detectado en la auditoría.
Orden obligatorio:

### Bloque 1 — Types e interfaces
- Definir o corregir interfaces TypeScript
- Basarse ÚNICAMENTE en el contrato openapi.json
- Un archivo types.ts por módulo
- No usar any en ningún caso

### Bloque 2 — Services (Axios)
- Un archivo [codigo].service.ts por módulo
- Usar el cliente Axios configurado del proyecto
- Incluir empresa_id donde el API lo requiere
- Tipar request y response con las interfaces del bloque 1

### Bloque 3 — Hooks (React Query)
- Un archivo use[Entidad].ts por entidad principal
- useQuery para GET (lista y detalle)
- useMutation para POST, PUT, DELETE
- Invalidar queries relacionadas tras mutaciones
- Manejar onSuccess y onError

### Bloque 4 — Componentes
Para módulos MAESTROS implementar:
- [Entidad]List: tabla con paginación, filtros, búsqueda
- [Entidad]Form: formulario crear/editar con validación
- [Entidad]Detail: vista de detalle si aplica
- Botones de acción protegidos por permiso RBAC

Para módulos TRANSACCIONALES implementar además:
- Flujo de estados visible (badge/chip por estado)
- Acciones según estado (aprobar, procesar, anular)
- Sección cabecera + tabla de detalle embebida
- Confirmación antes de acciones irreversibles

Para módulos ANALÍTICOS implementar:
- Solo vistas de lectura
- Filtros avanzados
- Sin formularios de creación o edición

### Reglas durante implementación:
- Detente al completar cada bloque
- Confirma antes de continuar con el siguiente
- Si encuentras ambigüedad usa el patrón del módulo de referencia
- Si un campo existe en el contrato pero no está claro en UI,
  inclúyelo como campo visible en detalle y opcional en formulario

---

## FASE 4 — VERIFICACIÓN FINAL

Al terminar toda la implementación:

1. Lista todos los archivos creados o modificados
2. Confirma que cada endpoint del contrato tiene:
   - interface TypeScript correspondiente
   - función en el service
   - hook de React Query
   - componente que lo consume
3. Confirma que ningún componente existente fue eliminado
4. Confirma que no se usa any en ningún archivo del módulo
5. Genera el archivo:
   docs/frontend/modulos/[CODIGO]_FRONTEND_IMPLEMENTACION.md

---

## INICIO

Comienza por la Fase 1.
Lee únicamente los endpoints del módulo [CODIGO] en openapi.json.
No leas el archivo completo. Filtra por path prefix.
No escribas código aún.
Detente al finalizar Fase 1 y espera confirmación.