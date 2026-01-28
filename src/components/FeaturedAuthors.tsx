
import React, { useRef, useState, useEffect } from 'react';
import { BadgeCheck, ChevronRight, ChevronLeft } from 'lucide-react';
import { listAuthors, upsertAuthor, deleteAuthor } from '../cms';
import { AuthorRow } from '../cms';
import { useAdmin } from '../context/AdminContext';
import { EditTrigger } from './admin/EditTrigger';

interface FeaturedAuthorsProps {
  isDarkMode: boolean;
  onAuthorClick?: (authorId: string) => void;
  selectedAuthorId?: string | null;
}

import { AuthorDetailsModal } from './admin/AuthorDetailsModal';

const FeaturedAuthors: React.FC<FeaturedAuthorsProps> = ({ isDarkMode, onAuthorClick, selectedAuthorId }) => {
  const [authors, setAuthors] = useState<AuthorRow[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isEditing } = useAdmin();

  // "View/Edit" modal state
  const [viewingAuthor, setViewingAuthor] = useState<AuthorRow | null>(null);

  const fetchData = async () => {
    const { data } = await listAuthors();
    if (data) setAuthors(data as AuthorRow[]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    // Create a dummy author to edit
    // For now, let's just create a blank one locally or upsert a new one immediately?
    // Better to have a separate "Add Author" flow or just open Modal with empty data if supported.
    // AuthorDetailsModal expects AuthorRow. Let's make a partial dummy.
    const newAuthor: AuthorRow = { id: '', name: 'Novo Membro', slug: '', role_label: 'NOVO', avatar_url: '' };
    setViewingAuthor(newAuthor);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Apagar autor da equipe?')) {
      await deleteAuthor(id);
      fetchData();
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="py-2 relative group/authors">
      <div className="px-6 flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Equipe Antas</h3>
          {isEditing && <EditTrigger type="add" onClick={handleCreate} />}
        </div>
        <button className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'}`}>Ver todos</button>
      </div>

      <div className="relative px-6">
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth mask-horizontal pb-4">
          {authors.map((author) => {
            const isSelected = selectedAuthorId === author.id;
            return (
              <div key={author.id} className="relative group/item flex flex-col items-center gap-2 flex-shrink-0">
                {isEditing && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <EditTrigger type="delete" size={14} onClick={(e) => handleDelete(author.id, e)} />
                  </div>
                )}

                <button
                  onClick={() => setViewingAuthor(author)}
                  className="flex flex-col items-center gap-2 outline-none"
                >
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-full p-0.5 transition-all shadow-lg ${isSelected ? (isDarkMode ? 'bg-yellow-400 scale-110' : 'bg-[#0B1D33] scale-110') : (isDarkMode ? 'bg-white/10 group-hover/item:bg-yellow-400/50' : 'bg-[#0B1D33]/10 group-hover/item:bg-[#0B1D33]/50')}`}>
                      <div className={`w-full h-full rounded-full p-0.5 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                        <img src={author.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + author.name} alt={author.name} className={`w-full h-full rounded-full object-cover transition-all ${isDarkMode && !isSelected ? 'grayscale group-hover/item:grayscale-0' : 'grayscale-0'}`} />
                      </div>
                    </div>
                    {/* Badge check could be logic, assuming verified if role exists for now or add field */}
                  </div>
                  <div className="text-center">
                    <p className={`text-[11px] font-black uppercase tracking-wider ${isSelected ? (isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]') : (isDarkMode ? 'text-white' : 'text-[#0B1D33]')}`}>{author.name.split(' ')[0]}</p>
                    <p className="text-[8px] font-bold text-gray-500 uppercase">{author.role_label}</p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        <button onClick={() => scroll('left')} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-yellow-400 text-black shadow-lg flex items-center justify-center opacity-0 group-hover/authors:opacity-100 transition-opacity z-10"><ChevronLeft size={16} strokeWidth={3} /></button>
        <button onClick={() => scroll('right')} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-yellow-400 text-black shadow-lg flex items-center justify-center opacity-0 group-hover/authors:opacity-100 transition-opacity z-10"><ChevronRight size={16} strokeWidth={3} /></button>
      </div>

      {viewingAuthor && (
        <AuthorDetailsModal
          author={viewingAuthor}
          isDarkMode={isDarkMode}
          onClose={() => setViewingAuthor(null)}
          onUpdate={() => {
            setViewingAuthor(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default FeaturedAuthors;
