import React, { useState } from 'react';
import { Manager } from './ManagersSection';
import { Users, Crown, ChevronLeft, ChevronRight, X, Briefcase, Award as AwardIcon, Trash2, Search } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

interface ManagersListModalProps {
    managers: Manager[];
    initialTab: 'ACTIVE' | 'LEGEND';
    isDarkMode: boolean;
    onClose: () => void;
    onSelectManager: (manager: Manager) => void;
    onDeleteManager: (id: string, e: React.MouseEvent) => void;
    onToggleActive: (manager: Manager, e: React.MouseEvent) => void;
    teamsMap: Record<string, any>;
    championCounts: Record<string, number>;
    hofIds: Set<string>;
    managerTrades: Record<string, number>;
    managerRecords: Record<string, { wins: number, losses: number }>;
}

const ITEMS_PER_PAGE = 10;

export const ManagersListModal: React.FC<ManagersListModalProps> = ({
    managers,
    initialTab,
    isDarkMode,
    onClose,
    onSelectManager,
    onDeleteManager,
    onToggleActive,
    teamsMap,
    championCounts,
    hofIds,
    managerTrades,
    managerRecords
}) => {
    const { isEditing } = useAdmin();
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'LEGEND'>(initialTab);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredManagers = managers.filter(m => {
        const matchesTab = activeTab === 'ACTIVE' ? (m.is_active !== false) : (m.is_active === false);
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    }).sort((a, b) => a.name.localeCompare(b.name));

    const totalPages = Math.ceil(filteredManagers.length / ITEMS_PER_PAGE);
    const paginatedManagers = filteredManagers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const ManagerCard = ({ manager }: { manager: Manager }) => {
        // Resolve Current Team
        const currentTeam = Object.values(teamsMap).find((t: any) => t.manager_id === manager.id && t.is_active !== false);

        // Resolve Titles
        const titleCount = championCounts[manager.id] || 0;
        const isHoF = hofIds.has(manager.id);

        const parts = [];
        if (titleCount > 0) parts.push(`${titleCount}x Campeão`);
        const titleText = parts.join(' • ');

        return (
            <div
                className={`relative rounded-3xl overflow-hidden shadow-lg group cursor-pointer transition-transform hover:scale-[1.01] ${isDarkMode ? 'bg-[#1a2c42]' : 'bg-white'} `}
                onClick={() => onSelectManager(manager)}
            >
                {/* Background Gradient */}
                <div className={`absolute inset-0 opacity-10 ${isDarkMode ? 'bg-white' : 'bg-black'} `} />

                <div className="relative p-3 flex items-center gap-4 text-left">
                    {/* Manager Image */}
                    <div className="relative">
                        <div className={`w-12 h-12 rounded-full border-2 overflow-hidden shadow-sm flex-shrink-0 bg-gray-300 ${manager.is_active !== false ? 'border-yellow-400' : 'border-gray-500 grayscale'} `}>
                            {manager.image_url ? (
                                <img src={manager.image_url} alt={manager.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <Users size={16} />
                                </div>
                            )}
                        </div>
                        {isHoF && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center text-yellow-400 border border-yellow-400 shadow-sm z-10" title="Hall of Fame">
                                <Crown size={8} fill="currentColor" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className={`text-base font-black uppercase leading-none truncate ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'} `}>
                                {manager.name}
                            </h3>
                            {isHoF && <Crown size={12} className="text-yellow-500 flex-shrink-0" fill="currentColor" />}
                        </div>
                        {/* Mobile: Current Team below name */}
                        <div className="sm:hidden mt-0.5">
                            {currentTeam ? (
                                <div className="flex items-center gap-1">
                                    <Briefcase size={10} className="text-yellow-400" />
                                    <span className="uppercase text-[9px] font-bold tracking-wider text-gray-500">{currentTeam.name}</span>
                                </div>
                            ) : (
                                <div className="text-[9px] text-gray-400 italic">Sem clube</div>
                            )}
                        </div>
                        {/* Desktop: Current Team Badge */}
                        <div className="hidden sm:block">
                            {currentTeam && (
                                <span className="px-2 py-0.5 rounded bg-yellow-400 text-black text-[9px] font-bold uppercase tracking-wider">
                                    {currentTeam.name}
                                </span>
                            )}
                        </div>
                        {manager.bio ? (
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide truncate">
                                {manager.bio}
                            </p>
                        ) : null}
                    </div>

                    {/* Stats - Compact */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 text-[9px] text-gray-400 mt-2 sm:mt-0">
                        {isEditing && (
                            <button
                                onClick={(e) => onToggleActive(manager, e)}
                                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${manager.is_active !== false ? 'border-green-500 text-green-500 hover:bg-green-500/10' : 'border-red-500 text-red-500 hover:bg-red-500/10'}`}
                            >
                                {manager.is_active !== false ? 'ATIVO' : 'INATIVO'}
                            </button>
                        )}

                        {/* Titles */}
                        {titleCount > 0 && (
                            <div className="flex items-center gap-1">
                                <AwardIcon size={10} className="text-yellow-400" />
                                <span className="font-bold text-yellow-500">{titleCount} Títulos</span>
                            </div>
                        )}

                        {/* Total Record */}
                        {managerRecords[manager.id] && (
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-gray-500">
                                    {managerRecords[manager.id].wins}V - {managerRecords[manager.id].losses}D
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chevron Hint */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity hidden sm:block">
                    <ChevronRight size={24} className={isDarkMode ? 'text-white' : 'text-gray-400'} />
                </div>

                {isEditing && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => onDeleteManager(manager.id, e)}
                            className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col h-[85vh] ${isDarkMode ? 'bg-[#121212]' : 'bg-white'}`}>

                {/* Header */}
                <div className={`p-8 border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'} flex justify-between items-center bg-inherit z-10`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                            {activeTab === 'ACTIVE' ? <Users size={24} className="text-yellow-500" /> : <Crown size={24} className="text-gray-400" />}
                        </div>
                        <div>
                            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">
                                {filteredManagers.length} Gestores
                            </div>
                            <h2 className={`text-2xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                {activeTab === 'ACTIVE' ? 'Gestores em Atividade' : 'Lendas & Históricos'}
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-3 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'}`}>
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className={`flex border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <button
                        onClick={() => { setActiveTab('ACTIVE'); setCurrentPage(1); }}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'ACTIVE'
                            ? 'bg-yellow-400 text-black'
                            : isDarkMode ? 'text-gray-500 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-50'
                            }`}
                    >
                        Em Atividade
                    </button>
                    <button
                        onClick={() => { setActiveTab('LEGEND'); setCurrentPage(1); }}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'LEGEND'
                            ? 'bg-[#0B1D33] text-white'
                            : isDarkMode ? 'text-gray-500 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-50'
                            }`}
                    >
                        Lendas & Históricos
                    </button>
                </div>

                {/* Search Bar */}
                <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isDarkMode ? 'bg-white/5 focus-within:bg-white/10' : 'bg-gray-50 focus-within:bg-gray-100'}`}>
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="BUSCAR GESTOR..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className={`flex-1 bg-transparent outline-none text-xs font-bold placeholder-gray-500 uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}
                        />
                        {searchQuery && (
                            <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }}>
                                <X size={14} className="text-gray-400 hover:text-red-400" />
                            </button>
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {paginatedManagers.length > 0 ? (
                        paginatedManagers.map(manager => (
                            <ManagerCard key={manager.id} manager={manager} />
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500 italic">
                            Nenhum gestor encontrado nesta categoria.
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className={`p-4 border-t flex justify-center items-center gap-4 ${isDarkMode ? 'border-white/5 bg-[#121212]' : 'border-gray-100 bg-white'}`}>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={`p-2 rounded-full transition-colors ${currentPage === 1 ? 'text-gray-600 cursor-not-allowed' : 'bg-yellow-400 text-black hover:bg-yellow-300'}`}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={`p-2 rounded-full transition-colors ${currentPage === totalPages ? 'text-gray-600 cursor-not-allowed' : 'bg-yellow-400 text-black hover:bg-yellow-300'}`}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
