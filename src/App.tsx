import React, { useEffect, useMemo, useState } from "react";

import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import BottomNav from "./components/BottomNav";
import NotificationPopup from "./components/NotificationPopup";
import AuthPopup from "./components/AuthPopup";
import AdminPanel from "./components/AdminPanel";

import { supabase, supabaseConfigError } from "./lib/supabase";
import { getMyRole } from "./admin";

import { askGeminiAboutBasketball } from "../services/geminiService";
import { Category, SortOption } from "./types";

function withTimeout<T>(p: Promise<T>, ms = 6000): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("Timeout ao validar sessão (Supabase).")), ms);
    p.then((v) => {
      clearTimeout(id);
      resolve(v);
    }).catch((e) => {
      clearTimeout(id);
      reject(e);
    });
  });
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Category>(Category.INICIO);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [sortOption, setSortOption] = useState<SortOption>("RECENTES");

  // Admin
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  const isAdminMode = useMemo(
    () => new URLSearchParams(window.location.search).get("admin") === "1",
    []
  );

  useEffect(() => {
    let mounted = true;

    async function bootAdminGate() {
      try {
        if (!supabase) {
          setBootError(supabaseConfigError || "Supabase não inicializou.");
          return;
        }

        const { data } = await withTimeout(supabase.auth.getSession(), 6000);
        const session = data.session;

        if (session?.user) {
          const role = await withTimeout(getMyRole(), 6000);
          if (mounted) setIsAdmin(role === "admin");
        } else {
          if (mounted) setIsAdmin(false);
        }
      } catch (e: any) {
        console.error(e);
        if (mounted) setBootError(e?.message || "Erro ao validar admin.");
        if (mounted) setIsAdmin(false);
      } finally {
        if (mounted) setAdminChecked(true);
      }
    }

    // Só valida admin se estiver em modo admin
    if (isAdminMode) bootAdminGate();
    else setAdminChecked(true);

    return () => {
      mounted = false;
    };
  }, [isAdminMode]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.body.className = newMode
      ? "bg-black text-white antialiased"
      : "bg-[#FDFBF4] text-[#0B1D33] antialiased";
  };

  const handleSearch = async (query: string) => {
    try {
      setIsAIProcessing(true);
      const response = await askGeminiAboutBasketball(query);
      setAiResponse(response);
    } catch (e) {
      console.error(e);
      setAiResponse("Deu ruim na Antas AI. Tenta de novo 😅");
    } finally {
      setIsAIProcessing(false);
    }
  };

  // ===== ADMIN VIEW =====
  if (isAdminMode) {
    if (!adminChecked) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          Carregando…
        </div>
      );
    }

    if (bootError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
          <div>
            <div className="text-xl font-black">Erro no Admin</div>
            <div className="mt-3 text-sm text-red-300 whitespace-pre-wrap">{bootError}</div>
          </div>
        </div>
      );
    }

    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
          <div>
            <div className="text-xl font-black">Admin bloqueado</div>
            <div className="text-gray-400 mt-2 text-sm">
              Faça login com a conta admin e recarregue <b>/?admin=1</b>.
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

  // ===== NORMAL VIEW =====
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

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />

      <NotificationPopup isDarkMode={isDarkMode} isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <AuthPopup isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export default App;
