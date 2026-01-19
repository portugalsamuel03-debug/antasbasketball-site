// src/services/articles.ts
import { supabase } from "../lib/supabase";

export type DbAuthor = {
  id: string;
  slug: string;
  name: string;
  role_label: string | null;
  avatar_url: string | null;
};

export type DbTag = {
  id: string;
  slug: string;
  label: string;
};

export type DbArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;

  category: string; // "REGRAS", "HISTORIA"...
  subcategory: string | null;

  reading_minutes: number;
  likes: number;
  comments_count: number;

  author_id: string | null;

  published: boolean;
  published_at: string;

  // joins
  author: DbAuthor | null;
  article_tags: Array<{ tag: DbTag | null }> | null;
};

export async function fetchPublishedArticlesJoined(): Promise<DbArticleRow[]> {
  // Observação:
  // - author: join em public.authors via articles.author_id
  // - tags: join N:N via article_tags -> tags
  //
  // Se der erro de relação, o motivo mais comum é o nome da FK.
  // O select abaixo tenta ser “compatível” com o padrão do Supabase.
  const { data, error } = await supabase
    .from("articles")
    .select(
      `
      id, slug, title, excerpt, content, cover_url,
      category, subcategory, reading_minutes, likes, comments_count,
      author_id, published, published_at,
      author:authors ( id, slug, name, role_label, avatar_url ),
      article_tags ( tag:tags ( id, slug, label ) )
    `
    )
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as DbArticleRow[];
}
