
import React, { useState, useEffect } from 'react';
import { Article, Champion, HallOfFame, TeamRow } from '../types';
import { listChampions, upsertChampion, deleteChampion, listHallOfFame, upsertHallOfFame, deleteHallOfFame, listTeams, upsertTeam, deleteTeam } from '../cms';
import ArticleCard from './ArticleCard';
import SectionTitle from './SectionTitle';
import { EditTrigger } from './admin/EditTrigger';
import { useAdmin } from '../context/AdminContext';
import { Trophy, Crown } from 'lucide-react';
import { HallOfFameDetailsModal } from './admin/HallOfFameDetailsModal';

interface HistoriaPageProps {
    articles: Article[];
    isDarkMode: boolean;
    onArticleClick: (article: Article) => void;
    onShare: (article: Article) => void;
    onEditArticle: (id: string) => void;
}

type SubTab = 'ARTIGOS' | 'CAMPEOES' | 'HALL_OF_FAME';

// --- CHAMPIONS SECTION ---
const EditChampionModal: React.FC<{ champion: Partial<Champion>, isDarkMode: boolean, onClose: () => void, onSave: (d: Partial<Champion>) => void }> = ({ champion, isDarkMode, onClose, onSave }) => {
    const [formData, setFormData] = useState(champion);
    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative w-full max-w-sm border rounded-[32px] overflow-hidden shadow-xl p-6 space-y-4 ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white'}`}>
                <h3 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {champion.id ? 'Editar Campeão' : 'Novo Campeão'}
                </h3>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" placeholder="Ano" value={formData.year || ''} onChange={e => setFormData({ ...formData, year: e.target.value })} />
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" placeholder="Time Campeão" value={formData.team || ''} onChange={e => setFormData({ ...formData, team: e.target.value })} />
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" placeholder="MVP" value={formData.mvp || ''} onChange={e => setFormData({ ...formData, mvp: e.target.value })} />
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" placeholder="Placar (ex: 102 - 98)" value={formData.score || ''} onChange={e => setFormData({ ...formData, score: e.target.value })} />

                <div className="flex gap-2 pt-2">
                    <button onClick={onClose} className="flex-1 py-3 bg-white/5 rounded-xl text-xs font-black uppercase">Cancelar</button>
                    <button onClick={() => onSave(formData)} className="flex-1 py-3 bg-yellow-400 text-black rounded-xl text-xs font-black uppercase">Salvar</button>
                </div>
            </div>
        </div>
    );
}

const ChampionsSection: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const [champions, setChampions] = useState<Champion[]>([]);
    const { isEditing } = useAdmin();
    const [editingItem, setEditingItem] = useState<Partial<Champion> | null>(null);

    const fetchChampions = async () => {
        const { data } = await listChampions();
        if (data) setChampions(data as Champion[]);
    };

    useEffect(() => { fetchChampions(); }, []);

    const handleSave = async (data: Partial<Champion>) => {
        if (!data?.year) return;
        await upsertChampion(data);
        setEditingItem(null);
        fetchChampions();
    };

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
                <EditTrigger type="add" onClick={() => setEditingItem({})} />
            </div>

            <div className="grid gap-4">
                {champions.map((c) => (
                    <div key={c.id} className={`relative p-5 rounded-[24px] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-[#0B1D33]/10'} flex items-center justify-between group`}>
                        {isEditing && (
                            <div className="absolute -top-2 -right-2 z-10 flex gap-1">
                                <EditTrigger type="edit" size={14} onClick={() => setEditingItem(c)} />
                                <EditTrigger type="delete" size={14} onClick={(e) => handleDelete(c.id, e)} />
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl font-black italic text-yellow-500">{c.year}</span>
                                <Trophy size={16} className="text-yellow-500" />
                            </div>
                            <div className={`text-lg font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{c.team}</div>
                            <div className="text-xs font-bold text-gray-500 mt-1">MVP: {c.mvp}</div>
                        </div>
                        <div className={`text-xl font-black tracking-widest ${isDarkMode ? 'text-white/20' : 'text-[#0B1D33]/20'}`}>{c.score}</div>
                    </div>
                ))}
            </div>

            {editingItem && (
                <EditChampionModal
                    champion={editingItem}
                    isDarkMode={isDarkMode}
                    onClose={() => setEditingItem(null)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

// --- HALL OF FAME SECTION ---
// --- HALL OF FAME SECTION ---
const HallOfFameSection: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const [hofMembers, setHofMembers] = useState<HallOfFame[]>([]);
    const { isEditing } = useAdmin();
    // Reusing the same name for state, though now it handles both viewing and editing via the unified modal
    const [selectedMember, setSelectedMember] = useState<HallOfFame | null>(null);

    const fetchHoF = async () => {
        const { data } = await listHallOfFame();
        if (data) setHofMembers(data as HallOfFame[]);
    };

    useEffect(() => { fetchHoF(); }, []);

    const handleCreate = () => {
        // Create dummy member
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

    return (
        <>
            <SectionTitle
                title="HISTÓRIA"
                sortOption="RECENTES"
                onSortChange={() => { }}
                isDarkMode={isDarkMode}
            />

            {/* SubTabs */}
            <div className="px-6 mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {(['ARTIGOS', 'CAMPEOES', 'HALL_OF_FAME'] as SubTab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setSubTab(tab)}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${subTab === tab
                            ? 'bg-yellow-400 text-black'
                            : isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-[#0B1D33]/5 text-gray-500'
                            }`}
                    >
                        {tab.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>

            {subTab === 'ARTIGOS' && (
                <div className="px-6 space-y-4 pb-20">
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
                                isAdmin={isEditing} // show edit button if global edit mode is on
                                onEdit={onEditArticle}
                            />
                        ))
                    )}
                </div>
            )}

            {subTab === 'CAMPEOES' && <ChampionsSection isDarkMode={isDarkMode} />}
            {subTab === 'HALL_OF_FAME' && <HallOfFameSection isDarkMode={isDarkMode} />}
        </>
    );
};

export default HistoriaPage;
