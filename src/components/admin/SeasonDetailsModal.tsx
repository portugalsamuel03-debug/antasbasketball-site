import { X, Save, Plus, Trash2, Edit2, Trophy, Award as AwardIcon, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Season, Team, SeasonStanding, Champion, Award, TeamRow, RecordItem } from '../../types';
import { listChampions, listAwards, listTeams, listRecords } from '../../cms';
import { SEASON_OPTIONS } from '../../utils/seasons';

interface SeasonDetailsModalProps {
    season: Season | null;
    isCreating: boolean;
    isDarkMode: boolean;
    canEdit: boolean;
    onClose: () => void;
    onSave: () => void;
}

export const SeasonDetailsModal: React.FC<SeasonDetailsModalProps> = ({ season, isCreating, isDarkMode, canEdit, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Season>>({ year: '', summary: '' });
    const [standings, setStandings] = useState<SeasonStanding[]>([]);
    const [teams, setTeams] = useState<TeamRow[]>([]);
    const [activeTab, setActiveTab] = useState<'DETAILS' | 'STANDINGS'>('DETAILS');

    // Auto-fetched data
    const [yearChampion, setYearChampion] = useState<Champion | null>(null);
    const [yearAwards, setYearAwards] = useState<Award[]>([]);
    const [yearRecords, setYearRecords] = useState<RecordItem[]>([]);

    // For adding/editing standing row
    const [editingStanding, setEditingStanding] = useState<Partial<SeasonStanding> | null>(null);

    useEffect(() => {
        if (season) {
            setFormData(season);
            fetchStandings(season.id);
            fetchSeasonData(season.year);
        }
        fetchTeams();
    }, [season]);

    const fetchTeams = async () => {
        const { data } = await listTeams();
        if (data) setTeams(data as TeamRow[]);
    }

    const fetchStandings = async (seasonId: string) => {
        const { data } = await supabase
            .from('season_standings')
            .select('*, team:teams(*)')
            .eq('season_id', seasonId)
            .order('position', { ascending: true });
        if (data) setStandings(data as any[]);
    };

    const fetchSeasonData = async (year: string) => {
        // Fetch Champion
        const { data: champs } = await listChampions();
        if (champs) {
            const c = (champs as Champion[]).find(ch => ch.year === year);
            setYearChampion(c || null);
        }
        // Fetch Awards
        const { data: awards } = await listAwards();
        if (awards) {
            const a = (awards as Award[]).filter(aw => aw.year.includes(year) || aw.year === year);
            setYearAwards(a);
        }
        // Fetch Records
        const { data: records } = await listRecords();
        if (records) {
            const r = (records as RecordItem[]).filter(rec => rec.year === year || (rec.year && rec.year.includes(year)));
            setYearRecords(r);
        }
    }

    const handleSaveSeason = async () => {
        if (!formData.year) return alert('O ano é obrigatório');
        try {
            let seasonId = season?.id;
            if (isCreating) {
                const { data, error } = await supabase.from('seasons').insert(formData).select().single();
                if (error) throw error;
                seasonId = data.id;
            } else {
                await supabase.from('seasons').update(formData).eq('id', season.id);
            }
            onSave();
            if (isCreating) onClose();
            else alert('Resumo salvo!');
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar temporada');
        }
    };

    const handleUpsertStanding = async () => {
        if (!season?.id) return alert('Salve a temporada primeiro.');
        if (!editingStanding?.team_id) return alert('Selecione um time.');

        const payload = {
            season_id: season.id,
            team_id: editingStanding.team_id,
            wins: Number(editingStanding.wins || 0),
            losses: Number(editingStanding.losses || 0),
            ties: Number(editingStanding.ties || 0),
            trades_count: Number(editingStanding.trades_count || 0),
            position: Number(editingStanding.position || 0),
            highlight_players: editingStanding.highlight_players,
            team_achievements: editingStanding.team_achievements
        };

        const { error } = await supabase
            .from('season_standings')
            .upsert(payload, { onConflict: 'season_id,team_id' });

        if (error) {
            console.error(error);
            alert('Erro ao salvar classificação.');
        } else {
            setEditingStanding(null);
            fetchStandings(season.id);
        }
    };

    const handleDeleteStanding = async (id: string) => {
        if (!confirm('Remover time da tabela?')) return;
        await supabase.from('season_standings').delete().eq('id', id);
        if (season) fetchStandings(season.id);
    }

    const inputClass = `w-full bg-transparent border-b p-3 text-sm font-bold focus:outline-none transition-colors ${isDarkMode
        ? 'border-white/10 text-white focus:border-yellow-400 placeholder:text-gray-700'
        : 'border-[#0B1D33]/10 text-[#0B1D33] focus:border-[#0B1D33] placeholder:text-gray-300'
        }`;

    const standingsByRank = [...standings].sort((a, b) => (a.position - b.position));
    const standingsByTrades = [...standings].sort((a, b) => (b.trades_count - a.trades_count));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] ${isDarkMode ? 'bg-[#121212]' : 'bg-white'}`}>

                {/* Header */}
                <div className={`p-6 border-b flex justify-between items-center flex-shrink-0 ${isDarkMode ? 'border-white/5' : 'border-[#0B1D33]/5'}`}>
                    <div>
                        <h2 className={`text-xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                            {isCreating ? 'Nova Temporada' : `Temporada ${season?.year}`}
                        </h2>
                        {!isCreating && <div className="flex gap-2 mt-2">
                            <button onClick={() => setActiveTab('DETAILS')} className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${activeTab === 'DETAILS' ? 'bg-yellow-400 text-black' : isDarkMode ? 'bg-white/5 text-gray-500' : 'bg-black/5 text-gray-500'}`}>Resumo</button>
                            <button onClick={() => setActiveTab('STANDINGS')} className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${activeTab === 'STANDINGS' ? 'bg-yellow-400 text-black' : isDarkMode ? 'bg-white/5 text-gray-500' : 'bg-black/5 text-gray-500'}`}>Tabelas</button>
                        </div>}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <X size={20} className={isDarkMode ? 'text-white' : 'text-[#0B1D33]'} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* EDIT DETAILS TAB */}
                    {(isCreating || activeTab === 'DETAILS') && (
                        <div className="space-y-8">
                            {/* Auto Summary Section */}
                            {!isCreating && (yearChampion || yearAwards.length > 0) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Champion Card */}
                                    {yearChampion && (
                                        <div className={`p-4 rounded-3xl relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-yellow-400/20 to-black' : 'bg-gradient-to-br from-yellow-100 to-white'} border border-yellow-400/30`}>
                                            <div className="absolute top-2 right-3 text-[10px] font-black text-yellow-500 uppercase tracking-widest">Campeão</div>
                                            <div className="flex items-center gap-4 mt-2">
                                                {yearChampion.logo_url ? (
                                                    <img src={yearChampion.logo_url} className="w-16 h-16 object-contain drop-shadow-lg" />
                                                ) : <Trophy size={32} className="text-yellow-400" />}
                                                <div>
                                                    <div className={`text-xl font-black uppercase leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>{yearChampion.team}</div>
                                                    {yearChampion.runner_up_team && (
                                                        <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase">Vice: {yearChampion.runner_up_team.name}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Awards List */}
                                    {yearAwards.length > 0 && (
                                        <div className={`p-4 rounded-3xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Premiações</div>
                                            <div className="space-y-2">
                                                {yearAwards.map(aw => (
                                                    <div key={aw.id} className="flex items-center gap-2">
                                                        <AwardIcon size={12} className="text-yellow-400 flex-shrink-0" />
                                                        <div className="text-xs">
                                                            <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{aw.category}: </span>
                                                            <span className="opacity-70">{aw.winner_name}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}


                            {/* Records Section */}
                            {yearRecords.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Recordes da Temporada</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {yearRecords.map(rec => (
                                            <div key={rec.id} className={`p-4 rounded-2xl flex items-center gap-3 ${isDarkMode ? 'bg-white/5' : 'bg-orange-50'}`}>
                                                <Star className="text-orange-400" size={16} />
                                                <div>
                                                    <div className={`text-xs font-black uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}>{rec.title}</div>
                                                    <div className="text-[10px] text-gray-500 font-bold">{rec.description}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Year Input (Only editable when creating or editing) */}
                            {canEdit ? (
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Ano (Ex: 2017/18)</label>
                                    <select
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: e.target.value })}
                                        className={`${inputClass} appearance-none`}
                                    >
                                        <option value="">Selecione...</option>
                                        {SEASON_OPTIONS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}

                            {/* Manual Summary */}
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Resumo Manual</label>
                                {canEdit ? (
                                    <textarea
                                        value={formData.summary || ''}
                                        onChange={e => setFormData({ ...formData, summary: e.target.value })}
                                        className={`${inputClass} min-h-[100px] resize-none`}
                                        placeholder="Escreva um resumo adicional..."
                                    />
                                ) : (
                                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {formData.summary || 'Nenhum resumo disponível.'}
                                    </p>
                                )}
                            </div>

                            {canEdit && (
                                <button
                                    onClick={handleSaveSeason}
                                    className="w-full py-4 rounded-2xl bg-yellow-400 text-black font-black uppercase tracking-widest hover:bg-yellow-300 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    {isCreating ? 'Criar Temporada' : 'Salvar Resumo'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* STANDINGS TAB */}
                    {!isCreating && activeTab === 'STANDINGS' && (
                        <div className="space-y-8">
                            {/* Editor Area */}
                            <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-black/5'}`}>
                                <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-50 flex items-center gap-2">
                                    <Plus size={14} />
                                    {editingStanding?.id ? 'Editar Registro' : 'Adicionar Registro'}
                                </h3>
                                <div className="space-y-4">
                                    <select
                                        className={inputClass}
                                        value={editingStanding?.team_id || ''}
                                        onChange={e => setEditingStanding(prev => ({ ...prev, team_id: e.target.value }))}
                                    >
                                        <option value="">Selecione um time...</option>
                                        {teams.map(t => <option key={t.id} value={t.id} className="text-black">{t.name}</option>)}
                                    </select>

                                    <div className="grid grid-cols-4 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase">Pos</label>
                                            <input type="number" className={inputClass} value={editingStanding?.position || ''} onChange={e => setEditingStanding(prev => ({ ...prev, position: Number(e.target.value) }))} />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase">W</label>
                                            <input type="number" className={inputClass} value={editingStanding?.wins || ''} onChange={e => setEditingStanding(prev => ({ ...prev, wins: Number(e.target.value) }))} />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase">L</label>
                                            <input type="number" className={inputClass} value={editingStanding?.losses || ''} onChange={e => setEditingStanding(prev => ({ ...prev, losses: Number(e.target.value) }))} />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase">Trades</label>
                                            <input type="number" className={inputClass} value={editingStanding?.trades_count || ''} onChange={e => setEditingStanding(prev => ({ ...prev, trades_count: Number(e.target.value) }))} />
                                        </div>
                                    </div>

                                    {/* Rich Fields */}
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Destaques (Jogadores)</label>
                                        <input
                                            className={`${inputClass} text-xs`}
                                            placeholder="Ex: MVP, Cestinha..."
                                            value={editingStanding?.highlight_players || ''}
                                            onChange={e => setEditingStanding(prev => ({ ...prev, highlight_players: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Feitos / Recordes</label>
                                        <input
                                            className={`${inputClass} text-xs`}
                                            placeholder="Ex: Melhor ataque da história..."
                                            value={editingStanding?.team_achievements || ''}
                                            onChange={e => setEditingStanding(prev => ({ ...prev, team_achievements: e.target.value }))}
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button onClick={handleUpsertStanding} className="flex-1 py-3 bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-yellow-300">
                                            {editingStanding?.id ? 'Atualizar' : 'Adicionar'}
                                        </button>
                                        {editingStanding?.id && (
                                            <button onClick={() => setEditingStanding(null)} className="px-4 py-3 bg-white/10 text-gray-400 rounded-xl font-bold hover:bg-white/20">
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tables View */}
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Classificação</h3>
                                <div className="space-y-2">
                                    {standingsByRank.map((st) => (
                                        <div key={st.id} className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <span className={`font-black w-6 text-center text-lg ${st.position <= 4 ? 'text-yellow-400' : 'text-gray-500'}`}>{st.position}º</span>
                                                    <div className="flex items-center gap-3">
                                                        <img src={st.team?.logo_url || ''} className="w-8 h-8 object-contain" />
                                                        <div>
                                                            <div className={`font-bold leading-none ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{st.team?.name}</div>
                                                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">{st.wins}V - {st.losses}D - {st.ties}E</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {canEdit && (
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => setEditingStanding(st)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full"><Edit2 size={14} /></button>
                                                        <button onClick={() => handleDeleteStanding(st.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-full"><Trash2 size={14} /></button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* RICH DATA DISPLAY */}
                                            {(st.highlight_players || st.team_achievements) && (
                                                <div className="mt-3 pt-3 border-t border-dashed border-gray-500/20 text-xs space-y-1">
                                                    {st.highlight_players && (
                                                        <div className="flex gap-2">
                                                            <span className="text-gray-500 font-bold uppercase text-[9px]">Destaques:</span>
                                                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{st.highlight_players}</span>
                                                        </div>
                                                    )}
                                                    {st.team_achievements && (
                                                        <div className="flex gap-2">
                                                            <span className="text-yellow-500 font-bold uppercase text-[9px]">Feitos:</span>
                                                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{st.team_achievements}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};
