
import React from 'react';
import { X, Star, Award, History, TrendingUp } from 'lucide-react';
import { HallOfFame } from '../types';

interface HallOfFameDetailPopupProps {
  member: HallOfFame | null;
  onClose: () => void;
  isDarkMode: boolean;
}

const HallOfFameDetailPopup: React.FC<HallOfFameDetailPopupProps> = ({ member, onClose, isDarkMode }) => {
  if (!member) return null;

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

        <div className="relative h-48 overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-opacity-100 ${isDarkMode ? 'to-[#121212]' : 'to-white'}`}></div>
          <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover scale-150 grayscale-0" />
          <div className="absolute inset-0 flex items-center justify-center pt-10">
             <div className={`w-28 h-28 rounded-[35px] border-4 p-1 shadow-2xl ${isDarkMode ? 'border-yellow-400 bg-black' : 'border-[#0B1D33] bg-white'}`}>
                <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover rounded-[28px]" />
             </div>
          </div>
        </div>

        <div className="p-8 pt-6 text-center">
          <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 block ${isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'}`}>
            {member.year}
          </span>
          <h2 className={`text-2xl font-black uppercase tracking-tighter mb-1 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
            {member.name}
          </h2>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-8">{member.role}</p>

          <div className="space-y-4 text-left">
            <div className={`p-5 rounded-3xl border flex gap-4 items-start ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-[#F0F2F5] border-[#0B1D33]/5'}`}>
              <Award className="text-yellow-500 shrink-0" size={20} />
              <div>
                <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>Conquista Principal</h4>
                <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{member.achievement}</p>
              </div>
            </div>

            <div className={`p-5 rounded-3xl border flex gap-4 items-start ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-[#F0F2F5] border-[#0B1D33]/5'}`}>
              <TrendingUp className="text-blue-500 shrink-0" size={20} />
              <div>
                <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>Impacto no Jogo</h4>
                <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Fundamental para a cultura do Antas Basketball, inspirando as gerações que vieram depois com ética de trabalho impecável.
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className={`w-full mt-8 py-4 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${
              isDarkMode ? 'bg-yellow-400 text-black shadow-yellow-400/20' : 'bg-[#0B1D33] text-white shadow-[#0B1D33]/20'
            }`}
          >
            HONRAR LENDA
          </button>
        </div>
      </div>
    </div>
  );
};

export default HallOfFameDetailPopup;
