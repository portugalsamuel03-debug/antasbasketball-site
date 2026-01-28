import React, { useState, useEffect } from 'react';
import { Trade, Team } from '../../types';
import { upsertTrade, listTeams } from '../../cms';
import { X } from 'lucide-react';

interface TradeDetailsModalProps {
    trade: Trade;
    isDarkMode: boolean;
    onClose: () => void;
}

export const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({ trade, isDarkMode, onClose }) => {
    const [editing, setEditing] = useState<Partial<Trade>>(trade);
    const [teams, setTeams] = useState<Team[]>([]);
    const [msg, setMsg] = useState<string | null>(null);

    useEffect(() => {
        fetchTeams();
    }, []);

    async function fetchTeams() {
        const { data } = await listTeams();
        setTeams(data || []);
    }

    async function handleSave() {
        if (!editing.season || !editing.date || !editing.description) {
            setMsg('Preencha temporada, data e descrição.');
            return;
        }

        setMsg('Salvando...');
        try {
            await upsertTrade(editing);
            setMsg('Salvo!');
            setTimeout(onClose, 500);
        } catch (e: any) {
            console.error(e);
            setMsg('Erro ao salvar.');
        }
    }

    const inputClass = `w-full px-4 py-3 rounded-2xl text-sm font-medium ${isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-[#0B1D33]'
        } focus:outline-none focus:ring-2 focus:ring-yellow-400`;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-md rounded-3xl p-6 ${isDarkMode ? 'bg-[#0B1D33]' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                        {trade.id ? 'Editar Trade' : 'Nova Trade'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
                        <X className={isDarkMode ? 'text-white' : 'text-[#0B1D33]'} size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Temporada</label>
                        <input
                            className={inputClass}
                            placeholder="2024/25"
                            value={editing.season || ''}
                            onChange={e => setEditing({ ...editing, season: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Data</label>
                        <input
                            type="date"
                            className={inputClass}
                            value={editing.date || ''}
                            onChange={e => setEditing({ ...editing, date: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Time A</label>
                        <select
                            className={inputClass}
                            value={editing.team_a_id || ''}
                            onChange={e => setEditing({ ...editing, team_a_id: e.target.value })}
                        >
                            <option value="">Selecione um time</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>
                                    {team.name} - {team.gm_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Time B</label>
                        <select
                            className={inputClass}
                            value={editing.team_b_id || ''}
                            onChange={e => setEditing({ ...editing, team_b_id: e.target.value })}
                        >
                            <option value="">Selecione um time</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>
                                    {team.name} - {team.gm_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Descrição</label>
                        <textarea
                            className={inputClass}
                            placeholder="Descreva a trade..."
                            rows={4}
                            value={editing.description || ''}
                            onChange={e => setEditing({ ...editing, description: e.target.value })}
                        />
                    </div>

                    {msg && (
                        <div className="text-center text-sm text-yellow-400">{msg}</div>
                    )}

                    <button
                        onClick={handleSave}
                        className="w-full py-3 bg-yellow-400 text-black font-black rounded-2xl hover:bg-yellow-300 transition"
                    >
                        Salvar Trade
                    </button>
                </div>
            </div>
        </div>
    );
};
