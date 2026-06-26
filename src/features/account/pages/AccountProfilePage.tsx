import React, { useMemo } from 'react';

import { useAuth } from '@/shared/context/AuthContext';
import { AccountProfileAccountCard } from '@/features/account/components/profile/AccountProfileAccountCard';
import { AccountProfileAccessCard } from '@/features/account/components/profile/AccountProfileAccessCard';
import { AccountProfileInfoNotice } from '@/features/account/components/profile/AccountProfileInfoNotice';
import { AccountProfileOrganizationCard } from '@/features/account/components/profile/AccountProfileOrganizationCard';
import { AccountProfilePageSkeleton } from '@/features/account/components/profile/AccountProfilePageSkeleton';
import { buildAccountProfileViewModel } from '@/features/account/utils/account-profile-display.utils';

const AccountProfilePage: React.FC = () => {
  const {
    auth,
    loading,
    clienteInfo,
    accessLevel,
    empresaActivaId,
    empresasElegibles,
  } = useAuth();

  const profile = useMemo(
    () =>
      buildAccountProfileViewModel({
        user: auth.user,
        clienteInfo,
        accessLevel,
        empresaActivaId,
        empresasElegibles,
      }),
    [auth.user, clienteInfo, accessLevel, empresaActivaId, empresasElegibles],
  );

  if (loading && !auth.user) {
    return <AccountProfilePageSkeleton />;
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="account-profile-page">
      <AccountProfileAccountCard profile={profile} />
      <AccountProfileOrganizationCard profile={profile} />
      <AccountProfileAccessCard profile={profile} />
      <AccountProfileInfoNotice />
    </div>
  );
};

export default AccountProfilePage;
