// src/App.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import ProfilePopup from "./components/ProfilePopup";
import { EditArticleModal } from "./components/admin/EditArticleModal";
import { ArticleRow } from "./cms";
import { useAdmin } from "./context/AdminContext";
import { EditTrigger } from "./components/admin/EditTrigger";

// Home sections (opcionais)
import FeaturedReaders from "./components/FeaturedReaders";
import FeaturedAuthors from "./components/FeaturedAuthors";
import HistoriaPage from "./components/HistoriaPage";

// Data
import { fetchPublishedArticlesJoined } from "./services/articles";
import { Article, Category, SortOption } from "./types";

type Role = "admin" | "reader";
type RoleState = Role | "unknown";

function safeSearchParam(name: string) {
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

export default function App() {
  // ===== Auth / Role =====
  const [authReady, setAuthReady] = useState(false);

  const { isAdmin, isEditing, role, userId: sessionUserId, isLoading: isAuthLoading } = useAdmin();
  const [adminError, setAdminError] = useState<string | null>(null);
  const [roleChecking, setRoleChecking] = useState(false);

  // Perfil
  const [profileOpen, setProfileOpen] = useState(false);

  // ===== UI =====
  const [isDarkMode, setIsDarkMode] = useState(true);

  // ✅ COMEÇA NO HOME (INICIO)
  const [activeTab, setActiveTab] = useState<Category>(Category.INICIO);

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

  // ✅ Feed Editing
  const [editingArticleDetails, setEditingArticleDetails] = useState<Partial<ArticleRow> | null>(null);

  // /?admin=1 abre painel
  const isAdminRoute = useMemo(() => safeSearchParam("admin") === "1", []);

  // evita corrida / setState depois de unmount
  const mountedRef = useRef(true);


  // ===== Boot session =====
  useEffect(() => {
    mountedRef.current = true;
    setAuthReady(true);
    return () => {
      mountedRef.current = false;
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
    setIsAIProcessing(true);
    setTimeout(() => setIsAIProcessing(false), 450);
  };

  // ===== Share =====
  const onShare = (a: Article) => {
    setShareArticle(a);
    setShareOpen(true);
  };

  // ✅ abrir artigo pelo id (usado no ProfilePopup)
  const openArticleById = (articleId: string) => {
    const found = articles.find((a) => a.id === articleId) ?? null;
    if (found) {
      setProfileOpen(false);
      setSelectedArticle(found);
      return;
    }
    alert("Não encontrei esse post na lista atual. Atualize e tente novamente.");
  };

  // ===== Sorting + filtering =====
  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = articles;

    if (activeTab && activeTab !== Category.INICIO) {
      list = list.filter((a) => a.category === activeTab);
    }

    if (q) {
      list = list.filter((a) => {
        const hay = [a.title, a.description, a.content, a.author, ...(a.tags ?? [])]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

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
  if (!authReady || isAuthLoading) {
    return (
      <div className={isDarkMode ? "bg-black text-white min-h-screen" : "bg-[#FDFBF4] text-[#0B1D33] min-h-screen"}>
        <div className="max-w-md mx-auto px-6 py-10">
          <div className="text-xs font-black uppercase tracking-widest text-yellow-400">Antas Basketball</div>
          <div className="mt-3 text-sm text-gray-400">Carregando…</div>
        </div>
      </div>
    );
  }

  // ===== Admin route removed per user request =====
  // Inline editing is now the primary way to manage content.


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

        <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} article={shareArticle} isDarkMode={isDarkMode} />
        <AuthPopup isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        <NotificationPopup isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} isDarkMode={isDarkMode} />

        {sessionUserId && (
          <ProfilePopup
            isOpen={profileOpen}
            onClose={() => setProfileOpen(false)}
            userId={sessionUserId}
            onOpenArticle={(id) => openArticleById(id)}
          />
        )}
      </>
    );
  }

  const handleUserClick = () => {
    if (sessionUserId) setProfileOpen(true);
    else setAuthOpen(true);
  };

  const handleEditFromCard = (id: string) => {
    const found = articles.find(a => a.id === id);
    if (!found) return;

    setEditingArticleDetails({
      id: found.id,
      title: found.title,
      category: found.category,
      content: found.content,
      cover_url: found.imageUrl,
      excerpt: found.description,
      published: true,
      reading_minutes: parseInt(found.readTime) || 5, // Parsing "5 MIN"
    });
  };

  // ===== App shell =====
  return (
    <div className={isDarkMode ? "bg-black text-white min-h-screen" : "bg-[#FDFBF4] text-[#0B1D33] min-h-screen"}>
      <div className={`max-w-md mx-auto min-h-screen ${isDarkMode ? "bg-black" : "bg-[#FDFBF4]"}`}>
        <Header
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode((v) => !v)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenAuth={handleUserClick}
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

          {activeTab === Category.HISTORIA ? (
            <HistoriaPage
              articles={filteredArticles}
              isDarkMode={isDarkMode}
              onArticleClick={setSelectedArticle}
              onShare={onShare}
              onEditArticle={handleEditFromCard}
            />
          ) : activeTab !== Category.INICIO && (
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
                <div className="px-6 space-y-4">
                  {isEditing && (
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ferramentas de Post</div>
                      <EditTrigger type="add" onClick={() => setEditingArticleDetails({})} />
                    </div>
                  )}
                  {filteredArticles.map((a) => (
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
              )}
            </>
          )}
        </main>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />

        <AuthPopup isOpen={authOpen} onClose={() => setAuthOpen(false)} />

        {sessionUserId && (
          <ProfilePopup
            isOpen={profileOpen}
            onClose={() => setProfileOpen(false)}
            userId={sessionUserId}
            onOpenArticle={(id) => openArticleById(id)}
          />
        )}

        <NotificationPopup isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} isDarkMode={isDarkMode} />
        <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} article={shareArticle} isDarkMode={isDarkMode} />

        {editingArticleDetails && (
          <EditArticleModal
            article={editingArticleDetails}
            isDarkMode={isDarkMode}
            onClose={() => setEditingArticleDetails(null)}
            onSaveSuccess={() => {
              window.location.reload();
            }}
          />
        )}
      </div>
    </div>
  );
}
