import React from 'react';

import type { AccountProfileViewModel } from '@/features/account/utils/account-profile-display.utils';
import {
  AccountProfileCard,
  AccountProfileField,
} from '@/features/account/components/profile/AccountProfileCard';

export interface AccountProfileOrganizationCardProps {
  profile: AccountProfileViewModel;
}

function hasOrganizationFields(profile: AccountProfileViewModel): boolean {
  return Boolean(
    profile.clientName ||
      profile.activeCompanyName ||
      profile.companyCode ||
      profile.tenantName,
  );
}

export const AccountProfileOrganizationCard: React.FC<AccountProfileOrganizationCardProps> = ({
  profile,
}) => {
  if (!hasOrganizationFields(profile)) {
    return null;
  }

  return (
  <AccountProfileCard title="Organización">
    <dl className="space-y-3">
      <AccountProfileField label="Cliente" value={profile.clientName} />
      <AccountProfileField label="Empresa activa" value={profile.activeCompanyName} />
      <AccountProfileField label="Código empresa" value={profile.companyCode} />
      <AccountProfileField label="Tenant" value={profile.tenantName} />
    </dl>
  </AccountProfileCard>
  );
};
