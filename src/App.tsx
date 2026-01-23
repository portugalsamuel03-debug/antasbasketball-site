import React, { useEffect, useMemo, useState } from "react";
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
import ProfilePopup from "./components/ProfilePopup";

// Home sections (opcionais)
import FeaturedReaders from "./components/FeaturedReaders";
import FeaturedAuthors from "./components/FeaturedAuthors";

// Data
import { fetchPublishedArticlesJoined } from "./services/articles";
import { Article, Category, SortOption } from "./types";

// helper: timeout para promessas (evita “Carregando…” infinito)
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout: ${label} (${ms}ms)`)), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export default function App() {
  // ===== Auth / Role =====
  const [authReady, setAuthReady] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "reader" | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  // ===== UI =====
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<Category>(Category.NOTICIAS);

  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
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

  // ===== URL flags =====
  const isAdminRoute = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get("admin") === "1";
    } catch {
      return false;
    }
  }, []);

  // ===== Boot session + role (robusto com timeout) =====
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setAdminError(null);

      try {
        // 1) Session (com timeout)
        const { data } = await withTimeout(supabase.auth.getSession(), 7000, "getSession");
        const userId = data.session?.user?.id ?? null;

        if (!mounted) return;

        setSessionUserId(userId);

        // ✅ libera o app mesmo que role demore
        setAuthReady(true);

        // 2) Role (com timeout)
        if (userId) {
          const r = await withTimeout(getMyRole(), 7000, "getMyRole");
          if (!mounted) return;
          setRole((r as any) ?? null);
        } else {
          setRole(null);
        }
      } catch (e: any) {
        console.error("boot auth error:", e);
        if (!mounted) return;

        // ✅ nunca travar em loading
        setSessionUserId(null);
        setRole(null);
        setAdminError(e?.message ?? "Erro ao validar sessão (Supabase).");
        setAuthReady(true);
      }
    };

    load();

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const userId = session?.user?.id ?? null;
      setSessionUserId(userId);
      setAdminError(null);

      // ✅ libera o app sempre
      setAuthReady(true);

      if (!userId) {
        setRole(null);
        return;
      }

      try {
        const r = await withTimeout(getMyRole(), 7000, "getMyRole");
        if (!mounted) return;
        setRole((r as any) ?? null);
      } catch (e: any) {
        console.error("role check error:", e);
        if (!mounted) return;
        setRole(null);
        setAdminError(e?.message ?? "Erro ao validar role (Supabase).");
      }
    });

    return () => {
      mounted = false;
      try {
        data.subscription.unsubscribe();
      } catch {}
    };
  }, []);

  // ✅ Admin logou -> redireciona para /?admin=1 sem recarregar
  useEffect(() => {
    if (!authReady) return;
    if (!sessionUserId) return;
    if (role !== "admin") return;

    try {
      const params = new URLSearchParams(window.location.search);
      const alreadyAdmin = params.get("admin") === "1";
      if (alreadyAdmin) return;

      params.set("admin", "1");
      params.delete("edit");
      const next = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", next);
    } catch {
      // fallback: se algo der ruim, não quebra
    }
  }, [authReady, sessionUserId, role]);

  // ===== Theme =====
  useEffect(() => {
    const saved = localStorage.getItem("antas_theme");
    if (saved === "light") setIsDarkMode(false);
    if (saved === "dark") setIsDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("antas_theme", isDarkMode ? "dark" : "light");
    document.body.style.background = isDarkMode ? "#000" : "#FDFBF4";
  }, [isDarkMode]);

  // ===== Load articles =====
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

  // ===== Search =====
  const onSearch = async (q: string) => {
    setSearchQuery(q);
    setIsAIProcessing(true);
    setTimeout(() => setIsAIProcessing(false), 450);
  };

  // ===== Share =====
  const onShare = (a: Article) => {
    setShareArticle(a);
    setShareOpen(true);
  };

  // ✅ Clique no boneco: Auth (se não logado) ou Perfil (se logado)
  const onUserPress = () => {
    if (sessionUserId) setProfileOpen(true);
    else setAuthOpen(true);
  };

  // ✅ Admin: ir pro painel já editando o post
  const goAdminEdit = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("admin", "1");
    url.searchParams.set("edit", id);
    window.location.assign(url.toString());
  };

  // ===== Sorting + filtering =====
  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let list = articles;

    // filtra por categoria (aba)
    if (activeTab && activeTab !== Category.INICIO) {
      list = list.filter((a) => a.category === activeTab);
    }

    // busca simples
    if (q) {
      list = list.filter((a) => {
        const hay = [a.title, a.description, a.content, a.author, ...(a.tags ?? [])]
          .join(" ")
          .toLowerCase();

        return hay.includes(q);
      });
    }

    // ordenação
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

  // ===== Loading screen =====
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

  // ===== Admin route =====
  if (isAdminRoute) {
    if (role !== "admin") {
      return (
        <div className={isDarkMode ? "bg-black text-white min-h-screen" : "bg-[#FDFBF4] text-[#0B1D33] min-h-screen"}>
          <div className="max-w-md mx-auto px-6 py-10">
            <div className="text-xs font-black uppercase tracking-widest text-yellow-400">Acesso negado</div>
            <div className="mt-3 text-sm text-gray-400">
              Você precisa estar logado como <span className="text-yellow-400 font-bold">admin</span>.
            </div>

            {!!adminError && (
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
          </div>

          <AuthPopup isOpen={authOpen} onClose={() => setAuthOpen(false)} />
          <ProfilePopup isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
        </div>
      );
    }

    return (
      <div className="bg-black min-h-screen">
        <AdminPanel />
        <AuthPopup isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        <ProfilePopup isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      </div>
    );
  }

  // ===== Article opened =====
  if (selectedArticle) {
    return (
      <>
        <ArticleView
          article={selectedArticle}
          onBack={() => setSelectedArticle(null)}
          onShare={onShare}
          isDarkMode={isDarkMode}
        />
        <ShareModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          article={shareArticle}
          isDarkMode={isDarkMode}
        />
        <AuthPopup isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        <ProfilePopup isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
        <NotificationPopup
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          isDarkMode={isDarkMode}
        />
      </>
    );
  }

  // ===== App shell =====
  const isAdmin = role === "admin";

  return (
    <div className={isDarkMode ? "bg-black text-white min-h-screen" : "bg-[#FDFBF4] text-[#0B1D33] min-h-screen"}>
      <div className={`max-w-md mx-auto min-h-screen ${isDarkMode ? "bg-black" : "bg-[#FDFBF4]"}`}>
        <Header
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode((v) => !v)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenAuth={onUserPress}
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
              <SectionTitle
                title={String(activeTab)}
                sortOption={sortOption}
                onSortChange={setSortOption}
                isDarkMode={isDarkMode}
              />

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
                      isAdmin={isAdmin}
                      onEdit={goAdminEdit}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />

        <AuthPopup isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        <ProfilePopup isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

        <NotificationPopup
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          isDarkMode={isDarkMode}
        />

        <ShareModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          article={shareArticle}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
}
