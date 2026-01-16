import React, { useState, useMemo, useEffect, useRef } from 'react';

import Header from './components/Header';
import SearchBar from './components/SearchBar';
import FeaturedReaders from './components/FeaturedReaders';
import FeaturedAuthors from './components/FeaturedAuthors';
import SectionTitle from './components/SectionTitle';
import ArticleCard from './components/ArticleCard';
import BottomNav from './components/BottomNav';
import NotificationPopup from './components/NotificationPopup';
import AuthPopup from './components/AuthPopup';
import ArticleView from './components/ArticleView';
import ChampionDetailPopup from './components/ChampionDetailPopup';
import HallOfFameDetailPopup from './components/HallOfFameDetailPopup';
import ShareModal from './components/ShareModal';

import { Category, SortOption, Article, HistoriaSubTab, RegrasSubTab, Champion, HallOfFame as HallOfFameType } from './types';
import { ARTICLES, CHAMPIONS, HALL_OF_FAME, AUTHORS } from './constants';
import { askGeminiAboutBasketball } from '../services/geminiService';

import {
  MessageCircle,
  X,
  ChevronUp,
  Trophy,
  Star,
  BookOpen,
  Tag,
  Bookmark,
  User,
  Repeat,
  UserX,
  Layout,
  FileText,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Category>(Category.INICIO);
  const [historiaSubTab, setHistoriaSubTab] = useState<HistoriaSubTab>('ARTIGOS');
  const [regrasSubTab, setRegrasSubTab] = useState<RegrasSubTab>('ARTIGOS');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('RECENTES');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);
  const [selectedHallMember, setSelectedHallMember] = useState<HallOfFameType | null>(null);
  const [articleToShare, setArticleToShare] = useState<Article | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const subTabsRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSaved = () => {
      setSavedIds(JSON.parse(localStorage.getItem('readLaterArticles') || '[]'));
    };
    updateSaved();
    window.addEventListener('readLaterUpdated', updateSaved);
    return () => window.removeEventListener('readLaterUpdated', updateSaved);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const progress = totalScroll > 0 ? (currentScroll / totalScroll) * 100 : 0;
      setScrollProgress(progress);
      setShowBackToTop(currentScroll > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (selectedArticle || isNotifOpen || isAuthOpen || selectedChampion || selectedHallMember || articleToShare) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedArticle, isNotifOpen, isAuthOpen, selectedChampion, selectedHallMember, articleToShare]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.body.className = newMode ? 'bg-black text-white antialiased' : 'bg-[#FDFBF4] text-[#0B1D33] antialiased';
  };

  const handleSearch = async (query: string) => {
    setIsAIProcessing(true);
    const response = await askGeminiAboutBasketball(query);
    setAiResponse(response);
    setIsAIProcessing(false);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className={`min-h-screen flex flex-col pb-32 max-w-md mx-auto relative transition-all duration-500 ${isDarkMode ? 'bg-black text-white' : 'bg-[#FDFBF4] text-[#0B1D33]'}`}>
      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onOpenNotifications={() => setIsNotifOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <SearchBar isDarkMode={isDarkMode} onSearch={handleSearch} isAIProcessing={isAIProcessing} />

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />

      <NotificationPopup isDarkMode={isDarkMode} isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <AuthPopup isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export default App;
