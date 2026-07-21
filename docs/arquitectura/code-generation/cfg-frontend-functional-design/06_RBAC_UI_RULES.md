# CFG — Reglas RBAC de UI

**Versión:** 1.0  
**Códigos:** `cfg.secuencias.consultar` · `cfg.secuencias.actualizar`  
**Hook acciones:** `usePermission().hasPermission`  
**Hook / guard módulo:** `PermissionGuard` LBAC + gate página

---

## 1. Estrategia dual (decisión D9 / D10)

| Capa | Mecanismo | Código / acción |
|------|-----------|-----------------|
| Shell `/app` | `ProtectedRoute requireOperationalUser` | Sesión ERP |
| Ruta módulo | `PermissionGuard module="cfg" action="ver"` | LBAC menú |
| Entrada página | `hasPermission('cfg.secuencias.consultar')` | Si false → `/unauthorized` o empty acceso denegado |
| Acciones mutación | `hasPermission('cfg.secuencias.actualizar')` | Ocultar botones |

**Defensa en profundidad:** 403 API siempre manejado; UI no es la única barrera.

**Prerequisito plataforma:** el menú Backend debe asignar LBAC `cfg.ver` (o equivalente) coherente con roles que reciben `cfg.secuencias.consultar`. Si un usuario tiene código pero no LBAC, no pasará `PermissionGuard` — coordinar en Blueprint/ops.

---

## 2. Perfiles de experiencia

### P1 — Sin consultar

- Sin ítem de menú (Backend) y/o ruta bloqueada.
- No usable el módulo.

### P2 — Solo lectura (`consultar` sin `actualizar`)

| Capacidad | Permitido |
|-----------|:---------:|
| Listar / filtrar / sort / paginar | Sí |
| Abrir dialog (ver) | Sí |
| Preview | Sí* |
| Guardar | No |
| Desactivar / Reactivar | No |

\*Si `supports_preview !== false`.

Copy: no mostrar botones ocultos como disabled “por permiso” en destructivas; **ocultar** (RB-02 espíritu).

### P3 — Lectura + actualización

| Capacidad | Condición extra |
|-----------|-----------------|
| Guardar | `!config_locked` y dirty válido |
| Desactivar | activa + `!config_locked` |
| Reactivar | inactiva + `!config_locked` |
| Preview | igual que P2 |

### P4 — Locked (`config_locked`) aunque tenga `actualizar`

- Igual que solo lectura para mutaciones.
- Banner locked.
- Preview sí.

---

## 3. Matriz control × permiso × estado

| Control | consultar | actualizar | activa | locked | supports_preview |
|---------|:---------:|:----------:|:------:|:------:|:----------------:|
| Ver listado | ✓ | — | — | — | — |
| Abrir dialog | ✓ | — | — | — | — |
| Preview | ✓ | — | — | — | ≠ false |
| Campos formato editables | ✓ | ✓ | — | ✗ | — |
| Guardar | ✓ | ✓ | — | ✗ | — |
| Desactivar | ✓ | ✓ | ✓ | ✗ | — |
| Reactivar | ✓ | ✓ | ✗ | ✗ | — |
| Crear | — | — | — | — | — **Nunca** |

---

## 4. Etiquetas de botón según permiso

| Contexto | Con `actualizar` y !locked | Solo `consultar` o locked |
|----------|----------------------------|---------------------------|
| Fila activa | “Editar” (Pencil) | “Ver” (Eye) |
| Fila inactiva | “Ver” + “Reactivar” | “Ver” |
| Dialog título | “Editar secuencia” | “Ver secuencia” |

---

## 5. Mensajes RBAC

| Situación | Mensaje |
|-----------|---------|
| 403 API | “No tienes permiso para esta acción.” (o detail API) |
| Gate página sin consultar | Redirección unauthorized / “Sin acceso a secuencias de código.” |
| Locked click intento | No debería haber botón; si race: “Esta secuencia está bloqueada…” |

---

## 6. Constantes (conceptual Blueprint)

```text
CFG_PERMISSIONS = {
  SECUENCIAS_CONSULTAR: 'cfg.secuencias.consultar',
  SECUENCIAS_ACTUALIZAR: 'cfg.secuencias.actualizar',
}
```

*(No implementar en este paquete.)*

---

## 7. Qué no mezclar

- No usar solo `can('cfg','editar')` para Guardar (el contrato es código punteado).
- No mapear Desactivar a `can('cfg','eliminar')` como única fuente — el permiso de negocio es `actualizar`.
- LBAC `ver` abre el módulo; **consultar** confirma; **actualizar** muta.
