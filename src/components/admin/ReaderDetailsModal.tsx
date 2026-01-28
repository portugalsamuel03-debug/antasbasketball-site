import React from 'react';
import { FeaturedReaderRow } from '../../types';
import { BookOpen, MessageSquare, Heart, X } from 'lucide-react';

interface ReaderDetailsModalProps {
    reader: Partial<FeaturedReaderRow>;
    onClose: () => void;
    isDarkMode: boolean;
    onUpdate?: () => void;
}

export const ReaderDetailsModal: React.FC<ReaderDetailsModalProps> = ({ reader, onClose, isDarkMode }) => {
    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative w-full max-w-sm border rounded-[32px] overflow-hidden shadow-xl p-6 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white'}`}>

                <button onClick={onClose} className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDarkMode ? 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10' : 'bg-black/5 text-gray-500 hover:text-black hover:bg-black/10'}`}>
                    <X size={16} />
                </button>

                {/* Avatar */}
                <div className="relative w-24 h-24 mt-2">
                    <img src={reader.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reader.name}`} alt={reader.name} className="w-full h-full rounded-full object-cover border-2 border-yellow-500/20 shadow-xl" />
                </div>

                {/* Content */}
                <div className="w-full text-center space-y-4">
                    <div>
                        <h2 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                            {reader.name}
                        </h2>
                        <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mt-1">
                            {reader.rank_label}
                        </p>
                    </div>

                    {/* Divider */}
                    <div className={`w-8 h-1 mx-auto rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />

                    <div className="grid grid-cols-3 gap-4 px-2 pt-2">
                        <div className="flex flex-col items-center">
                            <BookOpen size={14} className="text-gray-500 mb-1" />
                            <span className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{reader.posts_read}</span>
                            <span className="text-[8px] font-bold text-gray-500 uppercase">LIDOS</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <MessageSquare size={14} className="text-gray-500 mb-1" />
                            <span className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{reader.comments_made}</span>
                            <span className="text-[8px] font-bold text-gray-500 uppercase">CMS</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <Heart size={14} className="text-gray-500 mb-1" />
                            <span className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{reader.likes_given || 0}</span>
                            <span className="text-[8px] font-bold text-gray-500 uppercase">LIKES</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReaderDetailsModal;
