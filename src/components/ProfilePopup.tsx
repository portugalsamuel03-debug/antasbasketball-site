import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Role = "admin" | "reader";

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  favorite_team: string | null;
  role: Role | null;
};

type MiniArticle = {
  id: string;
  title: string;
  cover_url: string | null;
  published_at: string | null;
};

type Tab = "PERFIL" | "CURTIDOS" | "SALVOS";

function dicebear(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

function formatDateTiny(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function ProfilePopup({
  isOpen,
  onClose,
  userId,
  onOpenArticle,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onOpenArticle?: (articleId: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("PERFIL");
  const [editMode, setEditMode] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [likedArticles, setLikedArticles] = useState<MiniArticle[]>([]);
  const [savedArticles, setSavedArticles] = useState<MiniArticle[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const effectiveAvatar = useMemo(() => {
    const seed = nickname || displayName || userId || "User";
    return avatarUrl?.trim() ? avatarUrl : dicebear(seed);
  }, [avatarUrl, nickname, displayName, userId]);

  useEffect(() => {
    if (!isOpen) return;

    let alive = true;

    (async () => {
      setErr(null);
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id,email,display_name,nickname,avatar_url,favorite_team,role")
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;

        const p = (data as ProfileRow | null) ?? null;

        setDisplayName(p?.display_name ?? "");
        setNickname(p?.nickname ?? "");
        setAvatarUrl(p?.avatar_url ?? "");

        // se perfil vazio -> abre direto em editar
        const hasAny = !!(p?.display_name || p?.nickname || p?.avatar_url);
        setEditMode(!hasAny);
        setTab("PERFIL");
      } catch (e: any) {
        setErr(e?.message ?? "Erro ao carregar perfil.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isOpen, userId]);

  async function loadLists() {
    setLoadingLists(true);
    setErr(null);

    try {
      // Curtidos
      const { data: likesData, error: likesErr } = await supabase
        .from("article_likes")
        .select(
          `
          created_at,
          articles:articles (
            id,
            title,
            cover_url,
            published_at
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (likesErr) throw likesErr;

      const liked = ((likesData as any[]) ?? [])
        .map((x) => x.articles)
        .filter(Boolean) as MiniArticle[];

      // Salvos
      const { data: savedData, error: savedErr } = await supabase
        .from("article_read_later")
        .select(
          `
          created_at,
          articles:articles (
            id,
            title,
            cover_url,
            published_at
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (savedErr) throw savedErr;

      const saved = ((savedData as any[]) ?? [])
        .map((x) => x.articles)
        .filter(Boolean) as MiniArticle[];

      setLikedArticles(liked);
      setSavedArticles(saved);
    } catch (e: any) {
      console.error("loadLists error:", e);
      setErr(e?.message ?? "Erro ao carregar curtidos/salvos.");
      setLikedArticles([]);
      setSavedArticles([]);
    } finally {
      setLoadingLists(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    if (tab === "CURTIDOS" || tab === "SALVOS") loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tab]);

  async function save() {
    setErr(null);
    setLoading(true);

    try {
      // ✅ remove updated_at do payload (pra não dar erro TS/typing)
      const payload = {
        display_name: displayName.trim() || null,
        nickname: nickname.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      };

      const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
      if (error) throw error;

      // fecha e volta pro modo visualizar
      setEditMode(false);
      setTab("PERFIL");
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao salvar perfil.");
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    onClose();
  }

  if (!isOpen) return null;

  const inputClasses =
    "w-full bg-[#F0F4F8] border-none rounded-2xl py-4 px-6 text-sm text-[#0B1D33] focus:ring-2 focus:ring-[#0B1D33]/20 outline-none transition-all placeholder:text-gray-400 font-medium";

  const tabBtn = (t: Tab) =>
    `px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition ${
      tab === t ? "bg-yellow-400 text-black border-yellow-400" : "bg-black/5 text-[#0B1D33]/70 border-black/10 hover:bg-black/10"
    }`;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[#0B1D33]/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white rounded-[34px] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-black/5 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-black/10">
              <img src={effectiveAvatar} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400">Conta</div>
              <div className="text-xl font-black italic tracking-tighter text-[#0B1D33]">SEU PERFIL</div>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 text-gray-500">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="px-7 pt-5 flex gap-2 flex-wrap">
          <button className={tabBtn("PERFIL")} onClick={() => setTab("PERFIL")}>
            Perfil
          </button>
          <button className={tabBtn("CURTIDOS")} onClick={() => setTab("CURTIDOS")}>
            Curtidos
          </button>
          <button className={tabBtn("SALVOS")} onClick={() => setTab("SALVOS")}>
            Salvos
          </button>
        </div>

        <div className="p-7 space-y-4">
          {err && (
            <div className="text-[12px] font-bold bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-red-600">
              {err}
            </div>
          )}

          {/* PERFIL */}
          {tab === "PERFIL" && (
            <>
              {!editMode ? (
                <div className="space-y-3">
                  <div className="bg-black/5 rounded-2xl px-4 py-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Nome</div>
                    <div className="text-sm font-black text-[#0B1D33] mt-1">{displayName || "—"}</div>
                  </div>

                  <div className="bg-black/5 rounded-2xl px-4 py-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Nickname</div>
                    <div className="text-sm font-black text-[#0B1D33] mt-1">{nickname || "—"}</div>
                  </div>

                  <div className="bg-black/5 rounded-2xl px-4 py-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Avatar</div>
                    <div className="text-[12px] font-bold text-gray-600 mt-1 break-all">{avatarUrl || "Automático (Dicebear)"}</div>
                  </div>

                  <button
                    onClick={() => setEditMode(true)}
                    className="w-full bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
                  >
                    Editar
                  </button>

                  <button
                    onClick={signOut}
                    className="w-full bg-[#0B1D33]/5 text-[#0B1D33] py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
                  >
                    Sair da conta
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    className={inputClasses}
                    placeholder="Seu nome"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                  />

                  <input
                    className={inputClasses}
                    placeholder="Nickname (pra comentários)"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    disabled={loading}
                  />

                  <div className="space-y-2">
                    <input
                      className={inputClasses}
                      placeholder="URL da foto (avatar)"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      disabled={loading}
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAvatarUrl(dicebear(nickname || displayName || "User"))}
                        className="flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] bg-[#0B1D33]/5 text-[#0B1D33]"
                      >
                        Gerar automático
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvatarUrl("")}
                        className="py-3 px-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] bg-black/5 text-[#0B1D33]"
                        title="Voltar para automático"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={save}
                    disabled={loading}
                    className="w-full bg-[#5C6773] text-white py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] disabled:opacity-60"
                  >
                    {loading ? "SALVANDO..." : "SALVAR"}
                  </button>

                  <button
                    onClick={() => setEditMode(false)}
                    className="w-full bg-black/5 text-[#0B1D33] py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </>
          )}

          {/* CURTIDOS / SALVOS */}
          {(tab === "CURTIDOS" || tab === "SALVOS") && (
            <div className="space-y-3">
              {loadingLists ? (
                <div className="text-sm text-gray-500">Carregando…</div>
              ) : (tab === "CURTIDOS" ? likedArticles : savedArticles).length === 0 ? (
                <div className="text-sm text-gray-500">
                  {tab === "CURTIDOS" ? "Você ainda não curtiu posts." : "Você ainda não salvou posts."}
                </div>
              ) : (
                <div className="space-y-3">
                  {(tab === "CURTIDOS" ? likedArticles : savedArticles).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => onOpenArticle?.(a.id)}
                      className="w-full text-left bg-black/5 hover:bg-black/10 transition rounded-2xl p-4 flex gap-3 items-center"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-black/10 bg-white flex-shrink-0">
                        <img src={a.cover_url?.trim() ? a.cover_url : dicebear(a.title)} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-black text-[#0B1D33] leading-tight">{a.title}</div>
                        <div className="text-[11px] font-bold text-gray-500 mt-1">{formatDateTiny(a.published_at)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
