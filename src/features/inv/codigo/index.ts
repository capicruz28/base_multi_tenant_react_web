export {
  INV_CODIGO_MANIFEST,
  INV_CODIGO_SEQUENCE_KEYS,
  type InvCodigoSequenceKey,
} from './inv.codigo.manifest';

export {
  mutateInvCreateWithCodigo,
  mutateInvCreateAutoRequired,
} from './inv-codigo-create.utils';

export {
  INV_MOTOR_FIELD_KEYS,
  normalizeInvAutoDefaultCreateField,
  stripInvAutoRequiredField,
  stripInvMotorFieldFromUpdate,
  toInvUpdatePayloadWithoutMotor,
  type InvMotorFieldKey,
} from './inv-codigo-serialize.utils';

export {
  buildCategoriaCreateBasePayload,
  buildCategoriaUpdatePayload,
} from './categoria-codigo.payload';

export {
  buildUnidadMedidaCreateBasePayload,
  buildUnidadMedidaUpdatePayload,
} from './unidad-medida-codigo.payload';

export {
  buildTipoMovimientoCreateBasePayload,
  buildTipoMovimientoUpdatePayload,
} from './tipo-movimiento-codigo.payload';

export {
  buildAlmacenCreateBasePayload,
  buildAlmacenUpdatePayload,
} from './almacen-codigo.payload';

export {
  buildProductoCreateBasePayload,
  buildProductoUpdatePayload,
} from './producto-codigo.payload';

export {
  serializeMovimientoCreatePayload,
  serializeMovimientoUpdatePayload,
  serializeInventarioFisicoCreatePayload,
  serializeInventarioFisicoUpdatePayload,
} from './documento-codigo.payload';
