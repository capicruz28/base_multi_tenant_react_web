/**
 * Layout estándar para páginas del módulo AUD (Auditoría y Trazabilidad).
 */
import React from 'react';

interface AudPageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const AudPageLayout: React.FC<AudPageLayoutProps> = ({
  title,
  description,
  children,
  action,
}) => (
  <div className="w-full">
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-brand-text-primary tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-brand-text-secondary">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
    {children}
  </div>
);
