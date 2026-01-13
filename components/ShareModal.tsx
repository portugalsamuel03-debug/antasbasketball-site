
import React, { useState, useEffect } from 'react';
import { X, Copy, Share, Send, MessageCircle, Twitter, Linkedin, Check, Link2 } from 'lucide-react';
import { Article } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article | null;
  isDarkMode: boolean;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, article, isDarkMode }) => {
  const [comment, setComment] = useState('');
  const [copied, setCopied] = useState(false);
  
  if (!isOpen || !article) return null;

  const shareUrl = window.location.origin === 'null' ? 'https://antasbasketball.blog' : window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const fullText = comment ? `${comment}\n\n${article.title}` : article.title;
  const encodedText = encodeURIComponent(fullText);

  const platforms = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-[#25D366]',
      action: () => window.open(`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`, '_blank')
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'bg-black',
      action: () => window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank')
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-[#0077b5]',
      action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank')
    }
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        // Validate URL before sharing to prevent "Invalid URL" error
        const urlToShare = shareUrl.startsWith('http') ? shareUrl : 'https://antasbasketball.blog';
        await navigator.share({
          title: article.title,
          text: fullText,
          url: urlToShare,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed', err);
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center px-4 pb-8 sm:items-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-sm border rounded-[40px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500 ${
        isDarkMode ? 'bg-[#0f0f0f] border-white/10' : 'bg-white border-[#0B1D33]/10'
      }`}>
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div className="flex flex-col">
            <h3 className={`text-[10px] font-black tracking-[0.2em] uppercase ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Compartilhar
            </h3>
            <span className={`text-lg font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
              ESPALHE A NOTÍCIA
            </span>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${
            isDarkMode ? 'text-gray-400 hover:bg-white/5' : 'text-gray-400 hover:bg-black/5'
          }`}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Article Preview */}
          <div className={`flex gap-3 p-3 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
            <img src={article.imageUrl} className="w-12 h-12 rounded-lg object-cover" alt="" />
            <div className="flex-1 min-w-0">
              <p className={`text-[11px] font-black uppercase truncate ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                {article.title}
              </p>
              <p className="text-[10px] text-gray-500 font-bold uppercase truncate">{article.author}</p>
            </div>
          </div>

          {/* Custom Comment */}
          <div className="space-y-2">
            <label className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Adicionar comentário (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="O que você achou dessa jogada?"
              className={`w-full p-4 rounded-2xl text-sm border outline-none transition-all h-24 resize-none ${
                isDarkMode 
                  ? 'bg-black border-white/10 text-white focus:border-yellow-400/50' 
                  : 'bg-white border-gray-200 text-[#0B1D33] focus:border-[#0B1D33]/30'
              }`}
            />
          </div>

          {/* Platforms */}
          <div className="grid grid-cols-3 gap-3">
            {platforms.map((p) => (
              <button 
                key={p.name}
                onClick={p.action}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform active:scale-90 shadow-lg ${p.color}`}>
                  <p.icon size={20} className="text-white" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{p.name}</span>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleCopyLink}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                copied 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-[#0B1D33] hover:bg-gray-100'
              }`}
            >
              {copied ? <Check size={14} /> : <Link2 size={14} />}
              {copied ? 'COPIADO' : 'COPIAR LINK'}
            </button>
            <button 
              onClick={handleNativeShare}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isDarkMode ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'bg-[#0B1D33] text-white shadow-lg shadow-[#0B1D33]/20'
              }`}
            >
              <Share size={14} />
              COMPARTILHAR
            </button>
          </div>
        </div>

        <div className={`p-6 border-t ${isDarkMode ? 'border-white/5' : 'border-[#0B1D33]/5'}`}>
          <p className="text-[9px] text-center text-gray-500 font-bold uppercase tracking-widest">
            MOSTRA O TEU TALENTO FORA DAS QUADRAS.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
