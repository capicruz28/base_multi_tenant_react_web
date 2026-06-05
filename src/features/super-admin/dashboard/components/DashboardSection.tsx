import React from 'react';

export interface DashboardSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ title, children, className = '' }) => (
  <section className={`mb-6 ${className}`.trim()}>
    <p className="text-xs font-semibold uppercase tracking-wide text-text-soft mb-3">{title}</p>
    {children}
  </section>
);

export default DashboardSection;
