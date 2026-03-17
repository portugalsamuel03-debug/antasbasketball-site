import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Play, Save, RefreshCw, Settings2, GripVertical as ReorderIcon } from 'lucide-react';
import { useGlobalData } from '../hooks/useGlobalData';
import { useAdmin } from '../context/AdminContext';
import { DraftSimulationModal } from './DraftSimulationModal';
import { supabase } from '../lib/supabase';

interface DraftLogicModalProps {
    onClose: () => void;
    isDarkMode: boolean;
}

// 500-Ball Weights per Seed
const DRAFT_WEIGHTS = [127, 100, 75, 45, 35, 25, 20, 15, 8, 8, 8, 8, 8, 8, 2, 2, 2, 2, 1, 1];

const getPick1Probability = (index: number) => {
    const balls = DRAFT_WEIGHTS[index] || 0;
    return ((balls / 500) * 100).toFixed(1) + '%';
};

export const DraftLogicModal: React.FC<DraftLogicModalProps> = ({ onClose, isDarkMode }) => {
    const { seasons, standings, teams } = useGlobalData();
    const { isEditing } = useAdmin();
    const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
    const [sortedTeams, setSortedTeams] = useState<any[]>([]);
    const [overrides, setOverrides] = useState<any[]>([]);

    // UI State
    const [showSimulation, setShowSimulation] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (seasons.length > 0 && !selectedSeasonId) {
            // Select the most recent season by default
            const sortedSeasons = [...seasons].sort((a, b) => b.year.localeCompare(a.year));
            setSelectedSeasonId(sortedSeasons[0].id);
        }
    }, [seasons]);

    const fetchOverrides = async (seasonId: string) => {
        try {
            const { data, error } = await supabase
                .from('draft_overrides')
                .select('*')
                .eq('season_id', seasonId);
            if (data) setOverrides(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (selectedSeasonId) {
            fetchOverrides(selectedSeasonId);
        }
    }, [selectedSeasonId]);

    useEffect(() => {
        if (selectedSeasonId && standings.length > 0) {
            // Get standings for the selected season
            const seasonStandings = standings.filter(s => s.season_id === selectedSeasonId);

            // Map to teams
            const activeTeams = seasonStandings.map(s => {
                const team = teams.find(t => t.id === s.team_id);
                const override = overrides.find(o => o.team_id === s.team_id);
                return {
                    team,
                    originalPosition: s.position,
                    position: override?.custom_position ?? s.position,
                    probability: override?.lottery_probability ?? null,
                    probabilityP2: override?.lottery_probability_p2 ?? null,
                    probabilityP3: override?.lottery_probability_p3 ?? null,
                    probabilityP4: override?.lottery_probability_p4 ?? null,
                    record: `${s.wins}V - ${s.losses}D`
                };
            }).filter(t => t.team); // ensure team exists

            // Reverse order: lowest position (worst record) gets top row
            // Usually, largest position number is the worst (e.g., 14th place).
            const sorted = activeTeams.sort((a, b) => (b.position || 0) - (a.position || 0));
            setSortedTeams(sorted);
        } else {
            setSortedTeams([]);
        }
    }, [selectedSeasonId, standings, teams, overrides]);

    // Drag and Drop Handlers
    const handleDragStart = (index: number) => {
        if (!editMode) return;
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        if (!editMode || draggedIndex === null) return;
        e.preventDefault();
        if (index === draggedIndex) return;

        const newTeams = [...sortedTeams];
        const item = newTeams.splice(draggedIndex, 1)[0];
        newTeams.splice(index, 0, item);
        setSortedTeams(newTeams);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleSaveOverrides = async () => {
        if (!selectedSeasonId) {
            alert("Selecione uma temporada.");
            return;
        }

        setIsSaving(true);
        try {
            // Recalculate positions based on the current list order (Draggable)
            // Worst record (Position 20 if 20 teams) should be at INDEX 0 (Seed #1)
            const totalTeams = sortedTeams.length;
            const upsertData = sortedTeams.map((t, index) => {
                const teamId = t.team.id;
                const existing = overrides.find(o => o.team_id === teamId);
                
                // If the user wants Seed #1 at index 0, and we have 20 teams,
                // the custom_position should be 20 for index 0, 19 for index 1...
                const calculatedPos = totalTeams - index;

                return {
                    ...(existing?.id ? { id: existing.id } : {}),
                    season_id: selectedSeasonId,
                    team_id: teamId,
                    custom_position: calculatedPos
                };
            });

            if (upsertData.length === 0) {
                setEditMode(false);
                setIsSaving(false);
                return;
            }

            const { error } = await supabase
                .from('draft_overrides')
                .upsert(upsertData, { 
                    onConflict: 'season_id,team_id'
                });

            if (error) throw error;

            await fetchOverrides(selectedSeasonId);
            setEditMode(false);
            alert('Ordem do Draft salva com sucesso!');
        } catch (err: any) {
            console.error("Save error:", err);
            alert(`Erro ao salvar: ${err.message || 'Erro desconhecido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetOverrides = async () => {
        if (!confirm('Tem certeza que deseja apagar os ajustes manuais de posições desta temporada?')) return;
        setIsSaving(true);
        try {
            await supabase
                .from('draft_overrides')
                .delete()
                .eq('season_id', selectedSeasonId);

            await fetchOverrides(selectedSeasonId);
            setEditMode(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    // Handle background click directly parsing intensity
    const getCellColor = (valStr: string) => {
        const val = parseFloat(valStr.replace('%', ''));
        if (val === 0) return 'transparent';
        if (val >= 20) return isDarkMode ? 'bg-blue-600/60' : 'bg-blue-600/30';
        if (val >= 10) return isDarkMode ? 'bg-blue-500/40' : 'bg-blue-500/20';
        if (val >= 5) return isDarkMode ? 'bg-blue-400/20' : 'bg-blue-400/10';
        return isDarkMode ? 'bg-white/5' : 'bg-black/5';
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-[24px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#121212] border border-white/10' : 'bg-white border border-gray-200'}`}>

                {/* Header */}
                <div className={`px-6 py-4 flex items-center justify-between border-b ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}>
                    <div className="flex items-center gap-4">
                        <h2 className={`text-xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                            Lógica do Draft (Loteria)
                        </h2>

                        {/* Season Selector */}
                        <div className="relative">
                            <select
                                value={selectedSeasonId}
                                onChange={(e) => setSelectedSeasonId(e.target.value)}
                                className={`appearance-none pl-4 pr-10 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer border-2 transition-all outline-none ${isDarkMode
                                    ? 'bg-[#1a1a1a] border-[#222] text-white hover:border-yellow-500/50'
                                    : 'bg-white border-gray-200 text-[#0B1D33] hover:border-blue-600/50'
                                    }`}
                            >
                                <option value="">Selecione...</option>
                                {[...seasons].sort((a, b) => b.year.localeCompare(a.year)).map(s => (
                                    <option key={s.id} value={s.id}>{s.name || s.year}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                        </div>
                    </div>

                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-500'}`}>
                        <X size={20} />
                    </button>
                    {/* Admin Edit Controls - Moved inside next to title mostly, but let's put them below season selector */}
                </div>

                {/* Sub-header Controls */}
                <div className={`px-6 py-3 flex items-center justify-between border-b ${isDarkMode ? 'border-white/10 bg-[#1a1a1a]' : 'border-black/5 bg-gray-50'}`}>
                    <button
                        onClick={() => setShowSimulation(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                            ${isDarkMode ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-[#0B1D33] text-white hover:bg-yellow-400 hover:text-black'}`}
                    >
                        <Play size={14} />
                        Realizar Simulação
                    </button>

                    {isEditing && (
                        <div className="flex items-center gap-2">
                            {editMode ? (
                                <>
                                    <button
                                        onClick={handleResetOverrides}
                                        disabled={isSaving}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                    >
                                        <RefreshCw size={12} />
                                        Resetar
                                    </button>
                                    <button
                                        onClick={handleSaveOverrides}
                                        disabled={isSaving}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                    >
                                        <Save size={12} />
                                        Salvar
                                    </button>
                                    <button
                                        onClick={() => setEditMode(false)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}
                                    >
                                        Cancelar
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-black hover:bg-black/10'}`}
                                >
                                    <Settings2 size={12} />
                                    Editar Posições
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1 p-6">
                    <p className={`text-xs mb-6 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Esta tabela ilustra as chances que cada time ativo na temporada escolhida possui de garantir cada uma das escolhas no sorteio do Draft. Times com piores campanhas possuem maiores chances matemáticas de conseguir a 1ª escolha global.
                    </p>

                    <div className="min-w-full">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr>
                                    <th className={`p-2 font-black text-[10px] uppercase tracking-wider text-left ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Seed</th>
                                    <th className={`p-2 font-black text-[10px] uppercase tracking-wider text-left pl-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Time (Pior Recorde 1º)</th>
                                    <th className={`p-2 font-black text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-[#0B1D33]'}`}>Bolinhas</th>
                                    <th className={`p-2 font-black text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-[#0B1D33]'}`}>Pick 1 (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTeams.map((teamObj, rowIndex) => {
                                    const balls = DRAFT_WEIGHTS[rowIndex] || 0;
                                    const pick1Prob = getPick1Probability(rowIndex);

                                    return (
                                        <tr 
                                            key={teamObj.team.id} 
                                            draggable={editMode}
                                            onDragStart={() => handleDragStart(rowIndex)}
                                            onDragOver={(e) => handleDragOver(e, rowIndex)}
                                            onDragEnd={handleDragEnd}
                                            className={`border-b border-t transition-all ${editMode ? 'cursor-move' : ''} ${draggedIndex === rowIndex ? 'opacity-50 scale-[0.98] bg-blue-500/10' : ''} ${isDarkMode ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}
                                        >
                                            <td className={`p-2 text-xs font-bold ${isDarkMode ? 'text-yellow-500' : 'text-blue-600'} text-left flex items-center gap-2`}>
                                                {editMode && <ReorderIcon size={12} className="opacity-50" />}
                                                #{rowIndex + 1}
                                            </td>
                                            <td className="p-2 text-left pl-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${isDarkMode ? 'bg-[#222]' : 'bg-gray-100'}`}>
                                                        {teamObj.team.logo_url ? (
                                                            <img src={teamObj.team.logo_url} alt="logo" className="w-[80%] h-[80%] object-contain" />
                                                        ) : (
                                                            <span className="text-[10px] font-bold">AT</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className={`text-xs font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                                            {teamObj.team.name}
                                                        </div>
                                                        <div className={`text-[9px] font-bold flex items-center gap-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            {editMode ? (
                                                                <span className="text-blue-500 font-black">Arraste para reordenar</span>
                                                            ) : (
                                                                <>Pos: {teamObj.position} {teamObj.originalPosition !== teamObj.position && '(Ajustada)'}</>
                                                            )}
                                                            <span className="ml-1 opacity-50">({teamObj.record})</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            {/* Bolinhas */}
                                            <td className={`p-2 text-xs font-black ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {balls} bolinhas
                                            </td>

                                            {/* Pick 1 % */}
                                            <td className={`p-2 text-xs font-bold ${getCellColor(pick1Prob)} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {pick1Prob}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
            {showSimulation && (
                <DraftSimulationModal
                    teams={sortedTeams}
                    seasons={seasons}
                    selectedSeasonId={selectedSeasonId}
                    onSeasonChange={(id) => setSelectedSeasonId(id)}
                    isDarkMode={isDarkMode}
                    onClose={() => setShowSimulation(false)}
                />
            )}
        </div>
    );
};
