import React from 'react';
import { Trophy, HelpCircle, ChevronRight, XCircle, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { PlayoffData, PlayoffMatchup, Team } from '../types';

interface PlayoffsBracketProps {
    data: PlayoffData;
    teams: Team[];
    isDarkMode: boolean;
    isEditing?: boolean;
    onUpdate?: (data: PlayoffData) => void;
}

const MatchupCard: React.FC<{
    matchup: PlayoffMatchup;
    teams: Team[];
    isDarkMode: boolean;
    isEditing?: boolean;
    onEdit?: (updated: PlayoffMatchup) => void;
    label?: string;
    isFinals?: boolean;
}> = ({ matchup, teams, isDarkMode, isEditing, onEdit, label, isFinals }) => {
    const team1 = teams.find(t => t.id === matchup.team1_id);
    const team2 = teams.find(t => t.id === matchup.team2_id);

    const winner = !isEditing && matchup.team1_score !== undefined && matchup.team2_score !== undefined
        ? (matchup.team1_score > matchup.team2_score ? 1 : matchup.team2_score > matchup.team1_score ? 2 : 0)
        : 0;

    const handleChange = (field: keyof PlayoffMatchup, value: any) => {
        if (onEdit) onEdit({ ...matchup, [field]: value });
    };

    const cardClass = `p-3 rounded-2xl border transition-all relative ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`;

    return (
        <div className="flex flex-col gap-1 w-full max-w-[240px]">
            {label && <div className="text-[10px] font-black uppercase text-gray-500 opacity-50 mb-1">{label}</div>}
            <div className={cardClass}>
                <div className="space-y-2">
                    {/* Team 1 */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-5 h-5 flex-shrink-0">
                                {team1?.logo_url ? <img src={team1.logo_url} className="w-full h-full object-contain" /> : <HelpCircle size={14} className="text-gray-500" />}
                            </div>

                            {isEditing ? (
                                <select
                                    className="bg-transparent text-[10px] font-bold uppercase outline-none w-full border-b border-transparent focus:border-yellow-400"
                                    value={matchup.team1_id || ''}
                                    onChange={(e) => handleChange('team1_id', e.target.value)}
                                >
                                    <option value="" className="text-black">{matchup.team1_placeholder || 'Selecionar...'}</option>
                                    {teams.map(t => <option key={t.id} value={t.id} className="text-black">{t.name}</option>)}
                                </select>
                            ) : (
                                <div className="flex flex-col min-w-0">
                                    <div className={`text-[10px] font-black uppercase truncate ${winner === 1 ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600') : winner === 2 ? 'opacity-40' : ''}`}>
                                        {matchup.team1_seed && <span className="text-gray-500 mr-1">#{matchup.team1_seed}</span>}
                                        {team1?.name || matchup.team1_placeholder || 'TBD'}
                                    </div>
                                    {winner === 1 && (
                                        <div className={`flex items-center gap-1 w-fit mt-0.5 px-1 py-0.5 rounded text-[7px] font-black animate-in fade-in slide-in-from-top-1 ${isDarkMode ? 'bg-yellow-400/10 text-yellow-400' : 'bg-yellow-500/10 text-yellow-700'}`}>
                                            {isFinals ? <Trophy size={6} /> : <ChevronRight size={6} />}
                                            <span>{isFinals ? 'CAMPEÃO' : 'AVANÇA'}</span>
                                        </div>
                                    )}
                                    {winner === 2 && (
                                        <div className="flex items-center gap-1 w-fit mt-0.5 bg-red-500/10 px-1 py-0.5 rounded text-[7px] font-black animate-in fade-in slide-in-from-top-1 text-red-500/80">
                                            <XCircle size={6} />
                                            <span>ELIMINADO</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {isEditing ? (
                            <input
                                type="text"
                                className="w-8 bg-transparent text-center text-xs font-black border-b border-white/10 outline-none focus:border-yellow-400"
                                value={matchup.team1_score ?? ''}
                                onChange={(e) => handleChange('team1_score', e.target.value === '' ? undefined : parseFloat(e.target.value) || 0)}
                            />
                        ) : (
                            <div className={`text-xs font-black ${winner === 1 ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600') : winner === 2 ? 'opacity-40' : ''}`}>{matchup.team1_score ?? 0}</div>
                        )}
                    </div>

                    <div className={`h-[1px] ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`} />

                    {/* Team 2 */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-5 h-5 flex-shrink-0">
                                {team2?.logo_url ? <img src={team2.logo_url} className="w-full h-full object-contain" /> : <HelpCircle size={14} className="text-gray-500" />}
                            </div>

                            {isEditing ? (
                                <select
                                    className="bg-transparent text-[10px] font-bold uppercase outline-none w-full border-b border-transparent focus:border-yellow-400"
                                    value={matchup.team2_id || ''}
                                    onChange={(e) => handleChange('team2_id', e.target.value)}
                                >
                                    <option value="" className="text-black">{matchup.team2_placeholder || 'Selecionar...'}</option>
                                    {teams.map(t => <option key={t.id} value={t.id} className="text-black">{t.name}</option>)}
                                </select>
                            ) : (
                                <div className="flex flex-col min-w-0">
                                    <div className={`text-[10px] font-black uppercase truncate ${winner === 2 ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600') : winner === 1 ? 'opacity-40' : ''}`}>
                                        {matchup.team2_seed && <span className="text-gray-500 mr-1">#{matchup.team2_seed}</span>}
                                        {team2?.name || matchup.team2_placeholder || 'TBD'}
                                    </div>
                                    {winner === 2 && (
                                        <div className={`flex items-center gap-1 w-fit mt-0.5 px-1 py-0.5 rounded text-[7px] font-black animate-in fade-in slide-in-from-top-1 ${isDarkMode ? 'bg-yellow-400/10 text-yellow-400' : 'bg-yellow-500/10 text-yellow-700'}`}>
                                            {isFinals ? <Trophy size={6} /> : <ChevronRight size={6} />}
                                            <span>{isFinals ? 'CAMPEÃO' : 'AVANÇA'}</span>
                                        </div>
                                    )}
                                    {winner === 1 && (
                                        <div className="flex items-center gap-1 w-fit mt-0.5 bg-red-500/10 px-1 py-0.5 rounded text-[7px] font-black animate-in fade-in slide-in-from-top-1 text-red-500/80">
                                            <XCircle size={6} />
                                            <span>ELIMINADO</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {isEditing ? (
                            <input
                                type="text"
                                className="w-8 bg-transparent text-center text-xs font-black border-b border-white/10 outline-none focus:border-yellow-400"
                                value={matchup.team2_score ?? ''}
                                onChange={(e) => handleChange('team2_score', e.target.value === '' ? undefined : parseFloat(e.target.value) || 0)}
                            />
                        ) : (
                            <div className={`text-xs font-black ${winner === 2 ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600') : winner === 1 ? 'opacity-40' : ''}`}>{matchup.team2_score ?? 0}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};



export const PlayoffsBracket: React.FC<PlayoffsBracketProps> = ({ data, teams, isDarkMode, isEditing, onUpdate }) => {
    const bracketRef = React.useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = React.useState(false);

    const handleExport = async () => {
        if (!bracketRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(bracketRef.current, {
                backgroundColor: isDarkMode ? '#050B14' : '#F9FAFB',
                scale: 2, // Higher quality
                logging: false,
                useCORS: true
            });
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `playoffs-bracket-${new Date().getTime()}.png`;
            link.click();
        } catch (err) {
            console.error('Error exporting bracket:', err);
        } finally {
            setIsExporting(false);
        }
    };
    // Initialize data if empty and ensure they are arrays
    const currentPlayIn = Array.isArray(data.play_in) ? data.play_in : [
        { id: 'play-in-a', team1_placeholder: 'GAME A', label: 'GAME A' },
        { id: 'play-in-b', team1_placeholder: 'GAME B', label: 'GAME B' }
    ];
    const currentFirstRound = Array.isArray(data.first_round) ? data.first_round : [
        { id: 'fr-1', label: 'MATCHUP 1' },
        { id: 'fr-2', label: 'MATCHUP 2' },
        { id: 'fr-3', label: 'MATCHUP 3' },
        { id: 'fr-4', label: 'MATCHUP 4' }
    ];
    const currentSemis = Array.isArray(data.semifinals) ? data.semifinals : [
        { id: 'semi-1', label: 'SEMI 1' },
        { id: 'semi-2', label: 'SEMI 2' }
    ];

    const currentFinals = data.finals || { id: 'finals', label: 'BRACO DE FERRO' };

    // Helper to update specific matchup in round arrays
    const updateMatchup = (round: keyof PlayoffData, index: number, updated: PlayoffMatchup) => {
        if (!onUpdate) return;
        const newData = { ...data };
        
        // Map round to the correct "current" array to ensure we are updating an array
        let arr: PlayoffMatchup[] = [];
        if (round === 'play_in') arr = [...currentPlayIn];
        else if (round === 'first_round') arr = [...currentFirstRound];
        else if (round === 'semifinals') arr = [...currentSemis];

        if (arr.length > 0) {
            arr[index] = updated;
            newData[round] = arr as any;
        } else if (round === 'finals') {
            newData.finals = updated;
        }
        
        onUpdate(newData);
    };

    return (
        <div className="space-y-6">
            <div 
                ref={bracketRef}
                className={`flex flex-col gap-8 overflow-x-auto pb-8 custom-scrollbar rounded-3xl p-8 ${isDarkMode ? 'bg-black/40 border border-white/5' : 'bg-gray-50 border border-gray-100'}`}
            >
                <div className="flex gap-12 min-w-max px-2">
                    
                    {/* PLAY-IN */}
                    <div className="flex flex-col gap-12">
                        <h4 className="text-[10px] font-black uppercase tracking-[3px] text-[#E67E22] mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#E67E22]" />
                            PLAY-IN
                        </h4>
                        <div className="flex flex-col gap-8 py-20">
                            {currentPlayIn.map((m, i) => (
                                <MatchupCard
                                    key={m.id}
                                    matchup={m}
                                    teams={teams}
                                    isDarkMode={isDarkMode}
                                    isEditing={isEditing}
                                    onEdit={(updated) => updateMatchup('play_in', i, updated)}
                                    label={m.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* FIRST ROUND */}
                    <div className="flex flex-col gap-12">
                        <h4 className="text-[10px] font-black uppercase tracking-[3px] text-gray-500 mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-500" />
                            FIRST ROUND
                        </h4>
                        <div className="flex flex-col gap-4">
                            {currentFirstRound.map((m, i) => (
                                <MatchupCard
                                    key={m.id}
                                    matchup={m}
                                    teams={teams}
                                    isDarkMode={isDarkMode}
                                    isEditing={isEditing}
                                    onEdit={(updated) => updateMatchup('first_round', i, updated)}
                                    label={m.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* SEMIFINALS */}
                    <div className="flex flex-col gap-12">
                        <h4 className="text-[10px] font-black uppercase tracking-[3px] text-gray-500 mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-500" />
                            SEMIFINALS
                        </h4>
                        <div className="flex flex-col gap-24 py-12">
                            {currentSemis.map((m, i) => (
                                <MatchupCard
                                    key={m.id}
                                    matchup={m}
                                    teams={teams}
                                    isDarkMode={isDarkMode}
                                    isEditing={isEditing}
                                    onEdit={(updated) => updateMatchup('semifinals', i, updated)}
                                    label={m.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* FINALS */}
                    <div className="flex flex-col gap-12">
                        <h4 className="text-[10px] font-black uppercase tracking-[3px] text-yellow-500 mb-2 flex items-center gap-2">
                            <Trophy size={14} className="text-yellow-500" />
                            FINALS
                        </h4>
                        <div className="flex items-center h-full">
                            <div className="relative">
                                {/* Gold Background for Finals */}
                                <div className={`absolute -inset-4 rounded-[40px] blur-2xl opacity-10 ${isDarkMode ? 'bg-yellow-400' : 'bg-yellow-600'}`} />
                                <MatchupCard
                                    matchup={currentFinals}
                                    teams={teams}
                                    isDarkMode={isDarkMode}
                                    isEditing={isEditing}
                                    onEdit={(updated) => onUpdate?.({ ...data, finals: updated })}
                                    label="THE CHAMPIONSHIP"
                                    isFinals={true}
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div className={`flex justify-between items-center p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Exportar Imagem</span>
                    <span className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Baixe o chaveamento atual como imagem em alta resolução</span>
                </div>
                <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase transition-all ${
                        isExporting 
                            ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed' 
                            : isDarkMode 
                                ? 'bg-white/10 text-white hover:bg-white/20' 
                                : 'bg-white text-[#0B1D33] border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    <Download size={14} />
                    {isExporting ? 'Exportando...' : 'Baixar Imagem (PNG)'}
                </button>
            </div>
        </div>
    );
};
