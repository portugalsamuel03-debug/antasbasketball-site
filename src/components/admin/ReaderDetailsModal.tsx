import React, { useState } from 'react';
import { upsertFeaturedReader } from '../../cms';
import { FeaturedReaderRow } from '../../types';
import { EditTrigger } from './EditTrigger';
import { useAdmin } from '../../context/AdminContext';
import { BadgeCheck, BookOpen, MessageSquare, Heart } from 'lucide-react';

interface ReaderDetailsModalProps {
    reader: Partial<FeaturedReaderRow>;
    onClose: () => void;
    isDarkMode: boolean;
    onUpdate: () => void;
}

export const ReaderDetailsModal: React.FC<ReaderDetailsModalProps> = ({ reader, onClose, isDarkMode, onUpdate }) => {
    const { isEditing } = useAdmin();
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState<Partial<FeaturedReaderRow>>({ ...reader });
    const [msg, setMsg] = useState<string | null>(null);

    // Auto-enter edit mode if it's a new empty reader
    React.useEffect(() => {
        if (!reader.name && isEditing) {
            setIsEditMode(true);
        }
    }, [reader, isEditing]);

    const handleSave = async () => {
        setMsg(null);
        if (!formData.name) return;

        const { error } = await upsertFeaturedReader(formData);
        if (error) {
            console.error(error);
            setMsg("Erro ao salvar.");
            return;
        }

        setMsg("Salvo com sucesso!");
        onUpdate();
        setTimeout(() => {
            setIsEditMode(false);
            setMsg(null);
            onClose();
        }, 800);
    };

    const inputClass = `w-full bg-transparent border-b px-2 py-1 text-sm focus:outline-none focus:border-yellow-400 transition-colors ${isDarkMode ? 'border-white/20 text-white' : 'border-black/20 text-black'}`;

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative w-full max-w-sm border rounded-[32px] overflow-hidden shadow-xl p-6 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white'}`}>

                {/* Header Actions */}
                <div className="absolute top-4 right-4 flex gap-2">
                    {isEditing && !isEditMode && (
                        <EditTrigger type="edit" size={16} onClick={() => setIsEditMode(true)} />
                    )}
                    <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-gray-500'}`}>
                        ✕
                    </button>
                </div>

                {/* Avatar with Verified Badge */}
                <div className="relative w-24 h-24 mt-2">
                    <img src={formData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`} alt={formData.name} className="w-full h-full rounded-full object-cover border-2 border-yellow-500/20 shadow-xl" />
                    {formData.is_verified && (
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-black rounded-full flex items-center justify-center text-yellow-400 border-2 border-yellow-400 shadow-lg">
                            <BadgeCheck size={18} fill="currentColor" className="text-black" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="w-full text-center space-y-3">
                    {msg && <div className="text-xs text-yellow-500 font-bold">{msg}</div>}

                    {isEditMode ? (
                        <>
                            <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className={`${inputClass} text-center font-black text-lg`} placeholder="Nome do Leitor" />
                            <input value={formData.rank_label || ''} onChange={e => setFormData({ ...formData, rank_label: e.target.value })} className={`${inputClass} text-center text-[10px] font-black uppercase text-yellow-500`} placeholder="Rank (ex: MVP)" />
                            <input value={formData.avatar_url || ''} onChange={e => setFormData({ ...formData, avatar_url: e.target.value })} className={`${inputClass} text-center text-xs`} placeholder="Avatar URL" />

                            <div className="grid grid-cols-3 gap-2 py-2">
                                <div>
                                    <label className="text-[8px] font-bold text-gray-500 block">Lidos</label>
                                    <input type="number" value={formData.posts_read || 0} onChange={e => setFormData({ ...formData, posts_read: parseInt(e.target.value) })} className={`${inputClass} text-center`} />
                                </div>
                                <div>
                                    <label className="text-[8px] font-bold text-gray-500 block">Comentários</label>
                                    <input type="number" value={formData.comments_made || 0} onChange={e => setFormData({ ...formData, comments_made: parseInt(e.target.value) })} className={`${inputClass} text-center`} />
                                </div>
                                <div>
                                    <label className="text-[8px] font-bold text-gray-500 block">Curtidas</label>
                                    <input type="number" value={formData.likes_given || 0} onChange={e => setFormData({ ...formData, likes_given: parseInt(e.target.value) })} className={`${inputClass} text-center`} />
                                </div>
                            </div>

                            <label className="flex items-center justify-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.is_verified || false} onChange={e => setFormData({ ...formData, is_verified: e.target.checked })} className="rounded bg-white/10" />
                                <span className="text-[10px] font-bold uppercase text-gray-500">Usuário Verificado</span>
                            </label>

                            <button onClick={handleSave} className="w-full py-3 mt-4 bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-yellow-400/20 active:scale-95 transition-transform">
                                Salvar Leitor
                            </button>
                        </>
                    ) : (
                        <>
                            <div>
                                <h2 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                    {reader.name}
                                </h2>
                                <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mt-1">
                                    {reader.rank_label}
                                </p>
                            </div>

                            {/* Divider */}
                            <div className={`w-8 h-1 mx-auto rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />

                            <div className="grid grid-cols-3 gap-4 px-2">
                                <div className="flex flex-col items-center">
                                    <BookOpen size={14} className="text-gray-500 mb-1" />
                                    <span className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{reader.posts_read}</span>
                                    <span className="text-[8px] font-bold text-gray-500 uppercase">LIDOS</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <MessageSquare size={14} className="text-gray-500 mb-1" />
                                    <span className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{reader.comments_made}</span>
                                    <span className="text-[8px] font-bold text-gray-500 uppercase">CMS</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Heart size={14} className="text-gray-500 mb-1" />
                                    <span className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>{reader.likes_given}</span>
                                    <span className="text-[8px] font-bold text-gray-500 uppercase">LIKES</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
