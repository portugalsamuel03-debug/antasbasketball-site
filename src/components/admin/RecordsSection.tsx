import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw, Eye, EyeOff, Crown } from 'lucide-react';
import { RecordDetailsModal } from './RecordDetailsModal';
import { useAdmin } from '../../context/AdminContext';
import { useGlobalData } from '../../hooks/useGlobalData';
import { calculateAutomaticRecords } from '../../utils/records';
import { listRecords } from '../../cms';
import { RecordItem } from '../../types';

interface RecordsSectionProps {
    isDarkMode: boolean;
}

export const RecordsSection: React.FC<RecordsSectionProps> = ({ isDarkMode }) => {
    const { isAdmin, isEditing } = useAdmin();
    // Use the global data hook
    const { standings, history, teams, managers, seasons, champions, awards, trades, loading: dataLoading } = useGlobalData();

    const [stats, setStats] = useState<any[]>([]);
    const [hiddenRecordIds, setHiddenRecordIds] = useState<string[]>([]);
    const [loadingHidden, setLoadingHidden] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

    const ITEMS_PER_PAGE = 5;
    const [currentPage, setCurrentPage] = useState(1);

    const loading = dataLoading || loadingHidden;

    useEffect(() => {
        fetchHiddenAndCalculate();
    }, [dataLoading, standings]); // Recalculate when data loads

    const fetchHiddenAndCalculate = async () => {
        setLoadingHidden(true); // Set loading for hidden records
        try {
            // Fetch hidden records
            const { data: hiddenData } = await supabase.from('hidden_records').select('record_id');
            if (hiddenData) {
                setHiddenRecordIds((hiddenData as any[]).map(r => r.record_id));
            }
            setLoadingHidden(false);

            if (!dataLoading) {
                const autoRecords = calculateAutomaticRecords(
                    standings, history, teams, managers, seasons, champions, awards, trades
                );

                // Fetch Manual Records
                const { data: manualData } = await listRecords();
                const manualRecords = manualData ? (manualData as RecordItem[]) : [];

                // Combine: Manual records first, then Automatic
                // Or maybe distinct?
                // For now, just concat. Manual records usually have UUIDs. Auto have string IDs.
                setStats([...manualRecords, ...autoRecords]);
            }

        } catch (error) {
            console.error('Error fetching hidden records:', error);
            setLoadingHidden(false);
        }
    };

    // Manual Refresh button handler
    const handleRefresh = () => {
        window.location.reload(); // Simple refresh for now as hook fetches on mount
    };

    const toggleRecordVisibility = async (e: React.MouseEvent, recordId: string) => {
        e.stopPropagation();
        if (!isEditing) return;

        try {
            if (hiddenRecordIds.includes(recordId)) {
                // Unhide
                await supabase.from('hidden_records').delete().eq('record_id', recordId);
                setHiddenRecordIds(prev => prev.filter(id => id !== recordId));
            } else {
                // Hide
                await supabase.from('hidden_records').insert({ record_id: recordId });
                setHiddenRecordIds(prev => [...prev, recordId]);
            }
        } catch (error) {
            console.error('Error toggling visibility:', error);
            alert('Erro ao alterar visibilidade. Verifique se a tabela hidden_records existe.');
        }
    };

    // Filter records: Show if NOT hidden, OR if user is Admin (but dimmed)
    const displayedRecords = stats.filter(r => !hiddenRecordIds.includes(r.id) || isEditing);

    // Pagination
    const totalPages = Math.ceil(displayedRecords.length / ITEMS_PER_PAGE);
    const paginatedRecords = displayedRecords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className={`py-4`}>
            <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                    Recordes Históricos {isEditing && <span className="text-yellow-500 text-sm">(Automático + Manual)</span>}
                </h2>
                {isEditing && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedRecord({})}
                            className="px-4 py-2 bg-yellow-500 text-black rounded-xl font-bold text-xs uppercase hover:bg-yellow-400 transition-colors"
                        >
                            Novo Recorde
                        </button>
                        <button
                            onClick={handleRefresh}
                            className={`p-3 rounded-xl transition-all active:scale-95 ${loading ? 'animate-spin bg-yellow-400 text-black' : isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-[#0B1D33]'}`}
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <RefreshCw size={32} className="animate-spin text-yellow-500" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4">
                        {paginatedRecords.map((rec) => {
                            const isHidden = hiddenRecordIds.includes(rec.id);
                            return (
                                <div
                                    key={rec.id}
                                    onClick={() => isEditing && setSelectedRecord(rec)}
                                    className={`flex gap-4 items-center p-4 md:p-6 rounded-3xl border-2 transition-all group
                                    ${isDarkMode ? 'bg-[#121212] border-white/5 hover:border-yellow-500/30' : 'bg-white border-gray-100 hover:border-yellow-500/30'}
                                    ${isEditing ? 'cursor-pointer' : ''}
                                    ${isHidden ? 'opacity-50 grayscale' : ''}
                                `}
                                >
                                    {/* Icon */}
                                    <div className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-4 ${isDarkMode ? 'bg-[#1a1a1a] border-[#222] text-yellow-500' : 'bg-gray-50 border-white text-yellow-500 shadow-sm'}`}>
                                        <Crown size={24} className="opacity-90 drop-shadow-md" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <h3 className={`text-[13px] md:text-[15px] font-black uppercase tracking-wide mb-1 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'} flex items-center gap-2`}>
                                            {rec.title}
                                            {isHidden && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded">OCULTO</span>}
                                        </h3>
                                        <p className={`text-[11px] md:text-xs font-bold uppercase mb-1 ${isDarkMode ? 'text-yellow-500' : 'text-blue-600'}`}>
                                            {rec.holder}
                                        </p>
                                        <p className={`text-[10px] md:text-[11px] leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {rec.description}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 ml-2">
                                        {(rec.value != null && rec.value !== '') && (
                                            <div className={`flex items-center justify-center min-w-[3rem] px-3 h-10 md:h-12 rounded-2xl font-black text-sm md:text-base border-2 ${isDarkMode ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-[#0B1D33] border-[#0a1829] text-white shadow-md'}`}>
                                                {rec.value}
                                            </div>
                                        )}
                                        {isEditing && (
                                            <button
                                                onClick={(e) => toggleRecordVisibility(e, rec.id)}
                                                className={`p-1.5 md:p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-black'}`}
                                                title={isHidden ? "Mostrar Recorde" : "Ocultar Recorde"}
                                            >
                                                {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all
                                ${isDarkMode
                                        ? 'bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
                                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                            >
                                Anterior
                            </button>

                            <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                Página {currentPage} de {totalPages}
                            </span>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-6 py-3 rounded-full bg-yellow-400 text-black font-black text-xs uppercase tracking-widest hover:bg-yellow-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Próxima
                            </button>
                        </div>
                    )}
                </>
            )}

            {selectedRecord && (
                <RecordDetailsModal
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                    onSave={() => {
                        setSelectedRecord(null);
                        window.location.reload();
                    }}
                    isDarkMode={isDarkMode}
                />
            )}
        </div>
    );
};
