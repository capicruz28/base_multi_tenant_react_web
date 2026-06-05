import { Search } from 'lucide-react';
import { iamSearchInputClass } from './iam-form-classes';

export interface IamSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * Campo de búsqueda con icono para listas y tablas IAM.
 */
export function IamSearchInput({
  value,
  onChange,
  placeholder = 'Buscar…',
  disabled = false,
  id,
  className = '',
  'aria-label': ariaLabel = 'Buscar',
}: IamSearchInputProps) {
  return (
    <div className={`relative w-full ${className}`.trim()}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-soft pointer-events-none"
        aria-hidden
      />
      <input
        type="search"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        className={iamSearchInputClass}
      />
    </div>
  );
}
