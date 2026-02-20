import React, { useState, useEffect } from 'react';
import { X, Trophy, RefreshCw, ChevronDown, SkipForward, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DraftSimulationModalProps {
    teams: any[];
    oddsMap: string[][];
    isDarkMode: boolean;
    onClose: () => void;
    seasons?: any[];
    selectedSeasonId?: string;
    onSeasonChange?: (id: string) => void;
}

export const DraftSimulationModal: React.FC<DraftSimulationModalProps> = ({
    teams, oddsMap, isDarkMode, onClose, seasons = [], selectedSeasonId, onSeasonChange
}) => {
    const [lotteryOrder, setLotteryOrder] = useState<{ pick: number, team: any }[]>([]);
    const [picksRevealed, setPicksRevealed] = useState(0); // 0 means none revealed

    const totalPicks = teams.length;

    const calculateLottery = () => {
        if (teams.length === 0) return;

        const availableTeams = [...teams];
        const calculated = [];

        // Simple weighted random selection for the top 4 picks (NBA style)
        for (let pick = 1; pick <= totalPicks; pick++) {
            if (pick <= 4 && availableTeams.length > 0) {
                let totalWeight = 0;
                const weights = availableTeams.map(t => {
                    const originalIndex = teams.findIndex(ot => ot.team.id === t.team.id);
                    const weightStr = oddsMap[originalIndex]?.[pick - 1] || '0%';
                    const weight = parseFloat(weightStr.replace('%', ''));
                    totalWeight += weight;
                    return { team: t, weight, originalIndex };
                });

                let random = Math.random() * totalWeight;
                let selected = weights[weights.length - 1].team;

                for (const w of weights) {
                    random -= w.weight;
                    if (random <= 0) {
                        selected = w.team;
                        break;
                    }
                }

                // If random fails or weight is 0, just grab the worst available
                if (!selected && availableTeams.length > 0) {
                    selected = availableTeams[0];
                }

                if (selected) {
                    calculated.push({ pick, team: selected });
                    availableTeams.splice(availableTeams.findIndex(t => t.team.id === selected.team.id), 1);
                }
            } else {
                // For the remaining picks, it goes in reverse order of standings among remaining teams
                // availableTeams is still sorted worst -> best because we haven't reordered it, only sliced it.
                const selected = availableTeams.shift();
                if (selected) {
                    calculated.push({ pick, team: selected });
                }
            }
        }

        setLotteryOrder(calculated);
        setPicksRevealed(0);
    };

    // Recalculate if teams (season) changes
    useEffect(() => {
        calculateLottery();
    }, [teams]);

    const handleRevealNext = () => {
        if (picksRevealed < totalPicks) {
            setPicksRevealed(prev => prev + 1);

            // If revealing top 3, pop confetti
            const nextPick = totalPicks - picksRevealed;
            if (nextPick <= 3) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#EAB308', '#ffffff'] // Yellow and white
                });
            }
        }
    };

    const handleSkip = () => {
        setPicksRevealed(totalPicks);
        confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#EAB308', '#ffffff']
        });
    };

    const nextPickNumber = totalPicks - picksRevealed;
    const visibleResults = lotteryOrder.slice(totalPicks - picksRevealed, totalPicks).reverse();

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose}></div>
            <div className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#121212] border border-white/10' : 'bg-white border border-gray-200'}`}>

                <div className={`px-6 py-4 flex items-center justify-between border-b ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <h2 className={`text-xl font-black uppercase tracking-tighter flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                            <Trophy className="text-yellow-500" size={24} />
                            Simulação do Draft
                        </h2>

                        {/* Season Dropdown included directly here */}
                        {seasons && seasons.length > 0 && onSeasonChange && (
                            <div className="relative">
                                <select
                                    value={selectedSeasonId || ''}
                                    onChange={(e) => onSeasonChange(e.target.value)}
                                    className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer border transition-all outline-none ${isDarkMode
                                        ? 'bg-black border-white/10 text-white hover:border-yellow-500/50'
                                        : 'bg-white border-gray-200 text-[#0B1D33] hover:border-blue-600/50'
                                        }`}
                                >
                                    {[...seasons].sort((a, b) => b.year.localeCompare(a.year)).map(s => (
                                        <option key={s.id} value={s.id}>{s.name || s.year}</option>
                                    ))}
                                </select>
                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                            </div>
                        )}
                    </div>

                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-500'}`}>
                        <X size={20} />
                    </button>
                </div>

                {/* Subheader controls */}
                <div className={`px-6 py-3 flex items-center justify-between border-b ${isDarkMode ? 'border-white/5 bg-[#1a1a1a]' : 'border-gray-100 bg-gray-50'}`}>
                    {picksRevealed < totalPicks ? (
                        <>
                            <button
                                onClick={handleRevealNext}
                                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95
                                    ${nextPickNumber <= 3
                                        ? 'bg-yellow-400 text-black hover:bg-yellow-500 hover:shadow-yellow-500/20'
                                        : isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#0B1D33] text-white hover:bg-blue-900'}`}
                            >
                                <Play size={16} className={nextPickNumber <= 3 ? "text-black" : (isDarkMode ? "text-yellow-500" : "text-yellow-400")} />
                                Sortear Pick #{nextPickNumber}
                            </button>
                            <button
                                onClick={handleSkip}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all
                                    ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-black hover:bg-black/5'}`}
                            >
                                <SkipForward size={14} />
                                Pular Simulação
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center justify-between w-full">
                            <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-yellow-500' : 'text-blue-600'}`}>
                                Simulação Concluída!
                            </span>
                            <button
                                onClick={calculateLottery}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all
                                    ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
                            >
                                <RefreshCw size={12} />
                                Reiniciar Sorteio
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-black/5 dark:bg-black/40">
                    <div className="space-y-3">
                        {visibleResults.map((r) => {
                            const isTop3 = r.pick <= 3;

                            return (
                                <div
                                    key={r.pick}
                                    className={`flex items-center gap-4 p-4 rounded-[24px] border-2 transition-all animate-in slide-in-from-bottom-4 fade-in duration-500
                                        ${isTop3
                                            ? (isDarkMode
                                                ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                                                : 'bg-gradient-to-r from-yellow-100 to-white border-yellow-400 shadow-xl')
                                            : (isDarkMode ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-gray-100 shadow-md')}`}
                                >
                                    <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 font-black text-xl
                                        ${isTop3
                                            ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-black shadow-inner'
                                            : isDarkMode ? 'bg-[#222] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                        #{r.pick}
                                    </div>
                                    <div className="flex-1 flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${isTop3 ? 'bg-white/20' : 'bg-transparent'}`}>
                                            {r.team.team.logo_url ? (
                                                <img src={r.team.team.logo_url} alt="logo" className="w-[90%] h-[90%] object-contain drop-shadow-lg" />
                                            ) : (
                                                <span className="text-xs font-bold opacity-50">AT</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className={`text-base md:text-lg font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                                {r.team.team.name}
                                            </div>
                                            {isTop3 && (
                                                <div className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-yellow-500' : 'text-yellow-600'}`}>
                                                    TOP 3 PICK GARANTIDA! 🌟
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {picksRevealed === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                <Trophy size={48} className={isDarkMode ? 'text-white/20' : 'text-black/10'} />
                                <p className={`mt-4 text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Clique em "Sortear Pick" para iniciar a loteria
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
