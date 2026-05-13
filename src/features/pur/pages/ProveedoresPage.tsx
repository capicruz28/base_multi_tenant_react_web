/**
 * Proveedores — Listado y gestión completa. GET/POST /api/v1/pur/proveedores
 */
import React, { useState, useEffect } from 'react';
import { Loader, Building2, Plus, Pencil, RotateCcw, Search } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Proveedor, ProveedorCreate, ProveedorUpdate, PurListParams } from '../types/pur.types';
import type { CatPais, CatDepartamento, CatProvincia, CatDistrito, CatMoneda } from '@/types/catalogos.types';
import { PurPageLayout } from '../components/PurPageLayout';
import { catalogosService } from '@/core/services';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import {
  useProveedores,
  useCreateProveedor,
  useUpdateProveedor,
  useReactivarProveedor,
} from '../hooks/useProveedores';

const TIPOS_DOCUMENTO = ['RUC', 'DNI', 'CE', 'PASAPORTE'] as const;
const CONDICIONES_PAGO = ['contado', '7_dias', '15_dias', '30_dias', '45_dias', '60_dias', '90_dias'] as const;
const TIPOS_PROVEEDOR = ['bienes', 'servicios', 'mixto'] as const;
const CATEGORIAS_PROVEEDOR = ['materia_prima', 'insumos', 'servicios_generales', 'A', 'B', 'C'] as const;
const NIVELES_CONFIANZA = ['alto', 'medio', 'bajo'] as const;
const TIPOS_CUENTA = ['ahorro', 'corriente', 'interbancaria'] as const;

const inputClass =
  'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

const DEFAULT: ProveedorCreate = {
  empresa_id: '',
  codigo_proveedor: '',
  razon_social: '',
  tipo_documento: 'RUC',
  numero_documento: '',
  condicion_pago_defecto: '30_dias',
  dias_credito_defecto: 30,
  moneda_preferida: '',
  es_activo: true,
};

export default function ProveedoresPage() {
  const { can } = usePermissions();
  const canWrite = can('compras', 'crear') || can('compras', 'editar');

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [form, setForm] = useState<ProveedorCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ProveedorUpdate>({});

  const [paises, setPaises] = useState<CatPais[]>([]);
  const [departamentos, setDepartamentos] = useState<CatDepartamento[]>([]);
  const [provincias, setProvincias] = useState<CatProvincia[]>([]);
  const [distritos, setDistritos] = useState<CatDistrito[]>([]);
  const [monedas, setMonedas] = useState<CatMoneda[]>([]);
  const [selectedPaisId, setSelectedPaisId] = useState('');
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState('');
  const [selectedProvinciaId, setSelectedProvinciaId] = useState('');
  const [selectedDistritoId, setSelectedDistritoId] = useState('');

  const listParams: PurListParams = {
    solo_activos: !mostrarInactivos,
    ...(empresaFilter ? { empresa_id: empresaFilter } : {}),
    ...(searchTerm.trim() ? { buscar: searchTerm.trim() } : {}),
  };

  const { data: list = [], isLoading, error } = useProveedores(listParams);
  const createMut = useCreateProveedor();
  const updateMut = useUpdateProveedor();
  const reactivarMut = useReactivarProveedor();

  useEffect(() => {
    empresaService.list({ solo_activos: true }).then((data) => {
      setEmpresas(data);
      if (data.length === 1) setEmpresaFilter(data[0].empresa_id);
    }).catch(() => setEmpresas([]));

    catalogosService.listPaises({ solo_activos: true }).then(setPaises).catch(() => setPaises([]));
    catalogosService.listDepartamentos({ solo_activos: true }).then(setDepartamentos).catch(() => setDepartamentos([]));
    catalogosService.listProvincias({ solo_activos: true }).then(setProvincias).catch(() => setProvincias([]));
    catalogosService.listDistritos({ solo_activos: true }).then(setDistritos).catch(() => setDistritos([]));
    catalogosService.listMonedas({ solo_activos: true }).then(setMonedas).catch(() => setMonedas([]));
  }, []);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? ''),
      moneda_preferida: monedas[0]?.moneda_id ?? '',
    });
    setSelectedPaisId(''); setSelectedDepartamentoId(''); setSelectedProvinciaId(''); setSelectedDistritoId('');
    setCreateOpen(true);
  };

  const openEdit = (row: Proveedor) => {
    setEditing(row);
    setSelectedPaisId(row.pais_id ?? '');
    setSelectedDepartamentoId(row.departamento_id ?? '');
    setSelectedProvinciaId(row.provincia_id ?? '');
    setSelectedDistritoId(row.distrito_id ?? '');
    setEditForm({
      codigo_proveedor: row.codigo_proveedor,
      razon_social: row.razon_social,
      nombre_comercial: row.nombre_comercial ?? undefined,
      tipo_documento: row.tipo_documento ?? 'RUC',
      numero_documento: row.numero_documento,
      tipo_proveedor: row.tipo_proveedor ?? undefined,
      categoria_proveedor: row.categoria_proveedor ?? undefined,
      direccion: row.direccion ?? undefined,
      pais_id: row.pais_id ?? undefined,
      departamento_id: row.departamento_id ?? undefined,
      provincia_id: row.provincia_id ?? undefined,
      distrito_id: row.distrito_id ?? undefined,
      contacto_nombre: row.contacto_nombre ?? undefined,
      contacto_cargo: row.contacto_cargo ?? undefined,
      telefono_principal: row.telefono_principal ?? undefined,
      telefono_secundario: row.telefono_secundario ?? undefined,
      email_principal: row.email_principal ?? undefined,
      email_cotizaciones: row.email_cotizaciones ?? undefined,
      sitio_web: row.sitio_web ?? undefined,
      condicion_pago_defecto: row.condicion_pago_defecto ?? '30_dias',
      dias_credito_defecto: row.dias_credito_defecto ?? 30,
      moneda_preferida: row.moneda_preferida,
      banco: row.banco ?? undefined,
      numero_cuenta: row.numero_cuenta ?? undefined,
      tipo_cuenta: row.tipo_cuenta ?? undefined,
      cci: row.cci ?? undefined,
      nivel_confianza: row.nivel_confianza ?? undefined,
      es_proveedor_homologado: row.es_proveedor_homologado ?? undefined,
      fecha_homologacion: row.fecha_homologacion ?? undefined,
      estado: row.estado ?? undefined,
      motivo_bloqueo: row.motivo_bloqueo ?? undefined,
      observaciones: row.observaciones ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate(form, { onSuccess: () => setCreateOpen(false) });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    updateMut.mutate({ id: editing.proveedor_id, payload: editForm }, {
      onSuccess: () => { setEditOpen(false); setEditing(null); },
    });
  };

  const estadoBadge = (row: Proveedor) => {
    if (!row.es_activo) {
      return <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Inactivo</span>;
    }
    if (row.estado === 'bloqueado') {
      return <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">Bloqueado</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Activo</span>;
  };

  return (
    <PurPageLayout
      title="Proveedores"
      description="Catálogo con RUC, contactos, condiciones de pago."
      action={
        canWrite ? (
          <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
            <Plus className="h-4 w-4 mr-2" /> Crear proveedor
          </Button>
        ) : undefined
      }
    >
      {/* Filtros */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4 flex-wrap">
        {empresas.length > 0 && (
          <div>
            <Label className="mr-2">Empresa</Label>
            <select value={empresaFilter} onChange={(e) => setEmpresaFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">Todas</option>
              {empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}
            </select>
          </div>
        )}
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por razón social, RUC o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} className="rounded" />
          Mostrar inactivos
        </label>
      </div>

      {isLoading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !isLoading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error.message}</p>}

      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Razón Social</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">RUC/Doc</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contacto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Condición Pago</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                {canWrite && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={canWrite ? 7 : 6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay proveedores.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.proveedor_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_proveedor}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.razon_social}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.numero_documento}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.contacto_nombre ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.condicion_pago_defecto ?? '-'}</td>
                    <td className="px-4 py-3 text-sm">{estadoBadge(row)}</td>
                    {canWrite && (
                      <td className="px-4 py-3 text-center flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)} title="Editar" className="text-brand-primary hover:text-brand-primary/80">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!row.es_activo && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => reactivarMut.mutate({ id: row.proveedor_id })}
                            disabled={reactivarMut.isPending}
                            title="Reactivar"
                            className="text-green-600 hover:text-green-700"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal Crear ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear proveedor</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-6">
            {/* Datos generales */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">Datos generales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={inputClass} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
                <div><Label>Código *</Label><input type="text" value={form.codigo_proveedor} onChange={(e) => setForm((p) => ({ ...p, codigo_proveedor: e.target.value }))} className={inputClass} required /></div>
                <div className="md:col-span-2"><Label>Razón Social *</Label><input type="text" value={form.razon_social} onChange={(e) => setForm((p) => ({ ...p, razon_social: e.target.value }))} className={inputClass} required /></div>
                <div><Label>Nombre Comercial</Label><input type="text" value={form.nombre_comercial ?? ''} onChange={(e) => setForm((p) => ({ ...p, nombre_comercial: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>Tipo Proveedor</Label><select value={form.tipo_proveedor ?? ''} onChange={(e) => setForm((p) => ({ ...p, tipo_proveedor: e.target.value || undefined }))} className={inputClass}><option value="">Seleccionar</option>{TIPOS_PROVEEDOR.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><Label>Categoría</Label><select value={form.categoria_proveedor ?? ''} onChange={(e) => setForm((p) => ({ ...p, categoria_proveedor: e.target.value || undefined }))} className={inputClass}><option value="">Seleccionar</option>{CATEGORIAS_PROVEEDOR.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><Label>Tipo Documento</Label><select value={form.tipo_documento ?? 'RUC'} onChange={(e) => setForm((p) => ({ ...p, tipo_documento: e.target.value }))} className={inputClass}>{TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><Label>Número Documento *</Label><input type="text" value={form.numero_documento} onChange={(e) => setForm((p) => ({ ...p, numero_documento: e.target.value }))} className={inputClass} required /></div>
              </div>
            </div>
            {/* Dirección */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">Dirección</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><Label>Dirección</Label><input type="text" value={form.direccion ?? ''} onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>País</Label><select value={selectedPaisId} onChange={(e) => { const id = e.target.value; setSelectedPaisId(id); setSelectedDepartamentoId(''); setSelectedProvinciaId(''); setSelectedDistritoId(''); setForm((p) => ({ ...p, pais_id: id || undefined, departamento_id: undefined, provincia_id: undefined, distrito_id: undefined })); }} className={inputClass}><option value="">— Seleccionar —</option>{paises.map((p) => <option key={p.pais_id} value={p.pais_id}>{p.nombre}</option>)}</select></div>
                <div><Label>Departamento</Label><select value={selectedDepartamentoId} onChange={(e) => { const id = e.target.value; setSelectedDepartamentoId(id); setSelectedProvinciaId(''); setSelectedDistritoId(''); setForm((p) => ({ ...p, departamento_id: id || undefined, provincia_id: undefined, distrito_id: undefined })); }} className={inputClass}><option value="">— Seleccionar —</option>{departamentos.filter((d) => !selectedPaisId || d.pais_id === selectedPaisId).map((d) => <option key={d.departamento_id} value={d.departamento_id}>{d.nombre}</option>)}</select></div>
                <div><Label>Provincia</Label><select value={selectedProvinciaId} onChange={(e) => { const id = e.target.value; setSelectedProvinciaId(id); setSelectedDistritoId(''); setForm((p) => ({ ...p, provincia_id: id || undefined, distrito_id: undefined })); }} className={inputClass}><option value="">— Seleccionar —</option>{provincias.filter((p) => !selectedDepartamentoId || p.departamento_id === selectedDepartamentoId).map((p) => <option key={p.provincia_id} value={p.provincia_id}>{p.nombre}</option>)}</select></div>
                <div><Label>Distrito</Label><select value={selectedDistritoId} onChange={(e) => { const id = e.target.value; setSelectedDistritoId(id); setForm((p) => ({ ...p, distrito_id: id || undefined })); }} className={inputClass}><option value="">— Seleccionar —</option>{distritos.filter((d) => !selectedProvinciaId || d.provincia_id === selectedProvinciaId).map((d) => <option key={d.distrito_id} value={d.distrito_id}>{d.nombre} ({d.ubigeo})</option>)}</select></div>
              </div>
            </div>
            {/* Contacto */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Nombre contacto</Label><input type="text" value={form.contacto_nombre ?? ''} onChange={(e) => setForm((p) => ({ ...p, contacto_nombre: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>Cargo</Label><input type="text" value={form.contacto_cargo ?? ''} onChange={(e) => setForm((p) => ({ ...p, contacto_cargo: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>Teléfono principal</Label><input type="text" value={form.telefono_principal ?? ''} onChange={(e) => setForm((p) => ({ ...p, telefono_principal: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>Teléfono secundario</Label><input type="text" value={form.telefono_secundario ?? ''} onChange={(e) => setForm((p) => ({ ...p, telefono_secundario: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>Email principal</Label><input type="email" value={form.email_principal ?? ''} onChange={(e) => setForm((p) => ({ ...p, email_principal: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>Email cotizaciones</Label><input type="email" value={form.email_cotizaciones ?? ''} onChange={(e) => setForm((p) => ({ ...p, email_cotizaciones: e.target.value || undefined }))} className={inputClass} /></div>
                <div className="md:col-span-2"><Label>Sitio web</Label><input type="url" value={form.sitio_web ?? ''} onChange={(e) => setForm((p) => ({ ...p, sitio_web: e.target.value || undefined }))} className={inputClass} /></div>
              </div>
            </div>
            {/* Condiciones comerciales */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">Condiciones comerciales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Condición pago</Label><select value={form.condicion_pago_defecto ?? '30_dias'} onChange={(e) => setForm((p) => ({ ...p, condicion_pago_defecto: e.target.value }))} className={inputClass}>{CONDICIONES_PAGO.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</select></div>
                <div><Label>Días crédito</Label><input type="number" value={form.dias_credito_defecto ?? 30} onChange={(e) => setForm((p) => ({ ...p, dias_credito_defecto: parseInt(e.target.value) || 30 }))} className={inputClass} /></div>
                <div>
                  <Label>Moneda *</Label>
                  <select value={form.moneda_preferida} onChange={(e) => setForm((p) => ({ ...p, moneda_preferida: e.target.value }))} className={inputClass} required>
                    <option value="">— Seleccionar —</option>
                    {monedas.map((m) => <option key={m.moneda_id} value={m.moneda_id}>{m.codigo} — {m.nombre}</option>)}
                  </select>
                </div>
                <div><Label>Límite crédito</Label><input type="number" step="0.01" value={form.limite_credito ?? ''} onChange={(e) => setForm((p) => ({ ...p, limite_credito: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputClass} /></div>
              </div>
            </div>
            {/* Bancarios */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">Datos bancarios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Banco</Label><input type="text" value={form.banco ?? ''} onChange={(e) => setForm((p) => ({ ...p, banco: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>Número de cuenta</Label><input type="text" value={form.numero_cuenta ?? ''} onChange={(e) => setForm((p) => ({ ...p, numero_cuenta: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>Tipo de cuenta</Label><select value={form.tipo_cuenta ?? ''} onChange={(e) => setForm((p) => ({ ...p, tipo_cuenta: e.target.value || undefined }))} className={inputClass}><option value="">Seleccionar</option>{TIPOS_CUENTA.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><Label>CCI</Label><input type="text" value={form.cci ?? ''} onChange={(e) => setForm((p) => ({ ...p, cci: e.target.value || undefined }))} className={inputClass} /></div>
              </div>
            </div>
            {/* Clasificación */}
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">Clasificación / Evaluación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Calificación (0–5)</Label><input type="number" min={0} max={5} step={0.01} value={form.calificacion ?? ''} onChange={(e) => setForm((p) => ({ ...p, calificacion: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputClass} /></div>
                <div><Label>Nivel confianza</Label><select value={form.nivel_confianza ?? ''} onChange={(e) => setForm((p) => ({ ...p, nivel_confianza: e.target.value || undefined }))} className={inputClass}><option value="">Seleccionar</option>{NIVELES_CONFIANZA.map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
                <div className="md:col-span-2 flex items-center gap-2"><input type="checkbox" id="homologado-c" checked={form.es_proveedor_homologado ?? false} onChange={(e) => setForm((p) => ({ ...p, es_proveedor_homologado: e.target.checked }))} className="rounded" /><Label htmlFor="homologado-c">Proveedor homologado</Label></div>
                <div><Label>Fecha homologación</Label><input type="date" value={form.fecha_homologacion ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_homologacion: e.target.value || undefined }))} className={inputClass} /></div>
                <div className="md:col-span-2"><Label>Observaciones</Label><textarea value={form.observaciones ?? ''} onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} className={inputClass} rows={2} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMut.isPending} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal Editar ── */}
      <Dialog open={editOpen} onOpenChange={(o) => { if (!o) setEditing(null); setEditOpen(o); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar proveedor</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">Datos generales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Código *</Label><input type="text" value={editForm.codigo_proveedor ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_proveedor: e.target.value }))} className={inputClass} required /></div>
                <div className="md:col-span-2"><Label>Razón Social *</Label><input type="text" value={editForm.razon_social ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, razon_social: e.target.value }))} className={inputClass} required /></div>
                <div><Label>Nombre Comercial</Label><input type="text" value={editForm.nombre_comercial ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre_comercial: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>Tipo Proveedor</Label><select value={editForm.tipo_proveedor ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_proveedor: e.target.value || undefined }))} className={inputClass}><option value="">Seleccionar</option>{TIPOS_PROVEEDOR.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><Label>Categoría</Label><select value={editForm.categoria_proveedor ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, categoria_proveedor: e.target.value || undefined }))} className={inputClass}><option value="">Seleccionar</option>{CATEGORIAS_PROVEEDOR.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><Label>Tipo Documento</Label><select value={editForm.tipo_documento ?? 'RUC'} onChange={(e) => setEditForm((p) => ({ ...p, tipo_documento: e.target.value }))} className={inputClass}>{TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><Label>Número Documento *</Label><input type="text" value={editForm.numero_documento ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, numero_documento: e.target.value }))} className={inputClass} required /></div>
                <div><Label>Estado</Label><select value={editForm.estado ?? 'activo'} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value }))} className={inputClass}><option value="activo">Activo</option><option value="bloqueado">Bloqueado</option></select></div>
                <div><Label>Motivo bloqueo</Label><input type="text" value={editForm.motivo_bloqueo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, motivo_bloqueo: e.target.value || undefined }))} className={inputClass} /></div>
              </div>
            </div>
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">Dirección</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><Label>Dirección</Label><input type="text" value={editForm.direccion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, direccion: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>País</Label><select value={selectedPaisId} onChange={(e) => { const id = e.target.value; setSelectedPaisId(id); setSelectedDepartamentoId(''); setSelectedProvinciaId(''); setSelectedDistritoId(''); setEditForm((p) => ({ ...p, pais_id: id || undefined, departamento_id: undefined, provincia_id: undefined, distrito_id: undefined })); }} className={inputClass}><option value="">— Seleccionar —</option>{paises.map((p) => <option key={p.pais_id} value={p.pais_id}>{p.nombre}</option>)}</select></div>
                <div><Label>Departamento</Label><select value={selectedDepartamentoId} onChange={(e) => { const id = e.target.value; setSelectedDepartamentoId(id); setSelectedProvinciaId(''); setSelectedDistritoId(''); setEditForm((p) => ({ ...p, departamento_id: id || undefined, provincia_id: undefined, distrito_id: undefined })); }} className={inputClass}><option value="">— Seleccionar —</option>{departamentos.filter((d) => !selectedPaisId || d.pais_id === selectedPaisId).map((d) => <option key={d.departamento_id} value={d.departamento_id}>{d.nombre}</option>)}</select></div>
                <div><Label>Provincia</Label><select value={selectedProvinciaId} onChange={(e) => { const id = e.target.value; setSelectedProvinciaId(id); setSelectedDistritoId(''); setEditForm((p) => ({ ...p, provincia_id: id || undefined, distrito_id: undefined })); }} className={inputClass}><option value="">— Seleccionar —</option>{provincias.filter((p) => !selectedDepartamentoId || p.departamento_id === selectedDepartamentoId).map((p) => <option key={p.provincia_id} value={p.provincia_id}>{p.nombre}</option>)}</select></div>
                <div><Label>Distrito</Label><select value={selectedDistritoId} onChange={(e) => { const id = e.target.value; setSelectedDistritoId(id); setEditForm((p) => ({ ...p, distrito_id: id || undefined })); }} className={inputClass}><option value="">— Seleccionar —</option>{distritos.filter((d) => !selectedProvinciaId || d.provincia_id === selectedProvinciaId).map((d) => <option key={d.distrito_id} value={d.distrito_id}>{d.nombre} ({d.ubigeo})</option>)}</select></div>
              </div>
            </div>
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Nombre contacto</Label><input type="text" value={editForm.contacto_nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, contacto_nombre: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>Cargo</Label><input type="text" value={editForm.contacto_cargo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, contacto_cargo: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>Teléfono principal</Label><input type="text" value={editForm.telefono_principal ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, telefono_principal: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>Teléfono secundario</Label><input type="text" value={editForm.telefono_secundario ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, telefono_secundario: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>Email principal</Label><input type="email" value={editForm.email_principal ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, email_principal: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>Email cotizaciones</Label><input type="email" value={editForm.email_cotizaciones ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, email_cotizaciones: e.target.value || undefined }))} className={inputClass} /></div>
                <div className="md:col-span-2"><Label>Sitio web</Label><input type="url" value={editForm.sitio_web ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, sitio_web: e.target.value || undefined }))} className={inputClass} /></div>
              </div>
            </div>
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">Condiciones comerciales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Condición pago</Label><select value={editForm.condicion_pago_defecto ?? '30_dias'} onChange={(e) => setEditForm((p) => ({ ...p, condicion_pago_defecto: e.target.value }))} className={inputClass}>{CONDICIONES_PAGO.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</select></div>
                <div><Label>Días crédito</Label><input type="number" value={editForm.dias_credito_defecto ?? 30} onChange={(e) => setEditForm((p) => ({ ...p, dias_credito_defecto: parseInt(e.target.value) || 30 }))} className={inputClass} /></div>
                <div>
                  <Label>Moneda *</Label>
                  <select value={editForm.moneda_preferida ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, moneda_preferida: e.target.value || undefined }))} className={inputClass} required>
                    <option value="">— Seleccionar —</option>
                    {monedas.map((m) => <option key={m.moneda_id} value={m.moneda_id}>{m.codigo} — {m.nombre}</option>)}
                  </select>
                </div>
                <div><Label>Límite crédito</Label><input type="number" step="0.01" value={editForm.limite_credito ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, limite_credito: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputClass} /></div>
              </div>
            </div>
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">Datos bancarios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Banco</Label><input type="text" value={editForm.banco ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, banco: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>Número de cuenta</Label><input type="text" value={editForm.numero_cuenta ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, numero_cuenta: e.target.value || undefined }))} className={inputClass} /></div>
                <div><Label>Tipo de cuenta</Label><select value={editForm.tipo_cuenta ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_cuenta: e.target.value || undefined }))} className={inputClass}><option value="">Seleccionar</option>{TIPOS_CUENTA.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><Label>CCI</Label><input type="text" value={editForm.cci ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cci: e.target.value || undefined }))} className={inputClass} /></div>
              </div>
            </div>
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-3">Clasificación / Evaluación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Nivel confianza</Label><select value={editForm.nivel_confianza ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nivel_confianza: e.target.value || undefined }))} className={inputClass}><option value="">Seleccionar</option>{NIVELES_CONFIANZA.map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
                <div className="md:col-span-2 flex items-center gap-2"><input type="checkbox" id="homologado-e" checked={editForm.es_proveedor_homologado ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_proveedor_homologado: e.target.checked }))} className="rounded" /><Label htmlFor="homologado-e">Proveedor homologado</Label></div>
                <div><Label>Fecha homologación</Label><input type="date" value={editForm.fecha_homologacion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_homologacion: e.target.value || undefined }))} className={inputClass} /></div>
                <div className="md:col-span-2"><Label>Observaciones</Label><textarea value={editForm.observaciones ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} className={inputClass} rows={2} /></div>
              </div>
            </div>
            <div className="flex items-center gap-2 border-b pb-4">
              <input type="checkbox" id="edit-activo" checked={editForm.es_activo ?? true} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded" /><Label htmlFor="edit-activo">Activo</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateMut.isPending} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PurPageLayout>
  );
}
