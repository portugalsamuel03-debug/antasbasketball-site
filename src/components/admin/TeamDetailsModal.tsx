import React, { useState, useEffect } from 'react';
import { upsertTeam, listTeamHistory, listChampions } from '../../cms';
import { TeamRow, Champion } from '../../types';
import { EditTrigger } from './EditTrigger';
import { HistoryChartModal } from './HistoryChartModal';

import { useAdmin } from '../../context/AdminContext';
import { X, Save, Upload, Trophy, Book, Award as AwardIcon, Users, ChevronRight, Crown, ArrowRight, BarChart } from 'lucide-react';
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
    const [showChart, setShowChart] = useState(false);
    const [showTradesChart, setShowTradesChart] = useState(false); // New state for trades chart
    const [chartData, setChartData] = useState<any[]>([]);
    const [tradesChartData, setTradesChartData] = useState<any[]>([]); // Separated data for trades
    const [history, setHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'INFO' | 'ROSTER' | 'HISTORY'>('INFO');
    const [managers, setManagers] = useState<{ id: string, name: string }[]>([]);

    // Modals
    // Modals
    // Modals
    const [showAwards, setShowAwards] = useState(false);
    const [awardsMode, setAwardsMode] = useState<'ALL' | 'TITLES' | 'AWARDS'>('ALL');
    const [showHistory, setShowHistory] = useState(false);
    // showChart declared above

    // Stats
    const [stats, setStats] = useState({ seasons: 0, titles: 0, trades: 0, wins: 0, losses: 0, ties: 0, awards: 0 });
    // chartData declared above

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
            fetchHistory(); // Fetch history when team.id is available
        }
    }, [team.id]);

    const fetchHistory = async () => {
        if (!team.id) return;
        const { data } = await listTeamHistory(team.id);
        if (data) {
            setHistory(data.map(h => ({
                ...h,
                entityName: h.manager?.name || 'Sem Vínculo', // Fixed 'Sem Vinculo'
                wins: h.wins,
                losses: h.losses,
                ties: h.ties
            })));
        }
    };

    const fetchStats = async () => {
        if (!team.id) return;

        // 1. Seasons (History count)
        // We need the actual data now to map managers, so remove head: true
        const { data: managerHistory, count: seasonsCount } = await supabase
            .from('manager_history')
            .select('*, manager:managers(name)', { count: 'exact' })
            .eq('team_id', team.id);

        // 2. Titles (Champions)
        // Hard to get simple count via head because of logic (FK vs Name).
        // Let's fetch all champions once (it's small) or query.
        const { data: champions } = await listChampions();
        let titlesCount = 0;
        if (champions) {
            titlesCount = (champions as Champion[]).filter(c => c.team_id === team.id || c.team === team.name).length;
        }

        // 3. Trades & Record
        // Sum from season_standings
        // 4. Awards Count
        const { count: awardsCount } = await supabase
            .from('awards')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id);

        const { data: standings } = await supabase
            .from('season_standings')
            .select('trades_count, wins, losses, ties, position, season_id, seasons(year)')
            .eq('team_id', team.id);

        let tradesCount = 0;
        let wins = 0;
        let losses = 0;
        let ties = 0;
        const cData: { label: string; value: number; meta?: any }[] = [];

        // Create a map of Year -> Manager Name
        const yearManagerMap: Record<string, string> = {};
        if (managerHistory) {
            managerHistory.forEach((h: any) => {
                if (h.year && h.manager) {
                    yearManagerMap[h.year] = h.manager.name;
                }
            });
        }

        standings?.forEach((s: any) => {
            tradesCount += (s.trades_count || 0);
            wins += (s.wins || 0);
            losses += (s.losses || 0);
            ties += (s.ties || 0);
            if (s.position && s.seasons?.year) {
                const year = s.seasons.year;
                const managerName = yearManagerMap[year] || 'Sem Gestor';

                cData.push({
                    label: year,
                    value: s.position,
                    meta: {
                        entityName: managerName, // Show Manager Name in Tooltip
                        wins: s.wins || 0,
                        losses: s.losses || 0,
                        ties: s.ties || 0,
                        trades: s.trades_count || 0
                    }
                });
            }
        });

        // Sort chart data by year
        cData.sort((a, b) => a.label.localeCompare(b.label));
        setChartData(cData);

        // Prepare Trades Chart Data
        const tData: any[] = [];
        standings?.forEach((s: any) => {
            if (s.seasons?.year) {
                const year = s.seasons.year;
                const managerName = yearManagerMap[year] || 'Sem Gestor';
                tData.push({
                    label: year,
                    value: s.trades_count || 0,
                    meta: {
                        entityName: managerName,
                        trades: s.trades_count || 0
                    }
                });
            }
        });
        tData.sort((a, b) => a.label.localeCompare(b.label));
        setTradesChartData(tData);

        setStats({
            seasons: seasonsCount || 0,
            titles: titlesCount,
            trades: tradesCount,
            wins,
            losses,
            ties,
            awards: awardsCount || 0
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
                <div className="px-6 pt-10 pb-8 text-center max-h-[80vh] overflow-y-auto custom-scrollbar">

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
                            <div className="flex items-center justify-between py-2 border-b border-gray-500/20">
                                <label className="text-[10px] font-bold uppercase text-gray-500">Ativo?</label>
                                <button
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.is_active ? 'bg-green-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 block">Gestor Atual</label>
                                <select
                                    value={formData.manager_id || ''}
                                    onChange={e => {
                                        const val = e.target.value === "" ? null : e.target.value;
                                        const mgr = managers.find(m => m.id === val);
                                        setFormData({
                                            ...formData,
                                            manager_id: val,
                                            // If manager selected, use their name. If cleared, default to "Sem Gestor" but allow edit.
                                            gm_name: mgr ? mgr.name : (val === null ? 'Sem Gestor' : formData.gm_name)
                                        });
                                    }}
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
                            {/* Record (Was Manager) */}
                            <div
                                onClick={() => setShowChart(true)}
                                className="mb-6 cursor-pointer group flex items-center justify-center gap-6"
                            >
                                <div className="text-center">
                                    <p className="text-[10px] font-bold uppercase text-gray-500 mb-1 group-hover:text-yellow-500 transition-colors">Recorde Total</p>
                                    <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-black'} tracking-tighter`}>
                                        {stats.wins}V - {stats.losses}D
                                    </p>
                                </div>
                                <div className="w-px h-8 bg-gray-500/20" />
                                <div className="text-center">
                                    <p className="text-[10px] font-bold uppercase text-gray-500 mb-1 group-hover:text-yellow-500 transition-colors">Aproveitamento</p>
                                    <p className={`text-2xl font-black ${isDarkMode ? 'text-green-400' : 'text-green-600'} tracking-tighter`}>
                                        {stats.wins + stats.losses > 0 ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100) : 0}%
                                    </p>
                                </div>
                            </div>

                            <div className="w-full h-px bg-gray-500/10 mb-6" />

                            {/* Big Stats Grid (Harmonic 2x2) */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {/* Seasons */}
                                <div className="flex flex-col items-center justify-center cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3 transition-all active:scale-95" onClick={() => setShowHistory(true)}>
                                    <div className="text-3xl font-black text-yellow-500 leading-none mb-1">{stats.seasons}</div>
                                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest text-center">Temporadas</div>
                                    <div className="text-[8px] text-gray-600 mt-0.5 uppercase font-bold">(Ver Histórico)</div>
                                </div>

                                {/* Trades */}
                                <div className="flex flex-col items-center justify-center cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3 transition-all active:scale-95" onClick={() => setShowTradesChart(true)}>
                                    <div className="text-3xl font-black text-green-500 leading-none mb-1">{stats.trades}</div>
                                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest text-center">Trades</div>
                                    <div className="text-[8px] text-gray-600 mt-0.5 uppercase font-bold">(Ver Gráfico)</div>
                                </div>

                                {/* Titles (Clickable - "Títulos") */}
                                <div className="flex flex-col items-center justify-center cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3 transition-all active:scale-95" onClick={() => { setAwardsMode('TITLES'); setShowAwards(true); }}>
                                    <div className="text-3xl font-black text-white leading-none mb-1">{stats.titles}</div>
                                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest text-center">Títulos</div>
                                    <div className="text-[8px] text-gray-600 mt-0.5 uppercase font-bold">(Ver Troféus)</div>
                                </div>

                                {/* Awards (Conquistas) */}
                                <div className="flex flex-col items-center justify-center cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3 transition-all active:scale-95" onClick={() => { setAwardsMode('AWARDS'); setShowAwards(true); }}>
                                    <div className="text-3xl font-black text-blue-400 leading-none mb-1">{stats.awards}</div>
                                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest text-center">Conquistas</div>
                                    <div className="text-[8px] text-gray-600 mt-0.5 uppercase font-bold">(Ver Prêmios)</div>
                                </div>
                            </div>

                            {/* Manager (Was Record) */}
                            {/* Manager (Was Record) */}
                            <div
                                className={`mt-6 py-4 px-4 rounded-2xl flex items-center justify-between transition-transform ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-yellow-400 rounded-2xl text-black">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-1">Gestor Atual</div>
                                        <div className={`text-lg font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                            {team.manager?.name || team.gm_name || 'Sem Gestor'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Action Buttons (Visible even in edit mode for quick access or hidden? Hidden in edit mode to avoid clutter) */}
                    {!isEditMode && (
                        <div className="grid grid-cols-1 gap-6 mt-6">
                            {/* Conquistas removed */}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showAwards && team.id && (
                <TeamAwardsModal
                    teamId={team.id}
                    teamName={team.name || ''}
                    mode={awardsMode}
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
            {showChart && (
                <HistoryChartModal
                    title={team.name}
                    data={chartData}
                    isDarkMode={isDarkMode}
                    onClose={() => setShowChart(false)}
                />
            )}
            {showTradesChart && (
                <HistoryChartModal
                    title={`Trades: ${team.name}`}
                    data={tradesChartData}
                    type="trades"
                    color="#22C55E"
                    isDarkMode={isDarkMode}
                    onClose={() => setShowTradesChart(false)}
                />
            )}
        </div>
    );
};
