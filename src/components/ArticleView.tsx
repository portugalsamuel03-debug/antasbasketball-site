import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Heart,
  Share2,
  MessageCircle,
  Send,
  MoreHorizontal,
  Smile,
  Check,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Article, Comment, Reaction } from "../types";

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
  onShare?: (article: Article) => void;
  isDarkMode: boolean;
}

type DbCommentViewRow = {
  id: string;
  article_id: string;
  user_id: string;
  body: string;
  created_at: string;
  display_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
};

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
      className={`absolute bottom-full mb-2 left-0 border rounded-2xl px-3 py-2.5 flex gap-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-2 zoom-in-95 duration-200 z-[70] backdrop-blur-xl ${
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
          className="hover:scale-150 active:scale-90 transition-transform text-xl flex items-center justify-center p-1"
        >
          {e}
        </button>
      ))}
    </div>
  );
};

const CommentItem: React.FC<{ comment: Comment; isDarkMode: boolean }> = ({ comment, isDarkMode }) => {
  const [liked, setLiked] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [localReactions, setLocalReactions] = useState<Reaction[]>(comment.reactions ?? []);
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [likeScale, setLikeScale] = useState(1);

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

  return (
    <div className="flex gap-4 group/comment animate-in fade-in slide-in-from-left-2 duration-500">
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 flex-shrink-0 shadow-lg border-white/5">
        <img src={comment.avatar} alt={comment.author} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 space-y-2">
        <div
          className={`border rounded-2xl px-5 py-4 shadow-inner ${
            isDarkMode ? "bg-[#161616] border-white/5" : "bg-[#F0F2F5] border-[#0B1D33]/5"
          }`}
        >
          <div className="flex justify-between items-center mb-1.5">
            <span className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-white" : "text-[#0B1D33]"}`}>
              {comment.author}
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{comment.date}</span>
          </div>
          <p className={`text-[13px] leading-relaxed font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            {comment.content}
          </p>
        </div>

        <div className="flex items-center gap-5 px-1 relative">
          <button
            onClick={handleLike}
            style={{ transform: `scale(${likeScale})` }}
            className={`flex items-center gap-1.5 text-[10px] font-black transition-all uppercase ${
              liked ? "text-red-500" : "text-gray-500 hover:text-red-400"
            }`}
          >
            <Heart size={14} fill={liked ? "currentColor" : "none"} strokeWidth={liked ? 0 : 2.5} />
            <span className="tabular-nums">{(comment.likes ?? 0) + (liked ? 1 : 0)}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className={`flex items-center gap-1.5 text-[10px] font-black transition-colors uppercase ${
                showPicker ? (isDarkMode ? "text-yellow-400" : "text-[#0B1D33]") : "text-gray-500 hover:text-yellow-400"
              }`}
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
                className={`border px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-in zoom-in-75 duration-300 active:scale-125 transition-all shadow-sm ${
                  userReactions.includes(r.emoji)
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

    const { data, error } = await supabase
      .from("v_article_comments_with_profile")
      .select("id,article_id,user_id,body,created_at,display_name,nickname,avatar_url")
      .eq("article_id", article.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("loadComments error:", error);
      setErrorMsg("Não foi possível carregar os comentários.");
      return;
    }

    const rows = (data ?? []) as DbCommentViewRow[];

    const ui: Comment[] = rows.map((r) => {
      const author = (r.nickname || r.display_name || "Usuário") as string;
      const avatar = (r.avatar_url || FALLBACK_AVATAR) as string;

      return {
        id: r.id,
        author,
        avatar,
        date: formatDate(r.created_at),
        content: r.body,
        likes: 0,
        reactions: [],
      };
    });

    setComments(ui);
    setCommentsCount(ui.length);
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

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`fixed inset-0 z-[80] overflow-y-auto animate-in slide-in-from-right duration-500 overscroll-behavior-y-contain ${
        isDarkMode ? "bg-black" : "bg-[#FDFBF4]"
      }`}
    >
      <div className={`max-w-md mx-auto min-h-screen flex flex-col relative pb-32 ${isDarkMode ? "bg-black" : "bg-[#FDFBF4]"}`}>
        {/* Reading Progress Bar */}
        <div className="fixed top-0 left-0 right-0 h-1 z-[100] flex justify-center max-w-md mx-auto pointer-events-none">
          <div
            className={`h-full transition-all duration-150 ease-out ${isDarkMode ? "bg-yellow-400" : "bg-[#0B1D33]"}`}
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        <div
          className={`sticky top-0 z-[90] px-6 py-5 flex justify-between items-center border-b transition-all ${
            isDarkMode ? "bg-black/80 backdrop-blur-2xl border-white/5" : "bg-[#FDFBF4]/80 backdrop-blur-2xl border-[#0B1D33]/5"
          }`}
        >
          <button
            onClick={onBack}
            className={`p-2.5 -ml-2.5 rounded-full active:scale-90 transition-transform shadow-lg border ${
              isDarkMode ? "text-white bg-[#1a1a1a] border-white/5" : "text-[#0B1D33] bg-white border-[#0B1D33]/5"
            }`}
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleSaved}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition ${
                saved
                  ? isDarkMode
                    ? "bg-yellow-400 text-black border-yellow-400"
                    : "bg-[#0B1D33] text-white border-[#0B1D33]"
                  : isDarkMode
                  ? "bg-white/5 text-gray-200 border-white/10"
                  : "bg-white text-[#0B1D33] border-[#0B1D33]/10"
              }`}
              title="Salvar / Ler depois"
            >
              {saved ? "SALVO" : "SALVAR"}
            </button>

            <button
              onClick={handleShare}
              className={`p-2.5 rounded-full active:scale-90 transition-transform shadow-lg border ${
                isDarkMode ? "text-white bg-[#1a1a1a] border-white/5" : "text-[#0B1D33] bg-white border-[#0B1D33]/5"
              }`}
            >
              <Share2 size={20} strokeWidth={2.5} />
            </button>

            <button
              className={`p-2.5 rounded-full active:scale-90 transition-transform shadow-lg border ${
                isDarkMode ? "text-white bg-[#1a1a1a] border-white/5" : "text-[#0B1D33] bg-white border-[#0B1D33]/5"
              }`}
            >
              <MoreHorizontal size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="relative w-full h-[380px] overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className={`w-full h-full object-cover scale-105 ${isDarkMode ? "grayscale-[0.2]" : "grayscale-0"}`}
          />
          <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent ${isDarkMode ? "from-black" : "from-[#FDFBF4]"}`} />
          <div className="absolute bottom-10 px-8">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-xl ${
                  isDarkMode ? "bg-yellow-400 text-black" : "bg-[#0B1D33] text-white"
                }`}
              >
                {article.category}
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-widest backdrop-blur-md px-3 py-1.5 rounded-full ${
                  isDarkMode ? "bg-white/5 text-gray-400" : "bg-[#0B1D33]/5 text-[#0B1D33]"
                }`}
              >
                {article.readTime}
              </span>
            </div>
            <h1 className={`text-3xl font-black leading-[1.1] tracking-tighter ${isDarkMode ? "text-white" : "text-[#0B1D33]"}`}>
              {article.title}
            </h1>
          </div>
        </div>

        <div
          className={`px-8 py-6 flex items-center justify-between border-b transition-all ${
            isDarkMode ? "border-white/5 bg-[#080808]" : "border-[#0B1D33]/5 bg-[#F0F2F5]/30"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 shadow-inner border-white/5">
              <img src={headerAvatar} alt="avatar" className="w-full h-full object-cover" />
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

        <div className="px-8 py-10">
          <p className={`leading-[1.8] text-[15px] font-medium whitespace-pre-wrap selection:bg-yellow-400/30 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            {article.content}
          </p>
        </div>

        <div
          className={`border-t px-8 pt-12 pb-20 rounded-t-[50px] mt-8 flex-1 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] transition-all ${
            isDarkMode ? "bg-[#0c0c0c] border-white/5" : "bg-white border-[#0B1D33]/5"
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
                className={`p-3 rounded-xl transition-all duration-500 flex items-center justify-center ${
                  sent
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
              comments.map((c) => <CommentItem isDarkMode={isDarkMode} key={c.id} comment={c} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleView;
