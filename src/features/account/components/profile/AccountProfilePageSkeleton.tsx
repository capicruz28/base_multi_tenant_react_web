import React from 'react';

export const AccountProfilePageSkeleton: React.FC = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Cargando información personal">
    {[1, 2, 3, 4].map((key) => (
      <div
        key={key}
        className="h-36 animate-pulse rounded-lg border border-border-base bg-subtle"
      />
    ))}
  </div>
);
