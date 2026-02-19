# Requisitos al backend para correcciones críticas (frontend)

Documento para alinear con el equipo de backend y poder aplicar las correcciones críticas del frontend sin asumir comportamiento.

---

## Estado: respuestas recibidas y correcciones aplicadas

El backend respondió con el contrato definitivo. El frontend aplicó las correcciones críticas en consecuencia:

| Riesgo | Respuesta backend | Acción frontend |
|--------|-------------------|-----------------|
| **1 – Login/tenant** | Tenant por **Host** (subdominio). Body solo `username` + `password`. No enviar `cliente_id` ni `subdominio`. | Sin cambio en body. Documentado en `auth.service.ts` que el tenant lo deduce el backend por Host. |
| **2 – Secreto secureStorage** | N/A (solo frontend) | En producción no se usa valor por defecto; si falta `VITE_ENCRYPTION_SECRET`, secure storage no se activa. |
| **3 y 4 – API central vs tenant** | **Una sola base URL por tenant.** Todos los endpoints (auth, roles, permisos, menús) van a esa URL. En on-premise esa URL es el servidor local. | `getUserPermissions(roleIds, clienteInfo)` y flujo interno usan `getApiInstance(clienteInfo)`. `menu.service.getFullMenuTree(apiInstance?)` acepta instancia opcional. AuthContext pasa `userData.cliente` a `getUserPermissions`. |
| **5 – 5xx/timeout** | N/A (solo frontend) | Interceptor global en api central e instancias locales; toast con mensaje claro en 5xx y timeout. |

Las preguntas originales y respuestas detalladas del backend se conservan debajo para referencia.

---

## 1. Login multi-tenant: identificación del cliente

**Contexto:** El frontend hoy envía en `POST /auth/login/` solo `username` y `password` (form-urlencoded). La especificación del backend indica que el cliente se identifica por `cliente_id` o `subdominio` en el cuerpo.

**Preguntas:**

1. ¿El backend **exige** hoy en día `cliente_id` o `subdominio` en el body del login para multi-tenant?
   - [ ] Sí, es obligatorio (sin uno de los dos el login falla o no sabe el tenant).
   - [x] **No; el tenant se deduce del header `Host` (subdominio en la URL).** (Respuesta recibida.)

2. Si debe ir en el body, indicar:
   - Nombre exacto del campo: `subdominio` y/o `cliente_id`?
   - Formato: tipo (string/UUID), si es opcional cuando hay un solo tenant, etc.

3. En entornos con subdominio (ej. `acme.tuapp.com`), ¿el backend espera que el frontend envíe ese subdominio en el login o lo infiere del `Host` de la petición?

**Acción frontend según respuesta:**  
No enviar `subdominio` ni `cliente_id` en el body. El frontend llama al login contra la URL del tenant (mismo host). Aplicado: documentado en `auth.service.ts`.

---

## 2. Endpoints: servidor central vs servidor del tenant

**Contexto:** En instalaciones **on-premise** o **híbridas**, el frontend puede usar una API “local” del cliente (`servidor_api_local`). Hoy varios servicios (menú, permisos, etc.) usan siempre la instancia central. Hay que saber qué debe ir a cada uno.

**Pregunta:** Para cada grupo de endpoints, indicar si en instalación on-premise/hybrid deben llamarse **siempre al servidor central** o **al servidor local del cliente** cuando exista.

| Endpoint(s) / grupo | ¿Siempre central? | ¿Puede ir a servidor local del cliente? |
|--------------------|-------------------|----------------------------------------|
| Auth, roles, permisos, menús, branding, negocio | **Una sola base URL por tenant.** No hay “central” separado; en on-premise esa URL es el servidor local. | **Sí.** Todos van a la misma URL del tenant. (Respuesta recibida.) |

**Convención propuesta:**  
- **Siempre central:** login, refresh, logout, me, y cualquier otro que gestione identidad/sesión a nivel plataforma.  
- **Según instalación:** menú, permisos, branding y datos de negocio del tenant → en on-premise/hybrid ir al servidor local si el backend lo expone ahí.

**Acción frontend según respuesta:**  
Aplicado: `getUserPermissions(roleIds, clienteInfo)` y flujo de permisos/menú usan `getApiInstance(clienteInfo)` cuando hay `clienteInfo`; si no, instancia por defecto (misma URL del tenant).

---

## 3. Permisos granulares (`GET /roles/{rol_id}/permisos/`)

**Contexto:** El frontend obtiene los permisos del usuario llamando a `GET /roles/{rol_id}/permisos/` por cada rol del usuario (desde AuthContext, que usa la instancia central).

**Preguntas:**

1. En instalación **on-premise**: ¿ese endpoint existe en el servidor local del cliente o solo en el servidor central?  
   **Respuesta:** Existe en la misma API del tenant (en on-premise esa API es el servidor local).
2. Si solo existe en central: ¿el JWT o la cookie llevan contexto suficiente?  
   **Respuesta:** N/A; el endpoint va a la misma URL del tenant.
3. ¿Existe o planean `GET /auth/me/permisos/`?  
   **Respuesta:** No existe hoy; recomendado añadirlo para una sola llamada.

**Acción frontend según respuesta:**  
Aplicado: permisos y mapeo de menús usan la instancia del tenant (`getApiInstance(clienteInfo)`). Cuando el backend exponga `GET /auth/me/permisos/`, el frontend puede migrar a ese endpoint.

---

## Resumen de respuestas esperadas

Para poder cerrar las correcciones críticas en frontend, necesitamos:

1. **Login:**** Definición clara de si `subdominio` y/o `cliente_id` van en el body y en qué formato; o confirmación de que el tenant se obtiene por Host/otro mecanismo.
2. **Central vs tenant:** Tabla (o lista) de qué endpoints son “solo central” y cuáles “pueden ir a servidor local” en on-premise/hybrid.
3. **Permisos:** Comportamiento de `/roles/{id}/permisos/` en on-premise y existencia (o no) de `/auth/me/permisos/`.

Con eso el frontend puede implementar sin asumir y mantener el contrato documentado.
