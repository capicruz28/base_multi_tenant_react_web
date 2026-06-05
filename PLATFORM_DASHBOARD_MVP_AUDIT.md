# PLATFORM_DASHBOARD_MVP_AUDIT.md

**Tema:** Auditoría exclusiva Dashboard Platform — plan PLAT-SURF-002  
**Fecha:** 2026-06-02  
**Ruta:** `/super-admin/dashboard` → `SuperAdminDashboard.tsx`  
**Tipo:** Auditoría + plan de ejecución — **sin código, sin commits, sin implementación**

**Referencias:** `PLATFORM_FINAL_SURFACE_AUDIT.md` (PLAT-SURF-002), `PLATFORM_NEXT_PHASE_IMPLEMENTATION_AUDIT.md` §3, `PLATFORM_NEXT_PRIORITY_RECOMMENDATION.md`  
**Contexto:** PLAT-SURF-001 cerrado. Clientes / Catálogos / Módulos **fuera** de este análisis. **No se asumen endpoints Backend nuevos.**

---

## 1. Resumen ejecutivo

| Dimensión | Estado |
|-----------|--------|
| **Dashboard actual** | Pantalla **renderiza** pero **0 % datos operativos reales** — todo es mock local |
| **Riesgo principal** | El landing post-login muestra **métricas ficticias** como si fueran verdad |
| **MVP honesto viable** | **Sí**, consumiendo APIs **ya referenciadas** en BE y **parcialmente** expuestas en FE |
| **Paridad con diseño mock** | **No** alcanzable sin BE nuevo (conexiones globales, alertas operativas) |

**Veredicto PLAT-SURF-002:** Implementar Dashboard MVP que conserve layout general, sustituya KPIs y actividad por fuentes reales, **retire** bloques no sustentables y **conecte** acciones rápidas a rutas existentes.

---

## 2. Estado actual del Dashboard

**Archivo único:** `src/features/super-admin/dashboard/pages/SuperAdminDashboard.tsx` (~262 LOC)

| Aspecto | Estado |
|---------|--------|
| Fetch / hooks / servicios | **Ninguno** |
| Guard `isSuperAdmin` | **Sí** — único comportamiento real |
| Comentario en código | `// Datos de ejemplo para el dashboard` |

### 2.1 Inventario visual completo

| # | Bloque | Ubicación UI | Contenido mostrado |
|---|--------|--------------|-------------------|
| H1 | Header | Body | «Dashboard de Super Administrador» + subtítulo |
| K1 | KPI tarjeta | Fila 1 col 1 | Total Clientes **5**, subtexto **4 activos** |
| K2 | KPI tarjeta | Fila 1 col 2 | Total Usuarios **25**, subtexto **22 activos** |
| K3 | KPI tarjeta | Fila 1 col 3 | Módulos **8**, subtexto **6 activos** |
| K4 | KPI tarjeta | Fila 1 col 4 | Conexiones **12**, subtexto «Todas activas» |
| A1 | Panel Alertas | Columna izq. | Badge «2 alertas»; 2 ítems licencia/conexión ficticios |
| R1 | Panel Actividad reciente | Columna der. | 4 eventos inventados (ACME, Tech Corp, etc.) |
| Q1 | Acciones rápidas | Footer grid 3×1 | 3 botones sin `navigate` / `Link` |

### 2.2 Clasificación de fuente de datos (actual)

| Widget | Fuente | Tipo |
|--------|--------|------|
| K1–K4 | Objeto `stats` literal L18–27 | **Hardcodeado / mock** |
| `stats.alertas` (badge) | Mismo objeto | **Hardcodeado** |
| A1 lista `alertas` | Array L36–39 | **Simulado** (copy inventado) |
| R1 `actividadReciente` | Array L29–34 | **Simulado** (fechas 2024, acciones genéricas) |
| Q1 botones | Solo CSS hover | **Decorativo** (sin acción) |
| Subtexto K4 «Todas activas» | Texto fijo | **Ficticio** (no deriva de dato) |

**Resumen:** **0 widgets reales**, **8 widgets ficticios**, **3 acciones no funcionales**.

---

## 3. Inventario de APIs / servicios FE ya existentes

### 3.1 Tabla maestra — qué puede alimentar el Dashboard hoy

| Métrica / bloque Dashboard | Servicio / hook FE hoy | Endpoint (consumido o documentado) | ¿Expuesto en FE? | Notas |
|--------------------------|------------------------|-------------------------------------|------------------|-------|
| Total clientes | `clienteService.getClientes` / `useClientes` | `GET /clientes/?skip&limit&solo_activos` | **Sí** | `total_clientes` en `ClienteListResponse`; filtros `active` / `all` / `inactive` |
| Clientes activos | Idem `solo_activos=true` | Idem | **Sí** | `total_clientes` con filtro activos |
| Total módulos | `moduloV2Service.getModulos` | `GET /modulos-v2/?skip&limit&solo_activos` | **Sí** | `pagination.total` → campo `total` en adapter |
| Módulos activos | Idem `es_activo: true`, `limit: 1` | Idem | **Sí** | Total vía paginación |
| Total usuarios global | — | `GET /superadmin/usuarios/` (ref. `endpoints.md`) | **No** en servicio | `superadminUsuarioService` solo tiene `getUsuariosByCliente` |
| Usuarios activos global | — | Idem + query `es_activo` | **No** en servicio | Mismo gap |
| Conexiones activas **global** | `conexionService.getConexiones(cliente_id)` | `GET /conexiones/clientes/{id}/` | **Sí** pero **por cliente** | Sin listado global; agregar = N llamadas |
| Actividad reciente (auth) | `superadminAuditoriaService.getAuthLogsByCliente` | `GET /superadmin/auditoria/autenticacion/` sin `cliente_id` | **Sí** | Validado en PLAT-SURF-001; `limit=5` |
| Detalle evento actividad | — | No en dashboard | — | Solo listado en home |
| Stats auth agregadas | — | `GET /superadmin/auditoria/estadisticas/` (ref. BE) | **No** en servicio | Endpoint **existe** en referencia; sin método FE |
| Alertas licencia | — | — | **No** | No hay feed alertas Platform |
| Alertas error conexión módulo | — | — | **No** | Tipos en `modulo.types` sin API global |
| Stats por cliente | `clienteService.getClienteStats(id)` | `GET /clientes/{id}/estadisticas/` | **Sí** | **Por cliente**; no agregado dashboard |
| KPI «2 alertas» contador | — | — | **No** | Derivado del mock |

### 3.2 Hooks y utilidades reutilizables

| Pieza | Ruta | Uso Dashboard |
|-------|------|---------------|
| `useClientes` | `src/core/hooks/useClientes.ts` | KPI clientes (React Query) |
| `useAuth` | `AuthContext` | Guard + `enabled` queries |
| `getErrorMessage` | `error.service` | Error por tarjeta |
| `AuthAuditLog` / paginación | `superadmin-auditoria.types` | Mapeo actividad reciente |
| `Link` / `useNavigate` | react-router | Acciones rápidas |

### 3.3 Endpoints BE documentados pero sin consumo FE (no son «nuevos»)

| Endpoint | Documentación | Acción PLAT-SURF-002 |
|----------|---------------|---------------------|
| `GET /superadmin/usuarios/` | `reference_backend/endpoints.md` L44–122 | Añadir **un método** en `superadmin-usuario.service.ts` (wrapper FE) |
| `GET /superadmin/auditoria/estadisticas/` | `reference_backend/endpoints.md` L678–737 | Opcional MVP+; tipos nuevos en FE |

**No se solicitan cambios Backend** — solo exposición FE de contratos ya documentados.

---

## 4. Clasificación por widget (matriz PLAT-SURF-002)

Leyenda:

- **A** — Implementable hoy (100 % FE, servicio ya expuesto)  
- **B** — Implementable reutilizando APIs existentes (requiere método FE mínimo o 2ª llamada)  
- **C** — Requiere Backend nuevo (agregado global inexistente)  
- **D** — Debe ocultarse / retirarse en MVP honesto  

| Widget actual | Clasificación MVP | Fuente propuesta | Acción MVP |
|---------------|-------------------|------------------|------------|
| **K1 Total / activos Clientes** | **A** | `clienteService.getClientes(1, 1, { activeFilter: 'all' \| 'active' })` | Mantener tarjeta; datos reales |
| **K2 Total / activos Usuarios** | **B** | `GET /superadmin/usuarios/` vía nuevo `getUsuariosGlobales` | Mantener si QA staging 200; si no, card error/«—» |
| **K3 Total / activos Módulos** | **A** | `moduloV2Service.getModulos` ×2 (`solo_activos` true/false o total sin filtro) | Mantener tarjeta |
| **K4 Conexiones activas** | **C** | Solo `GET /conexiones/clientes/{id}/` | **D — Retirar** o reemplazar por otra métrica real (ver §5) |
| **A1 Alertas del sistema** | **C** | Sin API alertas | **D — Retirar** bloque completo |
| **Badge «2 alertas»** | **C** | Mock | **D — Eliminar** con panel A1 |
| **R1 Actividad reciente** | **A** | `superadminAuditoriaService` sin `cliente_id`, `limit: 5` | Mantener; copy desde `evento` + `cliente` |
| **Q1 Gestionar Clientes** | **A** | Ruta `/super-admin/clientes` | `Link` / `navigate` |
| **Q1 Gestionar Módulos** | **A** | Ruta `/super-admin/modulos` | `Link` |
| **Q1 Gestionar Conexiones** | **C/D** | No hay ruta global conexiones | **Reemplazar** por «Auditoría Global» → `/super-admin/auditoria` |
| **Header H1 en body** | — | PLAT-SURF-016 P3 | Opcional MVP; no bloqueante |

### 4.1 Opciones para reemplazar K4 (cuarta tarjeta) sin inventar datos

| Opción | Clasificación | Descripción |
|--------|---------------|-------------|
| **O1 — «Eventos de auth (24h)»** | **B** (MVP+) | `GET /superadmin/auditoria/estadisticas/` + método FE; muestra `autenticacion.total_eventos` |
| **O2 — «Clientes inactivos»** | **A** | `getClientes` con `activeFilter: 'inactive'` → `total_clientes` |
| **O3 — Eliminar 4.ª tarjeta** | **A** | Grid `lg:grid-cols-3` — menos ruido |
| **O4 — Tarjeta enlace Auditoría** | **A** | Sin número; CTA «Ver auditoría global» + contador fallos recientes si R1 tiene fallos |

**Recomendación MVP:** **O2** (métrica real, solo APIs clientes ya usadas) u **O3** si se prioriza simplicidad. **No** mantener «Conexiones».

---

## 5. Dashboard MVP Honesto — propuesta

### 5.1 Principios

1. **Cero literals** de negocio en `SuperAdminDashboard` (no arrays `stats`, `alertas`, `actividadReciente`).
2. **Loading y error por tarjeta** (`Promise.allSettled` o queries independientes).
3. **Empty honesto** («No hay eventos recientes») solo cuando API devuelve lista vacía.
4. **No sustituir** alertas ficticias por otras inventadas.
5. **No N+1** sobre todos los clientes para sumar conexiones.

### 5.2 Layout MVP objetivo

```
┌─────────────────────────────────────────────────────────────┐
│  [Opcional] Subtítulo operativo (sin KPIs falsos)           │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│  Clientes    │  Usuarios    │  Módulos     │  Inactivos /     │
│  total+act.  │  total+act.  │  total+act.  │  OMITIR 4ta      │
├──────────────────────────────┴──────────────────────────────┤
│  Actividad reciente (auth)          │  [Panel derecho vacío   │
│  - últimos 5 logs reales            │   o CTA Auditoría]      │
│  - link «Ver todo» → /auditoria     │                         │
├─────────────────────────────────────────────────────────────┤
│  Acciones rápidas: Clientes | Módulos | Auditoría Global      │
└─────────────────────────────────────────────────────────────┘
```

**Eliminado respecto al actual:** panel **Alertas del Sistema** completo.

### 5.3 Bloques MVP — especificación

| Bloque | Fuente | Comportamiento |
|--------|--------|----------------|
| **KPI Clientes** | 2× `getClientes(1,1)` o `useClientes` paralelo | Total (`all`) + activos (`active`); subtexto «X activos» |
| **KPI Módulos** | 2× `getModulos({ skip:0, limit:1, es_activo })` | `total` con y sin `solo_activos` |
| **KPI Usuarios** | Nuevo `getUsuariosGlobales({ page:1, limit:1 })` y `es_activo: true` | `total_usuarios`; validar staging |
| **4.ª tarjeta** | O2 inactivos o O3 omitir | Ver §4.1 |
| **Actividad** | `getAuthLogsByCliente({ page:1, limit:5, orden desc })` sin `cliente_id` | Cliente: `log.cliente?.razon_social`; acción: `log.evento`; hora: `fecha_evento` |
| **Link actividad** | — | «Ver todo» → `/super-admin/auditoria` |
| **Acciones** | `react-router` `Link` | Clientes, Módulos, Auditoría (sustituye Conexiones) |

### 5.4 Qué debe retirarse (obligatorio)

| Elemento | Motivo |
|----------|--------|
| Objeto `stats` hardcodeado | Métricas ficticias |
| Array `actividadReciente` mock | Simulación |
| Array `alertas` + panel Alertas | Sin API; mensajes inventados |
| Tarjeta Conexiones + «Todas activas» | Sin agregado global |
| Contador `stats.alertas` | Derivado de mock |
| Botón «Gestionar Conexiones» sin ruta global | UX rota |

### 5.5 Fuera de MVP (PLAT-SURF-002 estricto)

| Ítem | Fase |
|------|------|
| `GET /superadmin/auditoria/estadisticas/` cards | MVP+ |
| Tab sincronización / export | Post-MVP |
| Alertas licencia derivadas de scan 1000 clientes | No recomendado (frágil, no equivalente al mock) |
| Endpoint `/superadmin/dashboard/resumen` | Requiere BE nuevo — backlog |
| Skeleton IAM / `IamTableEmptyState` | P2 transversal |
| Mover H1 a breadcrumb (TB-01) | P3 |

---

## 6. Reutilización desde superficies Platform

| Origen | Qué reutilizar en Dashboard |
|--------|----------------------------|
| **Auditoría Global (001)** | `superadminAuditoriaService`, tipos `AuthAuditLog`, patrón listado, ruta destino actividad |
| **Clientes** | `clienteService` / `useClientes`, `ClienteListResponse.total_clientes`, filtros `activeFilter` |
| **Módulos** | `moduloV2Service.getModulos`, paginación `total` |
| **Usuarios Platform** | Contrato `PaginatedSuperadminUsuariosResponse` en tipos; **falta** método global en servicio (clonar params de `getUsuariosByCliente` pero URL `GET /superadmin/usuarios/`) |
| **Detalle cliente** | No importar `ClientAuditTab` en dashboard; solo mismo servicio auditoría |
| **AuthAuditLogPanel** | No embeber; solo fetch ligero o hook `useAuthLogsPreview(limit:5)` opcional |

**DRY sugerido (implementación):** hook `usePlatformDashboardMetrics` o 3–4 `useQuery` en página; **no** duplicar lógica de `ModuleManagementPage` / `ClientManagementPage`.

---

## 7. Riesgos e incidencias previstas

| ID | Riesgo | Severidad | Mitigación MVP |
|----|--------|-----------|----------------|
| R-D01 | `GET /superadmin/usuarios/` no desplegado o 403 | Media | Card usuarios en error; resto dashboard operativo |
| R-D02 | 4–6 requests paralelas al mount | Baja | `allSettled`; skeleton por card |
| R-D03 | `cliente_id` int vs UUID en usuarios/auditoría | Media | QA staging; alinear query si 422 |
| R-D04 | Usuario espera panel Alertas | Baja | Comunicar en release: «alertas operativas pendientes de API» |
| R-D05 | `moduloV2Service` throw sin ER-02 unificado | Baja | `getErrorMessage` en catch por card |
| R-D06 | Actividad con <5 logs | Baja | Empty state real (ya previsto en UI) |

---

## 8. Orden recomendado de implementación (PLAT-SURF-002)

| Paso | Entregable | Esfuerzo est. | Dependencias |
|------|------------|---------------|--------------|
| **1** | Eliminar mocks (`stats`, `alertas`, `actividadReciente`) | 0.5 h | — |
| **2** | KPI Clientes + Módulos con loading/error | 0.5–1 d | — |
| **3** | Método `getUsuariosGlobales` en `superadmin-usuario.service.ts` + KPI Usuarios | 0.5 d | QA V-03 staging |
| **4** | Actividad reciente auth + link `/super-admin/auditoria` | 0.5 d | PLAT-SURF-001 cerrado |
| **5** | Resolver 4.ª tarjeta (O2 inactivos u O3 grid 3 cols) | 0.25 d | Paso 2 |
| **6** | Retirar panel Alertas; ajustar grid 1 columna actividad o CTA lateral | 0.25 d | — |
| **7** | Acciones rápidas con `Link` (Clientes, Módulos, Auditoría) | 0.25 h | — |
| **8** | QA manual: carga, error API, empty, links, regresión post-login | 0.5 d | — |

**Total estimado:** **1.5–2.5 días** (alineado con `PLATFORM_NEXT_PHASE_IMPLEMENTATION_AUDIT.md` §3.7 MVP).

### 8.1 QA obligatorio PLAT-SURF-002

| # | Caso |
|---|------|
| 1 | Dashboard carga sin números «5 / 25 / 8 / 12» fijos |
| 2 | KPIs coinciden con listados Clientes/Módulos (orden magnitud) |
| 3 | KPI usuarios coherente con API global (o error visible) |
| 4 | Actividad muestra eventos reales o empty |
| 5 | «Ver todo» → Auditoría Global |
| 6 | Acciones rápidas navegan correctamente |
| 7 | Sin panel alertas ficticias |
| 8 | Usuario no super-admin sigue viendo mensaje restricción |
| 9 | Una API caída no rompe tarjetas restantes |

---

## 9. Validaciones previas (reutilizar de fase anterior)

| # | Prueba | Bloquea |
|---|--------|---------|
| V-01 | `GET /superadmin/auditoria/autenticacion/?limit=5` sin `cliente_id` → 200 autenticado | Actividad |
| V-03 | `GET /superadmin/usuarios/?page=1&limit=1` → 200 autenticado | KPI Usuarios |
| V-04 | `GET /clientes/?limit=1` y `/modulos-v2/?limit=1` | KPIs |

*(V-01 ya validado en implementación 001 con 401 sin token — ruta existe.)*

---

## 10. Conclusión

| Pregunta | Respuesta |
|----------|-----------|
| ¿Dashboard actual tiene datos reales? | **No** — 100 % mock local |
| ¿MVP honesto sin BE nuevo? | **Sí** — KPIs Clientes/Módulos + actividad auth + acciones; Usuarios con wrapper FE |
| ¿Qué retirar? | Alertas, conexiones globales, todos los literals |
| ¿Siguiente ticket? | **PLAT-SURF-002** según §8 |
| ¿Depende de 001? | Solo para link y confianza en auditoría; **001 ya cerrado** |

---

*Fin — PLATFORM_DASHBOARD_MVP_AUDIT.md — sin código, sin commits.*
