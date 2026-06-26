export interface SessionClientTypeChipProps {
  clientType: string;
}

/** Chip Web/Mobile — Fase 4 shared. */
export function SessionClientTypeChip({ clientType }: SessionClientTypeChipProps) {
  const label =
    clientType.toLowerCase() === 'mobile'
      ? 'Mobile'
      : clientType.toLowerCase() === 'web'
        ? 'Web'
        : clientType;

  return (
    <span className="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-xs font-medium capitalize bg-subtle text-text-soft">
      {label}
    </span>
  );
}
