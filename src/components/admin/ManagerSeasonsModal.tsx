import React, { useState, useEffect } from 'react';
import { X, Calendar, User } from 'lucide-react';
import { listManagerHistory } from '../../cms';
import { supabase } from '../../lib/supabase';
import { ManagerHistory } from '../../types';

interface ManagerSeasonsModalProps {
    managerId: string;
    managerName: string;
    isDarkMode: boolean;
    onClose: () => void;
}

export const ManagerSeasonsModal: React.FC<ManagerSeasonsModalProps> = ({ managerId, managerName, isDarkMode, onClose }) => {
    const [history, setHistory] = useState<(ManagerHistory & { stats?: any })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [managerId]);

    const fetchData = async () => {
        setLoading(true);
        const { data: hist } = await listManagerHistory(managerId);
        if (hist) {
            // Fetch Standings to attach stats
            const { data: standings } = await supabase.from('season_standings').select('season_id, team_id, position, wins, losses, ties');
            const statsMap: Record<string, any> = {};

            // We need to map standings by team_id + season_year (since standing has season_id)
            // But manager_history has year string.
            // Let's fetch seasons to map year -> id
            const { data: seasons } = await supabase.from('seasons').select('id, year');
            const yearIdMap: Record<string, string> = {};
            seasons?.forEach((s: any) => yearIdMap[s.year] = s.id);

            standings?.forEach((st: any) => {
                statsMap[`${st.season_id}-${st.team_id}`] = st;
            });

            const enriched = hist.map(h => {
                const sId = yearIdMap[h.year];
                const stats = sId && h.team_id ? statsMap[`${sId}-${h.team_id}`] : null;
                return { ...h, stats };
            });

            setHistory(enriched);
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
                        <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Histórico de Temporadas</div>
                        <h2 className={`text-lg font-black uppercase leading-none ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                            {managerName}
                        </h2>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500 text-xs">Carregando...</div>
                    ) : history.length > 0 ? (
                        history.map(h => (
                            <div key={h.id} className={`p-4 rounded-2xl flex items-center justify-between gap-4 border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-black ${isDarkMode ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm'}`}>
                                        {h.year.split('/')[0].slice(2)}/{h.year.split('/')[1].slice(2)}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Equipe</span>
                                        <span className={`text-sm font-black uppercase truncate ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                            {h.team?.name || 'SEM TIME'}
                                        </span>
                                    </div>
                                </div>
                                {h.stats && (
                                    <div className="text-right flex-shrink-0">
                                        <div className={`text-xs font-black ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                            {h.stats.position}º Lugar
                                        </div>
                                        <div className="text-[9px] font-bold text-gray-500">
                                            {h.stats.wins}V - {h.stats.losses}D - {h.stats.ties}E
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500 text-xs italic">Nenhum registro encontrado.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
