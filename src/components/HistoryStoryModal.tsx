import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface HistoryStoryModalProps {
    onClose: () => void;
    isDarkMode: boolean;
}

export const HistoryStoryModal: React.FC<HistoryStoryModalProps> = ({ onClose, isDarkMode }) => {
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`relative w-full max-w-2xl max-h-[80vh] overflow-y-auto border rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white border-[#0B1D33]/10'}`}>

                {/* Header Image/Banner */}
                <div className="relative h-48 bg-gradient-to-r from-yellow-500 to-yellow-300 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/basketball.png')]"></div>
                    <BookOpen size={64} className="text-black/20" />
                    <h2 className="relative z-10 text-4xl font-black italic uppercase tracking-tighter text-black transform -rotate-2">
                        Nossa História
                    </h2>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full text-black transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    <div className="flex items-start gap-4">
                        <span className="text-6xl font-black text-yellow-500 opacity-50">“</span>
                        <p className={`text-lg font-medium leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            O <span className="font-bold text-yellow-500">Antas Basketball</span> nasceu de uma paixão compartilhada pelo esporte e pela amizade.
                            O que começou como simples encontros em quadras de rua evoluiu para uma liga organizada, movida pela competitividade saudável e pelo amor ao jogo.
                        </p>
                    </div>

                    <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                        <h3 className={`text-sm font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                            Nossos Pilares
                        </h3>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Competitividade com Respeito</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Inclusão e Comunidade</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Evolução Constante</span>
                            </li>
                        </ul>
                    </div>

                    <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Hoje, somos mais do que um grupo de jogadores; somos uma família que celebra cada cesta, cada vitória e, acima de tudo, a união que o basquete nos proporciona.
                    </p>
                </div>

                <div className={`p-4 border-t flex justify-center ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        Since 2017 • Antas Basketball
                    </p>
                </div>

            </div>
        </div>
    );
};
