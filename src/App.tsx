// src/App.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import BottomNav from "./components/BottomNav";
import NotificationPopup from "./components/NotificationPopup";
import AuthPopup from "./components/AuthPopup";
import AdminPanel from "./components/AdminPanel";
import SectionTitle from "./components/SectionTitle";
import ArticleCard from "./components/ArticleCard";

import { supabase } from "./lib/supabase";
import { getMyRole } from "./admin";

import { askGeminiAboutBasketball } from "./services/geminiService";
import { fetchPublishedArticlesJoined } from "./services/articles";

import { ARTICLES, AUTHORS } from "./constants";
import { Article, Category, SortOption } from "./types";

function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((v) => {
        window.clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        window.clearTimeout(t);
        reject(e);
      });
  });
}

// DB category (sem acento) -> enum do app (com acento)
function mapDbCategoryToApp(dbCategory?: string | null): Category {
  const v = (dbCategory ?? "").toUpperCase();

  switch (v) {
    case "INICIO":
    case "INÍCIO":
      return Category.INICIO;
    case "NOTICIAS":
    case "NOTÍCIAS":
      return Category.NOTICIAS;
    case "HISTORIA":
    case "HISTÓRIA":
      return Category.HISTORIA;
    case "REGRAS":
      return Category.REGRAS;
    case "PODCAST":
      return Category.PODCAST;
    case "STATUS":
      return Category.STATUS;
    default:
      return Category.NOTICIAS;
  }
}

function ptDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Category>(Category.INICIO);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // você não está usando ainda, mas deixei pra não quebrar seu fluxo
  const [sortOption] = useState<SortOption>("RECENTES");

  // Admin/Auth
  const [authReady, setAuthReady] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Posts (site normal)
  const [articles, setArticles] = useState<Article[]>(ARTICLES);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);

  // UI extras
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const subTabsRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  const isAdminMode = useMemo(() => {
    return new URLSearchParams(window.location.search).get("admin") === "1";
  }, []);

  // Boot session + role
  useEffect(() => {
    let mounted = true;

    async function loadSessionAndRole() {
      setAdminError(null);

      try {
        const { data } = await withTimeout(supabase.auth.getSession(), 8000);
        const userId = data.session?.user?.id ?? null;

        if (!mounted) return;

        setSessionUserId(userId);

        if (!userId) {
          setRole(null);
          setAuthReady(true);
          return;
        }

        try {
          const r = await withTimeout(getMyRole(), 8000);
          if (!mounted) return;
          setRole(r ?? null);
        } catch {
          if (!mounted) return;
          setRole(null);
          setAdminError("Erro ao validar sessão (Supabase).");
        }

        setAuthReady(true);
      } catch {
        if (!mounted) return;
        setSessionUserId(null);
        setRole(null);
        setAuthReady(true);
        setAdminError("Timeout ao validar sessão (Supabase).");
      }
    }

    loadSessionAndRole();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const userId = session?.user?.id ?? null;
      setSessionUserId(userId);

      if (!userId) {
        setRole(null);
        return;
      }

      try {
        const r = await withTimeout(getMyRole(), 8000);
        if (!mounted) return;
        setRole(r ?? null);
      } catch {
        if (!mounted) return;
        setRole(null);
        setAdminError("Erro ao validar sessão (Supabase).");
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Carrega posts do Supabase pro site normal
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setIsLoadingArticles(true);

        const db = await fetchPublishedArticlesJoined();

        const mapped: Article[] = (db ?? []).map((a) => {
          const authorName = a.author?.name ?? AUTHORS?.[0]?.name ?? "ANTAS";
          const authorId = a.author?.id ?? AUTHORS?.[0]?.id ?? "a1";

          const tags =
            a.article_tags?.map((x) => x.tag?.label || x.tag?.slug).filter(Boolean) ?? [];

          return {
            id: a.id,
            authorId,
            category: mapDbCategoryToApp(a.category),
            title: a.title ?? "",
            description: a.excerpt ?? "",
            content: a.content ?? "",
            imageUrl: a.cover_url ?? "",
            likes: a.likes ?? 0,
            reactions: [],
            commentsCount: a.comments_count ?? 0,
            readTime: `${a.reading_minutes ?? 5} MIN`,
            author: authorName,
            date: ptDate(a.published_at),
            comments: [],
            tags: tags as string[],
          };
        });

        // se DB vazio, mantém constants
        const finalList = mapped.length ? mapped : ARTICLES;

        if (alive) setArticles(finalList);
      } catch (e) {
        console.error("Erro ao carregar artigos do Supabase:", e);
        if (alive) setArticles(ARTICLES);
      } finally {
        if (alive) setIsLoadingArticles(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Scroll progress / back to top
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const progress = totalScroll > 0 ? (currentScroll / totalScroll) * 100 : 0;
      setScrollProgress(progress);
      setShowBackToTop(currentScroll > 600);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock scroll when popup open
  useEffect(() => {
    if (isNotifOpen || isAuthOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isNotifOpen, isAuthOpen]);

  // Theme
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.body.className = newMode
      ? "bg-black text-white antialiased"
      : "bg-[#FDFBF4] text-[#0B1D33] antialiased";
  };

  // Search (Gemini)
  const handleSearch = async (query: string) => {
    try {
      setIsAIProcessing(true);
      const response = await askGeminiAboutBasketball(query);
      setAiResponse(response);
    } catch (e) {
      console.error(e);
      setAiResponse("Deu ruim na Antas AI. Tenta de novo em alguns segundos 😅");
    } finally {
      setIsAIProcessing(false);
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // ===== Admin gate screens =====
  if (!authReady) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  if (isAdminMode) {
    if (adminError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
          <div>
            <div className="text-2xl font-black mb-2">Erro no Admin</div>
            <div className="text-red-400 font-medium">{adminError}</div>
          </div>
        </div>
      );
    }

    const isAdmin = role === "admin";

    if (!sessionUserId || !isAdmin) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
          <div>
            <div className="text-2xl font-black mb-2">Acesso restrito</div>
            <div className="text-gray-300">
              Faça login com uma conta <b>admin</b> e acesse novamente em:
            </div>
            <div className="mt-3 font-black text-yellow-400">/?admin=1</div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black text-white">
        <AdminPanel />
      </div>
    );
  }

  // ===== App normal =====
  const visibleArticles = articles.filter((a) => {
    // INÍCIO pode mostrar tudo (ou você pode filtrar como quiser)
    if (activeTab === Category.INICIO) return true;
    return a.category === activeTab;
  });

  return (
    <div
      className={`min-h-screen flex flex-col pb-32 max-w-md mx-auto relative transition-all duration-500 ${
        isDarkMode ? "bg-black text-white" : "bg-[#FDFBF4] text-[#0B1D33]"
      }`}
    >
      {/* Barra de progresso */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[100] flex justify-center max-w-md mx-auto">
        <div
          className={`h-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(250,203,41,0.3)] ${
            isDarkMode ? "bg-yellow-400" : "bg-[#0B1D33]"
          }`}
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onOpenNotifications={() => setIsNotifOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1">
        <SearchBar isDarkMode={isDarkMode} onSearch={handleSearch} isAIProcessing={isAIProcessing} />

        {aiResponse && (
          <div className="px-6 mt-4">
            <div
              className={`border rounded-[28px] p-6 relative shadow-2xl backdrop-blur-md ${
                isDarkMode ? "bg-yellow-400/10 border-yellow-400/30" : "bg-[#0B1D33]/5 border-[#0B1D33]/10"
              }`}
            >
              <button
                onClick={() => setAiResponse(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full transition-colors text-gray-500 hover:text-white"
              >
                ✕
              </button>
              <div className="text-[11px] font-black uppercase tracking-widest text-yellow-400 mb-2">
                Antas AI
              </div>
              <p className={`text-sm italic font-medium ${isDarkMode ? "text-yellow-50/90" : "text-[#0B1D33]/80"}`}>
                "{aiResponse}"
              </p>
            </div>
          </div>
        )}

        <div className="px-6 mt-6">
          <SectionTitle title={activeTab} isDarkMode={isDarkMode} />

          {isLoadingArticles ? (
            <div className="mt-4 text-sm text-gray-400">Carregando posts…</div>
          ) : visibleArticles.length === 0 ? (
            <div className="mt-4 text-sm text-gray-400">
              Ainda não tem posts publicados nessa aba. (Publica no admin 😉)
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {visibleArticles.map((a) => (
                <ArticleCard key={a.id} article={a} isDarkMode={isDarkMode} />
              ))}
            </div>
          )}
        </div>
      </main>

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-36 right-6 p-4 rounded-full shadow-2xl z-[70] active:scale-90 ${
            isDarkMode ? "bg-yellow-400 text-black" : "bg-[#0B1D33] text-white"
          }`}
        >
          ↑
        </button>
      )}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />

      <NotificationPopup isDarkMode={isDarkMode} isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <AuthPopup isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export default App;
