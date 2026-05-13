// src/shared/context/NavModeContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

export type NavMode = 'sidebar' | 'navbar';

const STORAGE_KEY = 'nav_layout_mode';

interface NavModeContextType {
  navMode: NavMode;
  toggleNavMode: () => void;
  setNavMode: (mode: NavMode) => void;
}

const NavModeContext = createContext<NavModeContextType>({
  navMode: 'sidebar',
  toggleNavMode: () => {},
  setNavMode: () => {},
});

const getInitialMode = (): NavMode => {
  if (typeof window === 'undefined') return 'sidebar';
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'navbar' || saved === 'sidebar' ? saved : 'sidebar';
};

export const NavModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navMode, setNavModeState] = useState<NavMode>(getInitialMode);

  const setNavMode = useCallback((mode: NavMode) => {
    setNavModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const toggleNavMode = useCallback(() => {
    setNavMode(navMode === 'sidebar' ? 'navbar' : 'sidebar');
  }, [navMode, setNavMode]);

  return (
    <NavModeContext.Provider value={{ navMode, toggleNavMode, setNavMode }}>
      {children}
    </NavModeContext.Provider>
  );
};

export const useNavMode = () => useContext(NavModeContext);
