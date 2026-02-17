import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { supabase } from '../../lib/supabase';
import { listTeams, listChampions, listAwards, listHallOfFame } from '../../cms';
import { TeamRow, Champion, Award, HallOfFame, ManagerHistory } from '../../types';
import { EditTrigger } from './EditTrigger';
import { Users, Crown, ArrowRight, Briefcase } from 'lucide-react';
import { ManagerDetailsModal } from './ManagerDetailsModal';
import { ManagersListModal } from './ManagersListModal';

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
    const [viewingList, setViewingList] = useState<'ACTIVE' | 'LEGEND' | null>(null);

    // Aux data
    const [teamsMap, setTeamsMap] = useState<Record<string, TeamRow>>({});
    const [championCounts, setChampionCounts] = useState<Record<string, number>>({});
    const [hofIds, setHofIds] = useState<Set<string>>(new Set());
    const [managerTrades, setManagerTrades] = useState<Record<string, number>>({});
    const [managerRecords, setManagerRecords] = useState<Record<string, { wins: number, losses: number }>>({});

    const fetchData = async () => {
        // Fetch Managers
        const { data: managersData } = await supabase.from('managers').select('*').order('created_at', { ascending: true });
        if (managersData) setManagers(managersData);

        // Fetch Teams to map IDs to Names
        const { data: teamsData } = await listTeams();
        const tMap: Record<string, TeamRow> = {};
        teamsData?.forEach((t: any) => tMap[t.id] = t);
        setTeamsMap(tMap);

        // Fetch Champions to count titles
        const { data: champsData } = await listChampions();
        const cCounts: Record<string, number> = {};
        (champsData as Champion[])?.forEach(c => {
            if (c.manager_id) {
                cCounts[c.manager_id] = (cCounts[c.manager_id] || 0) + 1;
            }
        });
        setChampionCounts(cCounts);

        // Fetch Hall of Fame
        const { data: hofData } = await listHallOfFame();
        const hIds = new Set<string>();
        (hofData as HallOfFame[])?.forEach(h => {
            if (h.manager_id) hIds.add(h.manager_id);
        });
        setHofIds(hIds);

        // Fetch Trades (via Manager History + Season Standings)
        // 1. Get all manager history
        const { data: historyData } = await supabase.from('manager_history').select('*');
        // 2. Get all season standings (where trades_count is stored)
        // 2. Get all season standings (where trades_count is stored)
        const { data: standingsData } = await supabase.from('season_standings').select('season_id, team_id, trades_count, wins, losses');

        // 3. Map standings by season_id + team_id


        const { data: seasonsData } = await supabase.from('seasons').select('id, year');
        const seasonYearIdMap: Record<string, string> = {}; // year -> id
        seasonsData?.forEach((s: any) => seasonYearIdMap[s.year] = s.id);

        const standingsMap: Record<string, { trades: number, wins: number, losses: number }> = {};

        standingsData?.forEach((st: any) => {
            standingsMap[`${st.season_id}-${st.team_id}`] = {
                trades: st.trades_count || 0,
                wins: st.wins || 0,
                losses: st.losses || 0
            };
        });

        const mTrades: Record<string, number> = {};
        const mRecords: Record<string, { wins: number, losses: number }> = {};

        (historyData as ManagerHistory[])?.forEach(h => {
            if (!h.team_id || !h.manager_id) return;
            const seasonId = seasonYearIdMap[h.year];
            if (!seasonId) return;

            const stats = standingsMap[`${seasonId}-${h.team_id}`];
            if (stats) {
                mTrades[h.manager_id] = (mTrades[h.manager_id] || 0) + stats.trades;

                if (!mRecords[h.manager_id]) mRecords[h.manager_id] = { wins: 0, losses: 0 };
                mRecords[h.manager_id].wins += stats.wins;
                mRecords[h.manager_id].losses += stats.losses;
            }
        });
        setManagerTrades(mTrades);
        setManagerRecords(mRecords);
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

    const handleToggleActive = async (manager: Manager, e: React.MouseEvent) => {
        e.stopPropagation();
        await supabase.from('managers').update({ is_active: manager.is_active === false }).eq('id', manager.id);
        fetchData();
    };

    const activeManagersCount = managers.filter(m => m.is_active !== false).length;
    const historicManagersCount = managers.filter(m => m.is_active === false).length;

    return (
        <div className="px-6 pb-20 space-y-12">

            {/* Entry Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">

                {/* ACTIVE MANAGERS CARD */}
                <div
                    onClick={() => setViewingList('ACTIVE')}
                    className={`relative overflow-hidden p-8 rounded-[32px] border transition-all duration-300 group cursor-pointer ${isDarkMode ? 'bg-[#1a2c42] border-white/5 hover:border-yellow-500/50 hover:bg-[#23354d]' : 'bg-white border-gray-100 hover:border-yellow-400 hover:shadow-xl'
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
                                {activeManagersCount} Gestores
                            </div>
                            <h3 className={`text-2xl font-black uppercase tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                Gestores em Atividade
                            </h3>
                        </div>
                        <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} group-hover:gap-4 transition-all`}>
                            Ver Todos <ArrowRight size={16} />
                        </div>
                    </div>
                </div>

                {/* LEGENDARY MANAGERS CARD */}
                <div
                    onClick={() => setViewingList('LEGEND')}
                    className={`relative overflow-hidden p-8 rounded-[32px] border transition-all duration-300 group cursor-pointer ${isDarkMode ? 'bg-[#1a2c42] border-white/5 hover:border-gray-400/50 hover:bg-[#23354d]' : 'bg-white border-gray-100 hover:border-gray-400 hover:shadow-xl'
                        }`}
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Crown size={120} className={isDarkMode ? 'text-white' : 'text-black'} />
                    </div>

                    <div className="relative z-10 flex flex-col items-start h-full justify-between gap-8">
                        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
                            <Crown size={32} className="text-gray-400" />
                        </div>
                        <div>
                            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">
                                {historicManagersCount} Gestores
                            </div>
                            <h3 className={`text-2xl font-black uppercase tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                Lendas & Históricos
                            </h3>
                        </div>
                        <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} group-hover:gap-4 transition-all`}>
                            Ver Todos <ArrowRight size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={() => setSelectedManager({})}
                        className="px-6 py-3 bg-yellow-400 text-black text-xs font-black uppercase tracking-widest rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <EditTrigger type="add" onClick={(e) => { e.stopPropagation(); setSelectedManager({}); }} />
                        Adicionar Novo Gestor
                    </button>
                </div>
            )}


            {/* Modals */}
            {viewingList && (
                <ManagersListModal
                    managers={managers}
                    initialTab={viewingList}
                    isDarkMode={isDarkMode}
                    onClose={() => setViewingList(null)}
                    onSelectManager={setSelectedManager}
                    onDeleteManager={handleDelete}
                    onToggleActive={handleToggleActive}
                    teamsMap={teamsMap}
                    championCounts={championCounts}
                    hofIds={hofIds}
                    managerTrades={managerTrades}
                    managerRecords={managerRecords}
                />
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
