import React, { useEffect, useState } from 'react';

import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';

export interface ProvisioningAbortDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  loading?: boolean;
}

const REASON_MAX_LENGTH = 500;

export function ProvisioningAbortDialog({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: ProvisioningAbortDialogProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="¿Abortar provisioning?"
      message="El tenant quedará en estado fallido. Esta acción no elimina el cliente."
      confirmText="Abortar provisioning"
      cancelText="Cancelar"
      variant="danger"
      loading={loading}
      panelClassName="max-w-lg"
    >
      <div className="px-6 pb-2">
        <label htmlFor="abort-reason" className="block text-sm font-medium text-text-soft mb-1">
          Motivo (opcional)
        </label>
        <textarea
          id="abort-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, REASON_MAX_LENGTH))}
          rows={3}
          maxLength={REASON_MAX_LENGTH}
          className="w-full px-3 py-2 border border-border-base rounded-lg bg-surface text-text-base focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          placeholder="Describa el motivo de la cancelación…"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-text-faint text-right">
          {reason.length}/{REASON_MAX_LENGTH}
        </p>
      </div>
    </ConfirmDialog>
  );
}
