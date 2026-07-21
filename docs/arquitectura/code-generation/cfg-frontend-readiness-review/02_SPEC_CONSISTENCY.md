# CFG Readiness — Spec Consistency

**Versión:** 1.0

---

## 1. Contrato ↔ Blueprint (§1)

| Tema contrato | Blueprint | Match |
|---------------|-----------|:-----:|
| Base `/api/v1/cfg` + `/secuencias` | Service BASE | Sí |
| 6 operationIds | Service 6 métodos | Sí |
| Permisos consultar/actualizar | CFG_PERMISSIONS | Sí |
| Sin create / align / fiscal | Fuera de alcance | Sí |
| PATCH solo formato | Service + form utils | Sí |
| DELETE + POST reactivar | Mutations | Sí |
| Preview sin consume | Preview no invalidate | Sí |
| List page/envelope | forcePagination Tier B | Sí |
| `config_locked` / preview flags | UI Spec W4/W5 | Sí |
| Filtro API `empresa_id` | UI omitida (D8) — tipo reservado | Sí (consciente) |

**PASS.** El Blueprint no inventa endpoints ni reduce el MVP.

---

## 2. Blueprint ↔ Specification (§2)

| Tema Blueprint | Spec | Match |
|----------------|------|:-----:|
| Árbol carpetas | Plan 01 idéntico | Sí |
| Waves 0–5 | Spec + PR strategy | Sí |
| Query keys `['cfg',…]` | Hook Spec 04 | Sí |
| Auth wiring 3 archivos | Spec 01 §2.10 | Sí |
| Componentes nuevos | Spec 03 | Sí |
| Routing `/app/cfg/secuencias` | Spec W0 + page | Sí |
| Update cache | Spec: invalidate list+detail (vs prefer setQueryData en Blueprint/Diseño) | **Aclaración operativa** |

### Aclaración operativa (no es divergencia arquitectónica)

- Diseño/Blueprint permiten setQueryData en PATCH.
- Spec **elige** invalidate detail + apply mutation response en dialog (evita keys con `tenantId`).
- Compatible con matriz de invalidación Blueprint (invalidate list+detail permitido).
- **PASS con nota** — implementadores deben seguir Spec 04 como norma de código.

### W3 sin dialogs

- Blueprint W3 permitía Preview placeholder; Spec fija W3 listado estricto sin dialogs.
- **Más restrictivo, no contradictorio** — PASS.

---

## 3. Diseño funcional ↔ resto

Decisiones D1–D20 trazadas en Blueprint T* y Spec (Create no, empresa_id no, tenant-first, dual RBAC, Preview dialog, dirty B11). **PASS.**

---

## 4. Audit ↔ implementación planeada

La audit pedía cerrar gaps de diseño; el diseño los cerró; Blueprint/Spec los operativizan. No quedan preguntas abiertas de arquitectura en la cadena. **PASS.**

---

## 5. Inconsistencias menores (no bloquean)

| Item | Severidad | Notas |
|------|:---------:|-------|
| OpenAPI path citado vs ausencia archivo | Baja | Deuda tipado; contrato §7 basta W0 |
| Nombre acción RQ `'org-inv'` | Baja | Watch W2 (ver 03) |
| Comentario ERP “27 módulos” | Cosmético | Actualizar conteo en W0 |

---

## 6. Veredicto consistencia documental

**PASS GLOBAL.** La cadena Contrato → Audit → Diseño → Blueprint → Spec es coherente y apta para implementación Wave 0.
