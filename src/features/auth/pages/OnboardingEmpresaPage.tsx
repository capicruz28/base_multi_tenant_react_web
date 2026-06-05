import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';

/**
 * Bienvenida para admin de cliente sin empresa activa (onboarding).
 * Shell sin sidebar/header (NewLayout hideChrome).
 */
export default function OnboardingEmpresaPage() {
  const navigate = useNavigate();

  const handleCreate = () => {
    navigate('/app/org/empresa?onboarding=true', { replace: true });
  };

  return (
    <div className="min-h-screen bg-page flex flex-col items-center px-4">
      <div className="bg-surface border border-border-base rounded-lg shadow-sm p-8 max-w-lg w-full mx-auto mt-20 text-center">
        <Building2
          className="mx-auto text-brand-primary"
          size={48}
          strokeWidth={1.5}
          aria-hidden
        />
        <h1 className="text-2xl font-semibold text-text-base mt-4">Bienvenido a CAXIS ERP</h1>
        <p className="text-text-soft text-center mt-2">
          Para comenzar necesitas crear tu primera empresa. Solo toma unos minutos.
        </p>
        <button
          type="button"
          onClick={handleCreate}
          className="bg-brand-primary hover:bg-brand-primary-hover text-white px-6 py-3 rounded-lg font-medium mt-6 transition-colors"
        >
          Crear mi primera empresa
        </button>
      </div>
    </div>
  );
}
