import React, { useState, useEffect } from 'react';
import { upsertTeam, listTeamHistory, listChampions } from '../../cms';
import { TeamRow, Champion } from '../../types';
import { EditTrigger } from './EditTrigger';
import { useAdmin } from '../../context/AdminContext';
import { Users, Trophy, Book, Smartphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TeamAwardsModal } from './TeamAwardsModal';
import { TeamHistoryModal } from './TeamHistoryModal';

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

    // Modals
    const [showAwards, setShowAwards] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Stats
    const [stats, setStats] = useState({ seasons: 0, titles: 0, trades: 0 });

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
            fetchStats();
        }
    }, [team.id]);

    const fetchStats = async () => {
        if (!team.id) return;

        // 1. Seasons (History count)
        const { count: seasonsCount } = await supabase
            .from('manager_history')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id);

        // 2. Titles (Champions)
        // Hard to get simple count via head because of logic (FK vs Name).
        // Let's fetch all champions once (it's small) or query.
        const { data: champions } = await listChampions();
        let titlesCount = 0;
        if (champions) {
            titlesCount = (champions as Champion[]).filter(c => c.team_id === team.id || c.team === team.name).length;
        }

        // 3. Trades
        // Sum from season_standings
        const { data: standings } = await supabase
            .from('season_standings')
            .select('trades_count')
            .eq('team_id', team.id);

        let tradesCount = 0;
        standings?.forEach(s => tradesCount += (s.trades_count || 0));

        setStats({
            seasons: seasonsCount || 0,
            titles: titlesCount,
            trades: tradesCount
        });
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
        setTimeout(() => {
            setIsEditMode(false);
            setMsg(null);
            if (!team.id) onClose(); // Close if it was new
        }, 800);
    };

    const inputClass = `w-full bg-transparent border-b px-2 py-1 text-sm focus:outline-none focus:border-yellow-400 transition-colors ${isDarkMode ? 'border-white/20 text-white' : 'border-black/20 text-black'}`;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative w-full max-w-sm border rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white'}`}>

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
                <div className={`relative w-full h-32 flex items-center justify-center pt-8 flex-shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center shadow-xl overflow-hidden ${isDarkMode ? 'bg-[#18181b]' : 'bg-white'} transform translate-y-4`}>
                        {formData.logo_url ? (
                            <img src={formData.logo_url} alt={formData.name} className="w-full h-full object-contain p-2" />
                        ) : (
                            <Users size={48} className="text-yellow-400" />
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pt-10 pb-8 text-center">

                    {isEditMode ? (
                        <div className="space-y-4 text-left">
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block">Nome do Time</label>
                                <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className={`${inputClass} font-black text-lg uppercase`} placeholder="EX: CHICAGO BULLS" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block">Logo URL</label>
                                <input value={formData.logo_url || ''} onChange={e => setFormData({ ...formData, logo_url: e.target.value })} className={`${inputClass}`} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block">Gestor Atual</label>
                                <select
                                    value={formData.manager_id || ''}
                                    onChange={e => setFormData({ ...formData, manager_id: e.target.value || undefined })}
                                    className={`${inputClass} appearance-none bg-transparent`}
                                >
                                    <option value="">Sem Vínculo</option>
                                    {managers.map(m => (
                                        <option key={m.id} value={m.id} className="text-black">{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block">Descrição</label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className={`${inputClass} min-h-[60px]`}
                                />
                            </div>
                            <button onClick={handleSave} className="w-full py-3 mt-2 bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-yellow-400/20 active:scale-95 transition-transform">
                                Salvar
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Title & Info */}
                            <h2 className={`text-2xl font-black uppercase tracking-tighter leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                {team.name}
                            </h2>
                            <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-4">
                                {team.is_active === false ? 'TIME HISTÓRICO' : 'TIME OFICIAL ANTAS'}
                            </p>

                            <p className={`text-xs px-2 mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {team.description || "Participante das ligas oficiais do Antas Basketball."}
                            </p>

                            {/* Manager */}
                            {(team.manager || team.gm_name) && (
                                <div className="mb-8">
                                    <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Gestor Atual</p>
                                    <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        {team.manager?.name || team.gm_name}
                                    </p>
                                </div>
                            )}

                            <div className="w-full h-px bg-gray-500/10 mb-8" />

                            {/* Big Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 mb-8">
                                <div className="flex flex-col items-center">
                                    <div className="text-3xl font-black text-yellow-500 leading-none">{stats.seasons}</div>
                                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-wide mt-1">Temporadas</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="text-3xl font-black text-yellow-500 leading-none">{stats.titles}</div>
                                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-wide mt-1">Títulos</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="text-3xl font-black text-green-500 leading-none">{stats.trades}</div>
                                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-wide mt-1">Trades</div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Action Buttons (Visible even in edit mode for quick access or hidden? Hidden in edit mode to avoid clutter) */}
                    {!isEditMode && (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setShowAwards(true)}
                                className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
                            >
                                <Trophy size={24} className="text-yellow-500" />
                                <span className={`text-xs font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>Conquistas</span>
                            </button>
                            <button
                                onClick={() => setShowHistory(true)}
                                className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
                            >
                                <Book size={24} className="text-blue-400" />
                                <span className={`text-xs font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>Histórico</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showAwards && team.id && (
                <TeamAwardsModal
                    teamId={team.id}
                    teamName={team.name || ''}
                    isDarkMode={isDarkMode}
                    onClose={() => setShowAwards(false)}
                />
            )}

            {showHistory && team.id && (
                <TeamHistoryModal
                    teamId={team.id}
                    isEditable={isEditing}
                    isDarkMode={isDarkMode}
                    onClose={() => setShowHistory(false)}
                />
            )}
        </div>
    );
};
