import React from 'react';

import type { AccountProfileViewModel } from '@/features/account/utils/account-profile-display.utils';
import {
  AccountProfileCard,
  AccountProfileField,
} from '@/features/account/components/profile/AccountProfileCard';

export interface AccountProfileAccountCardProps {
  profile: AccountProfileViewModel;
}

export const AccountProfileAccountCard: React.FC<AccountProfileAccountCardProps> = ({ profile }) => (
  <AccountProfileCard title="Cuenta">
    <dl className="space-y-3">
      <AccountProfileField label="Nombre completo" value={profile.fullName} />
      <AccountProfileField label="Usuario" value={profile.username} />
      <AccountProfileField label="Correo" value={profile.email} />
      {profile.accountStatus ? (
        <AccountProfileField
          label="Estado"
          value={
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                profile.accountStatus.active
                  ? 'bg-success/10 text-success'
                  : 'bg-error/10 text-error'
              }`}
            >
              {profile.accountStatus.label}
            </span>
          }
        />
      ) : null}
    </dl>
  </AccountProfileCard>
);
