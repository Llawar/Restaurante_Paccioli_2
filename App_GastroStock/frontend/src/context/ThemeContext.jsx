import { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = [
  {
    id: 'burdeos',
    nombre: 'Burdeos (Vino)',
    desc: 'Vino tinto elegante con fondo crema',
    color: '#8b1e2d',
  },
  {
    id: 'esmeralda',
    nombre: 'Esmeralda (Orgánico)',
    desc: 'Verde petróleo fresco y sofisticado',
    color: '#0f766e',
  },
  {
    id: 'oro',
    nombre: 'Oro (Lujo)',
    desc: 'Dorado cálido con toques de lujo',
    color: '#b45309',
  },
  {
    id: 'grafito',
    nombre: 'Grafito (Premium)',
    desc: 'Carbón moderno y minimalista',
    color: '#374151',
  },
];

const STORAGE_KEY = 'gastrostock_theme';

const ThemeContext = createContext({
  theme: 'burdeos',
  setTheme: () => {},
  themes: THEMES,
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return THEMES.some((t) => t.id === saved) ? saved : 'burdeos';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (id) => {
    if (THEMES.some((t) => t.id === id)) {
      setThemeState(id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
