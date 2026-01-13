
import React from 'react';
import { LayoutGrid, Newspaper, History, Book, Radio } from 'lucide-react';
import { Category } from '../types';

interface BottomNavProps {
  activeTab: Category;
  onTabChange: (tab: Category) => void;
  isDarkMode: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, isDarkMode }) => {
  const items = [
    { id: Category.INICIO, label: 'INÍCIO', icon: LayoutGrid },
    { id: Category.NOTICIAS, label: 'NOTÍCIAS', icon: Newspaper },
    { id: Category.HISTORIA, label: 'HISTÓRIA', icon: History },
    { id: Category.REGRAS, label: 'REGRAS', icon: Book },
    { id: Category.PODCAST, label: 'PODCAST', icon: Radio },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 border-t px-4 pt-3 pb-8 z-50 backdrop-blur-xl transition-colors duration-500 ${
      isDarkMode ? 'bg-black/95 border-white/5' : 'bg-white/95 border-[#0B1D33]/5 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]'
    }`}>
      <div className="flex justify-between items-center max-w-md mx-auto relative px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 relative ${
                isActive ? 'scale-110' : 'opacity-40 grayscale'
              }`}
            >
              {isActive && (
                <div className={`absolute -top-4 w-12 h-12 rounded-full blur-2xl opacity-30 animate-pulse ${
                  isDarkMode ? 'bg-yellow-400' : 'bg-[#0B1D33]'
                }`}></div>
              )}
              <div className={`p-1.5 rounded-full transition-all ${
                isActive 
                  ? isDarkMode ? 'bg-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]' : 'bg-[#0B1D33] text-white shadow-[0_0_20px_rgba(11,29,51,0.2)]'
                  : isDarkMode ? 'text-white' : 'text-[#0B1D33]'
              }`}>
                <Icon size={20} strokeWidth={isActive ? 3 : 2} />
              </div>
              <span className={`text-[8px] font-black tracking-widest ${
                isActive 
                  ? isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]' 
                  : 'text-gray-500'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
