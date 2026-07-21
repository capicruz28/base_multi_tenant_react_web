import { KeyRound, ShieldAlert } from 'lucide-react';

import type { CredencialesInicialesRead } from '../../types/cliente.types';

export interface ProvisioningCredentialsPanelProps {
  credenciales: CredencialesInicialesRead;
  clienteLabel?: string;
  /** Dedicated en provisioning: login bloqueado hasta Ready. */
  loginBlocked?: boolean;
}

export function ProvisioningCredentialsPanel({
  credenciales,
  clienteLabel,
  loginBlocked = true,
}: ProvisioningCredentialsPanelProps) {
  return (
    <section className="bg-surface border border-border-base rounded-lg shadow-sm p-5">
      <div className="flex items-start gap-3 mb-4">
        <KeyRound className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" aria-hidden />
        <div>
          <h2 className="text-base font-semibold text-text-base">Credenciales del administrador</h2>
          {clienteLabel ? (
            <p className="text-sm text-text-soft mt-0.5">{clienteLabel}</p>
          ) : null}
        </div>
      </div>

      {loginBlocked ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 flex gap-2 mb-4">
          <ShieldAlert className="h-4 w-4 text-warning shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm text-text-base">
            Guarde las credenciales ahora. El acceso al tenant permanece bloqueado hasta que el
            provisioning finalice en estado operativo.
          </p>
        </div>
      ) : (
        <p className="text-sm text-text-soft mb-4">
          Las credenciales se entregaron al crear el tenant. La contraseña no puede recuperarse desde
          el sistema.
        </p>
      )}

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-text-soft">Usuario</dt>
          <dd className="mt-1 font-mono text-text-base">{credenciales.nombre_usuario}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-text-soft">
            Contraseña temporal
          </dt>
          <dd className="mt-1 font-mono text-text-base break-all">{credenciales.contrasena}</dd>
        </div>
      </dl>
    </section>
  );
}
