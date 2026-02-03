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

                            <div className="flex gap-2 mb-4">
                                <input
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    placeholder="Nova Categoria..."
                                    className={`${inputClass} py-2 text-xs`}
                                />
                                <button onClick={handleAddCategory} className="bg-yellow-400 text-black p-2 rounded-xl">
                                    <Plus size={16} />
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {categories.map(c => (
                                    <div key={c.id} className="flex justify-between items-center text-xs p-2 rounded hover:bg-white/5">
                                        <span className={isDarkMode ? 'text-white' : 'text-black'}>{c.name}</span>
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
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                                {/* Fallback for custom typing not in list yet, or if they want to type manually */}
                                <input
                                    className={`${inputClass} mt-2 text-xs opacity-80`}
                                    placeholder="Ou digite uma categoria personalizada..."
                                    value={editing.category || ''}
                                    onChange={e => setEditing({ ...editing, category: e.target.value })}
                                />
                            </div>

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
                                        placeholder="Ou digite o nome (se não for gestor)..."
                                        value={editing.winner_name || ''}
                                        onChange={e => setEditing({ ...editing, winner_name: e.target.value })}
                                    />
                                </div>
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
                                            {team.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {msg && (
                        <div className="text-center text-sm text-yellow-400">{msg}</div>
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
