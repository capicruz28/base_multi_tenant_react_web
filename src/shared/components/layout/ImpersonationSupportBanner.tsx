import { LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';

interface ImpersonationSupportBannerProps {
  onExit: () => void;
  exiting?: boolean;
}

export default function ImpersonationSupportBanner({
  onExit,
  exiting = false,
}: ImpersonationSupportBannerProps) {
  const { impersonationClienteLabel, impersonatedByUsername } = useAuth();

  const cliente =
    impersonationClienteLabel?.trim() || 'Cliente';
  const operador = impersonatedByUsername?.trim() || '—';

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm text-text-base"
    >
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <div className="min-w-0">
          <p className="font-semibold text-amber-900 dark:text-amber-100">Modo soporte activo</p>
          <p className="text-text-soft">
            Cliente: <span className="font-medium text-text-base">{cliente}</span>
            {' · '}
            Operador: <span className="font-medium text-text-base">{operador}</span>
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onExit}
        disabled={exiting}
        className="inline-flex shrink-0 items-center gap-2 rounded-md border border-amber-600/50 bg-surface px-3 py-1.5 text-sm font-medium text-amber-900 shadow-sm transition-colors hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-100"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        {exiting ? 'Saliendo…' : 'Salir del modo soporte'}
      </button>
    </div>
  );
}
