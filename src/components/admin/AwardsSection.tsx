import React, { useState, useEffect } from 'react';
import { Award } from '../../types';
import { listAwards, deleteAward, listAwardCategories } from '../../cms';
import { useAdmin } from '../../context/AdminContext';
import { EditTrigger } from './EditTrigger';
import { Trophy, ChevronRight, ChevronLeft, User, Users, X, ArrowRight } from 'lucide-react';
import { AwardDetailsModal } from './AwardDetailsModal';
import { AwardPopup } from './AwardPopup';
import { AwardGroupPopup } from './AwardGroupPopup';

interface AwardsSectionProps {
    isDarkMode: boolean;
}

export const AwardsSection: React.FC<AwardsSectionProps> = ({ isDarkMode }) => {
    const { isEditing } = useAdmin();
    const [awards, setAwards] = useState<Award[]>([]);
    const [awardCategories, setAwardCategories] = useState<Record<string, 'INDIVIDUAL' | 'TEAM'>>({});

    // UI State
    const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

    // Navigation Levels
    const [viewingCategory, setViewingCategory] = useState<'INDIVIDUAL' | 'TEAM' | null>(null);
    const [viewingAward, setViewingAward] = useState<Award | null>(null); // Single view
    const [viewingGroup, setViewingGroup] = useState<{ title: string, winnerName: string, awards: Award[] } | null>(null); // Group view

    // Admin State
    const [editingAward, setEditingAward] = useState<Award | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        fetchAwards();
        fetchCategories();
    }, []);

    async function fetchAwards() {
        const { data } = await listAwards();
        setAwards(data || []);
    }

    async function fetchCategories() {
        const { data } = await listAwardCategories();
        if (data) {
            const map: Record<string, 'INDIVIDUAL' | 'TEAM'> = {};
            data.forEach((c: any) => map[c.name] = c.type);
            setAwardCategories(map);
        }
    }

    // Group awards by year first
    const awardsByYear = awards.reduce((acc, award) => {
        if (!acc[award.year]) acc[award.year] = [];
        acc[award.year].push(award);
        return acc;
    }, {} as Record<string, Award[]>);

    const seasons = Object.keys(awardsByYear).sort((a, b) => b.localeCompare(a));

    useEffect(() => {
        if (!selectedSeason && seasons.length > 0) {
            setSelectedSeason(seasons[0]);
        }
    }, [seasons, selectedSeason]);

    // Grouping Logic for Selected Season
    const getSeasonGroups = () => {
        if (!selectedSeason) return { individual: [], team: [] };

        const currentAwards = awardsByYear[selectedSeason] || [];
        const groups: Record<string, { awards: Award[], type: 'INDIVIDUAL' | 'TEAM' }> = {};

        currentAwards.forEach(aw => {
            const type = awardCategories[aw.category] || 'INDIVIDUAL';
            const key = `${aw.category}-${aw.winner_name}`;

            if (!groups[key]) {
                groups[key] = { awards: [], type };
            }
            groups[key].awards.push(aw);
        });

        const individual: any[] = [];
        const team: any[] = [];

        Object.entries(groups).forEach(([key, group]) => {
            const representative = group.awards[0];
            const item = {
                ...representative,
                count: group.awards.length,
                allAwards: group.awards
            };
            if (group.type === 'TEAM') team.push(item);
            else individual.push(item);
        });

        // SORTING: Sort by count (descending) so "4x" appears first
        individual.sort((a, b) => b.count - a.count);
        team.sort((a, b) => b.count - a.count);

        return { individual, team };
    };

    const { individual, team } = getSeasonGroups();

    // Navigation Handlers
    function handlePrevSeason() {
        if (!selectedSeason) return;
        const index = seasons.indexOf(selectedSeason);
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

    function handleAwardClick(item: any) {
        if (isEditing) {
            handleEdit(item);
        } else {
            // Visitor View
            if (item.count > 1) {
                setViewingGroup({
                    title: item.category,
                    winnerName: item.winner_name,
                    awards: item.allAwards
                });
            } else {
                setViewingAward(item);
            }
        }
    }

    function handleCloseEditModal() {
        setShowEditModal(false);
        setEditingAward(null);
        fetchAwards();
    }

    // Modal Content for Category List
    const CategoryListModal = ({ type, items, onClose }: { type: 'TEAM' | 'INDIVIDUAL', items: any[], onClose: () => void }) => (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-2xl ${isDarkMode ? 'bg-[#121212]' : 'bg-white'} rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col h-[85vh]`}>

                {/* Header */}
                <div className={`p-8 border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'} flex justify-between items-center bg-inherit rounded-t-[40px] z-10`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                            {type === 'TEAM' ? <Users size={24} className="text-yellow-500" /> : <User size={24} className="text-blue-400" />}
                        </div>
                        <div>
                            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">
                                {items.length} Prêmios
                            </div>
                            <h2 className={`text-2xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                {type === 'TEAM' ? 'Prêmios de Time' : 'Prêmios Individuais'}
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-3 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'}`}>
                        <X size={24} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                    {items.map((award: any) => (
                        <div
                            key={award.id}
                            className={`relative flex items-center justify-between p-5 rounded-2xl border ${isDarkMode
                                ? 'bg-[#1a2c42] border-white/5 hover:border-white/10'
                                : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
                                } group cursor-pointer transition-all active:scale-[0.99]`}
                            onClick={() => handleAwardClick(award)}
                        >
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
                                        <Trophy size={22} className={type === 'TEAM' ? "text-yellow-400" : "text-blue-400"} />
                                    </div>
                                    {award.count > 1 && (
                                        <div className={`absolute -top-2 -right-2 ${type === 'TEAM' ? 'bg-yellow-400 text-black' : 'bg-blue-400 text-white'} text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg`}>
                                            {award.count}x
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className={`font-black text-sm uppercase tracking-wide ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                        {award.category}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {/* For Team Awards, we prefer the Team Name. usually winner_name IS the team name, but let's be safe */}
                                            {type === 'TEAM' && award.team ? award.team.name : award.winner_name}
                                        </span>

                                        {/* Show Manager name if available for Team Awards */}
                                        {type === 'TEAM' && award.manager && (
                                            <>
                                                <span className="text-gray-600">•</span>
                                                <span className={`text-xs font-bold uppercase ${isDarkMode ? 'text-yellow-500' : 'text-yellow-600'}`}>
                                                    {award.manager.name}
                                                </span>
                                            </>
                                        )}

                                        {/* Fallback to team display for Individual awards if linked */}
                                        {type === 'INDIVIDUAL' && award.team && award.winner_name.toLowerCase() !== award.team.name.toLowerCase() && (
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
                            <ChevronRight size={20} className="text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="px-6 pb-20">
            {isEditing && (
                <div className="flex justify-between items-center mb-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Admin: Awards</div>
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

                    {isEditing && (
                        <div className="max-w-2xl mx-auto mb-6">
                            <button
                                onClick={() => handleCreate(selectedSeason)}
                                className="w-full py-4 mb-2 border-2 border-dashed border-gray-500/20 hover:border-yellow-400/50 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors group"
                            >
                                <div className="p-1 bg-gray-500/20 group-hover:bg-yellow-400/20 rounded-lg transition-colors">
                                    <EditTrigger type="add" onClick={(e) => { e.stopPropagation(); handleCreate(selectedSeason); }} />
                                </div>
                                <span className="font-bold text-sm uppercase tracking-wider">Adicionar Prêmio em {selectedSeason}</span>
                            </button>
                        </div>
                    )}

                    {/* MAIN CATEGORY CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">

                        {/* TEAM AWARDS CARD */}
                        <div
                            onClick={() => team.length > 0 && setViewingCategory('TEAM')}
                            className={`relative overflow-hidden p-8 rounded-[32px] border transition-all duration-300 group cursor-pointer ${team.length === 0 ? 'opacity-50 cursor-not-allowed grayscale' :
                                    isDarkMode ? 'bg-[#1a2c42] border-white/5 hover:border-yellow-500/50 hover:bg-[#23354d]' : 'bg-white border-gray-100 hover:border-yellow-400 hover:shadow-xl'
                                }`}
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Users size={120} className={isDarkMode ? 'text-white' : 'text-black'} />
                            </div>

                            <div className="relative z-10 flex flex-col items-start h-full justify-between gap-8">
                                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-black/30' : 'bg-yellow-50'}`}>
                                    <Users size={32} className="text-yellow-500" />
                                </div>
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">
                                        {team.length > 0 ? `${team.length} Registros` : 'Vazio'}
                                    </div>
                                    <h3 className={`text-2xl font-black uppercase tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                        Prêmios de Time
                                    </h3>
                                </div>
                                <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} group-hover:gap-4 transition-all`}>
                                    Ver Todos <ArrowRight size={16} />
                                </div>
                            </div>
                        </div>

                        {/* INDIVIDUAL AWARDS CARD */}
                        <div
                            onClick={() => individual.length > 0 && setViewingCategory('INDIVIDUAL')}
                            className={`relative overflow-hidden p-8 rounded-[32px] border transition-all duration-300 group cursor-pointer ${individual.length === 0 ? 'opacity-50 cursor-not-allowed grayscale' :
                                    isDarkMode ? 'bg-[#1a2c42] border-white/5 hover:border-blue-400/50 hover:bg-[#23354d]' : 'bg-white border-gray-100 hover:border-blue-400 hover:shadow-xl'
                                }`}
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <User size={120} className={isDarkMode ? 'text-white' : 'text-black'} />
                            </div>

                            <div className="relative z-10 flex flex-col items-start h-full justify-between gap-8">
                                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-black/30' : 'bg-blue-50'}`}>
                                    <User size={32} className="text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">
                                        {individual.length > 0 ? `${individual.length} Registros` : 'Vazio'}
                                    </div>
                                    <h3 className={`text-2xl font-black uppercase tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                        Prêmios Individuais
                                    </h3>
                                </div>
                                <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} group-hover:gap-4 transition-all`}>
                                    Ver Todos <ArrowRight size={16} />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* CATEGORY LIST MODAL */}
            {viewingCategory && (
                <CategoryListModal
                    type={viewingCategory}
                    items={viewingCategory === 'TEAM' ? team : individual}
                    onClose={() => setViewingCategory(null)}
                />
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

            {/* VIEW GROUP DETAIL (Visitor) */}
            {viewingGroup && (
                <AwardGroupPopup
                    title={viewingGroup.title}
                    winnerName={viewingGroup.winnerName}
                    awards={viewingGroup.awards}
                    isDarkMode={isDarkMode}
                    onClose={() => setViewingGroup(null)}
                />
            )}
        </div>
    );
};
