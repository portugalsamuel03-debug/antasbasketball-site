import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { supabase } from '../../lib/supabase';
import { listTeams, listChampions, listAwards } from '../../cms';
import { TeamRow, Champion, Award } from '../../types';
import { EditTrigger } from './EditTrigger';
import { Users, Trash2, Award as AwardIcon, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { ManagerDetailsModal } from './ManagerDetailsModal';

export interface Manager {
    id: string;
    name: string;
    image_url?: string;
    teams_managed?: string; // Legacy
    teams_managed_ids?: string[]; // New
    titles_won?: string; // Legacy
    individual_titles?: string; // New
    bio?: string;
    is_active?: boolean;
}

interface ManagersSectionProps {
    isDarkMode: boolean;
}

const ITEMS_PER_PAGE = 5;

export const ManagersSection: React.FC<ManagersSectionProps> = ({ isDarkMode }) => {
    const { isEditing } = useAdmin();
    const [managers, setManagers] = useState<Manager[]>([]);
    const [selectedManager, setSelectedManager] = useState<Partial<Manager> | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);

    // Aux data
    const [teamsMap, setTeamsMap] = useState<Record<string, TeamRow>>({});
    const [championCounts, setChampionCounts] = useState<Record<string, number>>({});
    const [runnerUpCounts, setRunnerUpCounts] = useState<Record<string, number>>({});
    const [managerAwards, setManagerAwards] = useState<Record<string, string[]>>({});

    const fetchData = async () => {
        // Fetch Managers
        const { data: managersData } = await supabase.from('managers').select('*').order('created_at', { ascending: true });
        if (managersData) setManagers(managersData);

        // Fetch Teams to map IDs to Names
        const { data: teamsData } = await listTeams();
        const tMap: Record<string, TeamRow> = {};
        teamsData?.forEach((t: any) => tMap[t.id] = t);
        setTeamsMap(tMap);

        // Fetch Champions to count titles & runner-ups
        const { data: champsData } = await listChampions();
        const cCounts: Record<string, number> = {};
        const rCounts: Record<string, number> = {};

        (champsData as Champion[])?.forEach(c => {
            if (c.manager_id) {
                cCounts[c.manager_id] = (cCounts[c.manager_id] || 0) + 1;
            }
            if (c.runner_up_manager_id) {
                rCounts[c.runner_up_manager_id] = (rCounts[c.runner_up_manager_id] || 0) + 1;
            }
        });
        setChampionCounts(cCounts);
        setRunnerUpCounts(rCounts);

        // Fetch Awards
        const { data: awardsData } = await listAwards();
        const mAwards: Record<string, string[]> = {};
        (awardsData as Award[])?.forEach(a => {
            if (a.manager_id) {
                if (!mAwards[a.manager_id]) mAwards[a.manager_id] = [];
                mAwards[a.manager_id].push(`${a.year} ${a.category}`);
            }
        });
        setManagerAwards(mAwards);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Deletar este gestor?')) {
            await supabase.from('managers').delete().eq('id', id);
            fetchData();
        }
    };

    const activeManagers = managers.filter(m => m.is_active !== false);
    const historicManagers = managers.filter(m => m.is_active === false);

    // Pagination Logic
    const totalPages = Math.ceil(activeManagers.length / ITEMS_PER_PAGE);
    const paginatedManagers = activeManagers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const ManagerCard = ({ manager }: { manager: Manager }) => {
        // Resolve Teams
        const linkedTeams = (manager.teams_managed_ids || [])
            .map(id => teamsMap[id])
            .filter(Boolean);

        // Resolve Titles & Runner-ups
        const titleCount = championCounts[manager.id] || 0;
        const runnerUpCount = runnerUpCounts[manager.id] || 0;

        const parts = [];
        if (titleCount > 0) parts.push(`${titleCount}x Campeão`);
        // if (runnerUpCount > 0) parts.push(`${runnerUpCount}x Vice`); // Simplify summary

        const titleText = parts.join(' • ');

        return (
            <div
                className={`relative rounded-3xl overflow-hidden shadow-lg group cursor-pointer transition-transform hover:scale-[1.01] ${isDarkMode ? 'bg-[#1a2c42]' : 'bg-white'} `}
                onClick={() => setSelectedManager(manager)} // Open for everyone
            >
                {/* Background Gradient */}
                <div className={`absolute inset-0 opacity-10 ${isDarkMode ? 'bg-white' : 'bg-black'} `} />

                <div className="relative p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                    {/* Manager Image */}
                    <div className={`w-24 h-24 rounded-full border-4 overflow-hidden shadow-xl flex-shrink-0 bg-gray-300 ${manager.is_active !== false ? 'border-yellow-400' : 'border-gray-500 grayscale'} `}>
                        {manager.image_url ? (
                            <img src={manager.image_url} alt={manager.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <Users size={32} />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-2">
                        <div>
                            <h3 className={`text-2xl font-black uppercase leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'} `}>
                                {manager.name}
                            </h3>
                            {/* Summary Bio (Truncated) */}
                            {manager.bio && (
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest line-clamp-1">
                                    {manager.bio}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1 text-xs">
                            {/* Teams Logic */}
                            {(linkedTeams.length > 0) ? (
                                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start text-gray-400">
                                    <Briefcase size={12} className="text-yellow-400" />
                                    {linkedTeams.slice(0, 2).map((t, idx) => ( // Show only first 2 teams in summary
                                        <span key={t.id} className="uppercase">{t.name}{idx < linkedTeams.length - 1 || linkedTeams.length > 2 ? ', ' : ''}</span>
                                    ))}
                                    {linkedTeams.length > 2 && <span>+{linkedTeams.length - 2}</span>}
                                </div>
                            ) : (manager.teams_managed && (
                                <div className="flex items-center gap-2 justify-center sm:justify-start text-gray-400">
                                    <Briefcase size={12} className="text-yellow-400" />
                                    <span>{manager.teams_managed}</span>
                                </div>
                            ))}

                            {/* Titles Logic: Only major titles in summary */}
                            {titleText && (
                                <div className="flex items-center gap-2 justify-center sm:justify-start">
                                    <AwardIcon size={12} className="text-yellow-400" />
                                    <span className="font-bold text-yellow-500 uppercase">{titleText}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chevron Hint */}
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity hidden sm:block">
                        <ChevronRight size={24} className={isDarkMode ? 'text-white' : 'text-gray-400'} />
                    </div>
                </div>

                {isEditing && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => handleDelete(manager.id, e)}
                            className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="px-6 pb-20 space-y-12">

            {/* Active Managers */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="text-xs font-black uppercase tracking-widest text-yellow-500">Gestores em Atividade</div>
                    {isEditing && <EditTrigger type="add" onClick={() => setSelectedManager({})} />}
                </div>

                <div className="grid gap-6">
                    {paginatedManagers.map(manager => (
                        <ManagerCard key={manager.id} manager={manager} />
                    ))}
                    {activeManagers.length === 0 && (
                        <div className="text-gray-500 text-sm italic">Nenhum gestor ativo.</div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={`p-2 rounded-full transition-colors ${currentPage === 1 ? 'text-gray-600 cursor-not-allowed' : 'bg-yellow-400 text-black hover:bg-yellow-300'}`}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={`p-2 rounded-full transition-colors ${currentPage === totalPages ? 'text-gray-600 cursor-not-allowed' : 'bg-yellow-400 text-black hover:bg-yellow-300'}`}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Historic Managers */}
            {historicManagers.length > 0 && (
                <div className="space-y-6 pt-6 border-t border-gray-800">
                    <div className="text-xs font-black uppercase tracking-widest text-gray-500">Lendas & Históricos</div>
                    <div className="grid gap-6 opacity-80">
                        {historicManagers.map(manager => (
                            <ManagerCard key={manager.id} manager={manager} />
                        ))}
                    </div>
                </div>
            )}

            {selectedManager && (
                <ManagerDetailsModal
                    manager={selectedManager}
                    isDarkMode={isDarkMode}
                    onClose={() => setSelectedManager(null)}
                    onUpdate={fetchData}
                />
            )}
        </div>
    );
};
