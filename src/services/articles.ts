// src/services/articles.ts
import { supabase } from "../lib/supabase";
import { Article, Category } from "../types";

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
  likes: number | null;
  comments_count: number | null;
  author_id: string | null;
  published: boolean;
  published_at: string;

  // joins
  author: DbAuthor | null;
  article_tags: { tag: DbTag | null }[] | null;
};

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80&auto=format&fit=crop";

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
  // mantém simples e estável pro seu UI
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
    (row.article_tags ?? [])
      .map((x) => x?.tag?.label ?? "")
      .filter(Boolean)
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
    reactions: [], // depois dá pra mapear do banco
    commentsCount: row.comments_count ?? 0,
    readTime: `${minutes} MIN`,

    author: row.author?.name ?? "Antas",
    date: formatDateYYYYMMDD(row.published_at),

    comments: [], // ainda não está puxando comments
    tags,
  };
}

export async function fetchPublishedArticlesJoined(): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(
      `
      id, slug, title, excerpt, content, cover_url, category, subcategory,
      reading_minutes, likes, comments_count, author_id, published, published_at,
      author:authors ( id, slug, name, role_label, avatar_url ),
      article_tags ( tag:tags ( id, slug, label ) )
    `
    )
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (error) throw error;

  return (data as unknown as DbArticleRow[]).map(toUiArticle);
}
