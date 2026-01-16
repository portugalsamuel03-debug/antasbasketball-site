
import React, { useState } from 'react';
import { X, Settings, CheckCircle, BellRing, History, Radio, TrendingUp, Newspaper, Trophy, MessageSquare, Trash2 } from 'lucide-react';
import { Category } from '../types';

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ isOpen, onClose, isDarkMode }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [activeCategories, setActiveCategories] = useState<Category[]>([
    Category.HISTORIA, Category.NOTICIAS, Category.PODCAST, Category.STATUS
  ]);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'HISTÓRIA', desc: 'O legado de 2017: Onde tudo começou acaba de ser publicado.', time: '2m atrás', read: false, type: 'history' },
    { id: 2, title: 'PODCAST', desc: 'Episódio #42: O impacto das novas regras está no ar!', time: '1h atrás', read: false, type: 'podcast' },
    { id: 3, title: 'SISTEMA', desc: 'Você subiu para o rank ALL-STAR! Parabéns.', time: '5h atrás', read: true, type: 'rank' },
  ]);

  if (!isOpen) return null;

  const toggleCategory = (cat: Category) => {
    setActiveCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'history': return <History size={16} className="text-blue-400" />;
      case 'podcast': return <Radio size={16} className="text-purple-400" />;
      case 'rank': return <Trophy size={16} className="text-yellow-400" />;
      default: return <Newspaper size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-8 sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-sm border rounded-[40px] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 duration-500 ${
        isDarkMode ? 'bg-[#0f0f0f] border-white/10' : 'bg-white border-[#0B1D33]/10'
      }`}>
        <div className={`p-6 border-b flex justify-between items-center ${
          isDarkMode ? 'border-white/5 bg-gray-900/30' : 'border-[#0B1D33]/5 bg-[#F0F2F5]/50'
        }`}>
          <div className="flex flex-col">
            <h3 className={`text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-2 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {showSettings ? 'Configurações' : 'Central de Avisos'}
            </h3>
            <span className={`text-lg font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
              {showSettings ? 'PREFERÊNCIAS' : 'NOTIFICAÇÕES'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!showSettings && notifications.length > 0 && (
              <button 
                onClick={markAllRead}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-[#0B1D33] hover:bg-black/5'}`}
                title="Marcar todas como lidas"
              >
                <CheckCircle size={18} />
              </button>
            )}
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-all ${
                showSettings 
                  ? isDarkMode ? 'bg-yellow-400 text-black rotate-90' : 'bg-[#0B1D33] text-white rotate-90'
                  : isDarkMode ? 'text-gray-400 hover:bg-white/5' : 'text-gray-400 hover:bg-black/5'
              }`}
            >
              <Settings size={18} />
            </button>
            <button onClick={onClose} className={`p-2 rounded-full transition-colors ${
              isDarkMode ? 'text-gray-400 hover:bg-white/5' : 'text-gray-400 hover:bg-black/5'
            }`}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[50vh] overflow-y-auto no-scrollbar">
          {showSettings ? (
            <div className="space-y-3">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">O que você quer acompanhar?</p>
              {[Category.HISTORIA, Category.PODCAST, Category.STATUS, Category.NOTICIAS].map(cat => (
                <button 
                  key={cat} 
                  onClick={() => toggleCategory(cat)}
                  className={`w-full flex items-center justify-between p-4 rounded-[24px] border transition-all ${
                    activeCategories.includes(cat) 
                      ? isDarkMode ? 'bg-yellow-400/5 border-yellow-400/20' : 'bg-[#0B1D33]/5 border-[#0B1D33]/20'
                      : isDarkMode ? 'bg-transparent border-white/5 grayscale' : 'bg-transparent border-gray-100 grayscale'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-black/40' : 'bg-white'}`}>
                      {cat === Category.HISTORIA && <History size={16} className="text-blue-400" />}
                      {cat === Category.PODCAST && <Radio size={16} className="text-purple-400" />}
                      {cat === Category.STATUS && <TrendingUp size={16} className="text-green-400" />}
                      {cat === Category.NOTICIAS && <Newspaper size={16} className="text-yellow-400" />}
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{cat}</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${
                    activeCategories.includes(cat) 
                      ? isDarkMode ? 'bg-yellow-400' : 'bg-[#0B1D33]' 
                      : 'bg-gray-700'
                  }`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${activeCategories.includes(cat) ? 'right-0.5' : 'left-0.5'}`}></div>
                  </div>
                </button>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map(notif => (
                <div key={notif.id} className={`p-5 rounded-[30px] border relative overflow-hidden transition-all group ${
                  notif.read ? 'opacity-50' : 'opacity-100'
                } ${
                  isDarkMode ? 'bg-[#161616] border-white/5' : 'bg-[#F9FAFB] border-[#0B1D33]/5 shadow-sm'
                }`}>
                  {!notif.read && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isDarkMode ? 'bg-yellow-400' : 'bg-[#0B1D33]'}`}></div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(notif.type)}
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notif.title}</span>
                    </div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase">{notif.time}</span>
                  </div>
                  <p className={`text-[13px] leading-relaxed mb-3 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{notif.desc}</p>
                  <div className="flex gap-4">
                    {!notif.read && (
                      <button 
                        onClick={() => setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))}
                        className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-yellow-400 hover:text-white' : 'text-[#0B1D33] hover:text-blue-600'}`}
                      >
                        LIDO
                      </button>
                    )}
                    <button 
                      onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                      className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors"
                    >
                      EXCLUIR
                    </button>
                  </div>
                </div>
              ))}
              <button 
                onClick={clearAll}
                className={`w-full py-4 rounded-[24px] text-[10px] font-black transition-all uppercase tracking-[0.3em] flex items-center justify-center gap-2 border ${
                  isDarkMode ? 'border-white/5 text-gray-500 hover:text-white hover:bg-white/5' : 'border-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <Trash2 size={14} />
                Limpar Tudo
              </button>
            </div>
          ) : (
            <div className="py-12 text-center animate-in zoom-in-95 duration-500">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                <BellRing size={32} className="text-gray-400/50" />
              </div>
              <h4 className={`text-md font-black uppercase tracking-tighter mb-1 ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>Tudo Limpo!</h4>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Nenhuma notificação por enquanto.</p>
            </div>
          )}
        </div>
        
        {!showSettings && notifications.length > 0 && (
          <div className={`p-6 border-t ${isDarkMode ? 'border-white/5 bg-black' : 'border-[#0B1D33]/5 bg-white'}`}>
             <p className="text-[9px] text-center text-gray-500 font-bold uppercase tracking-widest">
               DICA: ATIVE AS NOTIFICAÇÕES EM TEMPO REAL NAS CONFIGURAÇÕES.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPopup;
