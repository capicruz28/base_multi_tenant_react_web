/**
 * Solicitudes de Compra — Gestión completa con flujo de aprobación.
 * Creación vía endpoint transaccional (cabecera + líneas en una sola llamada).
 * Edición de líneas individuales vía PUT /solicitudes-detalle/{id}.
 */
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Loader, ShoppingCart, Plus, Pencil, Check, X, Ban,
  ChevronDown, ChevronRight, Trash2,
} from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import type { Empresa } from '@/features/org/types/org.types';
import { unidadMedidaService } from '@/features/inv/services/inv.service';
import type { UnidadMedida } from '@/features/inv/types/inv.types';
import { getErrorMessage } from '@/core/services/error.service';
import type {
  SolicitudCompra,
  SolicitudCompraCreate,
  SolicitudCompraUpdate,
  SolicitudCompraDetalle,
  SolicitudCompraDetalleUpdate,
  SolicitudCompraTransaccionalCreate,
  PurListParams,
} from '../types/pur.types';
import { PurPageLayout } from '../components/PurPageLayout';
import { solicitudCompraDetalleService } from '../services/pur.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import {
  useSolicitudesCompra,
  useSolicitudDetalle,
  useUpdateSolicitudCompra,
  useAprobarSolicitud,
  useRechazarSolicitud,
  useAnularSolicitud,
  useMarcarProcesadaSolicitud,
  useCreateSolicitudTransaccional,
} from '../hooks/useSolicitudesCompra';

const inputClass =
  'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

const ESTADOS_SOLICITUD = ['borrador', 'pendiente', 'aprobada', 'rechazada', 'procesada', 'anulada'] as const;
const TIPOS_SOLICITUD = ['compra', 'servicio', 'mixto'] as const;

interface LineaForm {
  producto_id: string;
  cantidad_solicitada: number;
  unidad_medida_id: string;
  precio_referencial: number | '';
  observaciones: string;
}

const LINEA_DEFAULT: LineaForm = {
  producto_id: '',
  cantidad_solicitada: 1,
  unidad_medida_id: '',
  precio_referencial: '',
  observaciones: '',
};

const CABECERA_DEFAULT: SolicitudCompraCreate = {
  empresa_id: '',
  numero_solicitud: '',
  fecha_requerida: '',
  usuario_solicitante_id: '',
  moneda_id: '',
  estado: 'borrador',
};

function estadoBadge(estado: string | undefined) {
  const map: Record<string, string> = {
    aprobada: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rechazada: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    anulada: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    pendiente: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    procesada: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
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
  solicitudId,
  unidades,
  canWrite,
}: {
  solicitudId: string;
  unidades: UnidadMedida[];
  canWrite: boolean;
}) {
  const qc = useQueryClient();
  const { data: lineas = [], isLoading } = useSolicitudDetalle(solicitudId);

  const [editOpen, setEditOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<SolicitudCompraDetalle | null>(null);
  const [editForm, setEditForm] = useState<SolicitudCompraDetalleUpdate>({});

  const updateLineMut = useMutation<SolicitudCompraDetalle, Error, { id: string; payload: SolicitudCompraDetalleUpdate }>({
    mutationFn: ({ id, payload }) => solicitudCompraDetalleService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pur', 'solicitudes-detalle', solicitudId] });
      toast.success('Línea actualizada.');
      setEditOpen(false);
      setEditingLine(null);
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });

  const openEditLine = (line: SolicitudCompraDetalle) => {
    setEditingLine(line);
    setEditForm({
      cantidad_solicitada: parseFloat(line.cantidad_solicitada) || 1,
      unidad_medida_id: line.unidad_medida_id,
      precio_referencial: line.precio_referencial ? parseFloat(line.precio_referencial) : undefined,
      observaciones: line.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLine) return;
    updateLineMut.mutate({ id: editingLine.solicitud_detalle_id, payload: editForm });
  };

  if (isLoading) {
    return (
      <tr>
        <td colSpan={8} className="text-center py-3 text-sm text-gray-400">
          Cargando líneas...
        </td>
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
                  <th className="text-right px-3 py-1.5 text-gray-600 dark:text-gray-300">Cant. Solic.</th>
                  <th className="text-right px-3 py-1.5 text-gray-600 dark:text-gray-300">U.M.</th>
                  <th className="text-right px-3 py-1.5 text-gray-600 dark:text-gray-300">Precio Ref.</th>
                  <th className="text-right px-3 py-1.5 text-gray-600 dark:text-gray-300">Total Ref.</th>
                  <th className="text-right px-3 py-1.5 text-gray-600 dark:text-gray-300">Cant. Pend.</th>
                  <th className="text-left px-3 py-1.5 text-gray-600 dark:text-gray-300">Obs.</th>
                  {canWrite && <th className="text-center px-3 py-1.5" />}
                </tr>
              </thead>
              <tbody>
                {lineas.map((line) => (
                  <tr key={line.solicitud_detalle_id} className="border-t border-blue-100 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/10">
                    <td className="px-3 py-1.5 font-mono text-gray-700 dark:text-gray-300">{line.producto_id}</td>
                    <td className="px-3 py-1.5 text-right text-gray-700 dark:text-gray-300">{line.cantidad_solicitada}</td>
                    <td className="px-3 py-1.5 text-right text-gray-500 dark:text-gray-400">
                      {unidades.find((u) => u.unidad_medida_id === line.unidad_medida_id)?.codigo ?? line.unidad_medida_id}
                    </td>
                    <td className="px-3 py-1.5 text-right text-gray-700 dark:text-gray-300">
                      {line.precio_referencial ? parseFloat(line.precio_referencial).toFixed(2) : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium text-gray-900 dark:text-white">
                      {line.total_referencial ? parseFloat(line.total_referencial).toFixed(2) : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-right text-gray-700 dark:text-gray-300">
                      {line.cantidad_pendiente ?? '—'}
                    </td>
                    <td className="px-3 py-1.5 text-gray-500 dark:text-gray-400 max-w-[120px] truncate">
                      {line.observaciones ?? ''}
                    </td>
                    {canWrite && (
                      <td className="px-3 py-1.5 text-center">
                        <button
                          onClick={() => openEditLine(line)}
                          className="text-brand-primary hover:text-brand-primary/70 p-0.5"
                          title="Editar línea"
                        >
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
          <DialogHeader><DialogTitle>Editar línea de solicitud</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <div>
              <Label>Producto</Label>
              <p className="mt-1 text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded px-3 py-2">
                {editingLine?.producto_id}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cantidad *</Label>
                <input
                  type="number"
                  step="0.01"
                  min={0.01}
                  value={editForm.cantidad_solicitada ?? 1}
                  onChange={(e) => setEditForm((p) => ({ ...p, cantidad_solicitada: parseFloat(e.target.value) || 1 }))}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <Label>Unidad de medida</Label>
                <select
                  value={editForm.unidad_medida_id ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, unidad_medida_id: e.target.value || undefined }))}
                  className={inputClass}
                >
                  <option value="">— Seleccionar —</option>
                  {unidades.map((u) => (
                    <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.nombre} ({u.codigo})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Precio Ref.</Label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={editForm.precio_referencial ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, precio_referencial: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <Label>Observaciones</Label>
              <input
                type="text"
                value={editForm.observaciones ?? ''}
                onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value || undefined }))}
                className={inputClass}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateLineMut.isPending} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── Página principal ───────────────────────────────────────────────────── */
export default function SolicitudesPage() {
  const { can } = usePermissions();
  const canWrite = can('compras', 'crear') || can('compras', 'editar');
  const canAprobar = can('compras', 'aprobar') || can('compras', 'editar');

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [empresaFilter, setEmpresaFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  /* Create state */
  const [createOpen, setCreateOpen] = useState(false);
  const [cabecera, setCabecera] = useState<SolicitudCompraCreate>(CABECERA_DEFAULT);
  const [lineas, setLineas] = useState<LineaForm[]>([{ ...LINEA_DEFAULT }]);

  /* Edit cabecera state */
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<SolicitudCompra | null>(null);
  const [editForm, setEditForm] = useState<SolicitudCompraUpdate>({});

  /* Anular state */
  const [anularOpen, setAnularOpen] = useState(false);
  const [anularTarget, setAnularTarget] = useState<SolicitudCompra | null>(null);
  const [anularMotivo, setAnularMotivo] = useState('');

  const listParams: PurListParams = {
    ...(empresaFilter ? { empresa_id: empresaFilter } : {}),
    ...(estadoFilter ? { estado: estadoFilter } : {}),
    page,
    page_size: 20,
  };

  const { data: list = [], isLoading, error } = useSolicitudesCompra(listParams);
  const createTransaccionalMut = useCreateSolicitudTransaccional();
  const updateMut = useUpdateSolicitudCompra();
  const aprobarMut = useAprobarSolicitud();
  const rechazarMut = useRechazarSolicitud();
  const anularMut = useAnularSolicitud();
  const procesarMut = useMarcarProcesadaSolicitud();

  useEffect(() => {
    empresaService.list({ solo_activos: true }).then((data) => {
      setEmpresas(data);
      if (data.length === 1) setEmpresaFilter(data[0].empresa_id);
    }).catch(() => setEmpresas([]));
    unidadMedidaService.list({ solo_activos: true }).then(setUnidades).catch(() => setUnidades([]));
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /* ── Líneas helpers ── */
  const addLinea = () => setLineas((prev) => [...prev, { ...LINEA_DEFAULT }]);
  const removeLinea = (idx: number) => setLineas((prev) => prev.filter((_, i) => i !== idx));
  const updateLinea = (idx: number, field: keyof LineaForm, value: string | number) => {
    setLineas((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const openCreate = () => {
    setCabecera({
      ...CABECERA_DEFAULT,
      empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? ''),
      numero_solicitud: `SC-${Date.now()}`,
    });
    setLineas([{ ...LINEA_DEFAULT }]);
    setCreateOpen(true);
  };

  const openEdit = (row: SolicitudCompra) => {
    setEditing(row);
    setEditForm({
      numero_solicitud: row.numero_solicitud,
      fecha_requerida: row.fecha_requerida,
      tipo_solicitud: row.tipo_solicitud ?? undefined,
      motivo_solicitud: row.motivo_solicitud ?? undefined,
      observaciones: row.observaciones ?? undefined,
      moneda_id: row.moneda_id,
    });
    setEditOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (lineas.length === 0) {
      toast.error('Debe agregar al menos una línea.');
      return;
    }
    const payload: SolicitudCompraTransaccionalCreate = {
      cabecera,
      detalle: lineas.map((l) => ({
        empresa_id: cabecera.empresa_id,
        solicitud_id: '',
        producto_id: l.producto_id,
        cantidad_solicitada: l.cantidad_solicitada,
        unidad_medida_id: l.unidad_medida_id,
        precio_referencial: l.precio_referencial === '' ? undefined : (l.precio_referencial as number),
        observaciones: l.observaciones || null,
      })),
    };
    createTransaccionalMut.mutate(payload, { onSuccess: () => setCreateOpen(false) });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    updateMut.mutate({ id: editing.solicitud_id, payload: editForm }, {
      onSuccess: () => { setEditOpen(false); setEditing(null); },
    });
  };

  const openAnular = (row: SolicitudCompra) => {
    setAnularTarget(row);
    setAnularMotivo('');
    setAnularOpen(true);
  };

  const handleAnular = () => {
    if (!anularTarget) return;
    anularMut.mutate({ id: anularTarget.solicitud_id, motivo: anularMotivo || undefined }, {
      onSuccess: () => { setAnularOpen(false); setAnularTarget(null); },
    });
  };

  return (
    <PurPageLayout
      title="Solicitudes de Compra"
      description="Gestión del flujo de solicitudes con aprobación."
      action={
        canWrite ? (
          <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
            <Plus className="h-4 w-4 mr-2" /> Nueva solicitud
          </Button>
        ) : undefined
      }
    >
      {/* Filtros */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4 flex-wrap">
        {empresas.length > 1 && (
          <div>
            <Label className="mr-2">Empresa</Label>
            <select value={empresaFilter} onChange={(e) => { setEmpresaFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white">
              <option value="">Todas</option>
              {empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}
            </select>
          </div>
        )}
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white">
            <option value="">Todos</option>
            {ESTADOS_SOLICITUD.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {isLoading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !isLoading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error.message}</p>}

      {!isLoading && !error && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="w-8 px-2" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha Solic.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Est.</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">OC Gen.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      Sin solicitudes.
                    </td>
                  </tr>
                ) : (
                  list.map((row) => (
                    <React.Fragment key={row.solicitud_id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-2 py-3 text-center">
                          <button
                            onClick={() => toggleExpand(row.solicitud_id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            title="Ver/ocultar líneas"
                          >
                            {expanded.has(row.solicitud_id)
                              ? <ChevronDown className="h-4 w-4" />
                              : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_solicitud}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_solicitud?.slice(0, 10) ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_solicitud ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                          {row.total_estimado ? parseFloat(row.total_estimado).toFixed(2) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.orden_compra_generada
                            ? <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Sí</span>
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">{estadoBadge(row.estado)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {canWrite && row.estado !== 'anulada' && row.estado !== 'aprobada' && (
                              <Button variant="ghost" size="icon" onClick={() => openEdit(row)} title="Editar cabecera" className="text-brand-primary hover:text-brand-primary/80">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canAprobar && row.estado === 'pendiente' && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => aprobarMut.mutate({ id: row.solicitud_id })} disabled={aprobarMut.isPending} title="Aprobar" className="text-green-600 hover:text-green-700">
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => rechazarMut.mutate({ id: row.solicitud_id })} disabled={rechazarMut.isPending} title="Rechazar" className="text-red-600 hover:text-red-700">
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {canAprobar && row.estado === 'aprobada' && (
                              <Button variant="ghost" size="icon" onClick={() => procesarMut.mutate({ id: row.solicitud_id })} disabled={procesarMut.isPending} title="Marcar procesada" className="text-blue-600 hover:text-blue-700">
                                <Check className="h-4 w-4" />
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
                      {expanded.has(row.solicitud_id) && (
                        <DetalleRow
                          solicitudId={row.solicitud_id}
                          unidades={unidades}
                          canWrite={canWrite}
                        />
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
            <span className="flex items-center text-sm text-gray-600 dark:text-gray-300">Página {page}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={list.length < 20}>Siguiente</Button>
          </div>
        </>
      )}

      {/* ══ Modal Crear (Transaccional) ══ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Solicitud de Compra</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-6">

            {/* — Cabecera — */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Datos de cabecera</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Empresa *</Label>
                  <select value={cabecera.empresa_id} onChange={(e) => setCabecera((p) => ({ ...p, empresa_id: e.target.value }))} className={inputClass} required>
                    <option value="">Seleccionar</option>
                    {empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Número *</Label>
                  <input type="text" value={cabecera.numero_solicitud} onChange={(e) => setCabecera((p) => ({ ...p, numero_solicitud: e.target.value }))} className={inputClass} required />
                </div>
                <div>
                  <Label>Fecha requerida *</Label>
                  <input type="date" value={cabecera.fecha_requerida} onChange={(e) => setCabecera((p) => ({ ...p, fecha_requerida: e.target.value }))} className={inputClass} required />
                </div>
                <div>
                  <Label>Tipo solicitud</Label>
                  <select value={cabecera.tipo_solicitud ?? ''} onChange={(e) => setCabecera((p) => ({ ...p, tipo_solicitud: e.target.value || undefined }))} className={inputClass}>
                    <option value="">Seleccionar</option>
                    {TIPOS_SOLICITUD.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Moneda (ID) *</Label>
                  <input type="text" placeholder="UUID de moneda" value={cabecera.moneda_id} onChange={(e) => setCabecera((p) => ({ ...p, moneda_id: e.target.value }))} className={inputClass} required />
                </div>
                <div>
                  <Label>Solicitante (usuario ID) *</Label>
                  <input type="text" value={cabecera.usuario_solicitante_id} onChange={(e) => setCabecera((p) => ({ ...p, usuario_solicitante_id: e.target.value }))} className={inputClass} required />
                </div>
                <div className="md:col-span-2">
                  <Label>Motivo</Label>
                  <textarea value={cabecera.motivo_solicitud ?? ''} onChange={(e) => setCabecera((p) => ({ ...p, motivo_solicitud: e.target.value || undefined }))} className={inputClass} rows={2} />
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
                  Líneas de detalle <span className="text-gray-400 font-normal">({lineas.length})</span>
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addLinea}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Agregar línea
                </Button>
              </div>
              <div className="space-y-3">
                {lineas.map((linea, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="col-span-4">
                      {idx === 0 && <Label className="text-xs mb-1">Producto (ID) *</Label>}
                      <input
                        type="text"
                        placeholder="UUID del producto"
                        value={linea.producto_id}
                        onChange={(e) => updateLinea(idx, 'producto_id', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs mb-1">Cantidad *</Label>}
                      <input
                        type="number"
                        step="0.01"
                        min={0.01}
                        value={linea.cantidad_solicitada}
                        onChange={(e) => updateLinea(idx, 'cantidad_solicitada', parseFloat(e.target.value) || 1)}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs mb-1">U.M. *</Label>}
                      <select
                        value={linea.unidad_medida_id}
                        onChange={(e) => updateLinea(idx, 'unidad_medida_id', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                        required
                      >
                        <option value="">—</option>
                        {unidades.map((u) => <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.codigo}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs mb-1">Precio Ref.</Label>}
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0.00"
                        value={linea.precio_referencial}
                        onChange={(e) => updateLinea(idx, 'precio_referencial', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {lineas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLinea(idx)}
                          className="text-red-400 hover:text-red-600 p-1"
                          title="Eliminar línea"
                        >
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
              <Button type="submit" disabled={createTransaccionalMut.isPending} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
                {createTransaccionalMut.isPending ? 'Creando...' : 'Crear solicitud'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══ Modal Editar cabecera ══ */}
      <Dialog open={editOpen} onOpenChange={(o) => { if (!o) setEditing(null); setEditOpen(o); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Editar cabecera de solicitud</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><Label>Número *</Label><input type="text" value={editForm.numero_solicitud ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, numero_solicitud: e.target.value }))} className={inputClass} required /></div>
            <div><Label>Fecha requerida *</Label><input type="date" value={editForm.fecha_requerida ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_requerida: e.target.value }))} className={inputClass} required /></div>
            <div>
              <Label>Tipo solicitud</Label>
              <select value={editForm.tipo_solicitud ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_solicitud: e.target.value || undefined }))} className={inputClass}>
                <option value="">Seleccionar</option>
                {TIPOS_SOLICITUD.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><Label>Motivo</Label><textarea value={editForm.motivo_solicitud ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, motivo_solicitud: e.target.value || undefined }))} className={inputClass} rows={2} /></div>
            <div><Label>Observaciones</Label><textarea value={editForm.observaciones ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} className={inputClass} rows={2} /></div>
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
          <DialogHeader><DialogTitle>Anular solicitud</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿Confirma anular <strong>{anularTarget?.numero_solicitud}</strong>?
          </p>
          <div className="mt-2">
            <Label>Motivo (opcional)</Label>
            <textarea value={anularMotivo} onChange={(e) => setAnularMotivo(e.target.value)} className={inputClass} rows={2} placeholder="Motivo de la anulación..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnularOpen(false)}>Cancelar</Button>
            <Button onClick={handleAnular} disabled={anularMut.isPending} className="bg-red-600 hover:bg-red-700 text-white">Anular</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PurPageLayout>
  );
}
