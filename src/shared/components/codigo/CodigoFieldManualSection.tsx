const INPUT_CLASS =
  'mt-1 w-full rounded-md border border-border-base px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base';

export interface CodigoFieldManualSectionProps {
  label: string;
  inputId: string;
  value: string;
  error: string | null;
  disabled: boolean;
  required: boolean;
  maxLength: number;
  revertToAutoLabel?: string;
  onChange: (value: string) => void;
  onRevertToAuto?: () => void;
}

export function CodigoFieldManualSection({
  label,
  inputId,
  value,
  error,
  disabled,
  required,
  maxLength,
  revertToAutoLabel,
  onChange,
  onRevertToAuto,
}: CodigoFieldManualSectionProps) {
  return (
    <div data-testid="codigo-manual-section">
      <label htmlFor={inputId} className="text-sm font-medium text-text-base">
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </label>
      <input
        id={inputId}
        type="text"
        value={value}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        className={`${INPUT_CLASS}${error ? ' border-error' : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
      {onRevertToAuto && revertToAutoLabel ? (
        <button
          type="button"
          className="mt-2 text-sm text-brand-primary hover:underline disabled:opacity-50"
          onClick={onRevertToAuto}
          disabled={disabled}
        >
          {revertToAutoLabel}
        </button>
      ) : null}
    </div>
  );
}

export function CodigoFieldEditableInput({
  label,
  inputId,
  value,
  error,
  disabled,
  required,
  maxLength,
  onChange,
}: Omit<CodigoFieldManualSectionProps, 'revertToAutoLabel' | 'onRevertToAuto'>) {
  return (
    <CodigoFieldManualSection
      label={label}
      inputId={inputId}
      value={value}
      error={error}
      disabled={disabled}
      required={required}
      maxLength={maxLength}
      onChange={onChange}
    />
  );
}
