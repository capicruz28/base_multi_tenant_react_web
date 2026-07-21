# CFG — Testing Blueprint

**Versión:** 1.0  
**Stack asumido:** Vitest + Testing Library (patrón repo INV/ORG)

---

## 1. Pirámide

| Capa | Qué | Prioridad |
|------|-----|:---------:|
| Unit utils | form payload, dirty, error map, display | P0 |
| Unit service | 6 métodos, params, bodies | P0 |
| Hooks | list enabled, invalidate matrix, preview no-invalidate | P0 |
| Component/Page | RBAC visibility, RB-ROW, empty/loading, B11 stack | P1 |
| E2E staging | Menú + permisos reales | P2 (QA ops) |

---

## 2. Casos P0 — Utils

| Caso | Assert |
|------|--------|
| build PATCH solo dirty fields | no envía iguales a baseline |
| build PATCH vacío | detecta / bloquea |
| prefijo uppercase / max 10 | validación local |
| separador solo `''`\|`'-'` | reject otros |
| map `CFG_PREFIX_INVALID` → field prefijo | mensaje contrato |
| map `ORG_EMPRESA_CFG_LOCKED` → locked mode | flag |
| map `PREVIEW_NOT_ALLOWED` | flag preview |
| scope label | no UUID |

---

## 3. Casos P0 — Service

| Caso | Assert |
|------|--------|
| list envía `page`+`limit` | query |
| list omite params undefined | query limpio |
| update PATCH body subset | no `es_activo` |
| desactivar DELETE sin body | method |
| reactivar POST path `…/reactivar` | url |
| preview POST sin body | url |

Mock: axios / `api` module.

---

## 4. Casos P0 — Hooks

| Caso | Assert |
|------|--------|
| list queryKey contiene `cfg`,`secuencias`,`list` | key |
| update onSuccess invalida list | `invalidateQueries` called |
| preview onSuccess **no** invalida list | not called con list key |
| desactivar/reactivar invalidan list+detail | called |
| detail enabled false sin id | no fetch |

Usar `QueryClient` wrapper de tests del repo.

---

## 5. Casos P1 — UI

| Caso | Assert |
|------|--------|
| sin `actualizar` → no Guardar/Desactivar/Reactivar | queryByRole null |
| fila activa → Desactivar no Reactivar | |
| fila inactiva → Reactivar no Desactivar | |
| `config_locked` → sin mutaciones | |
| `supports_preview=false` → sin Preview | |
| empty hasSearch copy | texto |
| skeleton cuando loading | |
| Confirm desactivar copy | texto contrato |
| dirty close → discard dialog | |
| B11-10: no Confirm+Dialog open juntos | estado |

---

## 6. Fixtures

Crear fixtures de test (en Spec/impl):

- `secuenciaActiva`
- `secuenciaInactiva`
- `secuenciaLocked` (`config_locked`, tipicamente `org_empresa`)
- `secuenciaDrift`
- `previewResponse` con disclaimer

Sin datos de producción reales.

---

## 7. Qué no testear en FE unitario

- Lógica Backend de allocate.
- Menú super-admin.
- FCE registry.
- Visual pixel-perfect.

---

## 8. Comandos (impl)

Alinear a scripts del repo, p. ej.:

```text
vitest run src/features/cfg
```

Gate Wave: tests de la wave en verde antes de mergear la siguiente.
