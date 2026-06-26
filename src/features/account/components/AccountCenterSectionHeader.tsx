import React from 'react';

export interface AccountCenterSectionHeaderProps {
  title: string;
  subtitle?: string;
}

/** Título L1 de sección hub — cumple TB-01 (no H1 en body). */
export const AccountCenterSectionHeader: React.FC<AccountCenterSectionHeaderProps> = ({
  title,
  subtitle,
}) => (
  <header className="mb-6 shrink-0 space-y-1">
    <h2 className="text-lg font-semibold text-text-base">{title}</h2>
    {subtitle ? <p className="text-sm text-text-soft">{subtitle}</p> : null}
  </header>
);
