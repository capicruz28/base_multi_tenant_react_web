export interface CodigoFieldReadOnlyProps {
  label: string;
  value: string;
  inputId: string;
}

export function CodigoFieldReadOnly({ label, value, inputId }: CodigoFieldReadOnlyProps) {
  return (
    <div data-testid="codigo-readonly">
      <label htmlFor={inputId} className="text-sm font-medium text-text-base">
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        readOnly
        value={value}
        className="mt-1 w-full cursor-default rounded-md border border-border-base bg-subtle px-3 py-2 text-sm uppercase text-text-base"
      />
    </div>
  );
}
