import React from 'react';

export interface OrgPageLayoutProps {
  children: React.ReactNode;
  /** @deprecated El layout global ya muestra el breadcrumb. No renderizar título aquí. */
  title?: string;
  /** @deprecated No renderizar subtítulo en el body de la página. */
  description?: string;
  /** @deprecated Mover el botón de acción al toolbar inline de cada página. */
  action?: React.ReactNode;
}

export const OrgPageLayout: React.FC<OrgPageLayoutProps> = ({ children }) => (
  <div className="w-full">{children}</div>
);
