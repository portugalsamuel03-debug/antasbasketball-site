import React, { useState, useEffect } from 'react';
import { Trophy, Award as AwardIcon, User, X, ChevronRight } from 'lucide-react';
import { listChampions, listAwards } from '../../cms';
import { Champion, Award } from '../../types';

interface TeamAwardsModalProps {
    teamId: string;
    teamName: string;
    isDarkMode: boolean;
    onClose: () => void;
}

export const TeamAwardsModal: React.FC<TeamAwardsModalProps> = ({ teamId, teamName, isDarkMode, onClose }) => {
    const [titles, setTitles] = useState<Champion[]>([]);
    const [teamAwards, setTeamAwards] = useState<Award[]>([]);
    const [individualAwards, setIndividualAwards] = useState<Award[]>([]);
    const [view, setView] = useState<'MAIN' | 'TITLES' | 'TEAM_AWARDS' | 'INDIVIDUAL_AWARDS'>('MAIN');

    useEffect(() => {
        fetchData();
    }, [teamId]);

    const fetchData = async () => {
        // Champions
        const { data: championsData } = await listChampions();
        if (championsData) {
            const wins = (championsData as Champion[]).filter(c => c.team_id === teamId || c.team === teamName);
            setTitles(wins);
        }

        // Awards
        const { data: awardsData } = await listAwards();
        if (awardsData) {
            const all = (awardsData as Award[]).filter(a => a.team_id === teamId || a.team?.id === teamId);
            // We need to distinguish between Team and Individual items. 
            // In the main AwardsSection we fetch categories to check type.
            // Here, for simplicity, we can rely on convention or fetch categories too.
            // Let's rely on the assumption that if it's assigned to a team explicitly and has a manager, it is likely a team award, 
            // BUT wait, individual awards can also be linked to a team.
            // Let's simply group them by simple heuristic or fetch categories if precise.
            // Actually, we can just split by:
            // If winner_name == teamName (or close) -> Team Award
            // Else -> Individual Award

            const tAwards: Award[] = [];
            const iAwards: Award[] = [];

            all.forEach(a => {
                const isTeamName = a.winner_name.toLowerCase() === teamName.toLowerCase() || a.winner_name.toLowerCase() === a.team?.name.toLowerCase();
                // Or check category name for "(Time)" suffix if provided? 
                // Better heuristic:
                if (isTeamName) tAwards.push(a);
                else iAwards.push(a);
            });

            setTeamAwards(tAwards);
            setIndividualAwards(iAwards);
        }
    };

    const renderList = (items: any[], type: 'TITLE' | 'AWARD', icon: any) => (
        <div className="space-y-2">
            {items.map((item, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                        {icon}
                    </div>
                    <div>
                        <div className={`text-xs font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                            {type === 'TITLE' ? `Campeão ${item.year}` : item.category}
                        </div>
                        <div className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {type === 'TITLE' ? item.manager?.name || 'Gestor' : item.year}
                        </div>
                        {type === 'AWARD' && item.winner_name && item.winner_name.toLowerCase() !== teamName.toLowerCase() && (
                            <div className="text-[10px] font-bold text-yellow-500 uppercase mt-0.5">
                                {item.winner_name}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {items.length === 0 && <div className="text-center text-xs text-gray-500 py-4">Nenhum registro.</div>}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className={`relative w-full max-w-sm ${isDarkMode ? 'bg-[#121212]' : 'bg-white'} rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]`}>

                {/* Header */}
                <div className="p-6 pb-2 flex justify-between items-center">
                    <h2 className={`text-xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                        Conquistas
                    </h2>
                    <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-gray-500'}`}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 pt-4 space-y-4 overflow-y-auto custom-scrollbar">

                    {/* TITLES */}
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                            <Trophy size={12} className="text-yellow-400" /> Títulos ({titles.length})
                        </div>
                        {renderList(titles, 'TITLE', <Trophy size={14} className="text-yellow-500" />)}
                    </div>

                    <div className="w-full h-px bg-gray-500/10 my-2" />

                    {/* TEAM AWARDS */}
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                            <AwardIcon size={12} className="text-blue-400" /> Prêmios do Time ({teamAwards.length})
                        </div>
                        {renderList(teamAwards, 'AWARD', <AwardIcon size={14} className="text-blue-400" />)}
                    </div>

                    <div className="w-full h-px bg-gray-500/10 my-2" />

                    {/* INDIVIDUAL AWARDS */}
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                            <User size={12} className="text-purple-400" /> Prêmios Individuais ({individualAwards.length})
                        </div>
                        {renderList(individualAwards, 'AWARD', <User size={14} className="text-purple-400" />)}
                    </div>

                </div>
            </div>
        </div>
    );
};
