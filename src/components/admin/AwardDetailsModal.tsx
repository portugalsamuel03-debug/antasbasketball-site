import React, { useState, useEffect } from 'react';
import { Award, Team } from '../../types';
import { upsertAward, listTeams } from '../../cms';
import { X } from 'lucide-react';

interface AwardDetailsModalProps {
    award: Award;
    isDarkMode: boolean;
    onClose: () => void;
}

export const AwardDetailsModal: React.FC<AwardDetailsModalProps> = ({ award, isDarkMode, onClose }) => {
    const [editing, setEditing] = useState<Partial<Award>>(award);
    const [teams, setTeams] = useState<Team[]>([]);
    const [msg, setMsg] = useState<string | null>(null);
    const [categories, setCategories] = useState<string[]>(['MVP', 'GM do Ano', 'Defensor do Ano', 'Sexto Homem', 'Melhor Trade', 'Pior Trade']);

    useEffect(() => {
        fetchTeams();
    }, []);

    async function fetchTeams() {
        const { data } = await listTeams();
        setTeams(data || []);
    }

    async function handleSave() {
        if (!editing.year || !editing.category || !editing.winner_name) {
            setMsg('Preencha ano, categoria e vencedor.');
            return;
        }

        setMsg('Salvando...');
        try {
            const { error } = await upsertAward(editing);
            if (error) throw error;

            setMsg('Salvo!');
            setTimeout(onClose, 500);
        } catch (e: any) {
            console.error(e);
            alert(`Erro ao salvar premio: ${e.message || JSON.stringify(e)}`);
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
                        {award.id ? 'Editar Prêmio' : 'Novo Prêmio'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
                        <X className={isDarkMode ? 'text-white' : 'text-[#0B1D33]'} size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Ano</label>
                        <input
                            className={inputClass}
                            placeholder="2024/25"
                            value={editing.year || ''}
                            onChange={e => setEditing({ ...editing, year: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Categoria</label>
                        <input
                            className={inputClass}
                            placeholder="MVP, GM do Ano, etc."
                            list="categories-list"
                            value={editing.category || ''}
                            onChange={e => setEditing({ ...editing, category: e.target.value })}
                        />
                        <datalist id="categories-list">
                            {categories.map(c => <option key={c} value={c} />)}
                        </datalist>
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Vencedor</label>
                        <input
                            className={inputClass}
                            placeholder="Nome do vencedor"
                            value={editing.winner_name || ''}
                            onChange={e => setEditing({ ...editing, winner_name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Descrição (Opcional)</label>
                        <textarea
                            className={inputClass}
                            placeholder="Detalhes sobre o prêmio..."
                            rows={3}
                            value={editing.description || ''}
                            onChange={e => setEditing({ ...editing, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Time (Opcional)</label>
                        <select
                            className={`${inputClass} appearance-none ${isDarkMode ? 'bg-[#1a2c42]' : 'bg-white'}`}
                            value={editing.team_id || ''}
                            onChange={e => setEditing({ ...editing, team_id: e.target.value })}
                        >
                            <option value="" className={isDarkMode ? 'bg-[#0B1D33] text-white' : 'bg-white text-black'}>Nenhum</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id} className={isDarkMode ? 'bg-[#0B1D33] text-white' : 'bg-white text-black'}>
                                    {team.name} - {team.gm_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {msg && (
                        <div className="text-center text-sm text-yellow-400">{msg}</div>
                    )}

                    <button
                        onClick={handleSave}
                        className="w-full py-3 bg-yellow-400 text-black font-black rounded-2xl hover:bg-yellow-300 transition"
                    >
                        Salvar Prêmio
                    </button>
                </div>
            </div>
        </div>
    );
};
