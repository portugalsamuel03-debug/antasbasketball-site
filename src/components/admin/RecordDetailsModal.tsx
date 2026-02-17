import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
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
        type?: 'INDIVIDUAL' | 'TEAM',
        team_id?: string,
        manager_id?: string
    }>({
        title: '',
        description: '',
        year: '',
        type: 'INDIVIDUAL'
    });

    const [teams, setTeams] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);

    useEffect(() => {
        if (record) setFormData(record);
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
            } else {
                // If individual, we might want to allow team_id as context, or not?
                // For now, keep as is, but ensure empty strings are null
            }

            if (!payload.team_id) payload.team_id = null;
            if (!payload.manager_id) payload.manager_id = null;
            if (!payload.year) payload.year = null;

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
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <X size={20} className={isDarkMode ? 'text-white' : 'text-[#0B1D33]'} />
                        </button>
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
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Time</label>
                                <select
                                    value={formData.team_id || ''}
                                    onChange={e => setFormData({ ...formData, team_id: e.target.value })}
                                    className={`${inputClass} appearance-none`}
                                >
                                    <option value="" className="text-gray-500">Selecione o Time...</option>
                                    {teams.map(t => (
                                        <option key={t.id} value={t.id} className="text-black">{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Gestor / Jogador</label>
                                    <select
                                        value={formData.manager_id || ''}
                                        onChange={e => setFormData({ ...formData, manager_id: e.target.value })}
                                        className={`${inputClass} appearance-none`}
                                    >
                                        <option value="" className="text-gray-500">Selecione...</option>
                                        {managers.map(m => (
                                            <option key={m.id} value={m.id} className="text-black">{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Time (Opcional)</label>
                                    <select
                                        value={formData.team_id || ''}
                                        onChange={e => setFormData({ ...formData, team_id: e.target.value })}
                                        className={`${inputClass} appearance-none`}
                                    >
                                        <option value="" className="text-gray-500">Selecione...</option>
                                        {teams.map(t => (
                                            <option key={t.id} value={t.id} className="text-black">{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Temporada (Opcional)</label>
                            <select
                                value={formData.year || ''}
                                onChange={e => setFormData({ ...formData, year: e.target.value })}
                                className={`${inputClass} appearance-none py-2`}
                            >
                                <option value="">Selecione...</option>
                                {SEASON_OPTIONS.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Descrição / Detalhes</label>
                            <textarea
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className={`${inputClass} min-h-[100px] resize-none`}
                                placeholder="Ex: Fulano fez 50 pontos contra o time X em 2020..."
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
