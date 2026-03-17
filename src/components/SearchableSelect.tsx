import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface Option {
    id: string;
    name: string;
    logo_url?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    isDarkMode?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Selecione...',
    isDarkMode = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.id === value);

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const handleSelect = (id: string) => {
        onChange(id);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-3 border-b text-sm font-bold transition-all ${
                    isDarkMode
                        ? 'border-white/10 text-white focus:border-yellow-400'
                        : 'border-[#0B1D33]/10 text-[#0B1D33] focus:border-[#0B1D33]'
                }`}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption ? (
                        <>
                            {selectedOption.logo_url && (
                                <img src={selectedOption.logo_url} className="w-5 h-5 object-contain" alt="" />
                            )}
                            <span className="truncate">{selectedOption.name}</span>
                        </>
                    ) : (
                        <span className={isDarkMode ? 'text-gray-700' : 'text-gray-300'}>{placeholder}</span>
                    )}
                </div>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute z-[110] left-0 right-0 mt-2 rounded-2xl shadow-2xl overflow-hidden border animate-in fade-in zoom-in-95 duration-200 ${
                    isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-black/5'
                }`}>
                    <div className={`flex items-center gap-2 p-3 border-b ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}>
                        <Search size={14} className="text-gray-500 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full bg-transparent border-none text-xs font-bold focus:outline-none text-inherit placeholder:text-gray-500"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => handleSelect(opt.id)}
                                    className={`w-full flex items-center justify-between p-3 text-left text-xs font-bold transition-colors ${
                                        value === opt.id
                                            ? (isDarkMode ? 'bg-yellow-400 text-black' : 'bg-yellow-400 text-black')
                                            : (isDarkMode ? 'hover:bg-white/5 text-white' : 'hover:bg-black/5 text-[#0B1D33]')
                                    }`}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        {opt.logo_url && (
                                            <img src={opt.logo_url} className="w-5 h-5 object-contain" alt="" />
                                        )}
                                        <span className="truncate">{opt.name}</span>
                                    </div>
                                    {value === opt.id && <Check size={14} />}
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                Nenhum resultado
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
