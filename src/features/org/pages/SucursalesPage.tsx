/**
 * Sucursales — Listado y gestión. GET/POST /api/v1/org/sucursales
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, MapPin, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { centroCostoService } from '../services/org.service';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import type { Empresa, Sucursal, SucursalCreate, SucursalUpdate } from '../types/org.types';
import type { CentroCosto } from '../types/org.types';
import type { CatPais, CatDepartamento, CatProvincia, CatDistrito } from '@/types/catalogos.types';
import { OrgPageLayout } from '../components/OrgPageLayout';
import { FormSection } from '../components/FormSection';
import { getErrorMessage } from '@/core/services/error.service';
import { catalogosService } from '@/core/services';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useEmpresas } from '../hooks/empresa.hooks';
import {
  useCreateSucursal,
  useDeleteSucursal,
  useReactivarSucursal,
  useSucursales,
  useUpdateSucursal,
} from '../hooks/sucursal.hooks';

const inputClass = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

const SUCURSAL_DEFAULT: SucursalCreate = {
  empresa_id: '',
  codigo: '',
  nombre: '',
  descripcion: '',
  tipo_sucursal: 'sede',
  direccion: '',
  referencia: '',
  telefono: '',
  email: '',
  responsable_nombre: '',
  centro_costo_id: undefined,
  zona_horaria: '',
  horario_atencion: '',
  fecha_apertura: undefined,
  fecha_cierre: undefined,
  es_casa_matriz: false,
  es_punto_venta: false,
  es_almacen: false,
  es_planta_produccion: false,
  es_activo: true,
};

export default function SucursalesPage() {
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Sucursal | null>(null);
  const [form, setForm] = useState<SucursalCreate>(SUCURSAL_DEFAULT);
  const [editForm, setEditForm] = useState<SucursalUpdate>({});
  const [deleteTarget, setDeleteTarget] = useState<Sucursal | null>(null);
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);
  const [paises, setPaises] = useState<CatPais[]>([]);
  const [departamentos, setDepartamentos] = useState<CatDepartamento[]>([]);
  const [provincias, setProvincias] = useState<CatProvincia[]>([]);
  const [distritos, setDistritos] = useState<CatDistrito[]>([]);
  const [selectedPaisId, setSelectedPaisId] = useState<string>('');
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState<string>('');
  const [selectedProvinciaId, setSelectedProvinciaId] = useState<string>('');
  const [selectedDistritoId, setSelectedDistritoId] = useState<string>('');

  const { can } = usePermissions();
  const canCrear = can('org', 'crear');
  const canEditar = can('org', 'editar');
  const canEliminar = can('org', 'eliminar');

  const empresasQuery = useEmpresas({ solo_activos: true });
  const empresas: Empresa[] = empresasQuery.data ?? [];
  useEffect(() => {
    if (empresas.length === 1 && !empresaFilter) setEmpresaFilter(empresas[0].empresa_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresas.length]);

  const listQuery = useSucursales({
    empresa_id: empresaFilter || undefined,
    solo_activos: !includeInactive,
    buscar,
  });
  const list: Sucursal[] = listQuery.data ?? [];
  const loading = listQuery.isLoading;
  const error = listQuery.error ? getErrorMessage(listQuery.error).message : null;

  const createSucursal = useCreateSucursal();
  const updateSucursal = useUpdateSucursal();
  const deleteSucursal = useDeleteSucursal();
  const reactivarSucursal = useReactivarSucursal();

  const submitting = createSucursal.isPending || updateSucursal.isPending;
  const deleting = deleteSucursal.isPending;
  const reactivatingId = reactivarSucursal.variables?.sucursalId ?? null;

  // Cargar catálogos geográficos una sola vez (igual que en EmpresaPage)
  useEffect(() => {
    catalogosService
      .listPaises({ solo_activos: true })
      .then(setPaises)
      .catch(() => setPaises([]));
    catalogosService
      .listDepartamentos({ solo_activos: true })
      .then(setDepartamentos)
      .catch(() => setDepartamentos([]));
    catalogosService
      .listProvincias({ solo_activos: true })
      .then(setProvincias)
      .catch(() => setProvincias([]));
    catalogosService
      .listDistritos({ solo_activos: true })
      .then(setDistritos)
      .catch(() => setDistritos([]));
  }, []);

  const openCreate = () => {
    const empId = empresaFilter || (empresas[0]?.empresa_id ?? '');
    setForm({ ...SUCURSAL_DEFAULT, empresa_id: empId });
    setSelectedPaisId('');
    setSelectedDepartamentoId('');
    setSelectedProvinciaId('');
    setSelectedDistritoId('');
    setCreateOpen(true);
    if (empId) centroCostoService.list({ empresa_id: empId, solo_activos: true }).then(setCentrosCosto).catch(() => setCentrosCosto([]));
    else setCentrosCosto([]);
  };
  const openEdit = (row: Sucursal) => {
    setEditing(row);
    const pid = row.pais_id ?? '';
    const did = row.departamento_id ?? '';
    const prid = row.provincia_id ?? '';
    const distid = row.distrito_id ?? '';
    setEditForm({
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      tipo_sucursal: row.tipo_sucursal ?? undefined,
      direccion: row.direccion ?? undefined,
      referencia: row.referencia ?? undefined,
      pais_id: pid || undefined,
      departamento_id: did || undefined,
      provincia_id: prid || undefined,
      distrito_id: distid || undefined,
      codigo_postal: row.codigo_postal ?? undefined,
      ubigeo: row.ubigeo ?? undefined,
      telefono: row.telefono ?? undefined,
      email: row.email ?? undefined,
      responsable_nombre: row.responsable_nombre ?? undefined,
      centro_costo_id: row.centro_costo_id ?? undefined,
      zona_horaria: row.zona_horaria ?? undefined,
      horario_atencion: row.horario_atencion ?? undefined,
      fecha_apertura: row.fecha_apertura ?? undefined,
      fecha_cierre: row.fecha_cierre ?? undefined,
      es_casa_matriz: row.es_casa_matriz ?? false,
      es_punto_venta: row.es_punto_venta ?? false,
      es_almacen: row.es_almacen ?? false,
      es_planta_produccion: row.es_planta_produccion ?? false,
      es_activo: row.es_activo,
    });
    setSelectedPaisId(pid);
    setSelectedDepartamentoId(did);
    setSelectedProvinciaId(prid);
    setSelectedDistritoId(distid);
    setEditOpen(true);
    if (row.empresa_id) centroCostoService.list({ empresa_id: row.empresa_id, solo_activos: true }).then(setCentrosCosto).catch(() => setCentrosCosto([]));
    else setCentrosCosto([]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo.trim() || !form.nombre.trim()) {
      toast.error('Selecciona empresa, código y nombre.');
      return;
    }
    try {
      const payload = { ...form };
      if (payload.fecha_apertura === '') delete payload.fecha_apertura;
      if (payload.fecha_cierre === '') delete payload.fecha_cierre;
      await createSucursal.mutateAsync(payload);
      setCreateOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const payload = { ...editForm };
      if (payload.fecha_apertura === '') delete payload.fecha_apertura;
      if (payload.fecha_cierre === '') delete payload.fecha_cierre;
      await updateSucursal.mutateAsync({
        sucursalId: editing.sucursal_id,
        payload,
        empresa_id: editing.empresa_id,
      });
      setEditOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSucursal.mutateAsync({ sucursalId: deleteTarget.sucursal_id, empresa_id: deleteTarget.empresa_id });
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const handleReactivar = async (row: Sucursal) => {
    try {
      await reactivarSucursal.mutateAsync({ sucursalId: row.sucursal_id, empresa_id: row.empresa_id });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const empresaNombre = (id: string) => empresas.find((e) => e.empresa_id === id)?.razon_social ?? id;

  return (
    <OrgPageLayout
      title="Sucursales"
      description="Gestionar sucursales con dirección, teléfono y responsable."
      action={
        canCrear ? (
          <Button
            onClick={openCreate}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            disabled={empresas.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear sucursal
          </Button>
        ) : null
      }
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        {empresas.length > 0 && (
          <div className="flex items-end gap-3">
            <div>
              <Label className="mr-2">Empresa</Label>
              <select
                value={empresaFilter}
                onChange={(e) => setEmpresaFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="">Todas</option>
                {empresas.map((e) => (
                  <option key={e.empresa_id} value={e.empresa_id}>
                    {e.razon_social}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <input
                type="checkbox"
                id="suc_include_inactive"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <Label htmlFor="suc_include_inactive">Ver inactivos</Label>
            </div>
          </div>
        )}
        <div className="w-full md:w-80">
          <Label htmlFor="buscar_sucursal">Buscar</Label>
          <input
            id="buscar_sucursal"
            type="text"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            placeholder="Código, nombre, dirección..."
          />
        </div>
        {empresas.length === 0 && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="suc_include_inactive2"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <Label htmlFor="suc_include_inactive2">Ver inactivos</Label>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}
      {error && !loading && (
        <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</p>
      )}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Responsable</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Principal</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    No hay sucursales.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.sucursal_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{empresaNombre(row.empresa_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_sucursal ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.telefono ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.responsable_nombre ?? '-'}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                      {row.es_casa_matriz ? 'Sí' : 'No'}
                    </td>
                    <td className="px-4 py-3 flex items-center justify-center gap-1">
                      {canEditar && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(row)}
                          className="text-brand-primary hover:text-brand-primary/80"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canEditar && !row.es_activo && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReactivar(row)}
                          disabled={!!reactivatingId}
                          className="text-green-600 hover:text-green-700"
                          title="Reactivar"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {canEliminar && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(row)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar sucursal"
        message={deleteTarget ? `¿Eliminar la sucursal "${deleteTarget.nombre}" (${deleteTarget.codigo})?` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Crear sucursal</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <div>
                    <Label>Empresa *</Label>
                    <select value={form.empresa_id} onChange={(e) => { const v = e.target.value; setForm((p) => ({ ...p, empresa_id: v })); if (v) centroCostoService.list({ empresa_id: v, solo_activos: true }).then(setCentrosCosto).catch(() => setCentrosCosto([])); else setCentrosCosto([]); }} className={inputClass} required>
                      <option value="">Seleccionar</option>
                      {empresas.map((e) => (<option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>))}
                    </select>
                  </div>
                  <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                  <div>
                    <Label>Tipo de sucursal</Label>
                    <select value={form.tipo_sucursal ?? 'sede'} onChange={(e) => setForm((p) => ({ ...p, tipo_sucursal: e.target.value }))} className={inputClass}>
                      <option value="sede">Sede</option>
                      <option value="punto_venta">Punto de venta</option>
                      <option value="almacen">Almacén</option>
                      <option value="virtual">Virtual</option>
                    </select>
                  </div>
                  <div><Label>Descripción</Label><input type="text" value={form.descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                </div>
              </FormSection>
              <FormSection title="Ubicación / Dirección">
                <div className="space-y-3">
                  <div><Label>Dirección</Label><input type="text" value={form.direccion ?? ''} onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Referencia</Label><input type="text" value={form.referencia ?? ''} onChange={(e) => setForm((p) => ({ ...p, referencia: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>País</Label>
                      <select
                        value={selectedPaisId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedPaisId(id);
                          setSelectedDepartamentoId('');
                          setSelectedProvinciaId('');
                          setSelectedDistritoId('');
                          setForm((p) => ({ ...p, pais_id: id || undefined, departamento_id: undefined, provincia_id: undefined, distrito_id: undefined }));
                        }}
                        className={inputClass}
                      >
                        <option value="">— Seleccionar —</option>
                        {paises.map((p) => (
                          <option key={p.pais_id} value={p.pais_id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Departamento</Label>
                      <select
                        value={selectedDepartamentoId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedDepartamentoId(id);
                          setSelectedProvinciaId('');
                          setSelectedDistritoId('');
                          setForm((p) => ({ ...p, departamento_id: id || undefined, provincia_id: undefined, distrito_id: undefined }));
                        }}
                        className={inputClass}
                      >
                        <option value="">— Seleccionar —</option>
                        {departamentos.filter((d) => !selectedPaisId || d.pais_id === selectedPaisId).map((d) => (
                          <option key={d.departamento_id} value={d.departamento_id}>{d.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Provincia</Label>
                      <select
                        value={selectedProvinciaId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedProvinciaId(id);
                          setSelectedDistritoId('');
                          setForm((p) => ({ ...p, provincia_id: id || undefined, distrito_id: undefined }));
                        }}
                        className={inputClass}
                      >
                        <option value="">— Seleccionar —</option>
                        {provincias.filter((p) => !selectedDepartamentoId || p.departamento_id === selectedDepartamentoId).map((p) => (
                          <option key={p.provincia_id} value={p.provincia_id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Distrito</Label>
                      <select
                        value={selectedDistritoId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedDistritoId(id);
                          setForm((p) => ({ ...p, distrito_id: id || undefined }));
                        }}
                        className={inputClass}
                      >
                        <option value="">— Seleccionar —</option>
                        {distritos.filter((d) => !selectedProvinciaId || d.provincia_id === selectedProvinciaId).map((d) => (
                          <option key={d.distrito_id} value={d.distrito_id}>{d.nombre} ({d.ubigeo})</option>
                        ))}
                      </select>
                    </div>
                    <div><Label>Código postal</Label><input type="text" value={form.codigo_postal ?? ''} onChange={(e) => setForm((p) => ({ ...p, codigo_postal: e.target.value || undefined }))} className={inputClass} /></div>
                    <div><Label>Ubigeo</Label><input type="text" value={form.ubigeo ?? ''} onChange={(e) => setForm((p) => ({ ...p, ubigeo: e.target.value || undefined }))} className={inputClass} placeholder="Ej. 150101" /></div>
                  </div>
                </div>
              </FormSection>
              <FormSection title="Contacto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><Label>Teléfono</Label><input type="text" value={form.telefono ?? ''} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Email</Label><input type="email" value={form.email ?? ''} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value || undefined }))} className={inputClass} /></div>
                </div>
              </FormSection>
              <FormSection title="Configuración operativa">
                <div className="space-y-3">
                  <div>
                    <Label>Centro de costo</Label>
                    <select value={form.centro_costo_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, centro_costo_id: e.target.value || undefined }))} className={inputClass}>
                      <option value="">— Ninguno —</option>
                      {centrosCosto.map((cc) => (<option key={cc.centro_costo_id} value={cc.centro_costo_id}>{cc.codigo} — {cc.nombre}</option>))}
                    </select>
                  </div>
                  <div><Label>Zona horaria</Label><input type="text" value={form.zona_horaria ?? ''} onChange={(e) => setForm((p) => ({ ...p, zona_horaria: e.target.value || undefined }))} className={inputClass} placeholder="America/Lima" /></div>
                  <div><Label>Horario de atención</Label><input type="text" value={form.horario_atencion ?? ''} onChange={(e) => setForm((p) => ({ ...p, horario_atencion: e.target.value || undefined }))} className={inputClass} placeholder="Ej. Lun-Vie 8:00-18:00" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Fecha apertura</Label><input type="date" value={form.fecha_apertura ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_apertura: e.target.value || undefined }))} className={inputClass} /></div>
                    <div><Label>Fecha cierre</Label><input type="date" value={form.fecha_cierre ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_cierre: e.target.value || undefined }))} className={inputClass} /></div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_casa_matriz ?? false} onChange={(e) => setForm((p) => ({ ...p, es_casa_matriz: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label>Casa matriz</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_punto_venta ?? false} onChange={(e) => setForm((p) => ({ ...p, es_punto_venta: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label>Punto de venta</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_almacen ?? false} onChange={(e) => setForm((p) => ({ ...p, es_almacen: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label>Almacén</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_planta_produccion ?? false} onChange={(e) => setForm((p) => ({ ...p, es_planta_produccion: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label>Planta de producción</Label></div>
                  </div>
                </div>
              </FormSection>
              <FormSection title="Responsable">
                <div><Label>Nombre del responsable</Label><input type="text" value={form.responsable_nombre ?? ''} onChange={(e) => setForm((p) => ({ ...p, responsable_nombre: e.target.value || undefined }))} className={inputClass} /></div>
              </FormSection>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="create_es_activo" checked={form.es_activo ?? true} onChange={(e) => setForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" />
                <Label htmlFor="create_es_activo">Activo</Label>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Editar sucursal</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                  <div>
                    <Label>Tipo de sucursal</Label>
                    <select value={editForm.tipo_sucursal ?? 'sede'} onChange={(e) => setEditForm((p) => ({ ...p, tipo_sucursal: e.target.value }))} className={inputClass}>
                      <option value="sede">Sede</option>
                      <option value="punto_venta">Punto de venta</option>
                      <option value="almacen">Almacén</option>
                      <option value="virtual">Virtual</option>
                    </select>
                  </div>
                  <div><Label>Descripción</Label><input type="text" value={editForm.descripcion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                </div>
              </FormSection>
              <FormSection title="Ubicación / Dirección">
                <div className="space-y-3">
                  <div><Label>Dirección</Label><input type="text" value={editForm.direccion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, direccion: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Referencia</Label><input type="text" value={editForm.referencia ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, referencia: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>País</Label>
                      <select
                        value={selectedPaisId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedPaisId(id);
                          setSelectedDepartamentoId('');
                          setSelectedProvinciaId('');
                          setSelectedDistritoId('');
                          setEditForm((p) => ({ ...p, pais_id: id || undefined, departamento_id: undefined, provincia_id: undefined, distrito_id: undefined }));
                        }}
                        className={inputClass}
                      >
                        <option value="">— Seleccionar —</option>
                        {paises.map((p) => (
                          <option key={p.pais_id} value={p.pais_id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Departamento</Label>
                      <select
                        value={selectedDepartamentoId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedDepartamentoId(id);
                          setSelectedProvinciaId('');
                          setSelectedDistritoId('');
                          setEditForm((p) => ({ ...p, departamento_id: id || undefined, provincia_id: undefined, distrito_id: undefined }));
                        }}
                        className={inputClass}
                      >
                        <option value="">— Seleccionar —</option>
                        {departamentos.filter((d) => !selectedPaisId || d.pais_id === selectedPaisId).map((d) => (
                          <option key={d.departamento_id} value={d.departamento_id}>{d.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Provincia</Label>
                      <select
                        value={selectedProvinciaId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedProvinciaId(id);
                          setSelectedDistritoId('');
                          setEditForm((p) => ({ ...p, provincia_id: id || undefined, distrito_id: undefined }));
                        }}
                        className={inputClass}
                      >
                        <option value="">— Seleccionar —</option>
                        {provincias.filter((p) => !selectedDepartamentoId || p.departamento_id === selectedDepartamentoId).map((p) => (
                          <option key={p.provincia_id} value={p.provincia_id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Distrito</Label>
                      <select
                        value={selectedDistritoId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedDistritoId(id);
                          setEditForm((p) => ({ ...p, distrito_id: id || undefined }));
                        }}
                        className={inputClass}
                      >
                        <option value="">— Seleccionar —</option>
                        {distritos.filter((d) => !selectedProvinciaId || d.provincia_id === selectedProvinciaId).map((d) => (
                          <option key={d.distrito_id} value={d.distrito_id}>{d.nombre} ({d.ubigeo})</option>
                        ))}
                      </select>
                    </div>
                    <div><Label>Código postal</Label><input type="text" value={editForm.codigo_postal ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_postal: e.target.value || undefined }))} className={inputClass} /></div>
                    <div><Label>Ubigeo</Label><input type="text" value={editForm.ubigeo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, ubigeo: e.target.value || undefined }))} className={inputClass} /></div>
                  </div>
                </div>
              </FormSection>
              <FormSection title="Contacto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><Label>Teléfono</Label><input type="text" value={editForm.telefono ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, telefono: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Email</Label><input type="email" value={editForm.email ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value || undefined }))} className={inputClass} /></div>
                </div>
              </FormSection>
              <FormSection title="Configuración operativa">
                <div className="space-y-3">
                  <div>
                    <Label>Centro de costo</Label>
                    <select value={editForm.centro_costo_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, centro_costo_id: e.target.value || undefined }))} className={inputClass}>
                      <option value="">— Ninguno —</option>
                      {centrosCosto.map((cc) => (<option key={cc.centro_costo_id} value={cc.centro_costo_id}>{cc.codigo} — {cc.nombre}</option>))}
                    </select>
                  </div>
                  <div><Label>Zona horaria</Label><input type="text" value={editForm.zona_horaria ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, zona_horaria: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Horario de atención</Label><input type="text" value={editForm.horario_atencion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, horario_atencion: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Fecha apertura</Label><input type="date" value={editForm.fecha_apertura ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_apertura: e.target.value || undefined }))} className={inputClass} /></div>
                    <div><Label>Fecha cierre</Label><input type="date" value={editForm.fecha_cierre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_cierre: e.target.value || undefined }))} className={inputClass} /></div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_casa_matriz ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_casa_matriz: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label>Casa matriz</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_punto_venta ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_punto_venta: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label>Punto de venta</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_almacen ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_almacen: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label>Almacén</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_planta_produccion ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_planta_produccion: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label>Planta de producción</Label></div>
                  </div>
                </div>
              </FormSection>
              <FormSection title="Responsable">
                <div><Label>Nombre del responsable</Label><input type="text" value={editForm.responsable_nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, responsable_nombre: e.target.value || undefined }))} className={inputClass} /></div>
              </FormSection>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="edit_es_activo" checked={editForm.es_activo ?? true} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" />
                <Label htmlFor="edit_es_activo">Activo</Label>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrgPageLayout>
  );
}
