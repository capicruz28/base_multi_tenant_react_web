# CFG — Acceptance Criteria por Wave

**Versión:** 1.0  
**Uso:** QA / autor valida antes de merge

---

## Wave 0 — Acceptance

| ID | Criterio | Pass |
|----|----------|:----:|
| A0.1 | Usuario con LBAC cfg.ver abre `/app/cfg/secuencias` y ve stub | |
| A0.2 | Usuario sin permiso módulo → unauthorized o bloqueo guard | |
| A0.3 | `/app/cfg` redirige a secuencias | |
| A0.4 | Legacy `/cfg/secuencias` mapea a `/app/cfg/…` (si aplica mapLegacy) | |
| A0.5 | No errores tsc por registros | |

**DoD Wave 0:** todos A0.* + review W0.

---

## Wave 1 — Acceptance

| ID | Criterio | Pass |
|----|----------|:----:|
| A1.1 | Tests service cubren 6 operationIds | |
| A1.2 | Test demuestra PATCH sin es_activo | |
| A1.3 | Test preview POST sin body | |
| A1.4 | Utils validación/prefijo/error codes | |

**DoD Wave 1:** A1.* + review W1.

---

## Wave 2 — Acceptance

| ID | Criterio | Pass |
|----|----------|:----:|
| A2.1 | List hook paginado (page siempre) | |
| A2.2 | Detail hook enabled gate | |
| A2.3 | Update/Desactivar/Reactivar invalidan list | |
| A2.4 | Preview no invalida list (test) | |
| A2.5 | Cambio sesión invalida cfg (código wiring presente) | |

**DoD Wave 2:** A2.* + review W2.

---

## Wave 3 — Acceptance

| ID | Criterio | Pass |
|----|----------|:----:|
| A3.1 | Listado muestra columnas acordadas | |
| A3.2 | Filtros módulo/estado/ámbito/buscar funcionan | |
| A3.3 | Paginación y sort whitelist | |
| A3.4 | Empty/loading/error visibles | |
| A3.5 | Sin Crear; sin filtro empresa | |
| A3.6 | Solo consultar puede ver página | |

**DoD Wave 3:** A3.* + review W3.

---

## Wave 4 — Acceptance

| ID | Criterio | Pass |
|----|----------|:----:|
| A4.1 | Abrir Ver/Editar carga detail | |
| A4.2 | Guardar actualiza y toast | |
| A4.3 | Locked no permite mutar | |
| A4.4 | Solo consultar: readonly | |
| A4.5 | Desactivar confirm + estado inactiva en list | |
| A4.6 | Reactivar confirm + estado activa | |
| A4.7 | Dirty discard funciona; B11-10 ok | |
| A4.8 | 422 campo muestra error bajo input | |

**DoD Wave 4:** A4.* + review W4.

---

## Wave 5 — Acceptance

| ID | Criterio | Pass |
|----|----------|:----:|
| A5.1 | Preview muestra codigo_estimado + disclaimer | |
| A5.2 | Indica no consume correlativo | |
| A5.3 | Inactiva: aviso + preview ok | |
| A5.4 | supports_preview false / NOT_ALLOWED: sin botón usable | |
| A5.5 | List ultimo_numero no cambia solo por preview | |
| A5.6 | a11y básica acciones | |
| A5.7 | Checklist contrato 07 A–J | |

**DoD Wave 5 / módulo:** A5.* + review W5 + Definition of Done Blueprint `11` §3.

---

## Acceptance criterios de rollback (ops)

Si tras merge de Wave N falla aceptación en staging:

1. No mergear Wave N+1.
2. Revert PR Wave N.
3. Reabrir issues con evidencia.
4. Re-ejecutar acceptance de Wave N-1 como baseline sana.
