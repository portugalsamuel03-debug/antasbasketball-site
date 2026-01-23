import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Heart, Share2, MessageCircle, Send, MoreHorizontal, Check } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Article, Comment } from "../types";

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
  onShare?: (article: Article) => void;
  isDarkMode: boolean;
}

type DbCommentRow = {
  id: string;
  article_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles: {
    display_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
  } | null;
};

function dicebear(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function ArticleView({ article, onBack, onShare, isDarkMode }: ArticleViewProps) {
  const [liked, setLiked] = useState(false);
  const [viewLikes, setViewLikes] = useState(article.likes);

  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(article.commentsCount);

  const [meId, setMeId] = useState<string | null>(null);
  const [myAvatar, setMyAvatar] = useState<string>(dicebear("User"));
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [readingProgress, setReadingProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const bg = isDarkMode ? "bg-black text-white" : "bg-[#FDFBF4] text-[#0B1D33]";

  const canSend = useMemo(() => !!commentText.trim() && !sending, [commentText, sending]);

  const handleLikeMain = () => {
    setLiked((v) => !v);
    setViewLikes((prev) => (liked ? prev - 1 : prev + 1));
    // (opcional) depois a gente persiste like no Supabase
  };

  const handleShare = () => {
    onShare?.(article);
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const denom = Math.max(1, scrollHeight - clientHeight);
    setReadingProgress((scrollTop / denom) * 100);
  };

  async function loadMeAndAvatar() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id ?? null;
    setMeId(uid);

    if (!uid) {
      setMyAvatar(dicebear("Guest"));
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("display_name,nickname,avatar_url")
      .eq("id", uid)
      .maybeSingle();

    const seed = data?.nickname || data?.display_name || "User";
    setMyAvatar(data?.avatar_url?.trim() ? data.avatar_url : dicebear(seed));
  }

  async function loadComments() {
    setLoadErr(null);

    const { data, error } = await supabase
      .from("article_comments")
      .select(
        `
        id, article_id, user_id, body, created_at,
        profiles:profiles ( display_name, nickname, avatar_url )
      `
      )
      .eq("article_id", article.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("loadComments error:", error);
      setLoadErr(error.message ?? "Falha ao carregar comentários.");
      return;
    }

    const rows = (data ?? []) as unknown as DbCommentRow[];
    const mapped: Comment[] = rows.map((r) => {
      const authorName = r.profiles?.nickname || r.profiles?.display_name || "Usuário";
      const avatarSeed = authorName || "User";
      const avatar = r.profiles?.avatar_url?.trim() ? r.profiles.avatar_url : dicebear(avatarSeed);

      return {
        id: r.id,
        author: authorName,
        avatar,
        date: formatDate(r.created_at),
        content: r.body,
        likes: 0,
        reactions: [],
      };
    });

    setComments(mapped);
    setCommentsCount(mapped.length);
  }

  async function sendComment() {
    if (!commentText.trim()) return;

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id ?? null;

    if (!uid) {
      alert("Você precisa estar logado para comentar.");
      return;
    }

    setSending(true);
    setSentOk(false);

    try {
      const body = commentText.trim();

      const { error } = await supabase.from("article_comments").insert({
        article_id: article.id,
        user_id: uid,
        body,
      });

      if (error) throw error;

      setCommentText("");
      setSentOk(true);

      // recarrega lista (e atualiza contador na UI)
      await loadComments();

      setTimeout(() => setSentOk(false), 900);
    } catch (e: any) {
      console.error("sendComment error:", e);
      alert("Não foi possível enviar o comentário.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    loadMeAndAvatar();
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article.id]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`fixed inset-0 z-[80] overflow-y-auto overscroll-behavior-y-contain ${bg}`}
    >
      <div className={`max-w-md mx-auto min-h-screen flex flex-col relative pb-32 ${bg}`}>
        {/* progress */}
        <div className="fixed top-0 left-0 right-0 h-1 z-[100] flex justify-center max-w-md mx-auto pointer-events-none">
          <div
            className={`${isDarkMode ? "bg-yellow-400" : "bg-[#0B1D33]"} h-full transition-all duration-150 ease-out`}
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        {/* top bar */}
        <div
          className={`sticky top-0 z-[90] px-6 py-5 flex justify-between items-center border-b ${
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

        {/* cover */}
        <div className="relative w-full h-[380px] overflow-hidden">
          <img src={article.imageUrl} alt={article.title} className={`w-full h-full object-cover scale-105 ${isDarkMode ? "grayscale-[0.2]" : ""}`} />
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

            <h1 className={`text-3xl font-black leading-[1.1] tracking-tighter ${isDarkMode ? "text-white" : "text-[#0B1D33]"}`}>
              {article.title}
            </h1>
          </div>
        </div>

        {/* meta + like */}
        <div className={`px-8 py-6 flex items-center justify-between border-b ${isDarkMode ? "border-white/5 bg-[#080808]" : "border-[#0B1D33]/5 bg-[#F0F2F5]/30"}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-inner ${isDarkMode ? "bg-yellow-400/20 border-yellow-400/30" : "bg-[#0B1D33]/10 border-[#0B1D33]/20"}`}>
              <span className={`text-sm font-black italic ${isDarkMode ? "text-yellow-400" : "text-[#0B1D33]"}`}>AB</span>
            </div>
            <div>
              <p className={`text-[12px] font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-[#0B1D33]"}`}>{article.author}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{article.date} • ANTAS OFICIAL</p>
            </div>
          </div>

          <button onClick={handleLikeMain} className={`flex flex-col items-center gap-1 transition-all ${liked ? "text-red-500 scale-110" : "text-gray-500 hover:text-white"}`}>
            <div className={`p-2.5 rounded-full ${liked ? "bg-red-500/10" : isDarkMode ? "bg-white/5" : "bg-[#0B1D33]/5"}`}>
              <Heart size={22} fill={liked ? "currentColor" : "none"} strokeWidth={liked ? 0 : 2.5} />
            </div>
            <span className="text-[10px] font-black tabular-nums">{viewLikes}</span>
          </button>
        </div>

        {/* content */}
        <div className="px-8 py-10">
          <p className={`leading-[1.8] text-[15px] font-medium whitespace-pre-wrap selection:bg-yellow-400/30 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            {article.content}
          </p>
        </div>

        {/* comments */}
        <div className={`border-t px-8 pt-12 pb-20 rounded-t-[50px] mt-8 flex-1 transition-all ${isDarkMode ? "bg-[#0c0c0c] border-white/5" : "bg-white border-[#0B1D33]/5"}`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isDarkMode ? "bg-yellow-400/10" : "bg-[#0B1D33]/5"}`}>
                <MessageCircle size={22} className={isDarkMode ? "text-yellow-400" : "text-[#0B1D33]"} strokeWidth={2.5} />
              </div>
              <h3 className={`text-md font-black tracking-widest uppercase ${isDarkMode ? "text-white" : "text-[#0B1D33]"}`}>
                DISCUSSÃO <span className="text-gray-500 ml-1">({commentsCount})</span>
              </h3>
            </div>
          </div>

          {loadErr && (
            <div className="mb-4 text-[12px] font-bold bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-red-500">
              {loadErr}
            </div>
          )}

          {/* input */}
          <div className="flex gap-4 mb-10">
            <div className={`w-11 h-11 rounded-full border-2 overflow-hidden flex-shrink-0 shadow-lg ${isDarkMode ? "bg-gray-900 border-white/5" : "bg-[#F0F2F5] border-[#0B1D33]/5"}`}>
              <img src={myAvatar} alt="You" className="w-full h-full object-cover" />
            </div>

            <div className={`flex-1 rounded-2xl p-1.5 flex items-center border shadow-inner ${
              isDarkMode ? "bg-[#161616] border-white/10 focus-within:border-yellow-400/40" : "bg-[#F0F2F5] border-[#0B1D33]/10 focus-within:border-[#0B1D33]/40"
            }`}>
              <input
                type="text"
                placeholder={meId ? "Participe do debate..." : "Faça login para comentar..."}
                className={`bg-transparent border-none focus:ring-0 text-[13px] font-medium flex-1 px-4 placeholder:text-gray-500 ${
                  isDarkMode ? "text-white" : "text-[#0B1D33]"
                }`}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canSend && sendComment()}
                disabled={!meId || sending}
              />

              <button
                onClick={sendComment}
                disabled={!meId || !canSend}
                className={`p-3 rounded-xl transition-all flex items-center justify-center ${
                  sentOk
                    ? "bg-green-500 text-white"
                    : canSend
                      ? (isDarkMode ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 active:scale-90" : "bg-[#0B1D33] text-white shadow-lg shadow-[#0B1D33]/20 active:scale-90")
                      : "text-gray-400 bg-gray-200/50"
                }`}
              >
                {sentOk ? <Check size={20} strokeWidth={3} /> : <Send size={20} strokeWidth={3} />}
              </button>
            </div>
          </div>

          {/* list */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <div className={`${isDarkMode ? "text-gray-500" : "text-gray-400"} text-sm`}>
                Seja o primeiro a comentar.
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 flex-shrink-0 shadow-lg border-white/5">
                    <img src={c.avatar} alt={c.author} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className={`border rounded-2xl px-5 py-4 ${isDarkMode ? "bg-[#161616] border-white/5" : "bg-[#F0F2F5] border-[#0B1D33]/5"}`}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`${isDarkMode ? "text-white" : "text-[#0B1D33]"} text-xs font-black uppercase tracking-wider`}>
                          {c.author}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{c.date}</span>
                      </div>
                      <p className={`${isDarkMode ? "text-gray-300" : "text-gray-700"} text-[13px] leading-relaxed font-medium`}>
                        {c.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
