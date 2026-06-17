/**

 * Formulario transaccional de inventario físico — página completa.

 * Crear: POST /api/v1/inv/inventario-fisico/con-detalle

 * Editar: PUT /api/v1/inv/inventario-fisico/{id}/con-detalle

 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { ArrowLeft, Loader, Plus, Trash2 } from 'lucide-react';

import type {

  InventarioFisicoConDetalle,

  InventarioFisicoConDetalleCreate,

  InventarioFisicoConDetalleUpdate,

  InventarioFisicoDetalleCreateEmbebido,

  Producto,

} from '../types/inv.types';

import { getErrorMessage } from '@/core/services/error.service';

import { Button } from '@/shared/components/ui/button';

import { Label } from '@/shared/components/ui/label';

import { usePermission } from '@/core/auth/PermissionContext';
import { INV_PERMISSIONS } from '../constants/inv-permissions';

import { useAlmacenes } from '../hooks/almacenes.hooks';

import { useProductos } from '../hooks/productos.hooks';

import {

  useCreateInventarioFisicoConDetalle,

  useInventarioFisicoConDetalle,

  useUpdateInventarioFisicoConDetalle,

} from '../hooks/inventario-fisico.hooks';

import { useInvSessionScope } from '../hooks/useInvSessionScope';
import { useInvRbacFormAccess } from '../hooks/useInvRbacFormAccess';

import { useInvTransactionalFormGuard } from '../hooks/useInvTransactionalFormGuard';

import { OrgSessionEmpresaField } from '@/features/org/components/OrgSessionEmpresaField';

import { OrgDiscardConfirmDialog } from '@/features/org/components/OrgDiscardConfirmDialog';

import { assertBodyEmpresaMatchesSession } from '@/features/org/utils/org-body-scope';

import {

  buildInventarioFisicoCreateBaseline,

  buildInventarioFisicoFormSnapshot,

  isCreateInventarioFisicoDirty,

  isEditInventarioFisicoDirty,

  type InventarioFisicoFormDirtyInput,

  type InventarioFisicoFormSnapshot,

} from '../utils/form-dirty/inventario-fisico-form-dirty';

import { createEmptyInventarioFisicoLinea, todayIsoDate } from '../utils/inv-transactional-form-init';



const LIST_PATH = '/app/inv/inventario-fisico';



type LineaLocal = {

  key: string;

  producto_id: string;

  cantidad_sistema: string;

  cantidad_contada: string;

};



function mapReadToLineas(data: InventarioFisicoConDetalle): LineaLocal[] {

  const det = data.detalles ?? [];

  return det.map((d) => ({

    key: d.inventario_fisico_detalle_id,

    producto_id: d.producto_id,

    cantidad_sistema: d.cantidad_sistema,

    cantidad_contada: d.cantidad_contada ?? '',

  }));

}



function lineasToPayload(lineas: LineaLocal[]): InventarioFisicoDetalleCreateEmbebido[] {

  return lineas

    .filter((l) => l.producto_id && l.cantidad_sistema !== '')

    .map((l) => ({

      producto_id: l.producto_id,

      cantidad_sistema: l.cantidad_sistema,

      cantidad_contada: l.cantidad_contada.trim() === '' ? null : l.cantidad_contada,

    }));

}



function toDirtyInput(

  cabecera: Omit<InventarioFisicoFormDirtyInput, 'lineas'>,

  lineas: LineaLocal[],

): InventarioFisicoFormDirtyInput {

  return {

    ...cabecera,

    lineas: lineas.map(({ producto_id, cantidad_sistema, cantidad_contada }) => ({

      producto_id,

      cantidad_sistema,

      cantidad_contada,

    })),

  };

}



export default function InventarioFisicoFormPage() {

  const { inventarioFisicoId } = useParams<{ inventarioFisicoId: string }>();

  const navigate = useNavigate();

  const { hasPermission } = usePermission();

  const isEdit = Boolean(inventarioFisicoId);



  const { scopeEmpresaId, canQueryCompanyScoped } = useInvSessionScope();

  const today = todayIsoDate();

  const [numeroInventario, setNumeroInventario] = useState('');

  const [fechaInventario, setFechaInventario] = useState(today);

  const [almacenId, setAlmacenId] = useState('');

  const [tipoInventario, setTipoInventario] = useState('total');

  const [descripcion, setDescripcion] = useState('');

  const [lineas, setLineas] = useState<LineaLocal[]>(() => [createEmptyInventarioFisicoLinea()]);

  const [createBaseline, setCreateBaseline] = useState<InventarioFisicoFormDirtyInput>(() =>

    buildInventarioFisicoCreateBaseline({ fechaInventario: today }),

  );

  const [editSnapshot, setEditSnapshot] = useState<InventarioFisicoFormSnapshot | null>(null);



  const resetFormToCreateInitial = useCallback(() => {

    const nextToday = todayIsoDate();

    setNumeroInventario('');

    setFechaInventario(nextToday);

    setAlmacenId('');

    setTipoInventario('total');

    setDescripcion('');

    setLineas([createEmptyInventarioFisicoLinea()]);

    setEditSnapshot(null);

    setFormHydrated(false);

    setCreateBaseline(buildInventarioFisicoCreateBaseline({ fechaInventario: nextToday }));

  }, []);



  const almacenesQuery = useAlmacenes({

    solo_activos: true,

  });

  const almacenes = almacenesQuery.data ?? [];



  const productosQuery = useProductos({

    solo_activos: true,

  });

  const productos = productosQuery.data ?? [];



  const conDetalleQuery = useInventarioFisicoConDetalle(inventarioFisicoId ?? null, { enabled: isEdit });

  const createMutation = useCreateInventarioFisicoConDetalle();

  const updateMutation = useUpdateInventarioFisicoConDetalle();



  const [formHydrated, setFormHydrated] = useState(false);

  useEffect(() => {

    setFormHydrated(false);

    setEditSnapshot(null);

  }, [inventarioFisicoId]);



  useEffect(() => {

    if (!isEdit || !conDetalleQuery.data || formHydrated) return;

    const d = conDetalleQuery.data;

    setNumeroInventario(d.numero_inventario);

    setFechaInventario(d.fecha_inventario.slice(0, 10));

    setAlmacenId(d.almacen_id);

    setTipoInventario(d.tipo_inventario);

    setDescripcion(d.descripcion ?? '');

    const mapped = mapReadToLineas(d);

    const nextLineas = mapped.length ? mapped : [createEmptyInventarioFisicoLinea()];

    setLineas(nextLineas);

    setEditSnapshot(

      buildInventarioFisicoFormSnapshot(

        toDirtyInput(

          {

            numeroInventario: d.numero_inventario,

            fechaInventario: d.fecha_inventario.slice(0, 10),

            almacenId: d.almacen_id,

            tipoInventario: d.tipo_inventario,

            descripcion: d.descripcion ?? '',

          },

          nextLineas,

        ),

      ),

    );

    setFormHydrated(true);

  }, [isEdit, conDetalleQuery.data, formHydrated]);



  const dirtyInput = useMemo(

    () =>

      toDirtyInput(

        {

          numeroInventario,

          fechaInventario,

          almacenId,

          tipoInventario,

          descripcion,

        },

        lineas,

      ),

    [numeroInventario, fechaInventario, almacenId, tipoInventario, descripcion, lineas],

  );



  const isDirty = useMemo(

    () =>

      isEdit

        ? isEditInventarioFisicoDirty(dirtyInput, editSnapshot)

        : isCreateInventarioFisicoDirty(dirtyInput, createBaseline),

    [isEdit, dirtyInput, editSnapshot, createBaseline],

  );



  const submitting = createMutation.isPending || updateMutation.isPending;



  const {

    discardPending,

    handleRequestLeave,

    handleDiscardCancel,

    handleDiscardConfirm,

    discardDialogEntityLabel,

  } = useInvTransactionalFormGuard({

    isEdit,

    documentId: inventarioFisicoId,

    listPath: LIST_PATH,

    entityLabel: 'la toma de inventario',

    isDirty,

    isSubmitting: submitting,

    onResetForm: resetFormToCreateInitial,

  });



  const updateLinea = (key: string, patch: Partial<LineaLocal>) => {

    setLineas((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  };

  const addLinea = () => setLineas((prev) => [...prev, createEmptyInventarioFisicoLinea()]);

  const removeLinea = (key: string) =>

    setLineas((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));



  const canSubmit = isEdit
    ? hasPermission(INV_PERMISSIONS.INVENTARIO_FISICO_ACTUALIZAR)
    : hasPermission(INV_PERMISSIONS.INVENTARIO_FISICO_CREAR);

  const requiredPermission = isEdit
    ? INV_PERMISSIONS.INVENTARIO_FISICO_ACTUALIZAR
    : INV_PERMISSIONS.INVENTARIO_FISICO_CREAR;
  const { waiting: rbacWaiting, allowed: rbacAllowed } = useInvRbacFormAccess(
    requiredPermission,
    LIST_PATH,
  );



  const guardar = async () => {

    if (isEdit && conDetalleQuery.data) {

      const estado = conDetalleQuery.data.estado;

      if (estado === 'ajustado' || estado === 'anulado') return;

    }

    if (!scopeEmpresaId || !numeroInventario.trim() || !fechaInventario || !almacenId || !tipoInventario) return;

    const detalles = lineasToPayload(lineas);



    if (isEdit && inventarioFisicoId) {

      const payload: InventarioFisicoConDetalleUpdate = {

        numero_inventario: numeroInventario,

        fecha_inventario: fechaInventario,

        almacen_id: almacenId,

        tipo_inventario: tipoInventario,

        descripcion: descripcion || null,

        detalles: detalles.length ? detalles : null,

      };

      try {

        await updateMutation.mutateAsync({ inventarioFisicoId, payload });

        navigate(LIST_PATH);

      } catch {

        /* toast en hook */

      }

      return;

    }



    const payload: InventarioFisicoConDetalleCreate = assertBodyEmpresaMatchesSession(

      {

        empresa_id: scopeEmpresaId,

        numero_inventario: numeroInventario.trim(),

        fecha_inventario: fechaInventario,

        almacen_id: almacenId,

        tipo_inventario: tipoInventario,

        descripcion: descripcion || null,

        detalles: detalles.length ? detalles : undefined,

      },

      scopeEmpresaId,

    );

    try {

      await createMutation.mutateAsync(payload);

      navigate(LIST_PATH);

    } catch {

      /* toast en hook */

    }

  };



  if (rbacWaiting) {

    return (

      <div className="flex justify-center py-24">

        <Loader className="h-8 w-8 animate-spin text-brand-primary" />

      </div>

    );

  }

  if (!rbacAllowed) return null;



  if (isEdit && conDetalleQuery.isLoading) {

    return (

      <div className="flex justify-center py-24">

        <Loader className="h-8 w-8 animate-spin text-brand-primary" />

      </div>

    );

  }

  if (isEdit && conDetalleQuery.error) {

    return (

      <p className="text-error bg-error/10 p-4 rounded-lg">

        {getErrorMessage(conDetalleQuery.error).message}

      </p>

    );

  }

  const documentoEstado = conDetalleQuery.data?.estado;

  const isDocumentoSoloLectura =

    isEdit &&

    documentoEstado != null &&

    (documentoEstado === 'ajustado' || documentoEstado === 'anulado');

  if (isEdit && conDetalleQuery.data && isDocumentoSoloLectura) {

    const soloLecturaMensaje =

      documentoEstado === 'anulado'

        ? 'Este inventario físico está anulado y no puede editarse.'

        : 'Este inventario físico está ajustado y no puede editarse.';

    return (

      <div className="w-full">

        <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-border-base pb-3">

          <Button

            variant="ghost"

            size="icon"

            className="shrink-0"

            aria-label="Volver"

            onClick={() => navigate(LIST_PATH)}

          >

            <ArrowLeft className="h-4 w-4" />

          </Button>

          <span className="text-sm font-medium text-text-base truncate min-w-0">

            {conDetalleQuery.data.numero_inventario}

          </span>

        </div>

        <p className="text-text-soft bg-subtle border border-border-base p-4 rounded-lg">{soloLecturaMensaje}</p>

      </div>

    );

  }



  const titulo = isEdit ? numeroInventario || 'Inventario físico' : 'Nueva toma de inventario';



  return (

    <div className="w-full">

      <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-border-base pb-3">

        <Button

          variant="ghost"

          size="icon"

          className="shrink-0"

          aria-label="Volver"

          disabled={submitting}

          onClick={() => handleRequestLeave(LIST_PATH)}

        >

          <ArrowLeft className="h-4 w-4" />

        </Button>

        <span className="text-sm font-medium text-text-base truncate min-w-0">{titulo}</span>

        <div className="flex flex-wrap gap-2 ml-auto shrink-0">

          <Button variant="outline" disabled={submitting} onClick={() => handleRequestLeave(LIST_PATH)}>

            Cancelar

          </Button>

          <Button

            className="bg-brand-primary hover:bg-brand-primary-hover text-white"

            disabled={!canSubmit || submitting}

            onClick={() => void guardar()}

          >

            {submitting ? 'Guardando…' : 'Guardar'}

          </Button>

        </div>

      </div>



      <div className="bg-surface border border-border-base rounded-lg shadow-sm p-6 mb-6">

        <div className="text-text-base font-semibold text-sm mb-4">Cabecera</div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          <OrgSessionEmpresaField />

          <div>

            <Label>Número inventario *</Label>

            <input

              value={numeroInventario}

              onChange={(e) => setNumeroInventario(e.target.value)}

              className="mt-1 w-full px-3 py-2 border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm uppercase"

            />

          </div>

          <div>

            <Label>Fecha *</Label>

            <input

              type="date"

              value={fechaInventario}

              onChange={(e) => setFechaInventario(e.target.value)}

              className="mt-1 w-full px-3 py-2 border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"

            />

          </div>

          <div>

            <Label>Almacén *</Label>

            <select

              value={almacenId}

              onChange={(e) => setAlmacenId(e.target.value)}

              disabled={!canQueryCompanyScoped}

              className="mt-1 w-full px-3 py-2 border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"

            >

              <option value="">Seleccionar</option>

              {almacenes.map((a) => (

                <option key={a.almacen_id} value={a.almacen_id}>

                  {a.nombre}

                </option>

              ))}

            </select>

          </div>

          <div>

            <Label>Tipo *</Label>

            <select

              value={tipoInventario}

              onChange={(e) => setTipoInventario(e.target.value)}

              className="mt-1 w-full px-3 py-2 border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"

            >

              <option value="total">Total</option>

              <option value="ciclico">Cíclico</option>

              <option value="selectivo">Selectivo</option>

            </select>

          </div>

          <div className="md:col-span-2">

            <Label>Descripción</Label>

            <textarea

              rows={2}

              value={descripcion}

              onChange={(e) => setDescripcion(e.target.value)}

              className="mt-1 w-full px-3 py-2 border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"

            />

          </div>

        </div>

      </div>



      <div className="bg-surface border border-border-base rounded-lg shadow-sm">

        <div className="flex items-center justify-between px-4 py-3 border-b border-border-base">

          <span className="text-text-base font-semibold text-sm">Líneas</span>

          <Button

            type="button"

            size="sm"

            onClick={addLinea}

            className="bg-brand-primary hover:bg-brand-primary-hover text-white"

          >

            <Plus className="h-4 w-4 mr-1" /> Agregar línea

          </Button>

        </div>

        <div className="overflow-x-auto">

          <table className="min-w-full divide-y divide-border-base text-sm">

            <thead className="bg-subtle border-b border-border-base">

              <tr>

                <th className="text-left text-text-soft text-xs font-medium uppercase tracking-wider px-3 py-2">

                  Producto

                </th>

                <th className="text-right text-text-soft text-xs font-medium uppercase tracking-wider px-3 py-2 w-32">

                  Cant. sistema

                </th>

                <th className="text-right text-text-soft text-xs font-medium uppercase tracking-wider px-3 py-2 w-32">

                  Cant. contada

                </th>

                <th className="px-3 py-2 w-12" />

              </tr>

            </thead>

            <tbody className="bg-surface divide-y divide-border-base">

              {lineas.map((ln) => (

                <tr key={ln.key}>

                  <td className="px-3 py-2">

                    <select

                      value={ln.producto_id}

                      onChange={(e) => updateLinea(ln.key, { producto_id: e.target.value })}

                      disabled={!canQueryCompanyScoped}

                      className="w-full min-w-[200px] px-2 py-1.5 bg-surface border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"

                    >

                      <option value="">Seleccionar</option>

                      {productos.map((p: Producto) => (

                        <option key={p.producto_id} value={p.producto_id}>

                          {p.codigo_sku} — {p.nombre}

                        </option>

                      ))}

                    </select>

                  </td>

                  <td className="px-3 py-2">

                    <input

                      value={ln.cantidad_sistema}

                      onChange={(e) => updateLinea(ln.key, { cantidad_sistema: e.target.value })}

                      className="w-full text-right px-2 py-1.5 bg-surface border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"

                    />

                  </td>

                  <td className="px-3 py-2">

                    <input

                      value={ln.cantidad_contada}

                      onChange={(e) => updateLinea(ln.key, { cantidad_contada: e.target.value })}

                      className="w-full text-right px-2 py-1.5 bg-surface border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"

                    />

                  </td>

                  <td className="px-3 py-2 text-center">

                    <Button

                      type="button"

                      variant="ghost"

                      size="icon"

                      onClick={() => removeLinea(ln.key)}

                      disabled={lineas.length <= 1}

                    >

                      <Trash2 className="h-4 w-4 text-error" />

                    </Button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>



      <OrgDiscardConfirmDialog

        discardPending={discardPending}

        entityLabel={discardDialogEntityLabel}

        onClose={handleDiscardCancel}

        onConfirm={handleDiscardConfirm}

      />

    </div>

  );

}


