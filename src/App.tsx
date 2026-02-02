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

import { CardSkeleton } from "./components/CardSkeleton";
import { EmptyState } from "./components/EmptyState";

// Home sections
import FeaturedReaders from "./components/FeaturedReaders";
import FeaturedAuthors from "./components/FeaturedAuthors";
import HistoriaPage from "./components/HistoriaPage";
import { FeaturedPost } from "./components/FeaturedPost";
import { CategoryManager } from "./components/admin/CategoryManager";
import { List } from 'lucide-react';

// Data
import { fetchPublishedArticlesJoined } from "./services/articles";
import { Article, Category, SortOption } from "./types";

export default function App() {
  const { isEditing, userId: sessionUserId, isLoading: isAuthLoading } = useAdmin();

  // Local UI State
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
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  // Focus
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareArticle, setShareArticle] = useState<Article | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [editingArticleDetails, setEditingArticleDetails] = useState<Partial<ArticleRow> | null>(null);

  const mountedRef = useRef(true);
  const lastLoadId = useRef(0);

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

  // Loading Logic
  const loadArticles = async () => {
    if (!mountedRef.current) return;

    const myId = ++lastLoadId.current;
    setLoadingArticles(true);
    console.log(`App [${myId}]: Loading articles...`);

    try {
      const arts = await fetchPublishedArticlesJoined();

      if (!mountedRef.current || myId !== lastLoadId.current) return;

      setArticles(arts);
      setArticlesError(null);
      console.log(`App [${myId}]: Success.`);
    } catch (e: any) {
      if (!mountedRef.current || myId !== lastLoadId.current) return;

      const errStr = String(e?.message || e?.name || "");
      if (errStr.toLowerCase().includes('abort')) {
        console.warn(`App [${myId}]: Interrupted fetch.`);
        return;
      }

      console.error(`App [${myId}]: Error fetching articles:`, e);
      setArticlesError(e?.message || "Erro ao carregar conteúdo. Tente novamente.");
    } finally {
      if (mountedRef.current && myId === lastLoadId.current) {
        setLoadingArticles(false);
      }
    }
  };

  // Sync articles with auth state
  useEffect(() => {
    if (!isAuthLoading) {
      // Small debounce to allow session to stabilize
      const timer = setTimeout(() => {
        if (mountedRef.current) loadArticles();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [sessionUserId, isAuthLoading]);

  // Handlers
  const onSearch = (q: string) => {
    setSearchQuery(q);
    setIsAIProcessing(true);
    setTimeout(() => { if (mountedRef.current) setIsAIProcessing(false); }, 450);
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
      author_id: found.authorId,
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

  // Pagination Logic
  const ITEMS_PER_PAGE = 3;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, searchQuery, sortOption]);

  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredArticles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredArticles, currentPage]);

  // Loading Screen
  if ((isAuthLoading || loadingArticles) && articles.length === 0) {
    return (
      <div className={isDarkMode ? "bg-black text-white min-h-screen" : "bg-[#FDFBF4] text-[#0B1D33] min-h-screen"}>
        <div className={`max-w-md mx-auto min-h-screen ${isDarkMode ? "bg-black" : "bg-[#FDFBF4]"}`}>
          <Header isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(v => !v)} onOpenNotifications={() => setNotificationsOpen(true)} onOpenAuth={() => setAuthOpen(true)} />
          <div className="px-6 py-4">
            <CardSkeleton isDarkMode={isDarkMode} />
            <CardSkeleton isDarkMode={isDarkMode} />
            <CardSkeleton isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>
    );
  }

  // Detail View
  if (selectedArticle) {
    return (
      <>
        <ArticleView
          key={selectedArticle.id}
          article={selectedArticle}
          onBack={() => setSelectedArticle(null)}
          onShare={onShare}
          onAuthRequest={() => setAuthOpen(true)}
          isDarkMode={isDarkMode}
        />
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
              <div className="flex flex-col items-center justify-center p-8 bg-black/10 rounded-[35px] border border-red-500/20 text-center">
                <div className="text-2xl mb-2">🔭</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-red-200 mb-1">A quadra está ocupada</div>
                <div className="text-[11px] font-medium text-gray-500 mb-5 leading-relaxed">{articlesError}</div>
                <button onClick={() => loadArticles()} className="px-8 py-3 bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all">Tentar Carregar</button>
              </div>
            </div>
          )}

          {activeTab === Category.INICIO ? (
            <>
              <FeaturedPost isDarkMode={isDarkMode} onArticleClick={setSelectedArticle} onShare={onShare} />
              <FeaturedReaders isDarkMode={isDarkMode} />
              <FeaturedAuthors isDarkMode={isDarkMode} />

              <div className="mt-8">
                <SectionTitle title="Últimas do Antas" sortOption="RECENTES" isDarkMode={isDarkMode} />
                <div className="px-6 space-y-4">
                  {articles
                    .filter(a => !a.isFeatured)
                    .slice(0, 3)
                    .map(a => (
                      <ArticleCard
                        key={a.id}
                        article={a}
                        onClick={() => setSelectedArticle(a)}
                        onShare={onShare}
                        isDarkMode={isDarkMode}
                        isAdmin={isEditing}
                        onEdit={handleEditFromCard}
                      />
                    ))}
                </div>
              </div>
            </>
          ) : null}

          {activeTab === Category.HISTORIA && (
            <HistoriaPage articles={filteredArticles} isDarkMode={isDarkMode} onArticleClick={setSelectedArticle} onShare={onShare} onEditArticle={handleEditFromCard} />
          )}

          {activeTab !== Category.INICIO && activeTab !== Category.HISTORIA && (
            <>
              <SectionTitle title={String(activeTab)} sortOption={sortOption} onSortChange={setSortOption} isDarkMode={isDarkMode} />
              <div className="px-6 mb-4 flex justify-between items-center group/admin">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Admin Mode ({activeTab})</div>
                <div className="flex gap-2">
                  {/* Open Category Manager */}
                  {isEditing && (
                    <button onClick={() => setCategoryManagerOpen(true)} className="text-gray-500 hover:text-yellow-500" title="Gerenciar Categorias">
                      <List size={14} />
                    </button>
                  )}
                  <EditTrigger type="add" onClick={() => {
                    const dbMap: Record<string, string> = { 'INÍCIO': 'INICIO', 'NOTÍCIAS': 'NOTICIAS', 'HISTÓRIA': 'HISTORIA', 'REGRAS': 'REGRAS', 'PODCAST': 'PODCAST', 'STATUS': 'STATUS' };
                    setEditingArticleDetails({ category: dbMap[String(activeTab)] || String(activeTab) });
                  }} />
                </div>
              </div>

              {/* LIST */}
              <div className="px-6 space-y-8 min-h-[400px]">
                {paginatedArticles.length === 0 ? (
                  <EmptyState isDarkMode={isDarkMode} message={searchQuery ? "Nenhum resultado encontrado." : "Nada por aqui ainda..."} />
                ) : (
                  paginatedArticles.map((a) => (
                    <ArticleCard
                      key={a.id}
                      article={a}
                      onClick={() => setSelectedArticle(a)}
                      onShare={onShare}
                      isDarkMode={isDarkMode}
                      isAdmin={isEditing}
                      onEdit={handleEditFromCard}
                    />
                  ))
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 pb-8 flex items-center justify-between mt-8">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === 1
                      ? 'opacity-30 cursor-not-allowed'
                      : 'active:scale-95 hover:bg-yellow-400 hover:text-black'
                      } ${isDarkMode ? 'bg-white/10 text-white' : 'bg-[#0B1D33]/10 text-[#0B1D33]'}`}
                  >
                    Anterior
                  </button>

                  <span className={`text-[10px] font-black tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    PÁGINA {currentPage} DE {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === totalPages
                      ? 'opacity-30 cursor-not-allowed'
                      : 'active:scale-95 hover:bg-yellow-400 hover:text-black'
                      } ${isDarkMode ? 'bg-white/10 text-white' : 'bg-[#0B1D33]/10 text-[#0B1D33]'}`}
                  >
                    Próxima
                  </button>
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

        {categoryManagerOpen && <CategoryManager isDarkMode={isDarkMode} onClose={() => setCategoryManagerOpen(false)} />}
      </div>
    </div>
  );
}
