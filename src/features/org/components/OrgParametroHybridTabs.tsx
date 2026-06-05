import type { ParametroHybridTab } from '../hooks/parametro-query-keys';

const TAB_ITEMS: { id: ParametroHybridTab; label: string }[] = [
  { id: 'effective', label: 'Valores efectivos' },
  { id: 'global', label: 'Globales tenant' },
  { id: 'override', label: 'Overrides empresa activa' },
];

interface OrgParametroHybridTabsProps {
  activeTab: ParametroHybridTab;
  onChange: (tab: ParametroHybridTab) => void;
}

export function OrgParametroHybridTabs({ activeTab, onChange }: OrgParametroHybridTabsProps) {
  return (
    <div
      className="mb-4 flex flex-wrap gap-1 border-b border-border-base"
      role="tablist"
      aria-label="Vistas de parámetros"
    >
      {TAB_ITEMS.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={
              selected
                ? 'px-4 py-2.5 text-sm font-medium text-brand-primary border-b-2 border-brand-primary -mb-px'
                : 'px-4 py-2.5 text-sm font-medium text-text-soft hover:text-text-base border-b-2 border-transparent -mb-px'
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
