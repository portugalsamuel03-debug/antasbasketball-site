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

type Tab = "POSTS" | "AUTORES" | "TAGS";

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
  // YYYY-MM-DDTHH:mm
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(v: string) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<Tab>("POSTS");

  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [authors, setAuthors] = useState<AuthorRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [editing, setEditing] = useState<Partial<ArticleRow> | null>(null);
  const [authorEditing, setAuthorEditing] = useState<Partial<AuthorRow> | null>(null);

  // TAG editor simples (inline)
  const [tagQuickOpen, setTagQuickOpen] = useState(false);
  const [tagQuickLabel, setTagQuickLabel] = useState("");
  const [tagQuickSlug, setTagQuickSlug] = useState("");

  // Tags vinculadas no post (article_tags)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loadingPostTags, setLoadingPostTags] = useState(false);

  const [quickCategoryOpen, setQuickCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");

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
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((c) => c.name);

    const fromArticles = Array.from(new Set(articles.map((a) => a.category).filter(Boolean))) as string[];

    const merged = Array.from(new Set([...fromDb, ...fromArticles, "NOTICIAS", "HISTORIA", "REGRAS", "PODCAST"]));
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
      console.warn("Falha ao carregar categories (ok se ainda não usar):", e);
      setCategories([]);
    }

    setLoading(false);

    // ✅ Se existe ?edit=ID, abre editor automaticamente
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

  function openEdit(a: ArticleRow) {
    setTab("POSTS");
    setEditing(a);
    setSearchParam("admin", "1");
    setSearchParam("edit", a.id);
  }

  function closeEdit() {
    setEditing(null);
    setSelectedTagIds([]);
    setSearchParam("edit", null);
  }

  async function loadArticleTags(articleId: string) {
    setLoadingPostTags(true);
    try {
      const { data, error } = await supabase
        .from("article_tags")
        .select("tag_id")
        .eq("article_id", articleId);

      if (error) throw error;

      const ids = ((data as any[]) ?? []).map((x) => x.tag_id).filter(Boolean);
      setSelectedTagIds(ids);
    } catch (e: any) {
      console.warn("loadArticleTags error:", e?.message ?? e);
      setSelectedTagIds([]);
    } finally {
      setLoadingPostTags(false);
    }
  }

  // carrega tags do post quando abre editor
  useEffect(() => {
    if (!editing?.id) return;
    loadArticleTags(editing.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id]);

  async function syncArticleTags(articleId: string, tagIds: string[]) {
    // estratégia simples e confiável: apaga tudo e reinsere
    await supabase.from("article_tags").delete().eq("article_id", articleId);

    if (!tagIds.length) return;

    const payload = tagIds.map((tagId) => ({
      article_id: articleId,
      tag_id: tagId,
    }));

    const { error } = await supabase.from("article_tags").insert(payload);
    if (error) throw error;
  }

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
      if (saved?.id) {
        await syncArticleTags(saved.id, selectedTagIds);
      }

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
      // apaga tags primeiro pra evitar lixo
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

  async function saveAuthor() {
    if (!authorEditing?.name) {
      setMsg("Autor precisa de nome.");
      return;
    }

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

  async function quickAddCategory() {
    setMsg(null);
    const name = newCategoryName.trim();
    if (!name) {
      setMsg("Digite o nome da categoria.");
      return;
    }

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

  async function quickCreateTag() {
    setMsg(null);

    const rawLabel = tagQuickLabel.trim();
    if (!rawLabel) {
      setMsg("Digite o label da tag.");
      return;
    }

    const label = rawLabel.toUpperCase();
    const slug = tagQuickSlug.trim() || slugify(rawLabel);

    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({ label, slug })
        .select("*")
        .single();

      if (error) throw error;

      setTagQuickOpen(false);
      setTagQuickLabel("");
      setTagQuickSlug("");

      // atualiza lista e já marca no post
      await refreshAll();
      if (data?.id) setSelectedTagIds((prev) => Array.from(new Set([...prev, data.id])));
      setMsg("Tag criada ✅");
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message ?? "Erro ao criar tag.");
    }
  }

  const postsSorted = useMemo(() => {
    return [...articles].sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
  }, [articles]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6 text-white">
        <div className="text-sm font-black uppercase tracking-widest text-yellow-400">Admin</div>
        <div className="mt-3 text-gray-400">Carregando…</div>
      </div>
    );
  }

  const input =
    "w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-yellow-400/40";
  const label =
    "text-[10px] font-black uppercase tracking-widest text-gray-400";

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

      <div className="flex gap-2 mt-6">
        {(["POSTS", "AUTORES", "TAGS"] as Tab[]).map((t) => (
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

      {/* POSTS */}
      {tab === "POSTS" && (
        <div className="mt-6 space-y-4">
          <button
            onClick={() => {
              setSearchParam("admin", "1");
              setSearchParam("edit", null);
              setSelectedTagIds([]);
              setEditing({
                title: "",
                slug: "",
                category: categoryOptions[0] ?? "NOTICIAS",
                subcategory: "",
                excerpt: "",
                content: "",
                cover_url: "",
                published: true,
                reading_minutes: 5,
                published_at: new Date().toISOString(),
                author_id: authors[0]?.id ?? null,
              });
            }}
            className="w-full bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
          >
            Novo Post
          </button>

          {editing && (
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Editar post</div>
                <button
                  onClick={closeEdit}
                  className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10"
                >
                  Fechar
                </button>
              </div>

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

              {/* Publicação + datas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className={label}>Status</div>
                  <label className="flex items-center gap-2 text-sm text-gray-200 mt-2">
                    <input
                      type="checkbox"
                      checked={!!editing.published}
                      onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                    />
                    Publicado (desmarque para rascunho)
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
                    {tags.map((t) => {
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

                {selectedTagIds.length > 0 && (
                  <div className="text-[11px] text-gray-400">
                    Selecionadas:{" "}
                    <span className="text-gray-200 font-bold">
                      {selectedTagIds.map((id) => tagById.get(id)?.label).filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Conteúdo */}
              <div>
                <div className={label}>Conteúdo</div>
                <textarea
                  className={`${input} min-h-[260px]`}
                  placeholder="Conteúdo do post (texto / markdown)"
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

          {/* Lista de posts */}
          {postsSorted.map((a) => (
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
                  {a.published ? "Publicado" : "Rascunho"} • {a.published_at ? toDatetimeLocal(a.published_at).replace("T", " ") : "—"}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => openEdit(a)}
                  className="px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                >
                  Editar
                </button>
                <button
                  onClick={() => removeArticle(a.id)}
                  className="px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-gray-200"
                >
                  Apagar
                </button>
              </div>
            </div>
          ))}
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
                  placeholder="Ex: Comissário / Editor / Antas Oficial"
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
                {!!authorEditing.avatar_url?.trim() && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10">
                      <img src={authorEditing.avatar_url} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[11px] text-gray-400">Preview do avatar</div>
                  </div>
                )}
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

      {/* TAGS (lista simples) */}
      {tab === "TAGS" && (
        <div className="mt-6 space-y-4">
          <div className="text-[11px] text-gray-400">
            Aqui é só a lista. As tags são aplicadas nos posts dentro do editor (aba POSTS).
          </div>

          {tags.length === 0 ? (
            <div className="text-sm text-gray-400">Nenhuma tag criada ainda.</div>
          ) : (
            tags
              .slice()
              .sort((a, b) => a.label.localeCompare(b.label))
              .map((t) => (
                <div key={t.id} className="bg-white/5 border border-white/10 rounded-[24px] p-4">
                  <div className="text-base font-black">{t.label}</div>
                  <div className="text-[11px] text-gray-400 mt-1">{t.slug}</div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
