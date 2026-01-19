import React, { useEffect, useMemo, useRef, useState } from "react";

import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import BottomNav from "./components/BottomNav";
import NotificationPopup from "./components/NotificationPopup";
import AuthPopup from "./components/AuthPopup";
import AdminPanel from "./components/AdminPanel";

import { supabase } from "./lib/supabase";
import { getMyRole } from "./admin";

import { askGeminiAboutBasketball } from "../services/geminiService";
import { Category } from "./types";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Category>(Category.INICIO);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Admin
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const isAdminMode = useMemo(() => {
    return new URLSearchParams(window.location.search).get("admin") === "1";
  }, []);

  // Boot auth com timeout de segurança
  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(() => {
      if (mounted) {
        setAuthError("Timeout ao validar sessão (Supabase).");
        setAuthReady(true);
      }
    }, 8000); // 8s no máximo

    async function boot() {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (session?.user) {
          const role = await getMyRole();
          if (mounted) setIsAdmin(role === "admin");
        }

        if (mounted) setAuthReady(true);
      } catch (e) {
        console.error("Erro auth:", e);
        if (mounted) {
          setAuthError("Erro ao validar sessão (Supabase).");
          setAuthReady(true);
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    boot();

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

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
    } catch {
      setAiResponse("Erro ao consultar a Antas AI.");
    } finally {
      setIsAIProcessing(false);
    }
  };

  // Loading
  if (!authReady) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  // Erro de auth
  if (authError) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-xl font-bold mb-2">Erro no Admin</h1>
        <p className="text-red-400 text-sm">{authError}</p>
      </div>
    );
  }

  // Admin gate
  if (isAdminMode) {
    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center text-center px-6">
          <div>
            <h1 className="text-xl font-bold">Acesso restrito</h1>
            <p className="text-gray-400 mt-2">
              Faça login com uma conta admin e acesse novamente em:
            </p>
            <p className="text-yellow-400 mt-1">/?admin=1</p>
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

  // App normal
  return (
    <div
      className={`min-h-screen flex flex-col pb-32 max-w-md mx-auto transition-all duration-500 ${
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
        <SearchBar
          isDarkMode={isDarkMode}
          onSearch={handleSearch}
          isAIProcessing={isAIProcessing}
        />

        {aiResponse && (
          <div className="px-6 mt-4">
            <div className="bg-white/5 rounded-xl p-4 text-sm italic">
              {aiResponse}
            </div>
          </div>
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDarkMode={isDarkMode}
      />

      <NotificationPopup
        isDarkMode={isDarkMode}
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />
      <AuthPopup isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export default App;
