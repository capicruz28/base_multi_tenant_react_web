# ACCOUNT_CENTER_V1 — Informe de implementación PR3 (Información Personal)

**Documento:** `docs/arquitectura/ACCOUNT_CENTER_V1_PR3_IMPLEMENTATION_REPORT.md`  
**Épica:** `ACCOUNT_CENTER_V1` (Mi Cuenta)  
**Alcance:** PR3 — Sección Información personal (read-only)  
**Fecha:** 2026-06-24  
**Prerequisitos:** PR1 (shell + routing + sesiones), PR2 (Header + breadcrumbs)

---

## 1. Resumen

Se implementó la sección **Información personal** en `/app/cuenta/informacion` como vista **100 % read-only**, consumiendo exclusivamente datos ya disponibles en **AuthContext** (origen `/auth/me` vía bootstrap). Cuatro cards: Cuenta, Organización, Acceso e Información (panel administrador). Sin formularios, sin edición, sin endpoints nuevos.

**No se avanzó a PR4** (Seguridad).

---

## 2. Archivos creados

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/features/account/utils/account-profile-display.utils.ts` | `buildAccountProfileViewModel` — agregación read-only AuthContext |
| `src/features/account/components/profile/AccountProfileCard.tsx` | Shell card + `AccountProfileField` (oculta valores vacíos) |
| `src/features/account/components/profile/AccountProfileAccountCard.tsx` | Card Cuenta |
| `src/features/account/components/profile/AccountProfileOrganizationCard.tsx` | Card Organización |
| `src/features/account/components/profile/AccountProfileAccessCard.tsx` | Card Acceso |
| `src/features/account/components/profile/AccountProfileInfoNotice.tsx` | Card Información (copy administrador) |
| `src/features/account/components/profile/AccountProfilePageSkeleton.tsx` | Skeleton carga inicial |
| `src/features/account/utils/__tests__/account-profile-display.utils.test.ts` | Tests util view model |
| `src/features/account/pages/__tests__/AccountProfilePage.test.tsx` | Tests render read-only |

**Total:** 9 archivos nuevos.

---

## 3. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/features/account/pages/AccountProfilePage.tsx` | Reemplazo stub PR1 por orquestación completa |

**Total:** 1 archivo modificado.

---

## 4. Componentes reutilizados

| Componente / util | Origen | Uso |
|-------------------|--------|-----|
| `useAuth` | `AuthContext` | Única fuente de datos |
| `findEmpresaById`, `isSameEmpresaId`, `resolveEmpresaLabel` | `@/core/auth/utils/empresa-eligibles` | Nombre empresa activa sin UUID |
| Layout section header | `AccountCenterLayout` (PR1) | Título/subtítulo — no duplicado en page |
| Tokens Capa 1 | V2 / UX | `bg-surface`, `text-text-*`, `border-border-base`, badges semánticos |

---

## 5. Datos reutilizados desde AuthContext

| Campo UI | Fuente AuthContext |
|----------|-------------------|
| Nombre completo | `auth.user.nombre` + `auth.user.apellido` |
| Usuario | `auth.user.nombre_usuario` |
| Correo | `auth.user.correo` |
| Estado | `auth.user.es_activo` → badge Activa/Inactiva |
| Cliente | `clienteInfo` o `auth.user.cliente` → `razon_social` |
| Tenant | `nombre_comercial` cuando difiere de razón social |
| Empresa activa | `empresaActivaId` + `empresasElegibles` → nombre |
| Código empresa | Opcional en item raw `empresas_disponibles` (`codigo_empresa`) — oculto si ausente |
| Rol principal | `auth.user.roles[0]` |
| Roles | `auth.user.roles[]` (chips) |
| Nivel de acceso | `accessLevel` |
| Tipo autenticación | Opcional `proveedor_autenticacion` / `tipo_autenticacion` en user — oculto si ausente |

**Prohibido E-ME4:** ningún UUID renderizado en UI.

**Sin llamada HTTP adicional** al abrir la sección.

---

## 6. Decisiones tomadas

| Decisión | Detalle |
|----------|---------|
| View model puro | `buildAccountProfileViewModel` en utils — sin hook `useAccountProfile` (review) |
| Campos vacíos | `AccountProfileField` no renderiza fila; card Organización oculta si todos los campos son null |
| Código empresa | Solo si el backend envía `codigo_empresa` en item de empresa del user; no inventado |
| Tipo autenticación | Solo si existe en payload user; SPEC §5.4 — condicional |
| Copy Información | Texto exacto del alcance PR3 (2 párrafos) |
| Sin avatar V1 | UX avatar opcional; PR3 scope no lo exigió — cards label/valor |
| Loading | Skeleton mientras `loading && !auth.user` |

---

## 7. Validaciones

| Validación | Resultado |
|------------|-----------|
| Datos solo desde AuthContext | ✅ |
| Sin placeholders «—» / UUID | ✅ |
| Campos ausentes ocultos | ✅ Tests utils + render |
| Sin botón Editar / form / modal | ✅ Test page |
| `npx tsc --noEmit` | ✅ PASS |
| AuthContext / compositors / interceptors | ✅ Sin cambios |
| Header / otras secciones | ✅ Sin cambios |

---

## 8. Pruebas ejecutadas

```text
npx tsc --noEmit  →  PASS

npx vitest run features/account  →  PASS (14 tests)
```

| Suite | Tests |
|-------|-------|
| `account-profile-display.utils.test.ts` | 4/4 |
| `AccountProfilePage.test.tsx` | 2/2 |
| Regresión PR1/PR2 (account module) | 8/8 |

---

## 9. Riesgos

| ID | Riesgo | Sev. | Notas |
|----|--------|------|-------|
| R1 | `codigo_empresa` no persiste tras `normalizeEmpresasElegibles` | Baja | Campo oculto en prod hasta extensión contrato `EmpresaOption` |
| R2 | `proveedor_autenticacion` ausente en `/auth/me` | Baja | Tipo autenticación oculto — SPEC §5.4 |
| R3 | Rol principal = roles[0] cuando hay varios | Baja | Convención UI; BE no expone rol primario explícito |
| R4 | Card Organización vacía para algunos platform_admin | Baja | Card oculta — comportamiento correcto |

---

## 10. Checklist de aceptación PR3

### Información personal (AC-02 / SPEC §5)

- [x] Vista read-only completa
- [x] Card Cuenta: nombre, usuario, correo, estado
- [x] Card Organización: cliente, empresa activa, código empresa (cond.), tenant (cond.)
- [x] Card Acceso: rol principal, roles, nivel, tipo auth (cond.)
- [x] Card Información: copy administrador sin acciones
- [x] Sin UUID visible (E-ME4)
- [x] Sin edición / formularios / modales
- [x] Tokens Capa 1 + grid responsive
- [x] Sin H1 (header en layout PR1)
- [x] Loading skeleton

### Restricciones PR3

- [x] Sin endpoints nuevos
- [x] Sin AuthContext / compositors / interceptors
- [x] Sin Header / Seguridad / Sesiones / Preferencias
- [x] Sin documentación funcional extra

---

## 11. Autoauditoría

| Pregunta | Respuesta |
|----------|-----------|
| ¿Solo PR3 implementado? | **Sí** |
| ¿Read-only estricto? | **Sí** |
| ¿Datos solo AuthContext? | **Sí** |
| ¿Inventó campos? | **No** |
| ¿Tests PASS? | **Sí** |

---

## 12. Dictamen final

# **A) PR3 implementado correctamente**

La sección Información personal está operativa, alineada con SPEC/UX, read-only, sin regresiones en módulo account y lista para PR4 (Seguridad).

---

*Informe PR3 ACCOUNT_CENTER_V1 — 2026-06-24.*
