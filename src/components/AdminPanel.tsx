// src/components/AdminPanel.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  deleteArticle,
  listArticles,
  listAuthors,
  listTags,
  upsertArticle,
  upsertAuthor,
  ArticleRow,
  AuthorRow,
  TagRow,
} from "../cms";
import { supabase } from "../lib/supabase";

type Tab = "VISÕES" | "POSTS" | "AUTORES" | "TAGS" | "CATEGORIAS";

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getSearchParam(name: string) {
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

function setSearchParam(name: string, value: string | null) {
  try {
    const url = new URL(window.location.href);
    if (value === null || value === "") url.searchParams.delete(name);
    else url.searchParams.set(name, value);
    window.history.replaceState({}, "", url.toString());
  } catch {
    // ignore
  }
}

function toDatetimeLocal(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function fromDatetimeLocal(v: string) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

const DEFAULT_VIEWS = ["REGRAS", "NOTICIAS", "HISTORIA", "PODCAST"] as const;
type ViewCategory = (typeof DEFAULT_VIEWS)[number];

const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<Tab>("VISÕES");

  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [authors, setAuthors] = useState<AuthorRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [editing, setEditing] = useState<Partial<ArticleRow> | null>(null);
  const [authorEditing, setAuthorEditing] = useState<Partial<AuthorRow> | null>(null);

  // TAGS editor (aba TAGS)
  const [tagEditing, setTagEditing] = useState<Partial<TagRow> | null>(null);

  // CATEGORIES editor (aba CATEGORIAS)
  const [categoryEditing, setCategoryEditing] = useState<Partial<CategoryRow> | null>(null);

  // tags do post (editor POSTS)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loadingPostTags, setLoadingPostTags] = useState(false);

  // preview do post
  const [postMode, setPostMode] = useState<"EDIT" | "PREVIEW">("EDIT");

  // filtros (lista de posts)
  const [q, setQ] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [filterTagId, setFilterTagId] = useState<string>("ALL");

  // cache article_id -> tagIds
  const [articleTagMap, setArticleTagMap] = useState<Map<string, string[]>>(new Map());
  const [loadingTagMap, setLoadingTagMap] = useState(false);

  // quick category create (no editor post)
  const [quickCategoryOpen, setQuickCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");

  // quick tag create (inline no editor post)
  const [tagQuickOpen, setTagQuickOpen] = useState(false);
  const [tagQuickLabel, setTagQuickLabel] = useState("");
  const [tagQuickSlug, setTagQuickSlug] = useState("");

  const authorById = useMemo(() => {
    const m = new Map<string, AuthorRow>();
    authors.forEach((x) => m.set(x.id, x));
    return m;
  }, [authors]);

  const tagById = useMemo(() => {
    const m = new Map<string, TagRow>();
    tags.forEach((t) => m.set(t.id, t));
    return m;
  }, [tags]);

  const categoryOptions = useMemo(() => {
    const active = categories.filter((c) => c.is_active !== false);
    const fromDb = active
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((c) => c.name);

    const fromArticles = Array.from(new Set(articles.map((a) => a.category).filter(Boolean))) as string[];
    const merged = Array.from(new Set([...fromDb, ...fromArticles, ...DEFAULT_VIEWS]));
    return merged.filter(Boolean);
  }, [categories, articles]);

  const subcategoryOptions = useMemo(() => {
    const cat = editing?.category || "";
    const subs = articles
      .filter((a) => (cat ? a.category === cat : true))
      .map((a) => a.subcategory)
      .filter(Boolean) as string[];

    return Array.from(new Set(subs)).sort();
  }, [articles, editing?.category]);

  async function refreshAll() {
    setLoading(true);
    setMsg(null);

    const [a, au, t] = await Promise.all([listArticles(), listAuthors(), listTags()]);
    if (a.error) console.error(a.error);
    if (au.error) console.error(au.error);
    if (t.error) console.error(t.error);

    const nextArticles = ((a.data as any) ?? []) as ArticleRow[];
    const nextAuthors = ((au.data as any) ?? []) as AuthorRow[];
    const nextTags = ((t.data as any) ?? []) as TagRow[];

    setArticles(nextArticles);
    setAuthors(nextAuthors);
    setTags(nextTags);

    // categories direto do Supabase
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,slug,icon,sort_order,is_active")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setCategories((data as any) ?? []);
    } catch (e) {
      console.warn("Falha ao carregar categories:", e);
      setCategories([]);
    }

    setLoading(false);

    const editId = getSearchParam("edit");
    if (editId) {
      const found = nextArticles.find((x) => x.id === editId);
      if (found) {
        setTab("POSTS");
        setEditing(found);
      } else {
        setSearchParam("edit", null);
      }
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // map article -> tags (pra filtro e chips)
  async function loadTagMapForArticles(articleIds: string[]) {
    if (!articleIds.length) {
      setArticleTagMap(new Map());
      return;
    }

    setLoadingTagMap(true);
    try {
      const { data, error } = await supabase
        .from("article_tags")
        .select("article_id,tag_id")
        .in("article_id", articleIds);

      if (error) throw error;

      const m = new Map<string, string[]>();
      ((data as any[]) ?? []).forEach((row) => {
        const aId = row.article_id as string;
        const tId = row.tag_id as string;
        if (!aId || !tId) return;
        const cur = m.get(aId) ?? [];
        cur.push(tId);
        m.set(aId, cur);
      });

      setArticleTagMap(m);
    } catch (e: any) {
      console.warn("loadTagMapForArticles error:", e?.message ?? e);
      setArticleTagMap(new Map());
    } finally {
      setLoadingTagMap(false);
    }
  }

  useEffect(() => {
    loadTagMapForArticles(articles.map((a) => a.id).filter(Boolean));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articles]);

  function openEdit(a: ArticleRow) {
    setTab("POSTS");
    setEditing(a);
    setPostMode("EDIT");
    setSearchParam("admin", "1");
    setSearchParam("edit", a.id);
  }

  function closeEdit() {
    setEditing(null);
    setSelectedTagIds([]);
    setTagQuickOpen(false);
    setPostMode("EDIT");
    setSearchParam("edit", null);
  }

  async function loadArticleTags(articleId: string) {
    setLoadingPostTags(true);
    try {
      const { data, error } = await supabase.from("article_tags").select("tag_id").eq("article_id", articleId);
      if (error) throw error;
      const ids = ((data as any[]) ?? []).map((x) => x.tag_id).filter(Boolean);
      setSelectedTagIds(ids);
    } catch {
      setSelectedTagIds([]);
    } finally {
      setLoadingPostTags(false);
    }
  }

  useEffect(() => {
    if (!editing?.id) return;
    loadArticleTags(editing.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id]);

  async function syncArticleTags(articleId: string, tagIds: string[]) {
    await supabase.from("article_tags").delete().eq("article_id", articleId);
    if (!tagIds.length) return;

    const payload = tagIds.map((tagId) => ({ article_id: articleId, tag_id: tagId }));
    const { error } = await supabase.from("article_tags").insert(payload);
    if (error) throw error;
  }

  // ---------- POSTS ----------
  async function saveArticle() {
    if (!editing) return;

    if (!editing.title || !editing.category || !editing.content) {
      setMsg("Preencha pelo menos: título, categoria e conteúdo.");
      return;
    }

    setMsg(null);
    try {
      const payload: Partial<ArticleRow> = {
        ...editing,
        slug: editing.slug?.trim() || slugify(editing.title),
        published: editing.published ?? true,
        reading_minutes: Number(editing.reading_minutes ?? 5),
        published_at: editing.published_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString() as any,
      };

      const { data, error } = await upsertArticle(payload);
      if (error) throw error;

      const saved = (data as any) as ArticleRow;
      if (saved?.id) await syncArticleTags(saved.id, selectedTagIds);

      setMsg("Artigo salvo ✅");
      closeEdit();
      await refreshAll();
    } catch (e: any) {
      console.error("saveArticle error:", e);
      setMsg(e?.message ? `Erro ao salvar artigo: ${e.message}` : "Erro ao salvar artigo.");
    }
  }

  async function removeArticle(id: string) {
    if (!confirm("Apagar este artigo?")) return;

    setMsg(null);
    try {
      await supabase.from("article_tags").delete().eq("article_id", id);
      const { error } = await deleteArticle(id);
      if (error) throw error;

      setMsg("Apagado ✅");
      if (getSearchParam("edit") === id) setSearchParam("edit", null);
      await refreshAll();
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message ?? "Erro ao apagar.");
    }
  }

  async function quickTogglePublish(a: ArticleRow) {
    setMsg(null);
    try {
      const payload: Partial<ArticleRow> = {
        id: a.id,
        published: !a.published,
        updated_at: new Date().toISOString() as any,
        published_at: a.published_at ?? new Date().toISOString(),
      };
      const { error } = await upsertArticle(payload);
      if (error) throw error;
      await refreshAll();
      setMsg(!a.published ? "Publicado ✅" : "Virou rascunho ✅");
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message ?? "Erro ao alternar publicação.");
    }
  }

  async function quickDuplicate(a: ArticleRow) {
    setMsg(null);
    try {
      const now = new Date().toISOString();
      const payload: Partial<ArticleRow> = {
        title: `${a.title} (cópia)`,
        slug: `${a.slug}-copia-${Math.floor(Math.random() * 9999)}`,
        excerpt: a.excerpt ?? null,
        content: a.content ?? "",
        cover_url: a.cover_url ?? null,
        category: a.category,
        subcategory: a.subcategory ?? null,
        reading_minutes: a.reading_minutes ?? 5,
        author_id: a.author_id ?? null,
        published: false,
        published_at: now,
        created_at: now as any,
        updated_at: now as any,
      };

      const { data, error } = await upsertArticle(payload);
      if (error) throw error;

      const created = (data as any) as ArticleRow;
      if (created?.id) {
        const tagIds = articleTagMap.get(a.id) ?? [];
        await syncArticleTags(created.id, tagIds);
      }

      await refreshAll();
      setMsg("Cópia criada (rascunho) ✅");
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message ?? "Erro ao duplicar.");
    }
  }

  function openNewPost(category?: string) {
    setSearchParam("admin", "1");
    setSearchParam("edit", null);
    setSelectedTagIds([]);
    setTagQuickOpen(false);
    setPostMode("EDIT");
    setTab("POSTS");
    setEditing({
      title: "",
      slug: "",
      category: category ?? categoryOptions[0] ?? "NOTICIAS",
      subcategory: "",
      excerpt: "",
      content: "",
      cover_url: "",
      published: true,
      reading_minutes: 5,
      published_at: new Date().toISOString(),
      author_id: authors[0]?.id ?? null,
    });
  }

  // ---------- AUTORES ----------
  async function saveAuthor() {
    if (!authorEditing?.name) return setMsg("Autor precisa de nome.");

    setMsg(null);
    try {
      const payload: Partial<AuthorRow> = {
        ...authorEditing,
        slug: authorEditing.slug?.trim() || slugify(authorEditing.name),
        updated_at: new Date().toISOString() as any,
      };

      const { error } = await upsertAuthor(payload);
      if (error) throw error;

      setMsg("Autor salvo ✅");
      setAuthorEditing(null);
      await refreshAll();
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message ?? "Erro ao salvar autor.");
    }
  }

  // ---------- TAGS (UPGRADE #1) ----------
  async function saveTag() {
    setMsg(null);

    const rawLabel = (tagEditing?.label ?? "").trim();
    if (!rawLabel) return setMsg("Tag precisa de label.");

    const label = rawLabel.toUpperCase();
    const slug = (tagEditing?.slug ?? "").trim() || slugify(rawLabel);

    try {
      const payload = {
        id: tagEditing?.id ?? undefined,
        label,
        slug,
      };

      const { error } = await supabase.from("tags").upsert(payload, { onConflict: "id" }).select();
      if (error) throw error;

      setMsg("Tag salva ✅");
      setTagEditing(null);
      await refreshAll();
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message ?? "Erro ao salvar tag.");
    }
  }

  async function removeTag(tagId: string) {
    if (!confirm("Apagar esta TAG? Isso remove também os vínculos nos posts.")) return;

    setMsg(null);
    try {
      // remove vínculos primeiro
      const { error: relErr } = await supabase.from("article_tags").delete().eq("tag_id", tagId);
      if (relErr) throw relErr;

      const { error } = await supabase.from("tags").delete().eq("id", tagId);
      if (error) throw error;

      setMsg("Tag apagada ✅");
      if (tagEditing?.id === tagId) setTagEditing(null);
      await refreshAll();
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message ?? "Erro ao apagar tag.");
    }
  }

  async function quickCreateTag() {
    setMsg(null);

    const rawLabel = tagQuickLabel.trim();
    if (!rawLabel) return setMsg("Digite o label da tag.");

    const label = rawLabel.toUpperCase();
    const slug = tagQuickSlug.trim() || slugify(rawLabel);

    try {
      const { data, error } = await supabase.from("tags").insert({ label, slug }).select("*").single();
      if (error) throw error;

      setTagQuickOpen(false);
      setTagQuickLabel("");
      setTagQuickSlug("");

      await refreshAll();
      if (data?.id) setSelectedTagIds((prev) => Array.from(new Set([...prev, data.id])));
      setMsg("Tag criada ✅");
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message ?? "Erro ao criar tag.");
    }
  }

  // ---------- CATEGORIAS (UPGRADE #2) ----------
  async function saveCategory() {
    setMsg(null);
    const name = (categoryEditing?.name ?? "").trim();
    if (!name) return setMsg("Categoria precisa de nome.");

    try {
      const payload = {
        id: categoryEditing?.id ?? undefined,
        name,
        slug: (categoryEditing?.slug ?? "").trim() || slugify(name),
        icon: (categoryEditing?.icon ?? "").trim() || null,
        sort_order: Number(categoryEditing?.sort_order ?? 0),
        is_active: categoryEditing?.is_active ?? true,
      };

      const { error } = await supabase.from("categories").upsert(payload, { onConflict: "id" }).select();
      if (error) throw error;

      setMsg("Categoria salva ✅");
      setCategoryEditing(null);
      await refreshAll();
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message ?? "Erro ao salvar categoria.");
    }
  }

  async function toggleCategoryActive(cat: CategoryRow) {
    setMsg(null);
    try {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: !cat.is_active })
        .eq("id", cat.id);

      if (error) throw error;
      setMsg(!cat.is_active ? "Categoria ativada ✅" : "Categoria desativada ✅");
      await refreshAll();
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message ?? "Erro ao alterar categoria.");
    }
  }

  // quick add category (editor post)
  async function quickAddCategory() {
    setMsg(null);
    const name = newCategoryName.trim();
    if (!name) return setMsg("Digite o nome da categoria.");

    try {
      const slug = slugify(name);
      const icon = newCategoryIcon.trim() || null;

      const { error } = await supabase.from("categories").insert({
        name,
        slug,
        icon,
        sort_order: 0,
        is_active: true,
      });

      if (error) throw error;

      setQuickCategoryOpen(false);
      setNewCategoryName("");
      setNewCategoryIcon("");
      setMsg("Categoria criada ✅");

      if (editing) setEditing({ ...editing, category: name });

      await refreshAll();
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message ?? "Erro ao criar categoria.");
    }
  }

  // ---------- LISTAS / VISÕES ----------
  const input =
    "w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-yellow-400/40";
  const label =
    "text-[10px] font-black uppercase tracking-widest text-gray-400";

  const postsSorted = useMemo(() => {
    return [...articles].sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
  }, [articles]);

  const filteredPosts = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return postsSorted.filter((a) => {
      if (filterCategory !== "ALL" && a.category !== filterCategory) return false;

      if (filterStatus === "PUBLISHED" && !a.published) return false;
      if (filterStatus === "DRAFT" && a.published) return false;

      if (filterTagId !== "ALL") {
        const tIds = articleTagMap.get(a.id) ?? [];
        if (!tIds.includes(filterTagId)) return false;
      }

      if (!qq) return true;
      const blob = `${a.title ?? ""} ${a.slug ?? ""} ${a.excerpt ?? ""}`.toLowerCase();
      return blob.includes(qq);
    });
  }, [postsSorted, q, filterCategory, filterStatus, filterTagId, articleTagMap]);

  const viewCounts = useMemo(() => {
    const m = new Map<string, number>();
    DEFAULT_VIEWS.forEach((c) => m.set(c, 0));
    articles.forEach((a) => {
      if (DEFAULT_VIEWS.includes(a.category as any)) {
        m.set(a.category, (m.get(a.category) ?? 0) + 1);
      }
    });
    return m;
  }, [articles]);

  function openView(category: ViewCategory) {
    setTab("POSTS");
    setFilterCategory(category);
    setFilterStatus("ALL");
    setFilterTagId("ALL");
    setQ("");
  }

  // ---------- PREVIEW (UPGRADE #3) ----------
  const previewData = useMemo(() => {
    if (!editing) return null;

    const authorName =
      authorById.get(editing.author_id ?? "")?.name ?? "Sem autor";

    const cover = (editing.cover_url ?? "").trim();
    const cat = (editing.category ?? "").trim();
    const sub = (editing.subcategory ?? "").trim();
    const title = (editing.title ?? "").trim() || "Sem título";
    const excerpt = (editing.excerpt ?? "").trim();
    const content = (editing.content ?? "").trim();

    const tLabels = (selectedTagIds ?? [])
      .map((id) => tagById.get(id)?.label)
      .filter(Boolean) as string[];

    const publishedAtText = editing.published_at
      ? toDatetimeLocal(editing.published_at).replace("T", " ")
      : "—";

    return {
      cover,
      cat,
      sub,
      title,
      excerpt,
      content,
      authorName,
      publishedAtText,
      tLabels,
      published: !!editing.published,
      reading: Number(editing.reading_minutes ?? 5),
    };
  }, [editing, authorById, selectedTagIds, tagById]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6 text-white">
        <div className="text-sm font-black uppercase tracking-widest text-yellow-400">Admin</div>
        <div className="mt-3 text-gray-400">Carregando…</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-yellow-400">Painel Admin</div>
          <div className="text-[11px] text-gray-400 mt-1">
            Abra com <span className="text-yellow-400 font-bold">/?admin=1</span>
          </div>
        </div>
        <button
          className="text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-3 rounded-2xl"
          onClick={refreshAll}
        >
          Atualizar
        </button>
      </div>

      {msg && (
        <div className="mt-4 text-[12px] font-bold bg-yellow-400/10 border border-yellow-400/30 rounded-2xl px-4 py-3 text-yellow-200">
          {msg}
        </div>
      )}

      <div className="flex gap-2 mt-6 flex-wrap">
        {(["VISÕES", "POSTS", "AUTORES", "TAGS", "CATEGORIAS"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              tab === t ? "bg-yellow-400 text-black border-yellow-400" : "bg-white/5 text-gray-300 border-white/10"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* VISÕES */}
      {tab === "VISÕES" && (
        <div className="mt-6 space-y-4">
          <div className="text-[11px] text-gray-400">
            Atalhos por categoria (REGRAS = <b>articles.category</b>).
          </div>

          <div className="grid grid-cols-2 gap-3">
            {DEFAULT_VIEWS.map((c) => (
              <button
                key={c}
                onClick={() => openView(c)}
                className="bg-white/5 border border-white/10 rounded-[24px] p-4 text-left hover:bg-white/10 transition"
              >
                <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400">{c}</div>
                <div className="text-2xl font-black mt-2 tabular-nums">{viewCounts.get(c) ?? 0}</div>
                <div className="text-[11px] text-gray-400 mt-1">itens</div>
              </button>
            ))}
          </div>

          <button
            onClick={() => openNewPost("REGRAS")}
            className="w-full bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
          >
            Novo item em REGRAS
          </button>
        </div>
      )}

      {/* POSTS */}
      {tab === "POSTS" && (
        <div className="mt-6 space-y-4">
          <button
            onClick={() => openNewPost()}
            className="w-full bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
          >
            Novo Post
          </button>

          {/* filtros */}
          <div className="bg-white/5 border border-white/10 rounded-[24px] p-4 space-y-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Filtros</div>

            <input
              className={input}
              placeholder="Buscar por título / slug / excerpt..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className={label}>Categoria</div>
                <select className={input} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="ALL">Todas</option>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className={label}>Status</div>
                <select className={input} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
                  <option value="ALL">Todos</option>
                  <option value="PUBLISHED">Publicado</option>
                  <option value="DRAFT">Rascunho</option>
                </select>
              </div>
            </div>

            <div>
              <div className={label}>Tag</div>
              <select className={input} value={filterTagId} onChange={(e) => setFilterTagId(e.target.value)}>
                <option value="ALL">Todas</option>
                {tags
                  .slice()
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
              </select>
              {loadingTagMap && <div className="text-[11px] text-gray-400 mt-2">Carregando tags…</div>}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setQ("");
                  setFilterCategory("ALL");
                  setFilterStatus("ALL");
                  setFilterTagId("ALL");
                }}
                className="flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10"
              >
                Limpar
              </button>
              <div className="flex-1 text-right text-[11px] text-gray-400 flex items-center justify-end">
                {filteredPosts.length} resultado(s)
              </div>
            </div>
          </div>

          {/* editor */}
          {editing && (
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Editar post</div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPostMode("EDIT")}
                    className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                      postMode === "EDIT"
                        ? "bg-yellow-400 text-black border-yellow-400"
                        : "bg-white/5 border-white/10 text-gray-200"
                    }`}
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => setPostMode("PREVIEW")}
                    className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                      postMode === "PREVIEW"
                        ? "bg-yellow-400 text-black border-yellow-400"
                        : "bg-white/5 border-white/10 text-gray-200"
                    }`}
                    disabled={!editing.title && !editing.content}
                  >
                    Preview
                  </button>

                  <button
                    onClick={closeEdit}
                    className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              {postMode === "PREVIEW" && previewData ? (
                <div className="space-y-4">
                  <div className="rounded-[24px] overflow-hidden border border-white/10 bg-black/20">
                    {previewData.cover ? (
                      <img src={previewData.cover} className="w-full h-[220px] object-cover" alt="cover" />
                    ) : (
                      <div className="w-full h-[220px] flex items-center justify-center text-gray-400 text-sm">
                        Sem imagem (cover_url)
                      </div>
                    )}

                    <div className="p-4 space-y-3">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="px-3 py-1 rounded-full bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest">
                          {previewData.cat || "SEM CATEGORIA"}
                        </span>
                        {previewData.sub ? (
                          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-200 text-[10px] font-black uppercase tracking-widest">
                            {previewData.sub}
                          </span>
                        ) : null}
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[10px] font-black uppercase tracking-widest">
                          {previewData.reading} min
                        </span>
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[10px] font-black uppercase tracking-widest">
                          {previewData.published ? "PUBLICADO" : "RASCUNHO"}
                        </span>
                      </div>

                      <div className="text-2xl font-black leading-tight">{previewData.title}</div>

                      <div className="text-[11px] text-gray-400">
                        {previewData.authorName} • {previewData.publishedAtText}
                      </div>

                      {previewData.tLabels.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {previewData.tLabels.map((x) => (
                            <span
                              key={x}
                              className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300"
                            >
                              #{x}
                            </span>
                          ))}
                        </div>
                      )}

                      {previewData.excerpt ? (
                        <div className="text-[13px] text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {previewData.excerpt}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="bg-black/30 border border-white/10 rounded-[24px] p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
                      Conteúdo
                    </div>
                    <div className="mt-3 text-[14px] leading-relaxed text-gray-200 whitespace-pre-wrap">
                      {previewData.content || "Sem conteúdo"}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPostMode("EDIT")}
                      className="flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10"
                    >
                      Voltar para editar
                    </button>
                    <button
                      onClick={saveArticle}
                      className="flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Título + slug */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className={label}>Título</div>
                      <input
                        className={input}
                        placeholder="Título"
                        value={editing.title ?? ""}
                        onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <div className={label}>Slug</div>
                      <input
                        className={input}
                        placeholder="Slug (opcional)"
                        value={editing.slug ?? ""}
                        onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Categoria + */}
                  <div>
                    <div className={label}>Categoria</div>
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                      <select
                        className={input}
                        value={editing.category ?? ""}
                        onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                      >
                        {categoryOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setQuickCategoryOpen(true)}
                        className="px-4 py-3 rounded-2xl text-[12px] font-black bg-yellow-400 text-black"
                        title="Criar nova categoria"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Subcategoria */}
                  <div>
                    <div className={label}>Subcategoria</div>
                    <select
                      className={input}
                      value={editing.subcategory ?? ""}
                      onChange={(e) => setEditing({ ...editing, subcategory: e.target.value || null })}
                    >
                      <option value="">Sem subcategoria</option>
                      {subcategoryOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Autor */}
                  <div>
                    <div className={label}>Autor</div>
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                      <select
                        className={input}
                        value={editing.author_id ?? ""}
                        onChange={(e) => setEditing({ ...editing, author_id: e.target.value || null })}
                      >
                        <option value="">Sem autor</option>
                        {authors.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          setTab("AUTORES");
                          setAuthorEditing({ name: "", role_label: "", avatar_url: "" });
                          setMsg("Crie o autor e depois volte em POSTS.");
                        }}
                        className="px-4 py-3 rounded-2xl text-[12px] font-black bg-yellow-400 text-black"
                        title="Criar autor"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Publicação + leitura */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className={label}>Status</div>
                      <label className="flex items-center gap-2 text-sm text-gray-200 mt-2">
                        <input
                          type="checkbox"
                          checked={!!editing.published}
                          onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                        />
                        Publicado
                      </label>
                    </div>

                    <div>
                      <div className={label}>Tempo de leitura (min)</div>
                      <input
                        className={input}
                        type="number"
                        min={1}
                        value={Number(editing.reading_minutes ?? 5)}
                        onChange={(e) => setEditing({ ...editing, reading_minutes: Number(e.target.value || 5) })}
                      />
                    </div>
                  </div>

                  <div>
                    <div className={label}>Data/Hora de publicação</div>
                    <input
                      className={input}
                      type="datetime-local"
                      value={toDatetimeLocal(editing.published_at)}
                      onChange={(e) => setEditing({ ...editing, published_at: fromDatetimeLocal(e.target.value) as any })}
                    />
                  </div>

                  {/* Cover */}
                  <div>
                    <div className={label}>Imagem (cover_url)</div>
                    <input
                      className={input}
                      placeholder="URL da imagem"
                      value={editing.cover_url ?? ""}
                      onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })}
                    />

                    {!!editing.cover_url?.trim() && (
                      <div className="mt-3 rounded-2xl overflow-hidden border border-white/10">
                        <img
                          src={editing.cover_url}
                          alt="cover preview"
                          className="w-full h-[180px] object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div className="p-3 text-[10px] text-gray-400">Preview da capa</div>
                      </div>
                    )}
                  </div>

                  {/* Excerpt */}
                  <div>
                    <div className={label}>Descrição / Excerpt</div>
                    <textarea
                      className={`${input} min-h-[90px]`}
                      placeholder="Descrição curta do post"
                      value={editing.excerpt ?? ""}
                      onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                    />
                  </div>

                  {/* TAGS do post */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={label}>Tags do post</div>
                      <button
                        onClick={() => setTagQuickOpen((v) => !v)}
                        className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-2xl bg-white/5 border border-white/10 text-gray-200"
                      >
                        + Nova tag
                      </button>
                    </div>

                    {tagQuickOpen && (
                      <div className="bg-black/30 border border-white/10 rounded-2xl p-3 space-y-2">
                        <input
                          className={input}
                          placeholder="Label (ex: TRADE)"
                          value={tagQuickLabel}
                          onChange={(e) => setTagQuickLabel(e.target.value)}
                        />
                        <input
                          className={input}
                          placeholder="Slug (opcional)"
                          value={tagQuickSlug}
                          onChange={(e) => setTagQuickSlug(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setTagQuickOpen(false);
                              setTagQuickLabel("");
                              setTagQuickSlug("");
                            }}
                            className="flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={quickCreateTag}
                            className="flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                          >
                            Criar
                          </button>
                        </div>
                      </div>
                    )}

                    {loadingPostTags ? (
                      <div className="text-[12px] text-gray-400">Carregando tags do post…</div>
                    ) : tags.length === 0 ? (
                      <div className="text-[12px] text-gray-400">Você ainda não criou tags.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {tags
                          .slice()
                          .sort((a, b) => a.label.localeCompare(b.label))
                          .map((t) => {
                            const active = selectedTagIds.includes(t.id);
                            return (
                              <button
                                key={t.id}
                                onClick={() => {
                                  setSelectedTagIds((prev) =>
                                    prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]
                                  );
                                }}
                                className={`px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition ${
                                  active
                                    ? "bg-yellow-400 text-black border-yellow-400"
                                    : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                                }`}
                                title={t.slug}
                              >
                                #{t.label}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div>
                    <div className={label}>Conteúdo</div>
                    <textarea
                      className={`${input} min-h-[260px]`}
                      placeholder="Conteúdo do post"
                      value={editing.content ?? ""}
                      onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={closeEdit}
                      className="px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveArticle}
                      className="px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                    >
                      Salvar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Modal quick category */}
          {quickCategoryOpen && (
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Nova categoria</div>
              <input
                className={input}
                placeholder="Nome (ex: DRAFT / PROSPECTOS)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <input
                className={input}
                placeholder="Ícone (opcional, ex: 🏀)"
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setQuickCategoryOpen(false)}
                  className="flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  onClick={quickAddCategory}
                  className="flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                >
                  Criar
                </button>
              </div>
            </div>
          )}

          {/* Lista posts */}
          {filteredPosts.map((a) => {
            const tIds = articleTagMap.get(a.id) ?? [];
            const tagLabels = tIds.map((id) => tagById.get(id)?.label).filter(Boolean) as string[];

            return (
              <div
                key={a.id}
                className="bg-white/5 border border-white/10 rounded-[24px] p-4 flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
                    {a.category}
                    {a.subcategory ? ` • ${a.subcategory}` : ""}
                  </div>

                  <div className="text-base font-black mt-1">{a.title}</div>

                  <div className="text-[11px] text-gray-400 mt-1">
                    {authorById.get(a.author_id ?? "")?.name ?? "Sem autor"} •{" "}
                    {a.published ? "Publicado" : "Rascunho"} •{" "}
                    {a.published_at ? toDatetimeLocal(a.published_at).replace("T", " ") : "—"}
                  </div>

                  {tagLabels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tagLabels.slice(0, 4).map((x) => (
                        <span
                          key={x}
                          className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300"
                        >
                          #{x}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => openEdit(a)}
                    className="px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => quickTogglePublish(a)}
                    className="px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-gray-200"
                  >
                    {a.published ? "Rascunho" : "Publicar"}
                  </button>

                  <button
                    onClick={() => quickDuplicate(a)}
                    className="px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-gray-200"
                  >
                    Duplicar
                  </button>

                  <button
                    onClick={() => removeArticle(a.id)}
                    className="px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-gray-200"
                  >
                    Apagar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AUTORES */}
      {tab === "AUTORES" && (
        <div className="mt-6 space-y-4">
          <button
            onClick={() => setAuthorEditing({ name: "", role_label: "", avatar_url: "" })}
            className="w-full bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
          >
            Novo Autor
          </button>

          {authorEditing && (
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Editor de Autor</div>

              <div>
                <div className={label}>Nome</div>
                <input
                  className={input}
                  placeholder="Nome"
                  value={authorEditing.name ?? ""}
                  onChange={(e) => setAuthorEditing({ ...authorEditing, name: e.target.value })}
                />
              </div>

              <div>
                <div className={label}>Slug</div>
                <input
                  className={input}
                  placeholder="Slug (opcional)"
                  value={authorEditing.slug ?? ""}
                  onChange={(e) => setAuthorEditing({ ...authorEditing, slug: e.target.value })}
                />
              </div>

              <div>
                <div className={label}>Cargo / label</div>
                <input
                  className={input}
                  placeholder="Ex: Editor"
                  value={authorEditing.role_label ?? ""}
                  onChange={(e) => setAuthorEditing({ ...authorEditing, role_label: e.target.value })}
                />
              </div>

              <div>
                <div className={label}>Avatar URL</div>
                <input
                  className={input}
                  placeholder="https://..."
                  value={authorEditing.avatar_url ?? ""}
                  onChange={(e) => setAuthorEditing({ ...authorEditing, avatar_url: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setAuthorEditing(null)}
                  className="flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveAuthor}
                  className="flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}

          {authors.map((a) => (
            <div key={a.id} className="bg-white/5 border border-white/10 rounded-[24px] p-4">
              <div className="text-base font-black">{a.name}</div>
              <div className="text-[11px] text-gray-400 mt-1">{a.role_label ?? "—"}</div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setAuthorEditing(a)}
                  className="px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAGS (UPGRADE #1) */}
      {tab === "TAGS" && (
        <div className="mt-6 space-y-4">
          <button
            onClick={() => setTagEditing({ label: "", slug: "" })}
            className="w-full bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
          >
            Nova Tag
          </button>

          {tagEditing && (
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Editor de Tag</div>

              <div>
                <div className={label}>Label</div>
                <input
                  className={input}
                  placeholder="Ex: TRADE"
                  value={tagEditing.label ?? ""}
                  onChange={(e) => setTagEditing({ ...tagEditing, label: e.target.value })}
                />
              </div>

              <div>
                <div className={label}>Slug</div>
                <input
                  className={input}
                  placeholder="(opcional)"
                  value={tagEditing.slug ?? ""}
                  onChange={(e) => setTagEditing({ ...tagEditing, slug: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setTagEditing(null)}
                  className="flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10"
                >
                  Cancelar
                </button>

                {tagEditing.id ? (
                  <button
                    onClick={() => removeTag(tagEditing.id as string)}
                    className="px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-gray-200"
                  >
                    Apagar
                  </button>
                ) : null}

                <button
                  onClick={saveTag}
                  className="flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}

          {tags.length === 0 ? (
            <div className="text-sm text-gray-400">Nenhuma tag criada ainda.</div>
          ) : (
            tags
              .slice()
              .sort((a, b) => a.label.localeCompare(b.label))
              .map((t) => (
                <div key={t.id} className="bg-white/5 border border-white/10 rounded-[24px] p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-black">{t.label}</div>
                    <div className="text-[11px] text-gray-400 mt-1">{t.slug}</div>
                  </div>
                  <button
                    onClick={() => setTagEditing(t)}
                    className="px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                  >
                    Editar
                  </button>
                </div>
              ))
          )}
        </div>
      )}

      {/* CATEGORIAS (UPGRADE #2) */}
      {tab === "CATEGORIAS" && (
        <div className="mt-6 space-y-4">
          <button
            onClick={() => setCategoryEditing({ name: "", slug: "", icon: "", sort_order: 0, is_active: true })}
            className="w-full bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
          >
            Nova Categoria
          </button>

          {categoryEditing && (
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Editor de Categoria</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className={label}>Nome</div>
                  <input
                    className={input}
                    placeholder="Ex: REGRAS"
                    value={categoryEditing.name ?? ""}
                    onChange={(e) => setCategoryEditing({ ...categoryEditing, name: e.target.value })}
                  />
                </div>
                <div>
                  <div className={label}>Slug</div>
                  <input
                    className={input}
                    placeholder="(opcional)"
                    value={categoryEditing.slug ?? ""}
                    onChange={(e) => setCategoryEditing({ ...categoryEditing, slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className={label}>Ícone</div>
                  <input
                    className={input}
                    placeholder="Ex: 🏀"
                    value={(categoryEditing.icon ?? "") as any}
                    onChange={(e) => setCategoryEditing({ ...categoryEditing, icon: e.target.value })}
                  />
                </div>
                <div>
                  <div className={label}>Ordem</div>
                  <input
                    className={input}
                    type="number"
                    value={Number(categoryEditing.sort_order ?? 0)}
                    onChange={(e) => setCategoryEditing({ ...categoryEditing, sort_order: Number(e.target.value || 0) })}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-200 mt-2">
                <input
                  type="checkbox"
                  checked={categoryEditing.is_active ?? true}
                  onChange={(e) => setCategoryEditing({ ...categoryEditing, is_active: e.target.checked })}
                />
                Ativa (aparece nos selects)
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setCategoryEditing(null)}
                  className="flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveCategory}
                  className="flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}

          {categories.length === 0 ? (
            <div className="text-sm text-gray-400">Nenhuma categoria na tabela categories.</div>
          ) : (
            categories
              .slice()
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((c) => (
                <div key={c.id} className="bg-white/5 border border-white/10 rounded-[24px] p-4 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
                      {c.icon ? `${c.icon} ` : ""}{c.name}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                      slug: {c.slug} • ordem: {c.sort_order ?? 0} • {c.is_active ? "ATIVA" : "DESATIVADA"}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setCategoryEditing(c)}
                      className="px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleCategoryActive(c)}
                      className="px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-gray-200"
                    >
                      {c.is_active ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
