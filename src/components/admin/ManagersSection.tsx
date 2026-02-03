import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { supabase } from '../../lib/supabase';
import { listTeams, listChampions, listAwards } from '../../cms';
import { TeamRow, Champion, Award } from '../../types';
import { EditTrigger } from './EditTrigger';
import { Users, Trash2, Award as AwardIcon, Briefcase } from 'lucide-react';
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

export const ManagersSection: React.FC<ManagersSectionProps> = ({ isDarkMode }) => {
    const { isEditing } = useAdmin();
    const [managers, setManagers] = useState<Manager[]>([]);
    const [selectedManager, setSelectedManager] = useState<Partial<Manager> | null>(null);

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
        if (runnerUpCount > 0) parts.push(`${runnerUpCount}x Vice`);

        const titleText = parts.join(' • ');

        // Resolve Awards
        const awards = managerAwards[manager.id] || [];

        return (
            <div
                className={`relative rounded-3xl overflow-hidden shadow-lg group cursor-pointer transition-transform hover:scale-[1.01] ${isDarkMode ? 'bg-[#1a2c42]' : 'bg-white'} `}
                onClick={() => isEditing && setSelectedManager(manager)}
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
                    <div className="flex-1 space-y-3">
                        <div>
                            <h3 className={`text-2xl font-black uppercase leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'} `}>
                                {manager.name}
                            </h3>
                            {manager.bio && <p className="text-xs text-yellow-500 font-bold uppercase tracking-widest">{manager.bio}</p>}
                        </div>

                        <div className="flex flex-col gap-2 text-xs">
                            {/* Teams Logic: Prefer Linked Teams, fallback to legacy text */}
                            {(linkedTeams.length > 0) ? (
                                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start text-gray-400">
                                    <Briefcase size={12} className="text-yellow-400" />
                                    {linkedTeams.map((t, idx) => (
                                        <span key={t.id} className="uppercase">{t.name}{idx < linkedTeams.length - 1 ? ', ' : ''}</span>
                                    ))}
                                </div>
                            ) : (manager.teams_managed && (
                                <div className="flex items-center gap-2 justify-center sm:justify-start text-gray-400">
                                    <Briefcase size={12} className="text-yellow-400" />
                                    <span>{manager.teams_managed}</span>
                                </div>
                            ))}

                            {/* Titles Logic: Show Auto-Titles + Individual Titles + Awards */}
                            {(titleText || manager.individual_titles || awards.length > 0) && (
                                <div className="flex flex-col gap-1 justify-center sm:justify-start text-gray-400">
                                    {titleText && (
                                        <div className="flex items-center gap-2">
                                            <AwardIcon size={12} className="text-yellow-400" />
                                            <span className="font-bold text-yellow-500 uppercase">{titleText}</span>
                                        </div>
                                    )}
                                    {/* Auto-Awards from DB */}
                                    {awards.map((award, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <AwardIcon size={12} className="text-yellow-400 opacity-80" />
                                            <span>{award}</span>
                                        </div>
                                    ))}
                                    {/* Manual Titles */}
                                    {manager.individual_titles && (
                                        <div className="flex items-center gap-2">
                                            <AwardIcon size={12} className="text-yellow-400 opacity-50" />
                                            <span>{manager.individual_titles}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Legacy Title Fallback if no new schema data */}
                            {!titleText && !manager.individual_titles && manager.titles_won && (
                                <div className="flex items-center gap-2 justify-center sm:justify-start text-gray-400">
                                    <AwardIcon size={12} className="text-yellow-400" />
                                    <span>{manager.titles_won}</span>
                                </div>
                            )}
                        </div>
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
                    {activeManagers.map(manager => (
                        <ManagerCard key={manager.id} manager={manager} />
                    ))}
                    {activeManagers.length === 0 && (
                        <div className="text-gray-500 text-sm italic">Nenhum gestor ativo.</div>
                    )}
                </div>
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
