# Auditoría runtime — Manager sin empresa en Header

**Fecha:** 31 mayo 2026  
**Alcance:** Solo diagnóstico. **Sin modificación de código.**  
**Síntoma QA:** `tenant_admin` ve empresa + selector + nombre correcto. `manager` entra a `/app` con JWT/`empresa_default_id` correctos pero **Header no muestra empresa**.

---

## 1. Resumen ejecutivo

| Rol | Header empresa | Causa raíz inferida |
|-----|----------------|---------------------|
| `tenant_admin` | ✅ Visible | `empresasElegibles` poblado vía fallback `GET /org/empresa` → label resuelto al instante |
| `manager` | ❌ Ausente | `empresasElegibles = []` + fallback `GET /org/empresa/{id}` falla → `displayName = null` → **`EmpresaSelector` se auto-oculta** |

**Valor crítico que llega vacío para manager:** la **lista con nombres** (`empresasElegibles` / `empresas_disponibles` en `/auth/me`), no el UUID de empresa activa.

**`empresaActivaId` probablemente SÍ está presente** (coherente con acceso `/app` y JWT validado en QA). El componente monta condiciones de visibilidad pero **retorna `null` por falta de label**.

---

## 2. Flujo de diagnóstico (decisión)

```
Header monta EmpresaSelector? 
  → shell === 'app' && !platform_admin  ✅ manager en /app

EmpresaSelector: showEmpresaActiva?
  → hasEmpresaActivaFlag && !requiereSeleccionEmpresa && !platform_admin
  → ✅ probablemente true (tiene empresa en JWT)

EmpresaSelector: displayName resuelto?
  → empresasElegibles.find(id)     ❌ lista vacía
  → selectionStore.find(id)        ❌ vacío tras login Schema B
  → empresaService.getById(id)     ❌ probable 403/404
  → displayName = null

EmpresaSelector línea 131-132: if (!displayName) return null
  → ❌ HEADER VACÍO
```

---

## 3. GET /auth/me — response esperado vs manager

### 3.1 Contrato OpenAPI (`MeResponse`)

Campos relevantes:

| Campo | Tipo | Documentación OpenAPI |
|-------|------|------------------------|
| `empresa_activa` | `string \| null` | UUID empresa activa de sesión |
| `requiere_seleccion_empresa` | `boolean` | default `false` en sesión completa |
| `empresas_disponibles` | `EmpresaDisponible[] \| null` | **"Empresas elegibles cuando requiere_seleccion_empresa es true"** |
| `user_type` | string | `platform_admin` \| `tenant_admin` \| `user` |

> El FE no define `user_type: manager`. En runtime, **manager ≈ `user_type: "user"`** (p. ej. `access_level: 3`).

### 3.2 Response inferido — manager tras login Schema B (M4 `empresa_default_id`)

QA confirma sesión completa. Perfil esperado:

```json
{
  "usuario_id": "<uuid>",
  "user_type": "user",
  "access_level": 3,
  "empresa_activa": "<uuid-empresa-default>",
  "requiere_seleccion_empresa": false,
  "empresas_disponibles": null
}
```

Variantes posibles observadas en runtime:

| Campo | Valor manager (esperado QA) | Valor tenant_admin |
|-------|----------------------------|-------------------|
| `empresa_activa` | ✅ UUID presente | ✅ UUID presente |
| `requiere_seleccion_empresa` | `false` | `false` |
| `empresas_disponibles` | **`null` o `[]` o ausente** | `null` en `/me` (pero FE usa fallback org) |
| `razon_social` en `/me` | ❌ no existe en schema | ❌ no existe |

**Hipótesis principal:** backend envía `empresa_activa` pero **no incluye `empresas_disponibles` en sesión completa** (solo en fase selección), alineado con descripción OpenAPI.

### 3.3 Cómo verificar en runtime (DevTools → Network)

Filtrar `GET /auth/me/` tras login manager:

```
[ ] empresa_activa          → debe tener UUID
[ ] requiere_seleccion_empresa → false
[ ] empresas_disponibles    → ¿null, [], o array con nombres?
[ ] user_type               → "user"
```

Filtrar fallback label:

```
GET /org/empresa/{empresa_activa}  → ¿403 / 404 / 200?
```

---

## 4. Normalización en frontend

### 4.1 `auth.service.ts` → `normalizeUserData()`

```typescript
empresa_activa: normalizeEmpresaActiva(raw.empresa_activa ?? record.empresa_activa),
empresas_disponibles: normalizeEmpresasElegibles(
  raw.empresas_disponibles ?? record.empresas_disponibles,
),
```

| Campo API | Función | Resultado manager (si API null) |
|-----------|---------|--------------------------------|
| `empresa_activa` | `normalizeEmpresaActiva` | ✅ `"<uuid>"` string |
| `empresas_disponibles` | `normalizeEmpresasElegibles` | ❌ **`[]`** (no array → early return) |

`normalizeEmpresasElegibles` descarta items sin `razon_social` no vacío.

### 4.2 `AuthContext.initializeAuth()` → merge + sync

```typescript
mergedUser = {
  ...me,
  empresa_activa: me.empresa_activa || claims?.empresa_id || null,
};
syncEmpresaSession(sessionUser, token);
// ...
elegibles = await loadEmpresasElegiblesForSession(sessionUser);
setEmpresasElegibles(elegibles);
```

#### `syncEmpresaSession`

```typescript
activaRaw = user?.empresa_activa ?? claims?.empresa_id ?? null;
setEmpresaActivaId(activa);  // ✅ UUID
setRequiereSeleccionEmpresa(Boolean(claims?.empresa_selection_pending));  // ✅ false
```

| Estado AuthContext | Manager (esperado) | Tenant_admin |
|--------------------|-------------------|--------------|
| `empresaActivaId` | ✅ UUID | ✅ UUID |
| `requiereSeleccionEmpresa` | `false` | `false` |
| `auth.user.empresa_activa` | ✅ UUID | ✅ UUID |
| `auth.user.empresas_disponibles` | **`[]`** | `[]` o con items |
| `empresasElegibles` | **`[]`** | ✅ N items (fallback org) |

#### `loadEmpresasElegiblesForSession()`

```typescript
fromMe = normalizeEmpresasElegibles(sessionUser.empresas_disponibles);
if (fromMe.length > 0) return fromMe;

if (type === 'tenant_admin') {
  return await empresaService.list({ solo_activos: true });  // ← solo tenant_admin
}

return [];  // ← manager cae aquí
```

**Diferencia clave tenant_admin vs manager:**

| Paso | tenant_admin | manager |
|------|--------------|---------|
| `/auth/me` → `empresas_disponibles` | suele ser null | null |
| Fallback `GET /org/empresa` | ✅ **Sí** | ❌ **No** |
| `empresasElegibles` final | `[{id, razon_social, ...}, ...]` | **`[]`** |

---

## 5. `useEmpresaActiva()` — valores esperados manager

```typescript
showEmpresaActiva = hasEmpresaActivaFlag && !requiereSeleccionEmpresa && !isPlatformAdmin;
canSwitchEmpresa = empresasElegibles.length > 1;
```

| Propiedad | Manager (runtime inferido) | Tenant_admin |
|-----------|---------------------------|--------------|
| `userType` | `"user"` | `"tenant_admin"` |
| `empresaActivaId` | ✅ `"<uuid>"` | ✅ `"<uuid>"` |
| `hasEmpresaActivaFlag` | ✅ `true` | ✅ `true` |
| `requiereSeleccionEmpresa` | `false` | `false` |
| `empresasElegibles` | **`[]`** | `[...]` (≥1) |
| `showEmpresaActiva` | ✅ **`true`** | ✅ `true` |
| `canSwitchEmpresa` | `false` (0 o 1 elegible) | `true` si N>1 |

> **Importante:** `showEmpresaActiva === true` **no garantiza** que el Header muestre algo. `EmpresaSelector` añade una segunda puerta: **`displayName` obligatorio**.

---

## 6. Condiciones exactas de renderizado

### 6.1 `Header.tsx`

```tsx
{!isSuperAdminUser &&
  (shell === 'app' || (shell === 'admin' && isTenantAdminUser)) && (
    <EmpresaSelector />
  )}
```

| Condición | Manager en `/app` | Resultado |
|-----------|-------------------|-----------|
| `!isSuperAdminUser` | `true` | ✅ |
| `shell === 'app'` | `true` | ✅ |
| **Monta `<EmpresaSelector />`** | | ✅ **Sí monta** |

Header **no bloquea** al manager. El hijo se auto-oculta.

### 6.2 `EmpresaSelector.tsx`

| Orden | Guard | Manager |
|-------|-------|---------|
| 1 | `if (!showEmpresaActiva) return null` | Pasa ✅ |
| 2 | Skeleton si `loadingName && !displayName` | Breve flash posible |
| 3 | **`if (!displayName) return null`** | **❌ BLOQUEO FINAL** |
| 4 | Badge estático si `!canSwitchEmpresa` | No alcanza |
| 5 | Dropdown si `canSwitchEmpresa` | No alcanza |

#### Resolución de `displayName` (useEffect)

| Fuente | Manager |
|--------|---------|
| `empresasElegibles.find(empresaActivaId)` | ❌ lista vacía |
| `selectionEmpresas.find(...)` | ❌ store limpio post-login B |
| `empresaService.getById(empresaActivaId)` | ❌ **catch → `setDisplayName(null)`** |

```typescript
// EmpresaSelector.tsx:57-60
} catch {
  if (!cancelled) {
    setDisplayName(null);  // ← oculta componente entero
  }
}
```

---

## 7. Por qué tenant_admin funciona y manager no

| Capa | tenant_admin | manager |
|------|--------------|---------|
| Header monta componente | ✅ | ✅ |
| `showEmpresaActiva` | ✅ | ✅ |
| `empresasElegibles` con nombres | ✅ vía **`GET /org/empresa`** fallback | ❌ **`[]`** |
| Resolución label sin API extra | ✅ `fromElegibles` hit | ❌ |
| `GET /org/empresa/{id}` necesario | No (ya tiene nombres en lista) | Sí, y **probablemente falla** |
| `displayName` final | ✅ string | ❌ **`null`** |
| UI Header | ✅ visible | ❌ **ausente** |

**Conclusión:** no es un problema de permisos de shell ni de `empresaActivaId`. Es un **gap de resolución de etiqueta** introducido por M2:

1. Se eliminó fallback org list para no-`tenant_admin`.
2. Se asumió `/auth/me.empresas_disponibles` siempre poblado (usuario_rol).
3. OpenAPI indica que ese campo es para fase selección, no sesión completa.
4. Se eliminó texto fallback `"Empresa"`.
5. Fallback `getById` no es viable para manager sin permiso ORG lectura.

---

## 8. Tabla de valores null / undefined / vacíos

| Variable | Manager (esperado runtime) | Impacto |
|----------|------------------------------|---------|
| `/auth/me`.empresa_activa | ✅ UUID | Ninguno — sesión OK |
| `/auth/me`.empresas_disponibles | **`null` / ausente** | → `[]` tras normalizar |
| `auth.user.empresas_disponibles` | **`[]`** | Sin nombres en contexto |
| `empresasElegibles` (AuthContext) | **`[]`** | Sin match en selector |
| `empresaActivaId` | ✅ UUID | OK pero insuficiente solo |
| `displayName` (EmpresaSelector) | **`null`** | **Oculta UI** |
| `selectionStore.empresasDisponibles` | **`[]`** | Sin datos login Schema A |
| `GET /org/empresa/{id}` response | **403/404** (inferido) | Label irrecuperable |
| `showEmpresaActiva` | `true` | Engañoso — componente igual oculto |
| `canSwitchEmpresa` | `false` | Correcto si 0-1 elegibles |

**Único valor “incorrectamente vacío” para el síntoma:** lista de empresas **con metadatos de nombre** (`empresasElegibles` / `empresas_disponibles`).

---

## 9. Escenarios QA cruzados

| Escenario | manager header | Explicación |
|-----------|---------------|-------------|
| 1 empresa, sesión completa | ❌ oculto | `empresas_disponibles` null + getById fail |
| 2 empresas, sesión completa | ❌ oculto (mismo) | A menos que BE envíe array en `/me` |
| Tras Schema A + selección | ⚠️ podría funcionar | Store selección aún tiene nombres hasta clear |
| tenant_admin multiempresa | ✅ | Fallback org list |
| manager multiempresa | ❌ | Misma cadena; dropdown tampoco |

---

## 10. Evidencia a capturar en próximo runtime (checklist)

```javascript
// Pegar en consola con React DevTools / tras login manager:
// (valores esperados según este diagnóstico)

// Network
// GET /auth/me → copiar empresa_activa, empresas_disponibles, user_type
// GET /org/empresa/{empresa_activa} → status code

// Console DEV (AuthContext ya loguea):
// [AuthContext] syncEmpresaSession → empresaActivaId
```

| # | Captura | Confirma hipótesis si… |
|---|---------|------------------------|
| 1 | `/auth/me`.empresas_disponibles | `null`/`[]` |
| 2 | `/auth/me`.empresa_activa | UUID presente |
| 3 | `GET /org/empresa/{id}` | status ≠ 200 |
| 4 | React: `empresasElegibles.length` | `0` |
| 5 | React: `showEmpresaActiva` | `true` |
| 6 | DOM Header | sin nodo EmpresaSelector tras load |

---

## 11. Dirección de fix (solo referencia — fuera de alcance)

Opciones alineadas al modelo congelado (no implementadas):

| Opción | Descripción |
|--------|-------------|
| **A — Backend** | `/auth/me` incluye `empresas_disponibles` (elegibles usuario_rol) **también en sesión completa** |
| **B — Backend** | `/auth/me` incluye `empresa_activa_label` o objeto empresa activa embebido |
| **C — Frontend** | Endpoint auth de solo lectura para elegibles (si BE lo expone) |
| **D — Frontend** | Permitir label desde login `user_data` / persistir elegibles en sesión |
| **E — Frontend** | No ocultar badge si `empresaActivaId` presente; skeleton/retry distinto de `return null` |

---

## 12. Conclusión

El manager **sí cumple** login, JWT y acceso `/app`. El Header **monta** `EmpresaSelector`, pero el componente **no renderiza nada** porque:

1. **`empresasElegibles` está vacío** — `/auth/me` no trae lista con nombres en sesión completa y no hay fallback org para `user`.
2. **`displayName` queda `null`** — fallback `GET /org/empresa/{id}` falla para rol operativo.
3. **Guard final `if (!displayName) return null`** elimina cualquier indicador visual.

`tenant_admin` funciona porque **`loadEmpresasElegiblesForSession` carga `GET /org/empresa`** y resuelve el nombre sin depender de `/auth/me.empresas_disponibles`.

**Valor exacto que falla:** `empresas_disponibles` / `empresasElegibles` (vacío) y en cascada **`displayName`** (`null`).

---

*Auditoría generada por trazado estático post-QA runtime. Sin cambios de código.*
