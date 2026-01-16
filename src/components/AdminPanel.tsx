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
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<Tab>("POSTS");

  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [authors, setAuthors] = useState<AuthorRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [editing, setEditing] = useState<Partial<ArticleRow> | null>(null);
  const [authorEditing, setAuthorEditing] = useState<Partial<AuthorRow> | null>(null);
  const [tagEditing, setTagEditing] = useState<Partial<TagRow> | null>(null);

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

  const authorById = useMemo(() => {
    const m = new Map<string, AuthorRow>();
    authors.forEach((x) => m.set(x.id, x));
    return m;
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
    refreshAll();
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
    refreshAll();
  }

  async function saveAuthor() {
    if (!authorEditing?.name) {
      setMsg("Autor precisa de nome.");
      return;
    }
    const payload: Partial<AuthorRow> = {
      ...authorEditing,
      slug: authorEditing.slug?.trim() || slugify(authorEditing.name),
    };
    const { error } = await upsertAuthor(payload);
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
    refreshAll();
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6 text-white">
        <div className="text-sm font-black uppercase tracking-widest text-yellow-400">
          Admin
        </div>
        <div className="mt-3 text-gray-400">Carregando…</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-yellow-400">
            Painel Admin
          </div>
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
        {(["POSTS","AUTORES","TAGS"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              tab === t
                ? "bg-yellow-400 text-black border-yellow-400"
                : "bg-white/5 text-gray-300 border-white/10"
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
            onClick={() =>
              setEditing({
                title: "",
                category: "NOTICIAS",
                subcategory: "ARTIGOS",
                content: "",
                excerpt: "",
                cover_url: "",
                published: true,
                reading_minutes: 5,
                author_id: authors[0]?.id ?? null,
              })
            }
            className="w-full bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
          >
            Novo Post
          </button>

          {editing && (
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
                Editor de Post
              </div>

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

              <textarea
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm min-h-[90px]"
                placeholder="Resumo (excerpt)"
                value={editing.excerpt ?? ""}
                onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
              />

              <input
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                placeholder="Cover URL (opcional)"
                value={editing.cover_url ?? ""}
                onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })}
              />

              <div className="flex gap-2">
                <select
                  className="flex-1 bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                  value={editing.category ?? "NOTICIAS"}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                >
                  <option value="NOTICIAS">NOTICIAS</option>
                  <option value="HISTORIA">HISTORIA</option>
                  <option value="REGRAS">REGRAS</option>
                  <option value="PODCAST">PODCAST</option>
                </select>

                <select
                  className="flex-1 bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                  value={editing.subcategory ?? ""}
                  onChange={(e) => setEditing({ ...editing, subcategory: e.target.value })}
                >
                  <option value="ARTIGOS">ARTIGOS</option>
                  <option value="TRADES">TRADES</option>
                  <option value="INATIVIDADE">INATIVIDADE</option>
                  <option value="DIVISOES">DIVISOES</option>
                  <option value="DRAFT">DRAFT</option>
                </select>
              </div>

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

              <textarea
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm min-h-[180px]"
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
                    onClick={() => setEditing(null)}
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
                  onClick={() => setEditing(a)}
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
            onClick={() => setAuthorEditing({ name: "", role_label: "EDITORES" })}
            className="w-full bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
          >
            Novo Autor
          </button>

          {authorEditing && (
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 space-y-3">
              <input
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                placeholder="Nome do autor"
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
                placeholder="Cargo (role_label) ex: ANTAS OFICIAL"
                value={authorEditing.role_label ?? ""}
                onChange={(e) => setAuthorEditing({ ...authorEditing, role_label: e.target.value })}
              />
              <input
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                placeholder="Avatar URL (opcional)"
                value={authorEditing.avatar_url ?? ""}
                onChange={(e) => setAuthorEditing({ ...authorEditing, avatar_url: e.target.value })}
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setAuthorEditing(null)}
                  className="px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveAuthor}
                  className="px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}

          {authors.map((a) => (
            <div key={a.id} className="bg-white/5 border border-white/10 rounded-[24px] p-4 flex items-center justify-between">
              <div>
                <div className="text-base font-black">{a.name}</div>
                <div className="text-[11px] text-gray-400">{a.role_label ?? ""}</div>
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
            onClick={() => setTagEditing({ label: "" })}
            className="w-full bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
          >
            Nova Tag
          </button>

          {tagEditing && (
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 space-y-3">
              <input
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                placeholder="Label da tag (ex: NBA)"
                value={tagEditing.label ?? ""}
                onChange={(e) => setTagEditing({ ...tagEditing, label: e.target.value })}
              />
              <input
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm"
                placeholder="Slug (opcional)"
                value={tagEditing.slug ?? ""}
                onChange={(e) => setTagEditing({ ...tagEditing, slug: e.target.value })}
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setTagEditing(null)}
                  className="px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveTag}
                  className="px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}

          {tags.map((t) => (
            <div key={t.id} className="bg-white/5 border border-white/10 rounded-[24px] p-4 flex items-center justify-between">
              <div className="text-base font-black">{t.label}</div>
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
  );
};

export default AdminPanel;
