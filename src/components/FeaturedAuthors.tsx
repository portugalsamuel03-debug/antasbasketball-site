
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

// Edit Form Modal
const EditAuthorModal: React.FC<{
  author: Partial<AuthorRow>,
  onClose: () => void,
  onSave: (data: Partial<AuthorRow>) => void,
  isDarkMode: boolean
}> = ({ author, onClose, onSave, isDarkMode }) => {
  const [formData, setFormData] = useState(author);

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className={`relative w-full max-w-sm border rounded-[32px] overflow-hidden shadow-xl p-6 space-y-4 ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white'}`}>
        <h3 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-black'}`}>
          {author.id ? 'Editar Autor' : 'Novo Autor'}
        </h3>

        <input
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
          placeholder="Nome"
          value={formData.name || ''}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
          placeholder="Slug (opcional)"
          value={formData.slug || ''}
          onChange={e => setFormData({ ...formData, slug: e.target.value })}
        />
        <input
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
          placeholder="Avatar URL"
          value={formData.avatar_url || ''}
          onChange={e => setFormData({ ...formData, avatar_url: e.target.value })}
        />
        <input
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
          placeholder="Role Label (ex: EDITORES)"
          value={formData.role_label || ''}
          onChange={e => setFormData({ ...formData, role_label: e.target.value })}
        />

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-3 bg-white/5 rounded-xl text-xs font-black uppercase">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-3 bg-yellow-400 text-black rounded-xl text-xs font-black uppercase">Salvar</button>
        </div>
      </div>
    </div>
  );
};

const FeaturedAuthors: React.FC<FeaturedAuthorsProps> = ({ isDarkMode, onAuthorClick, selectedAuthorId }) => {
  const [authors, setAuthors] = useState<AuthorRow[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isEditing } = useAdmin();
  const [editingAuthor, setEditingAuthor] = useState<Partial<AuthorRow> | null>(null);

  const fetchData = async () => {
    const { data } = await listAuthors();
    if (data) setAuthors(data as AuthorRow[]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (data: Partial<AuthorRow>) => {
    if (!data.name) return;
    const payload = {
      ...data,
      slug: data.slug || data.name.toLowerCase().replace(/ /g, '-')
    };
    await upsertAuthor(payload);
    setEditingAuthor(null);
    fetchData();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Apagar autor?')) {
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
          <EditTrigger type="add" onClick={() => setEditingAuthor({})} />
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
                  <div className="absolute -top-2 -right-2 z-10 flex gap-1">
                    <EditTrigger type="edit" size={14} onClick={(e) => {
                      e.stopPropagation();
                      setEditingAuthor(author);
                    }} />
                    <EditTrigger type="delete" size={14} onClick={(e) => handleDelete(author.id, e)} />
                  </div>
                )}

                <button onClick={() => onAuthorClick?.(author.id)} className="flex flex-col items-center gap-2 outline-none">
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

      {editingAuthor && (
        <EditAuthorModal
          author={editingAuthor}
          isDarkMode={isDarkMode}
          onClose={() => setEditingAuthor(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default FeaturedAuthors;
