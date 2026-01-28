import React, { useState } from 'react';
import { AuthorRow, upsertAuthor } from '../../cms';
import { supabase } from '../../lib/supabase';
import { EditTrigger } from './EditTrigger';
import { useAdmin } from '../../context/AdminContext';

interface AuthorDetailsModalProps {
    author: AuthorRow;
    onClose: () => void;
    isDarkMode: boolean;
    onUpdate: () => void;
}

export const AuthorDetailsModal: React.FC<AuthorDetailsModalProps> = ({ author, onClose, isDarkMode, onUpdate }) => {
    const { isEditing } = useAdmin();
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState<AuthorRow>({ ...author });
    const [msg, setMsg] = useState<string | null>(null);

    const handleSave = async () => {
        setMsg(null);
        if (!formData.name) return;

        const payload = { ...formData };
        if (payload.id === "") delete (payload as any).id;

        const { error } = await upsertAuthor(payload);
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
        }, 800);
    };

    const inputClass = `w-full bg-transparent border-b px-2 py-1 text-sm focus:outline-none focus:border-yellow-400 transition-colors ${isDarkMode ? 'border-white/20 text-white' : 'border-black/20 text-black'}`;

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative w-full max-w-sm border rounded-[32px] shadow-xl p-6 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white'}`}>

                {/* Header Actions */}
                <div className="absolute top-4 right-4 flex gap-2">
                    {isEditing && !isEditMode && (
                        <EditTrigger type="edit" size={16} onClick={() => setIsEditMode(true)} />
                    )}
                    <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-gray-500'}`}>
                        ✕
                    </button>
                </div>

                {/* Avatar */}
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-yellow-400 shadow-xl mt-2">
                    <img src={formData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.slug}`} alt={formData.name} className="w-full h-full object-cover" />
                </div>

                {/* Content */}
                <div className="w-full text-center space-y-3">
                    {msg && <div className="text-xs text-yellow-500 font-bold">{msg}</div>}

                    {isEditMode ? (
                        <>
                            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={`${inputClass} text-center font-black text-lg`} placeholder="Nome" />
                            <input value={formData.role_label || ''} onChange={e => setFormData({ ...formData, role_label: e.target.value })} className={`${inputClass} text-center text-xs uppercase`} placeholder="Cargo / Função" />
                            <input value={formData.avatar_url || ''} onChange={e => setFormData({ ...formData, avatar_url: e.target.value })} className={`${inputClass} text-center text-xs`} placeholder="Avatar URL" />

                            {/* Bio field */}
                            <div className="mt-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Bio (máx. 500 caracteres)</label>
                                <textarea
                                    value={formData.bio || ''}
                                    onChange={e => {
                                        const text = e.target.value.slice(0, 500);
                                        setFormData({ ...formData, bio: text });
                                    }}
                                    className={`w-full px-3 py-2 rounded-xl text-xs leading-relaxed resize-none border-2 border-yellow-500/50 ${isDarkMode ? 'bg-white/5 text-white' : 'bg-black/5 text-black'}`}
                                    placeholder="Escreva a bio aqui..."
                                    rows={4}
                                    maxLength={500}
                                />
                                <div className="text-[9px] text-gray-500 text-right mt-1">
                                    {(formData.bio || '').length}/500
                                </div>
                            </div>

                            <button onClick={handleSave} className="w-full py-3 mt-4 bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-yellow-400/20 active:scale-95 transition-transform">
                                Salvar Alterações
                            </button>
                        </>
                    ) : (
                        <>
                            <div>
                                <h2 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0B1D33]'}`}>
                                    {author.name}
                                </h2>
                                <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mt-1">
                                    {author.role_label || 'MEMBRO DA EQUIPE'}
                                </p>
                            </div>

                            {/* Divider */}
                            <div className={`w-8 h-1 mx-auto rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />

                            {/* Bio */}
                            <p className={`text-xs leading-relaxed px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {author.bio || 'Membro oficial da equipe Antas Basketball. Contribuindo com conteúdo de qualidade e paixão pelo basquete since 2017.'}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
