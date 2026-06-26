import React from 'react';

export interface AccountProfileCardProps {
  title: string;
  children: React.ReactNode;
}

export const AccountProfileCard: React.FC<AccountProfileCardProps> = ({ title, children }) => (
  <section className="rounded-lg border border-border-base bg-surface p-4 shadow-sm sm:p-6">
    <h3 className="mb-4 text-sm font-medium text-text-base">{title}</h3>
    <div className="space-y-3">{children}</div>
  </section>
);

export interface AccountProfileFieldProps {
  label: string;
  value: React.ReactNode;
}

/** Fila label/valor — no renderiza si value es null, undefined o string vacío. */
export const AccountProfileField: React.FC<AccountProfileFieldProps> = ({ label, value }) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim().length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-4">
      <dt className="text-sm font-medium text-text-soft">{label}</dt>
      <dd className="min-w-0 text-sm text-text-base break-words">{value}</dd>
    </div>
  );
};
