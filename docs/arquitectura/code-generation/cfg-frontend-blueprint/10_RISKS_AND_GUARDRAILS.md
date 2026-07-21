# CFG — Riesgos técnicos y guardrails

**Versión:** 1.0

---

## 1. Riesgos técnicos

| ID | Riesgo | Severidad | Mitigación Blueprint |
|----|--------|:---------:|----------------------|
| TR1 | OpenAPI snapshot ausente → types incompletos | Media | Wave 0 tipar contrato; alinear al llegar snapshot |
| TR2 | LBAC `cfg.ver` ≠ `consultar` | Alta | Gate doble; coordinar roles (P4) |
| TR3 | Copiar company gate INV | Alta | Prohibido en hooks (T8) |
| TR4 | PATCH `es_activo` por hábito CRUD | Alta | Service tests + review checklist |
| TR5 | Invalidar list en Preview | Media | Test hook P0 |
| TR6 | Importar FCE en admin | Media | Import ban en review |
| TR7 | Menú Backend ausente | Media | Ruta existe; QA menú bloqueado hasta P3 |
| TR8 | B11-10 stack dialogs | Media | Page orchestration tests |
| TR9 | Mostrar UUID scope | Baja | `cfg-display.utils` + E-ME4 review |
| TR10 | Implementar Create “por si acaso” | Alta | Fuera de alcance; reject PR |

---

## 2. Guardrails (MUST / MUST NOT)

### MUST

1. Usar solo los 6 operationIds del contrato.
2. `forcePagination: true` en list config.
3. Toast error API en `onError` mutation.
4. Vocabulario Desactivar/Reactivar.
5. Ocultar mutaciones sin `actualizar` o con `config_locked`.
6. Cerrar Edit antes de Confirm lifecycle.
7. Invalidar `['cfg']` en logout/cambio tenant.

### MUST NOT

1. Crear UI de nueva secuencia.
2. Endpoints inventados / deprecated.
3. `any` en types CFG.
4. Company selector / “Todas las empresas”.
5. Filtro `empresa_id` en toolbar MVP.
6. Modificar `src/core/codigo` para este módulo.
7. Fetch en `useEffect` bypassing RQ.
8. Prometer en copy que Preview reserva código.

---

## 3. Guardrails de review (PR)

Cada PR de wave debe responder:

- [ ] ¿Cumple wave exit criteria?
- [ ] ¿Tests P0 de la wave?
- [ ] ¿Sin create / sin FCE coupling?
- [ ] ¿Keys/invalidación según `05`?
- [ ] ¿RBAC según `06` funcional + `03` routing?

---

## 4. Deuda aceptada temporalmente

| Deuda | Hasta cuándo |
|-------|--------------|
| Types sin snapshot completo | P1 resuelto |
| Sin E2E automatizado | Post-MVP QA |
| Preview no en shared UI kit | Indefinido (YAGNI) |

---

## 5. Escalación

Si el Backend cambia contrato MVP v1.0:

1. **Stop** implementación.
2. Actualizar `docs/frontend-contracts/cfg/` primero.
3. Actualizar diseño funcional / Blueprint vía enmienda versionada.
4. Luego código.
