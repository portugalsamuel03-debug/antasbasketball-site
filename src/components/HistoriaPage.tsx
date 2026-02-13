import React, { useState, useEffect } from 'react';
import { Article, Champion, HallOfFame, TeamRow } from '../types';
import { listChampions, upsertChampion, deleteChampion, listHallOfFame, upsertHallOfFame, deleteHallOfFame } from '../cms';
import ArticleCard from './ArticleCard';
import SectionTitle from './SectionTitle';
import { EditTrigger } from './admin/EditTrigger';
import { useAdmin } from '../context/AdminContext';
import { Trophy, Crown, BookOpen, FileText, Medal, Calendar, Award, Shield, Briefcase, Zap, Search } from 'lucide-react';
import { HallOfFameDetailsModal } from './admin/HallOfFameDetailsModal';
import { AwardsSection } from './admin/AwardsSection';
import { TradesSection } from './admin/TradesSection';
import { ChampionDetailsModal } from './admin/ChampionDetailsModal';
import { ManagersSection } from './admin/ManagersSection';
import { RecordsSection } from './admin/RecordsSection';
import { SeasonsSection } from './admin/SeasonsSection';
import { TeamsSection } from './admin/TeamsSection';
import { HistoryStoryModal } from './HistoryStoryModal';

interface HistoriaPageProps {
    articles: Article[];
    isDarkMode: boolean;
    onArticleClick: (article: Article) => void;
    onShare: (article: Article) => void;
    onEditArticle: (id: string, section?: string) => void;
}

type SubTab = 'ARTIGOS' | 'CAMPEOES' | 'HALL_OF_FAME' | 'TIMES' | 'AWARDS' | 'TRADES' | 'GESTORES' | 'RECORDES' | 'TEMPORADAS';

// --- CHAMPIONS SECTION ---
const ChampionsSection: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const [champions, setChampions] = useState<Champion[]>([]);
    const { isEditing } = useAdmin();
    const [selectedChampion, setSelectedChampion] = useState<Partial<Champion> | null>(null);

    const fetchChampions = async () => {
        const { data } = await listChampions();
        if (data) setChampions(data as Champion[]);
    };

    useEffect(() => { fetchChampions(); }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Apagar campeão?')) {
            await deleteChampion(id);
            fetchChampions();
        }
    };

    return (
        <div className="space-y-4 px-6 pb-20">
            <div className="flex justify-between items-center">
                <div className="text-xs font-black uppercase tracking-widest text-gray-500">Galeria de Campeões</div>
                {isEditing && <EditTrigger type="add" onClick={() => setSelectedChampion({})} />}
            </div>

            <div className="grid gap-4">
                {champions.map((c) => (
                    <div
                        key={c.id}
                        onClick={() => setSelectedChampion(c)}
                        className={`relative p-5 rounded-[32px] border cursor-pointer transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-[#0B1D33]/10 hover:bg-[#0B1D33]/5'} flex flex-col gap-4 group overflow-hidden`}
                    >
                        {isEditing && (
                            <div className="absolute top-4 right-4 z-10 flex gap-1">
                                <EditTrigger type="delete" size={14} onClick={(e) => handleDelete(c.id, e)} />
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                                {c.logo_url ? (
                                    <img src={c.logo_url} className="w-full h-full object-contain" alt="Logo" />
                                ) : (
                                    <Trophy size={32} className="text-yellow-500/20" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-3xl font-black italic text-yellow-500 leading-none">{c.year}</span>
                                    <Trophy size={16} className="text-yellow-500" />
                                </div>
                                <div className={`text-xl font-black uppercase leading-none ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{c.team}</div>
                                <div className={`flex flex-wrap items-center gap-3 text-sm font-bold tracking-widest mt-1 opacity-50 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                    <span>SCORE: {c.score}</span>
                                    {c.runner_up_team && (
                                        <div className="flex items-center gap-1.5 pl-3 border-l-2 border-current">
                                            {c.runner_up_team.logo_url && (
                                                <img src={c.runner_up_team.logo_url} className="w-5 h-5 object-contain opacity-80" alt={c.runner_up_team.name} />
                                            )}
                                            <span className="text-[10px] sm:text-xs text-red-400">VICE: {c.runner_up_team.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Manager / MVP Section */}
                        <div className={`p-3 rounded-2xl flex items-center gap-3 ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'}`}>
                            {c.manager ? (
                                <>
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-yellow-500/50">
                                        <img src={c.manager.image_url} alt={c.manager.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <div className="text-[8px] font-bold text-yellow-500 uppercase tracking-wider">Gestor</div>
                                        <div className={`text-xs font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{c.manager.name}</div>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <div className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">MVP</div>
                                    <div className={`text-xs font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{c.mvp}</div>
                                </div>
                            )}
                        </div>

                        {/* Historic Players (Big Three) */}
                        {c.historic_players && c.historic_players.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {c.historic_players.map((p: any, i: number) => {
                                    const name = typeof p === 'string' ? p : p.name;
                                    if (!name) return null;
                                    return (
                                        <span key={i} className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${isDarkMode ? 'bg-white/10 text-gray-300' : 'bg-black/5 text-gray-600'}`}>
                                            {name}
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {selectedChampion && (
                <ChampionDetailsModal
                    champion={selectedChampion}
                    isDarkMode={isDarkMode}
                    onClose={() => setSelectedChampion(null)}
                    onUpdate={fetchChampions}
                />
            )}
        </div>
    );
};

// --- HALL OF FAME SECTION ---
const HallOfFameSection: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const [hofMembers, setHofMembers] = useState<HallOfFame[]>([]);
    const { isEditing } = useAdmin();
    const [selectedMember, setSelectedMember] = useState<HallOfFame | null>(null);

    const fetchHoF = async () => {
        const { data } = await listHallOfFame();
        if (data) setHofMembers(data as HallOfFame[]);
    };

    useEffect(() => { fetchHoF(); }, []);

    const handleCreate = () => {
        const newMember: HallOfFame = { id: '', name: '', year_inducted: '2026', role: '', achievement: '', image_url: '' };
        setSelectedMember(newMember);
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Remover do Hall da Fama?')) {
            await deleteHallOfFame(id);
            fetchHoF();
        }
    };

    return (
        <div className="space-y-4 px-6 pb-20">
            <div className="flex justify-between items-center">
                <div className="text-xs font-black uppercase tracking-widest text-gray-500">Lendas do Antas</div>
                {isEditing && <EditTrigger type="add" onClick={handleCreate} />}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {hofMembers.map((m) => (
                    <div
                        key={m.id}
                        onClick={() => setSelectedMember(m)}
                        className={`relative p-4 rounded-[24px] border flex flex-col items-center text-center gap-3 group cursor-pointer transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-[#0B1D33]/10 hover:bg-[#0B1D33]/5'}`}
                    >
                        {isEditing && (
                            <div className="absolute -top-2 -right-2 z-10 flex gap-1">
                                <EditTrigger type="delete" size={14} onClick={(e) => handleDelete(m.id, e)} />
                            </div>
                        )}
                        <div className="relative w-20 h-20">
                            <img src={m.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`} alt={m.name} className="w-full h-full rounded-full object-cover border-2 border-yellow-500/20" />
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-black border-2 border-black">
                                <Crown size={14} fill="black" />
                            </div>
                        </div>
                        <div>
                            <div className={`text-sm font-black uppercase leading-tight ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{m.name}</div>
                            <div className="text-[10px] font-bold text-yellow-500 mt-1 uppercase">{m.year_inducted}</div>
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium line-clamp-2 px-2">
                            {m.role} • {m.achievement}
                        </div>
                    </div>
                ))}
            </div>

            {selectedMember && (
                <HallOfFameDetailsModal
                    member={selectedMember}
                    isDarkMode={isDarkMode}
                    onClose={() => setSelectedMember(null)}
                    onUpdate={() => {
                        setSelectedMember(null);
                        fetchHoF();
                    }}
                />
            )}
        </div>
    );
};


const HistoriaPage: React.FC<HistoriaPageProps> = ({ articles, isDarkMode, onArticleClick, onShare, onEditArticle }) => {
    const { isEditing } = useAdmin();
    const [subTab, setSubTab] = useState<SubTab>('ARTIGOS');
    const [showStory, setShowStory] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredArticles = articles.filter(article => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            article.title?.toLowerCase().includes(q) ||
            article.description?.toLowerCase().includes(q) ||
            article.author?.toLowerCase().includes(q)
        );
    });

    const getTabIcon = (tab: SubTab) => {
        switch (tab) {
            case 'ARTIGOS': return <FileText size={18} />;
            case 'CAMPEOES': return <Trophy size={18} />;
            case 'RECORDES': return <Zap size={18} />;
            case 'TEMPORADAS': return <Calendar size={18} />;
            case 'HALL_OF_FAME': return <Crown size={18} />;
            case 'AWARDS': return <Award size={18} />;
            case 'TIMES': return <Shield size={18} />;
            case 'GESTORES': return <Briefcase size={18} />;
            default: return <BookOpen size={18} />;
        }
    };

    const getTabLabel = (tab: SubTab) => {
        switch (tab) {
            case 'HALL_OF_FAME': return 'Lendas';
            default: return tab.replace(/_/g, ' ');
        }
    }

    return (
        <>
            <div className="relative">
                <SectionTitle
                    title="HISTÓRIA"
                    sortOption="RECENTES"
                    onSortChange={() => { }}
                    isDarkMode={isDarkMode}
                >
                    <button
                        onClick={() => setShowStory(true)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${isDarkMode ? 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20' : 'bg-[#0B1D33]/5 text-[#0B1D33] hover:bg-[#0B1D33]/10'}`}
                    >
                        <BookOpen size={14} strokeWidth={2.5} />
                        <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Nossa História</span>
                    </button>
                </SectionTitle>
            </div>

            {/* Menu Grid */}
            <div className={`py-6 border-b border-white/5 ${isDarkMode ? 'bg-black/95' : 'bg-[#FDFBF4]/95'}`}>
                <div className="w-full max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(['ARTIGOS', 'CAMPEOES', 'RECORDES', 'TEMPORADAS', 'HALL_OF_FAME', 'AWARDS', 'TIMES', 'GESTORES'] as SubTab[]).map(tab => {
                            const isActive = subTab === tab;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setSubTab(tab)}
                                    className={`relative p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 ${isActive
                                        ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/20 scale-[1.02]'
                                        : isDarkMode
                                            ? 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                                            : 'bg-white border-gray-100 text-gray-500 hover:border-yellow-400/50 hover:text-[#0B1D33]'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${isActive ? 'bg-black/10' : isDarkMode ? 'bg-black/20' : 'bg-gray-50'}`}>
                                        {getTabIcon(tab)}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">
                                        {getTabLabel(tab)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {subTab === 'ARTIGOS' && (
                <div className="px-6 space-y-4 pb-20">
                    {/* Search Bar for Articles */}
                    <div className={`flex items-center gap-2 p-3 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar artigos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder-gray-500"
                            style={{ color: isDarkMode ? 'white' : 'black' }}
                        />
                    </div>

                    {isEditing && (
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Admin: Historia</div>
                            <EditTrigger type="add" onClick={() => onEditArticle('', 'HISTORIA')} />
                        </div>
                    )}
                    {filteredArticles.length === 0 ? (
                        <div className="text-sm text-gray-400 text-center py-8">
                            {searchQuery ? "Nenhum artigo encontrado." : "Nenhum artigo de história ainda."}
                        </div>
                    ) : (
                        filteredArticles.map(a => (
                            <ArticleCard
                                key={a.id}
                                article={a}
                                onClick={() => onArticleClick(a)}
                                onShare={onShare}
                                isDarkMode={isDarkMode}
                                isAdmin={isEditing}
                                onEdit={onEditArticle}
                            />
                        ))
                    )}
                </div>
            )}

            {subTab === 'CAMPEOES' && <ChampionsSection isDarkMode={isDarkMode} />}
            {subTab === 'RECORDES' && <RecordsSection isDarkMode={isDarkMode} />}
            {subTab === 'TEMPORADAS' && <SeasonsSection isDarkMode={isDarkMode} />}
            {subTab === 'HALL_OF_FAME' && <HallOfFameSection isDarkMode={isDarkMode} />}
            {subTab === 'AWARDS' && <AwardsSection isDarkMode={isDarkMode} />}
            {subTab === 'TRADES' && <TradesSection isDarkMode={isDarkMode} />}
            {subTab === 'TIMES' && <TeamsSection isDarkMode={isDarkMode} />}
            {subTab === 'GESTORES' && <ManagersSection isDarkMode={isDarkMode} />}

            {showStory && <HistoryStoryModal onClose={() => setShowStory(false)} isDarkMode={isDarkMode} />}
        </>
    );
};

export default HistoriaPage;
