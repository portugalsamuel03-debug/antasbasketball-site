import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { listTeams, listChampions, listAwards, listManagerHistory, upsertManagerHistory, deleteManagerHistory, listHallOfFame } from '../../cms';
import { TeamRow, Champion, Award, ManagerHistory, HallOfFame } from '../../types';
import { Plus, Trash2, Calendar, Briefcase, Trophy, ChevronRight, Crown, ArrowRightLeft, Award as AwardIcon } from 'lucide-react';
import { Manager } from './ManagersSection';
import { useAdmin } from '../../context/AdminContext';

// Import New Modals
import { ManagerSeasonsModal } from './ManagerSeasonsModal';
import { ManagerTitlesModal } from './ManagerTitlesModal';
import { ManagerTradesModal } from './ManagerTradesModal';
import { ManagerAwardsModal } from './ManagerAwardsModal';

interface ManagerDetailsModalProps {
    manager: Partial<Manager>;
    onClose: () => void;
    isDarkMode: boolean;
    onUpdate: () => void;
}

export const ManagerDetailsModal: React.FC<ManagerDetailsModalProps> = ({ manager, onClose, isDarkMode, onUpdate }) => {
    const { isEditing } = useAdmin();
    const [formData, setFormData] = useState<Partial<Manager>>({
        teams_managed_ids: [],
        ...manager,
        is_active: manager.is_active ?? true
    });
    const [msg, setMsg] = useState<string | null>(null);

    // Data filtering state
    const [allTeams, setAllTeams] = useState<TeamRow[]>([]);
    const [titlesCount, setTitlesCount] = useState(0);
    const [awardsCount, setAwardsCount] = useState(0);
    const [isHoF, setIsHoF] = useState(false);

    // History State
    const [history, setHistory] = useState<ManagerHistory[]>([]);
    const [newHistoryYear, setNewHistoryYear] = useState('');
    const [newHistoryTeam, setNewHistoryTeam] = useState('');

    // Trades Data
    const [totalTrades, setTotalTrades] = useState(0);

    // Popups State
    const [showSeasons, setShowSeasons] = useState(false);
    const [showTitles, setShowTitles] = useState(false);
    const [showTrades, setShowTrades] = useState(false);
    const [showAwards, setShowAwards] = useState(false);

    useEffect(() => {
        // Fetch Teams for dropdown
        listTeams().then(({ data }) => setAllTeams(data as TeamRow[] || []));

        // Fetch History if manager exists
        if (manager.id) {
            fetchHistory();
        }

        // Calculate Titles & Awards if manager has an ID
        if (manager.id) {
            // Champions
            listChampions().then(({ data }) => {
                const champions = data as Champion[] || [];
                // Only Count Wins for the Button Count
                const wins = champions.filter(c => c.manager_id === manager.id).length;
                setTitlesCount(wins);
            });

            // Awards
            listAwards().then(({ data }) => {
                const awards = data as Award[] || [];
                const count = awards.filter(a => a.manager_id === manager.id).length;
                setAwardsCount(count);
            });

            // Check Hall of Fame
            listHallOfFame().then(({ data }) => {
                const isMember = (data as HallOfFame[])?.some(h => h.manager_id === manager.id);
                setIsHoF(isMember || false);
            });
        }
    }, [manager.id]);

    const fetchHistory = async () => {
        if (!manager.id) return;
        const { data } = await listManagerHistory(manager.id);
        if (data) {
            setHistory(data);

            // Calculate Trades for this history
            const { data: seasonsData } = await supabase.from('seasons').select('id, year');
            const { data: standingsData } = await supabase.from('season_standings').select('season_id, team_id, trades_count');

            const seasonYearIdMap: Record<string, string> = {};
            seasonsData?.forEach((s: any) => seasonYearIdMap[s.year] = s.id);

            const standingsMap: Record<string, number> = {};
            standingsData?.forEach((st: any) => {
                standingsMap[`${st.season_id}-${st.team_id}`] = st.trades_count || 0;
            });

            let total = 0;
            data.forEach(h => {
                if (h.team_id && h.year) {
                    const sId = seasonYearIdMap[h.year];
                    if (sId) {
                        const count = standingsMap[`${sId}-${h.team_id}`] || 0;
                        if (count > 0) total += count;
                    }
                }
            });
            setTotalTrades(total);
        }
    };

    const handleAddHistory = async () => {
        if (!newHistoryYear || !manager.id) return;
        await upsertManagerHistory({
            manager_id: manager.id,
            year: newHistoryYear,
            team_id: newHistoryTeam || null
        });
        setNewHistoryYear('');
        setNewHistoryTeam('');
        fetchHistory();
    };

    const handleDeleteHistory = async (id: string) => {
        if (confirm('Remover este registro histórico?')) {
            await deleteManagerHistory(id);
            fetchHistory();
        }
    };

    const handleSave = async () => {
        setMsg(null);
        if (!formData.name) return;

        setMsg('Salvando...');

        try {
            const payload = { ...formData };
            if (!payload.id) delete (payload as any).id;

            const { data, error } = await supabase.from('managers').upsert(payload).select().single();

            if (error) throw error;

            setMsg("Salvo com sucesso!");
            onUpdate();
            setTimeout(onClose, 800);
        } catch (e: any) {
            console.error(e);
            alert(`Erro ao salvar: ${e.message}`);
            setMsg("Erro ao salvar.");
        }
    };

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative w-full max-w-sm border rounded-[32px] overflow-hidden shadow-xl flex flex-col animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white'} max-h-[90vh]`}>

                {/* Header / Cover */}
                <div className={`relative h-24 flex-shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <button onClick={onClose} className={`absolute top-4 right-4 p-2 rounded-full z-10 ${isDarkMode ? 'bg-black/50 text-white' : 'bg-white/50 text-black'}`}>
                        ✕
                    </button>
                    {isEditing && (
                        <div className="absolute bottom-2 right-4 flex items-center gap-2 z-50">
                            <span className="text-[10px] font-bold uppercase text-gray-400">Ativo?</span>
                            <button
                                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                className={`w-8 h-4 rounded-full transition-colors relative ${formData.is_active !== false ? 'bg-green-500' : 'bg-gray-400'}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${formData.is_active !== false ? 'translate-x-4' : ''}`} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Profile Content */}
                <div className="px-6 pb-6 flex-1 overflow-y-auto custom-scrollbar -mt-10 relative z-10">
                    <div className="flex flex-col items-center">
                        {/* Avatar */}
                        <div className={`relative w-24 h-24 rounded-full border-4 overflow-hidden shadow-2xl ${isDarkMode ? 'border-[#121212] bg-[#121212]' : 'border-white bg-white'}`}>
                            {formData.image_url ? (
                                <img src={formData.image_url} className="w-full h-full object-cover" alt="Manager" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                    <Briefcase size={32} />
                                </div>
                            )}

                            {isHoF && (
                                <div className="absolute bottom-0 right-0 p-1 bg-black rounded-full border-2 border-yellow-400 shadow-lg z-20" title="Hall of Fame">
                                    <Crown size={12} className="text-yellow-400" fill="currentColor" />
                                </div>
                            )}
                        </div>

                        {/* Name & Title */}
                        {isEditing ? (
                            <div className="w-full mt-4 space-y-3 text-center">
                                <input
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full bg-transparent text-center font-black text-xl uppercase outline-none placeholder-gray-500 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}
                                    placeholder="NOME DO GESTOR"
                                />
                                <input
                                    value={formData.image_url || ''}
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                    className={`w-full text-center text-[10px] bg-transparent outline-none border-b border-transparent focus:border-yellow-400 text-gray-500 transition-colors`}
                                    placeholder="URL da Foto..."
                                />
                            </div>
                        ) : (
                            <div className="text-center mt-2 flex flex-col items-center">
                                <h2 className={`text-2xl font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                    {formData.name}
                                </h2>

                                <div className="flex items-center gap-2 mt-2">
                                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${formData.is_active !== false ? 'bg-yellow-400 text-black' : 'bg-gray-500 text-white'}`}>
                                        {formData.is_active !== false ? 'Em Atividade' : 'Inativo'}
                                    </div>
                                    {isHoF && (
                                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest bg-black text-yellow-400 border border-yellow-400/30">
                                            <Crown size={10} fill="currentColor" />
                                            Hall of Fame
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Bio */}
                        <div className="w-full mt-6">
                            {isEditing ? (
                                <>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center justify-center gap-2">
                                        <Briefcase size={14} /> Observação / Bio
                                    </h3>
                                    <textarea
                                        value={formData.bio || ''}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                        className={`w-full bg-transparent border rounded-xl p-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors ${isDarkMode ? 'border-white/20 text-white' : 'border-gray-200 text-black'}`}
                                        placeholder="Escreva um resumo sobre a carreira do gestor..."
                                        rows={3}
                                    />
                                </>
                            ) : (
                                formData.bio && (
                                    <p className={`text-sm leading-relaxed text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {formData.bio}
                                    </p>
                                )
                            )}
                        </div>

                        {/* ACTION BUTTONS (STATS) - View Only */}
                        {!isEditing ? (
                            <div className="grid grid-cols-2 gap-3 w-full mt-6">
                                <button
                                    onClick={() => setShowSeasons(true)}
                                    className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    <div className="text-2xl font-black text-white">{history.length}</div>
                                    <div className="text-[9px] font-bold uppercase text-gray-500">Temporadas</div>
                                </button>

                                <button
                                    onClick={() => setShowTitles(true)}
                                    className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    <div className="text-2xl font-black text-yellow-500">{titlesCount}</div>
                                    <div className="text-[9px] font-bold uppercase text-gray-500">Títulos</div>
                                </button>

                                <button
                                    onClick={() => setShowTrades(true)}
                                    className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    <div className="text-2xl font-black text-green-500">{totalTrades}</div>
                                    <div className="text-[9px] font-bold uppercase text-gray-500">Trades</div>
                                </button>

                                <button
                                    onClick={() => setShowAwards(true)}
                                    className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    <div className="text-2xl font-black text-yellow-500">{awardsCount}</div>
                                    <div className="text-[9px] font-bold uppercase text-gray-500">Conquistas</div>
                                </button>
                            </div>
                        ) : (
                            /* EDIT MODE HISTORY */
                            <div className="w-full mt-8">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center justify-center gap-2">
                                    <Calendar size={14} /> Editar Histórico
                                </h3>
                                <div className="space-y-2">
                                    {history.map(h => (
                                        <div key={h.id} className={`p-3 rounded-xl border flex justify-between items-center ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono font-bold text-yellow-500">{h.year}</span>
                                                <span className={`text-sm font-bold uppercase ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{h.team?.name || 'Sem Time'}</span>
                                            </div>
                                            <button onClick={() => handleDeleteHistory(h.id)} className="text-red-400 hover:text-red-300 p-2">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <div className={`mt-2 p-2 rounded-xl border border-dashed ${isDarkMode ? 'border-white/20' : 'border-gray-300'} flex items-center gap-2`}>
                                        <select
                                            value={newHistoryYear}
                                            onChange={e => setNewHistoryYear(e.target.value)}
                                            className="bg-transparent text-xs w-24 outline-none border-b border-transparent focus:border-yellow-400 px-1 py-1 appearance-none"
                                        >
                                            <option value="" className="text-gray-500">Temp...</option>
                                            {Array.from({ length: 15 }, (_, i) => {
                                                const start = 2017 + i;
                                                const label = `${start}/${start + 1}`;
                                                return <option key={label} value={label} className="text-black">{label}</option>;
                                            })}
                                        </select>
                                        <select
                                            value={newHistoryTeam}
                                            onChange={e => setNewHistoryTeam(e.target.value)}
                                            className={`bg-transparent text-xs flex-1 outline-none appearance-none ${!newHistoryTeam && 'text-gray-500'}`}
                                        >
                                            <option value="">Selecione o Time...</option>
                                            {allTeams.map(t => (
                                                <option key={t.id} value={t.id} className="text-black">{t.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleAddHistory}
                                            disabled={!newHistoryYear}
                                            className="p-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 disabled:opacity-50"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions (Only if editing) */}
                {isEditing && (
                    <div className={`p-6 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
                        {msg && <div className="text-xs text-center text-yellow-500 font-bold mb-2">{msg}</div>}
                        <button onClick={handleSave} className="w-full py-3 bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/20 active:scale-95 transition-transform">
                            Salvar Alterações
                        </button>
                    </div>
                )}
            </div>

            {/* POPUPS */}
            {showSeasons && manager.id && (
                <ManagerSeasonsModal
                    managerId={manager.id}
                    managerName={manager.name || ''}
                    isDarkMode={isDarkMode}
                    onClose={() => setShowSeasons(false)}
                />
            )}
            {showTitles && manager.id && (
                <ManagerTitlesModal
                    managerId={manager.id}
                    managerName={manager.name || ''}
                    isDarkMode={isDarkMode}
                    onClose={() => setShowTitles(false)}
                />
            )}
            {showTrades && manager.id && (
                <ManagerTradesModal
                    managerId={manager.id}
                    managerName={manager.name || ''}
                    isDarkMode={isDarkMode}
                    onClose={() => setShowTrades(false)}
                />
            )}
            {showAwards && manager.id && (
                <ManagerAwardsModal
                    managerId={manager.id}
                    managerName={manager.name || ''}
                    isDarkMode={isDarkMode}
                    onClose={() => setShowAwards(false)}
                />
            )}
        </div>
    );
};

