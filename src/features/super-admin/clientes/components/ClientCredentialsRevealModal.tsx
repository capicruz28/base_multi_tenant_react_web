import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader,
  ShieldAlert,
  X,
} from 'lucide-react';
import type { Cliente, ClienteCreateResult } from '../types/cliente.types';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { copyTextToClipboard } from '@/shared/utils/copy-to-clipboard';

interface ClientCredentialsRevealModalProps {
  isOpen: boolean;
  result: ClienteCreateResult;
  onComplete: () => void;
}

function formatCredentialsBlock(cliente: Cliente, credenciales: ClienteCreateResult['credenciales']): string {
  const lines = [
    `Cliente: ${cliente.razon_social}`,
    `Subdominio: ${cliente.subdominio}`,
    `Usuario administrador: ${credenciales.nombre_usuario}`,
    `Contraseña temporal: ${credenciales.contrasena}`,
  ];
  if (credenciales.requiere_cambio) {
    lines.push('Nota: El administrador debe cambiar la contraseña en el primer acceso.');
  }
  return lines.join('\n');
}

const ClientCredentialsRevealModal: React.FC<ClientCredentialsRevealModalProps> = ({
  isOpen,
  result,
  onComplete,
}) => {
  const { cliente, credenciales } = result;
  const [showPassword, setShowPassword] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [copying, setCopying] = useState<'user' | 'password' | 'block' | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setShowPassword(false);
    setAcknowledged(false);
    setCloseConfirmOpen(false);
    setCopying(null);
  }, [isOpen, result.cliente.cliente_id]);

  const handleCopy = useCallback(
    async (kind: 'user' | 'password' | 'block') => {
      setCopying(kind);
      const successMessage =
        kind === 'user'
          ? 'Usuario copiado.'
          : kind === 'password'
            ? 'Contraseña copiada.'
            : 'Bloque de credenciales copiado.';
      const text =
        kind === 'user'
          ? credenciales.nombre_usuario
          : kind === 'password'
            ? credenciales.contrasena
            : formatCredentialsBlock(cliente, credenciales);

      try {
        await copyTextToClipboard(text);
        toast.success(successMessage);
      } catch (error: unknown) {
        if (import.meta.env.DEV) {
          console.warn('[ClientCredentialsRevealModal] copy failed:', error);
        }
        toast.error('No se pudo copiar al portapapeles.');
      } finally {
        setCopying(null);
      }
    },
    [cliente, credenciales],
  );

  const handleRequestClose = useCallback(() => {
    if (acknowledged) {
      onComplete();
      return;
    }
    setCloseConfirmOpen(true);
  }, [acknowledged, onComplete]);

  const handleConfirmCloseWithoutAck = useCallback(() => {
    setCloseConfirmOpen(false);
    onComplete();
  }, [onComplete]);

  const handleFinalize = useCallback(() => {
    if (!acknowledged) {
      toast.error('Debe confirmar que guardó las credenciales antes de cerrar.');
      return;
    }
    toast.success(result.message || 'Cliente creado exitosamente');
    onComplete();
  }, [acknowledged, onComplete, result.message]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      handleRequestClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleRequestClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            handleRequestClose();
          }
        }}
        role="presentation"
      >
        <div
          className="bg-surface rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="credentials-reveal-title"
        >
          <div className="flex items-start justify-between p-6 border-b border-border-base">
            <div className="flex items-start gap-3">
              <KeyRound className="h-6 w-6 text-brand-primary shrink-0 mt-0.5" aria-hidden />
              <div>
                <h2 id="credentials-reveal-title" className="text-xl font-semibold text-text-base">
                  Credenciales del administrador
                </h2>
                <p className="mt-1 text-sm text-text-soft">
                  Guarde esta información ahora. No podrá recuperarla después.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRequestClose}
              className="p-2 hover:bg-overlay dark:hover:bg-overlay rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5 text-text-soft" />
            </button>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 flex gap-3">
              <ShieldAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" aria-hidden />
              <p className="text-sm text-text-base">
                La contraseña solo se muestra en esta pantalla. Compártala por un canal seguro con
                el administrador del tenant.
              </p>
            </div>

            <div className="rounded-lg border border-border-base bg-subtle p-4 space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-soft">Cliente</p>
                <p className="text-sm font-medium text-text-base">{cliente.razon_social}</p>
                <p className="text-xs text-text-soft">
                  {cliente.codigo_cliente} · {cliente.subdominio}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-soft">Usuario</p>
                  <p className="text-sm font-mono text-text-base truncate">
                    {credenciales.nombre_usuario}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('user')}
                  disabled={copying !== null}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border-base rounded-md bg-surface hover:bg-overlay disabled:opacity-50"
                >
                  {copying === 'user' ? (
                    <Loader className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  Copiar
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-soft">
                    Contraseña temporal
                  </p>
                  <p className="text-sm font-mono text-text-base break-all">
                    {showPassword ? credenciales.contrasena : '••••••••••••'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="p-2 border border-border-base rounded-md bg-surface hover:bg-overlay"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-text-soft" />
                    ) : (
                      <Eye className="h-4 w-4 text-text-soft" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy('password')}
                    disabled={copying !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border-base rounded-md bg-surface hover:bg-overlay disabled:opacity-50"
                  >
                    {copying === 'password' ? (
                      <Loader className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copiar
                  </button>
                </div>
              </div>

              {credenciales.requiere_cambio ? (
                <p className="text-xs text-text-soft flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                  Cambio de contraseña obligatorio en el primer acceso.
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => handleCopy('block')}
              disabled={copying !== null}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-border-base rounded-lg bg-surface hover:bg-overlay disabled:opacity-50"
            >
              {copying === 'block' ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copiar bloque completo
            </button>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border-base text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-text-base">
                Confirmo que he guardado las credenciales en un lugar seguro y entiendo que no podré
                recuperarlas desde el sistema.
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-border-base bg-subtle">
            <button
              type="button"
              onClick={handleRequestClose}
              className="px-4 py-2 text-sm font-medium text-text-soft border border-border-base rounded-lg hover:bg-overlay"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleFinalize}
              disabled={!acknowledged}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="h-4 w-4" />
              Finalizar
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={closeConfirmOpen}
        onClose={() => setCloseConfirmOpen(false)}
        onConfirm={handleConfirmCloseWithoutAck}
        title="¿Cerrar sin confirmar?"
        message="Si cierra ahora, no podrá volver a ver la contraseña temporal. Solo estará disponible en esta pantalla."
        confirmText="Cerrar de todos modos"
        cancelText="Volver"
        variant="warning"
      />
    </>
  );
};

export default ClientCredentialsRevealModal;
