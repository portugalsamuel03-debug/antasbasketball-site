
import React, { useState, useRef, useEffect } from 'react';
import { BadgeCheck, X, Trophy, MessageSquare, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import { listRankedReaders } from '../cms';
import { FeaturedReaderRow } from '../types';
import { useAdmin } from '../context/AdminContext';

const StatsModal: React.FC<{ readers: FeaturedReaderRow[], onClose: () => void, isDarkMode: boolean }> = ({ readers, onClose, isDarkMode }) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className={`relative w-full max-w-sm border rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white border-[#0B1D33]/10'}`}>
        <div className={`p-8 border-b flex justify-between items-center ${isDarkMode ? 'border-white/5' : 'border-[#0B1D33]/5'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#0B1D33] text-white'}`}><Trophy size={20} strokeWidth={3} /></div>
            <h3 className="text-sm font-black uppercase tracking-widest">Top Leitores</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
          {readers.sort((a, b) => b.posts_read - a.posts_read).map((reader, idx) => (
            <div key={reader.id} className={`rounded-3xl p-5 border flex items-center gap-4 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-[#F0F2F5]/50 border-[#0B1D33]/5'}`}>
              <div className="relative">
                <img src={reader.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + reader.name} alt={reader.name} className="w-14 h-14 rounded-full border-2 border-yellow-400/20" />
                <div className={`absolute -top-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${isDarkMode ? 'bg-yellow-400 text-black border-black' : 'bg-[#0B1D33] text-white border-white'}`}>#{idx + 1}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-black uppercase">{reader.name}</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-black bg-yellow-400/10 text-yellow-400">{reader.rank_label}</span>
                </div>
                <div className="flex gap-4 text-gray-500">
                  <div className="flex items-center gap-1"><BookOpen size={10} /> <span className="text-[10px] font-bold">{reader.posts_read}</span></div>
                  <div className="flex items-center gap-1"><MessageSquare size={10} /> <span className="text-[10px] font-bold">{reader.comments_made}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// FeaturedReaders component follows...

import { ReaderDetailsModal } from './admin/ReaderDetailsModal';

const FeaturedReaders: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const [readers, setReaders] = useState<FeaturedReaderRow[]>([]);
  const [showStats, setShowStats] = useState(false);

  const [selectedReader, setSelectedReader] = useState<Partial<FeaturedReaderRow> | null>(null);

  const { isEditing } = useAdmin();
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    const { data } = await listRankedReaders();
    if (data) setReaders(data as FeaturedReaderRow[]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };


  return (
    <div className="py-2 relative group/featured">
      <div className="px-6 flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Ranking de Leitores</h3>
        </div>
        <button onClick={() => setShowStats(true)} className={`text-[10px] font-black uppercase tracking-widest hover:underline ${isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'}`}>Ver estatísticas</button>
      </div>

      <div className="relative px-6">
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth mask-horizontal pb-4">
          {readers.length === 0 ? (
            <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest py-4">Sem dados de atividade ainda.</div>
          ) : readers.map((reader) => (
            <div
              key={reader.id}
              onClick={() => setSelectedReader(reader)}
              className="flex flex-col items-center gap-2 flex-shrink-0 group relative cursor-pointer"
            >
              <div className="relative">
                <div className={`w-16 h-16 rounded-full p-0.5 group-hover:scale-110 transition-transform shadow-lg ${isDarkMode ? 'bg-gradient-to-tr from-yellow-400 to-yellow-600' : 'bg-gradient-to-tr from-[#0B1D33] to-[#1e3a5f]'}`}>
                  <div className={`w-full h-full rounded-full p-0.5 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                    <img src={reader.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + reader.name} alt={reader.name} className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  </div>
                </div>
                {reader.is_verified && <BadgeCheck size={16} className={`absolute -bottom-1 -right-1 ${isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'}`} />}
              </div>
              <div className="text-center">
                <p className={`text-[11px] font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{reader.name}</p>
                <p className="text-[8px] font-bold text-gray-500 uppercase">{reader.rank_label}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => scroll('left')} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-yellow-400 text-black shadow-lg flex items-center justify-center opacity-0 group-hover/featured:opacity-100 transition-opacity z-10"><ChevronLeft size={16} strokeWidth={3} /></button>
        <button onClick={() => scroll('right')} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-yellow-400 text-black shadow-lg flex items-center justify-center opacity-0 group-hover/featured:opacity-100 transition-opacity z-10"><ChevronRight size={16} strokeWidth={3} /></button>
      </div>

      {showStats && <StatsModal readers={readers} isDarkMode={isDarkMode} onClose={() => setShowStats(false)} />}

      {selectedReader && (
        <ReaderDetailsModal
          reader={selectedReader}
          isDarkMode={isDarkMode}
          onClose={() => setSelectedReader(null)}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
};


export default FeaturedReaders;
