import { useState, useEffect } from 'react';
import { Bell, Calendar, Clock, ChevronDown } from 'lucide-react';

function Navbar() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const today = currentTime.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const time = currentTime.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return (
    <header className="bg-white h-14 lg:h-16 border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      {/* Left - Date & Time */}
      <div className="flex items-center gap-2 lg:gap-6 ml-12 lg:ml-0">
        <div className="hidden md:flex items-center gap-2 text-gray-600">
          <Calendar size={16} className="lg:size-[18px]" />
          <span className="text-xs lg:text-sm font-medium capitalize truncate max-w-[150px] lg:max-w-none">{today}</span>
        </div>
        <div className="flex items-center gap-1.5 lg:gap-2 text-primary">
          <Clock size={16} className="lg:size-[18px]" />
          <span className="text-xs lg:text-sm font-bold font-mono">{time}</span>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Notifications */}
        <button className="relative p-1.5 lg:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={18} className="lg:size-[20px]" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-4 border-l border-gray-200">
          <div className="text-right hidden md:block">
            <p className="text-xs lg:text-sm font-medium text-gray-900">Admin Demo</p>
            <p className="text-xs text-gray-500 hidden lg:block">Administrador</p>
          </div>
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-sm lg:text-base">
            AD
          </div>
          <ChevronDown size={14} className="text-gray-400 hidden lg:block" />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
