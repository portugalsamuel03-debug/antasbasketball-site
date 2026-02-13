import React, { useState, useEffect } from 'react';
import { Award } from '../../types';
import { listAwards, deleteAward } from '../../cms';
import { useAdmin } from '../../context/AdminContext';
import { EditTrigger } from './EditTrigger';
import { Trophy, ChevronRight, ChevronLeft, X } from 'lucide-react';
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

    // Navigation Handlers
    function handlePrevSeason() {
        if (!selectedSeason) return;
        const index = seasons.indexOf(selectedSeason);
        // "Previous" in time means going to an older season (higher index in descending array)
        // "Left" arrow usually implies "Back" or "Older".
        // Let's implement Left = Older (Next Index), Right = Newer (Prev Index)
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
                    <EditTrigger type="add" onClick={() => handleCreate()} />
                </div>
            )}

            {/* SEASONS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {seasons.map(year => (
                    <div
                        key={year}
                        onClick={() => setSelectedSeason(year)}
                        className={`relative p-6 rounded-3xl cursor-pointer group transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-[#1a2c42] hover:bg-[#1f354d]' : 'bg-white hover:bg-gray-50'
                            } shadow-lg`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-black/30' : 'bg-gray-100'}`}>
                                    <Trophy size={24} className="text-yellow-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-xl font-black whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                        {year}
                                    </h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider truncate">
                                        {awardsByYear[year].length} Prêmios
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className={`opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'text-white' : 'text-black'}`} />
                        </div>
                    </div>
                ))}
            </div>

            {awards.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                    Nenhum prêmio cadastrado ainda.
                </div>
            )}

            {/* SEASON DETAILS MODAL (List of Awards) */}
            {selectedSeason && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedSeason(null)} />
                    <div className={`relative w-full max-w-lg rounded-[32px] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#0B1D33]' : 'bg-white'}`}>

                        {/* Header with Navigation */}
                        <div className={`p-6 pb-4 flex justify-between items-center ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <div className="flex items-center gap-4">
                                {/* Prev Button (Older) */}
                                <button
                                    onClick={handlePrevSeason}
                                    disabled={seasons.indexOf(selectedSeason) >= seasons.length - 1}
                                    className={`p-2 rounded-full transition ${seasons.indexOf(selectedSeason) >= seasons.length - 1
                                            ? 'opacity-20 cursor-not-allowed'
                                            : 'hover:bg-black/10'
                                        } ${isDarkMode ? 'text-white' : 'text-black'}`}
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <div>
                                    <h2 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                        {selectedSeason}
                                    </h2>
                                    <p className="text-xs text-yellow-500 font-bold uppercase tracking-widest leading-none">
                                        Lista de Vencedores
                                    </p>
                                </div>

                                {/* Next Button (Newer) */}
                                <button
                                    onClick={handleNextSeason}
                                    disabled={seasons.indexOf(selectedSeason) <= 0}
                                    className={`p-2 rounded-full transition ${seasons.indexOf(selectedSeason) <= 0
                                            ? 'opacity-20 cursor-not-allowed'
                                            : 'hover:bg-black/10'
                                        } ${isDarkMode ? 'text-white' : 'text-black'}`}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            <button onClick={() => setSelectedSeason(null)} className={`p-2 rounded-full hover:bg-black/10 transition ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                            {awardsByYear[selectedSeason].map(award => (
                                <div
                                    key={award.id}
                                    className={`flex items-center justify-between p-4 rounded-2xl ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
                                        } group cursor-pointer transition-colors`}
                                    onClick={() => isEditing ? handleEdit(award) : setViewingAward(award)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-yellow-400/10 rounded-xl">
                                            <Trophy size={18} className="text-yellow-400" />
                                        </div>
                                        <div>
                                            <div className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                                {award.category}
                                            </div>
                                            <div className="text-xs text-gray-400 font-medium">
                                                {award.winner_name}
                                                {award.team && <span className="opacity-70"> • {award.team.name}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <EditTrigger type="edit" onClick={(e) => { e.stopPropagation(); handleEdit(award); }} />
                                            <EditTrigger type="delete" onClick={(e) => handleDelete(award.id, e)} />
                                        </div>
                                    ) : (
                                        <ChevronRight size={16} className="text-gray-500 opacity-50" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Footer Action (Admin Only) */}
                        {isEditing && (
                            <div className={`p-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                                <button
                                    onClick={() => handleCreate(selectedSeason)}
                                    className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-xl text-sm uppercase tracking-widest transition-colors"
                                >
                                    Adicionar Prêmio em {selectedSeason}
                                </button>
                            </div>
                        )}
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
