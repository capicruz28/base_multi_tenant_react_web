import React from 'react';

import { cn } from '@/shared/lib/utils';

export interface AccountPreferenceRadioOptionProps {
  name: string;
  value: string;
  checked: boolean;
  label: string;
  onChange: (value: string) => void;
}

export const AccountPreferenceRadioOption: React.FC<AccountPreferenceRadioOptionProps> = ({
  name,
  value,
  checked,
  label,
  onChange,
}) => (
  <label
    className={cn(
      'flex cursor-pointer items-center gap-3 rounded-md border border-border-base px-3 py-2 transition-colors',
      checked ? 'bg-overlay' : 'hover:bg-overlay',
    )}
  >
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={() => onChange(value)}
      className="h-4 w-4 focus:ring-brand-primary"
    />
    <span className="text-sm text-text-base">{label}</span>
  </label>
);

export interface AccountPreferenceRadioGroupProps {
  name: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
  'aria-label': string;
}

export const AccountPreferenceRadioGroup: React.FC<AccountPreferenceRadioGroupProps> = ({
  name,
  value,
  options,
  onChange,
  'aria-label': ariaLabel,
}) => (
  <fieldset>
    <legend className="sr-only">{ariaLabel}</legend>
    <div className="space-y-2">
      {options.map((option) => (
        <AccountPreferenceRadioOption
          key={option.value}
          name={name}
          value={option.value}
          checked={value === option.value}
          label={option.label}
          onChange={onChange}
        />
      ))}
    </div>
  </fieldset>
);
