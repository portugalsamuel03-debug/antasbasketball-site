import React, { useState, useEffect } from 'react';
import { listTeams, deleteTeam } from '../../cms';
import { TeamRow } from '../../types';
import { useAdmin } from '../../context/AdminContext';
import { EditTrigger } from './EditTrigger';
import { Trophy, CheckCircle, XCircle } from 'lucide-react';
import { TeamDetailsModal } from './TeamDetailsModal';

export const TeamsSection: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const [teams, setTeams] = useState<TeamRow[]>([]);
    const { isEditing } = useAdmin();
    const [selectedTeam, setSelectedTeam] = useState<Partial<TeamRow> | null>(null);

    const fetchTeams = async () => {
        const { data } = await listTeams();
        if (data) setTeams(data as TeamRow[]);
    };

    useEffect(() => { fetchTeams(); }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Apagar este time?')) {
            await deleteTeam(id);
            fetchTeams();
        }
    };

    // Split teams into Active and Inactive if needed, or just list them with indicator
    // User asked for "active or not active" option to see if team is current.
    // We can group them or just tag them. Grouping is nicer.

    const activeTeams = teams.filter(t => t.is_active !== false); // Default true
    const inactiveTeams = teams.filter(t => t.is_active === false);

    const renderTeamCard = (t: TeamRow) => (
        <div
            key={t.id}
            onClick={() => setSelectedTeam(t)}
            className={`relative p-5 rounded-[24px] border flex flex-col items-center text-center gap-3 cursor-pointer transition-all active:scale-95 group ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-[#0B1D33]/10 hover:bg-[#0B1D33]/5'}`}
        >
            {isEditing && (
                <div className="absolute -top-2 -right-2 z-10">
                    <EditTrigger type="delete" size={14} onClick={(e) => handleDelete(t.id, e)} />
                </div>
            )}

            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center p-2 relative">
                {t.logo_url ? <img src={t.logo_url} className="w-full h-full object-contain" /> : <Trophy className="text-yellow-500/20" />}
                {!t.is_active && <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center backdrop-blur-[1px]"><XCircle className="text-red-500" size={20} /></div>}
            </div>

            <div>
                <div className={`text-xs font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{t.name}</div>
                {t.manager && (
                    <div className="text-[9px] font-bold text-gray-500 uppercase mt-1">Gestor: {t.manager.name}</div>
                )}
                {!t.manager && t.gm_name && (
                    <div className="text-[9px] font-bold text-gray-500 uppercase mt-1">GM: {t.gm_name}</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 px-6 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="text-xs font-black uppercase tracking-widest text-gray-500">Times Ativos</div>
                {isEditing && <EditTrigger type="add" onClick={() => setSelectedTeam({ is_active: true })} />}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {activeTeams.map(renderTeamCard)}
            </div>

            {inactiveTeams.length > 0 && (
                <>
                    <div className="text-xs font-black uppercase tracking-widest text-gray-500 mt-8">Times Inativos / Históricos</div>
                    <div className="grid grid-cols-2 gap-4 opacity-70">
                        {inactiveTeams.map(renderTeamCard)}
                    </div>
                </>
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
}
