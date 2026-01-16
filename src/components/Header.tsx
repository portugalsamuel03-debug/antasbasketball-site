
import React from 'react';
import { Bell, User, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  hasNewNotifications?: boolean;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, onToggleTheme, onOpenNotifications, onOpenAuth, hasNewNotifications = true }) => {
  return (
    <header className={`px-6 pt-8 pb-4 sticky top-0 backdrop-blur-lg z-50 ${isDarkMode ? 'bg-black/80' : 'bg-[#FDFBF4]/80 border-b border-[#0B1D33]/5'}`}>
      <div className="flex justify-between items-center mb-1">
        <div>
          <h1 className={`text-3xl font-black italic tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
            ANTAS<br />
            <span className="text-yellow-400">BASKETBALL</span>
          </h1>
          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">
            Bora a nossa since 2017
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenNotifications}
            className={`p-2 rounded-full transition-colors relative ${isDarkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-[#F0F2F5] hover:bg-gray-200'}`}
          >
            <Bell size={20} className={isDarkMode ? 'text-white' : 'text-[#0B1D33]'} />
            {hasNewNotifications && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-400 rounded-full border border-black animate-pulse"></span>
            )}
          </button>
          <button 
            onClick={onOpenAuth}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-[#F0F2F5] hover:bg-gray-200'}`}
          >
            <User size={20} className={isDarkMode ? 'text-white' : 'text-[#0B1D33]'} />
          </button>
          <button 
            onClick={onToggleTheme}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-[#F0F2F5] hover:bg-gray-200'}`}
          >
            {isDarkMode ? <Sun size={20} className="text-white" /> : <Moon size={20} className="text-[#0B1D33]" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
