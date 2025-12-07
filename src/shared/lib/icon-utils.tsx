// src/shared/lib/icon-utils.tsx
import React from 'react';
// ✅ OPTIMIZADO: Imports específicos para tree-shaking en lugar de importar todo
import {
  Circle,
  AlertTriangle,
  Home,
  User,
  Users,
  Settings,
  LogOut,
  LogIn,
  Menu,
  Search,
  Edit,
  Trash2,
  Plus,
  X,
  Check,
  Eye,
  EyeOff,
  FileText,
  Calendar,
  Clock,
  Package,
  Building,
  Database,
  Activity,
  Shield,
  CheckCircle,
  XCircle,
  Loader,
  RefreshCw,
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  ClipboardList,
  BarChart2,
  BarChart3,
  TrendingUp,
  Save,
  HelpCircle,
  Info,
  MapPin,
  Network,
  List,
  ListChecks,
  ListTodo,
  LineChart,
  Factory,
  Truck,
  Briefcase,
  ShoppingBag,
  Scissors,
  TimerReset,
  AlarmCheck,
  Album,
  AppWindow,
  BaggageClaim,
  BarChartBig,
  BarChartHorizontalBig,
  FileBarChart2,
  ScissorsLineDashed,
  Shirt,
} from 'lucide-react';

// ✅ OPTIMIZADO: Mapa estático de iconos (permite tree-shaking)
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  // Normalizaciones comunes
  circle: Circle,
  'alert-triangle': AlertTriangle,
  alerttriangle: AlertTriangle,
  home: Home,
  user: User,
  users: Users,
  settings: Settings,
  'log-out': LogOut,
  logout: LogOut,
  'log-in': LogIn,
  login: LogIn,
  menu: Menu,
  search: Search,
  edit: Edit,
  'trash-2': Trash2,
  trash: Trash2,
  plus: Plus,
  x: X,
  check: Check,
  eye: Eye,
  'eye-off': EyeOff,
  eyeoff: EyeOff,
  'file-text': FileText,
  filetext: FileText,
  calendar: Calendar,
  clock: Clock,
  package: Package,
  building: Building,
  database: Database,
  activity: Activity,
  shield: Shield,
  'check-circle': CheckCircle,
  checkcircle: CheckCircle,
  'x-circle': XCircle,
  xcircle: XCircle,
  loader: Loader,
  'refresh-cw': RefreshCw,
  refresh: RefreshCw,
  'arrow-left': ArrowLeft,
  arrowleft: ArrowLeft,
  mail: Mail,
  phone: Phone,
  globe: Globe,
  'clipboard-list': ClipboardList,
  clipboardlist: ClipboardList,
  'bar-chart-2': BarChart2,
  barchart2: BarChart2,
  'bar-chart-3': BarChart3,
  barchart3: BarChart3,
  'trending-up': TrendingUp,
  trendingup: TrendingUp,
  save: Save,
  'help-circle': HelpCircle,
  helpcircle: HelpCircle,
  info: Info,
  'map-pin': MapPin,
  mappin: MapPin,
  network: Network,
  list: List,
  'list-checks': ListChecks,
  listchecks: ListChecks,
  'list-todo': ListTodo,
  listtodo: ListTodo,
  'line-chart': LineChart,
  linechart: LineChart,
  factory: Factory,
  truck: Truck,
  briefcase: Briefcase,
  'shopping-bag': ShoppingBag,
  shoppingbag: ShoppingBag,
  scissors: Scissors,
  'timer-reset': TimerReset,
  timerreset: TimerReset,
  'alarm-check': AlarmCheck,
  alarmcheck: AlarmCheck,
  album: Album,
  'app-window': AppWindow,
  appwindow: AppWindow,
  'baggage-claim': BaggageClaim,
  baggageclaim: BaggageClaim,
  'bar-chart-big': BarChartBig,
  barchartbig: BarChartBig,
  'bar-chart-horizontal-big': BarChartHorizontalBig,
  barcharthorizontalbig: BarChartHorizontalBig,
  'file-bar-chart-2': FileBarChart2,
  filebarchart2: FileBarChart2,
  'scissors-line-dashed': ScissorsLineDashed,
  scissorslinedashed: ScissorsLineDashed,
  shirt: Shirt,
};

// Icono por defecto y de error
const DefaultIconComponent = Circle;
const ErrorIconComponent = AlertTriangle;

/**
 * Obtiene dinámicamente un componente de icono de Lucide React por su nombre.
 * @param iconName - El nombre del icono (case-insensitive).
 * @param props - Props adicionales para pasar al componente de icono (ej: size, className).
 * @returns El componente de icono ReactNode o un icono por defecto/error.
 */
export const getIcon = (
    iconName: string | null | undefined,
    props: { size?: number; className?: string } = { size: 16 } // Props por defecto (tamaño 16)
): React.ReactNode => { // Asegúrate que ReactNode esté bien definido
    // 1. Manejar nombre de icono nulo o indefinido
    if (!iconName) {
        // Devuelve un icono por defecto con opacidad reducida
        return <DefaultIconComponent {...props} className={`${props.className || ''} opacity-50`} />;
    }

    try {
        // 2. Normalizar el nombre del icono (case-insensitive, maneja guiones)
        const normalized = iconName
            .toLowerCase()
            .replace(/[-_]/g, '')
            .trim();
        
        // 3. Buscar en el mapa estático primero (tree-shaking friendly)
        const IconComponent = ICON_MAP[normalized];
        
        if (IconComponent) {
            return <IconComponent {...props} />;
        }

        // 4. Si no está en el mapa, usar import dinámico como fallback
        // ⚠️ NOTA: Para mejor tree-shaking, agrega iconos faltantes a ICON_MAP
        console.warn(
            `⚠️ [getIcon] Icono "${iconName}" no está en el mapa estático. ` +
            `Considera agregarlo a ICON_MAP para mejor tree-shaking. ` +
            `Usando icono por defecto.`
        );
        
        return <DefaultIconComponent {...props} className={`${props.className || ''} opacity-50`} />;
    } catch (error) {
        console.error(`❌ [getIcon] Error al obtener icono "${iconName}":`, error);
        return <ErrorIconComponent {...props} className={`${props.className || ''} text-red-500`} />;
    }
};

/**
 * Hook para obtener un componente de icono de forma reactiva.
 * Útil cuando el nombre del icono puede cambiar dinámicamente.
 */
export const useIcon = (iconName: string | null | undefined) => {
    return React.useMemo(() => getIcon(iconName), [iconName]);
};

