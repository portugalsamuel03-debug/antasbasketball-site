
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
import { askGeminiAboutBasketball } from './services/geminiService';
import { MessageCircle, X, History as HistoryIcon, ChevronUp, Trophy, Star, BookOpen, Tag, Bookmark, User, Repeat, UserX, Layout, FileText, ChevronRight, ChevronLeft } from 'lucide-react';

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

  // Refs para controle de scroll horizontal
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

  const selectedAuthorName = useMemo(() => {
    if (!selectedAuthorId) return null;
    return AUTHORS.find(a => a.id === selectedAuthorId)?.name || 'Autor';
  }, [selectedAuthorId]);

  const availableTags = useMemo(() => {
    let baseArticles = activeTab === Category.INICIO 
      ? ARTICLES 
      : ARTICLES.filter(a => a.category === activeTab);
    
    if (selectedAuthorId) {
      baseArticles = baseArticles.filter(a => a.authorId === selectedAuthorId);
    }
    
    const tagsSet = new Set<string>();
    baseArticles.forEach(a => a.tags.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [activeTab, selectedAuthorId]);

  const filteredArticles = useMemo(() => {
    let result = ARTICLES.filter(article => {
      if (activeTab === Category.INICIO) return true;
      return article.category === activeTab;
    });

    if (selectedAuthorId) {
      result = result.filter(a => a.authorId === selectedAuthorId);
    }

    if (selectedTag) {
      result = result.filter(a => a.tags.includes(selectedTag));
    }

    if (sortOption === 'SALVOS') {
      result = result.filter(a => savedIds.includes(a.id));
    }

    switch (sortOption) {
      case 'CURTIDOS':
        result = [...result].sort((a, b) => b.likes - a.likes);
        break;
      case 'COMENTADOS':
        result = [...result].sort((a, b) => b.commentsCount - a.commentsCount);
        break;
      case 'ANTIGOS':
        result = [...result].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'RECENTES':
      default:
        if (sortOption !== 'SALVOS') {
          result = [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        break;
    }

    return result;
  }, [activeTab, sortOption, selectedTag, selectedAuthorId, savedIds]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCardTagClick = (tag: string) => {
    setSelectedTag(tag === selectedTag ? null : tag);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthorClick = (authorId: string) => {
    setSelectedAuthorId(authorId === selectedAuthorId ? null : authorId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mainNavChange = (tab: Category) => {
    setActiveTab(tab);
    setHistoriaSubTab('ARTIGOS');
    setRegrasSubTab('ARTIGOS');
    setSelectedTag(null);
    setSelectedAuthorId(null);
  };

  const scrollHorizontal = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const isHistory = activeTab === Category.HISTORIA;
  const isRegras = activeTab === Category.REGRAS;

  return (
    <div className={`min-h-screen flex flex-col pb-32 max-w-md mx-auto relative transition-all duration-500 ${isDarkMode ? 'bg-black text-white' : 'bg-[#FDFBF4] text-[#0B1D33]'}`}>
      <div className="fixed top-0 left-0 right-0 h-1 z-[100] flex justify-center max-w-md mx-auto">
        <div className={`h-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(250,203,41,0.3)] ${isDarkMode ? 'bg-yellow-400' : 'bg-[#0B1D33]'}`} style={{ width: `${scrollProgress}%` }}></div>
      </div>

      <Header 
        isDarkMode={isDarkMode} 
        onToggleTheme={toggleTheme} 
        onOpenNotifications={() => setIsNotifOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />
      
      <main className="flex-1 animate-in fade-in duration-1000">
        <SearchBar isDarkMode={isDarkMode} onSearch={handleSearch} isAIProcessing={isAIProcessing} />

        {aiResponse && (
          <div className="px-6 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className={`border rounded-[28px] p-6 relative shadow-2xl backdrop-blur-md ${isDarkMode ? 'bg-yellow-400/10 border-yellow-400/30' : 'bg-[#0B1D33]/5 border-[#0B1D33]/10'}`}>
              <button onClick={() => setAiResponse(null)} className="absolute top-4 right-4 p-1.5 rounded-full transition-colors text-gray-500 hover:text-white"><X size={16} /></button>
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#0B1D33] text-white'}`}><MessageCircle size={16} strokeWidth={3} /></div>
                <span className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'}`}>Antas AI</span>
              </div>
              <p className={`text-sm italic font-medium ${isDarkMode ? 'text-yellow-50/90' : 'text-[#0B1D33]/80'}`}>"{aiResponse}"</p>
            </div>
          </div>
        )}

        {activeTab === Category.INICIO && (
          <div className="animate-in slide-in-from-left duration-700">
            <FeaturedReaders isDarkMode={isDarkMode} />
            <FeaturedAuthors isDarkMode={isDarkMode} onAuthorClick={handleAuthorClick} selectedAuthorId={selectedAuthorId} />
          </div>
        )}

        {(isHistory || isRegras) && (
          <div className="relative group/nav px-6 mb-4">
            <div 
              ref={subTabsRef}
              className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-horizontal scroll-smooth"
            >
              {isHistory ? (
                <>
                  <button onClick={() => setHistoriaSubTab('ARTIGOS')} className={`flex-shrink-0 px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${historiaSubTab === 'ARTIGOS' ? (isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#0B1D33] text-white') : (isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                    <BookOpen size={14} /> Artigos
                  </button>
                  <button onClick={() => setHistoriaSubTab('CAMPEOES')} className={`flex-shrink-0 px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${historiaSubTab === 'CAMPEOES' ? (isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#0B1D33] text-white') : (isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                    <Trophy size={14} /> Campeões
                  </button>
                  <button onClick={() => setHistoriaSubTab('HALL_OF_FAME')} className={`flex-shrink-0 px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${historiaSubTab === 'HALL_OF_FAME' ? (isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#0B1D33] text-white') : (isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                    <Star size={14} /> Hall of Fame
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setRegrasSubTab('ARTIGOS')} className={`flex-shrink-0 px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${regrasSubTab === 'ARTIGOS' ? (isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#0B1D33] text-white') : (isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                    <BookOpen size={14} /> Artigos
                  </button>
                  <button onClick={() => setRegrasSubTab('TRADES')} className={`flex-shrink-0 px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${regrasSubTab === 'TRADES' ? (isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#0B1D33] text-white') : (isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                    <Repeat size={14} /> Trades
                  </button>
                  <button onClick={() => setRegrasSubTab('INATIVIDADE')} className={`flex-shrink-0 px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${regrasSubTab === 'INATIVIDADE' ? (isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#0B1D33] text-white') : (isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                    <UserX size={14} /> Inatividade
                  </button>
                  <button onClick={() => setRegrasSubTab('DIVISOES')} className={`flex-shrink-0 px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${regrasSubTab === 'DIVISOES' ? (isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#0B1D33] text-white') : (isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                    <Layout size={14} /> Divisões
                  </button>
                  <button onClick={() => setRegrasSubTab('DRAFT')} className={`flex-shrink-0 px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${regrasSubTab === 'DRAFT' ? (isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#0B1D33] text-white') : (isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                    <FileText size={14} /> Draft
                  </button>
                </>
              )}
            </div>
            <button 
              onClick={() => scrollHorizontal(subTabsRef, 'right')} 
              className={`absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-yellow-400 text-black shadow-lg opacity-0 group-hover/nav:opacity-100 transition-opacity z-10`}
            >
              <ChevronRight size={16} strokeWidth={3} />
            </button>
            <button 
              onClick={() => scrollHorizontal(subTabsRef, 'left')} 
              className={`absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-yellow-400 text-black shadow-lg opacity-0 group-hover/nav:opacity-100 transition-opacity z-10`}
            >
              <ChevronLeft size={16} strokeWidth={3} />
            </button>
          </div>
        )}

        {((isHistory && historiaSubTab === 'ARTIGOS') || (isRegras && regrasSubTab === 'ARTIGOS') || (!isHistory && !isRegras)) && (availableTags.length > 0 || selectedAuthorId) && (
          <div className="relative group/tags px-6 mb-2 sticky top-[100px] z-40 pt-2">
            <div 
              ref={tagsRef}
              className={`flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-horizontal scroll-smooth transition-colors ${isDarkMode ? 'bg-black' : 'bg-[#FDFBF4]'}`}
            >
              <button 
                onClick={() => { setSelectedTag(null); setSelectedAuthorId(null); }}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${(!selectedTag && !selectedAuthorId) ? (isDarkMode ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/20' : 'bg-[#0B1D33] text-white border-[#0B1D33] shadow-lg shadow-[#0B1D33]/20') : (isDarkMode ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500')}`}
              >
                Todos
              </button>
              
              {selectedAuthorId && (
                <button onClick={() => setSelectedAuthorId(null)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase border flex items-center gap-1.5 ${isDarkMode ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-[#0B1D33] text-white border-[#0B1D33]'}`}>
                  <User size={10} /> {selectedAuthorName} <X size={10} strokeWidth={3} />
                </button>
              )}

              {availableTags.map(tag => (
                <button key={tag} onClick={() => setSelectedTag(tag === selectedTag ? null : tag)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase border flex items-center gap-1.5 transition-all ${selectedTag === tag ? (isDarkMode ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/20' : 'bg-[#0B1D33] text-white border-[#0B1D33] shadow-lg shadow-[#0B1D33]/20') : (isDarkMode ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500')}`}>
                  <Tag size={10} /> {tag}
                </button>
              ))}
            </div>
            <button 
              onClick={() => scrollHorizontal(tagsRef, 'right')} 
              className={`absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center bg-yellow-400 text-black shadow-lg opacity-0 group-hover/tags:opacity-100 transition-opacity z-50`}
            >
              <ChevronRight size={14} strokeWidth={3} />
            </button>
            <button 
              onClick={() => scrollHorizontal(tagsRef, 'left')} 
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center bg-yellow-400 text-black shadow-lg opacity-0 group-hover/tags:opacity-100 transition-opacity z-50`}
            >
              <ChevronLeft size={14} strokeWidth={3} />
            </button>
          </div>
        )}

        {isHistory && historiaSubTab === 'CAMPEOES' ? (
          <div className="px-6 space-y-4 animate-in slide-in-from-right duration-500">
            <div className="flex items-center gap-2 mb-6 mt-4">
              <div className={`w-1.5 h-6 rounded-full ${isDarkMode ? 'bg-yellow-400' : 'bg-[#0B1D33]'}`}></div>
              <h2 className="text-lg font-black uppercase tracking-widest">Galeria de Campeões</h2>
            </div>
            {CHAMPIONS.map((champ, idx) => (
              <div key={idx} onClick={() => setSelectedChampion(champ)} className={`p-6 rounded-[32px] border flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer ${isDarkMode ? 'bg-[#121212] border-white/5' : 'bg-white border-[#0B1D33]/5 shadow-sm'}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-2xl font-black italic ${isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'}`}>{champ.year}</span>
                    <Trophy size={16} className="text-yellow-500" />
                  </div>
                  <h3 className="text-md font-black uppercase">{champ.team}</h3>
                </div>
                <Trophy size={24} className="text-gray-700" />
              </div>
            ))}
          </div>
        ) : isHistory && historiaSubTab === 'HALL_OF_FAME' ? (
          <div className="px-6 space-y-4 animate-in slide-in-from-right duration-500">
            <div className="flex items-center gap-2 mb-6 mt-4">
              <div className={`w-1.5 h-6 rounded-full ${isDarkMode ? 'bg-yellow-400' : 'bg-[#0B1D33]'}`}></div>
              <h2 className="text-lg font-black uppercase tracking-widest">Lendas Imortais</h2>
            </div>
            {HALL_OF_FAME.map((hall, idx) => (
              <div key={idx} onClick={() => setSelectedHallMember(hall)} className={`p-6 rounded-[32px] border flex gap-5 transition-all active:scale-[0.98] cursor-pointer ${isDarkMode ? 'bg-[#121212] border-white/5' : 'bg-white border-[#0B1D33]/5 shadow-sm'}`}>
                <div className="relative flex-shrink-0">
                  <div className={`w-20 h-20 rounded-[25px] overflow-hidden border-2 p-1 ${isDarkMode ? 'border-yellow-400/30' : 'border-[#0B1D33]/30'}`}>
                    <img src={hall.imageUrl} alt={hall.name} className="w-full h-full object-cover rounded-[18px]" />
                  </div>
                </div>
                <div className="flex-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-yellow-400' : 'text-[#0B1D33]'}`}>{hall.year}</span>
                  <h3 className="text-md font-black uppercase">{hall.name}</h3>
                  <p className="text-[11px] font-bold text-gray-500 uppercase">{hall.role}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {(!isRegras || regrasSubTab === 'ARTIGOS') && <SectionTitle title={activeTab === Category.INICIO ? "DESTAQUES" : activeTab} sortOption={sortOption} onSortChange={setSortOption} isDarkMode={isDarkMode} />}
            {isRegras && regrasSubTab !== 'ARTIGOS' && (
              <div className="px-6 py-8 animate-in fade-in duration-700">
                <div className={`p-8 rounded-[40px] border shadow-2xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-[#F0F2F5] border-[#0B1D33]/5'}`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#0B1D33] text-white'}`}>
                      {regrasSubTab === 'TRADES' && <Repeat size={24} strokeWidth={3} />}
                      {regrasSubTab === 'INATIVIDADE' && <UserX size={24} strokeWidth={3} />}
                      {regrasSubTab === 'DIVISOES' && <Layout size={24} strokeWidth={3} />}
                      {regrasSubTab === 'DRAFT' && <FileText size={24} strokeWidth={3} />}
                    </div>
                    <h3 className="text-xl font-black uppercase italic tracking-widest">{regrasSubTab}</h3>
                  </div>
                  <p className={`text-[15px] leading-relaxed font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {regrasSubTab === 'TRADES' && "As trocas entre equipes devem ser aprovadas pela comissão técnica. O prazo limite para trades é sempre 48h antes dos playoffs para garantir a integridade competitiva."}
                    {regrasSubTab === 'INATIVIDADE' && "Jogadores com mais de 3 faltas injustificadas perdem a prioridade de escalação no próximo 'racha' oficial. A pontualidade é um fundamento básico."}
                    {regrasSubTab === 'DIVISOES' && "As equipes são divididas por nível técnico (Alpha e Beta) para garantir o equilíbrio. A subida ou descida de divisão é baseada em performance estatística e física."}
                    {regrasSubTab === 'DRAFT' && "Nosso draft ocorre anualmente em Janeiro. Novos prospectos são avaliados em combine físico, arremesso e QI de jogo antes da seleção oficial das equipes."}
                  </p>
                </div>
              </div>
            )}
            {(!isRegras || regrasSubTab === 'ARTIGOS') && (
              <div className="space-y-4">
                {filteredArticles.length > 0 ? filteredArticles.map((article, idx) => (
                  <div key={article.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                    <ArticleCard article={article} onClick={() => setSelectedArticle(article)} onTagClick={handleCardTagClick} onShare={setArticleToShare} isDarkMode={isDarkMode} />
                  </div>
                )) : (
                  <div className="px-6 py-20 text-center">
                    <Bookmark size={32} className="mx-auto text-gray-400 mb-6" />
                    <h3 className="text-lg font-black uppercase mb-2">Nada por aqui</h3>
                    <button onClick={() => { setSelectedTag(null); setSelectedAuthorId(null); setSortOption('RECENTES'); }} className={`mt-8 px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#0B1D33] text-white'}`}>Limpar tudo</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {showBackToTop && (
        <button onClick={scrollToTop} className={`fixed bottom-36 right-6 p-4 rounded-full shadow-2xl z-[70] active:scale-90 ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#0B1D33] text-white'}`}>
          <ChevronUp size={24} strokeWidth={3.5} />
        </button>
      )}

      <BottomNav activeTab={activeTab} onTabChange={mainNavChange} isDarkMode={isDarkMode} />
      <NotificationPopup isDarkMode={isDarkMode} isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <AuthPopup isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ChampionDetailPopup champion={selectedChampion} onClose={() => setSelectedChampion(null)} isDarkMode={isDarkMode} />
      <HallOfFameDetailPopup member={selectedHallMember} onClose={() => setSelectedHallMember(null)} isDarkMode={isDarkMode} />
      <ShareModal isOpen={!!articleToShare} onClose={() => setArticleToShare(null)} article={articleToShare} isDarkMode={isDarkMode} />
      {selectedArticle && <ArticleView isDarkMode={isDarkMode} article={selectedArticle} onBack={() => setSelectedArticle(null)} onShare={setArticleToShare} />}
    </div>
  );
};

export default App;
