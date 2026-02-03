import React, { useState, useEffect } from 'react';
import { upsertTeam, listTeamHistory, upsertManagerHistory, deleteManagerHistory, listChampions, listAwards } from '../../cms';
import { TeamRow, ManagerHistory, Champion, Award } from '../../types';
import { EditTrigger } from './EditTrigger';
import { useAdmin } from '../../context/AdminContext';
import { Users, Trash2, Plus, Trophy, Award as AwardIcon, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TeamDetailsModalProps {
    team: Partial<TeamRow>;
    onClose: () => void;
    isDarkMode: boolean;
    onUpdate: () => void;
}

export const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({ team, onClose, isDarkMode, onUpdate }) => {
    const { isEditing } = useAdmin();
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState<Partial<TeamRow>>({ ...team });
    const [msg, setMsg] = useState<string | null>(null);
    const [managers, setManagers] = useState<{ id: string, name: string }[]>([]);

    // History & Stats State
    const [history, setHistory] = useState<ManagerHistory[]>([]);
    const [newHistoryYear, setNewHistoryYear] = useState('');
    const [newHistoryManager, setNewHistoryManager] = useState('');

    const [calculatedTitles, setCalculatedTitles] = useState<string[]>([]);
    const [calculatedAwards, setCalculatedAwards] = useState<string[]>([]);

    // Auto-enter edit mode if it's a new empty team
    useEffect(() => {
        if (!team.name && isEditing) {
            setIsEditMode(true);
        }
    }, [team, isEditing]);

    useEffect(() => {
        const loadManagers = async () => {
            const { data } = await supabase.from('managers').select('id, name').order('name');
            if (data) setManagers(data);
        };
        loadManagers();

        if (team.id) {
            fetchHistory();
            fetchStats();
        }
    }, [team.id]);

    const fetchHistory = async () => {
        if (!team.id) return;
        const { data } = await listTeamHistory(team.id);
        if (data) setHistory(data);
    };

    const fetchStats = async () => {
        if (!team.id) return;

        // Champions
        const { data: champions } = await listChampions();
        if (champions) {
            const wins = (champions as Champion[]).filter(c => c.team_id === team.id || c.team === team.name); // Check both FK and Name just in case
            const runnerUps = (champions as Champion[]).filter(c => c.runner_up_team_id === team.id);

            const winTitles = wins.map(w => `🏆 ${w.year}`);
            const viceTitles = runnerUps.map(r => `🥈 ${r.year} (Vice)`);
            setCalculatedTitles([...winTitles, ...viceTitles]);
        }

        // Awards
        const { data: awards } = await listAwards();
        if (awards) {
            const myAwards = (awards as Award[]).filter(a => a.team_id === team.id || a.team?.id === team.id);
            const awardStrings = myAwards.map(a => `${a.year}: ${a.category} (${a.winner_name})`);
            setCalculatedAwards(awardStrings);
        }
    };

    const handleAddHistory = async () => {
        if (!newHistoryYear || !team.id) return;
        await upsertManagerHistory({
            team_id: team.id,
            year: newHistoryYear,
            manager_id: newHistoryManager || null
        });
        setNewHistoryYear('');
        setNewHistoryManager('');
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

        const payload = { ...formData };
        if (payload.id === "") delete payload.id;

        // Sanitize mapped objects (joined fields that are not columns)
        delete payload.manager;

        // Ensure is_active is boolean or default
        if (payload.is_active === undefined) payload.is_active = true;

        // Legacy Support: Ensure gm_name is filled (DB Constraint)
        if (!payload.gm_name) {
            const linkedManager = managers.find(m => m.id === payload.manager_id);
            payload.gm_name = linkedManager ? linkedManager.name : "-";
        }

        const { error } = await upsertTeam(payload);
        if (error) {
            console.error(error);
            alert(`Erro ao salvar time: ${error.message}`);
            setMsg("Erro ao salvar.");
            return;
        }

        setMsg("Salvo com sucesso!");
        onUpdate();
        fetchHistory(); // Refresh
        setTimeout(() => {
            setIsEditMode(false);
            setMsg(null);
            // Don't close immediately if editing to allow history edits
            if (!team.id) onClose(); // Close if it was new
        }, 800);
    };

    const inputClass = `w-full bg-transparent border-b px-2 py-1 text-sm focus:outline-none focus:border-yellow-400 transition-colors ${isDarkMode ? 'border-white/20 text-white' : 'border-black/20 text-black'}`;

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative w-full max-w-md border rounded-[32px] overflow-hidden shadow-xl flex flex-col animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white'} max-h-[90vh]`}>

                {/* Header Actions */}
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                    {isEditing && !isEditMode && (
                        <EditTrigger type="edit" size={16} onClick={() => setIsEditMode(true)} />
                    )}
                    <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-gray-500'}`}>
                        ✕
                    </button>
                </div>

                {/* Team Logo / Placeholder */}
                <div className={`relative w-full h-32 flex items-center justify-center pt-6 flex-shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl overflow-hidden ${isDarkMode ? 'bg-[#18181b]' : 'bg-white'}`}>
                        {formData.logo_url ? (
                            <img src={formData.logo_url} alt={formData.name} className="w-full h-full object-contain p-2" />
                        ) : (
                            <Users size={48} className="text-yellow-400" />
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="w-full flex-1 overflow-y-auto custom-scrollbar p-6 pt-2">
                    <div className="text-center space-y-3">
                        {msg && <div className="text-xs text-yellow-500 font-bold">{msg}</div>}

                        {isEditMode ? (
                            <>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">Nome do Time</label>
                                    <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className={`${inputClass} font-black text-lg uppercase`} placeholder="EX: CHICAGO BULLS" />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">Logo URL</label>
                                    <input value={formData.logo_url || ''} onChange={e => setFormData({ ...formData, logo_url: e.target.value })} className={`${inputClass}`} placeholder="https://..." />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">Gestor Atual (Link)</label>
                                        <select
                                            value={formData.manager_id || ''}
                                            onChange={e => setFormData({ ...formData, manager_id: e.target.value || undefined })}
                                            className={`${inputClass} appearance-none bg-transparent ${!formData.manager_id ? 'text-gray-400' : ''}`}
                                        >
                                            <option value="" className="text-gray-500">Sem Vínculo</option>
                                            {managers.map(m => (
                                                <option key={m.id} value={m.id} className="text-black">{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <label className="text-[10px] font-bold uppercase text-gray-500">Status do Time:</label>
                                    <button
                                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                        className={`px-3 py-1 rounded-full text-xs font-black uppercase ${formData.is_active !== false ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                                    >
                                        {formData.is_active !== false ? 'ATIVO' : 'INATIVO'}
                                    </button>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-500 block text-left">Descrição</label>
                                    <textarea
                                        value={formData.description || ''}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className={`${inputClass} min-h-[80px]`}
                                        placeholder="História do time..."
                                    />
                                </div>

                                <button onClick={handleSave} className="w-full py-3 mt-4 bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-yellow-400/20 active:scale-95 transition-transform">
                                    Salvar Alterações
                                </button>
                            </>
                        ) : (
                            <>
                                <div>
                                    <h2 className={`text-2xl font-black uppercase tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                        {team.name}
                                    </h2>
                                    <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mt-1">
                                        {team.is_active === false ? 'TIME HISTÓRICO' : 'TIME OFICIAL ANTAS'}
                                    </p>
                                </div>

                                <div className={`w-8 h-1 mx-auto rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />

                                <p className={`text-xs px-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} whitespace-pre-wrap`}>
                                    {team.description || "Participante das ligas oficiais do Antas Basketball."}
                                </p>

                                {(team.manager || team.gm_name) && (
                                    <div className="mt-2 p-2 rounded-lg bg-white/5 inline-block">
                                        <p className="text-[10px] font-black uppercase text-gray-500">Gestor Atual</p>
                                        <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                            {team.manager?.name || team.gm_name}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Stats Section (Always Visible if Data Exists) */}
                        <div className="mt-6 pt-6 border-t border-dashed border-gray-700 space-y-4">
                            {/* Calculated Titles/Awards */}
                            {(calculatedTitles.length > 0 || calculatedAwards.length > 0) && (
                                <div className="w-full">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center justify-center gap-2">
                                        <Trophy size={14} /> Conquistas
                                    </h3>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {calculatedTitles.map((t, i) => (
                                            <div key={`t-${i}`} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase ${isDarkMode ? 'bg-yellow-500/10 text-yellow-500' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {t}
                                            </div>
                                        ))}
                                        {calculatedAwards.map((a, i) => (
                                            <div key={`a-${i}`} className={`px-3 py-2 rounded-lg text-xs font-medium uppercase ${isDarkMode ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                                <AwardIcon size={12} className="inline mr-1" /> {a}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Manager History Section */}
                            {(history.length > 0 || isEditMode) && (
                                <div className="w-full">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center justify-center gap-2">
                                        <Calendar size={14} /> Histórico de Gestores
                                    </h3>

                                    <div className="space-y-2 max-w-xs mx-auto text-left">
                                        {history.map(h => (
                                            <div key={h.id} className={`flex items-center justify-between p-2 pl-3 rounded-lg border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono font-bold text-yellow-500 text-xs">{h.year}</span>
                                                    {h.manager ? (
                                                        <span className={`text-sm font-bold uppercase ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{h.manager.name}</span>
                                                    ) : (
                                                        <span className="text-xs text-gray-500 italic">Desconhecido</span>
                                                    )}
                                                </div>
                                                {isEditMode && (
                                                    <button onClick={() => handleDeleteHistory(h.id)} className="text-red-400 hover:text-red-300 p-1">
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        {isEditMode && team.id && (
                                            <div className={`mt-2 p-2 rounded-lg border border-dashed ${isDarkMode ? 'border-white/20' : 'border-gray-300'} flex items-center gap-2`}>
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
                                                    value={newHistoryManager}
                                                    onChange={e => setNewHistoryManager(e.target.value)}
                                                    className={`bg-transparent text-xs flex-1 outline-none appearance-none ${!newHistoryManager && 'text-gray-500'}`}
                                                >
                                                    <option value="">Selecione Gestor...</option>
                                                    {managers.map(m => (
                                                        <option key={m.id} value={m.id} className="text-black">{m.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={handleAddHistory}
                                                    disabled={!newHistoryYear}
                                                    className="p-1 bg-yellow-400 text-black rounded hover:bg-yellow-300 disabled:opacity-50"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
