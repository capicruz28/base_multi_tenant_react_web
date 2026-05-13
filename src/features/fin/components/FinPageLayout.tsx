/**
 * Layout estándar para páginas del módulo FIN.
 * Título, descripción opcional y contenido con estilo consistente.
 */
import React from 'react';

interface FinPageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const FinPageLayout: React.FC<FinPageLayoutProps> = ({
  title,
  description,
  children,
  action,
}) => (
  <div className="w-full">
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
    {children}
  </div>
);
