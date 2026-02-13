import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Plus, X, ArrowRightLeft, User } from 'lucide-react';
import { listTeamHistory, upsertManagerHistory, deleteManagerHistory, listManagers } from '../../cms';
import { ManagerHistory } from '../../types';
import { supabase } from '../../lib/supabase';

interface TeamHistoryModalProps {
    teamId: string;
    isEditable: boolean;
    isDarkMode: boolean;
    onClose: () => void;
}

export const TeamHistoryModal: React.FC<TeamHistoryModalProps> = ({ teamId, isEditable, isDarkMode, onClose }) => {
    const [history, setHistory] = useState<ManagerHistory[]>([]);
    const [managers, setManagers] = useState<{ id: string, name: string }[]>([]);
    const [tradesByYear, setTradesByYear] = useState<Record<string, number>>({});

    // Form State
    const [newYear, setNewYear] = useState('');
    const [newManagerId, setNewManagerId] = useState('');

    useEffect(() => {
        fetchHistory();
        fetchTrades();
        if (isEditable) fetchManagers();
    }, [teamId]);

    const fetchHistory = async () => {
        const { data } = await listTeamHistory(teamId);
        if (data) setHistory(data);
    };

    const fetchTrades = async () => {
        const { data } = await supabase
            .from('season_standings')
            .select(`
                trades_count,
                season:seasons (
                    year
                )
            `)
            .eq('team_id', teamId);

        if (data) {
            const map: Record<string, number> = {};
            data.forEach((s: any) => {
                // s.season is an object or array depending on relation, usually object for belongs_to
                const year = s.season?.year;
                // Only map if year exists and trades > 0
                if (year && s.trades_count > 0) {
                    map[year] = s.trades_count;
                }
            });
            setTradesByYear(map);
        }
    };

    const fetchManagers = async () => {
        const { data } = await supabase.from('managers').select('id, name').order('name');
        if (data) setManagers(data);
    };

    const handleAdd = async () => {
        if (!newYear) return;
        await upsertManagerHistory({
            team_id: teamId,
            year: newYear,
            manager_id: newManagerId || null
        });
        setNewYear('');
        setNewManagerId('');
        fetchHistory();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Remover registro?')) {
            await deleteManagerHistory(id);
            fetchHistory();
        }
    };

    return (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className={`relative w-full max-w-sm ${isDarkMode ? 'bg-[#121212]' : 'bg-white'} rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]`}>

                {/* Header */}
                <div className="p-6 pb-2 flex justify-between items-center">
                    <h2 className={`text-xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                        Histórico
                    </h2>
                    <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-gray-500'}`}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 pt-4 space-y-4 overflow-y-auto custom-scrollbar">

                    {/* LIST */}
                    <div className="space-y-3">
                        {history.map(h => {
                            const trades = tradesByYear[h.year] || 0;
                            return (
                                <div key={h.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isDarkMode ? 'bg-[#1a2c42] border-white/5 hover:border-white/10' : 'bg-white border-gray-100 hover:shadow-md'}`}>
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 ${isDarkMode ? 'bg-black/30 border-white/10' : 'bg-gray-100 border-white shadow-sm'}`}>
                                            {h.manager?.image_url ? (
                                                <img src={h.manager.image_url} alt={h.manager.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={16} className="text-gray-400" />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div>
                                            <div className="font-mono font-bold text-yellow-500 text-[10px] uppercase tracking-wider mb-0.5">{h.year}</div>
                                            {h.manager ? (
                                                <div className={`text-sm font-black uppercase tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                                    {h.manager.name}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-500 italic font-medium">Sem Gestor</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats / Actions */}
                                    <div className="flex items-center gap-3">
                                        {trades > 0 && (
                                            <div className={`p-1.5 rounded-lg flex items-center gap-1.5 ${isDarkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>
                                                <ArrowRightLeft size={12} />
                                                <span className="text-[10px] font-black">{trades}</span>
                                            </div>
                                        )}

                                        {isEditable && (
                                            <button onClick={() => handleDelete(h.id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-white/10 rounded-full transition">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {history.length === 0 && <div className="text-center text-xs text-gray-500 py-4">Sem histórico registrado.</div>}
                    </div>

                    {/* ADD FORM */}
                    {isEditable && (
                        <div className={`mt-4 p-4 rounded-2xl border border-dashed ${isDarkMode ? 'border-white/20' : 'border-gray-300'} flex flex-col gap-3`}>
                            <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Adicionar Registro</div>
                            <div className="flex gap-2">
                                <select
                                    value={newYear}
                                    onChange={e => setNewYear(e.target.value)}
                                    className={`bg-transparent text-xs w-28 outline-none border-b ${isDarkMode ? 'border-white/20 text-white' : 'border-gray-300'} focus:border-yellow-400 px-1 py-2 appearance-none font-medium`}
                                >
                                    <option value="" className="text-gray-500">Ano...</option>
                                    {Array.from({ length: 15 }, (_, i) => {
                                        const start = 2017 + i;
                                        const label = `${start}/${start + 1}`;
                                        return <option key={label} value={label} className="text-black">{label}</option>;
                                    })}
                                </select>
                                <select
                                    value={newManagerId}
                                    onChange={e => setNewManagerId(e.target.value)}
                                    className={`bg-transparent text-xs flex-1 outline-none border-b ${isDarkMode ? 'border-white/20 text-white' : 'border-gray-300'} focus:border-yellow-400 px-1 py-2 appearance-none font-medium`}
                                >
                                    <option value="" className="text-gray-500">Selecionar Gestor...</option>
                                    {managers.map(m => (
                                        <option key={m.id} value={m.id} className="text-black">{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={handleAdd}
                                disabled={!newYear}
                                className="w-full py-3 bg-yellow-400 text-black text-xs font-black uppercase rounded-xl hover:bg-yellow-300 disabled:opacity-50 mt-1 shadow-lg shadow-yellow-400/20 active:scale-95 transition-all"
                            >
                                Adicionar
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
