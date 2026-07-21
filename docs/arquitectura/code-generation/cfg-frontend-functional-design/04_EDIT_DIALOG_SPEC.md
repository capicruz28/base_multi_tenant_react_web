# CFG — Especificación Dialog de edición

**Versión:** 1.0  
**Nombre funcional:** `CfgSecuenciaEditDialog`  
**Patrón:** Modal CRUD A+ (ORG) · Tipo B dirty (B11)

---

## 1. Apertura y cierre

| Evento | Comportamiento |
|--------|----------------|
| Abrir | Desde fila (Ver/Editar) → `open=true` → `GET` detalle |
| Título | Activa: “Editar secuencia” / Solo lectura: “Ver secuencia” + `sequence_key` en description |
| Cerrar limpio | Cancelar / X si no dirty |
| Cerrar dirty | Discard confirm (B11-01) |
| Tras save OK | Cerrar dialog (B11-07) **o** permanecer abierto con baseline reset — **Decisión:** permanecer abierto con datos frescos (admin itera Preview); Cancelar/X cierra |
| Tras 404 | Cerrar + toast + invalidar listado |

**Decisión D5b:** tras PATCH exitoso el dialog **permanece abierto** con response aplicado y dirty=false, para facilitar Preview inmediato. El usuario cierra manualmente.

---

## 2. Carga de detalle (GET Detail)

| Paso | Detalle |
|------|---------|
| Trigger | Apertura dialog con `secuencia_id` |
| Request | `GET /api/v1/cfg/secuencias/{secuencia_id}` |
| operationId | `get_cfg_codigo_secuencia` |
| UI | `loading_detail` — skeleton o spinner en `DialogBody` |
| 200 | Poblar form + snapshot baseline |
| 404 | “La secuencia no existe o no está disponible.” → cerrar |
| 403 | Toast permiso → cerrar |

Preferir detalle fresco al abrir (evitar PATCH sobre stale).

---

## 3. Secciones del formulario

### 3.1 Banner / badges (arriba)

- Si `config_locked`: banner warning — “Esta secuencia está bloqueada y no se puede modificar.”
- Badges: Activa/Inactiva, Bloqueada, Drift (mismo criterio que listado).

### 3.2 Identidad (siempre readonly)

| Campo | Presentación |
|-------|--------------|
| `sequence_key` | Texto destacado |
| `modulo_codigo` | Texto / badge |
| `scope_type` | Label humanizado |
| Scope refs | Nombre empresa / almacén / PV si API enriquece; si solo hay ID → **"—"** (nunca UUID visible) |

### 3.3 Contador y política (siempre readonly)

| Campo | Presentación |
|-------|--------------|
| `ultimo_numero` | Número |
| `generation_policy` | Texto |
| `fecha_creacion` / `fecha_actualizacion` | Fecha localizada |

### 3.4 Formato (editable condicional)

Editable solo si `hasPermission(actualizar)` **y** `config_locked === false`.

| Campo | Control | Validación local |
|-------|---------|------------------|
| `prefijo` | Input text | Máx 10; alfanumérico; visual `uppercase` |
| `separador` | Select: `(vacío)` \| `-` | Solo esos valores |
| `longitud_numero` | Input number | Entero ≥ 1 |
| `numero_inicial` | Input number | Entero ≥ 1; **permitido** ≤ `ultimo_numero` |

Layout: grid 2 columnas en desktop; 1 col en móvil (`DialogBody` scroll MD-05).

---

## 4. Footer de acciones

| Botón | Visible si | Variante |
|-------|------------|----------|
| Preview | `consultar` y `supports_preview !== false` | Outline |
| Desactivar | `actualizar` y activa y !locked | Outline danger-ish / secondary |
| Reactivar | `actualizar` y inactiva y !locked | Outline |
| Cancelar | Siempre | Ghost/outline |
| Guardar | `actualizar` y !locked | Primary brand |

Orden sugerido (izq → der): Preview · spacer · Desactivar/Reactivar · Cancelar · Guardar.

Durante `saving` / `toggling_active`: deshabilitar mutaciones del dialog.

---

## 5. Flujo PATCH (Guardar)

| Paso | Detalle |
|------|---------|
| Payload | Solo campos modificados respecto baseline |
| Vacío | No enviar; mensaje “Indique al menos un campo a modificar.” |
| Request | `PATCH /api/v1/cfg/secuencias/{id}` |
| operationId | `update_cfg_codigo_secuencia` |
| Body | Subset de `prefijo`, `separador`, `longitud_numero`, `numero_inicial` |
| 200 | Toast “Configuración actualizada.”; merge response; reset baseline; **invalidar listado** |
| 422 campo | Error bajo campo (`CFG_PREFIX_*`, etc.) |
| 422 locked | Banner + modo readonly + refetch detail |
| 403/404 | Según `03_ERROR_HANDLING` contrato |

**Prohibido** en body: `es_activo`, `ultimo_numero`, identity, policy.

Toast error API: solo en `onError` del mutation (ER-02).

---

## 6. Dirty form (B.1.1)

| Regla | Aplicación |
|-------|------------|
| Baseline | Snapshot al cargar detail 200 |
| Compare | Solo campos editables de formato |
| Helpers | Patrón `isDirtyAgainstBaseline` / discard ORG |
| ESC / overlay | `preventDefault` si dirty (B11-06) |
| Submitting | No cerrar (B11-05) |
| Textos discard | “Seguir editando” / “Sí, descartar” (B11-04) |

Si modo solo lectura (sin `actualizar` o locked): dirty siempre false; cierre directo.

---

## 7. Desactivar / Reactivar desde el dialog

1. Usuario confirma intención.
2. **Cerrar** Edit Dialog.
3. Abrir `ConfirmDialog` correspondiente.
4. Ejecutar DELETE o POST reactivar.
5. Invalidar listado (+ detail).
6. No reabrir Edit automáticamente (usuario puede volver a abrir la fila).

### Copy confirmaciones

**Desactivar** (`danger`):

- Título: “Desactivar secuencia”
- Cuerpo: “¿Desactivar esta secuencia? No se eliminará; podrá reactivarla después.”
- Confirm: “Desactivar”

**Reactivar** (`info`):

- Título: “Reactivar secuencia”
- Cuerpo: “¿Reactivar esta secuencia?”
- Confirm: “Reactivar”

Toasts éxito: “Secuencia desactivada.” / “Secuencia reactivada.”

---

## 8. Modo solo lectura

Activado cuando:

- Solo permiso `consultar`, o
- `config_locked === true`

Comportamiento:

- Inputs formato disabled o texto estático.
- Sin Guardar / Desactivar / Reactivar.
- Preview permitido si aplica.
- Banner locked si corresponde.

---

## 9. Accesibilidad del dialog

- `DialogTitle` / `DialogDescription` presentes.
- Foco inicial en primer campo editable o en Preview/Cerrar si readonly.
- Labels asociados a inputs.
- Errores de campo con `aria-invalid` / texto vinculado.
- Botones con nombre accesible (no solo icono).
