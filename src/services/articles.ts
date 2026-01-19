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
  reading_minutes: number;
  likes: number;
  comments_count: number;
  author_id: string | null;
  published: boolean;
  published_at: string;

  // joins
  author: DbAuthor | null;
  article_tags: { tag: DbTag | null }[] | null;
};

function dbCategoryToUi(cat: string): Category {
  // seu enum tem acento, o banco não
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

function toUiArticle(row: DbArticleRow): Article {
  const tags =
    row.article_tags?.map((x) => x.tag?.label).filter(Boolean) as string[] | undefined;

  return {
    id: row.id,
    authorId: row.author?.id ?? row.author_id ?? "unknown",
    category: dbCategoryToUi(row.category),

    title: row.title,
    description: row.excerpt ?? "",
    content: row.content,
    imageUrl: row.cover_url ?? "",

    likes: row.likes ?? 0,
    reactions: [], // se quiser mapear depois
    commentsCount: row.comments_count ?? 0,
    readTime: `${Math.max(1, row.reading_minutes ?? 5)} MIN`,

    author: row.author?.name ?? "Antas",
    date: row.published_at,

    comments: [], // você ainda não está puxando comments aqui
    tags: tags ?? [],
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

  return ((data ?? []) as unknown as DbArticleRow[]).map(toUiArticle);
}
