import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Season } from '../../types';
import { useAdmin } from '../../context/AdminContext';
import { Plus, Calendar, Edit2, Trash2 } from 'lucide-react';
import { SeasonDetailsModal } from './SeasonDetailsModal';

export const SeasonsSection: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const { isEditing } = useAdmin();
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const fetchSeasons = async () => {
        const { data } = await supabase.from('seasons').select('*').order('year', { ascending: false });
        if (data) setSeasons(data);
    };

    useEffect(() => {
        fetchSeasons();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Tem certeza que deseja apagar esta temporada? Isso apagará também a classificação.')) return;
        await supabase.from('seasons').delete().eq('id', id);
        fetchSeasons();
    };

    const handleCreate = () => {
        setSelectedSeason(null);
        setIsCreating(true);
        setIsModalOpen(true);
    };

    const handleOpen = (season: Season) => {
        setSelectedSeason(season);
        setIsCreating(false);
        setIsModalOpen(true);
    }

    return (
        <div className="px-6 pb-24">
            <div className="flex justify-between items-center mb-6">
                <h2 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Temporadas Antas
                </h2>
                {isEditing && (
                    <button
                        onClick={handleCreate}
                        className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    >
                        <Plus size={16} strokeWidth={3} />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {seasons.map(season => (
                    <div
                        key={season.id}
                        onClick={() => handleOpen(season)}
                        className={`aspect-square rounded-[30px] border flex flex-col items-center justify-center relative group cursor-pointer active:scale-95 transition-all ${isDarkMode ? 'bg-[#121212] border-white/5 hover:bg-[#1a1a1a]' : 'bg-white border-[#0B1D33]/5 hover:bg-gray-50'}`}
                    >
                        {isEditing && (
                            <button onClick={(e) => handleDelete(e, season.id)} className="absolute top-3 right-3 p-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <Trash2 size={14} />
                            </button>
                        )}

                        <div className={`p-4 rounded-full mb-3 ${isDarkMode ? 'bg-white/5' : 'bg-[#0B1D33]/5'}`}>
                            <Calendar size={24} className={isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'} />
                        </div>
                        <h3 className={`text-lg font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                            {season.year}
                        </h3>
                        <span className="text-[10px] font-bold text-gray-500 uppercase mt-1">Ver Detalhes</span>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <SeasonDetailsModal
                    season={selectedSeason}
                    isCreating={isCreating}
                    isDarkMode={isDarkMode}
                    canEdit={isEditing}
                    onClose={() => setIsModalOpen(false)}
                    onSave={fetchSeasons}
                />
            )}
        </div>
    );
};
