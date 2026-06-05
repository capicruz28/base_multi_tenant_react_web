import { Label } from '@/shared/components/ui/label';
import { useOrgSessionScope } from '../hooks/useOrgSessionScope';

const inputClass =
  'mt-1 w-full px-3 py-2 border border-border-base rounded-md bg-subtle text-text-base text-sm cursor-default';

interface OrgSessionEmpresaFieldProps {
  label?: string;
  required?: boolean;
  className?: string;
}

/**
 * Campo empresa de solo lectura — valor fijado por sesión JWT (no editable).
 */
export function OrgSessionEmpresaField({
  label = 'Empresa',
  required = true,
  className,
}: OrgSessionEmpresaFieldProps) {
  const { scopeEmpresaId, activeEmpresaLabel } = useOrgSessionScope();

  return (
    <div className={className}>
      <Label>
        {label}
        {required ? ' *' : ''}
      </Label>
      <input
        type="text"
        readOnly
        value={activeEmpresaLabel ?? '—'}
        className={inputClass}
        aria-readonly
      />
      {scopeEmpresaId ? (
        <input type="hidden" name="empresa_id_session" value={scopeEmpresaId} />
      ) : null}
      <p className="mt-1 text-xs text-text-soft">
        Definida por la empresa activa de su sesión. Para operar en otra empresa, cámbiela en el encabezado.
      </p>
    </div>
  );
}
