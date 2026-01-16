import { supabase } from "../lib/supabase";

export type DbArticle = {
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
  published_at: string;
  published: boolean;
};

export async function fetchArticles(): Promise<DbArticle[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
