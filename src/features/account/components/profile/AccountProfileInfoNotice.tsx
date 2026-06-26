import React from 'react';

import { AccountProfileCard } from '@/features/account/components/profile/AccountProfileCard';

export const AccountProfileInfoNotice: React.FC = () => (
  <AccountProfileCard title="Información">
    <p className="text-sm text-text-soft">
      Los datos personales son administrados por el Administrador del sistema.
    </p>
    <p className="text-sm text-text-soft">
      Para modificar esta información comuníquese con su administrador.
    </p>
  </AccountProfileCard>
);
