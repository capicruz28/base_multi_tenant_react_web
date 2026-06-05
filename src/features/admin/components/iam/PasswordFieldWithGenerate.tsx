import { useState } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { generateSecurePassword } from '../../utils/generate-secure-password';
import { iamInputClass, iamInputErrorClass } from './iam-form-classes';
import { cn } from '@/shared/lib/utils';

export interface PasswordFieldWithGenerateProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  onClearError?: () => void;
}

export function PasswordFieldWithGenerate({
  id,
  value,
  onChange,
  error,
  disabled = false,
  onClearError,
}: PasswordFieldWithGenerateProps) {
  const [visible, setVisible] = useState(false);

  const handleGenerate = () => {
    onChange(generateSecurePassword());
    onClearError?.();
  };

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={visible ? 'text' : 'password'}
            id={id}
            name="contrasena"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              onClearError?.();
            }}
            className={cn(iamInputClass, 'pr-10', error && iamInputErrorClass)}
            disabled={disabled}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-soft hover:text-text-base rounded"
            disabled={disabled}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleGenerate}
          disabled={disabled}
          className="shrink-0 gap-1.5 dark:border-border-base dark:hover:bg-overlay"
        >
          <RefreshCw className="h-4 w-4" />
          Generar
        </Button>
      </div>
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
      <p className="mt-1 text-xs text-text-soft">
        Mínimo 8 caracteres. Comparta la contraseña con el usuario por un canal seguro.
      </p>
    </div>
  );
}
