# Auditoría evolución de reglas — `.cursorrules` y PROMPT_FRONTEND_MAESTRO

**Fecha:** 31 mayo 2026  
**Estado:** Solo auditoría — **no se modificaron** `.cursorrules` ni `PROMPT_FRONTEND_MAESTRO.md`  
**Sin commit**

---

## 1. Archivos revisados

| Archivo | Líneas (~) | Rol |
|---------|------------|-----|
| `.cursorrules` | 304 | Reglas Cursor always-apply (integridad API, UX, diseño 2 capas) |
| `docs/prompts/PROMPT_FRONTEND_MAESTRO.md` | 589 | Prompt por fases (0–4) para implementar módulos |

---

## 2. Qué sigue vigente (mantener sin cambios sustanciales)

### 2.1 `.cursorrules`

| Bloque | Vigencia | Notas |
|--------|----------|-------|
| Reglas absolutas integridad API | ✅ 100% | URLs, no `any`, React Query, RBAC |
| Endpoints deprecated | ✅ 100% | INV ya cumple en service |
| Cabecera + detalle embebido | ✅ 100% | Aplica INV; ORG no tiene caso |
| Nunca mostrar IDs en UI | ✅ 100% | Reforzado por ORG E-ME4 |
| Evaluación código existente | ✅ 100% | Clasificación correcto/incompleto/desalineado |
| Manejo errores API + toast solo en hook | ✅ 100% | ORG e INV en general cumplen |
| UX: sin H1 en body, toolbar primero | ✅ 100% | ORG E-UX.1 cumple |
| Loading / error / empty obligatorio | ✅ 100% | ORG con `IamTableEmptyState`; INV parcial |
| Tablas, formularios, modales, RBAC | ✅ 100% | |
| Sistema diseño 2 capas (tokens + brand) | ✅ 100% | |
| Orden prioridad en conflicto | ✅ 100% | |

### 2.2 `PROMPT_FRONTEND_MAESTRO.md`

| Bloque | Vigencia |
|--------|----------|
| Reglas absolutas iniciales | ✅ |
| Sistema diseño 2 capas + ejemplos tabla/input/badge | ✅ |
| Fase 0 contrato API + clasificación archivos | ✅ |
| Fase 1 auditoría (generar `AUDITORIA_FRONTEND_[CODIGO].md`) | ✅ |
| Fase 2 bloques types → services → hooks → componentes | ✅ |
| Cabecera+detalle en types y mutations | ✅ |
| Paso 4.0 decisiones diseño por entidad | ✅ |
| Reglas layout toolbar (líneas ~390–500) | ✅ Vigentes; ORG E-UX.1 las implementa |
| Vocabulario Desactivar/Reactivar | ✅ |
| ConfirmDialog obligatorio | ✅ |

---

## 3. Qué quedó obsoleto o incompleto

### 3.1 `.cursorrules` — lagunas vs ORG cerrado

| Tema | Estado en reglas | Realidad código (may 2026) |
|------|------------------|----------------------------|
| **Multiempresa JWT** | Solo “incluir empresa_id donde API lo requiera” | ORG: empresa operativa = **sesión/header**, no selector página |
| **Selector empresa en filtros** | “Filtros visibles (empresa, estado, búsqueda)” | **Obsoleto** para company-scoped: contradice cierre ORG |
| **Empty state** | Genérico “ilustración + mensaje” | Debe nombrar **`IamTableEmptyState`** y variante búsqueda |
| **Skeleton** | “skeleton o spinner” | Listados ERP: **preferir skeleton tabla** (`InvTableSkeleton`) — ORG ya decidió |
| **B.1.1 discard** | “Cerrar con Escape o clic fuera **excepto** cambios sin guardar” | Implementación concreta en ORG/IAM (`discardPending`, `scheduleModalStackValidation`) **no documentada** |
| **Debounce búsqueda** | No mencionado | IAM 500ms; ORG sin debounce — regla ambigua |
| **Módulo patrón Fase 0** | “Usar patrón del módulo de referencia elegido” | No dice cuándo ORG vs INV |
| **Toolbars compactas** | “Filtros en parte superior” sin `justify-between` | E-UX.1 añade patrón no escrito |
| **Tooltip UUID** | Cubierto por “nunca IDs” | E-ME4 (`title={uuid}`) no explicitado |

### 3.2 `PROMPT_FRONTEND_MAESTRO.md` — lagunas

| Tema | Estado | Gap |
|------|--------|-----|
| Multiempresa | “Respetar contexto multi-tenant (empresa_id)” | No distingue **tenant** vs **company-scoped** vs **híbrido** |
| Paso 0.2 “cómo se accede empresa_id del tenant” | Zustand genérico | Hoy: **`useEmpresaActiva` + JWT**; no documentado |
| Filtros Paso 4.0 “Ejemplo Almacenes: Empresa, Tipo…” | Ejemplo con filtro empresa | **Obsoleto** post-ORG para INV |
| Toolbar líneas 401–404 | Compacta, sin H1 | ✅ Alineado ORG; falta **`OrgToolbarSearch` / wrapper ancho** |
| Modales | No menciona IAM modal stack | B.1.1 obligatorio para paridad ORG |
| Componentes IAM | No listados | `IamSearchInput`, `IamTableEmptyState` deberían ser estándar ERP |
| Guards de ruta | No mencionados | `OrgCompanyRouteGuard` patrón no en prompt |
| Post-login / selección empresa | Ausente | Flujos `APP_SELECCIONAR_EMPRESA` |
| Impersonación | Ausente | Super-admin / platform |

---

## 4. Nuevas reglas recomendadas (incorporar **después** de cerrar INV)

Prioridad: **INV-M0** primero; luego actualizar reglas para que no vuelva a introducirse `empresaFilter`.

### 4.1 Bloque propuesto: Multiempresa JWT (`.cursorrules` + PROMPT)

```markdown
## REGLA CRÍTICA: EMPRESA ACTIVA (JWT)

- La empresa operativa viene del JWT / AuthContext (`useEmpresaActiva`), mostrada en el **header**.
- En pantallas **company-scoped**: PROHIBIDO `<select>` local "Todas las empresas" o selector de empresa en toolbar.
- Usar hook de scope del módulo (ej. `useXSessionScope`) con `scopeEmpresaId` y `useXCompanyQueryGate`.
- En formularios create: campo empresa **solo lectura** (`ErpSessionEmpresaField`) + hidden si aplica.
- Al cambiar empresa en header: invalidar todas las queries del módulo (`invalidateXQueries`).
- PROHIBIDO `title` / tooltip / texto visible con UUID de empresa (E-ME4).
- `empresaService.list` en páginas CRUD solo para **tenant-wide** (ej. administración de empresas), no para filtrar listados operativos.
```

### 4.2 Bloque propuesto: Plantillas de módulo (PROMPT Fase 0)

```markdown
## Elección de módulo patrón (Fase 0)

| Tipo de vista | Copiar de |
|---------------|-----------|
| Listado maestro modal | ORG (post E-UX): toolbar, empty, skeleton, B.1.1 |
| Transacción cabecera+detalle | INV: *FormPage, hooks *ConDetalle |
| Tenant-wide | ORG EmpresaPage (con precaución monolito) |
| Parámetros híbridos | ORG ParametrosPage |

INV NO es patrón multiempresa hasta alineación INV-M0.
```

### 4.3 Bloque propuesto: UX listados (ambos archivos)

```markdown
## Listados tabulares estándar

- Toolbar: `ErpCompanyToolbar` — `justify-between`, filtros izquierda, CTA derecha.
- Búsqueda: `IamSearchInput` dentro de `ErpToolbarSearch` (ancho fijo, no w-full en flex).
- Carga: `InvTableSkeleton` con column count = thead.
- Vacío: `IamTableEmptyState` con `hasSearch` (sin CTA crear si hay búsqueda activa).
- Modales edición: patrón B.1.1 (ORG E-SEC / IAM UserManagement).
```

### 4.4 Bloque propuesto: B.1.1 (`.cursorrules` — MODALES)

Ampliar sección modales con:

- Cerrar Radix → si dirty → `ConfirmDialog` “Seguir editando” / “Sí, descartar”
- `onInteractOutside` / `onEscapeKeyDown` → `preventDefault` si dirty
- `scheduleModalStackValidation` tras cerrar por dirty
- Referencia: `org-discard-handlers.ts`, `OrgDiscardConfirmDialog.tsx`

### 4.5 Bloque propuesto: post-INV (mantenimiento)

| Regla | Cuándo |
|-------|--------|
| Debounce 500ms en `buscar` listados | Tras INV-M1 estable |
| `useTenantQuery` obligatorio en hooks nuevos | Al unificar ORG+INV |
| No re-exportar skeleton por módulo | Usar `InvTableSkeleton` directo o alias único `ErpTableSkeleton` |
| Auditoría `AUDITORIA_FRONTEND_[CODIGO].md` obligatoria antes de Fase 2 | Ya en PROMPT — mantener |

---

## 5. Matriz de sincronización archivo ↔ realidad

| Regla deseada | `.cursorrules` hoy | PROMPT hoy | Código ORG | Código INV |
|---------------|-------------------|------------|------------|------------|
| Sin selector empresa toolbar | ⚠ Implícito | ❌ Ejemplo contradice | ✅ | ❌ |
| IamTableEmptyState | ❌ | ❌ | ✅ | ❌ |
| InvTableSkeleton listas | ⚠ Genérico | ❌ | ✅ | ✅ |
| B.1.1 | ⚠ Parcial | ❌ | ✅ | ❌ |
| con-detalle una llamada | ✅ | ✅ | N/A | ✅ |
| No UUID UI | ✅ | ✅ | ✅ | ✅ tablas |

---

## 6. Orden sugerido de actualización documental

1. **Tras INV-M0** — Añadir bloque multiempresa JWT (crítico).  
2. **Tras INV-M1** — Añadir bloque UX listados + componentes IAM.  
3. **Tras B.1.1 en INV** — Ampliar modales en `.cursorrules`.  
4. **Tras debounce** — Una línea en estándares búsqueda.  
5. **Opcional** — Corregir ejemplos “Filtros: Empresa” en PROMPT Paso 4.0 → “Empresa: solo header (JWT)”.

---

## 7. Texto obsoleto a marcar explícitamente en próxima edición

| Ubicación | Texto / idea | Reemplazo |
|-----------|--------------|-----------|
| `.cursorrules` ~L177 | “Filtros visibles (empresa, …)” | “Filtros: búsqueda, estado; empresa solo vía header” |
| PROMPT ~L376 | “Ejemplo Almacenes: Empresa, Tipo…” | “Ejemplo Almacenes: Tipo, estado (empresa = JWT)” |
| PROMPT Paso 0.2 | “empresa_id del tenant” en Zustand | “empresa activa: useEmpresaActiva / JWT” |
| Cualquier “módulo de referencia” sin tabla ORG/INV | Ambiguo | Tabla plantilla A/B §4.2 arriba |

---

## 8. Conclusión

- **`.cursorrules`:** Sigue siendo válido en **integridad API, diseño 2 capas y transacciones**. Quedó **atrás** en multiempresa JWT, componentes UX cerrados en ORG y B.1.1 operativo.  
- **`PROMPT_FRONTEND_MAESTRO.md`:** Sigue siendo la **guía de implementación por fases** correcta. Requiere **anexo multiempresa** y **corrección de ejemplos de filtros** antes de usarlo para INV sin reintroducir deuda.  
- **No editar aún** — esperar cierre INV-M0 para que reglas y código coincidan (evitar reglas que el código no cumple).

---

*Documento generado sin cambios en archivos de reglas. Sin commit.*
