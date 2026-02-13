import React, { useState, useEffect } from 'react';
import { Award, Team } from '../../types';
import { upsertAward, listTeams, listManagers, listAwardCategories, insertAwardCategory, deleteAwardCategory, updateAwardCategory } from '../../cms';
import { SEASON_OPTIONS } from '../../utils/seasons';
import { X, Plus, Trash2, Settings, Edit2 } from 'lucide-react';

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

    // Category Form State
    const [editingCategory, setEditingCategory] = useState<{ id: string, name: string, type: 'INDIVIDUAL' | 'TEAM' } | null>(null);
    const [categoryName, setCategoryName] = useState('');
    const [categoryType, setCategoryType] = useState<'INDIVIDUAL' | 'TEAM'>('INDIVIDUAL');

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

    async function handleSaveCategory() {
        if (!categoryName.trim()) return;

        if (editingCategory) {
            await updateAwardCategory(editingCategory.id, categoryName.trim(), categoryType);
            setEditingCategory(null);
        } else {
            await insertAwardCategory(categoryName.trim(), categoryType);
        }

        setCategoryName('');
        setCategoryType('INDIVIDUAL');
        fetchCategories();
    }

    function handleEditCategory(cat: any) {
        setEditingCategory(cat);
        setCategoryName(cat.name);
        setCategoryType(cat.type);
    }

    function handleCancelCategoryEdit() {
        setEditingCategory(null);
        setCategoryName('');
        setCategoryType('INDIVIDUAL');
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
            setMsg('Selecione o Vencedor.');
            return;
        }

        // Clean payload relations
        const payload: any = { ...editing };
        delete payload.team;
        delete payload.manager;

        // SANITIZATION: Remove id if empty string to avoid UUID error on insert
        if (!payload.id) delete payload.id;

        // SANITIZATION: Convert empty strings to null for nullable UUID fields
        if (!payload.team_id) payload.team_id = null;
        if (!payload.manager_id) payload.manager_id = null;

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

    const inputClass = `w-full px-4 py-3 rounded-2xl text-sm font-medium ${isDarkMode ? 'bg-white/10 text-white placeholder-gray-400' : 'bg-gray-100 text-[#0B1D33] placeholder-gray-500'
        } focus:outline-none focus:ring-2 focus:ring-yellow-400 border border-transparent`;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
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
                <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2 min-h-0">

                    {/* Category Management Mode */}
                    {isManagingCategories ? (
                        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-black/5 bg-gray-50'}`}>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
                                    {editingCategory ? 'Editar Categoria' : 'Gerenciar Categorias'}
                                </h3>
                                <button onClick={() => { setIsManagingCategories(false); handleCancelCategoryEdit(); }} className="text-xs underline text-gray-500">Voltar</button>
                            </div>

                            <div className="flex flex-col gap-2 mb-4">
                                <input
                                    value={categoryName}
                                    onChange={e => setCategoryName(e.target.value)}
                                    placeholder="Nome da Categoria..."
                                    className={`${inputClass} py-2 text-xs`}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCategoryType('INDIVIDUAL')}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl border ${categoryType === 'INDIVIDUAL' ? 'bg-yellow-400 text-black border-yellow-400' : 'border-gray-500 text-gray-500'}`}
                                    >
                                        Individual
                                    </button>
                                    <button
                                        onClick={() => setCategoryType('TEAM')}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl border ${categoryType === 'TEAM' ? 'bg-yellow-400 text-black border-yellow-400' : 'border-gray-500 text-gray-500'}`}
                                    >
                                        Time
                                    </button>
                                </div>
                                <div className="flex gap-2 mt-1">
                                    {editingCategory && (
                                        <button onClick={handleCancelCategoryEdit} className="flex-1 bg-white/10 text-white p-2 rounded-xl text-xs font-bold hover:bg-white/20">
                                            Cancelar
                                        </button>
                                    )}
                                    <button onClick={handleSaveCategory} className="flex-1 bg-yellow-400 text-black p-2 rounded-xl text-xs font-black hover:bg-yellow-300">
                                        {editingCategory ? 'Atualizar' : 'Adicionar'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1 max-h-[150px] overflow-y-auto custom-scrollbar">
                                {categories.map(c => (
                                    <div key={c.id} className="flex justify-between items-center text-xs p-2 rounded hover:bg-white/5 group">
                                        <div className="flex flex-col">
                                            <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{c.name}</span>
                                            <span className="text-[9px] text-gray-500">{c.type === 'TEAM' ? 'TIME' : 'INDIVIDUAL'}</span>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditCategory(c)} className="text-blue-400 hover:text-blue-300">
                                                <Edit2 size={12} />
                                            </button>
                                            <button onClick={() => handleDeleteCategory(c.id)} className="text-red-400 hover:text-red-300">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
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
                                    <option value="" className="text-black">Selecione...</option>
                                    {SEASON_OPTIONS.map(s => (
                                        <option key={s} value={s} className="text-black">{s}</option>
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
                                    <option value="" className="text-black">Selecione...</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.name} className="text-black">{c.name} ({c.type === 'TEAM' ? 'Time' : 'Ind'})</option>
                                    ))}
                                </select>
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
                                        <option value="" className="text-black">Selecione o Time...</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id} className="text-black">
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
                                            <option value="" className="text-black">Selecione...</option>
                                            {managers.map(m => (
                                                <option key={m.id} value={m.id} className="text-black">
                                                    {m.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Time (Opcional - Contexto)</label>
                                        <select
                                            className={`${inputClass} appearance-none ${isDarkMode ? 'bg-[#1a2c42]' : 'bg-white'}`}
                                            value={editing.team_id || ''}
                                            onChange={e => setEditing({ ...editing, team_id: e.target.value })}
                                        >
                                            <option value="" className="text-black">Nenhum</option>
                                            {teams.map(team => (
                                                <option key={team.id} value={team.id} className="text-black">
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
