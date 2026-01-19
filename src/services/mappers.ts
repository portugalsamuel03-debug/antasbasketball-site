import type { Article } from "../types";
import type { DbArticle } from "./articles";

export function dbToArticle(a: DbArticle): Article {
  return {
    id: a.id,
    title: a.title,
    excerpt: a.excerpt ?? "",
    content: a.content,
    imageUrl: a.cover_url ?? "",
    category: a.category as any,
    subCategory: (a.subcategory ?? "ARTIGOS") as any,
    authorId: "antas-oficial",
    author: "Antas Oficial",
    authorInitials: "AB",
    date: a.published_at,
    readTime: `${a.reading_minutes ?? 5} min`,
    tags: [], // depois a gente puxa via join
    likes: a.likes ?? 0,
    commentsCount: a.comments_count ?? 0,
  };
}
