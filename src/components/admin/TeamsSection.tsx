import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { listTeams, deleteTeam, upsertTeam } from '../../cms';
import { TeamRow } from '../../types';
import { useAdmin } from '../../context/AdminContext';
import { EditTrigger } from './EditTrigger';
import { Trophy, Shield, ArrowRight } from 'lucide-react';
import { TeamDetailsModal } from './TeamDetailsModal';
import { TeamsListModal } from './TeamsListModal';

export const TeamsSection: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const [teams, setTeams] = useState<TeamRow[]>([]);
    const { isEditing } = useAdmin();
    const [selectedTeam, setSelectedTeam] = useState<Partial<TeamRow> | null>(null);
    const [viewingList, setViewingList] = useState<'ACTIVE' | 'HISTORIC' | null>(null);
    const [teamTrades, setTeamTrades] = useState<Record<string, number>>({});
    const [teamRecords, setTeamRecords] = useState<Record<string, { wins: number, losses: number }>>({});

    const fetchTeams = async () => {
        const { data } = await listTeams();
        if (data) setTeams(data as TeamRow[]);

        // Fetch Trades from Standings
        // Fetch Trades from Standings & Calc W-L
        const { data: standings } = await supabase.from('season_standings').select('team_id, trades_count, wins, losses');
        const counts: Record<string, number> = {};
        const records: Record<string, { wins: number, losses: number }> = {};

        standings?.forEach((st: any) => {
            if (st.team_id) {
                // Trades
                if (st.trades_count) {
                    counts[st.team_id] = (counts[st.team_id] || 0) + st.trades_count;
                }
                // Records
                if (!records[st.team_id]) records[st.team_id] = { wins: 0, losses: 0 };
                records[st.team_id].wins += (st.wins || 0);
                records[st.team_id].losses += (st.losses || 0);
            }
        });
        setTeamTrades(counts);
        setTeamRecords(records);
    };

    useEffect(() => { fetchTeams(); }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Apagar este time?')) {
            await deleteTeam(id);
            fetchTeams();
        }
    };

    const handleToggleActive = async (team: TeamRow, e: React.MouseEvent) => {
        e.stopPropagation();
        // Optimistic update could be done here, but for safety lets wait
        await supabase.from('teams').update({ is_active: team.is_active === false }).eq('id', team.id);
        fetchTeams();
    };

    const activeTeamsCount = teams.filter(t => t.is_active !== false).length;
    const historicTeamsCount = teams.filter(t => t.is_active === false).length;

    return (
        <div className="px-6 pb-20 space-y-12">

            {/* Entry Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">

                {/* ACTIVE TEAMS CARD */}
                <div
                    onClick={() => setViewingList('ACTIVE')}
                    className={`relative overflow-hidden p-8 rounded-[32px] border transition-all duration-300 group cursor-pointer ${isDarkMode ? 'bg-[#1a2c42] border-white/5 hover:border-yellow-500/50 hover:bg-[#23354d]' : 'bg-white border-gray-100 hover:border-yellow-400 hover:shadow-xl'
                        }`}
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Shield size={120} className={isDarkMode ? 'text-white' : 'text-black'} />
                    </div>

                    <div className="relative z-10 flex flex-col items-start h-full justify-between gap-8">
                        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-black/30' : 'bg-yellow-50'}`}>
                            <Shield size={32} className="text-yellow-500" />
                        </div>
                        <div>
                            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">
                                {activeTeamsCount} Times
                            </div>
                            <h3 className={`text-2xl font-black uppercase tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                Times Ativos
                            </h3>
                        </div>
                        <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} group-hover:gap-4 transition-all`}>
                            Ver Todos <ArrowRight size={16} />
                        </div>
                    </div>
                </div>

                {/* HISTORIC TEAMS CARD */}
                <div
                    onClick={() => setViewingList('HISTORIC')}
                    className={`relative overflow-hidden p-8 rounded-[32px] border transition-all duration-300 group cursor-pointer ${isDarkMode ? 'bg-[#1a2c42] border-white/5 hover:border-gray-400/50 hover:bg-[#23354d]' : 'bg-white border-gray-100 hover:border-gray-400 hover:shadow-xl'
                        }`}
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Trophy size={120} className={isDarkMode ? 'text-white' : 'text-black'} />
                    </div>

                    <div className="relative z-10 flex flex-col items-start h-full justify-between gap-8">
                        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
                            <Trophy size={32} className="text-gray-400" />
                        </div>
                        <div>
                            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">
                                {historicTeamsCount} Times
                            </div>
                            <h3 className={`text-2xl font-black uppercase tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                Times Históricos
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
                        onClick={() => setSelectedTeam({ is_active: true })}
                        className="px-6 py-3 bg-yellow-400 text-black text-xs font-black uppercase tracking-widest rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <EditTrigger type="add" onClick={(e) => { e.stopPropagation(); setSelectedTeam({ is_active: true }); }} />
                        Adicionar Novo Time
                    </button>
                </div>
            )}

            {/* Modals */}
            {viewingList && (
                <TeamsListModal
                    teams={teams}
                    initialTab={viewingList}
                    isDarkMode={isDarkMode}
                    onClose={() => setViewingList(null)}
                    onSelectTeam={setSelectedTeam}
                    onDeleteTeam={handleDelete}
                    onToggleActive={handleToggleActive}
                    teamTrades={teamTrades}
                    teamRecords={teamRecords}
                />
            )}

            {selectedTeam && (
                <TeamDetailsModal
                    team={selectedTeam}
                    isDarkMode={isDarkMode}
                    onClose={() => setSelectedTeam(null)}
                    onUpdate={fetchTeams}
                />
            )}
        </div>
    );
};
