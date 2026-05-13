/**
 * Clientes — Listado y gestión completa. GET/POST /api/v1/sls/clientes
 * Incluye TODOS los campos esenciales: RUC, contactos, condiciones de pago, límite crédito, vendedor, etc.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Users, Plus, Pencil, Search } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { clienteService } from '../services/sls.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Cliente, ClienteCreate, ClienteUpdate } from '../types/sls.types';
import { SlsPageLayout } from '../components/SlsPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_DOCUMENTO = ['RUC', 'DNI', 'CE', 'PASAPORTE'] as const;
const TIPOS_CLIENTE = ['empresa', 'persona'] as const;
const CONDICIONES_PAGO = ['contado', '7_dias', '15_dias', '30_dias', '45_dias', '60_dias', '90_dias'] as const;
const NIVELES_RIESGO = ['bajo', 'medio', 'alto'] as const;
const ESTADOS = ['prospecto', 'activo', 'inactivo', 'bloqueado'] as const;

const DEFAULT: ClienteCreate = {
  empresa_id: '',
  codigo_cliente: '',
  tipo_cliente: 'empresa',
  razon_social: '',
  tipo_documento: 'RUC',
  numero_documento: '',
  condicion_pago_defecto: '30_dias',
  dias_credito_defecto: 30,
  moneda_preferida: 'PEN',
  pais: 'Perú',
  nivel_riesgo: 'bajo',
  estado: 'activo',
  es_activo: true,
};

export default function ClientesPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [list, setList] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState<ClienteCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ClienteUpdate>({});
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

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { solo_activos: true };
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await clienteService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? '') });
    setCreateOpen(true);
  };
  const openEdit = (row: Cliente) => {
    setEditing(row);
    setEditForm({
      codigo_cliente: row.codigo_cliente,
      razon_social: row.razon_social,
      nombre_comercial: row.nombre_comercial ?? undefined,
      tipo_documento: row.tipo_documento ?? 'RUC',
      numero_documento: row.numero_documento,
      direccion: row.direccion ?? undefined,
      telefono_principal: row.telefono_principal ?? undefined,
      email_principal: row.email_principal ?? undefined,
      email_facturacion: row.email_facturacion ?? undefined,
      contacto_nombre: row.contacto_nombre ?? undefined,
      condicion_pago_defecto: row.condicion_pago_defecto ?? '30_dias',
      dias_credito_defecto: row.dias_credito_defecto ?? 30,
      moneda_preferida: row.moneda_preferida ?? 'PEN',
      limite_credito: row.limite_credito ?? undefined,
      nivel_riesgo: row.nivel_riesgo ?? 'bajo',
      estado: row.estado ?? 'activo',
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo_cliente.trim() || !form.razon_social.trim() || !form.numero_documento.trim()) {
      toast.error('Completa empresa, código, razón social y número de documento.');
      return;
    }
    setSubmitting(true);
    try {
      await clienteService.create(form);
      toast.success('Cliente creado.');
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
      await clienteService.update(editing.cliente_venta_id, editForm);
      toast.success('Cliente actualizado.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SlsPageLayout
      title="Clientes"
      description="Catálogo con RUC, contactos, condiciones de pago, límite de crédito y vendedor asignado."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Crear cliente
        </Button>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        {empresas.length > 0 && (
          <div>
            <Label className="mr-2">Empresa</Label>
            <select value={empresaFilter} onChange={(e) => setEmpresaFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">Todas</option>
              {empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}
            </select>
          </div>
        )}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por razón social, RUC o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          />
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Razón Social</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">RUC/Doc</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contacto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Condición Pago</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Límite Crédito</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Users className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay clientes.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.cliente_venta_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_cliente}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.razon_social}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.numero_documento}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.contacto_nombre ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.condicion_pago_defecto ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.moneda_preferida} {row.limite_credito?.toFixed(2) ?? '0.00'}</td>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear cliente</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Código *</Label><input type="text" value={form.codigo_cliente} onChange={(e) => setForm((p) => ({ ...p, codigo_cliente: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div className="md:col-span-2"><Label>Razón Social *</Label><input type="text" value={form.razon_social} onChange={(e) => setForm((p) => ({ ...p, razon_social: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Tipo Cliente</Label><select value={form.tipo_cliente ?? 'empresa'} onChange={(e) => setForm((p) => ({ ...p, tipo_cliente: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_CLIENTE.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Tipo Documento</Label><select value={form.tipo_documento ?? 'RUC'} onChange={(e) => setForm((p) => ({ ...p, tipo_documento: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Número Documento *</Label><input type="text" value={form.numero_documento} onChange={(e) => setForm((p) => ({ ...p, numero_documento: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Dirección</Label><input type="text" value={form.direccion ?? ''} onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Teléfono</Label><input type="text" value={form.telefono_principal ?? ''} onChange={(e) => setForm((p) => ({ ...p, telefono_principal: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Email</Label><input type="email" value={form.email_principal ?? ''} onChange={(e) => setForm((p) => ({ ...p, email_principal: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Email Facturación</Label><input type="email" value={form.email_facturacion ?? ''} onChange={(e) => setForm((p) => ({ ...p, email_facturacion: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Condiciones de Pago</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Condición Pago</Label><select value={form.condicion_pago_defecto ?? '30_dias'} onChange={(e) => setForm((p) => ({ ...p, condicion_pago_defecto: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{CONDICIONES_PAGO.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}</select></div>
                <div><Label>Días Crédito</Label><input type="number" value={form.dias_credito_defecto ?? 30} onChange={(e) => setForm((p) => ({ ...p, dias_credito_defecto: parseInt(e.target.value) || 30 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
                <div><Label>Moneda</Label><select value={form.moneda_preferida ?? 'PEN'} onChange={(e) => setForm((p) => ({ ...p, moneda_preferida: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="PEN">PEN</option><option value="USD">USD</option></select></div>
                <div><Label>Límite Crédito</Label><input type="number" step="0.01" value={form.limite_credito ?? ''} onChange={(e) => setForm((p) => ({ ...p, limite_credito: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
                <div><Label>Nivel Riesgo</Label><select value={form.nivel_riesgo ?? 'bajo'} onChange={(e) => setForm((p) => ({ ...p, nivel_riesgo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{NIVELES_RIESGO.map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
                <div><Label>Estado</Label><select value={form.estado ?? 'activo'} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}</select></div>
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar cliente</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Código *</Label><input type="text" value={editForm.codigo_cliente ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_cliente: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div className="md:col-span-2"><Label>Razón Social *</Label><input type="text" value={editForm.razon_social ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, razon_social: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Número Documento *</Label><input type="text" value={editForm.numero_documento ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, numero_documento: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Dirección</Label><input type="text" value={editForm.direccion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, direccion: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Teléfono</Label><input type="text" value={editForm.telefono_principal ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, telefono_principal: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Email</Label><input type="email" value={editForm.email_principal ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, email_principal: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Condiciones de Pago</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Condición Pago</Label><select value={editForm.condicion_pago_defecto ?? '30_dias'} onChange={(e) => setEditForm((p) => ({ ...p, condicion_pago_defecto: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{CONDICIONES_PAGO.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}</select></div>
                <div><Label>Días Crédito</Label><input type="number" value={editForm.dias_credito_defecto ?? 30} onChange={(e) => setEditForm((p) => ({ ...p, dias_credito_defecto: parseInt(e.target.value) || 30 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
                <div><Label>Límite Crédito</Label><input type="number" step="0.01" value={editForm.limite_credito ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, limite_credito: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SlsPageLayout>
  );
}
