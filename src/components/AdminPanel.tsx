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

type Tab = "POSTS" | "AUTORES" | "TAGS";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("POSTS");

  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [authors, setAuthors] = useState<AuthorRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [editing, setEditing] = useState<Partial<ArticleRow> | null>(null);
  const [authorEditing, setAuthorEditing] = useState<Partial<AuthorRow> | null>(null);
  const [tagEditing, setTagEditing] = useState<Partial<TagRow> | null>(null);

  // Deep-link: /?admin=1&edit=<id>
  const [editId, setEditId] = useState<string | null>(() => {
    try {
      return new URLSearchParams(window.location.search).get("edit");
    } catch {
      return null;
    }
  });

  function setEditParam(id: string | null) {
    try {
      const url = new URL(window.location.href);
      if (id) url.searchParams.set("edit", id);
      else url.searchParams.delete("edit");
      window.history.replaceState({}, "", url.toString());
      setEditId(id);
    } catch {
      setEditId(id);
    }
  }

  useEffect(() => {
    const onPop = () => {
      try {
        setEditId(new URLSearchParams(window.location.search).get("edit"));
      } catch {
        setEditId(null);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  async function refreshAll() {
    setLoading(true);
    setMsg(null);

    const [a, au, t] = await Promise.all([listArticles(), listAuthors(), listTags()]);
    if (a.error) console.error(a.error);
    if (au.error) console.error(au.error);
    if (t.error) console.error(t.error);

    setArticles((a.data as any) ?? []);
    setAuthors((au.data as any) ?? []);
    setTags((t.data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refreshAll();
  }, []);

  // Se vier com ?edit=<id>, abre direto o editor do post
  useEffect(() => {
    if (!editId) return;
    if (!articles.length) return;

    const found = articles.find((a) => String(a.id) === String(editId));
    if (found) {
      setEditing(found);
    }
  }, [editId, articles]);

  const authorById = useMemo(() => {
    const map = new Map<string, AuthorRow>();
    for (const a of authors) map.set(String(a.id), a);
    return map;
  }, [authors]);

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
    };

    const { error } = await upsertArticle(payload);

    if (error) {
      console.error(error);
      setMsg("Erro ao salvar artigo.");
      return;
    }

    setMsg("Artigo salvo ✅");
    setEditing(null);
    setEditParam(null);
    refreshAll();
  }

  async function removeArticle(id: string) {
    if (!confirm("Apagar este artigo?")) return;

    const { error } = await deleteArticle(id);
    if (error) {
      console.error(error);
      setMsg("Erro ao apagar artigo.");
      return;
    }

    setMsg("Artigo apagado ✅");
    if (String(editId) === String(id)) {
      setEditing(null);
      setEditParam(null);
    }
    refreshAll();
  }

  async function saveAuthor() {
    if (!authorEditing) return;
    if (!authorEditing.name || !authorEditing.role_label) {
      setMsg("Preencha pelo menos nome e função.");
      return;
    }

    const { error } = await upsertAuthor(authorEditing);
    if (error) {
      console.error(error);
      setMsg("Erro ao salvar autor.");
      return;
    }

    setMsg("Autor salvo ✅");
    setAuthorEditing(null);
    refreshAll();
  }

  async function saveTag() {
    if (!tagEditing) return;
    if (!tagEditing.tag || !tagEditing.description) {
      setMsg("Preencha tag e descrição.");
      return;
    }

    const { error } = await upsertTag(tagEditing);
    if (error) {
      console.error(error);
      setMsg("Erro ao salvar tag.");
      return;
    }

    setMsg("Tag salva ✅");
    setTagEditing(null);
    refreshAll();
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">
              Admin
            </div>
            <div className="text-2xl font-black italic tracking-tighter">
              Painel de Edição
            </div>
          </div>

          <button
            onClick={() => { setEditing({ title: "", category: "NOTICIAS", content: "" }); setEditParam(null); }}
            className="bg-yellow-400 text-black px-5 py-3 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
          >
            Novo post
          </button>
        </div>

        <div className="mt-6 flex gap-2">
          {(["POSTS", "AUTORES", "TAGS"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
                tab === t
                  ? "bg-yellow-400 text-black border-yellow-400"
                  : "bg-white/5 border-white/10 text-gray-200 hover:border-white/20"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {!!msg && (
          <div className="mt-6 bg-white/5 border border-white/10 rounded-3xl px-5 py-4 text-sm">
            {msg}
          </div>
        )}

        {loading && <div className="mt-6 text-sm text-gray-400">Carregando…</div>}

        {/* POSTS */}
        {tab === "POSTS" && !loading && (
          <div className="mt-6 space-y-4">
            {editing && (
              <div className="bg-white/5 border border-white/10 rounded-[28px] p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black">Editar post</div>
                  <button
                    onClick={() => { setEditing(null); setEditParam(null); }}
                    className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-2xl bg-white/5 border border-white/10"
                  >
                    Fechar
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
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

                  <input
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                    placeholder="Categoria (ex: NOTICIAS)"
                    value={editing.category ?? ""}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  />
                  <input
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                    placeholder="Subcategoria (opcional)"
                    value={editing.subcategory ?? ""}
                    onChange={(e) => setEditing({ ...editing, subcategory: e.target.value })}
                  />

                  <input
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm md:col-span-2"
                    placeholder="Descrição"
                    value={editing.description ?? ""}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  />

                  <input
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm md:col-span-2"
                    placeholder="URL da imagem"
                    value={editing.image_url ?? ""}
                    onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                  />

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

                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/30 border border-white/10 text-sm">
                    <input
                      type="checkbox"
                      checked={!!editing.published}
                      onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                    />
                    <span className="font-bold">Publicado</span>
                  </div>

                  <textarea
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm min-h-[180px] md:col-span-2"
                    placeholder="Conteúdo (texto simples / markdown)"
                    value={editing.content ?? ""}
                    onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  />

                  <div className="md:col-span-2 flex items-center justify-between gap-3">
                    <button
                      onClick={saveArticle}
                      className="flex-1 bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
                    >
                      Salvar
                    </button>
                    {!!editing.id && (
                      <button
                        onClick={() => removeArticle(String(editing.id))}
                        className="px-5 py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] bg-red-500/20 border border-red-500/30 text-red-200"
                      >
                        Apagar
                      </button>
                    )}
                  </div>
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
                    {a.category}{a.subcategory ? ` • ${a.subcategory}` : ""}
                  </div>
                  <div className="text-base font-black mt-1">{a.title}</div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {authorById.get(a.author_id ?? "")?.name ?? "Sem autor"} • {a.published ? "Publicado" : "Rascunho"}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { setEditing(a); setEditParam(String(a.id)); }}
                    className="px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => removeArticle(String(a.id))}
                    className="px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-red-500/20 border border-red-500/30 text-red-200"
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
              onClick={() => setAuthorEditing({ name: "", role_label: "EDITORES" })}
              className="w-full bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
            >
              Novo autor
            </button>

            {authorEditing && (
              <div className="bg-white/5 border border-white/10 rounded-[28px] p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black">Editar autor</div>
                  <button
                    onClick={() => setAuthorEditing(null)}
                    className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-2xl bg-white/5 border border-white/10"
                  >
                    Fechar
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                    placeholder="Nome"
                    value={authorEditing.name ?? ""}
                    onChange={(e) => setAuthorEditing({ ...authorEditing, name: e.target.value })}
                  />
                  <input
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                    placeholder="Role label (ex: EDITORES)"
                    value={authorEditing.role_label ?? ""}
                    onChange={(e) => setAuthorEditing({ ...authorEditing, role_label: e.target.value })}
                  />
                  <textarea
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm min-h-[120px] md:col-span-2"
                    placeholder="Bio"
                    value={authorEditing.bio ?? ""}
                    onChange={(e) => setAuthorEditing({ ...authorEditing, bio: e.target.value })}
                  />
                  <button
                    onClick={saveAuthor}
                    className="md:col-span-2 bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            )}

            {authors.map((a) => (
              <div key={a.id} className="bg-white/5 border border-white/10 rounded-[24px] p-4 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-base font-black">{a.name}</div>
                  <div className="text-[11px] text-gray-400 mt-1">{a.role_label}</div>
                </div>
                <button
                  onClick={() => setAuthorEditing(a)}
                  className="px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAGS */}
        {tab === "TAGS" && (
          <div className="mt-6 space-y-4">
            <button
              onClick={() => setTagEditing({ tag: "", description: "" })}
              className="w-full bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
            >
              Nova tag
            </button>

            {tagEditing && (
              <div className="bg-white/5 border border-white/10 rounded-[28px] p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black">Editar tag</div>
                  <button
                    onClick={() => setTagEditing(null)}
                    className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-2xl bg-white/5 border border-white/10"
                  >
                    Fechar
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  <input
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                    placeholder="Tag (ex: UNIFORME)"
                    value={tagEditing.tag ?? ""}
                    onChange={(e) => setTagEditing({ ...tagEditing, tag: e.target.value })}
                  />
                  <textarea
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm min-h-[120px]"
                    placeholder="Descrição"
                    value={tagEditing.description ?? ""}
                    onChange={(e) => setTagEditing({ ...tagEditing, description: e.target.value })}
                  />
                  <button
                    onClick={saveTag}
                    className="bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            )}

            {tags.map((t) => (
              <div key={t.id} className="bg-white/5 border border-white/10 rounded-[24px] p-4 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-base font-black">{t.tag}</div>
                  <div className="text-[11px] text-gray-400 mt-1">{t.description}</div>
                </div>
                <button
                  onClick={() => setTagEditing(t)}
                  className="px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
