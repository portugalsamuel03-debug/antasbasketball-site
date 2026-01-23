import React, { useEffect, useMemo, useState } from "react";
import {
  deleteArticle,
  listArticles,
  listAuthors,
  listTags,
  upsertArticle,
  upsertAuthor,
  upsertTag,
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
  const [tagEditing, setTagEditing] = useState<Partial<TagRow> | null>(null);

  const [quickCategoryOpen, setQuickCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");

  const authorById = useMemo(() => {
    const m = new Map<string, AuthorRow>();
    authors.forEach((x) => m.set(x.id, x));
    return m;
  }, [authors]);

  const categoryOptions = useMemo(() => {
    const active = categories.filter((c) => c.is_active !== false);
    const fromDb = active
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((c) => c.name);

    const fromArticles = Array.from(new Set(articles.map((a) => a.category).filter(Boolean))) as string[];

    const merged = Array.from(
      new Set([...fromDb, ...fromArticles, "NOTICIAS", "HISTORIA", "REGRAS", "PODCAST"])
    );

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

    // ✅ Se existe ?edit=ID, abre editor automaticamente (após ter articles carregados)
    const editId = getSearchParam("edit");
    if (editId) {
      const found = nextArticles.find((x) => x.id === editId);
      if (found) {
        setTab("POSTS");
        setEditing(found);
      } else {
        // se não achou mais, limpa o parâmetro
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
    setSearchParam("edit", null);
  }

  async function saveArticle() {
    if (!editing) return;

    if (!editing.title || !editing.category || !editing.content) {
      setMsg("Preencha pelo menos: título, categoria e conteúdo.");
      return;
    }

    const payload: Partial<ArticleRow> = {
      ...editing,
      slug: editing.slug?.trim() || slugify(editing.title),
      published: editing.published ?? true,
      reading_minutes: editing.reading_minutes ?? 5,
      published_at: editing.published_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString() as any,
    };

    const { error } = await upsertArticle(payload);
    if (error) {
      console.error(error);
      setMsg("Erro ao salvar artigo.");
      return;
    }

    setMsg("Artigo salvo ✅");
    closeEdit();
    await refreshAll();
  }

  async function removeArticle(id: string) {
    if (!confirm("Apagar este artigo?")) return;
    const { error } = await deleteArticle(id);
    if (error) {
      console.error(error);
      setMsg("Erro ao apagar.");
      return;
    }
    setMsg("Apagado ✅");
    if (getSearchParam("edit") === id) setSearchParam("edit", null);
    await refreshAll();
  }

  async function saveAuthor() {
    if (!authorEditing?.name) {
      setMsg("Autor precisa de nome.");
      return;
    }
    const payload: Partial<AuthorRow> = {
      ...authorEditing,
      slug: authorEditing.slug?.trim() || slugify(authorEditing.name),
      updated_at: new Date().toISOString() as any,
    };
    const { error } = await upsertAuthor(payload);
    if (error) {
      console.error(error);
      setMsg("Erro ao salvar autor.");
      return;
    }
    setMsg("Autor salvo ✅");
    setAuthorEditing(null);
    await refreshAll();
  }

  async function saveTag() {
    if (!tagEditing?.label) {
      setMsg("Tag precisa de label.");
      return;
    }
    const payload: Partial<TagRow> = {
      ...tagEditing,
      slug: tagEditing.slug?.trim() || slugify(tagEditing.label),
      label: tagEditing.label.toUpperCase().trim(),
    };
    const { error } = await upsertTag(payload);
    if (error) {
      console.error(error);
      setMsg("Erro ao salvar tag.");
      return;
    }
    setMsg("Tag salva ✅");
    setTagEditing(null);
    await refreshAll();
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
              setEditing({
                title: "",
                category: categoryOptions[0] ?? "NOTICIAS",
                subcategory: "",
                content: "",
                excerpt: "",
                cover_url: "",
                published: true,
                reading_minutes: 5,
                author_id: authors[0]?.id ?? null,
              });
            }}
            className="w-full bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
          >
            Novo Post
          </button>

          {editing && (
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Editar post</div>
                <button
                  onClick={closeEdit}
                  className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10"
                >
                  Fechar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                  placeholder="Título"
                  value={editing.title ?? ""}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />

                <input
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                  placeholder="Slug (opcional)"
                  value={editing.slug ?? ""}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                />
              </div>

              {/* Categoria + */}
              <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                <select
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
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

              {/* Subcategoria */}
              <select
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
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

              <textarea
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm min-h-[90px]"
                placeholder="Descrição (excerpt)"
                value={editing.excerpt ?? ""}
                onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
              />

              <input
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                placeholder="URL da imagem (cover_url)"
                value={editing.cover_url ?? ""}
                onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })}
              />

              {/* Autor dropdown + */}
              <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                <select
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
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

              <textarea
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm min-h-[220px]"
                placeholder="Conteúdo (texto simples / markdown)"
                value={editing.content ?? ""}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              />

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={!!editing.published}
                    onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                  />
                  Publicado
                </label>

                <div className="flex gap-2">
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
            </div>
          )}

          {/* Modal quick category */}
          {quickCategoryOpen && (
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Nova categoria</div>
              <input
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                placeholder="Nome (ex: DRAFT / PROSPECTOS)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <input
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
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

          {articles.map((a) => (
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
                  {authorById.get(a.author_id ?? "")?.name ?? "Sem autor"} • {a.published ? "Publicado" : "Rascunho"}
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

              <input
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                placeholder="Nome"
                value={authorEditing.name ?? ""}
                onChange={(e) => setAuthorEditing({ ...authorEditing, name: e.target.value })}
              />

              <input
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                placeholder="Slug (opcional)"
                value={authorEditing.slug ?? ""}
                onChange={(e) => setAuthorEditing({ ...authorEditing, slug: e.target.value })}
              />

              <input
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                placeholder="Cargo/label (opcional)"
                value={authorEditing.role_label ?? ""}
                onChange={(e) => setAuthorEditing({ ...authorEditing, role_label: e.target.value })}
              />

              <input
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                placeholder="Avatar URL (opcional)"
                value={authorEditing.avatar_url ?? ""}
                onChange={(e) => setAuthorEditing({ ...authorEditing, avatar_url: e.target.value })}
              />

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

      {/* TAGS */}
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

              <input
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                placeholder="Label (ex: MODA)"
                value={tagEditing.label ?? ""}
                onChange={(e) => setTagEditing({ ...tagEditing, label: e.target.value })}
              />

              <input
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                placeholder="Slug (opcional)"
                value={tagEditing.slug ?? ""}
                onChange={(e) => setTagEditing({ ...tagEditing, slug: e.target.value })}
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setTagEditing(null)}
                  className="flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveTag}
                  className="flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}

          {tags.map((t) => (
            <div key={t.id} className="bg-white/5 border border-white/10 rounded-[24px] p-4">
              <div className="text-base font-black">{t.label}</div>
              <div className="text-[11px] text-gray-400 mt-1">{t.slug}</div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setTagEditing(t)}
                  className="px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
