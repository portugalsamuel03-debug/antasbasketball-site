import React, { useState, useEffect } from 'react';
import { Trophy, Award as AwardIcon, User, X, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { listChampions, listAwards } from '../../cms';
import { Champion, Award } from '../../types';

interface TeamAwardsModalProps {
    teamId: string;
    teamName: string;
    mode?: 'ALL' | 'TITLES' | 'AWARDS';
    isDarkMode: boolean;
    onClose: () => void;
}

export const TeamAwardsModal: React.FC<TeamAwardsModalProps> = ({ teamId, teamName, mode = 'ALL', isDarkMode, onClose }) => {
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



    // Grouping Helper
    const groupAwards = (awards: Award[]) => {
        const groups: Record<string, Award[]> = {};
        awards.forEach(a => {
            if (!groups[a.category]) groups[a.category] = [];
            groups[a.category].push(a);
        });
        return groups;
    };

    const AccordionItem = ({ title, count, children, icon, isDarkMode }: any) => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div className={`rounded-xl border transition-all duration-200 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between p-3"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                            {icon}
                        </div>
                        <div className="text-left">
                            <div className={`text-xs font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                {count > 1 ? `${count}x ` : ''}{title}
                            </div>
                            <div className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {count} Conquista{count > 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                </button>

                {isOpen && (
                    <div className={`px-3 pb-3 pt-0 space-y-2`}>
                        <div className={`h-px w-full ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'} mb-2`} />
                        {children}
                    </div>
                )}
            </div>
        );
    };

    const renderGroupedList = (items: Award[], type: 'TITLE' | 'AWARD', icon: any) => {
        if (items.length === 0) return <div className="text-center text-xs text-gray-500 py-4">Nenhum registro.</div>;

        // Group items
        const groups = groupAwards(items);

        return (
            <div className="space-y-2">
                {Object.entries(groups).map(([category, awards], i) => (
                    <AccordionItem
                        key={i}
                        title={type === 'TITLE' ? `Campeão` : category} // Titles usually grouping by "Campeão" isn't great if years differ, but usually titles are just year. Let's keep Titles LIST style or group? 
                        // Requirement was "Group awards...". Titles are likely distinct per year.
                        // Current logic: Titles list is fine. Awards need grouping.
                        count={awards.length}
                        icon={icon}
                        isDarkMode={isDarkMode}
                    >
                        {awards.sort((a, b) => b.year.localeCompare(a.year)).map((item, j) => (
                            <div key={j} className={`flex items-center justify-between p-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
                                <div className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Temporada {item.year}
                                </div>
                                {item.winner_name && item.winner_name.toLowerCase() !== teamName.toLowerCase() && (
                                    <div className="text-[9px] font-bold text-yellow-500 uppercase">
                                        {item.winner_name}
                                    </div>
                                )}
                            </div>
                        ))}
                    </AccordionItem>
                ))}
            </div>
        );
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
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#121212]' : 'bg-white'} max-h-[85vh]`}>

                {/* Header */}
                <div className="p-6 pb-2 flex items-center justify-between">
                    <div>
                        <h2 className={`text-2xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                            {mode === 'TITLES' ? 'Títulos' : mode === 'AWARDS' ? 'Conquistas' : 'Galeria'}
                        </h2>
                        <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">
                            {mode === 'TITLES' ? 'Campeonatos Vencidos' : mode === 'AWARDS' ? 'Prêmios Individuais & Coletivos' : 'Todas as conquistas'}
                        </p>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-black hover:bg-gray-200'}`}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 pt-4 flex-1 overflow-y-auto custom-scrollbar space-y-8">

                    {/* TITLES SECTION */}
                    {(mode === 'ALL' || mode === 'TITLES') && (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 delay-100">
                            {mode === 'ALL' && (
                                <h3 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <Trophy size={14} className="text-yellow-500" /> Títulos ({titles.length})
                                </h3>
                            )}

                            {titles.length > 0 ? (
                                renderList(titles.map(t => ({ ...t, name: `Campeão ${t.year}`, description: `Temporada ${t.year}` })), 'TITLE', <Trophy size={20} className="text-yellow-500" />)
                            ) : (
                                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-white/10">
                                    <Trophy size={32} className="mx-auto text-gray-700 mb-2 opacity-50" />
                                    <p className="text-xs text-gray-500 uppercase font-bold">O time não possui nenhum título.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* AWARDS SECTION */}
                    {(mode === 'ALL' || mode === 'AWARDS') && (
                        <>
                            {/* Team Awards */}
                            {teamAwards.length > 0 && (
                                <div className="animate-in slide-in-from-bottom-4 duration-300 delay-200">
                                    {(mode === 'ALL' || (mode === 'AWARDS' && individualAwards.length > 0)) && (
                                        <h3 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <AwardIcon size={14} className="text-blue-400" /> Prêmios do Time ({teamAwards.length})
                                        </h3>
                                    )}
                                    {renderGroupedList(teamAwards, 'AWARD', <AwardIcon size={20} className="text-blue-400" />)}
                                </div>
                            )}

                            {/* Individual Awards */}
                            {individualAwards.length > 0 && (
                                <div className="animate-in slide-in-from-bottom-4 duration-300 delay-300">
                                    {(mode === 'ALL' || (mode === 'AWARDS' && teamAwards.length > 0)) && (
                                        <h3 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <User size={14} className="text-purple-400" /> Prêmios Individuais ({individualAwards.length})
                                        </h3>
                                    )}
                                    {renderGroupedList(individualAwards, 'AWARD', <User size={20} className="text-purple-400" />)}
                                </div>
                            )}

                            {/* Empty State for Awards Mode */}
                            {teamAwards.length === 0 && individualAwards.length === 0 && (
                                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-white/10">
                                    <AwardIcon size={32} className="mx-auto text-gray-700 mb-2 opacity-50" />
                                    <p className="text-xs text-gray-500 uppercase font-bold">Nenhuma conquista registrada.</p>
                                </div>
                            )}
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};
