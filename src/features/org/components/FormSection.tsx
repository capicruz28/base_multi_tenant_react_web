/**
 * Sección de formulario reutilizable para el módulo ORG.
 * Evita redefinir el componente dentro de la página (pérdida de foco en inputs).
 */
import React from 'react';

export const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-1.5">
      {title}
    </h3>
    {children}
  </div>
);
