import React, { useState, useRef, useEffect } from 'react';
import { Heart, Share2, MessageCircle, Plus, ArrowRight, Bookmark, BookmarkCheck, Info, BadgeCheck, Settings } from 'lucide-react';
import { Article, Reaction } from '../types';
import { TAG_INFO, AUTHORS } from '../constants';

interface ArticleCardProps {
  article: Article;
  onClick: () => void;
  onTagClick?: (tag: string) => void;
  onShare?: (article: Article) => void;
  isDarkMode: boolean;

  // ✅ Admin inline edit
  isAdmin?: boolean;
  onEdit?: (articleId: string) => void;
}

const TagTooltip: React.FC<{ tag: string, isDarkMode: boolean }> = ({ tag, isDarkMode }) => {
  const description = TAG_INFO[tag];
  
  return (
    <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[200px] px-3 py-2 rounded-2xl border text-[11px] leading-tight animate-in fade-in zoom-in-95 duration-200 pointer-events-none ${
      isDarkMode ? 'bg-[#1a1a1a]/95 border-white/10' : 'bg-white/95 border-[#0B1D33]/10 shadow-[0_10px_30px_rgba(0,0,0,0.1)]'
    }`}>
      <div className="flex flex-col gap-1">
        <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'}`}>
          {tag}
        </span>
        <p className={`text-[11px] leading-tight font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {description}
        </p>
      </div>
    </div>
  );
};

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick, onTagClick, onShare, isDarkMode, isAdmin, onEdit }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [reaction, setReaction] = useState<Reaction>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const [showAuthorTooltip, setShowAuthorTooltip] = useState(false);
  const authorTooltipTimeout = useRef<NodeJS.Timeout>();
  const reactionsRef = useRef<HTMLDivElement>(null);

  const author = AUTHORS.find(a => a.id === article.authorId);

  const handleReaction = (newReaction: Reaction) => {
    setReaction(prev => prev === newReaction ? null : newReaction);
    setShowReactions(false);
  };

  const getReactionEmoji = (reaction: Reaction) => {
    switch (reaction) {
      case 'LOVE': return '❤️';
      case 'FIRE': return '🔥';
      case 'LAUGH': return '😂';
      case 'WOW': return '😮';
      case 'SAD': return '😢';
      default: return null;
    }
  };

  const handleAuthorHover = () => {
    if (authorTooltipTimeout.current) clearTimeout(authorTooltipTimeout.current);
    setShowAuthorTooltip(true);
  };

  const handleAuthorLeave = () => {
    authorTooltipTimeout.current = setTimeout(() => setShowAuthorTooltip(false), 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reactionsRef.current && !reactionsRef.current.contains(event.target as Node)) {
        setShowReactions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="px-6 mb-8 group cursor-pointer" onClick={onClick}>
      <div className={`relative rounded-3xl p-5 border transition-all active:scale-[0.98] shadow-xl ${
        isDarkMode 
          ? 'bg-[#121212] border-white/5 hover:border-white/10' 
          : 'bg-white border-[#0B1D33]/5 hover:border-[#0B1D33]/10 shadow-[0_10px_40px_rgba(0,0,0,0.03)]'
      }`}>
        {/* ✅ Engrenagem (só admin) */}
        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(article.id);
            }}
            className={`absolute top-4 right-4 p-2 rounded-full border transition-colors ${
              isDarkMode
                ? "bg-white/5 border-white/10 text-gray-300 hover:text-yellow-400 hover:border-yellow-400/30"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:text-[#0B1D33]"
            }`}
            title="Editar artigo"
            aria-label="Editar artigo"
          >
            <Settings size={16} />
          </button>
        )}

        <div className="flex gap-4">
          <div className="flex-1">
            <span className={`text-xs font-black tracking-widest uppercase block mb-2 ${
              isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'
            }`}>
              {article.category}
            </span>
            <h3 className={`text-lg font-bold leading-snug mb-3 transition-colors ${
              isDarkMode ? 'group-hover:text-yellow-400' : 'text-[#0B1D33]'
            }`}>
              {article.title}
            </h3>
            
            <div className="flex flex-wrap gap-1.5 mb-3">
              {article.tags.map(tag => (
                <div key={tag} className="relative">
                  <button 
                    onMouseEnter={() => setHoveredTag(tag)}
                    onMouseLeave={() => setHoveredTag(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTagClick?.(tag);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${
                      isDarkMode 
                        ? 'bg-white/5 text-gray-400 hover:bg-yellow-400 hover:text-black' 
                        : 'bg-[#0B1D33]/5 text-[#0B1D33]/60 hover:bg-[#0B1D33] hover:text-white'
                    }`}
                  >
                    <Info size={10} />
                    {tag}
                  </button>
                  {hoveredTag === tag && <TagTooltip tag={tag} isDarkMode={isDarkMode} />}
                </div>
              ))}
            </div>

            <p className={`text-sm leading-relaxed mb-4 font-medium ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {article.description}
            </p>

            {/* Autor */}
            <div className="relative">
              <div 
                className="flex items-center gap-3"
                onMouseEnter={handleAuthorHover}
                onMouseLeave={handleAuthorLeave}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ${
                  isDarkMode ? 'bg-white/5 text-yellow-400' : 'bg-[#0B1D33]/5 text-[#0B1D33]'
                }`}>
                  {author?.avatarInitial || article.author?.charAt(0) || 'A'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black ${
                      isDarkMode ? 'text-white' : 'text-[#0B1D33]'
                    }`}>
                      {author?.name || article.author}
                    </span>
                    {author?.verified && (
                      <BadgeCheck size={14} className={isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'} />
                    )}
                  </div>
                  <div className={`text-[10px] font-bold ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    {article.date} • {article.readingMinutes} min
                  </div>
                </div>
                <ArrowRight size={18} className={`transition-transform group-hover:translate-x-1 ${
                  isDarkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
              </div>

              {showAuthorTooltip && author && (
                <div className={`absolute bottom-full mb-3 left-0 p-4 rounded-3xl border shadow-2xl animate-in fade-in zoom-in-95 duration-200 w-[280px] ${
                  isDarkMode ? 'bg-[#1a1a1a]/95 border-white/10' : 'bg-white/95 border-[#0B1D33]/10 shadow-[0_20px_60px_rgba(0,0,0,0.15)]'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black ${
                      isDarkMode ? 'bg-white/5 text-yellow-400' : 'bg-[#0B1D33]/5 text-[#0B1D33]'
                    }`}>
                      {author.avatarInitial}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-black ${
                          isDarkMode ? 'text-white' : 'text-[#0B1D33]'
                        }`}>
                          {author.name}
                        </span>
                        {author.verified && (
                          <BadgeCheck size={16} className={isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'} />
                        )}
                      </div>
                      <div className={`text-[11px] font-bold mb-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {author.role}
                      </div>
                      <p className={`text-[11px] leading-relaxed font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {author.bio}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
              <div className="flex items-center gap-4">
                <div className="relative" ref={reactionsRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReactions(!showReactions);
                    }}
                    className={`flex items-center gap-2 text-xs font-black transition-colors ${
                      isDarkMode ? 'text-gray-400 hover:text-yellow-400' : 'text-gray-500 hover:text-[#0B1D33]'
                    }`}
                  >
                    {reaction ? (
                      <span className="text-sm">{getReactionEmoji(reaction)}</span>
                    ) : (
                      <Heart size={16} />
                    )}
                    <span>{article.likes + (reaction ? 1 : 0)}</span>
                  </button>

                  {showReactions && (
                    <div className={`absolute bottom-full mb-2 left-0 flex gap-1 p-2 rounded-2xl border shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${
                      isDarkMode ? 'bg-[#1a1a1a]/95 border-white/10' : 'bg-white/95 border-[#0B1D33]/10 shadow-[0_10px_30px_rgba(0,0,0,0.15)]'
                    }`}>
                      {[
                        { type: 'LOVE' as Reaction, emoji: '❤️' },
                        { type: 'FIRE' as Reaction, emoji: '🔥' },
                        { type: 'LAUGH' as Reaction, emoji: '😂' },
                        { type: 'WOW' as Reaction, emoji: '😮' },
                        { type: 'SAD' as Reaction, emoji: '😢' }
                      ].map(({ type, emoji }) => (
                        <button
                          key={type}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReaction(type);
                          }}
                          className={`p-2 rounded-xl transition-all hover:scale-110 ${
                            reaction === type 
                              ? 'bg-yellow-400/20' 
                              : isDarkMode 
                                ? 'hover:bg-white/5' 
                                : 'hover:bg-[#0B1D33]/5'
                          }`}
                        >
                          <span className="text-lg">{emoji}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => e.stopPropagation()}
                  className={`flex items-center gap-2 text-xs font-black transition-colors ${
                    isDarkMode ? 'text-gray-400 hover:text-yellow-400' : 'text-gray-500 hover:text-[#0B1D33]'
                  }`}
                >
                  <MessageCircle size={16} />
                  <span>{article.commentsCount}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBookmarked(!isBookmarked);
                  }}
                  className={`p-2 rounded-xl transition-all ${
                    isDarkMode 
                      ? 'hover:bg-white/5 text-gray-400 hover:text-yellow-400' 
                      : 'hover:bg-[#0B1D33]/5 text-gray-500 hover:text-[#0B1D33]'
                  }`}
                >
                  {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare?.(article);
                  }}
                  className={`p-2 rounded-xl transition-all ${
                    isDarkMode 
                      ? 'hover:bg-white/5 text-gray-400 hover:text-yellow-400' 
                      : 'hover:bg-[#0B1D33]/5 text-gray-500 hover:text-[#0B1D33]'
                  }`}
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>

          </div>

          {/* Thumb */}
          {article.imageUrl && (
            <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
