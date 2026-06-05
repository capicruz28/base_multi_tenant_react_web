import { useState, useEffect, useRef } from 'react';
import { Building2, ChevronDown, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useEmpresaActiva } from '@/features/auth/hooks/useEmpresaActiva';
import { useEmpresaSelectionStore } from '@/features/auth/stores/empresa-selection.store';
import { empresaService } from '@/features/org/services/org.service';
import { getErrorMessage } from '@/core/services/error.service';
import {
  resolveEmpresaLabel,
  normalizeEmpresasElegibles,
  findEmpresaById,
  isSameEmpresaId,
} from '@/core/auth/utils/empresa-eligibles';

const LOADING_LABEL = 'Cargando empresa...';

const EmpresaSelector = () => {
  const {
    empresasElegibles,
    empresaActivaId,
    cambiarEmpresaActiva,
    showEmpresaActiva,
    canSwitchEmpresa,
    userType,
  } = useEmpresaActiva();
  const selectionEmpresas = useEmpresaSelectionStore((s) => s.empresasDisponibles);

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loadingName, setLoadingName] = useState(false);
  const [resolveFailed, setResolveFailed] = useState(false);
  const [changing, setChanging] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[EmpresaSelector][diag]', {
        empresaActivaId,
        displayName,
        empresasElegiblesLength: empresasElegibles.length,
        showEmpresaActiva,
        canSwitchEmpresa,
        userType,
        loadingName,
        resolveFailed,
      });
    }
  }, [
    empresaActivaId,
    displayName,
    empresasElegibles.length,
    showEmpresaActiva,
    canSwitchEmpresa,
    userType,
    loadingName,
    resolveFailed,
  ]);

  useEffect(() => {
    if (!empresaActivaId) {
      setDisplayName(null);
      setResolveFailed(false);
      return;
    }

    setResolveFailed(false);

    const fromElegibles = findEmpresaById(empresasElegibles, empresaActivaId);
    if (fromElegibles) {
      setDisplayName(resolveEmpresaLabel(fromElegibles));
      return;
    }

    const fromSelection = findEmpresaById(
      normalizeEmpresasElegibles(selectionEmpresas),
      empresaActivaId,
    );
    if (fromSelection) {
      setDisplayName(resolveEmpresaLabel(fromSelection));
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingName(true);
      try {
        const empresa = await empresaService.getById(empresaActivaId);
        if (!cancelled) {
          const label = resolveEmpresaLabel(empresa);
          setDisplayName(label.length > 0 ? label : null);
          setResolveFailed(label.length === 0);
        }
      } catch (error) {
        if (!cancelled) {
          if (import.meta.env.DEV) {
            console.warn('[EmpresaSelector] getById fallback falló', {
              empresaActivaId,
              error,
            });
          }
          setDisplayName(null);
          setResolveFailed(true);
        }
      } finally {
        if (!cancelled) {
          setLoadingName(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [empresaActivaId, empresasElegibles, selectionEmpresas]);

  useEffect(() => {
    if (!canSwitchEmpresa) {
      setOpen(false);
    }
  }, [canSwitchEmpresa]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!showEmpresaActiva || !empresaActivaId) {
    return null;
  }

  const containerClass = [
    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md',
    'bg-subtle border border-border-base text-text-base text-sm font-medium',
    'transition-colors',
    canSwitchEmpresa ? 'cursor-pointer hover:bg-overlay' : 'cursor-default',
  ].join(' ');

  const handleSelect = async (nextId: string) => {
    if (!nextId || nextId === empresaActivaId || changing) return;
    setChanging(true);
    setOpen(false);
    try {
      await cambiarEmpresaActiva(nextId);
      const selected = findEmpresaById(empresasElegibles, nextId);
      if (selected) {
        setDisplayName(resolveEmpresaLabel(selected));
        setResolveFailed(false);
      }
      const label = selected ? resolveEmpresaLabel(selected) : displayName;
      if (label) {
        toast.success(`Empresa activa: ${label}`);
      }
    } catch (error) {
      const err = getErrorMessage(error);
      toast.error(err.message || 'No se pudo cambiar de empresa');
    } finally {
      setChanging(false);
    }
  };

  const labelText = displayName ?? LOADING_LABEL;
  const isPendingLabel = !displayName;
  const titleText = displayName ?? empresaActivaId;

  const content = (
    <>
      <Building2 size={15} className="text-brand-primary flex-shrink-0" aria-hidden />
      <span
        className={`max-w-[160px] truncate ${isPendingLabel ? 'text-text-soft italic' : ''}`}
      >
        {labelText}
      </span>
      {canSwitchEmpresa && !isPendingLabel ? (
        <ChevronDown size={13} className="text-text-soft flex-shrink-0" />
      ) : null}
      {loadingName || changing ? (
        <Loader className="w-3.5 h-3.5 animate-spin text-brand-primary flex-shrink-0" />
      ) : null}
    </>
  );

  if (!canSwitchEmpresa || isPendingLabel) {
    return (
      <div
        className={`${containerClass} mr-1`}
        title={titleText}
        aria-busy={loadingName || changing}
        aria-live="polite"
      >
        {content}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative mr-1">
      <button
        type="button"
        className={containerClass}
        onClick={() => setOpen((prev) => !prev)}
        disabled={changing}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={resolveFailed ? empresaActivaId : 'Cambiar empresa activa'}
      >
        {content}
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1 min-w-[200px] max-w-[280px] py-1 bg-surface border border-border-base rounded-md shadow-lg z-50"
        >
          {empresasElegibles.map((empresa) => {
            const isActive = isSameEmpresaId(empresa.empresa_id, empresaActivaId);
            return (
              <button
                key={empresa.empresa_id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(empresa.empresa_id)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-primary/10 text-brand-primary font-medium'
                    : 'text-text-base hover:bg-overlay'
                }`}
              >
                <span className="block truncate font-medium">{empresa.razon_social}</span>
                {empresa.nombre_comercial?.trim() ? (
                  <span className="block truncate text-xs text-text-soft mt-0.5">
                    {empresa.nombre_comercial}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default EmpresaSelector;
