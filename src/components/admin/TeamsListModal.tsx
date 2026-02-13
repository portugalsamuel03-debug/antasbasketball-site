import React, { useState } from 'react';
import { TeamRow } from '../../types';
import { Users, Trophy, ChevronLeft, ChevronRight, X, Search, Briefcase, Trash2, Shield } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

interface TeamsListModalProps {
    teams: TeamRow[];
    initialTab: 'ACTIVE' | 'HISTORIC';
    isDarkMode: boolean;
    onClose: () => void;
    onSelectTeam: (team: TeamRow) => void;
    onDeleteTeam: (id: string, e: React.MouseEvent) => void;
    teamTrades: Record<string, number>;
}

const ITEMS_PER_PAGE = 10;

export const TeamsListModal: React.FC<TeamsListModalProps> = ({
    teams,
    initialTab,
    isDarkMode,
    onClose,
    onSelectTeam,
    onDeleteTeam,
    teamTrades
}) => {
    const { isEditing } = useAdmin();
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORIC'>(initialTab);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTeams = teams.filter(t => {
        const matchesTab = activeTab === 'ACTIVE' ? (t.is_active !== false) : (t.is_active === false);
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    }).sort((a, b) => a.name.localeCompare(b.name));

    const totalPages = Math.ceil(filteredTeams.length / ITEMS_PER_PAGE);
    const paginatedTeams = filteredTeams.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const TeamCard = ({ team }: { team: TeamRow }) => {
        const trades = teamTrades[team.id] || 0;

        return (
            <div
                className={`relative rounded-3xl overflow-hidden shadow-lg group cursor-pointer transition-transform hover:scale-[1.01] ${isDarkMode ? 'bg-[#1a2c42]' : 'bg-white'} `}
                onClick={() => onSelectTeam(team)}
            >
                {/* Background Gradient */}
                <div className={`absolute inset-0 opacity-10 ${isDarkMode ? 'bg-white' : 'bg-black'} `} />

                <div className="relative p-3 flex items-center gap-4 text-left">
                    {/* Team Logo */}
                    <div className="relative">
                        <div className={`w-12 h-12 rounded-2xl overflow-hidden shadow-sm flex-shrink-0 bg-white/5 flex items-center justify-center p-1 ${team.is_active !== false ? 'border-yellow-400 border-2' : 'border-gray-500 border grayscale'} `}>
                            {team.logo_url ? (
                                <img src={team.logo_url} alt={team.name} className="w-full h-full object-contain" />
                            ) : (
                                <Shield size={20} className="text-gray-400" />
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className={`text-base font-black uppercase leading-none truncate mb-1 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'} `}>
                            {team.name}
                        </h3>
                        {team.manager ? (
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide truncate">
                                Gestor: {team.manager.name}
                            </p>
                        ) : team.gm_name ? (
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide truncate">
                                GM: {team.gm_name}
                            </p>
                        ) : null}
                    </div>

                    {/* Stats - Compact */}
                    <div className="hidden sm:flex items-center gap-3 text-[9px] text-gray-400">
                        {trades > 0 && (
                            <div className="flex items-center gap-1">
                                <Briefcase size={10} className="text-yellow-400" />
                                <span>{trades} Trades</span>
                            </div>
                        )}
                    </div>

                    {/* Chevron Hint */}
                    <div className="opacity-0 group-hover:opacity-50 transition-opacity hidden sm:block ml-2">
                        <ChevronRight size={16} className={isDarkMode ? 'text-white' : 'text-gray-400'} />
                    </div>
                </div>

                {isEditing && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button
                            onClick={(e) => onDeleteTeam(team.id, e)}
                            className="p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition"
                        >
                            <Trash2 size={10} />
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
                            {activeTab === 'ACTIVE' ? <Shield size={24} className="text-yellow-500" /> : <Trophy size={24} className="text-gray-400" />}
                        </div>
                        <div>
                            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">
                                {filteredTeams.length} Times
                            </div>
                            <h2 className={`text-2xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                {activeTab === 'ACTIVE' ? 'Times Ativos' : 'Times Históricos'}
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
                        Times Ativos
                    </button>
                    <button
                        onClick={() => { setActiveTab('HISTORIC'); setCurrentPage(1); }}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'HISTORIC'
                            ? 'bg-[#0B1D33] text-white'
                            : isDarkMode ? 'text-gray-500 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-50'
                            }`}
                    >
                        Times Históricos
                    </button>
                </div>

                {/* Search Bar */}
                <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isDarkMode ? 'bg-white/5 focus-within:bg-white/10' : 'bg-gray-50 focus-within:bg-gray-100'}`}>
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="BUSCAR TIME..."
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
                    {paginatedTeams.length > 0 ? (
                        paginatedTeams.map(team => (
                            <TeamCard key={team.id} team={team} />
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500 italic">
                            Nenhum time encontrado.
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
