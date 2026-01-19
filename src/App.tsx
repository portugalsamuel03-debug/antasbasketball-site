// src/App.tsx
import React, { useEffect, useMemo, useState } from "react";

import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import BottomNav from "./components/BottomNav";
import NotificationPopup from "./components/NotificationPopup";
import AuthPopup from "./components/AuthPopup";
import AdminPanel from "./components/AdminPanel";

import { supabase } from "./lib/supabase";
import { getMyRole } from "./admin";

import { askGeminiAboutBasketball } from "./services/geminiService";
import { fetchPublishedArticlesJoined } from "./services/articles";

import { Category, SortOption, Article } from "./types";

const AUTO_REDIRECT_ADMIN_AFTER_LOGIN = true;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Category>(Category.INICIO);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [sortOption] = useState<SortOption>("RECENTES");

  // auth/admin
  const [authReady, setAuthReady] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "reader" | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  // feed público
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedArticles, setFeedArticles] = useState<Article[]>([]);

  const isAdminMode = useMemo(() => {
    return new URLSearchParams(window.location.search).get("admin") === "1";
  }, []);

  // ===== theme =====
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.body.className = newMode
      ? "bg-black text-white antialiased"
      : "bg-[#FDFBF4] text-[#0B1D33] antialiased";
  };

  // ===== Gemini =====
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

  // ===== lock scroll em popups =====
  useEffect(() => {
    document.body.style.overflow = isNotifOpen || isAuthOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isNotifOpen, isAuthOpen]);

  // ===== carregar sessão + role =====
  useEffect(() => {
    let mounted = true;

    async function refreshRoleFromSession(session: any) {
      setAdminError(null);

      const userId = session?.user?.id ?? null;
      setSessionUserId(userId);

      if (!userId) {
        setRole(null);
        return;
      }

      try {
        const r = await getMyRole();
        if (!mounted) return;
        setRole(r);

        // opcional: se logou e é admin, joga pra /?admin=1
        if (AUTO_REDIRECT_ADMIN_AFTER_LOGIN && r === "admin" && !isAdminMode) {
          window.location.replace("/?admin=1");
        }
      } catch (e) {
        console.error("getMyRole error:", e);
        if (!mounted) return;
        setRole(null);
        setAdminError("Erro ao validar sessão (Supabase).");
      }
    }

    async function boot() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("getSession error:", error);
        if (!mounted) return;

        await refreshRoleFromSession(data.session);
      } finally {
        if (mounted) setAuthReady(true);
      }
    }

    boot();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      await refreshRoleFromSession(session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [isAdminMode]);

  // ===== carregar feed público do Supabase =====
  useEffect(() => {
    let mounted = true;

    async function loadFeed() {
      setFeedError(null);
      setFeedLoading(true);
      try {
        const rows = await fetchPublishedArticlesJoined();
        if (!mounted) return;
        setFeedArticles(rows);
      } catch (e: any) {
        console.error("feed error:", e);
        if (!mounted) return;
        setFeedError(e?.message ?? "Erro ao carregar posts.");
      } finally {
        if (mounted) setFeedLoading(false);
      }
    }

    // carrega sempre no modo normal
    if (!isAdminMode) loadFeed();

    return () => {
      mounted = false;
    };
  }, [isAdminMode]);

  // ===== telas =====
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
            <button
              className="mt-6 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 font-black"
              onClick={() => window.location.reload()}
            >
              Recarregar
            </button>
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

  // ===== app normal =====
  return (
    <div
      className={`min-h-screen flex flex-col pb-32 max-w-md mx-auto relative transition-all duration-500 ${
        isDarkMode ? "bg-black text-white" : "bg-[#FDFBF4] text-[#0B1D33]"
      }`}
    >
      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onOpenNotifications={() => setIsNotifOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1">
        <SearchBar isDarkMode={isDarkMode} onSearch={handleSearch} isAIProcessing={isAIProcessing} />

        {/* Resposta da IA */}
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

        {/* FEED do Supabase */}
        <div className="px-6 mt-6">
          {feedLoading && <div className="text-sm text-gray-400">Carregando posts...</div>}

          {!!feedError && (
            <div className="text-sm text-red-400">
              {feedError}{" "}
              <button className="underline" onClick={() => window.location.reload()}>
                Recarregar
              </button>
            </div>
          )}

          {!feedLoading && !feedError && feedArticles.length === 0 && (
            <div className="text-sm text-gray-400">Sem posts publicados ainda.</div>
          )}

          {!feedLoading && !feedError && feedArticles.length > 0 && (
            <div className="space-y-4">
              {feedArticles.map((a) => (
                <div key={a.id} className="rounded-3xl bg-white/5 border border-white/10 p-5">
                  <div className="text-[11px] font-black tracking-widest text-yellow-400 uppercase">
                    {String(a.category)}
                  </div>
                  <div className="text-xl font-black mt-1">{a.title}</div>
                  <div className="text-sm text-gray-300 mt-2">{a.description}</div>
                  <div className="text-xs text-gray-500 mt-3">
                    {a.author} • {a.readTime}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />

      <NotificationPopup isDarkMode={isDarkMode} isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <AuthPopup isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export default App;
