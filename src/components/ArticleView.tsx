import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Heart,
  Share2,
  MessageCircle,
  Send,
  Smile,
  Check,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Article, Comment, Reaction } from "../types";
import { EditTrigger } from "./admin/EditTrigger";
import { useAdmin } from "../context/AdminContext";
import { EditArticleModal } from "./admin/EditArticleModal";
import { ArticleRow } from "../cms";

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
  onShare?: (article: Article) => void;
  isDarkMode: boolean;
}

// Helpers
const FALLBACK_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=User";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

const ReactionPicker: React.FC<{
  onPick: (emoji: string) => void;
  onClose: () => void;
  isDarkMode: boolean;
}> = ({ onPick, onClose, isDarkMode }) => {
  const emojis = ["🔥", "🏀", "❤️", "👏", "😂", "😮", "💯", "🐐"];
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className={`absolute bottom-full mb-2 left-0 border rounded-2xl px-3 py-2.5 flex gap-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-2 zoom-in-95 duration-200 z-[70] backdrop-blur-xl ${isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-[#0B1D33]/10"
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
          className="hover:scale-150 active:scale-90 transition-transform text-xl flex items-center justify-center p-1"
        >
          {e}
        </button>
      ))}
    </div>
  );
};

const CommentItem: React.FC<{ comment: Comment; isDarkMode: boolean; meId?: string; isAdmin: boolean; onDelete: (id: string) => void; onEdit: (id: string, newBody: string) => void }> = ({ comment, isDarkMode, meId, isAdmin, onDelete, onEdit }) => {
  const [liked, setLiked] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [localReactions, setLocalReactions] = useState<Reaction[]>(comment.reactions ?? []);
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [likeScale, setLikeScale] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.content);

  const isOwner = meId && meId === comment.userId;

  const handleLike = () => {
    setLiked(!liked);
    setLikeScale(1.4);
    setTimeout(() => setLikeScale(1), 200);
  };

  const handleReact = (emoji: string) => {
    const isReacted = userReactions.includes(emoji);
    if (isReacted) {
      setUserReactions(userReactions.filter((e) => e !== emoji));
      setLocalReactions(localReactions.map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1 } : r)).filter(r => r.count > 0));
    } else {
      setUserReactions([...userReactions, emoji]);
      const existing = localReactions.find((r) => r.emoji === emoji);
      if (existing) {
        setLocalReactions(localReactions.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r)));
      } else {
        setLocalReactions([...localReactions, { emoji, count: 1 }]);
      }
    }
  };

  const handleSaveEdit = () => {
    if (editBody.trim() !== comment.content) onEdit(comment.id, editBody);
    setIsEditing(false);
  };

  return (
    <div className="flex gap-4 group/comment animate-in fade-in slide-in-from-left-2 duration-500">
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 flex-shrink-0 shadow-lg border-white/5">
        <img src={comment.avatar} alt={comment.author} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 space-y-2">
        <div className={`border rounded-2xl px-5 py-4 shadow-inner relative group ${isDarkMode ? "bg-[#161616] border-white/5" : "bg-[#F0F2F5] border-[#0B1D33]/5"}`}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col gap-1">
              <span className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-white" : "text-[#0B1D33]"}`}>{comment.author}</span>
              <div className="flex items-center gap-2">
                {comment.editedAt && <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">(editado)</span>}
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{comment.date}</span>
              </div>
            </div>
            {(isOwner || isAdmin) && !isEditing && (
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity self-start">
                {isOwner && (
                  <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-yellow-500 transition-colors" title="Editar"><Edit2 size={12} /></button>
                )}
                <button onClick={() => onDelete(comment.id)} className="text-gray-500 hover:text-red-500 transition-colors" title="Excluir"><Trash2 size={12} /></button>
              </div>
            )}
          </div>
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea value={editBody} onChange={e => setEditBody(e.target.value)} className={`w-full bg-transparent border-b ${isDarkMode ? 'border-white/20 text-white' : 'border-black/20 text-black'} focus:outline-none p-2 text-[13px] font-medium resize-none`} autoFocus />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setIsEditing(false)} className="text-[10px] uppercase font-bold text-gray-500">Cancelar</button>
                <button onClick={handleSaveEdit} className="text-[10px] uppercase font-black text-yellow-500">Salvar</button>
              </div>
            </div>
          ) : (
            <p className={`text-[13px] leading-relaxed font-medium whitespace-pre-wrap ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{comment.content}</p>
          )}
        </div>
        <div className="flex items-center gap-5 px-1 relative">
          <button onClick={handleLike} style={{ transform: `scale(${likeScale})` }} className={`flex items-center gap-1.5 text-[10px] font-black transition-all uppercase ${liked ? "text-red-500" : "text-gray-500 hover:text-red-400"}`}>
            <Heart size={14} fill={liked ? "currentColor" : "none"} strokeWidth={liked ? 0 : 2.5} />
            <span className="tabular-nums">{(comment.likes ?? 0) + (liked ? 1 : 0)}</span>
          </button>
          <div className="relative">
            <button onClick={() => setShowPicker(!showPicker)} className={`flex items-center gap-1.5 text-[10px] font-black transition-colors uppercase ${showPicker ? (isDarkMode ? "text-yellow-400" : "text-[#0B1D33]") : "text-gray-500 hover:text-yellow-400"}`}>
              <Smile size={14} strokeWidth={2.5} /> REAGIR
            </button>
            {showPicker && <ReactionPicker isDarkMode={isDarkMode} onPick={handleReact} onClose={() => setShowPicker(false)} />}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {localReactions.map((r, i) => (
              <button key={i} onClick={() => handleReact(r.emoji)} className={`border px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-in zoom-in-75 duration-300 active:scale-125 transition-all shadow-sm ${userReactions.includes(r.emoji) ? (isDarkMode ? "border-yellow-400 text-yellow-400" : "border-[#0B1D33] text-[#0B1D33] bg-[#0B1D33]/5") : (isDarkMode ? "bg-gray-900 border-white/10 text-gray-400" : "bg-white border-gray-100 text-gray-400")}`}>
                <span className="text-[11px] leading-none">{r.emoji}</span>
                <span className="text-[9px] font-black tabular-nums">{r.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PodcastPreview: React.FC<{ url: string; isDarkMode: boolean }> = ({ url, isDarkMode }) => {
  const embedUrl = useMemo(() => {
    if (!url) return null;
    if (url.includes('spotify.com')) {
      const match = url.match(/episode\/([a-zA-Z0-9]+)/);
      if (match) return `https://open.spotify.com/embed/episode/${match[1]}?utm_source=generator`;
      const showMatch = url.match(/show\/([a-zA-Z0-9]+)/);
      if (showMatch) return `https://open.spotify.com/embed/show/${showMatch[1]}?utm_source=generator`;
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let id = '';
      if (url.includes('v=')) id = url.split('v=')[1].split('&')[0];
      else if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1].split('?')[0];
      else if (url.includes('embed/')) id = url.split('embed/')[1].split('?')[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    return null;
  }, [url]);

  if (!embedUrl) return null;

  return (
    <div className={`w-full rounded-3xl overflow-hidden shadow-2xl border ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/5'}`}>
      <iframe src={embedUrl} width="100%" height={url.includes('spotify.com') ? "152" : "220"} frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="block"></iframe>
    </div>
  );
};

const ArticleView: React.FC<ArticleViewProps> = ({ article, onBack, onShare, isDarkMode }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sent, setSent] = useState(false);
  const [viewLikes, setViewLikes] = useState(article.likes ?? 0);
  const [commentsCount, setCommentsCount] = useState(article.commentsCount ?? 0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [me, setMe] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isEditing } = useAdmin();
  const [editingArticle, setEditingArticle] = useState<Partial<ArticleRow> | null>(null);
  const [articleAuthorAvatar, setArticleAuthorAvatar] = useState(FALLBACK_AVATAR);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setReadingProgress((scrollTop / (scrollHeight - clientHeight)) * 100);
      setIsScrolled(scrollTop > 50);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const handleShare = () => { if (onShare) onShare(article); };

  async function loadMeAndState() {
    setErrorMsg(null);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) { setMe(null); setLiked(false); setSaved(false); return; }
    const { data: p } = await supabase.from("profiles").select("id,display_name,nickname,avatar_url").eq("id", user.id).maybeSingle();
    const name = (p?.nickname || p?.display_name || "Você") as string;
    const avatar = (p?.avatar_url || FALLBACK_AVATAR) as string;
    setMe({ id: user.id, name, avatar });
    const { data: likeRow } = await supabase.from("article_likes").select("article_id").eq("article_id", article.id).eq("user_id", user.id).maybeSingle();
    setLiked(!!likeRow);
    const { data: savedRow } = await supabase.from("article_read_later").select("article_id").eq("article_id", article.id).eq("user_id", user.id).maybeSingle();
    setSaved(!!savedRow);
  }

  async function loadComments() {
    try {
      const { fetchArticleComments } = await import("../services/articles");
      const ui = await fetchArticleComments(article.id);
      setComments(ui);
      setCommentsCount(ui.length);
    } catch (e) { console.error(e); }
  }

  async function toggleLike() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return alert("Faça login para curtir.");
    const next = !liked;
    setLiked(next);
    setViewLikes(p => next ? p + 1 : Math.max(0, p - 1));
    try {
      if (next) await supabase.from("article_likes").insert({ article_id: article.id, user_id: auth.user.id });
      else await supabase.from("article_likes").delete().eq("article_id", article.id).eq("user_id", auth.user.id);
    } catch { setLiked(!next); setViewLikes(p => !next ? p + 1 : Math.max(0, p - 1)); }
  }

  async function sendComment() {
    const body = commentText.trim();
    if (!body || sent) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return alert("Login necessário");
    setSent(true);
    try {
      await supabase.from("article_comments").insert({ article_id: article.id, user_id: auth.user.id, body });
      setCommentText("");
      await loadComments();
    } catch { setErrorMsg("Erro ao enviar."); } finally { setSent(false); }
  }

  useEffect(() => { loadMeAndState(); loadComments(); }, [article.id]);

  useEffect(() => {
    async function loadAuthorAvatar() {
      if (!article.authorId) return;
      const { data } = await supabase.from('authors').select('avatar_url').eq('id', article.authorId).single();
      if (data?.avatar_url) setArticleAuthorAvatar(data.avatar_url);
    }
    loadAuthorAvatar();
  }, [article.authorId]);

  const hasHero = !!article.imageUrl;

  return (
    <>
      <div ref={containerRef} className={`h-full overflow-y-auto custom-scrollbar relative ${isDarkMode ? 'bg-[#080808]' : 'bg-[#FAFAFA]'}`}>

        {/* Floating Header Actions */}
        <div
          className={`fixed top-4 right-6 z-50 flex items-center gap-2 transition-all duration-300 ${isScrolled || !hasHero ? "bg-black/50 backdrop-blur-md p-1.5 rounded-full border border-white/10" : ""
            }`}
        >
          <button
            onClick={handleShare}
            className={`p-2.5 rounded-full transition-all active:scale-95 text-white hover:bg-white/20`}
            title="Compartilhar"
          >
            <Share2 size={20} className="drop-shadow-lg" />
          </button>

          <button
            onClick={toggleLike}
            className={`p-2.5 rounded-full transition-all active:scale-95 flex items-center gap-2 ${liked ? "text-red-500 bg-white/10" : "text-white hover:bg-white/20"
              }`}
          >
            <Heart size={20} fill={liked ? "currentColor" : "none"} strokeWidth={liked ? 0 : 2.5} className="drop-shadow-lg" />
            {viewLikes > 0 && <span className="text-[11px] font-black drop-shadow-md">{viewLikes}</span>}
          </button>

          <div className="w-px h-6 bg-white/20 mx-1"></div>

          <button
            onClick={onBack}
            className={`p-2.5 rounded-full transition-all hover:rotate-90 active:scale-95 bg-white text-black hover:bg-gray-200 shadow-xl`}
            title="Fechar"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* HERO SECTION */}
        {hasHero ? (
          <div className="relative w-full h-[55vh] min-h-[400px]">
            <img src={article.imageUrl} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-transparent"></div>

            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-12 pb-12 max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-4 animate-in slide-in-from-bottom-4 duration-700 delay-100 opacity-0 fill-mode-forwards">
                <span className="px-3 py-1 rounded-full bg-yellow-500 text-black text-[10px] font-black tracking-widest uppercase shadow-lg shadow-yellow-500/20">
                  {article.category || 'ARTIGO'}
                </span>
                <span className="text-gray-300 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  {article.readTime} LEITURA
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] uppercase tracking-tight mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-200 opacity-0 fill-mode-forwards drop-shadow-xl max-w-4xl">
                {article.title}
              </h1>

              <div className="flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-700 delay-300 opacity-0 fill-mode-forwards">
                <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden shadow-lg">
                  <img src={articleAuthorAvatar} alt={article.author} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-white text-xs font-black uppercase tracking-widest drop-shadow-md">{article.author}</p>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">{article.date}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`pt-32 pb-12 px-6 sm:px-12 ${isDarkMode ? 'bg-[#080808]' : 'bg-white'}`}>
            <h1 className={`text-4xl sm:text-6xl font-black uppercase tracking-tight mb-8 ${isDarkMode ? "text-white" : "text-[#0B1D33]"}`}>
              {article.title}
            </h1>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border overflow-hidden shadow-sm">
                <img src={articleAuthorAvatar} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className={`text-xs font-black uppercase ${isDarkMode ? "text-white" : "text-black"}`}>{article.author}</p>
                <p className="text-gray-500 text-[10px] font-bold uppercase">{article.date}</p>
              </div>
            </div>
          </div>
        )}

        {/* CONTENT */}
        <div className={`relative z-10 -mt-6 rounded-t-[40px] px-6 sm:px-0 py-12 transition-colors min-h-screen ${isDarkMode
            ? "bg-[#080808] shadow-[0_-20px_60px_rgba(0,0,0,1)] border-t border-white/5"
            : "bg-[#FAFAFA] shadow-[0_-20px_60px_rgba(0,0,0,0.05)] border-t border-black/5"
          }`}>
          {/* Reading Line */}
          <div className="sticky top-0 left-0 w-full h-1 bg-gray-200/10 z-20 overflow-hidden">
            <div className="h-full bg-yellow-500 transition-all duration-100 ease-out shadow-[0_0_10px_#EAB308]" style={{ width: `${readingProgress}%` }}></div>
          </div>

          <div className="max-w-3xl mx-auto">

            {article.video_url && (
              <div className="mb-12">
                <PodcastPreview url={article.video_url} isDarkMode={isDarkMode} />
              </div>
            )}

            <article className={`prose prose-lg max-w-none ${isDarkMode ? 'prose-invert' : ''} mb-20`}>
              <p className={`whitespace-pre-wrap leading-[2] text-[18px] sm:text-[20px] font-medium opacity-90 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                {article.content}
              </p>
            </article>

            <div className="my-12 h-px bg-gradient-to-r from-transparent via-gray-500/20 to-transparent"></div>

            {/* COMMENTS */}
            <div className="pb-24">
              <div className="flex items-center gap-3 mb-8">
                <div className={`p-3 rounded-2xl ${isDarkMode ? "bg-yellow-500/10 text-yellow-500" : "bg-black/5 text-black"}`}>
                  <MessageCircle size={24} strokeWidth={2.5} />
                </div>
                <span className={`text-lg font-black tracking-widest uppercase ${isDarkMode ? "text-white" : "text-black"}`}>
                  Discussão ({commentsCount})
                </span>
              </div>

              {/* Comment Input */}
              <div className="flex gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 shrink-0 shadow-lg">
                  <img src={me?.avatar || FALLBACK_AVATAR} className="w-full h-full object-cover" />
                </div>
                <div className={`flex-1 rounded-2xl p-2 flex items-center border transition-all shadow-inner focus-within:shadow-md ${isDarkMode ? "bg-[#111] border-white/10 focus-within:border-yellow-500/50" : "bg-white border-black/10 focus-within:border-black/30"}`}>
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendComment()}
                    placeholder={me ? "Escreva sua opinião..." : "Entre para comentar..."}
                    disabled={!me}
                    className={`flex-1 bg-transparent px-4 py-2 outline-none text-[14px] font-medium ${isDarkMode ? "text-white placeholder:text-gray-600" : "text-black placeholder:text-gray-400"}`}
                  />
                  <button
                    onClick={sendComment}
                    disabled={!me || !commentText.trim()}
                    className={`p-2.5 rounded-xl transition-all ${commentText.trim() ? "bg-yellow-500 text-black hover:scale-105 shadow-lg shadow-yellow-500/20" : "bg-gray-500/10 text-gray-500"}`}
                  >
                    {sent ? <Check size={18} strokeWidth={3} /> : <Send size={18} strokeWidth={2.5} />}
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                {comments.length === 0 && <p className="text-center text-gray-500 italic py-10">Seja o primeiro a comentar.</p>}
                {comments.map(c => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    isDarkMode={isDarkMode}
                    meId={me?.id}
                    isAdmin={isEditing}
                    onDelete={async (id) => {
                      if (confirm("Deletar?")) {
                        await import('../cms').then(m => m.deleteComment(id));
                        setComments(p => p.filter(x => x.id !== id));
                      }
                    }}
                    onEdit={async (id, txt) => {
                      await import('../cms').then(m => m.updateComment(id, txt));
                      setComments(p => p.map(x => x.id === id ? { ...x, content: txt } : x));
                    }}
                  />
                ))}
              </div>

            </div>
          </div>
        </div>

      </div>

      {editingArticle && (
        <EditArticleModal
          article={editingArticle}
          isDarkMode={isDarkMode}
          onClose={() => setEditingArticle(null)}
          onSaveSuccess={() => window.location.reload()}
        />
      )}
    </>
  );
};

export default ArticleView;
