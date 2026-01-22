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

// Home sections (opcionais)
import FeaturedReaders from "./components/FeaturedReaders";
import FeaturedAuthors from "./components/FeaturedAuthors";

// Data
import { fetchPublishedArticlesJoined } from "./services/articles";
import { Article, Category, SortOption } from "./types";

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
  const isAdminRoute = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get("admin") === "1";
    } catch {
      return false;
    }
  }, []);

  // ===== Boot session + role =====
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setAdminError(null);

      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id ?? null;

        if (!mounted) return;

        setSessionUserId(userId);

        if (!userId) {
          setRole(null);
          return;
        }

        const r = await getMyRole();
        if (!mounted) return;

        setRole((r as any) ?? null);
      } catch (e: any) {
        console.error("boot auth error:", e);
        if (!mounted) return;
        setSessionUserId(null);
        setRole(null);
        setAdminError(e?.message ?? "Erro ao validar sessão (Supabase).");
      } finally {
        if (mounted) setAuthReady(true);
      }
    };

    load();

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const userId = session?.user?.id ?? null;
      setSessionUserId(userId);

      if (!userId) {
        setRole(null);
        return;
      }

      try {
        const r = await getMyRole();
        if (!mounted) return;
        setRole((r as any) ?? null);
      } catch (e) {
        console.error("role check error:", e);
        if (!mounted) return;
        setRole(null);
        setAdminError("Erro ao validar sessão (Supabase).");
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

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
    // aqui é só “efeito” pra UI (não depende de IA)
    setIsAIProcessing(true);
    setTimeout(() => setIsAIProcessing(false), 450);
  };

  // ===== Share =====
  const onShare = (a: Article) => {
    setShareArticle(a);
    setShareOpen(true);
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
        const hay = [
          a.title,
          a.description,
          a.content,
          a.author,
          ...(a.tags ?? []),
        ]
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
      if (sortOption === "SALVOS") {
        // se você tiver “saved” no Article depois, pluga aqui; por enquanto mantém estável
        return (b.likes ?? 0) - (a.likes ?? 0);
      }
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
            <button
              onClick={() => setAuthOpen(true)}
              className="mt-6 w-full bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
            >
              Entrar
            </button>
          </div>

          <AuthPopup isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        </div>
      );
    }

    return (
      <div className="bg-black min-h-screen">
        <AdminPanel />
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
        <NotificationPopup
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          isDarkMode={isDarkMode}
        />
      </>
    );
  }

  // ===== App shell =====
  return (
    <div className={isDarkMode ? "bg-black text-white min-h-screen" : "bg-[#FDFBF4] text-[#0B1D33] min-h-screen"}>
      <div className={`max-w-md mx-auto min-h-screen ${isDarkMode ? "bg-black" : "bg-[#FDFBF4]"}`}>
        <Header
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode((v) => !v)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenAuth={() => setAuthOpen(true)}
          hasNewNotifications={true}
        />

        <main className="pb-28">
          {/* Busca */}
          <SearchBar onSearch={onSearch} isAIProcessing={isAIProcessing} isDarkMode={isDarkMode} />

          {/* Erros (role / artigos) */}
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

          {/* INÍCIO */}
          {activeTab === Category.INICIO && (
            <>
              <FeaturedReaders isDarkMode={isDarkMode} />
              <FeaturedAuthors isDarkMode={isDarkMode} />
            </>
          )}

          {/* NOTÍCIAS / demais abas com artigos */}
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
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />

        {/* Popups */}
        <AuthPopup isOpen={authOpen} onClose={() => setAuthOpen(false)} />

        <NotificationPopup
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          isDarkMode={isDarkMode}
        />

        <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} article={shareArticle} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}
