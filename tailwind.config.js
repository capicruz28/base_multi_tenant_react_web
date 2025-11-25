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
          DEFAULT: 'rgb(var(--color-primary-rgb, 25, 118, 210))',
          hex: 'var(--color-primary)',
          hover: 'hsl(var(--color-primary-hover-hsl, 210 79% 41%))',
          active: 'hsl(var(--color-primary-active-hsl, 210 79% 36%))',
          light: 'hsl(var(--color-primary-light-hsl, 210 79% 86%))',
          dark: 'hsl(var(--color-primary-dark-hsl, 210 79% 26%))',
        },
        // Alias para compatibilidad (bg-brand-primary-hover funciona)
        'brand-primary-hover': 'hsl(var(--color-primary-hover-hsl, 210 79% 41%))',
        'brand-secondary': {
          DEFAULT: 'rgb(var(--color-secondary-rgb, 66, 66, 66))',
          hex: 'var(--color-secondary)',
          hover: 'hsl(var(--color-secondary-hover-hsl, 0 0% 23%))',
          active: 'hsl(var(--color-secondary-active-hsl, 0 0% 21%))',
          light: 'hsl(var(--color-secondary-light-hsl, 0 0% 56%))',
          dark: 'hsl(var(--color-secondary-dark-hsl, 0 0% 11%))',
        },
        'brand-surface': {
          DEFAULT: 'hsl(var(--color-surface, 0 0% 100%))',
          alt: 'hsl(var(--color-surface-alt, 0 0% 98%))',
        },
        'brand-text': {
          DEFAULT: 'hsl(var(--color-text-primary, 0 0% 3.9%))',
          secondary: 'hsl(var(--color-text-secondary, 0 0% 45.1%))',
        },
        'brand-border': 'hsl(var(--color-border, 0 0% 89.8%))',
        'brand-input': {
          bg: 'hsl(var(--color-input-bg, 0 0% 100%))',
          border: 'hsl(var(--color-input-border, 0 0% 89.8%))',
        }
        // --- NO AÑADIR aquí referencias como 'colors.text.light' ---
        // --- NO AÑADIR aquí backgroundColor o textColor, usar clases directas ---
      },
      borderRadius: {
        lg: "var(--border-radius, var(--radius))",
        md: "calc(var(--border-radius, var(--radius)) - 2px)",
        sm: "calc(var(--border-radius, var(--radius)) - 4px)",
      },
      fontFamily: {
        sans: ['var(--font-family)', 'system-ui', '-apple-system', 'sans-serif'],
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