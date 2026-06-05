// src/shared/components/ui/IconSelector.tsx
import React from 'react';
import Select, { OptionProps, SingleValueProps, components } from 'react-select';
import { getIcon } from '../../lib/icon-utils';

// Interfaz para las opciones del Select
interface IconOption {
  value: string;
  label: string;
}

// Props del componente IconSelector
interface IconSelectorProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  menuPlacement?: 'auto' | 'bottom' | 'top';
  id?: string;
}

// --- Lista de iconos permitidos (como la definiste) ---
const allowedIconNames: string[] = [
  'AlarmCheck','Album','AlignVerticalDistributeCenter','AlignEndHorizontal','AlignStartVertical','AppWindow',
  'AlertTriangle','BaggageClaim','BarChartBig','BarChartHorizontalBig','BarChart2','Briefcase','BarChart3','Calendar', 
  'Clock','Check','ClipboardList','Edit', 'Eye', 'EyeOff', 'FileText','FileBarChart2','Factory','Home', 
  'HelpCircle','Info','MapPin','Menu','Network','List','ListChecks','ListTodo','LineChart','LogOut', 'LogIn',
  'Plus','Settings','Shirt','ShoppingBag','ScissorsLineDashed','Scissors','Save','Trash2','TrendingUp',
  'TimerReset','Truck','User', 'Users','X'    
  // Añade más si es necesario
];

// Generar las opciones desde la lista permitida
const iconOptions: IconOption[] = allowedIconNames.map(iconName => ({
  value: iconName,
  label: iconName,
}));

// Componente para la opción en el menú (sin cambios)
const IconOptionComponent: React.FC<OptionProps<IconOption, false>> = (props) => (
  <components.Option {...props}>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ marginRight: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
        {getIcon(props.data.value, undefined, { size: 16 })}
      </span>
      {props.label}
    </div>
  </components.Option>
);

// Componente para el valor seleccionado (sin cambios)
const SingleValueComponent: React.FC<SingleValueProps<IconOption, false>> = (props) => (
  <components.SingleValue {...props}>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ marginRight: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
         {getIcon(props.data.value, undefined, { size: 16 })}
      </span>
      {props.children}
    </div>
  </components.SingleValue>
);


const IconSelector: React.FC<IconSelectorProps> = ({
  value,
  onChange,
  placeholder = "Seleccionar icono...",
  menuPlacement = 'auto',
  id
}) => {
  const selectedOption = value ? iconOptions.find(option => option.value === value) : null;

  const handleChange = (selected: IconOption | null) => {
    onChange(selected ? selected.value : null);
  };

  // --- *** ESTILOS ACTUALIZADOS CON FONDOS EXPLÍCITOS *** ---
  const customStyles = {
    control: (provided: any, state: { isFocused: any; }) => ({
        ...provided,
        // Fondo del control principal (input)
        backgroundColor: 'var(--select-bg, hsl(var(--brand-surface)))',
        borderColor: state.isFocused ? 'var(--color-primary, #1976D2)' : 'hsl(var(--brand-border, 220 13% 91%))',
        '&:hover': { borderColor: 'hsl(var(--brand-border, 220 13% 91%))' },
        boxShadow: state.isFocused ? '0 0 0 1px var(--color-primary, #1976D2)' : 'none',
        color: 'hsl(var(--brand-text-primary, 222 47% 11%))',
        minHeight: '38px', // Altura estándar de input de Tailwind
    }),
    input: (provided: any) => ({
        ...provided,
        color: 'hsl(var(--brand-text-primary, 222 47% 11%))',
        margin: '0px', // Ajuste fino si es necesario
    }),
    singleValue: (provided: any) => ({
        ...provided,
        color: 'hsl(var(--brand-text-primary, 222 47% 11%))',
        display: 'flex',
        alignItems: 'center',
    }),
    placeholder: (provided: any) => ({
        ...provided,
        color: 'hsl(var(--brand-text-secondary, 215 16% 47%))',
    }),
    menu: (provided: any) => ({
        ...provided,
        backgroundColor: 'var(--select-menu-bg, hsl(var(--brand-surface)))',
        zIndex: 50,
        border: '1px solid hsl(var(--brand-border, 220 13% 91%))',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Sombra suave
    }),
    option: (provided: any, state: { isSelected: any; isFocused: any; }) => ({
        ...provided,
        backgroundColor: state.isSelected
          ? 'var(--color-primary, #1976D2)'
          : state.isFocused
          ? 'hsl(var(--color-primary-light-hsl, 210 79% 86%))'
          : 'hsl(var(--brand-surface, 210 20% 98%))',
        color: state.isSelected
          ? '#ffffff'
          : 'hsl(var(--brand-text-primary, 222 47% 11%))',
        '&:active': {
          backgroundColor: 'var(--color-primary, #1976D2)',
        },
        cursor: 'pointer',
        paddingTop: '8px', // Espaciado interno
        paddingBottom: '8px',
    }),
  };
  // --- ******************************************************* ---


  return (
    <Select<IconOption, false>
      id={id}
      options={iconOptions}
      value={selectedOption}
      onChange={handleChange}
      placeholder={placeholder}
      isClearable
      isSearchable
      components={{ Option: IconOptionComponent, SingleValue: SingleValueComponent }}
      styles={customStyles}
      menuPlacement={menuPlacement}
      classNamePrefix="react-select"
    />
  );
};

export default IconSelector;




