import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Componente Tooltip simple para mostrar información contextual
 */
export const Tooltip: React.FC<TooltipProps> = ({ content, children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children || <HelpCircle className="h-4 w-4 text-brand-text-secondary hover:text-brand-primary" />}
      </div>
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-text-base bg-surface border border-border-base rounded-lg shadow-lg whitespace-normal max-w-xs">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-surface" />
        </div>
      )}
    </div>
  );
};

interface TooltipLabelProps {
  label: string;
  tooltip: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
}

/**
 * Label con tooltip integrado
 */
export const TooltipLabel: React.FC<TooltipLabelProps> = ({
  label,
  tooltip,
  required = false,
  htmlFor,
  className = ''
}) => {
  return (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-text-base mb-1 ${className}`}>
      <div className="flex items-center gap-2">
        <span>
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </span>
        <Tooltip content={tooltip} />
      </div>
    </label>
  );
};




