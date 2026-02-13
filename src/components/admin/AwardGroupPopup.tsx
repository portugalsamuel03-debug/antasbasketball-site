import React from 'react';
import { Award } from '../../types';
import { Trophy, X } from 'lucide-react';

interface AwardGroupPopupProps {
    title: string;
    winnerName: string;
    awards: Award[];
    isDarkMode: boolean;
    onClose: () => void;
}

export const AwardGroupPopup: React.FC<AwardGroupPopupProps> = ({ title, winnerName, awards, isDarkMode, onClose }) => {
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-sm ${isDarkMode ? 'bg-[#121212]' : 'bg-white'} rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]`}>

                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center ring-2 ring-yellow-400/50">
                            <Trophy size={20} className="text-yellow-400" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mb-0.5">
                                {awards.length}x Conquistas
                            </div>
                            <h2 className={`text-xl font-black uppercase leading-none ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                {title}
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'}`}>
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {awards.map((award, idx) => (
                        <div key={award.id} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                            {/* If there's a description (e.g. "Outubro"), show it primarily */}
                            {award.description ? (
                                <div className="text-sm font-bold uppercase">{award.description}</div>
                            ) : (
                                <div className="text-sm font-bold uppercase">Conquista #{idx + 1}</div>
                            )}

                            {/* Show Manager (if joined) */}
                            {award.manager && (
                                <div className="text-xs text-yellow-500 mt-1 flex items-center gap-2 font-bold uppercase">
                                    <img src={award.manager.image_url} className="w-5 h-5 rounded-full object-cover" />
                                    {award.manager.name}
                                </div>
                            )}

                            {/* Show Team context if it's different from the winner/title (unlikely if valid) */}
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-6 border-t border-dashed border-gray-500/20">
                    <div className={`text-center font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                        {winnerName}
                    </div>
                    {awards[0]?.team && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                            {awards[0].team.logo_url && <img src={awards[0].team.logo_url} className="w-6 h-6 object-contain" />}
                            <span className="text-xs font-bold text-gray-500">{awards[0].team.name}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
