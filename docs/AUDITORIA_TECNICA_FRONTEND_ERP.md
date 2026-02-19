# Auditoría técnica frontend – SaaS ERP multi-tenant

**Fecha:** Febrero 2025  
**Alcance:** Arquitectura, escalabilidad, estado, auth, permisos, tenant, errores, seguridad, performance, calidad de componentes, i18n/temas/branding, formularios, UX, producción.

---

## Contexto backend (inferido del código y spec)

| Aspecto | Situación actual |
|--------|-------------------|
| **Autenticación** | Access Token (JWT) en memoria; Refresh Token en cookie HttpOnly. Login por `username` + `password`. |
| **Identificación del tenant** | Backend espera `cliente_id` o `subdominio` en el cuerpo del login (según spec). En el frontend el login **no envía subdominio ni cliente_id**; si el backend no deriva tenant del Host/cookie, hay riesgo de login incorrecto en multi-tenant por subdominio. |
| **Estructura JWT / usuario** | No se decodifica JWT en frontend. Se usa `/auth/me/` para perfil. `UserData`: `usuario_id`, `cliente_id`, `roles`, `access_level`, `is_super_admin`, `cliente` (ClienteInfo con `subdominio`, `tipo_instalacion`, `servidor_api_local`). |
| **Ejemplo respuesta API** | Login: `{ access_token, token_type, user_data }`. Refresh: `{ access_token }`. |
| **Roles/permisos** | RBAC por roles + LBAC: permisos por módulo (`ver`, `crear`, `editar`, `eliminar`, `exportar`, `imprimir`) desde `/roles/{rol_id}/permisos/` y mapeo menú→módulo. |

---

## 1. Arquitectura del proyecto

**Estructura observada:**  
`src/` con `app/`, `core/`, `shared/`, `features/`, `pages/`, `hooks/`, `utils/`, `types/`, `services/`, `reference_backend/`.

- **Fortalezas**
  - Separación clara: `core` (api, auth, stores, constants), `shared` (layout, context, componentes transversales), `features` por dominio (auth, admin, super-admin, tenant, hcm, scm, finance, modulos).
  - Aliases (`@/core`, `@/shared`, `@/features`) bien configurados en Vite.
  - Features con subcarpetas por caso de uso: `pages/`, `components/`, `services/`, `types/`, `routes.tsx`.

- **Debilidades**
  - `pages/` en raíz (ej. `UnauthorizedPage`) mezclado con `features/*/pages/`; criterio no uniforme.
  - Duplicación de utilidades: `src/core/utils/formValidation.ts` y `src/hooks/useFormValidation.ts`.
  - Tipos de branding duplicados: `src/types/branding.types.ts` y `src/features/tenant/types/branding.types.ts`.
  - `reference_backend/` y `docs/` dentro de `src/`; mejor en raíz o en repo aparte.
  - No hay capa de “dominio” explícita (entidades, reglas) entre servicios y UI; cada feature define sus tipos en `types/`.

**Veredicto:** Arquitectura por features adecuada para crecer, con deuda en consistencia de carpetas y duplicados.

---

## 2. Escalabilidad para módulos ERP

- **Lazy loading:** Rutas de admin y super-admin con `lazy()` y `Suspense`; HCM (autorizacion, reportes) también. Patrón claro para añadir módulos (planillas, logística, etc.).
- **Code splitting (Vite):** `manualChunks` por `feature-*` y `vendor-*` (react, react-query, axios, lucide). Bien alineado con features.
- **Permisos por módulo:** `PermissionGuard` con `module` + `action` y hook `usePermissions().can(module, action)` permiten escalar a muchos módulos ERP sin tocar rutas protegidas por rol.
- **Menú dinámico:** Menú desde backend (módulos → secciones → menús) y filtrado por permisos; añadir un módulo ERP es principalmente backend + ruta + guard.

**Riesgo:** Varios servicios de features usan `import api from '@/core/api/api'` (instancia central) en lugar de `useApi()` o `getApiInstance(clienteInfo)`. Para tenants on-premise/hybrid, esas llamadas irían siempre al servidor central. Si la API de negocio debe ir al servidor local del cliente, hay que refactorizar esos servicios para recibir la instancia (o `clienteInfo`) y usar la API correcta.

**Conclusión:** Escalabilidad de módulos ERP está bien encaminada; la inconsistencia en uso de API por tipo de instalación puede limitar despliegues híbridos/on-premise.

---

## 3. Gestión de estado global

- **Zustand:** Un store principal visto: `branding.store` (por tenant, con `tenants` Map y `subdomainCache`). Registry de stores (`store-registry`) para reset por tenant y `tenant-store-sync` (BroadcastChannel) para sincronizar tenant entre pestañas.
- **React Context:** Auth (AuthContext), Theme (ThemeContext), Tenant (TenantContext), Breadcrumb. Auth concentra mucho: token, user, accessLevel, isSuperAdmin, userType, clienteInfo, permissions.
- **TanStack Query:** Uso en features para datos servidor; `QueryClient` con `staleTime`/`gcTime` y limpieza/invalidación al cambiar tenant en TenantContext.

**Fortalezas:** Estado de auth y tenant bien acotado; branding particionado por tenant; resets y sincronización entre pestañas bien pensados.

**Debilidades:**  
- No hay convención clara de “qué va en Zustand vs Context vs React Query”.  
- AuthContext muy grande (711 líneas) y con lógica de interceptores y refresh; difícil de testear y mantener.  
- Solo el store de branding está registrado en el registry; otros estados por tenant (si se añaden) deben registrarse para no filtrar datos entre tenants.

**Recomendación:** Extraer lógica de refresh/cola e interceptores a un módulo fuera del Provider (por ejemplo `authClient` o `auth-interceptor`) y dejar el Context solo como estado y funciones de alto nivel; registrar en el store registry cualquier store por tenant que se añada.

---

## 4. Autenticación (JWT, refresh, expiración)

- **Flujo:** Login → `access_token` en memoria (estado React), Refresh Token en cookie HttpOnly; peticiones con `Authorization: Bearer <access_token>`; interceptor de respuesta ante 401 hace refresh y reencola peticiones (patrón “single refresh + queue”).
- **Concurrencia:** Variable global `isRefreshingPromise` y `failedQueueRef` para evitar múltiples refreshes simultáneos; correcto.
- **Bootstrap:** Al cargar la app se llama a `refreshToken()` y luego `/auth/me/`; si falla, logout y limpieza de cookie.
- **Logout:** Limpia estado, borra cookie `refresh_token`, procesa cola con error.
- **Timeouts:** Axios con `timeout: 30000` en instancias; no hay retry específico para timeouts ni diferenciación 401 (expiración) vs 403 (forbidden).

**Fortalezas:** Refresh con cola bien implementado; token solo en memoria; cookie HttpOnly para refresh.

**Debilidades:**  
- No se comprueba expiración del access token en cliente (proactive refresh); solo se reacciona al 401.  
- Logs con datos sensibles (tokens, rutas) en varios sitios; en producción deberían eliminarse o redactarse.  
- Bootstrap siempre llama a `refreshToken()`; si no hay cookie, falla y hace logout. Correcto, pero el mensaje/UX de “sesión expirada” podría unificarse.

**Recomendación:** Opcional: decodificar JWT (solo `exp`) en cliente para hacer refresh unos segundos antes de que caduque y reducir 401 en cascada. Mantener token solo en memoria y no loguear tokens.

---

## 5. Permisos y roles

- **RBAC:** `hasRole(...)`, `ProtectedRoute` con `requiredRole`, `requiredLevel`, `requireSuperAdmin`. Niveles numéricos y tipo de usuario (`super_admin`, `tenant_admin`, `user`) alineados con backend.
- **LBAC:** `UserPermissions` por módulo (ver/crear/editar/eliminar/exportar/imprimir); cargado en AuthContext desde `getUserPermissions(roleIds)` que llama a `/roles/{id}/permisos/` y mapeo menú→módulo. Hook `usePermissions()` con `can`, `canAny`, `canAll`, `getModulePermissions`.
- **PermissionGuard:** Envuelve rutas y usa `usePermissions().can(module, action)`; super_admin bypass.

**Fortalezas:** Modelo híbrido RBAC + LBAC claro; guard reutilizable; permisos cargados una vez tras login.

**Debilidades:**  
- Servicio de permisos usa `api` (central). Para tenants con API local, `/roles/{id}/permisos/` debería ir a la API del tenant si el backend lo exige.  
- Si el backend no tiene `/roles/{id}/permisos/` o falla, se devuelve `{}` y el usuario queda sin permisos granulares (solo RBAC); comportamiento aceptable pero conviene documentarlo y unificar mensajes.  
- Nombres de módulo en guard (ej. `autorizacion`, `reportes`) deben coincidir con el mapeo menú→módulo del backend; sin contrato explícito hay riesgo de desalineación.

**Recomendación:** Documentar contrato de nombres de módulo y acciones; considerar endpoint único tipo `/auth/me/permisos/` que devuelva permisos ya resueltos para el usuario actual.

---

## 6. Aislamiento por tenant en frontend

- **TenantContext:** Deriva `tenantId` de `clienteInfo?.cliente_id` (post-login). Subdominio se resuelve con `tenantResolver` (hostname o query `subdomain`) para branding pre-login.
- **Stores:** Branding particionado por `tenantId` (Map); al cambiar tenant se llama `storeRegistry.resetAll(tenantId)` y se invalida/limpia caché de React Query por tenant; `tenantStoreSync` notifica a otras pestañas.
- **API:** `useApi()` y `getApiInstance(clienteInfo)` eligen entre `apiCentral` y instancia local según `tipo_instalacion` y `servidor_api_local`. Interceptores de auth están en la instancia central (login/refresh/me usan central).

**Fortalezas:** Aislamiento de datos al cambiar tenant (resets, invalidación, BroadcastChannel); branding por tenant y por subdominio; API híbrida central/local bien planteada.

**Debilidades:**  
- Varios servicios no usan `getApiInstance(clienteInfo)` sino `api` directo; para esos endpoints no hay aislamiento por “instalación” (si el backend espera que ciertas APIs vayan al servidor del cliente).  
- En desarrollo local sin subdominio, `tenantId` solo existe tras login; branding por subdominio en login depende de `?subdomain=xxx` o hostname.

**Recomendación:** Inventariar endpoints por feature y decidir si deben ir a central o a instancia del cliente; inyectar instancia (o `clienteInfo`) en servicios que deban usar API local (por ejemplo desde un wrapper que use `useAuth` y pase la instancia).

---

## 7. Manejo de errores (HTTP, timeouts, interceptores)

- **Interceptores:** Request: añade `Authorization` y no modifica baseURL. Response: en 401 intenta refresh, reencola peticiones y reintenta; si el refresh falla, logout. No hay manejo global para 403, 404, 5xx ni timeouts.
- **Servicio de errores:** `getErrorMessage(error)` (error.service) normaliza mensajes por status (400, 401, 403, 404, 409, 422, 500, 503) y errores de red; usado en Login y posiblemente en otros sitios.
- **Timeouts:** 30s en Axios; no hay retry configurado a nivel global ni mensaje específico “timeout” en UI.

**Fortalezas:** 401 + refresh bien manejado; mensajes de error centralizados y amigables.

**Debilidades:**  
- No hay interceptor global que muestre toasts o pantalla de error para 5xx/timeout.  
- Errores se propagan; cada pantalla debe usar `getErrorMessage` y toast si quiere feedback; no hay capa única de “error HTTP global”.  
- React Query tiene `retry: 1` pero sin distinción por tipo de error (p. ej. no reintentar en 4xx).

**Recomendación:** Añadir un interceptor de response que, para 5xx o timeout, dispare un toast o evento global y opcionalmente redirija a una página de “error de servicio”. Mantener 401 en el flujo actual. Definir política de retry (por ejemplo no retry en 4xx, retry limitado en 5xx/timeout).

---

## 8. Seguridad

- **XSS:** DOMPurify en `core/utils/sanitize.tsx` con whitelist de tags/atributos; componente `SanitizedHTML` y hook `useSanitizeHTML`. Uso de `dangerouslySetInnerHTML` solo con HTML sanitizado en ese módulo.
- **Tokens:** Access token solo en memoria (estado React); refresh en cookie HttpOnly (backend). No se guardan en localStorage/sessionStorage.
- **Protección de rutas:** `ProtectedRoute` (auth + nivel/rol) y `PermissionGuard` (permiso por módulo); rutas sensibles envueltas correctamente.
- **Exposición de información:** `console.log` con rutas y mensajes de flujo en muchos archivos; en producción deberían quitarse o condicionarse a `import.meta.env.DEV`. No se observan leaks de tokens en logs; sí mensajes que podrían revelar estructura de rutas o flujos.

**Riesgos:**  
- **secureStorage:** Usa `VITE_ENCRYPTION_SECRET` con fallback `'default-secret-change-in-production'`; si en producción no se define la variable, el secreto es predecible (riesgo alto si se usa para datos sensibles).  
- **Login sin subdominio/cliente_id:** Si el backend requiere `subdominio` o `cliente_id` en el body para multi-tenant, el frontend no los envía; posible confusión de tenant o rechazo en backends estrictos.

**Recomendación:**  
- No usar `secureStorage` con secreto por defecto en producción; exigir `VITE_ENCRYPTION_SECRET` en build de producción o no usar persistencia cifrada en cliente.  
- Alinear login con el backend: si el tenant se identifica por subdominio, enviar `subdominio` en el body (desde `tenantResolver.getSubdomain()`) o asegurar que el backend lo tome del Host.

---

## 9. Performance

- **Lazy loading:** Rutas por feature con `lazy()` y `Suspense` y fallbacks con mensaje.
- **Code splitting:** manualChunks por feature y vendors; chunkSizeWarningLimit 1000.
- **Optimización de renders:** Uso de `React.memo` en al menos un subcomponente del sidebar; no hay auditoría exhaustiva de re-renders en listas grandes.
- **Tablas grandes:** Uso de `@tanstack/react-virtual` y `react-window` en el proyecto; no revisado en detalle por pantalla.

**Recomendación:** Para tablas ERP muy grandes, estandarizar virtualización (react-virtual o react-window) y paginación servidor; revisar que listas largas no dependan de estado que cambie muy seguido para evitar re-renders masivos.

---

## 10. Calidad de componentes

- **Reutilización:** Componentes compartidos en `shared/` (layout, ProtectedRoute, LoadingSpinner, etc.); formularios y tablas suelen ser por feature. No hay design system documentado ni carpeta de “ui primitives” explícita.
- **Acoplamiento:** NewSidebar muy acoplado a menú, permisos, branding y varios servicios (menuService, clienteModuloService, seccionService, moduloV2Service); archivo muy largo (~1126 líneas) y difícil de mantener.
- **Lógica vs presentación:** Mezcla: muchos containers que cargan datos y renderizan en el mismo archivo; no hay patrón claro “container/ presentational” ni hooks de datos por pantalla de forma sistemática.

**Recomendación:** Dividir NewSidebar en subcomponentes y hooks (por ejemplo `useSidebarMenu`, `SidebarMenuTree`, `SidebarHeader`); extraer lógica de datos a hooks (ej. `useUserMenu`) para mejorar testabilidad y reutilización.

---

## 11. Preparación para i18n, temas y branding

- **i18n:** No hay librería i18n (react-i18next, etc.). Textos en español hardcodeados. No hay keys ni estructura para traducción.
- **Temas:** ThemeContext con light/dark/auto, persistencia en localStorage y detección de preferencia del sistema; integración con clases `dark` en Tailwind. Adecuado para tema global.
- **Branding por tenant:** Branding (logo, colores, etc.) por tenant y por subdominio; CSS variables/tokens (ej. `caxis-tokens.css`); aplicación en layout y login. Bien resuelto para multi-tenant.

**Recomendación:** Si se requiere i18n, introducir react-i18next (o similar) y extraer cadenas a namespaces por feature; usar keys en lugar de texto fijo para no bloquear futuras traducciones.

---

## 12. Formularios complejos y validaciones

- **Validación:** Hook `useFormValidation` (en `core/utils` y duplicado en `hooks/`) con reglas por campo, `validateOnChange`/`validateOnBlur`, `validateAll`. No hay Zod/Yup ni react-hook-form de forma generalizada.
- **Formularios:** Login y otros formularios con estado local y validación manual o con el hook anterior; no hay estándar único para formularios complejos (multipaso, arrays de campos, etc.).

**Recomendación:** Unificar en un solo `useFormValidation` (p. ej. en `core`) y eliminar el duplicado. Para formularios ERP complejos, valorar react-hook-form + Zod (o Yup) y un conjunto de componentes de formulario reutilizables (Input, Select, etc.) que muestren errores de esquema.

---

## 13. Consistencia UX para aplicación empresarial

- **Feedback:** Uso de react-hot-toast para notificaciones; LoadingSpinner y estados de carga en rutas. No hay patrón único para “guardando…” / “error de red” en mutaciones.
- **Navegación:** Breadcrumbs (BreadcrumbContext), sidebar con menú dinámico, redirección post-login por rol. Falta revisión de accesibilidad (ARIA, foco, teclado) y de mensajes de error consistentes en todas las pantallas.

**Recomendación:** Definir guía de feedback (toast vs inline, duración, mensajes estándar) y revisar a11y en flujos críticos (login, formularios, tablas).

---

## 14. Producción (build, env, secretos)

- **Build:** `tsc -b && vite build`; TypeScript estricto; manualChunks y optimizaciones en Vite.
- **Variables de entorno:** Uso de `import.meta.env.VITE_API_BASE_URL` (api-config y otro `api.ts`), `VITE_ENCRYPTION_SECRET` (secureStorage). No hay `.env.example` visible en el árbol (puede estar en .gitignore); conviene documentar variables requeridas.
- **Secretos:** Access token no persistido en cliente; refresh en HttpOnly. El único “secreto” en frontend es `VITE_ENCRYPTION_SECRET`, que queda embebido en el bundle (no es seguro para secretos de servidor; solo para cifrado opcional en cliente).

**Recomendación:** Documentar en README o en `docs` todas las `VITE_*` necesarias (VITE_API_BASE_URL, VITE_ENCRYPTION_SECRET si se usa). En producción no usar valor por defecto de `VITE_ENCRYPTION_SECRET`. Considerar comprobar en build que en producción existan las variables críticas.

---

## Correcciones críticas: qué necesita el backend

| # | Corrección | ¿Necesita backend? | Qué necesito del backend |
|---|------------|--------------------|---------------------------|
| 1 | Login con identificador de tenant | **Sí** | Confirmar: ¿el login exige `subdominio` y/o `cliente_id` en el body? ¿O el tenant se deduce del header `Host` / cookie? Si debe ir en body: nombre exacto del campo y formato (ej. `subdominio: string`). |
| 2 | Quitar secreto por defecto (secureStorage) | **No** | — |
| 3 | Servicios usen API central vs instancia por tenant | **Sí** | Lista de endpoints que **siempre** van al servidor central (ej. `/auth/*`, `/roles/{id}/permisos/`, `/menus/`, `/modulos-menus/`) vs los que en instalación on-premise/hybrid deben ir al servidor del cliente. |
| 4 | Permisos granulares y API del tenant | **Sí** | ¿`GET /roles/{rol_id}/permisos/` existe en el servidor del tenant (on-premise) o solo en central? Si solo en central, ¿el JWT/cookie ya lleva contexto de tenant para que central responda por ese cliente? |
| 5 | Manejo global 5xx/timeout | **No** | — |

**Resumen:** Para aplicar las correcciones críticas **1, 3 y 4** hace falta aclarar con backend el contrato de login (tenant en body vs Host) y qué endpoints son “solo central” vs “por tenant”. Las correcciones **2 y 5** se pueden hacer ya en frontend. Ver también `docs/REQUISITOS_BACKEND_CORRECCIONES_CRITICAS.md` (checklist para enviar al backend).

---

## Lista de riesgos críticos

1. **Login sin identificador de tenant en el body:** Si el backend exige `cliente_id` o `subdominio` en el login para multi-tenant, el frontend no los envía; riesgo de autenticación en el tenant equivocado o rechazo.
2. **Secreto por defecto en secureStorage:** `VITE_ENCRYPTION_SECRET` con fallback `'default-secret-change-in-production'`; en producción sin variable, el cifrado es débil.
3. **Servicios que usan solo API central:** Varios servicios (menu, permisos, etc.) usan `api` en lugar de la instancia por tenant; en escenarios on-premise/hybrid puede haber datos incorrectos o rutas que no respetan el servidor del cliente.
4. **Permisos granulares sin API del tenant:** Si `/roles/{id}/permisos/` debe ir al backend del tenant y siempre se llama al central, permisos pueden ser incorrectos para instalaciones locales.
5. **Falta de manejo global de 5xx/timeout:** El usuario puede no recibir feedback claro en fallos de red o servidor; experiencia y operación degradadas.

---

## Mejoras prioritarias

1. **Alinear login con backend:** Enviar `subdominio` (o `cliente_id`) en el body del login cuando corresponda (p. ej. desde `tenantResolver`) y documentar el contrato con el backend.
2. **Eliminar secreto por defecto en producción:** No usar `secureStorage` con fallback; exigir `VITE_ENCRYPTION_SECRET` en prod o desactivar esa capa.
3. **Refactorizar AuthContext:** Mover interceptores y lógica de refresh a un módulo aparte; reducir tamaño del Provider y mejorar tests.
4. **Unificar uso de API por tenant:** Decidir por endpoint si usa central o instancia del cliente; refactorizar servicios para usar `getApiInstance(clienteInfo)` o equivalente donde aplique.
5. **Interceptor global de errores:** Para 5xx y timeout, mostrar toast o pantalla de error y opcionalmente retry según política.
6. **Eliminar duplicados:** Un solo `useFormValidation`, un solo conjunto de tipos de branding; mover `reference_backend` y docs fuera de `src` si es posible.
7. **Reducir logs en producción:** Condicionar todos los `console.log/warn/error` a `import.meta.env.DEV` o eliminar los que expongan flujos o rutas.
8. **Documentar variables de entorno:** README o docs con lista de `VITE_*` y valores de ejemplo (sin secretos reales).

---

## Problemas estructurales que dificultan escalar a ERP completo

1. **AuthContext sobrecargado:** Concentra estado, interceptores, refresh y bootstrap; añadir más flujos (MFA, sesiones, etc.) lo hará aún más frágil.
2. **API por tenant:** Corregido para permisos y menú (usan `getApiInstance(clienteInfo)`). Queda convención clara: nuevos servicios que dependan del tenant deben usar `useApi()` o recibir la instancia; no importar `api` directo para datos de negocio.
3. **Sin capa de dominio explícita:** Reglas de negocio y entidades repartidas entre servicios y componentes; formularios y validaciones complejas (ERP) pueden volverse difíciles de mantener sin DTOs y reglas centralizadas.
4. **NewSidebar como monolito:** Un solo componente enorme con menú, permisos y branding; añadir más módulos y opciones de menú aumentará la complejidad sin separación clara.
5. **Sin i18n:** Cadenas fijas en español; escalar a otros idiomas o mercados requerirá refactor grande.
6. **Formularios sin estándar:** Sin react-hook-form + esquemas (Zod), formularios ERP complejos (múltiples pasos, tablas anidadas, validaciones cruzadas) serán costosos de implementar y mantener.

---

## Nivel de madurez del frontend

**Veredicto: intermedio-alto (no enterprise-ready).**

- **Bien:** Arquitectura por features, lazy loading, code splitting, auth con refresh y cola, permisos RBAC+LBAC, aislamiento por tenant (resets, caché, branding), temas, uso de DOMPurify y protección de rutas, TanStack Query y Zustand con registry.
- **Falta para enterprise:** Refactor de AuthContext, convención clara de API por tenant, manejo global de errores, i18n, estándar de formularios complejos, reducción de acoplamiento en sidebar y componentes grandes, documentación de env y contrato de permisos/módulos.

---

## ¿Listo para soportar módulos ERP complejos?

**Parcialmente.**

- **Sí:** Permisos por módulo, rutas lazy, menú dinámico y guards permiten añadir módulos (planillas, inventario, contabilidad, RRHH, etc.) sin rediseño grande. La base multi-tenant y de auth es sólida.
- **No del todo:** Para módulos ERP complejos (formularios grandes, validaciones, tablas con muchas columnas, flujos multipaso) faltan: estándar de formularios (react-hook-form + Zod), virtualización y paginación servidor consistentes, y posiblemente una capa de dominio/entidades. La inconsistencia de uso de API (central vs tenant) y el AuthContext monolítico pueden generar bugs y retrasos en despliegues híbridos/on-premise.

### A qué se refiere “Parcialmente” (referencia: catálogo y menú ERP)

Los documentos **CATALOGO_MODULOS.md**, **MENU_NAVEGACION.md** y **TABLAS_BD_ERP_COMPLETO.sql** definen un ERP con **27 módulos** y **150+ opciones de menú**, con BD por módulo (org_*, inv_*, pur_*, sls_*, etc.). “Parcialmente” significa:

| Aspecto | Estado | Detalle |
|--------|--------|--------|
| **Escalar a 27 módulos** | Listo a nivel de patrón | El patrón actual (ruta lazy + PermissionGuard + menú desde backend) permite sumar los 27; hoy solo hay 2 módulos de negocio (autorizacion, reportes). |
| **Nombres de módulo** | Por alinear | El catálogo usa códigos (ORG, INV, PUR, SLS, HCM, FIN, …). El frontend usa nombres como `autorizacion`, `reportes`. Falta una **fuente única de verdad** que mapee código ERP → `module` del PermissionGuard y prefijo de ruta (ej. ORG → `org` → `/org/*`). |
| **Menú dinámico** | Listo | El sidebar ya consume menú jerárquico (módulos → secciones → ítems). El backend debe exponer la estructura de MENU_NAVEGACION (rutas, nombres, permisos); el frontend no requiere cambios estructurales. |
| **Stores por tenant** | Convención definida | CONVENCION_STORES indica usar `createTenantStore` y registro; al añadir stores por módulo (inv, pur, sls, etc.) hay que seguir esa convención. |
| **Formularios y tablas complejas** | Sin estándar unificado | Módulos como HCM (planillas), FIN (asientos), MFG (BOM), INV (kardex) tendrán formularios y tablas pesadas; sin react-hook-form + Zod y virtualización/paginación estándar, cada módulo se resuelve ad hoc. |
| **BD y dependencias** | Backend/BD | TABLAS_BD define dependencias (ORG base, INV usa ORG, etc.); el frontend no gestiona dependencias entre módulos, solo rutas y permisos. |

Resumen: **puedes implementar** los 27 módulos con la base actual; “parcialmente” indica que para hacerlo de forma ordenada y escalable conviene aplicar las **correcciones adicionales** del siguiente apartado (contrato de códigos de módulo, convención de rutas, y opcionalmente estándar de formularios/tablas).

---

## Correcciones recomendadas para soportar los 27 módulos ERP (catálogo + menú + BD)

A partir de **CATALOGO_MODULOS.md**, **MENU_NAVEGACION.md** y **TABLAS_BD_ERP_COMPLETO.sql**, estas son las preparaciones que evitan fricción al implementar todos los módulos.

### 1. Contrato de códigos de módulo (prioritario)

Los 27 módulos del catálogo usan códigos: **ORG, INV, WMS, QMS, PUR, LOG, MFG, MRP, MPS, MNT, SLS, CRM, PRC, INV_BILL, POS, HCM, FIN, TAX, BDG, CST, PM, SVC, TKT, BI, DMS, WFL, AUD**. El frontend usa `PermissionGuard` con un `module` (ej. `autorizacion`, `reportes`) y rutas como `/autorizacion/*`, `/reportes/*`.

**Recomendación:** Crear una única fuente de verdad en el frontend que defina código → ruta y `module` para guard/permisos.

- **Hecho:** Se creó **`src/core/constants/erp-modules.ts`** con los 27 módulos (codigo, routePrefix, permissionModule). Para cada uno:
  - `codigo`: igual al del catálogo (ORG, INV, …).
  - `routePrefix`: prefijo de ruta en minúsculas (ej. `org`, `inv`, `sls`). Para INV_BILL puede ser `inv-bill` o `facturacion`.
  - `permissionModule`: valor a usar en `PermissionGuard` y en `usePermissions().can()`. Debe coincidir con lo que el backend devuelve en permisos por menú (p. ej. si el backend usa `org`, usar `org`; si usa `organizacion`, ajustar en `erp-modules.ts`).
- Usar ese contrato al definir rutas y guards: importar desde `@/core/constants/erp-modules` y usar `routePrefix` y `permissionModule`.
- Alinear con backend: que el mapeo menú → “módulo” en permisos use el mismo `permissionModule`; si el backend usa otros nombres, editar `permissionModule` en `erp-modules.ts` para que coincidan.

Así se evita duplicar strings y desalinear con el catálogo/BD.

### 2. Convención de rutas por módulo

Hoy las rutas son planas bajo `/` (ej. `/autorizacion/*`, `/reportes/*`). Con 27 módulos, conviene una convención clara:

- **Opción A:** Una ruta por módulo: `/org/*`, `/inv/*`, `/pur/*`, `/sls/*`, … (y excepciones como `/inv-bill/*` si se desea separar facturación).
- **Opción B:** Agrupar por “área” si el menú lo hace (ej. HCM ya tiene `autorizacion`, `reportes`; añadir `planillas` bajo algo como `/hcm/planillas/*`). Si MENU_NAVEGACION agrupa por módulo, Opción A suele ser suficiente.

Documentar en **MENU_NAVEGACION.md** o en el código la regla: “cada módulo ERP = un prefijo de ruta” y que las rutas del menú en backend coincidan con esos prefijos.

### 3. Stores por tenant para nuevos módulos

**CONVENCION_STORES.md** ya indica: stores con datos por tenant deben usar `createTenantStore` y método `reset(tenantId)`. Al implementar módulos con estado cliente (filtros, selección actual, etc.):

- Crear el store en `src/features/<dominio>/<modulo>/store/` (ej. `inv/productos/store/producto.store.ts`).
- Usar `createTenantStore('nombre-modulo', ...)` para que se registre en el store registry y se limpie al cambiar de tenant.
- No crear stores con `create()` directo para datos que dependan del tenant sin registrarlos en el registry.

No hace falta cambiar el branding store existente; sí aplicar la convención a todos los **nuevos** módulos ERP que tengan estado por tenant.

### 4. Formularios y tablas complejas (recomendado, no bloqueante)

Varios módulos del menú (planillas, asientos, BOM, kardex, etc.) tendrán formularios y tablas grandes. La auditoría ya señaló que no hay estándar unificado.

- **Recomendación:** Para no repetir lógica en 27 módulos, definir un estándar opcional:
  - Formularios: un módulo compartido (ej. `shared/forms` o `core/forms`) con react-hook-form + Zod y componentes reutilizables (FormInput, FormSelect, etc.), y usarlo al menos en los módulos más complejos (HCM, FIN, MFG, INV).
  - Tablas: componente base de tabla con paginación servidor y/o virtualización (@tanstack/react-virtual), y uso consistente de `tenantId` (y filtros por empresa/sucursal si aplica) en las queries.

Puedes implementar los primeros módulos sin esto y adoptarlo cuando notes duplicación; priorizar si vas a desarrollar muchos módulos a la vez.

### 5. No requiere cambios en el frontend

- **Dependencias entre módulos (ORG → INV → SLS, etc.):** Las resuelve la BD y el backend; el frontend solo muestra menú y rutas. No es necesario un “sistema de dependencias” en el cliente.
- **Estructura de tablas (TABLAS_BD_ERP_COMPLETO.sql):** Es de backend/BD; el frontend consume APIs. Basta con que las rutas y permisos del menú coincidan con lo que el backend espera.
- **Paquetes comercial (Starter, Business, etc.):** Son reglas de negocio y licencias; el frontend solo muestra/oculta menú según permisos que ya vienen del backend.

### Resumen de acciones recomendadas

| Prioridad | Acción |
|-----------|--------|
| Alta | Usar el contrato en router + PermissionGuard (ya existe `src/core/constants/erp-modules.ts`); alinear `permissionModule` con el backend. |
| Alta | Alinear con backend el nombre de `module` usado en permisos (que coincida con el contrato). |
| Media | Documentar convención de rutas (un prefijo por módulo) y que el menú del backend use esas rutas. |
| Media | Aplicar CONVENCION_STORES (createTenantStore) a todos los nuevos stores por módulo. |
| Baja | Introducir estándar de formularios (react-hook-form + Zod) y de tablas (paginación/virtualización) cuando se implementen varios módulos complejos. |

Con la **corrección prioritaria (contrato de módulos)** y la alineación con el backend, el proyecto queda listo para implementar los 27 módulos sin bloqueos estructurales; el resto son mejoras de mantenibilidad y consistencia.

---

## ¿Puedo proceder con la implementación de módulos ERP? (post-correcciones)

**Sí.** Tras aplicar las correcciones críticas y corregir los errores de TypeScript, el frontend está en condiciones de que implementes nuevos módulos ERP (ventas, inventario, contabilidad, RRHH, etc.) siguiendo el patrón ya existente.

### Estado actual (post-correcciones)

| Área | Estado |
|------|--------|
| **Riesgos críticos** | Resueltos: login/tenant documentado, secureStorage sin secreto por defecto en prod, permisos/menú usan API del tenant, manejo global 5xx/timeout. |
| **Build** | `npm run build` pasa sin errores TypeScript. |
| **API por tenant** | Permisos y menú usan `getApiInstance(clienteInfo)`; nuevo código debe usar `useApi()` en componentes o `getApiInstance(clienteInfo)` en servicios. |
| **Rutas y permisos** | Patrón claro: ruta lazy + `PermissionGuard` por módulo + menú desde backend. |
| **Aislamiento por tenant** | Store registry, resets al cambiar tenant, invalidación de caché; nuevos stores por tenant deben registrarse. |

### Cómo añadir un nuevo módulo ERP

1. **Backend:** Definir el módulo (menú, permisos por rol si aplica) y exponer APIs.
2. **Frontend:**
   - Crear feature en `src/features/<nombre-modulo>/` (pages, components, services, types, routes).
   - Añadir ruta en `app/router.tsx` con `lazy()` + `Suspense` + `PermissionGuard` (ej. `module="planillas" action="ver"`).
   - Los ítems de menú los resuelve el backend; el sidebar ya usa menú dinámico.
   - En servicios que llamen a la API del tenant, usar `useApi()` en componentes o recibir la instancia/clienteInfo en servicios.
3. **Permisos:** Si el backend usa el mismo modelo (rol → permisos por menú), el guard y `usePermissions().can(module, action)` funcionan; alinear el nombre del módulo con el backend.

### Recomendaciones al implementar

- **Formularios complejos:** Valorar react-hook-form + Zod por módulo aunque no esté unificado aún.
- **Tablas grandes:** Usar `@tanstack/react-virtual` o paginación servidor desde el primer momento.
- **Nuevos stores por tenant:** Registrarlos en `storeRegistry` y usar `tenantId` en claves de React Query.

Puedes proceder con la implementación de módulos ERP; prioriza un módulo piloto (ej. uno con listado + formulario + permisos) para validar el flujo de punta a punta.

---

## Recomendaciones arquitectónicas concretas

1. **Auth:** Extraer “auth client” a un módulo (ej. `core/auth/auth-client.ts`) que exporte `refreshToken`, `login`, `logout` y registre interceptores en la instancia dada; AuthContext solo consuma ese módulo y mantenga estado + `setAuthFromLogin`, `logout`, `hasRole`, etc. Tests unitarios sobre auth-client con mocks de Axios.
2. **API por tenant:** En `core/api/`, definir `getRequestConfig(): { api: AxiosInstance, clienteInfo: ClienteInfo | null }` (o un hook `useApiContext()` que devuelva ambos). Documentar en cada servicio si usa “solo central” o “según tenant”. Para “según tenant”, los servicios deben recibir la instancia por parámetro o de un contexto de API inyectado (no importar `api` directamente).
3. **Login y tenant:** En `auth.service.ts`, antes de `api.post('/auth/login/', ...)`, leer `tenantResolver.getSubdomain()` (o el identificador que use el backend) y añadirlo al body si el backend lo requiere; documentar en OpenAPI/README.
4. **Errores globales:** Añadir en la instancia de Axios (o en un wrapper) un interceptor de response que, para `status >= 500` o `error.code === 'ECONNABORTED'`, llame a un `onServerError(error)` (toast o estado global) y opcionalmente redirija; no sustituir el manejo 401 (refresh).
5. **Stores por tenant:** Al añadir un nuevo store que guarde datos por tenant (p. ej. “planillas”, “inventario”), registrarlo en `storeRegistry` con una función de reset y usar una clave que incluya `tenantId` en las queries de React Query.
6. **Sidebar:** Dividir en: `SidebarLayout`, `SidebarHeader` (logo, tema, usuario), `SidebarMenu` (recibe ítems ya resueltos), y hook `useSidebarMenu()` que llame a menuService/moduloV2 y aplique permisos; el árbol de menú puede ser un componente recursivo que solo reciba `items` y callbacks.
7. **Formularios:** Crear en `shared/` o `core/` un módulo `forms` con: `useAppForm(schema: ZodSchema)` que use react-hook-form + zod, y componentes `FormInput`, `FormSelect`, etc. que muestren `errors` del formulario. Migrar Login y un formulario complejo como piloto.
8. **i18n (cuando se necesite):** Añadir react-i18next; crear `shared/i18n` con `resources` por idioma y por feature; sustituir cadenas por `t('key')` empezando por login y layout; documentar proceso para nuevas pantallas.
9. **Build y env:** En `vite.config.ts` o en un script previo al build, comprobar que en producción no se use `VITE_ENCRYPTION_SECRET === 'default-secret-change-in-production'` y que `VITE_API_BASE_URL` esté definido si la app no usa proxy. Documentar en README todas las variables y ejemplos (`.env.example` si no está versionado).
10. **Contrato de permisos:** En `core/auth/` o en docs, mantener un archivo o tabla que liste `moduleId` (ej. `autorizacion`, `reportes`, `planillas`) y las acciones; que PermissionGuard y backend compartan la misma convención (o que el backend exponga la lista de módulos/acciones).

---

*Documento generado a partir del análisis del código en el repositorio. Para aplicar cambios, priorizar riesgos críticos y mejoras prioritarias; luego abordar problemas estructurales de forma incremental.*
