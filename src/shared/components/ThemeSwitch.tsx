import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeSwitch: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full hover:bg-brand-surface-alt dark:hover:bg-brand-surface-alt transition-colors"
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5 text-brand-primary" />
      ) : (
        <Moon className="w-5 h-5 text-brand-text-secondary" />
      )}
    </button>
  );
};

export default ThemeSwitch;

