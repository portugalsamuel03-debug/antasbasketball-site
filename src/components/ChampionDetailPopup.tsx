
import React from 'react';
import { X, Trophy, Users, Star, Target } from 'lucide-react';
import { Champion } from '../types';

interface ChampionDetailPopupProps {
  champion: Champion | null;
  onClose: () => void;
  isDarkMode: boolean;
}

const ChampionDetailPopup: React.FC<ChampionDetailPopupProps> = ({ champion, onClose, isDarkMode }) => {
  if (!champion) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-sm border rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ${
        isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white border-[#0B1D33]/10'
      }`}>
        <button onClick={onClose} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-10 ${
          isDarkMode ? 'text-gray-500 hover:text-white bg-white/5' : 'text-gray-400 hover:text-[#0B1D33] bg-[#F0F2F5]'
        }`}>
          <X size={20} />
        </button>

        <div className={`h-32 flex items-center justify-center relative ${isDarkMode ? 'bg-gradient-to-b from-yellow-400/20 to-transparent' : 'bg-gradient-to-b from-[#0B1D33]/10 to-transparent'}`}>
          <Trophy size={64} className={isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'} />
        </div>

        <div className="p-8 pt-0 text-center">
          <span className={`text-3xl font-black italic mb-1 block ${isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'}`}>
            SEASON {champion.year}
          </span>
          <h2 className={`text-2xl font-black uppercase tracking-tight mb-6 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
            {champion.team}
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className={`p-4 rounded-3xl border flex flex-col items-center gap-1 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-[#F0F2F5] border-[#0B1D33]/5'}`}>
              <Star size={16} className="text-yellow-500 mb-1" />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Final MVP</span>
              <span className={`text-[11px] font-bold ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{champion.mvp}</span>
            </div>
            <div className={`p-4 rounded-3xl border flex flex-col items-center gap-1 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-[#F0F2F5] border-[#0B1D33]/5'}`}>
              <Target size={16} className="text-blue-500 mb-1" />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Final Score</span>
              <span className={`text-[11px] font-bold ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{champion.score}</span>
            </div>
          </div>

          <div className={`text-left p-6 rounded-[32px] border ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-[#FDFBF4] border-[#0B1D33]/5'}`}>
            <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 ${isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'}`}>
              <Users size={14} /> Relatório da Temporada
            </h4>
            <p className={`text-xs leading-relaxed italic ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              A conquista de {champion.year} foi marcada por uma resiliência defensiva absurda. Sob o comando de {champion.mvp}, o time superou todas as expectativas no garrafão, garantindo o título em uma final eletrizante que terminou em {champion.score}.
            </p>
          </div>

          <button 
            onClick={onClose}
            className={`w-full mt-8 py-4 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${
              isDarkMode ? 'bg-yellow-400 text-black shadow-yellow-400/20' : 'bg-[#0B1D33] text-white shadow-[#0B1D33]/20'
            }`}
          >
            FECHAR GALERIA
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChampionDetailPopup;
