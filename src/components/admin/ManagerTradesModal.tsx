import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { listManagerHistory } from '../../cms';
import { supabase } from '../../lib/supabase';
import { ManagerHistory } from '../../types';

interface ManagerTradesModalProps {
    managerId: string;
    managerName: string;
    isDarkMode: boolean;
    onClose: () => void;
}

export const ManagerTradesModal: React.FC<ManagerTradesModalProps> = ({ managerId, managerName, isDarkMode, onClose }) => {
    const [tradesList, setTradesList] = useState<{ year: string, teamName: string, count: number, logoUrl?: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchData();
    }, [managerId]);

    const fetchData = async () => {
        setLoading(true);
        // 1. Get Manager History to know which teams they managed in which years
        const { data: historyData } = await listManagerHistory(managerId);

        if (historyData) {
            // 2. We need map Year -> SeasonId to query standings
            const { data: seasonsData } = await supabase.from('seasons').select('id, year');
            const seasonYearIdMap: Record<string, string> = {};
            seasonsData?.forEach((s: any) => seasonYearIdMap[s.year] = s.id);

            // 3. Get all standings for involved teams (could be optimized but okay for now)
            // or fetch specifically. Let's fetch all standings that have trades > 0
            const { data: standingsData } = await supabase.from('season_standings')
                .select('season_id, team_id, trades_count')
                .gt('trades_count', 0);

            const standingsMap: Record<string, number> = {}; // "seasonId-teamId" -> count
            standingsData?.forEach((st: any) => {
                standingsMap[`${st.season_id}-${st.team_id}`] = st.trades_count || 0;
            });

            const processed: { year: string, teamName: string, count: number, logoUrl?: string }[] = [];
            let totalCount = 0;

            historyData.forEach(h => {
                if (!h.team_id || !h.year) return;
                const sId = seasonYearIdMap[h.year];
                if (!sId) return;

                const count = standingsMap[`${sId}-${h.team_id}`] || 0;
                if (count > 0) {
                    processed.push({
                        year: h.year,
                        teamName: h.team?.name || 'Time',
                        logoUrl: h.team?.logo_url,
                        count
                    });
                    totalCount += count;
                }
            });

            // Sort by year desc
            processed.sort((a, b) => b.year.localeCompare(a.year));
            setTradesList(processed);
            setTotal(totalCount);
        }
        setLoading(false);
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh] ${isDarkMode ? 'bg-[#121212]' : 'bg-white'}`}>

                {/* Header */}
                <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div>
                        <div className="text-[10px] font-black uppercase text-green-500 tracking-widest mb-1 flex items-center gap-2">
                            <ArrowRightLeft size={12} /> Histórico de Trades
                        </div>
                        <h2 className={`text-lg font-black uppercase leading-none ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                            {managerName}
                        </h2>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500 text-xs">Carregando...</div>
                    ) : tradesList.length > 0 ? (
                        <>
                            <div className="flex items-center justify-center p-4 mb-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                <div className="text-center">
                                    <div className="text-3xl font-black text-green-500">{total}</div>
                                    <div className="text-[9px] font-bold uppercase text-green-400 tracking-widest">Total de Trades</div>
                                </div>
                            </div>

                            {tradesList.map((t, i) => (
                                <div key={i} className={`p-4 rounded-2xl flex items-center justify-between border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                                            <span className="text-[10px] font-bold text-gray-400">{t.year.split('/')[0]}</span>
                                            <span className="text-[10px] font-bold text-gray-400 leading-none">/</span>
                                            <span className="text-[10px] font-bold text-gray-400">{t.year.split('/')[1].slice(2)}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-sm font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{t.teamName}</span>
                                                {t.logoUrl && <img src={t.logoUrl} className="w-4 h-4 object-contain opacity-50" />}
                                            </div>
                                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-wide">
                                                {t.count} Trades
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center opacity-50">
                            <ArrowRightLeft size={48} className="text-gray-300 mb-4" />
                            <p className="text-xs font-bold text-gray-400 uppercase">Nenhuma trade registrada.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
