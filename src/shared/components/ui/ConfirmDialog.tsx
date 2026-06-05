import React from 'react';
import { AlertTriangle, X, Loader } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  confirmButtonClassName?: string;
  /** Contenido opcional entre el mensaje (caja coloreada) y el footer. */
  children?: React.ReactNode;
  /** Clases del panel (p. ej. `max-w-lg`). Por defecto `max-w-md`. */
  panelClassName?: string;
}

/**
 * Componente de diálogo de confirmación reutilizable
 * Reemplaza window.confirm con una UI moderna y accesible
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  loading = false,
  confirmButtonClassName = '',
  children,
  panelClassName,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-error',
      button: 'bg-error hover:bg-error/90 focus:ring-error text-white',
      bg: 'bg-error/10'
    },
    warning: {
      icon: 'text-warning',
      button: 'bg-warning hover:bg-warning/90 focus:ring-warning text-white',
      bg: 'bg-warning/10'
    },
    info: {
      icon: 'text-info',
      button: 'bg-info hover:bg-info/90 focus:ring-info text-white',
      bg: 'bg-info/10'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-surface rounded-xl shadow-xl w-full ${panelClassName ?? 'max-w-md'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-base">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
            <h3 className="text-lg font-semibold text-text-base">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-overlay rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-text-soft" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className={`${styles.bg} p-4 rounded-lg mb-4`}>
            <p className="text-sm text-text-base whitespace-pre-line">
              {message}
            </p>
          </div>
          {children}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border-base bg-subtle">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-secondary border border-transparent rounded-lg hover:bg-brand-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2 ${
              confirmButtonClassName || styles.button
            }`}
          >
            {loading && <Loader className="h-4 w-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};




