# Auditoría — Fallo de copia al portapapeles (Historia A P0)

**Versión:** 1.0  
**Fecha:** 2026-06-08  
**Componente:** `ClientCredentialsRevealModal.tsx`  
**Entorno reportado:** `http://innova.app.local:5173`  
**Estado:** Auditoría completada — **sin implementación**

---

## 1. Resumen ejecutivo

Los tres botones de copia fallan con el mensaje genérico **"No se pudo copiar al portapapeles"** porque la implementación actual depende **exclusivamente** de `navigator.clipboard.writeText()` y **no tiene fallback**.

En el entorno de prueba (`http://innova.app.local:5173`), el origen es **HTTP sobre un hostname personalizado** (`.app.local`). Eso **no es un [Secure Context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)** en Chrome, Edge y Firefox. La Clipboard API queda bloqueada o rechaza la escritura.

**Causa raíz más probable:** contexto no seguro (HTTP + `*.app.local`), no un bug de credenciales ni del modal en sí.

**Corrección mínima propuesta:** util compartido con detección de `isSecureContext` + fallback síncrono `document.execCommand('copy')` vía `<textarea>` oculto, invocado en el mismo gesto de clic del usuario.

---

## 2. Implementación actual

### 2.1 Ubicación

| Elemento | Detalle |
|----------|---------|
| Archivo | `src/features/super-admin/clientes/components/ClientCredentialsRevealModal.tsx` |
| Función | `copyToClipboard()` (líneas 36–44) |
| Consumidores | `handleCopy('user' \| 'password' \| 'block')` (líneas 66–85) |

### 2.2 Código relevante

```typescript
async function copyToClipboard(text: string, successMessage: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
    return true;
  } catch {
    toast.error('No se pudo copiar al portapapeles.');
    return false;
  }
}
```

### 2.3 Respuestas a las preguntas de auditoría

| # | Pregunta | Hallazgo |
|---|----------|----------|
| 1 | ¿Qué usa la implementación? | Solo `navigator.clipboard.writeText(text)` |
| 2 | ¿Por qué falla en `innova.app.local:5173`? | Origen HTTP no seguro → Clipboard API no disponible o lanza `NotAllowedError` / `SecurityError` |
| 3 | ¿Es exclusivamente `writeText()`? | **Sí** — no hay otra ruta |
| 4 | ¿Existe fallback? | **No** — en todo el repo solo este modal implementa copia al portapapeles |

### 2.4 Otros hallazgos

| Hallazgo | Impacto |
|----------|---------|
| `catch` vacío — no registra el error real | Dificulta diagnóstico en DEV |
| No comprueba `window.isSecureContext` ni `navigator.clipboard` antes de llamar | Falla predecible en dev local |
| No hay util reutilizable en `src/shared/utils/` | Lógica aislada en el modal (aceptable en P0, mejorable en el fix) |

---

## 3. Análisis del entorno de prueba

### 3.1 Configuración Vite (coherente con el escenario)

`vite.config.ts` expone el dev server en:

- `host: '0.0.0.0'`
- `port: 5173`
- `allowedHosts: ['.app.local', ...]`

El proyecto está diseñado para desarrollo multi-tenant en subdominios `*.app.local` vía **HTTP**, no HTTPS. Eso es coherente con documentación interna (`platform.app.local:5173`, `acme.app.local:5173`, etc.).

### 3.2 Secure Context — regla del navegador

| Origen | ¿Secure Context? | Clipboard API |
|--------|------------------|---------------|
| `https://innova.app.local:5173` | Sí | Disponible (con permisos) |
| `http://localhost:5173` | Sí (excepción) | Disponible |
| `http://127.0.0.1:5173` | Sí (excepción) | Disponible |
| **`http://innova.app.local:5173`** | **No** | **Bloqueada / falla** |

### 3.3 Verificación recomendada en DevTools (consola del navegador)

Ejecutar en `http://innova.app.local:5173` con el modal abierto:

```javascript
window.isSecureContext
// Esperado: false

typeof navigator.clipboard
// Puede ser 'object' o 'undefined' según navegador

navigator.clipboard?.writeText('test').catch(console.error)
// Esperado: NotAllowedError, SecurityError o TypeError
```

Si `isSecureContext === false`, la hipótesis queda confirmada sin cambiar código.

### 3.4 Causas descartadas (menor probabilidad en este caso)

| Causa | Por qué se descarta |
|-------|---------------------|
| Falta de gesto de usuario | Los botones disparan `onClick` — hay gesto válido |
| Texto vacío | El modal muestra credenciales — el payload no está vacío |
| Permisos de iframe | El modal no está en iframe cross-origin |
| Error de red / API | La copia es 100 % cliente — no llama al backend |
| Bloqueo por contraseña en campo oculto | No se usa input readonly — solo `writeText` |

---

## 4. Impacto funcional

| Área | Estado |
|------|--------|
| Modal de credenciales | OK — muestra datos |
| Acknowledgment / cierre | OK — independiente de clipboard |
| Copiar usuario / contraseña / bloque | **Roto** en HTTP `*.app.local` |
| Producción HTTPS | Probablemente OK si el despliegue es HTTPS |
| Dev local `*.app.local` HTTP | **Roto sistemáticamente** con implementación actual |

El fallo afecta al **flujo operativo de provisionamiento en desarrollo**, que es exactamente el entorno que el equipo usa para multi-tenant.

---

## 5. Plan de corrección mínima (sin implementar)

### 5.1 Principios

- Cambio acotado — sin tocar Auth, ERP, `ClientManagementPage`, stores ni persistencia
- Sin almacenar credenciales fuera del estado efímero existente
- Reutilizable para futuros casos de copia en super-admin
- Compatible con HTTPS en producción y HTTP `*.app.local` en desarrollo

### 5.2 Archivos propuestos

| Acción | Archivo | Alcance |
|--------|---------|---------|
| **Nuevo** | `src/shared/utils/copy-to-clipboard.ts` | Util con API moderna + fallback |
| **Modificar** | `src/features/super-admin/clientes/components/ClientCredentialsRevealModal.tsx` | Reemplazar `copyToClipboard` local por el util |

**Total: 1 archivo nuevo + 1 modificado** (2 archivos, ~40 líneas netas).

No se requiere modificar `CreateClientModal`, `useProvisionCliente`, ni `cliente.service.ts`.

### 5.3 Diseño del util `copyTextToClipboard(text: string): Promise<void>`

```text
1. Si navigator.clipboard existe Y window.isSecureContext === true:
     → await navigator.clipboard.writeText(text)
     → return

2. Si no (HTTP *.app.local, navegadores legacy, etc.):
     → fallback SÍNCRONO en el mismo tick del click:
         - crear <textarea> off-screen
         - asignar text, focus, select / setSelectionRange
         - document.execCommand('copy')
         - eliminar textarea
     → si execCommand retorna false → throw

3. El modal conserva toasts de éxito/error; opcionalmente en DEV:
     console.warn('[copy-to-clipboard]', error) en catch
```

### 5.4 Detalle crítico — preservar user activation

`document.execCommand('copy')` debe ejecutarse **sin awaits previos fallidos** que consuman el gesto del usuario.

**Orden correcto:**

```text
onClick (síncrono)
  → decidir ruta por isSecureContext (síncrono)
  → si insecure: execCommand inmediato
  → si secure: await clipboard.writeText
```

**Evitar:**

```text
onClick → await clipboard.writeText() → catch → execCommand
```

En algunos navegadores el fallback tardío tras un `await` fallido **también falla** por pérdida de user activation. La comprobación de `isSecureContext` **antes** de cualquier `await` mitiga este riesgo.

### 5.5 Cambio en `ClientCredentialsRevealModal`

| Antes | Después |
|-------|---------|
| `copyToClipboard()` local con solo `writeText` | `import { copyTextToClipboard } from '@/shared/utils/copy-to-clipboard'` |
| `catch` silencioso | `catch` con toast genérico + `import.meta.env.DEV && console.warn(error)` |

Mensajes de toast existentes se mantienen (`Usuario copiado.`, etc.).

### 5.6 Alternativas evaluadas y descartadas para P0

| Alternativa | Veredicto |
|-------------|-----------|
| Habilitar HTTPS en Vite dev (`server.https` + mkcert) | Válida a nivel infra, pero más invasiva; no corrige otros entornos HTTP |
| Forzar `localhost` en dev | Rompe flujo multi-tenant por subdominio |
| Modal con `<input readonly>` + selección manual | Degrada UX; no sustituye copia en un clic |
| Permisos `clipboard-write` en Permissions-Policy | No aplica en contexto no seguro |
| Persistir última copia en sessionStorage | **Prohibido** por arquitectura de credenciales |

---

## 6. Compatibilidad con arquitectura aprobada

| Restricción Historia A | ¿Cumple el plan? |
|-------------------------|------------------|
| No modificar Auth / ERP / ClientManagementPage | Sí |
| No Zustand nuevo | Sí |
| No persistir credenciales | Sí — el util no guarda texto |
| Alcance mínimo super-admin | Sí — 1 util shared + 1 componente feature |
| Sin PDF / email / P1 | Sí |

Ubicar el util en `src/shared/utils/` es coherente con utilidades transversales (`menuSearch.ts` ya vive ahí). Si se prefiere aislamiento estricto al feature, `src/features/super-admin/clientes/utils/copy-to-clipboard.ts` también es válido; **recomendación: `shared/utils`** por reutilización futura sin acoplar al dominio clientes.

---

## 7. Checklist de validación post-corrección

### Entorno dev HTTP (`http://innova.app.local:5173`)

- [ ] `window.isSecureContext === false` (baseline)
- [ ] Copiar usuario → toast éxito + pegado correcto
- [ ] Copiar contraseña → toast éxito + pegado correcto
- [ ] Copiar bloque completo → toast éxito + formato multilínea correcto

### Entorno seguro (opcional)

- [ ] `https://...` o `http://localhost:5173` → sigue usando `navigator.clipboard.writeText`
- [ ] No regresión en producción

### Seguridad

- [ ] Credenciales no aparecen en localStorage / sessionStorage
- [ ] Util no loguea el texto copiado (solo errores en DEV)

---

## 8. Conclusión

| Item | Resultado |
|------|-----------|
| Causa raíz | Clipboard API bloqueada en **HTTP `*.app.local`** (no Secure Context) |
| Implementación actual | **Solo** `navigator.clipboard.writeText()`, sin fallback |
| Severidad | Media-alta en dev; baja en producción HTTPS |
| Fix mínimo | Util `copyTextToClipboard` con fallback `execCommand` + actualizar modal |
| Esfuerzo estimado | Bajo (~30–45 min incl. QA manual) |

**Siguiente paso recomendado:** implementar el plan de §5 tras aprobación explícita.

---

**Fin de auditoría.**
