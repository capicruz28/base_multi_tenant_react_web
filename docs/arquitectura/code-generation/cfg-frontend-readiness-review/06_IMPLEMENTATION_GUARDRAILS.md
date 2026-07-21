# CFG Readiness — Implementation Guardrails

**Versión:** 1.0  
**Audiencia:** implementadores y reviewers de Waves 0–5

---

## 1. Fuentes de verdad (orden)

1. `docs/frontend-contracts/cfg/`
2. Diseño funcional (D1–D20)
3. Blueprint técnico
4. **Implementation Spec** (norma de código archivo-a-archivo)
5. Esta Readiness Review (no cambia decisiones)

Si Spec y Blueprint difieren en cache PATCH → **seguir Spec 04** (invalidate).

---

## 2. Guardrails absolutos

| # | MUST NOT |
|---|----------|
| G1 | Inventar endpoints / Create UI / align / fiscal series |
| G2 | PATCH `es_activo` |
| G3 | Importar `@/core/codigo` / FCE engine |
| G4 | Company query gate / selector “Todas las empresas” |
| G5 | Filtro toolbar `empresa_id` en MVP |
| G6 | Fetch Axios desde pages |
| G7 | Toast error API fuera de `onError` mutation |
| G8 | Invalidar listado en Preview |
| G9 | Mostrar UUID en UI |
| G10 | Saltar waves o mezclar W0+W3 en un PR |

---

## 3. Guardrails Wave 0 específicos

| # | Regla |
|---|-------|
| W0-a | Page = **stub** solamente (sin ErpList real) |
| W0-b | Registrar CFG en ERP_MODULES + ERP_ROUTE_SEGMENTS |
| W0-c | `PermissionGuard module="cfg" action="ver"` |
| W0-d | Types sin `any`; sin `cliente_id` en Read |
| W0-e | No tocar auth invalidate (eso es W2) |
| W0-f | No crear service/hooks aún |

---

## 4. Checklist pre-commit mental (cada PR)

- [ ] ¿Esta wave según Spec 01?
- [ ] ¿Tests exigidos por Spec 08 para esta wave?
- [ ] ¿Review Spec 10 de la wave?
- [ ] ¿Acceptance Spec 11?
- [ ] ¿Sin archivos prohibidos?

---

## 5. Escalación

Contrato BE cambia → **STOP** implementación → actualizar contrato → enmendar diseño/blueprint/spec → reanudar.

No “arreglar” en silencio desviaciones de arquitectura en el PR.
