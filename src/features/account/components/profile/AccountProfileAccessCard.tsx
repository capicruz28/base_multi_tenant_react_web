import React from 'react';

import type { AccountProfileViewModel } from '@/features/account/utils/account-profile-display.utils';
import { formatAccountAccessLevel } from '@/features/account/utils/account-profile-display.utils';
import {
  AccountProfileCard,
  AccountProfileField,
} from '@/features/account/components/profile/AccountProfileCard';

export interface AccountProfileAccessCardProps {
  profile: AccountProfileViewModel;
}

export const AccountProfileAccessCard: React.FC<AccountProfileAccessCardProps> = ({ profile }) => (
  <AccountProfileCard title="Acceso">
    <dl className="space-y-3">
      <AccountProfileField label="Rol principal" value={profile.primaryRole} />
      {profile.roles.length > 0 ? (
        <AccountProfileField
          label="Roles"
          value={
            <ul className="flex flex-wrap gap-2">
              {profile.roles.map((role) => (
                <li
                  key={role}
                  className="rounded-md border border-border-base bg-subtle px-2 py-0.5 text-xs text-text-base"
                >
                  {role}
                </li>
              ))}
            </ul>
          }
        />
      ) : null}
      <AccountProfileField
        label="Nivel de acceso"
        value={profile.accessLevel !== null ? formatAccountAccessLevel(profile.accessLevel) : null}
      />
      <AccountProfileField label="Tipo autenticación" value={profile.authTypeLabel} />
    </dl>
  </AccountProfileCard>
);
