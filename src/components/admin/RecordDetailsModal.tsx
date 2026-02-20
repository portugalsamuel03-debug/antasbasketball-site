import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { RecordItem } from '../../types';
import { useAdmin } from '../../context/AdminContext';
import { SEASON_OPTIONS } from '../../utils/seasons';
import { listTeams, listManagers } from '../../cms';

interface RecordDetailsModalProps {
    record: Partial<RecordItem> | null;
    isDarkMode: boolean;
    onClose: () => void;
    onSave: () => void;
}

export const RecordDetailsModal: React.FC<RecordDetailsModalProps> = ({ record, isDarkMode, onClose, onSave }) => {
    const { isAdmin } = useAdmin();
    const [formData, setFormData] = useState<Partial<RecordItem> & {
        type?: 'INDIVIDUAL' | 'TEAM' | 'AUTOMATIC',
        team_id?: string,
        manager_id?: string,
        team_ids?: string[],
        manager_ids?: string[],
        team_years?: string[],
        manager_years?: string[]
    }>({
        title: '',
        description: '',
        year: '',
        type: 'INDIVIDUAL',
        value: '',
        team_ids: [''],
        manager_ids: [''],
        team_years: [''],
        manager_years: ['']
    });

    const [teams, setTeams] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);

    useEffect(() => {
        if (record) {
            const parsedYears = record.year ? record.year.split(',') : [];
            setFormData({
                ...record,
                team_ids: record.team_ids?.length ? record.team_ids : (record.team_id ? [record.team_id] : ['']),
                manager_ids: record.manager_ids?.length ? record.manager_ids : (record.manager_id ? [record.manager_id] : ['']),
                team_years: record.type === 'TEAM' ? (parsedYears.length ? parsedYears : ['']) : [''],
                manager_years: record.type !== 'TEAM' ? (parsedYears.length ? parsedYears : ['']) : ['']
            });
        }
        fetchData();
    }, [record]);

    const fetchData = async () => {
        const { data: t } = await listTeams();
        if (t) setTeams(t);
        const { data: m } = await listManagers();
        if (m) setManagers(m);
    };

    const handleSave = async () => {
        if (!isAdmin) return alert('Apenas administradores podem realizar esta ação.');
        if (!formData.title) return alert('O título é obrigatório');

        try {
            // Clean up fields based on type
            const payload: any = { ...formData };

            // Clean ID if empty
            if (!payload.id) delete payload.id;

            if (payload.type === 'TEAM') {
                payload.manager_id = null; // Explicitly clear if switching types
                payload.manager_ids = [];
                payload.manager_years = [];
            } else {
                payload.team_years = []; // Team years only for team records
            }

            // Cleanup arrays
            payload.team_ids = payload.team_ids?.filter((id: string) => id.trim() !== '') || [];
            payload.manager_ids = payload.manager_ids?.filter((id: string) => id.trim() !== '') || [];

            payload.team_id = payload.team_ids.length > 0 ? payload.team_ids[0] : null;
            payload.manager_id = payload.manager_ids.length > 0 ? payload.manager_ids[0] : null;

            // Combine years
            const combinedYears = [
                ...(payload.team_years || []),
                ...(payload.manager_years || [])
            ].filter((y: string) => y && y.trim() !== '');

            payload.year = combinedYears.length > 0 ? combinedYears.join(',') : null;

            // Delete virtual arrays
            delete payload.team_years;
            delete payload.manager_years;

            if (!payload.value) payload.value = null;

            if (record?.id) {
                await supabase.from('records').update(payload).eq('id', record.id);
            } else {
                await supabase.from('records').insert(payload);
            }
            onSave();
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(`Erro ao salvar recorde: ${error.message}`);
        }
    };

    const handleDelete = async () => {
        if (!isAdmin) return alert('Apenas administradores podem realizar esta ação.');
        if (!record?.id) return;

        if (window.confirm('Tem certeza que deseja excluir este recorde?')) {
            try {
                await supabase.from('records').delete().eq('id', record.id);
                onSave();
                onClose();
            } catch (error: any) {
                console.error(error);
                alert(`Erro ao excluir recorde: ${error.message}`);
            }
        }
    };

    const inputClass = `w-full bg-transparent border-b p-3 text-sm font-bold focus:outline-none transition-colors ${isDarkMode
        ? 'border-white/10 text-white focus:border-yellow-400 placeholder:text-gray-700'
        : 'border-[#0B1D33]/10 text-[#0B1D33] focus:border-[#0B1D33] placeholder:text-gray-300'
        }`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#121212]' : 'bg-white'} flex flex-col max-h-[90vh]`}>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className={`text-xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                            {record?.id ? 'Editar Recorde' : 'Novo Recorde'}
                        </h2>
                        <div className="flex items-center gap-2">
                            {record?.id && record?.id.includes('-') && (
                                <button onClick={handleDelete} className="p-2 rounded-full hover:bg-red-500/10 text-red-500 transition-colors" title="Excluir Recorde">
                                    <Trash2 size={20} />
                                </button>
                            )}
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                <X size={20} className={isDarkMode ? 'text-white' : 'text-[#0B1D33]'} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Título do Recorde</label>
                            <input
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className={inputClass}
                                placeholder="EX: MAIS PONTOS EM UM JOGO"
                            />
                        </div>

                        {/* Type Toggle */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFormData({ ...formData, type: 'INDIVIDUAL' })}
                                className={`flex-1 py-3 rounded-xl font-black text-xs uppercase border ${formData.type !== 'TEAM'
                                    ? 'bg-yellow-400 border-yellow-400 text-black'
                                    : 'border-gray-500 text-gray-500 hover:border-gray-300'}`}
                            >
                                Individual
                            </button>
                            <button
                                onClick={() => setFormData({ ...formData, type: 'TEAM' })}
                                className={`flex-1 py-3 rounded-xl font-black text-xs uppercase border ${formData.type === 'TEAM'
                                    ? 'bg-yellow-400 border-yellow-400 text-black'
                                    : 'border-gray-500 text-gray-500 hover:border-gray-300'}`}
                            >
                                Time
                            </button>
                        </div>

                        {formData.type === 'TEAM' ? (
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Time(s) e Temporada</label>
                                {formData.team_ids?.map((id, index) => (
                                    <div key={`team-${index}`} className="flex gap-2 items-center">
                                        <select
                                            value={id}
                                            onChange={e => {
                                                const newIds = [...(formData.team_ids || [])];
                                                newIds[index] = e.target.value;
                                                setFormData({ ...formData, team_ids: newIds });
                                            }}
                                            className={`${inputClass} appearance-none flex-[2] truncate`}
                                        >
                                            <option value="" className={isDarkMode ? 'bg-[#121212] text-gray-400' : 'bg-white text-gray-500'}>Time...</option>
                                            {teams.map(t => (
                                                <option key={t.id} value={t.id} className={isDarkMode ? 'bg-[#121212] text-white' : 'bg-white text-black'}>{t.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={formData.team_years?.[index] || ''}
                                            onChange={e => {
                                                const newYears = [...(formData.team_years || [])];
                                                newYears[index] = e.target.value;
                                                setFormData({ ...formData, team_years: newYears });
                                            }}
                                            className={`${inputClass} appearance-none flex-1 min-w-[90px] px-1`}
                                        >
                                            <option value="" className={isDarkMode ? 'bg-[#121212] text-gray-400' : 'bg-white text-gray-500'}>Ano...</option>
                                            {SEASON_OPTIONS.map(s => (
                                                <option key={s} value={s} className={isDarkMode ? 'bg-[#121212] text-white' : 'bg-white text-black'}>{s}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => {
                                                const newIds = formData.team_ids?.filter((_, i) => i !== index);
                                                const newYears = formData.team_years?.filter((_, i) => i !== index);
                                                setFormData({
                                                    ...formData,
                                                    team_ids: newIds?.length ? newIds : [''],
                                                    team_years: newYears?.length ? newYears : ['']
                                                });
                                            }}
                                            className="p-3 aspect-square flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors shrink-0"
                                            title="Remover Time"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setFormData({
                                        ...formData,
                                        team_ids: [...(formData.team_ids || []), ''],
                                        team_years: [...(formData.team_years || []), '']
                                    })}
                                    className="text-[10px] px-2 py-1 font-bold text-yellow-500 hover:text-yellow-400 mt-2 flex items-center uppercase"
                                >
                                    + Adicionar Time
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Gestor(es) e Temporada</label>
                                    {formData.manager_ids?.map((id, index) => (
                                        <div key={`mgr-${index}`} className="flex gap-2 items-center">
                                            <select
                                                value={id}
                                                onChange={e => {
                                                    const newIds = [...(formData.manager_ids || [])];
                                                    newIds[index] = e.target.value;
                                                    setFormData({ ...formData, manager_ids: newIds });
                                                }}
                                                className={`${inputClass} appearance-none flex-[2] truncate`}
                                            >
                                                <option value="" className={isDarkMode ? 'bg-[#121212] text-gray-400' : 'bg-white text-gray-500'}>Gestor...</option>
                                                {managers.map(m => (
                                                    <option key={m.id} value={m.id} className={isDarkMode ? 'bg-[#121212] text-white' : 'bg-white text-black'}>{m.name}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={formData.manager_years?.[index] || ''}
                                                onChange={e => {
                                                    const newYears = [...(formData.manager_years || [])];
                                                    newYears[index] = e.target.value;
                                                    setFormData({ ...formData, manager_years: newYears });
                                                }}
                                                className={`${inputClass} appearance-none flex-1 min-w-[90px] px-1`}
                                            >
                                                <option value="" className={isDarkMode ? 'bg-[#121212] text-gray-400' : 'bg-white text-gray-500'}>Ano...</option>
                                                {SEASON_OPTIONS.map(s => (
                                                    <option key={s} value={s} className={isDarkMode ? 'bg-[#121212] text-white' : 'bg-white text-black'}>{s}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => {
                                                    const newIds = formData.manager_ids?.filter((_, i) => i !== index);
                                                    const newYears = formData.manager_years?.filter((_, i) => i !== index);
                                                    setFormData({
                                                        ...formData,
                                                        manager_ids: newIds?.length ? newIds : [''],
                                                        manager_years: newYears?.length ? newYears : ['']
                                                    });
                                                }}
                                                className="p-3 aspect-square flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors shrink-0"
                                                title="Remover Gestor"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setFormData({
                                            ...formData,
                                            manager_ids: [...(formData.manager_ids || []), ''],
                                            manager_years: [...(formData.manager_years || []), '']
                                        })}
                                        className="text-[10px] px-2 py-1 font-bold text-yellow-500 hover:text-yellow-400 mt-2 flex items-center uppercase"
                                    >
                                        + Adicionar Gestor
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Time(s) de Contexto (Opcional)</label>
                                    {formData.team_ids?.map((id, index) => (
                                        <div key={`ctx-${index}`} className="flex gap-2 items-center">
                                            <select
                                                value={id}
                                                onChange={e => {
                                                    const newIds = [...(formData.team_ids || [])];
                                                    newIds[index] = e.target.value;
                                                    setFormData({ ...formData, team_ids: newIds });
                                                }}
                                                className={`${inputClass} appearance-none flex-1`}
                                            >
                                                <option value="" className={isDarkMode ? 'bg-[#121212] text-gray-400' : 'bg-white text-gray-500'}>Time Extra (Ex: adversário)...</option>
                                                {teams.map(t => (
                                                    <option key={t.id} value={t.id} className={isDarkMode ? 'bg-[#121212] text-white' : 'bg-white text-black'}>{t.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => {
                                                    const newIds = formData.team_ids?.filter((_, i) => i !== index);
                                                    setFormData({ ...formData, team_ids: newIds?.length ? newIds : [''] });
                                                }}
                                                className="p-3 aspect-square flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors shrink-0"
                                                title="Remover Time"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setFormData({ ...formData, team_ids: [...(formData.team_ids || []), ''] })}
                                        className="text-[10px] px-2 py-1 font-bold text-yellow-500 hover:text-yellow-400 mt-2 flex items-center uppercase"
                                    >
                                        + Adicionar Time Extra
                                    </button>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Descrição / Detalhes</label>
                            <textarea
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className={`${inputClass} min-h-[100px] resize-none`}
                                placeholder="Ex: Fulano fez 50 pontos contra o time X em 2020..."
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Valor (P/ Quadrante Amarelo - Opcional)</label>
                            <input
                                value={formData.value || ''}
                                onChange={e => setFormData({ ...formData, value: e.target.value })}
                                className={inputClass}
                                placeholder="Ex: 18, 50, etc."
                            />
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className={`flex-shrink-0 p-6 border-t ${isDarkMode ? 'bg-[#121212] border-white/5' : 'bg-white border-[#0B1D33]/5'}`}>
                    <button
                        onClick={handleSave}
                        className="w-full py-4 rounded-2xl bg-yellow-400 text-black font-black uppercase tracking-widest hover:bg-yellow-300 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        Salvar Recorde
                    </button>
                </div>
            </div>
        </div>
    );
};
