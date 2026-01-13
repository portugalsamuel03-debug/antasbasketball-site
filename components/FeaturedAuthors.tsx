
import React, { useRef } from 'react';
import { AUTHORS } from '../constants';
import { BadgeCheck, ChevronRight, ChevronLeft } from 'lucide-react';

interface FeaturedAuthorsProps {
  isDarkMode: boolean;
  onAuthorClick?: (authorId: string) => void;
  selectedAuthorId?: string | null;
}

const FeaturedAuthors: React.FC<FeaturedAuthorsProps> = ({ isDarkMode, onAuthorClick, selectedAuthorId }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="py-2 relative group/authors">
      <div className="px-6 flex justify-between items-center mb-4">
        <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Equipe Antas</h3>
        <button className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'}`}>Ver todos</button>
      </div>
      
      <div className="relative px-6">
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth mask-horizontal pb-4">
          {AUTHORS.map((author) => {
            const isSelected = selectedAuthorId === author.id;
            return (
              <button key={author.id} onClick={() => onAuthorClick?.(author.id)} className="flex flex-col items-center gap-2 flex-shrink-0 group outline-none">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full p-0.5 transition-all shadow-lg ${isSelected ? (isDarkMode ? 'bg-yellow-400 scale-110' : 'bg-[#0B1D33] scale-110') : (isDarkMode ? 'bg-white/10 group-hover:bg-yellow-400/50' : 'bg-[#0B1D33]/10 group-hover:bg-[#0B1D33]/50')}`}>
                    <div className={`w-full h-full rounded-full p-0.5 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                      <img src={author.avatar} alt={author.name} className={`w-full h-full rounded-full object-cover transition-all ${isDarkMode && !isSelected ? 'grayscale group-hover:grayscale-0' : 'grayscale-0'}`} />
                    </div>
                  </div>
                  {author.isVerified && <BadgeCheck size={16} className={`absolute -bottom-1 -right-1 ${isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'}`} />}
                </div>
                <div className="text-center">
                  <p className={`text-[11px] font-black uppercase tracking-wider ${isSelected ? (isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]') : (isDarkMode ? 'text-white' : 'text-[#0B1D33]')}`}>{author.name.split(' ')[0]}</p>
                  <p className="text-[8px] font-bold text-gray-500 uppercase">{author.role}</p>
                </div>
              </button>
            );
          })}
        </div>
        
        <button onClick={() => scroll('left')} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-yellow-400 text-black shadow-lg flex items-center justify-center opacity-0 group-hover/authors:opacity-100 transition-opacity z-10"><ChevronLeft size={16} strokeWidth={3} /></button>
        <button onClick={() => scroll('right')} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-yellow-400 text-black shadow-lg flex items-center justify-center opacity-0 group-hover/authors:opacity-100 transition-opacity z-10"><ChevronRight size={16} strokeWidth={3} /></button>
      </div>
    </div>
  );
};

export default FeaturedAuthors;
