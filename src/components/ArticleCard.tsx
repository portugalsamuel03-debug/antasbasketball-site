import React, { useEffect, useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Pencil } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Article } from "../types";

type Props = {
  article: Article;
  onClick: () => void;
  onShare?: (a: Article) => void;
  isDarkMode: boolean;
  isAdmin?: boolean;
  onEdit?: (id: string) => void;
};

export default function ArticleCard({ article, onClick, onShare, isDarkMode, isAdmin, onEdit }: Props) {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const [likesCount, setLikesCount] = useState<number>(article.likes ?? 0);

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

  useEffect(() => {
    let alive = true;

    async function loadStates() {
      // counts
      const likesCountRes = await supabase
        .from("article_likes")
        .select("article_id", { count: "exact", head: true })
        .eq("article_id", article.id);

      if (!alive) return;
      setLikesCount(likesCountRes.count ?? (article.likes ?? 0));

      if (!sessionUserId) {
        setLiked(false);
        setSaved(false);
        return;
      }

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
    }

    loadStates();
    return () => {
      alive = false;
    };
  }, [article.id, article.likes, sessionUserId]);

  async function toggleLike(e: React.MouseEvent) {
    e.stopPropagation();

    if (!sessionUserId) {
      alert("Faça login para curtir.");
      return;
    }

    const next = !liked;
    setLiked(next);
    setLikesCount((v) => (next ? v + 1 : Math.max(0, v - 1)));

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
    } catch (err) {
      console.error("toggleLike error:", err);
      // rollback
      setLiked(!next);
      setLikesCount((v) => (next ? Math.max(0, v - 1) : v + 1));
    }
  }

  async function toggleSaved(e: React.MouseEvent) {
    e.stopPropagation();

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
    } catch (err) {
      console.error("toggleSaved error:", err);
      setSaved(!next);
    }
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-[28px] border p-5 mb-5 cursor-pointer transition-all shadow-[0_16px_60px_rgba(0,0,0,0.25)] ${
        isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-black/10 hover:bg-black/5"
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-yellow-400" : "text-[#0B1D33]"}`}>
            {String(article.category)}
          </div>

          <div className={`mt-2 text-lg font-black leading-tight ${isDarkMode ? "text-white" : "text-[#0B1D33]"}`}>
            {article.title}
          </div>

          {article.description ? (
            <div className={`mt-2 text-[12px] font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              {article.description}
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-2">
            {(article.tags ?? []).slice(0, 3).map((t) => (
              <span
                key={t}
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                  isDarkMode ? "bg-white/5 text-gray-300" : "bg-black/5 text-gray-600"
                }`}
              >
                #{t}
              </span>
            ))}
          </div>
        </div>

        <div className="w-[86px] h-[86px] rounded-2xl overflow-hidden border border-white/10 flex-shrink-0">
          <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest ${
              liked ? "text-red-500" : isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-[#0B1D33]"
            }`}
            title="Curtir"
          >
            <Heart size={16} strokeWidth={2.5} fill={liked ? "currentColor" : "none"} />
            <span className="tabular-nums">{likesCount}</span>
          </button>

          <div className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            <MessageCircle size={16} strokeWidth={2.5} />
            <span className="tabular-nums">{article.commentsCount ?? 0}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSaved}
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              saved
                ? "bg-yellow-400 text-black border-yellow-400"
                : isDarkMode
                ? "bg-white/5 text-white border-white/10 hover:bg-white/10"
                : "bg-black/5 text-[#0B1D33] border-black/10 hover:bg-black/10"
            }`}
            title={saved ? "Salvo" : "Salvar"}
          >
            <Bookmark size={16} strokeWidth={2.5} fill={saved ? "currentColor" : "none"} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(article);
            }}
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              isDarkMode ? "bg-white/5 text-white border-white/10 hover:bg-white/10" : "bg-black/5 text-[#0B1D33] border-black/10 hover:bg-black/10"
            }`}
            title="Compartilhar"
          >
            <Share2 size={16} strokeWidth={2.5} />
          </button>

          {isAdmin && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(article.id);
              }}
              className={`p-2 rounded-xl border transition-all active:scale-95 ${
                isDarkMode ? "bg-yellow-400 text-black border-yellow-400" : "bg-[#0B1D33] text-white border-[#0B1D33]"
              }`}
              title="Editar (Admin)"
            >
              <Pencil size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
