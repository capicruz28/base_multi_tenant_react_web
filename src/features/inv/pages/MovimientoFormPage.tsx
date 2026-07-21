/**

 * Formulario transaccional de movimiento — página completa.

 * Crear: POST /api/v1/inv/movimientos/con-detalle

 * Editar: PUT /api/v1/inv/movimientos/{id}/con-detalle

 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { ArrowLeft, Loader, Plus, Trash2 } from 'lucide-react';

import { catalogosService } from '@/core/services/catalogos.service';
import { useCodigoFieldController } from '@/core/codigo';

import type { CatMoneda } from '@/types/catalogos.types';

import type {

  MovimientoConDetalle,

  MovimientoConDetalleCreate,

  MovimientoConDetalleUpdate,

  MovimientoDetalleCreateEmbebido,

  Producto,

  UnidadMedida,

} from '../types/inv.types';

import { getErrorMessage } from '@/core/services/error.service';

import { Button } from '@/shared/components/ui/button';

import { Label } from '@/shared/components/ui/label';
import { CodigoField, CodigoFieldReadOnly } from '@/shared/components/codigo';

import { usePermission } from '@/core/auth/PermissionContext';
import { INV_PERMISSIONS } from '../constants/inv-permissions';

import { useAlmacenes } from '../hooks/almacenes.hooks';

import { useTiposMovimiento } from '../hooks/tipos-movimiento.hooks';

import { useProductos } from '../hooks/productos.hooks';

import { useUnidadesMedida } from '../hooks/unidades-medida.hooks';

import {

  useCreateMovimientoConDetalle,

  useMovimientoConDetalle,

  useUpdateMovimientoConDetalle,

} from '../hooks/movimientos.hooks';

import { useInvSessionScope } from '../hooks/useInvSessionScope';
import { useInvRbacFormAccess } from '../hooks/useInvRbacFormAccess';

import { useInvTransactionalFormGuard } from '../hooks/useInvTransactionalFormGuard';

import { OrgSessionEmpresaField } from '@/features/org/components/OrgSessionEmpresaField';

import { OrgDiscardConfirmDialog } from '@/features/org/components/OrgDiscardConfirmDialog';

import { assertBodyEmpresaMatchesSession } from '@/features/org/utils/org-body-scope';
import { INV_CODIGO_SEQUENCE_KEYS } from '../codigo';

import {

  buildMovimientoCreateBaseline,

  buildMovimientoFormSnapshot,

  isCreateMovimientoDirty,

  isEditMovimientoDirty,

  type MovimientoFormDirtyInput,

  type MovimientoFormSnapshot,

} from '../utils/form-dirty/movimiento-form-dirty';

import { createEmptyMovimientoLinea, todayIsoDate } from '../utils/inv-transactional-form-init';



const LIST_PATH = '/app/inv/movimientos';



type LineaLocal = {

  key: string;

  producto_id: string;

  unidad_medida_id: string;

  cantidad: string;

  cantidad_base: string;

  costo_unitario: string;

};



function mapReadToLineas(data: MovimientoConDetalle): LineaLocal[] {

  const det = data.detalles ?? [];

  return det.map((d) => ({

    key: d.movimiento_detalle_id,

    producto_id: d.producto_id,

    unidad_medida_id: d.unidad_medida_id,

    cantidad: d.cantidad,

    cantidad_base: d.cantidad_base,

    costo_unitario: d.costo_unitario ?? '',

  }));

}



function lineasToPayload(lineas: LineaLocal[]): MovimientoDetalleCreateEmbebido[] {

  return lineas

    .filter((l) => l.producto_id && l.unidad_medida_id && l.cantidad !== '' && l.cantidad_base !== '')

    .map((l) => ({

      producto_id: l.producto_id,

      unidad_medida_id: l.unidad_medida_id,

      cantidad: l.cantidad,

      cantidad_base: l.cantidad_base,

      costo_unitario: l.costo_unitario.trim() === '' ? null : l.costo_unitario,

    }));

}



function toDirtyInput(

  cabecera: Omit<MovimientoFormDirtyInput, 'lineas'>,

  lineas: LineaLocal[],

): MovimientoFormDirtyInput {

  return {

    ...cabecera,

    lineas: lineas.map(({ producto_id, unidad_medida_id, cantidad, cantidad_base, costo_unitario }) => ({

      producto_id,

      unidad_medida_id,

      cantidad,

      cantidad_base,

      costo_unitario,

    })),

  };

}



export default function MovimientoFormPage() {

  const { movimientoId } = useParams<{ movimientoId: string }>();

  const navigate = useNavigate();

  const { hasPermission } = usePermission();

  const isEdit = Boolean(movimientoId);



  const { scopeEmpresaId, canQueryCompanyScoped } = useInvSessionScope();

  const today = todayIsoDate();

  const [tipoMovimientoId, setTipoMovimientoId] = useState('');

  const [fechaMovimiento, setFechaMovimiento] = useState(today);

  const [fechaContable, setFechaContable] = useState(today);

  const [almacenOrigenId, setAlmacenOrigenId] = useState('');

  const [almacenDestinoId, setAlmacenDestinoId] = useState('');

  const [monedaId, setMonedaId] = useState('');

  const [monedas, setMonedas] = useState<CatMoneda[]>([]);

  const [observaciones, setObservaciones] = useState('');

  const [lineas, setLineas] = useState<LineaLocal[]>(() => [createEmptyMovimientoLinea()]);

  const [createBaseline, setCreateBaseline] = useState<MovimientoFormDirtyInput>(() =>

    buildMovimientoCreateBaseline({ fechaMovimiento: today, fechaContable: today }),

  );

  const [editSnapshot, setEditSnapshot] = useState<MovimientoFormSnapshot | null>(null);



  const resetFormToCreateInitial = useCallback((monedaDefault?: string) => {

    const nextToday = todayIsoDate();

    setTipoMovimientoId('');

    setFechaMovimiento(nextToday);

    setFechaContable(nextToday);

    setAlmacenOrigenId('');

    setAlmacenDestinoId('');

    setMonedaId(monedaDefault ?? '');

    setObservaciones('');

    setLineas([createEmptyMovimientoLinea()]);

    setEditSnapshot(null);

    setFormHydrated(false);

    setCreateBaseline(

      buildMovimientoCreateBaseline({

        fechaMovimiento: nextToday,

        fechaContable: nextToday,

        monedaId: monedaDefault ?? '',

      }),

    );

  }, []);



  useEffect(() => {

    catalogosService

      .listMonedas({ solo_activos: true })

      .then(setMonedas)

      .catch(() => setMonedas([]));

  }, []);



  /** Crear: primera moneda activa del catálogo (mismo criterio que ORG / Cargos). */

  useEffect(() => {

    if (isEdit) return;

    if (!monedas.length) return;

    setMonedaId((id) => {

      const next = id || monedas[0]?.moneda_id || '';

      if (next && !id) {

        setCreateBaseline((prev) =>

          buildMovimientoCreateBaseline({

            fechaMovimiento: prev.fechaMovimiento,

            fechaContable: prev.fechaContable,

            monedaId: next,

          }),

        );

      }

      return next;

    });

  }, [isEdit, monedas]);



  const almacenesQuery = useAlmacenes({

    solo_activos: true,

  });

  const almacenes = almacenesQuery.data ?? [];



  const tiposQuery = useTiposMovimiento({

    solo_activos: true,

  });

  const tipos = tiposQuery.data ?? [];



  const productosQuery = useProductos({

    solo_activos: true,

  });

  const productos = productosQuery.data ?? [];



  const unidadesQuery = useUnidadesMedida({

    solo_activos: true,

  });

  const unidades = unidadesQuery.data ?? [];



  const conDetalleQuery = useMovimientoConDetalle(movimientoId ?? null, { enabled: isEdit });

  const createMutation = useCreateMovimientoConDetalle();

  const updateMutation = useUpdateMovimientoConDetalle();

  const codigo = useCodigoFieldController({
    sequenceKey: INV_CODIGO_SEQUENCE_KEYS.movimiento,
    mode: 'create',
    disabled: createMutation.isPending,
    label: 'Número de movimiento',
  });



  const [formHydrated, setFormHydrated] = useState(false);

  useEffect(() => {

    setFormHydrated(false);

    setEditSnapshot(null);

  }, [movimientoId]);



  useEffect(() => {

    if (!isEdit || !conDetalleQuery.data || formHydrated) return;

    const d = conDetalleQuery.data;

    setTipoMovimientoId(d.tipo_movimiento_id);

    setFechaMovimiento(d.fecha_movimiento.slice(0, 10));

    setFechaContable(d.fecha_contable.slice(0, 10));

    setAlmacenOrigenId(d.almacen_origen_id ?? '');

    setAlmacenDestinoId(d.almacen_destino_id ?? '');

    setMonedaId(d.moneda_id ?? '');

    setObservaciones(d.observaciones ?? '');

    const mapped = mapReadToLineas(d);

    const nextLineas = mapped.length ? mapped : [createEmptyMovimientoLinea()];

    setLineas(nextLineas);

    setEditSnapshot(

      buildMovimientoFormSnapshot(

        toDirtyInput(

          {

            tipoMovimientoId: d.tipo_movimiento_id,

            fechaMovimiento: d.fecha_movimiento.slice(0, 10),

            fechaContable: d.fecha_contable.slice(0, 10),

            almacenOrigenId: d.almacen_origen_id ?? '',

            almacenDestinoId: d.almacen_destino_id ?? '',

            monedaId: d.moneda_id ?? '',

            observaciones: d.observaciones ?? '',

          },

          nextLineas,

        ),

      ),

    );

    setFormHydrated(true);

  }, [isEdit, conDetalleQuery.data, formHydrated]);



  /** Si el backend solo devolvió código ISO (`moneda`) y no `moneda_id`, resolver al cargar el catálogo (una sola vez si el valor sigue vacío). */

  useEffect(() => {

    if (!isEdit || !formHydrated || !conDetalleQuery.data || !monedas.length) return;

    const d = conDetalleQuery.data;

    if (d.moneda_id) return;

    const code = d.moneda?.trim();

    if (!code) return;

    const match = monedas.find((m) => m.codigo === code);

    if (match) {

      setMonedaId((current) => {

        if (current) return current;

        const nextMoneda = match.moneda_id;

        setEditSnapshot((snap) =>

          snap

            ? {

                ...snap,

                monedaId: nextMoneda,

              }

            : snap,

        );

        return nextMoneda;

      });

    }

  }, [isEdit, formHydrated, conDetalleQuery.data, monedas]);



  const dirtyInput = useMemo(

    () =>

      toDirtyInput(

        {

          tipoMovimientoId,

          fechaMovimiento,

          fechaContable,

          almacenOrigenId,

          almacenDestinoId,

          monedaId,

          observaciones,

        },

        lineas,

      ),

    [

      tipoMovimientoId,

      fechaMovimiento,

      fechaContable,

      almacenOrigenId,

      almacenDestinoId,

      monedaId,

      observaciones,

      lineas,

    ],

  );



  const isDirty = useMemo(

    () =>

      isEdit

        ? isEditMovimientoDirty(dirtyInput, editSnapshot)

        : isCreateMovimientoDirty(dirtyInput, createBaseline),

    [isEdit, dirtyInput, editSnapshot, createBaseline],

  );



  const submitting = createMutation.isPending || updateMutation.isPending;



  const onResetForm = useCallback(() => {

    const monedaDefault = monedas[0]?.moneda_id;

    resetFormToCreateInitial(monedaDefault);

  }, [monedas, resetFormToCreateInitial]);



  const {

    discardPending,

    handleRequestLeave,

    handleDiscardCancel,

    handleDiscardConfirm,

    discardDialogEntityLabel,

  } = useInvTransactionalFormGuard({

    isEdit,

    documentId: movimientoId,

    listPath: LIST_PATH,

    entityLabel: 'el movimiento',

    isDirty,

    isSubmitting: submitting,

    onResetForm,

  });



  const productoLabel = useMemo(() => {

    const m: Record<string, Producto> = {};

    productos.forEach((p) => {

      m[p.producto_id] = p;

    });

    return (id: string) => m[id];

  }, [productos]);



  const onProductoChange = (key: string, productoId: string) => {

    const prod = productoLabel(productoId);

    setLineas((prev) =>

      prev.map((l) =>

        l.key === key

          ? {

              ...l,

              producto_id: productoId,

              unidad_medida_id: prod?.unidad_medida_base_id ?? l.unidad_medida_id,

            }

          : l,

      ),

    );

  };



  const updateLinea = (key: string, patch: Partial<LineaLocal>) => {

    setLineas((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  };



  const addLinea = () => setLineas((prev) => [...prev, createEmptyMovimientoLinea()]);

  const removeLinea = (key: string) =>

    setLineas((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));



  const canSubmit = isEdit
    ? hasPermission(INV_PERMISSIONS.MOVIMIENTO_ACTUALIZAR)
    : hasPermission(INV_PERMISSIONS.MOVIMIENTO_CREAR);

  const requiredPermission = isEdit
    ? INV_PERMISSIONS.MOVIMIENTO_ACTUALIZAR
    : INV_PERMISSIONS.MOVIMIENTO_CREAR;
  const { waiting: rbacWaiting, allowed: rbacAllowed } = useInvRbacFormAccess(
    requiredPermission,
    LIST_PATH,
  );



  const guardar = async () => {

    if (!scopeEmpresaId || !tipoMovimientoId || !fechaContable) return;

    const detalles = lineasToPayload(lineas);

    if (!detalles.length) return;



    if (isEdit && movimientoId) {

      const payload: MovimientoConDetalleUpdate = {
        tipo_movimiento_id: tipoMovimientoId,

        fecha_movimiento: fechaMovimiento || null,

        fecha_contable: fechaContable,

        almacen_origen_id: almacenOrigenId || null,

        almacen_destino_id: almacenDestinoId || null,

        moneda_id: monedaId || null,

        observaciones: observaciones || null,

        detalles,

      };

      try {

        await updateMutation.mutateAsync({ movimientoId, payload });

        navigate(LIST_PATH);

      } catch {

        /* toast en hook */

      }

      return;

    }



    const payload: MovimientoConDetalleCreate = assertBodyEmpresaMatchesSession(

      {

        empresa_id: scopeEmpresaId,
        tipo_movimiento_id: tipoMovimientoId,

        fecha_movimiento: fechaMovimiento || null,

        fecha_contable: fechaContable,

        almacen_origen_id: almacenOrigenId || null,

        almacen_destino_id: almacenDestinoId || null,

        moneda_id: monedaId || null,

        observaciones: observaciones || null,

        detalles,

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



  const numeroMovimiento = conDetalleQuery.data?.numero_movimiento;
  const cabeceraTitulo = isEdit ? numeroMovimiento || 'Movimiento' : 'Nuevo movimiento';



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

        <span className="text-sm font-medium text-text-base truncate min-w-0">{cabeceraTitulo}</span>

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

          {isEdit ? (
            <CodigoFieldReadOnly
              label="Número de movimiento"
              value={numeroMovimiento ?? ''}
              inputId="movimiento-numero-readonly"
            />
          ) : (
            <CodigoField
              sequenceKey={INV_CODIGO_SEQUENCE_KEYS.movimiento}
              mode="create"
              controller={codigo}
            />
          )}

          <div>

            <Label>Tipo *</Label>

            <select

              value={tipoMovimientoId}

              onChange={(e) => setTipoMovimientoId(e.target.value)}

              disabled={!canQueryCompanyScoped}

              className="mt-1 w-full px-3 py-2 border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"

            >

              <option value="">Seleccionar</option>

              {tipos.map((t) => (

                <option key={t.tipo_movimiento_id} value={t.tipo_movimiento_id}>

                  {t.nombre}

                </option>

              ))}

            </select>

          </div>

          <div>

            <Label>Moneda</Label>

            <select

              value={monedaId}

              onChange={(e) => setMonedaId(e.target.value)}

              disabled={!monedas.length}

              className="mt-1 w-full px-3 py-2 border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"

            >

              <option value="">{monedas.length ? 'Seleccionar' : 'Cargando monedas…'}</option>

              {monedas.map((m) => (

                <option key={m.moneda_id} value={m.moneda_id}>

                  {m.codigo} — {m.nombre}

                </option>

              ))}

            </select>

          </div>

          <div>

            <Label>Fecha movimiento</Label>

            <input

              type="date"

              value={fechaMovimiento}

              onChange={(e) => setFechaMovimiento(e.target.value)}

              className="mt-1 w-full px-3 py-2 border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"

            />

          </div>

          <div>

            <Label>Fecha contable *</Label>

            <input

              type="date"

              value={fechaContable}

              onChange={(e) => setFechaContable(e.target.value)}

              className="mt-1 w-full px-3 py-2 border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"

            />

          </div>

          <div>

            <Label>Almacén origen</Label>

            <select

              value={almacenOrigenId}

              onChange={(e) => setAlmacenOrigenId(e.target.value)}

              className="mt-1 w-full px-3 py-2 border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"

            >

              <option value="">—</option>

              {almacenes.map((a) => (

                <option key={a.almacen_id} value={a.almacen_id}>

                  {a.nombre}

                </option>

              ))}

            </select>

          </div>

          <div>

            <Label>Almacén destino</Label>

            <select

              value={almacenDestinoId}

              onChange={(e) => setAlmacenDestinoId(e.target.value)}

              className="mt-1 w-full px-3 py-2 border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"

            >

              <option value="">—</option>

              {almacenes.map((a) => (

                <option key={a.almacen_id} value={a.almacen_id}>

                  {a.nombre}

                </option>

              ))}

            </select>

          </div>

          <div className="md:col-span-2 lg:col-span-4">

            <Label>Observaciones</Label>

            <textarea

              rows={2}

              value={observaciones}

              onChange={(e) => setObservaciones(e.target.value)}

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

                <th className="text-left text-text-soft text-xs font-medium uppercase tracking-wider px-3 py-2 w-36">

                  Unidad

                </th>

                <th className="text-right text-text-soft text-xs font-medium uppercase tracking-wider px-3 py-2 w-28">

                  Cantidad

                </th>

                <th className="text-right text-text-soft text-xs font-medium uppercase tracking-wider px-3 py-2 w-28">

                  Cant. base

                </th>

                <th className="text-right text-text-soft text-xs font-medium uppercase tracking-wider px-3 py-2 w-28">

                  Costo u.

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

                      onChange={(e) => onProductoChange(ln.key, e.target.value)}

                      disabled={!canQueryCompanyScoped}

                      className="w-full min-w-[200px] px-2 py-1.5 bg-surface border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"

                    >

                      <option value="">Seleccionar</option>

                      {productos.map((p) => (

                        <option key={p.producto_id} value={p.producto_id}>

                          {p.codigo_sku} — {p.nombre}

                        </option>

                      ))}

                    </select>

                  </td>

                  <td className="px-3 py-2">

                    <select

                      value={ln.unidad_medida_id}

                      onChange={(e) => updateLinea(ln.key, { unidad_medida_id: e.target.value })}

                      disabled={!canQueryCompanyScoped}

                      className="w-full px-2 py-1.5 bg-surface border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"

                    >

                      <option value="">—</option>

                      {unidades.map((u: UnidadMedida) => (

                        <option key={u.unidad_medida_id} value={u.unidad_medida_id}>

                          {u.codigo} — {u.nombre}

                        </option>

                      ))}

                    </select>

                  </td>

                  <td className="px-3 py-2">

                    <input

                      value={ln.cantidad}

                      onChange={(e) => updateLinea(ln.key, { cantidad: e.target.value })}

                      className="w-full text-right px-2 py-1.5 bg-surface border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"

                    />

                  </td>

                  <td className="px-3 py-2">

                    <input

                      value={ln.cantidad_base}

                      onChange={(e) => updateLinea(ln.key, { cantidad_base: e.target.value })}

                      className="w-full text-right px-2 py-1.5 bg-surface border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"

                    />

                  </td>

                  <td className="px-3 py-2">

                    <input

                      value={ln.costo_unitario}

                      onChange={(e) => updateLinea(ln.key, { costo_unitario: e.target.value })}

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


