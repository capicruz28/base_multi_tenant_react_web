import React from 'react';
import AuthAuditLogPanel from '@/features/super-admin/auditoria/components/AuthAuditLogPanel';

interface ClientAuditTabProps {
  clienteId: string;
}

const ClientAuditTab: React.FC<ClientAuditTabProps> = ({ clienteId }) => (
  <AuthAuditLogPanel clienteId={clienteId} />
);

export default ClientAuditTab;
