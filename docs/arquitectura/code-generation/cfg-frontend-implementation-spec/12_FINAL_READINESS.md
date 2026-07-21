# CFG — Final Readiness (Implementation Spec)

**Versión:** 1.0  
**Fecha:** 2026-07-17  
**Estado:** **SPECIFICATION CERRADA — LISTA PARA WAVE 0**

---

## 1. Cobertura de los 30 puntos del objetivo

| # | Requisito | Doc |
|---|-----------|-----|
| 1 | Archivo por archivo | 01 |
| 2 | Responsabilidad exacta | 01–07 |
| 3 | Imports esperados | 02–05, 07 |
| 4 | Exports públicos | 01–07 |
| 5 | Dependencias entre archivos | 01 |
| 6 | Props componentes | 03 |
| 7 | Estado interno componentes | 02, 03 |
| 8 | Eventos/callbacks | 02, 03 |
| 9 | Hooks consumidos | 02, 04 |
| 10 | Services | 05 |
| 11 | Query Keys | 04 |
| 12 | Invalidaciones | 04, 07 |
| 13 | Loading | 02, 03 |
| 14 | Error | 02, 03, 07 |
| 15 | Empty | 02 |
| 16 | Dirty | 02, 03, 07 |
| 17 | ConfirmDialogs | 02 |
| 18 | Responsive | 02, 03 |
| 19 | Accesibilidad | 02, 03 |
| 20 | Fixtures | 08 |
| 21 | Mocks | 08 |
| 22 | Casos prueba por archivo | 08 |
| 23 | Orden implementación | 01, Blueprint 08 |
| 24 | PR strategy waves | 09 |
| 25 | Riesgos implementación | 10 |
| 26 | Review checklist waves | 10 |
| 27 | Acceptance waves | 11 |
| 28 | Criterios merge | 09, 11 |
| 29 | Rollback | 09, 11 |
| 30 | DoD archivo/wave | 01, 11, este doc |

---

## 2. Consistencia con artefactos previos

| Artefacto | ¿Respeta Spec? |
|-----------|:--------------:|
| Contrato BE | Sí — 6 endpoints, errores, RBAC |
| Auditoría AS-IS | Sí — shell app, patrones ORG/INV |
| Diseño funcional D1–D20 | Sí — sin Create, sin empresa_id UI, dialogs |
| Blueprint técnico | Sí — mismas carpetas/waves/keys |

**Cambios de arquitectura introducidos:** **ninguno**.

**Aclaración operativa (no arquitectónica):** Spec fija `invalidate` detail en update en lugar de `setQueryData` frágil por tenantId (`04_HOOK_SPECIFICATION`) — compatible con Blueprint (invalidate list+detail permitido).

---

## 3. Pipeline

```text
Contrato → Audit → Diseño funcional → Blueprint → Implementation Spec (ESTE)
                                                      ↓
                                              Wave 0 código (SIGUIENTE)
```

---

## 4. Checklist previo inmediato a Wave 0

- [x] Spec 00–12 publicada
- [ ] Branch `feat/cfg-wave0-foundation` creada
- [ ] Implementador leyó Blueprint 08 + Spec 01 Wave 0
- [ ] (Ideal) OpenAPI snapshot / deuda tipada aceptada
- [ ] Ambiente con LBAC cfg disponible para smoke A0.1

---

## 5. Definition of Done — Specification

- [x] Docs mínimos 00–12
- [x] Plan archivo×wave
- [x] Props/estado/hooks/services/tests/PRs
- [x] Sin código TypeScript/React
- [x] Sin contradicción Blueprint

---

## 6. Dictamen de cierre

### ¿La Specification quedó completamente definida?

**SÍ.**

Queda especificado qué archivo crear, en qué wave, con qué exports, props, estados, hooks, tests, PRs, review, aceptación, merge y rollback.

### ¿El proyecto está listo para iniciar la implementación de Wave 0?

**SÍ.**

La siguiente acción autorizada es implementar **Wave 0** según:

1. `docs/arquitectura/code-generation/cfg-frontend-blueprint/08_IMPLEMENTATION_WAVES.md` §2  
2. Este paquete `01_FILE_IMPLEMENTATION_PLAN.md` § Wave 0  
3. Checklists `10` / `11` Wave 0  

**No** iniciar Wave 1 hasta merge + acceptance de Wave 0.

---

## 7. Firma documental

| Artefacto | Estado |
|-----------|--------|
| Contrato BE | CERTIFICADO |
| Audit FE | CERRADA |
| Diseño funcional | APROBADO |
| Blueprint técnico | APROBADO |
| **Implementation Spec** | **CERRADA / LISTA PARA WAVE 0** |
| Código `src/features/cfg` | **PENDIENTE WAVE 0** |
