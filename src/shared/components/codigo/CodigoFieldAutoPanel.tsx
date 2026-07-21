import type { CodigoAutoPanelCopy } from '@/core/codigo/engine/codigo-engine.types';

export interface CodigoFieldAutoPanelProps {
  copy: CodigoAutoPanelCopy;
}

export function CodigoFieldAutoPanel({ copy }: CodigoFieldAutoPanelProps) {
  return (
    <div
      className="rounded-lg border border-border-base bg-subtle px-4 py-3"
      data-testid="codigo-auto-panel"
    >
      <p className="text-sm font-medium text-text-base">{copy.title}</p>
      <p className="mt-1 text-sm text-text-soft">{copy.description}</p>
      {copy.formatExample ? (
        <div className="mt-3 rounded-md border border-border-base bg-surface px-3 py-2">
          <p className="text-xs text-text-soft">Ejemplo de formato</p>
          <p
            className="mt-0.5 font-mono text-sm text-text-base tracking-wide"
            data-testid="codigo-format-example"
          >
            {copy.formatExample}
          </p>
        </div>
      ) : copy.hint ? (
        <p className="mt-2 text-xs text-text-faint">{copy.hint}</p>
      ) : null}
    </div>
  );
}
