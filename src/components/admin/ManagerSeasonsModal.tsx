import React, { useState, useEffect } from 'react';
import { X, Calendar, User } from 'lucide-react';
import { listManagerHistory } from '../../cms';
import { ManagerHistory } from '../../types';

interface ManagerSeasonsModalProps {
    managerId: string;
    managerName: string;
    isDarkMode: boolean;
    onClose: () => void;
}

export const ManagerSeasonsModal: React.FC<ManagerSeasonsModalProps> = ({ managerId, managerName, isDarkMode, onClose }) => {
    const [history, setHistory] = useState<ManagerHistory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [managerId]);

    const fetchData = async () => {
        setLoading(true);
        const { data } = await listManagerHistory(managerId);
        if (data) setHistory(data);
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

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500 text-xs">Carregando...</div>
                    ) : history.length > 0 ? (
                        history.map(h => (
                            <div key={h.id} className={`p-4 rounded-2xl flex items-center justify-between border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${isDarkMode ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm'}`}>
                                        {h.year.split('/')[0].slice(2)}/{h.year.split('/')[1].slice(2)}
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Equipe</div>
                                        <div className={`text-sm font-bold uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                            {h.team?.name || 'Sem Time'}
                                        </div>
                                    </div>
                                </div>
                                {h.team?.logo_url && (
                                    <img src={h.team.logo_url} className="w-8 h-8 object-contain opacity-80" />
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
