import React, { useState, useEffect } from 'react';
import { X, Trophy, AlertCircle } from 'lucide-react';
import { listChampions } from '../../cms';
import { Champion } from '../../types';

interface ManagerTitlesModalProps {
    managerId: string;
    managerName: string;
    isDarkMode: boolean;
    onClose: () => void;
}

export const ManagerTitlesModal: React.FC<ManagerTitlesModalProps> = ({ managerId, managerName, isDarkMode, onClose }) => {
    const [titles, setTitles] = useState<Champion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [managerId]);

    const fetchData = async () => {
        setLoading(true);
        const { data } = await listChampions();
        if (data) {
            const wins = (data as Champion[]).filter(c => c.manager_id === managerId);
            setTitles(wins);
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
                        <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 flex items-center gap-2">
                            <Trophy size={12} className="text-yellow-500" /> Títulos Conquistados
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
                    ) : titles.length > 0 ? (
                        titles.map(t => (
                            <div key={t.id} className={`p-4 rounded-2xl flex items-center justify-between border ${isDarkMode ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-100'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-yellow-400 text-black flex items-center justify-center shadow-lg shadow-yellow-400/20">
                                        <Trophy size={20} />
                                    </div>
                                    <div>
                                        <div className="font-black text-yellow-600 text-xs uppercase tracking-widest mb-0.5">{t.year}</div>
                                        <div className={`text-lg font-black uppercase leading-none ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                            {t.team}
                                        </div>
                                    </div>
                                </div>
                                {t.logo_url && (
                                    <img src={t.logo_url} className="w-10 h-10 object-contain drop-shadow-md" />
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center opacity-50">
                            <Trophy size={48} className="text-gray-300 mb-4" />
                            <p className="text-xs font-bold text-gray-400 uppercase">Ainda sem títulos registrados.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
