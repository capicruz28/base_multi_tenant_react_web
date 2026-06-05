import type { TipoMovimientoCreate, TipoMovimientoUpdate } from '../../types/inv.types';
import { bool, str } from './inv-form-dirty.helpers';

export interface EditTipoMovimientoFormSnapshot {
  codigo: string;
  nombre: string;
  clase_movimiento: string;
  afecta_costo: boolean;
  requiere_autorizacion: boolean;
  genera_asiento_contable: boolean;
  cuenta_contable_debito: string;
  cuenta_contable_credito: string;
  requiere_documento_referencia: boolean;
  tipo_documento_referencia: string;
}

function normalizeDialogFields(form: TipoMovimientoCreate | TipoMovimientoUpdate) {
  return {
    codigo: str(form.codigo),
    nombre: str(form.nombre),
    clase_movimiento: str(form.clase_movimiento) || 'entrada',
    afecta_costo: bool(form.afecta_costo, true),
    requiere_autorizacion: bool(form.requiere_autorizacion, false),
    genera_asiento_contable: bool(form.genera_asiento_contable, false),
    cuenta_contable_debito: str(form.cuenta_contable_debito),
    cuenta_contable_credito: str(form.cuenta_contable_credito),
    requiere_documento_referencia: bool(form.requiere_documento_referencia, false),
    tipo_documento_referencia: str(form.tipo_documento_referencia),
  };
}

const CREATE_BASELINE = normalizeDialogFields({
  empresa_id: '',
  codigo: '',
  nombre: '',
  clase_movimiento: 'entrada',
  afecta_costo: true,
  requiere_autorizacion: false,
  genera_asiento_contable: false,
  es_activo: true,
});

export function isCreateTipoMovimientoDirty(form: TipoMovimientoCreate): boolean {
  return JSON.stringify(normalizeDialogFields(form)) !== JSON.stringify(CREATE_BASELINE);
}

export function buildEditTipoMovimientoFormSnapshot(
  form: TipoMovimientoUpdate,
): EditTipoMovimientoFormSnapshot {
  return normalizeDialogFields(form);
}

export function isEditTipoMovimientoDirty(
  form: TipoMovimientoUpdate,
  snapshot: EditTipoMovimientoFormSnapshot | null,
): boolean {
  if (!snapshot) return false;
  return JSON.stringify(buildEditTipoMovimientoFormSnapshot(form)) !== JSON.stringify(snapshot);
}
