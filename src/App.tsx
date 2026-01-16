import React, { useEffect, useMemo, useRef, useState } from "react";

import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import BottomNav from "./components/BottomNav";
import NotificationPopup from "./components/NotificationPopup";
import AuthPopup from "./components/AuthPopup";
import AdminPanel from "./components/AdminPanel";

import { supabase, supabaseConfigError } from "./lib/supabase";
import { getMyRole } from "./admin";

// Se sua pasta services está na raiz do projeto (fora de src), isso costuma funcionar:
import { askGeminiAboutBasketball } from "../services/geminiService";

import { Category, SortOption } from "./types";

const App: React.FC = () => {
  // ======= Estado do app =======
  const [activeTab, setActiveTab] = useState<Category>(Category.INICIO);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [sortOption, setSortOption] = useState<SortOption>("RECENTES");

  // ======= Admin/Auth =======
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  // ======= Scroll / UI =======
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const subTabsRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  // ======= Admin Mode via querystring =======
  const isAdminMode = useMemo(() => {
    return new URLSearchParams(window.location.search).get("admin") === "1";
  }, []);

  // ======= Boot auth + role (NUNCA travar no loading) =======
  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        // Se supabase não inicializou (env faltando), mostra erro e sai do loading
        if (!supabase) {
          if (mounted) setBootError(supabaseConfigError || "Supabase não inicializou.");
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const session = data.session;

        if (session?.user) {
          const role = await getMyRole(); // deve retornar "admin" ou "reader"
          if (mounted) setIsAdmin(role === "admin");
        } else {
          if (mounted) setIsAdmin(false);
        }
      } catch (e: any) {
        console.error(e);
        if (mounted) setBootError(e?.message || "Erro no boot do app.");
      } finally {
        if (mounted) setAuthReady(true);
      }
    }

    boot();

    // Se não tem supabase, nem assina auth state
    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (!mounted) return;

        if (session?.user) {
          const role = await getMyRole();
          setIsAdmin(role === "admin");
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        console.error(e);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ======= Scroll progress / back to top =======
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

  // ======= Lock scroll when popup open =======
  useEffect(() => {
    if (isNotifOpen || isAuthOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isNotifOpen, isAuthOpen]);

  // ======= Theme =======
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.body.className = newMode
      ? "bg-black text-white antialiased"
      : "bg-[#FDFBF4] text-[#0B1D33] antialiased";
  };

  // ======= Search (Gemini) =======
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

  // ======= Loading (agora mostra erro se existir) =======
  if (!authReady) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
        <div>
          <div className="text-lg font-black">Carregando…</div>
          {bootError && (
            <div className="mt-3 text-sm text-red-300 whitespace-pre-wrap">{bootError}</div>
          )}
        </div>
      </div>
    );
  }

  // ======= Admin gate =======
  if (isAdminMode) {
    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
          <div>
            <div className="text-xl font-black">Admin bloqueado</div>
            <div className="text-gray-400 mt-2 text-sm">
              Você precisa estar logado com uma conta <b>admin</b>.
            </div>
            <div className="text-gray-500 mt-2 text-xs">
              Dica: abre o site normal, faz login e volta em <b>/?admin=1</b>.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black">
        <AdminPanel />
      </div>
    );
  }

  // ======= App normal =======
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
                isDarkMode
                  ? "bg-yellow-400/10 border-yellow-400/30"
                  : "bg-[#0B1D33]/5 border-[#0B1D33]/10"
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
