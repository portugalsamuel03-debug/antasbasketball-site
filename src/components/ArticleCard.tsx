import React, { useState, useRef, useEffect } from "react";
import {
  Heart,
  Share2,
  MessageCircle,
  Plus,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BadgeCheck,
  Settings,
} from "lucide-react";
import { Article, Reaction } from "../types";
import { TAG_INFO, AUTHORS } from "../constants";

interface ArticleCardProps {
  article: Article;
  onClick: () => void;
  onTagClick?: (tag: string) => void;
  onShare?: (article: Article) => void;
  isDarkMode: boolean;

  /** ✅ Admin: mostra engrenagem */
  isAdmin?: boolean;

  /** ✅ Admin: callback para editar */
  onEdit?: (id: string) => void;
}

const TagTooltip: React.FC<{ tag: string; isDarkMode: boolean }> = ({ tag, isDarkMode }) => {
  const description = (TAG_INFO as any)?.[tag];

  return (
    <div
      className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-[60] w-48 p-3 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 pointer-events-none ${
        isDarkMode ? "bg-[#1a1a1a]/95 border-white/10" : "bg-white/95 border-[#0B1D33]/10 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
      }`}
    >
      <div className="flex flex-col gap-1">
        <span
          className={`text-[10px] font-black uppercase tracking-widest ${
            isDarkMode ? "text-yellow-400" : "text-[#0B1D33]"
          }`}
        >
          {tag}
        </span>
        <p className={`text-[11px] leading-tight font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          {description || tag.toUpperCase()}
        </p>
      </div>
      <div
        className={`absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b ${
          isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-[#0B1D33]/10"
        }`}
      />
    </div>
  );
};

const ReactionPicker: React.FC<{ onPick: (emoji: string) => void; onClose: () => void; isDarkMode: boolean }> = ({
  onPick,
  onClose,
  isDarkMode,
}) => {
  const emojis = ["🔥", "🏀", "❤️", "👏", "😂", "😮"];
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className={`absolute bottom-full mb-3 left-0 border rounded-2xl px-3 py-2 flex gap-2.5 shadow-2xl animate-in slide-in-from-bottom-2 duration-200 z-50 backdrop-blur-xl ${
        isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-[#0B1D33]/10"
      }`}
    >
      {emojis.map((e) => (
        <button
          key={e}
          onClick={(ev) => {
            ev.stopPropagation();
            onPick(e);
            onClose();
          }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all hover:scale-110 active:scale-95 ${
            isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-100"
          }`}
        >
          {e}
        </button>
      ))}
    </div>
  );
};

const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onClick,
  onTagClick,
  onShare,
  isDarkMode,
  isAdmin = false,
  onEdit,
}) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likes ?? 0);

  const [isSaved, setIsSaved] = useState(false);

  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const [localReactions, setLocalReactions] = useState<Reaction[]>(article.reactions ?? []);
  const [userReactions, setUserReactions] = useState<string[]>([]);

  const author = (AUTHORS as any)?.find((a: any) => a.id === article.authorId) ?? null;

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(article);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? Math.max(0, c - 1) : c + 1));
  };

  const handleReadLater = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved((v) => !v);
  };

  const toggleReaction = (emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const already = userReactions.includes(emoji);
    setUserReactions((prev) => (already ? prev.filter((x) => x !== emoji) : [...prev, emoji]));

    setLocalReactions((prev) => {
      const idx = prev.findIndex((r) => r.emoji === emoji);
      if (idx === -1) {
        return [...prev, { emoji, count: 1 }];
      }
      const copy = [...prev];
      copy[idx] = { ...copy[idx], count: Math.max(0, copy[idx].count + (already ? -1 : 1)) };
      // remove zero
      return copy.filter((r) => r.count > 0);
    });
  };

  const handleAdminEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(article.id);
      return;
    }
    // fallback: navega para /?admin=1&edit=<id>
    const url = new URL(window.location.href);
    url.searchParams.set("admin", "1");
    url.searchParams.set("edit", article.id);
    window.location.assign(url.toString());
  };

  return (
    <div className="px-6 mb-8 group cursor-pointer" onClick={onClick}>
      <div
        className={`relative rounded-3xl p-5 border transition-all active:scale-[0.98] shadow-xl ${
          isDarkMode ? "bg-[#121212] border-white/5 hover:border-white/10" : "bg-white border-[#0B1D33]/5 hover:border-[#0B1D33]/10 shadow-[0_10px_40px_rgba(0,0,0,0.03)]"
        }`}
      >
        {/* ✅ Engrenagem do admin */}
        {isAdmin && (
          <button
            onClick={handleAdminEdit}
            title="Editar post"
            className={`absolute top-4 right-4 z-20 w-9 h-9 rounded-2xl flex items-center justify-center border transition-all hover:scale-105 active:scale-95 ${
              isDarkMode
                ? "bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10"
                : "bg-[#0B1D33]/5 border-[#0B1D33]/10 text-[#0B1D33] hover:bg-[#0B1D33]/10"
            }`}
          >
            <Settings size={16} />
          </button>
        )}

        <div className="flex gap-4">
          <div className="flex-1">
            <span
              className={`text-xs font-black tracking-widest uppercase block mb-2 ${
                isDarkMode ? "text-yellow-400" : "text-[#0B1D33]"
              }`}
            >
              {article.category}
            </span>

            <h3
              className={`text-lg font-bold leading-snug mb-3 transition-colors ${
                isDarkMode ? "group-hover:text-yellow-400" : "text-[#0B1D33]"
              }`}
            >
              {article.title}
            </h3>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {(article.tags ?? []).map((tag) => (
                <div key={tag} className="relative">
                  <button
                    onMouseEnter={() => setHoveredTag(tag)}
                    onMouseLeave={() => setHoveredTag(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTagClick?.(tag);
                    }}
                    className={`text-[8px] font-black px-2 py-1 rounded-full border transition-colors hover:scale-105 active:scale-95 ${
                      isDarkMode
                        ? "border-white/10 text-gray-500 hover:text-yellow-400 hover:border-yellow-400/30"
                        : "border-[#0B1D33]/10 text-gray-400 hover:text-[#0B1D33] hover:border-[#0B1D33]/30"
                    }`}
                  >
                    #{tag}
                  </button>
                  {hoveredTag === tag && <TagTooltip tag={tag} isDarkMode={isDarkMode} />}
                </div>
              ))}
            </div>

            <p className={`text-[13px] leading-relaxed line-clamp-2 ${isDarkMode ? "text-gray-400" : "text-gray-600 font-medium"}`}>
              {article.description}
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <button
                className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all group/btn ${
                  isDarkMode ? "text-yellow-400" : "text-[#0B1D33]"
                }`}
              >
                Leia mais
                <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleReadLater}
                className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                  isSaved ? "text-green-500" : isDarkMode ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-[#0B1D33]"
                }`}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck size={14} />
                    Salvo
                  </>
                ) : (
                  <>
                    <Bookmark size={14} />
                    Ler depois
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="w-24 h-24 flex-shrink-0">
            <img
              src={article.imageUrl}
              alt={article.title}
              className={`w-full h-full object-cover rounded-2xl transition-all duration-500 ${
                isDarkMode ? "grayscale group-hover:grayscale-0" : "grayscale-0 group-hover:scale-105"
              }`}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {localReactions.map((r, i) => (
            <button
              key={`${r.emoji}-${i}`}
              onClick={(e) => toggleReaction(r.emoji, e)}
              className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 border transition-all ${
                userReactions.includes(r.emoji)
                  ? isDarkMode
                    ? "border-yellow-400 bg-yellow-400/10"
                    : "border-[#0B1D33] bg-[#0B1D33]/5"
                  : isDarkMode
                  ? "bg-white/5 border-white/5"
                  : "bg-gray-100 border-transparent"
              }`}
            >
              <span className="text-xs">{r.emoji}</span>
              <span
                className={`text-[10px] font-black tabular-nums ${
                  userReactions.includes(r.emoji) ? (isDarkMode ? "text-yellow-400" : "text-[#0B1D33]") : "text-gray-500"
                }`}
              >
                {r.count}
              </span>
            </button>
          ))}

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPicker(!showPicker);
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-yellow-400 transition-colors border ${
                isDarkMode ? "bg-white/5 border-white/5" : "bg-gray-100 border-transparent"
              }`}
            >
              <Plus size={14} />
            </button>

            {showPicker && (
              <ReactionPicker
                isDarkMode={isDarkMode}
                onPick={(emoji) => toggleReaction(emoji, { stopPropagation: () => {} } as any)}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>
        </div>

        <div className={`mt-6 pt-5 border-t flex items-center justify-between ${isDarkMode ? "border-white/5" : "border-[#0B1D33]/5"}`}>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-all duration-300 ${
                liked ? "text-red-500 scale-110" : isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-[#0B1D33]"
              }`}
            >
              <Heart size={18} fill={liked ? "currentColor" : "none"} className={liked ? "animate-bounce-short" : ""} />
              <span className="text-xs font-bold tabular-nums">{likeCount}</span>
            </button>

            <div className="flex items-center gap-1.5 text-gray-400">
              <MessageCircle size={18} />
              <span className="text-xs font-bold">{article.commentsCount}</span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 tracking-widest uppercase">
              <span>{article.readTime}</span>
              <span className={`w-1 h-1 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`} />
              <div className="flex items-center gap-1.5">
                {author && (
                  <img src={author.avatar} alt={author.name} className="w-5 h-5 rounded-full object-cover border border-white/10" />
                )}
                <span className="flex items-center gap-1">
                  {article.author}
                  {author?.isVerified && <BadgeCheck size={12} className="text-blue-500 fill-current" />}
                </span>
              </div>
            </div>
          </div>

          <button
            className={`p-2 transition-colors ${
              isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-[#0B1D33]"
            }`}
            onClick={handleShareClick}
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce-short {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        .animate-bounce-short {
          animation: bounce-short 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ArticleCard;
