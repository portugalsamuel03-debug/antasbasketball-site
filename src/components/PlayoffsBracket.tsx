import React from 'react';
import { Trophy, HelpCircle, ChevronRight, XCircle, Download, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { PlayoffData, PlayoffMatchup, Team } from '../types';

interface PlayoffsBracketProps {
    data: PlayoffData;
    teams: Team[];
    isDarkMode: boolean;
    isEditing?: boolean;
    onUpdate?: (data: PlayoffData) => void;
}

const SearchableSelect: React.FC<{
    value: string;
    onChange: (value: string) => void;
    options: Team[];
    placeholder: string;
    isDarkMode: boolean;
}> = ({ value, onChange, options, placeholder, isDarkMode }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.id === value);
    const filteredOptions = options.filter(o => 
        o.name.toLowerCase().includes(search.toLowerCase())
    );

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative w-full">
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="cursor-pointer text-[10px] font-bold uppercase border-b border-transparent hover:border-yellow-400 py-0.5 flex items-center justify-between gap-1"
            >
                <span className="truncate">{selectedOption?.name || placeholder}</span>
                <ChevronRight size={10} className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </div>

            {isOpen && (
                <div className={`absolute z-50 top-full left-0 w-64 mt-2 rounded-xl shadow-2xl border ${isDarkMode ? 'bg-[#0B1D33] border-white/10' : 'bg-white border-gray-100'} overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                    <div className="p-2 border-b border-white/5">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar time..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] uppercase font-bold outline-none focus:border-yellow-400 placeholder:text-gray-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        <div 
                            onClick={() => { onChange(''); setIsOpen(false); }}
                            className={`p-2 text-[10px] uppercase font-bold cursor-pointer hover:bg-white/5 ${!value ? 'text-yellow-400 bg-white/5' : 'text-gray-400'}`}
                        >
                            {placeholder}
                        </div>
                        {filteredOptions.map(option => (
                            <div 
                                key={option.id}
                                onClick={() => { onChange(option.id); setIsOpen(false); }}
                                className={`p-2 text-[10px] uppercase font-bold cursor-pointer flex items-center gap-2 hover:bg-white/5 ${value === option.id ? 'text-yellow-400 bg-white/5' : ''}`}
                            >
                                {option.logo_url && <img src={option.logo_url} className="w-4 h-4 object-contain" />}
                                <span className="truncate">{option.name}</span>
                            </div>
                        ))}
                        {filteredOptions.length === 0 && (
                            <div className="p-4 text-center text-[10px] text-gray-500 uppercase font-black">Nenhum time encontrado</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

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
                                <SearchableSelect 
                                    value={matchup.team1_id || ''}
                                    onChange={(val) => handleChange('team1_id', val)}
                                    options={teams}
                                    placeholder={matchup.team1_placeholder || 'Selecionar...'}
                                    isDarkMode={isDarkMode}
                                />
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
                                <SearchableSelect 
                                    value={matchup.team2_id || ''}
                                    onChange={(val) => handleChange('team2_id', val)}
                                    options={teams}
                                    placeholder={matchup.team2_placeholder || 'Selecionar...'}
                                    isDarkMode={isDarkMode}
                                />
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

    const handleExport = async (format: 'png' | 'pdf') => {
        if (!bracketRef.current) return;
        setIsExporting(true);
        try {
            // Temporarily improve styles for capture if needed
            const canvas = await html2canvas(bracketRef.current, {
                backgroundColor: isDarkMode ? '#050B14' : '#F9FAFB',
                scale: 4, // Ultra-high quality
                logging: false,
                useCORS: true,
                onclone: (clonedDoc) => {
                    // Optimized styles for capture
                    const el = clonedDoc.querySelector('[data-export="bracket"]') as HTMLElement;
                    if (el) {
                        el.style.overflow = 'visible';
                        el.style.width = 'fit-content';
                        el.style.minWidth = '2000px'; // Give it plenty of room to avoid wrapping
                        el.style.height = 'auto';
                        el.style.display = 'block';
                        
                        // Fix truncation and rendering on all text elements
                        const textElements = el.querySelectorAll('.truncate, .font-black, .font-bold');
                        textElements.forEach((node) => {
                            const htmlNode = node as HTMLElement;
                            htmlNode.style.overflow = 'visible';
                            htmlNode.style.whiteSpace = 'nowrap';
                            htmlNode.style.display = 'inline-block';
                            htmlNode.style.width = 'auto';
                            htmlNode.style.height = 'auto';
                            htmlNode.style.textOverflow = 'unset';
                            htmlNode.style.lineHeight = 'normal';
                            htmlNode.style.padding = '2px 0'; // Vertical breathing room
                            htmlNode.classList.remove('truncate');
                        });

                        // Clear any hidden overflows in children
                        const allDivs = el.querySelectorAll('div');
                        allDivs.forEach(d => {
                            (d as HTMLElement).style.overflow = 'visible';
                        });
                    }
                }
            });

            if (format === 'png') {
                const image = canvas.toDataURL('image/png', 1.0);
                const link = document.createElement('a');
                link.href = image;
                link.download = `playoffs-bracket-${new Date().getTime()}.png`;
                link.click();
            } else {
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const pdf = new jsPDF({
                    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [canvas.width / 2, canvas.height / 2] // Scale down PDF size slightly for better fit
                });
                
                pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2, canvas.height / 2);
                pdf.save(`playoffs-bracket-${new Date().getTime()}.pdf`);
            }
        } catch (err) {
            console.error('Error exporting bracket:', err);
        } finally {
            setIsExporting(false);
        }
    };
    // Initialize data if empty and ensure they are arrays
    const settings = data.settings || {
        show_play_in: true,
        first_round_count: 4,
        show_semis: true,
        show_finals: true
    };

    const currentPlayIn = Array.isArray(data.play_in) ? data.play_in : [
        { id: 'play-in-a', team1_placeholder: 'GAME A', label: 'GAME A' },
        { id: 'play-in-b', team1_placeholder: 'GAME B', label: 'GAME B' }
    ];
    const currentFirstRound = Array.isArray(data.first_round) ? data.first_round : Array.from({ length: 4 }, (_, i) => ({
        id: `fr-${i + 1}`, label: `MATCHUP ${i + 1}`
    }));
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

    const updateSettings = (newSettings: Partial<typeof settings>) => {
        if (!onUpdate) return;
        const updatedSettings = { ...settings, ...newSettings };
        const newData = { ...data, settings: updatedSettings };

        // Normalize first round based on count
        if (newSettings.first_round_count !== undefined) {
            const count = newSettings.first_round_count;
            const newFirstRound = [...currentFirstRound];
            if (newFirstRound.length < count) {
                for (let i = newFirstRound.length; i < count; i++) {
                    newFirstRound.push({ id: `fr-${i + 1}`, label: `MATCHUP ${i + 1}` });
                }
            } else {
                newFirstRound.splice(count);
            }
            newData.first_round = newFirstRound;
        }

        onUpdate(newData);
    };

    return (
        <div className="space-y-6">
            {isEditing && (
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-black uppercase text-gray-500">Formato do Chaveamento</span>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => updateSettings({ show_play_in: !settings.show_play_in })}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${settings.show_play_in ? 'bg-[#E67E22] text-white' : 'bg-gray-500/10 text-gray-500'}`}
                                >
                                    PLAY-IN
                                </button>
                                <div className="h-4 w-[1px] bg-white/10 mx-1" />
                                <div className="flex items-center gap-1">
                                    {[0, 2, 4].map(count => (
                                        <button 
                                            key={count}
                                            onClick={() => updateSettings({ first_round_count: count })}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${settings.first_round_count === count ? 'bg-yellow-500 text-white' : 'bg-gray-500/10 text-gray-500'}`}
                                        >
                                            {count === 0 ? 'OFF' : `${count * 2} TIMES`}
                                        </button>
                                    ))}
                                    <span className="ml-1 text-[9px] font-black uppercase text-gray-500">1ª Rodada</span>
                                </div>
                                <div className="h-4 w-[1px] bg-white/10 mx-1" />
                                <button 
                                    onClick={() => updateSettings({ show_semis: !settings.show_semis })}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${settings.show_semis ? 'bg-yellow-500 text-white' : 'bg-gray-500/10 text-gray-500'}`}
                                >
                                    SEMIFINAIS
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div 
                ref={bracketRef}
                data-export="bracket"
                className={`flex flex-col gap-8 overflow-x-auto pb-8 custom-scrollbar rounded-3xl p-8 ${isDarkMode ? 'bg-black/40 border border-white/5' : 'bg-gray-50 border border-gray-100'}`}
            >
                <div className="flex gap-12 min-w-max px-2">
                    
                    {/* PLAY-IN */}
                    {settings.show_play_in && (
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
                    )}

                    {/* FIRST ROUND */}
                    {settings.first_round_count > 0 && (
                        <div className="flex flex-col gap-12">
                            <h4 className="text-[10px] font-black uppercase tracking-[3px] text-gray-500 mb-2 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-500" />
                                FIRST ROUND
                            </h4>
                            <div className={`flex flex-col gap-4 ${settings.first_round_count === 2 ? 'py-20' : ''}`}>
                                {currentFirstRound.slice(0, settings.first_round_count).map((m, i) => (
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
                    )}

                    {/* SEMIFINALS */}
                    {settings.show_semis && (
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
                    )}

                    {/* FINALS */}
                    {settings.show_finals && (
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
                    )}

                </div>
            </div>

            <div className={`flex justify-between items-center p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Exportar Imagem</span>
                    <span className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Baixe o chaveamento atual como imagem em alta resolução</span>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => handleExport('png')}
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
                        {isExporting ? 'Processando...' : 'PNG'}
                    </button>
                    <button 
                        onClick={() => handleExport('pdf')}
                        disabled={isExporting}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase transition-all ${
                            isExporting 
                                ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed' 
                                : isDarkMode 
                                    ? 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20' 
                                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                        }`}
                    >
                        <FileText size={14} />
                        {isExporting ? 'Processando...' : 'PDF (MELHOR QUALIDADE)'}
                    </button>
                </div>
            </div>
        </div>
    );
};
