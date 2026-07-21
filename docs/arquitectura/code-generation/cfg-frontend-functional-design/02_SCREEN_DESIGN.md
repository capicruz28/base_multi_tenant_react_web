# CFG — Diseño de pantallas y layout

**Versión:** 1.0

---

## 1. Ubicación en el menú ERP

| Atributo | Valor |
|----------|-------|
| Shell | `app` (ERP operativo) |
| Layout chrome | `AppLayout` → `NewLayout variant="app"` |
| Fuente menú | `GET /auth/menu` (dinámico) |
| Etiqueta ítem | **Secuencias de código** |
| Ruta menú / SPA | `/app/cfg/secuencias` |
| Módulo catálogo | `CFG` (permissionModule `cfg`) |
| Sección sugerida | Módulo CFG (o sección Configuración del tenant si el menú Backend así lo agrupa) |

**Nota:** la creación del ítem es responsabilidad Backend/plataforma. El Frontend solo consume la `ruta` y debe registrar la ruta SPA coincidente en implementación futura.

---

## 2. Arquitectura de pantallas

| Superficie | Tipo | Path / anclaje |
|------------|------|----------------|
| Listado | Página única Plantilla A | `/app/cfg/secuencias` |
| Detalle / edición | Dialog modal | Overlay sobre listado |
| Preview | Dialog modal | Overlay (independiente) |
| Desactivar | `ConfirmDialog` danger | Nivel página |
| Reactivar | `ConfirmDialog` info | Nivel página |
| Discard dirty | `OrgDiscardConfirmDialog` | Nivel página |

**Decisión D5:** no hay ruta `/app/cfg/secuencias/:id`. El detalle siempre es modal (patrón ORG/INV catálogo).

---

## 3. Layout de página

```text
┌─────────────────────────────────────────────────────────────┐
│  Shell: Sidebar | Header | Breadcrumb (fuera del body)       │
├─────────────────────────────────────────────────────────────┤
│  BODY (sin H1)                                               │
│  ┌─ ErpListToolbar ───────────────────────────────────────┐ │
│  │  [Filtros…] [Buscar]              [Limpiar filtros]     │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─ Tabla (ErpListTableShell) ────────────────────────────┐ │
│  │  thead sortable | tbody rows | empty | skeleton        │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─ ErpPagination ────────────────────────────────────────┐ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

- Contenedor de página: equivalente a `OrgPageLayout` / `InvPageLayout` (wrapper mínimo, `bg-page`).
- Toolbar: `justify-between` (TB-02).
- Sin botón “Nuevo” / “Crear”.

---

## 4. Jerarquía de dialogs (reglas de stack)

| Prioridad | Regla |
|-----------|-------|
| 1 | Solo un Radix Dialog “de trabajo” abierto a la vez (Edit **o** Preview). |
| 2 | Antes de cualquier `ConfirmDialog`, cerrar Radix Dialog (B11-10 / B11-11). |
| 3 | `discardPending` y confirm baja/reactivar son independientes (B11-02). |
| 4 | Con `discardPending !== null`, deshabilitar toolbar/búsqueda/acciones fila (B11-03). |

### Secuencias válidas

- Edit → Cancel dirty → cerrar Edit → Discard confirm.
- Edit → Desactivar → cerrar Edit → Confirm danger.
- List row → Preview (sin Edit abierto).
- Edit → Preview: **cerrar Edit primero** (o abrir Preview solo desde fila). **Decisión:** Preview se dispara desde **fila** y desde **footer del Edit** (si Edit abierto y usuario pide Preview, se mantiene Edit debajo solo si no hay Confirm; preferible: Preview como dialog hermano — ver §4.1).

### 4.1 Preview desde Edit

**Decisión:** Preview puede abrirse desde el Edit Dialog **sin cerrar** el Edit (lectura no destructiva). No hay Confirm en medio. Ambos Radix abiertos en stack: Preview encima; al cerrar Preview, Edit permanece.  
Si el usuario dispara Desactivar desde Edit: **cerrar Edit** → Confirm (B11-11). Preview no debe quedar abierto.

---

## 5. Wireframe conceptual — Dialog Edición

```text
┌─ Secuencia: {sequence_key} ──────────────────── [X] ─┐
│  [Banner locked si config_locked]                     │
│  [Badges: Activa|Inactiva] [Bloqueada] [Drift]        │
│  ── Identidad (readonly) ──                           │
│  sequence_key | modulo | scope_type | scope labels    │
│  ── Contador / política (readonly) ──                 │
│  ultimo_numero | generation_policy | auditoría        │
│  ── Formato (editable si aplica) ──                   │
│  prefijo | separador | longitud_numero | numero_inicial│
│                                                       │
│  [Preview]     [Desactivar|Reactivar]  [Cancelar][Guardar]│
└───────────────────────────────────────────────────────┘
```

---

## 6. Wireframe conceptual — Dialog Preview

```text
┌─ Código estimado ────────────────────────────── [X] ─┐
│  (loading spinner si previewing)                      │
│                                                       │
│         EMP-00042                                     │
│                                                       │
│  Disclaimer (API)                                     │
│  No consume correlativo                               │
│  [Aviso si secuencia inactiva]                        │
│                                                       │
│                                        [Cerrar]       │
└───────────────────────────────────────────────────────┘
```

---

## 7. Tokens visuales

| Elemento | Capa |
|----------|------|
| Fondo página / surface tabla | Capa 1 (`bg-page`, `bg-surface`, `bg-subtle`) |
| Texto / bordes | Capa 1 (`text-text-*`, `border-border-base`) |
| Badges éxito/error/info/warning | Capa 1 semánticos |
| CTA primario (Guardar) | Capa 2 (`bg-brand-primary`) |
| Focus inputs | `focus:ring-brand-primary` |

---

## 8. Relación con FCE

Ninguna pantalla CFG embebe `CodigoField` como admin.  
Los paneles `CodigoField*` solo se citan como **referencia visual** para el Preview Dialog (`09_COMPONENT_REUSE.md`).
