# CFG Readiness — Wave Readiness

**Versión:** 1.0

---

## 1. Dependencias entre Waves (§19) y orden (§20)

| Wave | Depende de | ¿Grafo Spec = Blueprint? |
|------|------------|:------------------------:|
| 0 | — | Sí |
| 1 | 0 types | Sí |
| 2 | 1 service | Sí |
| 3 | 2 list hook | Sí |
| 4 | 3 + mutations | Sí |
| 5 | 3/4 + preview hook | Sí |

Prohibiciones de paralelismo (W4 antes W2, W3 antes W1) coherentes en Blueprint 08 y Spec 01/09.

**PASS.**

---

## 2. Wave 0 — Readiness detallada

### Inputs documentales listos

- [x] Blueprint § Wave 0 exit criteria
- [x] Spec 01 archivos 0.1–0.11
- [x] Spec 06 types mínimos
- [x] Spec 07 constants
- [x] Spec 03/02 no requeridos para stub
- [x] Review checklist W0 (Spec 10)
- [x] Acceptance A0.* (Spec 11)
- [x] PR strategy PR0 (Spec 09)

### Código previo requerido

| Requisito | ¿Bloquea W0? |
|-----------|:------------:|
| Feature cfg existente | No — se crea |
| OpenAPI snapshot | No — tipar contrato |
| Menú Backend | No — URL directa |
| Roles consultar | Ideal para A0.1; stub puede validarse con LBAC cfg.ver si existe, o mock local |

### Exit criteria Wave 0 (recordatorio)

1. Navegar `/app/cfg/secuencias` muestra stub (con permiso módulo).
2. `tsc` OK tras registros.
3. PermissionGuard cableado.

### Veredicto Wave 0

**READY — GO.**

---

## 3. Readiness Waves 1–5 (preview, no autorización aún)

| Wave | Doc completa? | Bloqueo doc? | Prereq externo |
|------|:-------------:|:------------:|----------------|
| 1 | Sí | No | OpenAPI ideal |
| 2 | Sí | No | Cuidado session `'org-inv'` |
| 3 | Sí | No | API + roles consultar |
| 4 | Sí | No | Secuencia locked en seed |
| 5 | Sí | No | Checklist contrato 07 |

Autorización de Waves 1–5 = merge + acceptance de la wave anterior (Spec 09/11). Esta review **solo autoriza Wave 0**.

---

## 4. Orden exacto de archivos Wave 0 (confirmado)

1. `types/cfg.types.ts`
2. `types/cfg-list.types.ts`
3. `types/cfg-discard.types.ts`
4. `constants/cfg-permissions.ts`
5. `constants/cfg-list.constants.ts`
6. `constants/cfg-scope-labels.ts`
7. `erp-modules.ts` (CFG entry)
8. `post-login-path.ts` (`cfg` segment)
9. `pages/SecuenciasPage.tsx` stub
10. `routes.tsx`
11. `app-route-tree.tsx`

**PASS** — orden Spec 01 coincide Blueprint 08 §9 (subset W0).
