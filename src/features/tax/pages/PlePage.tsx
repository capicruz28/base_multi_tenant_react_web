/**
 * PLE SUNAT — Libros Electrónicos.
 * Endpoints: GET/POST /api/v1/tax/libros-electronicos
 *            PUT/POST /api/v1/tax/libros-electronicos/{id}
 *            POST /api/v1/tax/libros-electronicos/{id}/marcar-generado
 *            POST /api/v1/tax/libros-electronicos/{id}/registrar-envio
 *            POST /api/v1/tax/libros-electronicos/{id}/anular
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, FileText, Plus, Pencil, CheckCircle, Send, XCircle, Eye } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { periodoContableService } from '@/features/fin/services/fin.service';
import {
  useLibrosElectronicos,
  useCreateLibroElectronico,
  useUpdateLibroElectronico,
  useMarcarGenerado,
  useRegistrarEnvio,
  useAnularLibro,
} from '../hooks/useLibrosElectronicos';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import type { Empresa } from '@/features/org/types/org.types';
import type { PeriodoContable } from '@/features/fin/types/fin.types';
import type {
  EstadoLibroTax,
  LibroElectronico,
  LibroElectronicoCreate,
  LibroElectronicoRegistrarEnvio,
  LibroElectronicoUpdate,
} from '../types/tax.types';
import { TaxPageLayout } from '../components/TaxPageLayout';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

// ─── Constantes ──────────────────────────────────────────────────────────────

const TIPOS_LIBRO: { value: LibroElectronicoCreate['tipo_libro']; label: string }[] = [
  { value: 'ventas', label: 'Ventas' },
  { value: 'compras', label: 'Compras' },
  { value: 'diario', label: 'Diario' },
  { value: 'mayor', label: 'Mayor' },
  { value: 'inventarios', label: 'Inventarios' },
];

const ESTADOS: EstadoLibroTax[] = ['borrador', 'generado', 'enviado', 'anulado'];

const MESES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ESTADO_BADGE: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  generado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  enviado: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  anulado: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

function EstadoBadge({ estado }: { estado: string | null }) {
  const cls = estado ? (ESTADO_BADGE[estado] ?? 'bg-gray-100 text-gray-600') : 'bg-gray-100 text-gray-400';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {estado ?? '—'}
    </span>
  );
}

const DEFAULT_CREATE: LibroElectronicoCreate = {
  empresa_id: '',
  tipo_libro: 'ventas',
  periodo_id: '',
  anio: currentYear,
  mes: new Date().getMonth() + 1,
};

const DEFAULT_ENVIO: LibroElectronicoRegistrarEnvio = {
  fecha_envio_sunat: undefined,
  codigo_respuesta_sunat: undefined,
};

const inputCls =
  'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';
const selectCls =
  'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PlePage() {
  const navigate = useNavigate();
  const { can } = usePermissions();

  const canCrear = can('tax', 'crear');
  const canEditar = can('tax', 'editar');

  // ── Empresas y periodos (datos auxiliares, no del módulo TAX) ──────────────
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [periodosEnModal, setPeriodosEnModal] = useState<PeriodoContable[]>([]);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [anioFilter, setAnioFilter] = useState<number>(currentYear);
  const [mesFilter, setMesFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');

  // ── Modales ────────────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<LibroElectronico | null>(null);
  const [envioOpen, setEnvioOpen] = useState(false);
  const [envioTarget, setEnvioTarget] = useState<LibroElectronico | null>(null);
  const [anularOpen, setAnularOpen] = useState(false);
  const [anularTarget, setAnularTarget] = useState<LibroElectronico | null>(null);

  // ── Forms ──────────────────────────────────────────────────────────────────
  const [form, setForm] = useState<LibroElectronicoCreate>(DEFAULT_CREATE);
  const [editForm, setEditForm] = useState<LibroElectronicoUpdate>({});
  const [envioForm, setEnvioForm] = useState<LibroElectronicoRegistrarEnvio>(DEFAULT_ENVIO);

  // ── React Query — lista ────────────────────────────────────────────────────
  const {
    data: list = [],
    isLoading,
    isError,
    error,
  } = useLibrosElectronicos({
    empresa_id: empresaFilter || undefined,
    tipo_libro: tipoFilter || undefined,
    anio: anioFilter,
    mes: mesFilter ? parseInt(mesFilter, 10) : undefined,
    estado: (estadoFilter as EstadoLibroTax) || undefined,
  });

  // ── React Query — mutaciones ───────────────────────────────────────────────
  const createMutation = useCreateLibroElectronico();
  const updateMutation = useUpdateLibroElectronico();
  const marcarGeneradoMutation = useMarcarGenerado();
  const registrarEnvioMutation = useRegistrarEnvio();
  const anularMutation = useAnularLibro();

  // ── Cargar empresas ────────────────────────────────────────────────────────
  const loadEmpresas = useCallback(async () => {
    try {
      const data = await empresaService.list({ solo_activos: true });
      setEmpresas(data);
      if (data.length === 1 && !empresaFilter) setEmpresaFilter(data[0].empresa_id);
    } catch {
      setEmpresas([]);
    }
  }, [empresaFilter]);

  useEffect(() => {
    loadEmpresas();
  }, [loadEmpresas]);

  // ── Cargar periodos para el modal ──────────────────────────────────────────
  const loadPeriodosParaEmpresa = useCallback(async (empresaId: string) => {
    if (!empresaId) {
      setPeriodosEnModal([]);
      return [];
    }
    try {
      const data = await periodoContableService.list({ empresa_id: empresaId });
      const arr = Array.isArray(data) ? data : [];
      setPeriodosEnModal(arr);
      return arr;
    } catch {
      setPeriodosEnModal([]);
      return [];
    }
  }, []);

  // ── Crear ──────────────────────────────────────────────────────────────────
  const openCreate = async () => {
    const empId = empresaFilter || empresas[0]?.empresa_id || '';
    setForm({ ...DEFAULT_CREATE, empresa_id: empId });
    setCreateOpen(true);
    if (empId) {
      const periodos = await loadPeriodosParaEmpresa(empId);
      if (periodos.length > 0) {
        setForm((p) => ({
          ...p,
          periodo_id: periodos[0].periodo_id,
          anio: periodos[0].año,
          mes: periodos[0].mes as LibroElectronicoCreate['mes'],
        }));
      }
    }
  };

  const onCreateEmpresaChange = async (empresaId: string) => {
    setForm((p) => ({
      ...p,
      empresa_id: empresaId,
      periodo_id: '',
      anio: currentYear,
      mes: new Date().getMonth() + 1,
    }));
    const periodos = await loadPeriodosParaEmpresa(empresaId);
    if (periodos.length > 0) {
      setForm((p) => ({
        ...p,
        periodo_id: periodos[0].periodo_id,
        anio: periodos[0].año,
        mes: periodos[0].mes as LibroElectronicoCreate['mes'],
      }));
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form, {
      onSuccess: () => setCreateOpen(false),
    });
  };

  // ── Editar ─────────────────────────────────────────────────────────────────
  const openEdit = (row: LibroElectronico) => {
    setEditing(row);
    setEditForm({
      nombre_archivo: row.nombre_archivo ?? undefined,
      ruta_archivo: row.ruta_archivo ?? undefined,
      fecha_envio_sunat: row.fecha_envio_sunat ?? undefined,
      codigo_respuesta_sunat: row.codigo_respuesta_sunat ?? undefined,
      total_registros: row.total_registros ?? undefined,
      observaciones: row.observaciones ?? undefined,
      generado_por_usuario_id: row.generado_por_usuario_id ?? undefined,
    });
    setEditOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    updateMutation.mutate(
      { libroId: editing.libro_id, payload: editForm },
      { onSuccess: () => { setEditOpen(false); setEditing(null); } }
    );
  };

  // ── Transición: marcar generado ────────────────────────────────────────────
  const handleMarcarGenerado = (row: LibroElectronico) => {
    marcarGeneradoMutation.mutate({ libroId: row.libro_id });
  };

  // ── Transición: registrar envío ────────────────────────────────────────────
  const openRegistrarEnvio = (row: LibroElectronico) => {
    setEnvioTarget(row);
    setEnvioForm(DEFAULT_ENVIO);
    setEnvioOpen(true);
  };

  const handleRegistrarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!envioTarget) return;
    registrarEnvioMutation.mutate(
      { libroId: envioTarget.libro_id, payload: envioForm },
      { onSuccess: () => { setEnvioOpen(false); setEnvioTarget(null); } }
    );
  };

  // ── Transición: anular ─────────────────────────────────────────────────────
  const openAnular = (row: LibroElectronico) => {
    setAnularTarget(row);
    setAnularOpen(true);
  };

  const handleAnular = () => {
    if (!anularTarget) return;
    anularMutation.mutate(
      { libroId: anularTarget.libro_id },
      { onSuccess: () => { setAnularOpen(false); setAnularTarget(null); } }
    );
  };

  // ── Helper: formato periodo ────────────────────────────────────────────────
  const formatPeriodo = (p: PeriodoContable) => `${p.año} / ${String(p.mes).padStart(2, '0')}`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <TaxPageLayout
      title="PLE SUNAT — Libros Electrónicos"
      description="Registro y seguimiento de libros electrónicos (ventas, compras, diario, mayor, inventarios)."
      action={
        canCrear ? (
          <Button
            onClick={openCreate}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            disabled={!empresas.length}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo libro
          </Button>
        ) : undefined
      }
    >
      {/* Filtros */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4 flex-wrap">
        {empresas.length > 0 && (
          <div>
            <Label className="mr-2">Empresa</Label>
            <select
              value={empresaFilter}
              onChange={(e) => setEmpresaFilter(e.target.value)}
              className={selectCls}
            >
              <option value="">Todas</option>
              {empresas.map((e) => (
                <option key={e.empresa_id} value={e.empresa_id}>
                  {e.razon_social}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label className="mr-2">Tipo libro</Label>
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className={selectCls}
          >
            <option value="">Todos</option>
            {TIPOS_LIBRO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="mr-2">Año</Label>
          <select
            value={anioFilter}
            onChange={(e) => setAnioFilter(parseInt(e.target.value, 10))}
            className={selectCls}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="mr-2">Mes</Label>
          <select
            value={mesFilter}
            onChange={(e) => setMesFilter(e.target.value)}
            className={selectCls}
          >
            <option value="">Todos</option>
            {MESES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="mr-2">Estado</Label>
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className={selectCls}
          >
            <option value="">Todos</option>
            {ESTADOS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Estados de carga / error */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}
      {isError && !isLoading && (
        <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {(error as Error)?.message ?? 'Error al cargar los libros electrónicos.'}
        </p>
      )}

      {/* Tabla */}
      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Periodo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Archivo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Registros
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Generado
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    No hay libros electrónicos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.libro_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {row.tipo_libro}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.anio} / {String(row.mes).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.nombre_archivo ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={row.estado} />
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                      {row.total_registros ?? 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.fecha_generacion
                        ? new Date(row.fecha_generacion).toLocaleString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* Ver detalle */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/tax/ple/${row.libro_id}`)}
                          title="Ver detalle"
                          className="text-gray-500 hover:text-brand-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Editar */}
                        {canEditar && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(row)}
                            title="Editar"
                            className="text-brand-primary hover:text-brand-primary/80"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Marcar generado (solo en borrador) */}
                        {canEditar && row.estado === 'borrador' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMarcarGenerado(row)}
                            title="Marcar como generado"
                            disabled={marcarGeneradoMutation.isPending}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Registrar envío (solo en generado) */}
                        {canEditar && row.estado === 'generado' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openRegistrarEnvio(row)}
                            title="Registrar envío a SUNAT"
                            className="text-green-600 hover:text-green-800 dark:text-green-400"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Anular (en cualquier estado excepto ya anulado) */}
                        {canEditar && row.estado !== 'anulado' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openAnular(row)}
                            title="Anular"
                            disabled={anularMutation.isPending}
                            className="text-red-600 hover:text-red-800 dark:text-red-400"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal: Crear ─────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar libro electrónico</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Empresa *</Label>
                <select
                  value={form.empresa_id}
                  onChange={(e) => onCreateEmpresaChange(e.target.value)}
                  className={selectCls}
                  required
                >
                  <option value="">Seleccionar</option>
                  {empresas.map((e) => (
                    <option key={e.empresa_id} value={e.empresa_id}>
                      {e.razon_social}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Tipo libro *</Label>
                <select
                  value={form.tipo_libro}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      tipo_libro: e.target.value as LibroElectronicoCreate['tipo_libro'],
                    }))
                  }
                  className={selectCls}
                  required
                >
                  {TIPOS_LIBRO.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <Label>Periodo contable *</Label>
                <select
                  value={form.periodo_id}
                  onChange={(e) => {
                    const p = periodosEnModal.find((x) => x.periodo_id === e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      periodo_id: e.target.value,
                      anio: p?.año ?? prev.anio,
                      mes: (p?.mes ?? prev.mes) as LibroElectronicoCreate['mes'],
                    }));
                  }}
                  className={selectCls}
                  required
                >
                  <option value="">Seleccionar</option>
                  {periodosEnModal.map((p) => (
                    <option key={p.periodo_id} value={p.periodo_id}>
                      {formatPeriodo(p)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Año *</Label>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={form.anio}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, anio: parseInt(e.target.value, 10) }))
                  }
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <Label>Mes *</Label>
                <select
                  value={form.mes}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      mes: parseInt(e.target.value, 10) as LibroElectronicoCreate['mes'],
                    }))
                  }
                  className={selectCls}
                  required
                >
                  {MESES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Nombre archivo</Label>
                <input
                  type="text"
                  value={form.nombre_archivo ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nombre_archivo: e.target.value || undefined }))
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <Label>Ruta archivo</Label>
                <input
                  type="text"
                  value={form.ruta_archivo ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, ruta_archivo: e.target.value || undefined }))
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <Label>Total registros</Label>
                <input
                  type="number"
                  min={0}
                  value={form.total_registros ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      total_registros: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    }))
                  }
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <Label>Observaciones</Label>
              <textarea
                value={form.observaciones ?? ''}
                onChange={(e) =>
                  setForm((p) => ({ ...p, observaciones: e.target.value || undefined }))
                }
                className={inputCls}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white"
              >
                {createMutation.isPending ? 'Guardando...' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Editar ─────────────────────────────────────────────────── */}
      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
          setEditOpen(o);
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar libro electrónico</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre archivo</Label>
                <input
                  type="text"
                  value={editForm.nombre_archivo ?? ''}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      nombre_archivo: e.target.value || undefined,
                    }))
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <Label>Ruta archivo</Label>
                <input
                  type="text"
                  value={editForm.ruta_archivo ?? ''}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      ruta_archivo: e.target.value || undefined,
                    }))
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <Label>Fecha envío SUNAT</Label>
                <input
                  type="datetime-local"
                  value={
                    editForm.fecha_envio_sunat
                      ? editForm.fecha_envio_sunat.slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      fecha_envio_sunat: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    }))
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <Label>Código respuesta SUNAT</Label>
                <input
                  type="text"
                  maxLength={10}
                  value={editForm.codigo_respuesta_sunat ?? ''}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      codigo_respuesta_sunat: e.target.value || undefined,
                    }))
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <Label>Total registros</Label>
                <input
                  type="number"
                  min={0}
                  value={editForm.total_registros ?? ''}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      total_registros: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    }))
                  }
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <Label>Observaciones</Label>
              <textarea
                value={editForm.observaciones ?? ''}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    observaciones: e.target.value || undefined,
                  }))
                }
                className={inputCls}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white"
              >
                {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Registrar envío a SUNAT ────────────────────────────────── */}
      <Dialog
        open={envioOpen}
        onOpenChange={(o) => {
          if (!o) setEnvioTarget(null);
          setEnvioOpen(o);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar envío a SUNAT</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            El libro pasará al estado <strong>enviado</strong>. Puedes registrar los datos
            del envío (opcionales).
          </p>
          <form onSubmit={handleRegistrarEnvio} className="space-y-4">
            <div>
              <Label>Fecha envío SUNAT</Label>
              <input
                type="datetime-local"
                value={
                  envioForm.fecha_envio_sunat
                    ? envioForm.fecha_envio_sunat.slice(0, 16)
                    : ''
                }
                onChange={(e) =>
                  setEnvioForm((p) => ({
                    ...p,
                    fecha_envio_sunat: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <Label>Código respuesta SUNAT</Label>
              <input
                type="text"
                maxLength={10}
                value={envioForm.codigo_respuesta_sunat ?? ''}
                onChange={(e) =>
                  setEnvioForm((p) => ({
                    ...p,
                    codigo_respuesta_sunat: e.target.value || undefined,
                  }))
                }
                className={inputCls}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEnvioOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={registrarEnvioMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {registrarEnvioMutation.isPending ? 'Registrando...' : 'Registrar envío'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Confirmar anulación ───────────────────────────────────── */}
      <Dialog
        open={anularOpen}
        onOpenChange={(o) => {
          if (!o) setAnularTarget(null);
          setAnularOpen(o);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar anulación</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿Estás seguro de que deseas anular el libro{' '}
            <strong>{anularTarget?.tipo_libro}</strong> del período{' '}
            <strong>
              {anularTarget?.anio} / {String(anularTarget?.mes ?? '').padStart(2, '0')}
            </strong>
            ? Esta acción no se puede deshacer.
          </p>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAnularOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAnular}
              disabled={anularMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {anularMutation.isPending ? 'Anulando...' : 'Anular libro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TaxPageLayout>
  );
}
