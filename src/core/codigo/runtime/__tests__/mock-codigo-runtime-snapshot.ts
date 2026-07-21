/**
 * Mock estable de Runtime Snapshot para tests de CodigoField / Engine form.
 * Usa scope TENANT para no depender de empresaActivaId.
 */
export function mockCodigoRuntimeSnapshotSuccess(
  items: Array<{
    sequence_key: string;
    generation_policy: 'AUTO_DEFAULT' | 'AUTO_REQUIRED' | 'MANUAL_ONLY';
  }>,
) {
  return {
    data: {
      schema_version: '1.0',
      generated_at: '2026-07-20T00:00:00.000000',
      content_revision: 'test',
      items: items.map((row) => ({
        sequence_key: row.sequence_key,
        modulo_codigo: 'TEST',
        scope_type: 'TENANT' as const,
        empresa_id: null,
        almacen_id: null,
        punto_venta_id: null,
        generation_policy: row.generation_policy,
        es_activo: true,
        prefijo: 'X',
        separador: '',
        longitud_numero: 3,
        supports_preview: true,
        allow_manual: true,
        normalize_case: 'UPPER' as const,
        max_output_length: 20,
      })),
    },
    isLoading: false,
    isPending: false,
    isError: false,
    isSuccess: true,
    error: null,
  };
}
