import { supabase } from "./lib/supabase";
import { CategoryRow, SubcategoryRow } from "./types";

export type AuthorRow = {
  id: string;
  slug: string;
  name: string;
  role_label: string | null;
  avatar_url: string | null;
  bio?: string | null;
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
  video_url: string | null;
  is_featured: boolean;
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
  console.log("CMS: Starting upsertArticle", payload);
  try {
    const isNew = !payload.id || payload.id === "";

    // UI mapping: strip accents from category if needed
    if (payload.category) {
      const catMap: Record<string, string> = {
        'INÍCIO': 'INICIO',
        'NOTÍCIAS': 'NOTICIAS',
        'HISTÓRIA': 'HISTORIA',
        'REGRAS': 'REGRAS',
        'PODCAST': 'PODCAST',
        'STATUS': 'STATUS'
      };
      const mapped = catMap[payload.category.toUpperCase()];
      if (mapped) payload.category = mapped;
      else payload.category = payload.category.toUpperCase();
    }

    console.log("CMS: Construction of payload complete. Category mapped to:", payload.category);
    console.log("CMS: Calling upsert...");
    const { data, error } = await supabase.from("articles").upsert(payload).select("*").single();

    if (error) {
      console.error("CMS: Upsert error", error);
      return { data: null, error };
    }

    console.log("CMS: Upsert success", data.id);

    if (isNew && data?.published) {
      console.log("CMS: Creating notification for new article...");
      try {
        await createNotification({
          title: data.category.toUpperCase(),
          description: data.title,
          type: 'noticia',
          link: data.id,
          is_global: true
        });
        console.log("CMS: Notification created.");
      } catch (e) {
        console.warn("CMS: Failed to create notification", e);
      }
    }

    return { data, error: null };
  } catch (err) {
    console.error("CMS: Critical error in upsertArticle", err);
    return { data: null, error: err };
  }
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
// Champions
export async function listChampions() {
  return supabase.from("champions")
    .select("*, manager:managers!manager_id(id, name, image_url), runner_up_team:teams!runner_up_team_id(id, name, logo_url), runner_up_manager:managers!runner_up_manager_id(id, name, image_url)")
    .order("year", { ascending: false });
}
export async function upsertChampion(payload: Partial<any>) {
  return supabase.from("champions").upsert(payload)
    .select("*, manager:managers!manager_id(id, name, image_url), runner_up_team:teams!runner_up_team_id(id, name, logo_url), runner_up_manager:managers!runner_up_manager_id(id, name, image_url)")
    .single();
}
export async function deleteChampion(id: string) {
  return supabase.from("champions").delete().eq("id", id);
}

// Managers Helper
export async function listManagers() {
  return supabase.from("managers").select("*").order("name");
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

export async function deleteFeaturedReader(id: string) {
  return supabase.from("featured_readers").delete().eq("id", id);
}

export async function listRankedReaders() {
  console.log("CMS: Fetching ranked readers activity");
  // Limit selection to user_id to avoid large payloads, and limit total rows if possible
  const { data: likes, error: lErr } = await supabase.from('article_likes').select('user_id').limit(1000);
  const { data: comments, error: cErr } = await supabase.from('article_comments').select('user_id').limit(1000);

  if (lErr || cErr) console.warn("CMS: Error fetching participation", lErr, cErr);

  const stats: Record<string, { likes: number, comments: number }> = {};

  likes?.forEach(l => {
    if (!stats[l.user_id]) stats[l.user_id] = { likes: 0, comments: 0 };
    stats[l.user_id].likes++;
  });

  comments?.forEach(c => {
    if (!stats[c.user_id]) stats[c.user_id] = { likes: 0, comments: 0 };
    stats[c.user_id].comments++;
  });

  const sortedIds = Object.keys(stats).sort((a, b) => {
    const scoreA = stats[a].likes + stats[a].comments * 2;
    const scoreB = stats[b].likes + stats[b].comments * 2;
    return scoreB - scoreA;
  }).slice(0, 10);

  if (sortedIds.length === 0) return { data: [], error: null };

  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, display_name, nickname, avatar_url')
    .in('id', sortedIds);

  if (pErr) console.warn("CMS: Error fetching profiles for ranking", pErr);

  const result = sortedIds.map(id => {
    const p = profiles?.find(x => x.id === id);
    const s = stats[id];
    return {
      id,
      name: p?.nickname || p?.display_name || 'Atleta',
      avatar_url: p?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
      posts_read: s.likes,
      comments_made: s.comments,
      likes_given: s.likes,
      rank_label: s.likes + s.comments > 10 ? 'VETERANO' : 'CALOURO',
      is_verified: s.likes + s.comments > 20,
      sort_order: 0
    };
  });

  return { data: result, error: null };
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

// Teams
export async function listTeams() {
  return supabase.from("teams").select("*, manager:managers(id, name, image_url)").order("name", { ascending: true });
}

export async function getTeam(id: string) {
  return supabase.from("teams").select("*").eq("id", id).single();
}

export async function upsertTeam(payload: Partial<import("./types").TeamRow>) {
  if (payload.id) {
    return supabase.from("teams").update(payload).eq("id", payload.id).select("*").single();
  }
  return supabase.from("teams").insert([payload]).select("*").single();
}

export async function deleteTeam(id: string) {
  return supabase.from("teams").delete().eq("id", id);
}

// Awards
export async function listAwards() {
  return supabase
    .from("awards")
    .select(`
      *,
      team:teams(id, name, gm_name, logo_url),
      manager:managers(id, name, image_url)
    `)
    .order("year", { ascending: false });
}

export async function getAward(id: string) {
  return supabase
    .from("awards")
    .select(`
      *,
      team:teams(id, name, gm_name, logo_url)
    `)
    .eq("id", id)
    .single();
}

export async function upsertAward(payload: Partial<import("./types").AwardRow>) {
  if (payload.id) {
    return supabase.from("awards").update(payload).eq("id", payload.id).select("*").single();
  }
  return supabase.from("awards").insert([payload]).select("*").single();
}

export async function deleteAward(id: string) {
  return supabase.from("awards").delete().eq("id", id);
}

// Trades
export async function listTrades() {
  return supabase
    .from("trades")
    .select(`
      *,
      team_a:team_a_id(id, name, gm_name, logo_url),
      team_b:team_b_id(id, name, gm_name, logo_url)
    `)
    .order("date", { ascending: false });
}

export async function getTrade(id: string) {
  return supabase
    .from("trades")
    .select(`
      *,
      team_a:team_a_id(id, name, gm_name, logo_url),
      team_b:team_b_id(id, name, gm_name, logo_url)
    `)
    .eq("id", id)
    .single();
}

export async function upsertTrade(payload: Partial<import("./types").TradeRow>) {
  if (payload.id) {
    return supabase.from("trades").update(payload).eq("id", payload.id).select("*").single();
  }
  return supabase.from("trades").insert([payload]).select("*").single();
}

export async function deleteTrade(id: string) {
  return supabase.from("trades").delete().eq("id", id);
}

// Categories & Subcategories
export async function listCategories() {
  return supabase.from("categories").select("*").order("sort_order", { ascending: true });
}

export async function upsertCategory(payload: Partial<CategoryRow>) {
  if (payload.id) {
    return supabase.from("categories").update(payload).eq("id", payload.id).select("*").single();
  }
  return supabase.from("categories").insert([payload]).select("*").single();
}

export async function deleteCategory(id: string) {
  return supabase.from("categories").delete().eq("id", id);
}

export async function listSubcategories(categoryId: string) {
  return supabase.from("subcategories").select("*").eq("category_id", categoryId).order("sort_order", { ascending: true });
}

export async function upsertSubcategory(payload: Partial<SubcategoryRow>) {
  if (payload.id) {
    return supabase.from("subcategories").update(payload).eq("id", payload.id).select("*").single();
  }
  return supabase.from("subcategories").insert([payload]).select("*").single();
}

export async function deleteSubcategory(id: string) {
  return supabase.from("subcategories").delete().eq("id", id);
}

// Fetch featured article for Home
export async function getFeaturedArticle() {
  return supabase
    .from("articles")
    .select(`
      id, slug, title, excerpt, content, cover_url, category, subcategory,
      reading_minutes, video_url, is_featured, likes, comments_count, author_id, published, published_at,
      author:authors ( id, slug, name, role_label, avatar_url ),
      article_tags ( tag:tags ( id, slug, label ) )
    `)
    .eq("is_featured", true)
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .single();
}

// Comments
export async function updateComment(id: string, body: string) {
  return supabase
    .from("article_comments")
    .update({ body, edited_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
}


export async function deleteComment(id: string) {
  return supabase.from("article_comments").delete().eq("id", id);
}


// Static Content
export async function getStaticContent(key: string) {
  const { data, error } = await supabase.from('static_content').select('content').eq('key', key).single();
  if (error) return null;
  return data.content;
}

export async function updateStaticContent(key: string, content: any) {
  return supabase.from('static_content').upsert({ key, content, updated_at: new Date().toISOString() }).select();
}


