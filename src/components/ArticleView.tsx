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
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Article, Comment, Reaction } from "../types";

// Removed local Comment interface extension as types.ts is updated.

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



// ... (existing code for FALLBACK_AVATAR, formatDate, ReactionPicker, CommentItem, PodcastPreview) ...

// IMPORTANT: We must NOT replace the whole file, just the top imports and the loadComments function if possible.
// But the target range in previous step was huge.
// Let's target specific blocks.

// Block 1: Imports and Interface
// Block 2: loadComments function


// DbCommentViewRow defined above


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

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.content);

  const isOwner = meId && meId === comment.userId; // We need to ensure comment has userId or we pass it down
  // Actually the comment object in ArticleView is mapped from DB row which has user_id. 
  // We need to make sure Comment type includes userId or we add it to the mapping.

  const handleLike = () => {
    setLiked(!liked);
    setLikeScale(1.4);
    setTimeout(() => setLikeScale(1), 200);
  };

  const handleReact = (emoji: string) => {
    const isReacted = userReactions.includes(emoji);
    if (isReacted) {
      setUserReactions(userReactions.filter((e) => e !== emoji));
      setLocalReactions(
        localReactions
          .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1 } : r))
          .filter((r) => r.count > 0)
      );
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
    if (editBody.trim() !== comment.content) {
      onEdit(comment.id, editBody);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex gap-4 group/comment animate-in fade-in slide-in-from-left-2 duration-500">
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 flex-shrink-0 shadow-lg border-white/5">
        <img src={comment.avatar} alt={comment.author} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 space-y-2">
        <div
          className={`border rounded-2xl px-5 py-4 shadow-inner relative group ${isDarkMode ? "bg-[#161616] border-white/5" : "bg-[#F0F2F5] border-[#0B1D33]/5"}`}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col gap-1">
              <span className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-white" : "text-[#0B1D33]"}`}>
                {comment.author}
              </span>
              <div className="flex items-center gap-2">
                {comment.editedAt && (
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">(editado)</span>
                )}
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{comment.date}</span>
              </div>
            </div>

            {/* Actions for Owner or Admin */}
            {(isOwner || isAdmin) && !isEditing && (
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity self-start">
                {isOwner && (
                  <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-yellow-500 transition-colors" title="Editar">
                    <Edit2 size={12} />
                  </button>
                )}
                <button onClick={() => onDelete(comment.id)} className="text-gray-500 hover:text-red-500 transition-colors" title="Excluir">
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
                className={`w-full bg-transparent border-b ${isDarkMode ? 'border-white/20 text-white' : 'border-black/20 text-black'} focus:outline-none p-2 text-[13px] font-medium resize-none`}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setIsEditing(false)} className="text-[10px] uppercase font-bold text-gray-500">Cancelar</button>
                <button onClick={handleSaveEdit} className="text-[10px] uppercase font-black text-yellow-500">Salvar</button>
              </div>
            </div>
          ) : (
            <p className={`text-[13px] leading-relaxed font-medium whitespace-pre-wrap ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              {comment.content}
            </p>
          )}
        </div>

        <div className="flex items-center gap-5 px-1 relative">
          <button
            onClick={handleLike}
            style={{ transform: `scale(${likeScale})` }}
            className={`flex items-center gap-1.5 text-[10px] font-black transition-all uppercase ${liked ? "text-red-500" : "text-gray-500 hover:text-red-400"}`}
          >
            <Heart size={14} fill={liked ? "currentColor" : "none"} strokeWidth={liked ? 0 : 2.5} />
            <span className="tabular-nums">{(comment.likes ?? 0) + (liked ? 1 : 0)}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className={`flex items-center gap-1.5 text-[10px] font-black transition-colors uppercase ${showPicker ? (isDarkMode ? "text-yellow-400" : "text-[#0B1D33]") : "text-gray-500 hover:text-yellow-400"}`}
            >
              <Smile size={14} strokeWidth={2.5} />
              REAGIR
            </button>
            {showPicker && <ReactionPicker isDarkMode={isDarkMode} onPick={handleReact} onClose={() => setShowPicker(false)} />}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {localReactions.map((r, i) => (
              <button
                key={i}
                onClick={() => handleReact(r.emoji)}
                className={`border px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-in zoom-in-75 duration-300 active:scale-125 transition-all shadow-sm ${userReactions.includes(r.emoji)
                  ? isDarkMode
                    ? "border-yellow-400 text-yellow-400"
                    : "border-[#0B1D33] text-[#0B1D33] bg-[#0B1D33]/5"
                  : isDarkMode
                    ? "bg-gray-900 border-white/10 text-gray-400"
                    : "bg-white border-gray-100 text-gray-400"
                  }`}
              >
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
      <iframe
        src={embedUrl}
        width="100%"
        height={url.includes('spotify.com') ? "152" : "220"}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="block"
      ></iframe>
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

  // Edit Mode
  const { isEditing } = useAdmin();
  const [editingArticle, setEditingArticle] = useState<Partial<ArticleRow> | null>(null);

  const handleShare = () => {
    if (onShare) onShare(article);
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setReadingProgress(progress);
    }
  };

  async function loadMeAndState() {
    setErrorMsg(null);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      setMe(null);
      setLiked(false);
      setSaved(false);
      return;
    }

    // profile (nome + avatar)
    const { data: p, error: pErr } = await supabase
      .from("profiles")
      .select("id,display_name,nickname,avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (pErr) console.warn("profile load error:", pErr);

    const name = (p?.nickname || p?.display_name || "Você") as string;
    const avatar = (p?.avatar_url || FALLBACK_AVATAR) as string;

    setMe({ id: user.id, name, avatar });

    // liked?
    const { data: likeRow } = await supabase
      .from("article_likes")
      .select("article_id")
      .eq("article_id", article.id)
      .eq("user_id", user.id)
      .maybeSingle();

    setLiked(!!likeRow);

    // saved?
    const { data: savedRow } = await supabase
      .from("article_read_later")
      .select("article_id")
      .eq("article_id", article.id)
      .eq("user_id", user.id)
      .maybeSingle();

    setSaved(!!savedRow);
  }

  // ✅ AGORA LÊ DA VIEW (já vem profile junto, sem relationship)
  async function loadComments() {
    setErrorMsg(null);
    try {
      const { fetchArticleComments } = await import("../services/articles");
      const ui = await fetchArticleComments(article.id);
      setComments(ui);
      setCommentsCount(ui.length);
    } catch (error) {
      console.error("loadComments error:", error);
      setErrorMsg("Não foi possível carregar os comentários.");
    }
  }

  async function toggleLike() {
    setErrorMsg(null);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      alert("Você precisa estar logado para curtir.");
      return;
    }

    const next = !liked;

    // otimista
    setLiked(next);
    setViewLikes((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));

    try {
      if (next) {
        const { error } = await supabase.from("article_likes").insert({
          article_id: article.id,
          user_id: user.id,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("article_likes")
          .delete()
          .eq("article_id", article.id)
          .eq("user_id", user.id);
        if (error) throw error;
      }
    } catch (e: any) {
      console.error("toggleLike error:", e);
      // rollback
      setLiked(!next);
      setViewLikes((prev) => (!next ? prev + 1 : Math.max(0, prev - 1)));
      setErrorMsg("Não foi possível atualizar a curtida.");
    }
  }

  async function toggleSaved() {
    setErrorMsg(null);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      alert("Você precisa estar logado para salvar.");
      return;
    }

    const next = !saved;
    setSaved(next);

    try {
      if (next) {
        const { error } = await supabase.from("article_read_later").insert({
          article_id: article.id,
          user_id: user.id,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("article_read_later")
          .delete()
          .eq("article_id", article.id)
          .eq("user_id", user.id);
        if (error) throw error;
      }
    } catch (e: any) {
      console.error("toggleSaved error:", e);
      setSaved(!next);
      setErrorMsg("Não foi possível atualizar o “salvar”.");
    }
  }

  async function sendComment() {
    setErrorMsg(null);

    const body = commentText.trim();
    if (!body || sent) return;

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      alert("Você precisa estar logado para comentar.");
      return;
    }

    setSent(true);

    try {
      // ✅ INSERT CONTINUA NA TABELA NORMAL
      const { error } = await supabase.from("article_comments").insert({
        article_id: article.id,
        user_id: user.id,
        body,
      });

      if (error) throw error;

      setCommentText("");
      await loadComments();
    } catch (e: any) {
      console.error("sendComment error:", e);
      setErrorMsg("Não foi possível enviar o comentário.");
      alert("Não foi possível enviar o comentário.");
    } finally {
      setSent(false);
    }
  }

  useEffect(() => {
    loadMeAndState();
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article.id]);

  const headerAvatar = useMemo(() => me?.avatar || FALLBACK_AVATAR, [me?.avatar]);

  // Handle opening edit modal
  const handleOpenEdit = () => {
    setEditingArticle({
      id: article.id,
      title: article.title,
      category: article.category,
      // We might need to fetch the full content/raw data if 'article' prop is missing fields like slug/reading_minutes/published
      // But looking at Article type, it seems to have content.
      content: article.content,
      cover_url: article.imageUrl,
      excerpt: "", // Might be missing in Article view props
      published: true, // Assuming published if visible here
      reading_minutes: parseInt(article.readTime) || 5, // Parsing "5 MIN"
      video_url: article.video_url,
    });
  };

  // Fetch Article Author Avatar
  const [articleAuthorAvatar, setArticleAuthorAvatar] = useState(FALLBACK_AVATAR);

  useEffect(() => {
    async function loadAuthorAvatar() {
      if (!article.authorId) return;
      const { data } = await supabase
        .from('authors')
        .select('avatar_url')
        .eq('id', article.authorId)
        .single();

      if (data?.avatar_url) {
        setArticleAuthorAvatar(data.avatar_url);
      } else {
        // Fallback: try by name if ID failed or is missing? 
        // For now, if ID is provided but no avatar, stick to fallback.
      }
    }
    loadAuthorAvatar();
  }, [article.authorId]);

  return (
    <>
      <div ref={containerRef}>
        <div
          className={`px-8 py-6 flex items-center justify-between border-b transition-all ${isDarkMode ? "border-white/5 bg-[#080808]" : "border-[#0B1D33]/5 bg-[#F0F2F5]/30"
            }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 shadow-inner border-white/5">
              <img src={articleAuthorAvatar} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className={`text-[12px] font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-[#0B1D33]"}`}>{article.author}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{article.date} • ANTAS OFICIAL</p>
            </div>
          </div>

          <button
            onClick={toggleLike}
            className={`flex flex-col items-center gap-1 transition-all ${liked ? "text-red-500 scale-110" : "text-gray-500 hover:text-white"}`}
          >
            <div className={`p-2.5 rounded-full ${liked ? "bg-red-500/10" : isDarkMode ? "bg-white/5" : "bg-[#0B1D33]/5"}`}>
              <Heart size={22} fill={liked ? "currentColor" : "none"} strokeWidth={liked ? 0 : 2.5} />
            </div>
            <span className="text-[10px] font-black tabular-nums">{viewLikes}</span>
          </button>
        </div>

        {article.video_url && (
          <div className="px-8 mt-6">
            <PodcastPreview url={article.video_url} isDarkMode={isDarkMode} />
          </div>
        )}

        <div className="px-8 py-10">
          <p className={`leading-[1.8] text-[15px] font-medium whitespace-pre-wrap selection:bg-yellow-400/30 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            {article.content}
          </p>
        </div>

        <div
          className={`border-t px-8 pt-12 pb-20 rounded-t-[50px] mt-8 flex-1 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] transition-all ${isDarkMode ? "bg-[#0c0c0c] border-white/5" : "bg-white border-[#0B1D33]/5"
            }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isDarkMode ? "bg-yellow-400/10" : "bg-[#0B1D33]/5"}`}>
                <MessageCircle size={22} className={isDarkMode ? "text-yellow-400" : "text-[#0B1D33]"} strokeWidth={2.5} />
              </div>
              <h3 className={`text-md font-black tracking-widest uppercase ${isDarkMode ? "text-white" : "text-[#0B1D33]"}`}>
                DISCUSSÃO <span className="text-gray-500 ml-1">({commentsCount})</span>
              </h3>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 text-[12px] font-bold bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-red-200">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={`w-11 h-11 rounded-full border-2 overflow-hidden flex-shrink-0 shadow-lg ${isDarkMode ? "bg-gray-900 border-white/5" : "bg-[#F0F2F5] border-[#0B1D33]/5"}`}>
              <img src={me?.avatar || FALLBACK_AVATAR} alt="You" />
            </div>

            <div className={`flex-1 rounded-2xl p-1.5 flex items-center border transition-all duration-300 shadow-inner group ${isDarkMode ? "bg-[#161616] border-white/10 focus-within:border-yellow-400/40" : "bg-[#F0F2F5] border-[#0B1D33]/10 focus-within:border-[#0B1D33]/40"}`}>
              <input
                type="text"
                placeholder={me ? "Participe do debate..." : "Faça login para comentar..."}
                className={`bg-transparent border-none focus:ring-0 text-[13px] font-medium flex-1 px-4 placeholder:text-gray-500 ${isDarkMode ? "text-white" : "text-[#0B1D33]"}`}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendComment()}
                disabled={!me}
              />

              <button
                onClick={sendComment}
                disabled={!me || !commentText.trim() || sent}
                className={`p-3 rounded-xl transition-all duration-500 flex items-center justify-center ${sent
                  ? "bg-green-500 text-white"
                  : commentText.trim()
                    ? isDarkMode
                      ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 active:scale-90"
                      : "bg-[#0B1D33] text-white shadow-lg shadow-[#0B1D33]/20 active:scale-90"
                    : "text-gray-400 bg-gray-200/50"
                  }`}
              >
                {sent ? <Check size={20} strokeWidth={3} /> : <Send size={20} strokeWidth={3} />}
              </button>
            </div>
          </div>

          <div className="space-y-12">
            {comments.length === 0 ? (
              <div className="text-sm text-gray-500">Seja o primeiro a comentar.</div>
            ) : (
              comments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  isDarkMode={isDarkMode}
                  meId={me?.id}
                  isAdmin={isEditing} // 'isEditing' from useAdmin context actually means "isAdmin mode enabled", effectively admin check
                  onDelete={async (commentId) => {
                    if (confirm("Apagar comentário?")) {
                      const { deleteComment } = await import('../cms');
                      await deleteComment(commentId);
                      setComments(comments.filter(x => x.id !== commentId));
                      setCommentsCount(c => Math.max(0, c - 1));
                    }
                  }}
                  onEdit={async (commentId, newBody) => {
                    const { updateComment } = await import('../cms');
                    await updateComment(commentId, newBody);
                    setComments(comments.map(x => x.id === commentId ? { ...x, content: newBody, editedAt: new Date().toISOString() } : x));
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div >


      {editingArticle && (
        <EditArticleModal
          article={editingArticle}
          isDarkMode={isDarkMode}
          onClose={() => setEditingArticle(null)}
          onSaveSuccess={() => {
            // Ideally reload the article data here. 
            // Since this view relies on 'article' prop, we might need to tell parent to reload 
            // or just force a page refresh for simplicity if we can't easily propagate up.
            window.location.reload();
          }}
        />
      )
      }
    </>
  );
};

export default ArticleView;
