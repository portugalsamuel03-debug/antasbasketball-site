
import React, { useState } from 'react';
import { Calendar, ChevronDown, Heart, MessageCircle, Clock, Bookmark } from 'lucide-react';
import { SortOption } from '../types';

interface SectionTitleProps {
  title: string;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  isDarkMode: boolean;
}

const SectionTitle: React.FC<React.PropsWithChildren<SectionTitleProps>> = ({ title, sortOption, onSortChange, isDarkMode, children }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const options: { id: SortOption; label: string; icon: any }[] = [
    { id: 'RECENTES', label: 'MAIS RECENTES', icon: Clock },
    { id: 'CURTIDOS', label: 'MAIS CURTIDOS', icon: Heart },
    { id: 'COMENTADOS', label: 'MAIS COMENTADOS', icon: MessageCircle },
    { id: 'SALVOS', label: 'SALVOS PARA LER', icon: Bookmark },
    { id: 'ANTIGOS', label: 'MAIS ANTIGOS', icon: Calendar },
  ];

  const activeOption = options.find(o => o.id === sortOption) || options[0];

  return (
    <div className="px-6 py-6 flex justify-between items-center relative">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-6 rounded-full shadow-lg ${isDarkMode ? 'bg-yellow-400 shadow-yellow-400/30' : 'bg-[#0B1D33] shadow-[#0B1D33]/20'
          }`}></div>
        <h2 className={`text-lg font-black tracking-widest uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'
          }`}>{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {children}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 p-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-500 hover:text-yellow-400 hover:bg-white/5' : 'text-gray-400 hover:text-[#0B1D33] hover:bg-black/5'
              }`}
            title={activeOption.label}
          >
            <activeOption.icon size={16} className={sortOption !== 'RECENTES' ? (isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]') : ''} />
            <ChevronDown size={12} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
              <div className={`absolute right-0 mt-2 w-48 border rounded-2xl shadow-2xl z-50 overflow-hidden py-1 transition-all ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white border-[#0B1D33]/10'
                }`}>
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onSortChange(opt.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-[10px] font-black tracking-widest uppercase transition-colors hover:bg-black/5 ${sortOption === opt.id
                      ? isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'
                      : 'text-gray-400'
                      }`}
                  >
                    <opt.icon size={14} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionTitle;
