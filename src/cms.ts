import { supabase } from "./lib/supabase";

export type AuthorRow = {
  id: string;
  slug: string;
  name: string;
  role_label: string | null;
  avatar_url: string | null;
};

export type TagRow = {
  id: string;
  slug: string;
  label: string;
};

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  category: string;
  subcategory: string | null;
  reading_minutes: number;
  author_id: string | null;
  published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
};

export async function listArticles() {
  return supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false });
}

export async function upsertArticle(payload: Partial<ArticleRow>) {
  return supabase.from("articles").upsert(payload).select("*").single();
}

export async function deleteArticle(id: string) {
  return supabase.from("articles").delete().eq("id", id);
}

export async function listAuthors() {
  return supabase.from("authors").select("*").order("name");
}

export async function upsertAuthor(payload: Partial<AuthorRow>) {
  return supabase.from("authors").upsert(payload).select("*").single();
}

export async function listTags() {
  return supabase.from("tags").select("*").order("label");
}

export async function upsertTag(payload: Partial<TagRow>) {
  return supabase.from("tags").upsert(payload).select("*").single();
}
