import { Info } from 'lucide-react';

/**
 * Explica precedencia backend: override de empresa activa > parámetro global del tenant.
 */
export function OrgHybridPrecedenceHint() {
  return (
    <div
      className="mb-4 flex gap-3 rounded-lg border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-sm text-text-base"
      role="note"
    >
      <Info className="h-5 w-5 text-brand-primary flex-shrink-0 mt-0.5" aria-hidden />
      <div>
        <p className="font-medium text-text-base">Precedencia de valores</p>
        <p className="mt-1 text-text-soft">
          El valor de la empresa activa sobrescribe el global del tenant. En la pestaña{' '}
          <strong className="font-medium text-text-base">Valores efectivos</strong> se muestra el resultado
          que aplica su sesión (override &gt; global).
        </p>
      </div>
    </div>
  );
}
