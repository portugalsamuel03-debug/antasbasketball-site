import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { RecordItem } from '../../types';

interface RecordDetailsModalProps {
    record: Partial<RecordItem> | null;
    isDarkMode: boolean;
    onClose: () => void;
    onSave: () => void;
}

export const RecordDetailsModal: React.FC<RecordDetailsModalProps> = ({ record, isDarkMode, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<RecordItem>>({
        title: '',
        description: ''
    });

    useEffect(() => {
        if (record) setFormData(record);
    }, [record]);

    const handleSave = async () => {
        if (!formData.title) return alert('O título é obrigatório');

        try {
            if (record?.id) {
                await supabase.from('records').update(formData).eq('id', record.id);
            } else {
                await supabase.from('records').insert(formData);
            }
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar recorde');
        }
    };

    const inputClass = `w-full bg-transparent border-b p-3 text-sm font-bold focus:outline-none transition-colors ${isDarkMode
            ? 'border-white/10 text-white focus:border-yellow-400 placeholder:text-gray-700'
            : 'border-[#0B1D33]/10 text-[#0B1D33] focus:border-[#0B1D33] placeholder:text-gray-300'
        }`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#121212]' : 'bg-white'}`}>
                <div className="p-8 pb-32 space-y-6">
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

                <div className={`absolute bottom-0 left-0 right-0 p-6 border-t ${isDarkMode ? 'bg-[#121212] border-white/5' : 'bg-white border-[#0B1D33]/5'}`}>
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
