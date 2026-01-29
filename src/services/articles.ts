// src/services/articles.ts
import { supabase } from "../lib/supabase";
import { Article, Category, Comment } from "../types";

type DbAuthor = {
  id: string;
  slug: string;
  name: string;
  role_label: string | null;
  avatar_url: string | null;
};

type DbTag = {
  id: string;
  slug: string;
  label: string;
};

type DbArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  category: string;
  subcategory: string | null;
  reading_minutes: number | null;
  video_url: string | null;
  is_featured: boolean;

  // colunas do seu "articles"
  likes: number | null;
  comments_count: number | null;

  author_id: string | null;
  published: boolean;
  published_at: string;

  // joins
  author: DbAuthor | null;
  article_tags: { tag: DbTag | null }[] | null;
};

type DbProfileMini = {
  id: string;
  display_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
};

type DbArticleCommentRow = {
  id: string;
  article_id: string;
  user_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  profiles: DbProfileMini | null;
};

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80&auto=format&fit=crop";

function dicebear(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

function dbCategoryToUi(cat: string): Category {
  switch ((cat ?? "").toUpperCase()) {
    case "INICIO":
      return Category.INICIO;
    case "NOTICIAS":
      return Category.NOTICIAS;
    case "HISTORIA":
      return Category.HISTORIA;
    case "REGRAS":
      return Category.REGRAS;
    case "PODCAST":
      return Category.PODCAST;
    case "STATUS":
      return Category.STATUS;
    default:
      return Category.NOTICIAS;
  }
}

function formatDateYYYYMMDD(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function uniqueStrings(arr: string[]): string[] {
  return Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean)));
}

function toUiArticle(row: DbArticleRow): Article {
  const tags = uniqueStrings(
    (row.article_tags ?? []).map((x) => x?.tag?.label ?? "").filter(Boolean)
  );

  const minutes = Math.max(1, row.reading_minutes ?? 5);

  return {
    id: row.id,
    authorId: row.author?.id ?? row.author_id ?? "unknown",
    category: dbCategoryToUi(row.category),

    title: row.title,
    description: row.excerpt ?? "",
    content: row.content,
    imageUrl: row.cover_url?.trim() ? row.cover_url : FALLBACK_COVER,

    likes: row.likes ?? 0,
    reactions: [],
    commentsCount: row.comments_count ?? 0,
    readTime: `${minutes} MIN`,

    author: row.author?.name ?? "Antas",
    date: formatDateYYYYMMDD(row.published_at),

    comments: [], // carregamos via fetchArticleComments no ArticleView
    tags,
    video_url: row.video_url ?? undefined,
    isFeatured: row.is_featured,
  };
}

export async function fetchPublishedArticlesJoined(): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(
      `
      id, slug, title, excerpt, content, cover_url, category, subcategory,
      reading_minutes, video_url, is_featured, likes, comments_count, author_id, published, published_at,
      author:authors ( id, slug, name, role_label, avatar_url ),
      article_tags ( tag:tags ( id, slug, label ) )
    `
    )
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (error) throw error;

  return (data as unknown as DbArticleRow[]).map(toUiArticle);
}

/**
 * Contexto do viewer (sessão + perfil minimalista)
 */
export async function getViewerContext(): Promise<{
  userId: string | null;
  profile: { displayName: string; nickname: string; avatarUrl: string } | null;
}> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user?.id ?? null;
  if (!userId) return { userId: null, profile: null };

  const { data: p, error } = await supabase
    .from("profiles")
    .select("id,display_name,nickname,avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("getViewerContext profile error:", error.message);
    return { userId, profile: null };
  }

  const displayName = (p?.display_name ?? "").trim();
  const nickname = (p?.nickname ?? "").trim();
  const avatarUrl = (p?.avatar_url ?? "").trim();

  const seed = nickname || displayName || "User";
  return {
    userId,
    profile: {
      displayName: displayName || "Você",
      nickname: nickname || displayName || "Você",
      avatarUrl: avatarUrl || dicebear(seed),
    },
  };
}

/**
 * Verifica se o user já curtiu o artigo
 */
export async function hasLikedArticle(articleId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("article_likes")
    .select("article_id", { head: false })
    .eq("article_id", articleId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.warn("hasLikedArticle error:", error.message);
  }
  return !!data;
}

/**
 * Conta likes (fonte de verdade = tabela article_likes)
 */
export async function getArticleLikesCount(articleId: string): Promise<number> {
  const { count, error } = await supabase
    .from("article_likes")
    .select("*", { count: "exact", head: true })
    .eq("article_id", articleId);

  if (error) throw error;
  return count ?? 0;
}

/**
 * Toggle like do usuário.
 * Retorna: { liked, likesCount }
 */
export async function toggleArticleLike(articleId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
  // checa se existe
  const { data: existing, error: exErr } = await supabase
    .from("article_likes")
    .select("article_id")
    .eq("article_id", articleId)
    .eq("user_id", userId)
    .maybeSingle();

  if (exErr && exErr.code !== "PGRST116") throw exErr;

  if (existing) {
    // remove
    const { error } = await supabase
      .from("article_likes")
      .delete()
      .eq("article_id", articleId)
      .eq("user_id", userId);
    if (error) throw error;

    const likesCount = await getArticleLikesCount(articleId);

    // (opcional) tenta manter coluna articles.likes atualizada (não é fonte de verdade)
    try {
      await supabase.from("articles").update({ likes: likesCount }).eq("id", articleId);
    } catch { }

    return { liked: false, likesCount };
  }

  // insere
  const { error } = await supabase.from("article_likes").insert({ article_id: articleId, user_id: userId });
  if (error) throw error;

  const likesCount = await getArticleLikesCount(articleId);

  try {
    await supabase.from("articles").update({ likes: likesCount }).eq("id", articleId);
  } catch { }

  return { liked: true, likesCount };
}

/**
 * Busca comentários com join no profiles (nickname/avatar)
 */
export async function fetchArticleComments(articleId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("article_comments")
    .select(
      `
      id, article_id, user_id, body, created_at, edited_at,
      profiles:profiles ( id, display_name, nickname, avatar_url )
    `
    )
    .eq("article_id", articleId)
    .eq("article_id", articleId);
  // .order("created_at", { ascending: true }); // Removed to avoid 400 error on ambiguous column

  if (error) throw error;

  const rows = (data ?? []) as unknown as DbArticleCommentRow[];

  // Client-side sort to be safe
  rows.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return rows.map((r) => {
    const nick = (r.profiles?.nickname || r.profiles?.display_name || "Usuário").trim();
    const avatar = (r.profiles?.avatar_url || "").trim() || dicebear(nick || r.user_id);

    return {
      id: r.id,
      userId: r.user_id,
      author: nick,
      avatar,
      content: r.body,
      date: formatDateYYYYMMDD(r.created_at),
      editedAt: r.edited_at ? formatDateYYYYMMDD(r.edited_at) : undefined,
      likes: 0,
      reactions: [],
    } as Comment;
  });
}

/**
 * Adiciona comentário e retorna o comment pronto para UI
 */
export async function addArticleComment(params: {
  articleId: string;
  userId: string;
  body: string;
}): Promise<{ comment: Comment; commentsCount: number }> {
  const body = params.body.trim();
  if (!body) throw new Error("Comentário vazio.");

  const { data: inserted, error } = await supabase
    .from("article_comments")
    .insert({
      article_id: params.articleId,
      user_id: params.userId,
      body,
    })
    .select("id, article_id, user_id, body, created_at")
    .single();

  if (error) throw error;

  // conta comentários (fonte de verdade)
  const { count, error: cErr } = await supabase
    .from("article_comments")
    .select("*", { count: "exact", head: true })
    .eq("article_id", params.articleId);

  if (cErr) throw cErr;
  const commentsCount = count ?? 0;

  // (opcional) mantém articles.comments_count atualizada
  try {
    await supabase.from("articles").update({ comments_count: commentsCount }).eq("id", params.articleId);
  } catch { }

  // pega perfil do autor (pra mostrar certo)
  const { data: p } = await supabase
    .from("profiles")
    .select("display_name,nickname,avatar_url")
    .eq("id", params.userId)
    .maybeSingle();

  const nick = (p?.nickname || p?.display_name || "Você").trim();
  const avatar = (p?.avatar_url || "").trim() || dicebear(nick || params.userId);

  const comment: Comment = {
    id: inserted.id,
    userId: params.userId,
    author: nick,
    avatar,
    content: inserted.body,
    date: formatDateYYYYMMDD(inserted.created_at),
    likes: 0,
    reactions: [],
  } as Comment;

  return { comment, commentsCount };
}
