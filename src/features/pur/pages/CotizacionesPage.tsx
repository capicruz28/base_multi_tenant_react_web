/**
 * Cotizaciones de Proveedor — Gestión completa.
 * Creación vía endpoint transaccional (cabecera + líneas en una sola llamada).
 * Edición de líneas individuales vía PUT /cotizaciones-detalle/{id}.
 */
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Loader, FileText, Plus, Pencil, Check, X, Star,
  ChevronDown, ChevronRight, Trash2,
} from 'lucide-react';
import type { CatMoneda } from '@/types/catalogos.types';
import { unidadMedidaService } from '@/features/inv/services/inv.service';
import type { UnidadMedida } from '@/features/inv/types/inv.types';
import type {
  Cotizacion,
  CotizacionCreate,
  CotizacionUpdate,
  CotizacionDetalle,
  CotizacionDetalleUpdate,
  CotizacionTransaccionalCreate,
  PurListParams,
} from '../types/pur.types';
import { PurPageLayout } from '../components/PurPageLayout';
import { cotizacionDetalleService } from '../services/pur.service';
import { catalogosService } from '@/core/services';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useProveedores } from '../hooks/useProveedores';
import {
  useCotizaciones,
  useCotizacionDetalle,
  useUpdateCotizacion,
  useAceptarCotizacion,
  useRechazarCotizacion,
  useMarcarGanadoraCotizacion,
  useCreateCotizacionTransaccional,
} from '../hooks/useCotizaciones';

const inputClass =
  'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

const ESTADOS_COT = ['borrador', 'enviada', 'aceptada', 'rechazada', 'vencida'] as const;
const CONDICIONES_PAGO = ['contado', '7_dias', '15_dias', '30_dias', '45_dias', '60_dias', '90_dias'] as const;

const CABECERA_DEFAULT: CotizacionCreate = {
  empresa_id: '',
  numero_cotizacion: '',
  proveedor_id: '',
  moneda_id: '',
  estado: 'borrador',
};

interface LineaCotForm {
  producto_id: string;
  cantidad: number;
  unidad_medida_id: string;
  precio_unitario: number | '';
  descuento_porcentaje: number | '';
  tiempo_entrega_dias: number | '';
  observaciones: string;
}

const LINEA_DEFAULT: LineaCotForm = {
  producto_id: '',
  cantidad: 1,
  unidad_medida_id: '',
  precio_unitario: '',
  descuento_porcentaje: '',
  tiempo_entrega_dias: '',
  observaciones: '',
};

function estadoBadge(estado: string | undefined) {
  const map: Record<string, string> = {
    aceptada: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rechazada: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    vencida: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    enviada: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    borrador: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded font-medium ${map[estado ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
      {estado ?? '—'}
    </span>
  );
}

/* ─── Fila de detalle expandible con edición de líneas ─────────────────── */
function DetalleRow({
  cotizacionId,
  unidades,
  canWrite,
}: {
  cotizacionId: string;
  unidades: UnidadMedida[];
  canWrite: boolean;
}) {
  const qc = useQueryClient();
  const { data: lineas = [], isLoading } = useCotizacionDetalle(cotizacionId);

  const [editOpen, setEditOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<CotizacionDetalle | null>(null);
  const [editForm, setEditForm] = useState<CotizacionDetalleUpdate>({});

  const updateLineMut = useMutation<CotizacionDetalle, Error, { id: string; payload: CotizacionDetalleUpdate }>({
    mutationFn: ({ id, payload }) => cotizacionDetalleService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pur', 'cotizaciones-detalle', cotizacionId] });
      toast.success('Línea actualizada.');
      setEditOpen(false);
      setEditingLine(null);
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });

  const openEditLine = (line: CotizacionDetalle) => {
    setEditingLine(line);
    setEditForm({
      cantidad: parseFloat(line.cantidad) || 1,
      unidad_medida_id: line.unidad_medida_id,
      precio_unitario: parseFloat(line.precio_unitario) || 0,
      descuento_porcentaje: line.descuento_porcentaje ? parseFloat(line.descuento_porcentaje) : undefined,
      tiempo_entrega_dias: line.tiempo_entrega_dias ?? undefined,
      observaciones: line.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  if (isLoading) {
    return (
      <tr>
        <td colSpan={8} className="text-center py-3 text-sm text-gray-400">Cargando líneas...</td>
      </tr>
    );
  }

  return (
    <>
      <tr className="bg-blue-50 dark:bg-blue-950/20">
        <td colSpan={8} className="px-6 py-2">
          {lineas.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Sin líneas de detalle.</p>
          ) : (
            <table className="w-full text-xs border border-blue-100 dark:border-blue-900 rounded">
              <thead className="bg-blue-100 dark:bg-blue-900/40">
                <tr>
                  <th className="text-left px-3 py-1.5 text-gray-600 dark:text-gray-300">Producto</th>
                  <th className="text-right px-3 py-1.5 text-gray-600 dark:text-gray-300">Cant.</th>
                  <th className="text-right px-3 py-1.5 text-gray-600 dark:text-gray-300">U.M.</th>
                  <th className="text-right px-3 py-1.5 text-gray-600 dark:text-gray-300">P. Unitario</th>
                  <th className="text-right px-3 py-1.5 text-gray-600 dark:text-gray-300">Desc.%</th>
                  <th className="text-right px-3 py-1.5 text-gray-600 dark:text-gray-300">Precio Neto</th>
                  <th className="text-right px-3 py-1.5 text-gray-600 dark:text-gray-300">Total</th>
                  {canWrite && <th className="text-center px-3 py-1.5" />}
                </tr>
              </thead>
              <tbody>
                {lineas.map((line) => (
                  <tr key={line.cotizacion_detalle_id} className="border-t border-blue-100 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/10">
                    <td className="px-3 py-1.5 font-mono text-gray-700 dark:text-gray-300">{line.producto_id}</td>
                    <td className="px-3 py-1.5 text-right text-gray-700 dark:text-gray-300">{line.cantidad}</td>
                    <td className="px-3 py-1.5 text-right text-gray-500 dark:text-gray-400">
                      {unidades.find((u) => u.unidad_medida_id === line.unidad_medida_id)?.codigo ?? line.unidad_medida_id}
                    </td>
                    <td className="px-3 py-1.5 text-right text-gray-700 dark:text-gray-300">
                      {parseFloat(line.precio_unitario).toFixed(4)}
                    </td>
                    <td className="px-3 py-1.5 text-right text-gray-500 dark:text-gray-400">
                      {line.descuento_porcentaje ? `${parseFloat(line.descuento_porcentaje).toFixed(2)}%` : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium text-gray-800 dark:text-gray-200">
                      {line.precio_neto ? parseFloat(line.precio_neto).toFixed(4) : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-right font-semibold text-gray-900 dark:text-white">
                      {line.total ? parseFloat(line.total).toFixed(2) : '—'}
                    </td>
                    {canWrite && (
                      <td className="px-3 py-1.5 text-center">
                        <button onClick={() => openEditLine(line)} className="text-brand-primary hover:text-brand-primary/70 p-0.5" title="Editar línea">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </td>
      </tr>

      {/* Modal edición de línea */}
      <Dialog open={editOpen} onOpenChange={(o) => { if (!o) setEditingLine(null); setEditOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar línea de cotización</DialogTitle></DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingLine) return;
              updateLineMut.mutate({ id: editingLine.cotizacion_detalle_id, payload: editForm });
            }}
            className="space-y-3"
          >
            <div>
              <Label>Producto</Label>
              <p className="mt-1 text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded px-3 py-2">
                {editingLine?.producto_id}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cantidad *</Label>
                <input type="number" step="0.001" min={0.001} value={editForm.cantidad ?? 1} onChange={(e) => setEditForm((p) => ({ ...p, cantidad: parseFloat(e.target.value) || 1 }))} className={inputClass} required />
              </div>
              <div>
                <Label>Unidad de medida</Label>
                <select value={editForm.unidad_medida_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, unidad_medida_id: e.target.value || undefined }))} className={inputClass}>
                  <option value="">— Seleccionar —</option>
                  {unidades.map((u) => <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.nombre} ({u.codigo})</option>)}
                </select>
              </div>
              <div>
                <Label>Precio unitario *</Label>
                <input type="number" step="0.000001" min={0} value={editForm.precio_unitario ?? 0} onChange={(e) => setEditForm((p) => ({ ...p, precio_unitario: parseFloat(e.target.value) || 0 }))} className={inputClass} required />
              </div>
              <div>
                <Label>Descuento %</Label>
                <input type="number" step="0.01" min={0} max={100} value={editForm.descuento_porcentaje ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descuento_porcentaje: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputClass} />
              </div>
              <div>
                <Label>T. entrega (días)</Label>
                <input type="number" min={0} value={editForm.tiempo_entrega_dias ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tiempo_entrega_dias: e.target.value ? parseInt(e.target.value) : undefined }))} className={inputClass} />
              </div>
            </div>
            <div>
              <Label>Observaciones</Label>
              <input type="text" value={editForm.observaciones ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} className={inputClass} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateLineMut.isPending} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── Página principal ───────────────────────────────────────────────────── */
export default function CotizacionesPage() {
  const { can } = usePermissions();
  const canWrite = can('compras', 'crear') || can('compras', 'editar');
  const canAprobar = can('compras', 'aprobar') || can('compras', 'editar');

  const [monedas, setMonedas] = useState<CatMoneda[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  /* Create state */
  const [createOpen, setCreateOpen] = useState(false);
  const [cabecera, setCabecera] = useState<CotizacionCreate>(CABECERA_DEFAULT);
  const [lineas, setLineas] = useState<LineaCotForm[]>([{ ...LINEA_DEFAULT }]);

  /* Edit cabecera state */
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Cotizacion | null>(null);
  const [editForm, setEditForm] = useState<CotizacionUpdate>({});

  /* Rechazar state */
  const [rechazarOpen, setRechazarOpen] = useState(false);
  const [rechazarTarget, setRechazarTarget] = useState<Cotizacion | null>(null);
  const [rechazarMotivo, setRechazarMotivo] = useState('');

  const listParams: PurListParams = {
    ...(estadoFilter ? { estado: estadoFilter } : {}),
  };

  const { data: proveedores = [] } = useProveedores({ solo_activos: true });
  const { data: list = [], isLoading, error } = useCotizaciones(listParams);
  const createTransaccionalMut = useCreateCotizacionTransaccional();
  const updateMut = useUpdateCotizacion();
  const aceptarMut = useAceptarCotizacion();
  const rechazarMut = useRechazarCotizacion();
  const ganadoraMut = useMarcarGanadoraCotizacion();

  useEffect(() => {
    catalogosService.listMonedas({ solo_activos: true }).then(setMonedas).catch(() => setMonedas([]));
    unidadMedidaService.list({ solo_activos: true }).then(setUnidades).catch(() => setUnidades([]));
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addLinea = () => setLineas((prev) => [...prev, { ...LINEA_DEFAULT }]);
  const removeLinea = (idx: number) => setLineas((prev) => prev.filter((_, i) => i !== idx));
  const updateLinea = (idx: number, field: keyof LineaCotForm, value: string | number) => {
    setLineas((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const openCreate = () => {
    setCabecera({ ...CABECERA_DEFAULT, proveedor_id: proveedores[0]?.proveedor_id ?? '', numero_cotizacion: `COT-${Date.now()}` });
    setLineas([{ ...LINEA_DEFAULT }]);
    setCreateOpen(true);
  };

  const openEdit = (row: Cotizacion) => {
    setEditing(row);
    setEditForm({
      numero_cotizacion: row.numero_cotizacion,
      fecha_vencimiento: row.fecha_vencimiento ?? undefined,
      proveedor_id: row.proveedor_id,
      condicion_pago: row.condicion_pago ?? undefined,
      dias_credito: row.dias_credito ?? undefined,
      tiempo_entrega_dias: row.tiempo_entrega_dias ?? undefined,
      lugar_entrega: row.lugar_entrega ?? undefined,
      moneda_id: row.moneda_id,
      tipo_cambio: row.tipo_cambio ?? undefined,
      subtotal: row.subtotal ?? undefined,
      descuento: row.descuento ?? undefined,
      igv: row.igv ?? undefined,
      total: row.total ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (lineas.length === 0) {
      toast.error('Debe agregar al menos una línea.');
      return;
    }
    const payload: CotizacionTransaccionalCreate = {
      cabecera,
      detalle: lineas.map((l) => ({
        empresa_id: cabecera.empresa_id,
        cotizacion_id: '',
        producto_id: l.producto_id,
        cantidad: l.cantidad,
        unidad_medida_id: l.unidad_medida_id,
        precio_unitario: l.precio_unitario === '' ? 0 : (l.precio_unitario as number),
        descuento_porcentaje: l.descuento_porcentaje === '' ? undefined : (l.descuento_porcentaje as number),
        tiempo_entrega_dias: l.tiempo_entrega_dias === '' ? undefined : (l.tiempo_entrega_dias as number),
        observaciones: l.observaciones || null,
      })),
    };
    createTransaccionalMut.mutate(payload, { onSuccess: () => setCreateOpen(false) });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    updateMut.mutate({ id: editing.cotizacion_id, payload: editForm }, {
      onSuccess: () => { setEditOpen(false); setEditing(null); },
    });
  };

  const openRechazar = (row: Cotizacion) => {
    setRechazarTarget(row);
    setRechazarMotivo('');
    setRechazarOpen(true);
  };

  const handleRechazar = () => {
    if (!rechazarTarget) return;
    rechazarMut.mutate({ id: rechazarTarget.cotizacion_id, motivo: rechazarMotivo || undefined }, {
      onSuccess: () => { setRechazarOpen(false); setRechazarTarget(null); },
    });
  };

  const proveedorNombre = (id: string) => proveedores.find((p) => p.proveedor_id === id)?.razon_social ?? id;

  return (
    <PurPageLayout
      title="Cotizaciones de Proveedores"
      description="Gestión de cotizaciones con flujo de aceptación."
      action={
        canWrite ? (
          <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
            <Plus className="h-4 w-4 mr-2" /> Nueva cotización
          </Button>
        ) : undefined
      }
    >
      <div className="mb-4 flex gap-4 flex-wrap">
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white">
            <option value="">Todos</option>
            {ESTADOS_COT.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {isLoading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !isLoading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error.message}</p>}

      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="w-8 px-2" />
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Proveedor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ganadora</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />Sin cotizaciones.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <React.Fragment key={row.cotizacion_id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-2 py-3 text-center">
                        <button onClick={() => toggleExpand(row.cotizacion_id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" title="Ver/ocultar líneas">
                          {expanded.has(row.cotizacion_id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_cotizacion}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{proveedorNombre(row.proveedor_id)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_cotizacion?.slice(0, 10) ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                        {row.total ? parseFloat(row.total).toFixed(2) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.es_ganadora
                          ? <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">Sí</span>
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">{estadoBadge(row.estado)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {canWrite && row.estado !== 'aceptada' && row.estado !== 'rechazada' && (
                            <Button variant="ghost" size="icon" onClick={() => openEdit(row)} title="Editar cabecera" className="text-brand-primary hover:text-brand-primary/80">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canAprobar && (row.estado === 'enviada' || row.estado === 'borrador') && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => aceptarMut.mutate({ id: row.cotizacion_id })} disabled={aceptarMut.isPending} title="Aceptar" className="text-green-600 hover:text-green-700">
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openRechazar(row)} title="Rechazar" className="text-red-600 hover:text-red-700">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {canAprobar && !row.es_ganadora && row.estado === 'aceptada' && (
                            <Button variant="ghost" size="icon" onClick={() => ganadoraMut.mutate({ id: row.cotizacion_id })} disabled={ganadoraMut.isPending} title="Marcar ganadora" className="text-yellow-600 hover:text-yellow-700">
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded.has(row.cotizacion_id) && (
                      <DetalleRow cotizacionId={row.cotizacion_id} unidades={unidades} canWrite={canWrite} />
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ Modal Crear (Transaccional) ══ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Cotización</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-6">

            {/* — Cabecera — */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Datos de cabecera</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Empresa (ID) *</Label>
                  <input type="text" placeholder="UUID empresa" value={cabecera.empresa_id} onChange={(e) => setCabecera((p) => ({ ...p, empresa_id: e.target.value }))} className={inputClass} required />
                </div>
                <div>
                  <Label>Número *</Label>
                  <input type="text" value={cabecera.numero_cotizacion} onChange={(e) => setCabecera((p) => ({ ...p, numero_cotizacion: e.target.value }))} className={inputClass} required />
                </div>
                <div>
                  <Label>Proveedor *</Label>
                  <select value={cabecera.proveedor_id} onChange={(e) => setCabecera((p) => ({ ...p, proveedor_id: e.target.value }))} className={inputClass} required>
                    <option value="">Seleccionar</option>
                    {proveedores.map((p) => <option key={p.proveedor_id} value={p.proveedor_id}>{p.razon_social}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Moneda *</Label>
                  <select value={cabecera.moneda_id} onChange={(e) => setCabecera((p) => ({ ...p, moneda_id: e.target.value }))} className={inputClass} required>
                    <option value="">— Seleccionar —</option>
                    {monedas.map((m) => <option key={m.moneda_id} value={m.moneda_id}>{m.codigo} — {m.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Fecha vencimiento</Label>
                  <input type="date" value={cabecera.fecha_vencimiento ?? ''} onChange={(e) => setCabecera((p) => ({ ...p, fecha_vencimiento: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div>
                  <Label>Condición pago</Label>
                  <select value={cabecera.condicion_pago ?? ''} onChange={(e) => setCabecera((p) => ({ ...p, condicion_pago: e.target.value || undefined }))} className={inputClass}>
                    <option value="">Seleccionar</option>
                    {CONDICIONES_PAGO.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Tipo de cambio</Label>
                  <input type="number" step="0.0001" value={cabecera.tipo_cambio ?? ''} onChange={(e) => setCabecera((p) => ({ ...p, tipo_cambio: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div>
                  <Label>Lugar entrega</Label>
                  <input type="text" value={cabecera.lugar_entrega ?? ''} onChange={(e) => setCabecera((p) => ({ ...p, lugar_entrega: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <Label>Observaciones</Label>
                  <textarea value={cabecera.observaciones ?? ''} onChange={(e) => setCabecera((p) => ({ ...p, observaciones: e.target.value || undefined }))} className={inputClass} rows={2} />
                </div>
              </div>
            </div>

            {/* — Líneas — */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Líneas de cotización <span className="text-gray-400 font-normal">({lineas.length})</span>
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addLinea}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Agregar línea
                </Button>
              </div>
              <div className="space-y-3">
                {lineas.map((linea, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="col-span-3">
                      {idx === 0 && <Label className="text-xs mb-1">Producto (ID) *</Label>}
                      <input type="text" placeholder="UUID" value={linea.producto_id} onChange={(e) => updateLinea(idx, 'producto_id', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white" required />
                    </div>
                    <div className="col-span-1">
                      {idx === 0 && <Label className="text-xs mb-1">Cant. *</Label>}
                      <input type="number" step="0.001" min={0.001} value={linea.cantidad} onChange={(e) => updateLinea(idx, 'cantidad', parseFloat(e.target.value) || 1)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white" required />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs mb-1">U.M. *</Label>}
                      <select value={linea.unidad_medida_id} onChange={(e) => updateLinea(idx, 'unidad_medida_id', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white" required>
                        <option value="">—</option>
                        {unidades.map((u) => <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.codigo}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs mb-1">P. Unitario *</Label>}
                      <input type="number" step="0.000001" min={0} placeholder="0.00" value={linea.precio_unitario} onChange={(e) => updateLinea(idx, 'precio_unitario', e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white" required />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs mb-1">Desc.%</Label>}
                      <input type="number" step="0.01" min={0} max={100} placeholder="0" value={linea.descuento_porcentaje} onChange={(e) => updateLinea(idx, 'descuento_porcentaje', e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div className="col-span-1">
                      {idx === 0 && <Label className="text-xs mb-1">T.E.días</Label>}
                      <input type="number" min={0} placeholder="0" value={linea.tiempo_entrega_dias} onChange={(e) => updateLinea(idx, 'tiempo_entrega_dias', e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {lineas.length > 1 && (
                        <button type="button" onClick={() => removeLinea(idx)} className="text-red-400 hover:text-red-600 p-1" title="Eliminar línea">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createTransaccionalMut.isPending} className="bg-brand-primary hover:bg-brand-primary-hover">
                {createTransaccionalMut.isPending ? 'Creando...' : 'Crear cotización'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══ Modal Editar cabecera ══ */}
      <Dialog open={editOpen} onOpenChange={(o) => { if (!o) setEditing(null); setEditOpen(o); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar cabecera de cotización</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><Label>Número *</Label><input type="text" value={editForm.numero_cotizacion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, numero_cotizacion: e.target.value }))} className={inputClass} required /></div>
            <div>
              <Label>Proveedor *</Label>
              <select value={editForm.proveedor_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, proveedor_id: e.target.value }))} className={inputClass} required>
                <option value="">Seleccionar</option>
                {proveedores.map((p) => <option key={p.proveedor_id} value={p.proveedor_id}>{p.razon_social}</option>)}
              </select>
            </div>
            <div>
              <Label>Moneda *</Label>
              <select value={editForm.moneda_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, moneda_id: e.target.value || undefined }))} className={inputClass} required>
                <option value="">— Seleccionar —</option>
                {monedas.map((m) => <option key={m.moneda_id} value={m.moneda_id}>{m.codigo} — {m.nombre}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fecha vencimiento</Label><input type="date" value={editForm.fecha_vencimiento ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_vencimiento: e.target.value || undefined }))} className={inputClass} /></div>
              <div><Label>Tipo de cambio</Label><input type="number" step="0.0001" value={editForm.tipo_cambio ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_cambio: e.target.value || undefined }))} className={inputClass} /></div>
              <div><Label>Subtotal</Label><input type="number" step="0.01" value={editForm.subtotal ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, subtotal: e.target.value || undefined }))} className={inputClass} /></div>
              <div><Label>Descuento</Label><input type="number" step="0.01" value={editForm.descuento ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descuento: e.target.value || undefined }))} className={inputClass} /></div>
              <div><Label>IGV</Label><input type="number" step="0.01" value={editForm.igv ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, igv: e.target.value || undefined }))} className={inputClass} /></div>
              <div><Label>Total</Label><input type="number" step="0.01" value={editForm.total ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, total: e.target.value || undefined }))} className={inputClass} /></div>
            </div>
            <div><Label>Observaciones</Label><textarea value={editForm.observaciones ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} className={inputClass} rows={2} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateMut.isPending} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══ Modal Rechazar ══ */}
      <Dialog open={rechazarOpen} onOpenChange={setRechazarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Rechazar cotización</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-400">¿Confirma rechazar <strong>{rechazarTarget?.numero_cotizacion}</strong>?</p>
          <div className="mt-2">
            <Label>Motivo (opcional)</Label>
            <textarea value={rechazarMotivo} onChange={(e) => setRechazarMotivo(e.target.value)} className={inputClass} rows={2} placeholder="Motivo del rechazo..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRechazarOpen(false)}>Cancelar</Button>
            <Button onClick={handleRechazar} disabled={rechazarMut.isPending} className="bg-red-600 hover:bg-red-700 text-white">Rechazar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PurPageLayout>
  );
}
