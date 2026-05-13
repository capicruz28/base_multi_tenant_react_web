/**
 * Vista de detalle de un Libro Electrónico.
 * GET /api/v1/tax/libros-electronicos/{libro_id}
 */
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Loader } from 'lucide-react';
import { useLibroElectronico } from '../hooks/useLibrosElectronicos';
import { TaxPageLayout } from '../components/TaxPageLayout';
import { Button } from '@/shared/components/ui/button';

// ─── Badge de estado ──────────────────────────────────────────────────────────

const ESTADO_BADGE: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  generado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  enviado: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  anulado: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

function EstadoBadge({ estado }: { estado: string | null }) {
  const cls = estado
    ? (ESTADO_BADGE[estado] ?? 'bg-gray-100 text-gray-600')
    : 'bg-gray-100 text-gray-400';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-sm font-medium ${cls}`}>
      {estado ?? '—'}
    </span>
  );
}

// ─── Fila de campo ────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <dt className="sm:w-52 text-sm font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
        {label}
      </dt>
      <dd className="text-sm text-gray-900 dark:text-white break-all">
        {value ?? <span className="text-gray-400 dark:text-gray-500">—</span>}
      </dd>
    </div>
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function LibroElectronicoDetailPage() {
  const { libro_id } = useParams<{ libro_id: string }>();
  const navigate = useNavigate();

  const { data: libro, isLoading, isError, error } = useLibroElectronico(libro_id);

  const formatDateTime = (dt: string | null) =>
    dt ? new Date(dt).toLocaleString() : null;

  return (
    <TaxPageLayout
      title="Detalle — Libro Electrónico"
      description="Información completa del libro electrónico seleccionado."
      action={
        <Button
          variant="outline"
          onClick={() => navigate('/tax/ple')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la lista
        </Button>
      }
    >
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-600 dark:text-red-400 text-sm">
            {(error as Error)?.message ?? 'No se pudo cargar el libro electrónico.'}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/tax/ple')}>
            Volver a la lista
          </Button>
        </div>
      )}

      {!isLoading && !isError && !libro && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
          <FileText className="h-12 w-12 mb-3 opacity-40" />
          <p>Libro electrónico no encontrado.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/tax/ple')}>
            Volver a la lista
          </Button>
        </div>
      )}

      {!isLoading && !isError && libro && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <dl>
            <DetailRow label="ID Libro" value={libro.libro_id} />
            <DetailRow label="Empresa ID" value={libro.empresa_id} />
            <DetailRow label="Cliente ID" value={libro.cliente_id} />
            <DetailRow label="Tipo de libro" value={libro.tipo_libro} />
            <DetailRow label="Periodo ID" value={libro.periodo_id} />
            <DetailRow
              label="Año / Mes"
              value={`${libro.anio} / ${String(libro.mes).padStart(2, '0')}`}
            />
            <DetailRow
              label="Estado"
              value={<EstadoBadge estado={libro.estado} />}
            />
            <DetailRow
              label="Fecha de generación"
              value={formatDateTime(libro.fecha_generacion)}
            />
            <DetailRow label="Nombre archivo" value={libro.nombre_archivo} />
            <DetailRow label="Ruta archivo" value={libro.ruta_archivo} />
            <DetailRow
              label="Fecha envío SUNAT"
              value={formatDateTime(libro.fecha_envio_sunat)}
            />
            <DetailRow
              label="Código respuesta SUNAT"
              value={libro.codigo_respuesta_sunat}
            />
            <DetailRow
              label="Total registros"
              value={
                libro.total_registros !== null ? String(libro.total_registros) : null
              }
            />
            <DetailRow label="Observaciones" value={libro.observaciones} />
            <DetailRow
              label="Fecha de creación"
              value={formatDateTime(libro.fecha_creacion)}
            />
            <DetailRow
              label="Generado por usuario ID"
              value={libro.generado_por_usuario_id}
            />
          </dl>
        </div>
      )}
    </TaxPageLayout>
  );
}
