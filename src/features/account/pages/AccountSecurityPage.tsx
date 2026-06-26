import React from 'react';

import { AccountChangePasswordForm } from '@/features/account/components/security/AccountChangePasswordForm';
import { AccountSecuritySessionGlobalCard } from '@/features/account/components/security/AccountSecuritySessionGlobalCard';

const AccountSecurityPage: React.FC = () => (
  <div className="space-y-6" data-testid="account-security-page">
    <AccountChangePasswordForm />
    <AccountSecuritySessionGlobalCard />
  </div>
);

export default AccountSecurityPage;
