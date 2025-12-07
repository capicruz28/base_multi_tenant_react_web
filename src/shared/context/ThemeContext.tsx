import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  toggleDarkMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  themeMode: 'auto',
  toggleDarkMode: () => {},
  setThemeMode: () => {},
});

/**
 * Detecta la preferencia de color del sistema
 */
const getSystemPreference = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Obtiene el tema inicial desde localStorage o preferencia del sistema
 */
const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'auto';
  const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
  return savedTheme || 'auto';
};

/**
 * Calcula si debe estar en dark mode según el modo actual
 */
const shouldBeDarkMode = (themeMode: ThemeMode): boolean => {
  if (themeMode === 'dark') return true;
  if (themeMode === 'light') return false;
  return getSystemPreference(); // 'auto'
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getInitialTheme);
  const [isDarkMode, setIsDarkMode] = useState(() => shouldBeDarkMode(getInitialTheme()));

  // Aplicar tema al DOM
  const applyTheme = useCallback((dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Actualizar dark mode cuando cambia themeMode
  useEffect(() => {
    const dark = shouldBeDarkMode(themeMode);
    setIsDarkMode(dark);
    applyTheme(dark);
    localStorage.setItem('theme', themeMode);
  }, [themeMode, applyTheme]);

  // Escuchar cambios en la preferencia del sistema (solo si está en modo 'auto')
  useEffect(() => {
    if (themeMode !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
      applyTheme(e.matches);
    };

    // Navegadores modernos
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Fallback para navegadores antiguos
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [themeMode, applyTheme]);

  const toggleDarkMode = useCallback(() => {
    // Si está en 'auto', cambiar a 'dark' o 'light' según preferencia actual
    if (themeMode === 'auto') {
      setThemeModeState(getSystemPreference() ? 'light' : 'dark');
    } else {
      // Alternar entre 'light' y 'dark'
      setThemeModeState(themeMode === 'dark' ? 'light' : 'dark');
    }
  }, [themeMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode, themeMode, toggleDarkMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);




