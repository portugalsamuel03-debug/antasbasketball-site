import React from 'react';
import { Award } from '../../types';
import { Trophy } from 'lucide-react';

interface AwardPopupProps {
    award: Award;
    isDarkMode: boolean;
    onClose: () => void;
}

export const AwardPopup: React.FC<AwardPopupProps> = ({ award, isDarkMode, onClose }) => {
    // Determine colors
    const bgClass = isDarkMode ? 'bg-[#121212]' : 'bg-white';
    const textClass = isDarkMode ? 'text-white' : 'text-[#0B1D33]';
    const subTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className={`relative w-full max-w-sm ${bgClass} rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200`}>
                <div className="w-20 h-20 rounded-full bg-yellow-400/20 flex items-center justify-center mb-6 ring-4 ring-yellow-400/50">
                    <Trophy size={40} className="text-yellow-400" />
                </div>

                <div className={`text-xs font-black uppercase tracking-widest text-yellow-500 mb-2`}>
                    Temporada {award.year}
                </div>

                <h2 className={`text-2xl font-black uppercase leading-none mb-4 ${textClass}`}>
                    {award.category}
                </h2>

                <div className={`h-1 w-12 rounded-full bg-current opacity-10 mb-6 ${textClass}`} />

                <div className="space-y-1 mb-8">
                    <div className={`text-lg font-bold ${textClass}`}>
                        {award.winner_name}
                    </div>
                    {award.team && (
                        <div className={`text-sm ${subTextClass} flex items-center justify-center gap-2`}>
                            {award.team.logo_url && <img src={award.team.logo_url} className="w-4 h-4 object-contain" />}
                            {award.team.name}
                        </div>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-transform active:scale-95 ${isDarkMode ? 'bg-white text-black' : 'bg-[#0B1D33] text-white'}`}
                >
                    Fechar
                </button>
            </div>
        </div>
    );
};
