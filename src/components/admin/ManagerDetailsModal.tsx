import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { listTeams, listChampions, listAwards, listManagerHistory, upsertManagerHistory, deleteManagerHistory } from '../../cms';
import { TeamRow, Champion, Award, ManagerHistory } from '../../types';
import { Plus, Trash2, Calendar, Briefcase, Trophy, ChevronRight } from 'lucide-react';
import { Manager } from './ManagersSection';
import { useAdmin } from '../../context/AdminContext';

interface ManagerDetailsModalProps {
    manager: Partial<Manager>;
    onClose: () => void;
    isDarkMode: boolean;
    onUpdate: () => void;
}

export const ManagerDetailsModal: React.FC<ManagerDetailsModalProps> = ({ manager, onClose, isDarkMode, onUpdate }) => {
    const { isEditing } = useAdmin();
    const [formData, setFormData] = useState<Partial<Manager>>({
        is_active: true,
        teams_managed_ids: [],
        ...manager
    });
    const [msg, setMsg] = useState<string | null>(null);

    // Data filtering state
    const [allTeams, setAllTeams] = useState<TeamRow[]>([]);
    const [calculatedTitles, setCalculatedTitles] = useState<string[]>([]);
    const [calculatedAwards, setCalculatedAwards] = useState<string[]>([]);

    // History State
    const [history, setHistory] = useState<ManagerHistory[]>([]);
    const [newHistoryYear, setNewHistoryYear] = useState('');
    const [newHistoryTeam, setNewHistoryTeam] = useState('');

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
                const wins = champions.filter(c => c.manager_id === manager.id);
                const runnerUps = champions.filter(c => c.runner_up_manager_id === manager.id);

                const winTitles = wins.map(w => `🏆 ${w.year} (${w.team})`);
                const viceTitles = runnerUps.map(r => `🥈 ${r.year} (Vice - ${r.runner_up_team?.name || 'Time'})`);

                setCalculatedTitles([...winTitles, ...viceTitles]);
            });

            // Awards
            listAwards().then(({ data }) => {
                const awards = data as Award[] || [];
                const myAwards = awards.filter(a => a.manager_id === manager.id);
                const awardStrings = myAwards.map(a => `${a.year}: ${a.category}`);
                setCalculatedAwards(awardStrings);
            });
        }
    }, [manager.id]);

    const fetchHistory = async () => {
        if (!manager.id) return;
        const { data } = await listManagerHistory(manager.id);
        if (data) setHistory(data);
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
            // If new (no ID), delete ID 
            if (!payload.id) delete (payload as any).id;

            const { data, error } = await supabase.from('managers').upsert(payload).select().single();

            if (error) throw error;

            setMsg("Salvo com sucesso!");

            // If it was a new manager, we might want to stay open to add history?
            // For now, close as per original logic, but notify update.
            onUpdate();
            setTimeout(onClose, 800);
        } catch (e: any) {
            console.error(e);
            alert(`Erro ao salvar: ${e.message}`);
            setMsg("Erro ao salvar.");
        }
    };

    const inputClass = `w-full bg-transparent border-b px-2 py-2 text-sm focus:outline-none focus:border-yellow-400 transition-colors ${isDarkMode ? 'border-white/20 text-white' : 'border-black/20 text-black'}`;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative w-full max-w-lg border rounded-[32px] overflow-hidden shadow-xl flex flex-col animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white'} max-h-[90vh]`}>

                {/* Header / Cover */}
                <div className={`relative h-24 flex-shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <button onClick={onClose} className={`absolute top-4 right-4 p-2 rounded-full z-10 ${isDarkMode ? 'bg-black/50 text-white' : 'bg-white/50 text-black'}`}>
                        ✕
                    </button>
                </div>

                {/* Profile Content */}
                <div className="px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar -mt-12">
                    <div className="flex flex-col items-center">
                        {/* Avatar */}
                        <div className={`w-24 h-24 rounded-full border-4 overflow-hidden shadow-2xl ${isDarkMode ? 'border-[#121212] bg-[#121212]' : 'border-white bg-white'}`}>
                            {formData.image_url ? (
                                <img src={formData.image_url} className="w-full h-full object-cover" alt="Manager" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                    <Briefcase size={32} />
                                </div>
                            )}
                        </div>

                        {/* Name & Title */}
                        {isEditing ? (
                            <div className="w-full mt-4 space-y-3">
                                <label className="text-[10px] font-bold uppercase text-gray-500">Nome</label>
                                <input
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className={`${inputClass} text-center font-black text-2xl uppercase`}
                                    placeholder="NOME DO GESTOR"
                                />
                                <label className="text-[10px] font-bold uppercase text-gray-500">Foto URL</label>
                                <input
                                    value={formData.image_url || ''}
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                    className={`${inputClass} text-center text-xs`}
                                    placeholder="https://..."
                                />
                            </div>
                        ) : (
                            <div className="text-center mt-2">
                                <h2 className={`text-2xl font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                    {formData.name}
                                </h2>
                                {/* Active Badge */}
                                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest mt-2 ${formData.is_active !== false ? 'bg-yellow-400 text-black' : 'bg-gray-500 text-white'}`}>
                                    {formData.is_active !== false ? 'Em Atividade' : 'Lenda / Inativo'}
                                </div>
                            </div>
                        )}

                        {/* Bio / Observation */}
                        <div className="w-full mt-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                                <Briefcase size={14} /> Observação / Bio
                            </h3>
                            {isEditing ? (
                                <textarea
                                    value={formData.bio || ''}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    className={`${inputClass} min-h-[80px]`}
                                    placeholder="Escreva um resumo sobre a carreira do gestor..."
                                />
                            ) : (
                                <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {formData.bio || 'Sem observações registradas.'}
                                </p>
                            )}
                        </div>

                        {/* Stats Summary - View Only */}
                        {!isEditing && (
                            <div className="grid grid-cols-2 w-full gap-4 mt-6">
                                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <div className="text-2xl font-black text-yellow-500">{history.length}</div>
                                    <div className="text-[10px] font-bold uppercase text-gray-500">Temporadas</div>
                                </div>
                                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <div className="text-2xl font-black text-yellow-500">{calculatedTitles.filter(t => t.includes('🏆')).length}</div>
                                    <div className="text-[10px] font-bold uppercase text-gray-500">Títulos</div>
                                </div>
                            </div>
                        )}

                        {/* History Section */}
                        <div className="w-full mt-8">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                                <Calendar size={14} /> Histórico de Temporadas
                            </h3>

                            <div className="space-y-2">
                                {history.map(h => (
                                    <div key={h.id} className={`flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-bold text-yellow-500">{h.year}</span>
                                            {h.team ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-gray-500"></div>
                                                    <span className={`text-sm font-bold uppercase ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{h.team.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-500 italic ml-2">Sem time vinculado</span>
                                            )}
                                        </div>
                                        {isEditing && (
                                            <button onClick={() => handleDeleteHistory(h.id)} className="text-red-400 hover:text-red-300 p-2">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {isEditing && manager.id && (
                                    <div className={`mt-2 p-3 rounded-xl border border-dashed ${isDarkMode ? 'border-white/20' : 'border-gray-300'} flex items-center gap-2`}>
                                        <input
                                            value={newHistoryYear}
                                            onChange={e => setNewHistoryYear(e.target.value)}
                                            placeholder="Ano (Ex: 17/18)"
                                            className="bg-transparent text-sm w-24 outline-none border-b border-transparent focus:border-yellow-400 px-1 py-1"
                                        />
                                        <select
                                            value={newHistoryTeam}
                                            onChange={e => setNewHistoryTeam(e.target.value)}
                                            className={`bg-transparent text-sm flex-1 outline-none appearance-none ${!newHistoryTeam && 'text-gray-500'}`}
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
                                )}
                            </div>
                        </div>

                        {/* Achievements */}
                        <div className="w-full mt-8">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                                <Trophy size={14} /> Conquistas
                            </h3>
                            <div className="space-y-2">
                                {calculatedTitles.length === 0 && calculatedAwards.length === 0 && !formData.individual_titles && (
                                    <div className="text-sm text-gray-500 italic">Nenhuma conquista registrada no sistema.</div>
                                )}

                                {calculatedTitles.map((t, i) => (
                                    <div key={`t-${i}`} className={`p-3 rounded-xl flex items-center gap-3 ${isDarkMode ? 'bg-yellow-500/10 text-yellow-500' : 'bg-yellow-50 text-yellow-600'}`}>
                                        <Trophy size={14} />
                                        <span className="text-sm font-bold uppercase">{t}</span>
                                    </div>
                                ))}

                                {calculatedAwards.map((t, i) => (
                                    <div key={`a-${i}`} className={`p-3 rounded-xl flex items-center gap-3 ${isDarkMode ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                        <AwardIcon size={14} />
                                        <span className="text-sm font-medium uppercase">{t}</span>
                                    </div>
                                ))}

                                {/* Manual Bio/Titles is handled in Bio now, but if we have legacy manual titles we can show them */}
                                {formData.individual_titles && (
                                    <div className={`p-3 rounded-xl flex flex-col gap-1 ${isDarkMode ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                        <span className="text-[10px] font-bold uppercase text-gray-400">Outros (Manual)</span>
                                        <span className="text-sm">{formData.individual_titles}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions (Only if editing) */}
                {isEditing && (
                    <div className={`p-6 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
                        {msg && <div className="text-xs text-center text-yellow-500 font-bold mb-2">{msg}</div>}

                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase text-gray-500">Gestor em Atividade?</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.is_active !== false}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-400"></div>
                            </label>
                        </div>

                        <button onClick={handleSave} className="w-full py-4 bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-yellow-300 transition-colors">
                            Salvar Alterações
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper Icon
const AwardIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
);
