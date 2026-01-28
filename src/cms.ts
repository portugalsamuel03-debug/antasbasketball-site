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

export type NotificationRow = {
  id: string;
  created_at: string;
  title: string;
  description: string;
  type: string;
  link?: string | null;
  is_global: boolean;
};

export async function listArticles() {
  return supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false });
}

export async function upsertArticle(payload: Partial<ArticleRow>) {
  const isNew = !payload.id || payload.id === "";
  const { data, error } = await supabase.from("articles").upsert(payload).select("*").single();

  if (!error && isNew && data?.published) {
    // Auto-create notification for new published articles
    await createNotification({
      title: data.category.toUpperCase(),
      description: data.title,
      type: 'noticia',
      link: data.id,
      is_global: true
    });
  }

  return { data, error };
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

export async function deleteAuthor(id: string) {
  return supabase.from("authors").delete().eq("id", id);
}

export async function listTags() {
  return supabase.from("tags").select("*").order("label");
}

export async function upsertTag(payload: Partial<TagRow>) {
  return supabase.from("tags").upsert(payload).select("*").single();
}

// Champions
export async function listChampions() {
  return supabase.from("champions").select("*").order("year", { ascending: false });
}
export async function upsertChampion(payload: Partial<any>) {
  return supabase.from("champions").upsert(payload).select("*").single();
}
export async function deleteChampion(id: string) {
  return supabase.from("champions").delete().eq("id", id);
}

// Hall of Fame
export async function listHallOfFame() {
  return supabase.from("hall_of_fame").select("*").order("year_inducted", { ascending: false });
}
export async function upsertHallOfFame(payload: Partial<any>) {
  return supabase.from("hall_of_fame").upsert(payload).select("*").single();
}
export async function deleteHallOfFame(id: string) {
  return supabase.from("hall_of_fame").delete().eq("id", id);
}

// Readers
export async function listFeaturedReaders() {
  return supabase.from("featured_readers").select("*").order("sort_order");
}
export async function upsertFeaturedReader(payload: Partial<any>) {
  return supabase.from("featured_readers").upsert(payload).select("*").single();
}
export async function deleteFeaturedReader(id: string) {
  return supabase.from("featured_readers").delete().eq("id", id);
}

// Tag Definitions
export async function listTagDefinitions() {
  return supabase.from("tag_definitions").select("*").order("label");
}
export async function upsertTagDefinition(payload: Partial<any>) {
  return supabase.from("tag_definitions").upsert(payload).select("*").single();
}
export async function deleteTagDefinition(slug: string) {
  return supabase.from("tag_definitions").delete().eq("slug", slug);
}

// Teams
export async function listTeams() {
  return supabase.from("team_list").select("*").order("name");
}
export async function upsertTeam(payload: Partial<any>) {
  return supabase.from("team_list").upsert(payload).select("*").single();
}
export async function deleteTeam(id: string) {
  return supabase.from("team_list").delete().eq("id", id);
}

// Tag Management Helpers
export async function manageArticleTags(articleId: string, tagLabels: string[]) {
  // 1. Ensure all tags exist and get IDs
  const tagIds: string[] = [];

  for (const label of tagLabels) {
    const slug = label.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]/g, '');
    // Upsert tag
    const { data, error } = await supabase.from('tags').select('id').eq('slug', slug).maybeSingle();

    let tid = data?.id;
    if (!tid) {
      const { data: newTag, error: createErr } = await supabase.from('tags').insert({
        slug,
        label: label.trim()
      }).select('id').single();

      if (createErr) {
        // Try fetching again in case of race condition or just ignore
        console.error("Error creating tag", createErr);
        continue;
      }
      tid = newTag.id;
    }
    if (tid) tagIds.push(tid);
  }

  // 2. Clear existing links
  await supabase.from('article_tags').delete().eq('article_id', articleId);

  // 3. Insert new links
  if (tagIds.length > 0) {
    const links = tagIds.map(tid => ({ article_id: articleId, tag_id: tid }));
    await supabase.from('article_tags').insert(links);
  }
}

export async function getArticleTags(articleId: string) {
  const { data } = await supabase
    .from('article_tags')
    .select(`tag:tags(label)`)
    .eq('article_id', articleId);

  return data?.map((d: any) => d.tag.label) || [];
}

// Notifications
export async function listNotifications() {
  return supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
}

export async function createNotification(payload: Partial<NotificationRow>) {
  return supabase.from("notifications").insert([payload]).select("*").single();
}

export async function deleteNotification(id: string) {
  return supabase.from("notifications").delete().eq("id", id);
}

export async function markAllNotificationsRead() {
  // Ideally this would be server side or per user. 
  // For a simple global system, we can store 'last_read_at' in localStorage
  localStorage.setItem('antas_notifications_last_read', new Date().toISOString());
}
