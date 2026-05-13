/**
 * Empleados HCM — Listado y gestión. GET/POST/PUT /api/v1/hcm/empleados
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, User, Plus, Pencil, Search } from 'lucide-react';
import { empresaService, departamentoService, cargoService, sucursalService, centroCostoService } from '@/features/org/services/org.service';
import { empleadoService } from '../services/hcm.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Departamento, Cargo, Sucursal, CentroCosto } from '@/features/org/types/org.types';
import type { Empleado, EmpleadoCreate, EmpleadoUpdate } from '../types/hcm.types';
import { HcmPageLayout } from '../components/HcmPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPO_DOC = ['DNI', 'CE', 'PASAPORTE'] as const;
const SEXO = ['M', 'F'] as const;
const SISTEMA_PENSIONARIO = ['AFP', 'ONP'] as const;
const ESTADOS_EMP = ['activo', 'inactivo', 'cesado'] as const;

const DEFAULT: EmpleadoCreate = {
  empresa_id: '',
  codigo_empleado: '',
  tipo_documento: 'DNI',
  numero_documento: '',
  apellido_paterno: '',
  apellido_materno: '',
  nombres: '',
  fecha_nacimiento: '',
  sexo: 'M',
  fecha_ingreso: '',
  sistema_pensionario: 'AFP',
  es_activo: true,
};

export default function EmpleadosPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);
  const [list, setList] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Empleado | null>(null);
  const [form, setForm] = useState<EmpleadoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<EmpleadoUpdate>({});
  const [submitting, setSubmitting] = useState(false);

  const loadEmpresas = useCallback(async () => {
    try {
      const data = await empresaService.list({ solo_activos: true });
      setEmpresas(data);
      if (data.length === 1 && !empresaFilter) setEmpresaFilter(data[0].empresa_id);
    } catch {
      setEmpresas([]);
    }
  }, [empresaFilter]);

  const loadDeps = useCallback(async () => {
    if (!empresaFilter) {
      setDepartamentos([]);
      setCargos([]);
      setSucursales([]);
      setCentrosCosto([]);
      return;
    }
    try {
      const [deps, car, suc, cc] = await Promise.all([
        departamentoService.list({ empresa_id: empresaFilter, solo_activos: true }),
        cargoService.list({ empresa_id: empresaFilter, solo_activos: true }),
        sucursalService.list({ empresa_id: empresaFilter, solo_activos: true }),
        centroCostoService.list({ empresa_id: empresaFilter, solo_activos: true }),
      ]);
      setDepartamentos(deps);
      setCargos(car);
      setSucursales(suc);
      setCentrosCosto(cc);
    } catch {
      setDepartamentos([]);
      setCargos([]);
      setSucursales([]);
      setCentrosCosto([]);
    }
  }, [empresaFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; estado_empleado?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (estadoFilter) params.estado_empleado = estadoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await empleadoService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, estadoFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadDeps(); }, [loadDeps]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
    });
    setCreateOpen(true);
  };

  const openEdit = (row: Empleado) => {
    setEditing(row);
    setEditForm({
      codigo_empleado: row.codigo_empleado,
      tipo_documento: (row.tipo_documento as EmpleadoUpdate['tipo_documento']) ?? undefined,
      numero_documento: row.numero_documento,
      apellido_paterno: row.apellido_paterno,
      apellido_materno: row.apellido_materno,
      nombres: row.nombres,
      fecha_nacimiento: row.fecha_nacimiento,
      sexo: row.sexo,
      fecha_ingreso: row.fecha_ingreso,
      sistema_pensionario: row.sistema_pensionario,
      departamento_id: row.departamento_id ?? undefined,
      cargo_id: row.cargo_id ?? undefined,
      sucursal_id: row.sucursal_id ?? undefined,
      centro_costo_id: row.centro_costo_id ?? undefined,
      banco: row.banco ?? undefined,
      numero_cuenta: row.numero_cuenta ?? undefined,
      estado_empleado: (row.estado_empleado as EmpleadoUpdate['estado_empleado']) ?? undefined,
      direccion: row.direccion ?? undefined,
      telefono_movil: row.telefono_movil ?? undefined,
      email_corporativo: row.email_corporativo ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo_empleado.trim() || !form.numero_documento.trim() || !form.apellido_paterno.trim() || !form.apellido_materno.trim() || !form.nombres.trim() || !form.fecha_nacimiento || !form.fecha_ingreso) {
      toast.error('Completa los campos obligatorios.');
      return;
    }
    setSubmitting(true);
    try {
      await empleadoService.create(form);
      toast.success('Empleado creado.');
      setCreateOpen(false);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await empleadoService.update(editing.empleado_id, editForm);
      toast.success('Empleado actualizado.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';
  const selectCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

  return (
    <HcmPageLayout
      title="Empleados"
      description="Maestro de empleados: datos personales, AFP/ONP, cuenta bancaria, cargo y departamento."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo empleado
        </Button>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        {empresas.length > 0 && (
          <div>
            <Label className="mr-2">Empresa</Label>
            <select value={empresaFilter} onChange={(e) => setEmpresaFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">Todas</option>
              {empresas.map((e) => (
                <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {ESTADOS_EMP.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre o documento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" />
        </div>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !loading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Documento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ingreso</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">AFP/ONP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><User className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay empleados.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.empleado_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_empleado}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_documento} {row.numero_documento}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre_completo ?? `${row.apellido_paterno} ${row.apellido_materno}, ${row.nombres}`}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_ingreso}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.sistema_pensionario}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado_empleado ?? (row.es_activo ? 'activo' : 'inactivo')}</td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80"><Pencil className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo empleado</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Código empleado *</Label><input type="text" value={form.codigo_empleado} onChange={(e) => setForm((p) => ({ ...p, codigo_empleado: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo doc</Label><select value={form.tipo_documento ?? 'DNI'} onChange={(e) => setForm((p) => ({ ...p, tipo_documento: e.target.value }))} className={selectCls}>{TIPO_DOC.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Nº documento *</Label><input type="text" value={form.numero_documento} onChange={(e) => setForm((p) => ({ ...p, numero_documento: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Apellido paterno *</Label><input type="text" value={form.apellido_paterno} onChange={(e) => setForm((p) => ({ ...p, apellido_paterno: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Apellido materno *</Label><input type="text" value={form.apellido_materno} onChange={(e) => setForm((p) => ({ ...p, apellido_materno: e.target.value }))} className={inputCls} required /></div>
              <div className="md:col-span-2"><Label>Nombres *</Label><input type="text" value={form.nombres} onChange={(e) => setForm((p) => ({ ...p, nombres: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha nacimiento *</Label><input type="date" value={form.fecha_nacimiento} onChange={(e) => setForm((p) => ({ ...p, fecha_nacimiento: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Sexo</Label><select value={form.sexo} onChange={(e) => setForm((p) => ({ ...p, sexo: e.target.value as 'M' | 'F' }))} className={selectCls}>{SEXO.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><Label>Fecha ingreso *</Label><input type="date" value={form.fecha_ingreso} onChange={(e) => setForm((p) => ({ ...p, fecha_ingreso: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Sistema pensionario</Label><select value={form.sistema_pensionario} onChange={(e) => setForm((p) => ({ ...p, sistema_pensionario: e.target.value as 'AFP' | 'ONP' }))} className={selectCls}>{SISTEMA_PENSIONARIO.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><Label>Departamento</Label><select value={form.departamento_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, departamento_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{departamentos.map((d) => <option key={d.departamento_id} value={d.departamento_id}>{d.nombre}</option>)}</select></div>
              <div><Label>Cargo</Label><select value={form.cargo_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, cargo_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{cargos.map((c) => <option key={c.cargo_id} value={c.cargo_id}>{c.nombre}</option>)}</select></div>
              <div><Label>Sucursal</Label><select value={form.sucursal_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, sucursal_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{sucursales.map((s) => <option key={s.sucursal_id} value={s.sucursal_id}>{s.nombre}</option>)}</select></div>
              <div><Label>Centro costo</Label><select value={form.centro_costo_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, centro_costo_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{centrosCosto.map((c) => <option key={c.centro_costo_id} value={c.centro_costo_id}>{c.nombre}</option>)}</select></div>
              <div><Label>Banco</Label><input type="text" value={form.banco ?? ''} onChange={(e) => setForm((p) => ({ ...p, banco: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Nº cuenta</Label><input type="text" value={form.numero_cuenta ?? ''} onChange={(e) => setForm((p) => ({ ...p, numero_cuenta: e.target.value || undefined }))} className={inputCls} /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_activo ?? true} onChange={(e) => setForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded" /><Label>Activo</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar empleado</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Código *</Label><input type="text" value={editForm.codigo_empleado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_empleado: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Nº documento *</Label><input type="text" value={editForm.numero_documento ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, numero_documento: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Apellido paterno *</Label><input type="text" value={editForm.apellido_paterno ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, apellido_paterno: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Apellido materno *</Label><input type="text" value={editForm.apellido_materno ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, apellido_materno: e.target.value }))} className={inputCls} required /></div>
              <div className="md:col-span-2"><Label>Nombres *</Label><input type="text" value={editForm.nombres ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombres: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha ingreso *</Label><input type="date" value={editForm.fecha_ingreso ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_ingreso: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Departamento</Label><select value={editForm.departamento_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, departamento_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{departamentos.map((d) => <option key={d.departamento_id} value={d.departamento_id}>{d.nombre}</option>)}</select></div>
              <div><Label>Cargo</Label><select value={editForm.cargo_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cargo_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{cargos.map((c) => <option key={c.cargo_id} value={c.cargo_id}>{c.nombre}</option>)}</select></div>
              <div><Label>Estado</Label><select value={editForm.estado_empleado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado_empleado: e.target.value as EmpleadoUpdate['estado_empleado'] }))} className={selectCls}><option value="">—</option>{ESTADOS_EMP.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_activo ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded" /><Label>Activo</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </HcmPageLayout>
  );
}
