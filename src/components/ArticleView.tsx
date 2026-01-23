import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Heart, Share2, MessageCircle, Send, MoreHorizontal, Check } from "lucide-react";
import { Article, Comment } from "../types";
import { supabase } from "../lib/supabase";

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
  onShare?: (article: Article) => void;
  isDarkMode: boolean;
}

const ArticleView: React.FC<ArticleViewProps> = ({ article, onBack, onShare, isDarkMode }) => {
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(article.commentsCount);
  const containerRef = useRef<HTMLDivElement>(null);

  async function loadComments() {
    const { data, error } = await supabase
      .from("article_comments")
      .select("id, body, created_at, profiles(display_name, avatar_url)")
      .eq("article_id", article.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      const mapped = data.map((c: any) => ({
        id: c.id,
        author: c.profiles?.display_name || "Usuário",
        avatar: c.profiles?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=User",
        content: c.body,
        date: new Date(c.created_at).toLocaleDateString(),
        likes: 0,
        reactions: [],
      }));
      setComments(mapped);
    }
  }

  useEffect(() => {
    loadComments();
  }, []);

  const handleSendComment = async () => {
    if (!commentText.trim() || sending) return;

    try {
      setSending(true);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        alert("Você precisa estar logado para comentar.");
        return;
      }

      const { error } = await supabase.from("article_comments").insert({
        article_id: article.id,
        user_id: user.id,
        body: commentText.trim(),
      });

      if (error) throw error;

      setCommentText("");
      setCommentsCount((c) => c + 1);
      await loadComments();
    } catch (e) {
      console.error("sendComment error:", e);
      alert("Não foi possível enviar o comentário.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div ref={containerRef} className={`fixed inset-0 z-[80] overflow-y-auto ${isDarkMode ? "bg-black" : "bg-white"}`}>
      <div className="max-w-md mx-auto pb-32">
        <div className="sticky top-0 flex justify-between items-center p-4 border-b bg-black/80">
          <button onClick={onBack}><ArrowLeft /></button>
          <div className="flex gap-2">
            <button onClick={() => onShare?.(article)}><Share2 /></button>
            <button><MoreHorizontal /></button>
          </div>
        </div>

        <img src={article.imageUrl} className="w-full h-64 object-cover" />

        <div className="p-6">
          <h1 className="text-2xl font-bold">{article.title}</h1>
          <p className="mt-4 whitespace-pre-wrap">{article.content}</p>
        </div>

        <div className="border-t p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle />
            <strong>Discussão ({commentsCount})</strong>
          </div>

          <div className="flex gap-3 mb-6">
            <input
              className="flex-1 border rounded-xl px-4 py-2"
              placeholder="Escreva um comentário..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
            />
            <button
              onClick={handleSendComment}
              disabled={sending}
              className="bg-yellow-400 text-black rounded-xl px-4"
            >
              {sending ? <Check /> : <Send />}
            </button>
          </div>

          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <img src={c.avatar} className="w-10 h-10 rounded-full" />
                <div>
                  <div className="font-bold text-sm">{c.author}</div>
                  <div className="text-sm">{c.content}</div>
                  <div className="text-xs text-gray-400">{c.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleView;
