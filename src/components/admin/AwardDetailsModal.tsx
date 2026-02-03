import React, { useState, useEffect } from 'react';
import { Award, Team } from '../../types';
import { upsertAward, listTeams, listManagers, listAwardCategories, insertAwardCategory, deleteAwardCategory } from '../../cms';
import { SEASON_OPTIONS } from '../../utils/seasons';
import { X, Plus, Trash2, Settings } from 'lucide-react';

interface AwardDetailsModalProps {
    award: Award;
    isDarkMode: boolean;
    onClose: () => void;
}

export const AwardDetailsModal: React.FC<AwardDetailsModalProps> = ({ award, isDarkMode, onClose }) => {
    const [editing, setEditing] = useState<Partial<Award>>(award);
    const [teams, setTeams] = useState<Team[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [msg, setMsg] = useState<string | null>(null);

    // Dynamic Categories
    const [categories, setCategories] = useState<any[]>([]);
    const [isManagingCategories, setIsManagingCategories] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState<'INDIVIDUAL' | 'TEAM'>('INDIVIDUAL');

    useEffect(() => {
        fetchData();
        fetchCategories();
    }, []);

    async function fetchData() {
        const { data: teamsData } = await listTeams();
        setTeams(teamsData || []);
        const { data: managersData } = await listManagers();
        setManagers(managersData || []);
    }

    async function fetchCategories() {
        const { data } = await listAwardCategories();
        if (data) setCategories(data);
    }

    async function handleAddCategory() {
        if (!newCategoryName.trim()) return;
        await insertAwardCategory(newCategoryName.trim(), newCategoryType);
        setNewCategoryName('');
        fetchCategories();
    }

    async function handleDeleteCategory(id: string) {
        if (!confirm('Excluir esta categoria?')) return;
        await deleteAwardCategory(id);
        fetchCategories();
    }

    async function handleSave() {
        if (!editing.year || !editing.category) {
            setMsg('Preencha ano e categoria.');
            return;
        }

        // Ensure winner_name is set (fallback to manual if needed, or sync from manager)
        if (!editing.winner_name) {
            setMsg('Selecione ou digite o Vencedor.');
            return;
        }

        // Clean payload relations
        const payload = { ...editing };
        delete (payload as any).team;
        delete (payload as any).manager;

        setMsg('Salvando...');
        try {
            const { error } = await upsertAward(payload);
            if (error) throw error;

            setMsg('Salvo!');
            setTimeout(onClose, 800);
        } catch (e: any) {
            console.error(e);
            alert(`Erro ao salvar premio: ${e.message || JSON.stringify(e)}`);
            setMsg('Erro ao salvar.');
        }
    }

    // Helper to check category type
    const selectedCategoryObj = categories.find(c => c.name === editing.category);
    const isTeamAward = selectedCategoryObj?.type === 'TEAM';

    const inputClass = `w-full px-4 py-3 rounded-2xl text-sm font-medium ${isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-[#0B1D33]'
        } focus:outline-none focus:ring-2 focus:ring-yellow-400`;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-md rounded-3xl p-6 ${isDarkMode ? 'bg-[#0B1D33]' : 'bg-white'} flex flex-col max-h-[90vh]`}>

                {/* Header */}
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                        {award.id ? 'Editar Prêmio' : 'Novo Prêmio'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
                        <X className={isDarkMode ? 'text-white' : 'text-[#0B1D33]'} size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">

                    {/* Category Management Mode */}
                    {isManagingCategories ? (
                        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-black/5 bg-gray-50'}`}>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Gerenciar Categorias</h3>
                                <button onClick={() => setIsManagingCategories(false)} className="text-xs underline text-gray-500">Voltar</button>
                            </div>

                            <div className="flex flex-col gap-2 mb-4">
                                <input
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    placeholder="Nova Categoria..."
                                    className={`${inputClass} py-2 text-xs`}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setNewCategoryType('INDIVIDUAL')}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl border ${newCategoryType === 'INDIVIDUAL' ? 'bg-yellow-400 text-black border-yellow-400' : 'border-gray-500 text-gray-500'}`}
                                    >
                                        Individual
                                    </button>
                                    <button
                                        onClick={() => setNewCategoryType('TEAM')}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl border ${newCategoryType === 'TEAM' ? 'bg-yellow-400 text-black border-yellow-400' : 'border-gray-500 text-gray-500'}`}
                                    >
                                        Time
                                    </button>
                                </div>
                                <button onClick={handleAddCategory} className="bg-white/10 text-white p-2 rounded-xl text-xs font-bold mt-1 hover:bg-white/20">
                                    Adicionar
                                </button>
                            </div>

                            <div className="space-y-1 max-h-[150px] overflow-y-auto">
                                {categories.map(c => (
                                    <div key={c.id} className="flex justify-between items-center text-xs p-2 rounded hover:bg-white/5">
                                        <div className="flex flex-col">
                                            <span className={isDarkMode ? 'text-white' : 'text-black'}>{c.name}</span>
                                            <span className="text-[9px] text-gray-500">{c.type === 'TEAM' ? 'TIME' : 'INDIVIDUAL'}</span>
                                        </div>
                                        <button onClick={() => handleDeleteCategory(c.id)} className="text-red-400 hover:text-red-300">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Ano</label>
                                <select
                                    className={`${inputClass} appearance-none`}
                                    value={editing.year || ''}
                                    onChange={e => setEditing({ ...editing, year: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {SEASON_OPTIONS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between items-end mb-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Categoria</label>
                                    <button
                                        onClick={() => setIsManagingCategories(true)}
                                        className="text-[9px] font-bold text-yellow-500 flex items-center gap-1 hover:underline"
                                    >
                                        <Settings size={10} /> GERENCIAR
                                    </button>
                                </div>
                                <select
                                    className={`${inputClass} appearance-none`}
                                    value={editing.category || ''}
                                    onChange={e => setEditing({ ...editing, category: e.target.value })}
                                >
                                    <option value="">Selecione ou digite abaixo...</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.name}>{c.name} ({c.type === 'TEAM' ? 'Time' : 'Ind'})</option>
                                    ))}
                                </select>
                                {/* Only show manual input if not a team award, or generic */}
                                <input
                                    className={`${inputClass} mt-2 text-xs opacity-50 focus:opacity-100 transition-opacity`}
                                    placeholder="Ou digite manualmente..."
                                    value={editing.category || ''}
                                    onChange={e => setEditing({ ...editing, category: e.target.value })}
                                />
                            </div>

                            {/* DYNAMIC FIELDS BASED ON TYPE */}
                            {isTeamAward ? (
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Time Vencedor</label>
                                    <select
                                        className={`${inputClass} appearance-none ${isDarkMode ? 'bg-[#1a2c42]' : 'bg-white'}`}
                                        value={editing.team_id || ''}
                                        onChange={e => {
                                            const t = teams.find(team => team.id === e.target.value);
                                            setEditing({
                                                ...editing,
                                                team_id: e.target.value,
                                                winner_name: t ? t.name : ''
                                            });
                                        }}
                                    >
                                        <option value="" className={isDarkMode ? 'bg-[#0B1D33] text-white' : 'bg-white text-black'}>Selecione o Time...</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id} className={isDarkMode ? 'bg-[#0B1D33] text-white' : 'bg-white text-black'}>
                                                {team.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Vencedor (Gestor)</label>
                                        <select
                                            className={`${inputClass} appearance-none ${isDarkMode ? 'bg-[#1a2c42]' : 'bg-white'}`}
                                            value={editing.manager_id || ''}
                                            onChange={e => {
                                                const m = managers.find(man => man.id === e.target.value);
                                                setEditing({
                                                    ...editing,
                                                    manager_id: e.target.value,
                                                    winner_name: m ? m.name : editing.winner_name
                                                });
                                            }}
                                        >
                                            <option value="" className={isDarkMode ? 'bg-[#0B1D33] text-white' : 'bg-white text-black'}>Selecione...</option>
                                            {managers.map(m => (
                                                <option key={m.id} value={m.id} className={isDarkMode ? 'bg-[#0B1D33] text-white' : 'bg-white text-black'}>
                                                    {m.name}
                                                </option>
                                            ))}
                                        </select>

                                        <div className="mt-1">
                                            <input
                                                className={`${inputClass} text-xs py-2 opacity-60`}
                                                placeholder="Ou digite o nome..."
                                                value={editing.winner_name || ''}
                                                onChange={e => setEditing({ ...editing, winner_name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Time (Opcional - Contexto)</label>
                                        <select
                                            className={`${inputClass} appearance-none ${isDarkMode ? 'bg-[#1a2c42]' : 'bg-white'}`}
                                            value={editing.team_id || ''}
                                            onChange={e => setEditing({ ...editing, team_id: e.target.value })}
                                        >
                                            <option value="" className={isDarkMode ? 'bg-[#0B1D33] text-white' : 'bg-white text-black'}>Nenhum</option>
                                            {teams.map(team => (
                                                <option key={team.id} value={team.id} className={isDarkMode ? 'bg-[#0B1D33] text-white' : 'bg-white text-black'}>
                                                    {team.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Descrição (Opcional)</label>
                                <textarea
                                    className={inputClass}
                                    placeholder="Detalhes sobre o prêmio..."
                                    rows={2}
                                    value={editing.description || ''}
                                    onChange={e => setEditing({ ...editing, description: e.target.value })}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer fixed */}
                <div className="flex-shrink-0 pt-4 border-t border-gray-500/10 mt-2">
                    {msg && (
                        <div className="text-center text-sm text-yellow-400 mb-2">{msg}</div>
                    )}
                    {!isManagingCategories && (
                        <button
                            onClick={handleSave}
                            className="w-full py-3 bg-yellow-400 text-black font-black rounded-2xl hover:bg-yellow-300 transition"
                        >
                            Salvar Prêmio
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
