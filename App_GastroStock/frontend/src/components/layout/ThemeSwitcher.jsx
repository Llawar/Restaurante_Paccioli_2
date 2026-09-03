import { useState, useEffect, useRef } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = themes.find((t) => t.id === theme);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 lg:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Cambiar apariencia"
      >
        <Palette size={18} className="lg:size-[20px]" />
        {current && (
          <span
            className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-white"
            style={{ backgroundColor: current.color }}
          />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50">
          <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Apariencia
          </p>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                theme === t.id ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              <span
                className="w-7 h-7 rounded-lg flex-shrink-0"
                style={{ backgroundColor: t.color }}
              />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-gray-900">{t.nombre}</span>
                <span className="block text-xs text-gray-500 truncate">{t.desc}</span>
              </span>
              {theme === t.id && <Check size={16} className="text-primary flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ThemeSwitcher;
