import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RecordItem } from '../../types';
import { useAdmin } from '../../context/AdminContext';
import { Trash2, Edit2, Plus, Trophy } from 'lucide-react';
import { RecordDetailsModal } from './RecordDetailsModal';

export const RecordsSection: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const { isEditing } = useAdmin();
    const [records, setRecords] = useState<RecordItem[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Partial<RecordItem> | null>(null);

    const fetchRecords = async () => {
        const { data } = await supabase.from('records').select('*').order('created_at', { ascending: true });
        if (data) setRecords(data);
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja apagar este recorde?')) return;
        await supabase.from('records').delete().eq('id', id);
        fetchRecords();
    };

    return (
        <div className="px-6 pb-24">
            <div className="flex justify-between items-center mb-6">
                <h2 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Recordes Históricos
                </h2>
                {isEditing && (
                    <button
                        onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
                        className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    >
                        <Plus size={16} strokeWidth={3} />
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {records.length === 0 ? (
                    <div className="text-center py-12 opacity-50">
                        <Trophy size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-700' : 'text-gray-300'}`} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhum recorde registrado</p>
                    </div>
                ) : (
                    records.map(record => (
                        <div key={record.id} className={`p-5 rounded-3xl border relative group ${isDarkMode ? 'bg-[#121212] border-white/5' : 'bg-white border-[#0B1D33]/5'}`}>
                            {isEditing && (
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingRecord(record); setIsModalOpen(true); }} className="p-2 hover:text-yellow-400 transition-colors"><Edit2 size={14} /></button>
                                    <button onClick={() => handleDelete(record.id)} className="p-2 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                </div>
                            )}

                            <h3 className={`text-sm font-black uppercase tracking-wide mb-2 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                {record.title}
                            </h3>
                            <p className={`text-xs font-medium leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {record.description}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && (
                <RecordDetailsModal
                    record={editingRecord}
                    isDarkMode={isDarkMode}
                    onClose={() => setIsModalOpen(false)}
                    onSave={fetchRecords}
                />
            )}
        </div>
    );
};
