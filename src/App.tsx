// src/App.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import BottomNav from "./components/BottomNav";
import NotificationPopup from "./components/NotificationPopup";
import AuthPopup from "./components/AuthPopup";
import AdminPanel from "./components/AdminPanel";

import { supabase } from "./lib/supabase";
import { getMyRole, type UserRole } from "./admin";

// ✅ ajuste conforme sua estrutura:
// se estiver em src/services/geminiService.ts:
import { askGeminiAboutBasketball } from "./services/geminiService";

import { Category, SortOption } from "./types";

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

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Category>(Category.INICIO);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [sortOption, setSortOption] = useState<SortOption>("RECENTES");

  // ===== Auth / Admin =====
  const [authReady, setAuthReady] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  // ===== UI extras =====
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const subTabsRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  // Admin mode via querystring
  const isAdminMode = useMemo(() => {
    return new URLSearchParams(window.location.search).get("admin") === "1";
  }, []);

  // Helper: força navegar para admin (sem React Router)
  const goAdmin = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("admin", "1");
    window.location.href = url.toString();
  };

  const goHome = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("admin");
    window.location.href = url.toString();
  };

  // Boot session + role
  useEffect(() => {
    let mounted = true;

    async function resolveRoleWithRetry(): Promise<UserRole | null> {
      // 2 tentativas leves (resolve muitos AbortError aleatórios)
      let r = await withTimeout(getMyRole(), 8000);
      if (!r) {
        await sleep(400);
        r = await withTimeout(getMyRole(), 8000);
      }
      return r ?? null;
    }

    async function loadSessionAndRole() {
      setAdminError(null);

      try {
        // 1) pega sessão local
        const { data } = await withTimeout(supabase.auth.getSession(), 8000);
        const userId = data.session?.user?.id ?? null;

        if (!mounted) return;

        setSessionUserId(userId);

        if (!userId) {
          setRole(null);
          setAuthReady(true);
          return;
        }

        // 2) busca role
        try {
          const r = await resolveRoleWithRetry();
          if (!mounted) return;

          setRole(r);

          // ✅ Se logou e é admin, redireciona pro admin automaticamente
          // (só se não estiver no admin ainda)
          if (r === "admin" && !isAdminMode) {
            goAdmin();
            return; // evita render “piscar”
          }
        } catch (e: any) {
          if (!mounted) return;
          console.error("role error:", e);
          // não trava tudo — deixa como não-admin
          setRole(null);

          // se quiser mostrar mensagem só quando estiver no /admin
          if (isAdminMode) setAdminError("Erro ao validar sessão (Supabase).");
        }

        setAuthReady(true);
      } catch (e) {
        if (!mounted) return;
        console.error("session error:", e);
        setSessionUserId(null);
        setRole(null);
        setAuthReady(true);

        if (isAdminMode) setAdminError("Timeout ao validar sessão (Supabase).");
      }
    }

    loadSessionAndRole();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const userId = session?.user?.id ?? null;
      setSessionUserId(userId);

      if (!userId) {
        setRole(null);
        // se estiver no admin, manda pra home
        if (isAdminMode) goHome();
        return;
      }

      try {
        const r = await resolveRoleWithRetry();
        if (!mounted) return;

        setRole(r);

        // ✅ após login, se for admin, vai pro admin
        if (r === "admin" && !isAdminMode) {
          goAdmin();
          return;
        }
      } catch (e) {
        if (!mounted) return;
        console.error("auth change role error:", e);
        setRole(null);
        if (isAdminMode) setAdminError("Erro ao validar sessão (Supabase).");
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ===== Boot screen =====
  if (!authReady) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  // ===== Admin gate =====
  if (isAdminMode) {
    if (adminError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
          <div>
            <div className="text-2xl font-black mb-2">Erro no Admin</div>
            <div className="text-red-400 font-medium">{adminError}</div>
            <button
              className="mt-6 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 transition"
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
              Faça login com uma conta <b>admin</b> e tente novamente.
            </div>
            <button
              className="mt-6 px-5 py-3 rounded-2xl bg-yellow-400 text-black font-black"
              onClick={goHome}
            >
              Voltar pro site
            </button>
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
  return (
    <div
      className={`min-h-screen flex flex-col pb-32 max-w-md mx-auto relative transition-all duration-500 ${
        isDarkMode ? "bg-black text-white" : "bg-[#FDFBF4] text-[#0B1D33]"
      }`}
    >
      {/* Barra de progresso opcional */}
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
