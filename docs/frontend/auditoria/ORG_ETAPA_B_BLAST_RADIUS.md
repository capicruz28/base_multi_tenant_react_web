# ORG Etapa B — Blast radius (consumidores externos)

**Alcance Etapa B:** solo `src/features/org/**` refactorizado.  
**Breaking:** firmas de `sucursalService`, `centroCostoService`, `departamentoService`, `cargoService`, `parametroService` ya **no aceptan** `empresa_id` en argumentos de list/get/update/delete/reactivar.

## Inventario — llamadas directas con `empresa_id` (TS error hasta migrar)

| Módulo | Archivo | Servicio ORG | Acción requerida (futura) |
|--------|---------|--------------|---------------------------|
| INV | `inv/pages/AlmacenesPage.tsx` | `sucursalService.list` | Quitar query; confiar JWT |
| INV-BILL | `inv-bill/pages/SeriesPage.tsx` | `sucursalService.list` | Idem |
| LOG | `log/pages/RutasPage.tsx` | `sucursalService.list` | Idem |
| POS | `pos/pages/PuntosVentaPage.tsx` | `sucursalService.list` | Idem |
| MNT | `mnt/pages/ActivosPage.tsx` | `sucursalService.list` | Idem |
| MFG | `mfg/pages/CentrosTrabajoPage.tsx` | `sucursalService.list`, `centroCostoService.list` | Idem |
| MFG | `mfg/pages/OrdenesProduccionPage.tsx` | `centroCostoService.list` | Idem |
| SLS | `sls/pages/PedidosPage.tsx` | `centroCostoService.list` | Idem |
| FIN | `fin/pages/AsientoDetallePage.tsx` | `centroCostoService.list` | Idem |
| BDG | `bdg/pages/EjecucionPage.tsx` | `centroCostoService.list` | Idem |
| BDG | `bdg/pages/PresupuestosPage.tsx` | `centroCostoService.list` | Idem |
| HCM | `hcm/pages/EmpleadosPage.tsx` | `departamento`, `cargo`, `sucursal`, `centroCosto` list | Idem |
| HCM | `hcm/pages/ContratosPage.tsx` | `cargoService.list` | Idem |

**Total aproximado:** 14 archivos, ~20 llamadas.

## `empresaService` (tenant-scoped)

Sin cambio de firma en Etapa B. Sigue usándose en ~60+ pantallas ERP para combos — **compatible**.

## Compatibilidad runtime (sesión correcta)

Si un módulo externo aún compila tras parche local y llama `centroCostoService.list({ empresa_id: 'x' })` con TS `@ts-expect-error`:

- TypeScript ya no permite el campo en el objeto params tipado.
- En runtime, el campo extra sería ignorado por axios si se forzara — **no aplica** porque no compila.

## Migración recomendada (post-ORG Etapa C–E)

1. Reemplazar `empresaService.list` en combos por `useEmpresasTenant()` o `empresasDisponibles` de auth.
2. Eliminar `empresa_id` en llamadas ORG company-scoped; usar empresa activa JWT.
3. Alinear módulos INV/LOG/HCM en oleadas por dominio.

## Confirmación ORG interno

```text
0 ocurrencias de q.empresa_id / params: { empresa_id } en src/features/org/services/org.service.ts
```

Verificado en Etapa B — ver script local: `rg "empresa_id" src/features/org/services`.
