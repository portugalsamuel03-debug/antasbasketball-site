import React, { useEffect, useState } from 'react';
import { Article, Reaction } from '../types';
import { getFeaturedArticle } from '../cms';
import { toUiArticle, DbArticleRow } from '../services/articles';
import { Share2, MessageCircle, Heart } from 'lucide-react';

interface FeaturedPostProps {
    isDarkMode: boolean;
    onArticleClick: (article: Article) => void;
    onShare: (article: Article) => void;
}

export const FeaturedPost: React.FC<FeaturedPostProps> = ({ isDarkMode, onArticleClick, onShare }) => {
    const [article, setArticle] = useState<Article | null>(null);

    useEffect(() => {
        loadFeatured();
    }, []);

    async function loadFeatured() {
        const { data } = await getFeaturedArticle();
        if (data) {
            // Map CMS data to Article type ensuring all fields (like imageUrl) are correct
            // explicit handling for missing imageUrl vs cover_url
            // We need to fetch it joined or use the helper if possible, 
            // but getFeaturedArticle likely returns a joined row similar to what we want.
            // Let's verify if we need to cast it to DbArticleRow first.
            const uiArticle = toUiArticle(data as any as DbArticleRow);
            setArticle(uiArticle);
        }
    }

    if (!article) return null;

    return (
        <div className="px-6 mb-8 mt-4">
            <div
                className={`relative rounded-[32px] overflow-hidden shadow-2xl cursor-pointer group hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(250,204,21,0.2)] transition-all duration-500 ease-out ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}
                onClick={() => onArticleClick(article)}
            >
                {/* Cover Image with Gradient */}
                <div className="relative h-64 w-full overflow-hidden">
                    <img
                        src={article.imageUrl || article.cover_url || "https://images.unsplash.com/photo-1546519638-68e109498ee2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"}
                        alt={article.title}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

                    {/* Badge */}
                    <div className="absolute top-4 left-4 bg-yellow-400 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg group-hover:scale-110 transition-transform origin-left">
                        Destaque
                    </div>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <h2 className="text-2xl font-black uppercase leading-tight mb-2 drop-shadow-md">
                        {article.title}
                    </h2>
                    <p className="text-sm text-gray-200 line-clamp-2 mb-4 font-medium opacity-90">
                        {article.description || article.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-[10px] font-black text-black">
                                {article.author?.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                                {new Date(article.date || article.published_at).toLocaleDateString('pt-BR')}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-[10px]">
                                <Heart size={12} className={article.likes > 0 ? "fill-yellow-400 text-yellow-400" : "text-white"} />
                                {article.likes ?? 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
