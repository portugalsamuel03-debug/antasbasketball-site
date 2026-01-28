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
  bio?: string | null;
};

type MiniArticle = {
  id: string;
  title: string;
  cover_url: string | null;
  published_at: string | null;
};

type Tab = "PERFIL" | "CURTIDOS" | "SALVOS";

type LikeViewRow = {
  user_id: string;
  liked_at: string;
  article_id: string;
  title: string;
  cover_url: string | null;
  published_at: string | null;
};

type SavedViewRow = {
  user_id: string;
  saved_at: string;
  article_id: string;
  title: string;
  cover_url: string | null;
  published_at: string | null;
};

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
  const [bio, setBio] = useState("");

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
        setBio(p?.bio ?? "");

        // se perfil vazio -> abre direto em editar
        const hasAny = !!(p?.display_name || p?.nickname);
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
      // ✅ CURTIDOS via VIEW
      const { data: likesData, error: likesErr } = await supabase
        .from("v_user_liked_articles")
        .select("user_id,liked_at,article_id,title,cover_url,published_at")
        .eq("user_id", userId)
        .order("liked_at", { ascending: false });

      if (likesErr) throw likesErr;

      const liked = ((likesData as any[]) ?? []).map((x: LikeViewRow) => ({
        id: x.article_id,
        title: x.title,
        cover_url: x.cover_url,
        published_at: x.published_at,
      })) as MiniArticle[];

      // ✅ SALVOS via VIEW
      const { data: savedData, error: savedErr } = await supabase
        .from("v_user_saved_articles")
        .select("user_id,saved_at,article_id,title,cover_url,published_at")
        .eq("user_id", userId)
        .order("saved_at", { ascending: false });

      if (savedErr) throw savedErr;

      const saved = ((savedData as any[]) ?? []).map((x: SavedViewRow) => ({
        id: x.article_id,
        title: x.title,
        cover_url: x.cover_url,
        published_at: x.published_at,
      })) as MiniArticle[];

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
      const payload = {
        id: userId, // Ensure ID is present for upsert if needed, though update uses .eq
        display_name: displayName.trim() || null,
        nickname: nickname.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        bio: bio.trim() || null,
        updated_at: new Date().toISOString()
      };

      // Use upsert to be safe, or stick to update
      const { error } = await supabase.from("profiles").upsert(payload);
      if (error) throw error;

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
    `px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition ${tab === t ? "bg-yellow-400 text-black border-yellow-400" : "bg-black/5 text-[#0B1D33]/70 border-black/10 hover:bg-black/10"
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
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {!editMode ? (
                <div className="space-y-6">
                  {/* Hero Section */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-yellow-400 shadow-2xl transition-transform group-hover:scale-105">
                        <img src={effectiveAvatar} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-[#0B1D33] text-white p-1.5 rounded-full border-2 border-white shadow-lg">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-xl font-black italic text-[#0B1D33] tracking-tight truncate max-w-[200px]">
                        {displayName || "Novo Atleta"}
                      </h3>
                      <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mt-1">
                        @{nickname || "antas_user"}
                      </p>
                    </div>

                    {bio && (
                      <p className="mt-3 text-[11px] font-medium text-gray-500 max-w-[240px] italic">
                        "{bio}"
                      </p>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#F0F4F8] rounded-3xl p-4 text-center">
                      <div className="text-lg font-black text-[#0B1D33] leading-none">{likedArticles.length}</div>
                      <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">CURTIDAS</div>
                    </div>
                    <div className="bg-[#F0F4F8] rounded-3xl p-4 text-center">
                      <div className="text-lg font-black text-[#0B1D33] leading-none">{savedArticles.length}</div>
                      <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">SALVOS</div>
                    </div>
                    <div className="bg-[#F0F4F8] rounded-3xl p-4 text-center border-2 border-yellow-400/20">
                      <div className="text-lg font-black text-[#0B1D33] leading-none">MVP</div>
                      <div className="text-[8px] font-black text-yellow-500 uppercase tracking-widest mt-1">RANK</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => setEditMode(true)}
                      className="w-full bg-[#0B1D33] text-white py-4 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[#0B1D33]/20 active:scale-[0.98] transition-all"
                    >
                      Editar Perfil
                    </button>

                    <button
                      onClick={signOut}
                      className="w-full bg-black/5 text-gray-500 py-4 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      Sair da conta
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-yellow-400 p-0.5">
                      <img src={effectiveAvatar} className="w-full h-full rounded-full object-cover" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Informações Básicas</label>
                    <input
                      className={inputClasses}
                      placeholder="Seu Nome Real"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={loading}
                    />

                    <input
                      className={inputClasses}
                      placeholder="Nickname (Ex: @samu)"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value.substring(0, 20))}
                      disabled={loading}
                      maxLength={20}
                    />

                    <textarea
                      className={`${inputClasses} h-24 resize-none`}
                      placeholder="Bio curta..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value.substring(0, 160))}
                      disabled={loading}
                      maxLength={160}
                    />

                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 block mt-4">Avatar da Conta</label>
                    <div className="space-y-2">
                      <input
                        className={inputClasses}
                        placeholder="URL da sua foto (PNG/JPG)"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value.substring(0, 500))}
                        disabled={loading}
                        maxLength={500}
                      />

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAvatarUrl(dicebear(nickname || displayName || "User"))}
                          className="flex-1 py-3 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] bg-[#0B1D33]/5 text-[#0B1D33] hover:bg-[#0B1D33]/10 transition-colors"
                        >
                          Gerar Random
                        </button>
                        <button
                          type="button"
                          onClick={() => setAvatarUrl("")}
                          className="py-3 px-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] bg-black/5 text-gray-400 hover:text-red-500"
                          title="Voltar para automático"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 space-y-3">
                    <button
                      onClick={save}
                      disabled={loading}
                      className="w-full bg-yellow-400 text-black py-4 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-yellow-400/20 disabled:opacity-60 active:scale-[0.98] transition-all"
                    >
                      {loading ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                    </button>

                    <button
                      onClick={() => setEditMode(false)}
                      className="w-full text-gray-400 py-2 font-black text-[9px] uppercase tracking-[0.2em] hover:text-[#0B1D33] transition-colors"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              )}
            </div>
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
