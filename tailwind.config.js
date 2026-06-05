/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"], // Asegúrate que sea solo ["class"] si usas el toggle de shadcn
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}', // Incluye esta si tienes archivos fuera de app/pages/components
  ],
  prefix: "", // Prefijo opcional si lo necesitas
  theme: {
    container: { // Configuración común para contenedores centrados
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Colores base de shadcn/ui (usando variables CSS)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))", // Para el fondo general
        foreground: "hsl(var(--foreground))", // Para el texto general
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Colores para gráficos (si los necesitas)
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        // ========================================
        // TOKENS DE BRANDING DINÁMICO
        // (Actualizados por JavaScript desde backend)
        // ========================================
        
        'brand-primary': {
          // Texto/bordes sólidos: var(--caxis-blue). Opacidad (/N) no aplica — fondo nav: clase .nav-item-active-bg.
          DEFAULT: 'var(--caxis-blue, rgb(var(--color-primary-rgb, 25, 118, 210)))',
          hex: 'var(--caxis-blue, var(--color-primary))',
          hover: 'hsl(var(--color-primary-hover-hsl, 210 79% 41%))',
          active: 'hsl(var(--color-primary-active-hsl, 210 79% 36%))',
          light: 'hsl(var(--color-primary-light-hsl, 210 79% 86%))',
          dark: 'hsl(var(--color-primary-dark-hsl, 210 79% 26%))',
        },
        // Alias para compatibilidad (bg-brand-primary-hover funciona)
        'brand-primary-hover': 'hsl(var(--color-primary-hover-hsl, 210 79% 41%))',
        'brand-secondary': {
          // ✅ MEJORADO: Priorizar --caxis-navy si existe (de tema_personalizado), sino usar --color-secondary
          DEFAULT: 'var(--caxis-navy, rgb(var(--color-secondary-rgb, 66, 66, 66)))',
          hex: 'var(--caxis-navy, var(--color-secondary))',
          hover: 'hsl(var(--color-secondary-hover-hsl, 0 0% 23%))',
          active: 'hsl(var(--color-secondary-active-hsl, 0 0% 21%))',
          light: 'hsl(var(--color-secondary-light-hsl, 0 0% 56%))',
          dark: 'hsl(var(--color-secondary-dark-hsl, 0 0% 11%))',
        },
        'brand-surface': {
          DEFAULT: 'hsl(var(--brand-surface, var(--color-surface, 210 20% 98%)))',
          secondary: 'hsl(var(--brand-surface-secondary, var(--color-surface-alt, 220 14% 96%)))',
          alt: 'hsl(var(--brand-surface-secondary, var(--color-surface-alt, 220 14% 96%)))',
        },
        'brand-surface-secondary': 'hsl(var(--brand-surface-secondary, 220 14% 96%))',
        'brand-text': {
          DEFAULT: 'hsl(var(--brand-text-primary, var(--color-text-primary, 222 47% 11%)))',
          secondary: 'hsl(var(--brand-text-secondary, var(--color-text-secondary, 215 16% 47%)))',
        },
        'brand-text-primary': 'hsl(var(--brand-text-primary, 222 47% 11%))',
        'brand-text-secondary': 'hsl(var(--brand-text-secondary, 215 16% 47%))',
        'brand-border': 'hsl(var(--brand-border, var(--color-border, 220 13% 91%)))',
        'brand-input': {
          bg: 'hsl(var(--color-input-bg, 0 0% 100%))',
          border: 'hsl(var(--color-input-border, 0 0% 89.8%))',
        },
        // ✅ NUEVO: Colores de la paleta completa (prefijo caxis-)
        'caxis': {
          navy: 'var(--caxis-navy, #0A1628)',
          blue: 'var(--caxis-blue, #1E56A0)',
          cyan: 'var(--caxis-cyan, #1FB6E8)',
          mint: 'var(--caxis-mint, #00D4AA)',
          slate: 'var(--caxis-slate, #64748B)',
          amber: 'var(--caxis-amber, #F59E0B)',
          red: 'var(--caxis-red, #EF4444)',
          green: 'var(--caxis-green, #10B981)',
          indigo: 'var(--caxis-indigo, #4F46E5)',
          purple: 'var(--caxis-purple, #8B5CF6)',
          orange: 'var(--caxis-orange, #F97316)',
          // Escala de grises
          white: 'var(--caxis-white, #FFFFFF)',
          'gray-50': 'var(--caxis-gray-50, #F8FAFC)',
          'gray-100': 'var(--caxis-gray-100, #F1F5F9)',
          'gray-200': 'var(--caxis-gray-200, #E2E8F0)',
          'gray-300': 'var(--caxis-gray-300, #CBD5E1)',
          'gray-400': 'var(--caxis-gray-400, #94A3B8)',
          'gray-500': 'var(--caxis-gray-500, #64748B)',
          'gray-600': 'var(--caxis-gray-600, #475569)',
          'gray-700': 'var(--caxis-gray-700, #334155)',
          'gray-800': 'var(--caxis-gray-800, #1E293B)',
          'gray-900': 'var(--caxis-gray-900, #0F172A)',
          black: 'var(--caxis-black, #020617)',
        },
        /* CAPA 1 — Design system fijo */
        page:          'var(--bg-page)',
        surface:       'var(--bg-surface)',
        subtle:        'var(--bg-subtle)',
        overlay:       'var(--bg-overlay)',
        'text-base':     'var(--text-primary)',
        'text-soft':     'var(--text-secondary)',
        'text-faint':    'var(--text-muted)',
        'border-base':   'var(--border-default)',
        'border-strong': 'var(--border-strong)',
        success:       'var(--color-success)',
        error:         'var(--color-error)',
        warning:       'var(--color-warning)',
        info:          'var(--color-info)',
        // --- NO AÑADIR aquí referencias como 'colors.text.light' ---
        // --- NO AÑADIR aquí backgroundColor o textColor, usar clases directas ---
      },
      borderRadius: {
        none: "var(--radius-none, 0)",
        sm: "var(--radius-sm, 0.25rem)",
        base: "var(--radius-base, 0.375rem)",
        md: "var(--radius-md, var(--border-radius, var(--radius)))",
        lg: "var(--radius-lg, 0.75rem)",
        xl: "var(--radius-xl, 1rem)",
        '2xl': "var(--radius-2xl, 1.5rem)",
        '3xl': "var(--radius-3xl, 2rem)",
        full: "var(--radius-full, 9999px)",
      },
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'base': 'var(--shadow-base)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        'inner': 'var(--shadow-inner)',
        'focus-blue': 'var(--shadow-focus-blue)',
        'focus-cyan': 'var(--shadow-focus-cyan)',
        'focus-red': 'var(--shadow-focus-red)',
        'none': 'var(--shadow-none)',
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-dark': 'var(--gradient-dark)',
        'gradient-subtle': 'var(--gradient-subtle)',
      },
      transitionDuration: {
        'fast': 'var(--transition-fast)',
        'base': 'var(--transition-base)',
        'medium': 'var(--transition-medium)',
        'slow': 'var(--transition-slow)',
      },
      transitionTimingFunction: {
        'linear': 'var(--ease-linear)',
        'in': 'var(--ease-in)',
        'out': 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
        'spring': 'var(--ease-spring)',
      },
      fontFamily: {
        sans: ['var(--font-body, var(--font-family))', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body, var(--font-family))', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      keyframes: { // Necesario para tailwindcss-animate
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: { // Necesario para tailwindcss-animate
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontSize: {
        'table-header': ['0.875rem', { 
          lineHeight: '1.25rem', 
          fontWeight: '600' 
        }],
        'table-cell': ['0.875rem', { 
          lineHeight: '1.25rem' 
        }],
        'table-detail': ['0.75rem', { 
          lineHeight: '1rem' 
        }],
        'table-sm': ['0.75rem', { 
          lineHeight: '1rem' 
        }],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), // Plugin requerido por shadcn/ui
    // Tu plugin personalizado (puede quedarse si lo necesitas,
    // el error de @apply debería resolverse ahora)
    function({ addComponents }) {
      addComponents({
         /* Estilos base para cards */
        '.card': {
          '@apply bg-card text-card-foreground rounded-lg shadow-sm transition-all duration-200 border': {} // Usar colores shadcn
        },
        '.card-header': {
          '@apply p-4 border-b': {} // Usar border por defecto
        },
        '.card-title': {
          '@apply text-lg font-semibold text-foreground': {} // Usar foreground
        },
        '.card-content': {
          '@apply p-4': {}
        },
        /* Puedes añadir más componentes personalizados aquí si es necesario */
        /* Los estilos para botones (.btn, .btn-primary) ya vienen con shadcn/ui si usas su componente Button */
        /* Si no usas el Button de shadcn, puedes mantener tus .btn-* aquí */
        '.btn': {
          '@apply inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2': {} // Estilo base similar a shadcn
        },
        '.btn-primary': {
          '@apply bg-primary text-primary-foreground hover:bg-primary/90': {} // Correcto ahora
        },
        '.btn-secondary': {
          '@apply bg-secondary text-secondary-foreground hover:bg-secondary/80': {} // Usar colores shadcn
        },
        // ... otros estilos personalizados ...
      })
    },
  ],
}