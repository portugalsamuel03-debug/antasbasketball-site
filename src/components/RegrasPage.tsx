import React, { useState, useMemo } from 'react';
import { Article } from '../types';
import { Repeat, CalendarDays, Hash, Trophy, ChevronRight, Search, Plus } from 'lucide-react';
import { RulePopupModal } from './RulePopupModal';
import { DraftLogicModal } from './DraftLogicModal';
import { EmptyState } from './EmptyState';
import SectionTitle from './SectionTitle';

interface RegrasPageProps {
    articles: Article[];
    isDarkMode: boolean;
    isEditing?: boolean;
    onEdit?: (id: string, category?: string) => void;
}

type MenuTema = 'TRADES' | 'DRAFT' | 'PONTUAÇÃO' | 'LIGA';

export const RegrasPage: React.FC<RegrasPageProps> = ({ articles, isDarkMode, isEditing, onEdit }) => {
    const [activeTema, setActiveTema] = useState<MenuTema>('LIGA');
    const [selectedRule, setSelectedRule] = useState<Article | null>(null);
    const [showDraftLogic, setShowDraftLogic] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // Reset pagination when tab or search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [activeTema, searchQuery]);

    // Filter only REGRAS
    const rulesArticles = useMemo(() => articles.filter(a => a.category === 'REGRAS'), [articles]);

    // Derived content based on activeTema
    const currentRules = useMemo(() => {
        if (!activeTema) return [];
        return rulesArticles.filter(a => {
            const tagsLower = (a.tags || []).map(t => t.toLowerCase());
            const searchTag = activeTema.toLowerCase();
            const aSub = (a.subcategory || '').toLowerCase();

            // Map the menu to potential tags or subcategories
            if (activeTema === 'TRADES' && (aSub === 'trades' || tagsLower.includes('trades') || tagsLower.includes('trocas') || tagsLower.includes('trade'))) return true;
            if (activeTema === 'DRAFT' && (aSub === 'draft' || tagsLower.includes('draft') || tagsLower.includes('recrutamento'))) return true;
            if (activeTema === 'PONTUAÇÃO' && (aSub === 'pontuação' || aSub === 'pontuacao' || tagsLower.includes('pontuação') || tagsLower.includes('pontuacao') || tagsLower.includes('scout'))) return true;
            if (activeTema === 'LIGA' && (aSub === 'liga' || tagsLower.includes('liga') || tagsLower.includes('geral') || tagsLower.includes('regulamento'))) return true;

            // Fallback: If no tags match but it's a general rule, we can try to show it in 'LIGA'
            if (activeTema === 'LIGA' && tagsLower.includes('regras')) return true;

            // Also check title just in case
            if (a.title.toLowerCase().includes(searchTag)) return true;

            return false;
        }).filter(a => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
                a.title?.toLowerCase().includes(q) ||
                a.description?.toLowerCase().includes(q)
            );
        });
    }, [rulesArticles, activeTema, searchQuery]);

    const getIcon = (tema: MenuTema) => {
        switch (tema) {
            case 'TRADES': return <Repeat size={24} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />;
            case 'DRAFT': return <CalendarDays size={24} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />;
            case 'PONTUAÇÃO': return <Hash size={24} className={isDarkMode ? 'text-yellow-400' : 'text-yellow-500'} />;
            case 'LIGA': return <Trophy size={24} className={isDarkMode ? 'text-purple-400' : 'text-purple-600'} />;
        }
    };

    const menus: { id: MenuTema, label: string, desc: string }[] = [
        { id: 'LIGA', label: 'Liga & Regulamento', desc: 'Diretrizes gerais e conduta.' },
        { id: 'PONTUAÇÃO', label: 'Pontuação', desc: 'Critérios de scout e notas.' },
        { id: 'TRADES', label: 'Trades', desc: 'Regras de trocas e negociações.' },
        { id: 'DRAFT', label: 'Draft', desc: 'Loteria, picks e recrutamento.' },
    ];

    const totalPages = Math.ceil(currentRules.length / ITEMS_PER_PAGE);
    const paginatedRules = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return currentRules.slice(start, start + ITEMS_PER_PAGE);
    }, [currentRules, currentPage]);

    return (
        <div className="animate-in fade-in duration-300 relative">
            <SectionTitle
                title="REGRAS"
                sortOption="RECENTES"
                onSortChange={() => { }}
                isDarkMode={isDarkMode}
            />

            {/* Menu Grid */}
            <div className={`py-6 border-b border-white/5 ${isDarkMode ? 'bg-black/95' : 'bg-[#FDFBF4]/95'}`}>
                <div className="w-full max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {menus.map(m => {
                            const isActive = activeTema === m.id;
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => setActiveTema(m.id)}
                                    className={`relative p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 ${isActive
                                        ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/20 scale-[1.02]'
                                        : isDarkMode
                                            ? 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                                            : 'bg-white border-gray-100 text-gray-500 hover:border-yellow-400/50 hover:text-[#0B1D33]'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${isActive ? 'bg-black/10' : isDarkMode ? 'bg-black/20' : 'bg-gray-50'}`}>
                                        {getIcon(m.id)}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">
                                        {m.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="px-6 pb-20 pt-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className={`flex items-center gap-2 p-3 rounded-2xl border flex-1 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder={`Buscar em ${activeTema}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder-gray-500"
                            style={{ color: isDarkMode ? 'white' : 'black' }}
                        />
                    </div>
                    {isEditing && onEdit && (
                        <button
                            onClick={() => onEdit('', 'REGRAS')}
                            className={`p-3 rounded-2xl flex items-center justify-center shrink-0 transition-transform active:scale-95 ${isDarkMode ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-[#0B1D33] text-white hover:bg-yellow-400 hover:text-black'}`}
                            title="Adicionar Nova Regra"
                        >
                            <Plus size={20} />
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    {activeTema === 'DRAFT' && (
                        // Special Logic Card for Draft
                        <div
                            onClick={() => setShowDraftLogic(true)}
                            className={`p-5 rounded-[24px] cursor-pointer border-2 transition-all active:scale-95 flex items-center gap-4 relative overflow-hidden
                                ${isDarkMode ? 'bg-[#121212] border-yellow-500/20 hover:border-yellow-500/50' : 'bg-white border-blue-500/20 hover:border-blue-500/50 shadow-md'}`}
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none ${isDarkMode ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                            <div className={`w-14 h-14 rounded-[16px] flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-50 text-blue-600'}`}>
                                <Hash size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className={`text-sm md:text-base font-black uppercase tracking-tighter mb-1 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                    Lógica do Draft
                                </h3>
                                <p className={`text-[10px] md:text-[11px] font-medium leading-tight ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Veja a tabela interativa de chances (loteria) com os times ativos.
                                </p>
                            </div>
                            <ChevronRight size={20} className={`${isDarkMode ? 'text-yellow-500' : 'text-blue-500'} transition-colors`} />
                        </div>
                    )}

                    {paginatedRules.length === 0 ? (
                        <div className="py-8">
                            <EmptyState isDarkMode={isDarkMode} message={`Nenhuma regra encontrada.`} />
                        </div>
                    ) : (
                        paginatedRules.map(a => (
                            <div
                                key={a.id}
                                onClick={() => setSelectedRule(a)}
                                className={`p-4 rounded-[24px] cursor-pointer border-2 transition-all active:scale-95 flex gap-4 group
                                    ${isDarkMode ? 'bg-[#121212] border-white/5 hover:border-yellow-500/30' : 'bg-white border-transparent shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-blue-500/30'}`}
                            >
                                <div className="w-20 h-20 rounded-[16px] overflow-hidden shrink-0 relative bg-gray-100 dark:bg-[#1a1a1a]">
                                    {a.imageUrl ? (
                                        <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-yellow-500 opacity-50">
                                            {getIcon(activeTema)}
                                        </div>
                                    )}
                                    {/* Overlay Icon */}
                                    <div className="absolute top-1 left-1 bg-black/50 backdrop-blur-sm p-1.5 rounded-lg border border-white/10">
                                        {React.cloneElement(getIcon(activeTema) as any, { size: 12, className: 'text-white' })}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 py-1">
                                    <h3 className={`text-[13px] md:text-[15px] font-black uppercase tracking-tight leading-snug mb-1 line-clamp-2 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                        {a.title}
                                    </h3>
                                    <p className={`text-[10px] md:text-[11px] font-medium leading-tight line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {a.description}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-white/10 text-gray-300' : 'bg-black/5 text-gray-600'}`}>
                                            #LEITURA
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-8">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === 1
                                ? 'opacity-30 cursor-not-allowed'
                                : 'active:scale-95 hover:bg-yellow-400 hover:text-black'
                                } ${isDarkMode ? 'bg-white/10 text-white' : 'bg-[#0B1D33]/10 text-[#0B1D33]'}`}
                        >
                            Anterior
                        </button>

                        <span className={`text-[10px] font-black tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            PÁGINA {currentPage} DE {totalPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === totalPages
                                ? 'opacity-30 cursor-not-allowed'
                                : 'active:scale-95 hover:bg-yellow-400 hover:text-black'
                                } ${isDarkMode ? 'bg-white/10 text-white' : 'bg-[#0B1D33]/10 text-[#0B1D33]'}`}
                        >
                            Próxima
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            {selectedRule && (
                <RulePopupModal
                    article={selectedRule}
                    isDarkMode={isDarkMode}
                    onClose={() => setSelectedRule(null)}
                    isEditing={isEditing}
                    onEdit={(id) => {
                        setSelectedRule(null);
                        if (onEdit) onEdit(id, 'REGRAS');
                    }}
                />
            )}

            {showDraftLogic && (
                <DraftLogicModal
                    isDarkMode={isDarkMode}
                    onClose={() => setShowDraftLogic(false)}
                />
            )}
        </div>
    );
};
