# CFG — Implementation Checklists

**Versión:** 1.0

---

## 1. Checklist previo a implementación (antes de Wave 0 código)

### Documentación

- [x] Contrato Backend `docs/frontend-contracts/cfg/` disponible
- [x] Auditoría AS-IS cerrada
- [x] Diseño funcional aprobado
- [x] Blueprint técnico cerrado (este paquete)
- [ ] **Specification de Implementación** creada/aprobada (siguiente paso)

### Plataforma / datos

- [ ] OpenAPI snapshot CFG accesible (P1) — o deuda tipada explícita aceptada
- [ ] Roles de prueba con `cfg.secuencias.consultar` / `.actualizar` (P4)
- [ ] LBAC menú `cfg` + ítem “Secuencias de código” con ruta `/app/cfg/secuencias` (P3)
- [ ] Ambiente API con secuencias seed (incl. una `config_locked`)

### Equipo

- [ ] Waves `08` acordadas como plan de PRs
- [ ] Referencias ORG/INV/WMS asignadas al implementador
- [ ] Claridad: no tocar FCE

---

## 2. Checklist por wave (resumen)

| Wave | Exit gate |
|------|-----------|
| 0 | Ruta stub + registros ERP |
| 1 | Service 6 métodos + tests utils |
| 2 | Hooks + invalidate matrix tests |
| 3 | Listado read UX completo |
| 4 | Edit + PATCH + lifecycle |
| 5 | Preview + DoD |

Detalle: `08_IMPLEMENTATION_WAVES.md`.

---

## 3. Checklist posterior a implementación (módulo completo)

### Funcional / contrato FE

Usar también `docs/frontend-contracts/cfg/07_IMPLEMENTATION_CHECKLIST.md` secciones A–J.

Resumen:

- [ ] Menú/ruta exigen consultar
- [ ] Solo lectura sin actualizar
- [ ] List GET + filtros MVP + page envelope
- [ ] Detail GET + locked UX
- [ ] PATCH solo campos formato
- [ ] DELETE / reactivar correctos + confirms
- [ ] Preview + disclaimer + no invalidate
- [ ] Errores mapa contrato
- [ ] Sin create/align/fiscal
- [ ] 6 operationIds usados

### Norma V2

- [ ] TB-01/02, SR, SK, ES, LR, PR, RB-ROW, B11, ME-02, UX-01, ER-02, E-ME4

### Técnico

- [ ] `ERP_MODULES` + `ERP_ROUTE_SEGMENTS` + `app-route-tree`
- [ ] Feature bajo `src/features/cfg` sin leaks FCE
- [ ] Tests P0/P1 verdes
- [ ] `tsc` / lint del feature OK
- [ ] Invalidación cfg en cambio sesión verificada

### UX smoke manual

- [ ] Listar / filtrar / ordenar / paginar
- [ ] Editar formato y ver list refresh
- [ ] Desactivar / reactivar
- [ ] Preview inactiva y activa
- [ ] Locked sin mutaciones
- [ ] Usuario solo consultar

---

## 4. Definition of Done (módulo CFG Frontend MVP)

El módulo se considera **DONE** cuando:

1. Waves 0–5 mergeadas.
2. Checklist §3 completo.
3. Checklist contrato `07` A–J verificable en integración.
4. No existen superficies fuera de alcance (create/align/etc.).
5. Blueprint + diseño funcional no tienen desviaciones no documentadas.
6. Sign-off de review técnico (PR final Wave 5).

---

## 5. No-DoD (explícito)

No bloquean DoD Frontend MVP:

- E2E Playwright/Cypress suite completa
- Codegen OpenAPI
- Filtro `empresa_id` UI
- Extracción Badge a design system
