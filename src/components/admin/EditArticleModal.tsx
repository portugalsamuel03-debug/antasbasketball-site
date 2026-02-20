import React, { useState, useEffect, useMemo } from 'react';
import { ArticleRow, AuthorRow, listAuthors, upsertArticle, upsertAuthor, getArticleTags, manageArticleTags, listCategories, listSubcategories } from '../../cms';
import { CategoryRow, SubcategoryRow } from '../../types';
import { supabase } from '../../lib/supabase';

interface EditArticleModalProps {
    article: Partial<ArticleRow>;
    onClose: () => void;
    onSaveSuccess: () => void;
    isDarkMode: boolean;
}

const BUCKET = "article-covers";

function slugify(input: string) {
    return input
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function safeExtFromFile(file: File) {
    const name = file.name || "";
    const dot = name.lastIndexOf(".");
    const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
    const clean = ext.replace(/[^a-z0-9]/g, "");
    return clean || "jpg";
}

export const EditArticleModal: React.FC<EditArticleModalProps> = ({ article, onClose, onSaveSuccess, isDarkMode }) => {
    const [editing, setEditing] = useState<Partial<ArticleRow>>({ ...article });
    const [authors, setAuthors] = useState<AuthorRow[]>([]);
    const [msg, setMsg] = useState<string | null>(null);

    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [tagsInput, setTagsInput] = useState("");

    const [availableCategories, setAvailableCategories] = useState<CategoryRow[]>([]);
    const [availableSubcategories, setAvailableSubcategories] = useState<SubcategoryRow[]>([]);

    // Initial data fetch
    useEffect(() => {
        listAuthors().then(({ data }) => {
            if (data) setAuthors(data as AuthorRow[]);
        });
        listCategories().then(({ data }) => {
            if (data) setAvailableCategories(data);
        });

        if (article.id) {
            getArticleTags(article.id).then(tags => setTagsInput(tags.join(", ")));
        } else {
            setTagsInput("");
        }
    }, [article]);

    useEffect(() => {
        if (editing.category && availableCategories.length > 0) {
            // Find category ID by slug/label mapping
            // Try exact match first, then clean match
            const cat = availableCategories.find(c => c.slug === editing.category || c.label === editing.category);
            if (cat) {
                listSubcategories(cat.id).then(({ data }) => {
                    setAvailableSubcategories(data || []);
                });
            } else {
                setAvailableSubcategories([]);
            }
        } else {
            setAvailableSubcategories([]);
        }
    }, [editing.category, availableCategories]);



    async function uploadCover() {
        setMsg(null);
        if (!coverFile) return;

        if (!coverFile.type.startsWith("image/")) {
            setMsg("Arquivo inválido. Envie uma imagem.");
            return;
        }
        const maxMb = 6;
        if (coverFile.size > maxMb * 1024 * 1024) {
            setMsg(`Imagem muito grande. Máximo: ${maxMb}MB.`);
            return;
        }

        setUploadingCover(true);

        try {
            const { data: auth } = await supabase.auth.getUser();
            const uid = auth.user?.id;
            if (!uid) {
                setMsg("Você precisa estar logado para enviar imagem.");
                return;
            }

            const ext = safeExtFromFile(coverFile);
            const slug = slugify(editing.title || "post");
            const stamp = Date.now();
            const path = `${uid}/${slug}-${stamp}.${ext}`;

            const { error: upErr } = await supabase.storage
                .from(BUCKET)
                .upload(path, coverFile, { upsert: true, contentType: coverFile.type });

            if (upErr) throw upErr;

            const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
            const publicUrl = pub?.publicUrl;

            if (!publicUrl) throw new Error("Não consegui gerar publicUrl do Storage.");

            setEditing(prev => ({ ...prev, cover_url: publicUrl }));
            setMsg("Upload concluído ✅");
            setCoverFile(null);
        } catch (e: any) {
            console.error(e);
            setMsg(e?.message ?? "Erro ao enviar imagem.");
        } finally {
            setUploadingCover(false);
        }
    }

    async function handleDelete() {
        if (!editing.id) return;
        if (!confirm('Tem certeza que deseja excluir permanentemente este post?')) return;

        try {
            const { deleteArticle } = await import('../../cms');
            await deleteArticle(editing.id);
            setMsg("Artigo excluído ✅");
            setTimeout(() => {
                onSaveSuccess();
                onClose();
            }, 800);
        } catch (e: any) {
            console.error(e);
            setMsg("Erro ao excluir.");
        }
    }

    async function handleSave() {
        if (!editing.title || !editing.content) {
            setMsg("Preencha ao menos o título e o conteúdo.");
            return;
        }

        setMsg("Salvando...");
        try {
            const payload: Partial<ArticleRow> = {
                ...editing,
                category: editing.category || "NOTICIAS",
                published: editing.published ?? true,
                reading_minutes: editing.reading_minutes ?? 5,
                published_at: editing.published_at ?? new Date().toISOString(),
            };
            if (payload.id === "") delete payload.id;
            payload.slug = payload.slug?.trim() || slugify(payload.title);

            // Ensure author_id is preserved or explicitly nulled if empty string or "unknown"
            if (payload.author_id === "" || payload.author_id === "unknown") payload.author_id = null;

            console.log("EditArticleModal: Saving article payload...", payload);

            // Add a timeout to the upsert call to prevent infinite hang
            const savePromise = upsertArticle(payload);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout ao salvar. Verifique sua internet.")), 15000)
            );

            const { data: savedData, error } = await Promise.race([savePromise, timeoutPromise]) as any;

            if (error || !savedData) {
                console.error("EditArticleModal: Upsert error:", error);
                setMsg(`Erro ao salvar: ${error?.message || 'Verifique sua conexão ou duplicidade de título.'}`);
                return;
            }

            // Save tags
            const tagList = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
            await manageArticleTags(savedData.id, tagList);

            setMsg("Artigo salvo ✅");
            setTimeout(() => {
                onSaveSuccess();
                onClose();
            }, 800);
        } catch (e: any) {
            console.error("EditArticleModal: Critical save error:", e);
            setMsg(e.message || "Erro inesperado ao salvar.");
        }
    }

    const inputClass = `w-full border rounded-2xl px-4 py-3 text-sm ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-black/10 text-black'}`;

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto border rounded-[32px] shadow-xl p-6 space-y-4 ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white'}`}>

                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <h3 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {editing.id ? 'Editar Post' : 'Novo Post'}
                    </h3>
                    <button onClick={onClose} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-gray-500'}`}>
                        Fechar
                    </button>
                </div>

                {msg && (
                    <div className="text-[12px] font-bold bg-yellow-400/10 border border-yellow-400/30 rounded-2xl px-4 py-3 text-yellow-200">
                        {msg}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Título *</label>
                        <input className={inputClass} placeholder="Título do post / episódio" value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Slug</label>
                        <input className={inputClass} placeholder="slug-do-post" value={editing.slug || ''} onChange={e => setEditing({ ...editing, slug: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Categoria</label>
                        <select className={inputClass} value={editing.category || 'NOTICIAS'} onChange={e => setEditing({ ...editing, category: e.target.value })}>
                            {availableCategories.map(c => <option key={c.id} value={c.slug}>{c.label}</option>)}
                            {availableCategories.length === 0 && <option value="NOTICIAS">Carregando...</option>}
                        </select>
                    </div>
                    {editing.category !== 'PODCAST' && (
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Subcategoria</label>
                            <select className={inputClass} value={editing.subcategory || ''} onChange={e => setEditing({ ...editing, subcategory: e.target.value || null })}>
                                <option value="">Sem subcategoria</option>
                                {(editing.category === 'REGRAS' && availableSubcategories.length === 0 ? [
                                    { id: '1', label: 'LIGA' },
                                    { id: '2', label: 'PONTUAÇÃO' },
                                    { id: '3', label: 'TRADES' },
                                    { id: '4', label: 'DRAFT' }
                                ] : availableSubcategories).map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {editing.category === 'PODCAST' ? (
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-yellow-500 uppercase tracking-widest ml-2">Link do Episódio (Spotify / YouTube) *</label>
                        <input
                            className={`${inputClass} border-yellow-500/50 bg-yellow-400/5`}
                            placeholder="https://open.spotify.com/episode/... ou https://youtube.com/watch?v=..."
                            value={editing.video_url || ''}
                            onChange={e => setEditing({ ...editing, video_url: e.target.value })}
                        />
                        <div className="ml-2 text-[10px] text-gray-500">
                            Cole o link completo do episódio. O player aparecerá automaticamente no card.
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Link do Vídeo (Opcional)</label>
                        <input
                            className={inputClass}
                            placeholder="YouTube / Spotify"
                            value={editing.video_url || ''}
                            onChange={e => setEditing({ ...editing, video_url: e.target.value })}
                        />
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Tags</label>
                    <input
                        className={inputClass}
                        placeholder="NBA, Lakers, Notícias"
                        value={tagsInput}
                        onChange={e => setTagsInput(e.target.value)}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">{editing.category === 'PODCAST' ? 'Descrição Curta' : 'Resumo'}</label>
                    <textarea
                        className={`${inputClass} min-h-[60px]`}
                        placeholder="Breve descrição..."
                        value={editing.excerpt || ''}
                        onChange={e => setEditing({ ...editing, excerpt: e.target.value })}
                    />
                </div>

                {/* Cover Upload */}
                <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Imagem de Capa</label>
                    <div className="flex gap-2 items-center mb-3">
                        <input type="file" accept="image/*" className="flex-1 text-[11px] text-gray-400" onChange={e => setCoverFile(e.target.files?.[0] ?? null)} />
                        <button
                            disabled={!coverFile || uploadingCover}
                            onClick={uploadCover}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${coverFile ? 'bg-yellow-400 text-black' : 'bg-white/5 text-gray-500'}`}
                        >
                            {uploadingCover ? 'Enviando...' : 'Fazer Upload'}
                        </button>
                    </div>
                    {editing.cover_url && (
                        <div className="h-32 w-full rounded-2xl overflow-hidden mb-3 border border-white/5">
                            <img src={editing.cover_url} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <input className={inputClass} placeholder="Ou cole a URL da imagem aqui" value={editing.cover_url || ''} onChange={e => setEditing({ ...editing, cover_url: e.target.value })} />
                </div>

                {editing.category !== 'PODCAST' && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Autor</label>
                            <select className={inputClass} value={editing.author_id || ''} onChange={e => setEditing({ ...editing, author_id: e.target.value || null })}>
                                <option value="">Sem autor</option>
                                {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Tempo de Leitura</label>
                            <input
                                type="number"
                                className={inputClass}
                                placeholder="Minutos"
                                value={editing.reading_minutes || 5}
                                onChange={e => setEditing({ ...editing, reading_minutes: parseInt(e.target.value) || 5 })}
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">
                        {editing.category === 'PODCAST' ? 'Notas do Episódio / Detalhes (Opcional)' : 'Conteúdo *'}
                    </label>
                    <textarea
                        className={`${inputClass} min-h-[${editing.category === 'PODCAST' ? '150px' : '400px'}] font-mono text-[13px] leading-relaxed resize-y`}
                        placeholder="# Escreva aqui..."
                        value={editing.content || ''}
                        onChange={e => setEditing({ ...editing, content: e.target.value })}
                    />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    {editing.id ? (
                        <button
                            onClick={handleDelete}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isDarkMode ? 'border-red-500/30 text-red-500 hover:bg-red-500/10' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
                        >
                            Excluir Permanentemente
                        </button>
                    ) : <div />}

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-500">
                            <input type="checkbox" checked={!!editing.published} onChange={e => setEditing({ ...editing, published: e.target.checked })} className="rounded border-gray-400" />
                            Publicado
                        </label>

                        <label className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                            <input type="checkbox" checked={!!editing.is_featured} onChange={e => setEditing({ ...editing, is_featured: e.target.checked })} className="rounded border-yellow-400" />
                            Fixar no Início ⭐
                        </label>
                    </div>

                    <button
                        onClick={handleSave}
                        className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 active:scale-95 transition-transform"
                    >
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};
