import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  formatCatalogSyncDurationMs,
  getCatalogSyncEstadoBadgeClass,
  getCatalogTitleByApiSegment,
  isCatalogSyncFailedEstado,
  resolveCatalogSyncTenantLabel,
} from '../utils/catalog-sync-display.utils';
import type { CatalogSyncBulkResponse } from '../types/platform-catalog-sync.types';

export interface CatalogSyncResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  result: CatalogSyncBulkResponse | null;
}

function MetricItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border-base bg-subtle px-3 py-2">
      <p className="text-xs text-text-soft">{label}</p>
      <p className="text-lg font-semibold text-text-base">{value}</p>
    </div>
  );
}

/**
 * F14 — Resultado de sincronización masiva (datos directos del backend).
 */
export function CatalogSyncResultDialog({
  isOpen,
  onClose,
  result,
}: CatalogSyncResultDialogProps) {
  if (!result) {
    return null;
  }

  const catalogTitle = getCatalogTitleByApiSegment(result.catalogo);
  const estadoClass = getCatalogSyncEstadoBadgeClass(result.estado);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle>Resultado de sincronización — {catalogTitle}</DialogTitle>
        </DialogHeader>

        <DialogBody className="px-6 py-4 space-y-5 overflow-y-auto">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${estadoClass}`}>
              {result.estado}
            </span>
            <span className="text-sm text-text-soft">
              Duración: {formatCatalogSyncDurationMs(result.duracion_ms)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricItem label="Insertados" value={result.insertados} />
            <MetricItem label="Actualizados" value={result.actualizados} />
            <MetricItem label="Desactivados" value={result.desactivados} />
            <MetricItem label="Omitidos" value={result.omitidos} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricItem label="Tenants procesados" value={result.tenants_procesados} />
            <MetricItem label="Completados" value={result.completados} />
            <MetricItem label="Fallidos" value={result.fallidos} />
          </div>

          <div>
            <h3 className="text-sm font-medium text-text-base mb-2">Resultados por tenant</h3>
            <div className="overflow-x-auto rounded-lg border border-border-base">
              <table className="min-w-full divide-y divide-border-base text-sm">
                <thead className="bg-subtle">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-text-soft">Tenant</th>
                    <th className="px-4 py-2 text-left font-medium text-text-soft">Estado</th>
                    <th className="px-4 py-2 text-right font-medium text-text-soft">Duración</th>
                    <th className="px-4 py-2 text-right font-medium text-text-soft">Ins.</th>
                    <th className="px-4 py-2 text-right font-medium text-text-soft">Act.</th>
                    <th className="px-4 py-2 text-right font-medium text-text-soft">Des.</th>
                    <th className="px-4 py-2 text-right font-medium text-text-soft">Omi.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-base bg-surface">
                  {result.resultados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-text-soft">
                        No hay resultados detallados por tenant.
                      </td>
                    </tr>
                  ) : (
                    result.resultados.map((row) => {
                      const failed = isCatalogSyncFailedEstado(row.estado);
                      const rowEstadoClass = getCatalogSyncEstadoBadgeClass(row.estado);
                      const rowKey = `${row.cliente_id}-${row.estado}-${row.duracion_ms}`;

                      return (
                        <tr key={rowKey}>
                          <td className="px-4 py-2 text-text-base">
                            <div className="flex items-center gap-2 min-w-0">
                              {failed ? (
                                <XCircle className="h-4 w-4 text-error shrink-0" aria-hidden />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-success shrink-0" aria-hidden />
                              )}
                              <span className="truncate">{resolveCatalogSyncTenantLabel(row)}</span>
                            </div>
                            {failed && row.mensaje_error ? (
                              <p className="mt-1 text-xs text-error truncate">{row.mensaje_error}</p>
                            ) : null}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${rowEstadoClass}`}>
                              {row.estado}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right text-text-soft whitespace-nowrap">
                            {formatCatalogSyncDurationMs(row.duracion_ms)}
                          </td>
                          <td className="px-4 py-2 text-right text-text-base">{row.insertados}</td>
                          <td className="px-4 py-2 text-right text-text-base">{row.actualizados}</td>
                          <td className="px-4 py-2 text-right text-text-base">{row.desactivados}</td>
                          <td className="px-4 py-2 text-right text-text-base">{row.omitidos}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="px-6 pb-6 pt-2 flex-shrink-0">
          <Button type="button" onClick={onClose} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
