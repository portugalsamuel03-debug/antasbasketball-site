
import React, { useState, useEffect } from 'react';
import { Article, Champion, HallOfFame, TeamRow } from '../types';
import { listChampions, upsertChampion, deleteChampion, listHallOfFame, upsertHallOfFame, deleteHallOfFame, listTeams, upsertTeam, deleteTeam } from '../cms';
import ArticleCard from './ArticleCard';
import SectionTitle from './SectionTitle';
import { EditTrigger } from './admin/EditTrigger';
import { useAdmin } from '../context/AdminContext';
import { Trophy, Crown } from 'lucide-react';
import { HallOfFameDetailsModal } from './admin/HallOfFameDetailsModal';
import { AwardsSection } from './admin/AwardsSection';
import { TradesSection } from './admin/TradesSection';

interface HistoriaPageProps {
    articles: Article[];
    isDarkMode: boolean;
    onArticleClick: (article: Article) => void;
    onShare: (article: Article) => void;
    onEditArticle: (id: string) => void;
}

type SubTab = 'ARTIGOS' | 'CAMPEOES' | 'HALL_OF_FAME' | 'TIMES';

// --- CHAMPIONS SECTION ---
import { ChampionDetailsModal } from './admin/ChampionDetailsModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';

const ChampionsSection: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const [champions, setChampions] = useState<Champion[]>([]);
    // ...    // ...    const { isEditing } = useAdmin();
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
                        className={`relative p-5 rounded-[24px] border cursor-pointer transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-[#0B1D33]/10 hover:bg-[#0B1D33]/5'} flex items-center justify-between group`}
                    >
                        {isEditing && (
                            <div className="absolute -top-2 -right-2 z-10 flex gap-1">
                                <EditTrigger type="delete" size={14} onClick={(e) => handleDelete(c.id, e)} />
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                                {c.logo_url ? (
                                    <img src={c.logo_url} className="w-full h-full object-contain" alt="Logo" />
                                ) : (
                                    <Trophy size={24} className="text-yellow-500/20" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl font-black italic text-yellow-500">{c.year}</span>
                                    <Trophy size={16} className="text-yellow-500" />
                                </div>
                                <div className={`text-lg font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{c.team}</div>
                                <div className="text-xs font-bold text-gray-500 mt-1">MVP: {c.mvp}</div>
                            </div>
                        </div>
                        <div className={`text-xl font-black tracking-widest ${isDarkMode ? 'text-white/20' : 'text-[#0B1D33]/20'}`}>{c.score}</div>
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

// --- TEAMS SECTION ---
import { TeamDetailsModal } from './admin/TeamDetailsModal';

const TeamsSection: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const [teams, setTeams] = useState<TeamRow[]>([]);
    const { isEditing } = useAdmin();
    const [selectedTeam, setSelectedTeam] = useState<Partial<TeamRow> | null>(null);

    const fetchTeams = async () => {
        const { data } = await listTeams();
        if (data) setTeams(data as TeamRow[]);
    };

    useEffect(() => { fetchTeams(); }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Apagar este time?')) {
            await deleteTeam(id);
            fetchTeams();
        }
    };

    return (
        <div className="space-y-4 px-6 pb-20">
            <div className="flex justify-between items-center">
                <div className="text-xs font-black uppercase tracking-widest text-gray-500">Lista de Times</div>
                {isEditing && <EditTrigger type="add" onClick={() => setSelectedTeam({})} />}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {teams.map((t) => (
                    <div
                        key={t.id}
                        onClick={() => setSelectedTeam(t)}
                        className={`relative p-5 rounded-[24px] border flex flex-col items-center text-center gap-3 cursor-pointer transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-[#0B1D33]/10 hover:bg-[#0B1D33]/5'}`}
                    >
                        {isEditing && (
                            <div className="absolute -top-2 -right-2 z-10">
                                <EditTrigger type="delete" size={14} onClick={(e) => handleDelete(t.id, e)} />
                            </div>
                        )}
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center p-2">
                            {t.logo_url ? <img src={t.logo_url} className="w-full h-full object-contain" /> : <Trophy className="text-yellow-500/20" />}
                        </div>
                        <div className={`text-xs font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{t.name}</div>
                    </div>
                ))}
            </div>

            {selectedTeam && (
                <TeamDetailsModal
                    team={selectedTeam}
                    isDarkMode={isDarkMode}
                    onClose={() => setSelectedTeam(null)}
                    onUpdate={fetchTeams}
                />
            )}
        </div>
    );
}

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
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = direction === 'left' ? -200 : 200;
            // Use directly scrollLeft for reliability
            scrollRef.current.scrollLeft += amount;
        }
    };

    return (
        <>
            <SectionTitle
                title="HISTÓRIA"
                sortOption="RECENTES"
                onSortChange={() => { }}
                isDarkMode={isDarkMode}
            />

            {/* SubTabs with Arrows */}
            <div className={`sticky top-[52px] z-30 py-2 border-b border-white/10 ${isDarkMode ? 'bg-black/95 backdrop-blur-md' : 'bg-[#FDFBF4]/95 backdrop-blur-md'}`}>
                <div className="relative flex items-center px-2">
                    <button
                        className="p-2 z-10 shrink-0 hover:bg-white/10 rounded-full transition-colors"
                        onClick={() => scroll('left')}
                    >
                        <ChevronLeft size={16} className={isDarkMode ? 'text-white' : 'text-black'} />
                    </button>

                    <div ref={scrollRef} className="flex-1 overflow-x-auto flex items-center px-2 no-scrollbar gap-2 scroll-smooth">
                        {(['ARTIGOS', 'CAMPEOES', 'HALL_OF_FAME', 'AWARDS', 'TRADES', 'TIMES'] as SubTab[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setSubTab(tab)}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${subTab === tab
                                    ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 scale-105'
                                    : isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-[#0B1D33]/5 text-gray-500'
                                    }`}
                            >
                                {tab.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>

                    <button
                        className="p-2 z-10 shrink-0 hover:bg-white/10 rounded-full transition-colors"
                        onClick={() => scroll('right')}
                    >
                        <ChevronRight size={16} className={isDarkMode ? 'text-white' : 'text-black'} />
                    </button>
                </div>
            </div>

            {subTab === 'ARTIGOS' && (
                <div className="px-6 space-y-4 pb-20">
                    {isEditing && (
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Admin: Historia</div>
                            <EditTrigger type="add" onClick={() => onEditArticle('', 'HISTORIA')} />
                        </div>
                    )}
                    {articles.length === 0 ? (
                        <div className="text-sm text-gray-400">Nenhum artigo de história ainda.</div>
                    ) : (
                        articles.map(a => (
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
            {subTab === 'HALL_OF_FAME' && <HallOfFameSection isDarkMode={isDarkMode} />}
            {subTab === 'AWARDS' && <AwardsSection isDarkMode={isDarkMode} />}
            {subTab === 'TRADES' && <TradesSection isDarkMode={isDarkMode} />}
            {subTab === 'TIMES' && <TeamsSection isDarkMode={isDarkMode} />}
        </>
    );
};

export default HistoriaPage;
