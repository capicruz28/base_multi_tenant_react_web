import React from 'react';

export interface DashboardPanelProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({
  title,
  action,
  children,
  className = '',
}) => (
  <div
    className={`bg-surface rounded-lg shadow-sm border border-border-base ${className}`.trim()}
  >
    <div className="px-4 py-3 border-b border-border-base flex items-center justify-between gap-2">
      <h3 className="text-base font-medium text-text-base">{title}</h3>
      {action}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

export default DashboardPanel;
