/**
 * Parámetros del sistema — Listado y gestión. GET/POST/PUT/DELETE /api/v1/org/parametros
 * Edición de valor según tipo_dato (texto, numerico, booleano, fecha, json).
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Settings, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import type { Parametro, ParametroCreate, ParametroUpdate, Empresa } from '../types/org.types';
import { OrgPageLayout } from '../components/OrgPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogBody, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { FormSection } from '../components/FormSection';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useEmpresas } from '../hooks/empresa.hooks';
import {
  useCreateParametro,
  useDeleteParametro,
  useParametros,
  useReactivarParametro,
  useUpdateParametro,
} from '../hooks/parametro.hooks';

const MODULO_ORG = 'ORG';
const TIPOS_DATO = ['texto', 'numerico', 'booleano', 'fecha', 'json'] as const;
const inputClass = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

const DEFAULT: ParametroCreate = {
  modulo_codigo: MODULO_ORG,
  codigo_parametro: '',
  nombre_parametro: '',
  tipo_dato: 'texto',
  descripcion: undefined,
  empresa_id: undefined,
  valor_defecto: undefined,
  es_editable: true,
  es_obligatorio: false,
  es_activo: true,
};

export default function ParametrosPage() {
  const [moduloFilter, setModuloFilter] = useState<string>(MODULO_ORG);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Parametro | null>(null);
  const [form, setForm] = useState<ParametroCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ParametroUpdate>({});
  const [deleteTarget, setDeleteTarget] = useState<Parametro | null>(null);
  const [valorJsonStr, setValorJsonStr] = useState<string>('');

  const { can } = usePermissions();
  const canCrear = can('org', 'crear');
  const canEditar = can('org', 'editar');
  const canEliminar = can('org', 'eliminar');

  const empresasQuery = useEmpresas({ solo_activos: true });
  const empresas: Empresa[] = empresasQuery.data ?? [];

  const listQuery = useParametros({
    solo_activos: !includeInactive,
    modulo_codigo: moduloFilter || undefined,
    buscar,
  });
  const list = listQuery.data ?? [];
  const loading = listQuery.isLoading;
  const error = listQuery.error ? getErrorMessage(listQuery.error).message : null;

  const createParametro = useCreateParametro();
  const updateParametro = useUpdateParametro();
  const deleteParametro = useDeleteParametro();
  const reactivarParametro = useReactivarParametro();

  const submitting = createParametro.isPending || updateParametro.isPending;
  const deleting = deleteParametro.isPending;
  const reactivatingId = reactivarParametro.variables?.parametroId ?? null;

  const openCreate = () => {
    setForm({ ...DEFAULT, modulo_codigo: moduloFilter || MODULO_ORG });
    setCreateOpen(true);
  };
  const openEdit = (row: Parametro) => {
    setEditing(row);
    setEditForm({
      codigo_parametro: row.codigo_parametro,
      nombre_parametro: row.nombre_parametro,
      tipo_dato: row.tipo_dato,
      descripcion: row.descripcion ?? undefined,
      empresa_id: row.empresa_id ?? undefined,
      valor_texto: row.valor_texto ?? undefined,
      valor_numerico: row.valor_numerico ?? undefined,
      valor_booleano: row.valor_booleano ?? undefined,
      valor_fecha: row.valor_fecha ?? undefined,
      valor_json: row.valor_json,
      valor_defecto: row.valor_defecto ?? undefined,
      es_editable: row.es_editable ?? true,
      es_obligatorio: row.es_obligatorio ?? false,
      es_activo: row.es_activo,
    });
    setValorJsonStr(typeof row.valor_json === 'string' ? row.valor_json : JSON.stringify(row.valor_json ?? '', null, 2));
    setEditOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteParametro.mutateAsync({ parametroId: deleteTarget.parametro_id, empresa_id: deleteTarget.empresa_id ?? undefined });
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo_parametro.trim() || !form.nombre_parametro.trim()) {
      toast.error('Código y nombre del parámetro son requeridos.');
      return;
    }
    try {
      await createParametro.mutateAsync(form);
      setCreateOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  /** Campo de valor inicial en creación según tipo_dato */
  const renderCreateValor = () => {
    const t = form.tipo_dato;
    switch (t) {
      case 'numerico':
        return (
          <div>
            <Label>Valor inicial (numérico)</Label>
            <input type="number" value={form.valor_numerico ?? ''} onChange={(e) => setForm((p) => ({ ...p, valor_numerico: e.target.value === '' ? undefined : Number(e.target.value) }))} className={inputClass} />
          </div>
        );
      case 'booleano':
        return (
          <div className="flex items-center gap-2">
            <input type="checkbox" id="create_valor_booleano" checked={form.valor_booleano ?? false} onChange={(e) => setForm((p) => ({ ...p, valor_booleano: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" />
            <Label htmlFor="create_valor_booleano">Valor inicial (sí/no)</Label>
          </div>
        );
      case 'fecha':
        return (
          <div>
            <Label>Valor inicial (fecha)</Label>
            <input type="date" value={form.valor_fecha?.slice(0, 10) ?? ''} onChange={(e) => setForm((p) => ({ ...p, valor_fecha: e.target.value ? `${e.target.value}T00:00:00` : undefined }))} className={inputClass} />
          </div>
        );
      case 'json':
        return (
          <div>
            <Label>Valor inicial (JSON)</Label>
            <textarea value={typeof form.valor_json === 'string' ? form.valor_json : JSON.stringify(form.valor_json ?? {}, null, 2)} onChange={(e) => { try { setForm((p) => ({ ...p, valor_json: e.target.value.trim() ? JSON.parse(e.target.value) : undefined })); } catch { setForm((p) => ({ ...p, valor_json: undefined })); } }} rows={3} className={`${inputClass} font-mono text-xs`} placeholder='{"clave": "valor"}' />
          </div>
        );
      default:
        return (
          <div>
            <Label>Valor inicial (texto)</Label>
            <input type="text" value={form.valor_texto ?? ''} onChange={(e) => setForm((p) => ({ ...p, valor_texto: e.target.value || undefined }))} className={inputClass} />
          </div>
        );
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const payload = { ...editForm };
    if (editing.tipo_dato === 'json') {
      try {
        payload.valor_json = valorJsonStr.trim() ? JSON.parse(valorJsonStr) : undefined;
      } catch {
        toast.error('El valor JSON no es válido.');
        return;
      }
    }
    try {
      await updateParametro.mutateAsync({
        parametroId: editing.parametro_id,
        payload,
        empresa_id: editing.empresa_id ?? undefined,
      });
      setEditOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const handleReactivar = async (row: Parametro) => {
    try {
      await reactivarParametro.mutateAsync({ parametroId: row.parametro_id, empresa_id: row.empresa_id ?? undefined });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  /** Renderiza el campo de valor según tipo_dato en edición */
  const renderEditValor = () => {
    const tipo = editing?.tipo_dato ?? 'texto';
    switch (tipo) {
      case 'numerico':
        return (
          <div>
            <Label>Valor (numérico)</Label>
            <input
              type="number"
              value={editForm.valor_numerico ?? ''}
              onChange={(e) => setEditForm((p) => ({ ...p, valor_numerico: e.target.value === '' ? undefined : Number(e.target.value) }))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        );
      case 'booleano':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit_valor_booleano"
              checked={editForm.valor_booleano ?? false}
              onChange={(e) => setEditForm((p) => ({ ...p, valor_booleano: e.target.checked }))}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <Label htmlFor="edit_valor_booleano">Valor (sí/no)</Label>
          </div>
        );
      case 'fecha':
        return (
          <div>
            <Label>Valor (fecha)</Label>
            <input
              type="date"
              value={editForm.valor_fecha?.slice(0, 10) ?? ''}
              onChange={(e) => setEditForm((p) => ({ ...p, valor_fecha: e.target.value ? `${e.target.value}T00:00:00` : undefined }))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        );
      case 'json':
        return (
          <div>
            <Label>Valor (JSON)</Label>
            <textarea
              value={valorJsonStr}
              onChange={(e) => setValorJsonStr(e.target.value)}
              rows={4}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white font-mono text-xs"
              placeholder='{"clave": "valor"}'
            />
          </div>
        );
      default:
        return (
          <div>
            <Label>Valor (texto)</Label>
            <input
              type="text"
              value={editForm.valor_texto ?? ''}
              onChange={(e) => setEditForm((p) => ({ ...p, valor_texto: e.target.value || undefined }))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        );
    }
  };

  const valorDisplay = (p: Parametro) => {
    if (p.valor_booleano !== undefined && p.valor_booleano !== null) return p.valor_booleano ? 'Sí' : 'No';
    if (p.valor_numerico !== undefined && p.valor_numerico !== null) return String(p.valor_numerico);
    if (p.valor_fecha) return p.valor_fecha;
    if (p.valor_texto) return p.valor_texto;
    if (p.valor_json != null) return JSON.stringify(p.valor_json);
    return '-';
  };

  return (
    <OrgPageLayout
      title="Parámetros del sistema"
      description="Configuración global (métodos costeo, afectación IGV, decimales)."
      action={
        canCrear ? (
          <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
            <Plus className="h-4 w-4 mr-2" /> Crear parámetro
          </Button>
        ) : null
      }
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label className="mr-2">Módulo</Label>
            <select
              value={moduloFilter}
              onChange={(e) => setModuloFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todos</option>
              <option value={MODULO_ORG}>ORG</option>
              <option value="INV">INV</option>
              <option value="SLS">SLS</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pb-1">
            <input
              type="checkbox"
              id="param_include_inactive"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <Label htmlFor="param_include_inactive">Ver inactivos</Label>
          </div>
        </div>
        <div className="w-full md:w-80">
          <Label htmlFor="buscar_parametro">Buscar</Label>
          <input
            id="buscar_parametro"
            type="text"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            placeholder="Código, nombre..."
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Módulo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valor</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Settings className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay parámetros.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.parametro_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.modulo_codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.codigo_parametro}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre_parametro}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_dato}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">{valorDisplay(row)}</td>
                    <td className="px-4 py-3 flex items-center justify-center gap-1">
                      {canEditar && (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80" title="Editar">
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
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" title="Eliminar">
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
        title="Eliminar parámetro"
        message={deleteTarget ? `¿Eliminar el parámetro "${deleteTarget.nombre_parametro}" (${deleteTarget.codigo_parametro})?` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Crear parámetro</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5 overflow-y-auto">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <div><Label>Módulo *</Label><input type="text" value={form.modulo_codigo} onChange={(e) => setForm((p) => ({ ...p, modulo_codigo: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Código parámetro *</Label><input type="text" value={form.codigo_parametro} onChange={(e) => setForm((p) => ({ ...p, codigo_parametro: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Nombre parámetro *</Label><input type="text" value={form.nombre_parametro} onChange={(e) => setForm((p) => ({ ...p, nombre_parametro: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Tipo dato *</Label><select value={form.tipo_dato} onChange={(e) => setForm((p) => ({ ...p, tipo_dato: e.target.value as Parametro['tipo_dato'] }))} className={inputClass}>{TIPOS_DATO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                  {renderCreateValor()}
                </div>
              </FormSection>
              <FormSection title="Alcance y descripción">
                <div className="space-y-3">
                  <div><Label>Descripción</Label><input type="text" value={form.descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} placeholder="Uso del parámetro" /></div>
                  <div><Label>Empresa (alcance)</Label><select value={form.empresa_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value || undefined }))} className={inputClass}><option value="">— Global (todas) —</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
                </div>
              </FormSection>
              <FormSection title="Opciones avanzadas">
                <div className="space-y-3">
                  <div><Label>Valor por defecto (texto)</Label><input type="text" value={form.valor_defecto ?? ''} onChange={(e) => setForm((p) => ({ ...p, valor_defecto: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2"><input type="checkbox" id="param_create_editable" checked={form.es_editable ?? true} onChange={(e) => setForm((p) => ({ ...p, es_editable: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label htmlFor="param_create_editable">Editable</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" id="param_create_obligatorio" checked={form.es_obligatorio ?? false} onChange={(e) => setForm((p) => ({ ...p, es_obligatorio: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label htmlFor="param_create_obligatorio">Obligatorio</Label></div>
                  </div>
                </div>
              </FormSection>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="param_create_activo" checked={form.es_activo ?? true} onChange={(e) => setForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" />
                <Label htmlFor="param_create_activo">Activo</Label>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700"><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Editar parámetro</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5 overflow-y-auto">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <div><Label>Código</Label><input type="text" value={editForm.codigo_parametro ?? ''} readOnly className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-sm" /></div>
                  <div><Label>Nombre *</Label><input type="text" value={editForm.nombre_parametro ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre_parametro: e.target.value }))} className={inputClass} required /></div>
                  {renderEditValor()}
                </div>
              </FormSection>
              <FormSection title="Alcance y descripción">
                <div className="space-y-3">
                  <div><Label>Descripción</Label><input type="text" value={editForm.descripcion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Empresa (alcance)</Label><select value={editForm.empresa_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, empresa_id: e.target.value || undefined }))} className={inputClass}><option value="">— Global (todas) —</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
                </div>
              </FormSection>
              <FormSection title="Opciones avanzadas">
                <div className="space-y-3">
                  <div><Label>Valor por defecto (texto)</Label><input type="text" value={editForm.valor_defecto ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, valor_defecto: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2"><input type="checkbox" id="param_edit_editable" checked={editForm.es_editable ?? true} onChange={(e) => setEditForm((p) => ({ ...p, es_editable: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label htmlFor="param_edit_editable">Editable</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" id="param_edit_obligatorio" checked={editForm.es_obligatorio ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_obligatorio: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label htmlFor="param_edit_obligatorio">Obligatorio</Label></div>
                  </div>
                </div>
              </FormSection>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="param_edit_activo" checked={editForm.es_activo ?? true} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" />
                <Label htmlFor="param_edit_activo">Activo</Label>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700"><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrgPageLayout>
  );
}
