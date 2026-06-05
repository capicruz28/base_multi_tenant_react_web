/**
 * Sección de formulario reutilizable para el módulo ORG.
 * Evita redefinir el componente dentro de la página (pérdida de foco en inputs).
 */
import React from 'react';

export const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h3 className="text-sm font-semibold text-text-soft border-b border-border-base pb-1.5">
      {title}
    </h3>
    {children}
  </div>
);
