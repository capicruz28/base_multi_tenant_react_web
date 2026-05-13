/**
 * Mi Empresa — Listado y gestión de empresas del tenant.
 * Flujo: crear empresa primero; luego configurar monedas en Monedas y elegir moneda base aquí al editar.
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Building2, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import type { Empresa, EmpresaCreate, EmpresaUpdate } from '../types/org.types';
import type { CatMoneda, CatPais, CatDepartamento, CatProvincia, CatDistrito } from '@/types/catalogos.types';
import { OrgPageLayout } from '../components/OrgPageLayout';
import { getErrorMessage, getValidationErrors } from '@/core/services/error.service';
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
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { FormSection } from '../components/FormSection';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import {  
  useEmpresas,
  useCreateEmpresa,
  useDeleteEmpresa,
  useReactivarEmpresa,
  useUpdateEmpresa,
} from '../hooks/empresa.hooks';

const EMPRESA_DEFAULT: EmpresaCreate = {
  codigo_empresa: '',
  razon_social: '',
  ruc: '',
  nombre_comercial: '',
  tipo_documento_tributario: 'RUC',
  tipo_empresa: '',
  direccion_fiscal: '',
  pais_id: undefined,
  departamento_id: undefined,
  provincia_id: undefined,
  distrito_id: undefined,
  codigo_postal: '',
  ubigeo: '',
  telefono_principal: '',
  telefono_secundario: '',
  email_principal: '',
  email_facturacion: '',
  sitio_web: '',
  moneda_base_id: undefined,
  maneja_multimoneda: false,
  zona_horaria: 'America/Lima',
  idioma_sistema: 'es',
  formato_fecha: 'DD/MM/YYYY',
  separador_miles: ',',
  separador_decimales: '.',
  decimales_moneda: 2,
  actividad_economica: '',
  codigo_ciiu: '',
  rubro: '',
  representante_legal_nombre: '',
  representante_legal_dni: '',
  representante_legal_cargo: '',
  logo_url: '',
  logo_secundario_url: '',
  favicon_url: '',
  fecha_constitucion: undefined,
  fecha_inicio_operaciones: undefined,
  es_activo: true,
};

export default function EmpresaPage() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [monedasForEdit, setMonedasForEdit] = useState<CatMoneda[]>([]);
  const [form, setForm] = useState<EmpresaCreate>(EMPRESA_DEFAULT);
  const [editForm, setEditForm] = useState<EmpresaUpdate>({});
  const [deleteTarget, setDeleteTarget] = useState<Empresa | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
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

  const empresasQuery = useEmpresas({ solo_activos: !includeInactive, buscar });
  const list = empresasQuery.data ?? [];
  const loading = empresasQuery.isLoading;
  const error = empresasQuery.error ? getErrorMessage(empresasQuery.error).message : null;

  const createEmpresa = useCreateEmpresa();
  const updateEmpresa = useUpdateEmpresa();
  const deleteEmpresa = useDeleteEmpresa();
  const reactivarEmpresa = useReactivarEmpresa();

  const submitting = createEmpresa.isPending || updateEmpresa.isPending;
  const deleting = deleteEmpresa.isPending;
  const reactivatingId = reactivarEmpresa.variables?.empresaId ?? null;

  // Cargar catálogos base (paises, departamentos, provincias, distritos) una sola vez
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
    setForm(EMPRESA_DEFAULT);
    setSelectedPaisId('');
    setSelectedDepartamentoId('');
    setSelectedProvinciaId('');
    setSelectedDistritoId('');
    setCreateOpen(true);
    catalogosService
      .listMonedas({ solo_activos: true })
      .then(setMonedasForEdit)
      .catch(() => setMonedasForEdit([]));
  };
  const openEdit = (row: Empresa) => {
    setEditing(row);
    const pid = row.pais_id ?? paises.find((p) => p.nombre === row.pais)?.pais_id ?? '';
    const did = row.departamento_id ?? departamentos.filter((d) => d.pais_id === pid).find((d) => d.nombre === row.departamento)?.departamento_id ?? '';
    const prid = row.provincia_id ?? provincias.filter((p) => p.departamento_id === did).find((p) => p.nombre === row.provincia)?.provincia_id ?? '';
    const distid = row.distrito_id ?? distritos.filter((d) => d.provincia_id === prid).find((d) => d.nombre === row.distrito)?.distrito_id ?? '';
    setEditForm({
      codigo_empresa: row.codigo_empresa,
      razon_social: row.razon_social,
      nombre_comercial: row.nombre_comercial ?? undefined,
      ruc: row.ruc,
      tipo_documento_tributario: row.tipo_documento_tributario ?? undefined,
      tipo_empresa: row.tipo_empresa ?? undefined,
      direccion_fiscal: row.direccion_fiscal ?? undefined,
      pais_id: pid || undefined,
      departamento_id: did || undefined,
      provincia_id: prid || undefined,
      distrito_id: distid || undefined,
      codigo_postal: row.codigo_postal ?? undefined,
      ubigeo: row.ubigeo ?? undefined,
      telefono_principal: row.telefono_principal ?? undefined,
      telefono_secundario: row.telefono_secundario ?? undefined,
      email_principal: row.email_principal ?? undefined,
      email_facturacion: row.email_facturacion ?? undefined,
      sitio_web: row.sitio_web ?? undefined,
      moneda_base_id: row.moneda_base_id ?? undefined,
      maneja_multimoneda: row.maneja_multimoneda ?? false,
      zona_horaria: row.zona_horaria ?? undefined,
      idioma_sistema: row.idioma_sistema ?? undefined,
      formato_fecha: row.formato_fecha ?? undefined,
      separador_miles: row.separador_miles ?? undefined,
      separador_decimales: row.separador_decimales ?? undefined,
      decimales_moneda: row.decimales_moneda ?? undefined,
      actividad_economica: row.actividad_economica ?? undefined,
      codigo_ciiu: row.codigo_ciiu ?? undefined,
      rubro: row.rubro ?? undefined,
      representante_legal_nombre: row.representante_legal_nombre ?? undefined,
      representante_legal_dni: row.representante_legal_dni ?? undefined,
      representante_legal_cargo: row.representante_legal_cargo ?? undefined,
      logo_url: row.logo_url ?? undefined,
      logo_secundario_url: row.logo_secundario_url ?? undefined,
      favicon_url: row.favicon_url ?? undefined,
      fecha_constitucion: row.fecha_constitucion ?? undefined,
      fecha_inicio_operaciones: row.fecha_inicio_operaciones ?? undefined,
      es_activo: row.es_activo,
    });
    setEditFieldErrors({});
    setSelectedPaisId(pid);
    setSelectedDepartamentoId(did);
    setSelectedProvinciaId(prid);
    setSelectedDistritoId(distid);
    setEditOpen(true);
    catalogosService
      .listMonedas({ solo_activos: true })
      .then(setMonedasForEdit)
      .catch(() => setMonedasForEdit([]));
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEmpresa.mutateAsync({ empresaId: deleteTarget.empresa_id });
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const handleReactivar = async (empresa: Empresa) => {
    try {
      await reactivarEmpresa.mutateAsync({ empresaId: empresa.empresa_id });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const updateForm = (field: keyof EmpresaCreate, value: string | number | boolean | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const updateEditForm = (field: keyof EmpresaUpdate, value: string | number | boolean | undefined) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo_empresa.trim() || !form.razon_social.trim() || !form.ruc.trim()) {
      toast.error('Completa código, razón social y RUC.');
      return;
    }

    const rucSanitized = form.ruc.replace(/\D/g, '');
    if (rucSanitized.length !== 11) {
      toast.error('El RUC debe tener 11 dígitos.');
      return;
    }

    try {
      const payload: EmpresaCreate = {
        ...form,
        pais_id: selectedPaisId || undefined,
        departamento_id: selectedDepartamentoId || undefined,
        provincia_id: selectedProvinciaId || undefined,
        distrito_id: selectedDistritoId || undefined,
      };
      if (payload.fecha_constitucion === '') delete payload.fecha_constitucion;
      if (payload.fecha_inicio_operaciones === '') delete payload.fecha_inicio_operaciones;
      await createEmpresa.mutateAsync(payload);
      setCreateOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditFieldErrors({});
    try {
      const payload = { ...editForm };
      if (payload.fecha_constitucion === '') delete payload.fecha_constitucion;
      if (payload.fecha_inicio_operaciones === '') delete payload.fecha_inicio_operaciones;
      await updateEmpresa.mutateAsync({ empresaId: editing.empresa_id, payload });
      setEditOpen(false);
      setEditing(null);
    } catch (err) {
      const { message, fieldErrors: nextErrors } = getValidationErrors(err);
      setEditFieldErrors(nextErrors);
      toast.error(message);
    }
  };

  const inputClass = (key: string, isEdit = false) =>
    `mt-1 block w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm ${(isEdit ? editFieldErrors : fieldErrors)[key] ? 'border-red-500 dark:border-red-400' : 'border border-gray-300 dark:border-gray-600'}`;

  return (
    <OrgPageLayout
      title="Mi Empresa"
      description="Cree primero la empresa; luego configure monedas en Monedas y asigne la moneda base al editar."
      action={
        canCrear ? (
          <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
            <Plus className="h-4 w-4 mr-2" />
            Crear empresa
          </Button>
        ) : null
      }
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="include_inactive"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <Label htmlFor="include_inactive">Ver inactivos</Label>
        </div>
        <div className="w-full md:w-80">
          <Label htmlFor="buscar_empresa">Buscar</Label>
          <input
            id="buscar_empresa"
            type="text"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            placeholder="Código, razón social, RUC..."
          />
        </div>
      </div>
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}
      {error && !loading && (
        <p className="text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {error}
        </p>
      )}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Razón social
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  RUC
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Moneda
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    {includeInactive ? 'No hay empresas.' : 'No hay empresas. Crea una para comenzar.'}
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.empresa_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {row.codigo_empresa}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.razon_social}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.ruc}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.moneda_base ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {row.es_activo ? 'Activa' : 'Inactiva'}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
            <DialogTitle>Crear empresa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5">
              <FormSection title="Información general">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="codigo_empresa">Código *</Label>
                    <input
                      id="codigo_empresa"
                      type="text"
                      value={form.codigo_empresa}
                      onChange={(e) => { updateForm('codigo_empresa', e.target.value); setFieldErrors((p) => ({ ...p, codigo_empresa: '' })); }}
                      className={inputClass('codigo_empresa')}
                      disabled={submitting}
                    />
                    {fieldErrors.codigo_empresa && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.codigo_empresa}</p>}
                  </div>
                  <div>
                    <Label htmlFor="razon_social">Razón social *</Label>
                    <input
                      id="razon_social"
                      type="text"
                      value={form.razon_social}
                      onChange={(e) => { updateForm('razon_social', e.target.value); setFieldErrors((p) => ({ ...p, razon_social: '' })); }}
                      className={inputClass('razon_social')}
                      disabled={submitting}
                      placeholder="En MAYÚSCULAS según SUNAT"
                    />
                    {fieldErrors.razon_social && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.razon_social}</p>}
                  </div>
                  <div>
                    <Label htmlFor="ruc">RUC *</Label>
                    <input
                      id="ruc"
                      type="text"
                      value={form.ruc}
                      onChange={(e) => { updateForm('ruc', e.target.value); setFieldErrors((p) => ({ ...p, ruc: '' })); }}
                      className={inputClass('ruc')}
                      disabled={submitting}
                    />
                    {fieldErrors.ruc && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.ruc}</p>}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">11 dígitos. No podrá modificarse después de crear.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="tipo_documento_tributario">Tipo doc. tributario</Label>
                      <select
                        id="tipo_documento_tributario"
                        value={form.tipo_documento_tributario ?? 'RUC'}
                        onChange={(e) => updateForm('tipo_documento_tributario', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        disabled={submitting}
                      >
                        <option value="RUC">RUC</option>
                        <option value="NIT">NIT</option>
                        <option value="Tax ID">Tax ID</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="tipo_empresa">Tipo empresa</Label>
                      <input
                        id="tipo_empresa"
                        type="text"
                        value={form.tipo_empresa ?? ''}
                        onChange={(e) => updateForm('tipo_empresa', e.target.value)}
                        className={inputClass('tipo_empresa')}
                        disabled={submitting}
                        placeholder="SAC, SRL, EIRL..."
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="nombre_comercial">Nombre comercial</Label>
                    <input
                      id="nombre_comercial"
                      type="text"
                      value={form.nombre_comercial ?? ''}
                      onChange={(e) => updateForm('nombre_comercial', e.target.value)}
                      className={inputClass('nombre_comercial')}
                      disabled={submitting}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="es_activo"
                      checked={form.es_activo ?? true}
                      onChange={(e) => updateForm('es_activo', e.target.checked)}
                      disabled={submitting}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <Label htmlFor="es_activo">Activo</Label>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Ubicación / Dirección fiscal">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="direccion_fiscal">Dirección fiscal</Label>
                    <input
                      id="direccion_fiscal"
                      type="text"
                      value={form.direccion_fiscal ?? ''}
                      onChange={(e) => updateForm('direccion_fiscal', e.target.value)}
                      className={inputClass('direccion_fiscal')}
                      disabled={submitting}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="pais_select">País</Label>
                      <select
                        id="pais_select"
                        value={selectedPaisId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedPaisId(id);
                          setSelectedDepartamentoId('');
                          setSelectedProvinciaId('');
                          setSelectedDistritoId('');
                        }}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        disabled={submitting}
                      >
                        <option value="">— Seleccionar —</option>
                        {paises.map((p) => (
                          <option key={p.pais_id} value={p.pais_id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="departamento_select">Departamento</Label>
                      <select
                        id="departamento_select"
                        value={selectedDepartamentoId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedDepartamentoId(id);
                          setSelectedProvinciaId('');
                          setSelectedDistritoId('');
                        }}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        disabled={submitting}
                      >
                        <option value="">— Seleccionar —</option>
                        {departamentos.filter((d) => !selectedPaisId || d.pais_id === selectedPaisId).map((d) => (
                          <option key={d.departamento_id} value={d.departamento_id}>{d.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="provincia_select">Provincia</Label>
                      <select
                        id="provincia_select"
                        value={selectedProvinciaId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedProvinciaId(id);
                          setSelectedDistritoId('');
                        }}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        disabled={submitting}
                      >
                        <option value="">— Seleccionar —</option>
                        {provincias.filter((p) => !selectedDepartamentoId || p.departamento_id === selectedDepartamentoId).map((p) => (
                          <option key={p.provincia_id} value={p.provincia_id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="distrito_select">Distrito</Label>
                      <select
                        id="distrito_select"
                        value={selectedDistritoId}
                        onChange={(e) => setSelectedDistritoId(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        disabled={submitting}
                      >
                        <option value="">— Seleccionar —</option>
                        {distritos.filter((d) => !selectedProvinciaId || d.provincia_id === selectedProvinciaId).map((d) => (
                          <option key={d.distrito_id} value={d.distrito_id}>{d.nombre} ({d.ubigeo})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="codigo_postal">Código postal</Label>
                      <input
                        id="codigo_postal"
                        type="text"
                        value={form.codigo_postal ?? ''}
                        onChange={(e) => updateForm('codigo_postal', e.target.value)}
                        className={inputClass('codigo_postal')}
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ubigeo">Ubigeo</Label>
                      <input
                        id="ubigeo"
                        type="text"
                        value={form.ubigeo ?? ''}
                        onChange={(e) => updateForm('ubigeo', e.target.value)}
                        className={inputClass('ubigeo')}
                        disabled={submitting}
                        placeholder="Ej. 150101"
                      />
                    </div>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Contacto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="telefono_principal">Teléfono principal</Label>
                    <input
                      id="telefono_principal"
                      type="text"
                      value={form.telefono_principal ?? ''}
                      onChange={(e) => updateForm('telefono_principal', e.target.value)}
                      className={inputClass('telefono_principal')}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono_secundario">Teléfono secundario</Label>
                    <input
                      id="telefono_secundario"
                      type="text"
                      value={form.telefono_secundario ?? ''}
                      onChange={(e) => updateForm('telefono_secundario', e.target.value)}
                      className={inputClass('telefono_secundario')}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email_principal">Email principal</Label>
                    <input
                      id="email_principal"
                      type="email"
                      value={form.email_principal ?? ''}
                      onChange={(e) => { updateForm('email_principal', e.target.value); setFieldErrors((p) => ({ ...p, email_principal: '' })); }}
                      className={inputClass('email_principal')}
                      disabled={submitting}
                    />
                    {fieldErrors.email_principal && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email_principal}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email_facturacion">Email facturación</Label>
                    <input
                      id="email_facturacion"
                      type="email"
                      value={form.email_facturacion ?? ''}
                      onChange={(e) => updateForm('email_facturacion', e.target.value)}
                      className={inputClass('email_facturacion')}
                      disabled={submitting}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="sitio_web">Sitio web</Label>
                    <input
                      id="sitio_web"
                      type="url"
                      value={form.sitio_web ?? ''}
                      onChange={(e) => updateForm('sitio_web', e.target.value)}
                      className={inputClass('sitio_web')}
                      disabled={submitting}
                      placeholder="https://"
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Información tributaria">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="actividad_economica">Actividad económica</Label>
                    <input
                      id="actividad_economica"
                      type="text"
                      value={form.actividad_economica ?? ''}
                      onChange={(e) => updateForm('actividad_economica', e.target.value)}
                      className={inputClass('actividad_economica')}
                      disabled={submitting}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="codigo_ciiu">Código CIIU</Label>
                      <input
                        id="codigo_ciiu"
                        type="text"
                        value={form.codigo_ciiu ?? ''}
                        onChange={(e) => updateForm('codigo_ciiu', e.target.value)}
                        className={inputClass('codigo_ciiu')}
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rubro">Rubro</Label>
                      <input
                        id="rubro"
                        type="text"
                        value={form.rubro ?? ''}
                        onChange={(e) => updateForm('rubro', e.target.value)}
                        className={inputClass('rubro')}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Representante legal">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <Label htmlFor="representante_legal_nombre">Nombre completo</Label>
                    <input
                      id="representante_legal_nombre"
                      type="text"
                      value={form.representante_legal_nombre ?? ''}
                      onChange={(e) => updateForm('representante_legal_nombre', e.target.value)}
                      className={inputClass('representante_legal_nombre')}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="representante_legal_dni">DNI / Documento</Label>
                    <input
                      id="representante_legal_dni"
                      type="text"
                      value={form.representante_legal_dni ?? ''}
                      onChange={(e) => updateForm('representante_legal_dni', e.target.value)}
                      className={inputClass('representante_legal_dni')}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="representante_legal_cargo">Cargo</Label>
                    <input
                      id="representante_legal_cargo"
                      type="text"
                      value={form.representante_legal_cargo ?? ''}
                      onChange={(e) => updateForm('representante_legal_cargo', e.target.value)}
                      className={inputClass('representante_legal_cargo')}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Configuración de la empresa">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="moneda_base_id">Moneda base</Label>
                    {monedasForEdit.length > 0 ? (
                      <select
                        id="moneda_base_id"
                        value={form.moneda_base_id ?? ''}
                        onChange={(e) => updateForm('moneda_base_id', e.target.value || undefined)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        disabled={submitting}
                      >
                        <option value="">— Seleccionar —</option>
                        {monedasForEdit.map((m) => (
                          <option key={m.moneda_id} value={m.moneda_id}>{m.codigo} — {m.nombre} ({m.simbolo})</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-amber-600 dark:text-amber-400">Configure monedas en <strong>Monedas</strong> para asignar moneda base.</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="zona_horaria">Zona horaria</Label>
                    <input
                      id="zona_horaria"
                      type="text"
                      value={form.zona_horaria ?? 'America/Lima'}
                      onChange={(e) => updateForm('zona_horaria', e.target.value)}
                      className={inputClass('zona_horaria')}
                      disabled={submitting}
                      placeholder="America/Lima"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="idioma_sistema">Idioma sistema</Label>
                      <select
                        id="idioma_sistema"
                        value={form.idioma_sistema ?? 'es'}
                        onChange={(e) => updateForm('idioma_sistema', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        disabled={submitting}
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                        <option value="pt">Português</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="formato_fecha">Formato fecha</Label>
                      <select
                        id="formato_fecha"
                        value={form.formato_fecha ?? 'DD/MM/YYYY'}
                        onChange={(e) => updateForm('formato_fecha', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        disabled={submitting}
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="separador_miles">Separador miles</Label>
                      <input
                        id="separador_miles"
                        type="text"
                        value={form.separador_miles ?? ','}
                        onChange={(e) => updateForm('separador_miles', e.target.value)}
                        className={inputClass('separador_miles')}
                        disabled={submitting}
                        maxLength={1}
                      />
                    </div>
                    <div>
                      <Label htmlFor="separador_decimales">Separador decimales</Label>
                      <input
                        id="separador_decimales"
                        type="text"
                        value={form.separador_decimales ?? '.'}
                        onChange={(e) => updateForm('separador_decimales', e.target.value)}
                        className={inputClass('separador_decimales')}
                        disabled={submitting}
                        maxLength={1}
                      />
                    </div>
                    <div>
                      <Label htmlFor="decimales_moneda">Decimales moneda</Label>
                      <input
                        id="decimales_moneda"
                        type="number"
                        min={0}
                        max={6}
                        value={form.decimales_moneda ?? 2}
                        onChange={(e) => { const n = parseInt(e.target.value, 10); updateForm('decimales_moneda', Number.isNaN(n) ? undefined : n); }}
                        className={inputClass('decimales_moneda')}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <div className="rounded-md border border-gray-200 dark:border-gray-600 p-3 space-y-2 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="maneja_multimoneda"
                        checked={form.maneja_multimoneda ?? false}
                        onChange={(e) => updateForm('maneja_multimoneda', e.target.checked)}
                        disabled={submitting}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <Label htmlFor="maneja_multimoneda">Multi-moneda (facturar en USD, EUR, etc.)</Label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Activo: documentos con Moneda y tipo de cambio. Inactivo: solo moneda base. Empresa 100% local → desactivar.
                    </p>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Identidad visual">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="logo_url">URL logo principal</Label>
                    <input
                      id="logo_url"
                      type="url"
                      value={form.logo_url ?? ''}
                      onChange={(e) => updateForm('logo_url', e.target.value)}
                      className={inputClass('logo_url')}
                      disabled={submitting}
                      placeholder="https://"
                    />
                  </div>
                  <div>
                    <Label htmlFor="logo_secundario_url">URL logo secundario</Label>
                    <input
                      id="logo_secundario_url"
                      type="url"
                      value={form.logo_secundario_url ?? ''}
                      onChange={(e) => updateForm('logo_secundario_url', e.target.value)}
                      className={inputClass('logo_secundario_url')}
                      disabled={submitting}
                      placeholder="https://"
                    />
                  </div>
                  <div>
                    <Label htmlFor="favicon_url">URL favicon</Label>
                    <input
                      id="favicon_url"
                      type="url"
                      value={form.favicon_url ?? ''}
                      onChange={(e) => updateForm('favicon_url', e.target.value)}
                      className={inputClass('favicon_url')}
                      disabled={submitting}
                      placeholder="https://"
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Fechas de negocio">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="fecha_constitucion">Fecha constitución</Label>
                    <input
                      id="fecha_constitucion"
                      type="date"
                      value={form.fecha_constitucion ?? ''}
                      onChange={(e) => updateForm('fecha_constitucion', e.target.value || undefined)}
                      className={inputClass('fecha_constitucion')}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fecha_inicio_operaciones">Fecha inicio operaciones</Label>
                    <input
                      id="fecha_inicio_operaciones"
                      type="date"
                      value={form.fecha_inicio_operaciones ?? ''}
                      onChange={(e) => updateForm('fecha_inicio_operaciones', e.target.value || undefined)}
                      className={inputClass('fecha_inicio_operaciones')}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </FormSection>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
            <DialogTitle>Editar empresa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5">
              <FormSection title="Información general">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="edit-codigo_empresa">Código *</Label>
                    <input
                      id="edit-codigo_empresa"
                      type="text"
                      value={editForm.codigo_empresa ?? ''}
                      onChange={(e) => { updateEditForm('codigo_empresa', e.target.value); setEditFieldErrors((p) => ({ ...p, codigo_empresa: '' })); }}
                      className={inputClass('codigo_empresa', true)}
                      disabled={submitting}
                    />
                    {editFieldErrors.codigo_empresa && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{editFieldErrors.codigo_empresa}</p>}
                  </div>
                  <div>
                    <Label htmlFor="edit-razon_social">Razón social *</Label>
                    <input
                      id="edit-razon_social"
                      type="text"
                      value={editForm.razon_social ?? ''}
                      onChange={(e) => { updateEditForm('razon_social', e.target.value); setEditFieldErrors((p) => ({ ...p, razon_social: '' })); }}
                      className={inputClass('razon_social', true)}
                      disabled={submitting}
                      placeholder="En MAYÚSCULAS según SUNAT"
                    />
                    {editFieldErrors.razon_social && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{editFieldErrors.razon_social}</p>}
                  </div>
                  <div>
                    <Label htmlFor="edit-ruc">RUC *</Label>
                    <input
                      id="edit-ruc"
                      type="text"
                      value={editForm.ruc ?? ''}
                      readOnly
                      className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-white text-sm"
                      disabled
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Inmutable; no puede modificarse.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-tipo_documento_tributario">Tipo doc. tributario</Label>
                      <select
                        id="edit-tipo_documento_tributario"
                        value={editForm.tipo_documento_tributario ?? 'RUC'}
                        onChange={(e) => updateEditForm('tipo_documento_tributario', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        disabled={submitting}
                      >
                        <option value="RUC">RUC</option>
                        <option value="NIT">NIT</option>
                        <option value="Tax ID">Tax ID</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="edit-tipo_empresa">Tipo empresa</Label>
                      <input
                        id="edit-tipo_empresa"
                        type="text"
                        value={editForm.tipo_empresa ?? ''}
                        onChange={(e) => updateEditForm('tipo_empresa', e.target.value)}
                        className={inputClass('tipo_empresa', true)}
                        disabled={submitting}
                        placeholder="SAC, SRL, EIRL..."
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-nombre_comercial">Nombre comercial</Label>
                    <input
                      id="edit-nombre_comercial"
                      type="text"
                      value={editForm.nombre_comercial ?? ''}
                      onChange={(e) => updateEditForm('nombre_comercial', e.target.value)}
                      className={inputClass('nombre_comercial', true)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit_es_activo"
                      checked={editForm.es_activo ?? true}
                      onChange={(e) => updateEditForm('es_activo', e.target.checked)}
                      disabled={submitting}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <Label htmlFor="edit_es_activo">Activo</Label>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Ubicación / Dirección fiscal">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-direccion_fiscal">Dirección fiscal</Label>
                    <input
                      id="edit-direccion_fiscal"
                      type="text"
                      value={editForm.direccion_fiscal ?? ''}
                      onChange={(e) => updateEditForm('direccion_fiscal', e.target.value)}
                      className={inputClass('direccion_fiscal', true)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-pais_select">País</Label>
                      <select
                        id="edit-pais_select"
                        value={selectedPaisId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedPaisId(id);
                          setSelectedDepartamentoId('');
                          setSelectedProvinciaId('');
                          setSelectedDistritoId('');
                          updateEditForm('pais_id', id || undefined);
                          updateEditForm('departamento_id', undefined);
                          updateEditForm('provincia_id', undefined);
                          updateEditForm('distrito_id', undefined);
                        }}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        disabled={submitting}
                      >
                        <option value="">— Seleccionar —</option>
                        {paises.map((p) => (
                          <option key={p.pais_id} value={p.pais_id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="edit-departamento_select">Departamento</Label>
                      <select
                        id="edit-departamento_select"
                        value={selectedDepartamentoId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedDepartamentoId(id);
                          setSelectedProvinciaId('');
                          setSelectedDistritoId('');
                          updateEditForm('departamento_id', id || undefined);
                          updateEditForm('provincia_id', undefined);
                          updateEditForm('distrito_id', undefined);
                        }}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        disabled={submitting}
                      >
                        <option value="">— Seleccionar —</option>
                        {departamentos.filter((d) => !selectedPaisId || d.pais_id === selectedPaisId).map((d) => (
                          <option key={d.departamento_id} value={d.departamento_id}>{d.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="edit-provincia_select">Provincia</Label>
                      <select
                        id="edit-provincia_select"
                        value={selectedProvinciaId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedProvinciaId(id);
                          setSelectedDistritoId('');
                          updateEditForm('provincia_id', id || undefined);
                          updateEditForm('distrito_id', undefined);
                        }}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        disabled={submitting}
                      >
                        <option value="">— Seleccionar —</option>
                        {provincias.filter((p) => !selectedDepartamentoId || p.departamento_id === selectedDepartamentoId).map((p) => (
                          <option key={p.provincia_id} value={p.provincia_id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="edit-distrito_select">Distrito</Label>
                      <select
                        id="edit-distrito_select"
                        value={selectedDistritoId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedDistritoId(id);
                          updateEditForm('distrito_id', id || undefined);
                        }}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        disabled={submitting}
                      >
                        <option value="">— Seleccionar —</option>
                        {distritos.filter((d) => !selectedProvinciaId || d.provincia_id === selectedProvinciaId).map((d) => (
                          <option key={d.distrito_id} value={d.distrito_id}>{d.nombre} ({d.ubigeo})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="edit-codigo_postal">Código postal</Label>
                      <input
                        id="edit-codigo_postal"
                        type="text"
                        value={editForm.codigo_postal ?? ''}
                        onChange={(e) => updateEditForm('codigo_postal', e.target.value)}
                        className={inputClass('codigo_postal', true)}
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-ubigeo">Ubigeo</Label>
                      <input
                        id="edit-ubigeo"
                        type="text"
                        value={editForm.ubigeo ?? ''}
                        onChange={(e) => updateEditForm('ubigeo', e.target.value)}
                        className={inputClass('ubigeo', true)}
                        disabled={submitting}
                        placeholder="Ej. 150101"
                      />
                    </div>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Contacto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-telefono_principal">Teléfono principal</Label>
                    <input
                      id="edit-telefono_principal"
                      type="text"
                      value={editForm.telefono_principal ?? ''}
                      onChange={(e) => updateEditForm('telefono_principal', e.target.value)}
                      className={inputClass('telefono_principal', true)}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-telefono_secundario">Teléfono secundario</Label>
                    <input
                      id="edit-telefono_secundario"
                      type="text"
                      value={editForm.telefono_secundario ?? ''}
                      onChange={(e) => updateEditForm('telefono_secundario', e.target.value)}
                      className={inputClass('telefono_secundario', true)}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email_principal">Email principal</Label>
                    <input
                      id="edit-email_principal"
                      type="email"
                      value={editForm.email_principal ?? ''}
                      onChange={(e) => { updateEditForm('email_principal', e.target.value); setEditFieldErrors((p) => ({ ...p, email_principal: '' })); }}
                      className={inputClass('email_principal', true)}
                      disabled={submitting}
                    />
                    {editFieldErrors.email_principal && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{editFieldErrors.email_principal}</p>}
                  </div>
                  <div>
                    <Label htmlFor="edit-email_facturacion">Email facturación</Label>
                    <input
                      id="edit-email_facturacion"
                      type="email"
                      value={editForm.email_facturacion ?? ''}
                      onChange={(e) => updateEditForm('email_facturacion', e.target.value)}
                      className={inputClass('email_facturacion', true)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="edit-sitio_web">Sitio web</Label>
                    <input
                      id="edit-sitio_web"
                      type="url"
                      value={editForm.sitio_web ?? ''}
                      onChange={(e) => updateEditForm('sitio_web', e.target.value)}
                      className={inputClass('sitio_web', true)}
                      disabled={submitting}
                      placeholder="https://"
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Información tributaria">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="edit-actividad_economica">Actividad económica</Label>
                    <input
                      id="edit-actividad_economica"
                      type="text"
                      value={editForm.actividad_economica ?? ''}
                      onChange={(e) => updateEditForm('actividad_economica', e.target.value)}
                      className={inputClass('actividad_economica', true)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-codigo_ciiu">Código CIIU</Label>
                      <input
                        id="edit-codigo_ciiu"
                        type="text"
                        value={editForm.codigo_ciiu ?? ''}
                        onChange={(e) => updateEditForm('codigo_ciiu', e.target.value)}
                        className={inputClass('codigo_ciiu', true)}
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-rubro">Rubro</Label>
                      <input
                        id="edit-rubro"
                        type="text"
                        value={editForm.rubro ?? ''}
                        onChange={(e) => updateEditForm('rubro', e.target.value)}
                        className={inputClass('rubro', true)}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Representante legal">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <Label htmlFor="edit-representante_legal_nombre">Nombre completo</Label>
                    <input
                      id="edit-representante_legal_nombre"
                      type="text"
                      value={editForm.representante_legal_nombre ?? ''}
                      onChange={(e) => updateEditForm('representante_legal_nombre', e.target.value)}
                      className={inputClass('representante_legal_nombre', true)}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-representante_legal_dni">DNI / Documento</Label>
                    <input
                      id="edit-representante_legal_dni"
                      type="text"
                      value={editForm.representante_legal_dni ?? ''}
                      onChange={(e) => updateEditForm('representante_legal_dni', e.target.value)}
                      className={inputClass('representante_legal_dni', true)}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-representante_legal_cargo">Cargo</Label>
                    <input
                      id="edit-representante_legal_cargo"
                      type="text"
                      value={editForm.representante_legal_cargo ?? ''}
                      onChange={(e) => updateEditForm('representante_legal_cargo', e.target.value)}
                      className={inputClass('representante_legal_cargo', true)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Configuración de la empresa">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-moneda_base_id">Moneda base</Label>
                    {monedasForEdit.length > 0 ? (
                      <select
                        id="edit-moneda_base_id"
                        value={editForm.moneda_base_id ?? ''}
                        onChange={(e) => updateEditForm('moneda_base_id', e.target.value || undefined)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        disabled={submitting}
                      >
                        <option value="">— Seleccionar —</option>
                        {monedasForEdit.map((m) => (
                          <option key={m.moneda_id} value={m.moneda_id}>{m.codigo} — {m.nombre} ({m.simbolo})</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-amber-600 dark:text-amber-400">Configure monedas en <strong>Monedas</strong> para asignar moneda base.</p>
                    )}
                    {(editFieldErrors.moneda_base || editFieldErrors.moneda_base_id) && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{editFieldErrors.moneda_base || editFieldErrors.moneda_base_id}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit-zona_horaria">Zona horaria</Label>
                    <input
                      id="edit-zona_horaria"
                      type="text"
                      value={editForm.zona_horaria ?? 'America/Lima'}
                      onChange={(e) => updateEditForm('zona_horaria', e.target.value)}
                      className={inputClass('zona_horaria', true)}
                      disabled={submitting}
                      placeholder="America/Lima"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-idioma_sistema">Idioma sistema</Label>
                      <select
                        id="edit-idioma_sistema"
                        value={editForm.idioma_sistema ?? 'es'}
                        onChange={(e) => updateEditForm('idioma_sistema', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        disabled={submitting}
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                        <option value="pt">Português</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="edit-formato_fecha">Formato fecha</Label>
                      <select
                        id="edit-formato_fecha"
                        value={editForm.formato_fecha ?? 'DD/MM/YYYY'}
                        onChange={(e) => updateEditForm('formato_fecha', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        disabled={submitting}
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="edit-separador_miles">Separador miles</Label>
                      <input
                        id="edit-separador_miles"
                        type="text"
                        value={editForm.separador_miles ?? ','}
                        onChange={(e) => updateEditForm('separador_miles', e.target.value)}
                        className={inputClass('separador_miles', true)}
                        disabled={submitting}
                        maxLength={1}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-separador_decimales">Separador decimales</Label>
                      <input
                        id="edit-separador_decimales"
                        type="text"
                        value={editForm.separador_decimales ?? '.'}
                        onChange={(e) => updateEditForm('separador_decimales', e.target.value)}
                        className={inputClass('separador_decimales', true)}
                        disabled={submitting}
                        maxLength={1}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-decimales_moneda">Decimales moneda</Label>
                      <input
                        id="edit-decimales_moneda"
                        type="number"
                        min={0}
                        max={6}
                        value={editForm.decimales_moneda ?? 2}
                        onChange={(e) => { const n = parseInt(e.target.value, 10); updateEditForm('decimales_moneda', Number.isNaN(n) ? undefined : n); }}
                        className={inputClass('decimales_moneda', true)}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <div className="rounded-md border border-gray-200 dark:border-gray-600 p-3 space-y-2 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="edit_maneja_multimoneda"
                        checked={editForm.maneja_multimoneda ?? false}
                        onChange={(e) => updateEditForm('maneja_multimoneda', e.target.checked)}
                        disabled={submitting}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <Label htmlFor="edit_maneja_multimoneda">Multi-moneda (documentos con Moneda y tipo de cambio)</Label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Activo: factura en USD, EUR, etc. Inactivo: todo en moneda base. Empresa local Perú → desactivar.</p>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Identidad visual">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-logo_url">URL logo principal</Label>
                    <input
                      id="edit-logo_url"
                      type="url"
                      value={editForm.logo_url ?? ''}
                      onChange={(e) => updateEditForm('logo_url', e.target.value)}
                      className={inputClass('logo_url', true)}
                      disabled={submitting}
                      placeholder="https://"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-logo_secundario_url">URL logo secundario</Label>
                    <input
                      id="edit-logo_secundario_url"
                      type="url"
                      value={editForm.logo_secundario_url ?? ''}
                      onChange={(e) => updateEditForm('logo_secundario_url', e.target.value)}
                      className={inputClass('logo_secundario_url', true)}
                      disabled={submitting}
                      placeholder="https://"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-favicon_url">URL favicon</Label>
                    <input
                      id="edit-favicon_url"
                      type="url"
                      value={editForm.favicon_url ?? ''}
                      onChange={(e) => updateEditForm('favicon_url', e.target.value)}
                      className={inputClass('favicon_url', true)}
                      disabled={submitting}
                      placeholder="https://"
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Fechas de negocio">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-fecha_constitucion">Fecha constitución</Label>
                    <input
                      id="edit-fecha_constitucion"
                      type="date"
                      value={editForm.fecha_constitucion ?? ''}
                      onChange={(e) => updateEditForm('fecha_constitucion', e.target.value || undefined)}
                      className={inputClass('fecha_constitucion', true)}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-fecha_inicio_operaciones">Fecha inicio operaciones</Label>
                    <input
                      id="edit-fecha_inicio_operaciones"
                      type="date"
                      value={editForm.fecha_inicio_operaciones ?? ''}
                      onChange={(e) => updateEditForm('fecha_inicio_operaciones', e.target.value || undefined)}
                      className={inputClass('fecha_inicio_operaciones', true)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </FormSection>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar empresa"
        message={
          deleteTarget
            ? `¿Eliminar la empresa "${deleteTarget.razon_social}"? Esta acción no se puede deshacer y puede afectar sucursales, monedas y otros datos vinculados.`
            : ''
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
      />
    </OrgPageLayout>
  );
}
