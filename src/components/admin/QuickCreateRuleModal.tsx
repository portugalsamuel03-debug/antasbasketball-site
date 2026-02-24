import React from 'react';
import { X, Save } from 'lucide-react';
import { upsertArticle } from '../../cms';
import { useAdmin } from '../../context/AdminContext';

interface QuickCreateRuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    isDarkMode: boolean;
    initialSubcategory?: string;
}

export const QuickCreateRuleModal: React.FC<QuickCreateRuleModalProps> = ({ isOpen, onClose, onSaveSuccess, isDarkMode, initialSubcategory }) => {
    const { userId } = useAdmin();
    const [title, setTitle] = React.useState('');
    const [content, setContent] = React.useState('');
    const [coverUrl, setCoverUrl] = React.useState('');
    const [subcategory, setSubcategory] = React.useState(initialSubcategory || '');
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            setError("Título e conteúdo são obrigatórios.");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const { error: upsertError } = await upsertArticle({
                title,
                content,
                cover_url: coverUrl || null,
                subcategory: subcategory || null,
                category: 'REGRAS',
                author_id: userId,
                published: true,
                reading_minutes: 5
            });

            if (upsertError) throw upsertError;

            onSaveSuccess();
            onClose();
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Erro ao criar regra.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#121212] border border-white/10 text-white' : 'bg-white border border-gray-200 text-[#0B1D33]'}`}>

                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-yellow-500/10">
                    <h3 className="text-sm font-black uppercase tracking-widest text-yellow-500">Nova Regra</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                    {error && (
                        <div className="text-[10px] font-bold bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2 text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Título da Regra *</label>
                        <input
                            className={`w-full text-base font-bold p-3 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-[#0B1D33]'}`}
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ex: Regulamento de Trades"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Subcategoria</label>
                            <select
                                className={`w-full text-xs p-3 rounded-2xl border appearance-none ${isDarkMode ? 'bg-[#1a1a1a] border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-[#0B1D33]'}`}
                                value={subcategory}
                                onChange={e => setSubcategory(e.target.value)}
                                style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                            >
                                <option value="" style={{ background: isDarkMode ? '#1a1a1a' : '#fff' }}>Sem subcategoria</option>
                                <option value="LIGA" style={{ background: isDarkMode ? '#1a1a1a' : '#fff' }}>LIGA</option>
                                <option value="PONTUAÇÃO" style={{ background: isDarkMode ? '#1a1a1a' : '#fff' }}>PONTUAÇÃO</option>
                                <option value="TRADES" style={{ background: isDarkMode ? '#1a1a1a' : '#fff' }}>TRADES</option>
                                <option value="DRAFT" style={{ background: isDarkMode ? '#1a1a1a' : '#fff' }}>DRAFT</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">URL da Imagem</label>
                            <input
                                className={`w-full text-xs p-3 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-[#0B1D33]'}`}
                                value={coverUrl}
                                onChange={e => setCoverUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Conteúdo (Markdown) *</label>
                        <textarea
                            className={`w-full min-h-[250px] text-sm font-mono p-4 rounded-2xl border resize-none ${isDarkMode ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-700'}`}
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="# Regra 1\nEscreva os detalhes aqui..."
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-2 ${saving ? 'opacity-50 cursor-wait bg-gray-500' : 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/20'}`}
                    >
                        {saving ? 'Criando...' : <><Save size={16} /> Salvar Nova Regra</>}
                    </button>
                </div>
            </div>
        </div>
    );
};
