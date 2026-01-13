
import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isAIProcessing?: boolean;
  isDarkMode: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isAIProcessing, isDarkMode }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSearch(value);
  };

  return (
    <div className="px-6 py-4">
      <form onSubmit={handleSubmit} className="relative group">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
          isDarkMode ? 'text-gray-500 group-focus-within:text-yellow-400' : 'text-gray-400 group-focus-within:text-[#0B1D33]'
        }`} size={20} />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Buscar no Antas Basketball..."
          className={`w-full border-none rounded-2xl py-4 pl-12 pr-12 text-sm outline-none transition-all ${
            isDarkMode 
              ? 'bg-gray-900 text-white focus:ring-2 focus:ring-yellow-400/50 placeholder:text-gray-600' 
              : 'bg-[#F0F2F5] text-[#0B1D33] focus:ring-2 focus:ring-[#0B1D33]/10 placeholder:text-gray-400'
          }`}
        />
        {isAIProcessing ? (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-pulse">
            <Sparkles size={18} className={isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'} />
          </div>
        ) : (
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2">
            <Sparkles size={18} className={`transition-colors ${
              isDarkMode ? 'text-gray-500 hover:text-yellow-400' : 'text-gray-400 hover:text-[#0B1D33]'
            }`} />
          </button>
        )}
      </form>
    </div>
  );
};

export default SearchBar;
