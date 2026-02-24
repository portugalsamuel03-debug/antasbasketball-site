import React, { useState, useEffect } from 'react';
import { X, Trophy, RefreshCw, ChevronDown, SkipForward, Play, ArrowUpRight, ArrowDownRight, Minus, Download, Search } from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';

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
    const [suspensePick, setSuspensePick] = useState<{ pick: number, team: any } | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const listRef = React.useRef<HTMLDivElement>(null);

    const totalPicks = teams.length;

    const calculateLottery = () => {
        if (teams.length === 0) return;

        // Clone the sorted teams list (already sorted worst -> best)
        const availableTeams = [...teams];
        const calculated = [];

        // 1. Determine the Top 4 picks using weighted random selection
        for (let pick = 1; pick <= 4; pick++) {
            if (availableTeams.length > 0) {
                let totalWeight = 0;
                const weights = availableTeams.map(t => {
                    const originalIndex = teams.findIndex(ot => ot.team.id === t.team.id);

                    // Use probability if it exists, otherwise use LOTTERY_ODDS, otherwise 0
                    let weight = 0;
                    if (t.probability != null) {
                        weight = pick === 1 ? t.probability : t.probability / pick; // roughly decrease odds for subsequent picks
                    } else {
                        const weightStr = oddsMap[originalIndex]?.[pick - 1] || '0%';
                        weight = parseFloat(weightStr.replace('%', ''));
                    }

                    totalWeight += weight;
                    return { team: t, weight, originalIndex };
                });

                let random = Math.random() * totalWeight;
                let selected = null;

                for (const w of weights) {
                    random -= w.weight;
                    if (random <= 0) {
                        selected = w.team;
                        break;
                    }
                }

                // If random fails or all remaining weights are 0, just grab the worst available
                if (!selected && availableTeams.length > 0) {
                    selected = availableTeams[0];
                }

                if (selected) {
                    calculated.push({ pick, team: selected });
                    availableTeams.splice(availableTeams.findIndex(t => t.team.id === selected.team.id), 1);
                }
            }
        }

        // 2. The rest of the picks (5 through 20) go in strict reverse order of standings
        // `availableTeams` is still sorted from worst to best, so we just pop off the front.
        let nextPick = 5;
        while (availableTeams.length > 0) {
            const selected = availableTeams.shift();
            if (selected) {
                calculated.push({ pick: nextPick, team: selected });
                nextPick++;
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
            const nextPickNum = totalPicks - picksRevealed;
            const isTop3 = nextPickNum <= 3;

            if (isTop3) {
                // Trigger suspense pop-up for Top 3
                setSuspensePick(lotteryOrder[picksRevealed]);

                // Auto-advance after 3.5 seconds
                setTimeout(() => {
                    setSuspensePick(null);
                    setPicksRevealed(prev => prev + 1);
                    confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: { y: 0.6 },
                        colors: ['#EAB308', '#ffffff'] // Yellow and white
                    });
                }, 3500);
            } else {
                setPicksRevealed(prev => prev + 1);
            }
        }
    };

    const handleSkip = () => {
        setPicksRevealed(totalPicks);
        setSuspensePick(null);
        confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#EAB308', '#ffffff']
        });
    };

    const handleDownloadFormat = async () => {
        if (!listRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(listRef.current, {
                backgroundColor: isDarkMode ? '#121212' : '#ffffff',
                scale: 2, // High resolution
                logging: false,
                useCORS: true
            });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            const dateStr = new Date().toISOString().split('T')[0];
            link.download = `Draft_Lottery_${dateStr}.png`;
            link.click();
        } catch (err) {
            console.error("Failed to generate image", err);
            alert("Erro ao tentar gerar imagem do Draft.");
        } finally {
            setIsDownloading(false);
        }
    };

    const nextPickNumber = totalPicks - picksRevealed;
    // Invert the visible results so the newest drawn pick is always at the top of the list!
    const visibleResults = lotteryOrder.slice(totalPicks - picksRevealed, totalPicks);

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
                                disabled={suspensePick !== null}
                                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95
                                    ${suspensePick !== null ? 'opacity-50 cursor-not-allowed' : ''}
                                    ${nextPickNumber <= 3
                                        ? 'bg-yellow-400 text-black hover:bg-yellow-500 hover:shadow-yellow-500/20'
                                        : isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#0B1D33] text-white hover:bg-blue-900'}`}
                            >
                                {suspensePick !== null ? <Search size={16} className="animate-spin" /> : <Play size={16} className={nextPickNumber <= 3 ? "text-black" : (isDarkMode ? "text-yellow-500" : "text-yellow-400")} />}
                                {suspensePick !== null ? 'Sorteando...' : `Sortear Pick #${nextPickNumber}`}
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
                            <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-yellow-500' : 'text-blue-600'}`}>
                                Simulação Concluída!
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDownloadFormat}
                                    disabled={isDownloading}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all
                                        ${isDarkMode ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-green-500 text-white hover:bg-green-600'}`}
                                >
                                    <Download size={12} />
                                    {isDownloading ? 'Gerando...' : 'Salvar PNG'}
                                </button>
                                <button
                                    onClick={calculateLottery}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all
                                        ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
                                >
                                    <RefreshCw size={12} />
                                    Reiniciar Sorteio
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-black/5 dark:bg-black/40">
                    <div ref={listRef} className={`space-y-3 p-2 rounded-2xl ${isDarkMode ? 'bg-[#121212]' : 'bg-white'}`}>
                        {/* Title for PNG export so people know what it is */}
                        {picksRevealed === totalPicks && (
                            <div className="text-center pb-4 mb-4 border-b border-gray-500/20">
                                <h3 className={`text-xl font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-black'}`}>Antas Draft Lottery</h3>
                                <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Official Draft Order</p>
                            </div>
                        )}
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
                                            <div className={`text-base md:text-lg font-black uppercase tracking-tight flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                                {r.team.team.name}
                                                {(() => {
                                                    // Position is 1-indexed, `r.pick` is 1-indexed.
                                                    // `t.position` represents the seed (1 is worst, 20 is best).
                                                    // The pre-lottery natural pick order assumes worst seed gets pick 1.
                                                    // So natural pick = t.position.
                                                    const naturalPick = r.team.position;
                                                    const diff = naturalPick - r.pick;

                                                    if (diff > 0) {
                                                        return <span className="flex items-center text-green-500 text-[10px] font-black tracking-widest bg-green-500/10 px-1.5 py-0.5 rounded-md" title={`Subiu ${diff} posições`}><ArrowUpRight size={14} className="mr-0.5" />{diff}</span>;
                                                    } else if (diff < 0) {
                                                        return <span className="flex items-center text-red-500 text-[10px] font-black tracking-widest bg-red-500/10 px-1.5 py-0.5 rounded-md" title={`Caiu ${Math.abs(diff)} posições`}><ArrowDownRight size={14} className="mr-0.5" />{Math.abs(diff)}</span>;
                                                    }
                                                    return <span className={`flex items-center text-[10px] font-black tracking-widest px-1.5 py-0.5 rounded-md ${isDarkMode ? 'text-gray-500 bg-white/5' : 'text-gray-400 bg-black/5'}`}><Minus size={14} /></span>;
                                                })()}
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

            {/* Top 3 Suspense Overlay */}
            {suspensePick && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/90 backdrop-blur-3xl animate-in fade-in duration-300 w-full h-full">
                    <div className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-700 ease-out">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center mb-8 shadow-[0_0_80px_rgba(234,179,8,0.4)] animate-bounce">
                            <Trophy size={48} className="text-white drop-shadow-xl" />
                        </div>
                        <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-widest text-[#EAB308] drop-shadow-lg mb-4 text-center">
                            A Escolha #{suspensePick.pick} vai para...
                        </h3>

                        {/* Flashing Logo effect before revealing */}
                        <div className="mt-8 relative w-40 h-40 sm:w-64 sm:h-64 flex items-center justify-center rounded-full bg-black/40 border-4 border-yellow-500/50 overflow-hidden">
                            <div className="absolute inset-0 bg-yellow-500/20 animate-ping"></div>
                            {suspensePick.team.team.logo_url ? (
                                <img
                                    src={suspensePick.team.team.logo_url}
                                    alt="logo"
                                    className="w-[80%] h-[80%] object-contain drop-shadow-2xl animate-in fade-in zoom-in duration-1000 delay-500 fill-mode-both"
                                />
                            ) : (
                                <span className="text-4xl font-black text-white animate-in fade-in zoom-in duration-1000 delay-500 fill-mode-both">
                                    {suspensePick.team.team.name}
                                </span>
                            )}
                        </div>
                        <div className="mt-8 text-3xl font-black uppercase text-white animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-500 fill-mode-both text-center">
                            {suspensePick.team.team.name}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};
