# Resumen comparativo — Documentación V1 → V2 (pre-PUR-M0)

**Fecha:** 31 mayo 2026  
**Estado:** Sincronización documental completada — **sin commit**  
**Norma congelada:** [`ERP_FRONTEND_STANDARDS_V2.md`](./ERP_FRONTEND_STANDARDS_V2.md)

---

## 1. Arquitectura documental (antes vs ahora)

| Documento | V1 (pre-cierre INV) | V2 (vigente) |
|-----------|---------------------|--------------|
| **ERP_FRONTEND_STANDARDS** | V1 — parcial, pre-M3 | **V2 CONGELADO** — única norma con IDs |
| **`.cursorrules`** | Integridad API + UX genérico; **contradice** multiempresa | v2 — pointers V2 + diseño 2 capas + ME resumido |
| **PROMPT_FRONTEND_MAESTRO** | Fases 0–3; diseño 2 capas duplicado; filtros empresa | v3 — Fase 0.4/0.5, 3.5 Gates; sin duplicar norma |
| **Precedencia explícita** | Ambigua | OpenAPI > V2 > `.cursorrules` > PROMPT |

**Principio write-once:** reglas MUST con ID → solo V2. `.cursorrules` y PROMPT referencian §/IDs.

---

## 2. `.cursorrules` — cambios operativos

| ID fix | Antes (v1) | Ahora (v2) |
|--------|------------|------------|
| **CR-01** | L177: filtros incluyen **empresa** | Filtros dominio; **sin** selector empresa toolbar (ME-02) |
| **CR-02** | L25: `empresa_id` genérico | `empresa_id` = **`scopeEmpresaId` sesión JWT** (ME-01) |
| **CR-03** | Empty genérico "ilustración + mensaje" | **`IamTableEmptyState`** (ES-01) |
| **CR-04** | "skeleton o spinner" | **`InvTableSkeleton`** en listados (SK-01) |
| **Nuevo** | Sin bloque multiempresa | § ERP MULTIEMPRESA JWT (ME-01…ME-10 pointers) |
| **Nuevo** | Sin componentes nombrados | IamSearchInput, OrgToolbarSearch, InvTableSkeleton, etc. |
| **Nuevo** | Sin B.1.1 explícito | Pointer §7.1 B11 + OrgDiscardConfirmDialog |
| **Nuevo** | Sin Gates | Pointer V2 §11 |
| **Nuevo** | Sin precedencia V2 | Header + orden conflicto 0–7 |
| **Mantenido** | Diseño 2 capas completo | **Sin cambio** — solo aquí |
| **Mantenido** | Deprecated, cabecera+detalle, errores | Resumen operativo + pointer V2 |

**Líneas ~:** 304 → ~330 (más ERP platform, menos UX genérico redundante).

---

## 3. PROMPT_FRONTEND_MAESTRO — cambios operativos

| ID fix | Antes | Ahora (v3) |
|--------|-------|------------|
| **PR-01** | "empresa_id donde API lo requiera" | Sesión JWT `scopeEmpresaId` (ME-01, ME-05) |
| **PR-02** | Zustand `empresa_id` del tenant | `useEmpresaActiva`, `use*SessionScope` (§10) |
| **PR-03** | Ejemplo filtros con **Empresa** | Filtros dominio **sin** empresa (ME-02) |
| **PR-04** | Analíticos: filtros **empresa** | Filtros dominio; empresa vía sesión |
| **PR-05** | Empty genérico | **`IamTableEmptyState`** (ES-01) |
| **PR-06** | Skeleton genérico | **`InvTableSkeleton`** (SK-01) |
| **Eliminado** | ~115 líneas diseño 2 capas + ejemplos TSX | Pointer `.cursorrules` |
| **Eliminado** | Tabla vocabulario completa (~10 filas) | Pointer V2 §8.4 |
| **Eliminado** | Bloque 4 layout extenso duplicado | Pointers §5 / §6 / §7 por plantilla |
| **Nuevo** | — | **Fase 0.4** clasificación plantilla §2.1 |
| **Nuevo** | — | **Fase 0.5** patrón referencia §9.5 |
| **Nuevo** | — | **Fase 3.5** Gates §11 por sprint M0/M1/M2 |
| **Nuevo** | — | Auditoría: columna Plantilla + sección multiempresa |
| **Nuevo** | — | Referencias IAM / ORG / INV cerrados |
| **Mantenido** | Fase 0.1 OpenAPI, Fase 1 estructura, Bloques 1–3 | Proceso intacto |

**Líneas ~:** 589 → ~320.

---

## 4. ERP_FRONTEND_STANDARDS — V1 vs V2 (referencia)

| Aspecto | V1 | V2 congelado |
|---------|-----|--------------|
| Plantillas | ORG vs INV implícito | A / A+ / B-L / B-F / B-R / T / H / Admin / Platform |
| Multiempresa | ME-01…ME-09 | + AUTH/IMP §4.8, ME-10, AP-12 en §9.1 |
| B.1.1 | Modal ORG | Modal + B-F SEC-01…06 |
| Gates | Checklist §15 genérico | **§11 Gates 0–4** por sprint |
| IAM/ORG/INV | Referencias parciales | §9 cerrados oficialmente |
| PUR/SLS/FIN/LOG | No mapeados | §2.3 matriz completa |
| Componentes | §16 parcial | **§10 mapa único** |

V1 archivado; no editar. Banner supersede pendiente opcional.

---

## 5. Cambios operativos críticos antes de PUR-M0

### 5.1 MUST conocer (rompen multiempresa si se ignoran)

| # | Cambio | Acción PUR-M0 |
|---|--------|---------------|
| 1 | **No selector empresa local** | Eliminar `empresaFilter`, "Todas las empresas", `<select>` toolbar |
| 2 | **`scopeEmpresaId` desde sesión** | Copiar INV M0-b: `usePurSessionScope`, gate, guard, invalidate |
| 3 | **Create readonly empresa** | `OrgSessionEmpresaField`; `assertBodyEmpresaMatchesSession` |
| 4 | **Precedencia V2** | Ante duda `.cursorrules` antiguo vs V2 → **V2 gana** |
| 5 | **Clasificar antes de codificar** | Fase 0.4: cada ruta PUR → plantilla A / B-L / B-F |
| 6 | **Gates M0** | Cerrar §11.1 + §11.2 + §11.5 antes de M1 |

### 5.2 SHOULD conocer (no bloquean M0)

| # | Tema | Cuándo |
|---|------|--------|
| 7 | B.1.1 modales catálogo | PUR-M1 (Gate 2) — copiar patrón INV M3 / ORG E-SEC |
| 8 | `useTenantQuery` en hooks GET | ME-10 — adoptar en hooks nuevos PUR |
| 9 | Debounce búsqueda 500ms | SR-03 — PUR-M1 si API server-side |
| 10 | Transactional guard B-F | PUR-M2 — copiar `useInvTransactionalFormGuard` |

### 5.3 Secuencia PUR recomendada (alineada V2 + PROMPT v3)

```
PUR Fase 0 (0.1–0.5) → AUDITORIA_FRONTEND_PUR.md
PUR-M0: infra scope + piloto catálogo → Gate 0, 1, 4
PUR-M1: catálogos Plantilla A + B.1.1 → Gate 2 por pantalla
PUR-M2: B-L + B-F → Gate 3 por ruta
```

### 5.4 Referencias código a copiar (V2 §9.5)

| Necesidad | Archivo |
|-----------|---------|
| Multiempresa infra | INV: `useInvSessionScope`, `InvCompanyRouteGuard`, `invalidateInvQueries` |
| Catálogo A + B.1.1 | INV `UnidadesMedidaPage` / `CategoriasPage` (post-M3) |
| B-L | INV `MovimientosPage` |
| B-F | INV `MovimientoFormPage` + `useInvTransactionalFormGuard` |
| Componentes tabla | IAM `IamSearchInput`, `IamTableEmptyState` |
| Multiempresa ORG (alternativa) | ORG `useOrgSessionScope`, `OrgCompanyRouteGuard` |

### 5.5 Qué NO hacer en PUR-M0

- No reabrir auditorías arquitectónicas de patrones (V2 §9 + §10 bastan)
- No copiar `EmpresaPage` monolito (AP-10)
- No usar `useInvTransactionalFormGuard` en Plantilla A (CL-05)
- No modificar `ERP_FRONTEND_STANDARDS_V2.md` (congelado)
- No asumir que código PUR legacy es correcto por existir

---

## 6. Veredicto

| Documento | Estado | Listo PUR-M0 |
|-----------|--------|--------------|
| ERP_FRONTEND_STANDARDS_V2 | ✅ CONGELADO | ✅ |
| `.cursorrules` v2 | ✅ Generado | ✅ |
| PROMPT_FRONTEND_MAESTRO v3 | ✅ Generado | ✅ |
| Fase auditoría documental | ✅ CERRADA | — |

**Siguiente paso operativo:** ejecutar PROMPT Fase 0 completa para **PUR** (`AUDITORIA_FRONTEND_PUR.md`) → PUR-M0.

---

*Resumen sync V1→V2. Sin código. Sin commit.*
