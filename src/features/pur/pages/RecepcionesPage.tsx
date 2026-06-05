/**
 * Recepciones de Compra — Gestión completa con flujo anular/aprobar/procesar.
 * Creación vía endpoint transaccional (cabecera + líneas en una sola llamada).
 * Edición de líneas individuales vía PUT /recepciones-detalle/{id}.
 * Líneas muestran: diferencia, total, lote, fecha_vencimiento, motivo_diferencia.
 */
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Loader, Package2, Plus, Pencil, Check, Ban, PlayCircle,
  ChevronDown, ChevronRight, Trash2,
} from 'lucide-react';
import type {
  Recepcion,
  RecepcionCreate,
  RecepcionUpdate,
  RecepcionDetalle,
  RecepcionDetalleUpdate,
  RecepcionTransaccionalCreate,
  PurListParams,
} from '../types/pur.types';
import { PurPageLayout } from '../components/PurPageLayout';
import { recepcionDetalleService } from '../services/pur.service';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useProveedores } from '../hooks/useProveedores';
import {
  useRecepciones,
  useRecepcionDetalle,
  useUpdateRecepcion,
  useAnularRecepcion,
  useAprobarRecepcion,
  useProcesarRecepcion,
  useCreateRecepcionTransaccional,
} from '../hooks/useRecepciones';

const inputClass =
  'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

const ESTADOS_RECEPCION = ['borrador', 'pendiente', 'aprobada', 'procesada', 'anulada'] as const;

const CABECERA_DEFAULT: RecepcionCreate = {
  empresa_id: '',
  numero_recepcion: '',
  orden_compra_id: '',
  proveedor_id: '',
  almacen_id: '',
  estado: 'borrador',
};

interface LineaRecForm {
  orden_compra_detalle_id: string;
  producto_id: string;
  cantidad_ordenada: number;
  cantidad_recepcionada: number;
  unidad_medida_id: string;
  lote: string;
  fecha_vencimiento: string;
  precio_unitario: number | '';
  ubicacion_almacen: string;
  motivo_diferencia: string;
  observaciones: string;
}

const LINEA_DEFAULT: LineaRecForm = {
  orden_compra_detalle_id: '',
  producto_id: '',
  cantidad_ordenada: 1,
  cantidad_recepcionada: 1,
  unidad_medida_id: '',
  lote: '',
  fecha_vencimiento: '',
  precio_unitario: '',
  ubicacion_almacen: '',
  motivo_diferencia: '',
  observaciones: '',
};

function estadoBadge(estado: string | undefined) {
  const map: Record<string, string> = {
    aprobada: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    procesada: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    anulada: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    pendiente: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
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
  recepcionId,
  canWrite,
}: {
  recepcionId: string;
  canWrite: boolean;
}) {
  const qc = useQueryClient();
  const { data: lineas = [], isLoading } = useRecepcionDetalle(recepcionId);

  const [editOpen, setEditOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<RecepcionDetalle | null>(null);
  const [editForm, setEditForm] = useState<RecepcionDetalleUpdate>({});

  const updateLineMut = useMutation<RecepcionDetalle, Error, { id: string; payload: RecepcionDetalleUpdate }>({
    mutationFn: ({ id, payload }) => recepcionDetalleService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pur', 'recepciones-detalle', recepcionId] });
      toast.success('Línea actualizada.');
      setEditOpen(false);
      setEditingLine(null);
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });

  const openEditLine = (line: RecepcionDetalle) => {
    setEditingLine(line);
    setEditForm({
      cantidad_recepcionada: parseFloat(line.cantidad_recepcionada) || 0,
      lote: line.lote ?? undefined,
      fecha_vencimiento: line.fecha_vencimiento ?? undefined,
      precio_unitario: line.precio_unitario ? parseFloat(line.precio_unitario) : undefined,
      ubicacion_almacen: line.ubicacion_almacen ?? undefined,
      motivo_diferencia: line.motivo_diferencia ?? undefined,
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
                  <th className="text-right px-3 py-1.5 text-gray-600 dark:text-gray-300">Ordenado</th>
                  <th className="text-right px-3 py-1.5 text-gray-600 dark:text-gray-300">Recibido</th>
                  <th className="text-right px-3 py-1.5 text-gray-600 dark:text-gray-300">Diferencia</th>
                  <th className="text-right px-3 py-1.5 text-gray-600 dark:text-gray-300">P. Unit.</th>
                  <th className="text-right px-3 py-1.5 text-gray-600 dark:text-gray-300">Total</th>
                  <th className="text-left px-3 py-1.5 text-gray-600 dark:text-gray-300">Lote</th>
                  <th className="text-left px-3 py-1.5 text-gray-600 dark:text-gray-300">Vto.</th>
                  <th className="text-left px-3 py-1.5 text-gray-600 dark:text-gray-300">Ubic.</th>
                  <th className="text-left px-3 py-1.5 text-gray-600 dark:text-gray-300">Motivo dif.</th>
                  {canWrite && <th className="text-center px-3 py-1.5" />}
                </tr>
              </thead>
              <tbody>
                {lineas.map((line) => (
                  <tr key={line.recepcion_detalle_id} className="border-t border-blue-100 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/10">
                    <td className="px-3 py-1.5 font-mono text-gray-700 dark:text-gray-300">{line.producto_id}</td>
                    <td className="px-3 py-1.5 text-right text-gray-700 dark:text-gray-300">{line.cantidad_ordenada}</td>
                    <td className="px-3 py-1.5 text-right text-gray-700 dark:text-gray-300">{line.cantidad_recepcionada}</td>
                    <td className={`px-3 py-1.5 text-right font-medium ${line.diferencia && parseFloat(line.diferencia) !== 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {line.diferencia ? parseFloat(line.diferencia).toFixed(2) : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-right text-gray-700 dark:text-gray-300">
                      {line.precio_unitario ? parseFloat(line.precio_unitario).toFixed(4) : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-right font-semibold text-gray-900 dark:text-white">
                      {line.total ? parseFloat(line.total).toFixed(2) : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">{line.lote ?? '—'}</td>
                    <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">{line.fecha_vencimiento?.slice(0, 10) ?? '—'}</td>
                    <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400 max-w-[80px] truncate">{line.ubicacion_almacen ?? '—'}</td>
                    <td className="px-3 py-1.5 text-gray-500 dark:text-gray-400 max-w-[100px] truncate">{line.motivo_diferencia ?? '—'}</td>
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
          <DialogHeader><DialogTitle>Editar línea de recepción</DialogTitle></DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingLine) return;
              updateLineMut.mutate({ id: editingLine.recepcion_detalle_id, payload: editForm });
            }}
            className="space-y-3"
          >
            <div>
              <Label>Producto</Label>
              <p className="mt-1 text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded px-3 py-2">
                {editingLine?.producto_id}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ordenado: <strong>{editingLine?.cantidad_ordenada}</strong>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cant. recepcionada *</Label>
                <input type="number" step="0.001" min={0} value={editForm.cantidad_recepcionada ?? 0} onChange={(e) => setEditForm((p) => ({ ...p, cantidad_recepcionada: parseFloat(e.target.value) || 0 }))} className={inputClass} required />
              </div>
              <div>
                <Label>Precio unitario</Label>
                <input type="number" step="0.000001" min={0} value={editForm.precio_unitario ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, precio_unitario: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputClass} />
              </div>
              <div>
                <Label>Lote</Label>
                <input type="text" value={editForm.lote ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, lote: e.target.value || undefined }))} className={inputClass} />
              </div>
              <div>
                <Label>Fecha vencimiento</Label>
                <input type="date" value={editForm.fecha_vencimiento ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_vencimiento: e.target.value || undefined }))} className={inputClass} />
              </div>
              <div className="col-span-2">
                <Label>Ubicación en almacén</Label>
                <input type="text" value={editForm.ubicacion_almacen ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, ubicacion_almacen: e.target.value || undefined }))} className={inputClass} />
              </div>
              <div className="col-span-2">
                <Label>Motivo diferencia</Label>
                <input type="text" value={editForm.motivo_diferencia ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, motivo_diferencia: e.target.value || undefined }))} className={inputClass} />
              </div>
              <div className="col-span-2">
                <Label>Observaciones</Label>
                <input type="text" value={editForm.observaciones ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} className={inputClass} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateLineMut.isPending} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── Página principal ───────────────────────────────────────────────────── */
export default function RecepcionesPage() {
  const { can } = usePermissions();
  const canWrite = can('compras', 'crear') || can('compras', 'editar');
  const canAprobar = can('compras', 'aprobar') || can('compras', 'editar');

  const [estadoFilter, setEstadoFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  /* Create state */
  const [createOpen, setCreateOpen] = useState(false);
  const [cabecera, setCabecera] = useState<RecepcionCreate>(CABECERA_DEFAULT);
  const [lineas, setLineas] = useState<LineaRecForm[]>([{ ...LINEA_DEFAULT }]);

  /* Edit cabecera */
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Recepcion | null>(null);
  const [editForm, setEditForm] = useState<RecepcionUpdate>({});

  /* Anular */
  const [anularOpen, setAnularOpen] = useState(false);
  const [anularTarget, setAnularTarget] = useState<Recepcion | null>(null);

  const listParams: PurListParams = {
    ...(estadoFilter ? { estado: estadoFilter } : {}),
  };

  const { data: proveedores = [] } = useProveedores({ solo_activos: true });
  const { data: list = [], isLoading, error } = useRecepciones(listParams);
  const createTransaccionalMut = useCreateRecepcionTransaccional();
  const updateMut = useUpdateRecepcion();
  const anularMut = useAnularRecepcion();
  const aprobarMut = useAprobarRecepcion();
  const procesarMut = useProcesarRecepcion();

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addLinea = () => setLineas((prev) => [...prev, { ...LINEA_DEFAULT }]);
  const removeLinea = (idx: number) => setLineas((prev) => prev.filter((_, i) => i !== idx));
  const updateLinea = (idx: number, field: keyof LineaRecForm, value: string | number) => {
    setLineas((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const openCreate = () => {
    setCabecera({ ...CABECERA_DEFAULT, proveedor_id: proveedores[0]?.proveedor_id ?? '', numero_recepcion: `REC-${Date.now()}` });
    setLineas([{ ...LINEA_DEFAULT }]);
    setCreateOpen(true);
  };

  const openEdit = (row: Recepcion) => {
    setEditing(row);
    setEditForm({
      numero_recepcion: row.numero_recepcion,
      proveedor_id: row.proveedor_id,
      almacen_id: row.almacen_id,
      guia_remision_numero: row.guia_remision_numero ?? undefined,
      guia_remision_fecha: row.guia_remision_fecha ?? undefined,
      transportista: row.transportista ?? undefined,
      placa_vehiculo: row.placa_vehiculo ?? undefined,
      recepcionado_por_nombre: row.recepcionado_por_nombre ?? undefined,
      observaciones: row.observaciones ?? undefined,
      incidencias: row.incidencias ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (lineas.length === 0) {
      toast.error('Debe agregar al menos una línea.');
      return;
    }
    const payload: RecepcionTransaccionalCreate = {
      cabecera,
      detalle: lineas.map((l) => ({
        empresa_id: cabecera.empresa_id,
        recepcion_id: '',
        orden_compra_detalle_id: l.orden_compra_detalle_id,
        producto_id: l.producto_id,
        cantidad_ordenada: l.cantidad_ordenada,
        cantidad_recepcionada: l.cantidad_recepcionada,
        unidad_medida_id: l.unidad_medida_id,
        lote: l.lote || undefined,
        fecha_vencimiento: l.fecha_vencimiento || undefined,
        precio_unitario: l.precio_unitario === '' ? undefined : (l.precio_unitario as number),
        ubicacion_almacen: l.ubicacion_almacen || undefined,
        motivo_diferencia: l.motivo_diferencia || undefined,
        observaciones: l.observaciones || null,
      })),
    };
    createTransaccionalMut.mutate(payload, { onSuccess: () => setCreateOpen(false) });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    updateMut.mutate({ id: editing.recepcion_id, payload: editForm }, {
      onSuccess: () => { setEditOpen(false); setEditing(null); },
    });
  };

  const openAnular = (row: Recepcion) => {
    setAnularTarget(row);
    setAnularOpen(true);
  };

  const handleAnular = () => {
    if (!anularTarget) return;
    anularMut.mutate({ id: anularTarget.recepcion_id }, {
      onSuccess: () => { setAnularOpen(false); setAnularTarget(null); },
    });
  };

  const proveedorNombre = (id: string) => proveedores.find((p) => p.proveedor_id === id)?.razon_social ?? id;

  return (
    <PurPageLayout
      title="Recepciones de Compra"
      description="Registro de ingreso de mercadería con control de diferencias."
      action={
        canWrite ? (
          <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
            <Plus className="h-4 w-4 mr-2" /> Nueva recepción
          </Button>
        ) : undefined
      }
    >
      <div className="mb-4 flex gap-4 flex-wrap">
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white">
            <option value="">Todos</option>
            {ESTADOS_RECEPCION.map((s) => <option key={s} value={s}>{s}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">OC Origen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cant. Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <Package2 className="h-10 w-10 mx-auto mb-2 opacity-50" />Sin recepciones registradas.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <React.Fragment key={row.recepcion_id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-2 py-3 text-center">
                        <button onClick={() => toggleExpand(row.recepcion_id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" title="Ver/ocultar líneas">
                          {expanded.has(row.recepcion_id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_recepcion}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{proveedorNombre(row.proveedor_id)}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400 max-w-[120px] truncate" title={row.orden_compra_id}>{row.orden_compra_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_recepcion?.slice(0, 10) ?? '—'}</td>
                      <td className="px-4 py-3">{estadoBadge(row.estado)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.total_cantidad ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {canWrite && row.estado !== 'anulada' && row.estado !== 'procesada' && (
                            <Button variant="ghost" size="icon" onClick={() => openEdit(row)} title="Editar cabecera" className="text-brand-primary hover:text-brand-primary/80">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canAprobar && row.estado === 'pendiente' && (
                            <Button variant="ghost" size="icon" onClick={() => aprobarMut.mutate({ id: row.recepcion_id })} disabled={aprobarMut.isPending} title="Aprobar" className="text-green-600 hover:text-green-700">
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {canAprobar && row.estado === 'aprobada' && (
                            <Button variant="ghost" size="icon" onClick={() => procesarMut.mutate({ id: row.recepcion_id })} disabled={procesarMut.isPending} title="Procesar (genera ingreso inventario)" className="text-blue-600 hover:text-blue-700">
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {canAprobar && row.estado !== 'anulada' && (
                            <Button variant="ghost" size="icon" onClick={() => openAnular(row)} title="Anular" className="text-orange-600 hover:text-orange-700">
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded.has(row.recepcion_id) && (
                      <DetalleRow recepcionId={row.recepcion_id} canWrite={canWrite} />
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
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Recepción de Compra</DialogTitle></DialogHeader>
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
                  <input type="text" value={cabecera.numero_recepcion} onChange={(e) => setCabecera((p) => ({ ...p, numero_recepcion: e.target.value }))} className={inputClass} required />
                </div>
                <div>
                  <Label>Orden de Compra (ID) *</Label>
                  <input type="text" placeholder="UUID de la OC origen" value={cabecera.orden_compra_id} onChange={(e) => setCabecera((p) => ({ ...p, orden_compra_id: e.target.value }))} className={inputClass} required />
                </div>
                <div>
                  <Label>Proveedor *</Label>
                  <select value={cabecera.proveedor_id} onChange={(e) => setCabecera((p) => ({ ...p, proveedor_id: e.target.value }))} className={inputClass} required>
                    <option value="">Seleccionar</option>
                    {proveedores.map((p) => <option key={p.proveedor_id} value={p.proveedor_id}>{p.razon_social}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Almacén (ID) *</Label>
                  <input type="text" placeholder="UUID almacén de destino" value={cabecera.almacen_id} onChange={(e) => setCabecera((p) => ({ ...p, almacen_id: e.target.value }))} className={inputClass} required />
                </div>
                <div>
                  <Label>Fecha recepción</Label>
                  <input type="date" value={cabecera.fecha_recepcion ?? ''} onChange={(e) => setCabecera((p) => ({ ...p, fecha_recepcion: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div>
                  <Label>Guía Remisión Nro</Label>
                  <input type="text" value={cabecera.guia_remision_numero ?? ''} onChange={(e) => setCabecera((p) => ({ ...p, guia_remision_numero: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div>
                  <Label>Guía Remisión Fecha</Label>
                  <input type="date" value={cabecera.guia_remision_fecha ?? ''} onChange={(e) => setCabecera((p) => ({ ...p, guia_remision_fecha: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div>
                  <Label>Transportista</Label>
                  <input type="text" value={cabecera.transportista ?? ''} onChange={(e) => setCabecera((p) => ({ ...p, transportista: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div>
                  <Label>Placa vehículo</Label>
                  <input type="text" value={cabecera.placa_vehiculo ?? ''} onChange={(e) => setCabecera((p) => ({ ...p, placa_vehiculo: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div>
                  <Label>Recepcionado por</Label>
                  <input type="text" value={cabecera.recepcionado_por_nombre ?? ''} onChange={(e) => setCabecera((p) => ({ ...p, recepcionado_por_nombre: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="req-inspeccion" checked={cabecera.requiere_inspeccion ?? false} onChange={(e) => setCabecera((p) => ({ ...p, requiere_inspeccion: e.target.checked }))} className="rounded" />
                  <Label htmlFor="req-inspeccion">Requiere inspección</Label>
                </div>
                <div className="md:col-span-2">
                  <Label>Observaciones</Label>
                  <textarea value={cabecera.observaciones ?? ''} onChange={(e) => setCabecera((p) => ({ ...p, observaciones: e.target.value || undefined }))} className={inputClass} rows={2} />
                </div>
                <div className="md:col-span-2">
                  <Label>Incidencias</Label>
                  <textarea value={cabecera.incidencias ?? ''} onChange={(e) => setCabecera((p) => ({ ...p, incidencias: e.target.value || undefined }))} className={inputClass} rows={2} />
                </div>
              </div>
            </div>

            {/* — Líneas — */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Líneas de recepción <span className="text-gray-400 font-normal">({lineas.length})</span>
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addLinea}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Agregar línea
                </Button>
              </div>
              <div className="space-y-4">
                {lineas.map((linea, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Línea {idx + 1}</span>
                      {lineas.length > 1 && (
                        <button type="button" onClick={() => removeLinea(idx)} className="text-red-400 hover:text-red-600 p-1" title="Eliminar línea">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">OC Detalle (ID) *</Label>
                        <input type="text" placeholder="UUID del ítem OC" value={linea.orden_compra_detalle_id} onChange={(e) => updateLinea(idx, 'orden_compra_detalle_id', e.target.value)} className="mt-1 w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white" required />
                      </div>
                      <div>
                        <Label className="text-xs">Producto (ID) *</Label>
                        <input type="text" placeholder="UUID producto" value={linea.producto_id} onChange={(e) => updateLinea(idx, 'producto_id', e.target.value)} className="mt-1 w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white" required />
                      </div>
                      <div>
                        <Label className="text-xs">Cant. Ordenada *</Label>
                        <input type="number" step="0.001" min={0} value={linea.cantidad_ordenada} onChange={(e) => updateLinea(idx, 'cantidad_ordenada', parseFloat(e.target.value) || 0)} className="mt-1 w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white" required />
                      </div>
                      <div>
                        <Label className="text-xs">Cant. Recibida *</Label>
                        <input type="number" step="0.001" min={0} value={linea.cantidad_recepcionada} onChange={(e) => updateLinea(idx, 'cantidad_recepcionada', parseFloat(e.target.value) || 0)} className="mt-1 w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white" required />
                      </div>
                      <div>
                        <Label className="text-xs">U.M. (ID)</Label>
                        <input type="text" placeholder="UUID unidad medida" value={linea.unidad_medida_id} onChange={(e) => updateLinea(idx, 'unidad_medida_id', e.target.value)} className="mt-1 w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white" />
                      </div>
                      <div>
                        <Label className="text-xs">P. Unitario</Label>
                        <input type="number" step="0.000001" min={0} placeholder="0.00" value={linea.precio_unitario} onChange={(e) => updateLinea(idx, 'precio_unitario', e.target.value === '' ? '' : parseFloat(e.target.value))} className="mt-1 w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white" />
                      </div>
                      <div>
                        <Label className="text-xs">Lote</Label>
                        <input type="text" value={linea.lote} onChange={(e) => updateLinea(idx, 'lote', e.target.value)} className="mt-1 w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white" />
                      </div>
                      <div>
                        <Label className="text-xs">Fecha vencimiento</Label>
                        <input type="date" value={linea.fecha_vencimiento} onChange={(e) => updateLinea(idx, 'fecha_vencimiento', e.target.value)} className="mt-1 w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white" />
                      </div>
                      <div>
                        <Label className="text-xs">Ubicación almacén</Label>
                        <input type="text" value={linea.ubicacion_almacen} onChange={(e) => updateLinea(idx, 'ubicacion_almacen', e.target.value)} className="mt-1 w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white" />
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-xs">Motivo diferencia</Label>
                        <input type="text" value={linea.motivo_diferencia} onChange={(e) => updateLinea(idx, 'motivo_diferencia', e.target.value)} className="mt-1 w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createTransaccionalMut.isPending} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
                {createTransaccionalMut.isPending ? 'Creando...' : 'Crear recepción'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══ Modal Editar cabecera ══ */}
      <Dialog open={editOpen} onOpenChange={(o) => { if (!o) setEditing(null); setEditOpen(o); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar cabecera de recepción</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><Label>Número *</Label><input type="text" value={editForm.numero_recepcion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, numero_recepcion: e.target.value }))} className={inputClass} required /></div>
            <div>
              <Label>Proveedor *</Label>
              <select value={editForm.proveedor_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, proveedor_id: e.target.value }))} className={inputClass} required>
                <option value="">Seleccionar</option>
                {proveedores.map((p) => <option key={p.proveedor_id} value={p.proveedor_id}>{p.razon_social}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Guía Remisión Nro</Label><input type="text" value={editForm.guia_remision_numero ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, guia_remision_numero: e.target.value || undefined }))} className={inputClass} /></div>
              <div><Label>Guía Remisión Fecha</Label><input type="date" value={editForm.guia_remision_fecha ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, guia_remision_fecha: e.target.value || undefined }))} className={inputClass} /></div>
              <div><Label>Transportista</Label><input type="text" value={editForm.transportista ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, transportista: e.target.value || undefined }))} className={inputClass} /></div>
              <div><Label>Placa vehículo</Label><input type="text" value={editForm.placa_vehiculo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, placa_vehiculo: e.target.value || undefined }))} className={inputClass} /></div>
              <div><Label>Recepcionado por</Label><input type="text" value={editForm.recepcionado_por_nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, recepcionado_por_nombre: e.target.value || undefined }))} className={inputClass} /></div>
            </div>
            <div><Label>Observaciones</Label><textarea value={editForm.observaciones ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} className={inputClass} rows={2} /></div>
            <div><Label>Incidencias</Label><textarea value={editForm.incidencias ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, incidencias: e.target.value || undefined }))} className={inputClass} rows={2} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateMut.isPending} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══ Modal Anular ══ */}
      <Dialog open={anularOpen} onOpenChange={setAnularOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Anular recepción</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿Confirma anular la recepción <strong>{anularTarget?.numero_recepcion}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnularOpen(false)}>Cancelar</Button>
            <Button onClick={handleAnular} disabled={anularMut.isPending} className="bg-red-600 hover:bg-red-700 text-white">Anular</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PurPageLayout>
  );
}
