import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Season } from '../../types';
import { useAdmin } from '../../context/AdminContext';
import { Plus, Calendar, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { SeasonDetailsModal } from './SeasonDetailsModal';

export const SeasonsSection: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const { isEditing } = useAdmin();
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

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

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 300; // Adjust scroll amount
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

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

            {/* Carousel Container */}
            <div className="relative group/carousel">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll('left')}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-opacity disabled:opacity-0 ${isDarkMode ? 'bg-black/50 text-white hover:bg-black/70' : 'bg-white/80 text-black hover:bg-white'}`}
                >
                    <ChevronLeft size={24} />
                </button>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll('right')}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-opacity disabled:opacity-0 ${isDarkMode ? 'bg-black/50 text-white hover:bg-black/70' : 'bg-white/80 text-black hover:bg-white'}`}
                >
                    <ChevronRight size={24} />
                </button>

                {/* Scrollable Area */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {seasons.map(season => (
                        <div
                            key={season.id}
                            onClick={() => handleOpen(season)}
                            className={`flex-shrink-0 w-64 h-80 snap-center rounded-[30px] border flex flex-col items-center justify-center relative group cursor-pointer active:scale-95 transition-all ${isDarkMode ? 'bg-[#121212] border-white/5 hover:bg-[#1a1a1a]' : 'bg-white border-[#0B1D33]/5 hover:bg-gray-50'}`}
                        >
                            {isEditing && (
                                <button onClick={(e) => handleDelete(e, season.id)} className="absolute top-3 right-3 p-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <Trash2 size={14} />
                                </button>
                            )}

                            <div className={`p-6 rounded-3xl mb-4 transition-transform group-hover:scale-110 ${isDarkMode ? 'bg-white/5' : 'bg-[#0B1D33]/5'}`}>
                                <Calendar size={32} className={isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'} />
                            </div>
                            <h3 className={`text-2xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                {season.year}
                            </h3>
                            <span className="text-xs font-bold text-gray-500 uppercase mt-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">Ver Detalhes</span>
                        </div>
                    ))}
                </div>
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
