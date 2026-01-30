import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Season, Team, SeasonStanding } from '../../types';

interface SeasonDetailsModalProps {
    season: Season | null;
    isCreating: boolean;
    isDarkMode: boolean;
    onClose: () => void;
    onSave: () => void;
}

export const SeasonDetailsModal: React.FC<SeasonDetailsModalProps> = ({ season, isCreating, isDarkMode, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Season>>({ year: '', summary: '' });
    const [standings, setStandings] = useState<SeasonStanding[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [activeTab, setActiveTab] = useState<'DETAILS' | 'STANDINGS'>('DETAILS');

    // For adding/editing standing row
    const [editingStanding, setEditingStanding] = useState<Partial<SeasonStanding> | null>(null);

    useEffect(() => {
        if (season) {
            setFormData(season);
            fetchStandings(season.id);
        }
        fetchTeams();
    }, [season]);

    const fetchTeams = async () => {
        const { data } = await supabase.from('teams').select('id,name,logo_url,gm_name');
        if (data) setTeams(data as Team[]);
    }

    const fetchStandings = async (seasonId: string) => {
        const { data } = await supabase
            .from('season_standings')
            .select('*, team:teams(*)')
            .eq('season_id', seasonId)
            .order('position', { ascending: true });
        if (data) setStandings(data as any[]);
    };

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
            if (isCreating) onClose(); // Close if creating, stay if editing to add standings
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
            position: Number(editingStanding.position || 0)
        };

        const { error } = await supabase
            .from('season_standings')
            .upsert(payload, { onConflict: 'season_id,team_id' }); // Require valid unique constraint in DB

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

    // Derived lists
    const standingsByRank = [...standings].sort((a, b) => (a.position - b.position));
    const standingsByTrades = [...standings].sort((a, b) => (b.trades_count - a.trades_count));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] ${isDarkMode ? 'bg-[#121212]' : 'bg-white'}`}>

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

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* EDIT DETAILS TAB */}
                    {(isCreating || activeTab === 'DETAILS') && (
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Ano (Ex: 2017/18)</label>
                                <input
                                    value={formData.year}
                                    onChange={e => setFormData({ ...formData, year: e.target.value })}
                                    className={inputClass}
                                    placeholder="20XX/20XX"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Resumo da Temporada</label>
                                <textarea
                                    value={formData.summary || ''}
                                    onChange={e => setFormData({ ...formData, summary: e.target.value })}
                                    className={`${inputClass} min-h-[150px] resize-none`}
                                    placeholder="Escreva um resumo sobre o que aconteceu nesta temporada..."
                                />
                            </div>
                            <button
                                onClick={handleSaveSeason}
                                className="w-full py-4 rounded-2xl bg-yellow-400 text-black font-black uppercase tracking-widest hover:bg-yellow-300 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                {isCreating ? 'Criar Temporada' : 'Salvar Resumo'}
                            </button>
                        </div>
                    )}

                    {/* STANDINGS TAB */}
                    {!isCreating && activeTab === 'STANDINGS' && (
                        <div className="space-y-8">
                            {/* Editor Area */}
                            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-black/5'}`}>
                                <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-50">Adicionar / Editar Time</h3>
                                <div className="space-y-3">
                                    <select
                                        className={inputClass}
                                        value={editingStanding?.team_id || ''}
                                        onChange={e => setEditingStanding(prev => ({ ...prev, team_id: e.target.value }))}
                                    >
                                        <option value="">Selecione um time...</option>
                                        {teams.map(t => <option key={t.id} value={t.id} className="text-black">{t.name}</option>)}
                                    </select>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input type="number" placeholder="Posição" className={inputClass} value={editingStanding?.position || ''} onChange={e => setEditingStanding(prev => ({ ...prev, position: Number(e.target.value) }))} />
                                        <input type="number" placeholder="Trades" className={inputClass} value={editingStanding?.trades_count || ''} onChange={e => setEditingStanding(prev => ({ ...prev, trades_count: Number(e.target.value) }))} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input type="number" placeholder="Vitórias" className={inputClass} value={editingStanding?.wins || ''} onChange={e => setEditingStanding(prev => ({ ...prev, wins: Number(e.target.value) }))} />
                                        <input type="number" placeholder="Derrotas" className={inputClass} value={editingStanding?.losses || ''} onChange={e => setEditingStanding(prev => ({ ...prev, losses: Number(e.target.value) }))} />
                                        <input type="number" placeholder="Empates" className={inputClass} value={editingStanding?.ties || ''} onChange={e => setEditingStanding(prev => ({ ...prev, ties: Number(e.target.value) }))} />
                                    </div>
                                    <button onClick={handleUpsertStanding} className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase">Adicionar / Atualizar</button>
                                </div>
                            </div>

                            {/* Tables View */}
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Classificação</h3>
                                <div className="space-y-1">
                                    {standingsByRank.map((st) => (
                                        <div key={st.id} className={`flex items-center justify-between p-3 rounded-xl text-xs font-medium ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <span className={`font-black w-4 text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>{st.position}º</span>
                                                <img src={st.team?.logo_url || ''} className="w-5 h-5 object-contain" />
                                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{st.team?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span>{st.wins}-{st.losses}-{st.ties}</span>
                                                <button onClick={() => setEditingStanding(st)} className="text-blue-500"><Edit2 size={12} /></button>
                                                <button onClick={() => handleDeleteStanding(st.id)} className="text-red-500"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Ranking de Trades</h3>
                                <div className="space-y-1">
                                    {standingsByTrades.map((st, idx) => (
                                        <div key={`tr-${st.id}`} className={`flex items-center justify-between p-3 rounded-xl text-xs font-medium ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <span className={`font-black w-4 text-center text-yellow-500`}>#{idx + 1}</span>
                                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{st.team?.name}</span>
                                            </div>
                                            <div className="font-bold text-gray-500">
                                                {st.trades_count} trades
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
