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
  Bookmark,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Article } from "../types";

type UiComment = {
  id: string;
  author: string;
  avatar: string;
  date: string;
  content: string;
};

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
  onShare?: (article: Article) => void;
  isDarkMode: boolean;
}

function formatDateTiny(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function dicebear(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
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
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) onClose();
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

const ArticleView: React.FC<ArticleViewProps> = ({ article, onBack, onShare, isDarkMode }) => {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  // Persistent states
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  // Counters
  const [viewLikes, setViewLikes] = useState<number>(article.likes ?? 0);
  const [commentsCount, setCommentsCount] = useState<number>(article.commentsCount ?? 0);

  // Comments
  const [comments, setComments] = useState<UiComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  // UI
  const [commentText, setCommentText] = useState("");
  const [sent, setSent] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showPicker, setShowPicker] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const meAvatar = useMemo(() => dicebear(sessionUserId ?? "User"), [sessionUserId]);

  // Boot session user id
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;
      if (!alive) return;
      setSessionUserId(uid);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Load persisted states + comments + counts
  useEffect(() => {
    let alive = true;

    async function loadAll() {
      setLoadingComments(true);

      // 1) liked/saved state for current user
      if (sessionUserId) {
        const [likeRow, saveRow] = await Promise.all([
          supabase
            .from("article_likes")
            .select("article_id")
            .eq("article_id", article.id)
            .eq("user_id", sessionUserId)
            .maybeSingle(),
          supabase
            .from("article_read_later")
            .select("article_id")
            .eq("article_id", article.id)
            .eq("user_id", sessionUserId)
            .maybeSingle(),
        ]);

        if (!alive) return;
        setLiked(!!likeRow.data);
        setSaved(!!saveRow.data);
      } else {
        if (!alive) return;
        setLiked(false);
        setSaved(false);
      }

      // 2) counts from tables (fonte de verdade)
      const [likesCountRes, commentsCountRes] = await Promise.all([
        supabase.from("article_likes").select("article_id", { count: "exact", head: true }).eq("article_id", article.id),
        supabase
          .from("article_comments")
          .select("article_id", { count: "exact", head: true })
          .eq("article_id", article.id),
      ]);

      if (!alive) return;
      setViewLikes(likesCountRes.count ?? (article.likes ?? 0));
      setCommentsCount(commentsCountRes.count ?? (article.commentsCount ?? 0));

      // 3) comments list (join profiles)
      const { data: cdata, error: cerr } = await supabase
        .from("article_comments")
        .select(
          `
          id,
          body,
          created_at,
          profiles:profiles (
            display_name,
            nickname,
            avatar_url
          )
        `
        )
        .eq("article_id", article.id)
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (cerr) {
        console.error("load comments error:", cerr);
        setComments([]);
      } else {
        const mapped: UiComment[] = (cdata as any[]).map((row) => {
          const p = row.profiles ?? null;
          const author = p?.nickname || p?.display_name || "Usuário";
          const avatar = p?.avatar_url?.trim() ? p.avatar_url : dicebear(author);
          return {
            id: row.id,
            author,
            avatar,
            date: formatDateTiny(row.created_at),
            content: row.body ?? "",
          };
        });
        setComments(mapped);
      }

      setLoadingComments(false);
    }

    loadAll();
    return () => {
      alive = false;
    };
  }, [article.id, article.likes, article.commentsCount, sessionUserId]);

  const handleShare = () => {
    if (onShare) onShare(article);
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const denom = scrollHeight - clientHeight;
    const progress = denom > 0 ? (scrollTop / denom) * 100 : 0;
    setReadingProgress(progress);
  };

  async function toggleLike() {
    if (!sessionUserId) {
      // se quiser, aqui você pode abrir AuthPopup via prop depois.
      alert("Faça login para curtir.");
      return;
    }

    const next = !liked;
    setLiked(next);
    setViewLikes((v) => (next ? v + 1 : Math.max(0, v - 1)));

    try {
      if (next) {
        const { error } = await supabase.from("article_likes").insert({
          article_id: article.id,
          user_id: sessionUserId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("article_likes")
          .delete()
          .eq("article_id", article.id)
          .eq("user_id", sessionUserId);
        if (error) throw error;
      }
    } catch (e) {
      console.error("toggleLike error:", e);
      // rollback
      setLiked(!next);
      setViewLikes((v) => (next ? Math.max(0, v - 1) : v + 1));
    }
  }

  async function toggleSaved() {
    if (!sessionUserId) {
      alert("Faça login para salvar.");
      return;
    }

    const next = !saved;
    setSaved(next);

    try {
      if (next) {
        const { error } = await supabase.from("article_read_later").insert({
          article_id: article.id,
          user_id: sessionUserId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("article_read_later")
          .delete()
          .eq("article_id", article.id)
          .eq("user_id", sessionUserId);
        if (error) throw error;
      }
    } catch (e) {
      console.error("toggleSaved error:", e);
      setSaved(!next);
    }
  }

  async function sendComment() {
    if (!sessionUserId) {
      alert("Faça login para comentar.");
      return;
    }
    const text = commentText.trim();
    if (!text || sent) return;

    setSent(true);

    try {
      const { data: inserted, error } = await supabase
        .from("article_comments")
        .insert({
          article_id: article.id,
          user_id: sessionUserId,
          body: text,
        })
        .select(
          `
          id,
          body,
          created_at,
          profiles:profiles (
            display_name,
            nickname,
            avatar_url
          )
        `
        )
        .single();

      if (error) throw error;

      const p = (inserted as any)?.profiles ?? null;
      const author = p?.nickname || p?.display_name || "Você";
      const avatar = p?.avatar_url?.trim() ? p.avatar_url : dicebear(author);

      const ui: UiComment = {
        id: (inserted as any).id,
        author,
        avatar,
        date: formatDateTiny((inserted as any).created_at),
        content: (inserted as any).body ?? text,
      };

      setComments((prev) => [ui, ...prev]);
      setCommentsCount((c) => c + 1);
      setCommentText("");
    } catch (e) {
      console.error("sendComment error:", e);
      alert("Não foi possível enviar o comentário.");
    } finally {
      setTimeout(() => setSent(false), 450);
    }
  }

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
          <div className={`${isDarkMode ? "bg-yellow-400" : "bg-[#0B1D33]"} h-full transition-all duration-150 ease-out`} style={{ width: `${readingProgress}%` }} />
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
              className={`p-2.5 rounded-full active:scale-90 transition-transform shadow-lg border ${
                saved
                  ? "bg-yellow-400 text-black border-yellow-400"
                  : isDarkMode
                  ? "text-white bg-[#1a1a1a] border-white/5"
                  : "text-[#0B1D33] bg-white border-[#0B1D33]/5"
              }`}
              title={saved ? "Salvo" : "Salvar"}
            >
              <Bookmark size={20} strokeWidth={2.5} fill={saved ? "currentColor" : "none"} />
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
          <img src={article.imageUrl} alt={article.title} className={`w-full h-full object-cover scale-105 ${isDarkMode ? "grayscale-[0.2]" : "grayscale-0"}`} />
          <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent ${isDarkMode ? "from-black" : "from-[#FDFBF4]"}`} />
          <div className="absolute bottom-10 px-8">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-xl ${isDarkMode ? "bg-yellow-400 text-black" : "bg-[#0B1D33] text-white"}`}>
                {article.category}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest backdrop-blur-md px-3 py-1.5 rounded-full ${isDarkMode ? "bg-white/5 text-gray-400" : "bg-[#0B1D33]/5 text-[#0B1D33]"}`}>
                {article.readTime}
              </span>
            </div>

            <h1 className={`text-3xl font-black leading-[1.1] tracking-tighter ${isDarkMode ? "text-white" : "text-[#0B1D33]"}`}>{article.title}</h1>
          </div>
        </div>

        {/* Author + Like */}
        <div className={`px-8 py-6 flex items-center justify-between border-b transition-all ${isDarkMode ? "border-white/5 bg-[#080808]" : "border-[#0B1D33]/5 bg-[#F0F2F5]/30"}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-inner ${isDarkMode ? "bg-yellow-400/20 border-yellow-400/30" : "bg-[#0B1D33]/10 border-[#0B1D33]/20"}`}>
              <span className={`text-sm font-black italic ${isDarkMode ? "text-yellow-400" : "text-[#0B1D33]"}`}>AB</span>
            </div>
            <div>
              <p className={`text-[12px] font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-[#0B1D33]"}`}>{article.author}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{article.date} • ANTAS OFICIAL</p>
            </div>
          </div>

          <button onClick={toggleLike} className={`flex flex-col items-center gap-1 transition-all ${liked ? "text-red-500 scale-110" : "text-gray-500 hover:text-white"}`}>
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

        {/* Comments */}
        <div className={`border-t px-8 pt-12 pb-20 rounded-t-[50px] mt-8 flex-1 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] transition-all ${isDarkMode ? "bg-[#0c0c0c] border-white/5" : "bg-white border-[#0B1D33]/5"}`}>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isDarkMode ? "bg-yellow-400/10" : "bg-[#0B1D33]/5"}`}>
                <MessageCircle size={22} className={isDarkMode ? "text-yellow-400" : "text-[#0B1D33]"} strokeWidth={2.5} />
              </div>
              <h3 className={`text-md font-black tracking-widest uppercase ${isDarkMode ? "text-white" : "text-[#0B1D33]"}`}>
                DISCUSSÃO <span className="text-gray-500 ml-1">({commentsCount})</span>
              </h3>
            </div>
          </div>

          {/* Composer */}
          <div className="flex gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={`w-11 h-11 rounded-full border-2 overflow-hidden flex-shrink-0 shadow-lg ${isDarkMode ? "bg-gray-900 border-white/5" : "bg-[#F0F2F5] border-[#0B1D33]/5"}`}>
              <img src={meAvatar} alt="You" />
            </div>

            <div
              className={`flex-1 rounded-2xl p-1.5 flex items-center border transition-all duration-300 shadow-inner group relative ${
                isDarkMode ? "bg-[#161616] border-white/10 focus-within:border-yellow-400/40" : "bg-[#F0F2F5] border-[#0B1D33]/10 focus-within:border-[#0B1D33]/40"
              }`}
            >
              <input
                type="text"
                placeholder="Participe do debate..."
                className={`bg-transparent border-none focus:ring-0 text-[13px] font-medium flex-1 px-4 placeholder:text-gray-500 ${isDarkMode ? "text-white" : "text-[#0B1D33]"}`}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendComment()}
              />

              <div className="flex items-center gap-2 pr-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPicker((v) => !v)}
                    className={`p-2 rounded-xl transition-all ${isDarkMode ? "text-gray-300 hover:text-yellow-400" : "text-[#0B1D33]/70 hover:text-[#0B1D33]"}`}
                    title="Reagir (UI)"
                  >
                    <Smile size={18} strokeWidth={2.5} />
                  </button>
                  {showPicker && (
                    <ReactionPicker
                      isDarkMode={isDarkMode}
                      onPick={() => {
                        // (opcional no futuro) reação persistente
                      }}
                      onClose={() => setShowPicker(false)}
                    />
                  )}
                </div>

                <button
                  onClick={sendComment}
                  disabled={!commentText.trim() || sent}
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
          </div>

          {/* List */}
          {loadingComments ? (
            <div className="text-sm text-gray-400">Carregando comentários…</div>
          ) : comments.length === 0 ? (
            <div className="text-sm text-gray-400">Seja o primeiro a comentar.</div>
          ) : (
            <div className="space-y-8">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-500">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 flex-shrink-0 shadow-lg border-white/5">
                    <img src={c.avatar} alt={c.author} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className={`border rounded-2xl px-5 py-4 shadow-inner ${isDarkMode ? "bg-[#161616] border-white/5" : "bg-[#F0F2F5] border-[#0B1D33]/5"}`}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-white" : "text-[#0B1D33]"}`}>{c.author}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{c.date}</span>
                      </div>
                      <p className={`text-[13px] leading-relaxed font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{c.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleView;
