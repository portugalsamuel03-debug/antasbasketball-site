import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import { getMyRole } from "./admin";

// UI components
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import SearchBar from "./components/SearchBar";
import SectionTitle from "./components/SectionTitle";
import ArticleCard from "./components/ArticleCard";
import ArticleView from "./components/ArticleView";
import ShareModal from "./components/ShareModal";
import NotificationPopup from "./components/NotificationPopup";
import AuthPopup from "./components/AuthPopup";
import AdminPanel from "./components/AdminPanel";

// Home sections (opcionais)
import FeaturedReaders from "./components/FeaturedReaders";
import FeaturedAuthors from "./components/FeaturedAuthors";

// Data
import { fetchPublishedArticlesJoined } from "./services/articles";
import { Article, Category, SortOption } from "./types";

type Role = "admin" | "reader";
type RoleState = Role | "unknown"; // <-- novo: unknown = ainda validando
type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  favorite_team: string | null;
  role: Role;
  updated_at?: string | null; // ✅ ADICIONADO
};

function safeSearchParam(name: string) {
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

function dicebear(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

const ProfileModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}> = ({ isOpen, onClose, userId }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [showAvatars, setShowAvatars] = useState(false);

  const avatarSeeds = useMemo(
    () => ["Antas", "Basket", "MVP", "Rookie", "AllStar", "GOAT", "Playoffs", "Squad", "Crossover", "Dunk"],
    []
  );

  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name,nickname,avatar_url")
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;

        setDisplayName(data?.display_name ?? "");
        setNickname(data?.nickname ?? "");
        setAvatarUrl(data?.avatar_url ?? "");
      } catch (e: any) {
        setErr(e?.message ?? "Erro ao carregar perfil.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, userId]);

  async function save() {
    setErr(null);
    setLoading(true);
    try {
      const payload: Partial<ProfileRow> = {
        display_name: displayName.trim() || null,
        nickname: nickname.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        updated_at: new Date().toISOString(), // ✅ SEM "as any"
      };

      const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
      if (error) throw error;

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

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[#0B1D33]/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-[34px] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <div className="px-7 pt-7 pb-5 border-b border-black/5 flex justify-between items-center">
          <div>
            <div className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400">Conta</div>
            <div className="text-2xl font-black italic tracking-tighter text-[#0B1D33]">SEU PERFIL</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 text-gray-500">
            ✕
          </button>
        </div>

        <div className="p-7 space-y-3">
          {err && (
            <div className="text-[12px] font-bold bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-red-600">
              {err}
            </div>
          )}

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
                onClick={() => setShowAvatars((v) => !v)}
                className="flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] bg-[#0B1D33]/5 text-[#0B1D33]"
              >
                {showAvatars ? "Fechar sugestões" : "Sugestões de avatar"}
              </button>
              <button
                type="button"
                onClick={() => setAvatarUrl(dicebear(nickname || displayName || "User"))}
                className="py-3 px-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] bg-yellow-400 text-black"
                title="Gerar automático"
              >
                Auto
              </button>
            </div>

            {showAvatars && (
              <div className="grid grid-cols-5 gap-2 pt-1">
                {avatarSeeds.map((s) => {
                  const url = dicebear(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`rounded-2xl p-2 border transition ${
                        avatarUrl === url ? "border-yellow-400" : "border-black/10 hover:border-black/20"
                      }`}
                      title={s}
                    >
                      <img src={url} className="w-10 h-10 rounded-full" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={save}
            disabled={loading}
            className="w-full bg-[#5C6773] text-white py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] disabled:opacity-60"
          >
            {loading ? "SALVANDO..." : "SALVAR"}
          </button>

          <button
            onClick={signOut}
            className="w-full bg-[#0B1D33]/5 text-[#0B1D33] py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
          >
            SAIR DA CONTA
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  // ===== Auth / Role =====
  const [authReady, setAuthReady] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  // role agora tem "unknown" (validando), e não derruba sua sessão em erro
  const [role, setRole] = useState<RoleState>("unknown");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [roleChecking, setRoleChecking] = useState(false);

  // Perfil
  const [profileOpen, setProfileOpen] = useState(false);

  // ===== UI =====
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<Category>(Category.NOTICIAS);

  const [authOpen, setAuthOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [sortOption, setSortOption] = useState<SortOption>("RECENTES");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // ===== Articles =====
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  // ===== Article view / share =====
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareArticle, setShareArticle] = useState<Article | null>(null);

  // /?admin=1 abre painel
  const isAdminRoute = useMemo(() => safeSearchParam("admin") === "1", []);

  // evita corrida / setState depois de unmount
  const mountedRef = useRef(true);

  // ===== Helpers: role cache + timeout =====
  const roleCacheKey = useMemo(() => (sessionUserId ? `antas_role:${sessionUserId}` : null), [sessionUserId]);

  function getCachedRole(): Role | null {
    if (!roleCacheKey) return null;
    try {
      const v = sessionStorage.getItem(roleCacheKey);
      return v === "admin" || v === "reader" ? (v as Role) : null;
    } catch {
      return null;
    }
  }

  function setCachedRole(r: Role) {
    if (!roleCacheKey) return;
    try {
      sessionStorage.setItem(roleCacheKey, r);
    } catch {
      // ignore
    }
  }

  async function getRoleWithTimeout(): Promise<Role> {
    const controller = new AbortController();
    const t = window.setTimeout(() => controller.abort(), 20000);

    try {
      const r = await getMyRole();
      const normalized = (r as Role) === "admin" ? "admin" : "reader";
      return normalized;
    } finally {
      window.clearTimeout(t);
    }
  }

  async function refreshRole(reason: string) {
    if (!sessionUserId) return;

    setRoleChecking(true);
    setAdminError(null);

    const cached = getCachedRole();
    if (cached) setRole(cached);

    try {
      const r = await getRoleWithTimeout();
      if (!mountedRef.current) return;

      setRole(r);
      setCachedRole(r);
    } catch (e: any) {
      console.error(`refreshRole error (${reason}):`, e);
      if (!mountedRef.current) return;

      const cached2 = getCachedRole();
      if (cached2) setRole(cached2);
      else setRole("unknown");

      setAdminError(e?.message ?? "Falha ao validar permissão de admin (role).");
    } finally {
      if (mountedRef.current) setRoleChecking(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;

    const load = async () => {
      setAdminError(null);

      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id ?? null;

        if (!mountedRef.current) return;

        setSessionUserId(userId);

        if (!userId) {
          setRole("unknown");
          return;
        }

        const cached = getCachedRole();
        if (cached) setRole(cached);
        else setRole("unknown");

        await refreshRole("boot");
      } catch (e: any) {
        console.error("boot auth error:", e);
        if (!mountedRef.current) return;
        setAdminError(e?.message ?? "Erro ao validar sessão (Supabase).");
      } finally {
        if (mountedRef.current) setAuthReady(true);
      }
    };

    load();

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const userId = session?.user?.id ?? null;
      setSessionUserId(userId);

      if (!userId) {
        setRole("unknown");
        return;
      }

      const cached = getCachedRole();
      if (cached) setRole(cached);
      else setRole("unknown");

      await refreshRole("authStateChange");
    });

    return () => {
      mountedRef.current = false;
      data.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("antas_theme");
    if (saved === "light") setIsDarkMode(false);
    if (saved === "dark") setIsDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("antas_theme", isDarkMode ? "dark" : "light");
    document.body.style.background = isDarkMode ? "#000" : "#FDFBF4";
  }, [isDarkMode]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoadingArticles(true);
      setArticlesError(null);

      try {
        const list = await fetchPublishedArticlesJoined();
        if (!alive) return;
        setArticles(list);
      } catch (e: any) {
        console.error("fetchPublishedArticlesJoined error:", e);
        if (!alive) return;
        setArticlesError(e?.message ?? "Erro ao carregar artigos.");
      } finally {
        if (alive) setLoadingArticles(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  const onSearch = async (q: string) => {
    setSearchQuery(q);
    setIsAIProcessing(true);
    setTimeout(() => setIsAIProcessing(false), 450);
  };

  const onShare = (a: Article) => {
    setShareArticle(a);
    setShareOpen(true);
  };

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = articles;

    if (activeTab && activeTab !== Category.INICIO) {
      list = list.filter((a) => a.category === activeTab);
    }

    if (q) {
      list = list.filter((a) => {
        const hay = [a.title, a.description, a.content, a.author, ...(a.tags ?? [])]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortOption === "RECENTES") return (b.date ?? "").localeCompare(a.date ?? "");
      if (sortOption === "ANTIGOS") return (a.date ?? "").localeCompare(b.date ?? "");
      if (sortOption === "CURTIDOS") return (b.likes ?? 0) - (a.likes ?? 0);
      if (sortOption === "COMENTADOS") return (b.commentsCount ?? 0) - (a.commentsCount ?? 0);
      if (sortOption === "SALVOS") return (b.likes ?? 0) - (a.likes ?? 0);
      return 0;
    });

    return sorted;
  }, [articles, activeTab, searchQuery, sortOption]);

  if (!authReady) {
    return (
      <div className={isDarkMode ? "bg-black text-white min-h-screen" : "bg-[#FDFBF4] text-[#0B1D33] min-h-screen"}>
        <div className="max-w-md mx-auto px-6 py-10">
          <div className="text-xs font-black uppercase tracking-widest text-yellow-400">Antas Basketball</div>
          <div className="mt-3 text-sm text-gray-400">Carregando…</div>
        </div>
      </div>
    );
  }

  if (isAdminRoute) {
    if (role === "unknown") {
      return (
        <div className={isDarkMode ? "bg-black text-white min-h-screen" : "bg-[#FDFBF4] text-[#0B1D33] min-h-screen"}>
          <div className="max-w-md mx-auto px-6 py-10">
            <div className="text-xs font-black uppercase tracking-widest text-yellow-400">Verificando acesso…</div>
            <div className="mt-3 text-sm text-gray-400">
              Estamos validando sua permissão de <span className="text-yellow-400 font-bold">admin</span>.
            </div>

            {adminError && (
              <div className="mt-4 text-[12px] font-bold bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-red-200">
                {adminError}
              </div>
            )}

            <button
              onClick={() => refreshRole("manualRetry")}
              disabled={roleChecking}
              className="mt-6 w-full bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] disabled:opacity-60"
            >
              {roleChecking ? "VERIFICANDO..." : "TENTAR NOVAMENTE"}
            </button>
          </div>
        </div>
      );
    }

    if (role !== "admin") {
      return (
        <div className={isDarkMode ? "bg-black text-white min-h-screen" : "bg-[#FDFBF4] text-[#0B1D33] min-h-screen"}>
          <div className="max-w-md mx-auto px-6 py-10">
            <div className="text-xs font-black uppercase tracking-widest text-yellow-400">Acesso negado</div>
            <div className="mt-3 text-sm text-gray-400">
              Você precisa estar logado como <span className="text-yellow-400 font-bold">admin</span>.
            </div>

            {adminError && (
              <div className="mt-4 text-[12px] font-bold bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-red-200">
                {adminError}
              </div>
            )}

            <button
              onClick={() => setAuthOpen(true)}
              className="mt-6 w-full bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
            >
              Entrar
            </button>

            <button
              onClick={() => refreshRole("manualRetryDenied")}
              disabled={roleChecking}
              className="mt-3 w-full bg-white/10 text-white py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] disabled:opacity-60"
            >
              {roleChecking ? "VERIFICANDO..." : "Revalidar permissão"}
            </button>
          </div>

          <AuthPopup isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        </div>
      );
    }

    return (
      <div className="bg-black min-h-screen">
        <AdminPanel />
        {sessionUserId && <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} userId={sessionUserId} />}
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <>
        <ArticleView article={selectedArticle} onBack={() => setSelectedArticle(null)} onShare={onShare} isDarkMode={isDarkMode} />

        <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} article={shareArticle} isDarkMode={isDarkMode} />

        <AuthPopup isOpen={authOpen} onClose={() => setAuthOpen(false)} />

        <NotificationPopup isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} isDarkMode={isDarkMode} />

        {sessionUserId && <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} userId={sessionUserId} />}
      </>
    );
  }

  const handleUserClick = () => {
    if (sessionUserId) setProfileOpen(true);
    else setAuthOpen(true);
  };

  const handleEditFromCard = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("admin", "1");
    url.searchParams.set("edit", id);
    window.location.assign(url.toString());
  };

  return (
    <div className={isDarkMode ? "bg-black text-white min-h-screen" : "bg-[#FDFBF4] text-[#0B1D33] min-h-screen"}>
      <div className={`max-w-md mx-auto min-h-screen ${isDarkMode ? "bg-black" : "bg-[#FDFBF4]"}`}>
        <Header
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode((v) => !v)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenAuth={handleUserClick}
          hasNewNotifications={true}
        />

        <main className="pb-28">
          <SearchBar onSearch={onSearch} isAIProcessing={isAIProcessing} isDarkMode={isDarkMode} />

          {adminError && (
            <div className="px-6">
              <div className="text-[12px] font-bold bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-red-200">
                {adminError}
              </div>
            </div>
          )}

          {articlesError && (
            <div className="px-6 mt-4">
              <div className="text-[12px] font-bold bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-red-200">
                {articlesError}
              </div>
            </div>
          )}

          {activeTab === Category.INICIO && (
            <>
              <FeaturedReaders isDarkMode={isDarkMode} />
              <FeaturedAuthors isDarkMode={isDarkMode} />
            </>
          )}

          {activeTab !== Category.INICIO && (
            <>
              <SectionTitle title={String(activeTab)} sortOption={sortOption} onSortChange={setSortOption} isDarkMode={isDarkMode} />

              {loadingArticles ? (
                <div className="px-6 text-sm text-gray-400">Carregando posts…</div>
              ) : filteredArticles.length === 0 ? (
                <div className="px-6 text-sm text-gray-400">
                  Nada por aqui ainda {searchQuery ? `pra “${searchQuery}”.` : "nessa categoria."}
                </div>
              ) : (
                <div className="px-6">
                  {filteredArticles.map((a) => (
                    <ArticleCard
                      key={a.id}
                      article={a}
                      onClick={() => setSelectedArticle(a)}
                      onShare={onShare}
                      isDarkMode={isDarkMode}
                      isAdmin={role === "admin"}
                      onEdit={handleEditFromCard}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />

        <AuthPopup isOpen={authOpen} onClose={() => setAuthOpen(false)} />

        {sessionUserId && <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} userId={sessionUserId} />}

        <NotificationPopup isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} isDarkMode={isDarkMode} />

        <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} article={shareArticle} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}
