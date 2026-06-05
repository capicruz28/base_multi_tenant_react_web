# Auditoría e implementación — Empresa activa / JWT (multi-empresa)

**Fecha:** mayo 2026  
**Contrato backend:** [`docs/FLUJO_AUTH_MULTIEMPRESA_FE.md`](../../FLUJO_AUTH_MULTIEMPRESA_FE.md) (OpenAPI: `docs/backend_openapi.json`)

---

## Resumen

| Antes (Punto 3) | Después (Fase 2) |
|-----------------|------------------|
| Sin `empresa_id` en `UserData` | `empresa_activa`, `es_admin_cliente`, `requiere_seleccion_empresa` |
| Sin pantalla de selección | `/app/seleccionar-empresa` |
| Filtro empresa solo por página | Contexto global + selector en Header (shell `app`) |
| Menú siempre tras login | No se llama `/auth/menu` ni `/auth/permissions/me` con selection token |

---

## Implementación (mayo 2026)

### A — Tipos y servicios

| Archivo | Cambio |
|---------|--------|
| `src/features/auth/types/auth.types.ts` | `Token`, `LoginEmpresaSelectionResponse`, `EmpresaOption`, campos en `UserData` |
| `src/features/auth/services/auth.service.ts` | Login union A/B; `seleccionarEmpresa`, `cambiarEmpresa` |
| `src/core/auth/utils/decodeAccessToken.ts` | Claims JWT para guards/UI |
| `src/core/auth/utils/empresa-access.ts` | `hasEmpresaActiva`, `canAccessErp`, `mustSelectEmpresa` |

### B — Estado global (AuthContext)

| Estado / API | Descripción |
|--------------|-------------|
| `empresaActivaId` | UUID empresa activa (me + JWT) |
| `empresasDisponibles` | Lista con `razon_social` (sin UUID en UI) |
| `requiereSeleccionEmpresa` | Fase selection token |
| `setAuthFromEmpresaSelection` | Tras login respuesta B |
| `completeEmpresaSelection` | POST seleccionar |
| `cambiarEmpresaActiva` | POST cambiar |
| `useEmpresaActiva()` | Hook en `src/features/auth/hooks/useEmpresaActiva.ts` |

### C — Flujo login

1. `POST /auth/login/`
2. Si `selection_token` → `setAuthFromEmpresaSelection` → `/app/seleccionar-empresa`
3. Si `access_token` completo → `setAuthFromLogin` → `/app/home` o selección si falta empresa
4. `SeleccionarEmpresaPage` → `completeEmpresaSelection` → recarga menú → home

### D — Guards

- `ProtectedRoute` en `/app/*`: redirect a selección si `mustSelectEmpresa` o `!canAccessErp` (excepto ruta selección).
- `PermissionContext`: no llama `/auth/permissions/me` con selection token.

### E — Header

- `EmpresaSelector.tsx`: solo shell `app`, si `empresasDisponibles.length > 1`.

### F — Menú / 409

- `loadMenuAndPermissionsFromAuthMenu` omitido con selection pending.
- Error 409 en menú → `requiereSeleccionEmpresa = true`.

### G — Piloto INV (patrón `useEmpresaActiva`)

- `StockPage.tsx`, `CategoriasPage.tsx`, `ProductosPage.tsx` usan `empresaActivaId` como default del filtro.
- **Pendiente:** resto de páginas ERP con `empresaFilter` local (migración incremental).

---

## Checklist manual

| Escenario | Esperado |
|-----------|----------|
| Login 1 empresa | `/app/home`, `empresaActivaId` en contexto |
| Login N empresas | `/app/seleccionar-empresa` → elegir → home |
| Menú con selection token | No se llama hasta tras seleccionar |
| Cambiar empresa en header | Nuevo token, menú actualizado |
| GET `/auth/me` | `empresa_activa` coherente |

---

*Referencia: Punto 1 JWT en `contexto-refactorizacion.mdc`.*
