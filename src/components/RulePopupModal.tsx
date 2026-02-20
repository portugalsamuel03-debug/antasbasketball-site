import React from 'react';
import { X, Settings } from 'lucide-react';
import { Article } from '../types';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RulePopupModalProps {
    article: Article;
    onClose: () => void;
    isDarkMode: boolean;
    isEditing?: boolean;
    onEdit?: (id: string) => void;
}

export const RulePopupModal: React.FC<RulePopupModalProps> = ({ article, onClose, isDarkMode, isEditing, onEdit }) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#121212] border border-white/10' : 'bg-white border border-gray-200'}`}>

                {/* Header Actions */}
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                    {isEditing && onEdit && (
                        <button onClick={() => onEdit(article.id)} className={`p-2 rounded-full backdrop-blur-md ${isDarkMode ? 'bg-yellow-500/80 text-black hover:bg-yellow-500' : 'bg-yellow-400/80 text-black hover:bg-yellow-400'}`}>
                            <Settings size={20} />
                        </button>
                    )}
                    <button onClick={onClose} className={`p-2 rounded-full backdrop-blur-md ${isDarkMode ? 'bg-black/50 text-white hover:bg-black/70' : 'bg-white/50 text-black hover:bg-white/70'}`}>
                        <X size={20} />
                    </button>
                </div>

                {/* Banner / Image */}
                <div className="w-full h-48 md:h-56 relative shrink-0">
                    {article.imageUrl ? (
                        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <span className="text-yellow-500 font-black text-2xl opacity-50">ANTAS</span>
                        </div>
                    )}
                    <div className={`absolute bottom-0 w-full h-1/2 bg-gradient-to-t ${isDarkMode ? 'from-[#121212] to-transparent' : 'from-white to-transparent'}`}></div>
                </div>

                {/* Content Area */}
                <div className="px-6 pb-8 pt-2 overflow-y-auto custom-scrollbar flex-1">
                    <h2 className={`text-2xl font-black uppercase tracking-tighter mb-4 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                        {article.title}
                    </h2>

                    <div className={`prose prose-sm max-w-none whitespace-pre-wrap ${isDarkMode ? 'prose-invert prose-p:text-gray-300 prose-headings:text-white prose-a:text-yellow-400' : 'prose-p:text-gray-700 prose-headings:text-[#0B1D33] prose-a:text-blue-600'}`}>
                        <Markdown remarkPlugins={[remarkGfm]}>
                            {article.content}
                        </Markdown>
                    </div>
                </div>

            </div>
        </div>
    );
};
