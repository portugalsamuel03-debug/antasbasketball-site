import React, { useState, useEffect } from 'react';
import { Award } from '../../types';
import { listAwards, deleteAward } from '../../cms';
import { useAdmin } from '../../context/AdminContext';
import { EditTrigger } from './EditTrigger';
import { Trophy, ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { AwardDetailsModal } from './AwardDetailsModal';
import { AwardPopup } from './AwardPopup';

interface AwardsSectionProps {
    isDarkMode: boolean;
}

export const AwardsSection: React.FC<AwardsSectionProps> = ({ isDarkMode }) => {
    const { isEditing } = useAdmin();
    const [awards, setAwards] = useState<Award[]>([]);

    // UI State
    const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
    const [viewingAward, setViewingAward] = useState<Award | null>(null); // For single award view (visitor)
    const [editingAward, setEditingAward] = useState<Award | null>(null); // For edit modal (admin)
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        fetchAwards();
    }, []);

    async function fetchAwards() {
        const { data } = await listAwards();
        setAwards(data || []);
    }

    // Group awards by year
    const awardsByYear = awards.reduce((acc, award) => {
        if (!acc[award.year]) acc[award.year] = [];
        acc[award.year].push(award);
        return acc;
    }, {} as Record<string, Award[]>);

    const seasons = Object.keys(awardsByYear).sort((a, b) => b.localeCompare(a));

    // Auto-select latest season on load
    useEffect(() => {
        if (!selectedSeason && seasons.length > 0) {
            setSelectedSeason(seasons[0]);
        }
    }, [seasons, selectedSeason]);

    // Navigation Handlers
    function handlePrevSeason() {
        if (!selectedSeason) return;
        const index = seasons.indexOf(selectedSeason);
        // "Previous" (Right Arrow visually for "Next Year", but list is descending)
        // Let's stick to: Left Arrow = Older, Right Arrow = Newer
        // List is DESC: [2024, 2023, 2022...]
        // Newer (Right) -> Index decrease (0 is newest)
        // Older (Left) -> Index increase

        if (index < seasons.length - 1) {
            setSelectedSeason(seasons[index + 1]);
        }
    }

    function handleNextSeason() {
        if (!selectedSeason) return;
        const index = seasons.indexOf(selectedSeason);
        if (index > 0) {
            setSelectedSeason(seasons[index - 1]);
        }
    }

    async function handleDelete(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm('Deletar este prêmio?')) return;
        await deleteAward(id);
        fetchAwards();
    }

    function handleCreate(initialYear?: string) {
        setEditingAward({ id: '', year: initialYear || '', category: '', winner_name: '', team_id: '' } as Award);
        setShowEditModal(true);
    }

    function handleEdit(award: Award) {
        setEditingAward(award);
        setShowEditModal(true);
    }

    function handleCloseEditModal() {
        setShowEditModal(false);
        setEditingAward(null);
        fetchAwards();
    }

    return (
        <div className="px-6 pb-20">
            {isEditing && (
                <div className="flex justify-between items-center mb-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Admin: Awards</div>
                    {/* Only show generic add if no season selected, otherwise use season-specific add button */}
                    {!selectedSeason && <EditTrigger type="add" onClick={() => handleCreate()} />}
                </div>
            )}

            {awards.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                    Nenhum prêmio cadastrado ainda.
                    {isEditing && (
                        <div className="mt-4">
                            <button
                                onClick={() => handleCreate()}
                                className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl text-sm"
                            >
                                Criar Primeiro Prêmio
                            </button>
                        </div>
                    )}
                </div>
            )}

            {selectedSeason && (
                <div className="animate-in fade-in duration-300 slide-in-from-bottom-4">

                    {/* SEASON NAV HEADER */}
                    <div className="flex flex-col items-center justify-center mb-8 relative">
                        {/* ABSOLUTE ARROWS for desktop/centering, or FLEX for simple layout */}
                        <div className="flex items-center gap-6 z-10">
                            <button
                                onClick={handlePrevSeason}
                                disabled={seasons.indexOf(selectedSeason) >= seasons.length - 1}
                                className={`p-4 rounded-full transition-all active:scale-95 ${seasons.indexOf(selectedSeason) >= seasons.length - 1
                                        ? 'opacity-20 cursor-not-allowed'
                                        : isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'
                                    }`}
                            >
                                <ChevronLeft size={24} />
                            </button>

                            <div className="text-center min-w-[160px]">
                                <h2 className={`text-4xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                    {selectedSeason}
                                </h2>
                                <p className="text-xs text-yellow-500 font-black uppercase tracking-widest mt-1">
                                    {awardsByYear[selectedSeason]?.length || 0} Prêmios
                                </p>
                            </div>

                            <button
                                onClick={handleNextSeason}
                                disabled={seasons.indexOf(selectedSeason) <= 0}
                                className={`p-4 rounded-full transition-all active:scale-95 ${seasons.indexOf(selectedSeason) <= 0
                                        ? 'opacity-20 cursor-not-allowed'
                                        : isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'
                                    }`}
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>

                    {/* AWARDS LIST */}
                    <div className="grid grid-cols-1 gap-3 max-w-2xl mx-auto">
                        {isEditing && (
                            <button
                                onClick={() => handleCreate(selectedSeason)}
                                className="w-full py-4 mb-2 border-2 border-dashed border-gray-500/20 hover:border-yellow-400/50 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors group"
                            >
                                <div className="p-1 bg-gray-500/20 group-hover:bg-yellow-400/20 rounded-lg transition-colors">
                                    <EditTrigger type="add" onClick={(e) => { e.stopPropagation(); handleCreate(selectedSeason); }} />
                                </div>
                                <span className="font-bold text-sm uppercase tracking-wider">Adicionar Prêmio em {selectedSeason}</span>
                            </button>
                        )}

                        {awardsByYear[selectedSeason]?.map(award => (
                            <div
                                key={award.id}
                                className={`flex items-center justify-between p-4 rounded-2xl border ${isDarkMode
                                        ? 'bg-[#1a2c42] border-white/5 hover:border-white/10'
                                        : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
                                    } group cursor-pointer transition-all`}
                                onClick={() => isEditing ? handleEdit(award) : setViewingAward(award)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
                                        <Trophy size={20} className="text-yellow-400" />
                                    </div>
                                    <div>
                                        <div className={`font-black text-sm uppercase tracking-wide ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                            {award.category}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {award.winner_name}
                                            </span>
                                            {award.team && (
                                                <>
                                                    <span className="text-gray-600">•</span>
                                                    <span className="text-xs text-gray-500 font-bold uppercase">
                                                        {award.team.name}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <EditTrigger type="edit" onClick={(e) => { e.stopPropagation(); handleEdit(award); }} />
                                        <EditTrigger type="delete" onClick={(e) => handleDelete(award.id, e)} />
                                    </div>
                                ) : (
                                    <ChevronRight size={18} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* EDIT/CREATE MODAL */}
            {showEditModal && editingAward && (
                <AwardDetailsModal
                    award={editingAward}
                    isDarkMode={isDarkMode}
                    onClose={handleCloseEditModal}
                />
            )}

            {/* VIEW SINGLE AWARD DETAIL (Visitor) */}
            {viewingAward && (
                <AwardPopup
                    award={viewingAward}
                    isDarkMode={isDarkMode}
                    onClose={() => setViewingAward(null)}
                />
            )}
        </div>
    );
};
