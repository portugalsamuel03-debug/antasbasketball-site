import React, { useState, useEffect } from 'react';
import { X, Award as AwardIcon } from 'lucide-react';
import { listAwards } from '../../cms';
import { Award } from '../../types';

interface ManagerAwardsModalProps {
    managerId: string;
    managerName: string;
    isDarkMode: boolean;
    onClose: () => void;
}

export const ManagerAwardsModal: React.FC<ManagerAwardsModalProps> = ({ managerId, managerName, isDarkMode, onClose }) => {
    const [groupedAwards, setGroupedAwards] = useState<{ category: string, years: string[], count: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchData();
    }, [managerId]);

    const fetchData = async () => {
        setLoading(true);
        const { data } = await listAwards();
        if (data) {
            const myAwards = (data as Award[]).filter(a => a.manager_id === managerId);
            setTotal(myAwards.length);

            // Grouping logic
            const groups: Record<string, string[]> = {};
            myAwards.forEach(a => {
                if (!groups[a.category]) groups[a.category] = [];
                groups[a.category].push(a.year);
            });

            const processed = Object.entries(groups).map(([category, years]) => ({
                category,
                years: years.sort().reverse(),
                count: years.length
            })).sort((a, b) => b.count - a.count);

            setGroupedAwards(processed);
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
                        <div className="text-[10px] font-black uppercase text-yellow-500 tracking-widest mb-1 flex items-center gap-2">
                            <AwardIcon size={12} /> Prêmios Individuais
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
                    ) : groupedAwards.length > 0 ? (
                        <>
                            <div className="flex items-center justify-center p-4 mb-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                <div className="text-center">
                                    <div className="text-3xl font-black text-yellow-500">{total}</div>
                                    <div className="text-[9px] font-bold uppercase text-yellow-600 tracking-widest">Total de Prêmios</div>
                                </div>
                            </div>

                            {groupedAwards.map((g, i) => (
                                <div key={i} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={`text-sm font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                            {g.count > 1 ? `${g.count}x ` : ''}{g.category}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {g.years.map(y => (
                                            <span key={y} className={`text-[10px] font-bold px-2 py-1 rounded-md ${isDarkMode ? 'bg-black/30 text-gray-400' : 'bg-white text-gray-500 border border-gray-200'}`}>
                                                {y}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center opacity-50">
                            <AwardIcon size={48} className="text-gray-300 mb-4" />
                            <p className="text-xs font-bold text-gray-400 uppercase">Nenhum prêmio registrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
