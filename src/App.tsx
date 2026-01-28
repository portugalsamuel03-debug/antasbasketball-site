// src/App.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./lib/supabase";

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
import ProfilePopup from "./components/ProfilePopup";
import { EditArticleModal } from "./components/admin/EditArticleModal";
import { ArticleRow } from "./cms";
import { useAdmin } from "./context/AdminContext";
import { EditTrigger } from "./components/admin/EditTrigger";

// Home sections
import FeaturedReaders from "./components/FeaturedReaders";
import FeaturedAuthors from "./components/FeaturedAuthors";
import HistoriaPage from "./components/HistoriaPage";

// Data
import { fetchPublishedArticlesJoined } from "./services/articles";
import { Article, Category, SortOption } from "./types";

export default function App() {
  const { isEditing, userId: sessionUserId, isLoading: isAuthLoading } = useAdmin();

  // Profile management
  const [profileOpen, setProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<Category>(Category.INICIO);

  const [authOpen, setAuthOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("RECENTES");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // Articles state
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  // Focus
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareArticle, setShareArticle] = useState<Article | null>(null);
  const [editingArticleDetails, setEditingArticleDetails] = useState<Partial<ArticleRow> | null>(null);

  const mountedRef = useRef(true);

  // Initialize Theme
  useEffect(() => {
    mountedRef.current = true;
    const saved = localStorage.getItem("antas_theme") || "dark";
    setIsDarkMode(saved === "dark");
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem("antas_theme", isDarkMode ? "dark" : "light");
    document.body.style.background = isDarkMode ? "#000" : "#FDFBF4";
  }, [isDarkMode]);

  // Load logic
  const loadArticles = async () => {
    if (!mountedRef.current) return;
    setLoadingArticles(true);
    setArticlesError(null);
    console.log("App: Loading articles...");

    try {
      const arts = await fetchPublishedArticlesJoined();
      if (mountedRef.current) {
        setArticles(arts);
        console.log("App: Articles loaded successfully.");
      }
    } catch (e: any) {
      if (mountedRef.current) {
        console.error("App: Article load error:", e);
        // Ignore AbortError which is usually non-critical navigation/react cleanup
        if (e?.name !== 'AbortError' && !e?.message?.includes('aborted')) {
          setArticlesError(e?.message || "Erro ao carregar artigos.");
        }
      }
    } finally {
      if (mountedRef.current) setLoadingArticles(false);
    }
  };

  useEffect(() => {
    loadArticles();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadArticles();
    });
    return () => subscription.unsubscribe();
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

  const handleEditFromCard = (id: string, category?: string) => {
    if (id === "") {
      setEditingArticleDetails({ category });
      return;
    }
    const found = articles.find(a => a.id === id);
    if (!found) return;
    setEditingArticleDetails({
      id: found.id,
      title: found.title,
      category: String(found.category),
      content: found.content,
      cover_url: found.imageUrl,
      excerpt: found.description,
      published: true,
      reading_minutes: parseInt(found.readTime) || 5,
    });
  };

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = articles;

    if (activeTab && activeTab !== Category.INICIO) {
      list = list.filter((a) => a.category === activeTab);
    }

    if (q) {
      list = list.filter((a) => {
        const hay = [a.title, a.description, a.content, a.author, ...(a.tags ?? [])].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortOption === "RECENTES") return (b.date ?? "").localeCompare(a.date ?? "");
      if (sortOption === "ANTIGOS") return (a.date ?? "").localeCompare(b.date ?? "");
      if (sortOption === "CURTIDOS" || sortOption === "SALVOS") return (b.likes ?? 0) - (a.likes ?? 0);
      if (sortOption === "COMENTADOS") return (b.commentsCount ?? 0) - (a.commentsCount ?? 0);
      return 0;
    });

    return sorted;
  }, [articles, activeTab, searchQuery, sortOption]);

  if (isAuthLoading) {
    return (
      <div className={isDarkMode ? "bg-black text-white min-h-screen" : "bg-[#FDFBF4] text-[#0B1D33] min-h-screen"}>
        <div className="max-w-md mx-auto px-6 py-20 flex flex-col items-center">
          <div className="text-xs font-black uppercase tracking-widest text-yellow-400 animate-pulse">Antas Basketball</div>
          <div className="mt-4 text-sm text-gray-400">Aquecendo para o jogo...</div>
        </div>
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
        {sessionUserId && <ProfilePopup isOpen={profileOpen} onClose={() => setProfileOpen(false)} userId={sessionUserId} onOpenArticle={(id) => {
          const found = articles.find(a => a.id === id);
          if (found) { setProfileOpen(false); setSelectedArticle(found); }
        }} />}
      </>
    );
  }

  return (
    <div className={isDarkMode ? "bg-black text-white min-h-screen" : "bg-[#FDFBF4] text-[#0B1D33] min-h-screen"}>
      <div className={`max-w-md mx-auto min-h-screen ${isDarkMode ? "bg-black" : "bg-[#FDFBF4]"}`}>
        <Header isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(v => !v)} onOpenNotifications={() => setNotificationsOpen(true)} onOpenAuth={() => sessionUserId ? setProfileOpen(true) : setAuthOpen(true)} />

        <main className="pb-28">
          <SearchBar onSearch={onSearch} isAIProcessing={isAIProcessing} isDarkMode={isDarkMode} />

          {articlesError && (
            <div className="px-6 mt-4">
              <div className="flex flex-col items-center justify-center p-8 bg-black/10 rounded-3xl border border-red-500/20 text-center">
                <div className="text-2xl mb-2">📡</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Erro de Conexão</div>
                <div className="text-[12px] font-medium text-gray-500 mb-4">{articlesError}</div>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest rounded-xl">Tentar Novamente</button>
              </div>
            </div>
          )}

          {activeTab === Category.INICIO && (
            <>
              <FeaturedReaders isDarkMode={isDarkMode} />
              <FeaturedAuthors isDarkMode={isDarkMode} />
            </>
          )}

          {activeTab === Category.HISTORIA ? (
            <HistoriaPage articles={filteredArticles} isDarkMode={isDarkMode} onArticleClick={setSelectedArticle} onShare={onShare} onEditArticle={handleEditFromCard} />
          ) : activeTab !== Category.INICIO && (
            <>
              <SectionTitle title={String(activeTab)} sortOption={sortOption} onSortChange={setSortOption} isDarkMode={isDarkMode} />
              {isEditing && (
                <div className="px-6 mb-4 flex justify-between items-center group/admin">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ferramentas de Post ({activeTab})</div>
                  <EditTrigger type="add" onClick={() => {
                    const dbMap: Record<string, string> = { 'INÍCIO': 'INICIO', 'NOTÍCIAS': 'NOTICIAS', 'HISTÓRIA': 'HISTORIA', 'REGRAS': 'REGRAS', 'PODCAST': 'PODCAST', 'STATUS': 'STATUS' };
                    setEditingArticleDetails({ category: dbMap[String(activeTab)] || String(activeTab) });
                  }} />
                </div>
              )}
              {loadingArticles && articles.length === 0 ? (
                <div className="px-6 text-sm text-gray-400">Carregando posts…</div>
              ) : filteredArticles.length === 0 ? (
                <div className="px-6 text-sm text-gray-400">Nada por aqui ainda {searchQuery ? `pra “${searchQuery}”.` : "nessa categoria."}</div>
              ) : (
                <div className="px-6 space-y-4">
                  {filteredArticles.map(a => <ArticleCard key={a.id} article={a} onClick={() => setSelectedArticle(a)} onShare={onShare} isDarkMode={isDarkMode} isAdmin={isEditing} onEdit={handleEditFromCard} />)}
                </div>
              )}
            </>
          )}
        </main>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
        <AuthPopup isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        {sessionUserId && <ProfilePopup isOpen={profileOpen} onClose={() => setProfileOpen(false)} userId={sessionUserId} onOpenArticle={(id) => {
          const found = articles.find(a => a.id === id);
          if (found) { setProfileOpen(false); setSelectedArticle(found); }
        }} />}
        <NotificationPopup isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} isDarkMode={isDarkMode} />
        <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} article={shareArticle} isDarkMode={isDarkMode} />

        {editingArticleDetails && <EditArticleModal article={editingArticleDetails} isDarkMode={isDarkMode} onClose={() => setEditingArticleDetails(null)} onSaveSuccess={() => { window.location.reload(); }} />}
      </div>
    </div>
  );
}
